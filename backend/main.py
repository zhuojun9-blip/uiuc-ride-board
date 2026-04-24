from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import logging
from database import Base, engine, settings
from routes import auth, drivers, requests, applications, messages, websocket

logger = logging.getLogger(__name__)
database_ready = False


def initialize_database() -> bool:
    try:
        Base.metadata.create_all(bind=engine)

        if engine.dialect.name == "postgresql":
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE")
                )
                connection.execute(
                    text("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS price_per_seat DOUBLE PRECISION DEFAULT 0")
                )
        return True
    except SQLAlchemyError as error:
        logger.exception(
            "Database initialization failed. Check DATABASE_URL and database availability."
        )
        return False

app = FastAPI(
    title="UIUC Ride Board API",
    description="Backend API for UIUC intercity ride-board platform",
    version="1.0.0"
)

frontend_origin = settings.FRONTEND_URL.rstrip("/")
allowed_origins = {
    "http://localhost:5173",
    "http://localhost:3000",
    "https://uiuc-ride.netlify.app",
    "https://www.uiuc-ride.netlify.app",
}

if frontend_origin:
    allowed_origins.add(frontend_origin)


@app.on_event("startup")
async def startup_event() -> None:
    global database_ready
    database_ready = initialize_database()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(drivers.router)
app.include_router(requests.router)
app.include_router(applications.router)
app.include_router(messages.router)
app.include_router(websocket.router)

@app.get("/health")
async def health_check():
    if database_ready:
        return {"status": "ok", "message": "UIUC Ride Board API is running"}
    return {
        "status": "degraded",
        "message": "API is running but database initialization failed. Check DATABASE_URL."
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to UIUC Ride Board API",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
