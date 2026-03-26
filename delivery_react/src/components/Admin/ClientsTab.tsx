import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FaEdit, FaTrash, FaArrowLeft, FaSpinner,
    FaEye, FaTimes, FaChevronLeft, FaChevronRight, FaPlus, FaUser
} from "react-icons/fa";

interface Client {
    userId: number;
    firstName: string; lastName: string; email: string; phone: string;
    zone: string; address: string; cni: string; role: string;
}

interface Props {
    onClientsUpdate?: (count: number) => void;
}

const ClientsTab: React.FC<Props> = ({ onClientsUpdate }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const initialForm = {
        userId: "", firstName: "", lastName: "", email: "", password: "",
        confirmPassword: "", phone: "", zone: "", address: "", cni: "", role: "CLIENT"
    };

    const [formData, setFormData] = useState(initialForm);
    const API_URL = "http://localhost:8081/api/profiles";
    const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    const fetchClients = async () => {
        try {
            const response = await axios.get(API_URL, { headers: getAuthHeader() });
            const filtered = response.data.filter((u: any) => u.role === "CLIENT");
            setClients(filtered);
            if (onClientsUpdate) onClientsUpdate(filtered.length);
        } catch (error) { console.error("Fetch Error:", error); }
    };

    useEffect(() => { fetchClients(); }, []);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = clients.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(clients.length / itemsPerPage);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isEditing) {
                // --- حالة التعديل (Update) : كنستعملو FormData حيت كاين ملف/تصويرة ---
                const dataToSend = new FormData();
                Object.keys(formData).forEach(key => {
                    // @ts-ignore
                    if (formData[key] !== null) dataToSend.append(key, formData[key]);
                });

                await axios.put(`${API_URL}/${formData.userId}`, dataToSend, {
                    headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
                });
                alert("Modifié avec succès ✅");
            } else {
                // --- حالة إنشاء جديد (Create) : صيفطي JSON عادي حيت الـ Backend كيتسنى @RequestBody ---
                // كنحيدو confirmPassword باش ما تمشيش لـ Java
                const { confirmPassword, userId, ...payload } = formData;

                await axios.post(API_URL, payload, {
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
                });
                alert("Client créé avec succès ✅");
            }

            setIsFormOpen(false);
            setFormData(initialForm);
            fetchClients();
        } catch (error: any) {
            console.error("Error details:", error.response?.data);
            alert("Erreur lors de l'enregistrement: " + (error.response?.data?.message || "Check Console"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce client ?")) {
            try {
                await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
                fetchClients();
            } catch (error) { alert("Erreur."); }
        }
    };

    return (
        <div className="management-section">
            {!isFormOpen ? (
                <>
                    <div className="header-flex">
                        <h2 className="section-title">Gestion des Clients ({clients.length})</h2>
                        <button className="btn-add" onClick={() => { setIsEditing(false); setFormData(initialForm); setIsFormOpen(true); }}>
                            + Nouveau Client
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                            <tr><th>Nom Complet</th><th>Contact</th><th>CNI</th><th>Zone</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                            {currentItems.map((c) => (
                                <tr key={c.userId}>
                                    <td style={{ display: 'flex', alignItems: 'center' }}>
                                        <FaUser style={{ marginRight: '10px', color: '#777', flexShrink: 0 }} />
                                        <span>{c.firstName} {c.lastName}</span>
                                    </td>                                <td>{c.phone} <br/><small style={{color:'#888'}}>{c.email}</small></td>
                                    <td>{c.cni || "---"}</td>
                                    <td><span className="zone-badge">{c.zone}</span></td>
                                    <td className="action-buttons">

                                        <FaEye className="icon-view" onClick={() => { setSelectedClient(c); setShowDetails(true); }} />
                                        <FaEdit className="icon-edit" onClick={() => { setFormData({...formData, ...c, userId: c.userId.toString()}); setIsEditing(true); setIsFormOpen(true); }} />
                                        <FaTrash className="icon-delete" onClick={() => handleDelete(c.userId)} />
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
                        <h2>{isEditing ? "Modifier le Client" : "Nouveau Client"}</h2>
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
                            <div className="input-block"><label>Adresse</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} /></div>
                            <div className="input-block"><label>Zone</label><input type="text" name="zone" required value={formData.zone} onChange={handleInputChange} /></div>

                            {!isEditing && (
                                <div className="form-row-grid">
                                    <div className="input-block"><label>Mot de passe</label><input type="password" name="password" required value={formData.password} onChange={handleInputChange} /></div>
                                    <div className="input-block"><label>Confirmer</label><input type="password" name="confirmPassword" required onChange={handleInputChange} /></div>
                                </div>
                            )}
                            <button type="submit" className="save-changes-btn">{isLoading ? <FaSpinner className="spinner" /> : "Enregistrer"}</button>
                        </form>
                    </div>
                </div>
            )}

            {showDetails && selectedClient && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header"><h3>Détails Client</h3><FaTimes onClick={() => setShowDetails(false)} style={{cursor:'pointer'}} /></div>
                        <div className="modal-body">
                            <p><strong>Nom:</strong> {selectedClient.firstName} {selectedClient.lastName}</p>
                            <p><strong>Téléphone:</strong> {selectedClient.phone}</p>
                            <p><strong>CNI:</strong> {selectedClient.cni || "N/A"}</p>
                            <p><strong>Zone:</strong> {selectedClient.zone}</p>
                            <p><strong>Adresse:</strong> {selectedClient.address}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ClientsTab;