"""add author_id to guidelines

Revision ID: 45366df63247
Revises: 2ce750aa430f
Create Date: 2026-01-08 09:58:55.999844
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "45366df63247"
down_revision: Union[str, None] = "2ce750aa430f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # emergency_contacts
    op.alter_column(
        "emergency_contacts",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=("now()"),
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_emergency_contacts_created_at'
    ) THEN
        CREATE INDEX ix_emergency_contacts_created_at
        ON emergency_contacts (created_at);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_emergency_contacts_id'
    ) THEN
        CREATE INDEX ix_emergency_contacts_id
        ON emergency_contacts (id);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_emergency_contacts_user_id'
    ) THEN
        CREATE INDEX ix_emergency_contacts_user_id
        ON emergency_contacts (user_id);
    END IF;
END$$;
"""
    )

    # guidelines: add author_id + FK
    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'guidelines'
          AND column_name = 'author_id'
    ) THEN
        ALTER TABLE guidelines
        ADD COLUMN author_id INTEGER;
    END IF;
END$$;
"""
    )

    op.create_foreign_key(
        "fk_guidelines_author_id_users",
        "guidelines",
        "users",
        ["author_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.alter_column(
        "guidelines",
        "author_id",
        existing_type=sa.INTEGER(),
        nullable=False,
    )
    op.alter_column(
        "guidelines",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "guidelines",
        "updated_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=("now()"),
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_guidelines_created_at'
    ) THEN
        CREATE INDEX ix_guidelines_created_at
        ON guidelines (created_at);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_guidelines_hazard_type'
    ) THEN
        CREATE INDEX ix_guidelines_hazard_type
        ON guidelines (hazard_type);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_guidelines_id'
    ) THEN
        CREATE INDEX ix_guidelines_id
        ON guidelines (id);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_guidelines_language_code'
    ) THEN
        CREATE INDEX ix_guidelines_language_code
        ON guidelines (language_code);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_guidelines_phase'
    ) THEN
        CREATE INDEX ix_guidelines_phase
        ON guidelines (phase);
    END IF;
END$$;
"""
    )

    # incidents
    op.alter_column(
        "incidents",
        "description",
        existing_type=sa.TEXT(),
        type_=sa.String(),
        existing_nullable=False,
    )
    op.alter_column(
        "incidents",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "incidents",
        "updated_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=("now()"),
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_incidents_created_at'
    ) THEN
        CREATE INDEX ix_incidents_created_at
        ON incidents (created_at);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_incidents_id'
    ) THEN
        CREATE INDEX ix_incidents_id
        ON incidents (id);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_incidents_location'
    ) THEN
        CREATE INDEX ix_incidents_location
        ON incidents (location);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_incidents_reporter_id'
    ) THEN
        CREATE INDEX ix_incidents_reporter_id
        ON incidents (reporter_id);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_incidents_severity'
    ) THEN
        CREATE INDEX ix_incidents_severity
        ON incidents (severity);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_incidents_status'
    ) THEN
        CREATE INDEX ix_incidents_status
        ON incidents (status);
    END IF;
END$$;
"""
    )

    # tasks
    op.alter_column(
        "tasks",
        "description",
        existing_type=sa.TEXT(),
        type_=sa.String(),
        existing_nullable=True,
    )
    op.alter_column(
        "tasks",
        "incident_id",
        existing_type=sa.INTEGER(),
        nullable=False,
    )
    op.alter_column(
        "tasks",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "tasks",
        "updated_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=("now()"),
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_tasks_assignee_id'
    ) THEN
        CREATE INDEX ix_tasks_assignee_id
        ON tasks (assignee_id);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_tasks_id'
    ) THEN
        CREATE INDEX ix_tasks_id
        ON tasks (id);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_tasks_incident_id'
    ) THEN
        CREATE INDEX ix_tasks_incident_id
        ON tasks (incident_id);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_tasks_priority'
    ) THEN
        CREATE INDEX ix_tasks_priority
        ON tasks (priority);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_tasks_status'
    ) THEN
        CREATE INDEX ix_tasks_status
        ON tasks (status);
    END IF;
END$$;
"""
    )

    # users
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.BOOLEAN(),
        nullable=False,
        existing_server_default=("true"),
    )

    # drop old unique constraint only if it exists
    op.execute(
        """
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
          AND constraint_name = 'users_email_key'
    ) THEN
        ALTER TABLE users
        DROP CONSTRAINT users_email_key;
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_users_email'
    ) THEN
        CREATE INDEX ix_users_email ON users (email);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_users_id'
    ) THEN
        CREATE INDEX ix_users_id ON users (id);
    END IF;
END$$;
"""
    )

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'ix_users_role'
    ) THEN
        CREATE INDEX ix_users_role ON users (role);
    END IF;
