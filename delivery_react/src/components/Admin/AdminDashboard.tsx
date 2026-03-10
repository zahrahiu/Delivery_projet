import React, { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaTruck, FaUsers, FaBox, FaMoneyBillWave } from "react-icons/fa";
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
    const [dispatchersCount, setDispatchersCount] = useState(0);

    // --- هادو هما لي كانو ناقصينك باش يخدم الـ Popup والـ Theme ---
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const fetchCount = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8081/api/profiles", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDispatchersCount(res.data.length);
        } catch (error) { console.error("Error fetching count:", error); }
    };

    useEffect(() => {
        fetchCount();
    }, []);

    // دالة لتبديل الـ Theme
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    return (
        // زدت class "dark-mode" هنا باش يتحكم ف الألوان إلا بغيتي تطوريها
        <div className={`admin-container ${darkMode ? 'dark-theme' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="main-content">
                {/* دابا صيفطنا كاع الـ Props لي كيحتاجهم الـ Header */}
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

                            {/* Stats Cards */}
                            <div className="stats-grid-top">
                                <div className="stat-item purple-light">
                                    <div className="icon-circle"><FaBox /></div>
                                    <div className="texts"><span>Total Colis</span> <h2>2,840</h2></div>
                                </div>
                                <div className="stat-item blue-light">
                                    <div className="icon-circle"><FaTruck /></div>
                                    <div className="texts"><span>Livreurs Actifs</span> <h2>45</h2></div>
                                </div>
                                <div className="stat-item green-light">
                                    <div className="icon-circle"><FaUsers /></div>
                                    <div className="texts"><span>Clients</span> <h2>1,205</h2></div>
                                </div>
                                <div className="stat-item orange-light">
                                    <div className="icon-circle"><FaMoneyBillWave /></div>
                                    <div className="texts"><span>COD Collected</span> <h2>45,000 DH</h2></div>
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

                            <div className="recent-activity-section">
                                <h3>Dernières Expéditions 🚚</h3>
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
                                    <tr><td>#LM-9021</td><td>Ahmed Ali</td><td>Yassine</td><td>Casablanca</td><td><span className="badge green">Livré</span></td></tr>
                                    <tr><td>#LM-9022</td><td>Sara Noor</td><td>Karim</td><td>Rabat</td><td><span className="badge yellow">En cours</span></td></tr>
                                    <tr><td>#LM-9023</td><td>Mehdi H.</td><td>Omar</td><td>Tangier</td><td><span className="badge red">Retourné</span></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "dispatchers" && <DispatchersTab onDispatchersUpdate={fetchCount} />}
                    {activeTab === "livreurs" && (
                        <LivreursTab onLivreursUpdate={(count) => {
                            // دابا هاد الكود غيخدم حيت LiversTab كيعرف شنو هي onLivreursUpdate
                            console.log("Nombre de livreurs mis à jour :", count);
                        }} />
                    )}
                    {activeTab === "clients" && <ClientsTab onClientsUpdate={fetchCount} />}

                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;