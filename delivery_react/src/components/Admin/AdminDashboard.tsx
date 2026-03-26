import React, { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaTruck, FaUsers, FaBox } from "react-icons/fa";
import './AdminDashboard.css';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import DispatchersTab from "./DispatchersTab";
import LivreursTab from "./LivreursTab";
import ClientsTab from "./ClientsTab";

const deliveryData = [
    { month: 'Jan', delivered: 400, returned: 50 },
    { month: 'Feb', delivered: 700, returned: 80 },
    { month: 'Mar', delivered: 600, returned: 120 },
    { month: 'Apr', delivered: 900, returned: 90 },
    { month: 'May', delivered: 1100, returned: 100 },
];

const statusData = [
    { name: 'Livré', value: 65, color: '#00C49F' },
    { name: 'En cours', value: 25, color: '#FFBB28' },
    { name: 'Retourné', value: 10, color: '#FF8042' },
];

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");

    // States لتمثيل الأعداد الحقيقية
    const [livreursCount, setLivreursCount] = useState(0);
    const [clientsCount, setClientsCount] = useState(0);
    const [dispatchersCount, setDispatchersCount] = useState(0);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const API_URL = "http://localhost:8081/api/profiles";

    const fetchCounts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const allUsers = res.data;

            // حساب الأعداد بناءً على الـ Role
            const livreurs = allUsers.filter((u: any) => u.role === "LIVREUR").length;
            const clients = allUsers.filter((u: any) => u.role === "CLIENT").length;
            const dispatchers = allUsers.filter((u: any) => u.role === "DISPATCHER").length;

            setLivreursCount(livreurs);
            setClientsCount(clients);
            setDispatchersCount(dispatchers);

        } catch (error) {
            console.error("Error fetching counts:", error);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    return (
        <div className={`admin-container ${darkMode ? 'dark-theme' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="main-content">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                />

                <section className="content-body">
                    {activeTab === "dashboard" && (
                        <div className="dashboard-wrapper">
                            {/* Stats Cards (Dynamic Numbers) */}
                            <div className="stats-grid-top">
                                <div className="stat-item purple-light">
                                    <div className="icon-circle"><FaBox /></div>
                                    <div className="texts">
                                        <span>Total Colis</span>
                                        <h2>2,840</h2> {/* هادي غتحتاجي API ديال الـ Orders مستقبلا */}
                                    </div>
                                </div>
                                <div className="stat-item blue-light">
                                    <div className="icon-circle"><FaTruck /></div>
                                    <div className="texts">
                                        <span>Livreurs Actifs</span>
                                        <h2>{livreursCount}</h2> {/* عدد حقيقي */}
                                    </div>
                                </div>
                                <div className="stat-item green-light">
                                    <div className="icon-circle"><FaUsers /></div>
                                    <div className="texts">
                                        <span>Clients</span>
                                        <h2>{clientsCount}</h2> {/* عدد حقيقي */}
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
                                            <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pie-labels">
                                        {statusData.map(s => <div key={s.name}><span style={{background: s.color}}></span> {s.name}</div>)}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Section - كمالة الـ Dashboard */}
                            <div className="recent-activity-section">
                                <div className="header-flex-table">
                                    <h3>Dernières Expéditions 🚚</h3>
                                    <button className="btn-view-all" onClick={() => setActiveTab("colis")}>Voir tout</button>
                                </div>
                                <div className="table-container">
                                    <table className="activity-table">
                                        <thead>
                                        <tr>
                                            <th>ID Colis</th>
                                            <th>Client</th>
                                            <th>Livreur</th>
                                            <th>Ville</th>
                                            <th>Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {/* هادو تقدري ترجعيهم ديناميكيين من بعد من الـ API ديال Orders */}
                                        <tr>
                                            <td>#LM-9021</td>
                                            <td>Ahmed Ali</td>
                                            <td>Yassine</td>
                                            <td>Casablanca</td>
                                            <td><span className="badge green">Livré</span></td>
                                        </tr>
                                        <tr>
                                            <td>#LM-9022</td>
                                            <td>Sara Noor</td>
                                            <td>Karim</td>
                                            <td>Rabat</td>
                                            <td><span className="badge yellow">En cours</span></td>
                                        </tr>
                                        <tr>
                                            <td>#LM-9023</td>
                                            <td>Mehdi H.</td>
                                            <td>Omar</td>
                                            <td>Tangier</td>
                                            <td><span className="badge red">Retourné</span></td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* التبويب الخاص بالـ Dispatchers */}
                    {activeTab === "dispatchers" && (
                        <DispatchersTab onDispatchersUpdate={fetchCounts} />
                    )}

                    {/* التبويب الخاص بالـ Livreurs */}
                    {activeTab === "livreurs" && (
                        <LivreursTab onLivreursUpdate={fetchCounts} />
                    )}

                    {/* التبويب الخاص بالـ Clients */}
                    {activeTab === "clients" && (
                        <ClientsTab onClientsUpdate={fetchCounts} />
                    )}

                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;