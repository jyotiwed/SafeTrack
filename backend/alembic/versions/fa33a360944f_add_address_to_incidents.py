"""add address to incidents

Revision ID: fa33a360944f
Revises: 6bf41f402f5a
Create Date: 2026-01-11 18:43:47.222806

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa33a360944f'
down_revision: Union[str, None] = '6bf41f402f5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "incidents",
        sa.Column("address", sa.String(length=255), nullable=True),
    )



def downgrade() -> None:
     op.drop_column("incidents", "address")
