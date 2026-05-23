import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../common/Sidebar';
import TopHeader from '../common/TopHeader';
import {
    FaCheckCircle, FaTimesCircle, FaUser, FaTruck,
    FaEnvelope, FaCalendarAlt, FaPhone, FaIdCard,
    FaMapMarkerAlt, FaCity, FaCar, FaSearch, FaSpinner
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useTheme } from '../../context/ThemeContext';

interface Notification {
    _id: string;
    recipient: string;
    subject: string;
    content: string;
    status: string;
    source: string;
    type: string;
    userId: number;
    role: string;
    createdAt: string;
    firstName?: string;
    lastName?: string;
}

interface UserComplete {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cni: string;
    zone: string;
    address: string;
    role: string;
    vehicleType?: string;
    matricule?: string;
    permisNumber?: string;
    active: boolean;
}

const PendingUsers: React.FC = () => {
    const { darkMode, toggleTheme } = useTheme(); // ✅ جيب darkMode من Context

    const [pendingUsers, setPendingUsers] = useState<Notification[]>([]);
    const [usersDetails, setUsersDetails] = useState<Map<number, UserComplete>>(new Map());
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("pending");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // ✅ URLs
    const API_BASE = "http://localhost:8888";
    const USERS_API = `${API_BASE}/users-service/api/profiles`;
    const SECURITY_API = `${API_BASE}/service-security/v1/users`;
    const NOTIF_API = `${API_BASE}/notification-service/api/notifications`;

    // ✅ جلب الطلبات المعلقة
    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                console.log("No token found");
                setLoading(false);
                return;
            }

            const config = { headers: { Authorization: `Bearer ${token}` } };

            const res = await axios.get<Notification[]>(`${NOTIF_API}/admin-alerts`, config);

            console.log("🔔 Notifications reçues:", res.data);

            const signups = res.data.filter(n => n.type === 'NEW_SIGNUP_REQUEST' && n.status === 'PENDING');
            setPendingUsers(signups);

            for (const user of signups) {
                if (user.userId) {
                    await fetchUserDetails(user.userId);
                }
            }
        } catch (err: any) {
            console.error("❌ Error fetching pending users:", err);
            console.error("Response:", err.response?.data);
            showToast('error', 'Erreur', err.response?.data?.message || "Impossible de charger les demandes");
        } finally {
            setLoading(false);
        }
    };

    // ✅ جلب تفاصيل المستخدم
    const fetchUserDetails = async (userId: number) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${USERS_API}/details/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsersDetails(prev => new Map(prev).set(userId, res.data));
        } catch (error) {
            console.warn(`⚠️ Details non trouvés pour user ${userId}:`, error);
        }
    };

    // ✅ عرض الإشعارات
    const showToast = (icon: 'success' | 'error' | 'warning', title: string, text?: string) => {
        Swal.fire({
            icon, title, text,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    };

    // ✅ تأكيد الإجراء
    const confirmAction = async (title: string, text: string, confirmText: string) => {
        const result = await Swal.fire({
            title, text, icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmText,
            cancelButtonText: 'Annuler'
        });
        return result.isConfirmed;
    };

    // ✅ قبول المستخدم
    const acceptUser = async (notification: Notification) => {
        const fullName = getFullName(notification);
        const confirmed = await confirmAction(
            "Activer le compte",
            `Voulez-vous activer le compte de ${fullName} ?`,
            "Oui, activer"
        );
        if (!confirmed) return;

        setProcessingId(notification._id);
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const firstName = fullName.split(' ')[0];

            await axios.patch(
                `${SECURITY_API}/${notification.userId}/status`,
                { active: true },
                { ...config, headers: { ...config.headers, 'Content-Type': 'application/json' } }
            );

            try {
                await axios.post(
                    `${NOTIF_API}/send-manual`,
                    {
                        recipient: notification.recipient,
                        subject: "🎉 Votre compte QribLik est activé !",
                        content: `Bonjour ${firstName},\n\nVotre compte a été activé avec succès.\n\nCordialement,\nL'équipe QribLik`
                    },
                    config
                );
            } catch (emailErr) {
                console.warn("Email non envoyé:", emailErr);
            }

            await axios.delete(`${NOTIF_API}/${notification._id}`, config);

            showToast('success', '✅ Succès', `Compte de ${firstName} activé!`);

            await fetchPendingUsers();
        } catch (err: any) {
            console.error("❌ Error accepting user:", err);
            showToast('error', '❌ Erreur', err.response?.data?.message || "Erreur lors de l'activation");
        } finally {
            setProcessingId(null);
        }
    };

    // ✅ رفض المستخدم
    const rejectUser = async (notification: Notification) => {
        const fullName = getFullName(notification);
        const confirmed = await confirmAction(
            "Rejeter la demande",
            `Voulez-vous rejeter la demande de ${fullName} ?`,
            "Oui, rejeter"
        );
        if (!confirmed) return;

        setProcessingId(notification._id);
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.delete(`${SECURITY_API}/${notification.userId}`, config);
            await axios.delete(`${NOTIF_API}/${notification._id}`, config);

            showToast('success', '✅ Rejeté', `Demande de ${fullName} rejetée.`);

            await fetchPendingUsers();
        } catch (err: any) {
            console.error("❌ Error rejecting user:", err);
            showToast('error', '❌ Erreur', err.response?.data?.message || "Erreur lors du rejet");
        } finally {
            setProcessingId(null);
        }
    };

    // ✅ الحصول على الاسم الكامل
    const getFullName = (notif: Notification): string => {
        const details = usersDetails.get(notif.userId);
        if (details) return `${details.firstName} ${details.lastName}`;
        if (notif.firstName && notif.lastName) return `${notif.firstName} ${notif.lastName}`;

        if (notif.content && notif.content.includes("souhaite s'inscrire")) {
            const name = notif.content.split("souhaite")[0].trim();
            if (name) return name;
        }

        return notif.recipient?.split('@')[0] || 'Utilisateur';
    };

    // ✅ تنسيق التاريخ
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // ✅ تصفية حسب البحث
    const filteredUsers = pendingUsers.filter(user =>
        getFullName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.recipient?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const clients = filteredUsers.filter(u => u.role === 'CLIENT');
    const livreurs = filteredUsers.filter(u => u.role === 'LIVREUR');

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    useEffect(() => {
        const interval = setInterval(fetchPendingUsers, 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading && pendingUsers.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: darkMode ? '#0f0f1a' : '#f5f7fb' }}>
                <div style={{ textAlign: 'center' }}>
                    <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px', color: '#6c63ff' }} />
                    <p style={{ color: darkMode ? '#eaeef2' : '#333' }}>Chargement des demandes...</p>
                </div>
            </div>
        );
    }

    // ✅ Composant tableau avec Dark Mode support
    const UserTable = ({ users, title, icon, color, isLivreur = false }: {
        users: Notification[], title: string, icon: React.ReactNode, color: string, isLivreur?: boolean
    }) => (
        <div className="user-table-card" style={{
            background: darkMode ? '#16213e' : 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            marginBottom: '30px',
            overflow: 'hidden',
            border: `1px solid ${color}20`
        }}>
            <div style={{
                padding: '18px 24px',
                background: darkMode ? `${color}20` : `linear-gradient(135deg, ${color}15, white)`,
                borderBottom: `3px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{ background: color, width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {icon}
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: darkMode ? '#eaeef2' : '#333' }}>{title}</h3>
                    <p style={{ margin: '5px 0 0', color: darkMode ? '#8b92a5' : '#666', fontSize: '0.85rem' }}>{users.length} demande(s) en attente</p>
                </div>
            </div>

            {users.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: darkMode ? '#8b92a5' : '#999' }}>🎉 Aucune demande en attente</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                        <thead>
                        <tr style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e0e0e0'}` }}>
                            <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555' }}><FaUser /> Nom complet</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555' }}>📧 Contact</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555' }}><FaIdCard /> CNI</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555' }}>📍 Localisation</th>
                            {isLivreur && (
                                <>
                                    <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555' }}><FaCar /> Véhicule</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555' }}>📄 Documents</th>
                                </>
                            )}
                            <th style={{ padding: '15px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555' }}><FaCalendarAlt /> Date</th>
                            <th style={{ padding: '15px', textAlign: 'center', color: darkMode ? '#8b92a5' : '#555' }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((notif) => {
                            const details = usersDetails.get(notif.userId);
                            const isLoading = processingId === notif._id;
                            return (
                                <tr key={notif._id} style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#f0f0f0'}` }}>
                                    <td style={{ padding: '15px', color: darkMode ? '#eaeef2' : '#333' }}>
                                        <strong>{getFullName(notif)}</strong>
                                        <br />
                                        <small style={{ color: darkMode ? '#6b7280' : '#999', fontSize: '11px' }}>ID: #{notif.userId}</small>
                                    </td>
                                    <td style={{ padding: '15px', color: darkMode ? '#cbd5e1' : '#333' }}>
                                        <div><FaEnvelope style={{ marginRight: '8px', color: darkMode ? '#8b92a5' : '#666' }} /> {notif.recipient}</div>
                                        <div><FaPhone style={{ marginRight: '8px', color: darkMode ? '#8b92a5' : '#666' }} /> {details?.phone || 'Non renseigné'}</div>
                                    </td>
                                    <td style={{ padding: '15px', color: darkMode ? '#cbd5e1' : '#333' }}>{details?.cni || 'Non renseigné'}</td>
                                    <td style={{ padding: '15px', color: darkMode ? '#cbd5e1' : '#333' }}>
                                        <div><FaCity style={{ marginRight: '8px', color: darkMode ? '#8b92a5' : '#666' }} /> {details?.zone || 'Non renseignée'}</div>
                                        <div><FaMapMarkerAlt style={{ marginRight: '8px', color: darkMode ? '#8b92a5' : '#666' }} /> {details?.address || 'Non renseignée'}</div>
                                    </td>
                                    {isLivreur && (
                                        <>
                                            <td style={{ padding: '15px', color: darkMode ? '#cbd5e1' : '#333' }}>{details?.vehicleType || 'Non renseigné'}</td>
                                            <td style={{ padding: '15px', color: darkMode ? '#cbd5e1' : '#333' }}>
                                                <div><strong>Matricule:</strong> {details?.matricule || 'N/A'}</div>
                                                <div><strong>Permis:</strong> {details?.permisNumber || 'N/A'}</div>
                                            </td>
                                        </>
                                    )}
                                    <td style={{ padding: '15px', color: darkMode ? '#cbd5e1' : '#333' }}>{formatDate(notif.createdAt)}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => acceptUser(notif)}
                                            disabled={isLoading}
                                            style={{
                                                background: '#4caf50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 16px',
                                                margin: '0 5px',
                                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                                opacity: isLoading ? 0.6 : 1
                                            }}
                                        >
                                            {isLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaCheckCircle />}
                                            {' '}Accepter
                                        </button>
                                        <button
                                            onClick={() => rejectUser(notif)}
                                            disabled={isLoading}
                                            style={{
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 16px',
                                                margin: '0 5px',
                                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                                opacity: isLoading ? 0.6 : 1
                                            }}
                                        >
                                            {isLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaTimesCircle />}
                                            {' '}Rejeter
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0f0f1a' : '#f5f7fb' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHeader
                    activeTab="pending"
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                    user={{ firstName: 'Admin', lastName: '' }}
                />
                <section style={{ padding: '30px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '20px', color: darkMode ? '#eaeef2' : '#333' }}>📋 Gestion des inscriptions</h1>

                    <div style={{ marginBottom: '25px', maxWidth: '400px' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px 12px 45px',
                                    border: `1px solid ${darkMode ? '#3d3d5c' : '#e0e0e0'}`,
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    background: darkMode ? '#1a1a2e' : 'white',
                                    color: darkMode ? '#eaeef2' : '#333'
                                }}
                            />
                        </div>
                    </div>

                    <UserTable users={clients} title="👥 CLIENTS" icon={<FaUser size={20} />} color="#4a90e2" isLivreur={false} />
                    <UserTable users={livreurs} title="🚚 LIVREURS" icon={<FaTruck size={20} />} color="#e67e22" isLivreur={true} />
                </section>
            </main>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PendingUsers;