import { Buffer } from 'buffer';
global.Buffer = Buffer;

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Platform, StatusBar, Alert } from 'react-native';

// Navigation Imports
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Components
import { OnboardingView } from '@/components/OnboardingView';
import { LoginView } from '@/components/Login/LoginView';
import { LivreurDashboard } from '@/components/Dashboard/LivreurDashboard';
import { LivreurProfile } from "@/components/Dashboard/LivreurProfile";
import { EditLivreurProfile } from "@/components/Dashboard/EditLivreurProfile";
import { ParcelDetailsScreen } from '@/components/Dashboard/ParcelDetailsScreen';
import { LivreurOrders } from '@/components/Dashboard/LivreurOrders';
import { LivreurHistory } from '@/components/Dashboard/LivreurHistory';
import { LivreurReports } from '@/components/Dashboard/LivreurReports';
import { LivreurRouteMap } from '@/components/Dashboard/LivreurRouteMap';

import { ThemeProvider, useTheme } from '@/components/Dashboard/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const Stack = createNativeStackNavigator();

/** * 1. LivreurStack: خاص بالمهام والخرائط والتاريخ والتبليغ */
const LivreurStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DashboardHome" component={LivreurDashboard} />
        <Stack.Screen name="ParcelDetails" component={ParcelDetailsScreen} />
        <Stack.Screen name="LivreurOrders" component={LivreurOrders} />
        <Stack.Screen name="LivreurHistory" component={LivreurHistory} />
        <Stack.Screen name="LivreurReports" component={LivreurReports} />
        <Stack.Screen name="LivreurRouteMap" component={LivreurRouteMap} />
    </Stack.Navigator>
);

/** * 2. ProfileStack: خاص بعرض وتعديل بيانات الموصل */
const ProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileHome" component={LivreurProfile} />
        <Stack.Screen name="EditLivreurProfile" component={EditLivreurProfile} />
    </Stack.Navigator>
);

/** * 3. CustomTabBar: القائمة التحتانية مع Theme */
const CustomTabBar = ({ currentTab, setTab }: { currentTab: string, setTab: (t: string) => void }) => {
    const { colors, theme } = useTheme();

    return (
        <View style={styles.tabWrapper}>
            <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => setTab('commandes')} style={styles.tabItem}>
                    <Feather name="box" size={22} color={currentTab === 'commandes' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabLabel, { color: currentTab === 'commandes' ? colors.tabActive : colors.tabInactive }]}>Commandes</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setTab('history')} style={styles.tabItem}>
                    <Feather name="clock" size={22} color={currentTab === 'history' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabLabel, { color: currentTab === 'history' ? colors.tabActive : colors.tabInactive }]}>Historique</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.centerTab, { backgroundColor: colors.primary }]} onPress={() => setTab('home')}>
                    <Feather name="home" size={26} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setTab('route')} style={styles.tabItem}>
                    <Feather name="map" size={22} color={currentTab === 'route' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabLabel, { color: currentTab === 'route' ? colors.tabActive : colors.tabInactive }]}>Tournée</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setTab('profile')} style={styles.tabItem}>
                    <Feather name="user" size={22} color={currentTab === 'profile' ? colors.tabActive : colors.tabInactive} />
                    <Text style={[styles.tabLabel, { color: currentTab === 'profile' ? colors.tabActive : colors.tabInactive }]}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// المحتوى الرئيسي داخل ThemeProvider
const MainApp = () => {
    const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'login' | 'livreur_home'>('onboarding');
    const [activeTab, setActiveTab] = useState('home');
    const { colors } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.header} />

            {currentScreen === 'onboarding' && (
                <OnboardingView onNext={() => setCurrentScreen('login')} />
            )}

            {currentScreen === 'login' && (
                <LoginView onLoginSuccess={(role) => {
                    if (role === "LIVREUR") setCurrentScreen('livreur_home');
                    else Alert.alert("Erreur", "Accès réservé aux livreurs.");
                }} />
            )}

            {currentScreen === 'livreur_home' && (
                <View style={{ flex: 1 }}>
                    <View style={{ flex: 1 }}>
                        {activeTab === 'home' && <LivreurStack />}
                        {activeTab === 'commandes' && <LivreurOrders navigation={{ goBack: () => setActiveTab('home') }} />}
                        {activeTab === 'history' && <LivreurHistory navigation={{ goBack: () => setActiveTab('home') }} />}
                        {activeTab === 'route' && <LivreurRouteMap navigation={{ goBack: () => setActiveTab('home') }} />}
                        {activeTab === 'profile' && <ProfileStack />}
                    </View>

                    <CustomTabBar currentTab={activeTab} setTab={setActiveTab} />
                </View>
            )}
        </View>
    );
};

export default function Index() {
    return (
        <ThemeProvider>
            <MainApp />
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    tabWrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 15,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        width: width * 0.94,
        height: 75,
        borderRadius: 25,
        justifyContent: 'space-around',
        alignItems: 'center',
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
    },
    centerTab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -40,
        borderWidth: 5,
        borderColor: '#FFF5F5',
        elevation: 10,
    },
});