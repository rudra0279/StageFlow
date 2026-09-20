import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { EventProvider } from './context/EventContext';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventsListPage } from './pages/organizer/EventsListPage';
import { EventDashboard } from './pages/organizer/EventDashboard';
import { LiveAnchorView } from './pages/anchor/LiveAnchorView';
import { AudienceQAView } from './pages/AudienceQAView';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { ServerErrorPage } from './pages/ServerErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <EventProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    {/* Public Presentation & Entry Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Audience Q&A Public Access Routes */}
                    <Route path="/qa" element={<AudienceQAView />} />
                    <Route path="/qa/:id" element={<AudienceQAView />} />
                    <Route path="/events/:id/qa" element={<AudienceQAView />} />

                    {/* Organizer Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
                      <Route path="/organizer" element={<EventsListPage />} />
                      <Route path="/organizer/events/:id" element={<EventDashboard />} />
                    </Route>

                    {/* Anchor Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['ANCHOR', 'ORGANIZER']} />}>
                      <Route path="/anchor" element={<LiveAnchorView />} />
                      <Route path="/anchor/live/:id" element={<LiveAnchorView />} />
                    </Route>

                    {/* Dedicated Security and Error Pages */}
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    <Route path="/forbidden" element={<ForbiddenPage />} />
                    <Route path="/error" element={<ServerErrorPage />} />

                    {/* Fallback Not Found */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </EventProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
