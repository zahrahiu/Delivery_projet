from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from services.tracking_service import TrackingService
from schemas.location_request_dto import LocationRequestDTO
from config.security import verify_token

router = APIRouter(tags=["Tracking"])
manager = TrackingService.manager

@router.post("/update",
             summary="Mettre à jour la position GPS",
             description="Reçoit les coordonnées GPS du livreur et les diffuse en temps réel.")
async def update_location(
        dto: LocationRequestDTO,
        user_data: dict = Depends(verify_token)
):
    """
    Cette route nécessite un Token JWT valide avec le rôle ROLE_LIVREUR ou ROLE_ADMIN.
    """
    print(f"Update by user: {user_data.get('sub')}")
    response = await TrackingService.save_and_broadcast(dto)
    return response

@router.websocket("/ws/{livreur_id}")
async def websocket_endpoint(websocket: WebSocket, livreur_id: str):
    """
    Flux WebSocket pour le suivi en temps réel d'un livreur spécifique.
    """
    await manager.connect(websocket, livreur_id)
    try:
        while True:
            # Maintenir la connexion ouverte
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, livreur_id)

@router.get("/last/{livreur_id}",
            summary="Obtenir la dernière position",
            description="Récupère la position la plus récente enregistrée dans MongoDB pour un livreur.")
async def get_livreur_last_location(livreur_id: str):
    location = await TrackingService.get_last_location(livreur_id)
    if not location:
        raise HTTPException(status_code=404, detail="Aucune position trouvée pour ce livreur")
    return location