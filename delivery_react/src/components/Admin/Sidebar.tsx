import React from 'react';
import { FaHeadset } from "react-icons/fa";
import heroImage from "../../assets/QribLik_LOGO.png";

const Sidebar = ({ activeTab, setActiveTab }: any) => (
    <aside className="sidebar">
        <div className="sidebar-header">
            <img src={heroImage} alt="Logo" className="logo" />
        </div>

        {/* رجعت الـ Button هنا */}
        <button className="upload-btn">+ New Delivery</button>

        <nav className="nav-menu">
            <div
                className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
            >
                <span>📊</span> Dashboard
            </div>

            <div
                className={`nav-item ${activeTab === "dispatchers" ? "active" : ""}`}
                onClick={() => setActiveTab("dispatchers")}
            >
                <span><FaHeadset /></span> Dispatchers
            </div>

            <div className="nav-item">
                <span>🚚</span> Livreurs
            </div>

            <div className="nav-item">
                <span>👥</span> Clients
            </div>
        </nav>
    </aside>
);

export default Sidebar;