const db = require('./server/database');

const email = 'samsadch@gmail.com';

db.serialize(() => {
    db.run("UPDATE users SET is_admin = 1, is_approved = 1 WHERE email = ?", [email], function (err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`Updated ${this.changes} rows. '${email}' is now an Admin.`);
        }
    });
});
