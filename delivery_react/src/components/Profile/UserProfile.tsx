import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import "./UserProfile.css";
import {
    FaUserCircle, FaEnvelope, FaArrowLeft,
    FaPhone, FaMapMarkerAlt, FaIdCard, FaTruck, FaFileAlt, FaUserEdit
} from 'react-icons/fa';

const UserProfile: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

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
                                    {userData.profileImageUrl ? (
                                        <img
                                            src={`${IMAGE_BASE_URL}/${userData.profileImageUrl}`}
                                            alt="Profile"
                                            className="profile-avatar-img"
                                        />
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
                                <div className="info-icon-box"><FaMapMarkerAlt /></div>
                                <div className="info-text"><label>Zone</label><p>{userData.zone || "Non défini"}</p></div>
                            </div>

                            {(userRole === "CLIENT" || userRole === "DISPATCHER") && (
                                <div className="info-item full-width">
                                    <div className="info-icon-box"><FaMapMarkerAlt /></div>
                                    <div className="info-text"><label>Adresse Complète</label><p>{userData.address || "Non défini"}</p></div>
                                </div>
                            )}

                            {userRole === "LIVREUR" && (
                                <>
                                    <div className="info-item">
                                        <div className="info-icon-box"><FaTruck /></div>
                                        <div className="info-text"><label>Véhicule</label><p>{userData.vehicleType || "Non défini"}</p></div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-icon-box"><FaFileAlt /></div>
                                        <div className="info-text"><label>Matricule</label><p>{userData.matricule || "Non défini"}</p></div>
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