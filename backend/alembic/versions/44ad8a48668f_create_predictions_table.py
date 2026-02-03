"""create predictions and incident_predictions tables

Revision ID: 44ad8a48668f
Revises: e33af5cdf316
Create Date: 2026-01-27 19:42:07
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "44ad8a48668f"
down_revision = "e33af5cdf316"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- ENUM (safe create) ----
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE risk_type AS ENUM (
                'flood',
                'cyclone',
                'earthquake',
                'landslide',
                'wildfire'
            );
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    # ---- predictions table ----
    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "incident_id",
            sa.Integer,
            sa.ForeignKey("incidents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("risk_type", sa.Enum(
            "flood",
            "cyclone",
            "earthquake",
            "landslide",
            "wildfire",
            name="risk_type",
            native_enum=False,
        ), nullable=False),
        sa.Column("probability", sa.Float, nullable=False),
        sa.Column("confidence_score", sa.Float),
        sa.Column("model_version", sa.String(50)),
        sa.Column("algorithm", sa.String(100)),
        sa.Column("features_used", sa.JSON),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )

    op.create_check_constraint(
        "ck_predictions_probability",
        "predictions",
        "probability >= 0.0 AND probability <= 1.0",
    )
    op.create_check_constraint(
        "ck_predictions_confidence",
        "predictions",
        "confidence_score >= 0.0 AND confidence_score <= 1.0",
    )

    op.create_index(
        "idx_predictions_incident_id",
        "predictions",
        ["incident_id"],
    )
    op.create_index(
        "idx_predictions_risk_type",
        "predictions",
        ["risk_type"],
    )
    op.create_index(
        "idx_predictions_created_at",
        "predictions",
        ["created_at"],
    )

    # ---- incident_predictions table ----
    op.create_table(
        "incident_predictions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "incident_id",
            sa.Integer,
            sa.ForeignKey("incidents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("risk_score", sa.Integer, nullable=False),
        sa.Column("predicted_severity", sa.String(50), nullable=False),
        sa.Column("estimated_resources_required", sa.Integer),
        sa.Column("estimated_budget", sa.Float),
        sa.Column(
            "forecast_date",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column("prediction_horizon_days", sa.Integer, server_default="7"),
        sa.Column("model_version", sa.String(50)),
        sa.Column("ml_pipeline_id", sa.String(100)),
        sa.Column("confidence_level", sa.Float),
        sa.Column("additional_metadata", sa.JSON),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )

    op.create_check_constraint(
        "ck_incident_predictions_risk_score",
        "incident_predictions",
        "risk_score >= 1 AND risk_score <= 10",
    )
    op.create_check_constraint(
        "ck_incident_predictions_confidence",
        "incident_predictions",
        "confidence_level >= 0.0 AND confidence_level <= 1.0",
    )

    op.create_index(
        "idx_incident_predictions_incident_id",
        "incident_predictions",
        ["incident_id"],
    )
    op.create_index(
        "idx_incident_predictions_forecast_date",
        "incident_predictions",
        ["forecast_date"],
    )
    op.create_index(
        "idx_incident_predictions_created_at",
        "incident_predictions",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_incident_predictions_created_at", table_name="incident_predictions")
    op.drop_index("idx_incident_predictions_forecast_date", table_name="incident_predictions")
    op.drop_index("idx_incident_predictions_incident_id", table_name="incident_predictions")
    op.drop_table("incident_predictions")

    op.drop_index("idx_predictions_created_at", table_name="predictions")
    op.drop_index("idx_predictions_risk_type", table_name="predictions")
    op.drop_index("idx_predictions_incident_id", table_name="predictions")
    op.drop_table("predictions")

    # Enum is shared — drop ONLY if you are sure nothing else uses it
    op.execute("DROP TYPE IF EXISTS risk_type")
