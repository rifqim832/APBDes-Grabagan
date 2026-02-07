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

app.use('/api/desa', desaRoutes);
app.use('/api/surat', suratRoutes);
app.use('/api/parsing', parsingRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
