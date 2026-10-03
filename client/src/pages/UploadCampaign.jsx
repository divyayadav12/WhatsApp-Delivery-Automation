import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Search, Filter, Eye, Download, Play, Square, RefreshCw, XCircle } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import Stepper from '../components/Stepper';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import ConfirmationModal from '../components/ConfirmationModal';
import MessagePreviewModal from '../components/MessagePreviewModal';

export default function UploadCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Upload result & campaign data
  const [uploadResult, setUploadResult] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);

  // Table filters & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Preview Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Live Sending State
  const [sendingState, setSendingState] = useState({
    isSending: false,
    processedCount: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    skipped: 0,
    progressPercent: 0,
    status: 'READY',
  });

  // Socket.io Real-time Progress Listener
  useEffect(() => {
    socket.on('campaign:progress', (data) => {
      if (String(data.campaignId) === String(campaignId)) {
        setSendingState({
          isSending: true,
          processedCount: data.processedCount,
          sent: data.sent,
          failed: data.failed,
          pending: data.pending,
          skipped: data.skipped,
          progressPercent: data.progressPercent,
          status: 'SENDING',
        });
        fetchCustomers(campaignId);
      }
    });

    socket.on('campaign:completed', (data) => {
      if (String(data.campaignId) === String(campaignId)) {
        setSendingState(prev => ({
          ...prev,
          isSending: false,
          status: 'COMPLETED',
          progressPercent: 100,
        }));
        setStep(6); // Step 6: Report
        fetchCustomers(campaignId);
      }
    });

    socket.on('campaign:cancelled', (data) => {
      if (String(data.campaignId) === String(campaignId)) {
        setSendingState(prev => ({
          ...prev,
          isSending: false,
          status: 'CANCELLED',
        }));
        setStep(6);
        fetchCustomers(campaignId);
      }
    });

    return () => {
      socket.off('campaign:progress');
      socket.off('campaign:completed');
      socket.off('campaign:cancelled');
    };
  }, [campaignId]);

  // Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!campaignName) {
        const base = selected.name.replace(/\.[^/.]+$/, '');
        setCampaignName(`${base} (${new Date().toLocaleDateString('en-GB')})`);
      }
      setUploadError('');
    }
  };

  // Upload and Validate Excel File
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select an Excel or CSV file to upload.');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaignName', campaignName || file.name);

      const res = await api.post('/excel/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data.data;
      setUploadResult(data);
      setCampaignId(data.campaignId);

      // Move to Step 2: Validate & Preview
      setStep(2);
      fetchCustomers(data.campaignId);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload and validate file.');
    } finally {
      setUploading(false);
    }
  };

  // Fetch Customers for Preview Table
  const fetchCustomers = async (cId, pageNum = 1, search = searchTerm, status = statusFilter) => {
    const activeCampaignId = cId || campaignId;
    if (!activeCampaignId) return;

    try {
      setLoadingCustomers(true);
      const params = new URLSearchParams({
        campaignId: activeCampaignId,
        page: pageNum,
        limit: 25,
      });

      if (search) params.append('search', search);
      if (status && status !== 'ALL') params.append('status', status);

      const res = await api.get(`/customers?${params.toString()}`);
      setCustomers(res.data.data);
      setTotalCustomersCount(res.data.pagination.total);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Open Message Preview Modal for a customer
  const handleOpenPreview = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const res = await api.get(`/messages/preview?messageId=${customer._id}`);
      setPreviewData(res.data.data);
    } catch {
      setPreviewData({
        text: `Hello ${customer.customerName},\nYour FAST Education book consignment has been dispatched.\nTracking Number: ${customer.trackingNumber}\nCourier: ${customer.courier}`,
      });
    }
    setPreviewModalOpen(true);
  };

  // Start Campaign Dispatch
  const handleStartSending = async () => {
    setConfirmModalOpen(false);
    setStep(5); // Step 5: Live Sending
    setSendingState(prev => ({ ...prev, isSending: true, status: 'SENDING' }));

    try {
      await api.post(`/campaigns/${campaignId}/start`);
    } catch (err) {
      alert(`Failed to start campaign: ${err.message}`);
      setSendingState(prev => ({ ...prev, isSending: false, status: 'FAILED' }));
    }
  };

  // Cancel Sending Campaign
  const handleCancelSending = async () => {
    if (window.confirm('Are you sure you want to cancel campaign sending? Unsent messages will be marked as SKIPPED.')) {
      try {
        await api.post(`/campaigns/${campaignId}/cancel`);
      } catch (err) {
        alert(`Failed to cancel campaign: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Dispatch Campaign</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload student book-dispatch Excel file and execute Meta WhatsApp delivery.
          </p>
        </div>
      </div>

      {/* Stepper Progress Header */}
      <Stepper currentStep={step} />

      {/* STEP 1: Excel Upload */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Upload Dispatch Excel File</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Supported formats: <span className="font-semibold text-gray-700">.xlsx, .xls, .csv</span>. File must contain columns for name, phone, product name, tracking number, dispatch date, and courier.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. CA Inter Book Dispatch (Sept 2026)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            {/* Drag & Drop File Input */}
            <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-emerald-50/50 hover:bg-emerald-50 transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              {file ? (
                <div className="space-y-1">
                  <p className="font-bold text-gray-900 text-sm">{file.name}</p>
                  <p className="text-xs text-emerald-700 font-semibold">
                    {(file.size / 1024).toFixed(1)} KB — Click to change file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900 text-sm">Click or Drag Excel file here</p>
                  <p className="text-xs text-gray-500">Maximum file size: 20MB</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <a
                href="/api/excel/template"
                download
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Excel Template</span>
              </a>

              <button
                type="submit"
                disabled={uploading || !file}
                className={`px-6 py-3 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center space-x-2 ${
                  uploading || !file ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {uploading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{uploading ? 'Parsing & Validating...' : 'Upload & Validate Excel'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2 & STEP 3: Validation Summary & Customer Preview */}
      {(step === 2 || step === 3) && uploadResult && (
        <div className="space-y-6">
          {/* Validation Report Banner */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Excel Validation Results</h3>
                <p className="text-xs text-gray-500">
                  File: <span className="font-semibold text-gray-800">{file?.name}</span> | Rows: <span className="font-semibold text-gray-800">{uploadResult.totalRows}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Upload Different File
                </button>
                <button
                  onClick={() => {
                    setStep(4);
                    setConfirmModalOpen(true);
                  }}
                  disabled={uploadResult.validCount === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
                >
                  <Play className="w-4 h-4" />
                  <span>Proceed to Send ({uploadResult.validCount} Valid)</span>
                </button>
              </div>
            </div>

            {/* Validation Count Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <p className="text-xs font-bold text-emerald-800 uppercase">VALID RECIPIENTS</p>
                <h4 className="text-3xl font-extrabold text-emerald-700 mt-1">{uploadResult.summary.VALID}</h4>
                <p className="text-[11px] text-emerald-600 mt-1">Ready for WhatsApp sending</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                <p className="text-xs font-bold text-rose-800 uppercase font-sans">INVALID ROWS</p>
                <h4 className="text-3xl font-extrabold text-rose-700 mt-1">{uploadResult.summary.INVALID}</h4>
                <p className="text-[11px] text-rose-600 mt-1">Missing info or malformed phone</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="text-xs font-bold text-amber-800 uppercase">DUPLICATE ROWS</p>
                <h4 className="text-3xl font-extrabold text-amber-700 mt-1">{uploadResult.summary.DUPLICATE}</h4>
                <p className="text-[11px] text-amber-600 mt-1">Identified duplicate numbers</p>
              </div>
            </div>
          </div>

          {/* Customer Preview Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Customer & Message Preview</h3>
                <p className="text-xs text-gray-500">Inspect parsed customers and view personalized WhatsApp messages</p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search name, phone, tracking..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      fetchCustomers(campaignId, 1, e.target.value, statusFilter);
                    }}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs w-64 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    fetchCustomers(campaignId, 1, searchTerm, e.target.value);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">All Rows</option>
                  <option value="PENDING">Valid / Pending</option>
                  <option value="INVALID">Invalid Rows</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loadingCustomers ? (
              <div className="p-8 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                <span>Loading preview customers...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b">
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Tracking No.</th>
                      <th className="p-3">Dispatch Date</th>
                      <th className="p-3">Courier</th>
                      <th className="p-3">Status / Errors</th>
                      <th className="p-3 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {customers.map((c) => (
                      <tr
                        key={c._id}
                        className={`hover:bg-gray-50/80 transition ${
                          !c.isValid ? 'bg-rose-50/50' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-gray-900">{c.customerName}</td>
                        <td className="p-3 font-mono text-gray-700">{c.phone}</td>
                        <td className="p-3 font-medium text-gray-800">{c.productName}</td>
                        <td className="p-3 font-mono text-emerald-700 font-semibold">{c.trackingNumber}</td>
                        <td className="p-3 text-gray-600">{c.dispatchDate}</td>
                        <td className="p-3 text-gray-600">{c.courier}</td>
                        <td className="p-3">
                          {c.isValid ? (
                            <StatusBadge status={c.status} />
                          ) : (
                            <span className="text-rose-700 font-medium flex items-center space-x-1" title={c.validationError}>
                              <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{c.validationError}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenPreview(c)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition flex items-center space-x-1 ml-auto"
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
            )}
          </div>
        </div>
      )}

      {/* STEP 5: Live Sending Progress */}
      {step === 5 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <ProgressBar
            progressPercent={sendingState.progressPercent}
            sent={sendingState.sent}
            failed={sendingState.failed}
            pending={sendingState.pending}
            total={uploadResult?.validCount || totalCustomersCount}
          />

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Sending Meta WhatsApp Messages...</h4>
                <p className="text-xs text-gray-500">Do not close this tab while campaign is executing.</p>
              </div>
            </div>

            <button
              onClick={handleCancelSending}
              className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl flex items-center space-x-2 transition"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Cancel Campaign</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Final Report */}
      {step === 6 && (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-3xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Campaign Completed</h3>
            <p className="text-xs text-gray-500 mt-1">
              WhatsApp delivery process completed for <span className="font-semibold text-gray-800">{campaignName}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-800">SENT</p>
              <h4 className="text-2xl font-bold text-emerald-700 mt-1">{sendingState.sent}</h4>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
              <p className="text-xs font-semibold text-rose-800">FAILED</p>
              <h4 className="text-2xl font-bold text-rose-700 mt-1">{sendingState.failed}</h4>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-700">SKIPPED</p>
              <h4 className="text-2xl font-bold text-gray-700 mt-1">{sendingState.skipped}</h4>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-xs font-semibold text-blue-800">TOTAL</p>
              <h4 className="text-2xl font-bold text-blue-700 mt-1">{uploadResult?.totalRows || totalCustomersCount}</h4>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4 pt-4">
            <a
              href={`/api/campaigns/${campaignId}/report/download`}
              download
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Final Excel Report</span>
            </a>
            <button
              onClick={() => navigate(`/campaigns/${campaignId}`)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
            >
              View Campaign Details
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleStartSending}
        summary={uploadResult?.summary ? {
          totalRows: uploadResult.totalRows,
          validCount: uploadResult.validCount,
          invalidCount: uploadResult.invalidCount,
        } : null}
        campaignName={campaignName}
      />

      {/* Message Preview Modal */}
      <MessagePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        customer={selectedCustomer}
        previewData={previewData}
      />
    </div>
  );
}
