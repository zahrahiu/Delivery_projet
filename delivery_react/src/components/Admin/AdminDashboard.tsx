import React, { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaTruck, FaUsers, FaBox, FaUser, FaUserTie } from "react-icons/fa";
import './AdminDashboard.css';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import DispatchersTab from "./DispatchersTab";
import LivreursTab from "./LivreursTab";
import ClientsTab from "./ClientsTab";
import VillesTab from "./VillesTab";
import ZonesTab from "./ZonesTab";

interface Parcel {
    id: number;
    trackingNumber: string;
    senderName: string;
    clientEmail?: string;
    assignedLivreurId?: string;
    deliveryAddress: string;
    weight: number;
    status: string;
    createdAt: string;
}

interface Livreur {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");

    // States للأعداد الحقيقية
    const [livreursCount, setLivreursCount] = useState(0);
    const [clientsCount, setClientsCount] = useState(0);
    const [dispatchersCount, setDispatchersCount] = useState(0);
    const [totalParcels, setTotalParcels] = useState(0);
    const [recentParcels, setRecentParcels] = useState<Parcel[]>([]);
    const [livreurs, setLivreurs] = useState<Livreur[]>([]);
    const [statusStats, setStatusStats] = useState([
        { name: 'En attente', value: 0, color: '#FF8042' },
        { name: 'En cours', value: 0, color: '#FFBB28' },
        { name: 'Livré', value: 0, color: '#00C49F' },
    ]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // الروابط عبر الـ Gateway
    const USERS_API = "http://localhost:8888/users-service/api/profiles";
    const PARCELS_API = "http://localhost:8888/parcel-service/api/parcels";

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    // 🔥 دالة باش تجيب اسم livreur من الـ ID (نفس اللي فـ ColisManagement)
    const getLivreurName = (assignedLivreurId: string | undefined): React.ReactNode => {
        if (!assignedLivreurId) {
            return <span className="no-livreur" style={{ color: '#999' }}>Non assigné</span>;
        }

        const targetId = String(assignedLivreurId);
        const driver = livreurs.find(l => String(l.userId) === targetId);

        if (driver) {
            return (
                <span className="livreur-name-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaTruck size={12} color="#4caf50" />
                    {driver.firstName} {driver.lastName}
                </span>
            );
        }

        return <span className="id-fallback" style={{ color: 'orange', fontSize: '12px' }}>ID: {targetId}</span>;
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 1. جلب بيانات المستخدمين (الموصلين)
            const resUsers = await axios.get(USERS_API, config);
            const allUsers = resUsers.data;

            const livreursList = allUsers.filter((u: any) => u.role === "LIVREUR");
            const clientsList = allUsers.filter((u: any) => u.role === "CLIENT");

            setLivreursCount(livreursList.length);
            setClientsCount(clientsList.length);
            setDispatchersCount(allUsers.filter((u: any) => u.role === "DISPATCHER").length);
            setLivreurs(livreursList);

            // 2. جلب الطرود من Parcel Service
            const resParcels = await axios.get(PARCELS_API, config);
            const parcels = resParcels.data;
            setTotalParcels(parcels.length);

            // 3. حساب إحصائيات الحالات
            const pending = parcels.filter((p: any) => p.status === 'PENDING').length;
            const inTransit = parcels.filter((p: any) => p.status === 'ASSIGNED' || p.status === 'IN_TRANSIT').length;
            const delivered = parcels.filter((p: any) => p.status === 'DELIVERED').length;

            setStatusStats([
                { name: 'En attente', value: pending, color: '#FF8042' },
                { name: 'En cours', value: inTransit, color: '#FFBB28' },
                { name: 'Livré', value: delivered, color: '#00C49F' },
            ]);

            // 4. جلب آخر 5 طرود
            const sortedParcels = [...parcels].sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setRecentParcels(sortedParcels.slice(0, 5));

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'DELIVERED':
                return { class: 'badge green', text: 'Livré' };
            case 'ASSIGNED':
            case 'IN_TRANSIT':
                return { class: 'badge yellow', text: 'En cours' };
            case 'PENDING':
                return { class: 'badge orange', text: 'En attente' };
            default:
                return { class: 'badge gray', text: status || 'Inconnu' };
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
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
                        <div className="loader">Chargement des données...</div>
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

                <section className="content-body">
                    {activeTab === "dashboard" && (
                        <div className="dashboard-wrapper">
                            <div className="stats-grid-top">
                                <div className="stat-item purple-light">
                                    <div className="icon-circle"><FaBox /></div>
                                    <div className="texts">
                                        <span>Total Colis</span>
                                        <h2>{totalParcels}</h2>
                                    </div>
                                </div>
                                <div className="stat-item blue-light">
                                    <div className="icon-circle"><FaTruck /></div>
                                    <div className="texts">
                                        <span>Livreurs Actifs</span>
                                        <h2>{livreursCount}</h2>
                                    </div>
                                </div>
                                <div className="stat-item green-light">
                                    <div className="icon-circle"><FaUsers /></div>
                                    <div className="texts">
                                        <span>Clients</span>
                                        <h2>{clientsCount}</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="charts-main-section">
                                <div className="chart-card area-card">
                                    <h3>Statistiques des Livraisons 📈</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={deliveryData}>
                                            <defs>
                                                <linearGradient id="colorDel" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="delivered" stroke="#8884d8" fillOpacity={1} fill="url(#colorDel)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="chart-card pie-card">
                                    <h3>État des Colis 📦</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie data={statusStats.filter(s => s.value > 0)} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {statusStats.filter(s => s.value > 0).map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pie-labels">
                                        {statusStats.filter(s => s.value > 0).map(s => <div key={s.name}><span style={{background: s.color}}></span> {s.name} ({s.value})</div>)}
                                    </div>
                                </div>
                            </div>

                            <div className="recent-activity-section">
                                <div className="header-flex-table">
                                    <h3>📦 Dernières Expéditions</h3>
                                    <button className="btn-view-all" onClick={() => window.location.href = '/admin/colis'}>Voir tout</button>                                </div>
                                <div className="table-container">
                                    {recentParcels.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                            Aucune expédition pour le moment
                                        </div>
                                    ) : (
                                        <table className="activity-table">
                                            <thead>
                                            <tr>
                                                <th>Tracking</th>
                                                <th><FaUser style={{ marginRight: '5px' }} />Client</th>
                                                <th><FaUserTie style={{ marginRight: '5px' }} />Livreur</th>
                                                <th>Destination</th>
                                                <th>Poids</th>
                                                <th>Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {recentParcels.map((parcel) => {
                                                const status = getStatusBadge(parcel.status);
                                                return (
                                                    <tr key={parcel.id}>
                                                        <td>
                                                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                                    {parcel.trackingNumber || `#${parcel.id}`}
                                                                </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 500 }}>
                                                                {parcel.senderName || 'N/A'}
                                                            </div>
                                                            <small style={{ color: '#888' }}>{parcel.clientEmail || ''}</small>
                                                        </td>
                                                        <td>
                                                            {getLivreurName(parcel.assignedLivreurId)}
                                                        </td>
                                                        <td>{parcel.deliveryAddress || 'N/A'}</td>
                                                        <td>{parcel.weight ? `${parcel.weight} kg` : 'N/A'}</td>
                                                        <td><span className={status.class}>{status.text}</span></td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
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

// بيانات مؤقتة للـ AreaChart (يمكن استبدالها ببيانات حقيقية لاحقاً)
const deliveryData = [
    { month: 'Jan', delivered: 10, returned: 0 },
    { month: 'Fév', delivered: 0, returned: 4},
    { month: 'Mar', delivered: 9, returned: 0 },
    { month: 'Avr', delivered: 4, returned: 2 },
    { month: 'Mai', delivered: 8, returned: 2 },
];

export default AdminDashboard;