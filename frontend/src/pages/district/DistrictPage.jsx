import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminPageHeader from '../../components/common/AdminPageHeader';

export const DistrictPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const [loading, setLoading] = useState(true);
  const [districtData, setDistrictData] = useState(null);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [distRes, constRes, wardsRes] = await Promise.all([
        api.get('/districts'),
        api.get('/districts/constituencies'),
        api.get('/districts/wards'),
      ]);

      if (distRes.data.success) setDistrictData(distRes.data.data);
      if (constRes.data.success) setConstituencies(constRes.data.data);
      if (wardsRes.data.success) setWards(wardsRes.data.data);
    } catch (err) {
      console.error('Failed to load district data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner text={t('district.loadingText', 'Loading Coimbatore District Hierarchy...')} />;
  }

  // Target exclusively Kinathukadavu constituency card
  const kinathukadavu = constituencies.find(
    (c) => c.name?.toLowerCase().includes('kinathu') || c.code === 'KKD' || c.code === 'KIN'
  ) || constituencies[0] || {
    _id: 'kinathukadavu',
    name: 'Kinathukadavu',
    category: 'Assembly Constituency',
    tamilName: 'கிணத்துக்கடவு',
    code: 'KKD',
    totalPaguthi: 12,
    wardCount: 8,
    memberCount: 15,
  };

  return (
    <div className="space-y-6">
      {/* District Header Banner */}
      <AdminPageHeader
        badge={t('district.headerBadge', 'District Administration Hierarchy')}
        badgeIcon={Building2}
        title={t('district.title', 'Coimbatore District')}
        tamilTitle="கோயம்புத்தூர் மாவட்டம்"
        subtitle={t('district.subtitle', 'Jurisdiction encompasses Coimbatore Municipal Corporation, Assembly Constituency, Administrative Zones, and Municipal Wards.')}
        stats={[
          {
            label: t('district.statAssemblyConstituency', 'Assembly Constituency'),
            value: isTa ? (kinathukadavu.tamilName || 'கிணத்துக்கடவு') : (kinathukadavu.name || 'Kinathukadavu'),
            highlight: true,
          },
          {
            label: t('district.statTotalPaguthi', 'Total Paguthi'),
            value: `${kinathukadavu.totalPaguthi || 0} ${t('common.paguthi', 'Paguthi')}`,
            highlight: true,
          },
          { label: t('district.statTotalWards', 'Total Wards'), value: wards.length },
          { label: t('district.statActiveMembers', 'Active TVK Members'), value: districtData?.stats?.totalMembers || 0 },
        ]}
      />

      {/* Assembly Constituency Section - Exclusively Kinathukadavu */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#252525] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#A00000]" />
              <span>{t('district.assemblyConstituencyTitle', 'Assembly Constituency')}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('district.assemblyConstituencySub', 'Select Kinathukadavu Assembly Constituency to access Paguthi & Ward Administration')}
            </p>
          </div>
          <span className="text-xs font-bold text-[#A00000] bg-red-50 border border-red-200 px-3.5 py-1 rounded-full self-start sm:self-auto">
            {t('district.constituencyBadge', 'Kinathukadavu Constituency')}
          </span>
        </div>

        {/* WIDER, CENTERED & PROMINENT KINATHUKADAVU CARD */}
        <div className="flex justify-center w-full my-2">
          <div className="w-full max-w-3xl bg-white p-6 sm:p-7 md:p-8 rounded-3xl border border-[#E9E2DC] shadow-sm hover:shadow-md transition duration-200 relative overflow-hidden group">
            {/* Top Red Accent Line */}
            <div className="h-1.5 bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] absolute top-0 left-0 right-0"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left Column: Identity & Hierarchy */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-xs font-extrabold text-[#A00000] bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                    {kinathukadavu.code || 'KKD'}
                  </span>
                  <span className="text-[11px] font-bold text-[#FFD32A] bg-black/85 px-2.5 py-1 rounded-md shadow-xs">
                    {kinathukadavu.totalPaguthi || 0} {t('common.paguthi', 'Paguthi')}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    {kinathukadavu.zone || 'South Zone'}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#252525] group-hover:text-[#A00000] transition tracking-tight">
                    {kinathukadavu.name || 'Kinathukadavu'}
                  </h3>
                  <div className="flex items-center space-x-2.5 mt-1.5">
                    <span className="text-xs font-bold text-[#850000] bg-[#FFF0F0] px-3 py-0.5 rounded-full border border-red-200">
                      {t('district.assemblyConstituencyTitle', 'Assembly Constituency')}
                    </span>
                    <span className="text-sm font-bold text-[#252525]">
                      {kinathukadavu.tamilName || 'கிணத்துக்கடவு'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 max-w-xl leading-relaxed font-medium">
                  {t('district.cardSubtitle', 'Select a Paguthi to Continue. Administrative hierarchy covers 4 Paguthis (Pothanur, Kurichi, Sundarapuram, Malumichampatti) and all affiliated Municipal Wards.')}
                </p>

                {/* Key Statistics Counts from Database */}
                <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-[#E9E2DC] text-xs">
                  <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[#FFE5A3]/70">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t('district.statTotalPaguthi', 'Total Paguthi')}</span>
                    <strong className="text-slate-900 font-extrabold text-base sm:text-lg text-[#A00000]">
                      {kinathukadavu.totalPaguthi || 0}
                    </strong>
                  </div>
                  <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[#FFE5A3]/70">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t('district.statTotalWards', 'Total Wards')}</span>
                    <strong className="text-slate-900 font-extrabold text-base sm:text-lg">
                      {kinathukadavu.wardCount || kinathukadavu.totalWards || 0}
                    </strong>
                  </div>
                  <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[#FFE5A3]/70">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t('district.statActiveMembers', 'Total Members')}</span>
                    <strong className="text-slate-900 font-extrabold text-base sm:text-lg">
                      {kinathukadavu.memberCount || 0}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Open Thoguthi Button */}
              <div className="flex md:flex-col justify-end items-stretch md:items-end flex-shrink-0 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/district/constituencies/${kinathukadavu._id}`)}
                  className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] hover:from-[#A00000] hover:to-[#B00000] text-white text-sm font-extrabold rounded-2xl shadow-md hover:shadow-lg transition duration-150 flex items-center justify-center space-x-2 border-b-2 border-[#FFD32A] cursor-pointer group/btn"
                >
                  <span className="tracking-wide">{t('district.openThoguthi', 'Open Thoguthi')}</span>
                  <ChevronRight className="w-4 h-4 text-[#FFD32A] group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictPage;
