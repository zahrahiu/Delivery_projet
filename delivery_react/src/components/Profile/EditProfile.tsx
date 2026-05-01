import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import "./EditProfile.css";
import { FaUserCircle, FaCamera, FaSave, FaArrowLeft } from "react-icons/fa";

const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { userData } = location.state || {};

    const GATEWAY_URL = "http://localhost:8888";
    const API_URL = `${GATEWAY_URL}/users-service/api/profiles`;
    const IMAGE_BASE_URL = `${GATEWAY_URL}/users-service/uploads`;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formData, setFormData] = useState(userData || {});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

    const userRole = formData.role || "CLIENT";

    // ✅ جلب الصورة الموجودة مع التوكن (إذا كانت موجودة)
    useEffect(() => {
        const fetchExistingImage = async () => {
            if (userData?.profileImageUrl) {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) return;

                    const response = await axios.get(`${IMAGE_BASE_URL}/${userData.profileImageUrl}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: 'blob'
                    });
                    const imageUrl = URL.createObjectURL(response.data);
                    setExistingImageUrl(imageUrl);
                } catch (error) {
                    console.error("Erreur chargement image existante:", error);
                    setExistingImageUrl(null);
                }
            }
        };
        fetchExistingImage();

        // ✅ Cleanup URLs عند الخروج
        return () => {
            if (existingImageUrl) {
                URL.revokeObjectURL(existingImageUrl);
            }
        };
    }, [userData?.profileImageUrl]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Vous n'êtes pas authentifié");
            setLoading(false);
            return;
        }

        // ✅ Si une nouvelle image a été sélectionnée
        if (selectedFile) {
            const formDataToSend = new FormData();
            formDataToSend.append("firstName", formData.firstName || "");
            formDataToSend.append("lastName", formData.lastName || "");
            formDataToSend.append("phone", formData.phone || "");
            formDataToSend.append("zone", formData.zone || formData.cityName || "");
            formDataToSend.append("address", formData.address || "");

            if (userRole === "LIVREUR") {
                formDataToSend.append("vehicleType", formData.vehicleType || "");
                formDataToSend.append("matricule", formData.matricule || "");
                formDataToSend.append("permisNumber", formData.permisNumber || "");
            }

            formDataToSend.append("file", selectedFile);

            try {
                await axios.put(`${API_URL}/${formData.userId}/with-image`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                alert("Profil mis à jour avec succès ! ✅");
                navigate('/profile', { replace: true });
                return;
            } catch (error) {
                console.error("Erreur:", error);
                alert("Erreur lors de la modification de l'image.");
                setLoading(false);
                return;
            }
        }

        // ✅ Sans nouvelle image (garder l'ancienne ou pas d'image)
        const payload: any = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            zone: formData.zone || formData.cityName,
            address: formData.address
        };

        if (userRole === "LIVREUR") {
            payload.vehicleType = formData.vehicleType;
            payload.matricule = formData.matricule;
            payload.permisNumber = formData.permisNumber;
        }

        try {
            await axios.put(`${API_URL}/${formData.userId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            alert("Profil mis à jour avec succès ! ✅");
            navigate('/profile', { replace: true });
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de la modification.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Déterminer l'URL du preview (nouvelle image ou image existante)
    const displayPreviewUrl = selectedFile ? URL.createObjectURL(selectedFile) : existingImageUrl;

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab="profile" setActiveTab={() => {}} role={userRole} />

            <main className="main-content">
                <TopHeader
                    activeTab="Modifier le Profil"
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={formData}
                />

                <section className="edit-section">
                    <form className="edit-form-card" onSubmit={handleSave}>
                        <div className="form-header">
                            <button type="button" onClick={() => navigate(-1)} className="btn-back">
                                <FaArrowLeft /> Retour
                            </button>
                            <h2>Modifier mes informations</h2>
                        </div>

                        {/* Avatar */}
                        <div className="avatar-upload-container">
                            <div className="avatar-edit-wrapper">
                                {displayPreviewUrl ? (
                                    <img
                                        src={displayPreviewUrl}
                                        className="avatar-edit-preview"
                                        alt="Preview"
                                    />
                                ) : (
                                    <FaUserCircle size={130} color="#ccc" />
                                )}
                                <label htmlFor="file-upload" className="camera-icon-label">
                                    <FaCamera />
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                setSelectedFile(file);
                                                // Nettoyer l'ancienne URL preview si elle existe
                                                if (existingImageUrl) {
                                                    URL.revokeObjectURL(existingImageUrl);
                                                    setExistingImageUrl(null);
                                                }
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                            <p className="upload-hint">
                                {selectedFile ? "Nouvelle photo sélectionnée" : (userData?.profileImageUrl ? "Photo actuelle" : "Cliquez sur l'icône pour ajouter une photo")}
                            </p>
                        </div>

                        {/* Champs communs */}
                        <div className="form-grid">
                            <div className="field-group">
                                <label>Prénom</label>
                                <input name="firstName" value={formData.firstName || ''} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Nom</label>
                                <input name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Téléphone</label>
                                <input name="phone" value={formData.phone || ''} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Ville</label>
                                <select name="zone" value={formData.zone || formData.cityName || ''} onChange={handleChange}>
                                    <option value="">Sélectionner...</option>
                                    <option value="Casablanca">Casablanca</option>
                                    <option value="Rabat">Rabat</option>
                                    <option value="Tanger">Tanger</option>
                                    <option value="Marrakech">Marrakech</option>
                                    <option value="Fès">Fès</option>
                                    <option value="Agadir">Agadir</option>
                                    <option value="Kénitra">Kénitra</option>
                                    <option value="Larache">Larache</option>
                                    <option value="Tétouan">Tétouan</option>
                                    <option value="Meknès">Meknès</option>
                                    <option value="Oujda">Oujda</option>
                                </select>
                            </div>
                            <div className="field-group full-width">
                                <label>Adresse Complète</label>
                                <input name="address" value={formData.address || ''} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Champs spécifiques pour LIVREUR */}
                        {userRole === "LIVREUR" && (
                            <div className="form-grid" style={{ marginTop: '20px' }}>
                                <div className="field-group">
                                    <label>Véhicule</label>
                                    <select name="vehicleType" value={formData.vehicleType || 'Moto'} onChange={handleChange}>
                                        <option value="Moto">🏍️ Moto</option>
                                        <option value="Voiture">🚗 Voiture</option>
                                        <option value="Camionnette">🚚 Camionnette</option>
                                    </select>
                                </div>
                                <div className="field-group">
                                    <label>Matricule</label>
                                    <input name="matricule" value={formData.matricule || ''} onChange={handleChange} placeholder="Matricule" />
                                </div>
                                <div className="field-group">
                                    <label>N° Permis</label>
                                    <input name="permisNumber" value={formData.permisNumber || ''} onChange={handleChange} placeholder="Numéro de permis" />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn-update-profile" disabled={loading}>
                            <FaSave /> {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default EditProfile;