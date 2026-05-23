import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { FaTruck, FaUsers, FaBox, FaClock, FaSpinner, FaCheckCircle } from "react-icons/fa";
import './AdminDashboard.css';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import DispatchersTab from "./DispatchersTab";
import LivreursTab from "./LivreursTab";
import ClientsTab from "./ClientsTab";
import VillesTab from "./VillesTab";
import ZonesTab from "./ZonesTab";
import { useTheme } from "../../context/ThemeContext";

interface Parcel {
    id: number;
    trackingNumber: string;
    senderName: string;
    clientEmail?: string;
    assignedLivreurId?: string;
    deliveryAddress: string;
    weight: number;
    status: string;
    cityName?: string;
    createdAt: string;
    latitude?: number;
    longitude?: number;
}

interface Livreur {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

const AdminDashboard: React.FC = () => {
    const { darkMode, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [livreursCount, setLivreursCount] = useState(0);
    const [clientsCount, setClientsCount] = useState(0);
    const [dispatchersCount, setDispatchersCount] = useState(0);
    const [totalParcels, setTotalParcels] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [inTransitCount, setInTransitCount] = useState(0);
    const [deliveredCount, setDeliveredCount] = useState(0);
    const [cancelledCount, setCancelledCount] = useState(0);
    const [returnedCount, setReturnedCount] = useState(0);
    const [recentParcels, setRecentParcels] = useState<Parcel[]>([]);
    const [livreurs, setLivreurs] = useState<Livreur[]>([]);

    const [statusStats, setStatusStats] = useState([
        { name: 'En attente', value: 0, color: '#FF8042' },
        { name: 'En cours', value: 0, color: '#FFBB28' },
        { name: 'Livré', value: 0, color: '#00C49F' },
    ]);
    const [topVilles, setTopVilles] = useState<any[]>([]);
    const [dailyStats, setDailyStats] = useState<any[]>([]);
    const [livreurPerformance, setLivreurPerformance] = useState<any[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const USERS_API = "http://localhost:8888/users-service/api/profiles";
    const PARCELS_API = "http://localhost:8888/parcel-service/api/parcels";

    const getLivreurName = (assignedLivreurId: string | undefined): React.ReactNode => {
        if (!assignedLivreurId) return <span style={{ color: '#999' }}>Non assigné</span>;
        const driver = livreurs.find(l => String(l.userId) === String(assignedLivreurId));
        if (driver) {
            const fullName = driver.firstName === driver.lastName ? driver.firstName : `${driver.firstName} ${driver.lastName}`;
            return <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaTruck size={12} color="#4caf50" />{fullName}</span>;
        }
        return <span style={{ color: 'orange', fontSize: '12px' }}>ID: {assignedLivreurId}</span>;
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const resUsers = await axios.get(USERS_API, config);
            const allUsers = resUsers.data;
            const livreursList = allUsers.filter((u: any) => u.role === "LIVREUR");
            setLivreursCount(livreursList.length);
            setClientsCount(allUsers.filter((u: any) => u.role === "CLIENT").length);
            setDispatchersCount(allUsers.filter((u: any) => u.role === "DISPATCHER").length);
            setLivreurs(livreursList);

            const resParcels = await axios.get(PARCELS_API, config);
            const parcels = resParcels.data;
            setTotalParcels(parcels.length);

            const pending = parcels.filter((p: any) => p.status === 'PENDING').length;
            const inTransit = parcels.filter((p: any) => p.status === 'ASSIGNED' || p.status === 'IN_TRANSIT').length;
            const delivered = parcels.filter((p: any) => p.status === 'DELIVERED').length;
            const cancelled = parcels.filter((p: any) => p.status === 'CANCELLED').length;
            const returned = parcels.filter((p: any) => p.status === 'RETURNED').length;

            setPendingCount(pending);
            setInTransitCount(inTransit);
            setDeliveredCount(delivered);
            setCancelledCount(cancelled);
            setReturnedCount(returned);

            setStatusStats([
                { name: 'En attente', value: pending, color: '#FF8042' },
                { name: 'En cours', value: inTransit, color: '#FFBB28' },
                { name: 'Livré', value: delivered, color: '#00C49F' },
            ]);

            const livreurStats: any = {};
            livreursList.forEach((l: any) => {
                const name = l.firstName === l.lastName ? l.firstName : `${l.firstName} ${l.lastName}`;
                livreurStats[l.userId] = { name: name, total: 0, delivered: 0 };
            });
            parcels.forEach((p: any) => {
                if (p.assignedLivreurId && livreurStats[String(p.assignedLivreurId)]) {
                    livreurStats[String(p.assignedLivreurId)].total++;
                    if (p.status === 'DELIVERED') livreurStats[String(p.assignedLivreurId)].delivered++;
                }
            });
            const perfData = Object.entries(livreurStats)
                .filter(([, d]: any) => d.total > 0)
                .map(([id, d]: any) => ({
                    id, name: d.name.length > 12 ? d.name.substring(0, 10) + '...' : d.name,
                    total: d.total, delivered: d.delivered,
                    successRate: Math.round((d.delivered / d.total) * 100)
                }))
                .sort((a, b) => b.successRate - a.successRate)
                .slice(0, 5);
            setLivreurPerformance(perfData);

            const sortedParcels = [...parcels].sort((a: any, b: any) =>
                new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
            );
            setRecentParcels(sortedParcels.slice(0, 5));

            const cityCount: any = {};
            parcels.forEach((p: any) => {
                const city = p.cityName || 'Inconnue';
                cityCount[city] = (cityCount[city] || 0) + 1;
            });
            const top5 = Object.entries(cityCount)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 5)
                .map(([name, value]) => ({ name, value }));
            setTopVilles(top5);

            const days: any = {};
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                days[d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })] = 0;
            }
            parcels.forEach((p: any) => {
                const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                if (days[date] !== undefined) days[date]++;
                else days[today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })]++;
            });
            setDailyStats(Object.entries(days).map(([date, colis]) => ({ date, colis })));

        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DELIVERED': return { className: 'badge green', text: 'Livré' };
            case 'ASSIGNED': case 'IN_TRANSIT': return { className: 'badge yellow', text: 'En cours' };
            case 'PENDING': return { className: 'badge orange', text: 'En attente' };
            default: return { className: 'badge gray', text: status };
        }
    };

    const RADIAN = Math.PI / 180;
    const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
    };

    if (loading) {
        return (
            <div className={`admin-container ${darkMode ? 'dark-theme' : ''}`}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
                <main className="main-content">
                    <TopHeader
                        activeTab={activeTab}
                        isMenuOpen={isMenuOpen}
                        setIsMenuOpen={setIsMenuOpen}
                        darkMode={darkMode}
                        toggleTheme={toggleTheme}
                        user={{ firstName: 'Admin', lastName: '' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                        <div className="loader">Chargement...</div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={`admin-container ${darkMode ? 'dark-theme' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
            <main className="main-content">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                    user={{ firstName: 'Admin', lastName: '' }}
                />
                <section className="dashboard-content">
                    {activeTab === "dashboard" && (
                        <>
                            {/* 6 Stats Cards */}
                            <div className="stats-row">
                                {/* 1. Total Colis */}
                                <div className="stat-card stat-purple">
                                    <div className="stat-icon-wrapper"><FaBox /></div>
                                    <div className="stat-info">
                                        <span>Total Colis</span>
                                        <h2>{totalParcels}</h2>
                                    </div>
                                </div>

                                {/* 2. Livreurs */}
                                <div className="stat-card stat-blue">
                                    <div className="stat-icon-wrapper"><FaTruck /></div>
                                    <div className="stat-info">
                                        <span>Livreurs</span>
                                        <h2>{livreursCount}</h2>
                                    </div>
                                </div>

                                {/* 3. Clients */}
                                <div className="stat-card stat-green">
                                    <div className="stat-icon-wrapper"><FaUsers /></div>
                                    <div className="stat-info">
                                        <span>Clients</span>
                                        <h2>{clientsCount}</h2>
                                    </div>
                                </div>

                                {/* 4. En attente */}
                                <div className="stat-card stat-orange">
                                    <div className="stat-icon-wrapper"><FaClock /></div>
                                    <div className="stat-info">
                                        <span>En attente</span>
                                        <h2>{pendingCount}</h2>
                                    </div>
                                </div>

                                {/* 5. En cours */}
                                <div className="stat-card stat-yellow">
                                    <div className="stat-icon-wrapper"><FaSpinner /></div>
                                    <div className="stat-info">
                                        <span>En cours</span>
                                        <h2>{inTransitCount}</h2>
                                    </div>
                                </div>

                                {/* 6. Livrés */}
                                <div className="stat-card stat-teal">
                                    <div className="stat-icon-wrapper"><FaCheckCircle /></div>
                                    <div className="stat-info">
                                        <span>Livrés</span>
                                        <h2>{deliveredCount}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="charts-grid">
                                {/* État des Colis */}
                                <div className="chart-box chart-box-small">
                                    <h4>📦 État des Colis</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statusStats} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={renderPieLabel}>
                                                {statusStats.map((e, i) => <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={1} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pie-legend">
                                        {statusStats.map(s => <div key={s.name}><span style={{ background: s.color }}></span>{s.name} ({s.value})</div>)}
                                    </div>
                                </div>

                                {/* Colis (7 jours) */}
                                <div className="chart-box chart-box-medium">
                                    <h4>📅 Colis (7 jours)</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" fontSize={11} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="colis" stroke="#82ca9d" strokeWidth={3} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Top 5 Villes */}
                                <div className="chart-box villes-large-box">
                                    <h4>🏙️ Top 5 Villes</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topVilles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" fontSize={11} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Taux de Réussite */}
                                <div className="chart-box chart-box-small success-box">
                                    <h4>✅ Taux de Réussite</h4>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                        <div className="success-circle" style={{ margin: '0px auto 15px' }}>
                                            <span>{totalParcels > 0 ? Math.round((deliveredCount / totalParcels) * 100) : 0}%</span>
                                            <small>{deliveredCount}/{totalParcels} Livrés</small>
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <span style={{ fontSize: '12px', color: '#888', display: 'block' }}>Annulés</span>
                                                <strong style={{ fontSize: '16px', color: '#c62828' }}>{cancelledCount}</strong>
                                            </div>
                                            <div style={{ width: '1px', background: '#eee', height: '30px' }}></div>
                                            <div style={{ textAlign: 'center' }}>
                                                <span style={{ fontSize: '12px', color: '#888', display: 'block' }}>Retournés</span>
                                                <strong style={{ fontSize: '16px', color: '#6a1b9a' }}>{returnedCount}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Livreurs */}
                                <div className="chart-box chart-box-medium">
                                    <h4>🏆 Performance Livreurs</h4>
                                    {livreurPerformance.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={livreurPerformance} layout="vertical" margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" domain={[0, 100]} unit="%" />
                                                <YAxis dataKey="name" type="category" width={75} tick={{ fontSize: 11 }} />
                                                <Tooltip formatter={(v: any) => [`${v}%`, 'Réussite']} />
                                                <Bar dataKey="successRate" radius={[0, 4, 4, 0]} barSize={20}>
                                                    {livreurPerformance.map((e, i) => <Cell key={i} fill={e.successRate >= 80 ? '#00C49F' : e.successRate >= 50 ? '#FFBB28' : '#FF8042'} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Aucune donnée</div>}
                                </div>
                            </div>

                            {/* Recent Parcels */}
                            <div className="table-section">
                                <div className="table-header">
                                    <h3>📦 Dernières Expéditions</h3>
                                    <button onClick={() => window.location.href = '/admin/colis'}>Voir tout</button>
                                </div>
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>Tracking</th>
                                        <th>Client</th>
                                        <th>Livreur</th>
                                        <th>Destination</th>
                                        <th>Poids</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {recentParcels.length === 0 ?
                                        <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>Aucune expédition</td></tr> :
                                        recentParcels.map(p => {
                                            const s = getStatusBadge(p.status);
                                            return (
                                                <tr key={p.id}>
                                                    <td><strong>{p.trackingNumber}</strong></td>
                                                    <td>{p.senderName}</td>
                                                    <td>{getLivreurName(p.assignedLivreurId)}</td>
                                                    <td>{p.deliveryAddress?.substring(0, 30)}...</td>
                                                    <td>{p.weight} kg</td>
                                                    <td><span className={s.className}>{s.text}</span></td>
                                                </tr>
                                            );
                                        })
                                    }
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    {activeTab === "dispatchers" && <DispatchersTab onDispatchersUpdate={fetchDashboardData} />}
                    {activeTab === "livreurs" && <LivreursTab onLivreursUpdate={fetchDashboardData} />}
                    {activeTab === "clients" && <ClientsTab onClientsUpdate={fetchDashboardData} />}
                    {activeTab === "villes" && <VillesTab />}
                    {activeTab === "zones" && <ZonesTab />}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;