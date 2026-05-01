import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, FlatList,
    TouchableOpacity, ActivityIndicator, StatusBar, Alert, Modal, Dimensions
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GATEWAY_URL = "http://192.168.11.150:8888";

export const LivreurOrders = ({ navigation }: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [permission, requestPermission] = useCameraPermissions();
    const [isScannerVisible, setIsScannerVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            // كنجيبو غير الـ Parcels دابا، حيت الزون مابقيناش محتاجينها هنا
            const res = await axios.get(`${GATEWAY_URL}/parcel-service/api/parcels`, headers);
            setParcels(res.data);
        } catch (error) {
            console.error("Error fetching parcels:", error);
            Alert.alert("Erreur", "Impossible de charger les colis.");
        } finally {
            setLoading(false);
        }
    };

    const handleScan = ({ data }: any) => {
        setSearchQuery(data);
        setIsScannerVisible(false);
    };

    const openScanner = async () => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert("Permission", "L'accès à la caméra est nécessaire.");
                return;
            }
        }
        setIsScannerVisible(true);
    };

    const filteredParcels = parcels.filter(p =>
        p.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'DELIVERED': return { label: 'Livré', color: '#4CAF50', bg: '#E8F5E9' };
            case 'IN_TRANSIT': return { label: 'En cours', color: '#9C27B0', bg: '#F3E5F5' };
            case 'ASSIGNED': return { label: 'Attente', color: '#7986CB', bg: '#E8EAF6' };
            default: return { label: status, color: '#5D6B6B', bg: '#F5F5F5' };
        }
    };

    const renderOrderItem = ({ item }: any) => {
        const status = getStatusInfo(item.status);
        return (
            <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.orderNumber}>Commande #{item.trackingNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {/* عنوان التوصيل - هادي هي اللي مهمة لليفرور */}
                    <View style={styles.infoRow}>
                        <Ionicons name="location-sharp" size={20} color="#E74C3C" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.labelTitle}>Adresse de Livraison:</Text>
                            <Text style={styles.infoText}>{item.deliveryAddress || "Adresse non renseignée"}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Feather name="calendar" size={16} color="#7f8c8d" />
                        <Text style={styles.infoText}>Prévu pour: 07/04/2026</Text>
                    </View>
                </View>

                {item.status === 'ASSIGNED' && (
                    <TouchableOpacity style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>Confirmer la réception</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Modal Scanner */}
            <Modal visible={isScannerVisible} animationType="slide">
                <View style={styles.scannerModal}>
                    <CameraView
                        onBarcodeScanned={handleScan}
                        style={StyleSheet.absoluteFillObject}
                        barcodeSettings={{ barcodeTypes: ["code128", "qr"] }}
                    />
                    <View style={styles.scannerOverlay}>
                        <View style={styles.scanFrame} />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setIsScannerVisible(false)}>
                            <Text style={styles.closeBtnText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes Livraisons</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color="#bdc3c7" />
                    <TextInput
                        placeholder="Scanner ou saisir N° tracking..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity onPress={openScanner} style={styles.scanIconBtn}>
                        <MaterialCommunityIcons name="barcode-scan" size={22} color="#7986CB" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#7986CB" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredParcels}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderOrderItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}  // ✅ زيد هاد
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucun colis à afficher.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFC' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    searchContainer: { padding: 15 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 12, paddingHorizontal: 15, height: 55, elevation: 3,
        borderWidth: 1, borderColor: '#eee'
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
    scanIconBtn: { paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#eee' },
    listContent: { paddingHorizontal: 15, paddingBottom: 20 },
    orderCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15,
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    orderNumber: { fontSize: 15, fontWeight: 'bold', color: '#3b4e61' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    statusDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    cardBody: { marginBottom: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    labelTitle: { fontSize: 11, color: '#95a5a6', fontWeight: 'bold', textTransform: 'uppercase' },
    infoText: { fontSize: 14, color: '#2c3e50', fontWeight: '500', marginTop: 2 },
    actionBtn: {
        backgroundColor: '#7986CB', borderRadius: 12, height: 45,
        justifyContent: 'center', alignItems: 'center'
    },
    actionBtnText: { color: '#fff', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#bdc3c7' },
    // Scanner
    scannerModal: { flex: 1, backgroundColor: '#000' },
    scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#7986CB', borderRadius: 20 },
    closeBtn: { marginTop: 40, backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    closeBtnText: { color: '#333', fontWeight: 'bold' }
});