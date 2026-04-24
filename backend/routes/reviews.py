from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from auth import get_current_user
from database import get_db
from models import Driver, RideReview, SharedRideRequest, User
import schemas

router = APIRouter(prefix="/reviews", tags=["reviews"])


def serialize_review(review: RideReview, db: Session):
    reviewer = db.query(User).filter(User.id == review.reviewer_id).first()
    return schemas.RideReviewResponse(
        id=review.id,
        reviewer_id=review.reviewer_id,
        reviewer_name=reviewer.name if reviewer else None,
        driver_user_id=review.driver_user_id,
        driver_listing_id=review.driver_listing_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.post("/", response_model=schemas.RideReviewResponse)
async def create_review(
    review_data: schemas.RideReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    driver_listing = db.query(Driver).filter(Driver.id == review_data.driver_listing_id).first()
    if not driver_listing:
        raise HTTPException(status_code=404, detail="Driver listing not found")

    if driver_listing.user_id != review_data.driver_user_id:
        raise HTTPException(status_code=400, detail="Driver user does not match listing")

    if current_user.id == review_data.driver_user_id:
        raise HTTPException(status_code=400, detail="Drivers cannot review their own rides")

    approved_shared_ride = db.query(SharedRideRequest).filter(
        SharedRideRequest.driver_listing_id == review_data.driver_listing_id,
        SharedRideRequest.rider_user_id == current_user.id,
        SharedRideRequest.status == "approved",
    ).first()
    if not approved_shared_ride:
        raise HTTPException(
            status_code=403,
            detail="Only riders with an approved shared ride for this listing can submit a rating",
        )

    existing_review = db.query(RideReview).filter(
        RideReview.reviewer_id == current_user.id,
        RideReview.driver_listing_id == review_data.driver_listing_id
    ).first()

    if existing_review:
        existing_review.rating = review_data.rating
        existing_review.comment = review_data.comment
        db.commit()
        db.refresh(existing_review)
        return serialize_review(existing_review, db)

    review = RideReview(
        reviewer_id=current_user.id,
        driver_user_id=review_data.driver_user_id,
        driver_listing_id=review_data.driver_listing_id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return serialize_review(review, db)


@router.get("/driver/{driver_user_id}", response_model=List[schemas.RideReviewResponse])
async def list_driver_reviews(driver_user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(RideReview).filter(
        RideReview.driver_user_id == driver_user_id
    ).order_by(RideReview.created_at.desc()).all()
    return [serialize_review(review, db) for review in reviews]
