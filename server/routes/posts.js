const express = require('express');
const db = require('../database');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'secret';

const sharp = require('sharp');

const { upload } = require('../config/cloudinary');

// Removed local multer config


// Middleware to check admin (simplified)
const isAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });
        if (decoded.is_admin !== 1) return res.status(403).json({ error: 'Admin access required' });
        req.user = decoded;
        next();
    });
};

// Get all posts with user like status
router.get('/', (req, res) => {
    const token = req.headers['authorization'];
    let userId = null;

    if (token) {
        try {
            const decoded = jwt.verify(token.split(' ')[1], SECRET_KEY);
            userId = decoded.id;
        } catch (err) { }
    }

    const sql = `
        SELECT 
            p.*, 
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as user_liked,
            (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count
        FROM posts p
        ORDER BY p.created_at DESC
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Transform image URLs to be absolute/accessible
        const posts = rows.map(post => ({
            ...post,
            image_url: post.image_url ? (post.image_url.startsWith('http') ? post.image_url : `http://${req.headers.host}/${post.image_url}`) : null
        }));
        res.json(posts);
    });
});

// Helper to process and save image REMOVED - Cloudinary handles this


// Create post (Admin) - With File Upload & Compression
router.post('/', isAdmin, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res) => {
    const { title, content } = req.body;
    let image_url = req.body.image_url;

    try {
        if (req.file) {
            image_url = req.file.path; // Cloudinary URL
        }

        if (!content) return res.status(400).json({ error: 'Content is required' });

        const stmt = db.prepare('INSERT INTO posts (title, content, image_url) VALUES (?, ?, ?)');
        stmt.run(title, content, image_url, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, title, content, image_url, created_at: new Date().toISOString() });
        });
        stmt.finalize();
    } catch (err) {
        console.error("Image processing error:", err);
        return res.status(500).json({ error: 'Failed to process image' });
    }
});

// Update post (Admin)
router.put('/:id', isAdmin, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res) => {
    const { title, content } = req.body;
    const postId = req.params.id;
    let image_url = req.body.image_url;

    try {
        if (req.file) {
            image_url = req.file.path; // Cloudinary URL
        }

        if (!content) return res.status(400).json({ error: 'Content is required' });

        const stmt = db.prepare('UPDATE posts SET title = ?, content = ?, image_url = ? WHERE id = ?');
        stmt.run(title, content, image_url, postId, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Post not found' });
            res.json({ message: 'Post updated' });
        });
        stmt.finalize();
    } catch (err) {
        console.error("Image processing error:", err);
        return res.status(500).json({ error: 'Failed to process image' });
    }
});

// Delete post (Admin)
router.delete('/:id', isAdmin, (req, res) => {
    const postId = req.params.id;

    db.serialize(() => {
        // Ideally we should delete the file from disk too
        db.get('SELECT image_url FROM posts WHERE id = ?', [postId], (err, row) => {
            if (row && row.image_url && !row.image_url.startsWith('http')) {
                fs.unlink(row.image_url, (err) => {
                    if (err) console.error("Failed to delete local image:", err);
                });
            }
        });

        db.run('DELETE FROM post_likes WHERE post_id = ?', [postId]);
        db.run('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM post_comments WHERE post_id = ?)', [postId]);
        db.run('DELETE FROM post_comments WHERE post_id = ?', [postId]);
        db.run('DELETE FROM posts WHERE id = ?', [postId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Post deleted' });
        });
    });
});

// Get Comments for a Post
router.get('/:id/comments', (req, res) => {
    const token = req.headers['authorization'];
    let userId = null;

    if (token) {
        try {
            const decoded = jwt.verify(token.split(' ')[1], SECRET_KEY);
            userId = decoded.id;
        } catch (err) { }
    }

    const sql = `
        SELECT c.*, u.name as user_name, u.image_url as user_image,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as user_liked
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `;
    db.all(sql, [userId, req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add Comment
router.post('/:id/comments', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Content is required' });

        const stmt = db.prepare('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)');
        stmt.run(req.params.id, decoded.id, content, function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Return populated comment
            db.get('SELECT name, image_url FROM users WHERE id = ?', [decoded.id], (err, user) => {
                res.status(201).json({
                    id: this.lastID,
                    post_id: req.params.id,
                    user_id: decoded.id,
                    content,
                    created_at: new Date().toISOString(),
                    user_name: user ? user.name : 'Unknown',
                    user_image: user ? user.image_url : null,
                    like_count: 0,
                    user_liked: false
                });
            });
        });
        stmt.finalize();
    });
});

// Toggle Post Like
router.post('/:id/like', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

        const userId = decoded.id;
        const postId = req.params.id;

        db.get('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            if (row) {
                db.run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Unliked', liked: false });
                });
            } else {
                db.run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Liked', liked: true });
                });
            }
        });
    });
});

// Toggle Comment Like
router.post('/comments/:id/like', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

        const userId = decoded.id;
        const commentId = req.params.id;

        db.get('SELECT * FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            if (row) {
                db.run('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Unliked', liked: false });
                });
            } else {
                db.run('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, userId], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Liked', liked: true });
                });
            }
        });
    });
});

module.exports = router;
