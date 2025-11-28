# Admission Module - Frontend

This is the React-based frontend for the Admission Module project.

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Page components for routes
│   ├── services/        # API service layer
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── styles/          # Global styles
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── index.html           # HTML template
└── .env.example         # Environment variables template
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your API endpoint:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

## Development

Start the development server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Build

Create production build:
```bash
npm run build
```

## Technologies

- **React 18** - UI library
- **React Router 6** - Routing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## API Integration

The frontend connects to the backend API endpoints. Ensure your backend is running on the configured API URL before starting the development server.
