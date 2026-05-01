import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

const GATEWAY_URL = "http://192.168.11.150:8888";

export const startLiveTracking = async () => {
    try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        const livreurId = String(decodedPayload.userId || decodedPayload.sub);

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        // استخدام WatchPositionAsync كيكون أحسن من setInterval في الموبايل
        // ولكن غانخليو setInterval بـ 5 ثواني باش ما نستهلكوش البريز بزاف
        setInterval(async () => {
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const payload = {
                    livreur_id: livreurId,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    parcel_id: "PFE-SESSION-ACTIVE"
                };

                await axios.post(`${GATEWAY_URL}/tracking-service/api/v1/tracking/update`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log("📍 Location Sync: OK");
            } catch (err) {
                console.log("⚠️ Tracking Post Error:", err.message);
            }
        }, 5000); // كل 5 ثواني

    } catch (e) {
        console.error("Critical Tracking Error:", e);
    }
};