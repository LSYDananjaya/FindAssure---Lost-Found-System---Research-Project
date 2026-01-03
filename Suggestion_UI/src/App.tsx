import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimilarityInputPage from './pages/SimilarityInputPage';
import ItemSelectionPage from './pages/ItemSelectionPage';
import ItemDetailsPage from './pages/ItemDetailsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SimilarityInputPage />} />
        <Route path="/select-items" element={<ItemSelectionPage />} />
        <Route path="/item-details" element={<ItemDetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
