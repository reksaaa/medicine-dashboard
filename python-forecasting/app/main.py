from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import forecast
from .models.database import db
import uvicorn
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Medicine Forecasting API",
    description="Real ARIMA/SARIMA forecasting for medicine usage",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Next.js domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include forecast routes
app.include_router(forecast.router, prefix="/api/forecast", tags=["forecast"])

@app.get("/health")
async def health_check():
    """Health check endpoint with detailed diagnostics"""
    try:
        # Check if database manager exists
        if db is None:
            return {
                "status": "unhealthy",
                "message": "Database manager not initialized",
                "database": "error",
                "version": "1.0.0"
            }
        
        # Test database connection
        db_status = "connected" if db.test_connection() else "disconnected"
        
        # Check environment variables
        database_url = os.getenv("DATABASE_URL")
        has_db_url = database_url is not None
        
        return {
            "status": "healthy" if db_status == "connected" else "unhealthy",
            "message": "API is operational",
            "database": db_status,
            "version": "1.0.0",
            "environment": {
                "has_database_url": has_db_url,
                "database_url_preview": database_url[:50] + "..." if database_url else None
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "message": f"API error: {str(e)}",
            "database": "error",
            "version": "1.0.0"
        }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Medicine Forecasting API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/debug/database")
async def debug_database():
    """Debug endpoint to check database configuration"""
    try:
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            return {
                "error": "DATABASE_URL environment variable not set",
                "suggestion": "Set DATABASE_URL environment variable"
            }
        
        # Test connection
        connection_status = db.test_connection() if db else False
        
        return {
            "database_url_configured": True,
            "database_url_preview": database_url[:50] + "...",
            "connection_status": "connected" if connection_status else "failed",
            "database_manager_initialized": db is not None
        }
    except Exception as e:
        return {
            "error": str(e),
            "database_manager_initialized": db is not None
        }

if __name__ == "__main__":
    # Check environment on startup
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        logger.error("❌ DATABASE_URL environment variable not set!")
        logger.error("Please set DATABASE_URL before starting the service")
    else:
        logger.info(f"✅ DATABASE_URL configured: {database_url[:50]}...")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
