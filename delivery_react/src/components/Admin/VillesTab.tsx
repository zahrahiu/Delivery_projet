import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch } from "react-icons/fa";

interface Tarif {
    id: number;
    ref: string;
    ville: string;
    frais_livraison: number;
    colis: number;
}

const VillesTab: React.FC = () => {
    const [villes, setVilles] = useState<Tarif[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ ref: "", ville: "", frais_livraison: "" });

    const API_URL = "http://localhost:5005/api/tarifs";

    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const fetchVilles = async () => {
        try {
            const res = await axios.get(API_URL, getAuthHeaders());
            setVilles(res.data);
        } catch (err) { console.error("Fetch error:", err); }
    };

    useEffect(() => { fetchVilles(); }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette ville ?")) return;
        try {
            // تأكدي أن الـ ID كيوصل صحيح للـ URL
            const res = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
            if(res.status === 200) {
                setVilles(villes.filter(v => v.id !== id));
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression. Vérifiez si la ville est liée à une zone.");
        }
    };

    const openEditModal = (v: Tarif) => {
        setIsEditing(true);
        setCurrentId(v.id);
        setFormData({ ref: v.ref, ville: v.ville, frais_livraison: v.frais_livraison.toString() });
        setShowModal(true);
    };

    const openAddModal = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({ ref: "", ville: "", frais_livraison: "" });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ref: formData.ref,
                ville: formData.ville,
                frais_livraison: parseFloat(formData.frais_livraison),
            };

            if (isEditing && currentId) {
                // تعديل مدينة موجودة باستعمال الـ ID
                await axios.put(`${API_URL}/${currentId}`, payload, getAuthHeaders());
            } else {
                // إضافة مدينة جديدة
                await axios.post(API_URL, { ...payload, colis: 0 }, getAuthHeaders());
            }

            setShowModal(false);
            fetchVilles();
        } catch (err: any) {
            alert(err.response?.data?.error || "Erreur lors de l'enregistrement");
        }
    };

    return (
        <div className="tab-content-container">
            <div className="tab-header-actions">

                <button className="add-main-btn" onClick={openAddModal}>
                    <FaPlus /> Ajouter Ville
                </button>
            </div>

            <div className="custom-table-wrapper">
                <table className="modern-table">
                    <thead>
                    <tr>
                        <th>Réf</th>
                        <th>Ville</th>
                        <th>Frais livraison</th>
                        <th>Colis</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {villes.filter(v => v.ville.toLowerCase().includes(searchTerm.toLowerCase())).map((v) => (
                        <tr key={v.id}>
                            <td className="bold-text">#{v.ref}</td>
                            <td>{v.ville}</td>
                            <td><span className="price-tag">{v.frais_livraison} DH</span></td>
                            <td><span className="zone-badge">{v.colis} Colis</span></td>
                            <td className="actions-cell">
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                    <FaEdit className="icon-edit-btn" onClick={() => openEditModal(v)} style={{ cursor: 'pointer', color: '#7367f0' }} />
                                    <FaTrash className="icon-delete-btn" onClick={() => handleDelete(v.id)} style={{ cursor: 'pointer', color: '#f56565' }} />
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header-v2">
                            <h3>{isEditing ? "Modifier la ville" : "Nouvelle Ville"}</h3>
                            <FaTimes className="close-icon" onClick={() => setShowModal(false)} />
                        </div>
                        <form onSubmit={handleSave} className="modal-body-v2">
                            <div className="input-grid-v2">
                                <div className="input-group-v2">
                                    <label>Référence</label>
                                    <input
                                        type="text"
                                        value={formData.ref}
                                        onChange={(e)=>setFormData({...formData, ref: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="input-group-v2">
                                    <label>Nom de la Ville</label>
                                    <input
                                        type="text"
                                        value={formData.ville}
                                        onChange={(e)=>setFormData({...formData, ville: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="input-group-v2 full-width">
                                    <label>Frais de Livraison (DH)</label>
                                    <input
                                        type="number"
                                        value={formData.frais_livraison}
                                        onChange={(e)=>setFormData({...formData, frais_livraison: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer-v2">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-confirm">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VillesTab;