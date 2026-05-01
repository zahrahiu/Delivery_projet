import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import { FaFlag, FaCheckCircle, FaClock, FaEye, FaBox, FaMapMarkerAlt, FaUser, FaPhone } from "react-icons/fa";

const LivreurReports: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const GATEWAY_URL = "http://localhost:8888";

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const fetchReports = async () => {
        setLoading(true);
        try {
            // جلب جميع الطرود الخاصة بهذا الليفرور
            const parcelsRes = await axios.get(`${GATEWAY_URL}/parcel-service/api/parcels`, getHeaders());

            // فلترة الطرود اللي عندها مشكلة (status = RETURNED أو deliveryNotes موجودة)
            const problemParcels = parcelsRes.data.filter((p: any) =>
                p.status === 'RETURNED' || (p.deliveryNotes && p.deliveryNotes.trim() !== '')
            );

            console.log("📦 Problem parcels found:", problemParcels.length);

            // تحويلها إلى شكل reports
            const reportsData = problemParcels.map((parcel: any) => ({
                id: parcel.id,
                trackingNumber: parcel.trackingNumber,
                deliveryAddress: parcel.deliveryAddress,
                clientName: parcel.senderName,
                clientPhone: parcel.senderPhone,
                problem: parcel.deliveryNotes || "Problème signalé (colis retourné)",
                status: parcel.status === 'RETURNED' ? 'PENDING' : 'IN_PROGRESS',
                createdAt: parcel.updatedAt || parcel.deliveredAt || new Date().toISOString(),
                response: null
            }));

            setReports(reportsData);
        } catch (err) {
            console.error("Error fetching reports:", err);
            Swal.fire('Erreur', 'Impossible de charger les signalements', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'PENDING': return { class: 'pending', text: 'En attente', icon: <FaClock /> };
            case 'IN_PROGRESS': return { class: 'progress', text: 'En traitement', icon: <FaEye /> };
            case 'RESOLVED': return { class: 'resolved', text: 'Résolu', icon: <FaCheckCircle /> };
            default: return { class: 'default', text: status };
        }
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2>⚠️ Mes signalements</h2>
            </div>

            {loading ? (
                <div className="loading">Chargement...</div>
            ) : reports.length === 0 ? (
                <div className="empty-state">Aucun signalement pour le moment</div>
            ) : (
                <div className="reports-list">
                    {reports.map((report: any) => {
                        const status = getStatusBadge(report.status);
                        return (
                            <div key={report.id} className="report-card">
                                <div className="report-header">
                                    <div className="report-info">
                                        <span className="report-id">
                                            <FaBox className="report-icon" /> {report.trackingNumber}
                                        </span>
                                        <span className={`status-badge ${status.class}`}>
                                            {status.icon} {status.text}
                                        </span>
                                    </div>
                                </div>

                                <div className="report-body">
                                    <div className="report-address">
                                        <FaMapMarkerAlt className="address-icon" />
                                        <span>{report.deliveryAddress}</span>
                                    </div>

                                    <div className="report-client">
                                        <div className="client-info">
                                            <FaUser className="client-icon" />
                                            <span>{report.clientName || "Client non spécifié"}</span>
                                        </div>
                                        <div className="client-phone">
                                            <FaPhone className="phone-icon" />
                                            <span>{report.clientPhone || "Téléphone non disponible"}</span>
                                        </div>
                                    </div>

                                    <div className="report-problem">
                                        <strong>⚠️ Problème signalé:</strong>
                                        <p>{report.problem}</p>
                                    </div>

                                    <small className="report-date">
                                        🕐 {new Date(report.createdAt).toLocaleString()}
                                    </small>
                                </div>

                                {report.response && (
                                    <div className="report-response">
                                        <strong>Réponse:</strong> {report.response}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .reports-container { max-width: 800px; margin: 0 auto; }
                .reports-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
                .reports-header h2 { color: #1a2a3a; margin: 0; }
                
                .reports-list { display: flex; flex-direction: column; gap: 15px; }
                .report-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: 0.2s; }
                .report-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                
                .report-header { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                .report-info { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
                .report-id { font-weight: 700; color: #3b4e61; font-size: 14px; display: flex; align-items: center; gap: 8px; }
                .report-icon { font-size: 14px; }
                
                .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 5px; width: fit-content; }
                .status-badge.pending { background: #fef3e2; color: #f39c12; }
                .status-badge.progress { background: #e3f2fd; color: #3498db; }
                .status-badge.resolved { background: #e8f5e9; color: #2ecc71; }
                
                .report-body { margin-bottom: 10px; }
                .report-address { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; margin-bottom: 12px; background: #f8f9fa; padding: 8px 12px; border-radius: 8px; }
                .address-icon { color: #e74c3c; font-size: 14px; }
                
                .report-client { display: flex; gap: 20px; margin-bottom: 12px; flex-wrap: wrap; }
                .client-info, .client-phone { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #555; background: #f0f2f5; padding: 5px 12px; border-radius: 20px; }
                .client-icon, .phone-icon { font-size: 12px; color: #3b4e61; }
                
                .report-problem { margin-bottom: 10px; background: #fff8e1; padding: 10px; border-radius: 10px; }
                .report-problem strong { font-size: 12px; color: #f57c00; display: block; margin-bottom: 5px; }
                .report-problem p { color: #333; margin: 0; line-height: 1.5; font-size: 13px; }
                
                .report-date { font-size: 11px; color: #999; display: block; margin-top: 8px; }
                
                .report-response { margin-top: 15px; padding: 12px; background: #e8f5e9; border-radius: 10px; font-size: 13px; color: #2e7d32; border-left: 3px solid #2ecc71; }
                
                .loading { text-align: center; padding: 50px; color: #666; }
                .empty-state { text-align: center; padding: 60px; background: #f8f9fa; border-radius: 16px; color: #999; }
            `}</style>
        </div>
    );
};

export default LivreurReports;