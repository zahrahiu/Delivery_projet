import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import "./EditProfile.css";
// 1. تأكدي من عمل Import للأيقونات الضرورية
import { FaUserCircle, FaCamera, FaSave, FaArrowLeft } from "react-icons/fa";

const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 2. استقبال البيانات من الـ Profile Page (عبر الـ State)
    const { userData } = location.state || {};

    // --- الإعدادات الخاصة بالـ Gateway ---
    const GATEWAY_URL = "http://localhost:8888";
    const API_URL = `${GATEWAY_URL}/users-service/api/profiles`;
    const IMAGE_BASE_URL = `${GATEWAY_URL}/users-service/uploads`;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formData, setFormData] = useState(userData || {});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // 3. منطق عرض الصورة: إذا كانت موجودة في الـ DB نظهرها من السيرفر، وإلا نتركها null
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        userData?.profileImageUrl ? `${IMAGE_BASE_URL}/${userData.profileImageUrl}` : null
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 4. دالة الحفظ (Sending FormData)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formDataToSend = new FormData();

        // إرسال الحقول بشكل منفصل لكي يتعرف عليها الـ @ModelAttribute في Spring Boot
        formDataToSend.append("firstName", formData.firstName || "");
        formDataToSend.append("lastName", formData.lastName || "");
        formDataToSend.append("phone", formData.phone || "");
        formDataToSend.append("zone", formData.zone || "");
        formDataToSend.append("address", formData.address || "");

        // إضافة الملف إذا تم اختياره
        if (selectedFile) {
            formDataToSend.append("file", selectedFile);
        }

        try {
            await axios.put(`${API_URL}/${formData.userId}`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    // المتصفح سيضع 'multipart/form-data' تلقائياً
                }
            });
            alert("Profil mis à jour avec succès ! ✅");
            navigate('/profile');
        } catch (error) {
            console.error("Erreur d'enregistrement:", error);
            alert("Erreur lors de la modification.");
        }
    };

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab="profile" setActiveTab={() => {}} role={formData.role} />

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

                        {/* --- قسم تحميل الصورة --- */}
                        <div className="avatar-upload-container">
                            <div className="avatar-edit-wrapper">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        className="avatar-edit-preview"
                                        alt="Preview"
                                        style={{
                                            width: '130px',
                                            height: '130px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '3px solid #d5e5e5'
                                        }}
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
                                                setPreviewUrl(URL.createObjectURL(file)); // عرض الصورة المختارة فوراً
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                            <p className="upload-hint">Cliquez sur l'icône pour changer la photo</p>
                        </div>

                        {/* --- شبكة الحقول --- */}
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
                                <label>Zone</label>
                                <select name="zone" value={formData.zone || ''} onChange={handleChange}>
                                    <option value="">Sélectionner...</option>
                                    <option value="Maarif">Maarif</option>
                                    <option value="Anfa">Anfa</option>
                                    <option value="Guéliz">Guéliz</option>
                                </select>
                            </div>
                            <div className="field-group full-width">
                                <label>Adresse Complète</label>
                                <input name="address" value={formData.address || ''} onChange={handleChange} />
                            </div>
                        </div>

                        <button type="submit" className="btn-update-profile">
                            <FaSave /> Enregistrer les modifications
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default EditProfile;