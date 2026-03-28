import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaPlus, FaEdit, FaTrash, FaBoxOpen, FaTruck, FaCheckCircle, FaSearch } from "react-icons/fa";
import UpdateColisForm from "./UpdateColisForm"; // تأكدي من استيراد المكون الجديد
import "./ColisManagement.css";

interface ColisProps {
    onAddClick?: () => void;
}

const ColisManagement: React.FC<ColisProps> = ({ onAddClick }) => {
    const [parcels, setParcels] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<any>(null);

    const API_URL = "http://localhost:8082/api/parcels";
    const token = localStorage.getItem("token");

    // دالة جلب البيانات
    const fetchParcels = async () => {
        try {
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setParcels(res.data);
        } catch (err) {
            console.error("Error fetching parcels", err);
        }
    };

    useEffect(() => {
        fetchParcels();
    }, []);

    // دالة الحذف
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
                        headers: { Authorization: `Bearer ${token}` }
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

    const updateStatus = async (parcel: any, newStatus: string) => {
        // ⚠️ تأكدي أن id كاين قبل ما تبداي
        if (!parcel || !parcel.id) {
            console.error("ID du colis est introuvable !");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // صيفطي كاع البيانات اللي كيتسناها الـ ParcelRequestDTO
            const payload = {
                weight: parcel.weight,
                deliveryAddress: parcel.deliveryAddress,
                zoneId: parcel.zoneId,
                senderId: parcel.senderId,
                senderName: parcel.senderName,
                senderPhone: parcel.senderPhone,
                clientEmail: parcel.clientEmail || parcel.senderEmail, // تأكدي من السمية
                status: newStatus
            };

            // استعمال الـ PUT اللي ديجا جربناه وخدام
            await axios.put(`${API_URL}/${parcel.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // تحديث الـ State باش يبان التغيير فالحين
            setParcels(prev => prev.map(p => p.id === parcel.id ? { ...p, status: newStatus } : p));

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

    // --- المنطق الخاص بالعرض الشرطي ---
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
                    fetchParcels(); // تحديث الجدول بعد النجاح
                }}
            />
        );
    }

    return (
        <div className="colis-admin-container">
            <div className="colis-header">
                <div className="header-title">
                    <h2>📦 Gestion des Colis</h2>
                    <p>Système Qrib Lik - Master PFE</p>
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <FaPlus /> Nouveau Colis
                </button>
            </div>

            {/* الإحصائيات */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon pending"><FaBoxOpen /></div>
                    <div className="stat-info">
                        <h3>{parcels.filter(p => p.status === 'PENDING').length}</h3>
                        <p>En attente</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon transit"><FaTruck /></div>
                    <div className="stat-info">
                        <h3>{parcels.filter(p => p.status === 'IN_TRANSIT' || p.status === 'ASSIGNED').length}</h3>
                        <p>En cours / Assignés</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon delivered"><FaCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{parcels.filter(p => p.status === 'DELIVERED').length}</h3>
                        <p>Livrés</p>
                    </div>
                </div>
            </div>

            {/* شريط البحث */}
            <div className="search-bar-container shadow-sm">
                <FaSearch className="search-icon" />
                <input
                    placeholder="Rechercher par code de suivi ou expéditeur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* الجدول */}
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
                                        onChange={(e) => updateStatus(p, e.target.value)} // صيفطي الكوليس كامل p
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
            </div>
        </div>
    );
};

export default ColisManagement;