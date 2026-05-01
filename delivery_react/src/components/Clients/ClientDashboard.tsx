import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import ClientOrders from "./ClientOrders";
import ClientTrackingPage from "./ClientTrackingPage";
import ClientHistory from "./ClientHistory";

import {
    FaBox, FaTruck, FaCheckCircle, FaClock, FaMapMarkerAlt, FaRocket, FaShieldAlt, FaHeadset, FaChartLine,
    FaArrowRight, FaUser
} from "react-icons/fa";
import welcomeImage from "../../assets/undraw_welcoming_42an.svg";

const ClientDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [myParcels, setMyParcels] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const [loading, setLoading] = useState(true);
    const [trackingLivreurId, setTrackingLivreurId] = useState<string | null>(null);
    const [trackingAddress, setTrackingAddress] = useState<string>("");

    const GATEWAY_URL = "http://localhost:8888";

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userId || payload.sub;
            const headers = getHeaders();

            const [profileRes, parcelsRes] = await Promise.all([
                axios.get(`${GATEWAY_URL}/users-service/api/profiles/details/${userId}`, headers),
                axios.get(`${GATEWAY_URL}/parcel-service/api/parcels`, headers)
            ]);

            setUserData(profileRes.data);

            const clientParcels = parcelsRes.data.filter((p: any) =>
                p.clientEmail === profileRes.data.email ||
                p.senderId?.toString() === userId
            );
            setMyParcels(clientParcels);
        } catch (error) {
            console.error("❌ Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTrackLivreur = (livreurId: string) => {
        // Chercher l'adresse du colis correspondant
        const parcel = myParcels.find(p => p.assignedLivreurId === livreurId);
        setTrackingLivreurId(livreurId);
        setTrackingAddress(parcel?.deliveryAddress || "");
        setActiveTab("suivi");
    };

    const total = myParcels.length;
    const inTransit = myParcels.filter((p: any) => p.status === 'IN_TRANSIT').length;
    const delivered = myParcels.filter((p: any) => p.status === 'DELIVERED').length;
    const pending = myParcels.filter((p: any) => p.status === 'PENDING' || p.status === 'ASSIGNED').length;
    const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    const stats = {
        total,
        inTransit,
        delivered,
        pending,
        completionRate
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bon matin";
        if (hour < 18) return "Bon après-midi";
        return "Bonsoir";
    };

    const getStatusConfig = (status: string) => {
        const configs: any = {
            PENDING: { text: 'En attente', color: '#f39c12', bg: '#fef3e2', icon: <FaClock />, progress: 25 },
            ASSIGNED: { text: 'Assigné', color: '#3498db', bg: '#e3f2fd', icon: <FaUser />, progress: 40 },
            IN_TRANSIT: { text: 'En transit', color: '#2ecc71', bg: '#e8f5e9', icon: <FaTruck />, progress: 70 },
            DELIVERED: { text: 'Livré', color: '#27ae60', bg: '#e8f5e9', icon: <FaCheckCircle />, progress: 100 }
        };
        return configs[status] || { text: status, color: '#95a5a6', bg: '#ecf0f1', icon: <FaBox />, progress: 0 };
    };



    const recentParcels = myParcels.slice(0, 3);

    return (
        <div className="client-dashboard">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="CLIENT" />

            <main className="client-main">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={userData}
                />

                <div className="dashboard-container">
                    {loading ? (
                        <div className="loader-wrapper">
                            <div className="loader"></div>
                            <p>Chargement de votre espace...</p>
                        </div>
                    ) : (
                        <>
                            {/* Dashboard */}
                            {activeTab === "dashboard" && (
                                <>
                                    <div className="hero-section">
                                        <div className="hero-content">
                                            <div className="greeting-chip"><span>👋</span><span>{getGreeting()}</span></div>
                                            <h1 className="hero-title"><span className="wave">✨</span>{userData?.firstName || "Client"}<span className="hero-highlight">!</span></h1>
                                            <p className="hero-subtitle">Votre espace de livraison intelligent. Suivez, gérez et recevez vos colis en toute simplicité.</p>
                                            <div className="hero-stats">
                                                <div className="hero-stat"><span className="hero-stat-value">{stats.total}</span><span className="hero-stat-label">Colis totaux</span></div>
                                                <div className="hero-stat-divider"></div>
                                                <div className="hero-stat"><span className="hero-stat-value">{stats.inTransit}</span><span className="hero-stat-label">En transit</span></div>
                                                <div className="hero-stat-divider"></div>
                                                <div className="hero-stat"><span className="hero-stat-value">{stats.delivered}</span><span className="hero-stat-label">Livrés</span></div>
                                            </div>
                                        </div>
                                        <div className="hero-image"><img src={welcomeImage} alt="Delivery illustration" /></div>
                                    </div>

                                    <div className="stats-grid">
                                        <div className="stat-card stat-card-blue"><div className="stat-card-icon"><FaBox /></div><div className="stat-card-info"><span className="stat-card-value">{stats.total}</span><span className="stat-card-label">Total colis</span></div></div>
                                        <div className="stat-card stat-card-orange"><div className="stat-card-icon"><FaTruck /></div><div className="stat-card-info"><span className="stat-card-value">{stats.inTransit}</span><span className="stat-card-label">En cours</span></div></div>
                                        <div className="stat-card stat-card-green"><div className="stat-card-icon"><FaCheckCircle /></div><div className="stat-card-info"><span className="stat-card-value">{stats.delivered}</span><span className="stat-card-label">Livraisons</span></div></div>
                                        <div className="stat-card stat-card-purple"><div className="stat-card-icon"><FaChartLine /></div><div className="stat-card-info"><span className="stat-card-value">{stats.completionRate}%</span><span className="stat-card-label">Taux de réussite</span></div></div>
                                    </div>

                                    <div className="recent-parcels-section">
                                        <div className="section-header">
                                            <div className="section-title-wrapper"><FaRocket className="section-icon" /><h2>Vos dernières commandes</h2></div>
                                            <button className="view-all-btn" onClick={() => setActiveTab("mes-colis")}>Voir tout <FaArrowRight /></button>
                                        </div>
                                        {recentParcels.length === 0 ? (
                                            <div className="empty-parcels"><FaBox className="empty-icon" /><h3>Aucun colis pour le moment</h3><p>Vos commandes apparaîtront ici une fois passées.</p></div>
                                        ) : (
                                            <div className="parcels-grid">
                                                {recentParcels.map((parcel: any, idx: number) => {
                                                    const status = getStatusConfig(parcel.status);
                                                    return (
                                                        <div key={parcel.id} className="parcel-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                                                            <div className="parcel-card-header">
                                                                <span className="parcel-tracking">{parcel.trackingNumber}</span>
                                                                <span className="parcel-status" style={{ background: status.bg, color: status.color }}>{status.icon} {status.text}</span>
                                                            </div>
                                                            <div className="parcel-card-body">
                                                                <div className="parcel-address"><FaMapMarkerAlt className="address-icon" /><span>{parcel.deliveryAddress?.substring(0, 60)}...</span></div>
                                                                <div className="parcel-weight"><FaBox className="weight-icon" /><span>{parcel.weight} kg</span></div>
                                                                {parcel.status !== 'DELIVERED' && (
                                                                    <div className="parcel-progress">
                                                                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${status.progress}%` }}></div></div>
                                                                        <span className="progress-text">{status.progress}%</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="features-section">
                                        <div className="features-grid">
                                            <div className="feature-card"><div className="feature-icon-wrapper"><FaShieldAlt /></div><h3>Livraison sécurisée</h3><p>Vos colis sont traités avec le plus grand soin</p></div>
                                            <div className="feature-card"><div className="feature-icon-wrapper"><FaHeadset /></div><h3>Support 24/7</h3><p>Une équipe dédiée à votre écoute</p></div>
                                            <div className="feature-card"><div className="feature-icon-wrapper"><FaRocket /></div><h3>Livraison express</h3><p>Rapide et fiable dans tout le Maroc</p></div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Mes Colis */}
                            {activeTab === "mes-colis" && (
                                showHistory ? (
                                    <ClientHistory parcels={myParcels} onBack={() => setShowHistory(false)} />
                                ) : (
                                    <ClientOrders
                                        parcels={myParcels}
                                        onRefresh={fetchData}
                                        onTrackLivreur={handleTrackLivreur}
                                        onViewHistory={() => setShowHistory(true)}
                                    />
                                )
                            )}

                            {/* Historique direct depuis sidebar */}
                            {activeTab === "historique" && (
                                <ClientHistory parcels={myParcels} onBack={() => setActiveTab("mes-colis")} />
                            )}

                            {/* Suivi Live */}
                            {activeTab === "suivi" && (
                                <ClientTrackingPage
                                    livreurId={trackingLivreurId}
                                    onBack={() => setActiveTab("mes-colis")}
                                    address={trackingAddress}
                                />
                            )}


                        </>
                    )}
                </div>
            </main>

            <style>{`
                .client-dashboard {
                    display: flex;
                    min-height: 100vh;
                    background: #FBF4F4;
                }
                .client-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .dashboard-container {
                    padding: 30px;
                    max-width: 1400px;
                    margin: 0 auto;
                    width: 100%;
                }
                .loader-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    gap: 20px;
                }
                .loader {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #A5AEAD;
                    border-top: 4px solid #4D5C71;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .hero-section {
                    background: linear-gradient(135deg, #4D5C71 0%, #7B5B61 100%);
                    border-radius: 32px;
                    padding: 40px 50px;
                    margin-bottom: 35px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .hero-content { flex: 1; color: white; }
                .greeting-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                    padding: 6px 16px;
                    border-radius: 50px;
                    font-size: 14px;
                    margin-bottom: 20px;
                }
                .hero-title { font-size: 48px; margin: 0 0 15px 0; font-weight: 800; }
                .wave { display: inline-block; animation: wave 1s ease infinite; margin-right: 5px; }
                @keyframes wave { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(15deg)} 75%{transform:rotate(-15deg)} }
                .hero-highlight { color: #FFD700; }
                .hero-subtitle { font-size: 16px; opacity: 0.9; margin-bottom: 30px; max-width: 500px; }
                .hero-stats { display: flex; align-items: center; gap: 25px; }
                .hero-stat { text-align: center; }
                .hero-stat-value { display: block; font-size: 32px; font-weight: 800; }
                .hero-stat-label { font-size: 12px; opacity: 0.8; }
                .hero-stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.2); }
                .hero-image { flex-shrink: 0; margin-left: 30px; }
                .hero-image img { width: 280px; height: auto; animation: float 3s ease-in-out infinite; }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 35px; }
                .stat-card {
                    background: white;
                    border-radius: 24px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .stat-card-icon { width: 55px; height: 55px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
                .stat-card-blue .stat-card-icon { background: #e8eef3; color: #4D5C71; }
                .stat-card-orange .stat-card-icon { background: #f5ecec; color: #7B5B61; }
                .stat-card-green .stat-card-icon { background: #eef2f2; color: #A5AEAD; }
                .stat-card-purple .stat-card-icon { background: #f3ecec; color: #7B5B61; }
                .stat-card-info { flex: 1; }
                .stat-card-value { display: block; font-size: 28px; font-weight: 800; color: #1a2a3a; }
                .stat-card-label { font-size: 12px; color: #718096; }
                .recent-parcels-section {
                    background: white;
                    border-radius: 28px;
                    padding: 25px;
                    margin-bottom: 35px;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }
                .section-title-wrapper { display: flex; align-items: center; gap: 12px; }
                .section-icon { font-size: 24px; color: #4D5C71; }
                .section-header h2 { font-size: 22px; color: #1a2a3a; margin: 0; }
                .view-all-btn {
                    background: none;
                    border: none;
                    color: #4D5C71;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .view-all-btn:hover { gap: 12px; color: #7B5B61; }
                .parcels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
                .parcel-card {
                    background: #FBF4F4;
                    border-radius: 20px;
                    padding: 18px;
                    transition: all 0.3s;
                    border: 1px solid #e8e0e0;
                }
                .parcel-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); background: white; }
                .parcel-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .parcel-tracking { font-weight: 700; color: #4D5C71; font-size: 13px; }
                .parcel-status { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
                .parcel-address { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #666; margin-bottom: 8px; }
                .address-icon, .weight-icon { color: #7B5B61; font-size: 12px; }
                .parcel-weight { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #888; margin-bottom: 12px; }
                .parcel-progress { display: flex; align-items: center; gap: 10px; }
                .progress-bar { flex: 1; height: 6px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
                .progress-fill { height: 100%; background: linear-gradient(90deg, #4D5C71, #7B5B61); border-radius: 10px; }
                .progress-text { font-size: 11px; font-weight: 600; color: #4D5C71; }
                .empty-parcels { text-align: center; padding: 60px; }
                .empty-icon { font-size: 80px; color: #A5AEAD; margin-bottom: 20px; }
                .empty-parcels h3 { margin-bottom: 10px; color: #4D5C71; }
                .empty-parcels p { color: #A5AEAD; margin-bottom: 25px; }
                .features-section { background: white; border-radius: 28px; padding: 30px; margin-top: 20px; }
                .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
                .feature-card { text-align: center; padding: 25px; border-radius: 20px; transition: all 0.3s; }
                .feature-card:hover { background: #FBF4F4; transform: translateY(-3px); }
                .feature-icon-wrapper { width: 70px; height: 70px; background: linear-gradient(135deg, #4D5C7120, #7B5B6120); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; color: #4D5C71; }
                .feature-card h3 { margin-bottom: 10px; color: #4D5C71; }
                .feature-card p { font-size: 13px; color: #A5AEAD; }
                @media (max-width: 1000px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .features-grid { grid-template-columns: 1fr; }
                    .hero-section { flex-direction: column; text-align: center; }
                    .hero-image { margin-left: 0; margin-top: 30px; }
                    .hero-stats { justify-content: center; }
                    .hero-stat-divider { display: none; }
                }
                @media (max-width: 700px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .dashboard-container { padding: 20px; }
                    .hero-title { font-size: 32px; }
                }
            `}</style>
        </div>
    );
};

export default ClientDashboard;