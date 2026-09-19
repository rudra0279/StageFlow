import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { EventProvider } from './context/EventContext';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventsListPage } from './pages/organizer/EventsListPage';
import { EventDashboard } from './pages/organizer/EventDashboard';
import { LiveAnchorView } from './pages/anchor/LiveAnchorView';
import { NotFoundPage } from './pages/NotFoundPage';

import { AudienceQAView } from './pages/AudienceQAView';

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <EventProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-stage-950 text-slate-100 flex flex-col font-sans">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Audience Q&A Route */}
                  <Route path="/qa" element={<AudienceQAView />} />
                  <Route path="/qa/:id" element={<AudienceQAView />} />
                  <Route path="/events/:id/qa" element={<AudienceQAView />} />

                  {/* Organizer Routes */}
                  <Route path="/organizer" element={<EventsListPage />} />
                  <Route path="/organizer/events/:id" element={<EventDashboard />} />

                  {/* Anchor Routes */}
                  <Route path="/anchor" element={<LiveAnchorView />} />
                  <Route path="/anchor/live/:id" element={<LiveAnchorView />} />

                  {/* Fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </EventProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
