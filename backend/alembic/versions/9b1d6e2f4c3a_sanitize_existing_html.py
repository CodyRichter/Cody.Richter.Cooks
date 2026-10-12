"""Sanitize existing recipe and instruction HTML

Rows written before server-side sanitization may contain event-handler
attributes or javascript: URLs. Re-run them through the current sanitizer.

Revision ID: 9b1d6e2f4c3a
Revises: 5e79bf3576e2
Create Date: 2026-10-12 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

from app.utils.html_validator import sanitize_html


# revision identifiers, used by Alembic.
revision = "9b1d6e2f4c3a"
down_revision = "5e79bf3576e2"
branch_labels = None
depends_on = None


def _sanitize_column(table: str) -> None:
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(f"SELECT id, description FROM {table} WHERE description IS NOT NULL")
    ).fetchall()
    for row_id, description in rows:
        cleaned = sanitize_html(description)
        if cleaned != description:
            conn.execute(
                sa.text(f"UPDATE {table} SET description = :d WHERE id = :id"),
                {"d": cleaned, "id": row_id},
            )


def upgrade() -> None:
    _sanitize_column("recipes")
    _sanitize_column("instructions")


def downgrade() -> None:
    # Sanitization is lossy by design; nothing to restore.
    pass
