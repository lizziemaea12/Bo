import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import WelcomePage from './pages/WelcomePage';
import LessonPage from './pages/LessonPage';
import RewardsPage from './pages/RewardsPage';
import ParentDashboard from './pages/ParentDashboard';

function App() {
  return (
    <AppProvider>
      <Router>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/lesson" element={<LessonPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/parent" element={<ParentDashboard />} />
          </Routes>
        </main>
      </Router>
    </AppProvider>
  );
}

export default App;
