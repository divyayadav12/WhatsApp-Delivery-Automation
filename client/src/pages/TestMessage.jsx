import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import api from '../services/api';

export default function TestMessage() {
  const [phone, setPhone] = useState('919876543210');
  const [name, setName] = useState('Test Recipient');
  const [productName, setProductName] = useState('CA Inter IDT Full Book Set 8.0');
  const [trackingNumber, setTrackingNumber] = useState('C1144011340IN');
  const [dispatchDate, setDispatchDate] = useState('30-09-2026');
  const [courier, setCourier] = useState('India Post');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!phone) {
      alert('Please enter a WhatsApp phone number.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const res = await api.post('/whatsapp/test', {
        phone,
        name,
        productName,
        trackingNumber,
        dispatchDate,
        courier,
      });

      setResult({
        success: true,
        message: res.data.message || 'Test message sent successfully!',
        messageId: res.data.data.messageId,
      });
    } catch (err) {
      setResult({
        success: false,
        error: err.message || 'Failed to send test message.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Send Test Message</h2>
          <p className="text-sm text-gray-500 mt-1">
            Test the approved Meta WhatsApp template (<span className="font-semibold text-emerald-700">fast_book_dispatch</span>) before launching full campaigns.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <Smartphone className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <form onSubmit={handleSendTest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Test WhatsApp Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Include country code without '+' (e.g., 91 for India).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sample Name ({'{{1}}'})</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name ({'{{2}}'})</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tracking Number ({'{{3}}'})</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Dispatch Date ({'{{4}}'})</label>
              <input
                type="text"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Courier Partner ({'{{5}}'})</label>
            <input
              type="text"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          {result && (
            <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start space-x-3 ${
              result.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{result.success ? 'Success!' : 'Dispatch Failed'}</p>
                <p>{result.success ? result.message : result.error}</p>
                {result.messageId && (
                  <p className="font-mono text-[11px] text-emerald-700">
                    Meta Message ID: <span className="font-bold">{result.messageId}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 ml-auto ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending Meta Test WhatsApp...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Test Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
