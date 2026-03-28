import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaArrowLeft, FaSpinner, FaTruck, FaCheckCircle, FaBalanceScale } from "react-icons/fa";
import "./AddColisForm.css";

interface AddColisProps {
    onCancel: () => void;
}

const AddColisForm: React.FC<AddColisProps> = ({ onCancel }) => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const ZONES_API = "http://localhost:5005/api/zones";
    const PARCELS_API = "http://localhost:8082/api/parcels";
    const DRIVERS_API = "http://localhost:8081/api/profiles/drivers/zone";

    const [newParcel, setNewParcel] = useState({
        weight: "",
        deliveryAddress: "",
        zoneId: "",
        senderId: "",
        senderName: "",
        senderPhone: "",
        clientEmail: ""
    });

    const [zones, setZones] = useState<any[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [selectedDriver, setSelectedDriver] = useState("");

    const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    useEffect(() => {
        const fetchZones = async () => {
            try {
                const res = await axios.get(ZONES_API, getHeaders());
                setZones(Array.isArray(res.data) ? res.data : []);
            } catch (err) { console.error(err); }
        };
        fetchZones();
    }, []);

    const handleZoneChange = async (zoneId: string) => {
        setNewParcel({ ...newParcel, zoneId });
        setAvailableDrivers([]);
        setSelectedDriver("");
        if (zoneId) {
            try {
                const res = await axios.get(`${DRIVERS_API}/${zoneId}`, getHeaders());
                setAvailableDrivers(res.data);
            } catch (err) { console.error(err); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            ...newParcel,
            driverId: selectedDriver || null,
            status: selectedDriver ? "ASSIGNED" : "PENDING",
            receivedAt: new Date().toISOString()
        };
        try {
            await axios.post(PARCELS_API, payload, getHeaders());
            Swal.fire({ icon: 'success', title: 'Colis créé ! ✅', showConfirmButton: false, timer: 1500 });
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
                <h3>📦 Nouveau Colis</h3>
            </div>

            <div className="form-card-container">
                <form onSubmit={handleSubmit} className="clean-form">

                    <section className="form-section">

                        <div className="input-row">
                            <div className="input-field">
                                <label>Nom de l'Expéditeur</label>
                                <input type="text" required value={newParcel.senderName} onChange={(e) => setNewParcel({...newParcel, senderName: e.target.value})} placeholder="Nom de l'Expéditeur" />
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
                                <label>Zone de Livraison</label>
                                <select required value={newParcel.zoneId} onChange={(e) => handleZoneChange(e.target.value)}>
                                    <option value="">Sélectionner une zone...</option>
                                    {zones.map(z => <option key={z.id} value={z.id}>{z.nom_zone || z.name}</option>)}
                                </select>
                            </div>
                            <div className="input-field">
                                <label>Affecter un Livreur</label>
                                <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} disabled={availableDrivers.length === 0}>
                                    <option value="">{availableDrivers.length > 0 ? "Choisir..." : "Aucun disponible"}</option>
                                    {availableDrivers.map(d => <option key={d.userId} value={d.userId}>{d.firstName} {d.lastName}</option>)}
                                </select>
                            </div>
                            <div className="input-field full-width">
                                <label>Adresse Complète du Client</label>
                                <input type="text" required value={newParcel.deliveryAddress} onChange={(e) => setNewParcel({...newParcel, deliveryAddress: e.target.value})} placeholder="N°, Rue, Ville..." />
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
                            {loading ? <FaSpinner className="spinner" /> : "Enregistrer le Colis"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddColisForm;