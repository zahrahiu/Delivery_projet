import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, StatusBar, Modal, ScrollView
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';

const GATEWAY_URL = "http://192.168.11.150:8888";

export const LivreurHistory = ({ navigation }: any) => {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const fetchHistory = async () => {
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

            // فلترة الطرود المسلمة للمستخدم الحالي والمكتملة
            const myDeliveredParcels = parcelsRes.data.filter((p: any) =>
                (p.assignedLivreurId && String(p.assignedLivreurId) === String(userId)) &&
                p.status === 'DELIVERED'
            );

            setParcels(myDeliveredParcels);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const formatDate = (date: string) => {
        if (!date) return new Date().toLocaleDateString('fr-FR');
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const openDetailsModal = (parcel: any) => {
        setSelectedParcel(parcel);
        setShowDetailsModal(true);
    };

    const totalEncaisse = parcels.reduce((sum, p) => sum + (p.price || 25), 0);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b4e61" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📜 Historique</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Statistiques */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{parcels.length}</Text>
                    <Text style={styles.statLabel}>Livraisons</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{totalEncaisse} DH</Text>
                    <Text style={styles.statLabel}>Total encaissé</Text>
                </View>
            </View>

            {/* Liste */}
            {parcels.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="package-variant-closed" size={70} color="#ccc" />
                    <Text style={styles.emptyText}>Aucune livraison effectuée</Text>
                </View>
            ) : (
                // غير FlatList
                <FlatList
                    data={parcels}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.historyCard} onPress={() => openDetailsModal(item)}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
                                <View style={styles.deliveredBadge}>
                                    <Feather name="check-circle" size={14} color="#4CAF50" />
                                    <Text style={styles.deliveredText}>Livré</Text>
                                </View>
                            </View>
                            <Text style={styles.addressText} numberOfLines={2}>{item.deliveryAddress}</Text>
                            <Text style={styles.dateText}>{formatDate(item.deliveredAt)}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}  // ✅ زيد هاد
                />
            )}

            {/* Modal Détails */}
            <Modal visible={showDetailsModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📄 Détails livraison</Text>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <Feather name="x" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedParcel && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>N° Tracking</Text>
                                    <Text style={styles.detailValue}>{selectedParcel.trackingNumber}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Date livraison</Text>
                                    <Text style={styles.detailValue}>{formatDate(selectedParcel.deliveredAt)}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Client</Text>
                                    <Text style={styles.detailValue}>{selectedParcel.senderName || "Non spécifié"}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Adresse</Text>
                                    <Text style={styles.detailValue}>{selectedParcel.deliveryAddress}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Poids</Text>
                                    <Text style={styles.detailValue}>{selectedParcel.weight} kg</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Prix</Text>
                                    <Text style={[styles.detailValue, styles.priceText]}>{selectedParcel.price || 25} DH</Text>
                                </View>
                            </ScrollView>
                        )}

                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowDetailsModal(false)}>
                            <Text style={styles.closeModalBtnText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statsContainer: {
        flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 15
    },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20,
        alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
    },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#3b4e61' },
    statLabel: { fontSize: 12, color: '#888', marginTop: 5 },
    listContent: { padding: 20, paddingBottom: 40 },
    historyCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    trackingNumber: { fontSize: 14, fontWeight: 'bold', color: '#3b4e61' },
    deliveredBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    deliveredText: { fontSize: 10, color: '#4CAF50', fontWeight: 'bold' },
    addressText: { fontSize: 13, color: '#555', marginBottom: 8 },
    dateText: { fontSize: 11, color: '#999' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: '#ccc', marginTop: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, width: '90%', maxHeight: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#3b4e61' },
    detailItem: { marginBottom: 15 },
    detailLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 },
    detailValue: { fontSize: 15, color: '#333', fontWeight: '500' },
    priceText: { color: '#e67e22', fontWeight: 'bold' },
    closeModalBtn: { backgroundColor: '#3b4e61', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
    closeModalBtnText: { color: '#fff', fontWeight: 'bold' }
});