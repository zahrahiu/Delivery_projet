import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from "axios";
import Swal from 'sweetalert2';
import { FaTruck, FaMapMarkerAlt, FaCheckCircle, FaPlay, FaStop } from "react-icons/fa";

// Configuration des icônes
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/754/754848.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const destinationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35]
});

const RecenterMap = ({ pos }: { pos: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (pos[0] !== 0) map.flyTo(pos, 14, { animate: true });
    }, [pos]);
    return null;
};

interface LivreurTrackingProps {
    parcels: any[];
    onRefresh: () => void;
}

const LivreurTracking: React.FC<LivreurTrackingProps> = ({ parcels, onRefresh }) => {
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [destinationPos, setDestinationPos] = useState<[number, number] | null>(null);
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const GATEWAY_URL = "http://localhost:8888";
    const GOOGLE_KEY = "AIzaSyChQm1ZooFDhY3n63766a_dwwJmUGSRxG0";

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const getUserId = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.sub;
    };

    // Géocoder l'adresse
    const geocodeAddress = async (address: string) => {
        try {
            const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: { address: `${address}, Morocco`, key: GOOGLE_KEY }
            });
            if (res.data.status === "OK") {
                const { lat, lng } = res.data.results[0].geometry.location;
                return [lat, lng] as [number, number];
            }
        } catch (err) {
            console.error("Geocoding error:", err);
        }
        return null;
    };

    const handleSelectParcel = async (parcel: any) => {
        setSelectedParcel(parcel);
        setLoading(true);
        const dest = await geocodeAddress(parcel.deliveryAddress);
        if (dest) setDestinationPos(dest);
        setLoading(false);
    };

    // Démarrer le partage de position
    const startSharing = () => {
        if (!navigator.geolocation) {
            Swal.fire('Erreur', 'Geolocalisation non supportée', 'error');
            return;
        }

        setIsSharing(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setCurrentPos(coords);
            await sendLocation(pos.coords.latitude, pos.coords.longitude);
        });

        const id = navigator.geolocation.watchPosition(
            async (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setCurrentPos(coords);
                await sendLocation(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => console.error("Geolocation error:", err),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        setWatchId(id);
        Swal.fire('Partage activé', 'Votre position est maintenant partagée', 'success');
    };

    const stopSharing = () => {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        setIsSharing(false);
        Swal.fire('Partage arrêté', 'Votre position n\'est plus partagée', 'info');
    };

    const sendLocation = async (lat: number, lng: number) => {
        try {
            const livreurId = getUserId();
            await axios.post(
                `${GATEWAY_URL}/tracking-service/api/v1/tracking/update`,
                { livreurId, latitude: lat, longitude: lng, timestamp: new Date().toISOString() },
                getHeaders()
            );
        } catch (err) {
            console.error("Failed to send location:", err);
        }
    };

    const confirmDelivery = async () => {
        if (!selectedParcel) return;

        const result = await Swal.fire({
            title: 'Confirmer la livraison?',
            text: `Avez-vous bien livré le colis ${selectedParcel.trackingNumber}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oui, livré!',
            confirmButtonColor: '#2ecc71'
        });

        if (result.isConfirmed) {
            try {
                await axios.patch(
                    `${GATEWAY_URL}/parcel-service/api/parcels/${selectedParcel.id}/status?status=DELIVERED`,
                    {},
                    getHeaders()
                );

                Swal.fire('Livraison confirmée!', 'Le client a été notifié', 'success');
                stopSharing();
                onRefresh();
                setSelectedParcel(null);
                setDestinationPos(null);
            } catch (err) {
                Swal.fire('Erreur', 'Impossible de confirmer la livraison', 'error');
            }
        }
    };

    const pendingParcels = parcels.filter(p => p.status === 'ASSIGNED' || p.status === 'IN_TRANSIT');

    return (
        <div className="tracking-container">
            <div className="tracking-header">
                <h2>🗺️ Suivi & Navigation</h2>
                <div className="share-controls">
                    {!isSharing ? (
                        <button className="btn-share-start" onClick={startSharing}>
                            <FaPlay /> Démarrer le partage
                        </button>
                    ) : (
                        <button className="btn-share-stop" onClick={stopSharing}>
                            <FaStop /> Arrêter le partage
                        </button>
                    )}
                </div>
            </div>

            <div className="tracking-content">
                {/* Liste des colis */}
                <div className="parcels-list-tracking">
                    <h3>Sélectionner un colis</h3>
                    {pendingParcels.length === 0 ? (
                        <div className="empty-msg">Aucun colis en cours</div>
                    ) : (
                        <div className="parcels-list">
                            {pendingParcels.map(parcel => (
                                <div
                                    key={parcel.id}
                                    className={`parcel-item ${selectedParcel?.id === parcel.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectParcel(parcel)}
                                >
                                    <div className="parcel-item-header">
                                        <strong>{parcel.trackingNumber}</strong>
                                        <span className={`status-dot ${parcel.status === 'IN_TRANSIT' ? 'transit' : 'assigned'}`}></span>
                                    </div>
                                    <div className="parcel-item-address">
                                        {parcel.deliveryAddress?.substring(0, 50)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Carte */}
                <div className="map-container">
                    {loading ? (
                        <div className="map-loading">Chargement de la carte...</div>
                    ) : !selectedParcel ? (
                        <div className="map-placeholder">
                            <FaMapMarkerAlt className="placeholder-icon" />
                            <p>Sélectionnez un colis pour voir l'itinéraire</p>
                        </div>
                    ) : (
                        <MapContainer
                            center={currentPos || destinationPos || [33.5731, -7.5898]}
                            zoom={13}
                            style={{ height: '500px', width: '100%', borderRadius: '16px' }}
                        >
                            <TileLayer
                                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                attribution='&copy; Google Maps'
                            />

                            {currentPos && (
                                <Marker position={currentPos} icon={truckIcon}>
                                    <Popup>Ma position actuelle 🚚</Popup>
                                </Marker>
                            )}

                            {destinationPos && (
                                <Marker position={destinationPos} icon={destinationIcon}>
                                    <Popup>Destination: {selectedParcel?.deliveryAddress}</Popup>
                                </Marker>
                            )}

                            {currentPos && destinationPos && (
                                <Polyline
                                    positions={[currentPos, destinationPos]}
                                    color="#3b4e61"
                                    weight={4}
                                    opacity={0.8}
                                />
                            )}

                            {currentPos && <RecenterMap pos={currentPos} />}
                        </MapContainer>
                    )}

                    {selectedParcel && (
                        <div className="delivery-actions">
                            <button className="btn-confirm-delivery" onClick={confirmDelivery}>
                                <FaCheckCircle /> Confirmer la livraison
                            </button>
                            <button
                                className="btn-google-maps"
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${destinationPos?.[0]},${destinationPos?.[1]}`)}
                            >
                                Ouvrir avec Google Maps
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .tracking-container { max-width: 1400px; margin: 0 auto; }
                .tracking-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
                .tracking-header h2 { color: #1a2a3a; }
                .share-controls .btn-share-start, .share-controls .btn-share-stop { padding: 10px 20px; border: none; border-radius: 30px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: 0.2s; }
                .btn-share-start { background: #2ecc71; color: white; }
                .btn-share-stop { background: #e74c3c; color: white; }
                .tracking-content { display: grid; grid-template-columns: 300px 1fr; gap: 25px; }
                .parcels-list-tracking { background: white; border-radius: 16px; padding: 20px; height: fit-content; }
                .parcels-list-tracking h3 { margin-bottom: 15px; color: #3b4e61; font-size: 16px; }
                .parcels-list { display: flex; flex-direction: column; gap: 10px; max-height: 450px; overflow-y: auto; }
                .parcel-item { padding: 15px; background: #f8f9fa; border-radius: 12px; cursor: pointer; transition: 0.2s; border: 2px solid transparent; }
                .parcel-item:hover { background: #e8eef3; }
                .parcel-item.selected { border-color: #3b4e61; background: #e8eef3; }
                .parcel-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .parcel-item-header strong { color: #3b4e61; font-size: 13px; }
                .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
                .status-dot.transit { background: #2ecc71; }
                .status-dot.assigned { background: #f39c12; }
                .parcel-item-address { font-size: 12px; color: #666; }
                .map-container { background: #f0f2f5; border-radius: 16px; overflow: hidden; }
                .map-placeholder { height: 500px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; }
                .placeholder-icon { font-size: 50px; margin-bottom: 15px; color: #ccc; }
                .map-loading { height: 500px; display: flex; align-items: center; justify-content: center; }
                .delivery-actions { display: flex; gap: 15px; padding: 20px; background: white; border-top: 1px solid #eee; }
                .btn-confirm-delivery { flex: 1; background: #2ecc71; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
                .btn-google-maps { flex: 1; background: #3b4e61; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
                .btn-confirm-delivery:hover, .btn-google-maps:hover { transform: translateY(-2px); filter: brightness(1.05); }
                .empty-msg { text-align: center; padding: 40px; color: #999; }
                @media (max-width: 900px) { .tracking-content { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
};

export default LivreurTracking;