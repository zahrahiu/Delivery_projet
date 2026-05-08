import React, { useState, useEffect } from "react";
import "./SignUp.css";
import heroImage from "../../assets/QribLik_LOGO.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';

const Signup: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const navigate = useNavigate();

    // State for villes list


    const [villes, setVilles] = useState<{ id: number; ville: string; frais_livraison: number }[]>([]);
    const [loadingVilles, setLoadingVilles] = useState(true);

    // State
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        dateNaissance: "",
        telephone: "",
        cni: "",
        adresse: "",
        ville: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "CLIENT",
        vehicleType: "",
        matricule: "",
        permisNumber: ""
    });

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // API URLs
    const TARIFS_API = "http://localhost:8888/tarif-zone-service/api/tarifs";

    // جلب المدن من API
    const fetchVilles = async () => {
        try {
            setLoadingVilles(true);
            const response = await axios.get(TARIFS_API);
            const villesData = response.data.map((item: any) => ({
                id: item.id,
                ville: item.ville,
                frais_livraison: item.frais_livraison
            }));
            setVilles(villesData);
        } catch (error) {
            console.error("Erreur lors du chargement des villes:", error);
            setVilles([
                { id: 1, ville: "Casablanca", frais_livraison: 25 },
                { id: 2, ville: "Rabat", frais_livraison: 25 },
                { id: 3, ville: "Marrakech", frais_livraison: 30 },
                { id: 4, ville: "Fès", frais_livraison: 30 },
                { id: 5, ville: "Tanger", frais_livraison: 35 },
                { id: 6, ville: "Agadir", frais_livraison: 40 },
            ]);
        } finally {
            setLoadingVilles(false);
        }
    };

    useEffect(() => {
        fetchVilles();
    }, []);

    // عرض Toast moderne
    const showToast = (icon: 'success' | 'error' | 'warning' | 'info', title: string, text?: string) => {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: icon === 'error' ? '#fff5f5' : '#f0fff4',
            color: icon === 'error' ? '#c62828' : '#2e7d32',
        });
    };

    // عرض Modal رسالة
    const showMessage = (icon: 'success' | 'error' | 'warning' | 'info', title: string, text?: string) => {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            confirmButtonColor: '#667eea',
            confirmButtonText: 'OK',
            background: '#fff',
            backdrop: 'rgba(0,0,0,0.4)'
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value;
        setFormData({ ...formData, role: newRole });
        setStep(1);
    };

    const isStep1Valid = () => {
        return formData.nom && formData.prenom && formData.telephone && formData.ville;
    };

    const isStep2Valid = () => {
        return formData.vehicleType && formData.matricule && formData.permisNumber;
    };

    const isEmailPasswordValid = () => {
        if (!formData.email) {
            showToast('warning', 'Email requis', 'Veuillez entrer votre email');
            return false;
        }
        if (!formData.password) {
            showToast('warning', 'Mot de passe requis', 'Veuillez entrer un mot de passe');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            showToast('error', 'Erreur', 'Les mots de passe ne correspondent pas');
            return false;
        }
        if (formData.password.length < 6) {
            showToast('warning', 'Mot de passe trop court', 'Minimum 6 caractères');
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (step === 1 && isStep1Valid()) {
            setStep(2);
        } else if (step === 2 && isStep2Valid()) {
            setStep(3);
        } else {
            showToast('warning', 'Champs manquants', 'Veuillez remplir tous les champs requis');
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEmailPasswordValid()) return;
        setLoading(true);

        try {
            const payload = {
                firstName: formData.prenom,
                lastName: formData.nom,
                email: formData.email,
                password: formData.password,
                phone: formData.telephone,           // ✅ phone
                cni: formData.cni,
                address: formData.adresse,
                zone: formData.ville,                 // ✅ zone (ville selectionnée)
                role: formData.role,
                dateNaissance: formData.dateNaissance || null,  // 🔥 أضف هاد السطر
                vehicleType: formData.role === "LIVREUR" ? formData.vehicleType : null,
                matricule: formData.role === "LIVREUR" ? formData.matricule : null,
                permisNumber: formData.role === "LIVREUR" ? formData.permisNumber : null,
                createdBy: "SIGNUP"
            };

            console.log("📤 Sending payload:", JSON.stringify(payload, null, 2));

            const response = await axios.post(
                "http://localhost:8888/users-service/api/profiles",
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            console.log("✅ Response:", response.data);
            showMessage('success', '✅ Inscription réussie !', 'Votre compte est en attente de validation.');
            setTimeout(() => navigate("/login"), 2000);

        } catch (err: any) {
            console.error("Signup Error:", err);
            console.error("Response data:", err.response?.data);
            const message = err.response?.data?.message || "Erreur lors de l'inscription.";
            showMessage('error', '❌ Erreur', message);
        } finally {
            setLoading(false);
        }
    };
    const VilleSelect = () => (
        <select
            name="ville"
            value={formData.ville}
            onChange={handleChange}
            className="full-width-select"
            required
            disabled={loadingVilles}
        >
            <option value="">{loadingVilles ? "Chargement des villes..." : "Sélectionnez votre ville"}</option>
            {villes.map((ville) => (
                <option key={ville.id} value={ville.ville}>
                    {ville.ville}
                </option>
            ))}
        </select>
    );

    const renderClientForm = () => (
        <div className="step-content">
            <div className="input-row">
                <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} required />
                <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required />
            </div>
            <div className="input-row">
                <input type="date" name="dateNaissance" placeholder="Date de naissance" value={formData.dateNaissance} onChange={handleChange} />
                <input type="tel" name="telephone" placeholder="Téléphone" value={formData.telephone} onChange={handleChange} required />
            </div>
            <div className="input-row">
                <input type="text" name="cni" placeholder="Numéro CNI" value={formData.cni} onChange={handleChange} />
                <input type="text" name="adresse" placeholder="Adresse" value={formData.adresse} onChange={handleChange} />
            </div>
            <div className="input-row">
                <VilleSelect />
            </div>
            <div className="input-row">
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-row">
                <div className="password-group">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Mot de passe"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "👁️" : "🙈"}
                    </span>
                </div>
                <div className="password-group">
                    <input
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirmer"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <span className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? "👁️" : "🙈"}
                    </span>
                </div>
            </div>
            <button type="submit" className="signup-btn" disabled={loading}>
                {loading ? "Chargement..." : "S'inscrire"}
            </button>
        </div>
    );

    const renderLivreurStep1 = () => (
        <div className="step-content">
            <div className="step-indicator">
                <span className="step-active">1</span>
                <span className="step-line"></span>
                <span className="step-inactive">2</span>
                <span className="step-line"></span>
                <span className="step-inactive">3</span>
            </div>
            <h3>Informations personnelles</h3>
            <div className="input-row">
                <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} required />
                <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required />
            </div>
            <div className="input-row">
                <input type="date" name="dateNaissance" placeholder="Date de naissance" value={formData.dateNaissance} onChange={handleChange} />
                <input type="tel" name="telephone" placeholder="Téléphone" value={formData.telephone} onChange={handleChange} required />
            </div>
            <div className="input-row">
                <input type="text" name="cni" placeholder="Numéro CNI" value={formData.cni} onChange={handleChange} />
                <input type="text" name="adresse" placeholder="Adresse" value={formData.adresse} onChange={handleChange} />
            </div>
            <div className="input-row">
                <VilleSelect />
            </div>
            <button type="button" className="next-btn" onClick={nextStep}>Continuer →</button>
        </div>
    );

    const renderLivreurStep2 = () => (
        <div className="step-content">
            <div className="step-indicator">
                <span className="step-completed">✓</span>
                <span className="step-line"></span>
                <span className="step-active">2</span>
                <span className="step-line"></span>
                <span className="step-inactive">3</span>
            </div>
            <h3>Informations professionnelles</h3>
            <div className="input-row">
                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} required className="full-width-select">
                    <option value="">Type de véhicule</option>
                    <option value="MOTO">Moto</option>
                    <option value="VOITURE">Voiture</option>
                    <option value="CAMIONNETTE">Camionnette</option>
                </select>
            </div>
            <div className="input-row">
                <input type="text" name="matricule" placeholder="Matricule" value={formData.matricule} onChange={handleChange} required />
                <input type="text" name="permisNumber" placeholder="N° Permis" value={formData.permisNumber} onChange={handleChange} required />
            </div>
            <div className="step-buttons">
                <button type="button" className="prev-btn" onClick={prevStep}>← Retour</button>
                <button type="button" className="next-btn" onClick={nextStep}>Continuer →</button>
            </div>
        </div>
    );

    const renderLivreurStep3 = () => (
        <div className="step-content">
            <div className="step-indicator">
                <span className="step-completed">✓</span>
                <span className="step-line"></span>
                <span className="step-completed">✓</span>
                <span className="step-line"></span>
                <span className="step-active">3</span>
            </div>
            <h3>Compte et sécurité</h3>
            <div className="input-row">
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-row">
                <div className="password-group">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Mot de passe"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "👁️" : "🙈"}
                    </span>
                </div>
                <div className="password-group">
                    <input
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirmer"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <span className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? "👁️" : "🙈"}
                    </span>
                </div>
            </div>
            <div className="step-buttons">
                <button type="button" className="prev-btn" onClick={prevStep}>← Retour</button>
                <button type="submit" className="signup-btn" disabled={loading}>
                    {loading ? "Chargement..." : "S'inscrire"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="signup-card-container">
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

            <div className="signup-card">
                <div className="signup-left">
                    <h2>Rejoignez QribLik</h2>

                    <div className="role-selection">
                        <label>Je suis un : </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleRoleChange}
                            className="role-select"
                        >
                            <option value="CLIENT">Client</option>
                            <option value="LIVREUR">Livreur</option>
                        </select>
                    </div>

                    <form onSubmit={handleSignup}>
                        {formData.role === "CLIENT" ? (
                            renderClientForm()
                        ) : (
                            <>
                                {step === 1 && renderLivreurStep1()}
                                {step === 2 && renderLivreurStep2()}
                                {step === 3 && renderLivreurStep3()}
                            </>
                        )}
                    </form>
                </div>

                <div className="signup-right">
                    <h2>Pourquoi QribLik ?</h2>
                    <p>
                        Profitez d'une livraison rapide et sécurisée.
                        Suivez vos colis en temps réel grâce à une interface simple,
                        moderne et intuitive.
                    </p>
                    <div className="login-redirect">
                        <p>Vous avez déjà un compte ?</p>
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="btn-login-outline"
                        >
                            Se connecter
                        </button>
                    </div>
                </div>
            </div>
            {[1, 2, 3, 4, 12, 20].map((num) => (
                <div key={num} className={`circle circle-${num}`}></div>
            ))}
        </div>
    );
};

export default Signup;