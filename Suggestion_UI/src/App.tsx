import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimilarityInputPage from './pages/SimilarityInputPage';
import ItemSelectionPage from './pages/ItemSelectionPage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import MatchedItemsPage from './pages/MatchedItemsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SimilarityInputPage />} />
        <Route path="/select-items" element={<ItemSelectionPage />} />
        <Route path="/item-details" element={<ItemDetailsPage />} />
        <Route path="/matched-items" element={<MatchedItemsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
