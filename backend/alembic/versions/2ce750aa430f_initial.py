"""initial

Revision ID: 2ce750aa430f
Revises:
Create Date: 2026-01-07 17:47:54
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import geoalchemy2

revision: str = "2ce750aa430f"
down_revision: Union[str, None] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable PostGIS FIRST
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # ---------- GUIDELINES ----------
    op.create_table(
        "guidelines",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("author_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "phase",
            sa.Enum("BEFORE", "DURING", "AFTER", name="guideline_phase"),
            nullable=False,
        ),
        sa.Column(
            "hazard_type",
            sa.Enum(
                "FLOOD",
                "CYCLONE",
                "EARTHQUAKE",
                "HEATWAVE",
                "LANDSLIDE",
                "GENERIC",
                name="hazard_type",
            ),
            nullable=False,
        ),
        sa.Column(
            "region",
            geoalchemy2.Geometry("POLYGON", srid=4326),
        ),
        sa.Column("language_code", sa.String(10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        )
        
        ,
    )

    op.execute("""
CREATE INDEX IF NOT EXISTS idx_guidelines_region
ON guidelines USING gist (region)
""")

    # ---------- USERS ----------
    op.create_table(
        
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "CITIZEN",
                "VOLUNTEER",
                "NGO",
                "ADMIN",
                "OFFICIAL",
                name="user_role",
            ),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean, server_default=sa.true()),
    )

    # ---------- EMERGENCY CONTACTS ----------
    op.create_table(
        "emergency_contacts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("relationship", sa.String(50)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ---------- INCIDENTS ----------
    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column(
            "severity",
            sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="incident_severity"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "NEW",
                "VERIFIED",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED",
                name="incident_status",
            ),
            nullable=False,
        ),
        sa.Column("location", geoalchemy2.Geometry("POINT", srid=4326)),
        sa.Column("reporter_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("media_urls", sa.ARRAY(sa.String)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    op.execute("""
CREATE INDEX IF NOT EXISTS idx_incidents_location
ON incidents USING gist (location)
""")

    # ---------- TASKS ----------
    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING",
                "ASSIGNED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
                name="task_status",
            ),
            nullable=False,
        ),
        sa.Column(
            "priority",
            sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="task_priority"),
            nullable=False,
        ),
        sa.Column("incident_id", sa.Integer, sa.ForeignKey("incidents.id")),
        sa.Column("assignee_id", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("metadata", sa.JSON),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("tasks")
    op.drop_table("incidents")
    op.drop_table("emergency_contacts")
    op.drop_table("users")
    op.drop_table("guidelines")

    # Drop ENUMs explicitly
    op.execute("DROP TYPE IF EXISTS task_priority")
    op.execute("DROP TYPE IF EXISTS task_status")
    op.execute("DROP TYPE IF EXISTS incident_status")
    op.execute("DROP TYPE IF EXISTS incident_severity")
    op.execute("DROP TYPE IF EXISTS user_role")
    op.execute("DROP TYPE IF EXISTS hazard_type")
    op.execute("DROP TYPE IF EXISTS guideline_phase")
