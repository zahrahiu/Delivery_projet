import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import {
    FaEdit, FaTrash, FaArrowLeft, FaSpinner,
    FaEye, FaTimes, FaChevronLeft, FaChevronRight,
    FaMotorcycle, FaCar, FaTruck, FaUser, FaSearch
} from "react-icons/fa";
import Swal from 'sweetalert2';

interface Livreur {
    userId: number;
    firstName: string; lastName: string; email: string; phone: string;
    zone: string; vehicleType: string; matricule: string; permisNumber: string;
    cni: string; address: string; active: boolean; role: string;
}

interface Ville {
    id: number;
    ville: string;
    frais_livraison: number;
}

interface Props {
    onLivreursUpdate?: (count: number) => void;
}

const LivreursTab: React.FC<Props> = ({ onLivreursUpdate }) => {
    const [livreurs, setLivreurs] = useState<Livreur[]>([]);
    const [villes, setVilles] = useState<Ville[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLivreur, setSelectedLivreur] = useState<Livreur | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [activeTab, setActiveTab] = useState('livreurs');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const initialForm = {
        userId: "", firstName: "", lastName: "", email: "", password: "",
        confirmPassword: "", phone: "", zone: "", vehicleType: "Moto",
        matricule: "", permisNumber: "", cni: "", address: "", role: "LIVREUR"
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

    const fetchLivreurs = async () => {
        try {
            const response = await axios.get(API_URL, getAuthConfig());
            const filtered = response.data.filter((u: any) => u.role === "LIVREUR");
            setLivreurs(filtered);
            if (onLivreursUpdate) onLivreursUpdate(filtered.length);
        } catch (error) {
            console.error("Fetch Error:", error);
            showToast('error', 'Erreur', "Impossible de charger les livreurs");
        }
    };

    const fetchVilles = async () => {
        try {
            const response = await axios.get(TARIFS_API);
            setVilles(response.data);
        } catch (error) {
            console.error("Error fetching villes:", error);
            setVilles([
                { id: 1, ville: "Casablanca", frais_livraison: 25 },
                { id: 2, ville: "Rabat", frais_livraison: 25 },
                { id: 3, ville: "Marrakech", frais_livraison: 30 },
                { id: 4, ville: "Fès", frais_livraison: 30 },
                { id: 5, ville: "Tanger", frais_livraison: 35 },
                { id: 6, ville: "Agadir", frais_livraison: 40 },
            ]);
        }
    };

    useEffect(() => {
        fetchLivreurs();
        fetchVilles();
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

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'Moto': return <FaMotorcycle />;
            case 'Voiture': return <FaCar />;
            case 'Camionnette': return <FaTruck />;
            default: return <FaMotorcycle />;
        }
    };

    const filteredLivreurs = livreurs.filter(l =>
        l.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone?.includes(searchTerm)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLivreurs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLivreurs.length / itemsPerPage);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditClick = (l: Livreur) => {
        setFormData({
            ...initialForm,
            userId: l.userId.toString(),
            firstName: l.firstName || "",
            lastName: l.lastName || "",
            email: l.email || "",
            phone: l.phone || "",
            cni: l.cni || "",
            zone: l.zone || "",
            address: l.address || "",
            vehicleType: l.vehicleType || "Moto",
            matricule: l.matricule || "",
            permisNumber: l.permisNumber || "",
            role: "LIVREUR"
        });
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const cancelAction = () => {
        setIsFormOpen(false);
        setIsEditing(false);
        setFormData(initialForm);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEditing && formData.password !== formData.confirmPassword) {
            showToast('warning', 'Erreur', "Les mots de passe ne correspondent pas");
            return;
        }

        setIsLoading(true);
        try {
            const { confirmPassword, ...payload } = formData;
            const finalPayload = {
                ...payload,
                createdBy: "ADMIN",
                active: true,
                firstLogin: true
            };

            if (isEditing) {
                await axios.put(`${API_URL}/${formData.userId}`, finalPayload, getAuthConfigWithContentType());
                showToast('success', 'Succès', "Livreur modifié ✅");
            } else {
                const { userId, ...createPayload } = finalPayload;
                await axios.post(API_URL, createPayload, getAuthConfigWithContentType());
                showToast('success', 'Succès', "Livreur créé ✅");
            }
            cancelAction();
            fetchLivreurs();
        } catch (error: any) {
            console.error("Error details:", error.response?.data);
            showToast('error', 'Erreur', error.response?.data?.message || "Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await showConfirmDialog(
            "Supprimer le livreur",
            `Voulez-vous supprimer ${name} ?`,
            "Oui, supprimer"
        );

        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/${id}`, getAuthConfig());
            showToast('success', 'Supprimé', `${name} a été supprimé`);
            fetchLivreurs();
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
                                    <h2 className="section-title">🚚 Gestion des Livreurs</h2>
                                    <button className="btn-add" onClick={() => { setIsEditing(false); setFormData(initialForm); setIsFormOpen(true); }}>
                                        + Nouveau Livreur
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
                                            <th>👤 Livreur</th>
                                            <th>📞 Contact</th>
                                            <th>🆔 CNI</th>
                                            <th>🏙️ Zone</th>
                                            <th>🚗 Véhicule</th>
                                            <th style={{ textAlign: 'center' }}>⚡ Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {currentItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                    Aucun livreur trouvé
                                                </td>
                                            </tr>
                                        ) : (
                                            currentItems.map((l) => (
                                                <tr key={l.userId}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <FaUser style={{ color: '#999' }} />
                                                            <strong>{l.firstName} {l.lastName}</strong>
                                                        </div>
                                                        <small style={{ color: '#888' }}>{l.email}</small>
                                                    </td>
                                                    <td>{l.phone || '—'}</td>
                                                    <td>{l.cni || '—'}</td>
                                                    <td><span className="zone-badge">{l.zone || '—'}</span></td>
                                                    <td>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                {getVehicleIcon(l.vehicleType)} {l.vehicleType}
                                                            </span>
                                                        <small style={{ color: '#888' }}>{l.matricule}</small>
                                                    </td>
                                                    <td className="action-buttons">
                                                        <FaEye className="icon-view" title="Voir" onClick={() => { setSelectedLivreur(l); setShowDetails(true); }} />
                                                        <FaEdit className="icon-edit" title="Modifier" onClick={() => handleEditClick(l)} />
                                                        <FaTrash className="icon-delete" title="Supprimer" onClick={() => handleDelete(l.userId, `${l.firstName} ${l.lastName}`)} />
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
                                    <h2 className="page-title">{isEditing ? "✏️ Modifier Livreur" : "➕ Nouveau Livreur"}</h2>
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

                                        <div className="form-section-header" style={{ marginTop: '20px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                            🚚 Logistique
                                        </div>

                                        <div className="form-row-grid">
                                            <div className="input-block">
                                                <label>Zone / Ville</label>
                                                <select name="zone" required value={formData.zone} onChange={handleInputChange} className="clean-select">
                                                    <option value="">-- Sélectionner une ville --</option>
                                                    {villes.map((ville) => (
                                                        <option key={ville.id} value={ville.ville}>
                                                            {ville.ville}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="input-block">
                                                <label>Véhicule</label>
                                                <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} className="clean-select">
                                                    <option value="Moto">🏍️ Moto</option>
                                                    <option value="Voiture">🚗 Voiture</option>
                                                    <option value="Camionnette">🚚 Camionnette</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-row-grid">
                                            <div className="input-block">
                                                <label>Matricule</label>
                                                <input type="text" name="matricule" value={formData.matricule} onChange={handleInputChange} placeholder="Matricule" />
                                            </div>
                                            <div className="input-block">
                                                <label>N° Permis</label>
                                                <input type="text" name="permisNumber" value={formData.permisNumber} onChange={handleInputChange} placeholder="Numéro de permis" />
                                            </div>
                                        </div>
                                        <div className="input-block">
                                            <label>Adresse</label>
                                            <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Adresse complète" />
                                        </div>

                                        {!isEditing && (
                                            <div className="form-row-grid">
                                                <div className="input-block">
                                                    <label>Mot de passe</label>
                                                    <input type="password" name="password" required value={formData.password} onChange={handleInputChange} placeholder="Mot de passe" />
                                                </div>
                                                <div className="input-block">
                                                    <label>Confirmation</label>
                                                    <input type="password" name="confirmPassword" required onChange={handleInputChange} placeholder="Confirmer" />
                                                </div>
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
                        {showDetails && selectedLivreur && (
                            <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                                <div className="modal-content" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>📋 Détails du Livreur</h3>
                                        <FaTimes onClick={() => setShowDetails(false)} style={{ cursor: 'pointer', color: '#999' }} />
                                    </div>
                                    <div className="modal-body">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <p><strong>👤 Nom complet:</strong><br/>{selectedLivreur.firstName} {selectedLivreur.lastName}</p>
                                            <p><strong>📧 Email:</strong><br/>{selectedLivreur.email}</p>
                                            <p><strong>📞 Téléphone:</strong><br/>{selectedLivreur.phone || 'N/A'}</p>
                                            <p><strong>🆔 CNI:</strong><br/>{selectedLivreur.cni || 'N/A'}</p>
                                            <p><strong>🏙️ Zone:</strong><br/>{selectedLivreur.zone || 'N/A'}</p>
                                            <p><strong>📍 Adresse:</strong><br/>{selectedLivreur.address || 'Non spécifiée'}</p>
                                            <p><strong>🚗 Véhicule:</strong><br/>{selectedLivreur.vehicleType}</p>
                                            <p><strong>🔢 Matricule:</strong><br/>{selectedLivreur.matricule || 'N/A'}</p>
                                            <p><strong>📜 N° Permis:</strong><br/>{selectedLivreur.permisNumber || 'N/A'}</p>
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

export default LivreursTab;