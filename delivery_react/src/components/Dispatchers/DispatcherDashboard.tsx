import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";

const DispatcherDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null); // State لجلب بيانات الـ Dispatcher

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId;

                const response = await axios.get(`http://localhost:8081/api/profiles/details/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response.data);
            } catch (error) {
                console.error("خطأ في جلب بيانات الـ Dispatcher:", error);
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab: string) => setActiveTab(tab)}
                role="DISPATCHER"
            />

            <main className="main-content">
                <TopHeader
                    activeTab={activeTab}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    user={userData} // تمرير بيانات المستخدم للـ Header
                />
                <section className="content-body">
                    {activeTab === "dashboard" && <h1>Bienvenue {userData?.firstName || "Dispatcher"}</h1>}
                </section>
            </main>
        </div>
    );
};

export default DispatcherDashboard;