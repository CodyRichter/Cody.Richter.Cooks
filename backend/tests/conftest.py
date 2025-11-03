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
from app.core.config import settings
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
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
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
        password_hash=PasswordSecurity.hash_password("TestPassword123!")  # Strong password for new validation
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
        password_hash=PasswordSecurity.hash_password("TestPassword123!")  # Strong password for new validation
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
        cooking_time=30,
        serving_size=4
    )
    db_session.add(recipe)
    db_session.commit()
    db_session.refresh(recipe)
    
    # Add owner permission
    permission = RecipePermission(
        user_id=test_user.id,
        recipe_id=recipe.id,
        role=PermissionRole.OWNER
    )
    db_session.add(permission)
    db_session.commit()
    
    return recipe


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


# Common test data fixtures
@pytest.fixture
def sample_recipe_data() -> dict:
    """Sample recipe data for testing."""
    return {
        "title": "Test Recipe",
        "description": "<p>This is a test recipe description</p>",
        "cooking_time": 30,
        "serving_size": 4,
        "tags": ["test", "sample"]
    }


@pytest.fixture
def sample_ingredient_data() -> dict:
    """Sample ingredient data for testing."""
    return {
        "name": "Test Ingredient",
        "quantity": 1.0,
        "unit": "cup",
        "subtext": "fresh",
        "order_index": 0
    }


@pytest.fixture
def sample_instruction_data() -> dict:
    """Sample instruction data for testing."""
    return {
        "title": "Test Step",
        "description": "<p>Do something</p>",
        "step_number": 1,
        "timing": 5
    }


@pytest.fixture
def mock_request():
    """Create a mock FastAPI request object."""
    mock_req = Mock()
    mock_req.headers = {"user-agent": "Test Browser"}
    mock_req.method = "POST"
    mock_req.url.path = "/test"
    mock_req.client.host = "192.168.1.100"
    return mock_req


@pytest.fixture
def recipe_with_nested_data(db_session: Session, test_user: User) -> Recipe:
    """Create a recipe with ingredients and instructions for testing."""
    recipe = Recipe(
        title="Complete Test Recipe",
        description="<p>Recipe with nested data</p>",
        cooking_time=45,
        serving_size=6
    )
    db_session.add(recipe)
    db_session.commit()
    db_session.refresh(recipe)
    
    # Add owner permission
    permission = RecipePermission(
        user_id=test_user.id,
        recipe_id=recipe.id,
        role=PermissionRole.OWNER
    )
    db_session.add(permission)
    
    # Add ingredients
    ingredient1 = Ingredient(
        name="Flour",
        quantity=2.0,
        unit="cups",
        subtext="all-purpose",
        order_index=0,
        recipe_id=recipe.id
    )
    ingredient2 = Ingredient(
        name="Sugar",
        quantity=1.0,
        unit="cup",
        order_index=1,
        recipe_id=recipe.id
    )
    db_session.add_all([ingredient1, ingredient2])
    
    # Add instructions
    instruction1 = Instruction(
        title="Mix Ingredients",
        description="<p>Combine dry ingredients</p>",
        step_number=1,
        timing=5,
        recipe_id=recipe.id
    )
    instruction2 = Instruction(
        title="Bake",
        description="<p>Bake in preheated oven</p>",
        step_number=2,
        timing=25,
        recipe_id=recipe.id
    )
    db_session.add_all([instruction1, instruction2])
    
    db_session.commit()
    return recipe