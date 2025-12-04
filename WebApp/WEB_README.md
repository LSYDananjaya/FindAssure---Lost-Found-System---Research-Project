# FindAssure Web Application

A modern web interface for the FindAssure Lost & Found System, built with React, TypeScript, and Vite.

## Features

### For Founders (People Who Found Items)
- **Add Found Items**: Multi-step form to report found items
  - Step 1: Enter basic information (category, description, image, location)
  - Step 2: AI-generated verification questions (using Gemini AI)
  - Step 3: Answer the generated questions
  - Step 4: Provide contact information
- **Dashboard**: View all found items with filtering by category and status

### For Owners (People Who Lost Items)
- **Browse Items**: Search through all found items
- **Claim Items**: Answer verification questions to prove ownership
- **Verification System**: AI-powered question generation ensures secure ownership verification

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS Modules** - Component-scoped styling

## Project Structure

```
WebApp/
├── src/
│   ├── components/           # Reusable components
│   │   ├── Layout.tsx       # Main layout with header/footer
│   │   └── Layout.css
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Found items dashboard
│   │   ├── Dashboard.css
│   │   ├── AddItem.tsx      # Add found item form
│   │   ├── AddItem.css
│   │   ├── ItemDetail.tsx   # Item details and verification
│   │   └── ItemDetail.css
│   ├── services/            # API services
│   │   └── api.ts          # API client and functions
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── public/                  # Static assets
├── .env                     # Environment variables
├── .env.example            # Environment variables template
├── vite.config.ts          # Vite configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v20.19.0 or v22.12.0+)
- npm or yarn
- Backend server running (see Backend folder)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Update the .env file with your backend URL
   # Default: VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will open automatically at `http://localhost:3000`

### Build for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000/api
```

## Usage Guide

### Adding a Found Item

1. Click "Add Found Item" in the navigation
2. **Step 1**: Fill in basic information
   - Select category
   - Enter detailed description
   - Provide image URL
   - Specify location where item was found
3. **Step 2**: Click "Generate Questions with AI"
   - AI will generate 10 verification questions
   - Answer all questions about the item
4. **Step 3**: Enter your contact information
   - Name, email, and phone number
5. Click "Submit" to add the item to the system

### Claiming a Lost Item

1. Browse items in the dashboard
2. Click on an item to view details
3. Read the verification questions
4. Click "Claim This Item"
5. Answer all verification questions
6. Submit your answers for verification

### Dashboard Features

- **Filter by Category**: Select specific categories (Electronics, Clothing, etc.)
- **Filter by Status**: View available, pending, or claimed items
- **View Details**: Click any item card to see full details

## API Integration

The web app communicates with the backend through the following endpoints:

- `POST /api/items/generate-questions` - Generate AI verification questions
- `POST /api/items/found` - Create a found item report
- `GET /api/items/found` - List all found items
- `GET /api/items/found/:id` - Get single found item
- `POST /api/items/verification` - Submit verification answers

See `src/services/api.ts` for complete API documentation.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use CSS modules for component styling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it in `vite.config.ts`:

```typescript
server: {
  port: 3001, // Change to any available port
}
```

### Backend Connection Issues

1. Ensure the backend server is running
2. Check the `VITE_API_BASE_URL` in your `.env` file
3. Verify CORS is properly configured in the backend

### Build Issues

If you encounter build issues:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Test thoroughly before submitting
4. Update documentation as needed

## Related Projects

- **Backend**: Node.js + Express + MongoDB + Gemini AI
- **Mobile App**: React Native (FindAssure folder)

## License

SLIIT Research Project - 2025

## Support

For issues and questions, please contact the development team.
