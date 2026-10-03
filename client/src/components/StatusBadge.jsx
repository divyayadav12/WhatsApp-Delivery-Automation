import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Eye, CheckCheck, Ban, FileEdit } from 'lucide-react';

export default function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();

  const configs = {
    SENT: {
      label: 'Sent',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    DELIVERED: {
      label: 'Delivered',
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: CheckCheck,
    },
    READ: {
      label: 'Read',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Eye,
    },
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    SENDING: {
      label: 'Sending...',
      bg: 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse',
      icon: Clock,
    },
    FAILED: {
      label: 'Failed',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertCircle,
    },
    SKIPPED: {
      label: 'Skipped',
      bg: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: Ban,
    },
    DRAFT: {
      label: 'Draft',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: FileEdit,
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      icon: Ban,
    },
  };

  const config = configs[normalized] || {
    label: normalized || 'Unknown',
    bg: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {config.label}
    </span>
  );
}
