import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';

export const LoginView = ({ onLoginSuccess }: { onLoginSuccess: (role: string) => void }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        console.log("--- START LOGIN PROCESS ---");
        console.log("Email typing:", email.trim());

        try {
            // استعملي الـ IP ديال البي سي ديالك وتأكدي من الـ Firewall
            const apiURL = "http://192.168.11.150:8888/service-security/v1/users/login";

            console.log("Calling API:", apiURL);

            const res = await axios.post(apiURL, {
                email: email.trim(),
                password: password
            }, {
                timeout: 10000 // 10 ثواني باش ما يبقاش معلق يلا كانت الشبكة تقيلة
            });

            console.log("Response Status:", res.status);

            const { accessToken } = res.data;
            if (!accessToken) {
                throw new Error("No access token received");
            }

            await AsyncStorage.setItem("token", accessToken);
            console.log("Token saved to AsyncStorage");

            // فك التوكن (JWT Decoding)
            const payloadBase64 = accessToken.split('.')[1];
            const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
            const decodedPayload = JSON.parse(Buffer.from(base64, 'base64').toString());

            console.log("Decoded Payload:", decodedPayload);

            // تحديد الأدوار
            const userRoles = decodedPayload.authorities || decodedPayload.roles || decodedPayload.scope || [];
            const rolesStr = JSON.stringify(userRoles).toUpperCase();

            console.log("Detected Roles:", rolesStr);

            if (rolesStr.includes("LIVREUR")) {
                console.log("SUCCESS: User is LIVREUR");
                onLoginSuccess("LIVREUR");
            } else if (rolesStr.includes("ADMIN")) {
                console.log("SUCCESS: User is ADMIN");
                onLoginSuccess("ADMIN");
            } else {
                console.log("SUCCESS: User is CLIENT or other");
                onLoginSuccess("CLIENT");
            }

        } catch (err: any) {
            console.error("--- LOGIN ERROR ---");
            if (err.code === 'ECONNABORTED') {
                console.error("Timeout: Server took too long to respond. Check Firewall!");
                Alert.alert("Erreur", "Le serveur ne répond pas (Timeout). Vérifiez votre connexion et le Firewall.");
            } else if (err.response) {
                console.error("Data error:", err.response.data);
                Alert.alert("Erreur", "Identifiants incorrects (Status: " + err.response.status + ")");
            } else {
                console.error("Network/Other error:", err.message);
                Alert.alert("Erreur", "Impossible de contacter le serveur. Vérifiez l'IP: " + err.message);
            }
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.loginContainer}>
            <View style={[styles.circle, { width: 400, height: 400, top: -150, right: -100, backgroundColor: '#7e6363' }]} />

            <View style={styles.card}>
                <Text style={styles.loginTitle}>Bon retour !</Text>
                <Text style={styles.subtitle}>Connectez-vous pour gérer vos livraisons.</Text>

                <View style={styles.inputGroup}>
                    <Feather name="user" size={20} color="#fff" />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#a5aead"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Feather name="lock" size={20} color="#fff" />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#a5aead"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.showText}>{showPassword ? "HIDE" : "SHOW"}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                    <Text style={styles.loginBtnText}>Se connecter</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    loginContainer: { flex: 1, backgroundColor: '#fbf4f4', justifyContent: 'center', padding: 20 },
    circle: { position: 'absolute', borderRadius: 200, opacity: 0.2 },
    card: { backgroundColor: '#4d5c71', borderRadius: 30, padding: 30, elevation: 10 },
    loginTitle: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
    subtitle: { color: '#d5e5e5', marginBottom: 30 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b4e61', borderRadius: 15, paddingHorizontal: 15, height: 55, marginBottom: 15 },
    input: { flex: 1, color: '#fff', marginLeft: 10 },
    showText: { color: '#a5aead', fontSize: 12 },
    loginBtn: { backgroundColor: '#283442', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});