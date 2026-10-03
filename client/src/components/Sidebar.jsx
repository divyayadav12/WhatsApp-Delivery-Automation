import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileUp, History, Settings, Send, FileSpreadsheet } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'New Campaign', icon: FileUp },
    { to: '/campaigns', label: 'Campaign History', icon: History },
    { to: '/test-message', label: 'Send Test Message', icon: Send },
    { to: '/settings', label: 'Settings & API', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border-l-4 border-emerald-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Quick helper card */}
      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
        <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-xs">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Excel Template</span>
        </div>
        <p className="text-xs text-emerald-700 leading-relaxed">
          Upload customer book dispatch Excel files with name, phone, tracking number & date.
        </p>
        <a
          href="/api/excel/template"
          download
          className="inline-block w-full text-center py-1.5 px-3 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow transition"
        >
          Download Sample File
        </a>
      </div>
    </aside>
  );
}
