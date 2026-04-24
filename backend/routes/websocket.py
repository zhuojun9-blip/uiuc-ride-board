from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
import json
from websocket_manager import manager
from jose import jwt
from database import settings

router = APIRouter(prefix="/ws", tags=["websocket"])

def get_user_id_from_token(token: str) -> int:
    """Extract user_id from JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            return None
        return user_id
    except:
        return None

@router.websocket("/notifications/{token}")
async def websocket_notifications(websocket: WebSocket, token: str):
    """WebSocket endpoint for real-time notifications and messages"""
    
    # Verify token and get user_id
    user_id = get_user_id_from_token(token)
    if user_id is None:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            if data.get("type") == "ping":
                # Respond to keep-alive ping
                await websocket.send_json({"type": "pong"})
            
            elif data.get("type") == "message":
                # Handle incoming message
                message_data = {
                    "type": "message",
                    "sender_id": user_id,
                    "recipient_id": data.get("recipient_id"),
                    "subject": data.get("subject"),
                    "body": data.get("body"),
                    "timestamp": data.get("timestamp")
                }
                
                # Send to recipient
                await manager.notify_new_message(
                    user_id,
                    data.get("recipient_id"),
                    message_data
                )
                
                # Confirm to sender
                await websocket.send_json({
                    "type": "message_sent",
                    "recipient_id": data.get("recipient_id"),
                    "status": "delivered"
                })
            
            elif data.get("type") == "contact_driver":
                # Notify driver of contact
                await manager.notify_driver_contacted(
                    data.get("driver_id"),
                    {
                        "rider_id": user_id,
                        "route": data.get("route"),
                        "message": data.get("message")
                    }
                )
                
                await websocket.send_json({
                    "type": "contact_sent",
                    "driver_id": data.get("driver_id"),
                    "status": "sent"
                })
            
            elif data.get("type") == "offer_ride":
                # Notify rider of ride offer
                await manager.notify_ride_offered(
                    data.get("rider_id"),
                    {
                        "driver_id": user_id,
                        "route": data.get("route"),
                        "departure_time": data.get("departure_time")
                    }
                )
                
                await websocket.send_json({
                    "type": "offer_sent",
                    "rider_id": data.get("rider_id"),
                    "status": "sent"
                })
    
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        # Notify others user is offline
        await manager.broadcast_presence({
            "type": "user_offline",
            "user_id": user_id
        })
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user_id, websocket)
