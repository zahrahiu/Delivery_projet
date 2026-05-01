from pydantic import BaseModel

class LocationResponseDTO(BaseModel):
    livreur_id: str
    latitude: float
    longitude: float
    timestamp: str