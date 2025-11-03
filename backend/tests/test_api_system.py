"""
Integration tests for System API endpoints.
"""
import pytest
from fastapi.testclient import TestClient


class TestSystemEndpoints:
    """Test cases for system monitoring endpoints."""
    
    def test_health_check_success(self, client: TestClient):
        """Test health check endpoint returns success."""
        response = client.get("/api/v1/system/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "database_connected" in data
        assert "version" in data
        assert "service" in data
        assert data["database_connected"] is True
        assert data["service"] == "Cody Richter Cooks API"
    
    def test_root_endpoint(self, client: TestClient):
        """Test root endpoint returns basic API information."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "docs_url" in data
        assert "Cody Richter Cooks API" in data["message"]