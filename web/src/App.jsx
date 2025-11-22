import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AddItemScreen from './screens/AddItemScreen';
import SelectQuestionsScreen from './screens/SelectQuestionsScreen';
import AnswerQuestionsScreen from './screens/AnswerQuestionsScreen';
import SuccessScreen from './screens/SuccessScreen';
import ViewItemsScreen from './screens/ViewItemsScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import OwnerAnswerScreen from './screens/OwnerAnswerScreen';
import VerificationResultScreen from './screens/VerificationResultScreen';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<AddItemScreen />} />
          <Route path="/select-questions" element={<SelectQuestionsScreen />} />
          <Route path="/answer-questions" element={<AnswerQuestionsScreen />} />
          <Route path="/success" element={<SuccessScreen />} />
          <Route path="/view-items" element={<ViewItemsScreen />} />
          <Route path="/item/:itemId" element={<ItemDetailScreen />} />
          <Route path="/item/:itemId/verify" element={<OwnerAnswerScreen />} />
          <Route path="/verification-result" element={<VerificationResultScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
