require('dotenv').config();
const path = require('path');
const dns = require('dns');

let db;

// Helper to convert SQLite ? placeholders to Postgres $n
const convertSql = (sql) => {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
};

if (process.env.DATABASE_URL) {
    // POSTGRES IMPLEMENTATION
    const { Pool } = require('pg');
    // Trim and validate DATABASE_URL to avoid common DNS issues caused by copy/paste
    if (typeof process.env.DATABASE_URL === 'string') {
        const original = process.env.DATABASE_URL;
        const trimmed = original.trim();
        if (trimmed !== original) {
            console.warn('DATABASE_URL contained leading/trailing whitespace and was trimmed.');
            process.env.DATABASE_URL = trimmed;
        }
        try {
            const parsed = new URL(trimmed);
            // Log only non-sensitive parts for troubleshooting
            console.log('DB protocol:', parsed.protocol.replace(':', ''));
            console.log('DB host:', parsed.hostname);
            if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
                console.error('Invalid DATABASE_URL protocol. Expected postgres:// or postgresql://');
            }
            // Supabase specific hint: host must start with db.
            if (parsed.hostname.endsWith('.supabase.co') && !parsed.hostname.startsWith('db.')) {
                console.error('Supabase DATABASE_URL host should be db.<project-ref>.supabase.co, not ' + parsed.hostname);
            }
            // Optional DNS preflight to surface ENOTFOUND early in logs (non-fatal)
            dns.lookup(parsed.hostname, (err, address) => {
                if (err) {
                    console.error('DNS lookup failed for DB host', parsed.hostname, '-', err.code || err.message);
                } else {
                    console.log('DB host resolved to', address);
                }
            });
        } catch (e) {
            console.error('DATABASE_URL is not a valid URL. Ensure it is a proper Postgres connection string. Error:', e.message);
        }
    }
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    console.log('Connected to PostgreSQL database.');

    db = {
        run: function (sql, ...args) {
            const callback = args[args.length - 1];
            let params = args.slice(0, -1);
            if (params.length === 1 && Array.isArray(params[0])) {
                params = params[0];
            }

            let finalSql = convertSql(sql);

            // Handle RETURNING id for INSERT to simulate this.lastID
            const isInsert = /insert into/i.test(finalSql);
            if (isInsert && !/returning/i.test(finalSql)) {
                finalSql += ' RETURNING id';
            }

            pool.query(finalSql, params, (err, res) => {
                if (err) {
                    if (typeof callback === 'function') callback(err);
                    else console.error(err);
                    return;
                }

                if (typeof callback === 'function') {
                    const context = {
                        lastID: isInsert && res.rows.length > 0 ? res.rows[0].id : null,
                        changes: res.rowCount
                    };
                    callback.call(context, null);
                }
            });
        },
        get: function (sql, ...args) {
            const callback = args[args.length - 1];
            let params = args.slice(0, -1);
            if (params.length === 1 && Array.isArray(params[0])) {
                params = params[0];
            }

            const finalSql = convertSql(sql);

            pool.query(finalSql, params, (err, res) => {
                if (err) {
                    if (typeof callback === 'function') callback(err);
                    return;
                }
                if (typeof callback === 'function') callback(null, res.rows[0]);
            });
        },
        all: function (sql, ...args) {
            const callback = args[args.length - 1];
            let params = args.slice(0, -1);
            if (params.length === 1 && Array.isArray(params[0])) {
                params = params[0];
            }

            const finalSql = convertSql(sql);

            pool.query(finalSql, params, (err, res) => {
                if (err) {
                    if (typeof callback === 'function') callback(err);
                    return;
                }
                if (typeof callback === 'function') callback(null, res.rows);
            });
        },
        prepare: function (sql) {
            return {
                run: function (...args) { db.run(sql, ...args); },
                get: function (...args) { db.get(sql, ...args); },
                all: function (...args) { db.all(sql, ...args); },
                finalize: function () { }
            };
        },
        serialize: function (cb) {
            if (cb) cb();
        },
        exec: function (sql, cb) {
            // Simple exec for migrations
            pool.query(sql, (err) => {
                if (cb) cb(err);
            });
        }
    };

    // Initialize Postgres Tables
    const initPg = async () => {
        const createTables = [
            `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                blood_group TEXT,
                phone TEXT,
                is_admin INTEGER DEFAULT 0,
                image_url TEXT,
                is_approved INTEGER DEFAULT 0,
                membership_id TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS officials (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                position TEXT NOT NULL,
                contact_info TEXT,
                image_url TEXT,
                display_order INTEGER DEFAULT 99,
                year TEXT DEFAULT 'Current'
            )`,
            `CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                date TIMESTAMP,
                active INTEGER DEFAULT 1
            )`,
            `CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title TEXT,
                content TEXT NOT NULL,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS post_likes (
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                PRIMARY KEY (post_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS post_comments (
                id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS comment_likes (
                comment_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                PRIMARY KEY (comment_id, user_id)
            )`
        ];

        for (const query of createTables) {
            await pool.query(query).catch(err => console.error('Error creating table:', err.message));
        }
        console.log('Postgres tables initialized.');
    };

    initPg();

} else {
    // SQLITE IMPLEMENTATION (Existing)
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, 'oasis.db');

    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database ' + dbPath + ': ' + err.message);
        } else {
            console.log('Connected to the SQLite database.');
            initSqlite();
        }
    });

    function initSqlite() {
        db.serialize(() => {
            // Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            blood_group TEXT,
            phone TEXT,
            is_admin INTEGER DEFAULT 0,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

            // Migration to add image_url if it doesn't exist
            db.run("ALTER TABLE users ADD COLUMN image_url TEXT", (err) => { });

            // Officials Table with Order and Year
            db.run(`CREATE TABLE IF NOT EXISTS officials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            position TEXT NOT NULL,
            contact_info TEXT,
            image_url TEXT,
            display_order INTEGER DEFAULT 99,
            year TEXT DEFAULT 'Current'
        )`);

            // Migration for existing officials table
            db.run("ALTER TABLE officials ADD COLUMN display_order INTEGER DEFAULT 99", () => { });
            db.run("ALTER TABLE officials ADD COLUMN year TEXT DEFAULT 'Current'", () => { });

            // Events/Programs Table
            db.run(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            date DATETIME,
            active INTEGER DEFAULT 1
        )`);

            // Messages Table
            db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

            // Posts Table (News Feed)
            db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT NOT NULL,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

            // Migration to add title if it doesn't exist
            db.run("ALTER TABLE posts ADD COLUMN title TEXT", (err) => { });

            // Post Likes Table
            db.run(`CREATE TABLE IF NOT EXISTS post_likes (
            post_id INTEGER,
            user_id INTEGER,
            PRIMARY KEY (post_id, user_id),
            FOREIGN KEY (post_id) REFERENCES posts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

            // Post Comments Table
            db.run(`CREATE TABLE IF NOT EXISTS post_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            user_id INTEGER,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

            // Comment Likes Table
            db.run(`CREATE TABLE IF NOT EXISTS comment_likes (
            comment_id INTEGER,
            user_id INTEGER,
            PRIMARY KEY (comment_id, user_id),
            FOREIGN KEY (comment_id) REFERENCES post_comments(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

            // Migration for User Approval and Membership ID
            db.run("ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 0", (err) => { });

            // SQLite ALTER TABLE doesn't support UNIQUE constraint directly
            db.run("ALTER TABLE users ADD COLUMN membership_id TEXT", (err) => {
                if (!err) {
                    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_membership_id ON users(membership_id)");
                }
            });
            db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_membership_id ON users(membership_id)", (err) => { });

            // Auto-approve existing users for backward compatibility
            db.run("UPDATE users SET is_approved = 1 WHERE is_approved IS NULL OR is_approved = 0", (err) => { });
        });
    }
}

module.exports = db;
