import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UploadCampaign from './pages/UploadCampaign';
import CampaignsHistory from './pages/CampaignsHistory';
import CampaignDetails from './pages/CampaignDetails';
import TestMessage from './pages/TestMessage';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadCampaign />} />
              <Route path="/campaigns" element={<CampaignsHistory />} />
              <Route path="/campaigns/:id" element={<CampaignDetails />} />
              <Route path="/test-message" element={<TestMessage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
