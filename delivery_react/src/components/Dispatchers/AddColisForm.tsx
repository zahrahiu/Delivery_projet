import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaArrowLeft, FaSpinner, FaCheckCircle, FaTruck, FaMapMarkerAlt, FaBox, FaClock, FaCheck } from "react-icons/fa";
import "./AddColisForm.css";
import AddressMapPicker from "./AddressMapPicker";

interface AddColisProps {
    onCancel: () => void;
}

interface LivreurWithStats {
    userId: number;
    firstName: string;
    lastName: string;
    phone: string;
    zone: string;
    vehicleType: string;
    totalParcels: number;      // 🔥 عدد colis لي عندو (كل الحالات)
    pendingCount: number;      // 🔥 عدد colis فـ PENDING/ASSIGNED (مازال ما بدا)
    inTransitCount: number;    // 🔥 عدد colis فـ IN_TRANSIT (بدا يخدم)
    deliveredCount: number;    // 🔥 عدد colis لي سلمهم
    status: "free" | "busy" | "full"; // 🔥 حالة الـ livreur
}

const AddColisForm: React.FC<AddColisProps> = ({ onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [createdParcel, setCreatedParcel] = useState<any>(null);

    const token = localStorage.getItem("token");

    const TARIFS_API = "http://localhost:8888/tarif-zone-service/api/tarifs";
    const ZONES_API = "http://localhost:8888/tarif-zone-service/api/zones";
    const PARCELS_API = "http://localhost:8888/parcel-service/api/parcels";
    const DRIVERS_API = "http://localhost:8888/users-service/api/profiles";

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
    const [zones, setZones] = useState<any[]>([]); // 🔥 جديد
    const [availableDrivers, setAvailableDrivers] = useState<LivreurWithStats[]>([]);
    const [selectedDriver, setSelectedDriver] = useState("");
    const [selectedCityId, setSelectedCityId] = useState("");
    const [selectedCityName, setSelectedCityName] = useState("");
    const [allParcels, setAllParcels] = useState<any[]>([]); // 🔥 جديد: جميع الكوليس

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    // 🔥 جيب المدن والزونات والكوليس
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [villesRes, zonesRes, parcelsRes] = await Promise.all([
                    axios.get(TARIFS_API, getHeaders()),
                    axios.get(ZONES_API, getHeaders()),
                    axios.get(PARCELS_API, getHeaders())
                ]);
                setVilles(Array.isArray(villesRes.data) ? villesRes.data : []);
                setZones(Array.isArray(zonesRes.data) ? zonesRes.data : []);
                setAllParcels(Array.isArray(parcelsRes.data) ? parcelsRes.data : []);
            } catch (err) {
                console.error("Erreur chargement initial:", err);
            }
        };
        fetchInitialData();
    }, []);

    // 🔥 جيب جميع livreurs ديال الـ Zone (كل المدن لي فـ نفس zone)
    const fetchDriversByZone = async (cityName: string) => {
        try {
            // 1. لقى الـ Zone لي فيها هاد المدينة
            const foundZone = zones.find((z: any) => {
                if (!z.villes_list || z.villes_list.length === 0) return false;
                return z.villes_list.some((ville: string) =>
                    ville.toLowerCase() === cityName.toLowerCase()
                );
            });

            if (!foundZone) {
                console.warn(`⚠️ No zone found for city: ${cityName}`);
                setAvailableDrivers([]);
                return;
            }

            const zoneCities = foundZone.villes_list.map((c: string) => c.toLowerCase());
            console.log(`📍 Zone: ${foundZone.nom_zone}, Cities:`, zoneCities);

            // 2. جيب جميع livreurs
            const usersRes = await axios.get(DRIVERS_API, getHeaders());
            const allLivreurs = usersRes.data.filter((u: any) => u.role === "LIVREUR");

            // 3. فلتر livreurs لي فـ نفس الـ Zone (أي مدينة من zoneCities)
            const filteredLivreurs = allLivreurs.filter((l: any) => {
                const livreurCity = (l.zone || l.city || "").toLowerCase();
                return zoneCities.includes(livreurCity);
            });

            // 4. حساب إحصائيات لكل livreur
            const livreursWithStats: LivreurWithStats[] = filteredLivreurs.map((l: any) => {
                // جيب جميع colis ديال هاد livreur
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

                // تحديد حالة الـ livreur
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
            });

            // ترتيب: livreurs فاضيين أولاً، ثم لي خدامين، ثم لي مكملين
            livreursWithStats.sort((a, b) => {
                const order = { free: 0, busy: 1, full: 2 };
                return order[a.status] - order[b.status];
            });

            setAvailableDrivers(livreursWithStats);
            console.log(`📋 Livreurs dans la zone ${foundZone.nom_zone}:`, livreursWithStats.length);

        } catch (err) {
            console.error("Erreur lors du chargement des drivers:", err);
            setAvailableDrivers([]);
        }
    };

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
                await fetchDriversByZone(cityName); // 🔥 جيب livreurs ديال الـ Zone كاملة
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

    const handleSkipAssign = () => {
        Swal.fire({
            icon: 'info',
            title: 'Colis enregistré',
            text: `Le colis ${createdParcel.trackingNumber} a été créé avec succès.\nStatut: En attente d'assignation.`,
            confirmButtonColor: '#3182ce'
        });
        onCancel();
    };

    const handleAssignLivreur = async () => {
        if (!selectedDriver) {
            Swal.fire('Erreur', 'Veuillez sélectionner un livreur', 'warning');
            return;
        }

        setLoading(true);
        try {
            // 🔥 استعمل Delivery Service
            const DELIVERY_API = "http://localhost:8888/delivery-service/api/deliveries";

            await axios.post(`${DELIVERY_API}/${createdParcel.trackingNumber}/assign`, {
                livreurId: selectedDriver
            }, getHeaders());

            Swal.fire({
                icon: 'success',
                title: '✅ Colis Assigné !',
                text: `Le colis ${createdParcel.trackingNumber} est maintenant assigné.`,
                confirmButtonColor: '#3182ce'
            });
            onCancel();
        } catch (err) {
            console.error("Erreur assignation:", err);
            Swal.fire('Erreur', 'Échec de l\'assignation', 'error');
            setLoading(false);
        }
    };

    // 🔥 أيقونة حسب حالة livreur
    const getLivreurStatusIcon = (status: string) => {
        switch(status) {
            case 'free': return <span className="status-free">🟢 Libre</span>;
            case 'busy': return <span className="status-busy">🟡 En livraison ({availableDrivers.find(d => d.status === status)?.inTransitCount || 0})</span>;
            case 'full': return <span className="status-full">🔴 Complet (3+ colis)</span>;
            default: return null;
        }
    };

    if (showAssignModal) {
        return (
            <div className="modal-overlay">
                <div className="assign-card" style={{ maxWidth: '550px' }}>
                    <div className="success-icon-wrapper">
                        <FaCheckCircle className="success-icon" />
                    </div>
                    <h3>Colis créé avec succès !</h3>
                    <p className="tracking-info">N° Suivi: <span>{createdParcel?.trackingNumber}</span></p>
                    <p className="modal-subtitle">Ville: <strong>{selectedCityName}</strong></p>

                    <div className="input-field">
                        <label><FaTruck className="label-icon" /> Livreurs disponibles dans votre zone :</label>
                        {availableDrivers.length === 0 ? (
                            <div className="no-drivers-warning">
                                ⚠️ Aucun livreur disponible pour cette zone
                            </div>
                        ) : (
                            <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} className="driver-select">
                                <option value="">-- Choisir un livreur --</option>
                                {availableDrivers.map(d => (
                                    <option key={d.userId} value={d.userId} style={{
                                        borderLeft: d.status === 'free' ? '3px solid #2ecc71' :
                                            d.status === 'busy' ? '3px solid #f39c12' : '3px solid #e74c3c'
                                    }}>
                                        {d.firstName} {d.lastName} - {d.vehicleType} - 📍{d.zone}
                                        {' | '}
                                        {d.totalParcels > 0 ? `📦 ${d.totalParcels} colis` : '📦 Aucun colis'}
                                        {d.pendingCount > 0 ? ` (${d.pendingCount} en attente)` : ''}
                                        {d.inTransitCount > 0 ? ` | 🚚 ${d.inTransitCount} en cours` : ''}
                                        {d.deliveredCount > 0 ? ` | ✅ ${d.deliveredCount} livrés` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* عرض إحصائيات سريعة */}
                    {availableDrivers.length > 0 && (
                        <div className="drivers-stats-preview">
                            <div className="stats-row-mini">
                                <div className="stat-mini free">
                                    <span>🟢</span> {availableDrivers.filter(d => d.status === 'free').length} Libre(s)
                                </div>
                                <div className="stat-mini busy">
                                    <span>🟡</span> {availableDrivers.filter(d => d.status === 'busy').length} En livraison
                                </div>
                                <div className="stat-mini full">
                                    <span>🔴</span> {availableDrivers.filter(d => d.status === 'full').length} Complet(s)
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button className="btn-skip" onClick={handleSkipAssign}>
                            {loading ? <FaSpinner className="spinner" /> : "Plus tard (En attente)"}
                        </button>
                        <button className="btn-assign" onClick={handleAssignLivreur} disabled={loading || !selectedDriver}>
                            {loading ? <FaSpinner className="spinner" /> : "✅ Assigner maintenant"}
                        </button>
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
                .address-icon { color: #2ecc71; font-size: 18px; min-width: 24px; }
                .address-text { flex: 1; display: flex; flex-direction: column; gap: 4px; }
                .address-label { font-size: 11px; color: #2e7d32; text-transform: uppercase; font-weight: 600; }
                .address-value { font-size: 13px; color: #333; line-height: 1.4; }
                .coordinates-badge { background: #3b4e61; color: white; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; }
                .no-drivers-warning { background: #fff3cd; color: #856404; padding: 10px; border-radius: 8px; font-size: 13px; text-align: center; }
                
                /* Driver select styling */
                .driver-select option {
                    padding: 10px;
                    margin: 5px 0;
                }
                
                .drivers-stats-preview {
                    margin-top: 15px;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 12px;
                }
                
                .stats-row-mini {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                
                .stat-mini {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    padding: 4px 12px;
                    border-radius: 20px;
                    background: white;
                }
                
                .stat-mini.free { color: #2ecc71; }
                .stat-mini.busy { color: #f39c12; }
                .stat-mini.full { color: #e74c3c; }
                
                .status-free { color: #2ecc71; font-size: 11px; }
                .status-busy { color: #f39c12; font-size: 11px; }
                .status-full { color: #e74c3c; font-size: 11px; }
            `}</style>
        </div>
    );
};

export default AddColisForm;