import React, { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaTruck, FaBoxOpen, FaClock, FaCheckCircle } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import ColisManagement from "./ ColisManagement";
import LivreurList from "./LivreurList";
import AddColisForm from "./AddColisForm";
import DeliveryMap from "./DeliveryMap";

const DispatcherDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [parcels, setParcels] = useState<any[]>([]);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        assigned: 0,
        delivered: 0
    });

    // --- التعديل: استخدام الـ Gateway لجميع الخدمات ---
    const GATEWAY_URL = "http://localhost:8888";
    const API_PARCELS = `${GATEWAY_URL}/parcel-service/api/parcels`;
    const API_USER_DETAILS = `${GATEWAY_URL}/users-service/api/profiles/details`;

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const payload = JSON.parse(atob(token.split('.')[1]));
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 1. جلب معلومات البروفايل عبر الـ Gateway
            const userRes = await axios.get(`${API_USER_DETAILS}/${payload.userId}`, config);
            setUserData(userRes.data);

            // 2. جلب الطرود عبر الـ Gateway
            const parcelsRes = await axios.get(API_PARCELS, config);
            const allParcels = parcelsRes.data;

            setParcels(allParcels);

            // تحديث الإحصائيات بناءً على البيانات القادمة من الـ Microservice
            setStats({
                total: allParcels.length,
                pending: allParcels.filter((p: any) => p.status === "PENDING").length,
                assigned: allParcels.filter((p: any) => ["ASSIGNED", "IN_TRANSIT"].includes(p.status)).length,
                delivered: allParcels.filter((p: any) => p.status === "DELIVERED").length
            });

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const statusPieData = [
        { name: 'En attente', value: stats.pending, color: '#FFBB28' },
        { name: 'En cours', value: stats.assigned, color: '#0088FE' },
        { name: 'Livré', value: stats.delivered, color: '#00C49F' },
    ];

    const dailyActivity = [
        { time: '08:00', colis: Math.floor(stats.total * 0.2) },
        { time: '12:00', colis: Math.floor(stats.total * 0.6) },
        { time: '18:00', colis: stats.delivered },
    ];

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />

            <main className="main-content">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={userData}
                />

                <section className="content-body">
                    {activeTab === "dashboard" && (
                        <div className="dashboard-wrapper">
                            <div className="welcome-section">
                                <h3>Bonjour, {userData?.firstName || "Dispatcher"} 👋</h3>
                                <p className="text-muted">Voici un aperçu de l'activité de livraison aujourd'hui.</p>
                            </div>

                            {/* Stats Cards */}
                            <div className="stats-grid-top">
                                <div className="stat-item orange-light">
                                    <div className="icon-circle"><FaClock /></div>
                                    <div className="texts">
                                        <span>À Assigner</span>
                                        <h2>{stats.pending}</h2>
                                    </div>
                                </div>
                                <div className="stat-item blue-light">
                                    <div className="icon-circle"><FaTruck /></div>
                                    <div className="texts">
                                        <span>En Transit</span>
                                        <h2>{stats.assigned}</h2>
                                    </div>
                                </div>
                                <div className="stat-item green-light">
                                    <div className="icon-circle"><FaCheckCircle /></div>
                                    <div className="texts">
                                        <span>Livraisons Réussies</span>
                                        <h2>{stats.delivered}</h2>
                                    </div>
                                </div>
                                <div className="stat-item purple-light">
                                    <div className="icon-circle"><FaBoxOpen /></div>
                                    <div className="texts">
                                        <span>Total Colis</span>
                                        <h2>{stats.total}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Charts & Map */}
                            <div className="charts-main-section">
                                <div className="chart-card area-card">
                                    <h3>Flux de colis (Aujourd'hui) 📈</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={dailyActivity}>
                                            <XAxis dataKey="time" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="colis" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="chart-card pie-card">
                                    <h3>Répartition des Status 📦</h3>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={statusPieData}
                                                innerRadius={50}
                                                outerRadius={70}
                                                dataKey="value"
                                                paddingAngle={5}
                                            >
                                                {statusPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pie-labels">
                                        {statusPieData.map(s => (
                                            <div key={s.name} className="label-item">
                                                <span style={{background: s.color, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', marginRight: '5px'}}></span>
                                                {s.name} ({s.value})
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* الخريطة تأخذ الآن الـ parcels من الـ State الحقيقي */}
                                <div className="full-width-map" style={{ gridColumn: "span 2", marginTop: '20px', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ padding: '15px', background: '#fff', margin: 0, fontSize: '1rem' }}>📍 Suivi en temps réel des colis</h3>
                                    <DeliveryMap parcels={parcels} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "colis" && (
                        <ColisManagement onAddClick={() => setActiveTab("add-colis")} />
                    )}

                    {activeTab === "livreurs" && <LivreurList />}

                    {activeTab === "add-colis" && (
                        <AddColisForm onCancel={() => setActiveTab("colis")} />
                    )}
                </section>
            </main>
        </div>
    );
};

export default DispatcherDashboard;