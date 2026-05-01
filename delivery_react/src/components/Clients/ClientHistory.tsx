import React, { useState, useRef } from "react";
import axios from "axios";
import { FaBox, FaCheckCircle, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaPhone, FaWeightHanging, FaPrint, FaDownload, FaSearch, FaTimes, FaSignature, FaStore, FaTruck } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";
import logoSmall from "../../assets/img.png";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ClientHistoryProps {
    parcels: any[];
    onBack: () => void;
}

const ClientHistory: React.FC<ClientHistoryProps> = ({ parcels, onBack }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [showDeliveryNoteModal, setShowDeliveryNoteModal] = useState(false);
    const deliveryNoteRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const deliveredParcels = parcels.filter(p => p.status === 'DELIVERED');

    const formatDate = (date: string) => {
        if (!date) return new Date().toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const formatTime = (date: string) => {
        if (!date) return new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
        });
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredParcels = deliveredParcels.filter(p =>
        p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.senderName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openDeliveryNote = (parcel: any) => {
        setSelectedParcel(parcel);
        setShowDeliveryNoteModal(true);
    };

    const closeDeliveryNote = () => {
        setShowDeliveryNoteModal(false);
        setSelectedParcel(null);
    };

    // Impression
    const handlePrint = () => {
        const printContent = document.getElementById('delivery-note-content');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };

    // Téléchargement PDF de haute qualité
    const handleDownloadPDF = async () => {
        if (!deliveryNoteRef.current) return;

        setIsGenerating(true);

        try {
            const element = deliveryNoteRef.current;

            // Configuration de haute qualité pour html2canvas (sans scale)
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            } as any);

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210; // A4 width mm
            const pageHeight = 297; // A4 height mm

            const imgWidth = pageWidth - 20; // margin
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let finalWidth = imgWidth;
            let finalHeight = imgHeight;

            if (imgHeight > pageHeight - 20) {
                const ratio = (pageHeight - 20) / imgHeight;
                finalWidth = imgWidth * ratio;
                finalHeight = imgHeight * ratio;
            }

            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

            pdf.save(`Bon_Livraison_${selectedParcel?.trackingNumber}.pdf`);

            console.log("✅ PDF téléchargé avec succès");
        } catch (error) {
            console.error("❌ Erreur lors de la génération du PDF:", error);
            alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="client-history">
            {/* Modal Bon de Livraison */}
            {showDeliveryNoteModal && selectedParcel && (
                <div className="delivery-note-overlay" onClick={closeDeliveryNote}>
                    <div className="delivery-note-modal" onClick={(e) => e.stopPropagation()}>
                        <div ref={deliveryNoteRef} id="delivery-note-content" className="delivery-note-content">
                            {/* En-tête avec design élégant */}
                            <div className="delivery-note-header">
                                <div className="delivery-note-logo">
                                    <img src={logoSmall} alt="QribLik" style={{ height: '60px' }} />
                                </div>
                                <div className="delivery-note-title">
                                    <h1>BON DE LIVRAISON</h1>
                                    <p>N° {selectedParcel.trackingNumber}</p>
                                </div>
                            </div>

                            {/* Informations client - Design élégant */}
                            <div className="delivery-note-section">
                                <h3><FaUser /> Informations client</h3>
                                <div className="delivery-note-grid">
                                    <div className="info-card">
                                        <label>Nom complet</label>
                                        <p><strong>{selectedParcel.senderName || "Non spécifié"}</strong></p>
                                    </div>
                                    <div className="info-card">
                                        <label>Téléphone</label>
                                        <p><strong>{selectedParcel.senderPhone || "Non spécifié"}</strong></p>
                                    </div>
                                    <div className="info-card full-width">
                                        <label>Email</label>
                                        <p><strong>{selectedParcel.clientEmail || "Non spécifié"}</strong></p>
                                    </div>
                                </div>
                            </div>

                            {/* Informations colis */}
                            <div className="delivery-note-section">
                                <h3><FaBox /> Informations colis</h3>
                                <div className="delivery-note-grid">
                                    <div className="info-card">
                                        <label>N° Tracking</label>
                                        <p><strong>{selectedParcel.trackingNumber}</strong></p>
                                    </div>
                                    <div className="info-card">
                                        <label>Poids</label>
                                        <p><strong>{selectedParcel.weight} kg</strong></p>
                                    </div>
                                    <div className="info-card full-width">
                                        <label>Adresse de livraison</label>
                                        <p><strong>{selectedParcel.deliveryAddress}</strong></p>
                                    </div>
                                </div>
                            </div>

                            {/* Informations livraison */}
                            <div className="delivery-note-section">
                                <h3><FaCalendarAlt /> Informations de livraison</h3>
                                <div className="delivery-note-grid two-cols">
                                    <div className="info-card">
                                        <label>Date de livraison</label>
                                        <p><strong>{formatDate(selectedParcel.deliveredAt)}</strong></p>
                                    </div>
                                    <div className="info-card">
                                        <label>Heure de livraison</label>
                                        <p><strong>{formatTime(selectedParcel.deliveredAt)}</strong></p>
                                    </div>
                                </div>
                            </div>

                            {/* Signature */}
                            <div className="delivery-note-section signature-section">
                                <h3><FaSignature /> Signature du client</h3>
                                <div className="signature-area">
                                    {selectedParcel.signature ? (
                                        <img src={selectedParcel.signature} alt="Signature" className="signature-image" />
                                    ) : (
                                        <div className="signature-placeholder">
                                            <div className="signature-line"></div>
                                            <p>Signature électronique</p>
                                        </div>
                                    )}
                                </div>
                                <p className="signature-name">
                                    Nom du signataire: <strong>{selectedParcel.clientName || selectedParcel.senderName || "Client"}</strong>
                                </p>
                            </div>

                            {/* Mentions légales */}
                            <div className="delivery-note-footer">
                                <div className="footer-logo">
                                    <img src={logoSmall} alt="QribLik" style={{ height: '35px' }} />
                                </div>
                                <p>QribLik - Service de livraison express</p>
                                <p>Ce document fait office de preuve de livraison et engage la responsabilité du transporteur</p>
                                <div className="footer-date">
                                    <p>Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="delivery-note-actions">
                            <button className="action-print" onClick={handlePrint}><FaPrint /> Imprimer</button>
                            <button className="action-download" onClick={handleDownloadPDF} disabled={isGenerating}>
                                {isGenerating ? "Génération PDF..." : <><FaDownload /> Télécharger PDF</>}
                            </button>
                            <button className="action-close" onClick={closeDeliveryNote}><FaTimes /> Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="history-header">
                <div className="header-top">
                    <button className="btn-back" onClick={onBack}>
                        ← Retour
                    </button>
                    <h1>📜 Historique des livraisons</h1>
                </div>
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher par tracking, adresse ou client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="history-stats">
                <div className="stat-card-history">
                    <FaCheckCircle className="stat-icon-delivered" />
                    <div>
                        <span className="stat-value">{deliveredParcels.length}</span>
                        <span className="stat-label">Colis livrés</span>
                    </div>
                </div>
            </div>

            {/* Liste */}
            {filteredParcels.length === 0 ? (
                <div className="empty-history">
                    <div className="empty-icon">📭</div>
                    <h3>Aucune livraison trouvée</h3>
                    <p>Essayez de modifier votre recherche</p>
                </div>
            ) : (
                <div className="history-list">
                    {filteredParcels.map((parcel) => (
                        <div key={parcel.id} className="history-item">
                            <div className="history-item-icon">
                                <FaCheckCircle className="success-icon" />
                            </div>
                            <div className="history-item-info">
                                <div className="history-tracking">{parcel.trackingNumber}</div>
                                <div className="history-address">
                                    <FaMapMarkerAlt />
                                    <span>{parcel.deliveryAddress}</span>
                                </div>
                                <div className="history-meta">
                                    <span><FaCalendarAlt /> {formatDate(parcel.deliveredAt)}</span>
                                    <span><FaUser /> {parcel.senderName || "Client"}</span>
                                    <span><FaWeightHanging /> {parcel.weight} kg</span>
                                </div>
                            </div>
                            <div className="history-item-action">
                                <button
                                    className="btn-delivery-note"
                                    onClick={() => openDeliveryNote(parcel)}
                                >
                                    <HiOutlineDocumentReport /> Bon de livraison
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .client-history {
                    background: #FBF4F4;
                    min-height: 100vh;
                    padding: 25px;
                }

                /* Header */
                .history-header {
                    background: white;
                    border-radius: 24px;
                    padding: 20px 25px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .header-top {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .btn-back {
                    background: #4D5C71;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                .btn-back:hover {
                    background: #3b4e61;
                    transform: translateX(-3px);
                }
                .history-header h1 {
                    margin: 0;
                    color: #1a2a3a;
                    font-size: 24px;
                }
                .search-box {
                    display: flex;
                    align-items: center;
                    background: #FBF4F4;
                    border-radius: 40px;
                    padding: 12px 20px;
                    border: 1px solid #E8E0E0;
                }
                .search-icon {
                    color: #A5AEAD;
                    margin-right: 12px;
                }
                .search-box input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 14px;
                }

                /* Stats */
                .history-stats {
                    margin-bottom: 25px;
                }
                .stat-card-history {
                    background: linear-gradient(135deg, #10b981, #059669);
                    border-radius: 20px;
                    padding: 20px 25px;
                    color: white;
                    display: inline-flex;
                    align-items: center;
                    gap: 15px;
                }
                .stat-icon-delivered {
                    font-size: 32px;
                }
                .stat-value {
                    display: block;
                    font-size: 32px;
                    font-weight: 800;
                }
                .stat-label {
                    font-size: 13px;
                    opacity: 0.9;
                }

                /* Liste */
                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .history-item {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    transition: all 0.3s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    border: 1px solid #E8E0E0;
                }
                .history-item:hover {
                    transform: translateX(8px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    border-color: #10b981;
                }
                .history-item-icon {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #10b98120, #05966920);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .success-icon {
                    font-size: 24px;
                    color: #10b981;
                }
                .history-item-info {
                    flex: 1;
                }
                .history-tracking {
                    font-weight: 700;
                    font-size: 15px;
                    color: #4D5C71;
                    margin-bottom: 8px;
                }
                .history-address {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #64748b;
                    margin-bottom: 8px;
                }
                .history-address svg {
                    color: #7B5B61;
                    font-size: 12px;
                }
                .history-meta {
                    display: flex;
                    gap: 20px;
                    font-size: 12px;
                    color: #A5AEAD;
                }
                .history-meta span {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .history-item-action button {
                    background: linear-gradient(135deg, #4D5C71, #3b4e61);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 40px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                }
                .history-item-action button:hover {
                    transform: scale(1.02);
                    filter: brightness(1.05);
                }

                /* Empty */
                .empty-history {
                    text-align: center;
                    padding: 60px 20px;
                    background: white;
                    border-radius: 24px;
                }
                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                }
                .empty-history h3 {
                    margin: 0 0 8px 0;
                    color: #4D5C71;
                }
                .empty-history p {
                    margin: 0;
                    color: #A5AEAD;
                }

                /* Modal Bon de Livraison - Design élégant */
                .delivery-note-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .delivery-note-modal {
                    background: white;
                    border-radius: 28px;
                    width: 90%;
                    max-width: 750px;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: modalSlide 0.3s ease;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                }
                @keyframes modalSlide {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .delivery-note-content {
                    padding: 40px;
                    background: white;
                }
                .delivery-note-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 35px;
                    padding-bottom: 25px;
                    border-bottom: 3px solid #E8E0E0;
                }
                .delivery-note-title h1 {
                    color: #4D5C71;
                    font-size: 24px;
                    margin: 0;
                    letter-spacing: 2px;
                }
                .delivery-note-title p {
                    color: #A5AEAD;
                    margin: 8px 0 0;
                    font-size: 14px;
                }
                .delivery-note-section {
                    margin-bottom: 30px;
                }
                .delivery-note-section h3 {
                    color: #4D5C71;
                    font-size: 18px;
                    margin-bottom: 18px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #F0E8E8;
                }
                .delivery-note-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 18px;
                }
                .info-card {
                    background: #FBF9F9;
                    padding: 14px 18px;
                    border-radius: 16px;
                    transition: all 0.2s;
                }
                .info-card.full-width {
                    grid-column: span 2;
                }
                .info-card label {
                    display: block;
                    font-size: 11px;
                    color: #A5AEAD;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 6px;
                }
                .info-card p {
                    margin: 0;
                    font-size: 14px;
                    color: #1a2a3a;
                }
                .delivery-note-grid.two-cols {
                    grid-template-columns: repeat(2, 1fr);
                }
                .signature-area {
                    background: #FBF9F9;
                    border-radius: 16px;
                    padding: 25px;
                    text-align: center;
                    min-height: 120px;
                    border: 2px dashed #E8E0E0;
                }
                .signature-image {
                    max-width: 100%;
                    max-height: 100px;
                }
                .signature-placeholder {
                    color: #A5AEAD;
                }
                .signature-line {
                    width: 200px;
                    height: 1px;
                    background: #A5AEAD;
                    margin: 0 auto 10px;
                }
                .signature-name {
                    margin-top: 15px;
                    font-size: 13px;
                    text-align: center;
                    color: #64748b;
                }
                .delivery-note-footer {
                    margin-top: 35px;
                    padding-top: 25px;
                    border-top: 2px solid #E8E0E0;
                    text-align: center;
                }
                .footer-logo {
                    margin-bottom: 12px;
                }
                .delivery-note-footer p {
                    font-size: 11px;
                    color: #A5AEAD;
                    margin: 5px 0;
                }
                .footer-date {
                    margin-top: 10px;
                    font-size: 10px;
                }
                .delivery-note-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 30px;
                    border-top: 1px solid #E8E0E0;
                    background: #FBF9F9;
                    border-radius: 0 0 28px 28px;
                }
                .action-print, .action-download, .action-close {
                    padding: 10px 24px;
                    border: none;
                    border-radius: 40px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    transition: all 0.2s;
                }
                .action-print {
                    background: #4D5C71;
                    color: white;
                }
                .action-download {
                    background: #10b981;
                    color: white;
                }
                .action-close {
                    background: #A5AEAD;
                    color: white;
                }
                .action-print:hover, .action-download:hover, .action-close:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.05);
                }
                .action-download:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .history-item {
                        flex-direction: column;
                        text-align: center;
                    }
                    .history-meta {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    .delivery-note-grid {
                        grid-template-columns: 1fr;
                    }
                    .delivery-note-grid .full-width {
                        grid-column: span 1;
                    }
                    .delivery-note-content {
                        padding: 25px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ClientHistory;