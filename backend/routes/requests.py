from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import RiderRequest, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/requests", tags=["requests"])


def serialize_request(request: RiderRequest, db: Session):
    request_owner = db.query(User).filter(User.id == request.user_id).first()
    return schemas.RiderRequestResponse(
        id=request.id,
        user_id=request.user_id,
        user_name=request_owner.name if request_owner else None,
        user_avatar_url=request_owner.avatar_url if request_owner else None,
        route=request.route,
        departure_time=request.departure_time,
        passengers=request.passengers,
        details=request.details,
        is_active=request.is_active,
        created_at=request.created_at,
        updated_at=request.updated_at,
    )

@router.post("/", response_model=schemas.RiderRequestResponse)
async def create_request(
    request_data: schemas.RiderRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_request = RiderRequest(
        user_id=current_user.id,
        **request_data.dict()
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return serialize_request(db_request, db)

@router.get("/", response_model=List[schemas.RiderRequestResponse])
async def list_requests(
    route: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(RiderRequest).filter(RiderRequest.is_active == True)
    
    if route:
        query = query.filter(RiderRequest.route == route)
    
    return [serialize_request(request, db) for request in query.all()]

@router.get("/{request_id}", response_model=schemas.RiderRequestResponse)
async def get_request(request_id: int, db: Session = Depends(get_db)):
    request = db.query(RiderRequest).filter(RiderRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return serialize_request(request, db)

@router.put("/{request_id}", response_model=schemas.RiderRequestResponse)
async def update_request(
    request_id: int,
    request_data: schemas.RiderRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    request = db.query(RiderRequest).filter(RiderRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in request_data.dict(exclude_unset=True).items():
        setattr(request, key, value)
    
    db.commit()
    db.refresh(request)
    return serialize_request(request, db)

@router.delete("/{request_id}", status_code=204)
async def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    request = db.query(RiderRequest).filter(RiderRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    request.is_active = False
    db.commit()
