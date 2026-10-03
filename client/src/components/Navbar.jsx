import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Wifi, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const [apiStatus, setApiStatus] = useState({ isConfigured: false, loading: true });

  const checkStatus = async () => {
    try {
      setApiStatus(prev => ({ ...prev, loading: true }));
      const res = await api.get('/settings/status');
      setApiStatus({
        isConfigured: res.data.data.whatsapp.isConfigured,
        templateName: res.data.data.whatsapp.templateName,
        loading: false,
      });
    } catch {
      setApiStatus({ isConfigured: false, loading: false });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand logo & title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">FAST Education</h1>
            <p className="text-xs font-medium text-emerald-600">WhatsApp Delivery Automation</p>
          </div>
        </div>

        {/* API connection indicator badge */}
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-2 border ${
            apiStatus.isConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <Wifi className="w-3.5 h-3.5" />
            <span>
              {apiStatus.loading
                ? 'Checking Meta API...'
                : apiStatus.isConfigured
                ? `Meta API Connected (${apiStatus.templateName})`
                : 'Meta API Credentials Pending'}
            </span>
          </div>

          <button
            onClick={checkStatus}
            title="Refresh API Status"
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${apiStatus.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
