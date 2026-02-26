import React, { useState } from "react";
import "./SignUp.css";
import heroImage from "../../assets/QribLik_LOGO.png";
import { useNavigate } from "react-router-dom";

const Signup: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="signup-card-container">
            {/* Navbar */}
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

            {/* Signup Card */}
            <div className="signup-card">
                <div className="signup-left">
                    <h2>Join QribLik</h2>
                    <p>Créez votre compte pour envoyer et suivre vos colis rapidement et en toute sécurité.</p>

                    <form className="signup-form">
                        {/* Row 1: Nom & Prénom */}
                        <div className="input-row">
                            <input type="text" placeholder="Nom" />
                            <input type="text" placeholder="Prénom" />
                        </div>

                        {/* Row 2: Téléphone & Ville */}
                        <div className="input-row">
                            <input type="tel" placeholder="Téléphone" />
                            <input type="text" placeholder="Ville" />
                        </div>

                        {/* Row 3: Email */}
                        <div className="input-row">
                            <input type="email" placeholder="Email" />
                        </div>

                        {/* Row 4: Password & Confirm Password */}
                        <div className="input-row">
                            <div className="password-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mot de passe"
                                />
                                <button
                                    type="button"
                                    className="show-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                            <div className="password-group">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Confirmer mot de passe"
                                />
                                <button
                                    type="button"
                                    className="show-btn"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="signup-btn">S’inscrire</button>
                    </form>
                </div>

                {/* Right Side - Image or info */}
                <div className="signup-right">
                    <h2>Why QribLik?</h2>
                    <p>
                        Profitez d’une livraison rapide, sécurisée et sans stress. Suivez vos colis en temps réel et simplifiez votre quotidien.
                    </p>

                    {/* Sous le bouton S’inscrire */}
                    {/* Sous le bouton S’inscrire */}
                    <div className="login-redirect">
                        <p>Pas encore de compte ?</p>
                        <button className="login-redirect-btn" onClick={() => navigate("/login")}>
                            Connectez-vous !
                        </button>
                    </div>
                </div>

            </div>

            {/* Circles Background */}
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
            <div className="circle circle-4"></div>
            <div className="circle circle-5"></div>
            <div className="circle circle-6"></div>
            <div className="circle circle-7"></div>
        </div>
    );
};

export default Signup;