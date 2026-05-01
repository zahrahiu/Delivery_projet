import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTrash, FaMinus, FaMapMarkedAlt, FaLayerGroup, FaCity, FaTimes, FaSearch } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import Swal from 'sweetalert2';

interface Zone {
    id: number;
    nom_zone: string;
    villes_list: string[];
    statut: string;
}

interface Ville {
    id: number;
    ville: string;
    zone_id?: number;
}

const ZonesTab: React.FC = () => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [availableVilles, setAvailableVilles] = useState<Ville[]>([]);
    const [assignedVilles, setAssignedVilles] = useState<Ville[]>([]);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [newZoneName, setNewZoneName] = useState("");
    const [showVillesPopup, setShowVillesPopup] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState('zones');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const BASE_URL = "http://localhost:8888/tarif-zone-service/api";
    const API_URL = `${BASE_URL}/zones`;
    const VILLES_URL = `${BASE_URL}/tarifs`;

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const resZones = await axios.get(API_URL, getAuthHeaders());
            setZones(resZones.data);
            const resVilles = await axios.get(VILLES_URL, getAuthHeaders());
            setAvailableVilles(resVilles.data.filter((v: any) => !v.zone_id));
        } catch (err) {
            console.error("Error fetching data:", err);
            showToast('error', 'Erreur', "Impossible de charger les données");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handleClickOutside = () => setShowVillesPopup(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const refreshSubTables = async (zoneId: number) => {
        try {
            const res = await axios.get(VILLES_URL, getAuthHeaders());
            setAvailableVilles(res.data.filter((v: any) => !v.zone_id));
            setAssignedVilles(res.data.filter((v: any) => v.zone_id === zoneId));
        } catch (err) { console.error("Error refreshing tables:", err); }
    };

    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newZoneName) return;
        try {
            await axios.post(API_URL, { nom_zone: newZoneName }, getAuthHeaders());
            setNewZoneName("");
            setShowAddModal(false);
            fetchData();
            showToast('success', 'Créée', "Zone créée ✅");
        } catch (err) {
            showToast('error', 'Erreur', "Impossible de créer la zone");
        }
    };

    const handleAssign = async (villeId: number) => {
        if (!selectedZone) return;
        try {
            await axios.post(`${API_URL}/assign`, { zoneId: selectedZone.id, villeId }, getAuthHeaders());
            refreshSubTables(selectedZone.id);
            fetchData();
            showToast('success', 'Assignée', "Ville assignée avec succès");
        } catch (err) {
            showToast('error', 'Erreur', "Erreur lors de l'assignation");
        }
    };

    const handleUnassign = async (villeId: number) => {
        if (!selectedZone) return;
        try {
            await axios.post(`${API_URL}/unassign`, { villeId }, getAuthHeaders());
            refreshSubTables(selectedZone.id);
            fetchData();
            showToast('success', 'Retirée', "Ville retirée de la zone");
        } catch (err) {
            showToast('error', 'Erreur', "Erreur lors du retrait");
        }
    };

    const handleDeleteZone = async (zoneId: number, zoneName: string) => {
        const confirmed = await showConfirmDialog(
            "Supprimer la zone",
            `Voulez-vous supprimer la zone ${zoneName} ?`,
            "Oui, supprimer"
        );

        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/${zoneId}`, getAuthHeaders());
            setZones(zones.filter(z => z.id !== zoneId));
            if (selectedZone?.id === zoneId) setSelectedZone(null);
            showToast('success', 'Supprimée', "Zone supprimée ✅");
        } catch (err) {
            showToast('error', 'Erreur', "Impossible de supprimer la zone");
        }
    };

    const filteredZones = zones.filter(z => z.nom_zone.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderVillesList = (zone: Zone) => {
        const villes = zone.villes_list || [];
        if (villes.length === 0) return <span style={{ color: '#cbd5e0' }}>---</span>;
        const limit = 2;
        const displayed = villes.slice(0, limit);
        const remaining = villes.length - limit;

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>{displayed.join(', ')}</span>
                {remaining > 0 && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <span className="more-badge" onClick={(e) => {
                            e.stopPropagation();
                            setShowVillesPopup(showVillesPopup === zone.id ? null : zone.id);
                        }} style={{
                            background: '#e8eaf6', color: '#3949ab', padding: '2px 8px',
                            borderRadius: '12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                        }}>
                            +{remaining} plus
                        </span>
                        {showVillesPopup === zone.id && (
                            <div className="villes-popover" onClick={(e) => e.stopPropagation()} style={{
                                position: 'absolute', top: '100%', left: 0, background: 'white',
                                borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                minWidth: '180px', maxHeight: '200px', overflowY: 'auto', zIndex: 100,
                                border: '1px solid #e0e0e0'
                            }}>
                                <div className="popover-header" style={{
                                    padding: '10px 15px', background: '#f8f9fa',
                                    borderBottom: '1px solid #e0e0e0', display: 'flex',
                                    justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', fontSize: '13px'
                                }}>
                                    <span>Villes ({villes.length})</span>
                                    <FaTimes onClick={() => setShowVillesPopup(null)} style={{cursor: 'pointer'}}/>
                                </div>
                                <div className="popover-body" style={{ padding: '8px' }}>
                                    {villes.map((v, i) => (
                                        <div key={i} className="popover-item" style={{
                                            padding: '8px 12px', fontSize: '13px', display: 'flex',
                                            alignItems: 'center', gap: '8px', borderRadius: '8px'
                                        }}>
                                            <FaCity style={{fontSize: '12px', color: '#7367f0'}}/> {v}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} user={{ firstName: 'Admin', lastName: '' }} />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                        <div>Chargement des zones...</div>
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
                        border: '1px solid #e67e2220'
                    }}>
                        <div style={{
                            padding: '18px 24px',
                            background: 'linear-gradient(135deg, #e67e2215, white)',
                            borderBottom: '3px solid #e67e22',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '15px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    background: '#e67e22',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <FaMapMarkedAlt size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>🗺️ Gestion des Zones</h3>
                                    <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.85rem' }}>{zones.length} zone(s) enregistrée(s)</p>
                                </div>
                            </div>
                            <button className="btn-add" onClick={() => setShowAddModal(true)} style={{
                                background: '#e67e22', color: 'white', border: 'none', padding: '10px 20px',
                                borderRadius: '12px', fontWeight: '600', display: 'flex',
                                alignItems: 'center', gap: '8px', cursor: 'pointer'
                            }}>
                                <FaPlus /> Ajouter une zone
                            </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
                                <div style={{ position: 'relative' }}>
                                    <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                    <input
                                        type="text"
                                        placeholder="Rechercher une zone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 15px 12px 45px', border: '1px solid #e0e0e0',
                                            borderRadius: '12px', fontSize: '14px', background: 'white'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>NOM DE LA ZONE</th>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>VILLES ASSOCIÉES</th>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>STATUT</th>
                                        <th style={{ padding: '16px', textAlign: 'center' }}>ACTIONS</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredZones.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Aucune zone trouvée</td>
                                        </tr>
                                    ) : (
                                        filteredZones.map(zone => (
                                            <tr key={zone.id} style={{
                                                borderBottom: '1px solid #f0f0f0',
                                                background: selectedZone?.id === zone.id ? '#f0efff' : 'transparent'
                                            }}>
                                                <td style={{ padding: '16px', fontWeight: '600' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <FaMapMarkedAlt style={{ color: '#7367f0' }} />
                                                        <span>{zone.nom_zone}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>{renderVillesList(zone)}</td>
                                                <td style={{ padding: '16px' }}>
                                                        <span style={{
                                                            background: '#e8f5e9', color: '#2e7d32', padding: '5px 12px',
                                                            borderRadius: '20px', fontSize: '13px', fontWeight: '500'
                                                        }}>ACTIVE</span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                                        <FaPlus style={{ cursor: 'pointer', color: '#4caf50', fontSize: '18px' }}
                                                                title="Gérer les villes" onClick={() => { setSelectedZone(zone); refreshSubTables(zone.id); }} />
                                                        <FaTrash style={{ cursor: 'pointer', color: '#f44336', fontSize: '18px' }}
                                                                 title="Supprimer la zone" onClick={() => handleDeleteZone(zone.id, zone.nom_zone)} />
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

                    {selectedZone && (
                        <div style={{ display: 'flex', gap: '30px', marginTop: '30px' }}>
                            <div className="form-card-clean" style={{ flex: 1, background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaLayerGroup style={{ color: '#7367f0' }} /> Villes Disponibles
                                </h3>
                                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #edf2f7', maxHeight: '300px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                        {availableVilles.map(v => (
                                            <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <FaCity style={{ color: '#cbd5e0' }} /> {v.ville}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    <FaPlus onClick={() => handleAssign(v.id)} style={{ cursor: 'pointer', color: '#4caf50' }} />
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                    {availableVilles.length === 0 && <p style={{textAlign:'center', color:'#999', padding:'10px'}}>Aucune ville disponible</p>}
                                </div>
                            </div>

                            <div className="form-card-clean" style={{ flex: 1, background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px' }}>
                                    Villes dans {selectedZone.nom_zone}
                                </h3>
                                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #edf2f7', maxHeight: '300px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                        {assignedVilles.map(v => (
                                            <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <FaCity style={{ color: '#7367f0' }} /> {v.ville}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    <FaMinus onClick={() => handleUnassign(v.id)} style={{ cursor: 'pointer', color: '#f44336' }} />
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                    {assignedVilles.length === 0 && <p style={{textAlign:'center', color:'#999', padding:'10px'}}>Zone vide</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Zone Modal */}
            {showAddModal && (
                <div onClick={() => setShowAddModal(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'white', borderRadius: '24px', width: '450px', maxWidth: '90%',
                        overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{
                            padding: '20px 25px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0 }}>Ajouter une zone</h3>
                            <FaTimes onClick={() => setShowAddModal(false)} style={{ cursor: 'pointer', fontSize: '20px' }} />
                        </div>
                        <form onSubmit={handleCreateZone} style={{ padding: '25px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>Nom de la zone</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Casablanca Nord"
                                    value={newZoneName}
                                    onChange={(e) => setNewZoneName(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #e0e0e0', borderRadius: '10px' }}
                                />
                            </div>
                            <button type="submit" style={{
                                width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7367f0, #5e4ee0)',
                                color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600'
                            }}>Ajouter</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZonesTab;