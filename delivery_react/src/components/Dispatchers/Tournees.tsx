import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaMapMarkerAlt, FaTruck, FaBox, FaSpinner, FaCalendarAlt, FaChevronRight, FaRoute } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import { useTheme } from "../../context/ThemeContext";
import DeliveryMap from "./DeliveryMap";

interface Tournee {
    zone: string;
    villes: string[];
    colisCount: number;
    livreursCount: number;
    livreurs: any[];
    colis: any[];
    status: "active" | "pending" | "completed";
}

interface Zone {
    id: number;
    nom_zone: string;
    villes_list: string[];
}

const Tournees: React.FC = () => {
    const { darkMode, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("tournees");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tournees, setTournees] = useState<Tournee[]>([]);
    const [loading, setLoading] = useState(true);
    const [parcels, setParcels] = useState<any[]>([]);
    const [selectedTournee, setSelectedTournee] = useState<Tournee | null>(null);

    const GATEWAY_URL = "http://localhost:8888";
    const ZONES_API = `${GATEWAY_URL}/tarif-zone-service/api/zones`;
    const PARCELS_API = `${GATEWAY_URL}/parcel-service/api/parcels`;
    const USERS_API = `${GATEWAY_URL}/users-service/api/profiles`;

    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [zonesRes, parcelsRes, usersRes] = await Promise.all([
                axios.get(ZONES_API, getHeaders()),
                axios.get(PARCELS_API, getHeaders()),
                axios.get(USERS_API, getHeaders())
            ]);

            const zones: Zone[] = zonesRes.data;
            const allParcels = parcelsRes.data;
            const allUsers = usersRes.data;
            const livreurs = allUsers.filter((u: any) => u.role === "LIVREUR");

            setParcels(allParcels);

            // بناء التورنيات حسب الزونات
            const tourneesData: Tournee[] = zones
                .map((zone: Zone) => {
                    const zoneVilles = zone.villes_list || [];
                    const zoneColis = allParcels.filter((p: any) => {
                        const city = p.cityName?.toLowerCase() || "";
                        return zoneVilles.some((ville: string) => ville.toLowerCase() === city);
                    });

                    const zoneLivreurs = livreurs.filter((l: any) => {
                        const livreurCity = (l.zone || l.city || "").toLowerCase();
                        return zoneVilles.some((ville: string) => ville.toLowerCase() === livreurCity);
                    });

                    const hasActiveColis = zoneColis.some((p: any) =>
                        p.status === "IN_TRANSIT" || p.status === "ASSIGNED"
                    );

                    let status: "active" | "pending" | "completed" = "completed";
                    if (hasActiveColis) {
                        status = "active";
                    } else if (zoneColis.length > 0) {
                        status = "pending";
                    }

                    return {
                        zone: zone.nom_zone,
                        villes: zoneVilles,
                        colisCount: zoneColis.length,
                        livreursCount: zoneLivreurs.length,
                        livreurs: zoneLivreurs,
                        colis: zoneColis,
                        status: status
                    };
                })
                .filter((t) => t.colisCount > 0 || t.livreursCount > 0); // 🔥 هنا بدون Type annotation

            setTournees(tourneesData);
        } catch (err) {
            console.error("Error fetching tournees:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch(status) {
            case "active": return { bg: "#e8f5e9", color: "#2e7d32", text: "En cours" };
            case "pending": return { bg: "#fff3e0", color: "#e65100", text: "En attente" };
            default: return { bg: "#e0e0e0", color: "#757575", text: "Terminée" };
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0f0f1a' : '#f5f7fb' }}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />
                <main style={{ flex: 1 }}>
                    <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} darkMode={darkMode} toggleTheme={toggleTheme} user={{ firstName: 'Dispatcher', lastName: '' }} />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                        <FaSpinner style={{ fontSize: 40, color: '#7367f0', animation: 'spin 1s linear infinite' }} />
                        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
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
                    <div style={{ marginBottom: 30 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: darkMode ? '#eaeef2' : '#1a2a3a' }}>🗺️ Tournées par Zone</h2>
                        <p style={{ color: darkMode ? '#8b92a5' : '#666' }}>Visualisez les tournées de livraison organisées par zone géographique</p>
                    </div>

                    {/* Carte de distribution */}
                    <div style={{ marginBottom: 30 }}>
                        <DeliveryMap parcels={parcels} />
                    </div>

                    {/* Liste des tournées */}
                    <div className="tournees-grid">
                        {tournees.map((tournee, index) => {
                            const statusStyle = getStatusColor(tournee.status);
                            return (
                                <div
                                    key={index}
                                    className="tournee-card"
                                    onClick={() => setSelectedTournee(selectedTournee?.zone === tournee.zone ? null : tournee)}
                                    style={{
                                        background: darkMode ? '#1a1a2e' : 'white',
                                        borderRadius: 20,
                                        marginBottom: 16,
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        border: `1px solid ${darkMode ? '#2d2d44' : '#e0e0e0'}`
                                    }}
                                >
                                    <div style={{ padding: 20, cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#7367f020', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7367f0' }}>
                                                    <FaRoute size={24} />
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: darkMode ? '#eaeef2' : '#1a2a3a' }}>{tournee.zone}</h3>
                                                    <div style={{ display: 'flex', gap: 15, marginTop: 5, fontSize: 12, color: '#8b92a5' }}>
                                                        <span>📍 {tournee.villes.join(", ")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 20 }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f39c12' }}>{tournee.colisCount}</div>
                                                    <div style={{ fontSize: 11, color: '#8b92a5' }}>Colis</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#3498db' }}>{tournee.livreursCount}</div>
                                                    <div style={{ fontSize: 11, color: '#8b92a5' }}>Livreurs</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: statusStyle.bg, color: statusStyle.color }}>
                                                        {statusStyle.text}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedTournee?.zone === tournee.zone && (
                                        <div style={{ borderTop: `1px solid ${darkMode ? '#2d2d44' : '#eee'}`, padding: 20, background: darkMode ? '#16213e' : '#f8f9fa' }}>
                                            <h4 style={{ margin: '0 0 15px', fontSize: 16, fontWeight: 600 }}>📦 Colis dans cette zone</h4>
                                            {tournee.colis.length === 0 ? (
                                                <p style={{ color: '#8b92a5', textAlign: 'center', padding: 20 }}>Aucun colis dans cette zone</p>
                                            ) : (
                                                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                                    {tournee.colis.map((colis: any) => (
                                                        <div key={colis.id} style={{ padding: 12, borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#eee'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{colis.trackingNumber}</div>
                                                                <div style={{ fontSize: 12, color: '#8b92a5' }}>{colis.senderName} - {colis.cityName}</div>
                                                            </div>
                                                            <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: colis.status === 'DELIVERED' ? '#e8f5e9' : colis.status === 'IN_TRANSIT' ? '#e3f2fd' : '#fff3e0', color: colis.status === 'DELIVERED' ? '#2e7d32' : colis.status === 'IN_TRANSIT' ? '#1565c0' : '#e65100' }}>
                                                                {colis.status === 'DELIVERED' ? 'Livré' : colis.status === 'IN_TRANSIT' ? 'En transit' : colis.status === 'ASSIGNED' ? 'Assigné' : 'En attente'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {tournees.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 60, background: darkMode ? '#1a1a2e' : 'white', borderRadius: 24 }}>
                            <FaRoute size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                            <h3 style={{ color: '#8b92a5' }}>Aucune tournée disponible</h3>
                            <p>Créez des colis pour commencer à organiser vos tournées</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Tournees;