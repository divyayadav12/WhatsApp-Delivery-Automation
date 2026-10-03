import React from 'react';

export default function ProgressBar({ progressPercent = 0, sent = 0, failed = 0, pending = 0, total = 0 }) {
  const safePercent = Math.min(100, Math.max(0, Math.round(progressPercent)));

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Campaign Dispatch Progress</h4>
          <p className="text-xs text-gray-500">Processing queued messages with rate pacing</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-extrabold text-emerald-600">{safePercent}%</span>
          <p className="text-xs text-gray-400">{sent + failed} of {total} processed</p>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden p-0.5 border border-gray-200">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 ease-out shadow-inner"
          style={{ width: `${safePercent}%` }}
        />
      </div>

      {/* Mini Stats Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
          <span className="text-gray-500 font-medium">Sent:</span>{' '}
          <span className="font-bold text-emerald-700">{sent}</span>
        </div>
        <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
          <span className="text-gray-500 font-medium">Failed:</span>{' '}
          <span className="font-bold text-rose-700">{failed}</span>
        </div>
        <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
          <span className="text-gray-500 font-medium">Pending:</span>{' '}
          <span className="font-bold text-amber-700">{pending}</span>
        </div>
      </div>
    </div>
  );
}
