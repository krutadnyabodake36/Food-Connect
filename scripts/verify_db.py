import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend
BASE_DIR = Path(__file__).resolve().parent / 'backend'
load_dotenv(BASE_DIR / '.env')

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/foodconnect")

def test_connection():
    print(f"--- Database connection test ---")
    print(f"Connecting to: {DATABASE_URL}")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            print("Successfully connected to the database!")
            # Check for tables
            from sqlalchemy import inspect
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            if tables:
                print(f"Found tables: {', '.join(tables)}")
            else:
                print("No tables found. They will be created when the FastAPI app starts.")
    except Exception as e:
        print("\n[ERROR] Failed to connect to PostgreSQL.")
        print(f"Error details: {e}")
        print("\nTips:")
        print("1. Make sure pgAdmin/PostgreSQL is running.")
        print("2. Make sure the database 'foodconnect' exists.")
        print("3. Check if the password 'postgres' matches your setup.")
        print("4. Verify the port (default 5432).")

if __name__ == "__main__":
    test_connection()
