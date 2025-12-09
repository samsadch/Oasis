const express = require('express');
const db = require('../database');

const router = express.Router();

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { upload } = require('../config/cloudinary');

// Removed local multer config


// Helper to save official image REMOVED - Cloudinary handles this



// Get all officials (support filtering by year)
router.get('/', (req, res) => {
    const { year } = req.query;
    let sql = 'SELECT * FROM officials';
    const params = [];

    if (year) {
        sql += ' WHERE year = ?';
        params.push(year);
    }

    sql += ' ORDER BY display_order ASC, name ASC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fix image URLs to be absolute
        const officials = rows.map(official => ({
            ...official,
            image_url: official.image_url ? (official.image_url.startsWith('http') ? official.image_url : `http://${req.headers.host}/${official.image_url}`) : null
        }));
        res.json(officials);
    });
});

// Add official (Admin)
router.post('/', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res) => {
    const { name, position, contact_info, display_order, year } = req.body;
    let image_url = req.body.image_url;

    try {
        if (req.file) {
            image_url = req.file.path;
        }

        const stmt = db.prepare('INSERT INTO officials (name, position, contact_info, image_url, display_order, year) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(name, position, contact_info, image_url, display_order || 99, year || 'Current', function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, name, position, contact_info, image_url, display_order: display_order || 99, year: year || 'Current' });
        });
        stmt.finalize();
    } catch (err) {
        console.error("Image processing error:", err);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// Update official (Admin)
router.put('/:id', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res) => {
    const { name, position, contact_info, display_order, year } = req.body;
    let image_url = req.body.image_url;
    const { id } = req.params;

    try {
        if (req.file) {
            image_url = req.file.path;
        }

        const updates = [];
        const values = [];
        if (name) { updates.push('name = ?'); values.push(name); }
        if (position) { updates.push('position = ?'); values.push(position); }
        if (typeof contact_info !== 'undefined') { updates.push('contact_info = ?'); values.push(contact_info); }
        if (image_url) { updates.push('image_url = ?'); values.push(image_url); }
        if (display_order) { updates.push('display_order = ?'); values.push(display_order); }
        if (year) { updates.push('year = ?'); values.push(year); }

        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

        values.push(id);

        const stmt = db.prepare(`UPDATE officials SET ${updates.join(', ')} WHERE id = ? `);
        stmt.run(...values, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Official not found' });
            res.json({ message: 'Official updated' });
        });
        stmt.finalize();
    } catch (err) {
        console.error("Image processing error:", err);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// Delete official (Admin)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM officials WHERE id = ?');
    stmt.run(id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Official deleted' });
    });
    stmt.finalize();
});

module.exports = router;
