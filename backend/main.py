from __future__ import annotations

import hashlib
import hmac
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional

import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, field_validator
import psycopg2.pool
from contextlib import contextmanager
import asyncio

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("foodconnect-api")

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-env-with-at-least-32-characters")
JWT_ALG = "HS256"
JWT_EXP_HOURS = int(os.getenv("JWT_EXP_HOURS", "24"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/foodconnect")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]


ALLOWED_TAGS = {"biryani", "rice", "noodles", "veg", "non-veg", "bakery", "bulk", "hot", "meal", "sweets", "drinks"}
ALLOWED_STATUSES = {"pending", "accepted", "delivered"}
DB_TABLE_WHITELIST = {
    "users",
    "hotel",
    "volunteer",
    "donations",
    "donation_tags",
    "claims_record",
    "verification",
    "location_tracking",
}
def normalize_dsn(dsn: str) -> str:
    return dsn.replace("postgresql+psycopg2://", "postgresql://")

# Thread-safe connection pool
_POOL = psycopg2.pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=20,
    dsn=normalize_dsn(DATABASE_URL)
)

# SSE Subscribers
_SUBSCRIBERS: List[asyncio.Queue] = []

async def broadcast_event(event_type: str, data: Any):
    """Broadcasting events to all connected clients."""
    payload = {"type": event_type, "data": data, "timestamp": datetime.utcnow().isoformat()}
    for queue in _SUBSCRIBERS[:]:
        try:
            await queue.put(payload)
        except Exception:
            if queue in _SUBSCRIBERS:
                _SUBSCRIBERS.remove(queue)



@contextmanager
def get_db_conn():
    """Proper context manager for database connections."""
    conn = get_conn()
    try:
        yield conn
    finally:
        return_conn(conn)


def get_conn():
    """Get a database connection from the pool with proper context management."""
    conn = _POOL.getconn()
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    conn.cursor_factory = RealDictCursor
    return conn


def return_conn(conn):
    """Return a connection to the pool."""
    try:
        if conn:
            conn.close()
    except Exception:
        pass
    finally:
        try:
            _POOL.putconn(conn)
        except Exception:
            pass


def hash_password(password: str, salt: Optional[str] = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 200_000)
    return f"{salt}${digest.hex()}"


def verify_password(plain: str, stored: str) -> bool:
    try:
        salt, _ = stored.split("$", 1)
        candidate = hash_password(plain, salt)
        return hmac.compare_digest(candidate, stored)
    except Exception:
        return False


def issue_token(payload: Dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    token_payload = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXP_HOURS)).timestamp()),
    }
    return jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALG)


def parse_auth_token(authorization: Optional[str]) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.InvalidTokenError as ex:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from ex


class ProfileData(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    hotelName: Optional[str] = None
    managerNumber: Optional[str] = None
    licenseNumber: Optional[str] = None
    vehicle: Optional[str] = None
    age: Optional[int] = None
    ngoName: Optional[str] = None
    ngoNumber: Optional[str] = None
    contactPerson: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow any extra fields without validation error


class RegisterPayload(BaseModel):
    role: Literal["hotel", "volunteer"]
    password: str
    data: ProfileData
    
    class Config:
        extra = "allow"  # Allow extra fields in registration


class LoginPayload(BaseModel):
    role: Literal["hotel", "volunteer", "admin"]
    identifier: str = Field(min_length=1)  # At least 1 character
    password: str = Field(min_length=1)  # At least 1 character


class DonationCreatePayload(BaseModel):
    hotelId: Optional[int] = None
    totalWt: Optional[float] = None
    expTime: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    weight: Optional[float] = None
    expiryDate: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    isVeg: Optional[bool] = None
    prepTime: Optional[str] = None
    quantityUnit: Optional[str] = "kg"

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, values: List[str]) -> List[str]:
        clean = []
        for tag in values:
            t = tag.strip().lower()
            if t and t in ALLOWED_TAGS and t not in clean:
                clean.append(t)
        return clean


class ClaimPayload(BaseModel):
    donationId: int
    claimedWeight: float = Field(gt=0)


class ClaimStatusPayload(BaseModel):
    status: Literal["pending", "accepted", "delivered"]


class VerifyPayload(BaseModel):
    deliveryHash: str


class AddTagsPayload(BaseModel):
    tags: List[str]


class DonationUpdatePayload(BaseModel):
    title: Optional[str] = None
    weight: Optional[float] = None
    tags: Optional[List[str]] = None
    expiryDate: Optional[str] = None
    description: Optional[str] = None
    isVeg: Optional[bool] = None
    prepTime: Optional[str] = None
    quantityUnit: Optional[str] = None


class UpdateProfilePayload(BaseModel):
    data: ProfileData


class LocationTrackPayload(BaseModel):
    volunteerId: int
    latitude: float
    longitude: float
    accuracy: Optional[float] = None


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


