import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Key, Phone, FileText } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/status');
      setSettings(res.data.data);
    } catch (err) {
      console.error('Error fetching settings status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.get('/settings/test-connection');
      setTestResult({
        connected: true,
        message: res.data.message,
        details: res.data.data,
      });
    } catch (err) {
      setTestResult({
        connected: false,
        error: err.message || 'Connection test failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
        <span>Checking environment configuration...</span>
      </div>
    );
  }

  const wa = settings?.whatsapp;
  const queue = settings?.queue;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings & Meta API</h2>
          <p className="text-sm text-gray-500 mt-1">
            Environment configuration and Meta Business Platform connection status.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Meta WhatsApp Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              wa?.isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Meta WhatsApp Business API Status</h3>
              <p className="text-xs text-gray-500">Official Graph API integration endpoint</p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2 ${
              testing ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing API Connection...' : 'Test Meta Connection'}</span>
          </button>
        </div>

        {/* Connection Test Result Message */}
        {testResult && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start space-x-3 ${
            testResult.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{testResult.connected ? 'Meta Connection Verified' : 'Connection Error'}</p>
              <p className="mt-0.5">{testResult.connected ? testResult.message : testResult.error}</p>
              {testResult.details && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 font-mono text-[11px] text-emerald-900 space-y-0.5">
                  <p>Verified Name: {testResult.details.verifiedName}</p>
                  <p>Display Phone: {testResult.details.displayPhoneNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
            <span className="text-gray-400 font-semibold flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>Phone Number ID</span>
            </span>
            <p className="font-mono font-bold text-gray-900 text-sm">{wa?.phoneNumberId}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
            <span className="text-gray-400 font-semibold flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Access Token Status</span>
            </span>
            <p className="font-mono font-bold text-emerald-700 text-sm">{wa?.tokenMasked}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
            <span className="text-gray-400 font-semibold flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>WhatsApp Template</span>
            </span>
            <p className="font-mono font-bold text-gray-900 text-sm">
              {wa?.templateName} ({wa?.templateLanguage})
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
            <span className="text-gray-400 font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>API Version</span>
            </span>
            <p className="font-mono font-bold text-gray-900 text-sm">{wa?.apiVersion}</p>
          </div>
        </div>

        {/* Queue Pacing Configuration */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Queue & Pacing Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-gray-500">Concurrency Limit:</span>{' '}
              <span className="font-bold text-emerald-800">{queue?.concurrency} worker</span>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-gray-500">Message Pacing Delay:</span>{' '}
              <span className="font-bold text-emerald-800">{queue?.delayMs} ms</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
          <p className="font-bold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Security Note</span>
          </p>
          <p className="leading-relaxed text-amber-700">
            For security reasons, your full Meta WhatsApp Access Token is never sent to the React frontend. To change credentials, update the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">server/.env</code> file and restart the server.
          </p>
        </div>
      </div>
    </div>
  );
}
