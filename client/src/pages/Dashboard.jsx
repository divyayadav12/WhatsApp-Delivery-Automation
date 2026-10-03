import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Send, Clock, AlertCircle, Ban, Plus, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    skipped: 0,
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campaigns?limit=10');
      const campaignList = res.data.data || [];
      setCampaigns(campaignList);

      // Aggregate overall stats
      let totalCustomers = 0;
      let sent = 0;
      let pending = 0;
      let failed = 0;
      let skipped = 0;

      campaignList.forEach((c) => {
        totalCustomers += c.totalCustomers || 0;
        sent += c.sent || 0;
        pending += c.pending || 0;
        failed += c.failed || 0;
        skipped += c.skipped || 0;
      });

      setStats({ totalCustomers, sent, pending, failed, skipped });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track customer book dispatch statistics and WhatsApp message statuses.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/upload"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center space-x-2 transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          color="blue"
          subtext="Across all campaigns"
        />
        <StatCard
          title="Sent"
          value={stats.sent}
          icon={Send}
          color="green"
          subtext="Meta WhatsApp Dispatched"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="amber"
          subtext="Queued for sending"
        />
        <StatCard
          title="Failed"
          value={stats.failed}
          icon={AlertCircle}
          color="red"
          subtext="Delivery errors"
        />
        <StatCard
          title="Skipped"
          value={stats.skipped}
          icon={Ban}
          color="gray"
          subtext="Invalid / Cancelled"
        />
      </div>

      {/* Recent Campaigns Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Dispatch Campaigns</h3>
            <p className="text-xs text-gray-500">Overview of recent Excel upload batches</p>
          </div>
          <Link to="/campaigns" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            View All Campaigns →
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
            <span>Loading recent campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <div>
              <h4 className="font-bold text-gray-800 text-base">No campaigns found yet</h4>
              <p className="text-xs text-gray-500 mt-1">Upload your first customer book-dispatch Excel file to get started.</p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-xs shadow hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Excel File</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b">
                  <th className="p-4">Campaign Name</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Sent</th>
                  <th className="p-4">Failed</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-bold text-gray-900">{c.name}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-4 font-semibold text-gray-700">{c.totalCustomers}</td>
                    <td className="p-4 font-bold text-emerald-600">{c.sent}</td>
                    <td className="p-4 font-semibold text-rose-600">{c.failed}</td>
                    <td className="p-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/campaigns/${c._id}`}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