app = FastAPI(title="Food Donation Management API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log detailed validation errors and return user-friendly messages."""
    errors = exc.errors()
    logger.error(f"Validation error on {request.url.path}: {errors}")
    
    # Build user-friendly error messages
    user_errors = []
    for error in errors:
        field = str(error.get("loc", ["unknown"])[-1])
        msg = error.get("msg", "Invalid value")
        
        # Make the error message more readable
        if "type_error" in msg or "value_error" in msg:
            user_errors.append(f"Invalid format for {field}")
        else:
            user_errors.append(f"{field}: {msg}")
    
    error_detail = "; ".join(user_errors) if user_errors else "Check your request body"
    
    return JSONResponse(
        status_code=422,
        content={"detail": error_detail}
    )


@app.on_event("startup")
def startup_schema_check() -> None:
    try:
        ensure_schema_compatibility()
        logger.info("Database schema compatibility checks completed")
    except Exception:
        logger.exception("Database schema compatibility checks failed")


@app.exception_handler(AppError)
async def app_error_handler(_, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


def query_one(sql: str, params: tuple[Any, ...] = ()) -> Optional[Dict[str, Any]]:
    """Execute a query and return a single row."""
    try:
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchone()
    except Exception as ex:
        logger.error(f"Query error: {ex}")
        raise


def query_all(sql: str, params: tuple[Any, ...] = ()) -> List[Dict[str, Any]]:
    """Execute a query and return all rows."""
    try:
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchall()
    except Exception as ex:
        logger.error(f"Query error: {ex}")
        raise


def execute(sql: str, params: tuple[Any, ...] = ()) -> None:
    """Execute a non-query statement (INSERT, UPDATE, DELETE)."""
    try:
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
            conn.commit()
    except Exception as ex:
        logger.error(f"Execute error: {ex}")
        raise


def ensure_schema_compatibility() -> None:
    """Adds optional columns used by the latest frontend when older DB schemas are present."""
    statements = [
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS food_description TEXT",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS prep_time TIMESTAMP",
        "ALTER TABLE hotel ADD COLUMN IF NOT EXISTS hotel_type VARCHAR(50) DEFAULT 'Restaurant'",
        "ALTER TABLE hotel ADD COLUMN IF NOT EXISTS contact_name VARCHAR(150)",
        "ALTER TABLE hotel ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8)",
        "ALTER TABLE hotel ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8)",
        "ALTER TABLE volunteer ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8)",
        "ALTER TABLE volunteer ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8)",
        "ALTER TABLE volunteer ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE donations ADD COLUMN IF NOT EXISTS quantity_unit VARCHAR(20) DEFAULT 'kg'",
    ]

    try:
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                for sql in statements:
                    cur.execute(sql)
            conn.commit()
        logger.info("Database schema compatibility check completed")
    except Exception as ex:
        logger.error(f"Schema compatibility check failed: {ex}")


def parse_iso_datetime(raw: str, field_name: str) -> datetime:
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format for {field_name}") from ex


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    payload = parse_auth_token(authorization)
    user = query_one(
        "SELECT user_id, email, phone, role FROM users WHERE user_id = %s",
        (payload.get("user_id"),),
    )
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


def require_role(user: Dict[str, Any], allowed: set[str]) -> None:
    if user["role"] not in allowed:
        raise HTTPException(status_code=403, detail="Forbidden for this role")


def to_frontend_user(user: Dict[str, Any], profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    out = {
        "id": str(user["user_id"]),
        "name": user["email"].split("@")[0],
        "email": user["email"],
        "phone": user["phone"],
        "role": user["role"],
    }
    if profile and user["role"] == "hotel":
        out.update(
            {
                "name": profile["h_name"],
                "hotelName": profile["h_name"],
                "address": profile["address"],
                "licenseNumber": profile["fssai"],
                "managerNumber": user["phone"],
            }
        )
    if profile and user["role"] == "volunteer":
        out.update(
            {
                "name": profile["vol_name"],
                "vehicle": profile["vehicle_type"],
            }
        )
    return out


@app.get("/donations/events")
async def donations_events(request: Request):
    """Real-time event stream for donation updates."""
    queue = asyncio.Queue()
    _SUBSCRIBERS.append(queue)
    
    async def event_generator():
        try:
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                
                try:
                    # Wait for an event from the queue with a timeout to allow checking for disconnect
                    event = await asyncio.wait_for(queue.get(), timeout=1.0)
                    yield f"data: {event}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive ping
                    yield ": ping\n\n"
                    continue
        finally:
            if queue in _SUBSCRIBERS:
                _SUBSCRIBERS.remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "foodconnect-api"}


@app.post("/auth/register")
def register(payload: RegisterPayload):
    try:
        role = payload.role
        data = payload.data
        
        # Validate password
        if not payload.password or not payload.password.strip():
            raise HTTPException(status_code=400, detail="Password is required")
        if len(payload.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
        phone = (data.phone or data.managerNumber or "").strip()
        if not phone:
            raise HTTPException(status_code=400, detail="Phone is required")

        if role == "hotel":
            if not data.hotelName or not data.address or not data.licenseNumber:
                raise HTTPException(status_code=400, detail="Hotel name, address and FSSAI are required")
            email = (data.email or f"{data.hotelName.lower().replace(' ', '')}@hotel.foodconnect.com").lower()
        else:
            if not data.name or not data.vehicle:
                raise HTTPException(status_code=400, detail="Volunteer name and vehicle type are required")
            email = (data.email or f"{data.name.lower().replace(' ', '')}@vol.foodconnect.com").lower()

        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM users WHERE email = %s OR phone = %s", (email, phone))
                if cur.fetchone():
                    raise HTTPException(status_code=409, detail="User with same email or phone already exists")

                cur.execute(
                    "INSERT INTO users (password, email, phone, role) VALUES (%s, %s, %s, %s) RETURNING user_id, email, phone, role",
                    (hash_password(payload.password), email, phone, role),
                )
                user = cur.fetchone()

                profile = None
                if role == "hotel":
                    cur.execute(
                        "INSERT INTO hotel (user_id, h_name, address, fssai) VALUES (%s, %s, %s, %s) RETURNING h_id, h_name, address, fssai",
                        (user["user_id"], data.hotelName.strip(), data.address.strip(), data.licenseNumber.strip()),
                    )
                    profile = cur.fetchone()
                else:
                    cur.execute(
                        "INSERT INTO volunteer (user_id, vol_name, vehicle_type, score) VALUES (%s, %s, %s, %s) RETURNING vol_id, vol_name, vehicle_type, score",
                        (user["user_id"], data.name.strip(), data.vehicle.strip(), 0),
                    )
                    profile = cur.fetchone()
            conn.commit()

        token = issue_token({"user_id": user["user_id"], "role": user["role"]})
        response: Dict[str, Any] = {"token": token, "user": to_frontend_user(user, profile)}
        if role == "hotel" and profile:
            response["hotelProfile"] = {
                "id": str(user["user_id"]),
                "hotelName": profile["h_name"],
                "address": profile["address"],
                "managerNumber": user["phone"],
                "licenseNumber": profile["fssai"],
                "createdAt": datetime.utcnow().isoformat(),
            }
        return response
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Register failed")
        raise HTTPException(status_code=500, detail="Failed to register") from ex


@app.post("/auth/login")
def login(payload: LoginPayload):
    try:
        # Validate required fields
        if not payload.identifier or not payload.identifier.strip():
            raise HTTPException(status_code=400, detail="Identifier (email, phone, or name) is required")
        if not payload.password or not payload.password.strip():
            raise HTTPException(status_code=400, detail="Password is required")
        
        identifier = payload.identifier.strip()
        user = query_one(
            "SELECT user_id, password, email, phone, role FROM users WHERE role = %s AND (email = %s OR phone = %s)",
            (payload.role, identifier, identifier),
        )

        if not user and payload.role == "hotel":
            user = query_one(
                """
                SELECT u.user_id, u.password, u.email, u.phone, u.role
                FROM users u
                JOIN hotel h ON h.user_id = u.user_id
                WHERE u.role = 'hotel' AND LOWER(h.h_name) = LOWER(%s)
                """,
                (identifier,),
            )
        elif not user and payload.role == "volunteer":
            user = query_one(
                """
                SELECT u.user_id, u.password, u.email, u.phone, u.role
                FROM users u
                JOIN volunteer v ON v.user_id = u.user_id
                WHERE u.role = 'volunteer' AND LOWER(v.vol_name) = LOWER(%s)
                """,
                (identifier,),
            )

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(payload.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        profile = None
        if user["role"] == "hotel":
            profile = query_one("SELECT h_id, h_name, address, fssai FROM hotel WHERE user_id = %s", (user["user_id"],))
        elif user["role"] == "volunteer":
            profile = query_one("SELECT vol_id, vol_name, vehicle_type, score FROM volunteer WHERE user_id = %s", (user["user_id"],))

        token = issue_token({"user_id": user["user_id"], "role": user["role"]})
        response: Dict[str, Any] = {
            "token": token,
            "user": to_frontend_user(user, profile),
        }
        if user["role"] == "hotel" and profile:
            response["hotelProfile"] = {
                "id": str(user["user_id"]),
                "hotelName": profile["h_name"],
                "address": profile["address"],
                "managerNumber": user["phone"],
                "licenseNumber": profile["fssai"],
                "createdAt": datetime.utcnow().isoformat(),
            }
        return response
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Login failed")
        raise HTTPException(status_code=500, detail="Failed to login") from ex


@app.get("/donations")
def list_donations(current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    try:
        rows = query_all(
            """
            SELECT
                d.d_id,
                d.h_id,
                d.total_wt,
                d.food_description,
                d.is_veg,
                d.prep_time,
                d.exp_time,
                d.created_at,
                h.h_name,
                h.address,
                h.latitude,
                h.longitude,
                h.hotel_type,
                h.contact_name,
                COALESCE(tags.tags, ARRAY[]::text[]) AS tags,
                d.quantity_unit,
                lc.c_id,
                lc.status AS claim_status,
                lc.c_wt,
                v.vol_name,
                vu.phone AS volunteer_phone
            FROM donations d
            JOIN hotel h ON h.h_id = d.h_id
            LEFT JOIN LATERAL (
                SELECT ARRAY_AGG(dt.tag ORDER BY dt.tag) AS tags
                FROM donation_tags dt
                WHERE dt.d_id = d.d_id
            ) tags ON TRUE
            LEFT JOIN LATERAL (
                SELECT c.c_id, c.status, c.c_wt, c.vol_id
                FROM claims_record c
                WHERE c.d_id = d.d_id
                ORDER BY c.timestamp DESC
                LIMIT 1
            ) lc ON TRUE
            LEFT JOIN volunteer v ON v.vol_id = lc.vol_id
            LEFT JOIN users vu ON vu.user_id = v.user_id
            ORDER BY d.created_at DESC
            """
        )
        logger.info(f"[list_donations] Retrieved {len(rows)} donations from database")
        now = datetime.utcnow()
        out = []
        for row in rows:
            expiry = row["exp_time"]
            status_text = row["claim_status"] or "pending"
            has_active_request = row["claim_status"] == "pending" and row["c_id"] is not None
            logger.debug(f"[list_donations] donation_id={row['d_id']}: claim_status={row['claim_status']}, c_id={row['c_id']}, has_activeRequest={has_active_request}")
            out.append(
                {
                    "id": str(row["d_id"]),
                    "hotelId": str(row["h_id"]),
                    "hotelName": row["h_name"],
                    "hotelAddress": row["address"],
                    "hotelLat": float(row["latitude"]) if row.get("latitude") is not None else None,
                    "hotelLng": float(row["longitude"]) if row.get("longitude") is not None else None,
                    "hotelType": row.get("hotel_type"),
                    "contactName": row.get("contact_name"),
                    "title": f"Donation #{row['d_id']}",
                    "description": row.get("food_description") or "",
                    "isVeg": bool(row.get("is_veg", True)),
                    "prepTime": row["prep_time"].isoformat() if row.get("prep_time") else None,
                    "weight": float(row["total_wt"]),
                    "quantityUnit": row.get("quantity_unit") or "kg",
                    "tags": row["tags"],
                    "status": "assigned" if status_text == "accepted" else ("completed" if status_text == "delivered" else "pending"),
                    "expiryDate": expiry.isoformat() if expiry else None,
                    "isExpiring": bool(expiry and (expiry - now).total_seconds() <= 7200 and (expiry - now).total_seconds() > 0),
                    "timestamp": row["created_at"].isoformat(),
                    "createdAt": row["created_at"].isoformat(),
                    "pickupWindow": "Within expiry",
                    "activeRequest": {"id": str(row["c_id"]), "name": row["vol_name"], "phone": row["volunteer_phone"]} if row["claim_status"] == "pending" else None,
                    "assignedVolunteer": {"id": str(row["c_id"]), "name": row["vol_name"], "phone": row["volunteer_phone"]} if row["claim_status"] == "accepted" else None,
                }
            )
        return out
    except Exception as ex:
        logger.exception("List donations failed")
        raise HTTPException(status_code=500, detail="Unable to fetch donations") from ex


@app.get("/users/{user_id}/stats")
def get_user_stats(user_id: int):
    try:
        user = query_one("SELECT role FROM users WHERE user_id = %s", (user_id,))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        role = user["role"]
        if role == "hotel":
            hotel = query_one("SELECT h_id FROM hotel WHERE user_id = %s", (user_id,))
            if not hotel:
                return {"mealsRescued": 0, "totalWeight": 0, "completedPickups": 0}
            
            stats = query_one(
                """
                SELECT 
                    COUNT(d.d_id) as total_donations,
                    COALESCE(SUM(d.total_wt), 0) as total_weight,
                    COUNT(CASE WHEN c.status = 'delivered' THEN 1 END) as completed_pickups
                FROM donations d
                LEFT JOIN claims_record c ON c.d_id = d.d_id
                WHERE d.h_id = %s
                """,
                (hotel["h_id"],)
            )
            return {
                "mealsRescued": int(float(stats["total_weight"] or 0) * 4),
                "totalWeight": float(stats["total_weight"] or 0),
                "completedPickups": int(stats["completed_pickups"] or 0),
                "totalDonations": int(stats["total_donations"] or 0)
            }
        elif role == "volunteer":
            vol = query_one("SELECT vol_id, score FROM volunteer WHERE user_id = %s", (user_id,))
            if not vol:
                return {"mealsRescued": 0, "hoursVolunteered": 0, "completedPickups": 0}
            
            stats = query_one(
                """
                SELECT 
                    COALESCE(SUM(c_wt), 0) as total_weight,
                    COUNT(*) as completed_pickups
                FROM claims_record
                WHERE vol_id = %s AND status = 'delivered'
                """,
                (vol["vol_id"],)
            )
            return {
                "mealsRescued": int(float(stats["total_weight"] or 0) * 4),
                "hoursVolunteered": int(stats["completed_pickups"] or 0) * 2, # Mocking 2h per pickup
                "totalWeight": float(stats["total_weight"] or 0),
                "completedPickups": int(stats["completed_pickups"] or 0),
                "score": int(vol["score"] or 0)
            }
        return {"error": "Invalid role"}
    except Exception as ex:
        logger.exception("Get stats failed")
        raise HTTPException(status_code=500, detail="Unable to fetch stats")

@app.post("/ai/waste-insights")
def get_ai_waste_insights(payload: Dict[str, Any]):
    # Mock AI insights based on current data
    return {
        "summary": "Impact trend is up by 12% this week.",
        "insights": [
            "Your peak wastage occurs on Friday nights.",
            "Rice and Dal make up 60% of your donations.",
            "Consider optimizing weekend prep for small parties."
        ],
        "savings": "Estimated 45kg saved this month"
    }

@app.post("/ai/nearby-charities")
def get_nearby_charities(latitude: float, longitude: float):
    # In a real app, use Google Maps API or similar. 
    # Here we search for other hotels or potentially 'NGO' type users in DB
    return {
        "charities": [
            {"name": "Robin Hood Army - Dadar", "uri": "https://robinhoodarmy.com/"},
            {"name": "Feeding India Center", "uri": "https://www.feedingindia.org/"},
            {"name": "Roti Bank Mumbai", "uri": "https://www.rotibankfoundation.org/"}
        ]
    }



@app.post("/donations")
async def create_donation(payload: DonationCreatePayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "admin"})
    try:
        weight = payload.totalWt if payload.totalWt is not None else payload.weight
        exp_time_raw = payload.expTime or payload.expiryDate
        if weight is None or weight <= 0:
            raise HTTPException(status_code=400, detail="Donation weight must be greater than zero")
        if not exp_time_raw:
            raise HTTPException(status_code=400, detail="Expiry time is required")

        exp_time = parse_iso_datetime(exp_time_raw, "expTime")
        if exp_time <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Expiry time must be in the future")

        prep_time = parse_iso_datetime(payload.prepTime, "prepTime") if payload.prepTime else None
        if prep_time and prep_time > datetime.utcnow():
            raise HTTPException(status_code=400, detail="Preparation time cannot be in the future")

        description = (payload.description or payload.title or "").strip() or None

        hotel = query_one("SELECT h_id FROM hotel WHERE user_id = %s", (current_user["user_id"],))
        if not hotel:
            raise HTTPException(status_code=403, detail="Hotel profile not found")

        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO donations (h_id, total_wt, food_description, is_veg, prep_time, exp_time, quantity_unit)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING d_id
                    """,
                    (hotel["h_id"], weight, description, bool(payload.isVeg) if payload.isVeg is not None else True, prep_time, exp_time, payload.quantityUnit or "kg"),
                )
                donation = cur.fetchone()
                for tag in payload.tags:
                    if tag in ALLOWED_TAGS:
                        cur.execute(
                            "INSERT INTO donation_tags (d_id, tag) VALUES (%s, %s) ON CONFLICT (d_id, tag) DO NOTHING",
                            (donation["d_id"], tag),
                        )
            conn.commit()

        await broadcast_event("donation_created", {"donationId": donation["d_id"]})
        return {"message": "Donation created", "donationId": donation["d_id"]}
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Create donation failed")
        raise HTTPException(status_code=500, detail="Failed to create donation") from ex


@app.post("/donations/{donation_id}/tags")
def add_tags(donation_id: int, payload: AddTagsPayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "admin"})
    try:
        clean = [tag.strip().lower() for tag in payload.tags if tag.strip().lower() in ALLOWED_TAGS]
        if not clean:
            raise HTTPException(status_code=400, detail="No valid tags supplied")

        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM donations WHERE d_id = %s", (donation_id,))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Donation not found")
                for tag in clean:
                    cur.execute(
                        "INSERT INTO donation_tags (d_id, tag) VALUES (%s, %s) ON CONFLICT (d_id, tag) DO NOTHING",
                        (donation_id, tag),
                    )

        return {"message": "Tags updated"}
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Add tags failed")
        raise HTTPException(status_code=500, detail="Failed to add tags") from ex


@app.post("/claims")
async def create_claim(payload: ClaimPayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"volunteer", "admin"})
    try:
        volunteer = query_one("SELECT vol_id FROM volunteer WHERE user_id = %s", (current_user["user_id"],))
        if not volunteer:
            raise HTTPException(status_code=403, detail="Volunteer profile not found")

        donation = query_one("SELECT d_id, total_wt FROM donations WHERE d_id = %s", (payload.donationId,))
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")
        if payload.claimedWeight > float(donation["total_wt"]):
            raise HTTPException(status_code=400, detail="Claimed weight exceeds donation weight")

        existing_active = query_one(
            "SELECT c_id FROM claims_record WHERE d_id = %s AND status IN ('pending', 'accepted')",
            (payload.donationId,),
        )
        if existing_active:
            raise HTTPException(status_code=409, detail="Donation already claimed")

        claim = query_one(
            "INSERT INTO claims_record (d_id, vol_id, status, c_wt) VALUES (%s, %s, 'pending', %s) RETURNING c_id, status",
            (payload.donationId, volunteer["vol_id"], payload.claimedWeight),
        )
        logger.info(f"✅ Claim created: donation_id={payload.donationId}, vol_id={volunteer['vol_id']}, claim_id={claim['c_id']}, status={claim['status']}")
        await broadcast_event("donation_updated", {"donationId": payload.donationId, "type": "request_created", "action": "REFRESH_IMMEDIATELY"})
        logger.info(f"📡 Broadcast sent for donation {payload.donationId}")
        return {"message": "Claim created", "claimId": claim["c_id"], "status": claim["status"]}
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Create claim failed")
        raise HTTPException(status_code=500, detail="Failed to create claim") from ex


@app.patch("/claims/{claim_id}/status")
async def update_claim_status(claim_id: int, payload: ClaimStatusPayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "volunteer", "admin"})
    try:
        claim = query_one("SELECT c_id, d_id, status, vol_id FROM claims_record WHERE c_id = %s", (claim_id,))
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        current_status = claim["status"]
        next_status = payload.status
        allowed = {
            "pending": {"accepted"},
            "accepted": {"delivered"},
            "delivered": set(),
        }
        if next_status not in allowed[current_status] and next_status != current_status:
            raise HTTPException(status_code=400, detail=f"Invalid status transition {current_status} -> {next_status}")

        execute("UPDATE claims_record SET status = %s WHERE c_id = %s", (next_status, claim_id))

        if next_status == "delivered":
            execute("UPDATE volunteer SET score = score + 10 WHERE vol_id = %s", (claim["vol_id"],))

        await broadcast_event("donation_updated", {"donationId": claim["d_id"], "type": "status_changed", "newStatus": next_status})
        return {"message": "Claim status updated", "status": next_status}
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Update claim status failed")
        raise HTTPException(status_code=500, detail="Failed to update claim status") from ex


@app.get("/volunteer/assigned")
def volunteer_assigned(current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"volunteer", "admin"})
    try:
        volunteer = query_one("SELECT vol_id FROM volunteer WHERE user_id = %s", (current_user["user_id"],))
        rows = query_all(
            """
            SELECT c.c_id, c.status, c.c_wt, c.timestamp, d.d_id, d.exp_time, h.h_name
            FROM claims_record c
            JOIN donations d ON d.d_id = c.d_id
            JOIN hotel h ON h.h_id = d.h_id
            WHERE c.vol_id = %s AND c.status IN ('accepted', 'delivered')
            ORDER BY c.timestamp DESC
            """,
            (volunteer["vol_id"],),
        )
        return rows
    except Exception as ex:
        logger.exception("Volunteer assigned fetch failed")
        raise HTTPException(status_code=500, detail="Failed to fetch assigned donations") from ex


@app.post("/verification/{claim_id}/generate-pickup")
def generate_pickup_hash(claim_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "admin"})
    try:
        claim = query_one("SELECT c_id, status FROM claims_record WHERE c_id = %s", (claim_id,))
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        if claim["status"] != "accepted":
            raise HTTPException(status_code=400, detail="Pickup hash can be generated only for accepted claims")

        pickup_hash = f"{secrets.randbelow(9000) + 1000}"
        expiry = datetime.utcnow() + timedelta(hours=2)

        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO verification (c_id, exp_time, pickup_hash, delivery_hash)
                    VALUES (%s, %s, %s, NULL)
                    ON CONFLICT (c_id)
                    DO UPDATE SET exp_time = EXCLUDED.exp_time, pickup_hash = EXCLUDED.pickup_hash
                    RETURNING ve_id, exp_time, pickup_hash
                    """,
                    (claim_id, expiry, pickup_hash),
                )
                result = cur.fetchone()

        return {
            "verificationId": result["ve_id"],
            "expTime": result["exp_time"].isoformat(),
            "pickupHash": result["pickup_hash"],
            "pickupCode": result["pickup_hash"],
        }
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Generate pickup hash failed")
        raise HTTPException(status_code=500, detail="Failed to generate pickup hash") from ex


@app.post("/verification/{claim_id}/verify-delivery")
def verify_delivery(claim_id: int, payload: VerifyPayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "volunteer", "admin"})
    try:
        record = query_one(
            "SELECT ve_id, pickup_hash, exp_time FROM verification WHERE c_id = %s",
            (claim_id,),
        )
        if not record:
            raise HTTPException(status_code=404, detail="Verification record not found")

        if record["exp_time"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Verification hash expired")

        if payload.deliveryHash.strip() != record["pickup_hash"]:
            raise HTTPException(status_code=400, detail="Hash mismatch")

        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE verification SET delivery_hash = %s, verified_at = NOW() WHERE c_id = %s",
                    (payload.deliveryHash.strip(), claim_id),
                )
                cur.execute(
                    "UPDATE claims_record SET status = 'delivered' WHERE c_id = %s",
                    (claim_id,),
                )

        return {"message": "Delivery verified", "status": "delivered"}
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Verify delivery failed")
        raise HTTPException(status_code=500, detail="Failed to verify delivery") from ex


@app.get("/alerts/expiring")
def expiring_alerts(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        rows = query_all(
            """
            SELECT d.d_id, d.total_wt, d.exp_time, h.h_name
            FROM donations d
            JOIN hotel h ON h.h_id = d.h_id
            WHERE d.exp_time BETWEEN NOW() AND NOW() + INTERVAL '2 hour'
            ORDER BY d.exp_time ASC
            """
        )
        return rows
    except Exception as ex:
        logger.exception("Expiring alerts failed")
        raise HTTPException(status_code=500, detail="Failed to fetch expiry alerts") from ex


@app.get("/dashboard/analytics")
def dashboard_analytics(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        totals = query_one(
            """
            SELECT
              COUNT(*)::int AS total_donations,
              COALESCE(SUM(total_wt), 0)::float AS food_saved
            FROM donations
            """,
            (),
        )
        active_volunteers = query_one(
            """
            SELECT COUNT(DISTINCT vol_id)::int AS active_volunteers
            FROM claims_record
            WHERE status IN ('accepted', 'delivered')
            """,
            (),
        )
        return {
            "totalDonations": totals["total_donations"],
            "activeVolunteers": active_volunteers["active_volunteers"],
            "foodSaved": totals["food_saved"],
        }
    except Exception as ex:
        logger.exception("Analytics fetch failed")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics") from ex


@app.get("/donations/{donation_id}/status-stream")
def donation_status_stream(donation_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    async def event_stream():
        while True:
            latest = query_one(
                "SELECT status, timestamp FROM claims_record WHERE d_id = %s ORDER BY timestamp DESC LIMIT 1",
                (donation_id,),
            )
            status_value = latest["status"] if latest else "pending"
            payload = {"donationId": donation_id, "status": status_value, "timestamp": datetime.utcnow().isoformat()}
            yield f"data: {payload}\n\n"
            import asyncio
            await asyncio.sleep(2)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Compatibility endpoints used by the current frontend
@app.post("/donations/{donation_id}/request")
async def request_donation(donation_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"volunteer", "admin"})
    donation = query_one("SELECT total_wt FROM donations WHERE d_id = %s", (donation_id,))
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    # Check for an already-existing active claim so we return a clear error
    existing = query_one(
        "SELECT c_id FROM claims_record WHERE d_id = %s AND status IN ('pending', 'accepted')",
        (donation_id,),
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already requested this donation")
    return await create_claim(ClaimPayload(donationId=donation_id, claimedWeight=float(donation["total_wt"])), current_user)


@app.patch("/donations/{donation_id}")
def update_donation(donation_id: int, payload: DonationUpdatePayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "admin"})
    donation = query_one("SELECT d_id FROM donations WHERE d_id = %s", (donation_id,))
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    with get_db_conn() as conn:
        with conn.cursor() as cur:
            if payload.weight is not None:
                if payload.weight <= 0:
                    raise HTTPException(status_code=400, detail="Weight must be positive")
                cur.execute("UPDATE donations SET total_wt = %s WHERE d_id = %s", (payload.weight, donation_id))

            if payload.expiryDate:
                exp_time = parse_iso_datetime(payload.expiryDate, "expiryDate")
                cur.execute("UPDATE donations SET exp_time = %s WHERE d_id = %s", (exp_time, donation_id))

            if payload.description is not None or payload.title is not None:
                description = (payload.description if payload.description is not None else payload.title or "").strip()
                cur.execute("UPDATE donations SET food_description = %s WHERE d_id = %s", (description or None, donation_id))

            if payload.isVeg is not None:
                cur.execute("UPDATE donations SET is_veg = %s WHERE d_id = %s", (payload.isVeg, donation_id))

            if payload.prepTime is not None:
                prep_time = parse_iso_datetime(payload.prepTime, "prepTime")
                cur.execute("UPDATE donations SET prep_time = %s WHERE d_id = %s", (prep_time, donation_id))

            if payload.tags is not None:
                cur.execute("DELETE FROM donation_tags WHERE d_id = %s", (donation_id,))
                for tag in payload.tags:
                    clean = tag.strip().lower()
                    if clean in ALLOWED_TAGS:
                        cur.execute(
                            "INSERT INTO donation_tags (d_id, tag) VALUES (%s, %s) ON CONFLICT (d_id, tag) DO NOTHING",
                            (donation_id, clean),
                        )

    return {"message": "Donation updated"}


@app.post("/donations/{donation_id}/accept")
async def accept_request(donation_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "admin"})
    claim = query_one(
        "SELECT c_id FROM claims_record WHERE d_id = %s AND status = 'pending' ORDER BY timestamp ASC LIMIT 1",
        (donation_id,),
    )
    if not claim:
        raise HTTPException(status_code=404, detail="No pending claim found")
    update_claim_status(claim["c_id"], ClaimStatusPayload(status="accepted"), current_user)
    generate_pickup_hash(claim["c_id"], current_user)
    await broadcast_event("donation_updated", {"donationId": donation_id, "type": "request_accepted"})
    return {"message": "Claim accepted"}


@app.post("/donations/{donation_id}/reject")
async def reject_request(donation_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "admin"})
    claim = query_one(
        "SELECT c_id FROM claims_record WHERE d_id = %s AND status = 'pending' ORDER BY timestamp ASC LIMIT 1",
        (donation_id,),
    )
    if not claim:
        raise HTTPException(status_code=404, detail="No pending claim found")

    execute("DELETE FROM claims_record WHERE c_id = %s", (claim["c_id"],))
    await broadcast_event("donation_updated", {"donationId": donation_id, "type": "request_rejected"})
    return {"message": "Claim rejected"}


@app.post("/donations/{donation_id}/complete")
async def complete_donation(donation_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "admin"})
    claim = query_one(
        "SELECT c_id FROM claims_record WHERE d_id = %s AND status = 'accepted' ORDER BY timestamp DESC LIMIT 1",
        (donation_id,),
    )
    if not claim:
        raise HTTPException(status_code=404, detail="No accepted claim found")
    execute("UPDATE claims_record SET status = 'delivered' WHERE c_id = %s", (claim["c_id"],))
    await broadcast_event("donation_updated", {"donationId": donation_id, "type": "completed"})
    return {"message": "Donation marked complete"}


@app.post("/donations/{donation_id}/verify")
def verify_and_complete(donation_id: int, payload: Dict[str, str], current_user: Dict[str, Any] = Depends(get_current_user)):
    claim = query_one(
        "SELECT c_id FROM claims_record WHERE d_id = %s AND status = 'accepted' ORDER BY timestamp DESC LIMIT 1",
        (donation_id,),
    )
    if not claim:
        raise HTTPException(status_code=404, detail="No accepted claim found")
    code = payload.get("code") or payload.get("deliveryHash")
    if not code:
        raise HTTPException(status_code=400, detail="Verification code is required")
    return verify_delivery(claim["c_id"], VerifyPayload(deliveryHash=code), current_user)


@app.get("/users/{user_id}/stats")
def user_stats(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] == "hotel":
        profile = query_one("SELECT h_id FROM hotel WHERE user_id = %s", (user_id,))
        if not profile:
            return {"rescuedKg": 0, "mealsServed": 0, "nextPickup": "N/A", "nextPickupStatus": "none"}
        stats = query_one(
            "SELECT COALESCE(SUM(total_wt), 0)::float AS rescued_kg, COUNT(*)::int AS total FROM donations WHERE h_id = %s",
            (profile["h_id"],),
        )
        return {
            "rescuedKg": stats["rescued_kg"],
            "mealsServed": int(stats["rescued_kg"] * 2),
            "nextPickup": "Check requests panel",
            "nextPickupStatus": "live",
        }

    volunteer = query_one("SELECT vol_id, score FROM volunteer WHERE user_id = %s", (user_id,))
    if not volunteer:
        return {"rescuedKg": 0, "mealsServed": 0, "nextPickup": "N/A", "nextPickupStatus": "none"}
    stats = query_one(
        "SELECT COALESCE(SUM(c_wt), 0)::float AS rescued_kg, COUNT(*)::int AS completed FROM claims_record WHERE vol_id = %s AND status = 'delivered'",
        (volunteer["vol_id"],),
    )
    return {
        "rescuedKg": stats["rescued_kg"],
        "mealsServed": int(stats["rescued_kg"] * 2),
        "nextPickup": "Stay available",
        "nextPickupStatus": "active",
        "score": volunteer["score"],
        "userId": str(user_id),
        "mealsRescued": int(stats["rescued_kg"] * 2),
        "hoursVolunteered": int(stats["completed"] * 2),
        "totalWeight": stats["rescued_kg"],
        "completedPickups": stats["completed"],
        "rating": round(min(5.0, 3.5 + (volunteer["score"] / 120.0)), 1),
    }


@app.patch("/users/{user_id}/profile")
def update_profile(user_id: int, payload: UpdateProfilePayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    if str(current_user["user_id"]) != str(user_id) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Cannot edit another user profile")

    data = payload.data
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            if data.phone:
                cur.execute("UPDATE users SET phone = %s WHERE user_id = %s", (data.phone.strip(), user_id))

            if current_user["role"] == "hotel":
                updates = []
                params: List[Any] = []
                if data.hotelName:
                    updates.append("h_name = %s")
                    params.append(data.hotelName.strip())
                if data.address:
                    updates.append("address = %s")
                    params.append(data.address.strip())
                if data.licenseNumber:
                    updates.append("fssai = %s")
                    params.append(data.licenseNumber.strip())
                if updates:
                    params.append(user_id)
                    cur.execute(f"UPDATE hotel SET {', '.join(updates)} WHERE user_id = %s", tuple(params))

            if current_user["role"] == "volunteer":
                updates = []
                params = []
                if data.name:
                    updates.append("vol_name = %s")
                    params.append(data.name.strip())
                if data.vehicle:
                    updates.append("vehicle_type = %s")
                    params.append(data.vehicle.strip())
                if updates:
                    params.append(user_id)
                    cur.execute(f"UPDATE volunteer SET {', '.join(updates)} WHERE user_id = %s", tuple(params))

    user = query_one("SELECT user_id, email, phone, role FROM users WHERE user_id = %s", (user_id,))
    if user["role"] == "hotel":
        profile = query_one("SELECT h_name, address, fssai FROM hotel WHERE user_id = %s", (user_id,))
    else:
        profile = query_one("SELECT vol_name, vehicle_type FROM volunteer WHERE user_id = %s", (user_id,))
    return {"user": to_frontend_user(user, profile)}


@app.get("/users/{user_id}")
def get_user_profile(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    if str(current_user["user_id"]) != str(user_id) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Cannot read another user profile")

    user = query_one("SELECT user_id, email, phone, role FROM users WHERE user_id = %s", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["role"] == "hotel":
        profile = query_one(
            """
            SELECT h_name, hotel_type, contact_name, address, latitude, longitude, fssai
            FROM hotel
            WHERE user_id = %s
            """,
            (user_id,),
        )
        return {
            "id": str(user["user_id"]),
            "role": user["role"],
            "email": user["email"],
            "phone": user["phone"],
            "name": profile["h_name"] if profile else user["email"].split("@")[0],
            "hotelName": profile["h_name"] if profile else None,
            "hotelType": profile["hotel_type"] if profile else None,
            "contactName": profile["contact_name"] if profile else None,
            "address": profile["address"] if profile else None,
            "latitude": float(profile["latitude"]) if profile and profile.get("latitude") is not None else None,
            "longitude": float(profile["longitude"]) if profile and profile.get("longitude") is not None else None,
            "licenseNumber": profile["fssai"] if profile else None,
        }

    profile = query_one(
        """
        SELECT vol_name, age, vehicle_type, availability_status, latitude, longitude, score
        FROM volunteer
        WHERE user_id = %s
        """,
        (user_id,),
    )
    return {
        "id": str(user["user_id"]),
        "role": user["role"],
        "email": user["email"],
        "phone": user["phone"],
        "name": profile["vol_name"] if profile else user["email"].split("@")[0],
        "age": profile["age"] if profile else None,
        "vehicle": profile["vehicle_type"] if profile else None,
        "availability": profile["availability_status"] if profile else None,
        "latitude": float(profile["latitude"]) if profile and profile.get("latitude") is not None else None,
        "longitude": float(profile["longitude"]) if profile and profile.get("longitude") is not None else None,
        "score": profile["score"] if profile else 0,
    }


def get_map_entities_payload() -> Dict[str, List[Dict[str, Any]]]:
    hotels = query_all(
        """
        SELECT h_id, h_name, address, latitude, longitude
        FROM hotel
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY h_id ASC
        """,
        (),
    )
    volunteers = query_all(
        """
        SELECT v.vol_id, v.vol_name, v.vehicle_type, v.score, v.latitude, v.longitude
        FROM volunteer v
        WHERE v.latitude IS NOT NULL AND v.longitude IS NOT NULL
        ORDER BY v.vol_id ASC
        """,
        (),
    )

    return {
        "hotels": [
            {
                "id": row["h_id"],
                "name": row["h_name"],
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "role": "hotel",
                "address": row.get("address"),
            }
            for row in hotels
        ],
        "volunteers": [
            {
                "id": row["vol_id"],
                "name": row["vol_name"],
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "role": "volunteer",
                "vehicle": row.get("vehicle_type"),
                "score": row.get("score") or 0,
            }
            for row in volunteers
        ],
    }


@app.get("/map/all")
def map_all(current_user: Dict[str, Any] = Depends(get_current_user)):
    _ = current_user
    return get_map_entities_payload()


@app.get("/map/entities")
def map_entities(current_user: Dict[str, Any] = Depends(get_current_user)):
    _ = current_user
    return get_map_entities_payload()


@app.post("/hotels/{hotel_id}/location")
def update_hotel_location(hotel_id: int, lat: float, lng: float, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"hotel", "admin"})
    hotel = query_one("SELECT h_id FROM hotel WHERE user_id = %s", (current_user["user_id"],))
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if current_user["role"] != "admin" and int(hotel["h_id"]) != hotel_id:
        raise HTTPException(status_code=403, detail="Cannot edit another hotel's location")

    execute("UPDATE hotel SET latitude = %s, longitude = %s WHERE h_id = %s", (lat, lng, hotel_id))
    return {"ok": True, "hotelId": hotel_id, "lat": lat, "lng": lng}


@app.post("/donations/{donation_id}/tracking")
def add_tracking_point(donation_id: int, payload: LocationTrackPayload, current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"volunteer", "admin"})
    donation = query_one("SELECT d_id FROM donations WHERE d_id = %s", (donation_id,))
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO location_tracking (volunteer_id, donation_id, latitude, longitude, accuracy)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, timestamp
                """,
                (payload.volunteerId, donation_id, payload.latitude, payload.longitude, payload.accuracy),
            )
            row = cur.fetchone()
    return {"id": row["id"], "timestamp": row["timestamp"].isoformat()}


@app.post("/location/update")
def update_location(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    require_role(current_user, {"volunteer", "admin"})

    volunteer_id = payload.get("volunteerID") or payload.get("volunteerId")
    donation_id = payload.get("donationID") or payload.get("donationId")
    latitude = payload.get("latitude")
    longitude = payload.get("longitude")
    accuracy = payload.get("accuracy")

    if volunteer_id is None or donation_id is None or latitude is None or longitude is None:
        raise HTTPException(status_code=400, detail="volunteerID, donationID, latitude and longitude are required")

    donation = query_one("SELECT d_id FROM donations WHERE d_id = %s", (int(donation_id),))
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO location_tracking (volunteer_id, donation_id, latitude, longitude, accuracy)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, timestamp
                """,
                (int(volunteer_id), int(donation_id), float(latitude), float(longitude), accuracy),
            )
            row = cur.fetchone()

    return {"ok": True, "id": row["id"], "timestamp": row["timestamp"].isoformat()}


@app.get("/location/{donation_id}/latest")
def location_latest(donation_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _ = current_user
    row = query_one(
        """
        SELECT latitude, longitude, accuracy, timestamp
        FROM location_tracking
        WHERE donation_id = %s
        ORDER BY timestamp DESC
        LIMIT 1
        """,
        (donation_id,),
    )
    if not row:
        return {"found": False, "message": "No location updates available"}

    return {
        "found": True,
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "accuracy": float(row["accuracy"]) if row.get("accuracy") is not None else None,
        "timestamp": row["timestamp"].isoformat(),
    }


@app.get("/location/{donation_id}/history")
def location_history(donation_id: int, limit: int = 100, current_user: Dict[str, Any] = Depends(get_current_user)):
    _ = current_user
    safe_limit = max(1, min(limit, 300))
    rows = query_all(
        """
        SELECT volunteer_id, donation_id, latitude, longitude, accuracy, timestamp
        FROM location_tracking
        WHERE donation_id = %s
        ORDER BY timestamp DESC
        LIMIT %s
        """,
        (donation_id, safe_limit),
    )
    return [
        {
            "volunteerID": row["volunteer_id"],
            "donationID": row["donation_id"],
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "accuracy": float(row["accuracy"]) if row.get("accuracy") is not None else None,
            "timestamp": row["timestamp"].isoformat(),
        }
        for row in rows
    ]


@app.get("/donations/{donation_id}/tracking")
def list_tracking_points(donation_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = query_all(
        """
        SELECT id, volunteer_id, donation_id, latitude, longitude, accuracy, timestamp
        FROM location_tracking
        WHERE donation_id = %s
        ORDER BY timestamp DESC
        LIMIT 200
        """,
        (donation_id,),
    )
    return [
        {
            "id": row["id"],
            "volunteerId": row["volunteer_id"],
            "donationId": row["donation_id"],
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "accuracy": float(row["accuracy"]) if row.get("accuracy") is not None else None,
            "timestamp": row["timestamp"].isoformat(),
        }
        for row in rows
    ]


@app.post("/ai/waste-insights")
def get_ai_waste_insights(payload: Dict[str, Any]):
    # Mock AI insights based on current data
    return {
        "summary": "Impact trend is up by 12% this week.",
        "insights": [
            { "title": "Peak Wastage", "description": "Your peak wastage occurs on Friday nights.", "icon": "🌙" },
            { "title": "Donation Mix", "description": "Rice and Dal make up 60% of your donations.", "icon": "🍱" },
            { "title": "Optimization", "description": "Consider optimizing weekend prep for small parties.", "icon": "💡" }
        ],
        "savings": "Estimated 45kg saved this month"
    }

@app.post("/ai/nearby-charities")
def get_nearby_charities(latitude: float, longitude: float):
    # In a real app, use Google Maps API or similar. 
    return {
        "charities": [
            {"name": "Robin Hood Army - Dadar", "uri": "https://robinhoodarmy.com/"},
            {"name": "Feeding India Center", "uri": "https://www.feedingindia.org/"},
            {"name": "Roti Bank Mumbai", "uri": "https://www.rotibankfoundation.org/"}
        ]
    }

@app.get("/map/all")
def get_map_all():
    try:
        hotels = query_all(
            """
            SELECT h_id as id, h_name as name, address, latitude, longitude, 'hotel' as "role"
            FROM hotel
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            """
        )
        volunteers = query_all(
            """
            SELECT vol_id as id, vol_name as name, vehicle_type as vehicle, score, latitude, longitude, 'volunteer' as "role"
            FROM volunteer
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            """
        )
        
        for h in hotels:
            h["latitude"] = float(h["latitude"])
            h["longitude"] = float(h["longitude"])
        
        for v in volunteers:
            v["latitude"] = float(v["latitude"])
            v["longitude"] = float(v["longitude"])
            
        return {"hotels": hotels, "volunteers": volunteers}
    except Exception as ex:
        logger.exception("Map fetch failed")
        return {"hotels": [], "volunteers": []}

@app.get("/db/overview")
def db_overview(current_user: Dict[str, Any] = Depends(get_current_user)):
    table_counts = {}
    for table in sorted(DB_TABLE_WHITELIST):
        row = query_one(f"SELECT COUNT(*)::int AS total FROM {table}", ())
        table_counts[table] = row["total"] if row else 0

    return {
        "tables": table_counts,
        "entities": {
            "users": "All authenticated accounts (hotel/volunteer/admin)",
            "hotel": "Hotel profiles, address, FSSAI and geo-location",
            "volunteer": "Volunteer profile, vehicle, score, availability",
            "donations": "Donation core details with expiry and food metadata",
            "donation_tags": "Donation category tags",
            "claims_record": "Pickup requests and lifecycle status",
            "verification": "Pickup code verification records",
            "location_tracking": "Volunteer movement points for active pickup",
        },
    }

@app.get("/db/table/{table_name}")
def db_table_rows(table_name: str, limit: int = 100, current_user: Dict[str, Any] = Depends(get_current_user)):
    normalized = table_name.strip().lower()
    if normalized not in DB_TABLE_WHITELIST:
        raise HTTPException(status_code=400, detail="Table is not exposed")

    safe_limit = max(1, min(limit, 500))
    rows = query_all(f"SELECT * FROM {normalized} ORDER BY 1 DESC LIMIT %s", (safe_limit,))

    serializable_rows: List[Dict[str, Any]] = []
    for row in rows:
        out = {}
        for key, value in row.items():
            if isinstance(value, datetime):
                out[key] = value.isoformat()
            elif hasattr(value, "isoformat"):
                out[key] = value.isoformat()
            else:
                out[key] = value
        serializable_rows.append(out)

    return {"table": normalized, "count": len(serializable_rows), "rows": serializable_rows}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

