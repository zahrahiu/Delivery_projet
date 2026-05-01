import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaMapMarkerAlt, FaBox, FaUser, FaWeightHanging, FaCalendarAlt, FaFileAlt } from "react-icons/fa";
import logoSmall from "../../assets/img.png";

interface LivreurHistoryProps {
    parcels: any[];
}

const LivreurHistory: React.FC<LivreurHistoryProps> = ({ parcels }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [villesData, setVillesData] = useState<any[]>([]);
    const [loadingPrices, setLoadingPrices] = useState(true);

    const API_URL = "http://localhost:8888/tarif-zone-service/api/tarifs";

    // ✅ جلب الأسعار من API عند تحميل المكون
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get(API_URL);
                setVillesData(res.data);
            } catch (err) {
                console.error("Erreur chargement des prix:", err);
            } finally {
                setLoadingPrices(false);
            }
        };
        fetchPrices();
    }, []);

    const filteredParcels = parcels.filter(p =>
        p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openDetailsModal = (parcel: any) => {
        setSelectedParcel(parcel);
        setShowDetailsModal(true);
    };

    const closeModal = () => {
        setShowDetailsModal(false);
        setSelectedParcel(null);
    };

    // Formatage de la date
    const formatDate = (date: string) => {
        if (!date) return new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // ✅ Récupérer le prix de livraison dynamique depuis l'API
    const getDeliveryPrice = (parcel: any): number => {
        if (loadingPrices) return 0;

        // Chercher la ville dans les données
        const cityName = parcel.cityName || parcel.deliveryAddress?.split(',')[0]?.trim();

        const ville = villesData.find(v =>
            v.ville?.toLowerCase() === cityName?.toLowerCase() ||
            cityName?.toLowerCase().includes(v.ville?.toLowerCase())
        );

        const price = ville?.frais_livraison;

        // ✅ التحقق من نوع القيمة
        if (typeof price === 'number') return price;
        if (typeof price === 'string') return parseFloat(price) || 25;
        return 25;
    };

    const calculateTotalEncaisse = () => {
        if (loadingPrices) return 0;
        return parcels.reduce((sum, p) => {
            const price = getDeliveryPrice(p);
            return sum + price;
        }, 0);
    };

    const totalEncaisse = calculateTotalEncaisse();
    return (
        <div className="history-container">
            {/* Modal des détails */}
            {showDetailsModal && selectedParcel && (
                <div className="details-modal-overlay" onClick={closeModal}>
                    <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="details-modal-header">
                            <h2>📄 Détails de la livraison</h2>
                            <button className="details-close-btn" onClick={closeModal}>✕</button>
                        </div>

                        <div className="details-modal-body">
                            {/* Logo et en-tête */}
                            <div className="details-logo-section">
                                <div className="brand-icon"  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <img src={logoSmall} alt="Logo" style={{ height: '40px' }} />
                                </div>                                <div className="details-title">
                                    <h3>CONFIRMATION DE LIVRAISON</h3>
                                    <p>N° {selectedParcel.trackingNumber}</p>
                                </div>
                            </div>

                            {/* Informations du colis */}
                            <div className="details-info-section">
                                <h3>📦 Informations du colis</h3>
                                <div className="details-info-grid">
                                    <div className="details-info-item">
                                        <label>N° Tracking</label>
                                        <span className="details-info-value">{selectedParcel.trackingNumber}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <label>Date de livraison</label>
                                        <span className="details-info-value">{formatDate(selectedParcel.deliveredAt)}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <label>Client</label>
                                        <span className="details-info-value">{selectedParcel.senderName || "Non spécifié"}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <label>Téléphone</label>
                                        <span className="details-info-value">{selectedParcel.senderPhone || "Non spécifié"}</span>
                                    </div>
                                    <div className="details-info-item full-width">
                                        <label>Adresse de livraison</label>
                                        <span className="details-info-value address-value">{selectedParcel.deliveryAddress}</span>
                                    </div>
                                    <div className="details-info-item">
                                        <label>Poids</label>
                                        <span className="details-info-value">{selectedParcel.weight} kg</span>
                                    </div>
                                    <div className="details-info-item">
                                        <label>Prix de livraison</label>
                                        <span className="details-info-value price-value">{getDeliveryPrice(selectedParcel)} DH</span>
                                    </div>
                                    <div className="details-info-item">
                                        <label>Statut</label>
                                        <span className="details-info-value status-delivered">✅ Livré</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section signature */}
                            <div className="details-info-section">
                                <h3>✍️ Signature du client</h3>
                                <div className="details-signature-display">
                                    {selectedParcel.signature ? (
                                        <img
                                            src={selectedParcel.signature}
                                            alt="Signature du client"
                                            className="details-signature-image"
                                        />
                                    ) : (
                                        <div className="details-signature-placeholder">
                                            <p>Aucune signature disponible</p>
                                        </div>
                                    )}
                                </div>
                                <div className="details-signature-info">
                                    <p className="details-client-name">
                                        <strong>Nom du client:</strong> {selectedParcel.clientName || selectedParcel.senderName || "Non spécifié"}
                                    </p>
                                </div>
                            </div>

                            {/* Conditions */}
                            <div className="details-info-section">
                                <h3>📋 Conditions de livraison</h3>
                                <div className="details-terms-confirm">
                                    <div className="details-term-item">
                                        <span className="details-term-check">✓</span>
                                        <span>Le colis a été livré en bon état</span>
                                    </div>
                                    <div className="details-term-item">
                                        <span className="details-term-check">✓</span>
                                        <span>Le client a confirmé la réception</span>
                                    </div>
                                    <div className="details-term-item">
                                        <span className="details-term-check">✓</span>
                                        <span>La signature a été apposée</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="details-modal-footer">
                            <div className="details-footer-logo">
                                <p className="details-footer-text">QribLik - Livraison simplifiée</p>
                            </div>
                            <button className="details-close-final" onClick={closeModal}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header de la page */}
            <div className="history-header">
                <h2>📜 Historique des livraisons</h2>
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Statistiques */}
            <div className="stats-summary">
                <div className="stat">
                    <FaBox className="stat-icon" />
                    <div>
                        <span className="stat-value">{parcels.length}</span>
                        <span className="stat-label">Total livraisons</span>
                    </div>
                </div>
                <div className="stat">
                    <span className="stat-icon">💰</span>
                    <div>
                        <span className="stat-value">
                            {totalEncaisse} DH
                        </span>
                        <span className="stat-label">Total encaissé</span>
                    </div>
                </div>
            </div>

            {/* Liste des livraisons */}
            {loadingPrices ? (
                <div className="loading-state">Chargement des prix...</div>
            ) : filteredParcels.length === 0 ? (
                <div className="empty-state">Aucune livraison trouvée</div>
            ) : (
                <div className="history-grid">
                    {filteredParcels.map((parcel) => (
                        <div key={parcel.id} className="history-card-square">
                            <div className="history-card-header-square">
                                <div className="tracking-badge">
                                    <FaFileAlt className="tracking-icon" />
                                    <span>{parcel.trackingNumber}</span>
                                </div>
                                <span className="status-badge-square delivered">✅ Livré</span>
                            </div>

                            <div className="history-card-body-square">
                                <div className="info-line">
                                    <FaUser className="line-icon" />
                                    <div>
                                        <label>Client</label>
                                        <span>{parcel.senderName || "Non spécifié"}</span>
                                    </div>
                                </div>
                                <div className="info-line">
                                    <FaMapMarkerAlt className="line-icon" />
                                    <div>
                                        <label>Adresse</label>
                                        <span>{parcel.deliveryAddress?.substring(0, 60)}...</span>
                                    </div>
                                </div>
                                <div className="info-line two-cols">
                                    <div className="col">
                                        <FaWeightHanging className="line-icon" />
                                        <div>
                                            <label>Poids</label>
                                            <span>{parcel.weight} kg</span>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <span className="line-icon">💰</span>
                                        <div>
                                            <label>Prix</label>
                                            <span className="price-text">{getDeliveryPrice(parcel)} DH</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="info-line">
                                    <FaCalendarAlt className="line-icon" />
                                    <div>
                                        <label>Date</label>
                                        <span>{formatDate(parcel.deliveredAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="history-card-footer-square">
                                <button
                                    className="view-details-btn"
                                    onClick={() => openDetailsModal(parcel)}
                                >
                                    📄 Voir le bon de livraison
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .history-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
                .history-header h2 { color: #1a2a3a; margin: 0; }
                .search-box { display: flex; align-items: center; background: white; border-radius: 30px; padding: 8px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #eee; }
                .search-icon { color: #999; margin-right: 10px; }
                .search-box input { border: none; outline: none; width: 250px; font-size: 14px; }
                
                /* Stats */
                .stats-summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
                .stat { background: linear-gradient(135deg, #3b4e61, #4a5f75); border-radius: 16px; padding: 20px 30px; color: white; display: flex; align-items: center; gap: 15px; flex: 1; min-width: 200px; }
                .stat-icon { font-size: 32px; opacity: 0.9; }
                .stat-value { display: block; font-size: 28px; font-weight: bold; }
                .stat-label { display: block; font-size: 12px; opacity: 0.8; }
                
                /* Grid cards */
                .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
                .history-card-square { background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; transition: transform 0.2s; }
                .history-card-square:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
                
                .history-card-header-square { display: flex; justify-content: space-between; align-items: center; padding: 15px 18px; background: #f8f9fa; border-bottom: 1px solid #eee; }
                .tracking-badge { display: flex; align-items: center; gap: 8px; background: #e8eef3; padding: 6px 12px; border-radius: 20px; }
                .tracking-icon { color: #3b4e61; font-size: 14px; }
                .tracking-badge span { font-weight: 600; color: #3b4e61; font-size: 13px; }
                .status-badge-square { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
                .status-badge-square.delivered { background: #e8f5e9; color: #2ecc71; }
                
                .history-card-body-square { padding: 18px; }
                .info-line { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
                .line-icon { color: #3b4e61; font-size: 14px; margin-top: 2px; min-width: 18px; }
                .info-line label { display: block; font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 3px; }
                .info-line span { font-size: 13px; font-weight: 500; color: #333; }
                .info-line.two-cols { gap: 15px; }
                .info-line.two-cols .col { flex: 1; display: flex; gap: 10px; align-items: flex-start; }
                .price-text { color: #e67e22; font-weight: bold; }
                
                .history-card-footer-square { padding: 15px 18px; border-top: 1px solid #eee; background: #fafafa; }
                .view-details-btn { width: 100%; background: #3b4e61; color: white; border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 13px; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .view-details-btn:hover { background: #2a3a4a; transform: translateY(-2px); }
                
                .empty-state, .loading-state { text-align: center; padding: 60px; background: #f8f9fa; border-radius: 16px; color: #999; }
                
                /* Modal Styles */
                .details-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .details-modal-content {
                    background: white;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 650px;
                    max-height: 85vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                .details-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #eee;
                    background: #3b4e61;
                    color: white;
                    border-radius: 20px 20px 0 0;
                }
                .details-modal-header h2 { margin: 0; font-size: 20px; }
                .details-close-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    transition: 0.2s;
                }
                .details-close-btn:hover {
                    background: rgba(255,255,255,0.4);
                    transform: rotate(90deg);
                }
                .details-modal-body { padding: 24px; }
                
                .details-logo-section {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .details-logo { height: 50px; width: auto; }
                .details-title { text-align: right; }
                .details-title h3 { margin: 0; color: #3b4e61; font-size: 14px; letter-spacing: 1px; }
                .details-title p { margin: 5px 0 0; color: #666; font-size: 12px; }
                
                .details-info-section { margin-bottom: 25px; }
                .details-info-section h3 {
                    font-size: 15px;
                    color: #3b4e61;
                    margin-bottom: 15px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .details-info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                .details-info-item {
                    background: #f8f9fa;
                    padding: 10px 12px;
                    border-radius: 10px;
                }
                .details-info-item.full-width { grid-column: span 2; }
                .details-info-item label {
                    display: block;
                    font-size: 10px;
                    color: #999;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .details-info-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    display: block;
                }
                .address-value { font-size: 13px; font-weight: normal; line-height: 1.4; }
                .price-value { color: #e67e22; }
                .status-delivered { color: #2ecc71; }
                
                .details-signature-display {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    min-height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px dashed #ddd;
                }
                .details-signature-image { max-width: 100%; max-height: 100px; object-fit: contain; }
                .details-signature-placeholder { color: #999; font-size: 13px; }
                .details-signature-info { margin-top: 12px; text-align: center; }
                .details-client-name { font-size: 13px; color: #555; margin: 0; }
                
                .details-terms-confirm {
                    background: #e8f5e9;
                    border-radius: 12px;
                    padding: 15px;
                }
                .details-term-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    font-size: 13px;
                    color: #2e7d32;
                }
                .details-term-check {
                    width: 22px;
                    height: 22px;
                    background: #2ecc71;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }
                
                .details-modal-footer {
                    padding: 20px 24px;
                    border-top: 1px solid #eee;
                    text-align: center;
                    background: #f8f9fa;
                }
                .details-footer-logo { margin-bottom: 15px; }
                .details-footer-logo-img { height: 35px; width: auto; margin-bottom: 5px; }
                .details-footer-text { font-size: 11px; color: #999; margin: 0; }
                .details-close-final {
                    background: #3b4e61;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    transition: 0.2s;
                    margin-top: 10px;
                }
                .details-close-final:hover {
                    background: #2a3a4a;
                    transform: translateY(-2px);
                }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @media (max-width: 600px) {
                    .details-info-grid { grid-template-columns: 1fr; }
                    .details-info-item.full-width { grid-column: span 1; }
                    .details-logo-section { flex-direction: column; text-align: center; gap: 10px; }
                    .details-title { text-align: center; }
                    .history-grid { grid-template-columns: 1fr; }
                    .stats-summary { flex-direction: column; }
                }
            `}</style>
        </div>
    );
};

export default LivreurHistory;