from fastapi import WebSocket
from typing import List, Dict, Set
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Store active connections: {user_id: [websocket, ...]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Store all connected user IDs for presence
        self.connected_users: Set[int] = set()

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.connected_users.add(user_id)
        
        # Notify others that user is online
        await self.broadcast_presence({
            "type": "user_online",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.connected_users.discard(user_id)

    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")

    async def broadcast_presence(self, message: dict):
        """Broadcast user presence to all connected users"""
        for user_id in self.connected_users:
            await self.send_personal_message(message, user_id)

    async def notify_new_message(self, sender_id: int, recipient_id: int, message_data: dict):
        """Notify recipient of new message"""
        notification = {
            "type": "new_message",
            "sender_id": sender_id,
            "data": message_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_personal_message(notification, recipient_id)

    async def notify_driver_contacted(self, driver_id: int, rider_info: dict):
        """Notify driver when contacted by rider"""
        notification = {
            "type": "driver_contacted",
            "data": rider_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_personal_message(notification, driver_id)

    async def notify_ride_offered(self, rider_id: int, driver_info: dict):
        """Notify rider when driver offers a ride"""
        notification = {
            "type": "ride_offered",
            "data": driver_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_personal_message(notification, rider_id)

manager = ConnectionManager()
