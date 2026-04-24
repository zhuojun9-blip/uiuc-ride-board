from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Driver Schemas
class DriverBase(BaseModel):
    route: str
    vehicle: str
    available_seats: int
    departure_time: str
    price_per_seat: float
    pickup_location: str
    notes: Optional[str] = None

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    route: Optional[str] = None
    vehicle: Optional[str] = None
    available_seats: Optional[int] = None
    departure_time: Optional[str] = None
    price_per_seat: Optional[float] = None
    pickup_location: Optional[str] = None
    notes: Optional[str] = None

class DriverResponse(DriverBase):
    id: int
    user_id: int
    user_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DriverHistoryEntry(BaseModel):
    id: int
    route: str
    vehicle: str
    available_seats: int
    departure_time: str
    price_per_seat: float
    estimated_total_cost: float
    pickup_location: str
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DriverHistoryResponse(BaseModel):
    driver_user_id: int
    driver_name: str
    driver_email: EmailStr
    total_rides: int
    active_rides: int
    inactive_rides: int
    total_estimated_cost: float
    average_price_per_seat: float
    rides: list[DriverHistoryEntry]

# Rider Request Schemas
class RiderRequestBase(BaseModel):
    route: str
    departure_time: str
    passengers: int
    details: Optional[str] = None

class RiderRequestCreate(RiderRequestBase):
    pass

class RiderRequestUpdate(BaseModel):
    route: Optional[str] = None
    departure_time: Optional[str] = None
    passengers: Optional[int] = None
    details: Optional[str] = None

class RiderRequestResponse(RiderRequestBase):
    id: int
    user_id: int
    user_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Driver Application Schemas
class DriverApplicationBase(BaseModel):
    full_name: str
    primary_route: str
    available_seats: int
    notes: Optional[str] = None

class DriverApplicationCreate(DriverApplicationBase):
    email: EmailStr


class DriverApplicationUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    primary_route: Optional[str] = None
    available_seats: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class DriverApplicationStatusUpdate(BaseModel):
    status: str

class DriverApplicationResponse(DriverApplicationCreate):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Message Schemas
class MessageCreate(BaseModel):
    recipient_id: int
    subject: str
    body: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: Optional[str] = None
    recipient_id: int
    recipient_name: Optional[str] = None
    subject: str
    body: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Auth Response
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
