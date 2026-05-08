import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FaEdit, FaTrash, FaArrowLeft, FaSpinner,
    FaEye, FaTimes, FaChevronLeft, FaChevronRight, FaUser,
    FaSearch, FaPhone, FaEnvelope, FaIdCard, FaCity, FaMapMarkerAlt
} from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import Swal from 'sweetalert2';

interface Client {
    userId: number;
    firstName: string; lastName: string; email: string; phone: string;
    zone: string; address: string; cni: string; role: string;
}

interface Ville {
    id: number;
    ville: string;
    frais_livraison: number;
}

interface Props {
    onClientsUpdate?: (count: number) => void;
}

// 🔥 دالة لتوليد كلمة مرور عشوائية
const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const ClientsTab: React.FC<Props> = ({ onClientsUpdate }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [villes, setVilles] = useState<Ville[]>([]);  // 🔥 أضفنا المدن
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [activeTab, setActiveTab] = useState('clients');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [generatedPassword, setGeneratedPassword] = useState("");
    const itemsPerPage = 10;

    const initialForm = {
        userId: "", firstName: "", lastName: "", email: "", password: "",
        confirmPassword: "", phone: "", zone: "", address: "", cni: "", role: "CLIENT"
    };

    const [formData, setFormData] = useState(initialForm);

    const API_URL = "http://localhost:8888/users-service/api/profiles";
    const TARIFS_API = "http://localhost:8888/tarif-zone-service/api/tarifs";

    const getAuthConfig = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const getAuthConfigWithContentType = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
        }
    });

    // 🔥 جلب المدن من Database
    const fetchVilles = async () => {

            const response = await axios.get(TARIFS_API);
            setVilles(response.data);

    };

    const fetchClients = async () => {
        try {
            const response = await axios.get(API_URL, getAuthConfig());

            const filtered = response.data.filter((u: any) =>
                u.role === "CLIENT" &&
                u.active === true  // 🔥 هذا هو الفلتر المهم!
            );

            setClients(filtered);
            if (onClientsUpdate) onClientsUpdate(filtered.length);
        } catch (error) {
            console.error("Fetch Error:", error);
            showToast('error', 'Erreur', "Impossible de charger les clients");
        }
    };

    useEffect(() => {
        fetchClients();
        fetchVilles();  // 🔥 جلب المدن عند تحميل الصفحة
    }, []);

    const showToast = (icon: 'success' | 'error' | 'warning', title: string, text?: string) => {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    };

    const showConfirmDialog = async (title: string, text: string, confirmText: string) => {
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmText,
            cancelButtonText: 'Annuler'
        });
        return result.isConfirmed;
    };

    const filteredClients = clients.filter(c =>
        c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditClick = (c: Client) => {
        setFormData({
            ...initialForm,
            userId: c.userId.toString(),
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            email: c.email || "",
            phone: c.phone || "",
            cni: c.cni || "",
            zone: c.zone || "",
            address: c.address || "",
            role: "CLIENT"
        });
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const cancelAction = () => {
        setIsFormOpen(false);
        setIsEditing(false);
        setFormData(initialForm);
        setGeneratedPassword("");
    };

    // 🔥 دالة لإرسال الإيميل مع password
    const sendWelcomeEmail = async (email: string, firstName: string, password: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `http://localhost:8888/notification-service/api/notifications/send-manual`,
                {
                    recipient: email,
                    subject: "🎉 Bienvenue sur QribLik !",
                    content: `Bonjour ${firstName},\n\nVotre compte a été créé par l'administrateur.\n\nVoici vos identifiants de connexion :\n\nEmail: ${email}\nMot de passe temporaire: ${password}\n\n⚠️ Lors de votre première connexion, vous devrez changer votre mot de passe.\n\nCordialement,\nL'équipe QribLik`
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return true;
        } catch (error) {
            console.error("Error sending email:", error);
            return false;
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            if (isEditing) {
                const { confirmPassword, ...payload } = formData;
                const finalPayload = {
                    ...payload,
                    createdBy: "ADMIN"
                };
                await axios.put(`${API_URL}/${formData.userId}`, finalPayload, getAuthConfigWithContentType());
                showToast('success', 'Succès', "Client modifié ✅");
            } else {
                // 🔥 توليد كلمة مرور عشوائية للـ Client
                const randomPassword = generateRandomPassword();
                setGeneratedPassword(randomPassword);

                const { confirmPassword, userId, ...payload } = formData;
                const finalPayload = {
                    ...payload,
                    password: randomPassword,
                    createdBy: "ADMIN",
                    active: true,
                    firstLogin: true
                };

                const response = await axios.post(API_URL, finalPayload, getAuthConfigWithContentType());

                // 🔥 إرسال الإيميل مع password
                await sendWelcomeEmail(finalPayload.email, finalPayload.firstName, randomPassword);

                showToast('success', 'Succès', `Client créé ✅\nEmail envoyé à ${finalPayload.email}`);
            }

            cancelAction();
            fetchClients();
        } catch (error: any) {
            console.error("Error details:", error.response?.data);
            const errorMsg = error.response?.data?.message || "Une erreur est survenue";
            if (errorMsg.includes("email") || error.response?.status === 409) {
                showToast('error', 'Email déjà utilisé', "Cet email est déjà associé à un compte");
            } else {
                showToast('error', 'Erreur', errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await showConfirmDialog(
            "Supprimer le client",
            `Voulez-vous supprimer ${name} ?`,
            "Oui, supprimer"
        );

        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/${id}`, getAuthConfig());
            showToast('success', 'Supprimé', `${name} a été supprimé`);
            fetchClients();
        } catch (error) {
            showToast('error', 'Erreur', "Impossible de supprimer");
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={{ firstName: 'Admin', lastName: '' }}
                />
                <div style={{ padding: '30px' }}>
                    <div className="management-section">
                        {!isFormOpen ? (
                            <>
                                <div className="header-flex">
                                    <h2 className="section-title">👥 Gestion des Clients</h2>
                                    <button className="btn-add" onClick={() => { setIsEditing(false); setFormData(initialForm); setIsFormOpen(true); }}>
                                        + Nouveau Client
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="search-bar-container" style={{ marginBottom: '20px', maxWidth: '400px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                        <input
                                            type="text"
                                            placeholder="Rechercher par nom, email ou téléphone..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 15px 12px 45px',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '12px',
                                                fontSize: '14px',
                                                background: 'white'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="table-container">
                                    <table className="custom-table">
                                        <thead>
                                        <tr>
                                            <th>👤 Client</th>
                                            <th>📞 Contact</th>
                                            <th>🆔 CNI</th>
                                            <th>🏙️ Zone</th>
                                            <th style={{ textAlign: 'center' }}>⚡ Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {currentItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                    Aucun client trouvé
                                                </td>
                                            </tr>
                                        ) : (
                                            currentItems.map((c) => (
                                                <tr key={c.userId}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <FaUser style={{ color: '#999' }} />
                                                            <strong>{c.firstName} {c.lastName}</strong>
                                                        </div>
                                                        <small style={{ color: '#888' }}>{c.email}</small>
                                                    </td>
                                                    <td>{c.phone || '—'}</td>
                                                    <td>{c.cni || '—'}</td>
                                                    <td><span className="zone-badge">{c.zone || '—'}</span></td>
                                                    <td className="action-buttons">
                                                        <FaEye className="icon-view" title="Voir" onClick={() => { setSelectedClient(c); setShowDetails(true); }} />
                                                        <FaEdit className="icon-edit" title="Modifier" onClick={() => handleEditClick(c)} />
                                                        <FaTrash className="icon-delete" title="Supprimer" onClick={() => handleDelete(c.userId, `${c.firstName} ${c.lastName}`)} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>

                                    {totalPages > 1 && (
                                        <div className="pagination-container">
                                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="page-nav-btn"><FaChevronLeft /></button>
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}>{i + 1}</button>
                                            ))}
                                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="page-nav-btn"><FaChevronRight /></button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="form-container">
                                <div className="header-flex">
                                    <h2 className="page-title">{isEditing ? "✏️ Modifier Client" : "➕ Nouveau Client"}</h2>
                                    <button className="btn-back" onClick={cancelAction}><FaArrowLeft /> Retour</button>
                                </div>

                                <div className="form-card-clean">
                                    <form onSubmit={handleSave}>
                                        <div className="form-row-grid">
                                            <div className="input-block">
                                                <label>Prénom</label>
                                                <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} placeholder="Prénom" />
                                            </div>
                                            <div className="input-block">
                                                <label>Nom</label>
                                                <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} placeholder="Nom" />
                                            </div>
                                        </div>
                                        <div className="form-row-grid">
                                            <div className="input-block">
                                                <label>Téléphone</label>
                                                <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="Téléphone" />
                                            </div>
                                            <div className="input-block">
                                                <label>CNI</label>
                                                <input type="text" name="cni" value={formData.cni} onChange={handleInputChange} placeholder="Numéro CNI" />
                                            </div>
                                        </div>

                                        <div className="input-block">
                                            <label>Email</label>
                                            <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="email@exemple.com" disabled={isEditing} />
                                        </div>

                                        <div className="input-block">
                                            <label>Adresse</label>
                                            <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Adresse complète" />
                                        </div>

                                        <div className="input-block">
                                            <label><FaCity /> Ville</label>
                                            <select
                                                name="zone"
                                                required
                                                value={formData.zone}
                                                onChange={handleInputChange}
                                                className="clean-select"
                                            >
                                                <option value="">-- Sélectionner une ville --</option>
                                                {villes.map((ville) => (
                                                    <option key={ville.id} value={ville.ville}>
                                                        {ville.ville}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 🔥 حقل password محذوف للـ Client (Admin لا يدخل password) */}
                                        {!isEditing && (
                                            <div className="info-message" style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                                                <small>🔐 Un mot de passe temporaire sera généré automatiquement et envoyé par email.</small>
                                            </div>
                                        )}

                                        <div className="form-footer">
                                            <button type="submit" className="save-changes-btn" disabled={isLoading}>
                                                {isLoading ? <FaSpinner className="spinner" /> : (isEditing ? "💾 Enregistrer" : "✨ Créer le compte")}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Details Modal */}
                        {showDetails && selectedClient && (
                            <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                                <div className="modal-content" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>📋 Détails du Client</h3>
                                        <FaTimes onClick={() => setShowDetails(false)} style={{ cursor: 'pointer', color: '#999' }} />
                                    </div>
                                    <div className="modal-body">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <p><strong>👤 Nom complet:</strong><br/>{selectedClient.firstName} {selectedClient.lastName}</p>
                                            <p><strong>📧 Email:</strong><br/>{selectedClient.email}</p>
                                            <p><strong>📞 Téléphone:</strong><br/>{selectedClient.phone || 'N/A'}</p>
                                            <p><strong>🆔 CNI:</strong><br/>{selectedClient.cni || 'N/A'}</p>
                                            <p><strong>🏙️ Ville:</strong><br/>{selectedClient.zone || 'N/A'}</p>
                                            <p><strong>📍 Adresse:</strong><br/>{selectedClient.address || 'Non spécifiée'}</p>
                                        </div>
                                    </div>
                                    <div className="modal-footer" style={{ marginTop: '20px', textAlign: 'right' }}>
                                        <button onClick={() => setShowDetails(false)} style={{ padding: '8px 20px', background: '#7367f0', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Fermer</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientsTab;