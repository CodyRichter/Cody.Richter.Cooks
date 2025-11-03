"""convert_ids_to_secure_strings

Revision ID: 0c9039fa718a
Revises: 7bca4308db77
Create Date: 2025-10-29 16:43:06.834402

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import secrets
import string


# revision identifiers, used by Alembic.
revision = '0c9039fa718a'
down_revision = '7bca4308db77'
branch_labels = None
depends_on = None


def generate_secure_id(object_type: str) -> str:
    """Generate a secure ID for the given object type."""
    type_prefixes = {
        'user': 'U',
        'recipe': 'R', 
        'ingredient': 'I',
        'instruction': 'IN',
        'recipe_permission': 'RP',
        'security_audit_log': 'SA'
    }
    
    valid_chars = string.digits + string.ascii_uppercase
    prefix = type_prefixes[object_type]
    
    # Generate two 5-character segments
    segment1 = ''.join(secrets.choice(valid_chars) for _ in range(5))
    segment2 = ''.join(secrets.choice(valid_chars) for _ in range(5))
    
    return f"{prefix}-{segment1}-{segment2}"


def upgrade() -> None:
    """
    Migrate from integer IDs to secure string IDs.
    This is a complex migration that preserves all relationships.
    """
    connection = op.get_bind()
    
    # Step 1: Add new string ID columns
    # Note: Migration progress logged to alembic output
    op.add_column('users', sa.Column('new_id', sa.String(15), nullable=True))
    op.add_column('recipes', sa.Column('new_id', sa.String(15), nullable=True))
    op.add_column('ingredients', sa.Column('new_id', sa.String(15), nullable=True))
    op.add_column('ingredients', sa.Column('new_recipe_id', sa.String(15), nullable=True))
    op.add_column('instructions', sa.Column('new_id', sa.String(15), nullable=True))
    op.add_column('instructions', sa.Column('new_recipe_id', sa.String(15), nullable=True))
    op.add_column('recipe_permissions', sa.Column('new_id', sa.String(17), nullable=True))
    op.add_column('recipe_permissions', sa.Column('new_user_id', sa.String(15), nullable=True))
    op.add_column('recipe_permissions', sa.Column('new_recipe_id', sa.String(15), nullable=True))
    op.add_column('recipe_permissions', sa.Column('new_granted_by', sa.String(15), nullable=True))
    op.add_column('security_audit_logs', sa.Column('new_id', sa.String(17), nullable=True))
    op.add_column('security_audit_logs', sa.Column('new_user_id', sa.String(15), nullable=True))
    
    # Step 2: Generate new IDs for users
    users = connection.execute(text("SELECT id FROM users ORDER BY id")).fetchall()
    user_id_mapping = {}
    for user in users:
        old_id = user[0]
        new_id = generate_secure_id('user')
        user_id_mapping[old_id] = new_id
        connection.execute(
            text("UPDATE users SET new_id = :new_id WHERE id = :old_id"),
            {"new_id": new_id, "old_id": old_id}
        )
    
    # Step 3: Generate new IDs for recipes
    recipes = connection.execute(text("SELECT id FROM recipes ORDER BY id")).fetchall()
    recipe_id_mapping = {}
    for recipe in recipes:
        old_id = recipe[0]
        new_id = generate_secure_id('recipe')
        recipe_id_mapping[old_id] = new_id
        connection.execute(
            text("UPDATE recipes SET new_id = :new_id WHERE id = :old_id"),
            {"new_id": new_id, "old_id": old_id}
        )
    
    # Step 4: Generate new IDs for ingredients and update recipe references
    ingredients = connection.execute(text("SELECT id, recipe_id FROM ingredients ORDER BY id")).fetchall()
    for ingredient in ingredients:
        old_id, old_recipe_id = ingredient
        new_id = generate_secure_id('ingredient')
        new_recipe_id = recipe_id_mapping[old_recipe_id]
        connection.execute(
            text("UPDATE ingredients SET new_id = :new_id, new_recipe_id = :new_recipe_id WHERE id = :old_id"),
            {"new_id": new_id, "new_recipe_id": new_recipe_id, "old_id": old_id}
        )
    
    # Step 5: Generate new IDs for instructions and update recipe references
    instructions = connection.execute(text("SELECT id, recipe_id FROM instructions ORDER BY id")).fetchall()
    for instruction in instructions:
        old_id, old_recipe_id = instruction
        new_id = generate_secure_id('instruction')
        new_recipe_id = recipe_id_mapping[old_recipe_id]
        connection.execute(
            text("UPDATE instructions SET new_id = :new_id, new_recipe_id = :new_recipe_id WHERE id = :old_id"),
            {"new_id": new_id, "new_recipe_id": new_recipe_id, "old_id": old_id}
        )
    
    # Step 6: Generate new IDs for recipe_permissions and update all references
    permissions = connection.execute(text("SELECT id, user_id, recipe_id, granted_by FROM recipe_permissions ORDER BY id")).fetchall()
    for permission in permissions:
        old_id, old_user_id, old_recipe_id, old_granted_by = permission
        new_id = generate_secure_id('recipe_permission')
        new_user_id = user_id_mapping[old_user_id]
        new_recipe_id = recipe_id_mapping[old_recipe_id]
        new_granted_by = user_id_mapping[old_granted_by] if old_granted_by else None
        
        connection.execute(
            text("""UPDATE recipe_permissions 
                    SET new_id = :new_id, new_user_id = :new_user_id, 
                        new_recipe_id = :new_recipe_id, new_granted_by = :new_granted_by 
                    WHERE id = :old_id"""),
            {
                "new_id": new_id, "new_user_id": new_user_id, 
                "new_recipe_id": new_recipe_id, "new_granted_by": new_granted_by,
                "old_id": old_id
            }
        )
    
    # Step 7: Generate new IDs for security_audit_logs and update user references
    logs = connection.execute(text("SELECT id, user_id FROM security_audit_logs ORDER BY id")).fetchall()
    for log in logs:
        old_id, old_user_id = log
        new_id = generate_secure_id('security_audit_log')
        new_user_id = user_id_mapping[old_user_id] if old_user_id else None
        
        connection.execute(
            text("UPDATE security_audit_logs SET new_id = :new_id, new_user_id = :new_user_id WHERE id = :old_id"),
            {"new_id": new_id, "new_user_id": new_user_id, "old_id": old_id}
        )
    
    # Step 8: Drop foreign key constraints
    op.drop_constraint('ingredients_recipe_id_fkey', 'ingredients', type_='foreignkey')
    op.drop_constraint('instructions_recipe_id_fkey', 'instructions', type_='foreignkey')
    op.drop_constraint('recipe_permissions_user_id_fkey', 'recipe_permissions', type_='foreignkey')
    op.drop_constraint('recipe_permissions_recipe_id_fkey', 'recipe_permissions', type_='foreignkey')
    op.drop_constraint('recipe_permissions_granted_by_fkey', 'recipe_permissions', type_='foreignkey')
    op.drop_constraint('security_audit_logs_user_id_fkey', 'security_audit_logs', type_='foreignkey')
    
    # Step 9: Drop old columns and rename new ones
    
    # Users table
    op.drop_column('users', 'id')
    op.alter_column('users', 'new_id', new_column_name='id', nullable=False)
    op.create_primary_key('users_pkey', 'users', ['id'])
    
    # Recipes table  
    op.drop_column('recipes', 'id')
    op.alter_column('recipes', 'new_id', new_column_name='id', nullable=False)
    op.create_primary_key('recipes_pkey', 'recipes', ['id'])
    
    # Ingredients table
    op.drop_column('ingredients', 'id')
    op.drop_column('ingredients', 'recipe_id')
    op.alter_column('ingredients', 'new_id', new_column_name='id', nullable=False)
    op.alter_column('ingredients', 'new_recipe_id', new_column_name='recipe_id', nullable=False)
    op.create_primary_key('ingredients_pkey', 'ingredients', ['id'])
    
    # Instructions table
    op.drop_column('instructions', 'id')
    op.drop_column('instructions', 'recipe_id')
    op.alter_column('instructions', 'new_id', new_column_name='id', nullable=False)
    op.alter_column('instructions', 'new_recipe_id', new_column_name='recipe_id', nullable=False)
    op.create_primary_key('instructions_pkey', 'instructions', ['id'])
    
    # Recipe permissions table
    op.drop_column('recipe_permissions', 'id')
    op.drop_column('recipe_permissions', 'user_id')
    op.drop_column('recipe_permissions', 'recipe_id')
    op.drop_column('recipe_permissions', 'granted_by')
    op.alter_column('recipe_permissions', 'new_id', new_column_name='id', nullable=False)
    op.alter_column('recipe_permissions', 'new_user_id', new_column_name='user_id', nullable=False)
    op.alter_column('recipe_permissions', 'new_recipe_id', new_column_name='recipe_id', nullable=False)
    op.alter_column('recipe_permissions', 'new_granted_by', new_column_name='granted_by', nullable=True)
    op.create_primary_key('recipe_permissions_pkey', 'recipe_permissions', ['id'])
    
    # Security audit logs table
    op.drop_column('security_audit_logs', 'id')
    op.drop_column('security_audit_logs', 'user_id')
    op.alter_column('security_audit_logs', 'new_id', new_column_name='id', nullable=False)
    op.alter_column('security_audit_logs', 'new_user_id', new_column_name='user_id', nullable=True)
    op.create_primary_key('security_audit_logs_pkey', 'security_audit_logs', ['id'])
    
    # Step 10: Recreate foreign key constraints
    op.create_foreign_key('ingredients_recipe_id_fkey', 'ingredients', 'recipes', ['recipe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('instructions_recipe_id_fkey', 'instructions', 'recipes', ['recipe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('recipe_permissions_user_id_fkey', 'recipe_permissions', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('recipe_permissions_recipe_id_fkey', 'recipe_permissions', 'recipes', ['recipe_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('recipe_permissions_granted_by_fkey', 'recipe_permissions', 'users', ['granted_by'], ['id'])
    op.create_foreign_key('security_audit_logs_user_id_fkey', 'security_audit_logs', 'users', ['user_id'], ['id'])
    
    # Step 11: Recreate indexes
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_recipes_id', 'recipes', ['id'])
    op.create_index('ix_ingredients_id', 'ingredients', ['id'])
    op.create_index('ix_ingredients_recipe_id', 'ingredients', ['recipe_id'])
    op.create_index('ix_instructions_id', 'instructions', ['id'])
    op.create_index('ix_instructions_recipe_id', 'instructions', ['recipe_id'])
    op.create_index('ix_recipe_permissions_id', 'recipe_permissions', ['id'])
    op.create_index('ix_recipe_permissions_user_id', 'recipe_permissions', ['user_id'])
    op.create_index('ix_recipe_permissions_recipe_id', 'recipe_permissions', ['recipe_id'])
    op.create_index('ix_security_audit_logs_id', 'security_audit_logs', ['id'])
    op.create_index('ix_security_audit_logs_user_id', 'security_audit_logs', ['user_id'])
    
    # Migration completed successfully


def downgrade() -> None:
    """
    Downgrade is not supported for this migration as it would require 
    recreating the original integer sequences and could cause data loss.
    """
    raise NotImplementedError(
        "Downgrade is not supported for this migration. "
        "The conversion from secure string IDs back to integer IDs "
        "would require complex data mapping and could cause data loss."
    )