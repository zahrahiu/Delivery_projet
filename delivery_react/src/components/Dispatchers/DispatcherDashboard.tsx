import React, { useState } from "react";
import Sidebar from "../common/Sidebar";
import TopHeader from "../common/TopHeader";


const DispatcherDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="admin-container" onClick={() => setIsMenuOpen(false)}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role="DISPATCHER" />

            <main className="main-content">
                <TopHeader activeTab={activeTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

                <section className="content-body">
                    {activeTab === "dashboard" && <h1>Statistiques Opérationnelles</h1>}

                </section>
            </main>
        </div>
    );
};

export default DispatcherDashboard;