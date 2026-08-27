"""
Pytest configuration and fixtures for backend tests.
"""

import pytest
import asyncio
from typing import Generator, AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from httpx import AsyncClient
from unittest.mock import Mock

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.recipe import Recipe
from app.models.recipe_permission import RecipePermission, PermissionRole
from app.models.ingredient import Ingredient
from app.models.instruction import Instruction
from app.utils.auth import create_access_token
from app.utils.password_security import PasswordSecurity


# Test database URL - use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)

    # Create session
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database session override."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def async_client(db_session: Session) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client with database session override."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as async_test_client:
        yield async_test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=PasswordSecurity.hash_password(
            "TestPassword123!"
        ),  # Strong password for new validation
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user2(db_session: Session) -> User:
    """Create a second test user."""
    user = User(
        username="testuser2",
        email="test2@example.com",
        password_hash=PasswordSecurity.hash_password(
            "TestPassword123!"
        ),  # Strong password for new validation
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session: Session) -> User:
    """Create an admin user."""
    user = User(
        username="adminuser",
        email="admin@example.com",
        password_hash=PasswordSecurity.hash_password("AdminPassword123!"),
        is_admin=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_recipe(db_session: Session, test_user: User) -> Recipe:
    """Create a test recipe."""
    recipe = Recipe(
        title="Test Recipe",
        description="<p>This is a test recipe description</p>",
        tags=["test", "recipe"],
        cooking_time=30,
        serving_size=4,
    )
    db_session.add(recipe)
    db_session.commit()
    db_session.refresh(recipe)

    # Add owner permission
    permission = RecipePermission(
        recipe_id=recipe.id, user_id=test_user.id, role=PermissionRole.OWNER
    )
    db_session.add(permission)
    db_session.commit()

    return recipe


@pytest.fixture
def test_recipe_with_details(db_session: Session, test_user: User) -> Recipe:
    """Create a test recipe with ingredients and instructions."""
    recipe = Recipe(
        title="Detailed Test Recipe",
        description="<p>This is a detailed test recipe description</p>",
        tags=["test", "detailed"],
        cooking_time=45,
        serving_size=6,
    )
    db_session.add(recipe)
    db_session.commit()
    db_session.refresh(recipe)

    # Add owner permission
    permission = RecipePermission(
        recipe_id=recipe.id, user_id=test_user.id, role=PermissionRole.OWNER
    )
    db_session.add(permission)

    # Add ingredients
    ingredients = [
        Ingredient(
            recipe_id=recipe.id,
            name="Flour",
            quantity=2.0,
            unit="cups",
            subtext="all-purpose",
            order_index=0,
        ),
        Ingredient(
            recipe_id=recipe.id,
            name="Sugar",
            quantity=1.0,
            unit="cup",
            subtext="granulated",
            order_index=1,
        ),
    ]
    for ingredient in ingredients:
        db_session.add(ingredient)

    # Add instructions
    instructions = [
        Instruction(
            recipe_id=recipe.id,
            step_number=1,
            title="Mix dry ingredients",
            description="<p>Mix flour and sugar in a bowl</p>",
            timing=5,
        ),
        Instruction(
            recipe_id=recipe.id,
            step_number=2,
            title="Bake",
            description="<p>Bake in preheated oven at 350°F</p>",
            timing=30,
        ),
    ]
    for instruction in instructions:
        db_session.add(instruction)

    db_session.commit()
    db_session.refresh(recipe)
    return recipe


@pytest.fixture
def sample_recipe_data() -> dict:
    """Create sample recipe payload for tests."""
    return {
        "title": "New Test Recipe",
        "description": "<p>A delicious recipe</p>",
        "tags": ["dinner", "easy"],
        "cooking_time": 30,
        "serving_size": 4,
    }


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Create authentication headers for test user."""
    access_token = create_access_token(data={"sub": test_user.username})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def auth_headers_user2(test_user2: User) -> dict:
    """Create authentication headers for second test user."""
    access_token = create_access_token(data={"sub": test_user2.username})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def admin_auth_headers(admin_user: User) -> dict:
    """Create authentication headers for admin user."""
    access_token = create_access_token(data={"sub": admin_user.username})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def auth_headers_admin(admin_auth_headers: dict) -> dict:
    """Alias for admin_auth_headers."""
    return admin_auth_headers


@pytest.fixture
def mock_request():
    """Create a mock Request object for testing."""
    request = Mock()
    request.client = Mock()
    request.client.host = "127.0.0.1"
    request.headers = {"user-agent": "test-agent"}
    request.method = "POST"
    request.url = Mock()
    request.url.path = "/test"
    request.session = {}
    return request
