from pydantic import BaseModel
from typing import Optional

class LocationRequestDTO(BaseModel):
    livreur_id: str
    latitude: float
    longitude: float
    parcel_id: Optional[str] = "PFE-ACTIVE-SESSION" # ديري ليه default value