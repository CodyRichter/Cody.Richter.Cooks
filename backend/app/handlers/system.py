from fastapi import APIRouter, status
from pydantic import BaseModel
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database import check_database_connection

router = APIRouter(prefix="/api/v1/system", tags=["system"])


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str
    timestamp: datetime
    version: str
    database_connected: bool
    service: str


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Check the health status of the API service and its dependencies"
)
async def health_check() -> HealthResponse:
    """
    Health check endpoint that verifies service status and database connectivity.
    
    Returns:
        HealthResponse: Service health information including database status
    """
    db_connected = check_database_connection()
    
    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        timestamp=datetime.now(timezone.utc),
        version=settings.app_version,
        database_connected=db_connected,
        service=settings.app_name
    )