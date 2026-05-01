import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from "axios";

const GOOGLE_KEY = "AIzaSyChQm1ZooFDhY3n63766a_dwwJmUGSRxG0";

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
        if (pos[0] !== 0) map.flyTo(pos, 13, { animate: true });
    }, [pos]);
    return null;
};

const ClientTracking = ({ livreurId, address }: { livreurId: string, address?: string }) => {
    // كبداية كنحطو إحداثيات خاوية
    const [livreurPos, setLivreurPos] = useState<[number, number] | null>(null);
    const [destPos, setDestPos] = useState<[number, number] | null>(null);
    const GATEWAY_URL = "http://localhost:8888";

    // 1. تحويل العنوان لإحداثيات (Dynamic Geocoding)
    useEffect(() => {
        if (!address) return;

        const getGeocode = async () => {
            try {
                // هادي دابا ديناميك، كتمشي تسول Google على العنوان اللي ف الـ Database
                const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                    params: { address: `${address}, Morocco`, key: GOOGLE_KEY }
                });
                if (res.data.status === "OK") {
                    const { lat, lng } = res.data.results[0].geometry.location;
                    setDestPos([lat, lng]);
                    console.log("📍 Dynamic Destination Set:", lat, lng);
                }
            } catch (err) { console.error("Geocoding failed"); }
        };
        getGeocode();
    }, [address]);

    // 2. تتبع الليفرور (Dynamic WebSocket + Initial Fetch)
    // داخل useEffect اللي كيجيب fetchInitialLocation
    useEffect(() => {
        const fetchInitialLocation = async () => {
            if (!livreurId) return;
            try {
                // 1. جبدي الـ Token اللي مسيفة عندك ف الـ Browser
                const token = localStorage.getItem("token");

                // 2. صيفطي الـ Header مع الـ Request
                const res = await axios.get(
                    `${GATEWAY_URL}/tracking-service/api/v1/tracking/last/${livreurId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}` // ضروري هاد السطر
                        }
                    }
                );

                if (res.data && res.data.latitude) {
                    const lastCoords: [number, number] = [parseFloat(res.data.latitude), parseFloat(res.data.longitude)];
                    setLivreurPos(lastCoords);
                }
            } catch (err) {
                console.error("❌ Error 401: You are not authorized or token is missing", err);
            }
        };
        fetchInitialLocation();
    }, [livreurId]);

    return (
        <MapContainer
            center={destPos || [33.5731, -7.5898]}
            zoom={12}
            style={{ height: '500px', width: '100%', borderRadius: '15px' }}
        >
            <TileLayer
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                attribution='&copy; Google Maps'
            />
            {/* ماركر الكليان (الديناميكي) */}
            {destPos && (
                <Marker position={destPos} icon={destinationIcon}>
                    <Popup>Destination de livraison</Popup>
                </Marker>
            )}

            {livreurPos && (
                <>
                    <Marker position={livreurPos} icon={truckIcon}>
                        <Popup>Le livreur est ici 🚚</Popup>
                    </Marker>
                    <RecenterMap pos={livreurPos} />
                </>
            )}
        </MapContainer>
    );
};

export default ClientTracking;