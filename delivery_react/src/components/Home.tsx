import React, { useState } from "react";
import "./Home.css";
import heroImage from "../assets/QribLik_LOGO.png";
import packageImage from "../assets/undraw_deliveries_qutl.svg";
import motorImage from "../assets/undraw_on-the-way_zwi3.svg";
import colisPackage from "../assets/Hands - Box.png"
import {FaEnvelope, FaMapMarkerAlt, FaPhoneAlt} from "react-icons/fa";

import {
    FaTruck,
    FaBell,
    FaMoneyBillWave,
    FaChartLine,FaBox, FaClipboardCheck, FaTruckMoving, FaCheckCircle,
    FaHeadset,
} from "react-icons/fa";

const Home: React.FC = () => {
    const [activeTab, setActiveTab] = useState("client");

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
                        <button className="btn-inscription">Inscription</button>
                    </div>
                </div>
            </nav>

            {/* HERO */}
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
                    <h2 className="section-title">Nos Fonctionnalités</h2>

                    <div className="features-grid">
                        <div className="feature-card animate-card" style={{ "--delay": "0s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaTruck /></div>
                            <h3>Suivi en temps réel</h3>
                            <p>Suivez vos colis à chaque étape et obtenez des mises à jour instantanées pour rester informé en permanence sur l'état de vos livraisons.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "0.2s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaBell /></div>
                            <h3>Notifications automatiques</h3>
                            <p>Recevez des alertes en temps réel pour chaque événement lié à vos colis, afin que vous puissiez réagir rapidement et efficacement.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "0.4s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaMoneyBillWave /></div>
                            <h3>Gestion des encaissements</h3>
                            <p>Gérez vos paiements facilement, suivez l'historique des transactions et assurez une transparence totale pour toutes vos opérations financières.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "0.6s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaChartLine /></div>
                            <h3>Analyses & Rapports</h3>
                            <p>Obtenez des rapports détaillés et des graphiques sur vos performances de livraison pour mieux comprendre vos flux et optimiser votre logistique.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "0.8s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaHeadset /></div>
                            <h3>Support 24/7</h3>
                            <p>Notre équipe d'assistance est disponible à tout moment pour résoudre vos problèmes et répondre à vos questions afin de garantir un service sans interruption.</p>
                        </div>

                        <div className="feature-card animate-card" style={{ "--delay": "1s" } as React.CSSProperties}>
                            <div className="feature-icon"><FaTruck /></div>
                            <h3>Livraison rapide</h3>
                            <p>Profitez d'un service de livraison rapide et fiable qui assure que vos colis arrivent à temps, chaque fois, avec un suivi détaillé et précis.</p>
                        </div>
                    </div>
                </div>
            </section>


            <section id="comment-ca-marche" className="how-it-works">
                <div className="container">
                    <h2 className="section-title">Comment ça marche</h2>
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
                                    Votre colis est soigneusement enregistré dans notre système dès son arrivée.
                                    Toutes les informations nécessaires sont vérifiées afin d’assurer un suivi précis
                                    et une gestion optimale dès la première étape.
                                </p>                            </div>

                            <div className="timeline-step">
                                <div className="timeline-icon">
                                    <FaClipboardCheck />
                                </div>
                                <h3>Préparation</h3>
                                <p>
                                    Une fois enregistré, le colis passe par une phase de vérification et de préparation.
                                    Notre équipe s’assure que toutes les conditions sont réunies pour garantir une
                                    livraison rapide et sécurisée.
                                </p>                            </div>

                            <div className="timeline-step">
                                <div className="timeline-icon">
                                    <FaTruckMoving />
                                </div>
                                <h3>Livraison</h3>
                                <p>
                                    Un livreur professionnel prend en charge votre colis et le transporte
                                    dans les meilleures conditions. Grâce au suivi en temps réel, vous
                                    pouvez visualiser chaque étape du trajet.
                                </p>                            </div>

                            <div className="timeline-step">
                                <div className="timeline-icon">
                                    <FaCheckCircle />
                                </div>
                                <h3>Confirmation</h3>
                                <p>
                                    Une notification de confirmation est envoyée immédiatement après la livraison.
                                    Vous disposez ainsi d’une preuve fiable que le colis est bien arrivé à destination.
                                </p>                            </div>

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