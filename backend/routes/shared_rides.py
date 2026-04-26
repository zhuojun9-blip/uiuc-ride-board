from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from auth import get_current_user
from database import get_db
from models import Driver, SharedRideRequest, User
import schemas

router = APIRouter(prefix="/shared-rides", tags=["shared-rides"])


def serialize_shared_ride_request(request: SharedRideRequest, db: Session):
    rider = db.query(User).filter(User.id == request.rider_user_id).first()
    listing = db.query(Driver).filter(Driver.id == request.driver_listing_id).first()
    return schemas.SharedRideRequestResponse(
        id=request.id,
        driver_listing_id=request.driver_listing_id,
        driver_user_id=request.driver_user_id,
        driver_route=listing.route if listing else None,
        driver_departure_time=listing.departure_time if listing else None,
        rider_user_id=request.rider_user_id,
        rider_name=rider.name if rider else None,
        rider_avatar_url=rider.avatar_url if rider else None,
        rider_email=rider.email if rider else None,
        seats_requested=request.seats_requested,
        message=request.message,
        status=request.status,
        created_at=request.created_at,
        updated_at=request.updated_at,
    )


@router.post("/", response_model=schemas.SharedRideRequestResponse)
async def create_shared_ride_request(
    request_data: schemas.SharedRideRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request_data.seats_requested < 1 or request_data.seats_requested > 6:
        raise HTTPException(status_code=400, detail="Seats requested must be between 1 and 6")

    driver_listing = db.query(Driver).filter(Driver.id == request_data.driver_listing_id).first()
    if not driver_listing or not driver_listing.is_active:
        raise HTTPException(status_code=404, detail="Driver listing not found")

    if driver_listing.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot request your own ride listing")

    if request_data.seats_requested > driver_listing.available_seats:
        raise HTTPException(status_code=400, detail="Not enough seats available for this request")

    existing_pending = db.query(SharedRideRequest).filter(
        SharedRideRequest.driver_listing_id == request_data.driver_listing_id,
        SharedRideRequest.rider_user_id == current_user.id,
        SharedRideRequest.status.in_(["pending", "approved", "confirmed"]),
    ).first()
    if existing_pending:
        raise HTTPException(status_code=400, detail="You already have an active shared ride request for this listing")

    shared_request = SharedRideRequest(
        driver_listing_id=driver_listing.id,
        driver_user_id=driver_listing.user_id,
        rider_user_id=current_user.id,
        seats_requested=request_data.seats_requested,
        message=request_data.message,
    )
    db.add(shared_request)
    db.commit()
    db.refresh(shared_request)
    return serialize_shared_ride_request(shared_request, db)


@router.get("/mine", response_model=List[schemas.SharedRideRequestResponse])
async def list_my_shared_ride_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = db.query(SharedRideRequest).filter(
        SharedRideRequest.rider_user_id == current_user.id
    ).order_by(SharedRideRequest.created_at.desc()).all()
    return [serialize_shared_ride_request(item, db) for item in requests]


@router.get("/driver", response_model=List[schemas.SharedRideRequestResponse])
async def list_driver_shared_ride_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = db.query(SharedRideRequest).filter(
        SharedRideRequest.driver_user_id == current_user.id
    ).order_by(SharedRideRequest.created_at.desc()).all()
    return [serialize_shared_ride_request(item, db) for item in requests]


@router.put("/{request_id}/status", response_model=schemas.SharedRideRequestResponse)
async def update_shared_ride_request_status(
    request_id: int,
    status_data: schemas.SharedRideRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shared_request = db.query(SharedRideRequest).filter(SharedRideRequest.id == request_id).first()
    if not shared_request:
        raise HTTPException(status_code=404, detail="Shared ride request not found")

    is_driver_or_admin = shared_request.driver_user_id == current_user.id or current_user.is_admin
    is_rider = shared_request.rider_user_id == current_user.id

    if not is_driver_or_admin and not is_rider:
        raise HTTPException(status_code=403, detail="Not authorized")

    normalized_status = status_data.status.strip().lower()
    if normalized_status not in {"pending", "approved", "rejected", "confirmed", "completed", "cancelled"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    driver_listing = db.query(Driver).filter(Driver.id == shared_request.driver_listing_id).first()
    if not driver_listing:
        raise HTTPException(status_code=404, detail="Driver listing not found")

    previous_status = shared_request.status

    if normalized_status == previous_status:
        return serialize_shared_ride_request(shared_request, db)

    driver_allowed_transitions = {
        "pending": {"approved", "rejected"},
        "approved": {"rejected", "cancelled"},
        "confirmed": {"completed", "cancelled"},
        "rejected": set(),
        "completed": set(),
        "cancelled": set(),
    }
    rider_allowed_transitions = {
        "pending": {"cancelled"},
        "approved": {"confirmed", "cancelled"},
        "confirmed": {"cancelled"},
        "rejected": set(),
        "completed": set(),
        "cancelled": set(),
    }

    if is_driver_or_admin:
        allowed_next = driver_allowed_transitions.get(previous_status, set())
    else:
        allowed_next = rider_allowed_transitions.get(previous_status, set())

    if normalized_status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {previous_status} to {normalized_status}",
        )

    if normalized_status == "approved" and previous_status != "approved":
        if shared_request.seats_requested > driver_listing.available_seats:
            raise HTTPException(status_code=400, detail="Not enough seats remaining to approve this request")
        driver_listing.available_seats -= shared_request.seats_requested

    if previous_status in {"approved", "confirmed"} and normalized_status in {"rejected", "cancelled", "pending"}:
        driver_listing.available_seats += shared_request.seats_requested

    shared_request.status = normalized_status
    db.commit()
    db.refresh(shared_request)
    return serialize_shared_ride_request(shared_request, db)
