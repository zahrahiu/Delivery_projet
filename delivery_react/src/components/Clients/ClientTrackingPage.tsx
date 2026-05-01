import React from "react";
import ClientTracking from "./ClientTracking";
import { FaMapMarkerAlt } from "react-icons/fa";

interface ClientTrackingPageProps {
    livreurId: string | null;
    onBack: () => void;
    address?: string;
}

const ClientTrackingPage: React.FC<ClientTrackingPageProps> = ({ livreurId, onBack, address }) => {
    return (
        <div className="client-tracking-page">
            <div className="page-header">
                <h2>📍 Suivi en direct</h2>
                <button className="btn-back" onClick={onBack}>
                    ← Retour aux colis
                </button>
            </div>

            {!livreurId ? (
                <div className="empty-tracking">
                    <FaMapMarkerAlt className="empty-icon" />
                    <h3>Aucun colis sélectionné</h3>
                    <p>Veuillez sélectionner un colis à suivre depuis la liste.</p>
                    <button className="btn-primary" onClick={onBack}>
                        Voir mes colis
                    </button>
                </div>
            ) : (
                <div className="map-container-wrapper">
                    <ClientTracking
                        livreurId={livreurId}
                        address={address}
                    />
                </div>
            )}

            <style>{`
                .client-tracking-page {
                    background: white;
                    border-radius: 28px;
                    padding: 25px;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }
                .page-header h2 {
                    color: #1a2a3a;
                    margin: 0;
                }
                .btn-back {
                    background: #f0f2f5;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 20px;
                    cursor: pointer;
                    color: #4D5C71;
                    font-weight: 600;
                }
                .btn-back:hover {
                    background: #e8eef3;
                }
                .empty-tracking {
                    text-align: center;
                    padding: 60px;
                }
                .empty-icon {
                    font-size: 80px;
                    color: #A5AEAD;
                    margin-bottom: 20px;
                }
                .empty-tracking h3 {
                    margin-bottom: 10px;
                    color: #4D5C71;
                }
                .empty-tracking p {
                    color: #A5AEAD;
                    margin-bottom: 25px;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #4D5C71, #7B5B61);
                    color: white;
                    border: none;
                    padding: 12px 28px;
                    border-radius: 30px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                }
                .map-container-wrapper {
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    background: #fff;
                    border: 1px solid #e2e8f0;
                }
            `}</style>
        </div>
    );
};

export default ClientTrackingPage;