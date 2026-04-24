from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Message, User
import schemas
from auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


def serialize_message(message: Message, db: Session):
    sender = db.query(User).filter(User.id == message.sender_id).first()
    recipient = db.query(User).filter(User.id == message.recipient_id).first()
    return schemas.MessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        sender_name=sender.name if sender else None,
        recipient_id=message.recipient_id,
        recipient_name=recipient.name if recipient else None,
        subject=message.subject,
        body=message.body,
        is_read=message.is_read,
        created_at=message.created_at,
    )

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
    return serialize_message(db_message, db)

@router.get("/inbox", response_model=List[schemas.MessageResponse])
async def get_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(
        Message.recipient_id == current_user.id
    ).order_by(Message.created_at.desc()).all()
    return [serialize_message(message, db) for message in messages]

@router.get("/sent", response_model=List[schemas.MessageResponse])
async def get_sent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(
        Message.sender_id == current_user.id
    ).order_by(Message.created_at.desc()).all()
    return [serialize_message(message, db) for message in messages]

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
    return serialize_message(message, db)
