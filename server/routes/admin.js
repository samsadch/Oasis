const express = require('express');
const db = require('../database');

const router = express.Router();

// Search blood donors
router.get('/donors', (req, res) => {
    const { blood_group } = req.query;
    let sql = 'SELECT id, name, blood_group, phone, email FROM users WHERE 1=1';
    const params = [];

    if (blood_group) {
        sql += ' AND blood_group = ?';
        params.push(blood_group);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// List all users with filtering and sorting
router.get('/users', (req, res) => {
    const { blood_group, sort_by } = req.query; // sort_by: 'name' | 'blood_group'
    let sql = 'SELECT id, name, email, blood_group, phone, is_admin, image_url, created_at, is_approved, membership_id FROM users WHERE 1=1';
    const params = [];

    if (blood_group) {
        sql += ' AND blood_group = ?';
        params.push(blood_group);
    }

    if (sort_by === 'blood_group') {
        sql += ' ORDER BY blood_group, name ASC';
    } else {
        sql += ' ORDER BY name ASC'; // Default alphabetical
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const usersWithUrl = rows.map(user => ({
            ...user,
            image_url: user.image_url ? (user.image_url.startsWith('http') ? user.image_url : `http://${req.headers.host}/${user.image_url}`) : null
        }));

        res.json(usersWithUrl);
    });
});

// Get Single User Details
router.get('/users/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('SELECT id, name, email, blood_group, phone, is_admin, image_url, created_at, is_approved, membership_id FROM users WHERE id = ?');
    stmt.get(id, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userWithUrl = {
            ...user,
            image_url: user.image_url ? (user.image_url.startsWith('http') ? user.image_url : `http://${req.headers.host}/${user.image_url}`) : null
        };

        res.json(userWithUrl);
    });
});

// Update User Details (Admin)
router.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, phone, blood_group, is_approved, membership_id } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (blood_group !== undefined) { updates.push('blood_group = ?'); values.push(blood_group); }
    if (is_approved !== undefined) { updates.push('is_approved = ?'); values.push(is_approved); }
    if (membership_id !== undefined) { updates.push('membership_id = ?'); values.push(membership_id); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User updated successfully' });
    });
});

// Delete User
router.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM users WHERE id = ?', id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    });
});

// Approve user and assign Membership ID
router.put('/users/:id/approve', (req, res) => {
    const { id } = req.params;

    // Generate Membership ID: OAS-[Year]-[ID 4 digit padded]
    // Note: In production, ensure concurrency safety. Here we rely on single-thread Node + simple logic.
    const year = new Date().getFullYear();
    const paddedId = String(id).padStart(4, '0');
    const membershipId = `OAS-${year}-${paddedId}`;

    const stmt = db.prepare('UPDATE users SET is_approved = 1, membership_id = ? WHERE id = ?');
    stmt.run(membershipId, id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User approved', membership_id: membershipId });
    });
    stmt.finalize();
});

// Toggle Admin Role
router.put('/users/:id/role', (req, res) => {
    const { id } = req.params;
    const { is_admin } = req.body; // 0 or 1

    const stmt = db.prepare('UPDATE users SET is_admin = ? WHERE id = ?');
    stmt.run(is_admin, id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User role updated' });
    });
    stmt.finalize();
});

module.exports = router;
