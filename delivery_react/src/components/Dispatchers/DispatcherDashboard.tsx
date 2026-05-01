import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    FaTruck, FaBoxOpen, FaClock, FaCheckCircle,
    FaStar, FaUser, FaBell, FaExclamationTriangle,
    FaChartLine, FaTachometerAlt, FaCalendarAlt, FaMapMarkedAlt,
    FaClipboardList, FaFileAlt, FaHistory
} from "react-icons/fa";
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
    const navigate = useNavigate();
    const location = useLocation();

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        assigned: 0,
        delivered: 0,
        delayed: 0,
        onTime: 0
    });

    const GATEWAY_URL = "http://localhost:8888";
    const API_PARCELS = `${GATEWAY_URL}/parcel-service/api/parcels`;
    const API_USER_DETAILS = `${GATEWAY_URL}/users-service/api/profiles/details`;
    const API_USERS = `${GATEWAY_URL}/users-service/api/profiles`;

    const toggleTheme = () => setDarkMode(!darkMode);

    const fetchLivreurs = async () => {
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(API_USERS, config);
            const livreursList = res.data.filter((u: any) => u.role === "LIVREUR");
            setLivreurs(livreursList);
        } catch (err) {
            console.error("Error fetching livreurs:", err);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userId;
            const config = { headers: { Authorization: `Bearer ${token}` } };

            try {
                const userRes = await axios.get(`${API_USER_DETAILS}/${userId}`, config);
                setUserData(userRes.data);
            } catch (err) {
                setUserData({
                    firstName: payload.firstName || "Dispatcher",
                    lastName: payload.lastName || "",
                    email: payload.email || payload.sub
                });
            }

            const parcelsRes = await axios.get(API_PARCELS, config);
            const allParcels = parcelsRes.data;
            setParcels(allParcels);

            const now = new Date();
            const pendingCount = allParcels.filter((p: any) => p.status === "PENDING").length;
            const assignedCount = allParcels.filter((p: any) => ["ASSIGNED", "IN_TRANSIT"].includes(p.status)).length;
            const deliveredCount = allParcels.filter((p: any) => p.status === "DELIVERED").length;

            const urgent = allParcels.filter((p: any) => {
                if (p.status === "PENDING" && p.createdAt) {
                    const createdDate = new Date(p.createdAt);
                    const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
                    return diffDays > 2;
                }
                return false;
            });
            setUrgentParcels(urgent);

            setStats({
                total: allParcels.length,
                pending: pendingCount,
                assigned: assignedCount,
                delivered: deliveredCount,
                delayed: urgent.length,
                onTime: deliveredCount - urgent.length
            });

            await fetchLivreurs();

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddClick = () => {
        navigate("/dispatcher/add-colis");
    };

    const handleEditClick = (parcel: any) => {
        navigate("/dispatcher/edit-colis", { state: { parcel } });
    };

    const editParcel = location.state?.parcel;

    const statusPieData = [
        { name: 'En attente', value: stats.pending, color: '#FFBB28' },
        { name: 'En cours', value: stats.assigned, color: '#0088FE' },
        { name: 'Livré', value: stats.delivered, color: '#00C49F' },
    ];

    // Top 3 livreurs
    const topLivreurs = [...livreurs]
        .map(l => ({
            name: `${l.firstName} ${l.lastName}`,
            deliveries: parcels.filter(p => p.assignedLivreurId === l.userId && p.status === "DELIVERED").length,
            inProgress: parcels.filter(p => p.assignedLivreurId === l.userId && ["ASSIGNED", "IN_TRANSIT"].includes(p.status)).length
        }))
        .sort((a, b) => b.deliveries - a.deliveries)
        .slice(0, 3);

    // Données pour la planification des tournées (exemple)
    const tourneesData = [
        { zone: "Casablanca", colis: 45, livreurs: 3, statut: "Planifiée" },
        { zone: "Rabat", colis: 32, livreurs: 2, statut: "En cours" },
        { zone: "Marrakech", colis: 28, livreurs: 2, statut: "Planifiée" },
        { zone: "Tanger", colis: 19, livreurs: 1, statut: "En retard" },
    ];

    // Incidents simulés
    const incidents = [
        { id: 1, type: "Retard", description: "Livreur bloqué dans les embouteillages", severity: "high", colis: "#COL-001" },
        { id: 2, type: "Adresse incorrecte", description: "Client a changé d'adresse", severity: "medium", colis: "#COL-045" },
        { id: 3, type: "Client absent", description: "Tentative de livraison échouée", severity: "low", colis: "#COL-078" },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} darkMode={darkMode} toggleTheme={toggleTheme} user={null} />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                        <div>Chargement des données...</div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                    user={userData}
                />

                <section style={{ padding: '30px' }}>
                    <Routes>
                        <Route path="/" element={
                            <div className="dashboard-wrapper">
                                {/* Welcome Section */}
                                <div className="welcome-section">
                                    <h3>Bonjour, {userData?.firstName || "Dispatcher"} 👋</h3>
                                    <p>Bienvenue sur votre tableau de bord</p>
                                </div>

                                {/* Alertes urgentes */}
                                {urgentParcels.length > 0 && (
                                    <div style={{
                                        background: '#fff3e0',
                                        borderLeft: '4px solid #f57c00',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        marginBottom: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <FaExclamationTriangle style={{ color: '#f57c00', fontSize: '20px' }} />
                                        <span style={{ color: '#e65100' }}>
                                            ⚠️ {urgentParcels.length} colis en attente depuis plus de 2 jours
                                        </span>
                                        <button
                                            onClick={() => setActiveTab("colis")}
                                            style={{ marginLeft: 'auto', background: '#f57c00', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
                                        >
                                            Voir
                                        </button>
                                    </div>
                                )}

                                {/* Stats Cards - 5 cartes */}
                                <div className="stats-grid-top" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '30px' }}>
                                    <div className="stat-item" style={{ background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <div className="icon-circle" style={{ width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff4e5' }}><FaBoxOpen style={{ color: '#fdcb6e', fontSize: '24px' }} /></div>
                                        <div className="texts"><span>Total Colis</span><h2 style={{ margin: 0, fontSize: '28px' }}>{stats.total}</h2></div>
                                    </div>
                                    <div className="stat-item" style={{ background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div className="icon-circle" style={{ width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff4e5' }}><FaClock style={{ color: '#fdcb6e', fontSize: '24px' }} /></div>
                                        <div className="texts"><span>À Assigner</span><h2 style={{ margin: 0 }}>{stats.pending}</h2></div>
                                    </div>
                                    <div className="stat-item" style={{ background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div className="icon-circle" style={{ width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2ff' }}><FaTruck style={{ color: '#0984e3', fontSize: '24px' }} /></div>
                                        <div className="texts"><span>En Transit</span><h2 style={{ margin: 0 }}>{stats.assigned}</h2></div>
                                    </div>
                                    <div className="stat-item" style={{ background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div className="icon-circle" style={{ width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e3fcef' }}><FaCheckCircle style={{ color: '#00b894', fontSize: '24px' }} /></div>
                                        <div className="texts"><span>Livrés</span><h2 style={{ margin: 0 }}>{stats.delivered}</h2></div>
                                    </div>
                                    <div className="stat-item" style={{ background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div className="icon-circle" style={{ width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffebee' }}><FaExclamationTriangle style={{ color: '#f44336', fontSize: '24px' }} /></div>
                                        <div className="texts"><span>En Retard</span><h2 style={{ margin: 0, color: '#f44336' }}>{stats.delayed}</h2></div>
                                    </div>
                                </div>

                                {/* Première ligne: Map + Pie Chart */}
                                <div className="charts-main-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                    <div className="full-width-map" style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ padding: '15px', background: '#fff', margin: 0, fontSize: '1rem', borderBottom: '1px solid #eee' }}>🗺️ Carte de distribution</h3>
                                        <DeliveryMap parcels={parcels} />
                                    </div>

                                    <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ marginBottom: '20px' }}>📊 Statut des colis</h3>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={statusPieData} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={5} labelLine={false}>
                                                    {statusPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pie-labels" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                                            {statusPieData.map(s => {
                                                const total = stats.total;
                                                const percentage = total > 0 ? ((s.value / total) * 100).toFixed(0) : 0;
                                                return (
                                                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                        <span style={{ background: s.color, width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' }}></span>
                                                        <span>{s.name} ({s.value} - {percentage}%)</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Deuxième ligne: Planification des tournées + Top livreurs */}
                                <div className="charts-main-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                    {/* Planification des tournées */}
                                    <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FaCalendarAlt style={{ color: '#7367f0' }} /> Planification des tournées
                                        </h3>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Zone</th>
                                                    <th style={{ padding: '10px', textAlign: 'center' }}>Colis</th>
                                                    <th style={{ padding: '10px', textAlign: 'center' }}>Livreurs</th>
                                                    <th style={{ padding: '10px', textAlign: 'center' }}>Statut</th>
                                                    <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {tourneesData.map((tour, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '10px', fontWeight: '500' }}>
                                                            <FaMapMarkedAlt style={{ display: 'inline', marginRight: '8px', color: '#7367f0' }} />
                                                            {tour.zone}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>{tour.colis}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>{tour.livreurs}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                <span style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '11px',
                                                                    background: tour.statut === 'Planifiée' ? '#e8f5e9' : tour.statut === 'En cours' ? '#e3f2fd' : '#ffebee',
                                                                    color: tour.statut === 'Planifiée' ? '#2e7d32' : tour.statut === 'En cours' ? '#1565c0' : '#c62828'
                                                                }}>
                                                                    {tour.statut}
                                                                </span>
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                                            <button style={{
                                                                background: '#7367f0',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '5px 12px',
                                                                borderRadius: '15px',
                                                                fontSize: '11px',
                                                                cursor: 'pointer'
                                                            }}>
                                                                Détails
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                            <button style={{
                                                background: 'transparent',
                                                color: '#7367f0',
                                                border: '1px solid #7367f0',
                                                padding: '8px 20px',
                                                borderRadius: '20px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}>
                                                + Planifier nouvelle tournée
                                            </button>
                                        </div>
                                    </div>

                                    {/* Top 3 Livreurs */}
                                    <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ marginBottom: '20px' }}>🏆 Top 3 Livreurs</h3>
                                        {topLivreurs.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>Aucune donnée</div>
                                        ) : (
                                            <div>
                                                {topLivreurs.map((livreur, index) => (
                                                    <div key={index} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '12px 15px',
                                                        marginBottom: '10px',
                                                        background: index === 0 ? '#FFF8E1' : '#f8f9fa',
                                                        borderRadius: '12px',
                                                        borderLeft: index === 0 ? '3px solid #FFD700' : '3px solid #ddd'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            {index === 0 && <FaStar style={{ color: '#FFD700' }} />}
                                                            <span style={{ fontWeight: 'bold' }}>{livreur.name}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '20px' }}>
                                                            <span style={{ color: '#00C49F' }}>✅ {livreur.deliveries}</span>
                                                            <span style={{ color: '#0088FE' }}>🚚 {livreur.inProgress}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Troisième ligne: Gestion des incidents + Statistiques rapides */}
                                <div className="charts-main-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {/* Gestion des incidents */}
                                    <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FaExclamationTriangle style={{ color: '#f44336' }} /> Incidents récents
                                        </h3>
                                        {incidents.map((incident) => (
                                            <div key={incident.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px',
                                                marginBottom: '10px',
                                                background: incident.severity === 'high' ? '#ffebee' : incident.severity === 'medium' ? '#fff8e1' : '#f5f5f5',
                                                borderRadius: '10px',
                                                borderLeft: incident.severity === 'high' ? '3px solid #f44336' : incident.severity === 'medium' ? '3px solid #ff9800' : '3px solid #4caf50'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{incident.type}</div>
                                                    <div style={{ fontSize: '11px', color: '#666' }}>{incident.description}</div>
                                                    <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>Colis: {incident.colis}</div>
                                                </div>
                                                <button style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#7367f0',
                                                    cursor: 'pointer',
                                                    fontSize: '20px'
                                                }}>
                                                    →
                                                </button>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                            <button style={{
                                                background: 'transparent',
                                                color: '#f44336',
                                                border: '1px solid #f44336',
                                                padding: '6px 15px',
                                                borderRadius: '15px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                            }}>
                                                Signaler un incident
                                            </button>
                                        </div>
                                    </div>

                                    {/* Statistiques rapides + Actions */}
                                    <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ marginBottom: '20px' }}>📊 Actions rapides</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
                                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate("/dispatcher/colis")}>
                                                <FaClipboardList style={{ fontSize: '28px', color: '#7367f0', marginBottom: '8px' }} />
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Gérer colis</div>
                                                <div style={{ fontSize: '11px', color: '#666' }}>{stats.pending} à assigner</div>
                                            </div>
                                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate("/dispatcher/livreurs")}>
                                                <FaUser style={{ fontSize: '28px', color: '#7367f0', marginBottom: '8px' }} />
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Livreurs</div>
                                                <div style={{ fontSize: '11px', color: '#666' }}>{livreurs.length} actifs</div>
                                            </div>
                                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
                                                <FaHistory style={{ fontSize: '28px', color: '#7367f0', marginBottom: '8px' }} />
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Historique</div>
                                                <div style={{ fontSize: '11px', color: '#666' }}>{stats.delivered} livraisons</div>
                                            </div>
                                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
                                                <FaFileAlt style={{ fontSize: '28px', color: '#7367f0', marginBottom: '8px' }} />
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Rapports</div>
                                                <div style={{ fontSize: '11px', color: '#666' }}>Télécharger</div>
                                            </div>
                                        </div>
                                        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                                                {stats.delivered > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Taux de livraison réussi</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        } />

                        <Route path="colis" element={<ColisManagement onAddClick={handleAddClick} onEditClick={handleEditClick} />} />
                        <Route path="add-colis" element={<AddColisForm onCancel={() => navigate("/dispatcher/colis")} />} />
                        <Route path="edit-colis" element={editParcel ? (
                            <UpdateColisForm
                                parcelToEdit={editParcel}
                                onCancel={() => navigate("/dispatcher/colis")}
                                onUpdateSuccess={() => { navigate("/dispatcher/colis"); fetchData(); }}
                            />
                        ) : (
                            <div>No parcel selected</div>
                        )} />
                        <Route path="livreurs" element={<LivreurList />} />
                    </Routes>
                </section>
            </main>
        </div>
    );
};

export default DispatcherDashboard;