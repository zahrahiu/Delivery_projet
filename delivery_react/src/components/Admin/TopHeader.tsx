import React from 'react';
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

const TopHeader = ({ isMenuOpen, setIsMenuOpen, activeTab }: any) => (
    <header className="top-header">
        <div className="search-bar"><input type="text" placeholder={`Search ${activeTab}...`} /></div>
        <div className="user-profile-container" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <FaUserCircle className="main-user-icon" />
            {isMenuOpen && (
                <div className="profile-dropdown">
                    <div className="dropdown-item logout" onClick={() => {localStorage.removeItem("token"); window.location.href="/login"}}><FaSignOutAlt /> Logout</div>
                </div>
            )}
        </div>
    </header>
);
export default TopHeader;