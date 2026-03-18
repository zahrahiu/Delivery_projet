const express = require('express');
const cors = require('cors');
require('dotenv').config();
const tarifRoutes = require('./routes/tarifRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// استعمال الـ Routes
app.use('/api/tarifs', tarifRoutes);

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`🚀 Tarif_Zone_Service démarré sur le port ${PORT}`);
});