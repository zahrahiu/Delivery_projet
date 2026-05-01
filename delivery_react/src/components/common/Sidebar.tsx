import React, { useState } from 'react';
import {
    LayoutGrid, Headset, Truck, Users, Plus, Settings, LogOut, Package, Map, AlertTriangle, MapPin, Globe,
    UserPlus, History, ClipboardIcon
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, role }: any) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const navigate = useNavigate();

    const handleNavigation = (id: string, path: string) => {
        setActiveTab(id);
        navigate(path);
        setIsSettingsOpen(false);
    };

    const menuItems = role === "DISPATCHER"
        ? [
            { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} />, path: '/dispatcher' },
            { id: 'colis', label: 'Gestion Colis', icon: <Package size={22} />, path: '/dispatcher/colis' },
            { id: 'livreurs', label: 'Liste Livreurs', icon: <Truck size={22} />, path: '/dispatcher/livreurs' },
            { id: 'tournees', label: 'Tournées', icon: <Map size={22} />, path: '/dispatcher/tournees' },
            { id: 'incidents', label: 'Incidents', icon: <AlertTriangle size={22} />, path: '/dispatcher/incidents' },
        ]
        : role === "LIVREUR"
            ? [
                { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} />, path: '/livreur' },
                { id: 'mes-colis', label: 'Mes Colis', icon: <Package size={22} />, path: '/livreur/mes-colis' },
                { id: 'ma-tournee', label: 'Ma Tournée', icon: <Map size={22} />, path: '/livreur/ma-tournee' },
                { id: 'historique', label: 'Historique', icon: <ClipboardIcon size={22} />, path: '/livreur/historique' },
                { id: 'incidents', label: 'Signalements', icon: <AlertTriangle size={22} />, path: '/livreur/incidents' },
            ]
            : role === "CLIENT"
                ? [
                    { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} />, path: '/client' },
                    { id: 'mes-colis', label: 'Mes Colis', icon: <Package size={22} />, path: '/client/mes-colis' },
                    { id: 'suivi', label: 'Suivi', icon: <Map size={22} />, path: '/client/suivi' },
                    { id: 'historique', label: 'Historique', icon: <History size={22} />, path: '/client/historique' },  // ✅ AJOUTÉ
                ]
                : [
                    { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} />, path: '/admin' },
                    { id: 'dispatchers', label: 'Dispatchers', icon: <Headset size={22} />, path: '/admin/dispatchers' },
                    { id: 'livreurs', label: 'Livreurs', icon: <Truck size={22} />, path: '/admin/livreurs' },
                    { id: 'clients', label: 'Clients', icon: <UserPlus size={22} />, path: '/admin/clients' },
                    { id: 'pending', label: 'Demandes', icon: <Users size={22} />, path: '/admin/pending-users' },
                ];

    return (
        <aside className="sidebar-v2">
            <div className="sidebar-top">
                <nav className="nav-icons-stack">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-bubble ${activeTab === item.id ? "active" : ""}`}
                            onClick={() => handleNavigation(item.id, item.path)}
                            data-tooltip={item.label}
                        >
                            {item.icon}
                        </div>
                    ))}

                    {(role === "ADMIN" || !role) && (
                        <div className="settings-wrapper">
                            <div
                                className={`nav-bubble ${isSettingsOpen && activeTab !== 'villes' && activeTab !== 'zones' ? 'active' : ''}`}
                                data-tooltip="Paramètres"
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            >
                                <Settings size={22} className={isSettingsOpen ? "rotate-icon" : ""} />
                            </div>

                            {isSettingsOpen && (
                                <div className="settings-dropdown-bottom">
                                    <div
                                        className={`nav-bubble ${activeTab === 'villes' ? 'active' : ''}`}
                                        data-tooltip="Villes"
                                        onClick={() => handleNavigation('villes', '/admin/villes')}
                                    >
                                        <Globe size={20} />
                                    </div>
                                    <div
                                        className={`nav-bubble ${activeTab === 'zones' ? 'active' : ''}`}
                                        data-tooltip="Zones"
                                        onClick={() => handleNavigation('zones', '/admin/zones')}
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