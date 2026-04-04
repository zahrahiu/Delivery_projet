import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaArrowLeft, FaSpinner, FaTruck } from "react-icons/fa";
import "./AddColisForm.css";

interface AddColisProps {
    onCancel: () => void;
}

const AddColisForm: React.FC<AddColisProps> = ({ onCancel }) => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const TARIFS_API = "http://localhost:5005/api/tarifs";
    const PARCELS_API = "http://localhost:8082/api/parcels";
    const DRIVERS_API = "http://localhost:8081/api/profiles/drivers/zone";
    const DELIVERY_NODE_API = "http://localhost:3001/deliveries";

    const [newParcel, setNewParcel] = useState({
        weight: "",
        deliveryAddress: "",
        zoneId: "",
        senderId: "",
        senderName: "",
        senderPhone: "",
        clientEmail: ""
    });

    const [villes, setVilles] = useState<any[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [selectedDriver, setSelectedDriver] = useState("");

    const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    useEffect(() => {
        const fetchVilles = async () => {
            try {
                const res = await axios.get(TARIFS_API, getHeaders());
                setVilles(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Erreur lors du chargement des villes:", err);
            }
        };
        fetchVilles();
    }, []);

    const handleVilleChange = async (villeId: string) => {
        const selectedVille = villes.find(v => v.id.toString() === villeId);

        if (selectedVille) {
            const zId = selectedVille.zone_id;
            setNewParcel({ ...newParcel, zoneId: zId, deliveryAddress: selectedVille.ville });

            setAvailableDrivers([]);
            setSelectedDriver("");

            if (zId) {
                try {
                    const res = await axios.get(`${DRIVERS_API}/${zId}`, getHeaders());
                    setAvailableDrivers(res.data);
                } catch (err) {
                    console.error("Erreur drivers:", err);
                }
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...newParcel,
            status: selectedDriver ? "ASSIGNED" : "PENDING",
            receivedAt: new Date().toISOString()
        };

        try {
            const res = await axios.post(PARCELS_API, payload, getHeaders());
            const createdParcel = res.data;

            if (selectedDriver && createdParcel.trackingNumber) {
                try {
                    await axios.post(`${DELIVERY_NODE_API}/${createdParcel.trackingNumber}/assign`,
                        { livreurId: selectedDriver },
                        getHeaders()
                    );
                    console.log("✅ Sync Node.js OK");
                } catch (nodeErr) {
                    console.error("❌ Sync Node.js Failed:", nodeErr);
                }
            }

            Swal.fire({
                icon: 'success',
                title: 'Colis créé avec succès ! ✅',
                showConfirmButton: false,
                timer: 1500
            });
            onCancel();
        } catch (err) {
            Swal.fire('Erreur', 'Impossible de créer le colis ❌', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-colis-embedded">
            <div className="form-header-simple">
                <button className="btn-back-link" onClick={onCancel}>
                    <FaArrowLeft /> Retour
                </button>
                <h3>📦 Nouveau Colis & Affectation</h3>
            </div>

            <div className="form-card-container">
                <form onSubmit={handleSubmit} className="clean-form">

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Nom de l'Expéditeur</label>
                                <input type="text" required value={newParcel.senderName} onChange={(e) => setNewParcel({...newParcel, senderName: e.target.value})} placeholder="Nom complet" />
                            </div>
                            <div className="input-field">
                                <label>ID Expéditeur</label>
                                <input type="number" required value={newParcel.senderId} onChange={(e) => setNewParcel({...newParcel, senderId: e.target.value})} placeholder="ID" />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Ville de Livraison</label>
                                <select required onChange={(e) => handleVilleChange(e.target.value)}>
                                    <option value="">-- Sélectionner la ville --</option>
                                    {villes.map(v => (
                                        <option key={v.id} value={v.id}>{v.ville}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-field">
                                <label>Assigner un Livreur (Zone)</label>
                                <select
                                    value={selectedDriver}
                                    onChange={(e) => setSelectedDriver(e.target.value)}
                                    disabled={availableDrivers.length === 0}
                                >
                                    <option value="">{availableDrivers.length > 0 ? "Choisir un livreur..." : "Aucun livreur disponible"}</option>
                                    {availableDrivers.map(d => (
                                        <option key={d.userId} value={d.userId}>{d.firstName} {d.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Poids (kg)</label>
                                <input type="number" step="0.1" required value={newParcel.weight} onChange={(e) => setNewParcel({...newParcel, weight: e.target.value})} placeholder="0.0" />
                            </div>
                            <div className="input-field">
                                <label>Téléphone Client</label>
                                <input type="text" required value={newParcel.senderPhone} onChange={(e) => setNewParcel({...newParcel, senderPhone: e.target.value})} placeholder="06XXXXXXXX" />
                            </div>
                            <div className="input-field full-width">
                                <label>Email du Client</label>
                                <input type="email" required value={newParcel.clientEmail} onChange={(e) => setNewParcel({...newParcel, clientEmail: e.target.value})} placeholder="client@mail.com" />
                            </div>
                        </div>
                    </section>

                    <div className="form-footer">
                        <button type="submit" className="btn-submit-full" disabled={loading}>
                            {loading ? <FaSpinner className="spinner" /> : "Enregistrer et Confirmer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddColisForm;