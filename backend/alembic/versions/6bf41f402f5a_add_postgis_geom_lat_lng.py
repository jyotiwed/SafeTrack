"""add postgis geom lat lng

Revision ID: 6bf41f402f5a
Revises: None
Create Date: 2026-xx-xx
"""

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry


# ✅ REQUIRED by Alembic
revision = "6bf41f402f5a"
down_revision = None
branch_labels = None
depends_on = None
def upgrade() -> None:
    # Add 'geom', 'latitude', and 'longitude' columns to 'incidents' table
    op.add_column(
        "incidents",
        sa.Column("geom", Geometry(geometry_type="POINT", srid=4326), nullable=True),
    )
    op.add_column(
        "incidents",
        sa.Column("latitude", sa.Float(), nullable=True),
    )
    op.add_column(
        "incidents",
        sa.Column("longitude", sa.Float(), nullable=True),
    )
    
def downgrade() -> None:
    # Remove 'geom', 'latitude', and 'longitude' columns from 'incidents' table
    op.drop_column("incidents", "longitude")
    op.drop_column("incidents", "latitude")
    op.drop_column("incidents", "geom") 