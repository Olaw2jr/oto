"""Refresh sessions

Revision ID: 0003
Revises: 0002
"""
from alembic import op
from app.auth_sessions import RefreshSession
revision="0003"
down_revision="0002"
branch_labels=None
depends_on=None
def upgrade():
    RefreshSession.__table__.create(bind=op.get_bind(),checkfirst=True)
def downgrade():
    RefreshSession.__table__.drop(bind=op.get_bind(),checkfirst=True)
