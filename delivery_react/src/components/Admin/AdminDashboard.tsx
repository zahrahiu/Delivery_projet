import React, { useState } from "react";
import './AdminDashboard.css';
import {
    FaTruck, FaUsers, FaBoxOpen, FaChartLine, FaPlus,
    FaSignOutAlt, FaCog, FaPalette, FaUserCircle,
    FaHeadset
} from "react-icons/fa";
import heroImage from "../../assets/QribLik_LOGO.png";

const AdminDashboard: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src={heroImage} alt="Logo" className="logo" />
                </div>
                <button className="upload-btn">+ New Delivery</button>
                <nav className="nav-menu">
                    <div className="nav-item active"><span>📊</span> Dashboard</div>
                    <div className="nav-item"><span>📦</span> All Orders</div>
                    <div className="nav-item"><span>🚚</span> Livreurs</div>
                    {/* إضافة Dispatchers هنا */}
                    <div className="nav-item"><span><FaHeadset /></span> Dispatchers</div>
                    <div className="nav-item"><span>👥</span> Clients</div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="search-bar">
                        <input type="text" placeholder="Search orders, dispatchers..." />
                    </div>

                    <div className="user-profile-container">
                        <div className="user-icon-trigger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <FaUserCircle className="main-user-icon" />
                        </div>

                        {isMenuOpen && (
                            <div className="profile-dropdown">
                                <div className="dropdown-header">
                                    <p>Welcome Admin!</p>
                                    <small>Admin Control Panel</small>
                                </div>
                                <hr />
                                <div className="dropdown-item"><FaCog /> Parameters</div>
                                <div className="dropdown-item"><FaPalette /> Theme</div>
                                <hr />
                                <div className="dropdown-item logout"><FaSignOutAlt /> Logout</div>
                            </div>
                        )}
                    </div>
                </header>

                <section className="content-body">
                    <h2 className="section-title">Quick Access</h2>
                    <div className="stats-grid">
                        <div className="stat-card blue">
                            <div className="icon">📦</div>
                            <p>Total Orders</p>
                            <h3>124</h3>
                        </div>
                        <div className="stat-card">
                            <div className="icon">🚚</div>
                            <p>On the Way</p>
                            <h3>45</h3>
                        </div>
                        {/* إضافة بطاقة Dispatchers هنا */}
                        <div className="stat-card">
                            <div className="icon"><FaHeadset color="#3b4e61"/></div>
                            <p>Active Dispatchers</p>
                            <h3>8</h3>
                        </div>
                        <div className="stat-card">
                            <div className="icon">✅</div>
                            <p>Delivered</p>
                            <h3>68</h3>
                        </div>
                    </div>

                    <div className="table-container">
                        <h3 className="section-title">Recent Shipments</h3>
                        <table className="custom-table">
                            <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Client</th>
                                <th>Livreur</th>
                                <th>Dispatcher</th> {/* عمود جديد */}
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>#ORD-7721</td>
                                <td>Ahmed Tazi</td>
                                <td>Yassine Mo</td>
                                <td>Reda.A</td> {/* اسم الموزع */}
                                <td><span className="status pending">In Delivery</span></td>
                                <td><button className="btn-view">View</button></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;