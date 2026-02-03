"""merge all heads

Revision ID: e33af5cdf316
Revises: a4ba4f400134, fa33a360944f
Create Date: 2026-01-27 19:39:17.507046

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e33af5cdf316'
down_revision: Union[str, None] = ('a4ba4f400134', 'fa33a360944f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
