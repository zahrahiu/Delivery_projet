import React, { useState } from 'react';
import { LayoutGrid, Headset, Truck, Users, Plus, Settings, LogOut, Package, Map, AlertTriangle, MapPin, Globe } from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab, role }: any) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const menuItems = role === "DISPATCHER"
        ? [
            { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} /> },
            { id: 'colis', label: 'Gestion Colis', icon: <Package size={22} /> },
            { id: 'livreurs', label: 'Liste Livreurs', icon: <Truck size={22} /> },
            { id: 'tournees', label: 'Tournées', icon: <Map size={22} /> },
            { id: 'incidents', label: 'Incidents', icon: <AlertTriangle size={22} /> },
        ]
        : role === "LIVREUR"
            ? [
                { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} /> },
                { id: 'mes-colis', label: 'Mes Colis', icon: <Package size={22} /> },
                { id: 'ma-tournee', label: 'Ma Tournée', icon: <Map size={22} /> },
            ]
            : role === "CLIENT"
                ? [
                    { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} /> },
                    { id: 'mes-colis', label: 'Mes Colis', icon: <Package size={22} /> },
                    { id: 'suivi', label: 'Suivi', icon: <Map size={22} /> },
                ]:
                [
                    { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} /> },
                    { id: 'dispatchers', label: 'Dispatchers', icon: <Headset size={22} /> },
                    { id: 'livreurs', label: 'Livreurs', icon: <Truck size={22} /> },
                    { id: 'clients', label: 'Clients', icon: <Users size={22} /> },
                ]

    return (
        <aside className="sidebar-v2">
            <div className="sidebar-top">
                <nav className="nav-icons-stack">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-bubble ${activeTab === item.id ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSettingsOpen(false); // كنسدو السيتينغ إلا وركنا على شي حاجة أخرى
                            }}
                            data-tooltip={item.label}
                        >
                            {item.icon}
                        </div>
                    ))}

                    {/* --- قسم الإعدادات للـ ADMIN --- */}
                    {(role === "ADMIN" || !role) && (
                        <div className="settings-wrapper">
                            {/* زر Settings هو الأول */}
                            <div
                                className={`nav-bubble ${isSettingsOpen && activeTab !== 'villes' && activeTab !== 'zones' ? 'active' : ''}`}
                                data-tooltip="Paramètres"
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            >
                                <Settings size={22} className={isSettingsOpen ? "rotate-icon" : ""} />
                            </div>

                            {/* الـ Dropdown كيبان لتحت دابا */}
                            {isSettingsOpen && (
                                <div className="settings-dropdown-bottom">
                                    <div
                                        className={`nav-bubble ${activeTab === 'villes' ? 'active' : ''}`}
                                        data-tooltip="Villes"
                                        onClick={() => setActiveTab('villes')}
                                    >
                                        <Globe size={20} />
                                    </div>
                                    <div
                                        className={`nav-bubble ${activeTab === 'zones' ? 'active' : ''}`}
                                        data-tooltip="Zones"
                                        onClick={() => setActiveTab('zones')}
                                    >
                                        <MapPin size={20} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="add-quick-btn"><Plus size={24} /></div>
                </nav>
            </div>

            <div className="sidebar-bottom">
                <div className="nav-bubble logout-btn" data-tooltip="Logout" onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
                    <LogOut size={22} />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;