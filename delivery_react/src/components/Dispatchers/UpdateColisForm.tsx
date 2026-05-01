import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaArrowLeft, FaSpinner, FaSave, FaTruck, FaMapMarkerAlt, FaUserEdit } from "react-icons/fa";
import "./AddColisForm.css"; // استعملي نفس الـ CSS باش يبقاو متناسقين

interface UpdateColisProps {
    parcelToEdit: any;
    onCancel: () => void;
    onUpdateSuccess: () => void;
}

const UpdateColisForm: React.FC<UpdateColisProps> = ({ parcelToEdit, onCancel, onUpdateSuccess }) => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const GATEWAY_URL = "http://localhost:8888";
    const TARIFS_API = `${GATEWAY_URL}/tarif-zone-service/api/tarifs`;
    const PARCELS_API = `${GATEWAY_URL}/parcel-service/api/parcels/${parcelToEdit.id}`;
    const DRIVERS_API = `${GATEWAY_URL}/users-service/api/profiles/drivers/zone`;

    const [formData, setFormData] = useState({
        weight: parcelToEdit.weight || "",
        deliveryAddress: parcelToEdit.deliveryAddress || "",
        zoneId: parcelToEdit.zoneId || "",
        senderId: parcelToEdit.senderId || "",
        senderName: parcelToEdit.senderName || "",
        senderPhone: parcelToEdit.senderPhone || "",
        clientEmail: parcelToEdit.clientEmail || parcelToEdit.senderEmail || "",
        status: parcelToEdit.status || "PENDING"
    });

    const [villes, setVilles] = useState<any[]>([]);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [selectedDriver, setSelectedDriver] = useState(parcelToEdit.assignedLivreurId || "");

    const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    // 1. جلب المدن والسائقين عند البداية
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // جلب المدن
                const resVilles = await axios.get(TARIFS_API, getHeaders());
                setVilles(Array.isArray(resVilles.data) ? resVilles.data : []);

                // جلب السائقين للمنطقة الحالية للطرد
                if (formData.zoneId) {
                    const resDrivers = await axios.get(`${DRIVERS_API}/${formData.zoneId}`, getHeaders());
                    setAvailableDrivers(resDrivers.data);
                }
            } catch (err) {
                console.error("Erreur initialisation Update:", err);
            }
        };
        fetchInitialData();
    }, [parcelToEdit.id]);

    const handleVilleChange = async (villeId: string) => {
        const selectedVille = villes.find(v => v.id.toString() === villeId);
        if (selectedVille) {
            const zId = selectedVille.zone_id || selectedVille.zoneId;
            setFormData({ ...formData, zoneId: zId, deliveryAddress: selectedVille.ville });

            // تحديث قائمة السائقين حسب المنطقة الجديدة
            try {
                const res = await axios.get(`${DRIVERS_API}/${zId}`, getHeaders());
                setAvailableDrivers(res.data);
                setSelectedDriver(""); // مسح السائق القديم حيت المنطقة تبدلات
            } catch (err) { console.error(err); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. تحديث البيانات الأساسية (Weight, Address...)
            await axios.put(PARCELS_API, formData, getHeaders());

            // 2. تحديث الموصل (إلا تبدل أو تختار)
            if (selectedDriver) {
                await axios.patch(`${GATEWAY_URL}/parcel-service/api/parcels/${parcelToEdit.id}/assign/${selectedDriver}`, {}, getHeaders());
            }

            Swal.fire({
                icon: 'success',
                title: 'Mise à jour réussie !',
                text: `Le colis ${parcelToEdit.trackingNumber} a été modifié.`,
                timer: 2000,
                showConfirmButton: false
            });
            onUpdateSuccess();
        } catch (err) {
            Swal.fire('Erreur', 'Impossible de modifier le colis', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-colis-embedded">
            <div className="form-header-simple">
                <button className="btn-back-link" onClick={onCancel}>
                    <FaArrowLeft /> Annuler
                </button>
                <h3>✏️ Modifier le Colis <span style={{color: '#3182ce'}}>{parcelToEdit.trackingNumber}</span></h3>
            </div>

            <div className="form-card-container">
                <form onSubmit={handleSubmit} className="clean-form">

                    {/* القسم 1: المرسل */}
                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Nom de l'Expéditeur</label>
                                <input type="text" required value={formData.senderName} onChange={(e) => setFormData({...formData, senderName: e.target.value})} />
                            </div>
                            <div className="input-field">
                                <label>ID Expéditeur</label>
                                <input type="number" required value={formData.senderId} onChange={(e) => setFormData({...formData, senderId: e.target.value})} />
                            </div>
                        </div>
                    </section>

                    {/* القسم 2: الوجهة والموصل */}
                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Ville / Zone</label>
                                <select required onChange={(e) => handleVilleChange(e.target.value)}>
                                    <option value="">-- Changer la ville --</option>
                                    {villes.map(v => (
                                        <option key={v.id} value={v.id} selected={v.ville === formData.deliveryAddress}>
                                            {v.ville}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-field">
                                <label><FaTruck style={{marginRight: '5px'}}/> Livreur</label>
                                <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
                                    <option value="">-- Non assigné --</option>
                                    {availableDrivers.map(d => (
                                        <option key={d.userId} value={d.userId}>
                                            {d.firstName} {d.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* القسم 3: تفاصيل الطرد */}
                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Poids (kg)</label>
                                <input type="number" step="0.1" required value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                            </div>
                            <div className="input-field">
                                <label>État du colis</label>
                                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                    <option value="PENDING">En attente</option>
                                    <option value="ASSIGNED">Assigné</option>
                                    <option value="IN_TRANSIT">En cours</option>
                                    <option value="DELIVERED">Livré</option>
                                    <option value="CANCELLED">Annulé</option>
                                </select>
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-field full-width">
                                <label>Email Client (Notification)</label>
                                <input type="email" required value={formData.clientEmail} onChange={(e) => setFormData({...formData, clientEmail: e.target.value})} />
                            </div>
                        </div>
                    </section>

                    <div className="form-footer">
                        <button type="submit" className="btn-submit-full" disabled={loading}>
                            {loading ? <FaSpinner className="spinner" /> : "Sauvegarder les modifications"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateColisForm;