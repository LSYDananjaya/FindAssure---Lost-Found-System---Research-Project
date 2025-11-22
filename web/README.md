# Lost & Found - Web Interface

A React web application for the AI-Driven Lost & Found Verification System. This web interface allows you to demonstrate and test the system without requiring a mobile emulator.

## Features

- **Report Found Items**: Input item details including category and description
- **AI-Generated Questions**: Automatically generate verification questions using AI
- **Question Selection**: Choose which questions to answer
- **Answer Submission**: Provide answers to help verify the true owner
- **Success Confirmation**: View saved item details and confirmation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend service running (ai-question-service)

## Installation

1. Navigate to the web directory:
```powershell
cd web
```

2. Install dependencies:
```powershell
npm install
```

## Running the Application

1. **Start the Backend Service First**:
   - Navigate to the backend service directory:
   ```powershell
   cd ..\services\ai-question-service
   ```
   - Start the backend:
   ```powershell
   npm start
   ```
   - The backend should be running on `http://localhost:3000`

2. **Start the Web Application**:
   - In a new terminal, navigate to the web directory:
   ```powershell
   cd web
   ```
   - Start the development server:
   ```powershell
   npm run dev
   ```
   - The app will open automatically at `http://localhost:5173`

## Usage

1. **Report an Item**:
   - Enter your ID
   - Select the item category
   - Provide a detailed description
   - Click "Generate Verification Questions"

2. **Select Questions**:
   - Review the AI-generated questions
   - Select the questions you can answer
   - Click "Continue to Answer"

3. **Answer Questions**:
   - Provide answers to each selected question
   - Click "Save Item"

4. **Success**:
   - View the saved item details
   - Note the Item ID for reference
   - Report another item if needed

## API Configuration

The API base URL is configured in `src/services/apiService.js`:

```javascript
const BASE_URL = 'http://localhost:3000';
```

If your backend runs on a different port or host, update this value accordingly.

## Build for Production

To create a production build:

```powershell
npm run build
```

The built files will be in the `dist` directory. You can preview the production build:

```powershell
npm run preview
```

## Project Structure

```
web/
├── src/
│   ├── screens/
│   │   ├── AddItemScreen.jsx          # Initial form screen
│   │   ├── SelectQuestionsScreen.jsx  # Question selection
│   │   ├── AnswerQuestionsScreen.jsx  # Answer input
│   │   └── SuccessScreen.jsx          # Success confirmation
│   ├── services/
│   │   └── apiService.js              # Backend API calls
│   ├── styles/                        # CSS stylesheets
│   ├── App.jsx                        # Main app component
│   └── main.jsx                       # Entry point
├── package.json
├── vite.config.js
└── index.html
```

## Troubleshooting

### Cannot connect to server
- Ensure the backend service is running on `http://localhost:3000`
- Check if CORS is enabled in the backend
- Verify the backend health endpoint: `http://localhost:3000/health`

### Port already in use
- The default port is 5173. If it's in use, Vite will automatically try the next available port
- You can specify a different port in `vite.config.js`

### Build errors
- Delete `node_modules` and reinstall:
  ```powershell
  Remove-Item -Recurse -Force node_modules
  npm install
  ```

## Technologies Used

- **React 18** - UI library
- **React Router** - Navigation
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **CSS3** - Styling

## Development Notes

This web interface mirrors the functionality of the Flutter mobile app, providing:
- Same user flow and screens
- Identical API integration
- Similar visual design
- Responsive layout for different screen sizes

## Next Steps

After testing with the web interface, you can:
1. Continue developing the mobile app using Flutter
2. Add additional features to both platforms
3. Implement owner verification flow
4. Add authentication and user management

## License

MIT
