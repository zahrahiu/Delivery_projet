import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";

const ClientDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // --- التعديل: استخدام الـ Gateway واسم الخدمة ---
    const GATEWAY_URL = "http://localhost:8888";
    const USER_PROFILE_API = `${GATEWAY_URL}/users-service/api/profiles/details`;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                // استخراج الـ userId من الـ Token
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId;

                // طلب البيانات عبر الـ Gateway
                const response = await axios.get(`${USER_PROFILE_API}/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setUserData(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération des données client:", error);
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            {/* تأكدي أن الـ Sidebar كيقبل الـ role "CLIENT" */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="CLIENT" />

            <main className="main-content">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={userData} // إرسال البيانات لعرض الاسم والصورة الفوق
                />

                <section className="content-body">
                    {activeTab === "dashboard" && (
                        <div className="welcome-message">
                            <h1>Bienvenue {userData?.firstName || "Client"} 👋</h1>
                            <p>Suivez vos colis "Qrib Lik" en temps réel.</p>
                        </div>
                    )}

                    {/* هنا غتزيدي المكونات الخاصة بالزبون بحال تتبع الطلبيات */}
                    {activeTab === "mes-commandes" && (
                        <div>{/* <ClientOrders /> */}</div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ClientDashboard;