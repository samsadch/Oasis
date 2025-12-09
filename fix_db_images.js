const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Scanning for absolute image URLs in database...');

db.all("SELECT id, image_url FROM users WHERE image_url LIKE 'http%'", [], (err, rows) => {
    if (err) {
        console.error('Error fetching users:', err);
        return;
    }

    if (rows.length === 0) {
        console.log('No absolute URLs found. Database is clean.');
        return;
    }

    console.log(`Found ${rows.length} users with absolute URLs. Fixing...`);

    db.serialize(() => {
        const stmt = db.prepare("UPDATE users SET image_url = ? WHERE id = ?");

        rows.forEach(user => {
            const parts = user.image_url.split('/uploads/');
            if (parts.length > 1) {
                const relativePath = 'uploads/' + parts[1];
                stmt.run(relativePath, user.id, (err) => {
                    if (err) console.error(`Failed to update user ${user.id}:`, err);
                    else console.log(`Fixed user ${user.id}: ${user.image_url} -> ${relativePath}`);
                });
            } else {
                console.warn(`Could not parse URL for user ${user.id}: ${user.image_url}`);
            }
        });

        stmt.finalize(() => {
            console.log('All updates applied.');
        });
    });
});