END$$;
"""
    )


def downgrade() -> None:
    # keep downgrade simple and close to original behavior

    # users
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")

    op.execute(
        """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
          AND constraint_name = 'users_email_key'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END$$;
"""
    )

    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.BOOLEAN(),
        nullable=True,
        existing_server_default=("true"),
    )

    # tasks
    op.drop_index(op.f("ix_tasks_status"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_priority"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_incident_id"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_id"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_created_at"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_assignee_id"), table_name="tasks")
    op.alter_column(
        "tasks",
        "updated_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "tasks",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "tasks",
        "incident_id",
        existing_type=sa.INTEGER(),
        nullable=True,
    )
    op.alter_column(
        "tasks",
        "description",
        existing_type=sa.String(),
        type_=sa.TEXT(),
        existing_nullable=True,
    )

    # incidents
    op.drop_index(op.f("ix_incidents_status"), table_name="incidents")
    op.drop_index(op.f("ix_incidents_severity"), table_name="incidents")
    op.drop_index(op.f("ix_incidents_reporter_id"), table_name="incidents")
    op.drop_index(op.f("ix_incidents_location"), table_name="incidents")
    op.drop_index(op.f("ix_incidents_id"), table_name="incidents")
    op.drop_index(op.f("ix_incidents_created_at"), table_name="incidents")
    op.alter_column(
        "incidents",
        "updated_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "incidents",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "incidents",
        "description",
        existing_type=sa.String(),
        type_=sa.TEXT(),
        existing_nullable=False,
    )

    # guidelines
    op.drop_index(op.f("ix_guidelines_phase"), table_name="guidelines")
    op.drop_index(op.f("ix_guidelines_language_code"), table_name="guidelines")
    op.drop_index(op.f("ix_guidelines_id"), table_name="guidelines")
    op.drop_index(op.f("ix_guidelines_hazard_type"), table_name="guidelines")
    op.drop_index(op.f("ix_guidelines_created_at"), table_name="guidelines")
    op.drop_constraint(
        "fk_guidelines_author_id_users",
        "guidelines",
        type_="foreignkey",
    )
    op.drop_column("guidelines", "author_id")
    op.alter_column(
        "guidelines",
        "updated_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "guidelines",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=("now()"),
    )
    op.alter_column(
        "guidelines",
        "author_id",
        existing_type=sa.INTEGER(),
        nullable=True,
    )

    # emergency_contacts
    op.drop_index(op.f("ix_emergency_contacts_user_id"), table_name="emergency_contacts")
    op.drop_index(op.f("ix_emergency_contacts_id"), table_name="emergency_contacts")
    op.drop_index(
        op.f("ix_emergency_contacts_created_at"),
        table_name="emergency_contacts",
    )
    op.alter_column(
        "emergency_contacts",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=("now()"),
    )

    # spatial_ref_sys (as created originally)
    op.create_table(
        "spatial_ref_sys",
        sa.Column("srid", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("auth_name", sa.VARCHAR(length=256), autoincrement=False, nullable=True),
        sa.Column("auth_srid", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("srtext", sa.VARCHAR(length=2048), autoincrement=False, nullable=True),
        sa.Column("proj4text", sa.VARCHAR(length=2048), autoincrement=False, nullable=True),
        sa.CheckConstraint("srid > 0 AND srid <= 998999", name="spatial_ref_sys_srid_check"),
        sa.PrimaryKeyConstraint("srid", name="spatial_ref_sys_pkey"),
    )
