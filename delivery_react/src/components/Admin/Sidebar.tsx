import React from 'react';
import {
    LayoutGrid,
    Headset,
    Truck,
    Users,
    Plus,
    Settings,
    LogOut
} from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab }: any) => {
    const menuItems = [
        { id: 'dashboard', label: 'Overview', icon: <LayoutGrid size={22} /> },
        { id: 'dispatchers', label: 'Support', icon: <Headset size={22} /> },
        { id: 'livreurs', label: 'Delivery', icon: <Truck size={22} /> },
        { id: 'clients', label: 'Clients', icon: <Users size={22} /> },
    ];

    return (
        <aside className="sidebar-v2">
            <div className="sidebar-top">


                <nav className="nav-icons-stack">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-bubble ${activeTab === item.id ? "active" : ""}`}
                            onClick={() => setActiveTab(item.id)}
                            data-tooltip={item.label}
                        >
                            {item.icon}
                        </div>
                    ))}

                    <div className="add-quick-btn">
                        <Plus size={24} />
                    </div>
                </nav>
            </div>

            <div className="sidebar-bottom">
                <div className="nav-bubble" data-tooltip="Settings">
                    <Settings size={22} />
                </div>
                <div className="nav-bubble logout-btn" data-tooltip="Logout">
                    <LogOut size={22} />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;