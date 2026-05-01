import React, {useEffect, useState, useRef} from "react";
import {FaUserCircle, FaSignOutAlt, FaCog, FaUserAlt, FaBell, FaEnvelope, FaQuestionCircle, FaSun, FaMoon} from "react-icons/fa";
import logoSmall from "../../assets/img.png";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

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
    updatedAt?: string;
}

const TopHeader = ({ isMenuOpen, setIsMenuOpen, activeTab, user, darkMode, toggleTheme }: any) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Utilisation de localStorage pour stocker les IDs lus
    const [readIds, setReadIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem("readNotificationIds");
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Sauvegarde des readIds dans localStorage à chaque modification
    useEffect(() => {
        localStorage.setItem("readNotificationIds", JSON.stringify(Array.from(readIds)));
    }, [readIds]);

    // Détermination du dashboard selon le rôle
    const getDashboardPath = () => {
        const role = localStorage.getItem("role") || "ADMIN";
        switch(role) {
            case "ADMIN": return "/admin";
            case "DISPATCHER": return "/dispatcher";
            case "LIVREUR": return "/livreur";
            case "CLIENT": return "/client";
            default: return "/admin";
        }
    };

    const displayName = user && (user.firstName || user.lastName)
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
        : user?.email?.split('@')[0] || "Utilisateur";

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof setIsMenuOpen === 'function') {
            setIsMenuOpen(!isMenuOpen);
        }
    };

    const handleLogout = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get<Notification[]>("http://localhost:8888/notification-service/api/notifications/admin-alerts", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setNotifications(res.data);
            console.log("Notifications récupérées:", res.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
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

    const markAsRead = (notificationId: string) => {
        setReadIds(prev => new Set(prev).add(notificationId));
    };

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n._id);
        setReadIds(new Set(allIds));
    };

    // Comptage des notifications non lues
    const unreadNotifications = notifications.filter(n =>
        (n.type === 'NEW_SIGNUP_REQUEST' || n.type === 'PARCEL_UPDATE' || !n.type) && !readIds.has(n._id)
    );
    const pendingCount = unreadNotifications.length;

    // Notifications à afficher
    const displayNotifications = notifications.filter(n =>
        n.type === 'NEW_SIGNUP_REQUEST' || n.type === 'PARCEL_UPDATE' || !n.type
    );

    // Fonction pour obtenir le nom de l'expéditeur
    const getSenderName = (notif: Notification) => {
        if (notif.type === 'PARCEL_UPDATE') {
            return notif.firstName || notif.content.split(' ')[0] || 'Client';
        }
        return notif.firstName || notif.recipient?.split('@')[0] || 'Nouvel utilisateur';
    };

    // Fonction pour obtenir l'email ou le contenu
    const getDisplayContent = (notif: Notification) => {
        if (notif.type === 'PARCEL_UPDATE') {
            return notif.content;
        }
        return notif.recipient || notif.email || 'Email inconnu';
    };

    return (
        <header className="top-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 30px',
            background: darkMode ? '#1a1a2e' : 'white',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: `1px solid ${darkMode ? '#2d2d44' : '#eef2f6'}`,
            position: 'sticky',
            top: '15px',
            zIndex: 100,
            borderRadius: '50px',
            margin: '10px 20px',
        }}>
            {/* Logo */}
            <div className="brand-icon" onClick={() => navigate(getDashboardPath())} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <img src={logoSmall} alt="Logo" style={{ height: '40px' }} />
            </div>

            {/* Actions à droite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Icône de notification */}
                <div className="notification-bell-container" style={{ position: 'relative', cursor: 'pointer' }} ref={notificationRef}>
                    <div
                        style={{
                            padding: '10px',
                            borderRadius: '50%',
                            background: pendingCount > 0 ? '#ffebee' : (darkMode ? '#2d2d44' : '#f0f2f5'),
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                    >
                        <FaBell
                            size={24}
                            color={pendingCount > 0 ? '#f44336' : (darkMode ? '#aaa' : '#666')}
                        />
                    </div>
                    {pendingCount > 0 && (
                        <span className="badge" style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            background: '#f44336',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '4px 8px',
                            fontSize: '11px',
                            minWidth: '20px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}>
                            {pendingCount}
                        </span>
                    )}

                    {showNotificationPanel && (
                        <div className="notification-panel" style={{
                            position: 'absolute',
                            top: '50px',
                            right: '0',
                            width: '380px',
                            maxHeight: '450px',
                            overflowY: 'auto',
                            background: darkMode ? '#1a1a2e' : 'white',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            border: `1px solid ${darkMode ? '#2d2d44' : '#e0e0e0'}`
                        }}>
                            <div style={{
                                padding: '15px 20px',
                                borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#eee'}`,
                                fontWeight: 'bold',
                                background: darkMode ? '#16213e' : '#f8f9fa',
                                borderRadius: '12px 12px 0 0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>📋 Notifications ({pendingCount} non lues)</span>
                                <div>
                                    {pendingCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                color: '#7367f0',
                                                marginRight: '15px'
                                            }}
                                        >
                                            Tout marquer comme lu
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowNotificationPanel(false)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            color: darkMode ? '#aaa' : '#999'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            {displayNotifications.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                    🎉 Aucune notification
                                </div>
                            ) : (
                                displayNotifications.map((notif: Notification) => {
                                    const isRead = readIds.has(notif._id);
                                    return (
                                        <div
                                            key={notif._id}
                                            style={{
                                                padding: '14px 18px',
                                                borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#f0f0f0'}`,
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                                background: !isRead ? (darkMode ? '#2d1f1f' : '#fff8e1') : (darkMode ? '#1a1a2e' : 'white'),
                                                opacity: isRead ? 0.7 : 1
                                            }}
                                            onClick={() => {
                                                if (!isRead) {
                                                    markAsRead(notif._id);
                                                }
                                                setShowNotificationPanel(false);
                                                // Redirection selon le type de notification
                                                if (notif.type === 'PARCEL_UPDATE') {
                                                    navigate('/dispatcher/colis');
                                                } else {
                                                    navigate('/admin/pending-users');
                                                }
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f5f5f5'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = !isRead ? (darkMode ? '#2d1f1f' : '#fff8e1') : (darkMode ? '#1a1a2e' : 'white')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                {!isRead && (
                                                    <span style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: '#f44336',
                                                        display: 'inline-block'
                                                    }}></span>
                                                )}
                                                <div style={{ fontWeight: 'bold', color: darkMode ? 'white' : '#333' }}>
                                                    {getSenderName(notif)}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666', marginTop: '4px' }}>
                                                {notif.type === 'PARCEL_UPDATE' ? '📦 ' : '📧 '}
                                                {getDisplayContent(notif)}
                                            </div>
                                            <div style={{ fontSize: '11px', color: darkMode ? '#777' : '#999', marginTop: '6px' }}>
                                                🕐 {new Date(notif.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Profil utilisateur */}
                <div className="user-profile-container" onClick={toggleMenu} style={{ position: 'relative', cursor: 'pointer' }}>
                    <div className="user-trigger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="user-role" style={{ color: darkMode ? '#ddd' : '#333', fontWeight: '500' }}>{displayName}</span>
                        <FaUserCircle className="main-user-icon" size={32} color={darkMode ? '#aaa' : '#7367f0'} />
                    </div>

                    {isMenuOpen && (
                        <div className="profile-dropdown" onClick={(e) => e.stopPropagation()} style={{
                            position: 'absolute',
                            top: '50px',
                            right: '0',
                            width: '220px',
                            background: darkMode ? '#1a1a2e' : 'white',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            overflow: 'hidden',
                            border: `1px solid ${darkMode ? '#2d2d44' : '#e0e0e0'}`
                        }}>
                            <div className="dropdown-header" style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#eee'}`, background: darkMode ? '#16213e' : '#f8f9fa' }}>
                                <strong style={{ color: darkMode ? 'white' : '#333' }}>Mon compte</strong>
                            </div>
                            <div className="dropdown-item" onClick={() => navigate('/profile')} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', color: darkMode ? '#ddd' : '#333' }}>
                                <FaUserAlt className="icon-pink" size={14} />
                                <span>Mon profil</span>
                            </div>
                            <div className="dropdown-item" onClick={() => navigate('/settings')} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', color: darkMode ? '#ddd' : '#333' }}>
                                <FaCog className="icon-blue" size={14} />
                                <span>Paramètres</span>
                            </div>
                            <hr className="divider" style={{ margin: 0, borderColor: darkMode ? '#2d2d44' : '#eee' }} />
                            <div className="dropdown-item logout" onClick={handleLogout} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', color: '#f44336' }}>
                                <FaSignOutAlt size={14} />
                                <span>Déconnexion</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopHeader;