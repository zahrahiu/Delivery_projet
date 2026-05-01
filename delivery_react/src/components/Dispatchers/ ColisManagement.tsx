import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import {
    FaPlus, FaEdit, FaTrash, FaBoxOpen,
    FaTruck, FaCheckCircle, FaSearch, FaUserPlus, FaTimes, FaSpinner,
    FaClock, FaBan, FaUndoAlt, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import UpdateColisForm from "./UpdateColisForm";
import "./ColisManagement.css";

interface ColisProps {
    onAddClick?: () => void;
    onEditClick?: (parcel: any) => void;
}

const ColisManagement: React.FC<ColisProps> = ({ onAddClick, onEditClick }) => {
    const [parcels, setParcels] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [livreurs, setLivreurs] = useState<any[]>([]);
    const [allLivreurs, setAllLivreurs] = useState<any[]>([]); // 🔥 Garder tous les livreurs

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Modal d'assignation
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedParcelForAssign, setSelectedParcelForAssign] = useState<any>(null);
    const [selectedDriver, setSelectedDriver] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [filteredLivreursForZone, setFilteredLivreursForZone] = useState<any[]>([]);

    const PARCEL_API = "http://localhost:8888/parcel-service/api/parcels";
    const USERS_API = "http://localhost:8888/users-service/api/profiles";

    const token = localStorage.getItem("token");
    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchParcels = async () => {
        try {
            const res = await axios.get(PARCEL_API, getHeaders());
            setParcels(Array.isArray(res.data) ? res.data : []);
            console.log("Parcels Loaded:", res.data);
        } catch (err) {
            console.error("Error fetching parcels:", err);
        }
    };

    const fetchLivreurs = async () => {
        try {
            const res = await axios.get(USERS_API, getHeaders());
            const allUsers = Array.isArray(res.data) ? res.data : [];
            const livreursOnly = allUsers.filter((u: any) => u.role === "LIVREUR");
            setAllLivreurs(livreursOnly);
            setLivreurs(livreursOnly);
            console.log("Livreurs Loaded:", livreursOnly);
        } catch (err) {
            console.error("Error fetching livreurs:", err);
        }
    };

    useEffect(() => {
        fetchParcels();
        fetchLivreurs();
    }, []);

    // 🔥 Filtrer les livreurs par zone (ville) du colis
    const filterLivreursByZone = (parcelCity: string) => {
        if (!parcelCity) return allLivreurs;
        return allLivreurs.filter(l =>
            l.zone?.toLowerCase() === parcelCity.toLowerCase()
        );
    };

    // 🔥 Calcul des statistiques
    const stats = {
        pending: parcels.filter(p => p.status === 'PENDING').length,
        assigned: parcels.filter(p => p.status === 'ASSIGNED').length,
        inTransit: parcels.filter(p => p.status === 'IN_TRANSIT').length,
        delivered: parcels.filter(p => p.status === 'DELIVERED').length,
        returned: parcels.filter(p => p.status === 'RETURNED').length,
        cancelled: parcels.filter(p => p.status === 'CANCELLED').length,
        total: parcels.length
    };

    // Vérifier si le colis a un livreur assigné
    const isParcelAssigned = (parcel: any): boolean => {
        const idFromParcel =
            (parcel.assignedLivreur && (parcel.assignedLivreur.userId || parcel.assignedLivreur.id)) ||
            (parcel.livreur && (parcel.livreur.userId || parcel.livreur.id)) ||
            parcel.assignedLivreurId ||
            parcel.livreurId;

        return !!idFromParcel && idFromParcel !== null && idFromParcel !== "";
    };

    const getLivreurName = (parcel: any) => {
        const idFromParcel =
            (parcel.assignedLivreur && (parcel.assignedLivreur.userId || parcel.assignedLivreur.id)) ||
            (parcel.livreur && (parcel.livreur.userId || parcel.livreur.id)) ||
            parcel.assignedLivreurId ||
            parcel.livreurId;

        if (!idFromParcel) return <span className="no-livreur">Non assigné</span>;

        const targetId = String(idFromParcel);
        const driver = allLivreurs.find(l => String(l.userId) === targetId);

        if (driver) {
            return (
                <span className="livreur-name-tag">
                    👤 {driver.firstName} {driver.lastName}
                </span>
            );
        }

        return <span className="id-fallback" style={{color: 'orange'}}>ID: {targetId}</span>;
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce colis ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${PARCEL_API}/${id}`, getHeaders());
                setParcels(prev => prev.filter(p => p.id !== id));
                Swal.fire('Supprimé !', '', 'success');
            } catch (err) {
                Swal.fire('Erreur', 'Impossible de supprimer.', 'error');
            }
        }
    };

    const updateStatus = async (parcel: any, newStatus: string) => {
        try {
            await axios.patch(`${PARCEL_API}/${parcel.id}/status?status=${newStatus}`, {}, getHeaders());
            setParcels(prev => prev.map(p => p.id === parcel.id ? { ...p, status: newStatus } : p));

            Swal.fire({
                icon: 'success',
                title: 'Statut mis à jour !',
                toast: true,
                position: 'top-end',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire('Erreur', 'Modification échouée', 'error');
        }
    };

    // 🔥 Fonction d'assignation avec filtre par zone
    const handleAssignClick = (parcel: any) => {
        setSelectedParcelForAssign(parcel);
        setSelectedDriver("");

        // Filtrer les livreurs par la ville du colis
        const parcelCity = parcel.cityName || "";
        const filtered = filterLivreursByZone(parcelCity);
        setFilteredLivreursForZone(filtered);

        setShowAssignModal(true);
    };

    const handleAssignDriver = async () => {
        if (!selectedDriver) {
            Swal.fire('Erreur', 'Veuillez sélectionner un livreur', 'warning');
            return;
        }

        setIsAssigning(true);
        try {
            await axios.patch(
                `${PARCEL_API}/${selectedParcelForAssign.id}/assign/${selectedDriver}`,
                {},
                getHeaders()
            );

            Swal.fire({
                icon: 'success',
                title: 'Assigné !',
                text: `Colis ${selectedParcelForAssign.trackingNumber} assigné au livreur`,
                timer: 2000,
                showConfirmButton: false
            });

            setShowAssignModal(false);
            fetchParcels(); // Rafraîchir la liste
        } catch (err) {
            console.error("Erreur assignation:", err);
            Swal.fire('Erreur', 'Impossible d\'assigner le colis', 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    // 🔥 Filtrer par recherche
    const filteredParcels = parcels.filter(p =>
        p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.senderName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 🔥 Pagination
    const totalPages = Math.ceil(filteredParcels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentParcels = filteredParcels.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleEditClick = (parcel: any) => {
        if (onEditClick) {
            onEditClick(parcel);
        } else {
            setSelectedParcel(parcel);
            setIsEditing(true);
        }
    };

    if (isEditing && selectedParcel && !onEditClick) {
        return (
            <UpdateColisForm
                parcelToEdit={selectedParcel}
                onCancel={() => { setIsEditing(false); setSelectedParcel(null); }}
                onUpdateSuccess={() => { setIsEditing(false); setSelectedParcel(null); fetchParcels(); }}
            />
        );
    }

    return (
        <div className="colis-admin-container">
            {/* Modal d'assignation */}
            {showAssignModal && selectedParcelForAssign && (
                <div className="assign-modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="assign-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="assign-modal-header">
                            <h3>🚚 Assigner un livreur</h3>
                            <button className="assign-close-btn" onClick={() => setShowAssignModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="assign-modal-body">
                            <div className="parcel-info-assign">
                                <p><strong>📦 Colis:</strong> {selectedParcelForAssign.trackingNumber}</p>
                                <p><strong>📍 Adresse:</strong> {selectedParcelForAssign.deliveryAddress}</p>
                                <p><strong>🏙️ Ville:</strong> {selectedParcelForAssign.cityName || "Non spécifiée"}</p>
                            </div>
                            <div className="assign-input-group">
                                <label>Sélectionner un livreur :</label>
                                {filteredLivreursForZone.length === 0 ? (
                                    <div className="no-livreurs-warning">
                                        ⚠️ Aucun livreur disponible pour la ville <strong>{selectedParcelForAssign.cityName}</strong>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedDriver}
                                        onChange={(e) => setSelectedDriver(e.target.value)}
                                        className="assign-select"
                                    >
                                        <option value="">-- Choisir un livreur --</option>
                                        {filteredLivreursForZone.map((livreur) => (
                                            <option key={livreur.userId} value={livreur.userId}>
                                                {livreur.firstName} {livreur.lastName} - 📍 {livreur.zone || "Zone non définie"}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="assign-modal-footer">
                            <button className="assign-cancel-btn" onClick={() => setShowAssignModal(false)}>
                                Annuler
                            </button>
                            <button
                                className="assign-confirm-btn"
                                onClick={handleAssignDriver}
                                disabled={isAssigning || !selectedDriver || filteredLivreursForZone.length === 0}
                            >
                                {isAssigning ? <FaSpinner className="spinner-assign" /> : "✅ Assigner"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="colis-header">
                <h2>📦 Gestion des Colis</h2>
                <button className="btn-add" onClick={onAddClick}>
                    <FaPlus /> Nouveau Colis
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid-new">
                <div className="stat-card-new pending">
                    <div className="stat-icon-new"><FaClock /></div>
                    <div className="stat-info-new">
                        <h3>{stats.pending}</h3>
                        <p>En attente</p>
                    </div>
                </div>
                <div className="stat-card-new assigned">
                    <div className="stat-icon-new"><FaUserPlus /></div>
                    <div className="stat-info-new">
                        <h3>{stats.assigned}</h3>
                        <p>Assignés</p>
                    </div>
                </div>
                <div className="stat-card-new transit">
                    <div className="stat-icon-new"><FaTruck /></div>
                    <div className="stat-info-new">
                        <h3>{stats.inTransit}</h3>
                        <p>En transit</p>
                    </div>
                </div>
                <div className="stat-card-new delivered">
                    <div className="stat-icon-new"><FaCheckCircle /></div>
                    <div className="stat-info-new">
                        <h3>{stats.delivered}</h3>
                        <p>Livrés</p>
                    </div>
                </div>
                <div className="stat-card-new returned">
                    <div className="stat-icon-new"><FaUndoAlt /></div>
                    <div className="stat-info-new">
                        <h3>{stats.returned}</h3>
                        <p>Retournés</p>
                    </div>
                </div>
                <div className="stat-card-new cancelled">
                    <div className="stat-icon-new"><FaBan /></div>
                    <div className="stat-info-new">
                        <h3>{stats.cancelled}</h3>
                        <p>Annulés</p>
                    </div>
                </div>
            </div>

            <div className="search-bar-container shadow-sm">
                <FaSearch className="search-icon" />
                <input
                    placeholder="Rechercher par tracking ou nom de client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-container shadow-sm">
                <table className="custom-table">
                    <thead>
                    <tr>
                        <th>Code Suivi</th>
                        <th>Client</th>
                        <th>Livreur</th>
                        <th>Adresse</th>
                        <th>Poids</th>
                        <th>État</th>
                        <th className="text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentParcels.length > 0 ? (
                        currentParcels.map((p) => {
                            const isAssigned = isParcelAssigned(p);
                            return (
                                <tr key={p.id}>
                                    <td><span className="tracking-code">{p.trackingNumber}</span></td>
                                    <td>{p.senderName}</td>
                                    <td>
                                        <div className="livreur-cell">
                                            <FaTruck className="truck-mini-icon" />
                                            {getLivreurName(p)}
                                        </div>
                                    </td>
                                    <td>{p.deliveryAddress?.substring(0, 50)}...</td>
                                    <td>{p.weight} kg</td>
                                    <td>
                                        <select
                                            className={`status-select-mini ${p.status?.toLowerCase() || ''}`}
                                            value={p.status || 'PENDING'}
                                            onChange={(e) => updateStatus(p, e.target.value)}
                                            disabled={!isAssigned && p.status !== 'PENDING' && p.status !== 'RETURNED'}
                                        >
                                            <option value="PENDING">⌛ En attente</option>
                                            <option value="ASSIGNED">👤 Assigné</option>
                                            <option value="IN_TRANSIT">🚚 En transit</option>
                                            <option value="DELIVERED">✅ Livré</option>
                                            <option value="RETURNED">↩️ Retourné</option>
                                            <option value="CANCELLED">❌ Annulé</option>
                                        </select>
                                    </td>
                                    <td className="text-center">
                                        <div className="action-buttons-group">
                                            {!isAssigned && p.status === 'PENDING' && (
                                                <button
                                                    className="assign-icon-btn"
                                                    onClick={() => handleAssignClick(p)}
                                                    title="Assigner un livreur"
                                                >
                                                    <FaUserPlus />
                                                </button>
                                            )}
                                            <FaEdit
                                                className="edit-icon-btn"
                                                onClick={() => handleEditClick(p)}
                                                title="Modifier"
                                            />
                                            <FaTrash
                                                className="delete-icon-btn"
                                                onClick={() => handleDelete(p.id)}
                                                title="Supprimer"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr><td colSpan={7} className="text-center">Aucun colis trouvé.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* 🔥 Pagination */}
            {totalPages > 1 && (
                <div className="pagination-container-colis">
                    <button
                        className="pagination-btn"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                    >
                        <FaChevronLeft /> Précédent
                    </button>
                    <div className="pagination-pages">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                                onClick={() => goToPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button
                        className="pagination-btn"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                    >
                        Suivant <FaChevronRight />
                    </button>
                </div>
            )}

            <style>{`
                .action-buttons-group {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    align-items: center;
                }
                .assign-icon-btn {
                    background: #7367f0;
                    color: white;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }
                .assign-icon-btn:hover {
                    background: #5e4ee0;
                    transform: scale(1.05);
                }
                
                /* Stats */
                .stats-grid-new {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-card-new {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    border-left: 4px solid;
                }
                .stat-card-new:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .stat-card-new.pending { border-left-color: #f39c12; }
                .stat-card-new.assigned { border-left-color: #3498db; }
                .stat-card-new.transit { border-left-color: #2ecc71; }
                .stat-card-new.delivered { border-left-color: #27ae60; }
                .stat-card-new.returned { border-left-color: #e74c3c; }
                .stat-card-new.cancelled { border-left-color: #95a5a6; }
                
                .stat-icon-new {
                    width: 50px;
                    height: 50px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                .stat-card-new.pending .stat-icon-new { background: #fef3e2; color: #f39c12; }
                .stat-card-new.assigned .stat-icon-new { background: #e3f2fd; color: #3498db; }
                .stat-card-new.transit .stat-icon-new { background: #e8f5e9; color: #2ecc71; }
                .stat-card-new.delivered .stat-icon-new { background: #e8f5e9; color: #27ae60; }
                .stat-card-new.returned .stat-icon-new { background: #fce4ec; color: #e74c3c; }
                .stat-card-new.cancelled .stat-icon-new { background: #ecf0f1; color: #95a5a6; }
                
                .stat-info-new h3 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 800;
                    color: #1a2a3a;
                }
                .stat-info-new p {
                    margin: 5px 0 0;
                    font-size: 12px;
                    color: #A5AEAD;
                }
                
                /* Status select */
                .status-select-mini {
                    padding: 6px 10px;
                    border-radius: 20px;
                    border: 1px solid #ddd;
                    font-size: 12px;
                    cursor: pointer;
                    background: white;
                }
                .status-select-mini.pending { background: #fef3e2; color: #f39c12; border-color: #f39c12; }
                .status-select-mini.assigned { background: #e3f2fd; color: #3498db; border-color: #3498db; }
                .status-select-mini.in_transit { background: #e8f5e9; color: #2ecc71; border-color: #2ecc71; }
                .status-select-mini.delivered { background: #e8f5e9; color: #27ae60; border-color: #27ae60; }
                .status-select-mini.returned { background: #fce4ec; color: #e74c3c; border-color: #e74c3c; }
                .status-select-mini.cancelled { background: #ecf0f1; color: #95a5a6; border-color: #95a5a6; }
                
                /* Pagination */
                .pagination-container-colis {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 15px;
                    margin-top: 30px;
                    padding: 20px 0;
                }
                .pagination-btn {
                    background: #4D5C71;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 30px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                }
                .pagination-btn:hover:not(:disabled) {
                    background: #3b4e61;
                    transform: translateY(-2px);
                }
                .pagination-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .pagination-pages {
                    display: flex;
                    gap: 8px;
                }
                .pagination-page {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    border: 1px solid #E8E0E0;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .pagination-page.active {
                    background: #7367f0;
                    color: white;
                    border-color: #7367f0;
                }
                .pagination-page:hover:not(.active) {
                    background: #FBF4F4;
                    transform: scale(1.05);
                }
                
                /* Modal */
                .assign-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .assign-modal-content {
                    background: white;
                    border-radius: 24px;
                    width: 90%;
                    max-width: 500px;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .assign-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #eee;
                    background: linear-gradient(135deg, #4D5C71, #3b4e61);
                    color: white;
                    border-radius: 24px 24px 0 0;
                }
                .assign-modal-header h3 { margin: 0; }
                .assign-close-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .assign-close-btn:hover { background: rgba(255,255,255,0.4); }
                .assign-modal-body { padding: 24px; }
                .parcel-info-assign {
                    background: #FBF4F4;
                    border-radius: 16px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                .parcel-info-assign p { margin: 8px 0; font-size: 13px; }
                .assign-input-group { display: flex; flex-direction: column; gap: 10px; }
                .assign-input-group label { font-weight: 600; color: #1a2a3a; }
                .assign-select {
                    padding: 12px;
                    border: 1px solid #E8E0E0;
                    border-radius: 12px;
                    font-size: 14px;
                }
                .no-livreurs-warning {
                    background: #fff3cd;
                    color: #856404;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 13px;
                    text-align: center;
                }
                .assign-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 24px;
                    border-top: 1px solid #eee;
                }
                .assign-cancel-btn {
                    background: #A5AEAD;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 30px;
                    cursor: pointer;
                }
                .assign-confirm-btn {
                    background: #7367f0;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .assign-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .spinner-assign { animation: spin 1s linear infinite; }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ColisManagement;