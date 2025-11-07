import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AuthTest from './pages/AuthTest';
import Login from './pages/login';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - không cần Layout */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes - có Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="auth-test" element={<AuthTest />} />
          <Route path="*" element={
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800">404 - Trang không tồn tại</h2>
              <p className="mt-2 text-gray-600">Trang bạn tìm kiếm không tồn tại.</p>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
