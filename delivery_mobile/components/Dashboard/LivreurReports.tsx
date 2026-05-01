import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, StatusBar, Alert, Modal, TextInput
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';

const GATEWAY_URL = "http://192.168.11.150:8888";

export const LivreurReports = ({ navigation }: any) => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [problemText, setProblemText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReports = async () => {
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

            // فلترة الطرود اللي عندها مشكلة (RETURNED أو deliveryNotes)
            const problemParcels = parcelsRes.data.filter((p: any) =>
                (p.assignedLivreurId && String(p.assignedLivreurId) === String(userId)) &&
                (p.status === 'RETURNED' || (p.deliveryNotes && p.deliveryNotes.trim() !== ''))
            );

            setReports(problemParcels);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const reportProblem = async () => {
        if (!problemText.trim()) {
            Alert.alert("Erreur", "Veuillez décrire le problème");
            return;
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const headers = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' } };

            await axios.post(
                `${GATEWAY_URL}/parcel-service/api/parcels/${selectedParcel.id}/report-problem`,
                problemText,
                headers
            );

            Alert.alert("Succès", "Problème signalé ✅");
            setShowReportModal(false);
            setProblemText('');
            fetchReports();
        } catch (error) {
            Alert.alert("Erreur", "Impossible de signaler le problème");
        } finally {
            setSubmitting(false);
        }
    };

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

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>⚠️ Signalements</Text>
                <View style={{ width: 24 }} />
            </View>

            {reports.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Feather name="check-circle" size={70} color="#4CAF50" />
                    <Text style={styles.emptyText}>Aucun signalement</Text>
                </View>
            ) : (
                // غير FlatList
                <FlatList
                    data={reports}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.reportCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
                                <View style={[styles.statusBadge, item.status === 'RETURNED' ? styles.returnedBadge : styles.progressBadge]}>
                                    <Text style={styles.statusText}>{item.status === 'RETURNED' ? 'Retourné' : 'En cours'}</Text>
                                </View>
                            </View>
                            <Text style={styles.addressText}>{item.deliveryAddress}</Text>
                            <Text style={styles.problemText}>
                                <Text style={{ fontWeight: 'bold' }}>Problème: </Text>
                                {item.deliveryNotes || "Colis retourné"}
                            </Text>
                            <Text style={styles.dateText}>
                                {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                            </Text>
                        </View>
                    )}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}  // ✅ زيد هاد
                />
            )}

            {/* Modal pour signaler */}
            <Modal visible={showReportModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Signaler un problème</Text>
                        <Text style={styles.modalSubtitle}>Colis: {selectedParcel?.trackingNumber}</Text>

                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={4}
                            placeholder="Décrivez le problème (client absent, adresse incorrecte...)"
                            value={problemText}
                            onChangeText={setProblemText}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReportModal(false)}>
                                <Text style={styles.cancelBtnText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={reportProblem} disabled={submitting}>
                                <Text style={styles.submitBtnText}>{submitting ? "Envoi..." : "Envoyer"}</Text>
                            </TouchableOpacity>
                        </View>
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
    listContent: { padding: 20, paddingBottom: 40 },
    reportCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        marginBottom: 12, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    trackingNumber: { fontSize: 14, fontWeight: 'bold', color: '#3b4e61' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    returnedBadge: { backgroundColor: '#FFEBEE' },
    progressBadge: { backgroundColor: '#FFF3E0' },
    statusText: { fontSize: 10, fontWeight: 'bold', color: '#E74C3C' },
    addressText: { fontSize: 13, color: '#555', marginBottom: 10 },
    problemText: { fontSize: 12, color: '#E67E22', backgroundColor: '#FFF8E1', padding: 10, borderRadius: 10, marginBottom: 8 },
    dateText: { fontSize: 10, color: '#999' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: '#ccc', marginTop: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, width: '90%', padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#3b4e61', marginBottom: 5 },
    modalSubtitle: { fontSize: 12, color: '#888', marginBottom: 15 },
    textArea: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 20 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, backgroundColor: '#E0E0E0', padding: 12, borderRadius: 12, alignItems: 'center' },
    cancelBtnText: { color: '#666', fontWeight: 'bold' },
    submitBtn: { flex: 1, backgroundColor: '#E67E22', padding: 12, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontWeight: 'bold' }
});