import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import AdminPageHeader from '../../components/common/AdminPageHeader';

export const AnalyticsPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = { period };
      if (period === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const res = await api.get('/analytics', { params });
      if (res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load executive analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const COLORS = ['#991b1b', '#d97706', '#2563eb', '#059669', '#7c3aed', '#db2777', '#0891b2', '#4b5563'];

  if (loading && !analyticsData) {
    return <LoadingSpinner fullScreen text={t('analytics.loadingText', 'Crunching Coimbatore District Analytics...')} />;
  }

  const summary = analyticsData?.summary || {};
  const categoryStats = analyticsData?.categoryStats || [];
  const departmentStats = analyticsData?.departmentStats || [];
  const constituencyStats = analyticsData?.constituencyStats || [];
  const wardStats = analyticsData?.wardStats || [];
  const monthlyTrends = analyticsData?.monthlyTrends || [];

  const getPeriodLabel = (p) => {
    switch (p) {
      case 'today': return t('analytics.periodToday', 'Today');
      case 'this_week': return t('analytics.periodThisWeek', 'This Week');
      case 'this_month': return t('analytics.periodThisMonth', 'This Month');
      case 'this_year': return t('analytics.periodThisYear', 'This Year');
      case 'custom': return t('analytics.periodCustom', 'Custom');
      default: return p.replace('_', ' ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Filter Bar */}
      <AdminPageHeader
        badge={t('analytics.headerBadge', 'District Intelligence & Metrics')}
        badgeIcon={BarChart3}
        title={t('analytics.title', 'Executive Analytics Dashboard')}
        tamilTitle="நிர்வாக பகுப்பாய்வு கட்டுப்பாட்டு மையம்"
        subtitle={t('analytics.subtitle', 'Real-time multi-dimensional assessment of Coimbatore grievance resolution, cadre density and ward capacity.')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {['today', 'this_week', 'this_month', 'this_year', 'custom'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                  period === p
                    ? 'bg-[#FFD32A] text-[#850000] shadow-md font-black'
                    : 'bg-black/30 text-white hover:bg-black/50 border border-white/20'
                }`}
              >
                {getPeriodLabel(p)}
              </button>
            ))}
          </div>
        }
      />

      {/* Custom Date Range Picker if Custom Selected */}
      {period === 'custom' && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">{t('analytics.startDate', 'Start Date')}</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-red-700"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">{t('analytics.endDate', 'End Date')}</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-red-700"
            />
          </div>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl transition"
          >
            {t('analytics.applyFilter', 'Apply Filter')}
          </button>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title={t('analytics.statTotal', 'Total in Period')}
          value={summary.totalGrievances}
          icon={AlertCircle}
          colorScheme="crimson"
          subtitle={t('analytics.statTotalSub', 'Reported petitions')}
        />
        <StatCard
          title={t('analytics.statResolved', 'Resolved')}
          value={summary.resolvedGrievances}
          icon={CheckCircle2}
          colorScheme="green"
          subtitle={t('analytics.statResolvedSub', { rate: summary.resolutionRate, defaultValue: `${summary.resolutionRate}% closure rate` })}
        />
        <StatCard
          title={t('analytics.statInProgress', 'In Progress')}
          value={summary.inProgressGrievances}
          icon={Clock}
          colorScheme="blue"
          subtitle={t('analytics.statInProgressSub', 'Active field work')}
        />
        <StatCard
          title={t('analytics.statPending', 'Pending Action')}
          value={summary.pendingGrievances}
          icon={Clock}
          colorScheme="orange"
          subtitle={t('analytics.statPendingSub', 'Awaiting officer review')}
        />
      </div>

      {/* 2-Column Charts: Trends (Area Chart) & Category Breakdown (Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t('analytics.chartMonthlyTrend', 'Grievance Flow & Resolution Trend')}</h3>
              <p className="text-xs text-slate-400">{t('analytics.chartMonthlyTrendSub', 'Monthly reported cases vs completed closures')}</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#991b1b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#991b1b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="reported" name={t('analytics.reportedComplaints', 'Reported Complaints')} stroke="#991b1b" strokeWidth={2.5} fill="url(#areaReported)" />
                <Area type="monotone" dataKey="resolved" name={t('analytics.resolvedPetitions', 'Resolved Petitions')} stroke="#059669" strokeWidth={2.5} fill="url(#areaResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Donut Chart (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('analytics.chartCategoryShare', 'Category Share')}</h3>
            <p className="text-xs text-slate-400 mb-4">{t('analytics.chartCategoryShareSub', 'Percentage breakdown by issue domain')}</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-100">
            {categoryStats.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center space-x-1.5 truncate">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="truncate text-slate-600 font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Charts: Ward Performance & Department Redressal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Grievance Ranking Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">{t('analytics.chartWardRank', 'Ward Grievance Load (Top 8)')}</h3>
          <p className="text-xs text-slate-400 mb-4">{t('analytics.chartWardRankSub', 'Total petitions vs resolved count by municipal ward')}</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="wardName" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalIssues" name={t('analytics.totalIssuesBar', 'Total Issues')} fill="#991b1b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="resolved" name={t('analytics.resolvedBar', 'Resolved')} fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Redressal Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">{t('analytics.chartDeptAllocation', 'Department Redressal Allocation')}</h3>
          <p className="text-xs text-slate-400 mb-4">{t('analytics.chartDeptAllocationSub', 'Complaints referred to TWAD, TANGEDCO, Highways, and Corporation')}</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="total" name={t('analytics.totalAssignedBar', 'Total Assigned')} fill="#2563eb" radius={[0, 6, 6, 0]} />
                <Bar dataKey="resolved" name={t('analytics.resolvedBar', 'Resolved')} fill="#059669" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
