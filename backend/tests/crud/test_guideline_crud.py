import pytest
from app.crud.guideline import CRUDGuideline
from app.schemas.preparedness import GuidelineCreate, GuidelinePhase, HazardType  # ✅ all at top


class TestGuidelineCRUD:
    """Test cases for Guideline CRUD"""

    async def test_create_guideline(
        self,
        crud_guideline: CRUDGuideline,
        db_session,
        user_id: int
    ):
        """Test creating a safety guideline"""
        guide_data = GuidelineCreate(
            title="Flood Safety Tips",
            content="Essential steps to stay safe during a flood event and protect your family",
            phase=GuidelinePhase.BEFORE,
            hazard_type=HazardType.FLOOD,
            author_id=user_id
        )
        guideline = await crud_guideline.create(db_session, obj_in=guide_data)

        assert guideline.title == "Flood Safety Tips"
        assert guideline.hazard_type == HazardType.FLOOD        # ✅ enum comparison
        assert guideline.phase == GuidelinePhase.BEFORE         # ✅ verify phase
        assert guideline.author_id == user_id                   # ✅ verify ownership
        assert guideline.id is not None                         # ✅ DB assigned ID

    async def test_get_guidelines_by_disaster_type(
        self,
        crud_guideline: CRUDGuideline,
        db_session,
        user_id: int
    ):
        """Test filtering guidelines by hazard type"""

        # ✅ Create two different hazard type guidelines
        for hazard, title in [
            (HazardType.FLOOD, "Flood Guide"),
            (HazardType.EARTHQUAKE, "Earthquake Guide"),
        ]:
            await crud_guideline.create(
                db_session,
                obj_in=GuidelineCreate(
                    title=title,
                    content=f"Safety content for {hazard.value} preparedness and response",
                    phase=GuidelinePhase.BEFORE,
                    hazard_type=hazard,
                    author_id=user_id
                )
            )

        # Filter by FLOOD only
        flood_guidelines = await crud_guideline.get_by_hazard_type(
            db_session,
            hazard_type=HazardType.FLOOD
        )

        assert len(flood_guidelines) > 0                                        # ✅ not empty
        assert all(g.hazard_type == HazardType.FLOOD for g in flood_guidelines) # ✅ correct filter

    async def test_get_all_guidelines(
        self,
        crud_guideline: CRUDGuideline,
        db_session,
        user_id: int
    ):
        """Test retrieving all guidelines"""

        # ✅ Create known number of guidelines
        for i in range(3):
            await crud_guideline.create(
                db_session,
                obj_in=GuidelineCreate(
                    title=f"Guideline {i}",
                    content=f"Safety content number {i} for emergency preparedness planning",
                    phase=GuidelinePhase.AFTER,
                    hazard_type=HazardType.FLOOD,
                    author_id=user_id
                )
            )

        guidelines = await crud_guideline.get_multi(db_session)

        assert len(guidelines) >= 3                             # ✅ meaningful assertion

    async def test_update_guideline(
        self,
        crud_guideline: CRUDGuideline,
        db_session,
        user_id: int
    ):
        """Test updating a guideline"""
        guide_data = GuidelineCreate(
            title="Original Title",
            content="Original content for this safety guideline before any updates",
            phase=GuidelinePhase.BEFORE,
            hazard_type=HazardType.FLOOD,
            author_id=user_id
        )
        guideline = await crud_guideline.create(db_session, obj_in=guide_data)

        # Update title
        updated = await crud_guideline.update(
            db_session,
            db_obj=guideline,
            obj_in={"title": "Updated Title"}
        )

        assert updated.title == "Updated Title"                 
        assert updated.id == guideline.id                      

    async def test_delete_guideline(
        self,
        crud_guideline: CRUDGuideline,
        db_session,
        user_id: int
    ):
        """Test deleting a guideline"""
        guide_data = GuidelineCreate(
            title="To Be Deleted",
            content="This guideline will be deleted as part of the delete test case",
            phase=GuidelinePhase.BEFORE,
            hazard_type=HazardType.FLOOD,
            author_id=user_id
        )
        guideline = await crud_guideline.create(db_session, obj_in=guide_data)

        # Delete it
        await crud_guideline.remove(db_session, id=guideline.id)

        # Verify gone
        all_guidelines = await crud_guideline.get_multi(db_session)
        ids = [g.id for g in all_guidelines]
        assert guideline.id not in ids                          