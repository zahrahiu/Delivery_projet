import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import {
    FaPlus, FaEdit, FaTrash, FaBoxOpen,
    FaTruck, FaCheckCircle, FaSearch, FaUserPlus, FaTimes, FaSpinner,
    FaClock, FaBan, FaUndoAlt, FaChevronLeft, FaChevronRight,
    FaFileExcel, FaFilter
} from "react-icons/fa";
import UpdateColisForm from "./UpdateColisForm";
import "./ColisManagement.css";

interface ColisProps {
    onAddClick?: () => void;
    onEditClick?: (parcel: any) => void;
}

interface LivreurWithStats {
    userId: number;
    firstName: string;
    lastName: string;
    phone: string;
    zone: string;
    vehicleType: string;
    totalParcels: number;
    pendingCount: number;
    inTransitCount: number;
    deliveredCount: number;
    status: "free" | "busy" | "full";
}

const ColisManagement: React.FC<ColisProps> = ({ onAddClick, onEditClick }) => {
    const [parcels, setParcels] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [livreurs, setLivreurs] = useState<any[]>([]);
    const [allLivreurs, setAllLivreurs] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [allParcelsForStats, setAllParcelsForStats] = useState<any[]>([]);

    const [filterUnassigned, setFilterUnassigned] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedParcelForAssign, setSelectedParcelForAssign] = useState<any>(null);
    const [selectedDriver, setSelectedDriver] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [filteredLivreursForZone, setFilteredLivreursForZone] = useState<LivreurWithStats[]>([]);

    const PARCEL_API = "http://localhost:8888/parcel-service/api/parcels";
    const USERS_API = "http://localhost:8888/users-service/api/profiles";
    const ZONES_API = "http://localhost:8888/tarif-zone-service/api/zones";

    const token = localStorage.getItem("token");
    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchParcels = async () => {
        try {
            const res = await axios.get(PARCEL_API, getHeaders());
            const parcelsData = Array.isArray(res.data) ? res.data : [];
            setParcels(parcelsData);
            setAllParcelsForStats(parcelsData);
            console.log("Parcels Loaded:", parcelsData);
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

    const fetchZones = async () => {
        try {
            const res = await axios.get(ZONES_API, getHeaders());
            setZones(Array.isArray(res.data) ? res.data : []);
            console.log("Zones Loaded:", res.data);
        } catch (err) {
            console.error("Error fetching zones:", err);
        }
    };

    useEffect(() => {
        fetchParcels();
        fetchLivreurs();
        fetchZones();
    }, []);

    // 🔥 إضافة مستمع للأحداث من Incidents
    useEffect(() => {
        const handleParcelsUpdate = () => {
            console.log("🔄 Refreshing parcels after incident update...");
            fetchParcels();
        };

        window.addEventListener('parcelsUpdated', handleParcelsUpdate);

        return () => {
            window.removeEventListener('parcelsUpdated', handleParcelsUpdate);
        };
    }, []);

    const getZoneCities = (cityName: string): string[] => {
        if (!cityName || zones.length === 0) return [cityName];

        const foundZone = zones.find((z: any) => {
            if (!z.villes_list || z.villes_list.length === 0) return false;
            return z.villes_list.some((ville: string) =>
                ville.toLowerCase() === cityName.toLowerCase()
            );
        });

        if (foundZone && foundZone.villes_list) {
            console.log(`📍 Zone: ${foundZone.nom_zone}, Cities:`, foundZone.villes_list);
            return foundZone.villes_list;
        }

        return [cityName];
    };

    const getFilteredLivreursWithStats = (parcelCity: string): LivreurWithStats[] => {
        if (!parcelCity) return [];

        const zoneCities = getZoneCities(parcelCity);
        const zoneCitiesLower = zoneCities.map(c => c.toLowerCase());

        const livreursInZone = allLivreurs.filter(l => {
            const livreurCity = (l.zone || l.city || "").toLowerCase();
            return zoneCitiesLower.includes(livreurCity);
        });

        return livreursInZone.map((l: any) => {
            const livreurParcels = allParcelsForStats.filter(p =>
                String(p.assignedLivreurId || p.livreurId || p.assignedLivreur?.userId) === String(l.userId)
            );

            const totalParcels = livreurParcels.length;
            const pendingCount = livreurParcels.filter(p =>
                p.status === 'PENDING' || p.status === 'ASSIGNED'
            ).length;
            const inTransitCount = livreurParcels.filter(p =>
                p.status === 'IN_TRANSIT'
            ).length;
            const deliveredCount = livreurParcels.filter(p =>
                p.status === 'DELIVERED'
            ).length;

            let status: "free" | "busy" | "full" = "free";
            if (inTransitCount >= 3) {
                status = "full";
            } else if (pendingCount > 0 || inTransitCount > 0) {
                status = "busy";
            }

            return {
                userId: l.userId,
                firstName: l.firstName,
                lastName: l.lastName,
                phone: l.phone,
                zone: l.zone || l.city,
                vehicleType: l.vehicleType || "Moto",
                totalParcels,
                pendingCount,
                inTransitCount,
                deliveredCount,
                status
            };
        }).sort((a, b) => {
            const aIsSameCity = (a.zone || "").toLowerCase() === parcelCity.toLowerCase();
            const bIsSameCity = (b.zone || "").toLowerCase() === parcelCity.toLowerCase();
            if (aIsSameCity && !bIsSameCity) return -1;
            if (!aIsSameCity && bIsSameCity) return 1;
            const order = { free: 0, busy: 1, full: 2 };
            return order[a.status] - order[b.status];
        });
    };

    const hasLivreur = (parcel: any): boolean => {
        const livreurId = parcel.assignedLivreurId ||
            parcel.livreurId ||
            parcel.assignedLivreur?.userId ||
            parcel.livreur?.userId;
        return livreurId !== null &&
            livreurId !== undefined &&
            livreurId !== "null" &&
            livreurId !== "";
    };

    const stats = {
        pending: parcels.filter(p => !hasLivreur(p) || p.status === 'PENDING').length,
        assigned: parcels.filter(p => hasLivreur(p) && p.status === 'ASSIGNED').length,
        inTransit: parcels.filter(p => p.status === 'IN_TRANSIT').length,
        delivered: parcels.filter(p => p.status === 'DELIVERED').length,
        returned: parcels.filter(p => p.status === 'RETURNED').length,
        cancelled: parcels.filter(p => p.status === 'CANCELLED').length,
        total: parcels.length
    };

    const isParcelAssigned = (parcel: any): boolean => {
        const idFromParcel = parcel.assignedLivreurId ||
            parcel.livreurId ||
            parcel.assignedLivreur?.userId ||
            parcel.livreur?.userId;

        return idFromParcel !== null &&
            idFromParcel !== undefined &&
            idFromParcel !== "null" &&
            idFromParcel !== "";
    };

    // 🔥 دالة getLivreurName المصححة
    const getLivreurName = (parcel: any) => {
        const livreurId = parcel.assignedLivreurId ||
            parcel.livreurId ||
            parcel.assignedLivreur?.userId ||
            parcel.livreur?.userId;

        if (!livreurId || livreurId === "null" || livreurId === "undefined" || livreurId === "") {
            return <span className="no-livreur">Non assigné</span>;
        }

        const driver = allLivreurs.find(l => String(l.userId) === String(livreurId));

        if (driver) {
            return (
                <span className="livreur-name-tag">
                    👤 {driver.firstName} {driver.lastName}
                </span>
            );
        }

        return <span className="no-livreur">Non assigné</span>;
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

    // 🔥 دالة getStatusBadge المصححة
    const getStatusBadge = (parcel: any) => {
        const status = parcel.status || 'PENDING';
        const livreurId = parcel.assignedLivreurId ||
            parcel.livreurId ||
            parcel.assignedLivreur?.userId ||
            parcel.livreur?.userId;

        const hasLivreur = livreurId !== null &&
            livreurId !== undefined &&
            livreurId !== "null" &&
            livreurId !== "";

        // إذا ماعندوش livreur → En attente
        if (!hasLivreur) {
            return <span className="status-badge pending">⌛ En attente</span>;
        }

        switch (status) {
            case 'PENDING':
                return <span className="status-badge pending">⌛ En attente</span>;
            case 'ASSIGNED':
                return <span className="status-badge assigned">👤 Assigné</span>;
            case 'IN_TRANSIT':
                return <span className="status-badge in_transit">🚚 En transit</span>;
            case 'DELIVERED':
                return <span className="status-badge delivered">✅ Livré</span>;
            case 'RETURNED':
                return <span className="status-badge returned">↩️ Retourné</span>;
            case 'CANCELLED':
                return <span className="status-badge cancelled">❌ Annulé</span>;
            default:
                return <span className="status-badge pending">⌛ En attente</span>;
        }
    };

    const handleAssignClick = async (parcel: any) => {
        setSelectedParcelForAssign(parcel);
        setSelectedDriver("");
        const livreursWithStats = getFilteredLivreursWithStats(parcel.cityName || "");
        setFilteredLivreursForZone(livreursWithStats);
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

            await axios.patch(
                `${PARCEL_API}/${selectedParcelForAssign.id}/status?status=ASSIGNED`,
                {},
                getHeaders()
            );

            await fetchParcels();

            Swal.fire({
                icon: 'success',
                title: '✅ Colis Assigné !',
                text: `Le colis ${selectedParcelForAssign.trackingNumber} est maintenant assigné.\nStatut: ASSIGNED`,
                timer: 2000,
                showConfirmButton: false
            });

            setShowAssignModal(false);

        } catch (err) {
            console.error("Erreur assignation:", err);
            Swal.fire('Erreur', 'Impossible d\'assigner le colis', 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    const exportToExcel = () => {
        const exportData = filteredParcels.map(p => ({
            'Code Suivi': p.trackingNumber,
            'Client': p.senderName,
            'Livreur': getLivreurNameString(p),
            'Adresse': p.deliveryAddress,
            'Poids (kg)': p.weight,
            'État': getStatusText(p.status),
            'Ville': p.cityName || '',
            'Date création': p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : ''
        }));

        if (exportData.length === 0) {
            Swal.fire('Info', 'Aucune donnée à exporter', 'info');
            return;
        }

        const headers = Object.keys(exportData[0] || {});
        const csvRows = [];
        csvRows.push(headers.join(';'));

        for (const row of exportData) {
            const values = headers.map(header => {
                const value = row[header as keyof typeof row] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(';'));
        }

        const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `colis_${new Date().toLocaleDateString('fr-FR')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: 'Export terminé',
            text: `${exportData.length} colis exportés vers Excel`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    const getStatusText = (status: string): string => {
        switch(status) {
            case 'PENDING': return 'En attente';
            case 'ASSIGNED': return 'Assigné';
            case 'IN_TRANSIT': return 'En transit';
            case 'DELIVERED': return 'Livré';
            case 'RETURNED': return 'Retourné';
            case 'CANCELLED': return 'Annulé';
            default: return status;
        }
    };

    const getLivreurNameString = (parcel: any): string => {
        const idFromParcel = parcel.assignedLivreurId ||
            parcel.livreurId ||
            parcel.assignedLivreur?.userId ||
            parcel.livreur?.userId;

        if (!idFromParcel || idFromParcel === null || idFromParcel === "null" || idFromParcel === "") {
            return "Non assigné";
        }

        const targetId = String(idFromParcel);
        const driver = allLivreurs.find(l => String(l.userId) === targetId);

        if (driver) {
            return `${driver.firstName} ${driver.lastName}`;
        }

        return "Non assigné";
    };

    const filteredParcels = parcels.filter(p => {
        const matchesSearch = p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.senderName?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterUnassigned) {
            const isAssigned = isParcelAssigned(p);
            return !isAssigned;
        }

        return true;
    });

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
            {showAssignModal && selectedParcelForAssign && (
                <div className="assign-modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="assign-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
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
                                        ⚠️ Aucun livreur disponible pour cette zone
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            value={selectedDriver}
                                            onChange={(e) => setSelectedDriver(e.target.value)}
                                            className="assign-select"
                                            style={{ marginBottom: '10px' }}
                                        >
                                            <option value="">-- Choisir un livreur --</option>
                                            {filteredLivreursForZone.map((livreur) => (
                                                <option key={livreur.userId} value={livreur.userId}>
                                                    {livreur.firstName} {livreur.lastName} - 📍 {livreur.zone}
                                                    {' | '}
                                                    {livreur.totalParcels > 0 ? `📦 ${livreur.totalParcels} colis` : '📦 Aucun colis'}
                                                    {livreur.pendingCount > 0 ? ` (${livreur.pendingCount} en attente)` : ''}
                                                    {livreur.inTransitCount > 0 ? ` | 🚚 ${livreur.inTransitCount} en cours` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="drivers-stats-row">
                                            <div className="stat-badge free">🟢 Libres: {filteredLivreursForZone.filter(d => d.status === 'free').length}</div>
                                            <div className="stat-badge busy">🟡 En cours: {filteredLivreursForZone.filter(d => d.status === 'busy').length}</div>
                                            <div className="stat-badge full">🔴 Complets: {filteredLivreursForZone.filter(d => d.status === 'full').length}</div>
                                        </div>
                                    </>
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
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-excel" onClick={exportToExcel} style={{
                        background: '#1e7e34',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 500
                    }}>
                        <FaFileExcel /> Export Excel
                    </button>
                    <button className="btn-add" onClick={onAddClick}>
                        <FaPlus /> Nouveau Colis
                    </button>
                </div>
            </div>

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

            <div className="search-bar-container shadow-sm" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <FaSearch className="search-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        placeholder="Rechercher par tracking ou nom de client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>

                <button
                    onClick={() => setFilterUnassigned(!filterUnassigned)}
                    className={`filter-unassigned-btn ${filterUnassigned ? 'active' : ''}`}
                    style={{
                        background: filterUnassigned ? '#7367f0' : '#f0f0f0',
                        color: filterUnassigned ? 'white' : '#4D5C71',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 500,
                        transition: 'all 0.3s'
                    }}
                >
                    <FaFilter /> Non assignés {filterUnassigned && `(${filteredParcels.length})`}
                </button>
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
                            const showAssignButton = !isAssigned && p.status !== 'DELIVERED' && p.status !== 'CANCELLED' && p.status !== 'RETURNED';
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
                                    <td>{getStatusBadge(p)}</td>
                                    <td className="text-center">
                                        <div className="action-buttons-group">
                                            {showAssignButton && (
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
                        <tr><td colSpan={7} className="text-center">Aucun colis trouvé.诊</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination-container-colis">
                    <button className="pagination-btn" onClick={prevPage} disabled={currentPage === 1}>
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
                    <button className="pagination-btn" onClick={nextPage} disabled={currentPage === totalPages}>
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
                .btn-excel:hover {
                    background: #155a29;
                    transform: scale(1.02);
                }
                .filter-unassigned-btn {
                    transition: all 0.3s;
                }
                .filter-unassigned-btn:hover:not(.active) {
                    background: #e0e0e0;
                    transform: scale(1.02);
                }
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
                .status-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-block;
                }
                .status-badge.pending { background: #fef3e2; color: #f39c12; }
                .status-badge.assigned { background: #e3f2fd; color: #3498db; }
                .status-badge.in_transit { background: #e8f5e9; color: #2ecc71; }
                .status-badge.delivered { background: #e8f5e9; color: #27ae60; }
                .status-badge.returned { background: #fce4ec; color: #e74c3c; }
                .status-badge.cancelled { background: #ecf0f1; color: #95a5a6; }
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
                    max-width: 550px;
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
                .drivers-stats-row {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 10px;
                }
                .stat-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    background: #f0f0f0;
                }
                .stat-badge.free { background: #e8f5e9; color: #2e7d32; }
                .stat-badge.busy { background: #fff3e0; color: #e65100; }
                .stat-badge.full { background: #ffebee; color: #c62828; }
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