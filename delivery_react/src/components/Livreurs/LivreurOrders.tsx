import React, { useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaTruck, FaCheckCircle, FaFlag, FaPhone, FaMapMarkerAlt, FaSearch, FaFileAlt, FaEye } from "react-icons/fa";

interface LivreurOrdersProps {
    parcels: any[];
    onRefresh: () => void;
}

const LivreurOrders: React.FC<LivreurOrdersProps> = ({ parcels, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [showBonModal, setShowBonModal] = useState(false);
    const GATEWAY_URL = "http://localhost:8888";

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const updateStatus = async (parcelId: number, newStatus: string) => {
        setUpdatingId(parcelId);
        try {
            await axios.patch(
                `${GATEWAY_URL}/parcel-service/api/parcels/${parcelId}/status?status=${newStatus}`,
                {},
                getHeaders()
            );

            Swal.fire({
                icon: 'success',
                title: 'Statut mis à jour',
                text: `Le colis est maintenant ${newStatus === 'IN_TRANSIT' ? 'en transit' : 'livré'}`,
                timer: 1500,
                showConfirmButton: false
            });
            onRefresh();
        } catch (err) {
            Swal.fire('Erreur', 'Impossible de mettre à jour le statut', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const reportProblem = async (parcel: any) => {
        const { value: problem } = await Swal.fire({
            title: 'Signaler un problème',
            input: 'textarea',
            inputLabel: 'Description du problème',
            inputPlaceholder: 'Client absent, adresse incorrecte...',
            showCancelButton: true,
            confirmButtonText: 'Envoyer',
            cancelButtonText: 'Annuler'
        });

        if (problem) {
            try {
                await axios.post(
                    `${GATEWAY_URL}/parcel-service/api/parcels/${parcel.id}/report-problem`,
                    problem, // Sifti l-string direct
                    {
                        headers: {
                            ...getHeaders().headers,
                            'Content-Type': 'text/plain' // Zid hada darori bach Spring Controller y-fhem
                        }
                    }
                );

                Swal.fire({
                    icon: 'warning',
                    title: 'Problème signalé',
                    text: 'Le statut du colis est passé en "Retourné"',
                    timer: 2000,
                    showConfirmButton: false
                });

                onRefresh(); // Recharger la liste
            } catch (err) {
                Swal.fire('Erreur', 'Impossible de signaler le problème', 'error');
            }
        }
    };

    const openBonLivraison = (parcel: any) => {
        setSelectedParcel(parcel);
        setShowBonModal(true);
    };

    const getStatusBadge = (status: string) => {
        const config: any = {
            PENDING: { class: 'pending', text: '⏳ En attente' },
            ASSIGNED: { class: 'assigned', text: '👤 Assigné' },
            IN_TRANSIT: { class: 'transit', text: '🚚 En transit' },
            DELIVERED: { class: 'delivered', text: '✅ Livré' },
            RETURNED: { class: 'returned', text: '↩️ Retourné' }  // ✅ أضف هاد
        };
        return config[status] || { class: 'default', text: status };
    };

    const filteredParcels = parcels.filter(p =>
        p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingParcels = filteredParcels.filter(p => p.status !== 'DELIVERED');
    const deliveredParcels = filteredParcels.filter(p => p.status === 'DELIVERED');

    return (
        <div className="orders-container">
            {/* Modal Bon de Livraison */}
            {showBonModal && selectedParcel && (
                <BonLivraisonModal
                    parcel={selectedParcel}
                    onClose={() => setShowBonModal(false)}
                    onConfirm={() => {
                        setShowBonModal(false);
                        onRefresh();
                    }}
                />
            )}

            <div className="orders-header">
                <h2>📦 Mes livraisons</h2>
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher par tracking ou adresse..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Colis à livrer */}
            <div className="parcels-section">
                <h3>📋 À livrer ({pendingParcels.length})</h3>
                {pendingParcels.length === 0 ? (
                    <div className="empty-state">🎉 Aucun colis à livrer pour le moment!</div>
                ) : (
                    <div className="parcels-grid">
                        {pendingParcels.map(parcel => {
                            const badge = getStatusBadge(parcel.status);
                            return (
                                <div key={parcel.id} className="parcel-card">
                                    <div className="card-header">
                                        <span className="tracking-number">{parcel.trackingNumber}</span>
                                        <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                                    </div>

                                    <div className="card-body">
                                        <div className="info-row">
                                            <FaMapMarkerAlt className="info-icon" />
                                            <div>
                                                <label>Adresse de livraison</label>
                                                <p>{parcel.deliveryAddress}</p>
                                            </div>
                                        </div>
                                        <div className="info-row">
                                            <FaPhone className="info-icon" />
                                            <div>
                                                <label>Téléphone client</label>
                                                <p>{parcel.senderPhone || "Non renseigné"}</p>
                                            </div>
                                        </div>
                                        <div className="info-row">
                                            <div className="weight-info">
                                                <label>Poids</label>
                                                <p>{parcel.weight} kg</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        {parcel.status === 'ASSIGNED' && (
                                            <button
                                                className="btn-start"
                                                onClick={() => updateStatus(parcel.id, 'IN_TRANSIT')}
                                                disabled={updatingId === parcel.id}
                                            >
                                                <FaTruck /> Commencer
                                            </button>
                                        )}

                                        {parcel.status === 'IN_TRANSIT' && (
                                            <>
                                                <button
                                                    className="btn-deliver"
                                                    onClick={() => openBonLivraison(parcel)}
                                                >
                                                    <FaFileAlt /> Bon livraison
                                                </button>
                                            </>
                                        )}

                                        <button
                                            className="btn-report"
                                            onClick={() => reportProblem(parcel)}
                                        >
                                            <FaFlag /> Signaler
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>



            <style>{`
                .orders-container { max-width: 1200px; margin: 0 auto; }
                .orders-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
                .orders-header h2 { color: #1a2a3a; }
                .search-box { display: flex; align-items: center; background: white; border-radius: 30px; padding: 8px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .search-icon { color: #999; margin-right: 10px; }
                .search-box input { border: none; outline: none; width: 250px; font-size: 14px; }
                .parcels-section { margin-bottom: 40px; }
                .parcels-section h3 { margin-bottom: 20px; color: #3b4e61; }
                .parcels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
                .parcel-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: 0.2s; }
                .parcel-card:hover { transform: translateY(-3px); box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                .tracking-number { font-weight: 700; color: #3b4e61; }
                .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
                .status-badge.pending { background: #fef3e2; color: #f39c12; }
                .status-badge.assigned { background: #e3f2fd; color: #3498db; }
                .status-badge.transit { background: #e8f5e9; color: #2ecc71; }
                .card-body { margin-bottom: 20px; }
                .info-row { display: flex; gap: 12px; margin-bottom: 12px; }
                .status-badge.returned { background: #fce4ec; color: #c62828; }
                .info-icon { color: #3b4e61; margin-top: 2px; min-width: 20px; }
                .info-row label { font-size: 10px; color: #999; text-transform: uppercase; display: block; }
                .info-row p { font-size: 13px; color: #333; font-weight: 500; margin-top: 2px; }
                .card-actions { display: flex; gap: 10px; flex-wrap: wrap; }
                .btn-start, .btn-deliver, .btn-report { padding: 8px 16px; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
                .btn-start { background: #3498db; color: white; }
                .btn-deliver { background: #2ecc71; color: white; }
                .btn-report { background: #e67e22; color: white; }
                .btn-start:hover, .btn-deliver:hover, .btn-report:hover { transform: translateY(-2px); filter: brightness(1.05); }
                
                /* Historique */
                .history-section { background: white; border-radius: 16px; padding: 20px; margin-top: 20px; }
                .history-section h3 { margin-bottom: 20px; color: #3b4e61; }
                .history-header-row { display: grid; grid-template-columns: 1.5fr 2fr 1fr 0.8fr; padding: 10px 0; border-bottom: 2px solid #e0e0e0; font-weight: 700; color: #666; font-size: 12px; }
                .history-item { display: grid; grid-template-columns: 1.5fr 2fr 1fr 0.8fr; padding: 12px 0; border-bottom: 1px solid #f0f0f0; align-items: center; }
                .history-tracking { font-weight: 600; color: #3b4e61; font-size: 13px; }
                .history-address { color: #666; font-size: 12px; }
                .history-date { color: #999; font-size: 11px; }
                .history-view-btn { background: #3b4e61; color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 5px; width: fit-content; }
                .history-view-btn:hover { background: #2a3a4a; }
                .empty-state { text-align: center; padding: 60px; background: #f8f9fa; border-radius: 16px; color: #999; }
                
                @media (max-width: 800px) {
                    .history-header-row, .history-item { grid-template-columns: 1fr 1.5fr 0.8fr 0.8fr; gap: 10px; }
                }
            `}</style>
        </div>
    );
};

// Composant Bon de Livraison avec Signature
const BonLivraisonModal = ({ parcel, onClose, onConfirm }: { parcel: any; onClose: () => void; onConfirm: () => void }) => {
    const [signature, setSignature] = useState<string>("");
    const [clientName, setClientName] = useState("");
    const [isSigning, setIsSigning] = useState(false);
    const [loading, setLoading] = useState(false);
    const GATEWAY_URL = "http://localhost:8888";

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const handleConfirmDelivery = async () => {
        if (!clientName.trim()) {
            Swal.fire('Erreur', 'Veuillez entrer le nom du client', 'error');
            return;
        }
        if (!signature) {
            Swal.fire('Erreur', 'Veuillez ajouter une signature', 'error');
            return;
        }

        setLoading(true);
        try {
            // Mettre à jour le statut
            await axios.patch(
                `${GATEWAY_URL}/parcel-service/api/parcels/${parcel.id}/status?status=DELIVERED`,
                {},
                getHeaders()
            );

            // Envoyer la signature et la confirmation
            await axios.post(
                `${GATEWAY_URL}/parcel-service/api/parcels/${parcel.id}/confirm-delivery`,
                {
                    clientName: clientName,
                    signature: signature,
                    deliveredAt: new Date().toISOString()
                },
                getHeaders()
            );

            Swal.fire({
                icon: 'success',
                title: 'Livraison confirmée!',
                text: `Colis ${parcel.trackingNumber} livré à ${clientName}`,
                timer: 2000,
                showConfirmButton: false
            });
            onConfirm();
        } catch (err) {
            Swal.fire('Erreur', 'Impossible de confirmer la livraison', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Signature Pad simplifié (canvas)
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    let isDrawing = false;

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        isDrawing = true;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            ctx.lineTo(x, y);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        isDrawing = false;
        const canvas = canvasRef.current;
        if (canvas) {
            setSignature(canvas.toDataURL());
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setSignature("");
        }
    };

    return (
        <div className="bon-modal-overlay" onClick={onClose}>
            <div className="bon-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="bon-modal-header">
                    <h2>📄 Bon de livraison</h2>
                    <button className="bon-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="bon-modal-body">
                    {/* Infos colis */}
                    <div className="bon-info-section">
                        <h3>Informations du colis</h3>
                        <div className="bon-info-grid">
                            <div><label>N° Tracking</label><span>{parcel.trackingNumber}</span></div>
                            <div><label>Client</label><span>{parcel.senderName || "Non spécifié"}</span></div>                            <div><label>Poids</label><span>{parcel.weight} kg</span></div>
                            <div><label>Date</label><span>{new Date().toLocaleDateString()}</span></div>
                        </div>
                    </div>

                    <div className="bon-info-section">
                        <h3>Adresse de livraison</h3>
                        <div className="bon-address">
                            <FaMapMarkerAlt />
                            <span>{parcel.deliveryAddress}</span>
                        </div>
                    </div>

                    <div className="bon-info-section">
                        <h3>Confirmation client</h3>
                        <div className="bon-client-input">
                            <label>Nom du client</label>
                            <input
                                type="text"
                                placeholder="Nom complet du client"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bon-info-section">
                        <h3>Signature du client</h3>
                        <div className="signature-area">
                            <canvas
                                ref={canvasRef}
                                width={500}
                                height={150}
                                style={{ width: '100%', height: '150px', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={endDrawing}
                                onMouseLeave={endDrawing}
                            />
                            <button type="button" className="clear-sign-btn" onClick={clearSignature}>
                                Effacer
                            </button>
                        </div>
                        <p className="signature-note">Signez dans la zone ci-dessus</p>
                    </div>

                    <div className="bon-info-section">
                        <h3>Conditions</h3>
                        <div className="bon-terms">
                            <label className="checkbox-label">
                                <input type="checkbox" defaultChecked />
                                Je confirme avoir livré le colis en bon état
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" defaultChecked />
                                Le client a reçu son colis
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bon-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Annuler</button>
                    <button className="btn-confirm" onClick={handleConfirmDelivery} disabled={loading}>
                        {loading ? "Confirmation..." : "✅ Confirmer la livraison"}
                    </button>
                </div>

                <style>{`
                    .bon-modal-overlay {
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
                    .bon-modal-content {
                        background: white;
                        border-radius: 24px;
                        width: 90%;
                        max-width: 600px;
                        max-height: 85vh;
                        overflow-y: auto;
                        animation: slideUp 0.3s ease;
                    }
                    .bon-modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid #eee;
                        background: #3b4e61;
                        color: white;
                        border-radius: 24px 24px 0 0;
                    }
                    .bon-modal-header h2 { margin: 0; font-size: 20px; }
                    .bon-close-btn { background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; }
                    .bon-modal-body { padding: 24px; }
                    .bon-info-section { margin-bottom: 24px; }
                    .bon-info-section h3 { font-size: 14px; color: #3b4e61; margin-bottom: 12px; padding-bottom: 5px; border-bottom: 2px solid #f0f0f0; }
                    .bon-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                    .bon-info-grid div { background: #f8f9fa; padding: 10px; border-radius: 8px; }
                    .bon-info-grid label { display: block; font-size: 10px; color: #999; margin-bottom: 4px; }
                    .bon-info-grid span { font-size: 14px; font-weight: 600; color: #333; }
                    .bon-address { display: flex; align-items: center; gap: 10px; background: #f8f9fa; padding: 12px; border-radius: 8px; }
                    .bon-address svg { color: #e74c3c; }
                    .bon-client-input label { display: block; font-size: 12px; margin-bottom: 5px; color: #666; }
                    .bon-client-input input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
                    .signature-area { margin-bottom: 10px; }
                    .clear-sign-btn { margin-top: 8px; background: #e74c3c; color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; }
                    .signature-note { font-size: 11px; color: #999; margin-top: 8px; }
                    .bon-terms { display: flex; flex-direction: column; gap: 10px; }
                    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; cursor: pointer; }
                    .bon-modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 24px; border-top: 1px solid #eee; }
                    .btn-cancel { background: #95a5a6; color: white; border: none; padding: 10px 24px; border-radius: 30px; cursor: pointer; }
                    .btn-confirm { background: #2ecc71; color: white; border: none; padding: 10px 24px; border-radius: 30px; cursor: pointer; font-weight: 600; }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default LivreurOrders;