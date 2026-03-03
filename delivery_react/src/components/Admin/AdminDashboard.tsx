import React, { useState, useEffect } from "react";
import axios from "axios";
import './AdminDashboard.css';
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import DispatchersTab from "./DispatchersTab";
import { FaHeadset, FaBoxOpen, FaTruckLoading, FaChartLine } from "react-icons/fa";

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [dispatchersCount, setDispatchersCount] = useState(0);

    const fetchCount = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8081/api/profiles", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDispatchersCount(response.data.length);
        } catch (error) {
            console.error("Error fetching count:", error);
        }
    };

    useEffect(() => {
        fetchCount();
    }, []);

    return (
        <div className="admin-container">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="main-content">
                <TopHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} activeTab={activeTab} />

                <section className="content-body">
                    {activeTab === "dashboard" && (
                        <div className="dashboard-welcome">
                            <h1 className="welcome-text">Bonjour, Admin! ✨</h1>
                            <p className="subtitle-text">Voici ce qui se passe aujourd'hui :</p>

                            <div className="stats-grid">
                                {/* Card 1: Dispatchers */}
                                <div className="stat-card glass pink" onClick={() => setActiveTab("dispatchers")}>
                                    <div className="stat-icon"><FaHeadset /></div>
                                    <div className="stat-info">
                                        <h3>Dispatchers</h3>
                                        <p className="stat-number">{dispatchersCount}</p>
                                    </div>
                                </div>

                                {/* Card 2: Orders */}
                                <div className="stat-card glass blue">
                                    <div className="stat-icon"><FaBoxOpen /></div>
                                    <div className="stat-info">
                                        <h3>Orders</h3>
                                        <p className="stat-number">124</p>
                                    </div>
                                </div>

                                {/* Card 3: Deliveries */}
                                <div className="stat-card glass purple">
                                    <div className="stat-icon"><FaTruckLoading /></div>
                                    <div className="stat-info">
                                        <h3>Deliveries</h3>
                                        <p className="stat-number">85</p>
                                    </div>
                                </div>

                                {/* Card 4: Performance */}
                                <div className="stat-card glass green">
                                    <div className="stat-icon"><FaChartLine /></div>
                                    <div className="stat-info">
                                        <h3>Success Rate</h3>
                                        <p className="stat-number">98%</p>
                                    </div>
                                </div>
                            </div>

                            {/* يمكنك إضافة Chart هنا مستقبلاً */}
                            <div className="quick-actions">
                                <h3>Quick Actions 🚀</h3>
                                <div className="action-buttons">
                                    <button className="btn-cute" onClick={() => setActiveTab("dispatchers")}>Manage Staff</button>
                                    <button className="btn-cute-outline">View Reports</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "dispatchers" && (
                        <DispatchersTab onDispatchersUpdate={fetchCount} />
                    )}

                    {activeTab === "livreurs" && <div className="placeholder-view">🚚 Drivers Management Coming Soon...</div>}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;