import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Building,
  Users,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useNotification } from '../../context/NotificationContext';

export const ReportsPage = () => {
  const { t } = useTranslation();
  const { error: notifyError } = useNotification();

  const [reportType, setReportType] = useState('grievances');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { id: 'grievances', label: t('reports.tabGrievances', 'Grievance Redressal Audit'), icon: AlertCircle },
    { id: 'members', label: t('reports.tabMembers', 'TVK Cadre Roster'), icon: Users },
    { id: 'wards', label: t('reports.tabWards', 'Ward Governance Performance'), icon: Building },
    { id: 'departments', label: t('reports.tabDepartments', 'Department Resolution Scorecard'), icon: CheckCircle2 },
    { id: 'projects', label: t('reports.tabProjects', 'District Infrastructure Projects'), icon: Clock },
  ];

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { reportType };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/reports/data', { params });
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      notifyError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleExportExcel = () => {
    window.open(`/api/reports/export/excel?reportType=${reportType}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <AdminPageHeader
        badge={t('reports.headerBadge', 'Official Reporting & Data Export')}
        badgeIcon={FileText}
        title={t('reports.title', 'Governance Reports & Audits')}
        tamilTitle="நிர்வாக அறிக்கைகள் மற்றும் தணிக்கை"
        subtitle={t('reports.subtitle', 'Generate, filter, print, and export verifiable district records across all departments and wards.')}
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2.5 bg-white/95 hover:bg-white text-[#850000] font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-[#A00000]" />
              <span>{t('reports.printReport', 'Print Report')}</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2.5 bg-black/40 hover:bg-black/60 text-white font-bold rounded-xl text-xs shadow-sm transition space-x-1.5 border border-[#FFD32A]/50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#FFD32A]" />
              <span>{t('reports.exportExcel', 'Export Excel')}</span>
            </button>
          </div>
        }
      />

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {reportTypes.map((tab) => {
          const Icon = tab.icon;
          const isSelected = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition flex flex-col justify-between last:col-span-2 min-[480px]:last:col-span-1 ${
                isSelected
                  ? 'bg-red-700 text-white border-red-700 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
              <span className="text-xs font-bold leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter & Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500">{t('reports.startDate', 'From')}:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-red-700"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500">{t('reports.endDate', 'To')}:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-red-700"
            />
          </div>
          <button
            onClick={fetchReport}
            className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl transition"
          >
            {t('reports.applyDateBtn', 'Filter Records')}
          </button>
        </div>

        {reportData && (
          <span className="text-slate-500 font-medium">
            Total Records: <strong>{reportData.records?.length || 0}</strong>
          </span>
        )}
      </div>

      {/* Report Display Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{reportData?.title || 'Report Audit'}</h2>
            <p className="text-xs text-slate-400">
              Tamilaga Vettri Kazhagam • Coimbatore District Governance Portal
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Generated: {new Date().toLocaleDateString()}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner text={t('reports.loadingText', 'Compiling verifiable report...')} />
        ) : !reportData?.records || reportData.records.length === 0 ? (
          <p className="text-center py-12 text-xs text-slate-400">{t('reports.noData', 'No records found for this period.')}</p>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'grievances' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Grievance Code</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Citizen Name</th>
                    <th className="py-3 px-3">Mobile</th>
                    <th className="py-3 px-3">Ward</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700">{r.issueCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{r.category}</td>
                      <td className="py-2.5 px-3">{r.citizenName}</td>
                      <td className="py-2.5 px-3 font-mono">{r.citizenMobile}</td>
                      <td className="py-2.5 px-3">Ward {r.wardId?.wardNumber}</td>
                      <td className="py-2.5 px-3">
                        <PriorityBadge priority={r.priority} />
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'members' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Member ID</th>
                    <th className="py-3 px-3">Full Name</th>
                    <th className="py-3 px-3">Gender</th>
                    <th className="py-3 px-3">Mobile Number</th>
                    <th className="py-3 px-3">Ward</th>
                    <th className="py-3 px-3">Designation</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.records.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700">{m.memberId}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{m.fullName}</td>
                      <td className="py-2.5 px-3">{m.gender}</td>
                      <td className="py-2.5 px-3 font-mono">{m.mobileNumber}</td>
                      <td className="py-2.5 px-3">Ward {m.wardId?.wardNumber}</td>
                      <td className="py-2.5 px-3">{m.designation}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'wards' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Ward</th>
                    <th className="py-3 px-3">Zone</th>
                    <th className="py-3 px-3">Constituency</th>
                    <th className="py-3 px-3">Total Issues</th>
                    <th className="py-3 px-3">Resolved</th>
                    <th className="py-3 px-3">Pending</th>
                    <th className="py-3 px-3">TVK Cadre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.records.map((w, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        Ward {w.wardNumber} - {w.wardName}
                      </td>
                      <td className="py-2.5 px-3">{w.zone}</td>
                      <td className="py-2.5 px-3">{w.constituency}</td>
                      <td className="py-2.5 px-3 font-bold text-red-700">{w.totalIssues}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">{w.resolvedIssues}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-600">{w.pendingIssues}</td>
                      <td className="py-2.5 px-3">{w.totalMembers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'departments' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Total Referred</th>
                    <th className="py-3 px-3">Resolved</th>
                    <th className="py-3 px-3">Pending Action</th>
                    <th className="py-3 px-3">Officers Mapped</th>
                    <th className="py-3 px-3">Efficiency Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.records.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{d.department}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-700">{d.totalIssues}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">{d.resolvedIssues}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-600">{d.pendingIssues}</td>
                      <td className="py-2.5 px-3">{d.officersCount}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-emerald-700">{d.resolutionRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'projects' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Initiative Title</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Progress</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.records.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700">{p.projectCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{p.title}</td>
                      <td className="py-2.5 px-3">{p.location}</td>
                      <td className="py-2.5 px-3">{p.department}</td>
                      <td className="py-2.5 px-3 font-bold text-red-700">{p.progressPercentage}%</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
