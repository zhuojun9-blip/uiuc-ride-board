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
    avatar_url: Optional[str] = None
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
    skills: Optional[str] = None
    labels: Optional[str] = None
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
    skills: Optional[str] = None
    labels: Optional[str] = None
    notes: Optional[str] = None

class DriverResponse(DriverBase):
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_avatar_url: Optional[str] = None
    driver_tier: Optional[str] = None
    email_verified: bool = False
    sms_verified: bool = False
    trust_score: int = 0
    trust_level: str = "low"
    rating_average: float = 0
    rating_count: int = 0
    ride_history_count: int = 0
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
    skills: Optional[str] = None
    labels: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DriverHistoryResponse(BaseModel):
    driver_user_id: int
    driver_name: str
    driver_email: EmailStr
    driver_avatar_url: Optional[str] = None
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
    user_avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Driver Application Schemas
class DriverApplicationBase(BaseModel):
    full_name: str
    driver_tier: str = "uiuc_verified"
    primary_route: str
    phone_number: str
    vehicle_info: str
    email_verified: bool = False
    sms_verified: bool = False
    id_upload_status: Optional[str] = None
    available_seats: int
    notes: Optional[str] = None

class DriverApplicationCreate(DriverApplicationBase):
    email: EmailStr


class DriverApplicationUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    driver_tier: Optional[str] = None
    phone_number: Optional[str] = None
    vehicle_info: Optional[str] = None
    email_verified: Optional[bool] = None
    sms_verified: Optional[bool] = None
    id_upload_status: Optional[str] = None
    primary_route: Optional[str] = None
    available_seats: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class DriverApplicationStatusUpdate(BaseModel):
    status: str

class DriverApplicationResponse(DriverApplicationCreate):
    id: int
    user_id: int
    user_avatar_url: Optional[str] = None
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
    sender_avatar_url: Optional[str] = None
    recipient_id: int
    recipient_name: Optional[str] = None
    recipient_avatar_url: Optional[str] = None
    subject: str
    body: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RideReviewCreate(BaseModel):
    driver_user_id: int
    driver_listing_id: int
    rating: int
    comment: Optional[str] = None


class RideReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    reviewer_avatar_url: Optional[str] = None
    driver_user_id: int
    driver_listing_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RideReportCreate(BaseModel):
    against_user_id: int
    driver_listing_id: int
    category: str
    details: str


class RideReportStatusUpdate(BaseModel):
    status: str


class RideReportResponse(BaseModel):
    id: int
    reporter_id: int
    reporter_name: Optional[str] = None
    reporter_avatar_url: Optional[str] = None
    against_user_id: int
    against_user_name: Optional[str] = None
    against_user_avatar_url: Optional[str] = None
    driver_listing_id: int
    category: str
    details: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SharedRideRequestCreate(BaseModel):
    driver_listing_id: int
    seats_requested: int
    message: Optional[str] = None


class SharedRideRequestStatusUpdate(BaseModel):
    status: str


class SharedRideRequestResponse(BaseModel):
    id: int
    driver_listing_id: int
    driver_user_id: int
    driver_route: Optional[str] = None
    driver_departure_time: Optional[str] = None
    rider_user_id: int
    rider_name: Optional[str] = None
    rider_avatar_url: Optional[str] = None
    rider_email: Optional[EmailStr] = None
    seats_requested: int
    message: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Auth Response
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
