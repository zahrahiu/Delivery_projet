import React, { useState } from 'react';
import { FaUserCircle, FaSignOutAlt, FaCog, FaUserAlt } from "react-icons/fa";
import logoSmall from "../../assets/img.png";

const TopHeader = ({ isMenuOpen, setIsMenuOpen, activeTab }: any) => {

    const getFullNameFromToken = () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return "Utilisateur";

            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const userData = JSON.parse(jsonPayload);

            const prenom = userData.prenom || "";
            const nom = userData.nom || "";

            return (prenom || nom) ? `${prenom} ${nom}`.trim() : "Utilisateur";
        } catch (error) {
            console.error("Error decoding token:", error);
            return "Utilisateur";
        }
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof setIsMenuOpen === 'function') {
            setIsMenuOpen(!isMenuOpen);
        }
    };

    const handleLogout = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <header className="top-header">
            <div className="brand-icon">
                <img src={logoSmall} alt="Q" />
            </div>

            <div className="search-bar">
                <input type="text" placeholder={`Rechercher dans ${activeTab}...`} />
            </div>

            <div className="user-profile-container" onClick={toggleMenu}>
                <div className="user-trigger">
                    <span className="user-role">{getFullNameFromToken()}</span>
                    <FaUserCircle className="main-user-icon" />
                </div>

                {isMenuOpen && (
                    <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-header">
                            <strong>Mon Compte</strong>
                        </div>
                        <div className="dropdown-item">
                            <FaUserAlt className="icon-pink" />
                            <span>Mon Profil</span>
                        </div>
                        <div className="dropdown-item">
                            <FaCog className="icon-blue" />
                            <span>Paramètres</span>
                        </div>
                        <hr className="divider" />
                        <div className="dropdown-item logout" onClick={handleLogout}>
                            <FaSignOutAlt />
                            <span>Déconnexion</span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default TopHeader;