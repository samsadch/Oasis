const express = require('express');
const db = require('../database');

const router = express.Router();

// Get active events
router.get('/', (req, res) => {
    db.all('SELECT * FROM events WHERE active = 1', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add event (Admin)
router.post('/', (req, res) => {
    const { title, description, date } = req.body;
    const stmt = db.prepare('INSERT INTO events (title, description, date) VALUES (?, ?, ?)');
    stmt.run(title, description, date, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, title, description, date, active: 1 });
    });
    stmt.finalize();
});

// Update event (Admin)
router.put('/:id', (req, res) => {
    const { title, description, date, active } = req.body;
    const { id } = req.params;

    const updates = [];
    const values = [];
    if (title) { updates.push('title = ?'); values.push(title); }
    if (description) { updates.push('description = ?'); values.push(description); }
    if (date) { updates.push('date = ?'); values.push(date); }
    if (typeof active !== 'undefined') { updates.push('active = ?'); values.push(active); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);

    const stmt = db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Event not found' });
        res.json({ message: 'Event updated' });
    });
    stmt.finalize();
});

// Get messages
router.get('/messages', (req, res) => {
    db.all('SELECT * FROM messages ORDER BY sent_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Post message (Admin)
router.post('/messages', (req, res) => {
    const { content } = req.body;
    const stmt = db.prepare('INSERT INTO messages (content) VALUES (?)');
    stmt.run(content, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, content });
    });
    stmt.finalize();
});

module.exports = router;
