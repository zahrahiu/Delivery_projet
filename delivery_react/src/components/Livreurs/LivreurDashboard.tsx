import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";

const LivreurDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // --- التعديل: استخدام الـ Gateway (8888) ---
    const GATEWAY_URL = "http://localhost:8888";
    const USER_PROFILE_API = `${GATEWAY_URL}/users-service/api/profiles/details`;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                // استخراج الـ userId من الـ JWT Payload
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId; // تأكدي أن اسم الحقل في التوكن هو userId

                // جلب بيانات البروفايل عبر الـ Gateway
                const response = await axios.get(`${USER_PROFILE_API}/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setUserData(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération du profil livreur:", error);
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab: string) => setActiveTab(tab)}
                role="LIVREUR"
            />

            <main className="main-content">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={userData} // إرسال بيانات المستخدم لـ TopHeader لعرض الصورة والاسم
                />

                <section className="content-body">
                    {activeTab === "dashboard" && (
                        <div className="welcome-section">
                            <h1>Bienvenue, {userData?.firstName || "Livreur"} ! 🚚</h1>
                            <p>Prêt pour vos livraisons d'aujourd'hui ?</p>
                        </div>
                    )}

                    {/* هنا تقدري تزيد المكونات الأخرى بحال MesLivraisons */}
                    {activeTab === "livraisons" && (
                        <div>{/* <MesLivraisons /> */}</div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default LivreurDashboard;