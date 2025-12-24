# Location-Based Item Suggestion UI

A React + TypeScript + Vite web interface for testing and showcasing the Python location-based item suggestion backend.

## Features

- **Interactive Data Entry**: Collect owner information and found item details
- **Location Picker**: Smart location selector with building, floor, and hall options
- **Python Backend Integration**: Real-time API calls to location matching service
- **Matched Items Display**: Shows only items that match location criteria
- **Item Selection**: Choose 1-5 matched items for verification
- **Detailed Item View**: Display comprehensive information about selected items

## Quick Start

### Prerequisites

1. **Python Backend** must be running on `http://127.0.0.1:5000`
   ```bash
   cd ../Sugestion_python
   python app.py
   ```

2. **Node.js** (v16 or higher)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:5173`

## Usage Flow

1. **Enter Owner Information**
   - Owner ID
   - Category name (e.g., "laptop")
   - Description match confidence (0-100)
   - Owner location
   - Location confidence stage (1-3)

2. **Add Found Items**
   - Item ID
   - Description score (0-100)
   - Item location (with floor/hall if applicable)

3. **Find Matches**
   - Click "Find Matches" to call Python backend
   - System sends data to `http://127.0.0.1:5000/api/find-items`
   - Receives matched item IDs

4. **Select Items**
   - View only matched items
   - Select 1-5 items for verification
   - View detailed information

## Python Backend Integration

### Request Format

```json
{
  "owner_id": 104,
  "categary_name": "laptop",
  "categary_data": [
    {
      "id": 16,
      "description_scrore": 93,
      "found_location": [
        {
          "location": "new_building",
          "floor_id": 2,
          "hall_name": "F302"
        }
      ]
    }
  ],
  "description_match_cofidence": 90,
  "owner_location": "new_building",
  "floor_id": null,
  "hall_name": null,
  "owner_location_confidence_stage": 2
}
```

### Response Format

```json
{
  "location_match": true,
  "matched_item_ids": [16, 17, 18],
  "matched_locations": ["new_building", "engineering_faculty"],
  "success": true
}
```

## Project Structure

```
src/
├── pages/
│   ├── SimilarityInputPage.tsx    # Data collection form
│   ├── ItemSelectionPage.tsx      # Display matched items
│   └── ItemDetailsPage.tsx        # Show item details
├── services/
│   ├── locationMatchService.ts    # Python backend API
│   └── itemService.ts             # Item data service
├── components/
│   └── LocationSelector.tsx       # Location picker
├── types/
│   └── index.ts                   # TypeScript definitions
├── data/
│   └── locations.ts               # Location data
└── config/
    └── api.ts                     # API configuration
```

## Documentation

- [PYTHON_BACKEND_INTEGRATION.md](./PYTHON_BACKEND_INTEGRATION.md) - Detailed integration guide
- [TEST_API.md](./TEST_API.md) - API testing instructions
- [QUICK_START.md](./QUICK_START.md) - Quick start guide

## Configuration

### Change Backend URL

Edit `src/services/locationMatchService.ts`:

```typescript
const PYTHON_API_URL = 'http://127.0.0.1:5000/api/find-items';
```

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Development

```bash
# Run dev server
npm run dev

# Run linter
npm run lint

# Type checking
tsc --noEmit
```

## Troubleshooting

### Python Backend Connection Error

**Error**: "Failed to connect to location matching service"

**Solutions**:
1. Ensure Python backend is running: `python app.py`
2. Check backend is accessible at `http://127.0.0.1:5000`
3. Verify CORS is enabled on Python backend
4. Check browser console for detailed errors

### No Matched Items

**Issue**: Empty results after API call

**Check**:
1. Verify request data format matches backend expectations
2. Check Python backend logs for errors
3. Ensure location names match expected values
4. Verify description scores are in correct range (0-100)

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Navigation

## Support

For issues or questions:
1. Check browser console (F12) for errors
2. Review Python backend logs
3. Verify all required fields are filled
4. Ensure data format matches API expectations

---

## Original Vite Template Information

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
