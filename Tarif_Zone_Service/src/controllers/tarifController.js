const tarifService = require('../services/tarifService');
const geocodeService = require('../services/geocodeService');

exports.getTarifByVille = async (req, res) => {
    try {
        const data = await tarifService.getTarifByVille(req.params.ville);
        if (!data) return res.status(404).json({ message: "La ville n'est pas enregistrée" });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateTarif = async (req, res) => {
    try {
        const data = await tarifService.updateTarif(req.params.id, req.body);
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllTarifs = async (req, res) => {
    try {
        const data = await tarifService.getAllTarifs();
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTarif = async (req, res) => {
    try {
        const deleted = await tarifService.deleteTarif(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Ville non trouvée" });
        res.json({ message: "Ville supprimée avec succès" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTarif = async (req, res) => {
    try {
        const data = await tarifService.createTarif(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🔥🔥🔥 Endpoint dynamique - جلب إحداثيات جميع المدن من API 🔥🔥🔥
exports.getAllCitiesCoordinates = async (req, res) => {
    try {
        console.log("📍 Fetching all cities coordinates dynamically...");

        // 1. جلب جميع المدن من قاعدة البيانات
        const cities = await tarifService.getAllTarifs();

        if (!cities || cities.length === 0) {
            return res.status(404).json({ message: "Aucune ville trouvée" });
        }

        console.log(`📊 Found ${cities.length} cities in database`);

        // 2. جلب الإحداثيات بشكل ديناميكي من OpenStreetMap
        const citiesWithCoords = await geocodeService.getBulkCoordinates(cities);

        console.log(`✅ Retrieved coordinates for ${citiesWithCoords.length} cities`);

        res.json(citiesWithCoords);

    } catch (err) {
        console.error("❌ Error in getAllCitiesCoordinates:", err);
        res.status(500).json({ error: err.message });
    }
};

// 🔥 جلب إحداثيات مدينة واحدة
exports.getCityCoordinates = async (req, res) => {
    try {
        const { city } = req.params;
        console.log(`📍 Fetching coordinates for: ${city}`);

        const coords = await geocodeService.geocodeAddress(city);

        if (coords) {
            res.json({
                ville: city,
                lat: coords.lat,
                lon: coords.lon,
                displayName: coords.displayName
            });
        } else {
            res.status(404).json({ message: `Coordonnées non trouvées pour: ${city}` });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTarifForParcel = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const { ville } = req.query; // غادي نجيبو المدينة من الرابط

        const data = await tarifService.getTarifByZoneAndCity(zoneId, ville);

        if (!data) {
            return res.status(404).json({ message: "Tarif non trouvé pour cette ville dans cette zone" });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};