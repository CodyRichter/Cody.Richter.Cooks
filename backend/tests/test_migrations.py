"""
Guards that the Alembic migration history matches the SQLAlchemy models.
"""

import pytest
from alembic import command
from alembic.config import Config


@pytest.mark.database
def test_models_have_no_unmigrated_changes(alembic_cfg: Config):
    """Fails when a model changes without a matching migration."""
    command.check(alembic_cfg)
