import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { KanbanPage } from './pages/KanbanPage';
import { SettingsPage } from './pages/SettingsPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell>
                  <HomePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ApplicationsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ApplicationDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/kanban"
            element={
              <ProtectedRoute>
                <AppShell>
                  <KanbanPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SettingsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
);
};

export default App;
