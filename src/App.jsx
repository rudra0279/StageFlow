import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { AgendaProvider } from './context/AgendaContext';
import { AIProvider } from './context/AIContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import ControlRoomLayout from './layouts/ControlRoomLayout';
import AuthLayout from './layouts/AuthLayout';

// Guard
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Pages - Organizer
import DashboardPage from './pages/organizer/DashboardPage';
import EventsPage from './pages/organizer/EventsPage';
import SpeakersPage from './pages/organizer/SpeakersPage';
import AgendaPage from './pages/organizer/AgendaPage';
import LivePage from './pages/organizer/LivePage';

// Pages - Anchor
import AnchorDashboardPage from './pages/anchor/AnchorDashboardPage';
import AIAssistantPage from './pages/anchor/AIAssistantPage';

// Constants
import { ROUTES } from './constants/routes';
import { ROLES } from './constants/roles';

// Root Index Redirect Handler
const IndexRedirect = () => {
  return <Navigate to={ROUTES.LOGIN} replace />;
};

export const App = () => {
  return (
    <AuthProvider>
      <EventProvider>
        <AgendaProvider>
          <AIProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                </Route>

                {/* Protected Organizer Routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.ORGANIZER]} />}>
                  <Route element={<MainLayout />}>
                    <Route path={ROUTES.ORGANIZER.DASHBOARD} element={<DashboardPage />} />
                    <Route path={ROUTES.ORGANIZER.EVENTS} element={<EventsPage />} />
                    <Route path={ROUTES.ORGANIZER.SPEAKERS} element={<SpeakersPage />} />
                    <Route path={ROUTES.ORGANIZER.AGENDA} element={<AgendaPage />} />
                  </Route>
                  {/* Organizer Fullscreen Control Room */}
                  <Route element={<ControlRoomLayout />}>
                    <Route path={ROUTES.ORGANIZER.LIVE} element={<LivePage />} />
                  </Route>
                </Route>

                {/* Protected Anchor Routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.ANCHOR]} />}>
                  <Route element={<MainLayout />}>
                    <Route path={ROUTES.ANCHOR.DASHBOARD} element={<AnchorDashboardPage />} />
                    <Route path={ROUTES.ANCHOR.AI} element={<AIAssistantPage />} />
                  </Route>
                </Route>

                {/* Home Redirect */}
                <Route path={ROUTES.HOME} element={<IndexRedirect />} />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
              </Routes>
            </BrowserRouter>
          </AIProvider>
        </AgendaProvider>
      </EventProvider>
    </AuthProvider>
  );
};

export default App;
