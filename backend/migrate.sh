#!/bin/sh
# Applies Alembic migrations; run by the cooking-backend-migrate Cloud Run Job.
# Supabase's transaction pooler (port 6543) can't run DDL migrations reliably,
# so switch to the session-mode port.
set -e
DATABASE_URL="$(echo "$DATABASE_URL" | sed 's/:6543\//:5432\//')"
export DATABASE_URL
exec alembic upgrade head
