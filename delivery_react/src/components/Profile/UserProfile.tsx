import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import "./UserProfile.css";
import {
    FaUserCircle, FaEnvelope, FaArrowLeft,
    FaPhone, FaMapMarkerAlt, FaIdCard, FaTruck, FaFileAlt, FaUserEdit,
    FaCity, FaMotorcycle, FaCar, FaTruck as FaTruckIcon
} from 'react-icons/fa';

const UserProfile: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const GATEWAY_URL = "http://localhost:8888";
    const API_URL = `${GATEWAY_URL}/users-service/api/profiles/details`;
    const IMAGE_BASE_URL = `${GATEWAY_URL}/users-service/uploads`;

    const handleBack = () => {
        const role = userData?.role || "CLIENT";
        switch (role) {
            case "ADMIN": navigate('/admin'); break;
            case "DISPATCHER": navigate('/dispatcher'); break;
            case "LIVREUR": navigate('/livreur'); break;
            case "CLIENT": default: navigate('/client'); break;
        }
    };

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'Moto': return <FaMotorcycle />;
            case 'Voiture': return <FaCar />;
            case 'Camionnette': return <FaTruckIcon />;
            default: return <FaMotorcycle />;
        }
    };

    const fetchImageWithToken = async (imageName: string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await axios.get(`${IMAGE_BASE_URL}/${imageName}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const imageBlob = URL.createObjectURL(response.data);
            setImageUrl(imageBlob);
        } catch (error) {
            console.error("Erreur chargement image:", error);
            setImageUrl(null);
        }
    };

    useEffect(() => {
        const fetchFullProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return navigate('/login');
                const payload = JSON.parse(atob(token.split('.')[1]));
                const response = await axios.get(`${API_URL}/${payload.userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response.data);
                if (response.data.profileImageUrl) {
                    await fetchImageWithToken(response.data.profileImageUrl);
                }
            } catch (error) {
                console.error("Erreur:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFullProfile();
    }, [navigate]);

    if (loading) return <div className="loading-screen">Chargement du profil...</div>;
    if (!userData) return <div className="error-screen">Impossible de charger le profil.</div>;

    const userRole = userData.role || "USER";

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={userRole} />

            <main className="main-content">
                <TopHeader activeTab="Mon Profil" isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} user={userData} />

                <section className="profile-page-wrapper">
                    <div className="profile-header-actions">
                        <button className="back-btn" onClick={handleBack}>
                            <FaArrowLeft /> Retour
                        </button>
                    </div>

                    <div className="profile-container">
                        <div className="profile-card-header">
                            <div className="profile-header-main">
                                <div className="avatar-section">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Profile" className="profile-avatar-img" />
                                    ) : (
                                        <FaUserCircle size={120} className="default-avatar-icon" />
                                    )}
                                </div>
                                <div className="user-primary-info">
                                    <h1>{userData.firstName} {userData.lastName}</h1>
                                    <span className="role-tag">{userRole}</span>
                                </div>
                            </div>
                        </div>

                        {/* ✅ Informations communes à tous */}
                        <div className="profile-info-grid">
                            <div className="info-item">
                                <div className="info-icon-box"><FaEnvelope /></div>
                                <div className="info-text"><label>Email</label><p>{userData.email}</p></div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon-box"><FaPhone /></div>
                                <div className="info-text"><label>Téléphone</label><p>{userData.phone || "Non défini"}</p></div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon-box"><FaIdCard /></div>
                                <div className="info-text"><label>CNI</label><p>{userData.cni || "Non défini"}</p></div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon-box"><FaCity /></div>
                                <div className="info-text"><label>Ville</label><p>{userData.zone || userData.cityName || "Non défini"}</p></div>
                            </div>
                            <div className="info-item full-width">
                                <div className="info-icon-box"><FaMapMarkerAlt /></div>
                                <div className="info-text"><label>Adresse</label><p>{userData.address || "Non défini"}</p></div>
                            </div>

                            {/* ✅ Informations spécifiques pour LIVREUR */}
                            {userRole === "LIVREUR" && (
                                <>
                                    <div className="info-item">
                                        <div className="info-icon-box">{getVehicleIcon(userData.vehicleType)}</div>
                                        <div className="info-text"><label>Véhicule</label><p>{userData.vehicleType || "Non défini"}</p></div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-icon-box"><FaTruck /></div>
                                        <div className="info-text"><label>Matricule</label><p>{userData.matricule || "Non défini"}</p></div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-icon-box"><FaFileAlt /></div>
                                        <div className="info-text"><label>N° Permis</label><p>{userData.permisNumber || "Non défini"}</p></div>
                                    </div>
                                </>
                            )}

                            {/* ✅ Informations spécifiques pour DISPATCHER */}
                            {userRole === "DISPATCHER" && (
                                <>
                                    <div className="info-item full-width">
                                        <div className="info-icon-box"><FaCity /></div>
                                        <div className="info-text"><label>Zone d'affectation</label><p>{userData.zone || "Non défini"}</p></div>
                                    </div>
                                </>
                            )}

                            {/* ✅ Informations spécifiques pour CLIENT */}
                            {userRole === "CLIENT" && (
                                <>
                                    <div className="info-item full-width">
                                        <div className="info-icon-box"><FaMapMarkerAlt /></div>
                                        <div className="info-text"><label>Adresse de livraison</label><p>{userData.address || "Non défini"}</p></div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="profile-footer-actions">
                            <button className="edit-profile-btn" onClick={() => navigate('/edit-profile', { state: { userData } })}>
                                <FaUserEdit /> Modifier mes informations
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default UserProfile;