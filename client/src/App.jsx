import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TelemetryProvider } from './context/TelemetryContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import BehaviorPage from './pages/BehaviorPage';
import EmissionsPage from './pages/EmissionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-space-dark text-neon-cyan animate-pulse">Initializing Systems...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// App content with telemetry
const AppContent = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <TelemetryProvider>
            <Layout />
          </TelemetryProvider>
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="live" element={<DashboardPage />} />
        <Route path="behavior" element={<BehaviorPage />} />
        <Route path="emissions" element={<EmissionsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="account" element={<Navigate to="/profile" replace />} />
      </Route>

      {/* Global Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
