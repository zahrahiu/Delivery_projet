import React, { useEffect, useState, useRef } from "react";
import {
    FaUserCircle, FaSignOutAlt, FaCog, FaUserAlt,
    FaBell, FaEnvelope, FaSun, FaMoon, FaCheckCircle, FaInfoCircle
} from "react-icons/fa";
import logoSmall from "../../assets/img.png";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import './TopHeader.css'; // ✅ استوردي ملف CSS جديد

interface Notification {
    _id: string;
    recipient?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    subject: string;
    content: string;
    status: string;
    source: string;
    type?: string;
    sentBy: string;
    createdAt: string;
}

const TopHeader = ({ isMenuOpen, setIsMenuOpen, darkMode, toggleTheme, user: propUser }: any) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const [readIds, setReadIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem("readNotificationIds");
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        localStorage.setItem("readNotificationIds", JSON.stringify(Array.from(readIds)));
    }, [readIds]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.get<Notification[]>(
                "http://localhost:8888/notification-service/api/notifications/admin-alerts",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const unique = res.data.reduce((acc: Notification[], curr: Notification) => {
                if (curr.status === 'SENT') return acc;
                if (curr.content && !curr.content.includes("souhaite s'inscrire")) return acc;
                if (acc.some(n => n.recipient === curr.recipient)) return acc;
                acc.push(curr);
                return acc;
            }, []);

            setNotifications(unique);
        } catch (err) {
            console.error("Erreur notifications:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotificationPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = (id: string) => setReadIds(prev => new Set(prev).add(id));
    const markAllAsRead = () => setReadIds(new Set(notifications.map(n => n._id)));

    const displayNotifications = notifications.filter(n =>
        n.type === 'NEW_SIGNUP_REQUEST' || n.type === 'PARCEL_UPDATE' || n.status === 'PENDING'
    );

    const unreadCount = displayNotifications.filter(n => !readIds.has(n._id)).length;

    const getSenderName = (notif: Notification) => {
        if (notif.firstName && notif.lastName) return `${notif.firstName} ${notif.lastName}`;
        if (notif.content.includes("souhaite s'inscrire")) {
            return notif.content.split("souhaite")[0].trim();
        }
        return notif.recipient?.split('@')[0] || "Système";
    };

    return (
        <header className={`top-header ${darkMode ? 'dark-header' : ''}`}>
            <div onClick={() => navigate('/admin')} className="logo-container">
                <img src={logoSmall} alt="Logo" className="logo-img" />
            </div>

            <div className="header-actions">
                {/* Bell Icon & Panel */}
                <div className="notification-wrapper" ref={notificationRef}>
                    <div
                        onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                        className={`notification-bell ${unreadCount > 0 ? 'has-notification' : ''} ${darkMode ? 'dark-bell' : ''}`}
                    >
                        <FaBell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-count">{unreadCount}</span>
                        )}
                    </div>

                    {showNotificationPanel && (
                        <div className={`notification-panel ${darkMode ? 'dark-panel' : ''}`}>
                            <div className="notification-header">
                                <strong>Notifications</strong>
                                {unreadCount > 0 && (
                                    <small onClick={markAllAsRead} className="mark-all-read">
                                        Tout lire
                                    </small>
                                )}
                            </div>
                            <div className="notification-list">
                                {displayNotifications.length === 0 ? (
                                    <div className="no-notifications">Aucune notification</div>
                                ) : (
                                    displayNotifications.map(n => (
                                        <div
                                            key={n._id}
                                            onClick={() => { markAsRead(n._id); navigate('/admin/pending-users'); setShowNotificationPanel(false); }}
                                            className={`notification-item ${readIds.has(n._id) ? 'read' : 'unread'}`}
                                        >
                                            <div className={`notification-icon ${n.type === 'NEW_SIGNUP_REQUEST' ? 'icon-signup' : 'icon-update'}`}>
                                                {n.type === 'NEW_SIGNUP_REQUEST' ? <FaUserAlt size={12} /> : <FaInfoCircle size={12} />}
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-sender">{getSenderName(n)}</div>
                                                <div className="notification-subject">
                                                    {n.type === 'NEW_SIGNUP_REQUEST' ? 'Demande d\'inscription' : n.subject}
                                                </div>
                                                <div className="notification-date">{new Date(n.createdAt).toLocaleString('fr-FR')}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dark Mode Toggle */}
                <div onClick={toggleTheme} className="theme-toggle-btn">
                    {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                </div>

                {/* Profile Section */}
                <div className="profile-section" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <div className="profile-info">
                        <div className="profile-name">Admin</div>
                        <div className="profile-role">Administrateur</div>
                    </div>
                    <FaUserCircle size={35} className="profile-icon" />
                </div>

                {/* Dropdown Profile */}
                {isMenuOpen && (
                    <div className="profile-dropdown-menu">
                        <div onClick={() => navigate('/profile')} className="dropdown-item">
                            <FaUserAlt size={14} /> Profil
                        </div>
                        <div onClick={() => navigate('/settings')} className="dropdown-item">
                            <FaCog size={14} /> Paramètres
                        </div>
                        <div className="dropdown-divider"></div>
                        <div onClick={handleLogout} className="dropdown-item logout-item">
                            <FaSignOutAlt size={14} /> Déconnexion
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default TopHeader;