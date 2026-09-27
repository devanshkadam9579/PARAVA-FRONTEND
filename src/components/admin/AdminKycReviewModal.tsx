import React, { useState } from 'react';
import { 
  ShieldCheck, X, CheckCircle, AlertTriangle, FileText, Eye, 
  User, Phone, MapPin, Building, CreditCard, ExternalLink, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Vendor, VendorKycData } from '../../types';

export interface AdminKycReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  onApproveKyc: (vendorId: string) => Promise<void>;
  onRejectKyc: (vendorId: string, reason: string) => Promise<void>;
}

export function AdminKycReviewModal({
  isOpen,
  onClose,
  vendors,
  onApproveKyc,
  onRejectKyc
}: AdminKycReviewModalProps) {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  if (!isOpen) return null;

  // Filter vendors with KYC
  const kycVendors = vendors.filter(v => {
    const status = v.kyc?.status || 'NOT_SUBMITTED';
    if (filter === 'PENDING') return status === 'PENDING_VERIFICATION';
    if (filter === 'VERIFIED') return status === 'VERIFIED';
    if (filter === 'REJECTED') return status === 'REJECTED';
    return v.kyc !== undefined;
  });

  const activeVendor = selectedVendor || kycVendors[0] || null;

  const handleApprove = async (vendorId: string) => {
    if (!window.confirm('Approve this vendor KYC and grant Verified Partner Badge on Parva?')) return;
    setLoadingAction(true);
    try {
      await onApproveKyc(vendorId);
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor({
          ...selectedVendor,
          isVerified: true,
          verified: true,
          kyc: { ...selectedVendor.kyc!, status: 'VERIFIED', verifiedAt: new Date().toISOString() }
        });
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async (vendorId: string) => {
    if (!rejectReason.trim()) {
      alert('Please specify a rejection reason to inform the vendor.');
      return;
    }
    setLoadingAction(true);
    try {
      await onRejectKyc(vendorId, rejectReason);
      setIsRejecting(false);
      setRejectReason('');
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor({
          ...selectedVendor,
          isVerified: false,
          verified: false,
          kyc: { ...selectedVendor.kyc!, status: 'REJECTED', rejectionReason: rejectReason }
        });
      }
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-[#f2e4ec]">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-brand-primary to-[#79194a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display tracking-tight">Admin KYC & Partner Document Verification</h2>
              <p className="text-xs text-white/80">Confidential Admin Panel • Verify Aadhaar, PAN, Licenses and Partner Identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Split: Left List / Right Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Vendor Submissions List */}
          <div className="md:col-span-4 border-r border-gray-100 flex flex-col bg-gray-50/50">
            {/* Filter Tabs */}
            <div className="p-3 border-b border-gray-200 flex gap-1 overflow-x-auto bg-white">
              {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    filter === f ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f === 'PENDING' ? 'Pending Review' : f}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {kycVendors.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-medium">
                  No vendor KYC submissions under this filter.
                </div>
              ) : (
                kycVendors.map((v) => {
                  const status = v.kyc?.status || 'NOT_SUBMITTED';
                  const isSelected = activeVendor?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => { setSelectedVendor(v); setIsRejecting(false); }}
                      className={`p-3.5 rounded-2xl cursor-pointer transition border text-left ${
                        isSelected
                          ? 'bg-white border-brand-primary shadow-sm ring-2 ring-brand-primary/10'
                          : 'bg-white/80 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-gray-900 truncate max-w-[160px]">{v.name}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                          status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {status === 'PENDING_VERIFICATION' ? 'Pending' : status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">{v.category} • {v.location}</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {v.kyc?.submittedAt ? `Submitted: ${new Date(v.kyc.submittedAt).toLocaleDateString()}` : 'No date'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Vendor KYC Detail Sheet */}
          <div className="md:col-span-8 p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
            {!activeVendor ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-16">
                <FileText size={48} className="text-gray-300 mb-2" />
                <span>Select a vendor submission from the left panel to review KYC documents.</span>
              </div>
            ) : (
              <>
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {activeVendor.kyc?.profilePicUrl || activeVendor.founderImage || activeVendor.images?.[0] ? (
                      <img
                        src={activeVendor.kyc?.profilePicUrl || activeVendor.founderImage || activeVendor.images?.[0]}
                        alt={activeVendor.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                        {activeVendor.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">{activeVendor.name}</h3>
                        {activeVendor.isVerified && (
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Verified Partner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{activeVendor.category} • {activeVendor.location}</p>
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(activeVendor.id)}
                      disabled={loadingAction}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <ThumbsUp size={14} />
                      <span>Approve KYC</span>
                    </button>
                    <button
                      onClick={() => setIsRejecting(!isRejecting)}
                      disabled={loadingAction}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <ThumbsDown size={14} />
                      <span>Reject KYC</span>
                    </button>
                  </div>
                </div>

                {/* Reject Notice Drawer */}
                {isRejecting && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider">Provide Rejection Reason</h4>
                    <textarea
                      rows={2}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Aadhaar image is blurry, please upload a clear scanned copy of front and back."
                      className="w-full text-xs p-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsRejecting(false)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(activeVendor.id)}
                        disabled={loadingAction}
                        className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}

                {/* Contact & Registration Information */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-xs">
                  <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-wider">1. Contact & Business Profile</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500 block">Contact Person / Founder:</span>
                      <span className="font-bold text-gray-900">{activeVendor.kyc?.contactPerson || activeVendor.founderName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Contact Phone:</span>
                      <span className="font-bold text-gray-900">{activeVendor.kyc?.contactPhone || activeVendor.phone || 'N/A'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 block">Registered Business Address:</span>
                      <span className="font-medium text-gray-800">{activeVendor.kyc?.registeredAddress || activeVendor.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Aadhaar Documents */}
                <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-wider">2. Aadhaar Verification</h4>
                    <span className="text-xs font-mono font-bold text-brand-primary">
                      {activeVendor.kyc?.aadhaarNumber ? `Aadhaar: ${activeVendor.kyc.aadhaarNumber}` : 'Number Not Provided'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] text-gray-500 font-bold block mb-1.5">Aadhaar Front Side:</span>
                      {activeVendor.kyc?.aadhaarFrontUrl ? (
                        <div
                          onClick={() => setPreviewImage(activeVendor.kyc?.aadhaarFrontUrl || null)}
                          className="relative group rounded-xl overflow-hidden border border-gray-200 cursor-pointer h-40 bg-gray-100"
                        >
                          <img src={activeVendor.kyc.aadhaarFrontUrl} alt="Aadhaar Front" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-bold gap-1">
                            <Eye size={16} /> Click to Enlarge
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                          Not Uploaded
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-500 font-bold block mb-1.5">Aadhaar Back Side:</span>
                      {activeVendor.kyc?.aadhaarBackUrl ? (
                        <div
                          onClick={() => setPreviewImage(activeVendor.kyc?.aadhaarBackUrl || null)}
                          className="relative group rounded-xl overflow-hidden border border-gray-200 cursor-pointer h-40 bg-gray-100"
                        >
                          <img src={activeVendor.kyc.aadhaarBackUrl} alt="Aadhaar Back" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-bold gap-1">
                            <Eye size={16} /> Click to Enlarge
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                          Not Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PAN Card & GST */}
                <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-wider">3. PAN & GST Verification</h4>
                    <div className="flex items-center gap-3 text-xs font-mono font-bold text-gray-700">
                      {activeVendor.kyc?.panNumber && <span>PAN: {activeVendor.kyc.panNumber}</span>}
                      {activeVendor.kyc?.gstNumber && <span>GST: {activeVendor.kyc.gstNumber}</span>}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-500 font-bold block mb-1.5">PAN Card Document:</span>
                    {activeVendor.kyc?.panUrl ? (
                      <div
                        onClick={() => setPreviewImage(activeVendor.kyc?.panUrl || null)}
                        className="relative group rounded-xl overflow-hidden border border-gray-200 cursor-pointer h-44 bg-gray-100 sm:w-80"
                      >
                        <img src={activeVendor.kyc.panUrl} alt="PAN Document" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-bold gap-1">
                          <Eye size={16} /> Click to Enlarge
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                        Not Uploaded
                      </div>
                    )}
                  </div>
                </div>

                {/* Business License / FSSAI */}
                {activeVendor.kyc?.licenseUrl && (
                  <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-wider">4. Business License / Certificate</h4>
                      <span className="text-xs font-mono font-bold text-gray-700">
                        {activeVendor.kyc.licenseNumber ? `License: ${activeVendor.kyc.licenseNumber}` : ''}
                      </span>
                    </div>

                    <div
                      onClick={() => setPreviewImage(activeVendor.kyc?.licenseUrl || null)}
                      className="relative group rounded-xl overflow-hidden border border-gray-200 cursor-pointer h-44 bg-gray-100 sm:w-80"
                    >
                      <img src={activeVendor.kyc.licenseUrl} alt="License Document" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-bold gap-1">
                        <Eye size={16} /> Click to Enlarge
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 bg-gray-900 text-white flex justify-between items-center">
              <span className="text-xs font-bold">Document Image Lightbox</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
            <div className="p-4 bg-gray-100 overflow-auto flex items-center justify-center max-h-[80vh]">
              <img src={previewImage} alt="Document" className="max-w-full h-auto rounded-lg shadow-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
