import React, { useState } from "react";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";

const ClientDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="CLIENT" />

            <main className="main-content">
                <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                <section className="content-body">
                    {activeTab === "dashboard" && <h1>Bienvenue dans votre espace Client</h1>}
                    {/* هنا غتزيدي الكومبوننت ديال Mes Colis */}
                </section>
            </main>
        </div>
    );
};

export default ClientDashboard;