# Connecting PostgreSQL (pgAdmin) to FoodConnect

This document details exactly how the local PostgreSQL database (managed via pgAdmin) connects to the Python backend of the FoodConnect application.

## 1. The Connection String (URI)

The core link between the database and the backend is the **Database Connection URI**. This is securely stored in a `.env` file at the root of your project so that passwords aren't hardcoded into the source code.

In your `Food-Connect/.env` file, the connection string looks like this:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foodconnect
```

**Breakdown of the URI:**
*   `postgresql://`: Declares the database protocol.
*   `postgres`: The default database username.
*   `:postgres`: The password for that user.
*   `@localhost`: The host where the DB is running (your local machine).
*   `:5432`: The default port PostgreSQL listens on.
*   `/foodconnect`: The specific name of the database created inside pgAdmin.

## 2. Step-by-Step Connection Process

This is how the application is initialized and connects to the database.

### Step A: Database Creation in pgAdmin
1. Open pgAdmin.
2. In the Object Explorer, right-click on `Databases` -> `Create` -> `Database...`
3. Name the database `foodconnect` and click Save.

### Step B: Schema Injection
1. Right-click the new `foodconnect` database and open the **Query Tool**.
2. Copy all the contents from your `database/queries/Sql_Queries.sql` file and execute them. 
3. This officially builds the `users`, `hotel`, `volunteer`, and `donations` tables inside the database.

### Step C: Environment Variable Binding
When the Python backend server (FastAPI) starts up, a library like `python-dotenv` searches for the `.env` file and loads the `DATABASE_URL` variable into the system's environment.

### Step D: Connection via ORM / Driver
Inside the python application, the database driver intercepts that connection string to establish the pipeline:
```python
# Example of how the Backend uses it internally via SQLAlchemy
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. Fetches the string from the .env file
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Creates the engine that talks to pgAdmin
engine = create_engine(DATABASE_URL)

# 3. Creates a session pool to handle multiple volunteer requests without crashing
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

## 3. Why This Method?
*   **Security**: The backend code never contains the password. If you push the code to GitHub (ensuring `.env` is inside your `.gitignore`), your pgAdmin credentials stay safe.
*   **Flexibility**: If you deploy the project live (e.g., to AWS RDS or Supabase DB), you don't change the python code. You simply swap the `DATABASE_URL` in the server's environment variables to point to the new cloud database instead of `localhost`.
*   **Connection Pooling**: Python handles opening and closing "Session" connections dynamically so your pgAdmin database doesn't get overloaded when hundreds of users use the app simultaneously.
