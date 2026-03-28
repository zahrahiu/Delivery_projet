import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaArrowLeft, FaSpinner, FaTruck, FaCheckCircle, FaBalanceScale } from "react-icons/fa";
import "./AddColisForm.css";

interface UpdateColisProps {
    parcelToEdit: any;
    onCancel: () => void;
    onUpdateSuccess: () => void;
}

const UpdateColisForm: React.FC<UpdateColisProps> = ({ parcelToEdit, onCancel, onUpdateSuccess }) => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const ZONES_API = "http://localhost:5005/api/zones";
    const PARCELS_API = `http://localhost:8082/api/parcels/${parcelToEdit.id}`;
    const DRIVERS_API = "http://localhost:8081/api/profiles/drivers/zone";

    // --- التصحيح هنا: كنأكدو أننا كناخدو القيم اللي جاية من السيرفر ---
    const [formData, setFormData] = useState({
        weight: parcelToEdit.weight ?? "",
        deliveryAddress: parcelToEdit.deliveryAddress ?? "",
        zoneId: parcelToEdit.zoneId ?? parcelToEdit.zone?.id ?? "",
        senderId: parcelToEdit.senderId ?? "",
        senderName: parcelToEdit.senderName ?? "",
        senderPhone: parcelToEdit.senderPhone ?? parcelToEdit.clientPhone ?? "", // جربي هاد الزوج احتمالات
        clientEmail: parcelToEdit.clientEmail ?? ""
    });

    const [zones, setZones] = useState<any[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [selectedDriver, setSelectedDriver] = useState(parcelToEdit.driverId ?? parcelToEdit.driver?.userId ?? "");

    const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    useEffect(() => {
        const initializeView = async () => {
            try {
                // 1. جلب المناطق
                const resZones = await axios.get(ZONES_API, getHeaders());
                setZones(Array.isArray(resZones.data) ? resZones.data : []);

                // 2. جلب السائقين بناءً على المنطقة اللي ديجا كاينا في الكولي
                const zoneIdToUse = parcelToEdit.zoneId || parcelToEdit.zone?.id;
                if (zoneIdToUse) {
                    const resDrivers = await axios.get(`${DRIVERS_API}/${zoneIdToUse}`, getHeaders());
                    setAvailableDrivers(resDrivers.data);
                }
            } catch (err) {
                console.error("Erreur d'initialisation:", err);
            }
        };
        initializeView();
    }, [parcelToEdit]);

    const handleZoneChange = async (zoneId: string) => {
        setFormData({ ...formData, zoneId });
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
            ...formData,
            driverId: selectedDriver || null,
            status: selectedDriver ? "ASSIGNED" : parcelToEdit.status
        };
        try {
            await axios.put(PARCELS_API, payload, getHeaders());
            Swal.fire({ icon: 'success', title: 'Modifié ! ✅', showConfirmButton: false, timer: 1500 });
            onUpdateSuccess();
        } catch (err) {
            Swal.fire('Erreur', 'Modification échouée', 'error');
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
                <h3>✏️ Modification du Colis #{parcelToEdit.trackingNumber || parcelToEdit.id}</h3>
            </div>

            <div className="form-card-container">
                <form onSubmit={handleSubmit} className="clean-form">

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Nom du Magasin / Expéditeur</label>
                                <input type="text" value={formData.senderName} onChange={(e) => setFormData({...formData, senderName: e.target.value})} />
                            </div>
                            <div className="input-field">
                                <label>ID Interne</label>
                                <input type="number" value={formData.senderId} onChange={(e) => setFormData({...formData, senderId: e.target.value})} />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Zone actuelle</label>
                                <select value={formData.zoneId} onChange={(e) => handleZoneChange(e.target.value)}>
                                    <option value="">Sélectionner...</option>
                                    {zones.map(z => <option key={z.id} value={z.id}>{z.nom_zone || z.name}</option>)}
                                </select>
                            </div>
                            <div className="input-field">
                                <label>Livreur affecté</label>
                                <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
                                    <option value="">{availableDrivers.length > 0 ? "Modifier..." : "Chargement / Aucun"}</option>
                                    {availableDrivers.map(d => <option key={d.userId} value={d.userId}>{d.firstName} {d.lastName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="input-field full-width">
                            <label>Adresse de livraison complète</label>
                            <input type="text" value={formData.deliveryAddress} onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})} />
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Poids (kg)</label>
                                <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                            </div>
                            <div className="input-field">
                                <label>Tél. Client</label>
                                <input type="text" value={formData.senderPhone} onChange={(e) => setFormData({...formData, senderPhone: e.target.value})} />
                            </div>
                        </div>
                        <div className="input-field full-width">
                            <label>Email Client</label>
                            <input type="email" value={formData.clientEmail} onChange={(e) => setFormData({...formData, clientEmail: e.target.value})} />
                        </div>
                    </section>

                    <div className="form-footer">
                        <button type="submit" className="btn-submit-full" disabled={loading}>
                            {loading ? <FaSpinner className="spinner" /> : "Enregistrer les modifications"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateColisForm;