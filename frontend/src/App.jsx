import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import SessionDetail from './pages/SessionDetail';
import Compare from './pages/Compare';
import { Database, LayoutDashboard, GitCompare } from 'lucide-react';
import BackgroundBlobs from './components/BackgroundBlobs';
import WildEffects from './components/WildEffects';

const Navbar = () => (
  <nav className="glass-panel mx-4 mt-4 px-6 py-4 flex justify-between items-center z-50 relative sticky top-4">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
        <span className="text-white font-bold font-serif italic text-lg">O</span>
      </div>
      <span className="text-xl font-bold tracking-wide text-white">Orchestrix</span>
    </div>
    <div className="flex gap-6">
      <Link to="/" className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
        <LayoutDashboard className="w-4 h-4" /> Dashboard
      </Link>
      <Link to="/history" className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
        <Database className="w-4 h-4" /> History
      </Link>
      <Link to="/compare" className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
        <GitCompare className="w-4 h-4" /> Compare Sessions
      </Link>
    </div>
  </nav>
);

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-background relative selection:bg-primary/30">
        <BackgroundBlobs />
        <WildEffects />

        <Navbar />
        
        <main className="pt-8 pb-16 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:id" element={<SessionDetail />} />
            <Route path="/compare" element={<Compare />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
