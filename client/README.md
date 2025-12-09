# Oasis Mathamangalam - Client

The frontend application for Oasis Mathamangalam Club, built with React + Vite and styled with Material 3 Expressive.

## Prerequisites

- [Node.js](https://nodejs.org/) (Version 16 or higher recommended)
- [npm](https://www.npmjs.com/) (Installed with Node.js)

## Getting Started

### 1. Installation

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

### 2. Local Development

To run the application locally in development mode:

```bash
npm run dev
```

This will start the development server at `http://localhost:5173` (by default).

> **Note:** Ensure the backend server is running for API requests to work.

### 3. Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be generated in the `dist` directory. You can preview the production build locally:

```bash
npm run preview
```

## Deployment

This application is a static site (Single Page Application) and can be deployed to any static hosting provider.

### Vercel (Recommended)

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the `client` folder.
3.  Follow the prompts. Vercel automatically detects Vite settings.

### Netlify

1.  Drag and drop the `dist` folder to Netlify Drop, or connect your Git repository.
2.  Build Command: `npm run build`
3.  Publish Directory: `dist`

### Traditional Web Server (Nginx/Apache)

Upload the contents of the `dist` folder to your web server's root directory. Ensure your server is configured to handle SPA routing (rewrite all requests to `index.html`).

#### Example Nginx Config:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
