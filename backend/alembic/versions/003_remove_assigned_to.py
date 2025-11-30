"""Remove assigned_to from tasks - personal task management

Revision ID: 003
Revises: 002
Create Date: 2025-11-29

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Remove assigned_to column from tasks table
    # Tasks now belong to project owner only
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_constraint('tasks_assigned_to_fkey', type_='foreignkey')
        batch_op.drop_column('assigned_to')


def downgrade() -> None:
    # Add back assigned_to column
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('assigned_to', sa.INTEGER(), nullable=True))
        batch_op.create_foreign_key('tasks_assigned_to_fkey', 'users', ['assigned_to'], ['id'])
