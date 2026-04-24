from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from datetime import timedelta
from pathlib import Path
from uuid import uuid4
from database import get_db, is_admin_email, settings
from models import User
import schemas
from auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
avatar_upload_dir = Path(__file__).resolve().parents[1] / "uploads" / "avatars"
avatar_upload_dir.mkdir(parents=True, exist_ok=True)

@router.post("/register", response_model=schemas.Token)
async def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        is_admin=is_admin_email(user_data.email),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": db_user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse.from_orm(db_user)
    }

@router.post("/login", response_model=schemas.Token)
async def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # Find user by email
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    expected_admin_status = is_admin_email(db_user.email)
    if db_user.is_admin != expected_admin_status:
        db_user.is_admin = expected_admin_status
        db.commit()
        db.refresh(db_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": db_user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse.from_orm(db_user)
    }

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return schemas.UserResponse.from_orm(current_user)


@router.post("/avatar", response_model=schemas.UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_types = {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/heic",
        "image/heif",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Avatar must be a JPG, PNG, WEBP, GIF, HEIC, or HEIF image")

    extension = Path(file.filename or "avatar").suffix.lower() or ".png"
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"}:
        extension = ".png"

    file_bytes = await file.read()
    if len(file_bytes) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Avatar image must be 2MB or smaller")

    filename = f"user_{current_user.id}_{uuid4().hex}{extension}"
    file_path = avatar_upload_dir / filename
    file_path.write_bytes(file_bytes)

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)

    return schemas.UserResponse.from_orm(current_user)
