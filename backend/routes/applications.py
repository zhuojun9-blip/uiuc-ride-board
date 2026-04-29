from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import DriverApplication, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])


def serialize_application(application: DriverApplication, db: Session):
    applicant = db.query(User).filter(User.id == application.user_id).first()
    return schemas.DriverApplicationResponse(
        id=application.id,
        user_id=application.user_id,
        full_name=application.full_name,
        email=application.email,
        driver_tier=application.driver_tier,
        phone_number=application.phone_number,
        vehicle_info=application.vehicle_info,
        email_verified=application.email_verified,
        sms_verified=application.sms_verified,
        id_upload_status=application.id_upload_status,
        primary_route=application.primary_route,
        available_seats=application.available_seats,
        notes=application.notes,
        user_avatar_url=applicant.avatar_url if applicant else None,
        status=application.status,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )

@router.post("/", response_model=schemas.DriverApplicationResponse)
async def submit_application(
    app_data: schemas.DriverApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    normalized_tier = (app_data.driver_tier or "").strip().lower()
    if normalized_tier not in {"uiuc_verified", "community"}:
        raise HTTPException(status_code=400, detail="Invalid driver tier")

    normalized_email = app_data.email.strip().lower()
    if normalized_tier == "uiuc_verified":
        if not normalized_email.endswith("@illinois.edu"):
            raise HTTPException(status_code=400, detail="UIUC tier requires an @illinois.edu email")
        if not app_data.email_verified:
            raise HTTPException(status_code=400, detail="Email verification is required for UIUC tier")
    if normalized_tier == "community" and not app_data.sms_verified:
        raise HTTPException(status_code=400, detail="SMS verification is required for Community tier")

    existing_application = db.query(DriverApplication).filter(
        DriverApplication.user_id == current_user.id
    ).first()

    if existing_application:
        existing_application.full_name = app_data.full_name
        existing_application.email = app_data.email
        existing_application.driver_tier = normalized_tier
        existing_application.phone_number = app_data.phone_number
        existing_application.vehicle_info = app_data.vehicle_info
        existing_application.email_verified = app_data.email_verified
        existing_application.sms_verified = app_data.sms_verified
        existing_application.id_upload_status = app_data.id_upload_status
        existing_application.primary_route = app_data.primary_route
        existing_application.available_seats = app_data.available_seats
        existing_application.notes = app_data.notes
        db_app = existing_application
    else:
        db_app = DriverApplication(
            user_id=current_user.id,
            **{**app_data.dict(), "driver_tier": normalized_tier}
        )
        db.add(db_app)

    db.commit()
    db.refresh(db_app)
    return serialize_application(db_app, db)

@router.get("/", response_model=List[schemas.DriverApplicationResponse])
async def list_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    applications = db.query(DriverApplication).filter(
        DriverApplication.user_id == current_user.id
    ).all()
    return [serialize_application(application, db) for application in applications]


@router.get("/all", response_model=List[schemas.DriverApplicationResponse])
async def list_all_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    applications = db.query(DriverApplication).order_by(DriverApplication.created_at.desc()).all()
    return [serialize_application(application, db) for application in applications]

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
    
    return serialize_application(app, db)

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
    
    update_payload = app_data.dict(exclude_unset=True)
    prospective_tier = (update_payload.get("driver_tier") or app.driver_tier or "").strip().lower()
    prospective_email = (update_payload.get("email") or app.email or "").strip().lower()
    prospective_email_verified = update_payload.get("email_verified", app.email_verified)
    prospective_sms_verified = update_payload.get("sms_verified", app.sms_verified)

    if prospective_tier not in {"uiuc_verified", "community"}:
        raise HTTPException(status_code=400, detail="Invalid driver tier")
    if prospective_tier == "uiuc_verified":
        if not prospective_email.endswith("@illinois.edu"):
            raise HTTPException(status_code=400, detail="UIUC tier requires an @illinois.edu email")
        if not prospective_email_verified:
            raise HTTPException(status_code=400, detail="Email verification is required for UIUC tier")
    if prospective_tier == "community" and not prospective_sms_verified:
        raise HTTPException(status_code=400, detail="SMS verification is required for Community tier")

    if "driver_tier" in update_payload:
        update_payload["driver_tier"] = prospective_tier

    for key, value in update_payload.items():
        setattr(app, key, value)
    
    db.commit()
    db.refresh(app)
    return serialize_application(app, db)


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
    return serialize_application(app, db)

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
