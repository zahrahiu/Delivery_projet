import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
    FaTruck, FaBoxOpen, FaClock, FaCheckCircle, FaStar, FaUser, FaExclamationTriangle,
    FaCalendarAlt, FaMapMarkedAlt, FaClipboardList, FaHistory, FaChartBar, FaTimesCircle,
    FaArrowUp, FaArrowDown, FaShieldAlt, FaAward, FaRocket, FaUsers, FaPercentage,
    FaShippingFast, FaHourglassHalf, FaThumbsUp, FaChartLine
} from "react-icons/fa";
import { MdOutlineDeliveryDining, MdOutlineWarning } from "react-icons/md";
import { BsFillRocketFill, BsShieldCheck } from "react-icons/bs";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import ColisManagement from "./ ColisManagement";
import LivreurList from "./LivreurList";
import AddColisForm from "./AddColisForm";
import UpdateColisForm from "./UpdateColisForm";
import DeliveryMap from "./DeliveryMap";

const DispatcherDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [parcels, setParcels] = useState<any[]>([]);
    const [livreurs, setLivreurs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [urgentParcels, setUrgentParcels] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, delivered: 0, delayed: 0, returned: 0, cancelled: 0 });

    const GATEWAY_URL = "http://localhost:8888";
    const API_PARCELS = `${GATEWAY_URL}/parcel-service/api/parcels`;
    const API_USERS = `${GATEWAY_URL}/users-service/api/profiles`;

    const toggleTheme = () => setDarkMode(!darkMode);

    // Fonction pour calculer le rating dynamique d'un livreur
    const calculateDynamicRating = (livreurId: number) => {
        const livreurParcels = parcels.filter(p => p.assignedLivreurId == livreurId);
        const totalDeliveries = livreurParcels.length;
        if (totalDeliveries === 0) return 0;

        const successfulDeliveries = livreurParcels.filter(p => p.status === "DELIVERED").length;
        const successRate = (successfulDeliveries / totalDeliveries) * 5;

        const volumeBonus = Math.min(totalDeliveries / 50, 1);

        let speedBonus = 0;
        const fastDeliveries = livreurParcels.filter(p => {
            if (p.status === "DELIVERED" && p.createdAt && p.deliveredAt) {
                const deliveryTime = (new Date(p.deliveredAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 3600 * 24);
                return deliveryTime < 2;
            }
            return false;
        });
        if (fastDeliveries.length > 0 && successfulDeliveries > 0) {
            speedBonus = (fastDeliveries.length / successfulDeliveries) * 0.5;
        }

        let finalRating = successRate + volumeBonus + speedBonus;
        return Math.min(finalRating, 5);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = JSON.parse(atob(token.split('.')[1]));

            try {
                const userRes = await axios.get(`${GATEWAY_URL}/users-service/api/profiles/details/${payload.userId}`, config);
                setUserData(userRes.data);
            } catch { setUserData({ firstName: payload.firstName || "Dispatcher" }); }

            const parcelsRes = await axios.get(API_PARCELS, config);
            const allParcels = parcelsRes.data;
            setParcels(allParcels);

            const usersRes = await axios.get(API_USERS, config);
            const livreursList = usersRes.data.filter((u: any) => u.role === "LIVREUR");
            setLivreurs(livreursList);

            const now = new Date();
            const pending = allParcels.filter((p: any) => p.status === "PENDING").length;
            const assigned = allParcels.filter((p: any) => ["ASSIGNED", "IN_TRANSIT"].includes(p.status)).length;
            const delivered = allParcels.filter((p: any) => p.status === "DELIVERED").length;
            const returned = allParcels.filter((p: any) => p.status === "RETURNED").length;
            const cancelled = allParcels.filter((p: any) => p.status === "CANCELLED").length;

            const urgent = allParcels.filter((p: any) => {
                if (p.status === "PENDING" && p.createdAt) {
                    const diffDays = (now.getTime() - new Date(p.createdAt).getTime()) / (1000 * 3600 * 24);
                    return diffDays > 2;
                }
                return false;
            });
            setUrgentParcels(urgent);

            setStats({
                total: allParcels.length,
                pending,
                assigned,
                delivered,
                delayed: urgent.length,
                returned,
                cancelled
            });

            const incidentsData = allParcels
                .filter((p: any) => p.status === "RETURNED" || p.status === "CANCELLED")
                .slice(0, 5)
                .map((p: any) => ({
                    id: p.id,
                    type: p.status === "RETURNED" ? "Retour" : "Annulation",
                    description: p.deliveryNotes || p.deliveryAddress?.substring(0, 50) || "Problème signalé",
                    severity: p.status === "RETURNED" ? "high" : "medium",
                    colis: p.trackingNumber || `#${p.id}`,
                }));
            setIncidents(incidentsData);

        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // Top livreurs avec rating DYNAMIQUE
    const topLivreurs = [...livreurs]
        .map(l => {
            const total = parcels.filter(p => p.assignedLivreurId == l.userId).length;
            const deliveries = parcels.filter(p => p.assignedLivreurId == l.userId && p.status === "DELIVERED").length;
            const rating = calculateDynamicRating(l.userId);
            return {
                name: `${l.firstName} ${l.lastName}`,
                deliveries,
                total,
                rating
            };
        })
        .filter(l => l.total > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

    const zoneStats: any = {};
    parcels.forEach(p => {
        const zone = p.cityName || 'Inconnue';
        if (!zoneStats[zone]) zoneStats[zone] = { zone, colis: 0, livreurs: new Set() };
        zoneStats[zone].colis++;
        if (p.assignedLivreurId) zoneStats[zone].livreurs.add(p.assignedLivreurId);
    });
    const tourneesData = Object.values(zoneStats).map((z: any) => ({ zone: z.zone, colis: z.colis, livreurs: z.livreurs.size, statut: z.livreurs.size > 0 ? "Actif" : "En attente" })).sort((a: any, b: any) => b.colis - a.colis).slice(0, 5);

    const successRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

    const avgDeliveryTime = () => {
        const deliveredParcels = parcels.filter(p => p.status === "DELIVERED" && p.createdAt && p.deliveredAt);
        if (deliveredParcels.length === 0) return 0;
        const totalDays = deliveredParcels.reduce((sum, p) => {
            const days = (new Date(p.deliveredAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 3600 * 24);
            return sum + days;
        }, 0);
        return (totalDays / deliveredParcels.length).toFixed(1);
    };

    const performanceScore = () => {
        if (stats.total === 0) return 0;
        return Math.round(((stats.delivered - stats.returned - stats.cancelled) / stats.total) * 100);
    };

    const getChangeForCard = (label: string) => {
        const changes: any = {
            'Total Colis': '+12%',
            'À Assigner': `+${stats.pending}`,
            'En Transit': stats.assigned > 10 ? '+8%' : '+5%',
            'Livrés': stats.delivered > 50 ? '+23%' : '+15%',
            'En Retard': stats.delayed > 0 ? '-5%' : '0%',
            'Taux Réussite': successRate > 80 ? '+12%' : '+5%'
        };
        return changes[label];
    };

    if (loading) return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <p>Chargement du tableau de bord...</p>
                    <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
                </div>
            </main>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0B0F19' : '#F8FAFE' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} darkMode={darkMode} toggleTheme={toggleTheme} user={userData} />

                <div style={{ padding: '28px 32px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
                    <Routes>
                        <Route path="/" element={
                            <>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                            Bon retour, {userData?.firstName || "Dispatcher"} 👋
                                        </h2>
                                        <p style={{ margin: '8px 0 0', color: darkMode ? '#8B92A5' : '#6C757D', fontSize: 14 }}>
                                            Voici les performances de votre flotte aujourd'hui
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ background: darkMode ? '#1A1F2E' : 'white', borderRadius: 16, padding: '8px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <FaCalendarAlt style={{ color: '#667eea', marginRight: 8 }} />
                                            <span style={{ fontSize: 14, fontWeight: 500 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Alerte Urgence */}
                                {urgentParcels.length > 0 && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)',
                                        borderRadius: 20,
                                        padding: '16px 24px',
                                        marginBottom: 28,
                                        boxShadow: '0 8px 20px rgba(238, 90, 36, 0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 16
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <MdOutlineWarning style={{ fontSize: 28, color: 'white' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 18, color: 'white' }}>{urgentParcels.length} colis en attente urgente</div>
                                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>Ces colis sont en attente depuis plus de 2 jours</div>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate("/dispatcher/colis")} style={{ background: 'white', color: '#EE5A24', border: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>Voir détails →</button>
                                    </div>
                                )}

                                {/* 6 Stats Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                                    {[
                                        { icon: <FaBoxOpen />, label: 'Total Colis', value: stats.total, change: getChangeForCard('Total Colis'), color: '#667eea', bg: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)' },
                                        { icon: <FaClock />, label: 'À Assigner', value: stats.pending, change: getChangeForCard('À Assigner'), color: '#FFB74D', bg: 'linear-gradient(135deg, #FFB74D20 0%, #FF980020 100%)' },
                                        { icon: <FaTruck />, label: 'En Transit', value: stats.assigned, change: getChangeForCard('En Transit'), color: '#42A5F5', bg: 'linear-gradient(135deg, #42A5F520 0%, #2196F320 100%)' },
                                        { icon: <FaCheckCircle />, label: 'Livrés', value: stats.delivered, change: getChangeForCard('Livrés'), color: '#66BB6A', bg: 'linear-gradient(135deg, #66BB6A20 0%, #4CAF5020 100%)' },
                                        { icon: <FaPercentage />, label: 'Taux Réussite', value: `${successRate}%`, change: getChangeForCard('Taux Réussite'), color: '#9C27B0', bg: 'linear-gradient(135deg, #9C27B020 0%, #7B1FA220 100%)' },
                                    ].map((s, i) => (
                                        <div key={i} style={{ background: darkMode ? '#1A1F2E' : 'white', borderRadius: 24, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', border: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)'; }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: s.color }}>{s.icon}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: s.change.startsWith('+') ? '#66BB6A' : s.change === '0%' ? '#8B92A5' : '#EF5350' }}>
                                                    {s.change.startsWith('+') ? <FaArrowUp size={10} /> : s.change === '0%' ? null : <FaArrowDown size={10} />}
                                                    {s.change}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 16, color: darkMode ? '#F1F5F9' : '#1E293B' }}>{s.value}</div>
                                            <div style={{ fontSize: 13, color: darkMode ? '#8B92A5' : '#6C757D', marginTop: 4 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Map + Statistiques Dynamiques */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                                    <div style={{ background: darkMode ? '#1A1F2E' : 'white', borderRadius: 28, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }}>
                                        <h4 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E293B' }}>🗺️ Carte de distribution des colis</h4>
                                        <DeliveryMap parcels={parcels} />
                                        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#8B92A5' }}>
                                            📍 {parcels.length} colis sur la carte • {livreurs.length} livreurs actifs
                                        </div>
                                    </div>

                                    <div style={{ background: darkMode ? '#1A1F2E' : 'white', borderRadius: 28, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }}>
                                        <h4 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E293B' }}>📊 Performance Opérationnelle</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                            <div style={{ textAlign: 'center', padding: 16, background: darkMode ? '#0B0F19' : '#F8FAFE', borderRadius: 20 }}>
                                                <FaShippingFast style={{ fontSize: 28, color: '#667eea', marginBottom: 8 }} />
                                                <div style={{ fontSize: 24, fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E293B' }}>{avgDeliveryTime()}j</div>
                                                <div style={{ fontSize: 11, color: '#8B92A5' }}>Délai moyen livraison</div>
                                            </div>
                                            <div style={{ textAlign: 'center', padding: 16, background: darkMode ? '#0B0F19' : '#F8FAFE', borderRadius: 20 }}>
                                                <FaChartLine style={{ fontSize: 28, color: '#66BB6A', marginBottom: 8 }} />
                                                <div style={{ fontSize: 24, fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E293B' }}>{performanceScore()}%</div>
                                                <div style={{ fontSize: 11, color: '#8B92A5' }}>Score de performance</div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ fontSize: 13, color: '#8B92A5' }}>Taux d'assignation</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#42A5F5' }}>{stats.total > 0 ? Math.round(((stats.total - stats.pending) / stats.total) * 100) : 0}%</span>
                                            </div>
                                            <div style={{ height: 8, background: darkMode ? '#2D3246' : '#E9ECF2', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${stats.total > 0 ? ((stats.total - stats.pending) / stats.total) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 4 }}></div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
                                                <span style={{ fontSize: 13, color: '#8B92A5' }}>Taux de livraison</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#66BB6A' }}>{successRate}%</span>
                                            </div>
                                            <div style={{ height: 8, background: darkMode ? '#2D3246' : '#E9ECF2', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${successRate}%`, height: '100%', background: 'linear-gradient(90deg, #66BB6A, #4CAF50)', borderRadius: 4 }}></div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
                                                <span style={{ fontSize: 13, color: '#8B92A5' }}>Taux d'incidents</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#EF5350' }}>{stats.total > 0 ? Math.round(((stats.returned + stats.cancelled) / stats.total) * 100) : 0}%</span>
                                            </div>
                                            <div style={{ height: 8, background: darkMode ? '#2D3246' : '#E9ECF2', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${stats.total > 0 ? ((stats.returned + stats.cancelled) / stats.total) * 100 : 0}%`, height: '100%', background: '#EF5350', borderRadius: 4 }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tournées + Top Livreurs */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                                    <div style={{ background: darkMode ? '#1A1F2E' : 'white', borderRadius: 28, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }}>
                                        <h4 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E293B' }}>🗺️ Tournées par zone</h4>
                                        {tourneesData.length > 0 ? (
                                            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                                                {tourneesData.map((t, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, #667eea20 0%, #764ba220 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667eea' }}><FaMapMarkedAlt /></div>
                                                            <div><div style={{ fontWeight: 600, color: darkMode ? '#F1F5F9' : '#1E293B' }}>{t.zone}</div><div style={{ fontSize: 11, color: '#8B92A5' }}>{t.colis} colis</div></div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                                            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 20, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E293B' }}>{t.livreurs}</div><div style={{ fontSize: 10, color: '#8B92A5' }}>Livreurs</div></div>
                                                            <div style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: t.statut === 'Actif' ? '#E8F5E9' : '#FFF3E0', color: t.statut === 'Actif' ? '#2E7D32' : '#ED6C02' }}>{t.statut}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p style={{ textAlign: 'center', padding: 50, color: '#8B92A5' }}>Aucune zone active</p>}
                                    </div>

                                    <div style={{ background: darkMode ? '#1A1F2E' : 'white', borderRadius: 28, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }}>
                                        <h4 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E293B' }}>🏆 Top Livreurs (Rating Dynamique)</h4>
                                        {topLivreurs.length > 0 ? (
                                            <div>
                                                {topLivreurs.map((l, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg, #FFD700, #FFA000)' : i === 1 ? 'linear-gradient(135deg, #C0C0C0, #808080)' : i === 2 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' : darkMode ? '#2D3246' : '#E9ECF2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>{i + 1}</div>
                                                            <div><div style={{ fontWeight: 600, color: darkMode ? '#F1F5F9' : '#1E293B' }}>{l.name}</div><div style={{ fontSize: 11, color: '#8B92A5' }}>{l.total} missions</div></div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontWeight: 700, color: '#66BB6A' }}>{l.deliveries}</div><div style={{ fontSize: 10, color: '#8B92A5' }}>Livrées</div></div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                {[...Array(5)].map((_, starIdx) => (
                                                                    <FaStar key={starIdx} size={14} color={starIdx < Math.floor(l.rating) ? '#FFD700' : starIdx < l.rating ? '#FFD700' : '#E9ECF2'} style={{ opacity: starIdx < l.rating ? 1 : 0.3 }} />
                                                                ))}
                                                                <span style={{ fontWeight: 600, marginLeft: 4, color: '#FFB74D' }}>{l.rating.toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p style={{ textAlign: 'center', padding: 50, color: '#8B92A5' }}>Aucun livreur actif</p>}
                                    </div>
                                </div>

                                {/* Incidents + Actions Rapides */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div style={{ background: darkMode ? '#1A1F2E' : 'white', borderRadius: 28, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }}>
                                        <h4 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E293B' }}>⚠️ Incidents récents</h4>
                                        {incidents.length > 0 ? (
                                            incidents.map(inc => (
                                                <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', marginBottom: 12, borderRadius: 16, background: inc.severity === 'high' ? '#FFEBEE' : '#FFF8E1', borderLeft: `4px solid ${inc.severity === 'high' ? '#EF5350' : '#FFB74D'}` }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: inc.severity === 'high' ? '#EF5350' : '#FFB74D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18 }}>{inc.severity === 'high' ? <FaTimesCircle /> : <FaExclamationTriangle />}</div>
                                                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14, color: '#1E293B' }}>{inc.type}</div><div style={{ fontSize: 12, color: '#6C757D' }}>{inc.description}</div></div>
                                                    <small style={{ color: '#8B92A5', fontSize: 11 }}>{inc.colis}</small>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: 50 }}>
                                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><BsShieldCheck style={{ fontSize: 32, color: '#66BB6A' }} /></div>
                                                <p style={{ color: '#8B92A5' }}>✅ Aucun incident à signaler</p>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ background: darkMode ? '#1A1F2E' : 'white', borderRadius: 28, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }}>
                                        <h4 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E293B' }}>⚡ Actions Rapides</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            {[
                                                { label: 'Gérer Colis', sub: `${stats.pending} à assigner`, icon: <FaClipboardList size={28} />, path: '/dispatcher/colis', color: '#667eea' },
                                                { label: 'Livreurs', sub: `${livreurs.length} actifs`, icon: <FaUsers size={28} />, path: '/dispatcher/livreurs', color: '#42A5F5' },
                                                { label: 'Performance', sub: `${performanceScore()}% score`, icon: <FaChartLine size={28} />, path: null, color: '#66BB6A' },
                                                { label: 'Tournées', sub: `${Object.keys(zoneStats).length} zones`, icon: <BsFillRocketFill size={28} />, path: null, color: '#FFB74D' }
                                            ].map((a, i) => (
                                                <div key={i} onClick={() => a.path && navigate(a.path)} style={{ background: darkMode ? '#0B0F19' : '#F8FAFE', padding: 20, borderRadius: 20, textAlign: 'center', cursor: a.path ? 'pointer' : 'default', transition: 'all 0.2s', border: `1px solid ${darkMode ? '#2D3246' : '#E9ECF2'}` }} onMouseEnter={e => { if (a.path) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; } }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                                    <div style={{ width: 56, height: 56, borderRadius: 18, background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: a.color }}>{a.icon}</div>
                                                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: darkMode ? '#F1F5F9' : '#1E293B' }}>{a.label}</div>
                                                    <div style={{ fontSize: 11, color: '#8B92A5' }}>{a.sub}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        } />
                        <Route path="colis" element={<ColisManagement onAddClick={() => navigate("/dispatcher/add-colis")} onEditClick={(p) => navigate("/dispatcher/edit-colis", { state: { parcel: p } })} />} />
                        <Route path="add-colis" element={<AddColisForm onCancel={() => navigate("/dispatcher/colis")} />} />
                        <Route path="edit-colis" element={location.state?.parcel ? <UpdateColisForm parcelToEdit={location.state.parcel} onCancel={() => navigate("/dispatcher/colis")} onUpdateSuccess={() => { navigate("/dispatcher/colis"); fetchData(); }} /> : <div>No parcel</div>} />
                        <Route path="livreurs" element={<LivreurList />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default DispatcherDashboard;