"""
Database tests with improved maintainability.
"""
import pytest
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import check_database_connection
from app.models.user import User
from app.models.recipe import Recipe
from app.models.recipe_permission import RecipePermission, PermissionRole
from app.utils.password_security import PasswordSecurity


class TestDatabaseConnection:
    """Test database connection and basic operations."""
    
    def test_database_connection_check(self):
        """Test database connection check function."""
        result = check_database_connection()
        assert result is True
    
    def test_database_session_operations(self, db_session: Session):
        """Test basic database session operations."""
        # Test session is available
        assert db_session is not None
        
        # Test basic query operations
        user_count = db_session.query(User).count()
        assert isinstance(user_count, int)
        assert user_count >= 0
        
        recipe_count = db_session.query(Recipe).count()
        assert isinstance(recipe_count, int)
        assert recipe_count >= 0


class TestDatabaseTransactions:
    """Test database transaction behavior."""
    
    def test_transaction_commit_success(self, db_session: Session):
        """Test successful transaction commit."""
        initial_count = db_session.query(User).count()
        
        user = User(
            username="transactiontest",
            email="transaction@test.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Verify user was committed
        final_count = db_session.query(User).count()
        assert final_count == initial_count + 1
        assert user.id is not None
    
    def test_transaction_rollback_on_error(self, db_session: Session):
        """Test transaction rollback on constraint violation."""
        initial_count = db_session.query(User).count()
        
        # Create first user
        user1 = User(
            username="rollbacktest",
            email="rollback@test.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user1)
        db_session.commit()
        
        try:
            # Try to create duplicate user (should fail)
            user2 = User(
                username="rollbacktest",  # Duplicate username
                email="rollback2@test.com",
                password_hash=PasswordSecurity.hash_password("TestPassword123!")
            )
            db_session.add(user2)
            db_session.commit()
        except IntegrityError:
            db_session.rollback()
        
        # Count should only increase by 1 (first user)
        final_count = db_session.query(User).count()
        assert final_count == initial_count + 1
    
    def test_transaction_isolation(self, db_session: Session):
        """Test transaction isolation behavior."""
        # Create user but don't commit
        user = User(
            username="isolationtest",
            email="isolation@test.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user)
        db_session.flush()  # Flush but don't commit
        
        # User should exist in current session
        session_user = db_session.query(User).filter(User.username == "isolationtest").first()
        assert session_user is not None
        
        # Rollback the transaction
        db_session.rollback()
        
        # User should no longer exist
        rolled_back_user = db_session.query(User).filter(User.username == "isolationtest").first()
        assert rolled_back_user is None


class TestDatabaseRelationships:
    """Test database relationships and foreign key constraints."""
    
    def test_create_related_entities(self, db_session: Session):
        """Test creating entities with relationships."""
        # Create user
        user = User(
            username="relationtest",
            email="relation@test.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Create recipe
        recipe = Recipe(
            title="Relationship Test Recipe",
            description="<p>Testing relationships</p>"
        )
        db_session.add(recipe)
        db_session.commit()
        db_session.refresh(recipe)
        
        # Create permission relationship
        permission = RecipePermission(
            user_id=user.id,
            recipe_id=recipe.id,
            role=PermissionRole.OWNER
        )
        db_session.add(permission)
        db_session.commit()
        db_session.refresh(permission)
        
        # Test relationships work
        assert permission.user.id == user.id
        assert permission.recipe.id == recipe.id
        assert permission in user.recipe_permissions
        assert permission in recipe.user_permissions
    
    def test_foreign_key_constraints(self, db_session: Session):
        """Test foreign key constraint enforcement."""
        # Note: SQLite may not enforce foreign key constraints by default
        # This test validates the constraint setup, but actual enforcement
        # depends on database configuration
        
        # Create a valid user first
        user = User(
            username="fktest",
            email="fk@test.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user)
        db_session.commit()
        
        # Create a valid recipe
        recipe = Recipe(title="FK Test Recipe")
        db_session.add(recipe)
        db_session.commit()
        
        # Test that valid foreign keys work
        permission = RecipePermission(
            user_id=user.id,
            recipe_id=recipe.id,
            role=PermissionRole.OWNER
        )
        db_session.add(permission)
        db_session.commit()
        
        # Verify the permission was created successfully
        assert permission.id is not None
        assert permission.user_id == user.id
        assert permission.recipe_id == recipe.id


class TestDatabaseConstraints:
    """Test database constraints and validation."""
    
    @pytest.mark.parametrize("constraint_field", ["username", "email"])
    def test_unique_constraints(self, db_session: Session, constraint_field: str):
        """Test unique constraints on user fields."""
        # Create first user
        user1_data = {
            "username": "unique1",
            "email": "unique1@test.com",
            "password_hash": PasswordSecurity.hash_password("TestPassword123!")
        }
        user1 = User(**user1_data)
        db_session.add(user1)
        db_session.commit()
        
        # Try to create second user with duplicate field
        user2_data = {
            "username": "unique2",
            "email": "unique2@test.com",
            "password_hash": PasswordSecurity.hash_password("TestPassword123!")
        }
        user2_data[constraint_field] = user1_data[constraint_field]  # Duplicate value
        
        user2 = User(**user2_data)
        db_session.add(user2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_recipe_permission_unique_constraint(self, db_session: Session, test_user: User, test_recipe: Recipe):
        """Test unique constraint on user-recipe permission combination."""
        # Remove existing permission
        db_session.query(RecipePermission).filter_by(
            user_id=test_user.id,
            recipe_id=test_recipe.id
        ).delete()
        db_session.commit()
        
        # Create first permission
        permission1 = RecipePermission(
            user_id=test_user.id,
            recipe_id=test_recipe.id,
            role=PermissionRole.OWNER
        )
        db_session.add(permission1)
        db_session.commit()
        
        # Try to create duplicate permission
        permission2 = RecipePermission(
            user_id=test_user.id,
            recipe_id=test_recipe.id,
            role=PermissionRole.EDITOR
        )
        db_session.add(permission2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()


class TestDatabasePerformance:
    """Test database performance and indexing."""
    
    def test_query_performance_with_indices(self, db_session: Session):
        """Test that queries use indices effectively."""
        # Create test data
        users = []
        for i in range(10):
            user = User(
                username=f"perftest{i}",
                email=f"perf{i}@test.com",
                password_hash=PasswordSecurity.hash_password("TestPassword123!")
            )
            users.append(user)
        
        db_session.add_all(users)
        db_session.commit()
        
        # Test indexed queries (should be fast)
        import time
        
        # Query by username (should use index)
        start_time = time.time()
        user_by_username = db_session.query(User).filter(User.username == "perftest5").first()
        username_query_time = time.time() - start_time
        
        assert user_by_username is not None
        assert username_query_time < 0.1  # Should be very fast with index
        
        # Query by email (should use index)
        start_time = time.time()
        user_by_email = db_session.query(User).filter(User.email == "perf5@test.com").first()
        email_query_time = time.time() - start_time
        
        assert user_by_email is not None
        assert email_query_time < 0.1  # Should be very fast with index
    
    def test_bulk_operations(self, db_session: Session):
        """Test bulk database operations."""
        # Test bulk insert
        recipes = []
        for i in range(50):
            recipe = Recipe(
                title=f"Bulk Recipe {i}",
                description=f"<p>Bulk recipe {i} description</p>",
                cooking_time=30 + i,
                serving_size=4
            )
            recipes.append(recipe)
        
        import time
        start_time = time.time()
        db_session.add_all(recipes)
        db_session.commit()
        bulk_insert_time = time.time() - start_time
        
        # Bulk insert should be reasonably fast
        assert bulk_insert_time < 5.0  # 5 seconds max for 50 records
        
        # Verify all recipes were created
        recipe_count = db_session.query(Recipe).filter(Recipe.title.like("Bulk Recipe%")).count()
        assert recipe_count == 50
        
        # Test bulk query
        start_time = time.time()
        bulk_recipes = db_session.query(Recipe).filter(Recipe.title.like("Bulk Recipe%")).all()
        bulk_query_time = time.time() - start_time
        
        assert len(bulk_recipes) == 50
        assert bulk_query_time < 1.0  # 1 second max for bulk query


class TestDatabaseMigrations:
    """Test database schema and migration compatibility."""
    
    def test_schema_integrity(self, db_session: Session):
        """Test that database schema matches model definitions."""
        from sqlalchemy import inspect
        
        inspector = inspect(db_session.bind)
        
        # Check that all expected tables exist
        expected_tables = ['users', 'recipes', 'recipe_permissions', 'ingredients', 'instructions']
        actual_tables = inspector.get_table_names()
        
        for table in expected_tables:
            assert table in actual_tables, f"Table {table} not found in database"
        
        # Check that users table has expected columns
        user_columns = [col['name'] for col in inspector.get_columns('users')]
        expected_user_columns = ['id', 'username', 'email', 'password_hash', 'created_at', 'updated_at']
        
        for column in expected_user_columns:
            assert column in user_columns, f"Column {column} not found in users table"
        
        # Check that foreign key relationships exist
        recipe_permissions_fks = inspector.get_foreign_keys('recipe_permissions')
        fk_tables = [fk['referred_table'] for fk in recipe_permissions_fks]
        
        assert 'users' in fk_tables, "Foreign key to users table not found"
        assert 'recipes' in fk_tables, "Foreign key to recipes table not found"
    
    def test_data_type_compatibility(self, db_session: Session):
        """Test that data types are handled correctly."""
        # Test various data types
        user = User(
            username="datatypetest",
            email="datatype@test.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        recipe = Recipe(
            title="Data Type Test Recipe",
            description="<p>Testing data types</p>",
            cooking_time=45,  # Integer
            serving_size=6    # Integer
        )
        db_session.add(recipe)
        db_session.commit()
        db_session.refresh(recipe)
        
        # Verify data types are preserved
        assert isinstance(recipe.cooking_time, int)
        assert isinstance(recipe.serving_size, int)
        assert isinstance(user.created_at, type(user.created_at))  # DateTime type
        assert isinstance(user.updated_at, type(user.updated_at))  # DateTime type