import React, { useEffect, useState } from 'react';
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

    const GATEWAY_URL = "http://localhost:8888";
    const TARIFS_API = `${GATEWAY_URL}/tarif-zone-service/api/tarifs/coordinates/all`;

    const center: [number, number] = [31.7917, -7.0926];

    // جلب إحداثيات المدن من API
    useEffect(() => {
        const fetchCitiesCoordinates = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const response = await axios.get(TARIFS_API, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCities(response.data);
                console.log("✅ Cities coordinates loaded:", response.data);
            } catch (err) {
                console.error("❌ Error fetching cities coordinates:", err);
                setError("Impossible de charger les coordonnées des villes");
            } finally {
                setLoading(false);
            }
        };

        fetchCitiesCoordinates();
    }, []);

    // تجميع الطرود النشطة
    useEffect(() => {
        const activeParcelsList: any[] = [];

        parcels.forEach(parcel => {
            if (parcel.status === 'IN_TRANSIT' || parcel.status === 'ASSIGNED') {
                const destCity = parcel.deliveryAddress || parcel.zone || parcel.ville;
                const cityCoords = cities.find(c =>
                    c.ville.toLowerCase() === destCity?.toLowerCase()
                );

                if (cityCoords) {
                    activeParcelsList.push({
                        ...parcel,
                        coordinates: [cityCoords.lat, cityCoords.lon],
                        city: destCity
                    });
                }
            }
        });

        setActiveParcels(activeParcelsList);
    }, [parcels, cities]);

    // حساب عدد الطرود لكل مدينة
    const getCityParcelCount = (cityName: string): number => {
        return parcels.filter(p => {
            const parcelCity = p.deliveryAddress || p.zone || p.ville;
            return parcelCity?.toLowerCase() === cityName.toLowerCase();
        }).length;
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
                </div>
            </div>
        );
    }

    return (
        <div className="map-container-styled" style={{ height: '450px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />

                {/* 🔥 نقاط المدن ديناميكية من API */}
                {cities.map((city) => {
                    const parcelCount = getCityParcelCount(city.ville);
                    if (parcelCount === 0) return null;

                    return (
                        <CircleMarker
                            key={city.id}
                            center={[city.lat, city.lon]}
                            radius={Math.min(15 + parcelCount * 2, 35)}
                            fillColor="#7367f0"
                            color="#ffffff"
                            weight={2}
                            opacity={1}
                            fillOpacity={0.6}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center', minWidth: '140px' }}>
                                    <strong style={{ fontSize: '14px', color: '#7367f0' }}>
                                        <FaCity style={{ display: 'inline', marginRight: '5px' }} />
                                        {city.ville}
                                    </strong>
                                    <br />
                                    <span style={{ fontSize: '12px' }}>📦 {parcelCount} colis</span>
                                    <br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                        💰 {city.frais_livraison} DH
                                    </span>
                                </div>
                            </Popup>
                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                                <span>{city.ville}: {parcelCount} colis</span>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}

                {/* 🔥 نقاط الطرود النشطة */}
                {activeParcels.map((parcel) => (
                    <Marker
                        key={parcel.id}
                        position={parcel.coordinates}
                        icon={parcelIcon}
                    >
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <strong>📦 {parcel.trackingNumber}</strong>
                                <br />
                                <span>📍 {parcel.city}</span>
                                <br />
                                <span style={{ fontSize: '11px', color: '#666' }}>
                                    {parcel.senderName}
                                </span>
                                <br />
                                <span style={{ fontSize: '11px', color: '#666' }}>
                                    🚚 {parcel.status === 'IN_TRANSIT' ? 'En cours de livraison' : 'Assigné'}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* 🔥 Légende */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'white',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    fontSize: '12px',
                    fontFamily: 'sans-serif'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '20px', height: '20px', background: '#7367f0', borderRadius: '50%', opacity: 0.6 }}></div>
                        <span>Zone avec colis (plus gros = plus de colis)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaBox style={{ color: '#f59e0b', fontSize: '14px' }} />
                        <span>Colis actif</span>
                    </div>
                </div>
            </MapContainer>
        </div>
    );
};

export default DeliveryMap;