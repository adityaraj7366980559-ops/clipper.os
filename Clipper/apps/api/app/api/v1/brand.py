from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import BrandKit
from app.schemas.schemas import BrandKitBase, BrandKitResponse

router = APIRouter(prefix="/brand-kits", tags=["brand-kits"])

@router.get("", response_model=List[BrandKitResponse])
async def list_brand_kits(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BrandKit))
    kits = res.scalars().all()
    if not kits:
        # Seed default kit if none exists
        default_kit = BrandKit(
            user_id="default_user",
            name="Official Brand Kit",
            primary_color="#38bdf8",
            secondary_color="#f43f5e",
            font_family="Montserrat Black",
            caption_template="karaoke_pop",
            watermark_enabled=False
        )
        db.add(default_kit)
        await db.commit()
        await db.refresh(default_kit)
        return [default_kit]
    return kits

@router.post("", response_model=BrandKitResponse)
async def create_brand_kit(payload: BrandKitBase, db: AsyncSession = Depends(get_db)):
    kit = BrandKit(
        user_id="default_user",
        **payload.dict()
    )
    db.add(kit)
    await db.commit()
    await db.refresh(kit)
    return kit

@router.patch("/{kit_id}", response_model=BrandKitResponse)
async def update_brand_kit(kit_id: str, payload: BrandKitBase, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BrandKit).where(BrandKit.id == kit_id))
    kit = res.scalar_one_or_none()
    if not kit:
        raise HTTPException(status_code=404, detail="Brand kit not found")
    for key, val in payload.dict(exclude_unset=True).items():
        setattr(kit, key, val)
    await db.commit()
    await db.refresh(kit)
    return kit
