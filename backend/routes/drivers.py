from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Driver, DriverApplication, RideReview, SharedRideRequest, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/drivers", tags=["drivers"])


def compute_driver_trust(application: DriverApplication | None, rating_average: float, rating_count: int, ride_history_count: int):
    driver_tier = (application.driver_tier if application and application.driver_tier else "community").strip().lower()
    email_verified = bool(application.email_verified) if application else False
    sms_verified = bool(application.sms_verified) if application else False

    email_score = 0
    if email_verified and driver_tier == "uiuc_verified":
        email_score = 30
    elif email_verified:
        email_score = 15

    phone_score = 25 if sms_verified else 0
    rating_score = min(25, (rating_average / 5) * 18 + min(rating_count, 10) * 0.7) if rating_count > 0 else 0
    history_score = min(20, max(ride_history_count, 0) * 2)

    trust_score = int(round(email_score + phone_score + rating_score + history_score))

    is_high_trust = (
        driver_tier == "uiuc_verified"
        and email_verified
        and sms_verified
        and rating_count >= 3
        and rating_average >= 4.5
        and trust_score >= 75
    )
    if is_high_trust:
        trust_level = "high"
    elif trust_score >= 45 or ((email_verified or sms_verified) and rating_count == 0 and trust_score >= 35):
        trust_level = "medium"
    else:
        trust_level = "low"

    return {
        "driver_tier": driver_tier,
        "email_verified": email_verified,
        "sms_verified": sms_verified,
        "trust_score": trust_score,
        "trust_level": trust_level,
    }


def serialize_driver(driver: Driver, db: Session):
    driver_owner = db.query(User).filter(User.id == driver.user_id).first()
    latest_application = db.query(DriverApplication).filter(
        DriverApplication.user_id == driver.user_id
    ).order_by(DriverApplication.updated_at.desc()).first()
    reviews = db.query(RideReview).filter(RideReview.driver_user_id == driver.user_id).all()
    rating_count = len(reviews)
    rating_average = (
        sum(review.rating for review in reviews) / rating_count if rating_count else 0
    )
    ride_history_count = db.query(Driver).filter(Driver.user_id == driver.user_id).count()
    trust = compute_driver_trust(latest_application, rating_average, rating_count, ride_history_count)

    return schemas.DriverResponse(
        id=driver.id,
        user_id=driver.user_id,
        user_name=driver_owner.name if driver_owner else None,
        user_avatar_url=driver_owner.avatar_url if driver_owner else None,
        driver_tier=trust["driver_tier"],
        email_verified=trust["email_verified"],
        sms_verified=trust["sms_verified"],
        trust_score=trust["trust_score"],
        trust_level=trust["trust_level"],
        route=driver.route,
        vehicle=driver.vehicle,
        available_seats=driver.available_seats,
        departure_time=driver.departure_time,
        price_per_seat=driver.price_per_seat,
        pickup_location=driver.pickup_location,
        skills=driver.skills,
        labels=driver.labels,
        notes=driver.notes,
        rating_average=rating_average,
        rating_count=rating_count,
        ride_history_count=ride_history_count,
        is_active=driver.is_active,
        created_at=driver.created_at,
        updated_at=driver.updated_at,
    )


def build_driver_history_response(driver_user: User, rides: list[Driver]):
    total_rides = len(rides)
    active_rides = sum(1 for ride in rides if ride.is_active)
    inactive_rides = total_rides - active_rides
    total_estimated_cost = sum((ride.price_per_seat or 0) * (ride.available_seats or 0) for ride in rides)
    average_price_per_seat = (
        sum((ride.price_per_seat or 0) for ride in rides) / total_rides if total_rides else 0
    )

    history_entries = [
        schemas.DriverHistoryEntry(
            id=ride.id,
            route=ride.route,
            vehicle=ride.vehicle,
            available_seats=ride.available_seats,
            departure_time=ride.departure_time,
            price_per_seat=ride.price_per_seat or 0,
            estimated_total_cost=(ride.price_per_seat or 0) * (ride.available_seats or 0),
            pickup_location=ride.pickup_location,
            skills=ride.skills,
            labels=ride.labels,
            notes=ride.notes,
            is_active=ride.is_active,
            created_at=ride.created_at,
            updated_at=ride.updated_at,
        )
        for ride in rides
    ]

    return schemas.DriverHistoryResponse(
        driver_user_id=driver_user.id,
        driver_name=driver_user.name,
        driver_email=driver_user.email,
        driver_avatar_url=driver_user.avatar_url,
        total_rides=total_rides,
        active_rides=active_rides,
        inactive_rides=inactive_rides,
        total_estimated_cost=total_estimated_cost,
        average_price_per_seat=average_price_per_seat,
        rides=history_entries,
    )


@router.post("/", response_model=schemas.DriverResponse)
async def create_driver(
    driver_data: schemas.DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        approved_application = db.query(DriverApplication).filter(
            DriverApplication.user_id == current_user.id,
            DriverApplication.status == "approved"
        ).first()

        if not approved_application:
            raise HTTPException(
                status_code=403,
                detail="Your driver application must be approved by an admin before posting listings"
            )

    db_driver = Driver(
        user_id=current_user.id,
        **driver_data.dict()
    )
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return serialize_driver(db_driver, db)


@router.get("/", response_model=List[schemas.DriverResponse])
async def list_drivers(
    route: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Driver).filter(Driver.is_active == True)

    if route:
        query = query.filter(Driver.route == route)

    return [serialize_driver(driver, db) for driver in query.all()]


@router.get("/admin/overview", response_model=List[schemas.DriverHistoryResponse])
async def admin_driver_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    users = db.query(User).all()
    overview = []
    for user in users:
        rides = db.query(Driver).filter(Driver.user_id == user.id).order_by(Driver.created_at.desc()).all()
        if not rides:
            continue

        overview.append(build_driver_history_response(user, rides))

    return overview


@router.get("/admin/history/{driver_user_id}", response_model=schemas.DriverHistoryResponse)
async def admin_driver_history(
    driver_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    driver_user = db.query(User).filter(User.id == driver_user_id).first()
    if not driver_user:
        raise HTTPException(status_code=404, detail="Driver user not found")

    rides = db.query(Driver).filter(Driver.user_id == driver_user_id).order_by(Driver.created_at.desc()).all()

    return build_driver_history_response(driver_user, rides)


@router.get("/{driver_id}", response_model=schemas.DriverResponse)
async def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return serialize_driver(driver, db)


@router.put("/{driver_id}", response_model=schemas.DriverResponse)
async def update_driver(
    driver_id: int,
    driver_data: schemas.DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if driver.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_payload = driver_data.dict(exclude_unset=True)
    locked_fields_after_confirmation = {
        "price_per_seat",
        "departure_time",
        "available_seats",
        "pickup_location",
        "notes",
    }

    changed_locked_fields = {
        key
        for key, value in update_payload.items()
        if key in locked_fields_after_confirmation and getattr(driver, key) != value
    }

    if changed_locked_fields:
        has_confirmed_request = db.query(SharedRideRequest).filter(
            SharedRideRequest.driver_listing_id == driver.id,
            SharedRideRequest.status.in_(["confirmed", "completed"]),
        ).first()

        if has_confirmed_request:
            raise HTTPException(
                status_code=400,
                detail="Price, departure time, available seats, pickup location, and notes can only be edited before a ride is confirmed",
            )

    for key, value in update_payload.items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)
    return serialize_driver(driver, db)


@router.delete("/{driver_id}", status_code=204)
async def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if driver.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    driver.is_active = False
    db.commit()
