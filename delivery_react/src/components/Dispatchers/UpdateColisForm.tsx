import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaArrowLeft, FaSpinner, FaTruck, FaBox, FaClock } from "react-icons/fa";
import "./AddColisForm.css";

interface UpdateColisProps {
    parcelToEdit: any;
    onCancel: () => void;
    onUpdateSuccess: () => void;
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

const UpdateColisForm: React.FC<UpdateColisProps> = ({ parcelToEdit, onCancel, onUpdateSuccess }) => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const GATEWAY_URL = "http://localhost:8888";
    const TARIFS_API = `${GATEWAY_URL}/tarif-zone-service/api/tarifs`;
    const ZONES_API = `${GATEWAY_URL}/tarif-zone-service/api/zones`;
    const PARCELS_API = `${GATEWAY_URL}/parcel-service/api/parcels`;
    const USERS_API = `${GATEWAY_URL}/users-service/api/profiles`;

    const [formData, setFormData] = useState({
        weight: parcelToEdit.weight || "",
        deliveryAddress: parcelToEdit.deliveryAddress || "",
        zoneId: parcelToEdit.zoneId || "",
        cityName: parcelToEdit.cityName || "",
        senderId: parcelToEdit.senderId || "",
        senderName: parcelToEdit.senderName || "",
        senderPhone: parcelToEdit.senderPhone || "",
        clientEmail: parcelToEdit.clientEmail || "",
        status: parcelToEdit.status || "PENDING"
    });

