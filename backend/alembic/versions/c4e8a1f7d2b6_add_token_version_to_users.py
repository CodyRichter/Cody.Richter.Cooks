"""Add token_version to users

Revision ID: c4e8a1f7d2b6
Revises: 9b1d6e2f4c3a
Create Date: 2026-10-12 13:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4e8a1f7d2b6"
down_revision = "9b1d6e2f4c3a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("token_version", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "token_version")
