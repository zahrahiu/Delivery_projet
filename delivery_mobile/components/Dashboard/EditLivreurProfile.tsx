import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Image, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GATEWAY_URL = "http://192.168.11.150:8888";

export const EditLivreurProfile = ({ route, navigation }: any) => {
    const { userData } = route.params;
    const [loading, setLoading] = useState(false);
    const [zones, setZones] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        phone: userData?.phone || '',
        zone: userData?.zone || '',
        address: userData?.address || '',
        vehicleType: userData?.vehicleType || '',
        matricule: userData?.matricule || '',
        permisNumber: userData?.permisNumber || '',
    });

    const [image, setImage] = useState<string | null>(
        userData?.profileImageUrl ? `${GATEWAY_URL}/users-service/uploads/${userData.profileImageUrl}` : null
    );

    useEffect(() => {
        const fetchZones = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await axios.get(`${GATEWAY_URL}/tarif-zone-service/api/zones`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setZones(res.data);
            } catch (error) {
                console.error("Error fetching zones:", error);
            }
        };
        fetchZones();
    }, []);

    const getZoneName = () => {
        if (!formData.zone) return "Non défini";
        const zone = zones.find(z => String(z.id) === String(formData.zone));
        return zone ? zone.nom_zone : `Zone ${formData.zone}`;
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission", "Vous devez autoriser l'accès à la galerie.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName) {
            Alert.alert("Erreur", "Le nom et le prénom sont obligatoires.");
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Erreur", "Vous n'êtes pas authentifié");
                setLoading(false);
                return;
            }

            const userId = userData.userId;

            // ✅ نفس الـ payload ديال الـ Web
            const payload: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone || "",
                address: formData.address || "",
                zone: formData.zone || userData.zone || "",
            };

            // ✅ إضافة معلومات السيارة للمستخدم (LIVREUR)
            if (formData.vehicleType) payload.vehicleType = formData.vehicleType;
            if (formData.matricule) payload.matricule = formData.matricule;
            if (formData.permisNumber) payload.permisNumber = formData.permisNumber;

            const isNewImage = image && !image.includes(GATEWAY_URL);

            if (isNewImage) {
                // ✅ نفس طريقة الـ Web بالضبط: استعمل /with-image
                const formDataToSend = new FormData();
                formDataToSend.append("firstName", formData.firstName);
                formDataToSend.append("lastName", formData.lastName);
                formDataToSend.append("phone", formData.phone || "");
                formDataToSend.append("address", formData.address || "");
                formDataToSend.append("zone", formData.zone || userData.zone || "");
                formDataToSend.append("vehicleType", formData.vehicleType || "");
                formDataToSend.append("matricule", formData.matricule || "");
                formDataToSend.append("permisNumber", formData.permisNumber || "");

                const filename = image.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                // @ts-ignore - React Native specific
                formDataToSend.append("file", {
                    uri: image,
                    name: filename,
                    type: type
                });

                // ✅ نفس Endpoint ديال الـ Web
                await axios.put(
                    `${GATEWAY_URL}/users-service/api/profiles/${userId}/with-image`,
                    formDataToSend,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            } else {
                // ✅ بدون صورة - نفس طريقة الـ Web
                await axios.put(
                    `${GATEWAY_URL}/users-service/api/profiles/${userId}`,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            }

            Alert.alert("Succès", "Profil mis à jour avec succès ! ✅", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);

        } catch (error: any) {
            console.error("Save error:", error.response?.data);

            let errorMsg = "Échec de la modification";
            if (error.response?.data?.message) errorMsg = error.response.data.message;
            else if (error.response?.data?.error) errorMsg = error.response.data.error;
            else if (typeof error.response?.data === 'string') errorMsg = error.response.data;

            Alert.alert("Erreur", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <StatusBar barStyle="light-content" backgroundColor="#3b4e61" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modifier mon Profil</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.avatarSection}>
                <TouchableOpacity onPress={pickImage} style={styles.imageWrapper} activeOpacity={0.8}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                            <Feather name="user" size={50} color="#3b4e61" />
                        </View>
                    )}
                    <View style={styles.cameraBtn}>
                        <Feather name="camera" size={16} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.avatarNote}>Cliquez pour changer la photo</Text>
            </View>

            <View style={styles.form}>
                <InputField
                    label="Prénom *"
                    value={formData.firstName}
                    onChange={(t) => setFormData({...formData, firstName: t})}
                />
                <InputField
                    label="Nom *"
                    value={formData.lastName}
                    onChange={(t) => setFormData({...formData, lastName: t})}
                />
                <InputField
                    label="Téléphone"
                    value={formData.phone}
                    onChange={(t) => setFormData({...formData, phone: t})}
                    keyboardType="phone-pad"
                />
                <InputField
                    label="Adresse"
                    value={formData.address}
                    onChange={(t) => setFormData({...formData, address: t})}
                />

                {/* معلومات السيارة خاصة بـ LIVREUR */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Informations Véhicule</Text>
                </View>

                <InputField
                    label="Type de véhicule"
                    value={formData.vehicleType}
                    onChange={(t) => setFormData({...formData, vehicleType: t})}
                    placeholder="Moto, Voiture, Camionnette"
                />
                <InputField
                    label="Matricule"
                    value={formData.matricule}
                    onChange={(t) => setFormData({...formData, matricule: t})}
                    placeholder="Numéro d'immatriculation"
                />
                <InputField
                    label="Numéro de permis"
                    value={formData.permisNumber}
                    onChange={(t) => setFormData({...formData, permisNumber: t})}
                    placeholder="Numéro du permis de conduire"
                />

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Zone de livraison</Text>
                    <View style={[styles.input, styles.disabledInput]}>
                        <Text style={styles.disabledText}>{getZoneName()}</Text>
                        <Feather name="lock" size={14} color="#bdc3c7" />
                    </View>
                    <Text style={styles.helperText}>La zone ne peut pas être modifiée</Text>
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Feather name="save" size={18} color="#fff" />
                            <Text style={styles.saveBtnText}>Enregistrer</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const InputField = ({ label, value, onChange, ...props }: any) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholderTextColor="#bdc3c7"
            {...props}
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        backgroundColor: '#3b4e61',
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 4,
    },
    backButton: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    avatarSection: { alignItems: 'center', marginVertical: 30 },
    imageWrapper: { position: 'relative' },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff', backgroundColor: '#e0e0e0' },
    placeholderAvatar: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8f0fe' },
    cameraBtn: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#3b4e61', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
    avatarNote: { marginTop: 10, fontSize: 12, color: '#7f8c8d' },
    form: { padding: 25, backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 25, elevation: 3, marginBottom: 40 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, color: '#5D6B6B', fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#f8f9fa', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#eee', fontSize: 15, color: '#333' },
    disabledInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f0', borderColor: '#e0e0e0' },
    disabledText: { color: '#95a5a6', fontSize: 15 },
    helperText: { fontSize: 11, color: '#bdc3c7', marginTop: 5, marginLeft: 4 },
    sectionHeader: { marginTop: 10, marginBottom: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#3b4e61', textAlign: 'center' },
    saveBtn: { backgroundColor: '#3b4e61', height: 55, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 4, gap: 10 },
    saveBtnDisabled: { backgroundColor: '#95a5a6' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});