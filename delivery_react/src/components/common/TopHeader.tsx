import React, { useEffect, useState, useRef } from "react";
import {
    FaUserCircle, FaSignOutAlt, FaCog, FaUserAlt,
    FaBell, FaEnvelope, FaSun, FaMoon, FaCheckCircle, FaInfoCircle
} from "react-icons/fa";
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
}

const TopHeader = ({ isMenuOpen, setIsMenuOpen, darkMode, toggleTheme, user: propUser }: any) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // إدارة الإشعارات المقروءة محلياً
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

            // ✅ تصفية: خذ notification وحدة فقط لكل recipient (اللي فيها "souhaite s'inscrire")
            const unique = res.data.reduce((acc: Notification[], curr: Notification) => {
                // تجاهل الإيميلات المرسلة (SENT)
                if (curr.status === 'SENT') return acc;

                // تجاهل الإشعارات اللي مافيهاش "souhaite s'inscrire" (الإيميلات الآلية)
                if (curr.content && !curr.content.includes("souhaite s'inscrire")) return acc;

                // منع التكرار: إذا كان recipient موجود مسبقاً، تجاهل
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

    // إغلاق القائمة عند الضغط خارجها
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

    // تصفية الإشعارات المهمة فقط
    const displayNotifications = notifications.filter(n =>
        n.type === 'NEW_SIGNUP_REQUEST' || n.type === 'PARCEL_UPDATE' || n.status === 'PENDING'
    );

    const unreadCount = displayNotifications.filter(n => !readIds.has(n._id)).length;

    // استخراج اسم المرسل بذكاء
    const getSenderName = (notif: Notification) => {
        if (notif.firstName && notif.lastName) return `${notif.firstName} ${notif.lastName}`;
        if (notif.content.includes("souhaite s'inscrire")) {
            return notif.content.split("souhaite")[0].trim();
        }
        return notif.recipient?.split('@')[0] || "Système";
    };

    return (
        <header style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 30px', background: darkMode ? '#1a1a2e' : 'white',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)', position: 'sticky', top: '15px',
            zIndex: 100, borderRadius: '50px', margin: '10px 20px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#f0f2f5'}`
        }}>
            <div onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
                <img src={logoSmall} alt="Logo" style={{ height: '35px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Bell Icon & Panel */}
                <div style={{ position: 'relative' }} ref={notificationRef}>
                    <div
                        onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                        style={{
                            padding: '10px', borderRadius: '50%', cursor: 'pointer',
                            background: unreadCount > 0 ? '#fff5f5' : (darkMode ? '#2d2d44' : '#f8f9fa'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s'
                        }}
                    >
                        <FaBell size={20} color={unreadCount > 0 ? '#f44336' : '#666'} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '0', right: '0', background: '#f44336',
                                color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold'
                            }}>{unreadCount}</span>
                        )}
                    </div>

                    {showNotificationPanel && (
                        <div style={{
                            position: 'absolute', top: '50px', right: '0', width: '350px',
                            background: darkMode ? '#1a1a2e' : 'white', borderRadius: '15px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid #eee', overflow: 'hidden'
                        }}>
                            <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                                <strong>Notifications</strong>
                                {unreadCount > 0 && <small onClick={markAllAsRead} style={{ color: '#4e73df', cursor: 'pointer' }}>Tout lire</small>}
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {displayNotifications.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Aucune notification</div>
                                ) : (
                                    displayNotifications.map(n => (
                                        <div
                                            key={n._id}
                                            onClick={() => { markAsRead(n._id); navigate('/admin/pending-users'); setShowNotificationPanel(false); }}
                                            style={{
                                                padding: '12px 15px', borderBottom: '1px solid #f9f9f9', cursor: 'pointer',
                                                background: readIds.has(n._id) ? 'transparent' : '#f0f4ff',
                                                display: 'flex', gap: '12px', alignItems: 'start'
                                            }}
                                        >
                                            <div style={{ background: n.type === 'NEW_SIGNUP_REQUEST' ? '#4e73df' : '#1cc88a', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                                {n.type === 'NEW_SIGNUP_REQUEST' ? <FaUserAlt size={12}/> : <FaInfoCircle size={12}/>}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{getSenderName(n)}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{n.type === 'NEW_SIGNUP_REQUEST' ? 'Demande d\'inscription' : n.subject}</div>
                                                <div style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>{new Date(n.createdAt).toLocaleString('fr-FR')}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dark Mode Toggle */}
                <div onClick={toggleTheme} style={{ cursor: 'pointer', color: '#666' }}>
                    {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                </div>

                {/* Profile Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #eee', paddingLeft: '15px', cursor: 'pointer' }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Admin</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Administrateur</div>
                    </div>
                    <FaUserCircle size={35} color="#4e73df" />
                </div>

                {/* Dropdown Profile */}
                {isMenuOpen && (
                    <div style={{
                        position: 'absolute', top: '70px', right: '20px', width: '180px',
                        background: 'white', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                        border: '1px solid #eee', overflow: 'hidden'
                    }}>
                        <div onClick={() => navigate('/profile')} style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                            <FaUserAlt size={14} color="#666" /> Profil
                        </div>
                        <div onClick={() => navigate('/settings')} style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                            <FaCog size={14} color="#666" /> Paramètres
                        </div>
                        <div onClick={handleLogout} style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#f44336', borderTop: '1px solid #eee' }}>
                            <FaSignOutAlt size={14} /> Déconnexion
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default TopHeader;