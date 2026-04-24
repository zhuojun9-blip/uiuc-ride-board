from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import DriverApplication, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])

@router.post("/", response_model=schemas.DriverApplicationResponse)
async def submit_application(
    app_data: schemas.DriverApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_app = DriverApplication(
        user_id=current_user.id,
        **app_data.dict()
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.get("/", response_model=List[schemas.DriverApplicationResponse])
async def list_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(DriverApplication).filter(
        DriverApplication.user_id == current_user.id
    ).all()


@router.get("/all", response_model=List[schemas.DriverApplicationResponse])
async def list_all_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    return db.query(DriverApplication).order_by(DriverApplication.created_at.desc()).all()

@router.get("/{app_id}", response_model=schemas.DriverApplicationResponse)
async def get_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(DriverApplication).filter(DriverApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return app

@router.put("/{app_id}", response_model=schemas.DriverApplicationResponse)
async def update_application(
    app_id: int,
    app_data: schemas.DriverApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(DriverApplication).filter(DriverApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in app_data.dict(exclude_unset=True).items():
        setattr(app, key, value)
    
    db.commit()
    db.refresh(app)
    return app


@router.put("/{app_id}/status", response_model=schemas.DriverApplicationResponse)
async def update_application_status(
    app_id: int,
    status_data: schemas.DriverApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    app = db.query(DriverApplication).filter(DriverApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    normalized_status = status_data.status.strip().lower()
    if normalized_status not in {"pending", "approved", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    app.status = normalized_status
    db.commit()
    db.refresh(app)
    return app

@router.delete("/{app_id}", status_code=204)
async def delete_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(DriverApplication).filter(DriverApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(app)
    db.commit()
