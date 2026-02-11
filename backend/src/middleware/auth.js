const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../routes/authRoutes');

// Middleware: Verifikasi Token JWT (untuk semua user yang sudah login)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Akses ditolak: Token diperlukan" });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token tidak valid atau sudah expired" });
    }
};

// Middleware: Hanya OPERATOR yang boleh akses (untuk hapus data)
const verifyOperator = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Akses ditolak: Token diperlukan" });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'OPERATOR') {
            return res.status(403).json({
                message: "Akses ditolak: Hanya Operator yang boleh menghapus data!"
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token tidak valid atau sudah expired" });
    }
};

module.exports = { verifyToken, verifyOperator };
