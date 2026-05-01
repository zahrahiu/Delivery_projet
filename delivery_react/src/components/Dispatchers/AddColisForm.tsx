import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaArrowLeft, FaSpinner, FaCheckCircle, FaTruck, FaMapMarkerAlt } from "react-icons/fa";
import "./AddColisForm.css";
import AddressMapPicker from "./AddressMapPicker";

interface AddColisProps {
    onCancel: () => void;
}

const AddColisForm: React.FC<AddColisProps> = ({ onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [createdParcel, setCreatedParcel] = useState<any>(null);

    const token = localStorage.getItem("token");

    const TARIFS_API = "http://localhost:8888/tarif-zone-service/api/tarifs";
    const PARCELS_API = "http://localhost:8888/parcel-service/api/parcels";
    const DRIVERS_API = "http://localhost:8888/users-service/api/profiles";
    const DELIVERY_NODE_API = "http://localhost:8888/delivery-service/deliveries";

    const [newParcel, setNewParcel] = useState({
        weight: "",
        deliveryAddress: "",
        cityName: "",
        zoneId: "",
        senderName: "",
        senderPhone: "",
        clientEmail: ""
    });

    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [villes, setVilles] = useState<any[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [selectedDriver, setSelectedDriver] = useState("");
    const [selectedCityId, setSelectedCityId] = useState("");
    const [selectedCityName, setSelectedCityName] = useState("");

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        const fetchVilles = async () => {
            try {
                const res = await axios.get(TARIFS_API, getHeaders());
                setVilles(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Erreur villes:", err);
            }
        };
        fetchVilles();
    }, []);

    const handleVilleChange = async (villeId: string) => {
        const selectedVille = villes.find(v => v.id.toString() === villeId);
        setSelectedCityId(villeId);
        setSelectedCityName(selectedVille?.ville || "");

        if (selectedVille) {
            const zId = selectedVille.zone_id || selectedVille.zoneId;
            const cityName = selectedVille.ville;

            setNewParcel({
                ...newParcel,
                zoneId: zId?.toString() || "",
                cityName: cityName || "",
                deliveryAddress: ""
            });

            setCoordinates(null);

            if (cityName) {
                try {
                    // 🔥 جلب جميع الـ livreurs من API
                    const res = await axios.get(DRIVERS_API, getHeaders());
                    const allUsers = res.data;

                    // تصفية الـ livreurs حسب المدينة (zone)
                    const driversInZone = allUsers.filter((u: any) =>
                        u.role === "LIVREUR" &&
                        u.zone?.toLowerCase() === cityName.toLowerCase()
                    );

                    setAvailableDrivers(driversInZone);
                    console.log(`📋 Livreurs trouvés pour ${cityName}:`, driversInZone.length);
                } catch (err) {
                    console.error("Erreur lors du chargement des drivers:", err);
                    setAvailableDrivers([]);
                }
            }
        } else {
            setNewParcel({ ...newParcel, zoneId: "", cityName: "", deliveryAddress: "" });
            setAvailableDrivers([]);
            setCoordinates(null);
        }
    };

    const handleAddressSelect = (address: string, lat: number, lng: number) => {
        setNewParcel(prev => ({
            ...prev,
            deliveryAddress: address
        }));
        setCoordinates({ lat, lng });
        console.log("📍 Coordonnées sélectionnées:", lat, lng);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newParcel.deliveryAddress) {
            Swal.fire('Erreur', 'Veuillez sélectionner une adresse sur la carte', 'error');
            return;
        }

        if (!coordinates) {
            Swal.fire('Erreur', 'Veuillez sélectionner une adresse valide sur la carte', 'error');
            return;
        }

        setLoading(true);

        const payload = {
            ...newParcel,
            status: "PENDING",
            receivedAt: new Date().toISOString(),
            latitude: coordinates.lat,
            longitude: coordinates.lng
        };

        console.log("📦 Payload envoyé:", payload);

        try {
            const res = await axios.post(PARCELS_API, payload, getHeaders());
            setCreatedParcel(res.data);
            setShowAssignModal(true);
        } catch (err) {
            console.error("Erreur création:", err);
            Swal.fire('Erreur', 'Impossible de créer le colis ❌', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignLivreur = async () => {
        setLoading(true);

        if (selectedDriver) {
            try {
                await axios.patch(`${PARCELS_API}/${createdParcel.id}/assign/${selectedDriver}`, {}, getHeaders());

                setTimeout(async () => {
                    try {
                        await axios.post(`${DELIVERY_NODE_API}/${createdParcel.trackingNumber}/assign`, { livreurId: selectedDriver }, getHeaders());
                    } catch (e) {
                        console.warn("Node.js sync pending...");
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'Colis Assigné !',
                        text: `Le colis ${createdParcel.trackingNumber} est en route.`,
                        confirmButtonColor: '#3182ce'
                    });
                    onCancel();
                }, 1000);
            } catch (err) {
                Swal.fire('Erreur', 'Échec de l\'assignation', 'error');
                setLoading(false);
            }
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Colis enregistré',
                text: `Le colis ${createdParcel.trackingNumber} a été créé sans livreur.`,
                confirmButtonColor: '#3182ce'
            });
            setLoading(false);
            onCancel();
        }
    };

    if (showAssignModal) {
        return (
            <div className="modal-overlay">
                <div className="assign-card">
                    <div className="success-icon-wrapper">
                        <FaCheckCircle className="success-icon" />
                    </div>
                    <h3>Colis créé avec succès !</h3>
                    <p className="tracking-info">N° Suivi: <span>{createdParcel?.trackingNumber}</span></p>
                    <p className="modal-subtitle">Voulez-vous assigner un livreur pour <strong>{selectedCityName}</strong> ?</p>

                    <div className="input-field">
                        <label><FaTruck className="label-icon" /> Livreur disponible :</label>
                        {availableDrivers.length === 0 ? (
                            <div className="no-drivers-warning">
                                ⚠️ Aucun livreur disponible pour {selectedCityName}
                            </div>
                        ) : (
                            <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
                                <option value="">-- Plus tard (Non assigné) --</option>
                                {availableDrivers.map(d => (
                                    <option key={d.userId} value={d.userId}>
                                        {d.firstName} {d.lastName} - {d.phone}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn-assign"
                            onClick={handleAssignLivreur}
                            disabled={loading || (availableDrivers.length === 0 && !selectedDriver)}
                        >
                            {loading ? <FaSpinner className="spinner" /> : "Confirmer l'affectation"}
                        </button>
                        <button className="btn-skip" onClick={onCancel}>Fermer</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="add-colis-embedded">
            <div className="form-header-simple">
                <button className="btn-back-link" onClick={onCancel}>
                    <FaArrowLeft /> Retour à la liste
                </button>
                <h3>📦 Nouveau Colis</h3>
            </div>

            <div className="form-card-container">
                <form onSubmit={handleCreateSubmit} className="clean-form">
                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Nom de Client</label>
                                <input
                                    type="text"
                                    required
                                    value={newParcel.senderName}
                                    onChange={(e) => setNewParcel({ ...newParcel, senderName: e.target.value })}
                                    placeholder="Ex: Ahmed Alami"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field full-width">
                                <label>Ville de Livraison</label>
                                <select
                                    required
                                    value={selectedCityId}
                                    onChange={(e) => handleVilleChange(e.target.value)}
                                >
                                    <option value="">-- Sélectionner la ville --</option>
                                    {villes.map(v => (
                                        <option key={v.id} value={v.id}>{v.ville}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {newParcel.cityName && (
                            <AddressMapPicker
                                cityName={newParcel.cityName}
                                onAddressSelect={handleAddressSelect}
                                initialAddress={newParcel.deliveryAddress}
                            />
                        )}

                        {newParcel.deliveryAddress && (
                            <div className="selected-address">
                                <FaMapMarkerAlt className="address-icon" />
                                <div className="address-text">
                                    <span className="address-label">Adresse sélectionnée :</span>
                                    <span className="address-value">{newParcel.deliveryAddress}</span>
                                </div>
                                {coordinates && (
                                    <div className="coordinates-badge">
                                        📍 GPS
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Poids (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={newParcel.weight}
                                    onChange={(e) => setNewParcel({ ...newParcel, weight: e.target.value })}
                                    placeholder="0.5"
                                />
                            </div>
                            <div className="input-field">
                                <label>Téléphone Destinataire</label>
                                <input
                                    type="text"
                                    required
                                    value={newParcel.senderPhone}
                                    onChange={(e) => setNewParcel({ ...newParcel, senderPhone: e.target.value })}
                                    placeholder="0612345678"
                                />
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-field full-width">
                                <label>Email de Notification</label>
                                <input
                                    type="email"
                                    required
                                    value={newParcel.clientEmail}
                                    onChange={(e) => setNewParcel({ ...newParcel, clientEmail: e.target.value })}
                                    placeholder="client@example.com"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="form-footer">
                        <button type="submit" className="btn-submit-full" disabled={loading}>
                            {loading ? <FaSpinner className="spinner" /> : "Suivant : Affectation"}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .selected-address {
                    background: #e8f5e9;
                    border-radius: 12px;
                    padding: 12px 15px;
                    margin-top: 15px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .address-icon {
                    color: #2ecc71;
                    font-size: 18px;
                    min-width: 24px;
                }
                .address-text {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .address-label {
                    font-size: 11px;
                    color: #2e7d32;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .address-value {
                    font-size: 13px;
                    color: #333;
                    line-height: 1.4;
                }
                .coordinates-badge {
                    background: #3b4e61;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 600;
                }
                .no-drivers-warning {
                    background: #fff3cd;
                    color: #856404;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 13px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default AddColisForm;