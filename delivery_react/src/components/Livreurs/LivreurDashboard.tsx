import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";

const LivreurDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null); // State باش نحفظو بيانات السائق

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
                console.error("خطأ في جلب بيانات السائق:", error);
            }
        };
        fetchUserData();
    }, []);

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            {/* هنا كنزيدو setActiveTab باش يخدم Navigation */}
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
                    user={userData} // هنا كنزيدو الـ user باش تبان السمية في الـ Navbar
                />
                <section className="content-body">
                    {activeTab === "dashboard" && <h1>Bienvenue {userData?.firstName || "Livreur"}</h1>}
                    {/* هنا غتزيدي الكومبوننت ديال Mes Livraisons */}
                </section>
            </main>
        </div>
    );
};

export default LivreurDashboard;