import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    StatusBar, ScrollView, Dimensions, Linking, Alert
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';

const { width, height } = Dimensions.get('window');
const GATEWAY_URL = "http://192.168.11.150:8888";

export const LivreurRouteMap = ({ navigation }: any) => {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [optimizedRoute, setOptimizedRoute] = useState<any[]>([]);
    const [totalDistance, setTotalDistance] = useState(0);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                navigation.replace('Login');
                return;
            }

            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const userId = payload.userId || payload.sub;
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            const parcelsRes = await axios.get(`${GATEWAY_URL}/parcel-service/api/parcels`, headers);

            const myPendingParcels = parcelsRes.data.filter((p: any) =>
                (p.assignedLivreurId && String(p.assignedLivreurId) === String(userId)) &&
                p.status !== 'DELIVERED'
            );

            setParcels(myPendingParcels);

            // جلب الموقع الحالي
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });
            } else {
                // موقع افتراضي (Casablanca)
                setCurrentLocation({ latitude: 33.5731, longitude: -7.5898 });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // حساب المسافة بين نقطتين
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // تحسين المسار (أقرب نقطة أولاً)
    const optimizeRoute = (start: any, parcelsList: any[]) => {
        const parcelsWithCoords = parcelsList.filter(p => p.latitude && p.longitude);
        if (parcelsWithCoords.length === 0) return [];

        const points = parcelsWithCoords.map(p => ({
            id: p.id,
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
            parcel: p
        }));

        const visited = new Set();
        const route: any[] = [];
        let current = start;
        let totalDist = 0;

        while (visited.size < points.length) {
            let nearest: any = null;
            let nearestDist = Infinity;

            for (const point of points) {
                if (!visited.has(point.id)) {
                    const dist = calculateDistance(current.latitude, current.longitude, point.latitude, point.longitude);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = point;
                    }
                }
            }

            if (nearest) {
                visited.add(nearest.id);
                route.push({ ...nearest, distance: nearestDist });
                current = nearest;
                totalDist += nearestDist;
            }
        }

        setTotalDistance(totalDist);
        return route;
    };

    useEffect(() => {
        if (currentLocation && parcels.length > 0) {
            const route = optimizeRoute(currentLocation, parcels);
            setOptimizedRoute(route);
        }
    }, [currentLocation, parcels]);

    const openGoogleMaps = (lat: number, lng: number) => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b4e61" />
            </View>
        );
    }

    const parcelsWithCoords = parcels.filter(p => p.latitude && p.longitude);
    const mapCenter = currentLocation || { latitude: 33.5731, longitude: -7.5898 };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🗺️ Ma tournée</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Statistiques */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{parcels.length}</Text>
                    <Text style={styles.statLabel}>Colis</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{parcelsWithCoords.length}</Text>
                    <Text style={styles.statLabel}>Avec GPS</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{optimizedRoute.length}</Text>
                    <Text style={styles.statLabel}>Étapes</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalDistance.toFixed(1)} km</Text>
                    <Text style={styles.statLabel}>Distance</Text>
                </View>
            </View>

            {/* Carte */}
            <View style={styles.mapContainer}>
                {currentLocation && (
                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: mapCenter.latitude,
                            longitude: mapCenter.longitude,
                            latitudeDelta: 0.3,
                            longitudeDelta: 0.3
                        }}
                    >
                        {/* Position actuelle */}
                        <Marker coordinate={currentLocation}>
                            <View style={styles.userMarker}>
                                <MaterialCommunityIcons name="truck-delivery" size={20} color="#fff" />
                            </View>
                        </Marker>

                        {/* Colis avec numéros */}
                        {optimizedRoute.map((item, index) => (
                            <Marker
                                key={item.id}
                                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                                onPress={() => openGoogleMaps(item.latitude, item.longitude)}
                            >
                                <View style={styles.parcelMarker}>
                                    <Text style={styles.markerNumber}>{index + 1}</Text>
                                </View>
                            </Marker>
                        ))}

                        {/* Ligne de la route */}
                        {optimizedRoute.length > 0 && currentLocation && (
                            <Polyline
                                coordinates={[
                                    currentLocation,
                                    ...optimizedRoute.map(r => ({ latitude: r.latitude, longitude: r.longitude }))
                                ]}
                                strokeColor="#3b4e61"
                                strokeWidth={3}
                            />
                        )}
                    </MapView>
                )}
            </View>

            {/* Liste des étapes */}
            // غير ScrollView
            <ScrollView
                style={styles.stepsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}  // ✅ زيد هاد
            >
                <Text style={styles.stepsTitle}>📋 Plan de livraison</Text>
                {optimizedRoute.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.stepCard}
                        onPress={() => openGoogleMaps(item.latitude, item.longitude)}
                    >
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.stepInfo}>
                            <Text style={styles.stepTracking}>{item.parcel.trackingNumber}</Text>
                            <Text style={styles.stepAddress} numberOfLines={2}>{item.parcel.deliveryAddress}</Text>
                            <Text style={styles.stepDistance}>{index === 0 ? 'Prochain' : `${item.distance?.toFixed(1)} km`}</Text>
                        </View>
                        <Feather name="navigation" size={20} color="#3b4e61" />
                    </TouchableOpacity>
                ))}
                {optimizedRoute.length === 0 && parcelsWithCoords.length === 0 && (
                    <Text style={styles.noGpsText}>⚠️ Aucun colis avec coordonnées GPS</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statsRow: {
        flexDirection: 'row', marginHorizontal: 20, marginTop: 15, gap: 10,
        backgroundColor: '#fff', borderRadius: 16, padding: 15, elevation: 2
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#3b4e61' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
    mapContainer: { height: height * 0.35, margin: 20, borderRadius: 20, overflow: 'hidden', elevation: 4 },
    map: { flex: 1 },
    userMarker: { backgroundColor: '#3b4e61', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
    parcelMarker: { backgroundColor: '#E74C3C', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    markerNumber: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    stepsList: { flex: 1, paddingHorizontal: 20, paddingBottom: 40 },
    stepsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    stepCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 15, borderRadius: 16, marginBottom: 12, gap: 15, elevation: 2
    },
    stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b4e61', justifyContent: 'center', alignItems: 'center' },
    stepNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    stepInfo: { flex: 1 },
    stepTracking: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    stepAddress: { fontSize: 12, color: '#777', marginTop: 4 },
    stepDistance: { fontSize: 11, color: '#E67E22', marginTop: 4 },
    noGpsText: { textAlign: 'center', color: '#999', marginTop: 40 }
});