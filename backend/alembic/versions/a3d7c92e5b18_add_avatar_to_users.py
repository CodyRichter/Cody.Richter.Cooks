"""Add avatar columns to users

Revision ID: a3d7c92e5b18
Revises: f5a091759484
Create Date: 2026-11-05 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a3d7c92e5b18"
down_revision = "f5a091759484"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_data", sa.LargeBinary(), nullable=True))
    op.add_column(
        "users", sa.Column("avatar_content_type", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column("avatar_updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_updated_at")
    op.drop_column("users", "avatar_content_type")
    op.drop_column("users", "avatar_data")
