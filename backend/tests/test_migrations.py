"""
Guards that the Alembic migration history matches the SQLAlchemy models.
"""

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from tests.conftest import test_engine


@pytest.mark.database
def test_models_have_no_unmigrated_changes(alembic_cfg: Config):
    """Fails when a model changes without a matching migration."""
    command.check(alembic_cfg)


@pytest.mark.database
def test_avatar_migration_downgrades_and_upgrades(alembic_cfg: Config):
    """The avatar columns are removed on downgrade and restored on upgrade."""
    avatar_columns = {"avatar_data", "avatar_content_type", "avatar_updated_at"}

    def user_columns() -> set[str]:
        return {column["name"] for column in inspect(test_engine).get_columns("users")}

    assert avatar_columns <= user_columns()
    command.downgrade(alembic_cfg, "-1")
    try:
        assert not avatar_columns & user_columns()
    finally:
        command.upgrade(alembic_cfg, "head")
    assert avatar_columns <= user_columns()
