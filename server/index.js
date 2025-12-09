require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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
