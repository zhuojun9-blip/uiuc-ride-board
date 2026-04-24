from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import Base, engine, settings
from routes import auth, drivers, requests, applications, messages, websocket

# Create tables
Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    connection.execute(
        text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE")
    )

app = FastAPI(
    title="UIUC Ride Board API",
    description="Backend API for UIUC intercity ride-board platform",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_origin_regex=r"https://.*\\.netlify\\.app",
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
    return {"status": "ok", "message": "UIUC Ride Board API is running"}

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
