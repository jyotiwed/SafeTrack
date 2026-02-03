from typing import Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()

    def connect(self, websocket: WebSocket) -> None:
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

manager = ConnectionManager()
