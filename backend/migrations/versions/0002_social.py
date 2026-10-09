"""Social library models

Revision ID: 0002
Revises: 0001
"""
from alembic import op
from app.social_models import Shelf, ShelfBook, Review, Club, ClubMember, Like
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    for cls in (Shelf,ShelfBook,Review,Club,ClubMember,Like):
        cls.__table__.create(bind=bind,checkfirst=True)

def downgrade():
    bind = op.get_bind()
    for cls in (Like,ClubMember,Club,Review,ShelfBook,Shelf):
        cls.__table__.drop(bind=bind,checkfirst=True)
