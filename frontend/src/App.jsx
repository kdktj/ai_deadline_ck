import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/login";
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    // Nếu chưa đăng nhập, redirect về trang login
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const token = localStorage.getItem("access_token");

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  404 - Trang không tồn tại
                </h2>
                <p className="mt-2 text-gray-600">
                  Trang bạn tìm kiếm không tồn tại.
                </p>
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
