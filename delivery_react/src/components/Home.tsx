import React, {useEffect, useState} from "react";
import "./Home.css";
import heroImage from "../assets/QribLik_LOGO.png";
import packageImage from "../assets/undraw_deliveries_qutl.svg";
import motorImage from "../assets/undraw_on-the-way_zwi3.svg";
import colisPackage from "../assets/Hands - Box.png"
import {FaEnvelope, FaMapMarkerAlt, FaPhoneAlt} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import {
    FaTruck,
    FaBell,
    FaMoneyBillWave,
    FaChartLine,FaBox, FaClipboardCheck, FaTruckMoving, FaCheckCircle,
    FaHeadset,
} from "react-icons/fa";
import axios from "axios";

const Home: React.FC = () => {
    const [activeTab, setActiveTab] = useState("client");
    const navigate = useNavigate();

    const [villes, setVilles] = useState<any[]>([]); // لتخزين المدن من الـ API
    const [selectedCity, setSelectedCity] = useState(""); // المدينة المختارة
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:8888/tarif-zone-service/api/tarifs";

    useEffect(() => {
        const fetchVilles = async () => {
            try {
                const res = await axios.get(API_URL);
                setVilles(res.data);
                if (res.data.length > 0) {
                    setSelectedCity(res.data[0].ville); // اختيار أول مدينة تلقائياً
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching prices:", err);
                setLoading(false);
            }
        };
        fetchVilles();
    }, []);

    const selectedCityData = villes.find(
        (v) => v.ville === selectedCity
    );

    return (
        <div className="qrlib-container">
            {/* NAVBAR */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo-area">
                        <img src={heroImage} alt="QribLik Logo" className="logo-img" />
                    </div>

                    <div className="nav-links">
                        <a href="#fonctionnalites">Fonctionnalités</a>
                        <a href="#comment-ca-marche">Comment ça marche</a>
                        <a href="#contact">Contactez nous</a>
                        <button  onClick={() => navigate("/login")} className="btn-inscription">Inscription</button>
                    </div>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Livraison de colis <br />
                            <span className="hero-highlight">
          simplifiée et professionnelle
        </span>
                        </h1>

                        <p className="hero-description">
                            Optimisez votre chaîne logistique avec notre plateforme moderne.
                        </p>

                        <div className="hero-buttons">
                            <button
                                className={`btn-client ${
                                    activeTab === "client" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("client")}
                            >
                                Je suis client
                            </button>

                            <button
                                className={`btn-livreur ${
                                    activeTab === "livreur" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("livreur")}
                            >
                                Je suis livreur
                            </button>
                        </div>
                    </div>

                    <div className="hero-image">
                        <img src={packageImage} alt="Livraison" />
                    </div>
                </div>
            </section>


            {/* FEATURES WITH ICONS */}
            <section id="fonctionnalites" className="features">
                <div className="container">
                    <h2 className="section-title2">Nos Fonctionnalités</h2>

                    <div className="features-grid">
                        <div className="feature-card animate-card" style={{ "--delay": "0s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaTruck /></div>
                            <h3>Suivi en temps réel</h3>
                            <p>Localisez vos colis à chaque étape avec des mises à jour instantanées.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "0.2s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaBell /></div>
                            <h3>Notifications</h3>
                            <p>Alertes automatiques pour chaque événement important lié à vos livraisons.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "0.4s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaMoneyBillWave /></div>
                            <h3>Encaissements</h3>
                            <p>Gestion simplifiée des paiements et historique transparent des transactions.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "0.6s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaChartLine /></div>
                            <h3>Analyses & Rapports</h3>
                            <p>Statistiques détaillées pour optimiser vos performances logistiques.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "0.8s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaHeadset /></div>
                            <h3>Support 24/7</h3>
                            <p>Assistance technique disponible à tout moment pour vous accompagner.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "1s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaTruck /></div>
                            <h3>Livraison Express</h3>
                            <p>Service rapide et fiable garantissant l'arrivée de vos colis dans les délais.</p>
                        </div>
                    </div>
                </div>
            </section>


            <section id="comment-ca-marche" className="how-it-works">
                <div className="container">
                    <h2 className="section-title2">Comment ça marche</h2>
                    <p className="section-subtitle">
                        Un processus optimisé en quatre étapes pour assurer une livraison efficace.
                    </p>

                    <div className="timeline">

                        <div className="timeline-line"></div>
                        <img src={motorImage} alt="motor" className="timeline-motor" />

                        <div className="timeline-steps">

                            <div className="timeline-step">
                                <div className="timeline-icon">
                                    <FaBox />
                                </div>
                                <h3>Arrivée du colis</h3>
                                <p>
                                    Enregistrement immédiat du colis dans notre système dès sa réception pour un suivi précis.
                                </p>
                            </div>

                            <div className="timeline-step">
                                <div className="timeline-icon">
                                    <FaClipboardCheck />
                                </div>
                                <h3>Préparation</h3>
                                <p>
                                    Vérification rigoureuse et tri logistique pour garantir une expédition sécurisée.
                                </p>
                            </div>

                            <div className="timeline-step">
                                <div className="timeline-icon">
                                    <FaTruckMoving />
                                </div>
                                <h3>Livraison</h3>
                                <p>
                                    Prise en charge par le livreur avec un suivi en temps réel jusqu'à votre destination.
                                </p>
                            </div>

                            <div className="timeline-step">
                                <div className="timeline-icon">
                                    <FaCheckCircle />
                                </div>
                                <h3>Confirmation</h3>
                                <p>
                                    Notification instantanée dès la remise du colis, servant de preuve de livraison finale.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <div className="container cta-container">
                    <div className="cta-text">
                        <h2>Prêt à simplifier vos livraisons ?</h2>
                        <p>Rejoignez QribLik dès aujourd'hui et profitez d'une gestion simplifiée.</p>
                        <button className="btn-start">Commencer maintenant</button>
                    </div>

                    <div className="cta-image">
                        <img src={colisPackage} alt="Colis" />
                    </div>
                </div>
            </section>

            <section className="pricing-dark">
                <div className="pricing-container">
                    <span className="pricing-badge">Couverture et tarifs</span>
                    <h2 className="pricing-title">Prix de livraison par ville</h2>
                    <p className="pricing-subtitle">
                        Recherchez une ville pour voir les tarifs de livraison.
                    </p>

                    {loading ? (
                        <p style={{ color: "white" }}>Chargement des tarifs...</p>
                    ) : (
                        <>
                            {/* Select الديناميكي */}
                            <div className="select-wrapper">
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                >
                                    {villes.map((v) => (
                                        <option key={v.id} value={v.ville}>
                                            {v.ville}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Result الديناميكي */}
                            {selectedCityData && (
                                <div className="price-result">
                                    <span className="city-name">{selectedCityData.ville}</span>
                                    <span className="city-price">
                            {selectedCityData.frais_livraison} DH
                        </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <hr/>

            {/* FOOTER */}
            {/* CONTACT SECTION */}
            <section id="contact" className="contact">
                <h2 className="contact-title">Contactez-nous</h2>
                <div className="contact-main">
                    {/* Left: Map */}
                    <div className="contact-left">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3327.247395602288!2d-7.61741118479978!3d33.57311028069839!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda7d8b4c56b7f33%3A0x14d59df4f8e9043d!2sCasablanca%2C%20Morocco!5e0!3m2!1sen!2sma!4v1677000000000!5m2!1sen!2sma"
                            title="map"
                            loading="lazy"

                        ></iframe>
                    </div>

                    {/* Right: Form + Logo + Car + Infos */}
                    <div className="contact-right">
                        <form className="contact-form">
                            <div className="form-row">
                                <input type="text" placeholder="Nom complet" />
                                <input type="email" placeholder="Email" />
                            </div>
                            <div className="form-row">
                                <input type="text" placeholder="Téléphone" />
                                <input type="text" placeholder="Sujet" />
                            </div>
                            <textarea placeholder="Message"></textarea>
                            <button type="submit">Envoyer</button>
                        </form>


                    </div>
                </div>
                {/* CONTACT INFO CARDS */}
                <div className="contact-cards">

                    <div className="contact-card">
                        <div className="card-icon">
                            <FaEnvelope />
                        </div>
                        <h4>Email</h4>
                        <p>contact@qriblik.ma</p>
                    </div>

                    <div className="contact-card">
                        <div className="card-icon">
                            <FaPhoneAlt />
                        </div>
                        <h4>Téléphone</h4>
                        <p>+212 6 12 34 56 78</p>
                    </div>

                    <div className="contact-card">
                        <div className="card-icon">
                            <FaMapMarkerAlt />
                        </div>
                        <h4>Adresse</h4>
                        <p>Casablanca, Maroc</p>
                    </div>

                </div>

            </section>
        </div>
    );
};

export default Home;