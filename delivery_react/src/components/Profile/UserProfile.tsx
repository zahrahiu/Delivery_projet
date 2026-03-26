import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import "./UserProfile.css";
import {
    FaUserCircle, FaEnvelope, FaIdBadge, FaShieldAlt, FaArrowLeft,
    FaCheckCircle, FaPhone, FaMapMarkerAlt, FaIdCard, FaTruck, FaFileAlt
} from 'react-icons/fa';

const UserProfile: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

    const handleBack = () => {
        // كنشوفو الـ role ديال المستخدم (اللي ديجا عندك في الـ userData أو formData)
        const role = userData?.role || "CLIENT"; // default هي CLIENT

        switch (role) {
            case "ADMIN":
                navigate('/admin');
                break;
            case "DISPATCHER":
                navigate('/dispatcher');
                break;
            case "LIVREUR":
                navigate('/livreur');
                break;
            case "CLIENT":
            default:
                navigate('/client');
                break;
        }
    };
    useEffect(() => {
        const fetchFullProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return navigate('/login');

                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId;

                // العيطة للـ Backend 8081
                const response = await axios.get(`http://localhost:8081/api/profiles/details/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response.data);
            } catch (error) {
                console.error("خطأ في جلب البيانات:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFullProfile();
    }, [navigate]);

    if (loading) return <div className="loading">Chargement des données...</div>;

    // إذا وقع خطأ وما جابش الداتا
    if (!userData) return <div className="loading">Erreur de chargement du profil.</div>;

    const userRole = userData.role || "USER";

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="CLIENT" />

            <main className="main-content">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={userData} // هنا كنزيدو الـ user
                />
                <section className="content-body">
                    <div className="profile-page-wrapper">
                        <button className="back-btn" onClick={handleBack}>
                            <FaArrowLeft /> Retour au Dashboard
                        </button>
                        <div className="profile-container">
                            <div className="profile-card-header">
                                <div className="avatar-section">
                                    {userData.profileImageUrl ? (
                                        <img
                                            src={`http://localhost:8081/uploads/${userData.profileImageUrl}`}
                                            alt="Profile"
                                            onLoad={() => console.log("✅ Image loaded successfully")}
                                            onError={(e) => {
                                                console.error("❌ Failed to load image:", e.currentTarget.src);
                                                console.log("Image name from DB:", userData.profileImageUrl);
                                                e.currentTarget.src = `http://localhost:8081/uploads/${userData.profileImageUrl}`;
                                            }}
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '4px solid #d5e5e5'
                                            }}
                                        />
                                    ) : (
                                        <FaUserCircle size={120} color="#5d6b6b" />
                                    )}
                                </div>
                                <h1>{userData.firstName} {userData.lastName}</h1>
                                <span className="role-tag">{userRole}</span>
                            </div>

                            <div className="profile-info-grid">
                                <div className="info-item"><FaEnvelope color="#f7cbca" /><div className="info-text"><label>Email</label><p>{userData.email}</p></div></div>
                                <div className="info-item"><FaPhone color="#d5e5e5" /><div className="info-text"><label>Téléphone</label><p>{userData.phone || "Non défini"}</p></div></div>
                                <div className="info-item"><FaIdCard color="#5d6b6b" /><div className="info-text"><label>CNI</label><p>{userData.cni || "Non défini"}</p></div></div>
                                <div className="info-item"><FaMapMarkerAlt color="#f7cbca" /><div className="info-text"><label>Zone</label><p>{userData.zone || "Non défini"}</p></div></div>

                                {(userRole === "CLIENT" || userRole === "DISPATCHER") && (
                                    <div className="info-item full-width"><FaMapMarkerAlt /><div className="info-text"><label>Adresse</label><p>{userData.address || "Non défini"}</p></div></div>
                                )}

                                {userRole === "LIVREUR" && (
                                    <>
                                        <div className="info-item"><FaTruck /><div className="info-text"><label>Véhicule</label><p>{userData.vehicleType || "Non défini"}</p></div></div>
                                        <div className="info-item"><FaFileAlt /><div className="info-text"><label>Matricule</label><p>{userData.matricule || "Non défini"}</p></div></div>
                                        <div className="info-item"><FaIdCard /><div className="info-text"><label>N° Permis</label><p>{userData.permisNumber || "Non défini"}</p></div></div>
                                    </>
                                )}
                            </div>
                            <div className="profile-footer-actions">
                                <button
                                    className="edit-profile-btn"
                                    onClick={() => navigate('/edit-profile', { state: { userData } })}
                                >
                                    Modifier mes informations
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default UserProfile;