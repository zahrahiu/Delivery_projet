import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";
import "./EditProfile.css";
import { FaUserCircle } from "react-icons/fa";

const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData } = location.state || {};

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formData, setFormData] = useState(userData || {});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // تأكدي أن الرابط كيسالي باسم الملف باش الباكيند يلقاه
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        userData?.profileImageUrl ? `http://localhost:8081/uploads/${userData.profileImageUrl}` : null
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // التحضير للـ FormData لإرسال الملف والبيانات
        const formDataToSend = new FormData();

        // نحذفو الحقول اللي ما بغيناش نعدلوها
        const dataForBackend = { ...formData };
        delete dataForBackend.userId;
        delete dataForBackend.profileImageUrl;

        formDataToSend.append("data", JSON.stringify(dataForBackend));
        if (selectedFile) {
            formDataToSend.append("file", selectedFile);
        }

        try {
            await axios.put(`http://localhost:8081/api/profiles/${formData.userId}`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert("Informations mises à jour avec succès !");
            navigate('/profile');
        } catch (error) {
            console.error("خطأ التحديث:", error);
            alert("Erreur lors de la mise à jour.");
        }
    };

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab="profile" setActiveTab={() => {}} role={formData.role} />

            <main className="main-content">
                <TopHeader
                    activeTab="Edit Profile"
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={formData}
                />

                <section className="edit-section">
                    <form className="edit-form-card" onSubmit={handleSave}>
                        <div className="form-header">
                            <h2>Edit {formData.role?.toLowerCase() || 'User'}</h2>
                            <button type="button" onClick={() => navigate(-1)} className="back-link">← Back</button>
                        </div>

                        <div className="avatar-upload-box">
                            {previewUrl ? (
                                <img src={previewUrl} className="avatar-preview" alt="Preview" />
                            ) : (
                                <FaUserCircle size={100} color="#ccc" />
                            )}
                            <input type="file" accept="image/*" onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    setSelectedFile(file);
                                    setPreviewUrl(URL.createObjectURL(file));
                                }
                            }} />
                        </div>

                        <div className="form-grid">
                            <div className="field-group">
                                <label>First Name</label>
                                <input name="firstName" value={formData.firstName || ''} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Last Name</label>
                                <input name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Phone Number</label>
                                <input name="phone" value={formData.phone || ''} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Zone / City</label>
                                <select name="zone" value={formData.zone || ''} onChange={handleChange}>
                                    <option value="Maarif">Maarif</option>
                                    <option value="Anfa">Anfa</option>
                                </select>
                            </div>
                            <div className="field-group">
                                <label>Address</label>
                                <input name="address" value={formData.address || ''} onChange={handleChange} />
                            </div>
                        </div>

                        <button type="submit" className="update-btn">Update Profile</button>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default EditProfile;