import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Building,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Phone,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  LogOut,
  FolderTree,
  Calendar,
  Layers,
  Activity,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import image3 from '../../assets/image3.png';

export const PaguthiSeyalaalarDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // View state: 'card' (single card dashboard view) or 'detail' (deep-dive Paguthi details & ward directory)
  const [viewMode, setViewMode] = useState('card');

  // Selected ward for deep-dive complaint view
  const [selectedWardForComplaints, setSelectedWardForComplaints] = useState(null);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('all');
  const [wardSearchQuery, setWardSearchQuery] = useState('');

  // Fetch live database dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/paguthi-seyalaalar/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Failed to load Paguthi dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Error loading live database information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <LoadingSpinner text="Loading Live Paguthi Seyalaalar Database Dashboard..." fullScreen />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center p-3 sm:p-4">
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-red-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#A00000] flex items-center justify-center mx-auto border border-red-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Access Restricted / Error</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error || 'Unable to retrieve your Paguthi records.'}</p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-[#850000] text-white text-xs font-bold rounded-xl hover:bg-[#A00000] transition cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { paguthi, stats, wards = [], allComplaints = [] } = data;

  // Filter wards by search query
  const filteredWards = wards.filter((w) => {
    if (!wardSearchQuery.trim()) return true;
    const q = wardSearchQuery.toLowerCase();
    return (
      String(w.wardNumber).includes(q) ||
      (w.wardName || '').toLowerCase().includes(q) ||
      (w.wardSecretary || '').toLowerCase().includes(q) ||
      (w.contactNumber || '').includes(q)
    );
  });

  // Filter complaints for modal/view by status
  const getFilteredWardComplaints = (wardComplaints = []) => {
    if (complaintStatusFilter === 'all') return wardComplaints;
    if (complaintStatusFilter === 'pending') {
      return wardComplaints.filter((c) => ['New', 'Pending', 'Assigned', 'Under Review'].includes(c.status));
    }
    if (complaintStatusFilter === 'in_progress') {
      return wardComplaints.filter((c) => c.status === 'In Progress');
    }
    if (complaintStatusFilter === 'resolved') {
      return wardComplaints.filter((c) => ['Completed', 'Resolved', 'Closed'].includes(c.status));
    }
    return wardComplaints;
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-sans text-slate-800">
      {/* ================= 1. INSTITUTIONAL TOP BAR ================= */}
      <header className="w-full bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] border-b-[3px] border-[#FFD32A] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 shadow-md flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <img
            src={image3}
            alt="TVK Emblem"
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 object-contain drop-shadow-md brightness-105 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-white font-extrabold text-xs sm:text-sm lg:text-base tracking-tight leading-tight truncate">
                {t('header.systemTitle', 'TVK Digital Governance CRM')}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9.5px] lg:text-[10px] font-extrabold bg-[#FFD32A] text-[#850000] uppercase tracking-wider flex-shrink-0">
                Paguthi Seyalaalar
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-[#FFD32A] truncate">
              {paguthi} Paguthi • Kinathukadavu Assembly Constituency
            </p>
          </div>
        </div>

        {/* Right Action: Language + User Profile + Logout */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
          <LanguageSwitcher />

          <div className="hidden md:flex items-center space-x-2 bg-black/25 px-2.5 py-1 rounded-xl border border-white/10 text-white text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFD32A] flex-shrink-0" />
            <div className="text-left leading-tight">
              <span className="font-bold block text-white text-[11px] truncate max-w-[120px]">{user?.name || `${paguthi} Seyalaalar`}</span>
              <span className="text-[9px] text-red-200">@{user?.username}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="px-2.5 sm:px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-[#FFD32A]" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ================= 2. MAIN CONTAINER ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8 space-y-5 sm:space-y-6">
        {/* ================= VIEW MODE 1: SINGLE PAGUTHI CARD VIEW (TASK 2) ================= */}
        {viewMode === 'card' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E9E2DC] shadow-xs relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center space-x-1.5 bg-red-50 text-[#850000] border border-red-200 px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-xs font-bold uppercase tracking-wider mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#850000] animate-pulse"></span>
                  <span>Paguthi Seyalaalar Jurisdiction</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Welcome, <span className="text-[#850000]">{user?.name || `${paguthi} Paguthi Seyalaalar`}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  You are authenticated to manage and monitor localized public grievances, cadre coordination, and municipal ward governance for <strong>{paguthi} Paguthi</strong>. Click your designated Paguthi card below to inspect live database counts, ward directories, and registered complaints.
                </p>
              </div>

              <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-br from-[#FFD32A]/10 to-[#850000]/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* SECTION: ONLY ONE PAGUTHI CARD DISPLAYED (TASK 2) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                    <FolderTree className="w-4 h-4 sm:w-5 sm:h-5 text-[#850000]" />
                    <span>Your Assigned Paguthi Administration</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live dynamic database card scoped strictly to your account
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#850000] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  1 Paguthi Assigned
                </span>
              </div>

              {/* The Single Paguthi Card - Matching Admin Dashboard Paguthi Card Design */}
              <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl border border-[#E9E2DC] shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-[#850000] transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
                  {/* Top Red-Gold Tricolor Accent Bar */}
                  <div className="h-1.5 bg-gradient-to-r from-[#A00000] via-[#FFD32A] to-[#850000]" />

                  <div className="p-4 sm:p-6">
                    {/* Top Row: MapPin Icon + Badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FFF8F0] border border-[#FFE5A3] flex items-center justify-center text-[#850000] shadow-xs group-hover:scale-105 transition">
                        <MapPin className="w-5 h-5 text-[#850000]" />
                      </div>
                      <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase px-2 sm:px-2.5 py-0.5 rounded-full bg-red-50 text-[#850000] border border-red-200">
                        PAGUTHI JURISDICTION
                      </span>
                    </div>

                    {/* Paguthi Title & Subtitle */}
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 sm:mt-4 group-hover:text-[#850000] transition tracking-tight">
                      {paguthi}
                    </h3>
                    <p className="text-xs text-[#850000] font-bold mt-0.5">
                      Paguthi Administration
                    </p>

                    {/* Live Database Statistics Counts */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 text-xs">
                      <div className="bg-[#FFF8F0] p-2.5 sm:p-3 rounded-xl border border-[#FFE5A3]/50">
                        <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-semibold block uppercase tracking-wider">
                          Total Wards
                        </span>
                        <strong className="text-slate-900 font-black text-base sm:text-lg text-[#850000]">
                          {stats.totalWards}
                        </strong>
                      </div>
                      <div className="bg-emerald-50 p-2.5 sm:p-3 rounded-xl border border-emerald-200/60">
                        <span className="text-[10px] sm:text-[10.5px] text-emerald-700 font-semibold block uppercase tracking-wider">
                          Registered Secs
                        </span>
                        <strong className="text-emerald-900 font-black text-base sm:text-lg">
                          {stats.registeredSecretaries}
                        </strong>
                      </div>

                      {/* Complaints Summary */}
                      <div className="col-span-2 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Total Complaints:
                          </span>
                          <span className="font-extrabold text-[#850000] text-sm">{stats.totalComplaints}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[10px] sm:text-[10.5px] text-slate-500 pt-1.5 border-t border-slate-200">
                          <div className="truncate">
                            Pending: <strong className="text-amber-700 font-bold">{stats.pendingComplaints}</strong>
                          </div>
                          <div className="text-center truncate">
                            In Prog: <strong className="text-sky-700 font-bold">{stats.inProgressComplaints}</strong>
                          </div>
                          <div className="text-right truncate">
                            Done: <strong className="text-emerald-700 font-bold">{stats.resolvedComplaints}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Open Paguthi Action Button (Task 2 & 3) */}
                  <div className="p-4 sm:p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('detail')}
                      className="w-full py-2.5 px-3 sm:px-4 bg-[#850000] hover:bg-[#A00000] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#850000]/40"
                    >
                      <span className="truncate">Open Paguthi Details & Ward Directory</span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW MODE 2: PAGUTHI DETAILS & WARD DIRECTORY (TASKS 3, 4, 5) ================= */}
        {viewMode === 'detail' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Breadcrumb Navigation & Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                <button
                  onClick={() => setViewMode('card')}
                  className="hover:text-[#850000] transition cursor-pointer"
                >
                  Dashboard
                </button>
                <span>&gt;</span>
                <span className="text-[#850000] font-bold">{paguthi} Paguthi</span>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('card')}
                className="inline-flex items-center text-xs font-bold text-slate-700 hover:text-[#850000] transition space-x-1.5 cursor-pointer bg-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Single Card View</span>
              </button>
            </div>

            {/* Hero Header Banner (Deep Red & Golden Yellow Theme) */}
            <div className="bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] text-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-md relative overflow-hidden border-b-4 border-[#FFD32A]">
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[#FFD32A] text-[10.5px] sm:text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-[#FFD32A]/30">
                    KKD • SOUTH ZONE
                  </span>
                  <span>•</span>
                  <span>Kinathukadavu Constituency</span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                  {paguthi} <span className="text-[#FFD32A]">Paguthi Administration</span>
                </h1>
                <p className="text-xs sm:text-sm text-red-100 max-w-2xl mt-1.5 leading-relaxed font-medium">
                  Live administrative hierarchy covers all {stats.totalWards} municipal wards, verified Ward Secretaries, localized citizen petitions, and ground-level resolution status.
                </p>
              </div>

              <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#FFD32A]/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* ================= TASK 3: DYNAMIC SUMMARY METRICS CARDS ================= */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {/* Card 1: Total Wards */}
              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9E2DC] shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Total Wards</span>
                  <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#850000] flex-shrink-0" />
                </div>
                <strong className="text-xl sm:text-2xl font-black text-slate-900 block">{stats.totalWards}</strong>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium">Database Wards</span>
              </div>

              {/* Card 2: Total Ward Secretaries */}
              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9E2DC] shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Ward Secs</span>
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                </div>
                <strong className="text-xl sm:text-2xl font-black text-emerald-700 block">{stats.registeredSecretaries}</strong>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium">Active Cadres</span>
              </div>

              {/* Card 3: Total Complaints */}
              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9E2DC] shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Total Issues</span>
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#850000] flex-shrink-0" />
                </div>
                <strong className="text-xl sm:text-2xl font-black text-[#850000] block">{stats.totalComplaints}</strong>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium">Registered</span>
              </div>

              {/* Card 4: Pending Complaints */}
              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9E2DC] shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Pending</span>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
                </div>
                <strong className="text-xl sm:text-2xl font-black text-amber-700 block">{stats.pendingComplaints}</strong>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium">Needs Action</span>
              </div>

              {/* Card 5: In Progress */}
              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9E2DC] shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate">In Progress</span>
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 flex-shrink-0" />
                </div>
                <strong className="text-xl sm:text-2xl font-black text-sky-700 block">{stats.inProgressComplaints}</strong>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium">Work Ongoing</span>
              </div>

              {/* Card 6: Resolved */}
              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9E2DC] shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Resolved</span>
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                </div>
                <strong className="text-xl sm:text-2xl font-black text-emerald-700 block">{stats.resolvedComplaints}</strong>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium">Completed</span>
              </div>
            </div>

            {/* ================= TASK 4: COMPLETE WARD DIRECTORY ================= */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                    <Building className="w-4 h-4 sm:w-5 sm:h-5 text-[#850000]" />
                    <span>Municipal Ward Directory & Governance</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live directory of all {wards.length} wards belonging to {paguthi} Paguthi with assigned secretaries and complaint status
                  </p>
                </div>

                {/* Ward search filter */}
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={wardSearchQuery}
                    onChange={(e) => setWardSearchQuery(e.target.value)}
                    placeholder="Search ward number, name, secretary..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition"
                  />
                </div>
              </div>

              {/* Grid of Wards */}
              {filteredWards.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center text-slate-500 text-xs">
                  No wards found matching "{wardSearchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                  {filteredWards.map((w) => (
                    <div
                      key={w.id}
                      className="bg-white rounded-2xl border border-[#E9E2DC] shadow-2xs hover:shadow-md hover:border-[#850000] transition flex flex-col justify-between overflow-hidden relative"
                    >
                      {/* Top Accent line */}
                      <div className="h-1 bg-gradient-to-r from-[#850000] via-[#FFD32A] to-[#850000]" />

                      <div className="p-3.5 sm:p-4 space-y-3">
                        {/* Ward Number & Zone Badge */}
                        <div className="flex items-start justify-between">
                          <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-black bg-red-50 text-[#850000] border border-red-200">
                            Ward {w.wardNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {w.zone || 'South Zone'}
                          </span>
                        </div>

                        {/* Ward Name */}
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug break-words">
                            {w.wardName}
                          </h3>
                          {w.tamilName && (
                            <p className="text-[11px] text-slate-500 font-semibold mt-0.5 break-words">
                              {w.tamilName}
                            </p>
                          )}
                        </div>

                        {/* Assigned Ward Secretary Info (Task 4) */}
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5 text-xs">
                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 text-[11px]">
                            <span className="text-slate-500 font-medium">Secretary:</span>
                            {w.hasAssignedSecretary ? (
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10.5px] truncate max-w-[160px]">
                                {w.wardSecretary}
                              </span>
                            ) : (
                              <span className="font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full text-[10.5px]">
                                Not Assigned
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 text-[11px]">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" /> Contact:
                            </span>
                            <span className="font-semibold text-slate-700 font-mono text-[10.5px]">
                              {w.contactNumber}
                            </span>
                          </div>
                        </div>

                        {/* Ward Complaint Statistics */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
                          <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200/60">
                            <span className="text-amber-800 block font-semibold truncate">Pending</span>
                            <strong className="text-amber-900 font-black text-xs">
                              {w.stats.pendingComplaints}
                            </strong>
                          </div>
                          <div className="bg-sky-50 p-1.5 rounded-lg border border-sky-200/60">
                            <span className="text-sky-800 block font-semibold truncate">In Prog</span>
                            <strong className="text-sky-900 font-black text-xs">
                              {w.stats.inProgressComplaints}
                            </strong>
                          </div>
                          <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200/60">
                            <span className="text-emerald-800 block font-semibold truncate">Done</span>
                            <strong className="text-emerald-900 font-black text-xs">
                              {w.stats.resolvedComplaints}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Button: Click opens Ward Complaints (Task 4 & 5) */}
                      <div className="p-3.5 sm:p-4 pt-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWardForComplaints(w);
                            setComplaintStatusFilter('all');
                          }}
                          className="w-full py-2 px-3 bg-[#FFF8F0] hover:bg-[#850000] hover:text-white text-[#850000] border border-[#FFE5A3] hover:border-[#850000] text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <span>View Complaints ({w.stats.totalComplaints})</span>
                          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ================= TASK 5: ALL PAGUTHI COMPLAINTS SECTION ================= */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E9E2DC] shadow-xs space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#850000]" />
                    <span>Complete Grievance Tracking Repository ({paguthi} Paguthi)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live grievance records received across all {paguthi} wards from citizen portal
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
                  <button
                    onClick={() => setComplaintStatusFilter('all')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer text-[11px] sm:text-xs ${
                      complaintStatusFilter === 'all'
                        ? 'bg-white text-[#850000] shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({allComplaints.length})
                  </button>
                  <button
                    onClick={() => setComplaintStatusFilter('pending')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer text-[11px] sm:text-xs ${
                      complaintStatusFilter === 'pending'
                        ? 'bg-white text-amber-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending ({stats.pendingComplaints})
                  </button>
                  <button
                    onClick={() => setComplaintStatusFilter('in_progress')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer text-[11px] sm:text-xs ${
                      complaintStatusFilter === 'in_progress'
                        ? 'bg-white text-sky-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    In Progress ({stats.inProgressComplaints})
                  </button>
                  <button
                    onClick={() => setComplaintStatusFilter('resolved')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer text-[11px] sm:text-xs ${
                      complaintStatusFilter === 'resolved'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Resolved ({stats.resolvedComplaints})
                  </button>
                </div>
              </div>

              {/* Complaints List - Responsive Card View on Mobile, Full Table on Desktop */}
              {getFilteredWardComplaints(allComplaints).length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No grievances found matching this status filter.
                </div>
              ) : (
                <>
                  {/* Mobile Cards (Viewports 320px - 767px) */}
                  <div className="block md:hidden space-y-3">
                    {getFilteredWardComplaints(allComplaints).map((c) => {
                      const isResolved = ['Completed', 'Resolved', 'Closed'].includes(c.status);
                      const isInProgress = c.status === 'In Progress';

                      return (
                        <div
                          key={c.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-[#850000] text-xs">
                              {c.issueCode || `GRI-${c.id}`}
                            </span>
                            {isResolved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Resolved
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                                <Activity className="w-3 h-3" /> In Progress
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" /> {c.status || 'Pending'}
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="font-bold text-slate-900 block">{c.title}</span>
                            <span className="text-[11px] text-slate-500 block line-clamp-2 mt-0.5">{c.description}</span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[10.5px] text-slate-500">
                            <div>
                              Ward <strong className="text-slate-800">{c.wardNumber}</strong> •{' '}
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[9.5px]">
                                {c.category || 'General'}
                              </span>
                            </div>
                            <div>
                              {c.citizenName} • {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop / Tablet Table View (Viewports 768px - 1920px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[10.5px] uppercase font-bold tracking-wider">
                          <th className="py-2.5 px-3">Grievance ID</th>
                          <th className="py-2.5 px-3">Ward</th>
                          <th className="py-2.5 px-3">Subject & Details</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Citizen Info</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getFilteredWardComplaints(allComplaints).map((c) => {
                          const isResolved = ['Completed', 'Resolved', 'Closed'].includes(c.status);
                          const isInProgress = c.status === 'In Progress';

                          return (
                            <tr key={c.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-3 font-mono font-bold text-[#850000]">
                                {c.issueCode || `GRI-${c.id}`}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-800">
                                Ward {c.wardNumber}
                              </td>
                              <td className="py-3 px-3 max-w-xs">
                                <span className="font-bold text-slate-900 block truncate">{c.title}</span>
                                <span className="text-[11px] text-slate-500 block truncate">{c.description}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {c.category || 'General'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[11px]">
                                <span className="font-bold text-slate-800 block">{c.citizenName}</span>
                                <span className="text-slate-500 font-mono text-[10px]">{c.citizenMobile}</span>
                              </td>
                              <td className="py-3 px-3 text-[11px] text-slate-600 whitespace-nowrap">
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : '—'}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {isResolved ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" /> Resolved
                                  </span>
                                ) : isInProgress ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                                    <Activity className="w-3 h-3" /> In Progress
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3" /> {c.status || 'Pending'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= WARD COMPLAINTS DEEP-DIVE MODAL (TASKS 4 & 5) ================= */}
        {selectedWardForComplaints && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-gradient-to-r from-[#850000] to-[#A00000] text-white flex items-start justify-between border-b-2 border-[#FFD32A]">
                <div className="min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-[#FFD32A]/30 text-[#FFD32A]">
                      {paguthi} Paguthi
                    </span>
                    <span className="text-white/80">•</span>
                    <span className="text-white/90 font-semibold">{selectedWardForComplaints.zone}</span>
                  </div>
                  <h3 className="text-base sm:text-xl lg:text-2xl font-black mt-1 break-words">
                    Ward {selectedWardForComplaints.wardNumber} - {selectedWardForComplaints.wardName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-red-100">
                    <div>
                      Secretary:{' '}
                      <strong className="text-white">
                        {selectedWardForComplaints.wardSecretary}
                      </strong>
                    </div>
                    <div>
                      Contact:{' '}
                      <strong className="text-[#FFD32A] font-mono">
                        {selectedWardForComplaints.contactNumber}
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWardForComplaints(null)}
                  className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition cursor-pointer flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Tabs inside Modal */}
              <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Grievances ({selectedWardForComplaints.complaints.length})
                </span>

                <div className="flex flex-wrap gap-1 text-xs">
                  {['all', 'pending', 'in_progress', 'resolved'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setComplaintStatusFilter(st)}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold capitalize transition cursor-pointer text-[10.5px] sm:text-[11px] ${
                        complaintStatusFilter === st
                          ? 'bg-[#850000] text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Body: Complaints List */}
              <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-3">
                {getFilteredWardComplaints(selectedWardForComplaints.complaints).length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No complaints registered in this status category for Ward {selectedWardForComplaints.wardNumber}.
                  </div>
                ) : (
                  getFilteredWardComplaints(selectedWardForComplaints.complaints).map((c) => {
                    const isResolved = ['Completed', 'Resolved', 'Closed'].includes(c.status);
                    const isInProgress = c.status === 'In Progress';

                    return (
                      <div
                        key={c.id}
                        className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-[#850000] shadow-2xs transition space-y-2"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-mono font-bold text-[#850000] text-xs">
                              {c.issueCode || `GRI-${c.id}`}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {c.category}
                            </span>
                            <span className="text-[10px] sm:text-[10.5px] text-slate-400">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : ''}
                            </span>
                          </div>

                          {isResolved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Resolved
                            </span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                              <Activity className="w-3 h-3" /> In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> {c.status || 'Pending'}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{c.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed break-words">{c.description}</p>

                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10.5px] sm:text-[11px] text-slate-500 gap-1.5">
                          <div>
                            Citizen: <strong className="text-slate-800">{c.citizenName}</strong> • Phone:{' '}
                            <strong className="text-slate-800 font-mono">{c.citizenMobile}</strong>
                          </div>
                          <div>
                            Location: <span className="font-medium text-slate-700">{c.location}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedWardForComplaints(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaguthiSeyalaalarDashboardPage;
