const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

const desaRoutes = require('./src/routes/desaRoutes');
const suratRoutes = require('./src/routes/suratRoutes');
const parsingRoutes = require('./src/routes/parsingRoutes');
const officialRoutes = require('./src/routes/officialRoutes');
const paguRoutes = require('./src/routes/paguRoutes');
const authRoutes = require('./src/routes/authRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/villages', desaRoutes);
app.use('/api/surat', suratRoutes);
app.use('/api/parsing', parsingRoutes);
app.use('/api/officials', officialRoutes);
app.use('/api/pagu', paguRoutes);
app.use('/api/settings', settingsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
