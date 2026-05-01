import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import {
    FaTruck, FaBoxOpen, FaHistory, FaMapMarkedAlt,
    FaExclamationTriangle, FaCheckCircle, FaClock, FaRoute,
    FaStar, FaTrophy, FaCalendarAlt, FaChartLine, FaBox, FaUserCheck
} from "react-icons/fa";

// Import components
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import LivreurOrders from "./LivreurOrders";
import LivreurTracking from "./LivreurTracking";
import LivreurHistory from "./LivreurHistory";
import LivreurReports from "./LivreurReports";
import LivreurRouteMap from "./LivreurRouteMap";
import heroImage from "../../assets/undraw_on-the-way_zwi3.svg";

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icône personnalisée pour les colis
const parcelIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/679/679821.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

const LivreurDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [myParcels, setMyParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState<[number, number]>([33.5731, -7.5898]);
    const navigate = useNavigate();

    const GATEWAY_URL = "http://localhost:8888";

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) { navigate("/login"); return; }

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userId || payload.sub;
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            const [profileRes, parcelsRes] = await Promise.all([
                axios.get(`${GATEWAY_URL}/users-service/api/profiles/details/${userId}`, headers),
                axios.get(`${GATEWAY_URL}/parcel-service/api/parcels`, headers)
            ]);

            setUserData(profileRes.data);

            const assignedToMe = parcelsRes.data.filter((p: any) =>
                p.assignedLivreurId && String(p.assignedLivreurId) === String(userId)
            );
            setMyParcels(assignedToMe);

            // جلب موقع أول كوليس لتوجيه الخريطة
            const firstParcel = assignedToMe.find((p: any) => p.latitude && p.longitude);
            if (firstParcel) {
                setMapCenter([parseFloat(firstParcel.latitude), parseFloat(firstParcel.longitude)]);
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            Swal.fire('Erreur', 'Impossible de charger les données', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ✅ حساب الإحصائيات بشكل منفصل
    const total = myParcels.length;
    const pending = myParcels.filter((p: any) => p.status === 'ASSIGNED').length;
    const inTransit = myParcels.filter((p: any) => p.status === 'IN_TRANSIT').length;
    const delivered = myParcels.filter((p: any) => p.status === 'DELIVERED').length;
    const returned = myParcels.filter((p: any) => p.status === 'RETURNED').length;
    const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    const stats = {
        total,
        pending,
        inTransit,
        delivered,
        returned,
        completionRate
    };

    const pieData = [
        { name: 'En cours', value: stats.inTransit, color: '#3498db' },
        { name: 'Livrés', value: stats.delivered, color: '#2ecc71' }
    ].filter(item => item.value > 0);

    const pendingParcels = myParcels.filter((p: any) => p.status !== 'DELIVERED');

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="LIVREUR" />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} user={userData} />

                <section style={{ padding: '25px' }}>
                    {loading ? (
                        <div className="loader-container">Chargement en cours...</div>
                    ) : (
                        <div className="dashboard-content">
                            {activeTab === "dashboard" && (
                                <>
                                    {/* Welcome Banner */}
                                    <div className="welcome-banner">
                                        <div className="welcome-text">
                                            <h1>Bonjour, {userData?.firstName || "Livreur"}! 🚀</h1>
                                            <p>Vous avez <b>{stats.inTransit + stats.pending}</b> colis à livrer aujourd'hui</p>
                                            {/* Stats Grid */}
                                            <div className="stats-grid">
                                                <div className="stat-card">
                                                    <div className="stat-icon blue">
                                                        <FaBoxOpen />
                                                    </div>
                                                    <div className="stat-info">
                                                        <span className="stat-value">{stats.total}</span>
                                                        <span className="stat-label">Total missions</span>
                                                    </div>
                                                </div>

                                                <div className="stat-card">
                                                    <div className="stat-icon cyan">
                                                        <FaTruck />
                                                    </div>
                                                    <div className="stat-info">
                                                        <span className="stat-value">{stats.inTransit}</span>
                                                        <span className="stat-label">En cours</span>
                                                    </div>
                                                </div>
                                                <div className="stat-card">
                                                    <div className="stat-icon green">
                                                        <FaCheckCircle />
                                                    </div>
                                                    <div className="stat-info">
                                                        <span className="stat-value">{stats.delivered}</span>
                                                        <span className="stat-label">Livrés</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="welcome-image">
                                            <div className="logo-area">
                                                <img src={heroImage} alt="QribLik Logo" className="logo-img" />
                                            </div>
                                        </div>
                                    </div>



                                    {/* Deux colonnes: Carte + Graphique */}
                                    <div className="two-columns">
                                        <div className="map-card">
                                            <div className="card-header">
                                                <h3><FaMapMarkedAlt /> Tournée en cours</h3>
                                                <button
                                                    className="btn-view-map"
                                                    onClick={() => setActiveTab("ma-tournee")}
                                                >
                                                    Voir détail →
                                                </button>
                                            </div>
                                            <div className="mini-map">
                                                {pendingParcels.length > 0 ? (
                                                    <MapContainer
                                                        center={mapCenter}
                                                        zoom={8}
                                                        style={{ height: '280px', width: '100%', borderRadius: '16px' }}
                                                        scrollWheelZoom={false}
                                                    >
                                                        <TileLayer
                                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            attribution='&copy; OpenStreetMap'
                                                        />
                                                        {pendingParcels.slice(0, 10).map((parcel: any) => (
                                                            parcel.latitude && parcel.longitude && (
                                                                <Marker
                                                                    key={parcel.id}
                                                                    position={[parseFloat(parcel.latitude), parseFloat(parcel.longitude)]}
                                                                    icon={parcelIcon}
                                                                >
                                                                    <Popup>
                                                                        <strong>{parcel.trackingNumber}</strong><br />
                                                                        {parcel.deliveryAddress?.substring(0, 50)}...
                                                                    </Popup>
                                                                </Marker>
                                                            )
                                                        ))}
                                                    </MapContainer>
                                                ) : (
                                                    <div className="map-placeholder">
                                                        <FaMapMarkedAlt className="placeholder-icon" />
                                                        <p>Aucun colis à afficher</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="map-footer">
                                                <span>{pendingParcels.length} colis restants</span>
                                                <span className="map-hint">Cliquez pour voir l'itinéraire complet</span>
                                            </div>
                                        </div>

                                        {/* Pie Chart */}
                                        <div className="chart-card">
                                            <div className="card-header">
                                                <h3><FaChartLine /> Répartition</h3>
                                            </div>
                                            <div className="pie-chart-container">
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <PieChart>
                                                        <Pie
                                                            data={pieData}
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {pieData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="chart-stats">
                                                <div className="stat-dot">
                                                    <span className="dot blue-dot"></span>
                                                    <span>Taux de réussite: {stats.completionRate}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Prochains colis */}
                                    <div className="next-parcels">
                                        <div className="section-header">
                                            <h3><FaBox /> Prochains colis à livrer</h3>
                                            <button onClick={() => setActiveTab("mes-colis")}>Voir tout</button>
                                        </div>
                                        <div className="parcels-list-horizontal">
                                            {pendingParcels.slice(0, 4).map((parcel: any, idx: number) => (
                                                <div key={parcel.id} className="parcel-card-horizontal" style={{ animationDelay: `${idx * 0.1}s` }}>
                                                    <div className="parcel-number">{idx + 1}</div>
                                                    <div className="parcel-info-horizontal">
                                                        <div className="parcel-tracking">{parcel.trackingNumber}</div>
                                                        <div className="parcel-address">{parcel.deliveryAddress?.substring(0, 35)}...</div>
                                                        <div className="parcel-weight">⚖️ {parcel.weight} kg</div>
                                                    </div>
                                                    <button
                                                        className="btn-start-delivery"
                                                        onClick={() => {
                                                            if (parcel.latitude && parcel.longitude) {
                                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${parcel.latitude},${parcel.longitude}`);
                                                            }
                                                        }}
                                                    >
                                                        Démarrer →
                                                    </button>
                                                </div>
                                            ))}
                                            {pendingParcels.length === 0 && (
                                                <div className="empty-parcels">
                                                    <FaCheckCircle className="empty-icon" />
                                                    <p>🎉 Tous les colis sont livrés!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="quick-actions">
                                        <div className="section-header">
                                            <h3>Actions rapides</h3>
                                        </div>
                                        <div className="actions-grid">
                                            <div className="action-card" onClick={() => setActiveTab("mes-colis")}>
                                                <div className="action-icon blue-gradient">
                                                    <FaBoxOpen />
                                                </div>
                                                <span>Voir mes colis</span>
                                            </div>
                                            <div className="action-card" onClick={() => setActiveTab("ma-tournee")}>
                                                <div className="action-icon cyan-gradient">
                                                    <FaRoute />
                                                </div>
                                                <span>Optimiser tournée</span>
                                            </div>
                                            <div className="action-card" onClick={() => setActiveTab("historique")}>
                                                <div className="action-icon green-gradient">
                                                    <FaHistory />
                                                </div>
                                                <span>Historique</span>
                                            </div>
                                            <div className="action-card" onClick={() => setActiveTab("incidents")}>
                                                <div className="action-icon orange-gradient">
                                                    <FaExclamationTriangle />
                                                </div>
                                                <span>Signaler</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === "mes-colis" && <LivreurOrders parcels={myParcels} onRefresh={fetchData} />}
                            {activeTab === "historique" && <LivreurHistory parcels={myParcels.filter((p: any) => p.status === 'DELIVERED')} />}
                            {activeTab === "incidents" && <LivreurReports />}
                            {activeTab === "ma-tournee" && <LivreurRouteMap parcels={myParcels} onRefresh={fetchData} />}
                        </div>
                    )}
                </section>
            </main>

            <style>{`
                .dashboard-content {
                    animation: fadeIn 0.5s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* Welcome Banner */
                .welcome-banner {
                    background: linear-gradient(135deg, #966D68 0%, #686BA3 100%);
                    color: white;
                    padding: 25px 30px;
                    border-radius: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .welcome-text h1 {
                    margin: 0 0 8px 0;
                    font-size: 26px;
                }
                .welcome-text p {
                    margin: 0 0 15px 0;
                    opacity: 0.9;
                }
                .welcome-stats {
                    display: flex;
                    gap: 20px;
                }
                .welcome-stat {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    background: rgba(255,255,255,0.15);
                    padding: 5px 12px;
                    border-radius: 20px;
                }
                .welcome-image img {
                    width: 400px;
                    height: auto;
                }
                
                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 25px;
                }
                .stat-card {
                    background: white;
                    padding: 18px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    position: relative;
                }
                .stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                }
                .stat-icon {
                    width: 30px;
                    height: 30px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                }
                .stat-icon.blue { background: #e3f2fd; color: #1976d2; }
                .stat-icon.orange { background: #fff3e0; color: #f57c00; }
                .stat-icon.cyan { background: #e0f7fa; color: #00acc1; }
                .stat-icon.green { background: #e8f5e9; color: #43a047; }
                .stat-info {
                    flex: 1;
                }
                .stat-value {
                    display: block;
                    font-size: 28px;
                    font-weight: bold;
                    color: #1a2a3a;
                }
                .stat-label {
                    font-size: 12px;
                    color: #718096;
                }
                .stat-trend {
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 20px;
                    font-weight: 600;
                }
                .stat-trend.up { background: #e8f5e9; color: #2ecc71; }
                .stat-trend.down { background: #ffebee; color: #e74c3c; }
                
                /* Two Columns */
                .two-columns {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 25px;
                    margin-bottom: 25px;
                }
                .map-card, .chart-card {
                    background: white;
                    border-radius: 20px;
                    padding: 18px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .card-header h3 {
                    font-size: 16px;
                    color: #1a2a3a;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-view-map {
                    background: none;
                    border: none;
                    color: #3b4e61;
                    cursor: pointer;
                    font-size: 12px;
                }
                .mini-map {
                    border-radius: 16px;
                    overflow: hidden;
                    height: 280px;
                }
                .map-placeholder {
                    height: 280px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                    border-radius: 16px;
                    color: #999;
                }
                .placeholder-icon {
                    font-size: 40px;
                    margin-bottom: 10px;
                }
                .map-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 12px;
                    font-size: 11px;
                    color: #888;
                }
                .pie-chart-container {
                    height: 220px;
                }
                .chart-stats {
                    text-align: center;
                    margin-top: 15px;
                }
                .stat-dot {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .blue-dot { background: #1976d2; }
                
                /* Next Parcels */
                .next-parcels {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .section-header h3 {
                    font-size: 16px;
                    color: #1a2a3a;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .section-header button {
                    background: #f0f2f5;
                    border: none;
                    padding: 6px 14px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                }
                .parcels-list-horizontal {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 15px;
                }
                .parcel-card-horizontal {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 14px;
                    transition: all 0.3s;
                    animation: slideUp 0.4s ease forwards;
                    opacity: 0;
                    transform: translateY(10px);
                }
                @keyframes slideUp {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .parcel-card-horizontal:hover {
                    background: #eef2f5;
                    transform: translateX(5px);
                }
                .parcel-number {
                    width: 35px;
                    height: 35px;
                    background: #3b4e61;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }
                .parcel-info-horizontal {
                    flex: 1;
                }
                .parcel-tracking {
                    font-weight: 600;
                    font-size: 13px;
                    color: #1a2a3a;
                }
                .parcel-address {
                    font-size: 11px;
                    color: #888;
                }
                .parcel-weight {
                    font-size: 10px;
                    color: #aaa;
                    margin-top: 3px;
                }
                .btn-start-delivery {
                    background: #2ecc71;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: 0.2s;
                }
                .btn-start-delivery:hover {
                    background: #27ae60;
                    transform: scale(1.02);
                }
                
                /* Quick Actions */
                .quick-actions {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .actions-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                }
                .action-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .action-card:hover {
                    transform: translateY(-5px);
                    background: #eef2f5;
                }
                .action-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                }
                .action-icon.blue-gradient { background: linear-gradient(135deg, #1976d2, #42a5f5); }
                .action-icon.cyan-gradient { background: linear-gradient(135deg, #00acc1, #26c6da); }
                .action-icon.green-gradient { background: linear-gradient(135deg, #43a047, #66bb6a); }
                .action-icon.orange-gradient { background: linear-gradient(135deg, #f57c00, #ffa726); }
                .action-card span {
                    font-size: 12px;
                    font-weight: 500;
                    color: #555;
                }
                
                .empty-parcels {
                    text-align: center;
                    padding: 40px;
                    color: #999;
                }
                .empty-icon {
                    font-size: 40px;
                    margin-bottom: 10px;
                    color: #2ecc71;
                }
                
                @media (max-width: 1000px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .two-columns { grid-template-columns: 1fr; }
                    .actions-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 600px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .welcome-banner { flex-direction: column; text-align: center; gap: 15px; }
                    .welcome-stats { justify-content: center; }
                }
            `}</style>
        </div>
    );
};

export default LivreurDashboard;