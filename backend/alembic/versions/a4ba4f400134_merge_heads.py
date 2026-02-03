"""merge heads

Revision ID: a4ba4f400134
Revises: 1caf127e97f1, 45366df63247
Create Date: 2026-01-10 16:34:30.587849

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4ba4f400134'
down_revision: Union[str, None] = ('1caf127e97f1', '45366df63247')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
