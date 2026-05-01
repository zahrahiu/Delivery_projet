import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
    FlatList, TouchableOpacity, RefreshControl, Dimensions,
    StatusBar, Alert, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';

// ✅ تأكد أن لديك هاد الـ imports بالضبط
import { NotificationPanel } from './NotificationPanel';  // موش './NotificationService'
import { useTheme } from './ThemeContext';
import { Notification } from './NotificationService';
import { LivreurOrders } from './LivreurOrders';
import { LivreurHistory } from './LivreurHistory';
import { LivreurReports } from './LivreurReports';
import { LivreurRouteMap } from './LivreurRouteMap';
import { startLiveTracking } from "./TrackingService";

const { width } = Dimensions.get('window');
const GATEWAY_URL = "http://192.168.11.150:8888";

export const LivreurDashboard = ({ navigation }: any) => {
    const [userData, setUserData] = useState<any>(null);
    const [myParcels, setMyParcels] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors, theme, toggleTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [unreadCount, setUnreadCount] = useState(0);

    const total = myParcels.length;
    const delivered = myParcels.filter(p => p.status === 'DELIVERED').length;
    const inTransit = myParcels.filter(p => p.status === 'IN_TRANSIT').length;
    const pending = myParcels.filter(p => p.status === 'ASSIGNED').length;
    const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    // تحديث عدد الإشعارات غير المقروءة
    const updateUnreadCount = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const response = await axios.get(`${GATEWAY_URL}/notification-service/api/notifications/admin-alerts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const savedReadIds = await AsyncStorage.getItem("readNotificationIds");
            const readIds = savedReadIds ? new Set(JSON.parse(savedReadIds)) : new Set();
            const unread = response.data.filter((n: any) => !readIds.has(n._id)).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    const loadDashboardData = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                navigation.replace('Login');
                return;
            }

            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const userId = payload.userId || payload.sub;
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            const [profileRes, parcelsRes] = await Promise.all([
                axios.get(`${GATEWAY_URL}/users-service/api/profiles/details/${userId}`, headers),
                axios.get(`${GATEWAY_URL}/parcel-service/api/parcels`, headers)
            ]);

            const myAssignedParcels = parcelsRes.data.filter((p: any) =>
                p.assignedLivreurId && String(p.assignedLivreurId) === String(userId)
            );

            setUserData(profileRes.data);
            setMyParcels(myAssignedParcels);
            updateUnreadCount();

            axios.get(`${GATEWAY_URL}/tarif-zone-service/api/zones`, headers)
                .then(res => setZones(res.data))
                .catch(err => console.error("ZONES API ERROR:", err.message));

        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
        startLiveTracking();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const handleNotificationPress = (notification: Notification) => {
        if (notification.type === 'PARCEL_UPDATE') {
            setActiveTab('orders');
        } else if (notification.type === 'NEW_SIGNUP_REQUEST') {
            Alert.alert("Nouvelle inscription", notification.content);
        } else {
            Alert.alert("Notification", notification.content);
        }
        updateUnreadCount();
    };

    const getZoneDisplay = () => {
        const zoneId = userData?.zone;
        if (!zoneId) return 'N/A';
        if (zones.length === 0) return '...';
        const zone = zones.find(z => Number(z.id) === Number(zoneId));
        return zone ? zone.nom_zone : `Zone ${zoneId}`;
    };

    const handleNavigationRequest = async (parcel: any) => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission requise", "Accès à la position nécessaire.");
            return;
        }
        let location = await Location.getCurrentPositionAsync({});
        navigation.navigate('ParcelDetails', {
            parcel: parcel,
            userLocation: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }
        });
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const DashboardHome = () => {
        const pendingParcels = myParcels.filter(p => p.status !== 'DELIVERED');

        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                contentContainerStyle={{ paddingBottom: 120 }}
                style={{ backgroundColor: colors.background }}
            >
                {/* Welcome Banner */}
                <View style={[styles.welcomeBanner, { backgroundColor: colors.header }]}>
                    <View>
                        <Text style={styles.welcomeTitle}>Bonjour, {userData?.firstName || "Livreur"}!</Text>
                        <Text style={styles.welcomeSubtitle}>Vous avez {pendingParcels.length} colis à livrer aujourd'hui</Text>
                    </View>
                    <View style={styles.welcomeIcon}>
                        <MaterialCommunityIcons name="truck-fast" size={45} color="#fff" />
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#E8EEF3' }]}>
                            <Feather name="package" size={22} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.statCardValue, { color: colors.text }]}>{total}</Text>
                            <Text style={[styles.statCardLabel, { color: colors.textLight }]}>Missions</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Feather name="truck" size={22} color="#4A8DB7" />
                        </View>
                        <View>
                            <Text style={[styles.statCardValue, { color: colors.text }]}>{inTransit}</Text>
                            <Text style={[styles.statCardLabel, { color: colors.textLight }]}>En cours</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Feather name="check-circle" size={22} color="#27AE60" />
                        </View>
                        <View>
                            <Text style={[styles.statCardValue, { color: colors.text }]}>{delivered}</Text>
                            <Text style={[styles.statCardLabel, { color: colors.textLight }]}>Livrés</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Feather name="percent" size={22} color="#F39C12" />
                        </View>
                        <View>
                            <Text style={[styles.statCardValue, { color: colors.text }]}>{completionRate}%</Text>
                            <Text style={[styles.statCardLabel, { color: colors.textLight }]}>Taux réussite</Text>
                        </View>
                    </View>
                </View>

                {/* Prochains colis */}
                <View style={[styles.nextParcelsSection, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>📦 Prochains colis</Text>
                        <TouchableOpacity onPress={() => setActiveTab('orders')}>
                            <Text style={[styles.seeAllText, { color: colors.accent }]}>Voir tout →</Text>
                        </TouchableOpacity>
                    </View>

                    {pendingParcels.slice(0, 3).map((parcel, index) => (
                        <TouchableOpacity
                            key={parcel.id}
                            style={[styles.nextParcelCard, { backgroundColor: colors.background }]}
                            onPress={() => handleNavigationRequest(parcel)}
                        >
                            <View style={[styles.parcelNumber, { backgroundColor: colors.primary }]}>
                                <Text style={styles.parcelNumberText}>{index + 1}</Text>
                            </View>
                            <View style={styles.parcelInfo}>
                                <Text style={[styles.parcelTracking, { color: colors.text }]}>{parcel.trackingNumber}</Text>
                                <Text style={[styles.parcelAddress, { color: colors.textLight }]} numberOfLines={1}>{parcel.deliveryAddress}</Text>
                                <Text style={[styles.parcelWeight, { color: colors.textLight }]}>⚖️ {parcel.weight} kg</Text>
                            </View>
                            <Feather name="navigation" size={20} color={colors.accent} />
                        </TouchableOpacity>
                    ))}

                    {pendingParcels.length === 0 && (
                        <View style={styles.emptyParcels}>
                            <Feather name="check-circle" size={50} color="#27AE60" />
                            <Text style={styles.emptyParcelsText}>🎉 Tous les colis sont livrés!</Text>
                        </View>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Actions rapides</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('orders')}>
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <Feather name="package" size={24} color="#fff" />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Mes colis</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('route')}>
                            <View style={[styles.actionIcon, { backgroundColor: '#4A8DB7' }]}>
                                <Feather name="map" size={24} color="#fff" />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Ma tournée</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('history')}>
                            <View style={[styles.actionIcon, { backgroundColor: '#27AE60' }]}>
                                <Feather name="clock" size={24} color="#fff" />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Historique</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('reports')}>
                            <View style={[styles.actionIcon, { backgroundColor: '#F39C12' }]}>
                                <Feather name="flag" size={24} color="#fff" />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Signaler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.header} />

            {/* Header avec icônes de notification et dark mode */}
            <View style={[styles.headerContainer, { backgroundColor: colors.header }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Qrib Lik</Text>
                        <Text style={styles.userName}>{userData?.firstName || "Livreur"}</Text>
                    </View>
                    <View style={styles.headerIcons}>
                        {/* Icône Notification */}
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowNotifications(true)}>
                            <Feather name="bell" size={22} color="#fff" />
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.notificationBadge }]}>
                                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        {/* Icône Dark Mode */}
                        <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
                            <Feather name={theme === 'dark' ? 'sun' : 'moon'} size={22} color="#fff" />
                        </TouchableOpacity>
                        {/* Avatar */}
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={() => navigation.navigate('ProfileHome')}
                        >
                            <Text style={styles.avatarText}>{userData?.firstName?.[0]}</Text>
                            <View style={styles.onlineDot} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.zoneCard}>
                    <Feather name="map-pin" size={14} color="#fff" />
                    <Text style={styles.zoneText}>Zone: {getZoneDisplay()}</Text>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]} onPress={() => setActiveTab('dashboard')}>
                    <Feather name="home" size={20} color={activeTab === 'dashboard' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabText, { color: activeTab === 'dashboard' ? colors.tabActive : colors.tabInactive }]}>Accueil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'orders' && styles.activeTab]} onPress={() => setActiveTab('orders')}>
                    <Feather name="package" size={20} color={activeTab === 'orders' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabText, { color: activeTab === 'orders' ? colors.tabActive : colors.tabInactive }]}>Colis</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'route' && styles.activeTab]} onPress={() => setActiveTab('route')}>
                    <Feather name="map" size={20} color={activeTab === 'route' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabText, { color: activeTab === 'route' ? colors.tabActive : colors.tabInactive }]}>Tournée</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => setActiveTab('history')}>
                    <Feather name="clock" size={20} color={activeTab === 'history' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.tabActive : colors.tabInactive }]}>Historique</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'reports' && styles.activeTab]} onPress={() => setActiveTab('reports')}>
                    <Feather name="flag" size={20} color={activeTab === 'reports' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabText, { color: activeTab === 'reports' ? colors.tabActive : colors.tabInactive }]}>Signaler</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
                {activeTab === 'dashboard' && <DashboardHome />}
                {activeTab === 'orders' && <LivreurOrders navigation={navigation} />}
                {activeTab === 'route' && <LivreurRouteMap navigation={navigation} />}
                {activeTab === 'history' && <LivreurHistory navigation={navigation} />}
                {activeTab === 'reports' && <LivreurReports navigation={navigation} />}
            </View>

            {/* Modal Notifications */}
            <NotificationPanel
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                onNotificationPress={handleNotificationPress}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    headerContainer: {
        paddingHorizontal: 25,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 4,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 14, color: '#B8D4E8' },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },

    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBtn: { position: 'relative', padding: 5 },
    badge: {
        position: 'absolute',
        top: -2,
        right: -5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    avatarContainer: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2D5F7E' },
    onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#27AE60', borderWidth: 2, borderColor: '#fff' },
    zoneCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
    zoneText: { color: '#fff', fontSize: 12 },

    tabBar: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        justifyContent: 'space-around'
    },
    tab: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 25 },
    activeTab: { backgroundColor: '#E8EEF3' },
    tabText: { fontSize: 11, marginTop: 4 },
    tabContent: { flex: 1 },

    welcomeBanner: {
        margin: 20,
        padding: 20,
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 4
    },
    welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    welcomeSubtitle: { fontSize: 12, color: '#B8D4E8', marginTop: 5 },
    welcomeIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
    statCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 15, width: (width - 52) / 2, elevation: 3, gap: 12 },
    statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    statCardValue: { fontSize: 22, fontWeight: 'bold' },
    statCardLabel: { fontSize: 11 },

    nextParcelsSection: { margin: 20, marginTop: 15, borderRadius: 24, padding: 16, elevation: 3 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold' },
    seeAllText: { fontSize: 12, fontWeight: '500' },
    nextParcelCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 10, gap: 12 },
    parcelNumber: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    parcelNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    parcelInfo: { flex: 1 },
    parcelTracking: { fontSize: 13, fontWeight: 'bold' },
    parcelAddress: { fontSize: 11, marginTop: 2 },
    parcelWeight: { fontSize: 10, marginTop: 2 },
    emptyParcels: { alignItems: 'center', padding: 30 },
    emptyParcelsText: { color: '#27AE60', fontWeight: 'bold', marginTop: 10 },

    quickActionsSection: { margin: 20, marginTop: 0, marginBottom: 40 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
    actionCard: { alignItems: 'center', width: (width - 52) / 4, padding: 10 },
    actionIcon: { width: 55, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 3 },
    actionText: { fontSize: 11, textAlign: 'center' }
});