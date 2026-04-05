import React, {useState, useEffect} from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import {FaPlus, FaEdit, FaTrash, FaBoxOpen, FaTruck, FaCheckCircle, FaSearch} from "react-icons/fa";
import UpdateColisForm from "./UpdateColisForm";
import "./ColisManagement.css";

interface ColisProps {
    onAddClick?: () => void;
}

const ColisManagement: React.FC<ColisProps> = ({onAddClick}) => {
    const [parcels, setParcels] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [showLivreurModal, setShowLivreurModal] = useState(false);
    const [livreurs, setLivreurs] = useState<any[]>([]);

    const API_URL = "http://localhost:8888/parcel-service/api/parcels";
    const token = localStorage.getItem("token");

    const fetchParcels = async () => {
        try {
            const res = await axios.get(API_URL, {
                headers: {Authorization: `Bearer ${token}`}
            });
            setParcels(res.data);
        } catch (err) {
            console.error("Error fetching parcels", err);
        }
    };

    useEffect(() => {
        fetchParcels();
    }, []);

    const handleDelete = async (id: number) => {
        Swal.fire({
            title: 'Supprimer ce colis ?',
            text: "Cette action est irréversible !",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_URL}/${id}`, {
                        headers: {Authorization: `Bearer ${token}`}
                    });
                    setParcels(parcels.filter(p => p.id !== id));
                    Swal.fire('Supprimé !', 'Le colis a été supprimé.', 'success');
                } catch (err) {
                    Swal.fire('Erreur', 'Impossible de supprimer le colis.', 'error');
                }
            }
        });
    };

    const filteredParcels = parcels.filter(p =>
        p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.senderName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchLivreurs = async () => {
        try {
            const res = await axios.get("http://localhost:8888/users-service/api/profiles", {
                headers: {Authorization: `Bearer ${token}`}
            });
            setLivreurs(res.data.filter((u: any) => u.role === "LIVREUR"));
        } catch (err) {
            console.error("Error fetching livreurs", err);
        }
    };

    const handleAssignLivreur = async (parcel: any, livreurId: string) => {
        try {
            const token = localStorage.getItem("token");

            // التعديل هنا: استخدام Gateway (8888) مع اسم الخدمة delivery-service
            const url = `http://localhost:8888/delivery-service/deliveries/${parcel.trackingNumber}/assign`;

            await axios.post(url,
                {livreurId: livreurId},
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            );
            await updateStatus(parcel, "ASSIGNED");

            Swal.fire('Assigné !', 'Le colis a été attribué via Delivery Service.', 'success');
            setShowLivreurModal(false);
            fetchParcels();
        } catch (err) {
            console.error("Erreur assignation:", err);
            Swal.fire('Erreur', "Échec de l'assignation dans le Delivery Service", 'error');
        }
    };

    useEffect(() => {
        fetchParcels();
        fetchLivreurs();
    }, []);

    const updateStatus = async (parcel: any, newStatus: string) => {
        if (!parcel || !parcel.id) {
            console.error("ID du colis est introuvable !");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const payload = {
                weight: parcel.weight,
                deliveryAddress: parcel.deliveryAddress,
                zoneId: parcel.zoneId,
                senderId: parcel.senderId,
                senderName: parcel.senderName,
                senderPhone: parcel.senderPhone,
                clientEmail: parcel.clientEmail || parcel.senderEmail,
                status: newStatus
            };

            await axios.put(`${API_URL}/${parcel.id}`, payload, {
                headers: {Authorization: `Bearer ${token}`}
            });

            setParcels(prev => prev.map(p => p.id === parcel.id ? {...p, status: newStatus} : p));

            Swal.fire({
                icon: 'success',
                title: 'Statut mis à jour ! ✅',
                toast: true,
                position: 'top-end',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Erreur updateStatus:", err);
            Swal.fire('Erreur', 'Impossible de modifier le statut', 'error');
        }
    };

    if (isEditing && selectedParcel) {
        return (
            <UpdateColisForm
                parcelToEdit={selectedParcel}
                onCancel={() => {
                    setIsEditing(false);
                    setSelectedParcel(null);
                }}
                onUpdateSuccess={() => {
                    setIsEditing(false);
                    setSelectedParcel(null);
                    fetchParcels();
                }}
            />
        );
    }

    return (
        <div className="colis-admin-container">
            <div className="colis-header">
                <div className="header-title">
                    <h2>📦 Gestion des Colis</h2>
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <FaPlus/> Nouveau Colis
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon pending"><FaBoxOpen/></div>
                    <div className="stat-info">
                        <h3>{parcels.filter(p => p.status === 'PENDING').length}</h3>
                        <p>En attente</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon transit"><FaTruck/></div>
                    <div className="stat-info">
                        <h3>{parcels.filter(p => p.status === 'IN_TRANSIT' || p.status === 'ASSIGNED').length}</h3>
                        <p>En cours / Assignés</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon delivered"><FaCheckCircle/></div>
                    <div className="stat-info">
                        <h3>{parcels.filter(p => p.status === 'DELIVERED').length}</h3>
                        <p>Livrés</p>
                    </div>
                </div>
            </div>

            <div className="search-bar-container shadow-sm">
                <FaSearch className="search-icon"/>
                <input
                    placeholder="Rechercher par code de suivi ou expéditeur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-container shadow-sm">
                <table>
                    <thead>
                    <tr>
                        <th>Code Suivi</th>
                        <th>Expéditeur</th>
                        <th>Adresse Client</th>
                        <th>Poids</th>
                        <th>État</th>
                        <th className="text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredParcels.length > 0 ? (
                        filteredParcels.map((p) => (
                            <tr key={p.id}>
                                <td><span className="tracking">{p.trackingNumber || `ID: ${p.id}`}</span></td>
                                <td>{p.senderName || "Non spécifié"}</td>
                                <td>{p.deliveryAddress}</td>
                                <td>{p.weight} kg</td>
                                <td>
                                    <select
                                        className={`status-select-mini ${p.status}`}
                                        value={p.status}
                                        onChange={(e) => updateStatus(p, e.target.value)}
                                    >
                                        <option value="PENDING">⌛ En attente</option>
                                        <option value="ASSIGNED">👤 Assigné</option>
                                        <option value="IN_TRANSIT">🚚 En cours</option>
                                        <option value="DELIVERED">✅ Livré</option>
                                        <option value="RETURNED">🔄 Retourné</option>
                                        <option value="CANCELLED">❌ Annulé</option>
                                    </select>
                                </td>
                                <td className="text-center">
                                    <FaTruck
                                        className="assign-icon"
                                        style={{color: '#27ae60', cursor: 'pointer', marginRight: '10px'}}
                                        title="Assigner un livreur"
                                        onClick={() => {
                                            setSelectedParcel(p);
                                            setShowLivreurModal(true);
                                        }}
                                    />
                                    <FaEdit
                                        className="edit-icon"
                                        title="Modifier"
                                        onClick={() => {
                                            setSelectedParcel(p);
                                            setIsEditing(true);
                                        }}
                                    />
                                    <FaTrash
                                        className="delete-icon"
                                        title="Supprimer"
                                        onClick={() => handleDelete(p.id)}
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="text-center">Aucun colis trouvé.</td>
                        </tr>
                    )}
                    </tbody>
                </table>

                {showLivreurModal && (
                    <div className="modal-overlay">
                        <div className="modal-content-small">
                            <h3>Assigner un livreur</h3>
                            <p>Colis: {selectedParcel?.trackingNumber || selectedParcel?.id}</p>
                            <div className="livreurs-list-mini">
                                {livreurs.map(l => (
                                    <div key={l.userId} className="livreur-item-select" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '10px',
                                        padding: '5px',
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        <span>{l.firstName} {l.lastName}</span>
                                        <button
                                            className="btn-select"
                                            onClick={() => handleAssignLivreur(selectedParcel, l.userId)}
                                            style={{
                                                backgroundColor: '#27ae60',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                padding: '5px 10px'
                                            }}
                                        >
                                            Choisir
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-close" onClick={() => setShowLivreurModal(false)}
                                    style={{marginTop: '15px'}}>
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColisManagement;