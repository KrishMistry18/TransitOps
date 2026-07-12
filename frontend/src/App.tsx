import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DemoProvider } from './features/demo/DemoContext';
import DemoGuide from './features/demo/DemoGuide';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import RequestAccess from './pages/RequestAccess';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Fuel from './pages/Fuel';
import Analytics from './pages/Analytics';
import Recovery from './pages/Recovery';
import Compliance from './pages/Compliance';

function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
          <Route path="/request-access" element={<RequestAccess />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/fleet" element={<Fleet />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/recovery" element={<Recovery />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/fuel" element={<Fuel />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
          <DemoGuide />
        </Router>
      </DemoProvider>
    </AuthProvider>
  );
}

export default App;
