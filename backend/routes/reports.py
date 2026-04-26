from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from auth import get_current_user
from database import get_db
from models import Driver, RideReport, SharedRideRequest, User
import schemas

router = APIRouter(prefix="/reports", tags=["reports"])


def serialize_report(report: RideReport, db: Session):
    reporter = db.query(User).filter(User.id == report.reporter_id).first()
    against = db.query(User).filter(User.id == report.against_user_id).first()
    return schemas.RideReportResponse(
        id=report.id,
        reporter_id=report.reporter_id,
        reporter_name=reporter.name if reporter else None,
        reporter_avatar_url=reporter.avatar_url if reporter else None,
        against_user_id=report.against_user_id,
        against_user_name=against.name if against else None,
        against_user_avatar_url=against.avatar_url if against else None,
        driver_listing_id=report.driver_listing_id,
        category=report.category,
        details=report.details,
        status=report.status,
        created_at=report.created_at,
    )


@router.post("/", response_model=schemas.RideReportResponse)
async def create_report(
    report_data: schemas.RideReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Driver).filter(Driver.id == report_data.driver_listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Driver listing not found")

    if current_user.id == report_data.against_user_id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")

    approved_shared_ride = db.query(SharedRideRequest).filter(
        SharedRideRequest.driver_listing_id == report_data.driver_listing_id,
        SharedRideRequest.rider_user_id == current_user.id,
        SharedRideRequest.status.in_(["approved", "confirmed", "completed"]),
    ).first()
    if not approved_shared_ride:
        raise HTTPException(
            status_code=403,
            detail="Only riders with an approved shared ride for this listing can report an issue",
        )

    report = RideReport(
        reporter_id=current_user.id,
        against_user_id=report_data.against_user_id,
        driver_listing_id=report_data.driver_listing_id,
        category=report_data.category.strip() or "general",
        details=report_data.details,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return serialize_report(report, db)


@router.get("/mine", response_model=List[schemas.RideReportResponse])
async def list_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(RideReport).filter(
        RideReport.reporter_id == current_user.id
    ).order_by(RideReport.created_at.desc()).all()
    return [serialize_report(report, db) for report in reports]


@router.get("/admin/all", response_model=List[schemas.RideReportResponse])
async def list_all_reports_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    reports = db.query(RideReport).order_by(RideReport.created_at.desc()).all()
    return [serialize_report(report, db) for report in reports]


@router.put("/{report_id}/status", response_model=schemas.RideReportResponse)
async def update_report_status(
    report_id: int,
    status_data: schemas.RideReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    report = db.query(RideReport).filter(RideReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    normalized_status = status_data.status.strip().lower()
    if normalized_status not in {"open", "reviewing", "resolved"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    report.status = normalized_status
    db.commit()
    db.refresh(report)
    return serialize_report(report, db)
