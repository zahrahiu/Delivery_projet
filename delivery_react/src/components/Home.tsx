import React, {useEffect, useState} from "react";
import "./Home.css";
import heroImage from "../assets/QribLik_LOGO.png";
import packageImage from "../assets/undraw_deliveries_qutl.svg";
import motorImage from "../assets/undraw_on-the-way_zwi3.svg";
import colisPackage from "../assets/Hands - Box.png"
import {FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaTimes, FaBox, FaClipboardCheck, FaTruckMoving, FaCheckCircle, FaUser, FaWeightHanging, FaMapMarker, FaIdCard, FaSearch, FaEuroSign, FaCity} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import {
    FaTruck,
    FaBell,
    FaMoneyBillWave,
    FaChartLine,
    FaHeadset,
} from "react-icons/fa";
import axios from "axios";

const Home: React.FC = () => {
    const navigate = useNavigate();

    const [villes, setVilles] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState("");
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState<any[]>([]); // ✅ أضفنا الـ zones

    const API_URL = "http://localhost:8888/tarif-zone-service/api/tarifs";
    const ZONES_API_URL = "http://localhost:8888/tarif-zone-service/api/zones";

    const [trackingCode, setTrackingCode] = useState("");
    const [trackingInfo, setTrackingInfo] = useState<any>(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
    const [deliveryCity, setDeliveryCity] = useState<string>("");

    // ✅ دالة لجلب المناطق (zones)
    const fetchZones = async () => {
        try {
            const res = await axios.get(ZONES_API_URL);
            setZones(res.data);
            console.log("Zones chargées:", res.data);
        } catch (err) {
            console.error("Erreur chargement zones:", err);
        }
    };

    // ✅ الدالة المعدلة باش تجيب المدينة والثمن من zoneId
    const fetchDeliveryPrice = async (zoneId: string) => {
        if (!zoneId) {
            setDeliveryCity("Non spécifiée");
            setDeliveryPrice(null);
            return;
        }

        try {
            console.log("🔍 Recherche pour zoneId:", zoneId);

            // جلب جميع المدن
            const res = await axios.get(API_URL);
            const villesData = res.data;

            console.log("📊 Villes reçues:", villesData);

            // البحث عن المدن اللي عندها zone_id = zoneId
            const villesDansZone = villesData.filter((v: any) => {
                const zoneIdVille = v.zone_id?.toString();
                const zoneIdRecherche = zoneId?.toString();
                return zoneIdVille === zoneIdRecherche;
            });

            if (villesDansZone.length > 0) {
                // نختار أول مدينة فـ المنطقة
                const premiereVille = villesDansZone[0];
                console.log("✅ Ville trouvée:", premiereVille.ville, "Prix:", premiereVille.frais_livraison);
                setDeliveryCity(premiereVille.ville);
                setDeliveryPrice(premiereVille.frais_livraison);
            } else {
                console.log("❌ Aucune ville trouvée pour zoneId:", zoneId);
                setDeliveryCity("Ville non trouvée");
                setDeliveryPrice(null);
            }
        } catch (err) {
            console.error("❌ Error fetching price:", err);
            setDeliveryCity("Erreur de chargement");
            setDeliveryPrice(null);
        }
    };

    const handleTrackingSearch = async () => {
        if (!trackingCode) return;

        setTrackingLoading(true);
        try {
            // 1. جلب معلومات الكولية من الـ Parcel Service
            const res = await axios.get(`http://localhost:8888/parcel-service/api/parcels/track/${trackingCode}`);
            const parcelData = res.data;

            setTrackingInfo(parcelData);

            // 2. جلب الثمن بناءً على cityName و zoneId المسجلين في الكولية
            // ردي البال: parcelData.cityName خاصو يكون جاي من الـ Backend (DTO)
            if (parcelData.zoneId && parcelData.cityName) {
                try {
                    // كنعيطو للـ API ديال الأثمنة بالمدينة المختصرة
                    const tarifRes = await axios.get(
                        `http://localhost:8888/tarif-zone-service/api/tarifs/parcel-price/${parcelData.zoneId}`,
                        {
                            params: { ville: parcelData.cityName }
                        }
                    );

                    if (tarifRes.data) {
                        setDeliveryPrice(tarifRes.data.frais_livraison);
                        setDeliveryCity(parcelData.cityName);
                    }
                } catch (err) {
                    console.error("⚠️ Tarif non trouvé pour cette ville/zone:", err);
                    setDeliveryPrice(null);
                    setDeliveryCity(parcelData.cityName); // كنبينو المدينة وخا مالقيناش الثمن
                }
            } else {
                // حالة احتياطية إلا ماكانتشcityName مسجلة (للكوليات القدام مثلا)
                setDeliveryCity(parcelData.deliveryAddress || "Non spécifiée");
                setDeliveryPrice(null);
            }

            setShowModal(true);
        } catch (err) {
            console.error("❌ Erreur Tracking:", err);
            alert("Code de tracking incorrect ou problème de connexion !");
        } finally {
            setTrackingLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setTrackingInfo(null);
        setTrackingCode("");
        setDeliveryPrice(null);
        setDeliveryCity("");
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'DELIVERED':
                return '#2ecc71';
            case 'IN_TRANSIT':
            case 'SHIPPING':
                return '#3498db';
            case 'ASSIGNED':
                return '#9b59b6';
            case 'PENDING':
                return '#f39c12';
            default:
                return '#95a5a6';
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'DELIVERED':
                return 'Livré';
            case 'IN_TRANSIT':
                return 'En transit';
            case 'SHIPPING':
                return 'En livraison';
            case 'ASSIGNED':
                return 'Assigné';
            case 'PENDING':
                return 'En attente';
            default:
                return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'DELIVERED':
                return <FaCheckCircle />;
            case 'IN_TRANSIT':
            case 'SHIPPING':
                return <FaTruckMoving />;
            case 'ASSIGNED':
                return <FaClipboardCheck />;
            case 'PENDING':
                return <FaBox />;
            default:
                return <FaBox />;
        }
    };

    useEffect(() => {
        const fetchVilles = async () => {
            try {
                const res = await axios.get(API_URL);
                setVilles(res.data);
                if (res.data.length > 0) {
                    setSelectedCity(res.data[0].ville);
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching prices:", err);
                setLoading(false);
            }
        };
        fetchVilles();
        fetchZones(); // ✅ جلب المناطق
    }, []);

    const selectedCityData = villes.find(
        (v) => v.ville === selectedCity
    );

    return (
        <div className="qrlib-container">
            {/* MODAL/POPUP - Design avec image + infos côte à côte */}
            {showModal && trackingInfo && (
                <div className="tracking-modal-overlay" onClick={closeModal}>
                    <div className="tracking-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closeModal}>
                            <FaTimes />
                        </button>

                        {/* Header */}
                        <div className="modal-header-custom">
                            <div className="modal-icon-custom">
                                <FaBox />
                            </div>
                            <h2>Suivi du colis</h2>
                            <p className="tracking-code">{trackingInfo.trackingNumber}</p>
                        </div>

                        <div className="modal-body-custom">
                            {/* ✅ Div unique: Image à gauche + Infos à droite */}
                            <div className="colis-info-row">
                                <div className="colis-image-box">
                                    <img src={colisPackage} alt="Colis" className="colis-img" />
                                </div>
                                <div className="colis-details-box">
                                    <div className="detail-item">
                                        <FaUser className="detail-icon" />
                                        <div>
                                            <span className="detail-label">Nom du client</span>
                                            <span className="detail-value">{trackingInfo.senderName || "---"}</span>
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <FaWeightHanging className="detail-icon" />
                                        <div>
                                            <span className="detail-label">Poids</span>
                                            <span className="detail-value">{trackingInfo.weight} kg</span>
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <FaMapMarker className="detail-icon" />
                                        <div>
                                            <span className="detail-label">Destination</span>
                                            <span className="detail-value">{deliveryCity || trackingInfo.deliveryAddress || "---"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ✅ Prix de livraison - تحت الكل */}
                            <div className="delivery-price-box">
                                <span className="price-label-custom">Frais de livraison</span>
                                <span className="price-value-custom">{deliveryPrice ? `${deliveryPrice} DH` : "---"}</span>
                            </div>

                            {/* Stepper Horizontal */}
                            <div className="stepper-custom">
                                {[
                                    { key: "PENDING", label: "En attente" },
                                    { key: "ASSIGNED", label: "Assigné" },
                                    { key: "IN_TRANSIT", label: "En transit" },
                                    { key: "DELIVERED", label: "Livré" }
                                ].map((step, index) => {
                                    const statusOrder = ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED"];
                                    const currentIdx = statusOrder.indexOf(trackingInfo.status);
                                    const isCompleted = index < currentIdx;
                                    const isActive = index === currentIdx;

                                    return (
                                        <div key={step.key} className={`step-custom ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
                                            <div className="step-circle-custom">
                                                {isCompleted ? <FaCheckCircle /> : index + 1}
                                            </div>
                                            <span className="step-label-custom">{step.label}</span>
                                            {index < 3 && <div className={`step-line-custom ${isCompleted ? "completed" : ""}`}></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="modal-footer-custom">
                            <button className="btn-fermer" onClick={closeModal}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NAVBAR - نفس الشي */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo-area">
                        <img src={heroImage} alt="QribLik Logo" className="logo-img" />
                    </div>
                    <div className="nav-links">
                        <a href="#fonctionnalites">Fonctionnalités</a>
                        <a href="#comment-ca-marche">Comment ça marche</a>
                        <a href="#contact">Contactez nous</a>
                        <button onClick={() => navigate("/login")} className="btn-inscription">Inscription</button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Livraison de colis <br />
                            <span className="hero-highlight">simplifiée et professionnelle</span>
                        </h1>
                        <p className="hero-description">
                            Optimisez votre chaîne logistique avec notre plateforme moderne.
                        </p>

                        <div className="hero-search-box">
                            <div className="hero-search-group">
                                <input
                                    type="text"
                                    placeholder="Entrez votre code de tracking (ex: TRK-XXXXXXX)"
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleTrackingSearch()}
                                />
                                <button onClick={handleTrackingSearch} disabled={trackingLoading}>
                                    {trackingLoading ? "..." : <FaSearch />}
                                    {trackingLoading ? "Recherche..." : "Rechercher"}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="hero-image">
                        <img src={packageImage} alt="Livraison" />
                    </div>
                </div>
            </section>

            {/* باقي السيكشنات نفس الشي */}
            <section id="fonctionnalites" className="features">
                <div className="container">
                    <h2 className="section-title2">Nos Fonctionnalités</h2>
                    <div className="features-grid">
                        <div className="feature-card animate-card"><div className="feature-icon"><FaTruck /></div><h3>Suivi en temps réel</h3><p>Localisez vos colis à chaque étape avec des mises à jour instantanées.</p></div>
                        <div className="feature-card animate-card"><div className="feature-icon"><FaBell /></div><h3>Notifications</h3><p>Alertes automatiques pour chaque événement important lié à vos livraisons.</p></div>
                        <div className="feature-card animate-card"><div className="feature-icon"><FaMoneyBillWave /></div><h3>Encaissements</h3><p>Gestion simplifiée des paiements et historique transparent des transactions.</p></div>
                        <div className="feature-card animate-card"><div className="feature-icon"><FaChartLine /></div><h3>Analyses & Rapports</h3><p>Statistiques détaillées pour optimiser vos performances logistiques.</p></div>
                        <div className="feature-card animate-card"><div className="feature-icon"><FaHeadset /></div><h3>Support 24/7</h3><p>Assistance technique disponible à tout moment pour vous accompagner.</p></div>
                        <div className="feature-card animate-card"><div className="feature-icon"><FaTruck /></div><h3>Livraison Express</h3><p>Service rapide et fiable garantissant l'arrivée de vos colis dans les délais.</p></div>
                    </div>
                </div>
            </section>

            <section id="comment-ca-marche" className="how-it-works">
                <div className="container">
                    <h2 className="section-title2">Comment ça marche</h2>
                    <p className="section-subtitle">Un processus optimisé en quatre étapes pour assurer une livraison efficace.</p>
                    <div className="timeline">
                        <div className="timeline-line"></div>
                        <img src={motorImage} alt="motor" className="timeline-motor" />
                        <div className="timeline-steps">
                            <div className="timeline-step"><div className="timeline-icon"><FaBox /></div><h3>Arrivée du colis</h3><p>Enregistrement immédiat du colis dans notre système dès sa réception pour un suivi précis.</p></div>
                            <div className="timeline-step"><div className="timeline-icon"><FaClipboardCheck /></div><h3>Préparation</h3><p>Vérification rigoureuse et tri logistique pour garantir une expédition sécurisée.</p></div>
                            <div className="timeline-step"><div className="timeline-icon"><FaTruckMoving /></div><h3>Livraison</h3><p>Prise en charge par le livreur avec un suivi en temps réel jusqu'à votre destination.</p></div>
                            <div className="timeline-step"><div className="timeline-icon"><FaCheckCircle /></div><h3>Confirmation</h3><p>Notification instantanée dès la remise du colis, servant de preuve de livraison finale.</p></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container cta-container">
                    <div className="cta-text"><h2>Prêt à simplifier vos livraisons ?</h2><p>Rejoignez QribLik dès aujourd'hui et profitez d'une gestion simplifiée.</p><button className="btn-start">Commencer maintenant</button></div>
                    <div className="cta-image"><img src={colisPackage} alt="Colis" /></div>
                </div>
            </section>

            <section className="pricing-dark">
                <div className="pricing-container">
                    <span className="pricing-badge">Couverture et tarifs</span>
                    <h2 className="pricing-title">Prix de livraison par ville</h2>
                    <p className="pricing-subtitle">Recherchez une ville pour voir les tarifs de livraison.</p>
                    {loading ? (<p style={{ color: "white" }}>Chargement des tarifs...</p>) : (<><div className="select-wrapper"><select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>{villes.map((v) => (<option key={v.id} value={v.ville}>{v.ville}</option>))}</select></div>{selectedCityData && (<div className="price-result"><span className="city-name">{selectedCityData.ville}</span><span className="city-price">{selectedCityData.frais_livraison} DH</span></div>)}</>)}
                </div>
            </section>

            <hr/>

            <section id="contact" className="contact">
                <h2 className="contact-title">Contactez-nous</h2>
                <div className="contact-main">
                    <div className="contact-left"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3327.247395602288!2d-7.61741118479978!3d33.57311028069839!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda7d8b4c56b7f33%3A0x14d59df4f8e9043d!2sCasablanca%2C%20Morocco!5e0!3m2!1sen!2sma!4v1677000000000!5m2!1sen!2sma" title="map" loading="lazy"></iframe></div>
                    <div className="contact-right"><form className="contact-form"><div className="form-row"><input type="text" placeholder="Nom complet" /><input type="email" placeholder="Email" /></div><div className="form-row"><input type="text" placeholder="Téléphone" /><input type="text" placeholder="Sujet" /></div><textarea placeholder="Message"></textarea><button type="submit">Envoyer</button></form></div>
                </div>
                <div className="contact-cards">
                    <div className="contact-card"><div className="card-icon"><FaEnvelope /></div><h4>Email</h4><p>contact@qriblik.ma</p></div>
                    <div className="contact-card"><div className="card-icon"><FaPhoneAlt /></div><h4>Téléphone</h4><p>+212 6 12 34 56 78</p></div>
                    <div className="contact-card"><div className="card-icon"><FaMapMarkerAlt /></div><h4>Adresse</h4><p>Casablanca, Maroc</p></div>
                </div>
            </section>
        </div>
    );
};

export default Home;