    const [villes, setVilles] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]); // 🔥 جديد
    const [allLivreurs, setAllLivreurs] = useState<any[]>([]);
    const [allParcels, setAllParcels] = useState<any[]>([]); // 🔥 جديد
    const [selectedDriver, setSelectedDriver] = useState(parcelToEdit.assignedLivreurId || "");
    const [availableLivreurs, setAvailableLivreurs] = useState<LivreurWithStats[]>([]);

    const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    // 🔥 جيب جميع المدن ديال الـ Zone لي فيها هاد المدينة
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

    // 🔥 جيب livreurs ديال الـ Zone كاملة مع إحصائياتهم
    const fetchLivreursByZone = (cityName: string) => {
        if (!cityName || allLivreurs.length === 0) {
            setAvailableLivreurs([]);
            return;
        }

        // 1. جيب جميع المدن ديال الـ Zone
        const zoneCities = getZoneCities(cityName);
        const zoneCitiesLower = zoneCities.map(c => c.toLowerCase());

        // 2. فلتر livreurs لي فـ هاد المدن
        const livreursInZone = allLivreurs.filter(l => {
            const livreurCity = (l.zone || l.city || "").toLowerCase();
            return zoneCitiesLower.includes(livreurCity);
        });

        // 3. حساب الإحصائيات لكل livreur
        const livreursWithStats: LivreurWithStats[] = livreursInZone.map((l: any) => {
            const livreurParcels = allParcels.filter(p =>
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
            // 1. نفس المدينة أولاً
            const aIsSameCity = (a.zone || "").toLowerCase() === cityName.toLowerCase();
            const bIsSameCity = (b.zone || "").toLowerCase() === cityName.toLowerCase();
            if (aIsSameCity && !bIsSameCity) return -1;
            if (!aIsSameCity && bIsSameCity) return 1;

            // 2. ثم حسب الحالة
            const order = { free: 0, busy: 1, full: 2 };
            return order[a.status] - order[b.status];
        });

        setAvailableLivreurs(livreursWithStats);
        console.log(`📋 Livreurs dans la zone:`, livreursWithStats.length);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [villesRes, zonesRes, livreursRes, parcelsRes] = await Promise.all([
                    axios.get(TARIFS_API, getHeaders()),
                    axios.get(ZONES_API, getHeaders()),
                    axios.get(USERS_API, getHeaders()),
                    axios.get(PARCELS_API, getHeaders())
                ]);

                setVilles(Array.isArray(villesRes.data) ? villesRes.data : []);
                setZones(Array.isArray(zonesRes.data) ? zonesRes.data : []);
                setAllParcels(Array.isArray(parcelsRes.data) ? parcelsRes.data : []);

                const allUsers = livreursRes.data;
                const livreursOnly = allUsers.filter((u: any) => u.role === "LIVREUR");
                setAllLivreurs(livreursOnly);

                // 🔥 بعد ما تجيب البيانات، جيب livreurs ديال الـ Zone
                if (formData.cityName) {
                    fetchLivreursByZone(formData.cityName);
                }
            } catch (err) {
                console.error("Erreur chargement données:", err);
            }
        };
        fetchData();
    }, []);

    // 🔥 كل ما تتغير المدينة، جيب livreurs ديال الـ Zone جديدة
    useEffect(() => {
        if (formData.cityName && allLivreurs.length > 0 && zones.length > 0 && allParcels.length > 0) {
            fetchLivreursByZone(formData.cityName);
        }
    }, [formData.cityName, allLivreurs, zones, allParcels]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. تحديث البيانات الأساسية
            await axios.put(`${PARCELS_API}/${parcelToEdit.id}`, formData, getHeaders());

            // 2. تحديث الموصل إذا تغير
            if (selectedDriver && selectedDriver !== parcelToEdit.assignedLivreurId) {
                await axios.patch(`${PARCELS_API}/${parcelToEdit.id}/assign/${selectedDriver}`, {}, getHeaders());

                // 3. إذا كان STATUS مازال PENDING، بدله لـ ASSIGNED
                if (formData.status === 'PENDING') {
                    await axios.patch(`${PARCELS_API}/${parcelToEdit.id}/status?status=ASSIGNED`, {}, getHeaders());
                }
            }

            Swal.fire({
                icon: 'success',
                title: '✅ Mise à jour réussie !',
                text: `Le colis ${parcelToEdit.trackingNumber} a été modifié.`,
                timer: 2000,
                showConfirmButton: false
            });
            onUpdateSuccess();
        } catch (err) {
            console.error(err);
            Swal.fire('Erreur', 'Impossible de modifier le colis', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 🔥 عرض حالة livreur
    const getLivreurStatusLabel = (status: string) => {
        switch(status) {
            case 'free': return <span style={{ color: '#2ecc71', fontSize: '11px', marginLeft: '8px' }}>🟢 Libre</span>;
            case 'busy': return <span style={{ color: '#f39c12', fontSize: '11px', marginLeft: '8px' }}>🟡 En cours</span>;
            case 'full': return <span style={{ color: '#e74c3c', fontSize: '11px', marginLeft: '8px' }}>🔴 Complet</span>;
            default: return null;
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
                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Nom du Client</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.senderName}
                                    onChange={(e) => setFormData({...formData, senderName: e.target.value})}
                                />
                            </div>
                            <div className="input-field">
                                <label>Téléphone</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.senderPhone}
                                    onChange={(e) => setFormData({...formData, senderPhone: e.target.value})}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field full-width">
                                <label>Ville</label>
                                <select
                                    value={formData.cityName}
                                    onChange={(e) => setFormData({...formData, cityName: e.target.value})}
                                >
                                    <option value="">-- Sélectionner la ville --</option>
                                    {villes.map(v => (
                                        <option key={v.id} value={v.ville}>{v.ville}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-field full-width">
                                <label>Adresse de Livraison</label>
                                <textarea
                                    required
                                    value={formData.deliveryAddress}
                                    onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="input-row">
                            <div className="input-field">
                                <label>Poids (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.weight}
                                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                                />
                            </div>
                            <div className="input-field">
                                <label>État</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="PENDING">En attente</option>
                                    <option value="ASSIGNED">Assigné</option>
                                    <option value="IN_TRANSIT">En transit</option>
                                    <option value="DELIVERED">Livré</option>
                                    <option value="CANCELLED">Annulé</option>
                                    <option value="RETURNED">Retourné</option>
                                </select>
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-field">
                                <label><FaTruck /> Livreur</label>
                                <select
                                    value={selectedDriver}
                                    onChange={(e) => setSelectedDriver(e.target.value)}
                                    style={{ marginBottom: '5px' }}
                                >
                                    <option value="">-- Non assigné --</option>
                                    {availableLivreurs.map(l => (
                                        <option key={l.userId} value={l.userId}>
                                            {l.firstName} {l.lastName} - 📍 {l.zone}
                                            {' | '}
                                            {l.totalParcels > 0 ? `📦 ${l.totalParcels} colis` : '📦 Aucun colis'}
                                            {l.pendingCount > 0 ? ` (${l.pendingCount} en attente)` : ''}
                                            {l.inTransitCount > 0 ? ` 🚚 ${l.inTransitCount} en cours` : ''}
                                        </option>
                                    ))}
                                </select>

                                {/* عرض إحصائيات سريعة للـ livreurs */}
                                {availableLivreurs.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        marginTop: '8px',
                                        fontSize: '11px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{ background: '#e8f5e9', padding: '4px 10px', borderRadius: '20px', color: '#2e7d32' }}>
                                            🟢 Libres: {availableLivreurs.filter(l => l.status === 'free').length}
                                        </span>
                                        <span style={{ background: '#fff3e0', padding: '4px 10px', borderRadius: '20px', color: '#e65100' }}>
                                            🟡 En cours: {availableLivreurs.filter(l => l.status === 'busy').length}
                                        </span>
                                        <span style={{ background: '#ffebee', padding: '4px 10px', borderRadius: '20px', color: '#c62828' }}>
                                            🔴 Complets: {availableLivreurs.filter(l => l.status === 'full').length}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="input-field">
                                <label>Email Client</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.clientEmail}
                                    onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="form-footer">
                        <button type="submit" className="btn-submit-full" disabled={loading}>
                            {loading ? <FaSpinner className="spinner" /> : "💾 Sauvegarder"}
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
                .address-icon { color: #2ecc71; font-size: 18px; min-width: 24px; }
                .address-text { flex: 1; display: flex; flex-direction: column; gap: 4px; }
                .address-label { font-size: 11px; color: #2e7d32; text-transform: uppercase; font-weight: 600; }
                .address-value { font-size: 13px; color: #333; line-height: 1.4; }
                .coordinates-badge { background: #3b4e61; color: white; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; }
                .no-drivers-warning { background: #fff3cd; color: #856404; padding: 10px; border-radius: 8px; font-size: 13px; text-align: center; }
                .status-free { color: #2ecc71; font-size: 11px; }
                .status-busy { color: #f39c12; font-size: 11px; }
                .status-full { color: #e74c3c; font-size: 11px; }
            `}</style>
        </div>
    );
};

export default UpdateColisForm;