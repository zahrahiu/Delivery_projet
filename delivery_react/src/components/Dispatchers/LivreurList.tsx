import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUser, FaPhone, FaMapMarkerAlt, FaMotorcycle, FaSearch, FaUserCircle } from "react-icons/fa";
import "./LivreurList.css";

const LivreurList: React.FC = () => {
    const [livreurs, setLivreurs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:8081/api/profiles";

    const fetchLivreurs = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const filtered = response.data.filter((u: any) => u.role === "LIVREUR");
            setLivreurs(filtered);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Error:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLivreurs();
    }, []);

    const filteredLivreurs = livreurs.filter(l =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="livreurs-section">
            <div className="colis-header">
                <div className="header-text">
                    <h2>Flotte de Livreurs</h2>
                    <p>{livreurs.length} livreurs actifs</p>
                </div>

                <div className="search-bar-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher un livreur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Chargement...</div>
            ) : (
                <div className="livreurs-grid">
                    {filteredLivreurs.map((l) => (
                        <div key={l.userId} className="livreur-card-v2">
                            <div className="card-top">
                                <div className="avatar-section-small">
                                    {l.profileImageUrl ? (
                                        <img
                                            src={`http://localhost:8081/uploads/${l.profileImageUrl}`}
                                            alt="Livreur"
                                            className="livreur-img-circle"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                // إلا وقع خطأ كنرجعو للأيقونة الافتراضية
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('fallback-avatar');
                                            }}
                                        />
                                    ) : (
                                        <FaUserCircle size={45} color="#5d6b6b" />
                                    )}
                                </div>
                                <span className="status-indicator online">Disponible</span>
                            </div>

                            <div className="card-info">
                                <h3>{l.firstName} {l.lastName}</h3>
                                <div className="info-row">
                                    <FaPhone className="icon-small" />
                                    <span>{l.phone || "---"}</span>
                                </div>
                                <div className="info-row">
                                    <FaMapMarkerAlt className="icon-small" />
                                    <span>{l.zone || l.city || "Marrakech"}</span>
                                </div>
                                <div className="info-row">
                                    <FaMotorcycle className="icon-small" />
                                    <span>{l.vehicleType || "Moto"}</span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <button className="btn-tournee">Voir Profil</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LivreurList;