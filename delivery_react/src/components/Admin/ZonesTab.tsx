import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTrash, FaMinus, FaMapMarkedAlt, FaLayerGroup, FaCity, FaTimes, FaSearch, FaGlobe, FaChartBar } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import Swal from 'sweetalert2';
import { useTheme } from "../../context/ThemeContext";

interface Zone {
    id: number;
    nom_zone: string;
    villes_list: string[];
}

interface Ville {
    id: number;
    ville: string;
    zone_id?: number;
}

const ZonesTab: React.FC = () => {
    const { darkMode, toggleTheme } = useTheme();

    const [zones, setZones] = useState<Zone[]>([]);
    const [allVilles, setAllVilles] = useState<Ville[]>([]);
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
        Swal.fire({ icon, title, text, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
    };

    const showConfirmDialog = async (title: string, text: string, confirmText: string) => {
        const result = await Swal.fire({ title, text, icon: 'warning', showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: confirmText, cancelButtonText: 'Annuler' });
        return result.isConfirmed;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const resZones = await axios.get(API_URL, getAuthHeaders());
            setZones(resZones.data);
            const resVilles = await axios.get(VILLES_URL, getAuthHeaders());
            setAllVilles(resVilles.data);
            setAvailableVilles(resVilles.data.filter((v: any) => !v.zone_id));
        } catch (err) {
            showToast('error', 'Erreur', "Impossible de charger les données");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const refreshSubTables = async (zoneId: number) => {
        try {
            const res = await axios.get(VILLES_URL, getAuthHeaders());
            setAvailableVilles(res.data.filter((v: any) => !v.zone_id));
            setAssignedVilles(res.data.filter((v: any) => v.zone_id === zoneId));
        } catch (err) {}
    };

    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newZoneName) return;
        try {
            await axios.post(API_URL, { nom_zone: newZoneName }, getAuthHeaders());
            setNewZoneName(""); setShowAddModal(false); fetchData();
            showToast('success', 'Créée', "Zone créée ✅");
        } catch (err) { showToast('error', 'Erreur', "Impossible de créer la zone"); }
    };

    const handleAssign = async (villeId: number) => {
        if (!selectedZone) return;
        try {
            await axios.post(`${API_URL}/assign`, { zoneId: selectedZone.id, villeId }, getAuthHeaders());
            refreshSubTables(selectedZone.id); fetchData();
            showToast('success', 'Assignée', "Ville assignée ✅");
        } catch (err) { showToast('error', 'Erreur', "Erreur assignation"); }
    };

    const handleUnassign = async (villeId: number) => {
        if (!selectedZone) return;
        try {
            await axios.post(`${API_URL}/unassign`, { villeId }, getAuthHeaders());
            refreshSubTables(selectedZone.id); fetchData();
            showToast('success', 'Retirée', "Ville retirée ✅");
        } catch (err) { showToast('error', 'Erreur', "Erreur retrait"); }
    };

    const handleDeleteZone = async (zoneId: number, zoneName: string) => {
        const confirmed = await showConfirmDialog("Supprimer la zone", `Voulez-vous supprimer ${zoneName} ?`, "Oui, supprimer");
        if (!confirmed) return;
        try {
            await axios.delete(`${API_URL}/${zoneId}`, getAuthHeaders());
            setZones(zones.filter(z => z.id !== zoneId));
            if (selectedZone?.id === zoneId) setSelectedZone(null);
            showToast('success', 'Supprimée', "Zone supprimée ✅");
        } catch (err) { showToast('error', 'Erreur', "Impossible de supprimer"); }
    };

    const filteredZones = zones.filter(z => z.nom_zone.toLowerCase().includes(searchTerm.toLowerCase()));

    // Calculer les stats
    const totalVilles = allVilles.length;
    const villesAssigned = allVilles.filter(v => v.zone_id).length;
    const villesNonAssigned = totalVilles - villesAssigned;
    const zoneAvecPlusVilles = zones.reduce((max, z) => (z.villes_list?.length || 0) > (max.villes_list?.length || 0) ? z : max, zones[0]);

    const renderVillesList = (zone: Zone) => {
        const villes = zone.villes_list || [];
        if (villes.length === 0) return <span style={{ color: '#999', fontSize: '13px' }}>Aucune ville</span>;
        const limit = 3;
        const displayed = villes.slice(0, limit);
        const remaining = villes.length - limit;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', position: 'relative' }}>
                {displayed.map((v, i) => (
                    <span key={i} style={{ background: darkMode ? '#2d2d44' : '#e8eaf6', color: darkMode ? '#a78bfa' : '#3949ab', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>{v}</span>
                ))}
                {remaining > 0 && (
                    <span onClick={(e) => { e.stopPropagation(); setShowVillesPopup(showVillesPopup === zone.id ? null : zone.id); }} style={{ background: darkMode ? '#fb923c' : '#e67e22', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                        +{remaining} ville{remaining > 1 ? 's' : ''}
                    </span>
                )}
                {showVillesPopup === zone.id && (
                    <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, background: darkMode ? '#1a1a2e' : 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '12px', zIndex: 100, border: `1px solid ${darkMode ? '#2d2d44' : '#e0e0e0'}`, marginTop: '8px', minWidth: '180px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#eee'}`, paddingBottom: '8px' }}>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: darkMode ? '#eaeef2' : '#333' }}>Toutes les villes ({villes.length})</span>
                            <FaTimes onClick={() => setShowVillesPopup(null)} style={{ cursor: 'pointer', color: '#999', fontSize: '12px' }} />
                        </div>
                        {villes.map((v, i) => <div key={i} style={{ padding: '6px 8px', fontSize: '13px', color: darkMode ? '#cbd5e1' : '#333', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '6px' }}><FaCity size={10} style={{ color: darkMode ? '#a78bfa' : '#7367f0' }} />{v}</div>)}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0f0f1a' : '#f5f7fb' }}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
                <main style={{ flex: 1 }}><TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} darkMode={darkMode} toggleTheme={toggleTheme} user={{ firstName: 'Admin', lastName: '' }} />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: darkMode ? '#eaeef2' : '#333' }}>Chargement...</div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0f0f1a' : '#f5f7fb' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} darkMode={darkMode} toggleTheme={toggleTheme} user={{ firstName: 'Admin', lastName: '' }} />
                <div style={{ padding: '30px' }}>



                    {/* Zone Table */}
                    <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', overflow: 'hidden', border: `1px solid ${darkMode ? '#2d2d44' : '#e67e2220'}` }}>
                        <div style={{ padding: '18px 24px', background: darkMode ? '#2d2d44' : 'linear-gradient(135deg, #e67e2215, white)', borderBottom: `3px solid ${darkMode ? '#fb923c' : '#e67e22'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: darkMode ? '#fb923c' : '#e67e22', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><FaMapMarkedAlt size={20} /></div>
                                <div><h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: darkMode ? '#eaeef2' : '#333' }}>🗺️ Gestion des Zones</h3><p style={{ margin: '5px 0 0', color: darkMode ? '#8b92a5' : '#666', fontSize: '0.85rem' }}>{zones.length} zone(s) enregistrée(s)</p></div>
                            </div>
                            <button onClick={() => setShowAddModal(true)} style={{ background: darkMode ? '#fb923c' : '#e67e22', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><FaPlus /> Ajouter une zone</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '20px', maxWidth: '400px', position: 'relative' }}>
                                <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                <input type="text" placeholder="Rechercher une zone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 15px 12px 45px', border: `1px solid ${darkMode ? '#3d3d5c' : '#e0e0e0'}`, borderRadius: '12px', fontSize: '14px', background: darkMode ? '#1a1a2e' : 'white', color: darkMode ? '#eaeef2' : '#333' }} />
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#eee'}` }}>
                                        <th style={{ padding: '16px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555', width: '30%' }}>📍 NOM DE LA ZONE</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: darkMode ? '#8b92a5' : '#555', width: '45%' }}>🏙️ VILLES ASSOCIÉES</th>
                                        <th style={{ padding: '16px', textAlign: 'center', color: darkMode ? '#8b92a5' : '#555', width: '25%' }}>⚡ ACTIONS</th>
                                    </tr></thead>
                                    <tbody>
                                    {filteredZones.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: '50px', color: '#999' }}>🔍 Aucune zone trouvée</td></tr> :
                                        filteredZones.map(zone => (
                                            <tr key={zone.id} style={{ borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#f0f0f0'}`, background: selectedZone?.id === zone.id ? (darkMode ? '#2d2d44' : '#f5f0ff') : 'transparent', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '16px', fontWeight: '600' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ background: darkMode ? '#fb923c' : '#e67e22', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px' }}><FaMapMarkedAlt /></div>
                                                        <span style={{ color: darkMode ? '#eaeef2' : '#333', fontSize: '15px' }}>{zone.nom_zone}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', position: 'relative' }}>{renderVillesList(zone)}</td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                                        <button onClick={() => { setSelectedZone(zone); refreshSubTables(zone.id); }} style={{ background: darkMode ? '#1a3a2a' : '#e8f5e9', color: darkMode ? '#4ade80' : '#2e7d32', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500' }}><FaPlus size={10} /> Gérer</button>
                                                        <button onClick={() => handleDeleteZone(zone.id, zone.nom_zone)} style={{ background: darkMode ? '#3a1a1a' : '#fce4ec', color: darkMode ? '#f87171' : '#c62828', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500' }}><FaTrash size={10} /> Suppr.</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Assign/Unassign Panels */}
                    {selectedZone && (
                        <div style={{ display: 'flex', gap: '30px', marginTop: '30px' }}>
                            <div style={{ flex: 1, background: darkMode ? '#16213e' : 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', border: `1px solid ${darkMode ? '#2d2d44' : '#edf2f7'}` }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: darkMode ? '#eaeef2' : '#333' }}><FaLayerGroup style={{ color: '#4caf50' }} /> Villes Disponibles ({availableVilles.length})</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {availableVilles.length === 0 ? <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>✅ Toutes les villes sont assignées</p> :
                                        availableVilles.map(v => (
                                            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#f0f0f0'}`, color: darkMode ? '#cbd5e1' : '#333', borderRadius: '8px', transition: 'background 0.2s' }}
                                                 onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f5f5f5'}
                                                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                <span><FaCity style={{ marginRight: '10px', color: darkMode ? '#6b7280' : '#cbd5e0' }} />{v.ville}</span>
                                                <FaPlus onClick={() => handleAssign(v.id)} style={{ cursor: 'pointer', color: darkMode ? '#4ade80' : '#4caf50', fontSize: '30px', padding: '8px' }} title="Assigner" />                                            </div>
                                        ))}
                                </div>
                            </div>
                            <div style={{ flex: 1, background: darkMode ? '#16213e' : 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', border: `1px solid ${darkMode ? '#2d2d44' : '#edf2f7'}` }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px', color: darkMode ? '#eaeef2' : '#333' }}>📍 {selectedZone.nom_zone} ({assignedVilles.length} ville{assignedVilles.length > 1 ? 's' : ''})</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {assignedVilles.length === 0 ? <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>📭 Zone vide</p> :
                                        assignedVilles.map(v => (
                                            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#f0f0f0'}`, color: darkMode ? '#cbd5e1' : '#333', borderRadius: '8px', transition: 'background 0.2s' }}
                                                 onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f5f5f5'}
                                                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                <span><FaCity style={{ marginRight: '10px', color: darkMode ? '#a78bfa' : '#7367f0' }} />{v.ville}</span>
                                                <FaMinus onClick={() => handleUnassign(v.id)} style={{ cursor: 'pointer', color: darkMode ? '#f87171' : '#f44336', fontSize: '30px', padding: '8px' }} title="Retirer" />                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Zone Modal */}
            {showAddModal && (
                <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: darkMode ? '#1a1a2e' : 'white', borderRadius: '24px', width: '450px', maxWidth: '90%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '20px 25px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Ajouter une zone</h3>
                            <FaTimes onClick={() => setShowAddModal(false)} style={{ cursor: 'pointer', fontSize: '20px' }} />
                        </div>
                        <form onSubmit={handleCreateZone} style={{ padding: '25px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: darkMode ? '#a0aec0' : '#4a5568' }}>Nom de la zone</label>
                                <input type="text" placeholder="Ex: Casablanca Nord" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} required style={{ width: '100%', padding: '12px 15px', border: `1px solid ${darkMode ? '#3d3d5c' : '#e0e0e0'}`, borderRadius: '10px', background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#eaeef2' : '#333' }} />
                            </div>
                            <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7367f0, #5e4ee0)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Ajouter</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZonesTab;