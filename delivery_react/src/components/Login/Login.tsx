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
            const res = await axios.post("http://localhost:8888/service-security/v1/users/login", {
                email,
                password
            });

            const { accessToken } = res.data;

            // تخزين الـ token
            localStorage.setItem("token", accessToken);

            // Decode JWT باش نعرفو الـ roles
            const base64Url = accessToken.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(window.atob(base64));

            const userRoles = payload.authorities || payload.roles || [];

            const rolesStr = JSON.stringify(userRoles).toUpperCase();

            if (rolesStr.includes("ADMIN")) {
                navigate("/admin");
            } else if (rolesStr.includes("DISPATCHER")) {
                navigate("/dispatcher");
            } else if (rolesStr.includes("LIVREUR")) {
                navigate("/livreur");
            } else {
                navigate("/client");
            }

        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.response) {
                alert(`Erreur: ${err.response.data.message || "Identifiants incorrects"}`);
            } else {
                alert("Impossible de contacter le serveur. Vérifiez le Gateway (8888).");
            }
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
                            type="email"
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
            {[1, 2, 3, 4, 9, 12, 20].map((num) => (
                <div key={num} className={`circle circle-${num}`}></div>
            ))}
        </div>
    );
};

export default Login;