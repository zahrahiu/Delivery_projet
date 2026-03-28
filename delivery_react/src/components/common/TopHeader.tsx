import React from "react";
import { FaUserCircle, FaSignOutAlt, FaCog, FaUserAlt } from "react-icons/fa";
import logoSmall from "../../assets/img.png";
import { useNavigate } from 'react-router-dom';

// كنزيدو user كـ prop باش نقدروا نصيفطو ليه المعلومات من الصفحات
const TopHeader = ({ isMenuOpen, setIsMenuOpen, activeTab, user }: any) => {
    const navigate = useNavigate();

    // دابا الاسم كيجي من الـ prop (user)، إلا ما كانش كيرجع "Utilisateur"
    const displayName = user && (user.firstName || user.lastName)
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
        : "Admin";

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof setIsMenuOpen === 'function') {
            setIsMenuOpen(!isMenuOpen);
        }
    };

    const handleLogout = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <header className="top-header">
            <div className="brand-icon">
                <img src={logoSmall} alt="Logo" />
            </div>

            <div className="search-bar">
                <input type="text" placeholder={`Rechercher dans ${activeTab}...`} />
            </div>

            <div className="user-profile-container" onClick={toggleMenu}>
                <div className="user-trigger">
                    <span className="user-role">{displayName}</span>
                    <FaUserCircle className="main-user-icon" />
                </div>

                {isMenuOpen && (
                    <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown-header">
                            <strong>Mon Compte</strong>
                        </div>
                        <div className="dropdown-item" onClick={() => navigate('/profile')}>
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