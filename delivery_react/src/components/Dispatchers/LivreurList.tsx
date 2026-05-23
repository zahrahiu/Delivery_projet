import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import {
    FaPhone, FaMapMarkerAlt, FaMotorcycle, FaSearch,
    FaBox, FaExternalLinkAlt, FaCircle, FaTimes, FaTruckLoading,
    FaChevronDown, FaChevronUp, FaEye, FaTruck, FaUser, FaCalendarAlt,
    FaUserSecret, FaGlobe
} from "react-icons/fa";
import "./LivreurList.css";

const LivreurList: React.FC = () => {
    const [livreurs, setLivreurs] = useState<any[]>([]);
    const [parcels, setParcels] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null);
    const [filterMode, setFilterMode] = useState<"all" | "myZone">("all");
    const [dispatcherZoneName, setDispatcherZoneName] = useState<string>("");
    const [zoneCities, setZoneCities] = useState<string[]>([]);

    const GATEWAY_URL = "http://localhost:8888";
    const USERS_API = `${GATEWAY_URL}/users-service/api/profiles`;
    const PARCELS_API = `${GATEWAY_URL}/parcel-service/api/parcels`;
    const ZONES_API = `${GATEWAY_URL}/tarif-zone-service/api/zones`;
    const IMAGE_BASE_URL = `${GATEWAY_URL}/users-service/uploads`;

    const getUserIdFromToken = (): number | null => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(window.atob(base64));
            return payload.userId || payload.id || null;
        } catch (err) {
            console.error("Error decoding token:", err);
            return null;
        }
    };

    // 🔥 جيب Zone ديال الـ Dispatcher وجيب جميع المدن ديال هاد الـ Zone
    const fetchDispatcherZoneAndCities = async () => {
        try {
            const userId = getUserIdFromToken();
            if (!userId) {
                console.warn("⚠️ No userId found in token");
                setDispatcherZoneName("");
                setZoneCities([]);
                return;
            }

            console.log("🔍 Fetching dispatcher info for userId:", userId);
            const token = localStorage.getItem("token");
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            // 1. جيب معلومات الـ Dispatcher (فيه ville)
            const userRes = await axios.get(`${GATEWAY_URL}/users-service/api/profiles/details/${userId}`, headers);
            const userData = userRes.data;
            const dispatcherCity = userData.zone || "";

            console.log("📋 Dispatcher city:", dispatcherCity);

            if (!dispatcherCity) {
                setDispatcherZoneName("");
                setZoneCities([]);
                return;
            }

            // 2. جيب جميع الـ Zones من tarif-zone-service
            const zonesRes = await axios.get(ZONES_API, headers);
            const zones = zonesRes.data;
            console.log("📋 All zones:", zones);

            // 3. 🔥 لقى الـ Zone لي فيها dispatcherCity فـ villes_list
            const foundZone = zones.find((z: any) => {
                if (!z.villes_list || z.villes_list.length === 0) return false;
                return z.villes_list.some((ville: string) =>
                    ville.toLowerCase() === dispatcherCity.toLowerCase()
                );
            });

            if (foundZone && foundZone.villes_list) {
                setZoneCities(foundZone.villes_list);
                setDispatcherZoneName(foundZone.nom_zone);
                console.log("📍 Zone found:", foundZone.nom_zone);
                console.log("📍 Cities in this zone:", foundZone.villes_list);
            } else {
                console.warn("⚠️ No zone found containing city:", dispatcherCity);
                setZoneCities([]);
                setDispatcherZoneName("");
            }
        } catch (err) {
            console.error("❌ Error fetching dispatcher zone info:", err);
            setDispatcherZoneName("");
            setZoneCities([]);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            const [usersRes, parcelsRes] = await Promise.all([
                axios.get(USERS_API, headers),
                axios.get(PARCELS_API, headers)
            ]);

            const filtered = usersRes.data.filter((u: any) => u.role === "LIVREUR");
            setLivreurs(filtered);
            setParcels(Array.isArray(parcelsRes.data) ? parcelsRes.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Erreur chargement:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDispatcherZoneAndCities();
        fetchData();
    }, []);

    const getLivreurParcels = (livreurId: number) => {
        return parcels.filter(p =>
            String(p.assignedLivreurId || p.livreurId || p.assignedLivreur?.userId) === String(livreurId)
        );
    };

    const getParcelCount = (livreurId: number) => {
        return getLivreurParcels(livreurId).length;
    };

    const formatDate = (date: string) => {
        if (!date) return "Date non spécifiée";
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const config: any = {
            'PENDING': { text: 'En attente', color: '#f39c12', bg: '#fef3e2' },
            'ASSIGNED': { text: 'Assigné', color: '#3498db', bg: '#e3f2fd' },
            'IN_TRANSIT': { text: 'En transit', color: '#2ecc71', bg: '#e8f5e9' },
            'DELIVERED': { text: 'Livré', color: '#27ae60', bg: '#e8f5e9' },
            'RETURNED': { text: 'Retourné', color: '#e74c3c', bg: '#fce4ec' },
            'CANCELLED': { text: 'Annulé', color: '#95a5a6', bg: '#ecf0f1' }
        };
        return config[status] || { text: status, color: '#95a5a6', bg: '#ecf0f1' };
    };

    const toggleExpand = (livreurId: number) => {
        setExpandedLivreur(expandedLivreur === livreurId ? null : livreurId);
    };

    // 🔥 التحقق إذا كان الـ Livreur فـ نفس Zone
    const isLivreurInDispatcherZone = (livreur: any): boolean => {
        if (zoneCities.length === 0) return false;
        const livreurCity = (livreur.zone || livreur.city || "").toLowerCase();
        return zoneCities.some(city => city.toLowerCase() === livreurCity);
    };

    const filteredLivreurs = livreurs.filter(l => {
        const name = `${l.firstName} ${l.lastName}`.toLowerCase();
        const city = (l.zone || l.city || l.address || "").toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || city.includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterMode === "myZone" && zoneCities.length > 0) {
            return isLivreurInDispatcherZone(l);
        }

        return true;
    });

    if (loading) return <div className="loading-state">Chargement de la flotte...</div>;

    return (
        <div className="livreurs-container-v4">
            <div className="list-header-v4">
                <div className="header-title">
                    <h2>📋 Flotte de Livraison - QribLik</h2>
                    <span>{filteredLivreurs.length} livreurs {filterMode === "myZone" ? `dans votre zone (${dispatcherZoneName || "Non définie"})` : "connectés"}</span>
                </div>

                <div className="search-wrapper-v4">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou ville..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="filter-buttons-v4">
                <button
                    className={`filter-btn ${filterMode === "all" ? "active" : ""}`}
                    onClick={() => setFilterMode("all")}
                >
                    <FaGlobe /> Tous les livreurs
                </button>
                <button
                    className={`filter-btn ${filterMode === "myZone" ? "active" : ""}`}
                    onClick={() => setFilterMode("myZone")}
                    disabled={zoneCities.length === 0}
                    style={{
                        opacity: zoneCities.length === 0 ? 0.5 : 1,
                        cursor: zoneCities.length === 0 ? "not-allowed" : "pointer"
                    }}
                >
                    <FaUserSecret /> 📍 Ma zone ({dispatcherZoneName || "Non définie"})
                </button>
            </div>

            <div className="livreurs-cards-container">
                {filteredLivreurs.map((livreur) => {
                    const count = getParcelCount(livreur.userId);
                    const livreurParcels = getLivreurParcels(livreur.userId);
                    const isExpanded = expandedLivreur === livreur.userId;
                    const inMyZone = isLivreurInDispatcherZone(livreur);

                    return (
                        <div key={livreur.userId} className="livreur-card-modern">
                            <div className="livreur-card-header" onClick={() => toggleExpand(livreur.userId)}>
                                <div className="livreur-avatar">
                                    {livreur.profileImageUrl ? (
                                        <img src={`${IMAGE_BASE_URL}/${livreur.profileImageUrl}`} alt="Profile" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {livreur.firstName?.[0]}{livreur.lastName?.[0]}
                                        </div>
                                    )}
                                </div>

                                <div className="livreur-info-main">
                                    <div className="livreur-name">
                                        {livreur.firstName} {livreur.lastName}
                                        <span className={`status-dot ${count > 0 ? 'busy' : 'free'}`}></span>
                                        {filterMode === "all" && inMyZone && dispatcherZoneName && (
                                            <span className="same-zone-badge">📍 Ma zone</span>
                                        )}
                                    </div>
                                    <div className="livreur-details">
                                        <span><FaPhone /> {livreur.phone || "Non renseigné"}</span>
                                        <span><FaMapMarkerAlt /> {livreur.zone || livreur.city || livreur.address || "Ville non définie"}</span>
                                        <span><FaMotorcycle /> {livreur.vehicleType || "Véhicule non spécifié"}</span>
                                    </div>
                                </div>

                                <div className="livreur-stats">
                                    <div className="stat-badge-colis">
                                        <FaBox /> {count} colis
                                    </div>
                                    <div className="expand-icon">
                                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="livreur-parcels-section">
                                    <div className="parcels-header">
                                        <h4>📦 Colis assignés ({count})</h4>
                                    </div>

                                    {livreurParcels.length === 0 ? (
                                        <div className="no-parcels-message">
                                            <FaBox /> Aucun colis assigné pour le moment
                                        </div>
                                    ) : (
                                        <div className="parcels-list">
                                            {livreurParcels.map((parcel) => {
                                                const status = getStatusBadge(parcel.status);
                                                return (
                                                    <div key={parcel.id} className="parcel-item-card">
                                                        <div className="parcel-item-header">
                                                            <div className="parcel-tracking">
                                                                <FaTruck className="tracking-icon" />
                                                                <span className="tracking-code">{parcel.trackingNumber}</span>
                                                            </div>
                                                            <div className="parcel-status" style={{ background: status.bg, color: status.color }}>
                                                                {status.text}
                                                            </div>
                                                        </div>

                                                        <div className="parcel-item-details">
                                                            <div className="detail-row">
                                                                <div className="detail">
                                                                    <label>📍 Adresse</label>
                                                                    <p>{parcel.deliveryAddress}</p>
                                                                </div>
                                                            </div>
                                                            <div className="detail-row two-cols">
                                                                <div className="detail">
                                                                    <label>👤 Client</label>
                                                                    <p>{parcel.senderName || "Non spécifié"}</p>
                                                                </div>
                                                                <div className="detail">
                                                                    <label>📞 Téléphone</label>
                                                                    <p>{parcel.senderPhone || "Non renseigné"}</p>
                                                                </div>
                                                            </div>
                                                            <div className="detail-row two-cols">
                                                                <div className="detail">
                                                                    <label>⚖️ Poids</label>
                                                                    <p>{parcel.weight} kg</p>
                                                                </div>
                                                                <div className="detail">
                                                                    <label>📅 Date création</label>
                                                                    <p>{formatDate(parcel.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                            {parcel.deliveredAt && (
                                                                <div className="detail-row">
                                                                    <div className="detail">
                                                                        <label>✅ Date livraison</label>
                                                                        <p>{formatDate(parcel.deliveredAt)}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredLivreurs.length === 0 && (
                <div className="empty-state-v4">
                    <FaBox className="empty-icon" />
                    <h3>Aucun livreur trouvé</h3>
                    <p>
                        {filterMode === "myZone"
                            ? `Aucun livreur dans votre zone (${dispatcherZoneName || "Non définie"})`
                            : "Essayez de modifier votre recherche"}
                    </p>
                </div>
            )}

            <style>{`
                .livreurs-container-v4 {
                    padding: 25px;
                    background: #FBF4F4;
                    min-height: 100vh;
                }

                .list-header-v4 {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .header-title h2 {
                    margin: 0 0 5px 0;
                    color: #1a2a3a;
                    font-size: 24px;
                }

                .header-title span {
                    color: #A5AEAD;
                    font-size: 13px;
                }

                .search-wrapper-v4 {
                    display: flex;
                    align-items: center;
                    background: white;
                    border-radius: 40px;
                    padding: 12px 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    gap: 12px;
                }

                .search-wrapper-v4 svg {
                    color: #A5AEAD;
                }

                .search-wrapper-v4 input {
                    border: none;
                    outline: none;
                    font-size: 14px;
                    width: 250px;
                }

                .filter-buttons-v4 {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                }

                .filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 40px;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s;
                    background: white;
                    color: #4D5C71;
                    border: 1px solid #E8E0E0;
                }

                .filter-btn.active {
                    background: linear-gradient(135deg, #4D5C71, #3b4e61);
                    color: white;
                    border-color: transparent;
                }

                .filter-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }

                .filter-btn:disabled {
                    cursor: not-allowed;
                }

                .same-zone-badge {
                    background: #2ecc71;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 600;
                    margin-left: 10px;
                }

                .livreurs-cards-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .livreur-card-modern {
                    background: white;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    transition: all 0.3s;
                }

                .livreur-card-modern:hover {
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }

                .livreur-card-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 20px 25px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .livreur-card-header:hover {
                    background: #FBF4F4;
                }

                .livreur-avatar {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: linear-gradient(135deg, #4D5C71, #3b4e61);
                }

                .livreur-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: 600;
                    color: white;
                }

                .livreur-info-main {
                    flex: 1;
                }

                .livreur-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a2a3a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                    flex-wrap: wrap;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    display: inline-block;
                }

                .status-dot.free {
                    background: #2ecc71;
                    box-shadow: 0 0 5px #2ecc71;
                }

                .status-dot.busy {
                    background: #f39c12;
                    box-shadow: 0 0 5px #f39c12;
                }

                .livreur-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    font-size: 13px;
                    color: #64748b;
                }

                .livreur-details span {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .livreur-stats {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .stat-badge-colis {
                    background: #FBF4F4;
                    padding: 8px 16px;
                    border-radius: 30px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #4D5C71;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .expand-icon {
                    color: #A5AEAD;
                    font-size: 18px;
                }

                .livreur-parcels-section {
                    border-top: 1px solid #E8E0E0;
                    padding: 20px 25px;
                    background: #FBF4F4;
                }

                .parcels-header h4 {
                    margin: 0 0 15px 0;
                    color: #1a2a3a;
                    font-size: 16px;
                }

                .no-parcels-message {
                    text-align: center;
                    padding: 30px;
                    color: #A5AEAD;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .parcels-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 15px;
                }

                .parcel-item-card {
                    background: white;
                    border-radius: 16px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    transition: all 0.2s;
                }

                .parcel-item-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                }

                .parcel-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #E8E0E0;
                }

                .parcel-tracking {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .tracking-icon {
                    color: #7B5B61;
                }

                .tracking-code {
                    font-weight: 700;
                    font-size: 13px;
                    color: #4D5C71;
                }

                .parcel-status {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .parcel-item-details {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .detail-row {
                    display: flex;
                    gap: 15px;
                }

                .detail-row.two-cols {
                    gap: 20px;
                }

                .detail {
                    flex: 1;
                }

                .detail label {
                    display: block;
                    font-size: 10px;
                    color: #A5AEAD;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }

                .detail p {
                    margin: 0;
                    font-size: 12px;
                    color: #1a2a3a;
                    font-weight: 500;
                    line-height: 1.4;
                }

                .empty-state-v4 {
                    text-align: center;
                    padding: 60px 20px;
                    background: white;
                    border-radius: 24px;
                }

                .empty-icon {
                    font-size: 64px;
                    color: #A5AEAD;
                    margin-bottom: 16px;
                }

                .empty-state-v4 h3 {
                    margin: 0 0 8px 0;
                    color: #4D5C71;
                }

                .empty-state-v4 p {
                    margin: 0;
                    color: #A5AEAD;
                }

                @media (max-width: 768px) {
                    .livreur-card-header {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .livreur-details {
                        justify-content: center;
                    }
                    
                    .parcels-list {
                        grid-template-columns: 1fr;
                    }
                    
                    .detail-row.two-cols {
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .filter-buttons-v4 {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default LivreurList;