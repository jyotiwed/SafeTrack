"""fix_enum_case

Revision ID: 1caf127e97f1
Revises: aa492008f76b
Create Date: 2026-01-10 14:15:56.425777

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
# revision identifiers, used by Alembic.
revision: str = "1caf127e97f1"
down_revision: Union[str, None] = "2ce750aa430f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
     op.execute("ALTER TABLE incidents ALTER COLUMN severity TYPE varchar(20)")
    
    # Drop the old enum
     op.execute("DROP TYPE incident_severity")
    
    # Create new enum with lowercase values
     op.execute("CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical')")
    
    # Convert column back to enum
     op.execute("ALTER TABLE incidents ALTER COLUMN severity TYPE incident_severity USING severity::incident_severity")
  


def downgrade() -> None:
     op.execute("ALTER TABLE incidents ALTER COLUMN severity TYPE varchar(20)")
     op.execute("DROP TYPE incident_severity")
     op.execute("CREATE TYPE incident_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')")
     op.execute("ALTER TABLE incidents ALTER COLUMN severity TYPE incident_severity USING severity::incident_severity")
    
    
