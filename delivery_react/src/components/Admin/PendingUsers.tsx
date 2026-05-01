import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../common/Sidebar';
import TopHeader from '../common/TopHeader';
import {
    FaCheckCircle, FaTimesCircle, FaUser, FaTruck,
    FaEnvelope, FaCalendarAlt, FaPhone, FaIdCard,
    FaMapMarkerAlt, FaCity, FaCar, FaSearch
} from 'react-icons/fa';
import Swal from 'sweetalert2';

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
    createdAt?: string;
}

const PendingUsers = () => {
    const [pendingUsers, setPendingUsers] = useState<Notification[]>([]);
    const [usersDetails, setUsersDetails] = useState<Map<number, UserComplete>>(new Map());
    const [filteredUsers, setFilteredUsers] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("pending");
    const [searchTerm, setSearchTerm] = useState("");

    const USERS_API = "http://localhost:8888/users-service/api/profiles";
    const SECURITY_API = "http://localhost:8888/service-security/v1/users";
    const NOTIF_API = "http://localhost:8888/notification-service/api/notifications";

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    useEffect(() => {
        let filtered = [...pendingUsers];
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getFullName(user).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredUsers(filtered);
    }, [searchTerm, pendingUsers]);

    const fetchPendingUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get<Notification[]>(`${NOTIF_API}/pending-signups`, config);
            setPendingUsers(res.data);
            setFilteredUsers(res.data);
            for (const user of res.data) {
                await fetchUserDetails(user.userId);
            }
        } catch (err) {
            console.error("Error fetching pending users:", err);
            showToast('error', 'Erreur', "Impossible de charger les demandes");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId: number) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${USERS_API}/details/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsersDetails(prev => new Map(prev).set(userId, res.data));
        } catch (error) {
            console.error("Error fetching user details for", userId, error);
        }
    };

    const showToast = (icon: 'success' | 'error' | 'warning', title: string, text?: string) => {
        Swal.fire({
            icon: icon, title: title, text: text,
            toast: true, position: 'top-end', showConfirmButton: false,
            timer: 3000, timerProgressBar: true
        });
    };

    const showConfirmDialog = async (title: string, text: string, confirmText: string) => {
        const result = await Swal.fire({
            title: title, text: text, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33', confirmButtonText: confirmText,
            cancelButtonText: 'Annuler'
        });
        return result.isConfirmed;
    };

    const sendActivationEmail = async (email: string, firstName: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${NOTIF_API}/send-manual`, {
                recipient: email,
                subject: "🎉 Votre compte QribLik est activé !",
                content: `Bonjour ${firstName},\n\nVotre compte a été activé avec succès.\n\nCordialement,\nL'équipe QribLik`
            }, { headers: { Authorization: `Bearer ${token}` } });
            return true;
        } catch (error) {
            return false;
        }
    };

    const acceptUser = async (notification: Notification) => {
        const confirmed = await showConfirmDialog("Activer le compte", `Voulez-vous activer le compte de ${getFullName(notification)} ?`, "Oui, activer");
        if (!confirmed) return;
        setActivatingId(notification._id);
        try {
            const token = localStorage.getItem("token");
            const firstName = getFullName(notification).split(' ')[0];
            await axios.patch(`${SECURITY_API}/${notification.userId}/status`, { active: true }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
            await sendActivationEmail(notification.recipient, firstName);
            await axios.delete(`${NOTIF_API}/${notification._id}`, { headers: { Authorization: `Bearer ${token}` } });
            showToast('success', '✅ Succès', `Compte de ${firstName} activé!`);
            fetchPendingUsers();
        } catch (err: any) {
            showToast('error', '❌ Erreur', err.response?.data?.message || err.message);
        } finally {
            setActivatingId(null);
        }
    };

    const rejectUser = async (notification: Notification) => {
        const confirmed = await showConfirmDialog("Rejeter la demande", `Voulez-vous rejeter la demande de ${getFullName(notification)} ?`, "Oui, rejeter");
        if (!confirmed) return;
        setActivatingId(notification._id);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${SECURITY_API}/${notification.userId}`, { headers: { Authorization: `Bearer ${token}` } });
            await axios.delete(`${NOTIF_API}/${notification._id}`, { headers: { Authorization: `Bearer ${token}` } });
            showToast('success', '✅ Rejeté', `Demande rejetée.`);
            fetchPendingUsers();
        } catch (err: any) {
            showToast('error', '❌ Erreur', err.response?.data?.message || err.message);
        } finally {
            setActivatingId(null);
        }
    };

    const clients = filteredUsers.filter((u: Notification) => u.role === 'CLIENT');
    const livreurs = filteredUsers.filter((u: Notification) => u.role === 'LIVREUR');

    const getFullName = (notif: Notification) => {
        const details = usersDetails.get(notif.userId);
        if (details) return `${details.firstName} ${details.lastName}`;
        return notif.content?.split(' souhaite')[0] || notif.recipient?.split('@')[0] || 'Nouvel utilisateur';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const UserTable = ({ users, title, icon, color, isLivreur = false }: {
        users: Notification[], title: string, icon: React.ReactNode, color: string, isLivreur?: boolean
    }) => (
        <div className="user-table-card" style={{
            background: 'white', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            marginBottom: '30px', overflow: 'hidden', border: `1px solid ${color}20`
        }}>
            <div style={{
                padding: '18px 24px', background: `linear-gradient(135deg, ${color}15, white)`,
                borderBottom: `3px solid ${color}`, display: 'flex', alignItems: 'center', gap: '12px'
            }}>
                <div style={{ background: color, width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {icon}
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{title}</h3>
                    <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.85rem' }}>{users.length} demande(s) en attente</p>
                </div>
            </div>

            {users.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>🎉 Aucune demande</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                        <thead>
                        <tr>
                            <th><FaUser /> Nom complet</th>
                            <th>📧 Contact</th>
                            <th><FaIdCard /> CNI</th>
                            <th>📍 Localisation</th>
                            {isLivreur && (
                                <>
                                    <th><FaCar /> Véhicule</th>
                                    <th>📄 Documents</th>
                                </>
                            )}
                            <th><FaCalendarAlt /> Date</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((notif: Notification) => {
                            const details = usersDetails.get(notif.userId);
                            return (
                                <tr key={notif._id}>
                                    <td>
                                        <strong>{getFullName(notif)}</strong>
                                        {details && !details.active && (
                                            <span className="status-badge-pending" style={{ marginLeft: '8px' }}>En attente</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="info-block">
                                            <FaEnvelope className="info-icon" />
                                            <span className="info-text">{notif.recipient}</span>
                                        </div>
                                        <div className="info-block">
                                            <FaPhone className="info-icon" />
                                            <span className="info-text">{details?.phone || 'Non renseigné'}</span>
                                        </div>
                                    </td>
                                    <td>{details?.cni || 'Non renseigné'}</td>
                                    <td>
                                        <div className="info-block">
                                            <FaCity className="info-icon" />
                                            <span className="info-text">{details?.zone || 'Non renseignée'}</span>
                                        </div>
                                        <div className="info-block">
                                            <FaMapMarkerAlt className="info-icon" />
                                            <span className="info-text">{details?.address || 'Non renseignée'}</span>
                                        </div>
                                    </td>
                                    {isLivreur && (
                                        <>
                                            <td>{details?.vehicleType || 'Non renseigné'}</td>
                                            <td>
                                                <div className="info-block">
                                                    <strong>Matricule:</strong> {details?.matricule || 'N/A'}
                                                </div>
                                                <div className="info-block">
                                                    <strong>Permis:</strong> {details?.permisNumber || 'N/A'}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                    <td>{formatDate(notif.createdAt)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="action-btn-accept"
                                            onClick={() => acceptUser(notif)}
                                            disabled={activatingId === notif._id}
                                        >
                                            <FaCheckCircle size={12} style={{ marginRight: '5px' }} />
                                            {activatingId === notif._id }
                                        </button>
                                        <button
                                            className="action-btn-reject"
                                            onClick={() => rejectUser(notif)}
                                            disabled={activatingId === notif._id}
                                        >
                                            <FaTimesCircle size={12} style={{ marginRight: '5px' }} />
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

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #6c63ff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                <p>Chargement des demandes...</p>
            </div>
        </div>
    );

    return (
        <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHeader activeTab="pending" isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} user={{ firstName: 'Admin', lastName: '' }} />
                <section style={{ padding: '30px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>📋 Gestion des inscriptions</h1>
                    <div style={{ marginBottom: '25px', maxWidth: '400px', marginTop: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 15px 12px 45px', border: '1px solid #e0e0e0', borderRadius: '12px' }} />
                        </div>
                    </div>
                    <UserTable users={clients} title="👥 CLIENTS" icon={<FaUser size={20} />} color="#4a90e2" isLivreur={false} />
                    <UserTable users={livreurs} title="🚚 LIVREURS" icon={<FaTruck size={20} />} color="#e67e22" isLivreur={true} />
                </section>
            </main>
        </div>
    );
};

export default PendingUsers;