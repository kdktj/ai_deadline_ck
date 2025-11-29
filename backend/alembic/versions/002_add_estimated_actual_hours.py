"""Add estimated_hours and actual_hours to tasks

Revision ID: 002
Revises: 001
Create Date: 2025-11-26

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add estimated_hours and actual_hours columns to tasks table"""
    op.add_column('tasks', sa.Column('estimated_hours', sa.Float(), nullable=True))
    op.add_column('tasks', sa.Column('actual_hours', sa.Float(), nullable=True))


def downgrade() -> None:
    """Remove estimated_hours and actual_hours columns from tasks table"""
    op.drop_column('tasks', 'actual_hours')
    op.drop_column('tasks', 'estimated_hours')
