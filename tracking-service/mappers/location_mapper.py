from schemas.location_response_dto import LocationResponseDTO

class LocationMapper:
    @staticmethod
    def to_response_dto(model_dict: dict) -> LocationResponseDTO:
        return LocationResponseDTO(
            livreur_id=str(model_dict.get("livreur_id")),
            latitude=model_dict.get("latitude"),
            longitude=model_dict.get("longitude"),
            timestamp=model_dict.get("timestamp").strftime("%Y-%m-%d %H:%M:%S") if model_dict.get("timestamp") else ""
        )