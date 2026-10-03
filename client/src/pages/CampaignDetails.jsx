import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ArrowLeft, Search, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import MessagePreviewModal from '../components/MessagePreviewModal';

export default function CampaignDetails() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Preview modal state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const fetchCampaignData = async (pageNum = page, searchQuery = search, status = statusFilter) => {
    try {
      setLoading(true);
      const repRes = await api.get(`/campaigns/${id}/report`);
      setReport(repRes.data.data);

      const params = new URLSearchParams({
        page: pageNum,
        limit: 25,
      });
      if (searchQuery) params.append('search', searchQuery);
      if (status && status !== 'ALL') params.append('status', status);

      const msgRes = await api.get(`/campaigns/${id}/messages?${params.toString()}`);
      setMessages(msgRes.data.data);
      setPagination(msgRes.data.pagination);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();

    // Socket listener for webhook or progress updates
    socket.on('message:status_update', (data) => {
      if (String(data.campaignId) === String(id)) {
        fetchCampaignData(page, search, statusFilter);
      }
    });

    return () => {
      socket.off('message:status_update');
    };
  }, [id]);

  const handleOpenPreview = async (msg) => {
    setSelectedCustomer(msg);
    try {
      const res = await api.get(`/messages/preview?messageId=${msg._id}`);
      setPreviewData(res.data.data);
    } catch {
      setPreviewData({ text: `Hello ${msg.customerName},\nYour book consignment has been dispatched.\nTracking: ${msg.trackingNumber}` });
    }
    setPreviewModalOpen(true);
  };

  if (loading && !report) {
    return (
      <div className="p-12 text-center text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
        <span>Loading campaign details...</span>
      </div>
    );
  }

  const campaign = report?.campaign;
  const summary = report?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/campaigns"
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{campaign?.name}</h2>
              {campaign?.status && <StatusBadge status={campaign.status} />}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Created: {new Date(campaign?.createdAt).toLocaleString()} | Original File: {campaign?.uploadedFile?.originalName || 'N/A'}
            </p>
          </div>
        </div>

        <a
          href={`/api/campaigns/${id}/report/download`}
          download
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-2 transition"
        >
          <Download className="w-4 h-4" />
          <span>Download Excel Report</span>
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Total</p>
          <h4 className="text-xl font-bold text-gray-900 mt-1">{summary?.total || 0}</h4>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <p className="text-[11px] font-bold text-emerald-800 uppercase">Sent</p>
          <h4 className="text-xl font-bold text-emerald-700 mt-1">{summary?.sent || 0}</h4>
        </div>
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
          <p className="text-[11px] font-bold text-teal-800 uppercase">Delivered</p>
          <h4 className="text-xl font-bold text-teal-700 mt-1">{summary?.delivered || 0}</h4>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-[11px] font-bold text-blue-800 uppercase">Read</p>
          <h4 className="text-xl font-bold text-blue-700 mt-1">{summary?.read || 0}</h4>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
          <p className="text-[11px] font-bold text-rose-800 uppercase">Failed</p>
          <h4 className="text-xl font-bold text-rose-700 mt-1">{summary?.failed || 0}</h4>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p className="text-[11px] font-bold text-gray-500 uppercase">Skipped</p>
          <h4 className="text-xl font-bold text-gray-700 mt-1">{summary?.skipped || 0}</h4>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-gray-900 text-base">Recipient Messages Details</h3>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, phone, tracking..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  fetchCampaignData(1, e.target.value, statusFilter);
                }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs w-60 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchCampaignData(1, search, e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read</option>
              <option value="FAILED">Failed</option>
              <option value="SKIPPED">Skipped</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b">
                <th className="p-3">Customer Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Tracking Number</th>
                <th className="p-3">Courier</th>
                <th className="p-3">Status</th>
                <th className="p-3">WhatsApp Message ID</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {messages.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50/80 transition">
                  <td className="p-3 font-bold text-gray-900">{m.customerName}</td>
                  <td className="p-3 font-mono text-gray-700">{m.phone}</td>
                  <td className="p-3 font-medium text-gray-800">{m.productName}</td>
                  <td className="p-3 font-mono text-emerald-700 font-semibold">{m.trackingNumber}</td>
                  <td className="p-3 text-gray-600">{m.courier}</td>
                  <td className="p-3">
                    <StatusBadge status={m.status} />
                    {m.error && <p className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[150px]">{m.error}</p>}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-gray-500">{m.messageId || 'N/A'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenPreview(m)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-bold rounded-lg transition inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MessagePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        customer={selectedCustomer}
        previewData={previewData}
      />
    </div>
  );
}
