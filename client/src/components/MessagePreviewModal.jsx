import React from 'react';
import { X, MessageSquare, CheckCheck, Send } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function MessagePreviewModal({ isOpen, onClose, customer, previewData }) {
  if (!isOpen) return null;

  const text = previewData?.text || 'Loading preview...';
  const phone = customer?.phone || previewData?.phone || 'N/A';
  const name = customer?.customerName || customer?.name || previewData?.customerName || 'Customer';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-400">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{name}</h3>
              <p className="text-xs text-emerald-200">{phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Chat View Mockup */}
        <div className="p-6 bg-[#efeae2] min-h-[300px] flex flex-col justify-end space-y-4">
          <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-sm max-w-[90%] space-y-2 border border-gray-100 self-start text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-line relative">
            <div className="text-emerald-800 font-bold text-xs mb-1 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Official Template: fast_book_dispatch (en_US)</span>
            </div>
            <div>{text}</div>
            <div className="flex items-center justify-end space-x-1 text-[10px] text-gray-400 mt-2">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <CheckCheck className="w-3 h-3 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Details Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Status: {customer?.status ? <StatusBadge status={customer.status} /> : <span className="font-semibold text-emerald-700">PREVIEW READY</span>}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
