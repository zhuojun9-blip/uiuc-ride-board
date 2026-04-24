from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Message, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/", response_model=schemas.MessageResponse)
async def send_message(
    message_data: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify recipient exists
    recipient = db.query(User).filter(User.id == message_data.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    db_message = Message(
        sender_id=current_user.id,
        **message_data.dict()
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.get("/inbox", response_model=List[schemas.MessageResponse])
async def get_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Message).filter(
        Message.recipient_id == current_user.id
    ).order_by(Message.created_at.desc()).all()

@router.get("/sent", response_model=List[schemas.MessageResponse])
async def get_sent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Message).filter(
        Message.sender_id == current_user.id
    ).order_by(Message.created_at.desc()).all()

@router.put("/{message_id}/read", response_model=schemas.MessageResponse)
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message.is_read = True
    db.commit()
    db.refresh(message)
    return message
