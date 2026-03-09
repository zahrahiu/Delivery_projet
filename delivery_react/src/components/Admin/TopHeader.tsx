import React from 'react';

import {

    FaUserCircle,

    FaSignOutAlt,

    FaCog,

    FaMoon,

    FaSun,

    FaUserAlt

} from "react-icons/fa";
import logoSmall from "../../assets/img.png";



const TopHeader = ({ isMenuOpen, setIsMenuOpen, activeTab }: any) => {



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

                    <span className="user-role">Admin</span>

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



                        <div className="dropdown-item theme-toggle">

                            <div className="theme-info">

                                <FaMoon className="icon-purple" />

                                <span>Mode Sombre</span>

                            </div>

                            <label className="switch">

                                <input type="checkbox" />

                                <span className="slider round"></span>

                            </label>

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