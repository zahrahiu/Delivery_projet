import React, { useState } from "react";
import "./Login.css";
import { FaUser, FaLock } from "react-icons/fa";
import heroImage from "../../assets/QribLik_LOGO.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [tempToken, setTempToken] = useState("");
    const [tempUserId, setTempUserId] = useState("");
    const navigate = useNavigate();

    const handleChangePassword = async () => {
        if (newPassword !== confirmNewPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Les mots de passe ne correspondent pas',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        if (newPassword.length < 6) {
            Swal.fire({
                icon: 'warning',
                title: 'Mot de passe trop court',
                text: 'Minimum 6 caractères',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        try {
            // Appel API pour changer le password
            await axios.patch(
                `http://localhost:8888/service-security/v1/users/${tempUserId}/change-password`,
                { password: newPassword },
                {
                    headers: {
                        Authorization: `Bearer ${tempToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            Swal.fire({
                icon: 'success',
                title: '✅ Mot de passe modifié',
                text: 'Veuillez vous reconnecter avec votre nouveau mot de passe',
                confirmButtonColor: '#667eea'
            });

            setShowChangePasswordModal(false);
            localStorage.removeItem("token");
            setEmail("");
            setPassword("");

        } catch (err: any) {
            console.error("Error changing password:", err);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: err.response?.data?.message || "Impossible de changer le mot de passe",
                confirmButtonColor: '#667eea'
            });
        }
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post("http://localhost:8888/service-security/v1/users/login", {
                email: email.trim(),
                password: password.trim()
            });

            const { accessToken, firstLogin, id } = res.data;  // 🔥 استعمل id بدل userId

            localStorage.setItem("token", accessToken);

            if (firstLogin === true) {
                setTempToken(accessToken);
                setTempUserId(id);  // 🔥 استعمل id
                setShowChangePasswordModal(true);
                return;
            }

            // Decode JWT
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
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: err.response.data.message || "Identifiants incorrects",
                    confirmButtonColor: '#667eea'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: "Impossible de contacter le serveur",
                    confirmButtonColor: '#667eea'
                });
            }
        }
    };
    return (
        <div className="login-card-container">
            {/* Modal pour changer le mot de passe */}
            {showChangePasswordModal && (
                <div className="modal-overlay" onClick={() => {}}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3>🔐 Changer votre mot de passe</h3>
                            <button className="close-modal" onClick={() => setShowChangePasswordModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '20px', color: '#666' }}>
                                Ceci est votre première connexion. Veuillez définir un nouveau mot de passe.
                            </p>
                            <div className="input-group">
                                <FaLock className="icon" />
                                <input
                                    type="password"
                                    placeholder="Nouveau mot de passe"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <FaLock className="icon" />
                                <input
                                    type="password"
                                    placeholder="Confirmer le mot de passe"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowChangePasswordModal(false)}>Annuler</button>
                            <button className="btn-primary" onClick={handleChangePassword}>Changer le mot de passe</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reste du formulaire login... */}
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

                <div className="login-right">
                    <h2>Nouveau ici ?</h2>
                    <p>
                        Créez un compte dès maintenant pour envoyer et suivre vos colis facilement.
                        Profitez d’une livraison rapide, sécurisée et sans stress.
                    </p>
                    <button onClick={() => navigate("/Signup")} className="signup-btn">S'inscrire</button>
                </div>
            </div>

            {[1, 2, 3, 4, 9, 12, 20].map((num) => (
                <div key={num} className={`circle circle-${num}`}></div>
            ))}
        </div>
    );
};

export default Login;