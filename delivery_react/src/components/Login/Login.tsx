import React, { useState } from "react";
import "./Login.css";
import { FaUser, FaLock } from "react-icons/fa";
import heroImage from "../../assets/QribLik_LOGO.png";
import { useNavigate } from "react-router-dom";


const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    return (

        <div className="login-card-container">
            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo-area">
                        <img src={heroImage} alt="QribLik Logo" className="logo-img" />
                    </div>

                    <div className="nav-links">
                        <a href="#fonctionnalites">Fonctionnalités</a>
                        <a href="#comment-ca-marche">Comment ça marche</a>
                        <a href="#contact">Contactez nous</a>
                    </div>
                </div>
            </nav>
            <div className="login-card">
                {/* Left Side - Login */}
                <div className="login-left">
                    <h2>Welcome Back</h2>
                    <p>Connectez-vous pour suivre vos livraisons et gérer vos commandes facilement.</p>

                    <div className="input-group">
                        <FaUser className="icon" />
                        <input type="text" placeholder="User Name" />
                    </div>

                    <div className="input-group">
                        <FaLock className="icon" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                        />
                        <button
                            className="show-btn"
                        >
                            {showPassword ? "HIDE" : "SHOW"}
                        </button>
                    </div>

                    <button className="login-btn">Login</button>
                    <a href="#" className="forgot-link">
                        Forgot Password?
                    </a>
                </div>

                {/* Right Side - Signup */}
                <div className="login-right">
                    <h2>New Here?</h2>
                    <p>
                        Créez un compte dès maintenant pour envoyer et suivre vos colis facilement.
                        Profitez d’une livraison rapide, sécurisée et sans stress.
                    </p>
                    <button onClick={() => navigate("/Signup")} className="signup-btn">Sign Up</button>
                </div>
            </div>
            {/* Circles Background */}
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
            <div className="circle circle-4"></div>
            <div className="circle circle-9"></div>
            <div className="circle circle-12"></div>
            <div className="circle circle-20"></div>
        </div>
    );
};

export default Login;