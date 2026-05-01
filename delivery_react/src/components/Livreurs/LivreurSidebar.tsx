import React from "react";
import { FaTachometerAlt, FaBox, FaMapMarkerAlt, FaHistory, FaUser, FaFlag, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const LivreurSidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
    const navigate = useNavigate();

    const menuItems = [
        { id: "dashboard", label: "Tableau de bord", icon: <FaTachometerAlt /> },
        { id: "orders", label: "Mes colis", icon: <FaBox /> },
        { id: "tracking", label: "Suivi & GPS", icon: <FaMapMarkerAlt /> },
        { id: "history", label: "Historique", icon: <FaHistory /> },
        { id: "profile", label: "Mon profil", icon: <FaUser /> },
        { id: "reports", label: "Signalements", icon: <FaFlag /> }
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className={`sidebar ${!isOpen ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <div className="logo-area">
                    <img src="/assets/QribLik_LOGO.png" alt="Logo" className="sidebar-logo" />
                </div>
                <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? "◀" : "▶"}
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {isOpen && <span className="nav-label">{item.label}</span>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item logout" onClick={handleLogout}>
                    <span className="nav-icon"><FaSignOutAlt /></span>
                    {isOpen && <span className="nav-label">Déconnexion</span>}
                </button>
            </div>

            <style>{`
                .sidebar { width: 260px; background: #1a2a3a; color: white; display: flex; flex-direction: column; transition: width 0.3s; position: fixed; height: 100vh; z-index: 100; }
                .sidebar.collapsed { width: 70px; }
                .sidebar-header { padding: 20px 15px; border-bottom: 1px solid #2a3a4a; display: flex; justify-content: space-between; align-items: center; }
                .sidebar-logo { height: 40px; }
                .sidebar-toggle { background: none; border: none; color: white; cursor: pointer; font-size: 16px; }
                .sidebar-nav { flex: 1; padding: 20px 0; display: flex; flex-direction: column; gap: 8px; }
                .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: none; border: none; color: #a0b0c0; cursor: pointer; width: 100%; text-align: left; transition: 0.2s; font-size: 14px; }
                .nav-item:hover { background: #2a3a4a; color: white; }
                .nav-item.active { background: #3b4e61; color: white; }
                .nav-icon { font-size: 18px; min-width: 24px; }
                .sidebar-footer { padding: 20px 0; border-top: 1px solid #2a3a4a; }
                .logout { color: #e74c3c; }
                .logout:hover { background: #e74c3c; color: white; }
            `}</style>
        </div>
    );
};

export default LivreurSidebar;