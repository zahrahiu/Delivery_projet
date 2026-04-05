import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FaEdit, FaTrash, FaArrowLeft, FaSpinner,
    FaEye, FaTimes, FaChevronLeft, FaChevronRight
} from "react-icons/fa";

interface Dispatcher {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    zone: string;
    address?: string;
    cni?: string;
    active?: boolean;
    role: string;
}

interface Props {
    onDispatchersUpdate?: (count: number) => void;
}

const DispatchersTab: React.FC<Props> = ({ onDispatchersUpdate }) => {
    const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDispatcher, setSelectedDispatcher] = useState<Dispatcher | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const initialForm = {
        userId: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        cni: "",
        zone: "",
        address: "",
        role: "DISPATCHER"
    };

    const [formData, setFormData] = useState(initialForm);

    // الربط عبر الـ Gateway
    const API_URL = "http://localhost:8888/users-service/api/profiles";

    const getAuthHeader = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    });

    const fetchDispatchers = async () => {
        try {
            const response = await axios.get(API_URL, { headers: getAuthHeader() });
            const onlyDispatchers = response.data.filter((user: any) => user.role === "DISPATCHER");
            setDispatchers(onlyDispatchers);
            if (onDispatchersUpdate) onDispatchersUpdate(onlyDispatchers.length);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => { fetchDispatchers(); }, []);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = dispatchers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(dispatchers.length / itemsPerPage);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditClick = (d: Dispatcher) => {
        setFormData({
            ...initialForm,
            userId: d.userId.toString(),
            firstName: d.firstName || "",
            lastName: d.lastName || "",
            email: d.email || "",
            phone: d.phone || "",
            cni: d.cni || "",
            zone: d.zone || "",
            address: d.address || "",
            role: "DISPATCHER"
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
            alert("Les mots de passe ne correspondent pas !");
            return;
        }

        setIsLoading(true);
        try {
            // صيفطي JSON عادي باش الـ @RequestBody في Java يفهمو
            const { confirmPassword, ...payload } = formData;

            if (isEditing) {
                await axios.put(`${API_URL}/${formData.userId}`, payload, {
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                alert("Dispatcher modifié ✅");
            } else {
                const { userId, ...createPayload } = payload;
                await axios.post(API_URL, createPayload, {
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                });
                alert("Dispatcher créé ✅");
            }
            cancelAction();
            fetchDispatchers();
        } catch (error: any) {
            console.error("Error:", error.response?.data);
            alert("Erreur: " + (error.response?.data?.message || "Check Console"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce dispatcher ?")) {
            try {
                await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
                fetchDispatchers();
            } catch (error) { alert("Erreur lors de la suppression."); }
        }
    };

    return (
        <div className="management-section">
            {!isFormOpen ? (
                <>
                    <div className="header-flex">
                        <h2 className="section-title">Gestion des Dispatchers ({dispatchers.length})</h2>
                        <button className="btn-add" onClick={() => { setIsEditing(false); setFormData(initialForm); setIsFormOpen(true); }}>
                            + Nouveau Dispatcher
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                            <tr>
                                <th>Nom Complet</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Zone</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentItems.map((d) => (
                                <tr key={d.userId}>
                                    <td>{d.firstName} {d.lastName}</td>
                                    <td>{d.email}</td>
                                    <td>{d.phone}</td>
                                    <td><span className="zone-badge">{d.zone}</span></td>
                                    <td className="action-buttons">
                                        <FaEye className="icon-view" title="Voir" onClick={() => { setSelectedDispatcher(d); setShowDetails(true); }} />
                                        <FaEdit className="icon-edit" title="Modifier" onClick={() => handleEditClick(d)} />
                                        <FaTrash className="icon-delete" title="Supprimer" onClick={() => handleDelete(d.userId)} />
                                    </td>
                                </tr>
                            ))}
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
                        <h2 className="page-title">{isEditing ? "Modifier Dispatcher" : "Nouveau Dispatcher"}</h2>
                        <button className="btn-back" onClick={cancelAction}><FaArrowLeft /> Retour</button>
                    </div>
                    <div className="form-card-clean">
                        <form onSubmit={handleSave}>
                            <div className="form-row-grid">
                                <div className="input-block"><label>Prénom</label><input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} /></div>
                                <div className="input-block"><label>Nom</label><input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} /></div>
                            </div>
                            <div className="form-row-grid">
                                <div className="input-block"><label>CNI</label><input type="text" name="cni" value={formData.cni} onChange={handleInputChange} /></div>
                                <div className="input-block"><label>Téléphone</label><input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} /></div>
                            </div>
                            <div className="form-row-grid">
                                <div className="input-block">
                                    <label>Zone / Ville</label>
                                    <select name="zone" required value={formData.zone} onChange={handleInputChange} className="clean-select">
                                        <option value="">Sélectionner...</option>
                                        <option value="Maarif">Maarif</option>
                                        <option value="Sidi Bernoussi">Sidi Bernoussi</option>
                                        <option value="Casablanca">Casablanca</option>
                                        <option value="Rabat">Rabat</option>
                                    </select>
                                </div>
                                <div className="input-block"><label>Adresse</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} /></div>
                            </div>

                            <div className="input-block">
                                <label>Email</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} disabled={isEditing} />
                            </div>

                            {!isEditing && (
                                <div className="form-row-grid">
                                    <div className="input-block"><label>Mot de passe</label><input type="password" name="password" required value={formData.password} onChange={handleInputChange} /></div>
                                    <div className="input-block"><label>Confirmation</label><input type="password" name="confirmPassword" required onChange={handleInputChange} /></div>
                                </div>
                            )}

                            <div className="form-footer">
                                <button type="submit" className="save-changes-btn" disabled={isLoading}>
                                    {isLoading ? <FaSpinner className="spinner" /> : (isEditing ? "Enregistrer les modifications" : "Créer le compte")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetails && selectedDispatcher && (
                <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Détails du Dispatcher</h3>
                            <FaTimes onClick={() => setShowDetails(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        <div className="modal-body">
                            <p><strong>Nom complet:</strong> {selectedDispatcher.firstName} {selectedDispatcher.lastName}</p>
                            <p><strong>Email:</strong> {selectedDispatcher.email}</p>
                            <p><strong>Téléphone:</strong> {selectedDispatcher.phone}</p>
                            <p><strong>CNI:</strong> {selectedDispatcher.cni || "N/A"}</p>
                            <p><strong>Zone:</strong> {selectedDispatcher.zone}</p>
                            <p><strong>Adresse:</strong> {selectedDispatcher.address || "Non spécifiée"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DispatchersTab;