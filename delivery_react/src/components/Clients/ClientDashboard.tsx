import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";

const ClientDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null); // ضروري نزيدو الـ State ديال userData

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                // فك التوكين لجلب الـ userId
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId;

                // جلب بيانات المستخدم باش يظهر الاسم في الـ Navbar
                const response = await axios.get(`http://localhost:8081/api/profiles/details/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response.data);
            } catch (error) {
                console.error("خطأ في جلب بيانات المستخدم:", error);
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="CLIENT" />

            <main className="main-content">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={userData} // دابا الـ userData معرفة وغادي تظهر الاسم
                />

                <section className="content-body">
                    {activeTab === "dashboard" && <h1>Bienvenue {userData?.firstName || "Client"}</h1>}
                </section>
            </main>
        </div>
    );
};

export default ClientDashboard;