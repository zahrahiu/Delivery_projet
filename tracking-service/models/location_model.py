from pydantic import BaseModel, Field
from datetime import datetime

class LocationModel(BaseModel):
    livreur_id: str
    latitude: float
    longitude: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)