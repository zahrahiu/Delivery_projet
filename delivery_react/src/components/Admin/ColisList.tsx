import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaArrowLeft, FaSearch, FaTruck, FaUser, FaBox } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import "./ColisList.css";

interface Parcel {
    id: number;
    trackingNumber: string;
    senderName: string;
    clientEmail?: string;
    assignedLivreurId?: string;
    deliveryAddress: string;
    weight: number;
    status: string;
    createdAt: string;
}

interface Livreur {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

const ColisList: React.FC = () => {
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [filteredParcels, setFilteredParcels] = useState<Parcel[]>([]);
    const [livreurs, setLivreurs] = useState<Livreur[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTracking, setSearchTracking] = useState("");
    const [searchLivreur, setSearchLivreur] = useState("");
    const [activeTab, setActiveTab] = useState("colis");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const USERS_API = "http://localhost:8888/users-service/api/profiles";
    const PARCELS_API = "http://localhost:8888/parcel-service/api/parcels";

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const getLivreurName = (assignedLivreurId: string | undefined): string => {
        if (!assignedLivreurId) return "Non assigné";
        const driver = livreurs.find(l => String(l.userId) === String(assignedLivreurId));
        return driver ? `${driver.firstName} ${driver.lastName}` : `ID: ${assignedLivreurId}`;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const resUsers = await axios.get(USERS_API, getAuthHeader());
            const allUsers = resUsers.data;
            setLivreurs(allUsers.filter((u: any) => u.role === "LIVREUR"));

            const resParcels = await axios.get(PARCELS_API, getAuthHeader());
            const parcelsData = resParcels.data;
            setParcels(parcelsData);
            setFilteredParcels(parcelsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...parcels];
        if (searchTracking) {
            filtered = filtered.filter(p =>
                p.trackingNumber?.toLowerCase().includes(searchTracking.toLowerCase())
            );
        }
        if (searchLivreur) {
            filtered = filtered.filter(p => {
                const livreurName = getLivreurName(p.assignedLivreurId);
                return livreurName.toLowerCase().includes(searchLivreur.toLowerCase());
            });
        }
        setFilteredParcels(filtered);
        setCurrentPage(1);
    }, [searchTracking, searchLivreur, parcels, livreurs]);

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'DELIVERED':
                return <span className="status-badge delivered">✅ Livré</span>;
            case 'ASSIGNED':
                return <span className="status-badge assigned">👤 Assigné</span>;
            case 'IN_TRANSIT':
                return <span className="status-badge in-transit">🚚 En cours</span>;
            case 'PENDING':
                return <span className="status-badge pending">⌛ En attente</span>;
            default:
                return <span className="status-badge">{status || 'Inconnu'}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    const toggleTheme = () => setDarkMode(!darkMode);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredParcels.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredParcels.length / itemsPerPage);

    if (loading) {
        return (
            <div className={`app-container ${darkMode ? 'dark-theme' : ''}`}>
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                    user={{ firstName: 'Admin', lastName: '' }}
                />
                <div className="main-layout">
                    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />
                    <div className="content-area">
                        <div className="loader">Chargement des colis...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`app-container ${darkMode ? 'dark-theme' : ''}`}>
            {/* TopHeader en haut */}
            <TopHeader
                activeTab={activeTab}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                user={{ firstName: 'Admin', lastName: '' }}
            />

            <div className="main-layout">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="ADMIN" />

                <div className="content-area">
                    <div className="colis-list-container">
                        <div className="colis-list-header">
                            <h2><FaBox style={{ marginRight: '10px' }} /> Tous les Colis ({filteredParcels.length})</h2>
                            <button className="back-btn" onClick={() => window.history.back()}>
                                <FaArrowLeft /> Retour
                            </button>
                        </div>

                        <div className="search-bar-wrapper">
                            <div className="search-input-group">
                                <FaSearch className="search-icon-input" />
                                <input
                                    type="text"
                                    placeholder="🔍 Rechercher par Tracking..."
                                    value={searchTracking}
                                    onChange={(e) => setSearchTracking(e.target.value)}
                                />
                            </div>
                            <div className="search-input-group">
                                <FaUser className="search-icon-input" />
                                <input
                                    type="text"
                                    placeholder="👤 Rechercher par Livreur..."
                                    value={searchLivreur}
                                    onChange={(e) => setSearchLivreur(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="colis-table-wrapper">
                            {currentItems.length === 0 ? (
                                <div className="no-data">
                                    <p>Aucun colis trouvé</p>
                                </div>
                            ) : (
                                <table className="colis-table">
                                    <thead>
                                    <tr>
                                        <th>Tracking</th>
                                        <th>Expéditeur</th>
                                        <th>Livreur</th>
                                        <th>Destination</th>
                                        <th>Poids</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {currentItems.map((parcel) => (
                                        <tr key={parcel.id}>
                                            <td>
                                                    <span className="tracking-code">
                                                        {parcel.trackingNumber || `#${parcel.id}`}
                                                    </span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{parcel.senderName || 'N/A'}</div>
                                                <small style={{ color: '#888' }}>{parcel.clientEmail || ''}</small>
                                            </td>
                                            <td>
                                                <div className="livreur-cell">
                                                    <FaTruck size={12} color="#4caf50" />
                                                    {getLivreurName(parcel.assignedLivreurId)}
                                                </div>
                                            </td>
                                            <td>{parcel.deliveryAddress || 'N/A'}</td>
                                            <td>{parcel.weight ? `${parcel.weight} kg` : 'N/A'}</td>
                                            <td>{getStatusBadge(parcel.status)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>←</button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button key={i + 1} className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                ))}
                                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>→</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColisList;