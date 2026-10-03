import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Download, Eye, Search, RefreshCw } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function CampaignsHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchCampaigns = async (pageNum = 1, searchQuery = search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 15,
      });
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/campaigns?${params.toString()}`);
      setCampaigns(res.data.data);
      setPagination(res.data.pagination);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching campaign history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign History</h2>
          <p className="text-sm text-gray-500 mt-1">View past WhatsApp book dispatch campaigns and download reports.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search campaign name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchCampaigns(1, e.target.value);
              }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs w-64 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => fetchCampaigns(page, search)}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
            <span>Loading campaign history...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-base text-gray-800">No campaigns found</p>
            <p className="text-xs mt-1">Try changing your search term or upload a new campaign.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b">
                  <th className="p-4">Campaign Name</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Sent</th>
                  <th className="p-4">Failed</th>
                  <th className="p-4">Skipped</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-bold text-gray-900">{c.name}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('en-GB')} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{c.totalCustomers}</td>
                    <td className="p-4 font-bold text-emerald-600">{c.sent}</td>
                    <td className="p-4 font-semibold text-rose-600">{c.failed}</td>
                    <td className="p-4 font-semibold text-gray-500">{c.skipped}</td>
                    <td className="p-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        to={`/campaigns/${c._id}`}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                      <a
                        href={`/api/campaigns/${c._id}/report/download`}
                        download
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition inline-flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between text-xs">
            <span className="text-gray-500">Showing page {page} of {pagination.pages}</span>
            <div className="space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchCampaigns(page - 1)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => fetchCampaigns(page + 1)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
