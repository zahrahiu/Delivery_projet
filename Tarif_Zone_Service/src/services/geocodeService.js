// services/geocodeService.js
const axios = require('axios');

// Cache لتخزين الإحداثيات مؤقتاً
const coordinatesCache = new Map();

const geocodeAddress = async (address) => {
    try {
        // التحقق من الـ cache أولاً
        if (coordinatesCache.has(address)) {
            console.log(`📦 Using cached coordinates for: ${address}`);
            return coordinatesCache.get(address);
        }

        console.log(`🌍 Fetching coordinates for: ${address}`);

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: `${address}, Maroc`,
                format: 'json',
                limit: 1,
                addressdetails: 1,
                'accept-language': 'fr'
            },
            headers: {
                'User-Agent': 'QribLik-Delivery-App/1.0'
            },
            timeout: 5000
        });

        if (response.data && response.data.length > 0) {
            const coords = {
                lat: parseFloat(response.data[0].lat),
                lon: parseFloat(response.data[0].lon),
                displayName: response.data[0].display_name
            };

            // تخزين في cache
            coordinatesCache.set(address, coords);
            console.log(`✅ Coordinates found for ${address}: ${coords.lat}, ${coords.lon}`);
            return coords;
        }

        console.log(`⚠️ No coordinates found for: ${address}`);
        return null;

    } catch (error) {
        console.error(`❌ Geocoding error for ${address}:`, error.message);
        return null;
    }
};

const getBulkCoordinates = async (cities) => {
    const results = [];

    // استخدام Promise.all لجلب الإحداثيات بشكل متوازي
    const promises = cities.map(async (city) => {
        const coords = await geocodeAddress(city.ville);
        if (coords) {
            return {
                id: city.id,
                ville: city.ville,
                lat: coords.lat,
                lon: coords.lon,
                frais_livraison: city.frais_livraison,
                colis: city.colis
            };
        }
        return null;
    });

    const allResults = await Promise.all(promises);
    return allResults.filter(r => r !== null);
};

module.exports = { geocodeAddress, getBulkCoordinates };