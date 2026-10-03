import React from 'react';
import { AlertTriangle, Send, X, ShieldCheck } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, summary, campaignName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Confirm Campaign Dispatch</h3>
              <p className="text-xs text-amber-700 font-medium">Explicit user confirmation required</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You are about to launch <span className="font-bold text-gray-900">{campaignName || 'this campaign'}</span> and dispatch official Meta WhatsApp messages.
          </p>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500 font-medium">Meta WhatsApp Template:</span>
              <span className="font-bold text-emerald-700">fast_book_dispatch (en_US)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total File Customers:</span>
              <span className="font-semibold text-gray-900">{summary?.totalRows || summary?.total || 0}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Valid Recipients to Send:</span>
              <span className="font-bold">{summary?.validCount || summary?.valid || 0}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Invalid Rows (Will be Skipped):</span>
              <span className="font-semibold">{summary?.invalidCount || summary?.invalid || 0}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Already Sent (Duplicate Protected):</span>
              <span className="font-semibold">{summary?.alreadySent || 0}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Duplicate protection active. Already sent customers will automatically be skipped.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md flex items-center space-x-2 transition"
          >
            <Send className="w-4 h-4" />
            <span>Confirm & Send WhatsApp Messages</span>
          </button>
        </div>
      </div>
    </div>
  );
}
