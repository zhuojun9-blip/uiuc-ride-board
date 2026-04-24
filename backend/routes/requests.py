from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import RiderRequest, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/requests", tags=["requests"])

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
    return db_request

@router.get("/", response_model=List[schemas.RiderRequestResponse])
async def list_requests(
    route: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(RiderRequest).filter(RiderRequest.is_active == True)
    
    if route:
        query = query.filter(RiderRequest.route == route)
    
    return query.all()

@router.get("/{request_id}", response_model=schemas.RiderRequestResponse)
async def get_request(request_id: int, db: Session = Depends(get_db)):
    request = db.query(RiderRequest).filter(RiderRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request

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
    return request

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
