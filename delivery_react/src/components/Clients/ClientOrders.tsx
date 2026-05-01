import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBox, FaTruck, FaCheckCircle, FaClock, FaMapMarkerAlt, FaUser, FaEdit, FaTrashAlt, FaEye, FaPhone, FaTimes, FaCheck, FaHistory, FaArrowRight } from "react-icons/fa";
import Swal from 'sweetalert2';

interface ClientOrdersProps {
    parcels: any[];
    onRefresh: () => void;
    onTrackLivreur: (livreurId: string) => void;
    onViewHistory?: () => void;  // 🔥 Nouvelle prop pour naviguer vers l'historique
}

const ClientOrders: React.FC<ClientOrdersProps> = ({ parcels, onRefresh, onTrackLivreur, onViewHistory }) => {
    const [editingParcel, setEditingParcel] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newAddress, setNewAddress] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const GATEWAY_URL = "http://localhost:8888";

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const getStatusConfig = (status: string) => {
        const configs: any = {
            PENDING: { text: 'En attente', color: '#f59e0b', bg: '#fffbeb', icon: <FaClock />, progress: 25 },
            ASSIGNED: { text: 'Assigné', color: '#3b82f6', bg: '#eff6ff', icon: <FaUser />, progress: 40 },
            IN_TRANSIT: { text: 'En transit', color: '#10b981', bg: '#ecfdf5', icon: <FaTruck />, progress: 70 },
            DELIVERED: { text: 'Livré', color: '#059669', bg: '#ecfdf5', icon: <FaCheckCircle />, progress: 100 },
            RETURNED: { text: 'Retourné', color: '#ef4444', bg: '#fef2f2', icon: <FaTrashAlt />, progress: 0 },
            CANCELLED: { text: 'Annulé', color: '#6b7280', bg: '#f9fafb', icon: <FaTimes />, progress: 0 }
        };
        return configs[status] || { text: status, color: '#6b7280', bg: '#f9fafb', icon: <FaBox />, progress: 0 };
    };

    const handleEditParcel = (parcel: any) => {
        setEditingParcel(parcel);
        setNewAddress(parcel.deliveryAddress || "");
        setNewPhone(parcel.senderPhone || "");
        setShowEditModal(true);
    };

    const confirmEditParcel = async () => {
        if (!newAddress.trim()) {
            Swal.fire('Erreur', 'Veuillez entrer une adresse valide', 'error');
            return;
        }
        if (!newPhone.trim()) {
            Swal.fire('Erreur', 'Veuillez entrer un numéro de téléphone valide', 'error');
            return;
        }

        setLoading(true);
        try {
            await axios.patch(
                `${GATEWAY_URL}/parcel-service/api/parcels/${editingParcel.id}/client-update`,
                {
                    deliveryAddress: newAddress,
                    senderPhone: newPhone
                },
                getHeaders()
            );
            Swal.fire({
                icon: 'success',
                title: 'Modifié!',
                text: 'Les informations ont été mises à jour',
                timer: 2000,
                showConfirmButton: false
            });
            setShowEditModal(false);
            onRefresh();
        } catch (err) {
            console.error("Erreur:", err);
            Swal.fire('Erreur', 'Impossible de modifier les informations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelParcel = async (parcel: any) => {
        const result = await Swal.fire({
            title: 'Annuler la commande?',
            text: `Voulez-vous vraiment annuler le colis ${parcel.trackingNumber}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Oui, annuler',
            cancelButtonText: 'Non'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await axios.patch(
                    `${GATEWAY_URL}/parcel-service/api/parcels/${parcel.id}/cancel`,
                    {},
                    getHeaders()
                );
                Swal.fire('Annulé!', 'La commande a été annulée', 'success');
                onRefresh();
            } catch (err: any) {
                console.error("Erreur:", err);
                const errorMsg = err.response?.data?.message || "Impossible d'annuler la commande";
                Swal.fire('Erreur', errorMsg, 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const activeParcels = parcels.filter(p => p.status !== 'CANCELLED' && p.status !== 'DELIVERED');
    const deliveredParcels = parcels.filter(p => p.status === 'DELIVERED');

    return (
        <div className="client-orders">
            {/* Header */}
            <div className="orders-header">
                <div className="header-left">
                    <h1 className="page-title">📦 Mes commandes</h1>
                    <p className="page-subtitle">Suivez et gérez vos colis en toute simplicité</p>
                </div>
                <div className="stats-container">
                    <div className="stat-card active">
                        <span className="stat-value">{activeParcels.length}</span>
                        <span className="stat-label">En cours</span>
                    </div>
                    <div className="stat-card delivered">
                        <span className="stat-value">{deliveredParcels.length}</span>
                        <span className="stat-label">Livrés</span>
                    </div>
                </div>
            </div>

            {activeParcels.length === 0 && deliveredParcels.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>Aucun colis pour le moment</h3>
                    <p>Vos commandes apparaîtront ici une fois passées.</p>
                </div>
            ) : (
                <>
                    {/* Active Orders */}
                    {activeParcels.length > 0 && (
                        <div className="orders-section">
                            <div className="section-header">
                                <h2>Commandes en cours</h2>
                                <span className="section-badge">{activeParcels.length}</span>
                            </div>
                            <div className="orders-grid">
                                {activeParcels.map((parcel: any, idx: number) => {
                                    const status = getStatusConfig(parcel.status);
                                    return (
                                        <div key={parcel.id} className="order-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                                            <div className="card-status-bar" style={{ backgroundColor: status.color }}></div>
                                            <div className="card-content">
                                                <div className="card-top">
                                                    <div className="tracking">
                                                        <FaBox className="tracking-icon" />
                                                        <span className="tracking-number">{parcel.trackingNumber}</span>
                                                    </div>
                                                    <div className="status" style={{ color: status.color, backgroundColor: status.bg }}>
                                                        {status.icon}
                                                        <span>{status.text}</span>
                                                    </div>
                                                </div>

                                                <div className="card-details">
                                                    <div className="detail-item">
                                                        <FaMapMarkerAlt />
                                                        <div>
                                                            <label>Adresse de livraison</label>
                                                            <p>{parcel.deliveryAddress}</p>
                                                        </div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <FaPhone />
                                                        <div>
                                                            <label>Téléphone</label>
                                                            <p>{parcel.senderPhone || "Non renseigné"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-item small">
                                                            <label>Poids</label>
                                                            <p>{parcel.weight} kg</p>
                                                        </div>
                                                        <div className="detail-item small">
                                                            <label>Expéditeur</label>
                                                            <p>{parcel.senderName || "Non spécifié"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {parcel.status !== 'DELIVERED' && parcel.status !== 'RETURNED' && (
                                                    <div className="progress-section">
                                                        <div className="progress-info">
                                                            <span>Progression</span>
                                                            <span>{status.progress}%</span>
                                                        </div>
                                                        <div className="progress-bar">
                                                            <div className="progress-fill" style={{ width: `${status.progress}%`, backgroundColor: status.color }}></div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="card-actions">
                                                    {parcel.status === 'IN_TRANSIT' && parcel.assignedLivreurId && (
                                                        <button className="btn-track" onClick={() => onTrackLivreur(parcel.assignedLivreurId)}>
                                                            <FaEye /> Suivre
                                                        </button>
                                                    )}
                                                    {(parcel.status === 'PENDING' || parcel.status === 'ASSIGNED') && (
                                                        <>
                                                            <button className="btn-edit" onClick={() => handleEditParcel(parcel)}>
                                                                <FaEdit /> Modifier
                                                            </button>
                                                            <button className="btn-cancel" onClick={() => handleCancelParcel(parcel)}>
                                                                <FaTrashAlt /> Annuler
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Delivered Orders - Version avec bouton Voir tout l'historique */}
                    {deliveredParcels.length > 0 && (
                        <div className="orders-section delivered">
                            <div className="section-header">
                                <h2>📜 Dernières livraisons</h2>
                                <span className="section-badge">{deliveredParcels.slice(0, 3).length} récentes</span>
                                {onViewHistory && (
                                    <button className="btn-view-all-history" onClick={onViewHistory}>
                                        Voir tout l'historique <FaArrowRight />
                                    </button>
                                )}
                            </div>
                            <div className="delivered-grid">
                                {deliveredParcels.slice(0, 3).map((parcel: any) => (
                                    <div key={parcel.id} className="delivered-card">
                                        <div className="delivered-icon">✅</div>
                                        <div className="delivered-info">
                                            <span className="delivered-tracking">{parcel.trackingNumber}</span>
                                            <span className="delivered-date">
                                                {new Date(parcel.deliveredAt || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bouton Voir tout l'historique - Version mobile */}
                            {onViewHistory && deliveredParcels.length > 3 && (
                                <div className="view-all-mobile">
                                    <button className="btn-view-all-mobile" onClick={onViewHistory}>
                                        <FaHistory /> Voir les {deliveredParcels.length} livraisons
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Si pas de livraisons récentes mais on veut quand même voir l'historique */}
                    {deliveredParcels.length === 0 && onViewHistory && (
                        <div className="no-deliveries-yet">
                            <button className="btn-view-history-empty" onClick={onViewHistory}>
                                <FaHistory /> Voir l'historique des livraisons
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {showEditModal && editingParcel && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Modifier les informations</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-tracking">
                                <FaBox />
                                <span>{editingParcel.trackingNumber}</span>
                            </div>
                            <div className="form-group">
                                <label>Adresse de livraison</label>
                                <textarea
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    rows={3}
                                    placeholder="Nouvelle adresse"
                                />
                            </div>
                            <div className="form-group">
                                <label>Téléphone</label>
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="Nouveau numéro"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowEditModal(false)}>Annuler</button>
                            <button className="btn-modal-confirm" onClick={confirmEditParcel} disabled={loading}>
                                {loading ? <div className="spinner"></div> : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* ===== STYLE EXISTANT (garde tout ton style actuel) ===== */
                .client-orders {
                    background: #FBF4F4;
                    border-radius: 28px;
                    padding: 25px;
                }

                /* Header */
                .orders-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin-bottom: 32px;
                }
                .page-title {
                    font-size: 26px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    color: #1a2a3a;
                }
                .page-subtitle {
                    font-size: 13px;
                    color: #A5AEAD;
                    margin: 0;
                }
                .stats-container {
                    display: flex;
                    gap: 12px;
                }
                .stat-card {
                    background: white;
                    border-radius: 20px;
                    padding: 12px 24px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    min-width: 100px;
                    transition: all 0.3s;
                }
                .stat-card.active {
                    border-bottom: 3px solid #f59e0b;
                }
                .stat-card.delivered {
                    border-bottom: 3px solid #10b981;
                }
                .stat-card:hover {
                    transform: translateY(-3px);
                }
                .stat-value {
                    display: block;
                    font-size: 28px;
                    font-weight: 800;
                    color: #1a2a3a;
                }
                .stat-label {
                    font-size: 11px;
                    color: #A5AEAD;
                    font-weight: 500;
                }

                /* Section Header */
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .section-header h2 {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1a2a3a;
                    margin: 0;
                }
                .section-badge {
                    background: #E8E0E0;
                    color: #7B5B61;
                    padding: 2px 10px;
                    border-radius: 30px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                /* 🔥 Nouveau bouton Voir tout l'historique */
                .btn-view-all-history {
                    background: linear-gradient(135deg, #4D5C71, #3b4e61);
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 30px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-left: auto;
                    transition: all 0.3s;
                }
                .btn-view-all-history:hover {
                    transform: translateX(3px);
                    filter: brightness(1.05);
                }
                .view-all-mobile {
                    display: none;
                    margin-top: 15px;
                    text-align: center;
                }
                .btn-view-all-mobile {
                    background: linear-gradient(135deg, #4D5C71, #3b4e61);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 40px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s;
                    width: 100%;
                    justify-content: center;
                }
                .btn-view-all-mobile:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.05);
                }
                .btn-view-history-empty {
                    background: linear-gradient(135deg, #4D5C71, #3b4e61);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 40px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 20px auto;
                    transition: all 0.3s;
                }
                .btn-view-history-empty:hover {
                    transform: translateY(-3px);
                    filter: brightness(1.05);
                }
                .no-deliveries-yet {
                    text-align: center;
                    margin-top: 20px;
                }

                /* Grid */
                .orders-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }

                /* Card */
                .order-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    animation: fadeInUp 0.4s ease forwards;
                    opacity: 0;
                    transform: translateY(20px);
                }
                @keyframes fadeInUp {
                    to { opacity: 1; transform: translateY(0); }
                }
                .order-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
                .card-status-bar {
                    height: 4px;
                    width: 100%;
                }
                .card-content {
                    padding: 20px;
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .tracking {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #FBF4F4;
                    padding: 6px 14px;
                    border-radius: 30px;
                }
                .tracking-icon {
                    color: #7B5B61;
                    font-size: 12px;
                }
                .tracking-number {
                    font-weight: 700;
                    font-size: 12px;
                    color: #4D5C71;
                }
                .status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 14px;
                    border-radius: 30px;
                    font-size: 12px;
                    font-weight: 600;
                }

                /* Details */
                .card-details {
                    margin-bottom: 16px;
                }
                .detail-item {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 12px;
                    font-size: 13px;
                }
                .detail-item svg {
                    color: #7B5B61;
                    margin-top: 2px;
                    flex-shrink: 0;
                }
                .detail-item label {
                    display: block;
                    font-size: 10px;
                    color: #A5AEAD;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 3px;
                    font-weight: 600;
                }
                .detail-item p {
                    margin: 0;
                    color: #1a2a3a;
                    font-weight: 500;
                    font-size: 13px;
                }
                .detail-row {
                    display: flex;
                    gap: 20px;
                }
                .detail-item.small {
                    flex: 1;
                    margin-bottom: 0;
                }

                /* Progress */
                .progress-section {
                    margin: 16px 0;
                }
                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #A5AEAD;
                    margin-bottom: 6px;
                }
                .progress-bar {
                    height: 6px;
                    background: #E8E0E0;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.3s ease;
                }

                /* Actions */
                .card-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #E8E0E0;
                }
                .card-actions button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .btn-track {
                    background: #4D5C71;
                    color: white;
                }
                .btn-edit {
                    background: #f59e0b;
                    color: white;
                }
                .btn-cancel {
                    background: #ef4444;
                    color: white;
                }
                .card-actions button:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.05);
                }

                /* Delivered section */
                .orders-section.delivered {
                    margin-top: 20px;
                }
                .delivered-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .delivered-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: white;
                    padding: 14px 18px;
                    border-radius: 16px;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .delivered-card:hover {
                    background: #E8E0E0;
                    transform: translateX(5px);
                }
                .delivered-icon {
                    font-size: 22px;
                }
                .delivered-info {
                    flex: 1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .delivered-tracking {
                    font-weight: 700;
                    font-size: 13px;
                    color: #4D5C71;
                }
                .delivered-date {
                    font-size: 11px;
                    color: #A5AEAD;
                }

                /* Empty state */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    background: white;
                    border-radius: 24px;
                }
                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                }
                .empty-state h3 {
                    margin: 0 0 8px 0;
                    color: #4D5C71;
                }
                .empty-state p {
                    margin: 0;
                    color: #A5AEAD;
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal {
                    background: white;
                    border-radius: 24px;
                    width: 90%;
                    max-width: 500px;
                    animation: modalSlide 0.3s ease;
                }
                @keyframes modalSlide {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #E8E0E0;
                    background: #4D5C71;
                    color: white;
                    border-radius: 24px 24px 0 0;
                }
                .modal-header h3 { margin: 0; font-size: 18px; }
                .modal-close {
                    background: rgba(255,255,255,0.15);
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    transition: 0.2s;
                }
                .modal-close:hover {
                    background: rgba(255,255,255,0.3);
                    transform: rotate(90deg);
                }
                .modal-body { padding: 24px; }
                .modal-tracking {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #FBF4F4;
                    padding: 12px 16px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    color: #4D5C71;
                    font-weight: 600;
                    font-size: 13px;
                }
                .form-group { margin-bottom: 20px; }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    font-size: 13px;
                    color: #1a2a3a;
                }
                .form-group textarea, .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #E8E0E0;
                    border-radius: 12px;
                    font-size: 14px;
                    transition: 0.2s;
                    font-family: inherit;
                }
                .form-group textarea:focus, .form-group input:focus {
                    outline: none;
                    border-color: #7B5B61;
                    box-shadow: 0 0 0 3px rgba(123,91,97,0.1);
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 24px;
                    border-top: 1px solid #E8E0E0;
                }
                .btn-modal-cancel {
                    background: #A5AEAD;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    color: white;
                }
                .btn-modal-confirm {
                    background: #10b981;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    color: white;
                }
                .btn-modal-confirm:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid white;
                    border-top: 2px solid transparent;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Responsive */
                @media (max-width: 768px) {
                    .orders-grid { grid-template-columns: 1fr; }
                    .orders-header { flex-direction: column; align-items: flex-start; }
                    .stats-container { width: 100%; }
                    .stat-card { flex: 1; text-align: center; }
                    .card-actions { flex-direction: column; }
                    .card-actions button { justify-content: center; }
                    .btn-view-all-history { display: none; }
                    .view-all-mobile { display: block; }
                }
            `}</style>
        </div>
    );
};

export default ClientOrders;