import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from "axios";
import { FaTruck, FaRoute, FaSpinner } from "react-icons/fa";

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icône personnalisée pour le livreur
const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/754/754848.png',
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -45]
});

// Icône numérotée pour les colis
const createNumberedIcon = (number: number) => {
    const html = `
        <div style="
            background-color: #e74c3c;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        ">
            ${number}
        </div>
    `;
    return L.divIcon({ html, className: 'custom-div-icon', iconSize: [35, 35], iconAnchor: [17, 17] });
};

// Composant pour recentrer la carte
const RecenterMap = ({ pos }: { pos: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (pos && pos[0] !== 0) map.flyTo(pos, 12, { animate: true, duration: 1 });
    }, [pos]);
    return null;
};

interface LivreurRouteMapProps {
    parcels: any[];
    onRefresh: () => void;
}

const LivreurRouteMap: React.FC<LivreurRouteMapProps> = ({ parcels, onRefresh }) => {
    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [optimizedRoute, setOptimizedRoute] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalDistance, setTotalDistance] = useState<number>(0);

    // ✅ استخراج الإحداثيات من الـ parcel
    const getParcelCoordinates = (parcel: any): [number, number] | null => {
        if (parcel.latitude && parcel.longitude) {
            return [parseFloat(parcel.latitude), parseFloat(parcel.longitude)];
        }
        return null;
    };

    // ✅ Optimiser la route (algorithme du plus proche voisin)
    const optimizeRouteWithStoredCoords = (start: [number, number], parcelsList: any[]) => {
        // فلترة الكوليسات اللي عندهم إحداثيات
        const parcelsWithCoords = parcelsList.filter(p => getParcelCoordinates(p) !== null);

        console.log("📦 Parcels avec coordonnées:", parcelsWithCoords.length);

        if (parcelsWithCoords.length === 0) return [];

        const points = parcelsWithCoords.map(p => ({
            id: p.id,
            coords: getParcelCoordinates(p)!,
            parcel: p
        }));

        const visited = new Set<number>();
        const route: any[] = [];
        let currentPos = start;

        while (visited.size < points.length) {
            let nearestIdx = -1;
            let nearestDist = Infinity;

            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                if (!visited.has(point.id)) {
                    const dist = Math.hypot(currentPos[0] - point.coords[0], currentPos[1] - point.coords[1]);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestIdx = i;
                    }
                }
            }

            if (nearestIdx !== -1) {
                const point = points[nearestIdx];
                visited.add(point.id);
                route.push({ ...point, distance: nearestDist });
                currentPos = point.coords;
            }
        }

        // حساب المسافة الإجمالية
        let total = 0;
        let prev = start;
        route.forEach(item => {
            total += Math.hypot(prev[0] - item.coords[0], prev[1] - item.coords[1]) * 111;
            prev = item.coords;
        });
        setTotalDistance(total);

        return route;
    };

    // ✅ جلب الموقع الحالي (مرة واحدة)
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setCurrentLocation([35.1749, -6.1393]); // Larache par défaut
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setCurrentLocation([35.1749, -6.1393]);
        }
    }, []);

    // ✅ حساب الراوت عند تغيير currentLocation ou parcels
    useEffect(() => {
        if (currentLocation && parcels.length > 0) {
            setLoading(true);

            const pendingParcels = parcels.filter(p => p.status !== 'DELIVERED');
            const parcelsWithCoords = pendingParcels.filter(p => p.latitude && p.longitude);

            console.log("📍 Current location:", currentLocation);
            console.log("📦 Total pending parcels:", pendingParcels.length);
            console.log("📦 Parcels with GPS coordinates:", parcelsWithCoords.length);

            // Afficher les coordonnées de chaque colis
            parcelsWithCoords.forEach(p => {
                console.log(`   - ${p.trackingNumber}: (${p.latitude}, ${p.longitude})`);
            });

            if (parcelsWithCoords.length > 0) {
                const route = optimizeRouteWithStoredCoords(currentLocation, pendingParcels);
                setOptimizedRoute(route);
                console.log("✅ Route optimisée:", route.length, "étapes");
            } else {
                console.log("⚠️ Aucun colis avec coordonnées GPS");
                setOptimizedRoute([]);
            }

            setLoading(false);
        }
    }, [currentLocation, parcels]);

    const pendingParcels = parcels.filter(p => p.status !== 'DELIVERED');
    const parcelsWithCoords = pendingParcels.filter(p => p.latitude && p.longitude);
    const center = currentLocation || [33.5731, -7.5898];

    return (
        <div className="route-map-container">
            <div className="route-map-header">
                <h2><FaRoute /> Optimisation de tournée</h2>
                <div className="route-stats">
                    <div className="stat">
                        <span className="stat-value">{pendingParcels.length}</span>
                        <span className="stat-label">Colis à livrer</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{parcelsWithCoords.length}</span>
                        <span className="stat-label">Avec GPS</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{optimizedRoute.length}</span>
                        <span className="stat-label">Étapes</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{totalDistance.toFixed(1)} km</span>
                        <span className="stat-label">Distance totale</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="route-map-loading">
                    <FaSpinner className="spinner" />
                    <p>Chargement de la carte...</p>
                </div>
            ) : (
                <>
                    <MapContainer
                        center={center}
                        zoom={11}
                        style={{ height: '550px', width: '100%', borderRadius: '20px' }}
                        className="route-map"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />

                        {/* Marqueur du livreur */}
                        {currentLocation && (
                            <Marker position={currentLocation} icon={truckIcon}>
                                <Popup>
                                    <strong>📍 Ma position</strong><br />
                                    {optimizedRoute.length > 0 && `Prochain arrêt: ${optimizedRoute[0]?.parcel?.trackingNumber || 'Non défini'}`}
                                </Popup>
                            </Marker>
                        )}

                        {/* Marqueurs des colis avec numéros */}
                        {optimizedRoute.map((item, index) => {
                            const parcel = item.parcel;
                            return (
                                <Marker
                                    key={item.id}
                                    position={item.coords}
                                    icon={createNumberedIcon(index + 1)}
                                >
                                    <Popup>
                                        <div className="popup-content">
                                            <strong>#{index + 1} - {parcel?.trackingNumber}</strong>
                                            <p><strong>Adresse:</strong> {parcel?.deliveryAddress?.substring(0, 80)}...</p>
                                            <p><strong>Client:</strong> {parcel?.senderName}</p>
                                            <p><strong>Tél:</strong> {parcel?.senderPhone}</p>
                                            {parcel?.latitude && parcel?.longitude && (
                                                <p className="gps-coords">
                                                    📍 GPS: {parseFloat(parcel.latitude).toFixed(6)}, {parseFloat(parcel.longitude).toFixed(6)}
                                                </p>
                                            )}
                                            <button
                                                className="popup-start-btn"
                                                onClick={() => {
                                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.coords[0]},${item.coords[1]}`);
                                                }}
                                            >
                                                Commencer la livraison →
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        <RecenterMap pos={currentLocation || center} />
                    </MapContainer>

                    {/* Liste des étapes */}
                    {optimizedRoute.length > 0 && (
                        <div className="route-steps-list">
                            <h3>📋 Plan de livraison</h3>
                            <div className="steps-container">
                                {optimizedRoute.map((item, index) => (
                                    <div key={item.id} className="step-item">
                                        <div className="step-number">{index + 1}</div>
                                        <div className="step-info">
                                            <div className="step-tracking">{item.parcel?.trackingNumber}</div>
                                            <div className="step-address">{item.parcel?.deliveryAddress?.substring(0, 50)}...</div>
                                        </div>
                                        <div className="step-distance">
                                            {index === 0 ? 'Prochain' : `${item.distance?.toFixed(1)} km`}
                                        </div>
                                        <button
                                            className="step-nav-btn"
                                            onClick={() => {
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.coords[0]},${item.coords[1]}`);
                                            }}
                                        >
                                            Naviguer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <style>{`
                .route-map-container {
                    background: white;
                    border-radius: 24px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                }
                .route-map-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .route-map-header h2 {
                    color: #1a2a3a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                }
                .route-stats {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .route-stats .stat {
                    text-align: center;
                    background: #f8f9fa;
                    padding: 8px 15px;
                    border-radius: 12px;
                    min-width: 80px;
                }
                .route-stats .stat-value {
                    display: block;
                    font-size: 22px;
                    font-weight: bold;
                    color: #3b4e61;
                }
                .route-stats .stat-label {
                    font-size: 10px;
                    color: #888;
                }
                .route-map-loading {
                    height: 550px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                    border-radius: 20px;
                    gap: 15px;
                }
                .spinner {
                    animation: spin 1s linear infinite;
                    font-size: 40px;
                    color: #3b4e61;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .route-steps-list {
                    margin-top: 20px;
                    max-height: 300px;
                    overflow-y: auto;
                }
                .route-steps-list h3 {
                    margin-bottom: 15px;
                    color: #1a2a3a;
                }
                .steps-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .step-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    transition: 0.2s;
                }
                .step-item:hover {
                    background: #e8eef3;
                    transform: translateX(5px);
                }
                .step-number {
                    width: 35px;
                    height: 35px;
                    background: #3b4e61;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                }
                .step-info {
                    flex: 1;
                }
                .step-tracking {
                    font-weight: 600;
                    color: #3b4e61;
                    font-size: 13px;
                }
                .step-address {
                    font-size: 11px;
                    color: #777;
                }
                .step-distance {
                    font-size: 12px;
                    color: #888;
                    min-width: 80px;
                }
                .step-nav-btn {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 6px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: 0.2s;
                }
                .step-nav-btn:hover {
                    background: #2980b9;
                    transform: scale(1.02);
                }
                .popup-content {
                    text-align: center;
                    min-width: 240px;
                }
                .popup-content strong {
                    display: block;
                    margin-bottom: 8px;
                }
                .popup-content p {
                    margin: 5px 0;
                    font-size: 12px;
                }
                .popup-content .gps-coords {
                    font-size: 10px;
                    color: #666;
                    font-family: monospace;
                }
                .popup-start-btn {
                    margin-top: 10px;
                    background: #2ecc71;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    width: 100%;
                }
                .popup-start-btn:hover {
                    background: #27ae60;
                }
                @media (max-width: 768px) {
                    .route-map-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .route-stats {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            `}</style>
        </div>
    );
};

export default LivreurRouteMap;