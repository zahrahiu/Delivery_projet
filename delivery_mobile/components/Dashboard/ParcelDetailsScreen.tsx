import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Linking,
    ScrollView, ActivityIndicator, Alert, Dimensions, Platform
} from 'react-native';
import MapViewDirections from 'react-native-maps-directions';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_APIKEY = 'AIzaSyChQm1ZooFDhY3n63766a_dwwJmUGSRxG0';
const GATEWAY_URL = "http://192.168.11.150:8888";

export const ParcelDetailsScreen = ({ route, navigation }: any) => {
    const mapRef = useRef<MapView>(null);
    const { parcel } = route.params;

    const [destination, setDestination] = useState<any>(null);
    const [loadingCoords, setLoadingCoords] = useState(true);
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [parcelDetails, setParcelDetails] = useState<any>(null);

    // Récupérer les détails complets du colis (avec latitude/longitude)
    useEffect(() => {
        const fetchParcelDetails = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const headers = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${GATEWAY_URL}/parcel-service/api/parcels/${parcel.id}`, headers);
                setParcelDetails(response.data);

                // ✅ Utiliser les coordonnées GPS du colis (latitude/longitude de la base de données)
                if (response.data.latitude && response.data.longitude) {
                    setDestination({
                        latitude: parseFloat(response.data.latitude),
                        longitude: parseFloat(response.data.longitude)
                    });
                    setLoadingCoords(false);
                } else if (parcel.latitude && parcel.longitude) {
                    setDestination({
                        latitude: parseFloat(parcel.latitude),
                        longitude: parseFloat(parcel.longitude)
                    });
                    setLoadingCoords(false);
                } else {
                    // Fallback: géocodage de l'adresse
                    geocodeAddress(parcel.deliveryAddress);
                }
            } catch (error) {
                console.error("Error fetching parcel details:", error);
                setParcelDetails(parcel);
                geocodeAddress(parcel.deliveryAddress);
            }
        };

        const geocodeAddress = async (address: string) => {
            if (!address) {
                setLoadingCoords(false);
                return;
            }
            try {
                const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: { address: `${address}, Maroc`, key: GOOGLE_MAPS_APIKEY }
                });
                if (response.data.status === "OK") {
                    const { lat, lng } = response.data.results[0].geometry.location;
                    setDestination({ latitude: lat, longitude: lng });
                }
            } catch (e) {
                console.log("Geocoding error:", e);
            } finally {
                setLoadingCoords(false);
            }
        };

        fetchParcelDetails();
    }, [parcel.id]);

    // Ouvrir Google Maps pour la navigation
    const openGoogleMaps = () => {
        if (destination) {
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`);
        } else {
            Alert.alert("Erreur", "Adresse de destination non disponible");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return '#4CAF50';
            case 'IN_TRANSIT': return '#2196F3';
            case 'ASSIGNED': return '#3b4e61';
            case 'RETURNED': return '#F44336';
            default: return '#888';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'DELIVERED': return '✅ Livré';
            case 'IN_TRANSIT': return '🚚 En transit';
            case 'ASSIGNED': return '⏳ Assigné';
            case 'RETURNED': return '↩️ Retourné';
            default: return status || 'En attente';
        }
    };

    if (loadingCoords && !destination) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b4e61" />
                <Text style={styles.loadingText}>Chargement de la carte...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Suivi du Colis</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}

            >
                {/* Carte avec la destination */}
                <View style={styles.mapCard}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={{
                            latitude: destination?.latitude || 33.5731,
                            longitude: destination?.longitude || -7.5898,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {destination && (
                            <Marker coordinate={destination}>
                                <View style={styles.destinationMarker}>
                                    <MaterialCommunityIcons name="map-marker-check" size={22} color="#fff" />
                                </View>
                            </Marker>
                        )}
                    </MapView>
                </View>

                {/* Distance info (si disponible) */}
                {distance && duration && (
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Feather name="map-pin" size={20} color="#3b4e61" />
                                <Text style={styles.infoLabel}>Distance</Text>
                                <Text style={styles.infoValue}>{distance.toFixed(1)} km</Text>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoItem}>
                                <Feather name="clock" size={20} color="#3b4e61" />
                                <Text style={styles.infoLabel}>Temps estimé</Text>
                                <Text style={styles.infoValue}>{Math.round(duration)} min</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                        onPress={() => {
                            const phone = parcelDetails?.senderPhone || parcel?.senderPhone;
                            if (phone) Linking.openURL(`tel:${phone}`);
                            else Alert.alert("Erreur", "Numéro de téléphone non disponible");
                        }}
                    >
                        <Feather name="phone" size={24} color="#fff" />
                        <Text style={styles.actionBtnText}>Appeler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#2196F3' }]}
                        onPress={() => {
                            const phone = parcelDetails?.senderPhone || parcel?.senderPhone;
                            if (phone) Linking.openURL(`sms:${phone}`);
                            else Alert.alert("Erreur", "Numéro de téléphone non disponible");
                        }}
                    >
                        <Feather name="message-square" size={24} color="#fff" />
                        <Text style={styles.actionBtnText}>SMS</Text>
                    </TouchableOpacity>
                </View>

                {/* Google Maps Navigation */}
                <TouchableOpacity style={styles.gpsLargeBtn} onPress={openGoogleMaps}>
                    <MaterialCommunityIcons name="google-maps" size={24} color="#fff" />
                    <Text style={styles.gpsLargeText}>Commencer la navigation</Text>
                </TouchableOpacity>

                {/* Détails du colis */}
                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>📦 Informations du colis</Text>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}><Feather name="hash" size={16} color="#3b4e61" /></View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>N° de suivi</Text>
                            <Text style={styles.detailValue}>{parcelDetails?.trackingNumber || parcel?.trackingNumber}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}><Feather name="box" size={16} color="#3b4e61" /></View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Poids</Text>
                            <Text style={styles.detailValue}>{parcelDetails?.weight || parcel?.weight || 'N/A'} kg</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}><MaterialCommunityIcons name="map-marker-radius" size={16} color="#3b4e61" /></View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>STATUT</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(parcelDetails?.status || parcel?.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(parcelDetails?.status || parcel?.status) }]}>
                                    {getStatusLabel(parcelDetails?.status || parcel?.status)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Affichage des coordonnées GPS si disponibles */}
                    {parcelDetails?.latitude && parcelDetails?.longitude && (
                        <View style={styles.detailItem}>
                            <View style={styles.detailIcon}><Feather name="map" size={16} color="#3b4e61" /></View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Coordonnées GPS</Text>
                                <Text style={styles.detailValue}>
                                    {parseFloat(parcelDetails.latitude).toFixed(6)}, {parseFloat(parcelDetails.longitude).toFixed(6)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Détails du client */}
                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>👤 Informations client</Text>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}><Feather name="user" size={16} color="#3b4e61" /></View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Nom du client</Text>
                            <Text style={styles.detailValue}>{parcelDetails?.senderName || parcel?.senderName || 'Non spécifié'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}><Feather name="phone" size={16} color="#3b4e61" /></View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Téléphone</Text>
                            <Text style={styles.detailValue}>{parcelDetails?.senderPhone || parcel?.senderPhone || 'Non spécifié'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}><Feather name="map-pin" size={16} color="#e74c3c" /></View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Adresse de livraison</Text>
                            <Text style={styles.detailAddress}>{parcelDetails?.deliveryAddress || parcel?.deliveryAddress}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#666' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    backBtn: { padding: 8, borderRadius: 10, backgroundColor: '#f0f2f5' },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
    scrollContent: { padding: 20, paddingBottom: 40 },

    mapCard: { height: 300, borderRadius: 20, overflow: 'hidden', elevation: 4, marginBottom: 15 },
    map: { flex: 1 },

    infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 2 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    infoItem: { alignItems: 'center', flex: 1 },
    infoDivider: { width: 1, height: 40, backgroundColor: '#eee' },
    infoLabel: { fontSize: 11, color: '#888', marginTop: 4 },
    infoValue: { fontSize: 16, fontWeight: 'bold', color: '#3b4e61', marginTop: 2 },

    actionContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 12 },
    actionBtn: { flex: 1, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    gpsLargeBtn: { height: 55, backgroundColor: '#3b4e61', borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, gap: 10 },
    gpsLargeText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    detailsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 15, elevation: 2 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    detailItem: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
    detailIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F4F4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    detailContent: { flex: 1 },
    detailLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 2 },
    detailAddress: { fontSize: 13, color: '#555', marginTop: 2, lineHeight: 18 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
    statusText: { fontSize: 11, fontWeight: 'bold' },

    destinationMarker: { backgroundColor: '#E74C3C', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff', elevation: 5 }
});