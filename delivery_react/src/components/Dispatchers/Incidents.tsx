import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FaExclamationTriangle, FaTimesCircle, FaCheckCircle,
    FaSpinner, FaEye, FaClock, FaBox, FaRedo,
    FaEnvelope, FaPhoneAlt
} from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import { useTheme } from "../../context/ThemeContext";
import Swal from 'sweetalert2';

interface Incident {
    id: number;
    trackingNumber: string;
    type: "retour" | "annulation" | "probleme";
    description: string;
    severity: "high" | "medium" | "low";
    status: "pending" | "resolved" | "rejected";
    createdAt: string;
    resolvedAt?: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    notes?: string;
    parcelStatus: string;
}

const Incidents: React.FC = () => {
    const { darkMode, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("incidents");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [allParcels, setAllParcels] = useState<any[]>([]);
    const [sendingNotification, setSendingNotification] = useState<number | null>(null);

    const GATEWAY_URL = "http://localhost:8888";
    const PARCELS_API = `${GATEWAY_URL}/parcel-service/api/parcels`;
    const NOTIFICATION_API = `${GATEWAY_URL}/notification-service/api/notifications`;

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const parcelsRes = await axios.get(PARCELS_API, getHeaders());
            const allParcelsData = parcelsRes.data;
            setAllParcels(allParcelsData);

            const incidentsData: Incident[] = [];

            allParcelsData.forEach((parcel: any) => {
                if (parcel.status === "RETURNED") {
                    incidentsData.push({
                        id: parcel.id,
                        trackingNumber: parcel.trackingNumber,
                        type: "retour",
                        description: parcel.deliveryNotes || "Colis retourné à l'expéditeur",
                        severity: "high",
                        status: "pending",
                        createdAt: parcel.createdAt,
                        clientName: parcel.senderName,
                        clientPhone: parcel.senderPhone,
                        clientEmail: parcel.clientEmail,
                        parcelStatus: parcel.status
                    });
                } else if (parcel.status === "CANCELLED") {
                    incidentsData.push({
                        id: parcel.id,
                        trackingNumber: parcel.trackingNumber,
                        type: "annulation",
                        description: parcel.deliveryNotes || "Colis annulé par le client",
                        severity: "medium",
                        status: "resolved",
                        createdAt: parcel.createdAt,
                        clientName: parcel.senderName,
                        clientPhone: parcel.senderPhone,
                        clientEmail: parcel.clientEmail,
                        parcelStatus: parcel.status
                    });
                }
            });

            setIncidents(incidentsData.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
        } catch (err) {
            console.error("Error fetching incidents:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    const sendEmailNotification = async (incident: Incident, action: string) => {
        if (!incident.clientEmail) {
            Swal.fire('Info', 'Aucun email enregistré pour ce client', 'info');
            return;
        }

        setSendingNotification(incident.id);
        try {
            let subject = "";
            let message = "";

            if (action === "restart") {
                subject = `🔄 Reprise de livraison - Colis ${incident.trackingNumber}`;
                message = `Bonjour ${incident.clientName},\n\n` +
                    `Nous vous informons que votre colis (${incident.trackingNumber}) va être remis en livraison.\n` +
                    `Un livreur sera assigné prochainement.\n\n` +
                    `Merci de votre patience.\n\n` +
                    `Cordialement,\nL'équipe QribLik`;
            } else if (action === "cancel") {
                subject = `❌ Annulation de livraison - Colis ${incident.trackingNumber}`;
                message = `Bonjour ${incident.clientName},\n\n` +
                    `Nous vous confirmons l'annulation de votre colis (${incident.trackingNumber}).\n` +
                    `Si vous avez déjà effectué un paiement, il vous sera remboursé sous 48h.\n\n` +
                    `Cordialement,\nL'équipe QribLik`;
            }

            const payload = {
                recipient: incident.clientEmail,
                subject: subject,
                content: message
            };

            await axios.post(`${NOTIFICATION_API}/send-manual`, payload, getHeaders());

            Swal.fire({
                icon: 'success',
                title: '✅ Email envoyé',
                text: `Notification envoyée à ${incident.clientEmail}`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err: any) {
            console.error("Erreur détaillée:", err.response?.data || err.message);
            Swal.fire('Erreur', err.response?.data?.message || "Impossible d'envoyer l'email", 'error');
        } finally {
            setSendingNotification(null);
        }
    };

    // 🔥 دالة handleRestartDelivery المحدثة - تستخدم parcel-service مباشرة
    const handleRestartDelivery = async (incident: Incident) => {
        const result = await Swal.fire({
            title: '🔄 Reprendre la livraison',
            text: `Voulez-vous remettre le colis ${incident.trackingNumber} en attente ?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f39c12',
            confirmButtonText: 'Oui, reprendre',
            cancelButtonText: 'Annuler',
            showDenyButton: true,
            denyButtonText: 'Reprendre + Notifier',
            denyButtonColor: '#7367f0'
        });

        if (result.isConfirmed || result.isDenied) {
            try {
                // 🔥 1. تغيير status إلى PENDING
                await axios.patch(`${PARCELS_API}/${incident.id}/status?status=PENDING`, {}, getHeaders());
                console.log(`✅ Status changed to PENDING for colis: ${incident.trackingNumber}`);

                // 🔥 2. إزالة الـ livreur (assignedLivreurId = null)
                await axios.patch(`${PARCELS_API}/${incident.id}/assign/null`, {}, getHeaders());
                console.log(`✅ Livreur removed for colis: ${incident.trackingNumber}`);

                if (result.isDenied) {
                    await sendEmailNotification(incident, "restart");
                }

                Swal.fire({
                    icon: 'success',
                    title: '✅ Colis repris',
                    text: 'Le colis est maintenant en attente sans livreur',
                    timer: 2000
                });

                await fetchIncidents();
                window.dispatchEvent(new CustomEvent('parcelsUpdated'));

            } catch (err: any) {
                console.error("❌ Erreur détaillée:", err.response?.data);

                // 🔥 إذا فشل PATCH، جرب PUT
                try {
                    const originalParcel = allParcels.find(p => p.id === incident.id);
                    if (originalParcel) {
                        await axios.put(`${PARCELS_API}/${incident.id}`, {
                            weight: originalParcel.weight,
                            deliveryAddress: originalParcel.deliveryAddress,
                            zoneId: originalParcel.zoneId,
                            cityName: originalParcel.cityName,
                            senderId: originalParcel.senderId,
                            senderName: originalParcel.senderName,
                            senderPhone: originalParcel.senderPhone,
                            clientEmail: originalParcel.clientEmail,
                            status: "PENDING",
                            assignedLivreurId: null,
                            latitude: originalParcel.latitude,
                            longitude: originalParcel.longitude
                        }, getHeaders());
                        console.log(`✅ PUT method succeeded for colis: ${incident.trackingNumber}`);

                        if (result.isDenied) {
                            await sendEmailNotification(incident, "restart");
                        }

                        Swal.fire({
                            icon: 'success',
                            title: '✅ Colis repris',
                            text: 'Le colis est maintenant en attente sans livreur',
                            timer: 2000
                        });

                        await fetchIncidents();
                        window.dispatchEvent(new CustomEvent('parcelsUpdated'));
                    }
                } catch (putError) {
                    Swal.fire('Erreur', 'Impossible de reprendre le colis', 'error');
                }
            }
        }
    };

    const getSeverityInfo = (severity: string) => {
        switch(severity) {
            case "high": return { icon: <FaTimesCircle />, color: "#e74c3c", bg: "#ffebee", text: "Critique" };
            case "medium": return { icon: <FaExclamationTriangle />, color: "#f39c12", bg: "#fff3e0", text: "Modéré" };
            default: return { icon: <FaExclamationTriangle />, color: "#3498db", bg: "#e3f2fd", text: "Info" };
        }
    };

    const getTypeInfo = (type: string) => {
        switch(type) {
            case "retour": return { text: "Retour", bg: "#ffebee", color: "#e74c3c" };
            case "annulation": return { text: "Annulation", bg: "#fff3e0", color: "#f39c12" };
            default: return { text: "Problème", bg: "#e3f2fd", color: "#3498db" };
        }
    };

    const filteredIncidents = incidents.filter(inc => {
        if (filter === "all") return inc.parcelStatus === "RETURNED";
        if (filter === "pending") return inc.parcelStatus === "RETURNED" && inc.status === "pending";
        if (filter === "resolved") return inc.parcelStatus === "CANCELLED" || (inc.parcelStatus === "RETURNED" && inc.status === "resolved");
        return true;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0f0f1a' : '#f5f7fb' }}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />
                <main style={{ flex: 1 }}>
                    <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} darkMode={darkMode} toggleTheme={toggleTheme} user={{ firstName: 'Dispatcher', lastName: '' }} />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                        <FaSpinner style={{ fontSize: 40, color: '#7367f0', animation: 'spin 1s linear infinite' }} />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0f0f1a' : '#f5f7fb' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} darkMode={darkMode} toggleTheme={toggleTheme} user={{ firstName: 'Dispatcher', lastName: '' }} />

                <div style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 15 }}>
                        <div>
                            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: darkMode ? '#eaeef2' : '#1a2a3a' }}>⚠️ Gestion des Incidents</h2>
                            <p style={{ color: darkMode ? '#8b92a5' : '#666' }}>Gérez les colis retournés et décidez de leur sort</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setFilter("all")} style={{ padding: '8px 20px', borderRadius: 30, border: 'none', background: filter === 'all' ? '#7367f0' : darkMode ? '#2d2d44' : '#e0e0e0', color: filter === 'all' ? 'white' : darkMode ? '#eaeef2' : '#333', cursor: 'pointer' }}>En cours</button>
                            <button onClick={() => setFilter("resolved")} style={{ padding: '8px 20px', borderRadius: 30, border: 'none', background: filter === 'resolved' ? '#2ecc71' : darkMode ? '#2d2d44' : '#e0e0e0', color: filter === 'resolved' ? 'white' : darkMode ? '#eaeef2' : '#333', cursor: 'pointer' }}>Traités</button>
                        </div>
                    </div>

                    <div className="incidents-list">
                        {filteredIncidents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 60, background: darkMode ? '#1a1a2e' : 'white', borderRadius: 24 }}>
                                <FaCheckCircle size={48} style={{ color: '#2ecc71', marginBottom: 16 }} />
                                <h3 style={{ color: '#8b92a5' }}>Aucun incident à traiter</h3>
                                <p>Tous les colis retournés ont été traités</p>
                            </div>
                        ) : (
                            filteredIncidents.map((incident) => {
                                const severity = getSeverityInfo(incident.severity);
                                const type = getTypeInfo(incident.type);
                                const isResolved = incident.parcelStatus === "CANCELLED";

                                return (
                                    <div key={incident.id} style={{ background: darkMode ? '#1a1a2e' : 'white', borderRadius: 20, marginBottom: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${darkMode ? '#2d2d44' : '#e0e0e0'}`, opacity: isResolved ? 0.7 : 1 }}>
                                        <div style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 15 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: severity.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: severity.color, fontSize: 24 }}>{severity.icon}</div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                            <span style={{ fontWeight: 700, fontSize: 16, color: darkMode ? '#eaeef2' : '#1a2a3a' }}>{incident.trackingNumber}</span>
                                                            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: type.bg, color: type.color }}>{type.text}</span>
                                                            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: severity.bg, color: severity.color }}>{severity.text}</span>
                                                            {isResolved && (
                                                                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#e8f5e9', color: '#2e7d32' }}>
                                                                    ✅ Traité
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ marginTop: 8, fontSize: 13, color: darkMode ? '#8b92a5' : '#666' }}>{incident.description}</div>
                                                        <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 12, color: '#8b92a5' }}>
                                                            <span><FaClock style={{ marginRight: 5 }} /> {new Date(incident.createdAt).toLocaleDateString('fr-FR')}</span>
                                                            <span><FaBox style={{ marginRight: 5 }} /> {incident.clientName}</span>
                                                            {incident.clientEmail && <span><FaEnvelope style={{ marginRight: 5 }} /> {incident.clientEmail}</span>}
                                                            {incident.clientPhone && <span><FaPhoneAlt style={{ marginRight: 5 }} /> {incident.clientPhone}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    {!isResolved && (
                                                        <button
                                                            onClick={() => handleRestartDelivery(incident)}
                                                            disabled={sendingNotification === incident.id}
                                                            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#f39c12', color: 'white', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
                                                        >
                                                            {sendingNotification === incident.id ? <FaSpinner className="spinner" /> : <FaRedo />}
                                                            Reprendre
                                                        </button>
                                                    )}
                                                    <button onClick={() => setSelectedIncident(selectedIncident?.id === incident.id ? null : incident)} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${darkMode ? '#2d2d44' : '#e0e0e0'}`, background: 'transparent', cursor: 'pointer', color: darkMode ? '#eaeef2' : '#333' }}>
                                                        <FaEye /> Détails
                                                    </button>
                                                </div>
                                            </div>

                                            {selectedIncident?.id === incident.id && (
                                                <div style={{ marginTop: 20, padding: 15, background: darkMode ? '#0f0f1a' : '#f8f9fa', borderRadius: 12 }}>
                                                    <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>📋 Détails complets</h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, fontSize: 13 }}>
                                                        <div><strong>Client:</strong> {incident.clientName}</div>
                                                        <div><strong>Téléphone:</strong> {incident.clientPhone || "Non renseigné"}</div>
                                                        <div><strong>Email:</strong> {incident.clientEmail || "Non renseigné"}</div>
                                                        <div><strong>Date création:</strong> {new Date(incident.createdAt).toLocaleString('fr-FR')}</div>
                                                        <div><strong>Statut actuel:</strong> {incident.parcelStatus === "RETURNED" ? "Retourné - En attente" : "Annulé"}</div>
                                                    </div>
                                                    {!isResolved && (
                                                        <div style={{ marginTop: 15, padding: 12, background: '#fff3e0', borderRadius: 8, fontSize: 12, color: '#e65100' }}>
                                                            💡 <strong>Actions possibles :</strong><br />
                                                            • <strong>Reprendre</strong> : Remet le colis en attente pour le réassigner à un livreur<br />
                                                            • <strong>📧 Notification</strong> : Un email sera automatiquement envoyé au client si vous choisissez l'option "Notifier"
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Incidents;