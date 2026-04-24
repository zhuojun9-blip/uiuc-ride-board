from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Driver, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/drivers", tags=["drivers"])

@router.post("/", response_model=schemas.DriverResponse)
async def create_driver(
    driver_data: schemas.DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_driver = Driver(
        user_id=current_user.id,
        **driver_data.dict()
    )
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.get("/", response_model=List[schemas.DriverResponse])
async def list_drivers(
    route: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Driver).filter(Driver.is_active == True)
    
    if route:
        query = query.filter(Driver.route == route)
    
    return query.all()

@router.get("/{driver_id}", response_model=schemas.DriverResponse)
async def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

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
    
    for key, value in driver_data.dict(exclude_unset=True).items():
        setattr(driver, key, value)
    
    db.commit()
    db.refresh(driver)
    return driver

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
