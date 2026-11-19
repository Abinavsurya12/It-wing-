import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Users,
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
  FileText,
  MapPin,
  ShieldCheck,
  Download,
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import StatCard from '../../components/common/StatCard';
import * as XLSX from 'xlsx';

export const WardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const [loading, setLoading] = useState(true);
  const [wardData, setWardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchWard = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/districts/wards/${id}`);
        if (res.data.success) {
          setWardData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load ward details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWard();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading Ward Governance Dashboard..." />;
  if (!wardData) return <p className="text-center py-12 text-slate-500">Ward not found.</p>;

  const { ward, membersKpi, issuesKpi, members = [], issues = [] } = wardData;

  const constituencyName = ward.constituencyId?.name || 'Kinathukadavu';
  const paguthiName = ward.paguthi || 'Pothanur';

  const downloadWardReportExcel = () => {
    const rows = issues.map((i) => ({
      'Issue Code': i.issueCode,
      'Title': i.title,
      'Category': i.category,
      'Priority': i.priority,
      'Status': i.status,
      'Citizen Name': i.citizenName,
      'Citizen Mobile': i.citizenMobile,
      'Location': i.location || i.citizenAddress,
      'Work Started': i.workStartedAt ? new Date(i.workStartedAt).toLocaleString() : 'Not Started',
      'Resolved At': i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : 'Pending',
      'Final Report': i.finalReport || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Ward_${ward.wardNumber}_Report`);
    XLSX.writeFile(wb, `TVK_Ward_${ward.wardNumber}_Report.xlsx`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ================= BREADCRUMB NAVIGATION (PART 8) ================= */}
      <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link to="/admin/dashboard" className="hover:text-[#A00000] transition">{t('breadcrumbs.home', 'Home')}</Link>
        <span>&gt;</span>
        <Link to="/admin/district" className="hover:text-[#A00000] transition">{t('breadcrumbs.district', 'Coimbatore District')}</Link>
        <span>&gt;</span>
        <Link
          to={`/admin/district/constituencies/${ward.constituencyId?._id || ''}`}
          className="hover:text-[#A00000] transition"
        >
          {constituencyName}
        </Link>
        <span>&gt;</span>
        <Link
          to={`/admin/district/constituencies/${ward.constituencyId?._id || ''}/paguthi/${encodeURIComponent(paguthiName)}`}
          className="hover:text-[#A00000] transition"
        >
          {paguthiName}
        </Link>
        <span>&gt;</span>
        <span className="text-[#A00000] font-bold">{t('district.wardLabel', 'Ward')} {ward.wardNumber} {t('common.details', 'Details')}</span>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-[#A00000] transition space-x-1 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common.back', 'Back')}</span>
      </button>

      {/* Ward Dashboard Banner */}
      <div className="bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden border-b-4 border-[#FFD32A]">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-[#FFD32A] text-xs font-bold uppercase tracking-wider mb-2">
            <span>{t('ward.headerBadge', 'Ward Governance Dashboard')}</span>
            <span>•</span>
            <span>{constituencyName}</span>
            <span>•</span>
            <span className="bg-black/30 px-2.5 py-0.5 rounded text-white border border-white/20">
              {paguthiName} {t('common.paguthi', 'Paguthi')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('district.wardLabel', 'Ward')} {ward.wardNumber} - {isTa && ward.tamilName ? ward.tamilName : ward.wardName}
          </h1>

          <p className="text-xs sm:text-sm text-red-100 max-w-2xl mt-2 leading-relaxed font-medium">
            {ward.areaCoverage || t('ward.subtitle', 'Comprehensive municipal ward territory coverage, cadre mobilization, and citizen grievance redressal.')}
          </p>

          <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap gap-3 text-xs">
            <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10 font-medium">
              {t('district.adminZoneLabel', 'Zone')}: <strong className="text-white">{ward.zone}</strong>
            </span>
            <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10 font-medium">
              {t('ward.secretaryName', 'Assigned Ward Secretary')}: <strong className="text-[#FFD32A]">{ward.wardSecretary || ward.officeBearer || t('ward.unassignedSecretary', 'To be designated')}</strong>
            </span>
            {ward.contactNumber && (
              <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10 font-medium">
                {t('district.contactLabel', 'Contact')}: <strong className="text-white">{ward.contactNumber}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#FFD32A]/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title={t('ward.kpiTotalCadres', 'Total Cadre Members')}
          value={membersKpi?.totalMembers || members.length}
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title={t('ward.kpiTotalIssues', 'Total Complaints')}
          value={issuesKpi?.totalIssues || issues.length}
          icon={AlertCircle}
          colorScheme="crimson"
        />
        <StatCard
          title={t('common.inProgress', 'In Progress')}
          value={issuesKpi?.inProgressIssues || 0}
          icon={Clock}
          colorScheme="orange"
        />
        <StatCard
          title={t('common.resolved', 'Resolved')}
          value={issuesKpi?.closedIssues || 0}
          icon={CheckCircle2}
          colorScheme="green"
        />
      </div>

      {/* ================= 5 TABS NAVIGATION (PART 8) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap gap-2">
        {[
          { key: 'overview', label: `1. ${t('ward.tabOverview', 'Overview')}` },
          { key: 'members', label: `2. ${t('members.title', 'Members')} (${members.length})` },
          { key: 'complaints', label: `3. ${t('ward.tabIssues', 'Complaints')} (${issues.length})` },
          { key: 'secretary', label: `4. ${t('ward.secretaryName', 'Ward Secretary')}` },
          { key: 'reports', label: `5. ${t('breadcrumbs.reports', 'Reports & Analytics')}` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#A00000] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#252525]">{t('ward.areaCoverageTitle', 'Territory & Demographics')}</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('district.wardLabel', 'Ward')} {t('common.number', 'Number')}:</span>
                <strong className="text-slate-900 font-bold">{ward.wardNumber}</strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('district.wardLabel', 'Ward')} {t('common.name', 'Name')}:</span>
                <strong className="text-slate-900 font-bold">{isTa && ward.tamilName ? ward.tamilName : ward.wardName}</strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('constituency.paguthiAdminTitle', 'Paguthi Administration')}:</span>
                <strong className="text-[#A00000] font-bold">{paguthiName}</strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('district.assemblyConstituencyTitle', 'Assembly Constituency')}:</span>
                <strong className="text-slate-900 font-bold">{constituencyName}</strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('ward.populationEstimate', 'Estimated Population')}:</span>
                <strong className="text-slate-900 font-bold">{(ward.population || 38500).toLocaleString()}</strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('district.areaCoverageLabel', 'Area Coverage')}:</span>
                <strong className="text-slate-900 font-medium text-right max-w-xs">{ward.areaCoverage}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#252525]">{t('dashboard.kpiTitle', 'Cadre & Grievance Summary')}</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('members.statMaleCadres', 'Male Members')}:</span>
                <strong className="text-slate-900 font-bold">{membersKpi?.maleMembers || 0}</strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('members.statFemaleCadres', 'Female Members')}:</span>
                <strong className="text-slate-900 font-bold">{membersKpi?.femaleMembers || 0}</strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('members.statOfficeBearers', 'Office Bearers')}:</span>
                <strong className="text-slate-900 font-bold">{membersKpi?.officeBearers || 0}</strong>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('common.pending', 'Pending Complaints')}:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {issuesKpi?.pendingIssues || 0}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('common.inProgress', 'In Progress')}:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {issuesKpi?.inProgressIssues || 0}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">{t('common.resolved', 'Resolved Complaints')}:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {issuesKpi?.closedIssues || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#252525]">{t('ward.wardCadresRoster', 'Ward Cadre Members Directory')}</h3>
              <p className="text-xs text-slate-400">Total {members.length} registered members in Ward {ward.wardNumber}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F0] border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t('members.colMemberId', 'Member ID')}</th>
                  <th className="py-3 px-4">{t('members.colMemberName', 'Name')}</th>
                  <th className="py-3 px-4">{t('members.colDesignation', 'Designation')}</th>
                  <th className="py-3 px-4">{t('members.colGender', 'Gender')}</th>
                  <th className="py-3 px-4">{t('members.colMobile', 'Mobile')}</th>
                  <th className="py-3 px-4">{t('members.colStatus', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      {t('dataTable.noRecords', 'No members registered in this ward yet.')}
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A00000]">{m.memberId}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{m.fullName}</td>
                      <td className="py-3 px-4">{m.designation || t('members.activeCadre', 'Active Member')}</td>
                      <td className="py-3 px-4">{m.gender ? t(`members.${m.gender.toLowerCase()}`, m.gender) : '-'}</td>
                      <td className="py-3 px-4 font-mono">{m.mobileNumber}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={m.status || 'Active'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#252525]">{t('ward.recentWardIssues', 'Ward Grievances & Complaints')}</h3>
              <p className="text-xs text-slate-400">Live citizen grievance records assigned to Ward {ward.wardNumber}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigate(`/admin/complaints-reported?ward=${ward.wardNumber}`)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 text-[#850000] border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                title={`Open Ward ${ward.wardNumber} in Complaints Reported`}
              >
                <span>Complaints Reported</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={downloadWardReportExcel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FFD32A]" />
                <span>{t('common.exportExcel', 'Export Excel')}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F0] border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t('issues.colIssueId', 'Code')}</th>
                  <th className="py-3 px-4">{t('common.title', 'Title')}</th>
                  <th className="py-3 px-4">{t('issues.colCategory', 'Category')}</th>
                  <th className="py-3 px-4">{t('issues.colPriority', 'Priority')}</th>
                  <th className="py-3 px-4">{t('issues.colCitizen', 'Citizen')}</th>
                  <th className="py-3 px-4">{t('issues.colStatus', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      {t('dataTable.noRecords', 'No complaints registered in this ward yet.')}
                    </td>
                  </tr>
                ) : (
                  issues.map((i) => (
                    <tr key={i._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A00000]">{i.issueCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 max-w-xs">{i.title}</td>
                      <td className="py-3 px-4">{i.category}</td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={i.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-800">{i.citizenName}</p>
                          <p className="text-[11px] font-mono text-slate-500">{i.citizenMobile}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={i.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WARD SECRETARY */}
      {activeTab === 'secretary' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs max-w-2xl space-y-4">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8F0] border border-[#FFE5A3] flex items-center justify-center text-[#A00000] font-black text-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {ward.wardSecretary || ward.officeBearer || t('ward.unassignedSecretary', 'To be designated')}
              </h3>
              <p className="text-xs text-[#850000] font-bold">
                {t('ward.secretaryDetailsTitle', 'Ward Secretary')} – {t('district.wardLabel', 'Ward')} {ward.wardNumber} ({paguthiName} {t('common.paguthi', 'Paguthi')})
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">{t('district.contactLabel', 'Contact Number')}:</span>
              <strong className="text-slate-900 font-mono font-bold">{ward.contactNumber || t('common.none', 'Not Provided')}</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">{t('district.adminZoneLabel', 'Administrative Zone')}:</span>
              <strong className="text-slate-900 font-bold">{ward.zone}</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">{t('district.assemblyConstituencyTitle', 'Constituency')}:</span>
              <strong className="text-slate-900 font-bold">{constituencyName}</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">{t('constituency.paguthiAdminTitle', 'Assigned Paguthi')}:</span>
              <strong className="text-[#A00000] font-bold">{paguthiName}</strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#252525]">{t('breadcrumbs.reports', 'Ward Performance & Reports')}</h3>
              <p className="text-xs text-slate-400">{t('reports.subtitle', 'Download administrative dossiers and grievance records')}</p>
            </div>
            <button
              onClick={downloadWardReportExcel}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#A00000] text-white rounded-xl text-xs font-bold hover:bg-[#850000] transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#FFD32A]" />
              <span>{t('common.downloadExcel', 'Download Excel Report')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#FFE5A3]">
              <span className="text-xs text-slate-600 block">{t('ward.kpiResolutionRate', 'Resolution Rate')}</span>
              <p className="text-2xl font-black text-[#A00000] mt-1">
                {issues.length > 0 ? Math.round(((issuesKpi?.closedIssues || 0) / issues.length) * 100) : 100}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-600 block">{t('ward.kpiTotalCadres', 'Active TVK Cadre')}</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{members.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-600 block">{t('common.pending', 'Pending Inquiries')}</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{issuesKpi?.pendingIssues || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardDetailPage;
