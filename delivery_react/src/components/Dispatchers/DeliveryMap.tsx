import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMotorcycle, FaMapMarkerAlt } from 'react-icons/fa';
import { renderToStaticMarkup } from 'react-dom/server';

// أيقونة الموطور باللون الأزرق ديال التطبيق
const motorIcon = L.divIcon({
    html: renderToStaticMarkup(<div style={{color: '#0088FE', fontSize: '24px', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'}}><FaMotorcycle /></div>),
    className: 'custom-icon',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

// أيقونة نقطة الوصول (Destination)
const destIcon = L.divIcon({
    html: renderToStaticMarkup(<div style={{color: '#FF4444', fontSize: '20px'}}><FaMapMarkerAlt /></div>),
    className: 'custom-icon',
    iconSize: [25, 25],
});

interface MapProps {
    parcels: any[];
}

const DeliveryMap: React.FC<MapProps> = ({ parcels }) => {
    const center: [number, number] = [33.5731, -7.5898];

    return (
        <div className="map-container-styled" style={{ height: '300pxx', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                {/* استعمال ستايل خريطة فاتح ونقي */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {parcels.map((p) => {
                    // إحداثيات وهمية للمسار (مثال من نقطة A لـ B)
                    const startPos: [number, number] = [33.58, -7.60]; // فين كاين الليفرور
                    const endPos: [number, number] = [33.57, -7.58];   // فين خاص يوصل

                    return (
                        <React.Fragment key={p.id}>
                            {/* رسم الخط (Trajet) باللون الأزرق */}
                            <Polyline
                                positions={[startPos, endPos]}
                                pathOptions={{
                                    color: '#0088FE',
                                    weight: 4,
                                    opacity: 0.6,
                                    dashArray: '10, 10' // كيردو خط متقطع بحال التصويرة
                                }}
                            />

                            {/* ماركر الليفرور */}
                            <Marker position={startPos} icon={motorIcon}>
                                <Popup>Livreur en route: {p.trackingNumber}</Popup>
                            </Marker>

                            {/* ماركر نقطة الوصول */}
                            <Marker position={endPos} icon={destIcon} />
                        </React.Fragment>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default DeliveryMap;