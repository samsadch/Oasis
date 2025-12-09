# Oasis Mathamangalam Club - Developer Guide

This project consists of a Node.js/Express backend (`server`) and a React/Vite frontend (`client`).

## 1. Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
1.  **Backend Dependencies**:
    ```bash
    cd server
    npm install
    ```
2.  **Frontend Dependencies**:
    ```bash
    cd ../client
    npm install
    ```

## 2. Running the Application

### Start the Server (Backend)
The server runs on port 3000 by default.
```bash
cd server
node index.js
```
*The database file `oasis.db` will be automatically created in the `server` directory if it doesn't exist.*

### Start the Client (Frontend)
The frontend runs on port 5173.
```bash
cd client
npm run dev
```

## 3. Database Guide

The project uses **SQLite**. The database file is located at `server/oasis.db`.

### Current Schema
The database is initialized in `server/database.js`.

-   **users**: Stores member information.
    -   `id`, `name`, `email`, `password` (hashed), `blood_group`, `phone`, `image_url`, `is_admin`, `created_at`.
-   **officials**: Stores club officials' details.
    -   `id`, `name`, `position`, `contact_info`, `image_url`.
-   **events**: Stores club programs/events.
    -   `id`, `title`, `description`, `date`, `active`.
-   **messages**: Stores broadcast messages.
    -   `id`, `content`, `sent_at`.

### How to Update Tables

To modify the database schema (e.g., add a new column):

1.  **Modify `server/database.js`**:
    Update the `CREATE TABLE` statement in the `initDb()` function. This ensures new installations get the correct schema.

2.  **Existing Databases (Migrations)**:
    If you have an existing `oasis.db` file, updating `database.js` alone won't change existing tables. You must run a SQL command to alter the table.
    
    You can add a migration script in `initDb()` or run a temporary script:
    
    ```javascript
    // Example: Adding a 'role' column to users
    db.run("ALTER TABLE users ADD COLUMN role TEXT", (err) => {
        if (err) console.log("Column likely exists or error: " + err.message);
        else console.log("Column added successfully");
    });
    ```
    
    Alternatively, you can open `oasis.db` with a SQLite viewer (like *DB Browser for SQLite*) and modify tables manually.

## 4. Server API Structure

-   `server/index.js`: Main entry point. Loads routes and connects to DB.
-   `server/routes/`: Contains API route handlers.
    -   `auth.js`: Registration, Login, Profile updates.
    -   `officials.js`: Managing club officials.
    -   `events.js`: Managing programs and messages.
    -   `admin.js`: Administrative tasks (e.g., blood donor search).

## 5. Viewing the Database

Since this project uses **SQLite**, the database is a single file (`server/oasis.db`) and cannot be opened directly in a web browser like PHPMyAdmin.

**Recommended Options:**

1.  **VS Code Extension** (Easiest):
    -   Install the **"SQLite Viewer"** extension in VS Code.
    -   Click on `server/oasis.db` in your file explorer to view tables directly in the editor.

2.  **Desktop Application**:
    -   Download [DB Browser for SQLite](https://sqlitebrowser.org/).
    -   Open `server/oasis.db` with this application to browse data and run SQL queries.

