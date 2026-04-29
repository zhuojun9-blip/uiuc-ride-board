from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from database import get_db
from models import DriverApplication, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])


BLOCKED_NAME_PHRASES = {
    "verified driver",
    "admin verified",
    "trusted driver",
    "5-star",
    "5 star",
    "official driver",
    "safe driver",
}


def validate_display_name(full_name: str) -> None:
    normalized = " ".join((full_name or "").strip().lower().split())
    if not normalized:
        raise HTTPException(status_code=400, detail="Full name is required")

    for phrase in BLOCKED_NAME_PHRASES:
        if phrase in normalized:
            raise HTTPException(
                status_code=400,
                detail="Name cannot include trust or verification claims",
            )


def enforce_application_edit_rate_limit(application: DriverApplication) -> None:
    now = datetime.now(timezone.utc)
    cooldown = application.profile_edit_cooldown_until
    if cooldown and cooldown.tzinfo is None:
        cooldown = cooldown.replace(tzinfo=timezone.utc)

    if cooldown and now < cooldown:
        remaining_minutes = max(1, int((cooldown - now).total_seconds() // 60))
        raise HTTPException(
            status_code=429,
            detail=f"Too many profile edits. Try again in about {remaining_minutes} minute(s)",
        )

    window_start = application.profile_edit_window_start
    if window_start and window_start.tzinfo is None:
        window_start = window_start.replace(tzinfo=timezone.utc)

    if not window_start or now - window_start > timedelta(hours=1):
        application.profile_edit_window_start = now
        application.profile_edit_count = 0
        return

    edit_count = application.profile_edit_count or 0

    if edit_count >= 5:
        within_burst_window = now - window_start <= timedelta(minutes=10)
        has_burst_capacity = edit_count < 8
        if not (within_burst_window and has_burst_capacity):
            application.profile_edit_cooldown_until = now + timedelta(minutes=15)
            raise HTTPException(
                status_code=429,
                detail="Too many profile edits. You are temporarily in cooldown",
            )


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
    validate_display_name(app_data.full_name)

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
        enforce_application_edit_rate_limit(existing_application)
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
        existing_application.profile_edit_count = (existing_application.profile_edit_count or 0) + 1
        if not existing_application.profile_edit_window_start:
            existing_application.profile_edit_window_start = datetime.now(timezone.utc)
        existing_application.profile_edit_cooldown_until = None
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
    if "full_name" in update_payload:
        validate_display_name(update_payload.get("full_name") or "")

    enforce_application_edit_rate_limit(app)
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

    app.profile_edit_count = (app.profile_edit_count or 0) + 1
    if not app.profile_edit_window_start:
        app.profile_edit_window_start = datetime.now(timezone.utc)
    app.profile_edit_cooldown_until = None
    
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
