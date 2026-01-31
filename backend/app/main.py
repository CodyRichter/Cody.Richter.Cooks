"""
FastAPI application entry point with CORS configuration and route setup.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.handlers.system import router as system_router
from app.handlers.users import router as users_router
from app.handlers.recipes import router as recipes_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan event handler."""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Debug mode: {settings.debug}")
    # Masking DB password for log safety
    db_log_url = settings.database_url
    if "@" in db_log_url:
        host_part = db_log_url.split("@")[1]
        db_log_url = f"postgresql://****:****@{host_part}"
    logger.info(f"Database: {db_log_url}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.app_name}")


# Create FastAPI application instance
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Cody Richter Cooks - A culinary platform API built with FastAPI",
    debug=settings.debug,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Include routers
app.include_router(system_router)
app.include_router(users_router)
app.include_router(recipes_router)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint returning basic API information."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs_url": "/docs"
        if settings.debug
        else "Documentation disabled in production",
    }
