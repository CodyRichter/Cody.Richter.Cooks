from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database import check_database_connection

router = APIRouter(prefix="/api/v1/system", tags=["system"])


class HealthcheckResponse(BaseModel):
    """Health check response schema."""

    status: str
    timestamp: datetime
    version: str
    database_connected: bool
    service: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "timestamp": "2026-01-15T12:00:00Z",
                "version": "1.0.0",
                "database_connected": True,
                "service": "Cody Richter Cooks API",
            }
        }
    )


@router.get(
    "/health/",
    response_model=HealthcheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Check API and Database Health",
    description="Check the operational health status of the API service and its database connectivity. Use this tool to verify system availability before executing recipe or authentication operations.",
)
async def health_check() -> HealthcheckResponse:
    """
    Health check endpoint that verifies service status and database connectivity.

    Returns:
        HealthcheckResponse: Service health information including database status
    """
    db_connected = check_database_connection()

    return HealthcheckResponse(
        status="healthy" if db_connected else "degraded",
        timestamp=datetime.now(timezone.utc),
        version=settings.app_version,
        database_connected=db_connected,
        service=settings.app_name,
    )
