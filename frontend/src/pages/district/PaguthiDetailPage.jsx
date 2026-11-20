import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  MapPin,
  Users,
  AlertCircle,
  Building2,
  ChevronRight,
  Plus,
  Edit,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';

export const PaguthiDetailPage = () => {
  const { id, paguthiName } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [wardForm, setWardForm] = useState({
    wardNumber: '',
    wardName: '',
    tamilName: '',
    wardSecretary: '',
    contactNumber: '',
    population: '',
    areaCoverage: '',
  });

  const fetchPaguthiData = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/districts/constituencies/${id}/paguthi/${encodeURIComponent(paguthiName)}`
      );
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load Paguthi details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaguthiData();
  }, [id, paguthiName]);

  const handleAddWardSubmit = async (e) => {
    e.preventDefault();
    if (!wardForm.wardNumber || !wardForm.wardName) {
      notifyError('Please enter ward number and name');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...wardForm,
        constituencyId: id,
        paguthi: paguthiName,
        wardNumber: parseInt(wardForm.wardNumber, 10),
        officeBearer: wardForm.wardSecretary,
      };

      const res = await api.post('/districts/wards', payload);
      if (res.data.success) {
        notifySuccess(`Ward ${wardForm.wardNumber} successfully added to ${paguthiName}!`);
        setIsAddWardModalOpen(false);
        setWardForm({
          wardNumber: '',
          wardName: '',
          tamilName: '',
          wardSecretary: '',
          contactNumber: '',
          population: '',
          areaCoverage: '',
        });
        fetchPaguthiData();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || 'Failed to map ward to this Paguthi. Check for duplicates.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text={t('paguthi.loadingText', 'Loading Paguthi Details & Ward Hierarchy...')} />;
  if (!data) return <p className="text-center py-12 text-slate-500">{t('paguthi.notFound', 'Paguthi not found.')}</p>;

  const { constituency, paguthi, stats, wards = [], issues = [] } = data;
  const constituencyDisplayName = isTa && constituency.tamilName ? constituency.tamilName : constituency.name;

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <Link to="/admin/dashboard" className="hover:text-[#A00000] transition">{t('breadcrumbs.home', 'Home')}</Link>
        <span>&gt;</span>
        <Link to="/admin/district" className="hover:text-[#A00000] transition">{t('breadcrumbs.district', 'Coimbatore District')}</Link>
        <span>&gt;</span>
        <Link to={`/admin/district/constituencies/${constituency._id}`} className="hover:text-[#A00000] transition">
          {constituencyDisplayName}
        </Link>
        <span>&gt;</span>
        <span className="text-[#A00000] font-bold">{paguthi}</span>
      </div>

      <button
        onClick={() => navigate(`/admin/district/constituencies/${constituency._id}`)}
        className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-[#A00000] transition space-x-1 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('paguthi.backToConstituency', { name: constituencyDisplayName, defaultValue: `Back to ${constituencyDisplayName} Constituency` })}</span>
      </button>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden border-b-4 border-[#FFD32A]">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-[#FFD32A] text-xs font-bold uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4" />
            <span>{constituencyDisplayName} {t('constituency.assemblyConstituency', 'Assembly Constituency')}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {paguthi}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#FFD32A] mt-0.5">
            {t('constituency.paguthiAdminTitle', 'Paguthi Administration')}
          </p>

          <p className="text-xs sm:text-sm text-red-100 max-w-2xl mt-2 leading-relaxed font-medium">
            {t('paguthi.subtitle', 'Jurisdiction covering designated Municipal Wards, TVK grassroots cadre units, and local civic grievance redressal.')}
          </p>

          {/* Actual database statistics */}
          <div className="grid grid-cols-2 min-[480px]:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-2.5 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/20">
            <div className="bg-black/20 p-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-red-200 uppercase font-semibold truncate">{t('constituency.totalWards', 'Total Wards')}</p>
              <p className="text-lg sm:text-xl font-black text-[#FFD32A] mt-0.5">{stats.totalWards}</p>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-emerald-200 uppercase font-semibold truncate">Registered Secs</p>
              <p className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">{stats.registeredSecretaries || 0}</p>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-red-200 uppercase font-semibold truncate">{t('ward.kpiTotalIssues', 'Total Complaints')}</p>
              <p className="text-lg sm:text-xl font-black text-white mt-0.5">{stats.totalComplaints}</p>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-blue-200 uppercase font-semibold truncate">New</p>
              <p className="text-lg sm:text-xl font-black text-blue-300 mt-0.5">{stats.newComplaints || 0}</p>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-amber-200 uppercase font-semibold truncate">{t('common.pending', 'Pending')}</p>
              <p className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">{stats.pendingComplaints || 0}</p>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-sky-200 uppercase font-semibold truncate">In Progress</p>
              <p className="text-lg sm:text-xl font-black text-sky-300 mt-0.5">{stats.inProgressComplaints || 0}</p>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-emerald-300 uppercase font-semibold truncate">Completed</p>
              <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">{stats.completedComplaints || stats.resolvedComplaints || 0}</p>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/10">
              <p className="text-[10px] text-rose-200 uppercase font-semibold truncate">Unassigned</p>
              <p className="text-lg sm:text-xl font-black text-rose-300 mt-0.5">{stats.unassignedComplaints || 0}</p>
            </div>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#FFD32A]/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* ================= WARD ADMINISTRATION SECTION ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#252525] flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#A00000]" />
              <span>{t('districtHierarchy.wardAdmin', 'Ward Administration')}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {t('paguthi.wardsInPaguthiSub', 'Localized ward governance, TVK ward secretaries, and civic complaint tracking')}
            </p>
          </div>

          {/* Admin Action: Add Ward to Paguthi */}
          <button
            type="button"
            onClick={() => setIsAddWardModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#A00000] hover:bg-[#850000] text-white text-xs font-bold rounded-xl transition shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('paguthi.addWardBtn', 'Map New Ward to Paguthi')}</span>
          </button>
        </div>

        {/* WARD CARDS GRID */}
        {wards.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <p className="text-slate-500 text-sm">{t('district.noWards', `No municipal wards currently mapped to ${paguthi}.`)}</p>
            <button
              onClick={() => setIsAddWardModalOpen(true)}
              className="mt-3 px-4 py-2 bg-[#A00000] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {t('district.addNewWard', 'Add Ward')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wards.map((w) => (
              <div
                key={w._id}
                className="bg-white rounded-2xl border border-[#E9E2DC] shadow-xs hover:shadow-md hover:border-[#A00000] transition-all duration-200 flex flex-col justify-between overflow-hidden relative"
              >
                <div className="h-1 bg-[#A00000]"></div>
                
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#A00000] bg-[#FFF0F0] border border-red-200 px-2.5 py-0.5 rounded-lg">
                      {t('district.wardLabel', 'Ward')} {w.wardNumber}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {paguthi} {t('common.paguthi', 'Paguthi')}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-2">
                    {w.wardName}
                  </h3>
                  {w.tamilName && (
                    <p className="text-xs text-slate-500 font-medium">{w.tamilName}</p>
                  )}

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t('ward.secretaryName', 'Ward Secretary')}:</span>
                      <strong className="text-slate-900 font-semibold">{w.wardSecretary || t('common.unassigned', 'Unassigned')}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Secretary Status:</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          w.wardSecretaryRegistrationStatus === 'Registered'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {w.wardSecretaryRegistrationStatus === 'Registered' ? 'Registered' : 'Unassigned'}
                      </span>
                    </div>
                    {w.contactNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{t('district.contactLabel', 'Contact')}:</span>
                        <span className="font-mono text-slate-700">{w.contactNumber}</span>
                      </div>
                    )}
                    {w.areaCoverage && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 pt-1">
                        {w.areaCoverage}
                      </p>
                    )}
                  </div>

                  {/* Ward KPI Stats */}
                  <div className="grid grid-cols-5 gap-1 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-1 rounded-lg border border-slate-200">
                      <span className="text-[9px] text-slate-500 block truncate">Total</span>
                      <strong className="text-slate-900 font-bold text-xs">{w.totalComplaints || 0}</strong>
                    </div>
                    <div className="bg-blue-50 p-1 rounded-lg border border-blue-200/60">
                      <span className="text-[9px] text-blue-700 block truncate">New</span>
                      <strong className="text-blue-800 font-bold text-xs">{w.newComplaints || 0}</strong>
                    </div>
                    <div className="bg-amber-50 p-1 rounded-lg border border-amber-200/60">
                      <span className="text-[9px] text-amber-700 block truncate">{t('common.pending', 'Pending')}</span>
                      <strong className="text-amber-800 font-bold text-xs">{w.pendingComplaints || 0}</strong>
                    </div>
                    <div className="bg-sky-50 p-1 rounded-lg border border-sky-200/60">
                      <span className="text-[9px] text-sky-700 block truncate">In Prog</span>
                      <strong className="text-sky-800 font-bold text-xs">{w.inProgressComplaints || 0}</strong>
                    </div>
                    <div className="bg-emerald-50 p-1 rounded-lg border border-emerald-200/60">
                      <span className="text-[9px] text-emerald-700 block truncate">Done</span>
                      <strong className="text-emerald-800 font-bold text-xs">{w.completedComplaints || w.resolvedComplaints || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* View Ward Button */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/district/wards/${w._id}`)}
                    className="w-full py-2 px-3 bg-[#A00000] hover:bg-[#850000] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>{t('districtHierarchy.viewWard', 'View Ward')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= PAGUTHI COMPLAINTS SECTION ================= */}
      <div className="bg-white rounded-3xl p-6 border border-[#E9E2DC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#252525] flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-[#A00000]" />
              <span>{paguthi} Grievances & Complaints ({issues.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Complaints registered under {paguthi} Paguthi across its municipal wards
            </p>
          </div>
          <span className="text-xs font-bold text-[#A00000] bg-[#FFF0F0] border border-red-200 px-3 py-1 rounded-full self-start sm:self-auto">
            {stats.totalComplaints || 0} Total in MySQL
          </span>
        </div>

        {issues.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No complaints registered in {paguthi} yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#FFF8F0] text-[11px] font-extrabold uppercase text-[#A00000] border-b border-[#FFE5A3]">
                <tr>
                  <th className="py-3 px-3">Complaint ID</th>
                  <th className="py-3 px-3">Citizen</th>
                  <th className="py-3 px-3">Ward</th>
                  <th className="py-3 px-3">Title / Category</th>
                  <th className="py-3 px-3">Assigned Secretary</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {issues.map((iss) => (
                  <tr key={iss._id || iss.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-red-900">
                      {iss.issueCode || iss.complaintId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{iss.citizenName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{iss.citizenMobile}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">
                        Ward {iss.wardNumber || iss.ward?.wardNumber || '-'}
                      </span>
                      <div className="text-[10.5px] text-slate-400 truncate max-w-[120px]">
                        {iss.wardName || iss.ward?.wardName || ''}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">{iss.title}</div>
                      <div className="text-[10.5px] text-slate-400">{iss.category}</div>
                    </td>
                    <td className="py-3 px-3">
                      {iss.assignedWardSecretary ? (
                        <div className="text-emerald-700 font-bold">
                          {iss.assignedWardSecretary.name || iss.assignedWardSecretary.username}
                        </div>
                      ) : (
                        <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          iss.status === 'Completed' || iss.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : iss.status === 'In Progress'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : iss.status === 'New'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {iss.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/admin/complaints/${iss._id || iss.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-[#A00000] hover:text-white text-slate-700 rounded-lg text-[11px] font-bold transition"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD WARD TO PAGUTHI ================= */}
      {isAddWardModalOpen && (
        <Modal
          isOpen={isAddWardModalOpen}
          onClose={() => setIsAddWardModalOpen(false)}
          title={t('paguthi.modalTitle', { name: paguthi, defaultValue: `Add / Map Ward to ${paguthi} Paguthi` })}
          subtitle={t('paguthi.modalSubtitle', 'Assign a new municipal ward to this administrative Paguthi')}
        >
          <form onSubmit={handleAddWardSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('district.wardNumberRequired', 'Ward Number *')}
                </label>
                <input
                  type="number"
                  required
                  value={wardForm.wardNumber}
                  onChange={(e) => setWardForm({ ...wardForm, wardNumber: e.target.value })}
                  placeholder="e.g. 101"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#A00000]/20 focus:border-[#A00000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('district.wardNameRequired', 'Ward Name (English) *')}
                </label>
                <input
                  type="text"
                  required
                  value={wardForm.wardName}
                  onChange={(e) => setWardForm({ ...wardForm, wardName: e.target.value })}
                  placeholder="e.g. Pothanur West"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#A00000]/20 focus:border-[#A00000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('district.tamilNameLabel', 'Tamil Name (Optional)')}
              </label>
              <input
                type="text"
                value={wardForm.tamilName}
                onChange={(e) => setWardForm({ ...wardForm, tamilName: e.target.value })}
                placeholder="e.g. போத்தனூர் மேற்கு"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#A00000]/20 focus:border-[#A00000]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('district.officeBearerSecretaryLabel', 'Designated Ward Secretary *')}
                </label>
                <input
                  type="text"
                  required
                  value={wardForm.wardSecretary}
                  onChange={(e) => setWardForm({ ...wardForm, wardSecretary: e.target.value })}
                  placeholder="e.g. K. R. Vijayakumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#A00000]/20 focus:border-[#A00000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('members.mobileRequired', 'Contact Mobile Number *')}
                </label>
                <input
                  type="text"
                  required
                  value={wardForm.contactNumber}
                  onChange={(e) => setWardForm({ ...wardForm, contactNumber: e.target.value })}
                  placeholder="e.g. 9842100098"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#A00000]/20 focus:border-[#A00000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('district.areaCoverageLabel', 'Area Coverage & Major Streets')}
              </label>
              <textarea
                rows="2"
                value={wardForm.areaCoverage}
                onChange={(e) => setWardForm({ ...wardForm, areaCoverage: e.target.value })}
                placeholder={t('district.areaCoveragePlaceholder', 'e.g. Chettipalayam Road, Station Road, Anna Nagar')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#A00000]/20 focus:border-[#A00000]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddWardModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#A00000] hover:bg-[#850000] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
              >
                {isSubmitting ? t('common.submitting', 'Saving...') : t('paguthi.addWardBtn', 'Add Ward to Paguthi')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PaguthiDetailPage;
