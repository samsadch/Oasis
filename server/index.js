require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Strict CORS: avoid exposing API to arbitrary frontends
const parseOrigins = (value) =>
    (value || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

const isProd = process.env.NODE_ENV === 'production';
const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN);
const defaultDevOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];
const allowedOrigins = new Set([
    ...configuredOrigins,
    ...(!isProd ? defaultDevOrigins : [])
]);

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser or same-origin requests (no Origin header)
        if (!origin) return callback(null, true);
        if (allowedOrigins.size === 0) {
            // If nothing configured, be conservative in production, permissive in dev
            return callback(null, !isProd);
        }
        return callback(null, allowedOrigins.has(origin));
    },
    credentials: true
}));
app.use(express.json());
// Avoid serving local uploads folder on Vercel (read-only FS / external storage used)
if (!process.env.VERCEL) {
    app.use('/uploads', express.static('uploads'));
}

// Non-sensitive DB hostname log to help diagnose DNS issues in serverless envs
if (process.env.DATABASE_URL) {
    try {
        const u = new URL(process.env.DATABASE_URL.trim());
        console.log('DB host (parsed):', u.hostname);
    } catch (_) { /* ignore */ }
}

app.get('/', (req, res) => {
    res.json({ message: 'Oasis Mathamangalam Club API is running' });
});

// Import routes
const authRoutes = require('./routes/auth');
const officialsRoutes = require('./routes/officials');
const eventsRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');
const postsRoutes = require('./routes/posts');

app.use('/api/auth', authRoutes);
app.use('/api/officials', officialsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postsRoutes);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
