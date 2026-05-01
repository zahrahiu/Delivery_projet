import React, { useState, useEffect } from "react";
import axios from "axios";
import {FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaCity} from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import Swal from 'sweetalert2';

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
    const [activeTab, setActiveTab] = useState('villes');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:8888/tarif-zone-service/api/tarifs";

    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

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

    const fetchVilles = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL, getAuthHeaders());
            setVilles(res.data);
        } catch (err) {
            console.error("Fetch error:", err);
            showToast('error', 'Erreur', "Impossible de charger les villes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVilles(); }, []);

    const handleDelete = async (id: number, villeName: string) => {
        const confirmed = await showConfirmDialog(
            "Supprimer la ville",
            `Voulez-vous supprimer ${villeName} ?`,
            "Oui, supprimer"
        );

        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
            setVilles(villes.filter(v => v.id !== id));
            showToast('success', 'Supprimée', `${villeName} a été supprimée`);
        } catch (err) {
            console.error(err);
            showToast('error', 'Erreur', "Vérifiez si la ville n'est pas liée à une zone");
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
                await axios.put(`${API_URL}/${currentId}`, payload, getAuthHeaders());
                showToast('success', 'Modifiée', "Ville modifiée ✅");
            } else {
                await axios.post(API_URL, { ...payload, colis: 0 }, getAuthHeaders());
                showToast('success', 'Ajoutée', "Ville ajoutée ✅");
            }

            setShowModal(false);
            fetchVilles();
        } catch (err: any) {
            showToast('error', 'Erreur', err.response?.data?.error || "Erreur lors de l'enregistrement");
        }
    };

    const filteredVilles = villes.filter(v => v.ville.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} user={{ firstName: 'Admin', lastName: '' }} />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                        <div>Chargement des villes...</div>
                    </div>
                </main>
            </div>
        );
    }

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
                    <div className="user-table-card" style={{
                        background: 'white',
                        borderRadius: '20px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                        marginBottom: '30px',
                        overflow: 'hidden',
                        border: '1px solid #4a90e220'
                    }}>
                        <div style={{
                            padding: '18px 24px',
                            background: 'linear-gradient(135deg, #4a90e215, white)',
                            borderBottom: '3px solid #4a90e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '15px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    background: '#4a90e2',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <FaCity size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>🏙️ Gestion des Villes</h3>
                                    <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.85rem' }}>{villes.length} ville(s) enregistrée(s)</p>
                                </div>
                            </div>
                            <button className="add-main-btn" onClick={openAddModal} style={{
                                background: 'linear-gradient(135deg, #7367f0, #5e4ee0)',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}>
                                <FaPlus /> Ajouter Ville
                            </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            {/* Search Bar */}
                            <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
                                <div style={{ position: 'relative' }}>
                                    <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                    <input
                                        type="text"
                                        placeholder="Rechercher une ville..."
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

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>Réf</th>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>Ville</th>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>Frais livraison</th>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>Colis</th>
                                        <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredVilles.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                Aucune ville trouvée
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredVilles.map((v) => (
                                            <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '16px', fontWeight: '600', color: '#7367f0' }}>#{v.ref}</td>
                                                <td style={{ padding: '16px' }}>{v.ville}</td>
                                                <td style={{ padding: '16px' }}>
                                                        <span style={{
                                                            background: '#e8f5e9',
                                                            color: '#2e7d32',
                                                            padding: '5px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '13px',
                                                            fontWeight: '500'
                                                        }}>{v.frais_livraison} DH</span>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                        <span style={{
                                                            background: '#e3f2fd',
                                                            color: '#1565c0',
                                                            padding: '5px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '13px',
                                                            fontWeight: '500'
                                                        }}>{v.colis} Colis</span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                                        <FaEdit
                                                            style={{ cursor: 'pointer', color: '#ff9800', fontSize: '18px' }}
                                                            onClick={() => openEditModal(v)}
                                                        />
                                                        <FaTrash
                                                            style={{ cursor: 'pointer', color: '#f44336', fontSize: '18px' }}
                                                            onClick={() => handleDelete(v.id, v.ville)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{
                        background: 'white', borderRadius: '24px', width: '500px', maxWidth: '90%',
                        overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div className="modal-header-v2" style={{
                            padding: '20px 25px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0 }}>{isEditing ? "Modifier la ville" : "Nouvelle Ville"}</h3>
                            <FaTimes className="close-icon" onClick={() => setShowModal(false)} style={{ cursor: 'pointer', fontSize: '20px' }} />
                        </div>
                        <form onSubmit={handleSave} className="modal-body-v2" style={{ padding: '25px' }}>
                            <div className="input-grid-v2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group-v2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>Référence</label>
                                    <input
                                        type="text"
                                        value={formData.ref}
                                        onChange={(e)=>setFormData({...formData, ref: e.target.value})}
                                        required
                                        placeholder="Ex: CAS-01"
                                        style={{ padding: '12px 15px', border: '1px solid #e0e0e0', borderRadius: '10px' }}
                                    />
                                </div>
                                <div className="input-group-v2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>Nom de la Ville</label>
                                    <input
                                        type="text"
                                        value={formData.ville}
                                        onChange={(e)=>setFormData({...formData, ville: e.target.value})}
                                        required
                                        placeholder="Ex: Casablanca"
                                        style={{ padding: '12px 15px', border: '1px solid #e0e0e0', borderRadius: '10px' }}
                                    />
                                </div>
                                <div className="input-group-v2 full-width" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>Frais de Livraison (DH)</label>
                                    <input
                                        type="number"
                                        value={formData.frais_livraison}
                                        onChange={(e)=>setFormData({...formData, frais_livraison: e.target.value})}
                                        required
                                        placeholder="0.00"
                                        style={{ padding: '12px 15px', border: '1px solid #e0e0e0', borderRadius: '10px' }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer-v2" style={{ padding: '20px 25px', background: '#f8f9fa', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: '1px solid #e0e0e0', background: 'white', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
                                <button type="submit" className="btn-confirm" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #7367f0, #5e4ee0)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VillesTab;