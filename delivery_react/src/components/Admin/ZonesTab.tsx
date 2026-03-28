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

    // State للتحكم في ظهور الـ Popup ديال إضافة منطقة
    const [showAddModal, setShowAddModal] = useState(false);

    const API_URL = "http://localhost:5005/api/zones";
    const VILLES_URL = "http://localhost:5005/api/tarifs";

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return { Authorization: `Bearer ${token}` };
    };

    const fetchData = async () => {
        try {
            const resZones = await axios.get(API_URL, { headers: getAuthHeaders() });
            setZones(resZones.data);
            const resVilles = await axios.get(VILLES_URL, { headers: getAuthHeaders() });
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
            const res = await axios.get(VILLES_URL, { headers: getAuthHeaders() });
            setAvailableVilles(res.data.filter((v: any) => !v.zone_id));
            setAssignedVilles(res.data.filter((v: any) => v.zone_id === zoneId));
        } catch (err) { console.error("Error refreshing tables:", err); }
    };

    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newZoneName) return;
        try {
            await axios.post(API_URL, { nom_zone: newZoneName }, { headers: getAuthHeaders() });
            setNewZoneName("");
            setShowAddModal(false); // سد الـ popup مورا الزيادة
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleAssign = async (villeId: number) => {
        if (!selectedZone) return;
        try {
            await axios.post(`${API_URL}/assign`, { zoneId: selectedZone.id, villeId }, { headers: getAuthHeaders() });
            refreshSubTables(selectedZone.id);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleUnassign = async (villeId: number) => {
        if (!selectedZone) return;
        try {
            await axios.post(`${API_URL}/unassign`, { villeId }, { headers: getAuthHeaders() });
            refreshSubTables(selectedZone.id);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteZone = async (zoneId: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette zone ?")) return;
        try {
            const response = await axios.delete(`${API_URL}/${zoneId}`, { headers: getAuthHeaders() });
            if (response.status === 200) {
                setZones(zones.filter(z => z.id !== zoneId));
                if (selectedZone?.id === zoneId) setSelectedZone(null);
                alert("Supprimé !");
            }
        } catch (err: any) {
            console.error("Erreur:", err.message);
        }
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
                    <h2 className="section-title" style={{ fontSize: '1.5rem', color: '#2d3748' }}>
                        Gestion des Zones <span style={{ color: '#7367f0', fontSize: '1rem' }}>({zones.length})</span>
                    </h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-add" onClick={() => setShowAddModal(true)}>
                            <FaPlus /> Ajouter une zone
                        </button>
                    </div>
                </div>

                <div className="main-table-card">
                    <table className="custom-table" style={{ overflow: 'visible' }}>
                        <thead>
                        <tr>
                            <th>NOM DE LA ZONE</th>
                            <th>VILLES ASSOCIÉES</th>
                            <th>STATUT</th>
                            <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody style={{ overflow: 'visible' }}>
                        {zones.map(zone => (
                            <tr key={zone.id} className={selectedZone?.id === zone.id ? "selected-row" : ""}>
                                <td style={{ fontWeight: '600', padding: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaMapMarkedAlt style={{ color: '#7367f0', flexShrink: 0 }} />
                                        <span>{zone.nom_zone}</span>
                                    </div>
                                </td>
                                <td style={{ overflow: 'visible' }}>{renderVillesList(zone)}</td>
                                <td><span className="zone-badge">ACTIVE</span></td>
                                <td className="action-buttons">
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                        <FaPlus className="icon-edit" title="Gérer les villes" onClick={() => { setSelectedZone(zone); refreshSubTables(zone.id); }} />
                                        <FaTrash className="icon-delete" title="Supprimer la zone" onClick={() => handleDeleteZone(zone.id)} style={{ cursor: 'pointer' }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* --- POPUP (MODAL) لإضافة منطقة جديدة --- */}
                {showAddModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Ajouter une zone</h3>
                                <FaTimes className="close-icon" onClick={() => setShowAddModal(false)} />
                            </div>
                            <form onSubmit={handleCreateZone} className="modal-body">
                                <div className="input-container">
                                    <label>Nom de la zone</label>
                                    <input
                                        type="text"
                                        placeholder="Entrez le nom de la zone..."
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
                            </div>
                        </div>

                        <div className="form-card-clean" style={{ flex: 1 }}>
                            <h3 className="sub-title">Villes dans <span style={{ color: '#7367f0' }}>{selectedZone.nom_zone}</span></h3>
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
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

                .main-table-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); padding: 10px; position: relative; z-index: 1; }
                .custom-table { width: 100%; border-collapse: collapse; }
                .zone-badge { background: #e6fffa; color: #38b2ac; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
                .btn-add { background: #7367f0; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
                .btn-add:hover { background: #5a4cf5; box-shadow: 0 4px 12px rgba(115, 103, 240, 0.3); }

                /* MODAL STYLES */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 99999; animation: fadeIn 0.3s ease; }
                .modal-content { background: white; width: 400px; border-radius: 12px; box-shadow: 0 15px 50px rgba(0,0,0,0.2); animation: zoomIn 0.3s ease; overflow: hidden; }
                .modal-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; }
                .modal-header h3 { margin: 0; font-size: 1.1rem; color: #2d3748; }
                .close-icon { cursor: pointer; color: #a0aec0; transition: 0.2s; }
                .close-icon:hover { color: #f56565; }
                .modal-body { padding: 25px; }
                .input-container { margin-bottom: 20px; }
                .input-container label { display: block; margin-bottom: 8px; font-weight: 600; color: #4a5568; font-size: 0.9rem; }
                .input-container input { width: 100%; padding: 12px; border: 2px solid #edf2f7; border-radius: 8px; outline: none; transition: 0.3s; }
                .input-container input:focus { border-color: #7367f0; }
                .btn-confirm { width: 100%; background: #7367f0; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s; }
                .btn-confirm:hover { background: #5a4cf5; }

                /* REST OF STYLES */
                .villes-popover { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); z-index: 9999; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); border: 1px solid #edf2f7; width: 220px; margin-top: 10px; overflow: hidden; animation: fadeIn 0.2s ease; }
                .popover-header { padding: 10px 12px; background: #f8f9fa; border-bottom: 1px solid #edf2f7; font-size: 0.75rem; display: flex; justify-content: space-between; font-weight: bold; color: #2d3748; }
                .popover-body { max-height: 200px; overflow-y: auto; padding: 5px 0; }
                .popover-item { padding: 10px 15px; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; color: #4a5568; }
                .form-card-clean { background: #fff; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid #f0f0f0; }
                .small-table-container { max-height: 300px; overflow-y: auto; }
                .cell-flex { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
                .selected-row { background-color: #f8f7ff !important; border-left: 4px solid #7367f0 !important; }
                .more-badge { background: #f0f0ff; color: #7367f0; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .more-badge:hover { background: #7367f0; color: white; }
                .sub-title { margin-bottom: 20px; font-size: 1.1rem; color: #4a5568; display: flex; align-items: center; gap: 10px; font-weight: 600; }
            `}</style>
        </div>
    );
};

export default ZonesTab;