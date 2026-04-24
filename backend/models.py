from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, Enum
from sqlalchemy.sql import func
from database import Base
from datetime import datetime
import enum

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class UserRole(str, enum.Enum):
    rider = "rider"
    driver = "driver"
    both = "both"

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    route = Column(String, nullable=False, index=True)
    vehicle = Column(String, nullable=False)
    available_seats = Column(Integer, nullable=False)
    departure_time = Column(String, nullable=False)
    price_per_seat = Column(Float, nullable=False, default=0.0)
    pickup_location = Column(String, nullable=False)
    skills = Column(Text)
    labels = Column(Text)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class RiderRequest(Base):
    __tablename__ = "rider_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    route = Column(String, nullable=False, index=True)
    departure_time = Column(String, nullable=False)
    passengers = Column(Integer, nullable=False)
    details = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class DriverApplication(Base):
    __tablename__ = "driver_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    primary_route = Column(String, nullable=False)
    available_seats = Column(Integer, nullable=False)
    notes = Column(Text)
    status = Column(String, default="pending", index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, nullable=False, index=True)
    recipient_id = Column(Integer, nullable=False, index=True)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class RideReview(Base):
    __tablename__ = "ride_reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, nullable=False, index=True)
    driver_user_id = Column(Integer, nullable=False, index=True)
    driver_listing_id = Column(Integer, nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class RideReport(Base):
    __tablename__ = "ride_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, nullable=False, index=True)
    against_user_id = Column(Integer, nullable=False, index=True)
    driver_listing_id = Column(Integer, nullable=False, index=True)
    category = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="open", index=True)
    created_at = Column(DateTime, server_default=func.now())
