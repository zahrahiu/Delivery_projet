import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ColisManagement.css";

const ColisManagement: React.FC = () => {
    const [parcel, setParcel] = useState({
        weight: "",
        deliveryAddress: "",
        zoneId: "",
        senderId: "",
        senderName: "",
        senderPhone: ""
    });

    // هاد الـ useEffect كيجبد بيانات الـ Dispatcher فاش كتحل الصفحة
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setParcel(prev => ({
                    ...prev,
                    senderId: payload.userId, // كنجيبو الـ ID من التوكين
                    senderName: payload.sub || "", // غالباً الاسم كيكون في sub أو نجيبوه من API
                    senderPhone: payload.phone || ""
                }));
            } catch (e) {
                console.error("Erreur de décodage du token", e);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:8082/api/parcels", parcel, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            alert("✅ Le colis a été créé avec succès !");
            // كنمسحو غير بيانات الطرد، ماشي بيانات المرسل
            setParcel(prev => ({ ...prev, weight: "", deliveryAddress: "", zoneId: "" }));
        } catch (error) {
            console.error("Erreur :", error);
            alert("❌ Échec de la création du colis.");
        }
    };

    return (
        <div className="parcel-form-wrapper">
            <h2 className="parcel-title">Créer un nouveau colis</h2>
            <form onSubmit={handleSubmit}>
                <div className="parcel-form-group">
                    <label>Nom de l'expéditeur</label>
                    <input value={parcel.senderName} onChange={(e) => setParcel({...parcel, senderName: e.target.value})} required />
                </div>
                <div className="parcel-form-group">
                    <label>Téléphone de l'expéditeur</label>
                    <input value={parcel.senderPhone} onChange={(e) => setParcel({...parcel, senderPhone: e.target.value})} required />
                </div>
                <div className="parcel-form-group">
                    <label>Poids (kg)</label>
                    <input type="number" step="0.1" value={parcel.weight} onChange={(e) => setParcel({...parcel, weight: e.target.value})} required />
                </div>
                <div className="parcel-form-group">
                    <label>Adresse de livraison</label>
                    <input value={parcel.deliveryAddress} onChange={(e) => setParcel({...parcel, deliveryAddress: e.target.value})} required />
                </div>
                <div className="parcel-form-group">
                    <label>Zone ID</label>
                    <input value={parcel.zoneId} onChange={(e) => setParcel({...parcel, zoneId: e.target.value})} required />
                </div>
                <button type="submit" className="submit-parcel-btn">
                    Créer le colis
                </button>
            </form>
        </div>
    );
};

export default ColisManagement;