const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const multer = require('multer'); // Added
const sharp = require('sharp');   // Added
const path = require('path');     // Added
const fs = require('fs');         // Added

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'secret';

// Register
router.post('/register', (req, res) => {
    const { name, email, password, blood_group, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    // New users are NOT approved by default (is_approved = 0)
    const stmt = db.prepare('INSERT INTO users (name, email, password, blood_group, phone, is_approved) VALUES (?, ?, ?, ?, ?, 0)');
    stmt.run(name, email, hashedPassword, blood_group, phone, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Registration successful! Your account is pending admin approval.' });
    });
    stmt.finalize();
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.get(email, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ error: 'Invalid password' });

        if (user.is_approved === 0) {
            return res.status(403).json({ error: 'Your account is pending approval by an administrator.' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, SECRET_KEY, { expiresIn: '24h' });

        const imageUrl = user.image_url ? (user.image_url.startsWith('http') ? user.image_url : `http://${req.headers.host}/${user.image_url}`) : null;

        res.status(200).json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, blood_group: user.blood_group, phone: user.phone, image_url: imageUrl, is_admin: user.is_admin, membership_id: user.membership_id } });
    });
    stmt.finalize();
});

// Profile
router.get('/profile', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

        const stmt = db.prepare('SELECT id, name, email, blood_group, phone, image_url, is_admin, membership_id FROM users WHERE id = ?');
        stmt.get(decoded.id, (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(404).json({ error: 'User not found' });

            const userWithUrl = {
                ...user,
                image_url: user.image_url ? (user.image_url.startsWith('http') ? user.image_url : `http://${req.headers.host}/${user.image_url}`) : null
            };
            res.status(200).json(userWithUrl);
        });
        stmt.finalize();
    });
});

// Configure Multer (Memory Storage)
const { upload } = require('../config/cloudinary');

// Removed local multer config


// Helper to save profile image REMOVED - Cloudinary handles this


// Update Profile
router.put('/profile', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, async (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

        const { name, blood_group, phone } = req.body;
        let image_url = req.body.image_url;

        try {
            if (req.file) {
                image_url = req.file.path;
            } else if (image_url && image_url.startsWith('http')) {
                // If it's an absolute URL (from previous GET), strip the domain to save relative path
                // This prevents 'localhost' URLs from breaking on mobile/other IPs
                const urlParts = image_url.split('/uploads/');
                if (urlParts.length > 1) {
                    image_url = 'uploads/' + urlParts[1];
                }
            }

            // Construct update query
            const updates = [];
            const values = [];
            if (name) { updates.push('name = ?'); values.push(name); }
            if (blood_group) { updates.push('blood_group = ?'); values.push(blood_group); }
            if (phone) { updates.push('phone = ?'); values.push(phone); }
            if (image_url) { updates.push('image_url = ?'); values.push(image_url); }

            if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

            values.push(decoded.id);

            const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
            stmt.run(...values, function (err) {
                if (err) return res.status(500).json({ error: err.message });

                // Return updated user
                db.get('SELECT id, name, email, blood_group, phone, image_url, is_admin, membership_id FROM users WHERE id = ?', [decoded.id], (err, user) => {
                    if (err) return res.status(500).json({ error: err.message });

                    // Fix image URL for frontend
                    const userWithUrl = {
                        ...user,
                        image_url: user.image_url ? (user.image_url.startsWith('http') ? user.image_url : `http://${req.headers.host}/${user.image_url}`) : null
                    };

                    res.json({ message: 'Profile updated', user: userWithUrl });
                });
            });
            stmt.finalize();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to process profile update' });
        }
    });
});

module.exports = router;
