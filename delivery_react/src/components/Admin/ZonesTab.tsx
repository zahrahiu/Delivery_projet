import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaTrash, FaMinus, FaMapMarkedAlt, FaLayerGroup, FaCity, FaTimes } from "react-icons/fa";

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

    // الرابط الموحد عبر الـ Gateway
    const BASE_URL = "http://localhost:8888/tarif-zone-service/api";
    const API_URL = `${BASE_URL}/zones`;
    const VILLES_URL = `${BASE_URL}/tarifs`;

    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const fetchData = async () => {
        try {
            const resZones = await axios.get(API_URL, getAuthHeaders());
            setZones(resZones.data);
            const resVilles = await axios.get(VILLES_URL, getAuthHeaders());
            // تصفية المدن اللي مازال ما تابعة لتا منطقة
            setAvailableVilles(resVilles.data.filter((v: any) => !v.zone_id));
        } catch (err) { console.error("Error fetching data:", err); }
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
            alert("Zone créée ✅");
        } catch (err) { console.error(err); }
    };

    const handleAssign = async (villeId: number) => {
        if (!selectedZone) return;
        try {
            await axios.post(`${API_URL}/assign`, { zoneId: selectedZone.id, villeId }, getAuthHeaders());
            refreshSubTables(selectedZone.id);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleUnassign = async (villeId: number) => {
        if (!selectedZone) return;
        try {
            await axios.post(`${API_URL}/unassign`, { villeId }, getAuthHeaders());
            refreshSubTables(selectedZone.id);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteZone = async (zoneId: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette zone ?")) return;
        try {
            await axios.delete(`${API_URL}/${zoneId}`, getAuthHeaders());
            setZones(zones.filter(z => z.id !== zoneId));
            if (selectedZone?.id === zoneId) setSelectedZone(null);
            alert("Zone supprimée ✅");
        } catch (err) { console.error(err); }
    };

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
                        }}>
                            +{remaining} plus
                        </span>
                        {showVillesPopup === zone.id && (
                            <div className="villes-popover" onClick={(e) => e.stopPropagation()}>
                                <div className="popover-header">
                                    <span>Villes ({villes.length})</span>
                                    <FaTimes onClick={() => setShowVillesPopup(null)} style={{cursor: 'pointer'}}/>
                                </div>
                                <div className="popover-body">
                                    {villes.map((v, i) => (
                                        <div key={i} className="popover-item">
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

    return (
        <div style={{ padding: '40px 60px', minHeight: '100vh', animation: 'slideUp 0.4s ease' }}>
            <div className="management-section">
                <div className="header-flex" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="section-title">
                        Gestion des Zones <span style={{ color: '#7367f0', fontSize: '1rem' }}>({zones.length})</span>
                    </h2>
                    <button className="btn-add" onClick={() => setShowAddModal(true)}>
                        <FaPlus /> Ajouter une zone
                    </button>
                </div>

                <div className="main-table-card">
                    <table className="custom-table">
                        <thead>
                        <tr>
                            <th>NOM DE LA ZONE</th>
                            <th>VILLES ASSOCIÉES</th>
                            <th>STATUT</th>
                            <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody>
                        {zones.map(zone => (
                            <tr key={zone.id} className={selectedZone?.id === zone.id ? "selected-row" : ""}>
                                <td style={{ fontWeight: '600' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaMapMarkedAlt style={{ color: '#7367f0' }} />
                                        <span>{zone.nom_zone}</span>
                                    </div>
                                </td>
                                <td>{renderVillesList(zone)}</td>
                                <td><span className="zone-badge">ACTIVE</span></td>
                                <td className="action-buttons">
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                        <FaPlus className="icon-edit" title="Gérer les villes" onClick={() => { setSelectedZone(zone); refreshSubTables(zone.id); }} />
                                        <FaTrash className="icon-delete" title="Supprimer la zone" onClick={() => handleDeleteZone(zone.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Ajouter une zone</h3>
                                <FaTimes className="close-icon" onClick={() => setShowAddModal(false)} />
                            </div>
                            <form onSubmit={handleCreateZone} className="modal-body">
                                <div className="input-container">
                                    <label>Nom de la zone</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Casablanca Nord"
                                        value={newZoneName}
                                        onChange={(e) => setNewZoneName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="btn-confirm">Ajouter</button>
                            </form>
                        </div>
                    </div>
                )}

                {selectedZone && (
                    <div style={{ display: 'flex', gap: '30px', marginTop: '40px', animation: 'slideUp 0.5s ease' }}>
                        <div className="form-card-clean" style={{ flex: 1 }}>
                            <h3 className="sub-title"><FaLayerGroup style={{ color: '#7367f0' }} /> Villes Disponibles</h3>
                            <div className="small-table-container">
                                <table className="custom-table">
                                    <tbody>
                                    {availableVilles.map(v => (
                                        <tr key={v.id}>
                                            <td><div className="cell-flex"><FaCity style={{ color: '#cbd5e0' }} /> {v.ville}</div></td>
                                            <td style={{ textAlign: 'right' }}><FaPlus className="icon-view" onClick={() => handleAssign(v.id)} /></td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {availableVilles.length === 0 && <p style={{textAlign:'center', color:'#999', padding:'10px'}}>Aucune ville disponible</p>}
                            </div>
                        </div>

                        <div className="form-card-clean" style={{ flex: 1 }}>
                            <h3 className="sub-title">Villes dans {selectedZone.nom_zone}</h3>
                            <div className="small-table-container">
                                <table className="custom-table">
                                    <tbody>
                                    {assignedVilles.map(v => (
                                        <tr key={v.id}>
                                            <td><div className="cell-flex"><FaCity style={{ color: '#7367f0' }} /> {v.ville}</div></td>
                                            <td style={{ textAlign: 'right' }}><FaMinus className="icon-delete" onClick={() => handleUnassign(v.id)} /></td>
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

            <style>{`
                .modal-overlay { background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); }
                .selected-row { background-color: #f0efff !important; border-left: 4px solid #7367f0 !important; }
                .villes-popover { border: none; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
};

export default ZonesTab;