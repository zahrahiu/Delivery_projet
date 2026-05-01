import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from "axios";
import { FaMapMarkerAlt, FaSpinner, FaSearch } from "react-icons/fa";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icône personnalisée pour le marqueur
const markerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

interface AddressMapPickerProps {
    cityName: string;
    onAddressSelect: (address: string, lat: number, lng: number) => void;
    initialAddress?: string;
}

// Composant pour recentrer la carte
const RecenterMap = ({ position }: { position: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 13, { animate: true, duration: 1 });
        }
    }, [position]);
    return null;
};

// Composant pour gérer les clics sur la carte
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({ cityName, onAddressSelect, initialAddress = "" }) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [cityPosition, setCityPosition] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(initialAddress);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [addressSelected, setAddressSelected] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // ✅ 1. جلب إحداثيات المدينة عند تغييرها
    useEffect(() => {
        if (cityName) {
            geocodeCity(cityName);
        }
    }, [cityName]);

    // ✅ 2. جلب إحداثيات المدينة (لتوجيه الخريطة)
    const geocodeCity = async (city: string) => {
        setLoading(true);
        try {
            const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: `${city}, Maroc`,
                    format: 'json',
                    limit: 1,
                    'accept-language': 'fr'
                },
                headers: { 'User-Agent': 'QribLik-App/1.0' },
                timeout: 10000
            });

            if (res.data && res.data.length > 0) {
                const lat = parseFloat(res.data[0].lat);
                const lng = parseFloat(res.data[0].lon);
                setCityPosition([lat, lng]);
                // لا نضع marker للمدينة, فقط نوجه الخريطة
            }
        } catch (err) {
            console.error("Error geocoding city:", err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ 3. البحث عن العناوين (مع debounce)
    const searchAddress = async (query: string) => {
        if (!query.trim() || query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: `${query}, ${cityName}, Maroc`,
                    format: 'json',
                    limit: 8,
                    'accept-language': 'fr'
                },
                headers: { 'User-Agent': 'QribLik-App/1.0' },
                timeout: 10000
            });

            if (res.data && res.data.length > 0) {
                setSearchResults(res.data);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce sur la recherche
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        setAddressSelected(false);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            searchAddress(value);
        }, 500);
    };

    // ✅ 4. Sélectionner un résultat de recherche
    const selectResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const displayName = result.display_name;

        setPosition([lat, lng]);
        setSearchQuery(displayName);
        setShowResults(false);
        setAddressSelected(true);
        onAddressSelect(displayName, lat, lng);
    };

    // ✅ 5. Gérer le clic sur la carte
    const handleMapClick = async (lat: number, lng: number) => {
        setPosition([lat, lng]);

        // Reverse geocoding
        try {
            const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    lat: lat,
                    lon: lng,
                    format: 'json',
                    'accept-language': 'fr'
                },
                headers: { 'User-Agent': 'QribLik-App/1.0' },
                timeout: 10000
            });

            if (res.data && res.data.display_name) {
                const address = res.data.display_name;
                setSearchQuery(address);
                setAddressSelected(true);
                onAddressSelect(address, lat, lng);
            } else {
                const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setSearchQuery(fallbackAddress);
                setAddressSelected(true);
                onAddressSelect(fallbackAddress, lat, lng);
            }
        } catch (err) {
            console.error("Reverse geocoding error:", err);
            const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setSearchQuery(fallbackAddress);
            setAddressSelected(true);
            onAddressSelect(fallbackAddress, lat, lng);
        }
    };

    // Centre de la carte
    const mapCenter = position || cityPosition || [33.5731, -7.5898];

    return (
        <div className="map-picker-container">
            {/* Barre de recherche d'adresse */}
            <div className="map-search-bar">
                <div className="search-input-wrapper">
                    <FaSearch className="search-icon-input" />
                    <input
                        type="text"
                        placeholder={`Rechercher une adresse à ${cityName}...`}
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                    />
                    {isSearching && <FaSpinner className="spinner-small" />}
                </div>
            </div>

            {/* Résultats de recherche */}
            {showResults && searchResults.length > 0 && (
                <div className="search-results">
                    {searchResults.map((result, idx) => (
                        <div key={idx} className="result-item" onClick={() => selectResult(result)}>
                            <FaMapMarkerAlt className="result-icon" />
                            <div className="result-text">
                                <span className="result-name">
                                    {result.display_name.split(',')[0]}
                                </span>
                                <span className="result-detail">
                                    {result.display_name.split(',').slice(1, 4).join(',')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Message si pas de résultat */}
            {showResults && searchResults.length === 0 && searchQuery.length > 3 && (
                <div className="no-results">
                    <p>Aucune adresse trouvée. Essayez autre chose ou cliquez sur la carte.</p>
                </div>
            )}

            {/* La carte */}
            <div className="map-wrapper">
                {loading && !cityPosition ? (
                    <div className="map-loading">
                        <FaSpinner className="spinner" />
                        <p>Chargement de la carte...</p>
                    </div>
                ) : (
                    <MapContainer
                        center={mapCenter}
                        zoom={12}
                        style={{ height: '380px', width: '100%', borderRadius: '12px' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />

                        {position && (
                            <Marker position={position} icon={markerIcon}>
                                <Popup>
                                    📍 Adresse sélectionnée<br />
                                    <small>Cliquez ailleurs pour modifier</small>
                                </Popup>
                            </Marker>
                        )}

                        <MapClickHandler onMapClick={handleMapClick} />
                        <RecenterMap position={position || cityPosition || mapCenter} />
                    </MapContainer>
                )}
            </div>

            {/* Indication */}
            <p className="map-hint">
                💡 Cliquez sur la carte pour placer le marqueur, ou tapez une adresse ci-dessus
            </p>

            <style>{`
                .map-picker-container {
                    margin-top: 15px;
                    border: 1px solid #e0e0e0;
                    border-radius: 16px;
                    padding: 15px;
                    background: #f9f9f9;
                }
                
                .map-search-bar {
                    margin-bottom: 15px;
                }
                
                .search-input-wrapper {
                    display: flex;
                    align-items: center;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 30px;
                    padding: 10px 15px;
                    gap: 10px;
                }
                
                .search-icon-input {
                    color: #999;
                    font-size: 14px;
                }
                
                .search-input-wrapper input {
                    flex: 1;
                    border: none;
                    outline: none;
                    font-size: 14px;
                    background: transparent;
                }
                
                .spinner-small {
                    animation: spin 1s linear infinite;
                    color: #3b4e61;
                    font-size: 14px;
                }
                
                .search-results {
                    background: white;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    max-height: 250px;
                    overflow-y: auto;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border: 1px solid #eee;
                }
                
                .result-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 15px;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                    transition: 0.2s;
                }
                
                .result-item:hover {
                    background: #f0f2f5;
                }
                
                .result-icon {
                    color: #e74c3c;
                    min-width: 20px;
                }
                
                .result-text {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                
                .result-name {
                    font-weight: 600;
                    font-size: 13px;
                    color: #333;
                }
                
                .result-detail {
                    font-size: 11px;
                    color: #888;
                }
                
                .no-results {
                    background: #fff3e0;
                    border-radius: 12px;
                    padding: 12px;
                    margin-bottom: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #e67e22;
                }
                
                .map-wrapper {
                    border-radius: 12px;
                    overflow: hidden;
                    min-height: 380px;
                }
                
                .map-loading {
                    height: 380px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #f0f2f5;
                    border-radius: 12px;
                    gap: 10px;
                }
                
                .map-hint {
                    font-size: 11px;
                    color: #999;
                    margin-top: 12px;
                    text-align: center;
                }
                
                .spinner {
                    animation: spin 1s linear infinite;
                    font-size: 30px;
                    color: #3b4e61;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AddressMapPicker;