import React, { useState } from "react";
import "./Login.css";
import { FaUser, FaLock } from "react-icons/fa";
import heroImage from "../../assets/QribLik_LOGO.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await axios.post("http://localhost:8080/v1/users/login", {
                email,
                password
            });

            const { accessToken } = res.data;

            // تخزين token
            localStorage.setItem("token", accessToken);

            // decode JWT باش نعرفو role
            const payload = JSON.parse(atob(accessToken.split(".")[1]));
            const roles = payload.roles;

            if (roles.includes("ADMIN")) {
                navigate("/admin");
            } else if (roles.includes("DISPATCHER")) {
                navigate("/dispatcher");
            } else if (roles.includes("LIVREUR")) {
                navigate("/livreur");
            } else {
                navigate("/client");
            }
        } catch (err: any) {
            alert("Échec de la connexion ! Vérifiez votre email ou mot de passe.");
            console.error(err);
        }
    };

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
                    <h2>Bon retour !</h2>
                    <p>Connectez-vous pour suivre vos livraisons et gérer vos commandes facilement.</p>

                    <div className="input-group">
                        <FaUser className="icon" />
                        <input
                            type="text"
                            placeholder="Votre Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <FaLock className="icon" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            className="show-btn"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "CACHER" : "AFFICHER"}
                        </button>
                    </div>

                    <button className="login-btn" onClick={handleLogin}>Se connecter</button>
                    <a href="#" className="forgot-link">
                        Mot de passe oublié ?
                    </a>
                </div>

                {/* Right Side - Signup */}
                <div className="login-right">
                    <h2>Nouveau ici ?</h2>
                    <p>
                        Créez un compte dès maintenant pour envoyer et suivre vos colis facilement.
                        Profitez d’une livraison rapide, sécurisée et sans stress.
                    </p>
                    <button onClick={() => navigate("/Signup")} className="signup-btn">S'inscrire</button>
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