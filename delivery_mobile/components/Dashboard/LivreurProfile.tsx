import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, ActivityIndicator, Alert,
    Dimensions, Platform, StatusBar, RefreshControl
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const GATEWAY_URL = "http://192.168.11.150:8888";

export const LivreurProfile = ({ navigation }: any) => {
    const [userData, setUserData] = useState<any>(null);
    const [zones, setZones] = useState<any[]>([]);
    const [missionCount, setMissionCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [imageBase64, setImageBase64] = useState<string | null>(null);

    const isFocused = useIsFocused();

    // ✅ دالة لجلب الصورة كـ base64 (نفس طريقة الـ Web ولكن لـ Mobile)
    const fetchImageAsBase64 = async (imageName: string) => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return null;

            const response = await axios.get(`${GATEWAY_URL}/users-service/uploads/${imageName}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer'  // ✅ مهم: نجيبو كـ arraybuffer
            });

            // تحويل الـ arraybuffer لـ base64
            const base64 = btoa(
                new Uint8Array(response.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ''
                )
            );

            return `data:image/jpeg;base64,${base64}`;
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    };

    const fetchProfileData = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                navigation.replace('Login');
                return;
            }

            // Decode JWT to get userId
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(
                Platform.OS === 'web'
                    ? atob(base64)
                    : Buffer.from(base64, 'base64').toString()
            );

            const userId = payload.userId || payload.sub;
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch all data in parallel
            const [profileRes, zonesRes, parcelsRes] = await Promise.all([
                axios.get(`${GATEWAY_URL}/users-service/api/profiles/details/${userId}`, headers),
                axios.get(`${GATEWAY_URL}/tarif-zone-service/api/zones`, headers),
                axios.get(`${GATEWAY_URL}/parcel-service/api/parcels`, headers)
            ]);

            setUserData(profileRes.data);
            setZones(zonesRes.data);

            // ✅ جلب الصورة كـ base64
            if (profileRes.data.profileImageUrl) {
                const base64Image = await fetchImageAsBase64(profileRes.data.profileImageUrl);
                setImageBase64(base64Image);
            } else {
                setImageBase64(null);
            }

            // Count missions assigned to this livreur
            const userMissions = parcelsRes.data.filter(
                (parcel: any) => parcel.livreurId === userId || parcel.deliveryPersonId === userId
            );
            setMissionCount(userMissions.length);

        } catch (error: any) {
            console.error("Error fetching profile data:", error);
            if (error.response?.status === 401) {
                Alert.alert("Session expirée", "Veuillez vous reconnecter");
                await AsyncStorage.removeItem("token");
                navigation.replace('Login');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigation]);

    useEffect(() => {
        if (isFocused) {
            fetchProfileData();
        }
    }, [isFocused, fetchProfileData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfileData();
    };

    const getZoneName = () => {
        const zoneId = userData?.zone;
        if (!zoneId) return "Non assignée";
        if (zones.length === 0) return "Chargement...";
        const zone = zones.find(z => String(z.id) === String(zoneId));
        return zone ? zone.nom_zone : `Zone ${zoneId}`;
    };

    const getVehicleIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'moto': return <MaterialCommunityIcons name="motorbike" size={20} color="#3b4e61" />;
            case 'voiture': return <MaterialCommunityIcons name="car" size={20} color="#3b4e61" />;
            case 'camionnette': return <MaterialCommunityIcons name="truck" size={20} color="#3b4e61" />;
            default: return <MaterialCommunityIcons name="motorbike" size={20} color="#3b4e61" />;
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Déconnexion",
            "Voulez-vous vraiment vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Déconnecter",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem("token");
                        navigation.replace('Login');
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b4e61" />
                <Text style={styles.loadingText}>Chargement du profil...</Text>
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={styles.center}>
                <Feather name="alert-circle" size={50} color="#e74c3c" />
                <Text style={styles.errorText}>Impossible de charger le profil</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchProfileData}>
                    <Text style={styles.retryBtnText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b4e61"]} />
            }
            contentContainerStyle={{ paddingBottom: 120 }}
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Bonjour 👋</Text>
                        <Text style={styles.userName}>
                            {userData?.firstName} {userData?.lastName}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* ✅ Profile Image - base64 method */}
                <View style={styles.profileImageWrapper}>
                    {imageBase64 ? (
                        <Image
                            source={{ uri: imageBase64 }}
                            style={styles.profileImg}
                        />
                    ) : (
                        <View style={styles.placeholderImg}>
                            <Text style={styles.initials}>
                                {userData?.firstName?.charAt(0)}{userData?.lastName?.charAt(0)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.onlineDot} />
                </View>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{missionCount}</Text>
                        <Text style={styles.statLabel}>Missions</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{userData?.rating || "5.0"}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, styles.zoneValueSmall]} numberOfLines={1}>
                            {getZoneName()}
                        </Text>
                        <Text style={styles.statLabel}>Zone</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Informations Personnelles</Text>
                    <DetailRow icon="mail" label="Email" value={userData?.email || "Non renseigné"} />
                    <DetailRow icon="phone" label="Téléphone" value={userData?.phone || "Non renseigné"} />
                    <DetailRow icon="map-pin" label="Adresse" value={userData?.address || "Non renseignée"} />
                    <DetailRow icon="globe" label="Zone de travail" value={getZoneName()} />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Détails Véhicule</Text>
                    <DetailRow icon="truck" label="Type de Véhicule" value={userData?.vehicleType || "Non défini"} isMaterial />
                    <DetailRow icon="credit-card" label="Matricule" value={userData?.matricule || "Non défini"} />
                    <DetailRow icon="file-text" label="N° Permis" value={userData?.permisNumber || "Non défini"} />
                </View>

                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={styles.mainBtn}
                        onPress={() => navigation.navigate('EditLivreurProfile', { userData: userData })}
                    >
                        <Feather name="edit-3" size={20} color="#fff" />
                        <Text style={styles.mainBtnText}>Modifier mon profil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Feather name="log-out" size={18} color="#e74c3c" />
                        <Text style={styles.logoutText}>Se déconnecter</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const DetailRow = ({ icon, label, value, isMaterial }: any) => (
    <View style={styles.detailRow}>
        <View style={styles.iconCircle}>
            {isMaterial ? (
                <MaterialCommunityIcons name={icon} size={18} color="#5D6B6B" />
            ) : (
                <Feather name={icon} size={18} color="#5D6B6B" />
            )}
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value || "Non renseigné"}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    loadingText: { marginTop: 10, color: '#3b4e61', fontSize: 14 },
    errorText: { marginTop: 10, color: '#e74c3c', fontSize: 16 },
    retryBtn: { marginTop: 20, backgroundColor: '#3b4e61', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 25 },
    retryBtnText: { color: '#fff', fontWeight: 'bold' },
    headerContainer: {
        backgroundColor: '#3b4e61',
        paddingHorizontal: 25,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
        paddingBottom: 100,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        alignItems: 'center'
    },
    headerTop: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greeting: { fontSize: 14, color: '#D5E5E5', fontWeight: '500' },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    profileImageWrapper: { position: 'relative', marginBottom: 10 },
    profileImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff', backgroundColor: '#fff' },
    placeholderImg: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#D5E5E5', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
    initials: { fontSize: 35, fontWeight: 'bold', color: '#3b4e61' },
    onlineDot: { position: 'absolute', bottom: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#4CAF50', borderWidth: 3, borderColor: '#fff' },
    statsCard: {
        position: 'absolute', bottom: -40, alignSelf: 'center',
        width: width * 0.85, height: 85, backgroundColor: '#fff',
        borderRadius: 22, flexDirection: 'row', alignItems: 'center',
        elevation: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#3b4e61' },
    zoneValueSmall: { fontSize: 12, maxWidth: 85, textAlign: 'center' },
    statLabel: { fontSize: 12, color: '#a5aead', marginTop: 4 },
    statDivider: { width: 1, height: '45%', backgroundColor: '#f0f0f0' },
    content: { marginTop: 65, paddingHorizontal: 20 },
    infoSection: { backgroundColor: '#fff', borderRadius: 25, padding: 20, marginBottom: 20, elevation: 2 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#5D6B6B', textTransform: 'uppercase', marginBottom: 20, letterSpacing: 1 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F4F4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    rowLabel: { fontSize: 11, color: '#bdc3c7', fontWeight: 'bold', marginBottom: 2 },
    rowValue: { fontSize: 15, color: '#2c3e50', fontWeight: '500' },
    footerActions: { marginTop: 5, marginBottom: 40 },
    mainBtn: { backgroundColor: '#3b4e61', height: 55, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4, gap: 10 },
    mainBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, padding: 12, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#ffe0e0' },
    logoutText: { color: '#e74c3c', fontWeight: 'bold', marginLeft: 8 }
});