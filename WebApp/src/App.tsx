import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import VerificationResult from './pages/VerificationResult';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="add-item" element={<AddItem />} />
            <Route path="item/:id" element={<ItemDetail />} />
            <Route path="verification/:verificationId" element={<VerificationResult />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
