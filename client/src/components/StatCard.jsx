import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtext }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100 icon-bg:bg-blue-100 text-blue-600',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100 icon-bg:bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-50 text-amber-700 border-amber-100 icon-bg:bg-amber-100 text-amber-600',
    red: 'bg-rose-50 text-rose-700 border-rose-100 icon-bg:bg-rose-100 text-rose-600',
    gray: 'bg-gray-50 text-gray-700 border-gray-100 icon-bg:bg-gray-100 text-gray-600',
    purple: 'bg-purple-50 text-purple-700 border-purple-100 icon-bg:bg-purple-100 text-purple-600',
  };

  const currentStyle = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`p-5 rounded-2xl border bg-white shadow-sm flex items-center justify-between`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value ?? 0}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentStyle}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
