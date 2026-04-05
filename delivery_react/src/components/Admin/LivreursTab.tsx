import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FaEdit, FaTrash, FaArrowLeft, FaSpinner,
    FaEye, FaTimes, FaChevronLeft, FaChevronRight,
    FaMotorcycle, FaCar, FaTruck, FaUser
} from "react-icons/fa";

interface Livreur {
    userId: number;
    firstName: string; lastName: string; email: string; phone: string;
    zone: string; vehicleType: string; matricule: string; permisNumber: string;
    cni: string; address: string; active: boolean; role: string;
}

interface Props {
    onLivreursUpdate?: (count: number) => void;
}

const LivreursTab: React.FC<Props> = ({ onLivreursUpdate }) => {
    const [livreurs, setLivreurs] = useState<Livreur[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLivreur, setSelectedLivreur] = useState<Livreur | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const initialForm = {
        userId: "", firstName: "", lastName: "", email: "", password: "",
        confirmPassword: "", phone: "", zone: "", vehicleType: "Moto",
        matricule: "", permisNumber: "", cni: "", address: "", role: "LIVREUR"
    };

    const [formData, setFormData] = useState(initialForm);

    // الروابط الجديدة عبر الـ Gateway (البور 8888)
    const API_URL = "http://localhost:8888/users-service/api/profiles";
    const TARIFS_API = "http://localhost:8888/tarif-zone-service/api/tarifs";

    const getAuthHeader = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    });

    const fetchLivreurs = async () => {
        try {
            const response = await axios.get(API_URL, { headers: getAuthHeader() });
            const filtered = response.data.filter((u: any) => u.role === "LIVREUR");
            setLivreurs(filtered);
            if (onLivreursUpdate) onLivreursUpdate(filtered.length);
        } catch (error) { console.error("Fetch Error:", error); }
    };

    const fetchZones = async () => {
        try {
            const res = await axios.get(TARIFS_API, { headers: getAuthHeader() });
            setZones(res.data);
        } catch (err) { console.error("Erreur Zones:", err); }
    };

    useEffect(() => {
        fetchLivreurs();
        fetchZones();
    }, []);

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'Moto': return <FaMotorcycle />;
            case 'Voiture': return <FaCar />;
            case 'Camionnette': return <FaTruck />;
            default: return <FaMotorcycle />;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEditing && formData.password !== formData.confirmPassword) {
            alert("Les mots de passe ne correspondent pas !");
            return;
        }

        setIsLoading(true);
        try {
            // صيفطي JSON عادي باش الـ Gateway والـ Microservice لداخل يفهموه بسهولة
            const { confirmPassword, ...payload } = formData;

            if (isEditing) {
                await axios.put(`${API_URL}/${formData.userId}`, payload, {
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
                });
                alert("Livreur modifié avec success ✅");
            } else {
                const { userId, ...createPayload } = payload;
                await axios.post(API_URL, createPayload, {
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
                });
                alert("Livreur ajouté avec success ✅");
            }

            setIsFormOpen(false);
            setFormData(initialForm);
            fetchLivreurs();
        } catch (error: any) {
            console.error("Error details:", error.response?.data);
            alert("Erreur: " + (error.response?.data?.message || "Vérifiez la console"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce livreur ?")) {
            try {
                await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
                fetchLivreurs();
            } catch (error) { alert("Erreur lors de la suppression."); }
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = livreurs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(livreurs.length / itemsPerPage);

    return (
        <div className="management-section">
            {!isFormOpen ? (
                <>
                    <div className="header-flex">
                        <h2 className="section-title">Flotte de Livreurs ({livreurs.length})</h2>
                        <button className="btn-add" onClick={() => { setIsEditing(false); setFormData(initialForm); setIsFormOpen(true); }}>
                            + Nouveau Livreur
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                            <tr><th>Livreur</th><th>Contact</th><th>CNI</th><th>Zone</th><th>Véhicule</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                            {currentItems.map((l) => (
                                <tr key={l.userId}>
                                    <td style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <FaUser style={{color:'#999'}} />
                                        <span>{l.firstName} {l.lastName}</span>
                                    </td>
                                    <td>{l.phone} <br/><small style={{color:'#888'}}>{l.email}</small></td>
                                    <td>{l.cni}</td>
                                    <td><span className="zone-badge">{l.zone}</span></td>
                                    <td><span style={{display:'flex', alignItems:'center', gap:'5px'}}>{getVehicleIcon(l.vehicleType)} {l.vehicleType}</span></td>
                                    <td className="action-buttons">
                                        <FaEye className="icon-view" onClick={() => { setSelectedLivreur(l); setShowDetails(true); }} />
                                        <FaEdit className="icon-edit" onClick={() => { setFormData({...formData, ...l, userId: l.userId.toString()}); setIsEditing(true); setIsFormOpen(true); }} />
                                        <FaTrash className="icon-delete" onClick={() => handleDelete(l.userId)} />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="page-nav-btn"><FaChevronLeft /></button>
                            <span className="page-info">{currentPage} / {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="page-nav-btn"><FaChevronRight /></button>
                        </div>
                    )}
                </>
            ) : (
                <div className="form-container">
                    <div className="header-flex">
                        <h2>{isEditing ? "Modifier le Livreur" : "Nouveau Livreur"}</h2>
                        <button className="btn-back" onClick={() => setIsFormOpen(false)}><FaArrowLeft /> Retour</button>
                    </div>
                    <div className="form-card-clean">
                        <form onSubmit={handleSave}>
                            <div className="form-row-grid">
                                <div className="input-block"><label>Prénom</label><input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} /></div>
                                <div className="input-block"><label>Nom</label><input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} /></div>
                            </div>
                            <div className="form-row-grid">
                                <div className="input-block"><label>Téléphone</label><input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} /></div>
                                <div className="input-block"><label>CNI</label><input type="text" name="cni" value={formData.cni} onChange={handleInputChange} /></div>
                            </div>
                            <div className="input-block"><label>Email</label><input type="email" name="email" required value={formData.email} onChange={handleInputChange} disabled={isEditing} /></div>

                            <div className="form-section-header" style={{marginTop:'20px', fontWeight:'bold', borderBottom:'1px solid #eee'}}>Logistique</div>

                            <div className="form-row-grid">
                                <div className="input-block">
                                    <label>Zone</label>
                                    <select name="zone" required value={formData.zone} onChange={handleInputChange}>
                                        <option value="">-- Sélectionner Zone --</option>
                                        {zones.map(z => (
                                            <option key={z.id} value={z.ville}>
                                                {z.ville}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-block">
                                    <label>Véhicule</label>
                                    <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange}>
                                        <option value="Moto">Moto</option>
                                        <option value="Voiture">Voiture</option>
                                        <option value="Camionnette">Camionnette</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row-grid">
                                <div className="input-block"><label>Matricule</label><input type="text" name="matricule" value={formData.matricule} onChange={handleInputChange} /></div>
                                <div className="input-block"><label>N° Permis</label><input type="text" name="permisNumber" value={formData.permisNumber} onChange={handleInputChange} /></div>
                            </div>

                            {!isEditing && (
                                <div className="form-row-grid">
                                    <div className="input-block"><label>Mot de passe</label><input type="password" name="password" required value={formData.password} onChange={handleInputChange} /></div>
                                    <div className="input-block"><label>Confirmer</label><input type="password" name="confirmPassword" required onChange={handleInputChange} /></div>
                                </div>
                            )}
                            <button type="submit" className="save-changes-btn" disabled={isLoading}>
                                {isLoading ? <FaSpinner className="spinner" /> : "Enregistrer"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showDetails && selectedLivreur && (
                <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Détails du Livreur</h3>
                            <FaTimes onClick={() => setShowDetails(false)} style={{cursor:'pointer'}} />
                        </div>
                        <div className="modal-body">
                            <p><strong>Nom:</strong> {selectedLivreur.firstName} {selectedLivreur.lastName}</p>
                            <p><strong>Véhicule:</strong> {selectedLivreur.vehicleType} ({selectedLivreur.matricule})</p>
                            <p><strong>N° Permis:</strong> {selectedLivreur.permisNumber}</p>
                            <p><strong>Zone d'affectation:</strong> {selectedLivreur.zone}</p>
                            <p><strong>Contact:</strong> {selectedLivreur.phone}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LivreursTab;