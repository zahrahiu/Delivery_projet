import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMotorcycle, FaMapMarkerAlt, FaCity, FaBox, FaSpinner } from 'react-icons/fa';
import { renderToStaticMarkup } from 'react-dom/server';
import axios from 'axios';

// أيقونات
const motorIcon = L.divIcon({
    html: renderToStaticMarkup(<div style={{ color: '#0088FE', fontSize: '24px', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}><FaMotorcycle /></div>),
    className: 'custom-icon',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

const destIcon = L.divIcon({
    html: renderToStaticMarkup(<div style={{ color: '#FF4444', fontSize: '20px' }}><FaMapMarkerAlt /></div>),
    className: 'custom-icon',
    iconSize: [25, 25],
    iconAnchor: [12, 25]
});

const parcelIcon = L.divIcon({
    html: renderToStaticMarkup(<div style={{ color: '#f59e0b', fontSize: '16px', background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}><FaBox /></div>),
    className: 'custom-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

interface CityCoordinates {
    id: number;
    ville: string;
    lat: number;
    lon: number;
    frais_livraison: number;
}

interface MapProps {
    parcels: any[];
}

const DeliveryMap: React.FC<MapProps> = ({ parcels }) => {
    const [cities, setCities] = useState<CityCoordinates[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeParcels, setActiveParcels] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([31.7917, -7.0926]);

    const GATEWAY_URL = "http://localhost:8888";
    const TARIFS_API = `${GATEWAY_URL}/tarif-zone-service/api/tarifs/coordinates/all`;
    const TRACKING_API = `${GATEWAY_URL}/tracking-service/api/v1/tracking/livreurs/positions`;

    // جلب إحداثيات المدن من API
    useEffect(() => {
        const fetchCitiesCoordinates = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Token non trouvé");
                    setLoading(false);
                    return;
                }

                const response = await axios.get(TARIFS_API, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data && Array.isArray(response.data)) {
                    setCities(response.data);
                    console.log("✅ Cities coordinates loaded:", response.data.length);
                } else {
                    console.warn("⚠️ Aucune donnée de villes reçue");
                    setCities([]);
                }
            } catch (err) {
                console.error("❌ Error fetching cities coordinates:", err);
                setError("Impossible de charger les coordonnées des villes");
            } finally {
                setLoading(false);
            }
        };

        fetchCitiesCoordinates();
    }, []);

    // ✅ دالة لجلب إحداثيات الطرود من العنوان (Geocoding)
    const geocodeAddress = useCallback(async (address: string): Promise<[number, number] | null> => {
        if (!address) return null;

        try {
            // استخدم OpenStreetMap Nominatim API (مجاني وما يحتاجش مفتاح)
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: `${address}, Maroc`,
                    format: 'json',
                    limit: 1,
                    'accept-language': 'fr'
                },
                headers: { 'User-Agent': 'QribLik-App/1.0' },
                timeout: 8000
            });

            if (response.data && response.data.length > 0) {
                const lat = parseFloat(response.data[0].lat);
                const lon = parseFloat(response.data[0].lon);
                return [lat, lon];
            }
        } catch (err) {
            console.error("Geocoding error for address:", address, err);
        }
        return null;
    }, []);

    // ✅ تجميع الطرود النشطة مع إحداثياتها (باستخدام Geocoding)
    useEffect(() => {
        const loadActiveParcels = async () => {
            const activeParcelsList: any[] = [];

            // فلترة الطرود النشطة (غير المسلمة)
            const activeFiltered = parcels.filter(p =>
                p.status === 'IN_TRANSIT' || p.status === 'ASSIGNED' || p.status === 'PENDING'
            );

            if (activeFiltered.length === 0) {
                setActiveParcels([]);
                return;
            }

            console.log(`📦 Chargement de ${activeFiltered.length} colis actifs...`);

            // لكل طرد نشط، جيب إحداثياتو
            for (const parcel of activeFiltered) {
                // إذا كان عندو إحداثيات مخزنة مباشرة
                if (parcel.latitude && parcel.longitude) {
                    activeParcelsList.push({
                        ...parcel,
                        coordinates: [parseFloat(parcel.latitude), parseFloat(parcel.longitude)],
                        source: 'stored'
                    });
                }
                // إذا كان عندو عنوان، حاول تجيب الإحداثيات
                else if (parcel.deliveryAddress) {
                    const coords = await geocodeAddress(parcel.deliveryAddress);
                    if (coords) {
                        activeParcelsList.push({
                            ...parcel,
                            coordinates: coords,
                            source: 'geocoded'
                        });
                    }
                }
            }

            setActiveParcels(activeParcelsList);

            // إذا كان عندنا طرود نشطة، نغير مركز الخريطة لأول طرد
            if (activeParcelsList.length > 0 && activeParcelsList[0].coordinates) {
                setMapCenter(activeParcelsList[0].coordinates);
            }
        };

        if (parcels.length > 0 && !loading) {
            loadActiveParcels();
        }
    }, [parcels, loading, geocodeAddress]);

    // ✅ حساب عدد الطرود لكل مدينة
    const getCityParcelCount = useCallback((cityName: string): number => {
        if (!cityName) return 0;

        return parcels.filter(p => {
            const parcelCity = p.cityName || p.deliveryAddress?.split(',')[0]?.trim();
            return parcelCity?.toLowerCase() === cityName.toLowerCase();
        }).length;
    }, [parcels]);

    // ✅ تحديد لون الدائرة على حسب عدد الطرود
    const getCircleColor = (count: number): string => {
        if (count >= 20) return '#e74c3c';  // أحمر (كثافة عالية)
        if (count >= 10) return '#f39c12';  // برتقالي (كثافة متوسطة)
        return '#2ecc71';                   // أخضر (كثافة قليلة)
    };

    if (loading) {
        return (
            <div className="map-container-styled" style={{
                height: '450px',
                width: '100%',
                borderRadius: '20px',
                background: '#f5f7fb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <FaSpinner style={{ fontSize: '30px', color: '#7367f0', animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '10px', color: '#666' }}>Chargement de la carte...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="map-container-styled" style={{
                height: '450px',
                width: '100%',
                borderRadius: '20px',
                background: '#f5f7fb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#f44336' }}>
                    <p>❌ {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '10px',
                            padding: '8px 16px',
                            background: '#7367f0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="map-container-styled" style={{ height: '450px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <MapContainer
                key={mapCenter.join(',')}
                center={mapCenter}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />

                {/* 🔥 نقاط المدن - فقط المدن اللي فيها طرود */}
                {cities.map((city) => {
                    const parcelCount = getCityParcelCount(city.ville);
                    if (parcelCount === 0) return null;

                    const circleColor = getCircleColor(parcelCount);
                    const radius = Math.min(12 + parcelCount, 40);

                    return (
                        <CircleMarker
                            key={`city-${city.id}`}
                            center={[city.lat, city.lon]}
                            radius={radius}
                            fillColor={circleColor}
                            color="#ffffff"
                            weight={2}
                            opacity={1}
                            fillOpacity={0.7}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center', minWidth: '160px' }}>
                                    <strong style={{ fontSize: '14px', color: circleColor }}>
                                        <FaCity style={{ display: 'inline', marginRight: '5px' }} />
                                        {city.ville}
                                    </strong>
                                    <br />
                                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>📦 {parcelCount} colis</span>
                                    <br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                        💰 {city.frais_livraison} DH
                                    </span>
                                    {parcelCount >= 10 && (
                                        <div style={{
                                            marginTop: '8px',
                                            fontSize: '10px',
                                            color: '#e74c3c',
                                            background: '#ffebee',
                                            padding: '2px 6px',
                                            borderRadius: '10px'
                                        }}>
                                            ⚠️ Zone très active
                                        </div>
                                    )}
                                </div>
                            </Popup>
                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                                <span>{city.ville}: {parcelCount} colis</span>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}

                {/* 🔥 نقاط الطرود النشطة (اللي فـ IN_TRANSIT أو ASSIGNED) */}
                {activeParcels
                    .filter(p => p.status === 'IN_TRANSIT' || p.status === 'ASSIGNED')
                    .map((parcel, idx) => (
                        <Marker
                            key={`parcel-${parcel.id}-${idx}`}
                            position={parcel.coordinates}
                            icon={parcelIcon}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center', minWidth: '200px' }}>
                                    <strong style={{ fontSize: '14px', color: '#f59e0b' }}>
                                        📦 {parcel.trackingNumber}
                                    </strong>
                                    <br />
                                    <span>📍 {parcel.cityName || parcel.deliveryAddress?.substring(0, 50)}...</span>
                                    <br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                        👤 {parcel.senderName || "Client"}
                    </span>
                                    <br />
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: parcel.status === 'IN_TRANSIT' ? '#2ecc71' : '#3498db' }}>
                        🚚 {parcel.status === 'IN_TRANSIT' ? 'En cours de livraison' : 'Assigné au livreur'}
                    </span>

                                    {/* ✅ التعديل الصحيح هنا لتفادي الـ Syntax Error */}
                                    {parcel.weight && (
                                        <>
                                            <br />
                                            <span style={{ fontSize: '10px', color: '#999' }}>
                                ⚖️ {parcel.weight} kg
                            </span>
                                        </>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                {/* 🔥 الطرود المنتظرة (PENDING) - أيقونة مختلفة */}
                {activeParcels
                    .filter(p => p.status === 'PENDING')
                    .map((parcel, idx) => (
                        <CircleMarker
                            key={`pending-${parcel.id}-${idx}`}
                            center={parcel.coordinates}
                            radius={8}
                            fillColor="#f39c12"
                            color="#ffffff"
                            weight={2}
                            opacity={1}
                            fillOpacity={0.8}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center' }}>
                                    <strong>⏳ {parcel.trackingNumber}</strong>
                                    <br />
                                    <span>📍 {parcel.cityName || parcel.deliveryAddress?.substring(0, 50)}...</span>
                                    <br />
                                    <span style={{ fontSize: '11px', color: '#f39c12' }}>
                                        ⏰ En attente d'assignation
                                    </span>
                                </div>
                            </Popup>
                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                                <span>⏳ {parcel.trackingNumber} - En attente</span>
                            </Tooltip>
                        </CircleMarker>
                    ))}

                {/* 🔥 Légende */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'white',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    fontSize: '11px',
                    fontFamily: 'sans-serif',
                    border: '1px solid #e0e0e0'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>📊 Légende</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{ width: '20px', height: '20px', background: '#2ecc71', borderRadius: '50%' }}></div>
                        <span>Faible activité (≤10 colis)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{ width: '20px', height: '20px', background: '#f39c12', borderRadius: '50%' }}></div>
                        <span>Activité moyenne (10-20 colis)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '20px', height: '20px', background: '#e74c3c', borderRadius: '50%' }}></div>
                        <span>Forte activité (+20 colis)</span>
                    </div>
                    <div style={{ borderTop: '1px solid #eee', marginTop: '6px', paddingTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <FaBox style={{ color: '#f59e0b', fontSize: '14px' }} />
                            <span>Colis en transit/assigné</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#f39c12', borderRadius: '50%' }}></div>
                            <span>Colis en attente</span>
                        </div>
                    </div>
                </div>
            </MapContainer>
        </div>
    );
};

export default DeliveryMap;