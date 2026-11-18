import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Phone,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useNotification } from '../../context/NotificationContext';

export const MembersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState({
    totalMembers: 0,
    maleMembers: 0,
    femaleMembers: 0,
    officeBearers: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filter States (Matching reference: Member Name, Mobile, Gender)
  const [searchName, setSearchName] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [selectedGender, setSelectedGender] = useState('All Gender');
  const [selectedWard, setSelectedWard] = useState(searchParams.get('wardId') || '');
  const [wards, setWards] = useState([]);

  // Modal State for Add / Edit Member
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    tamilName: '',
    gender: 'Male',
    mobileNumber: '',
    email: '',
    wardId: '',
    designation: 'Active Member',
    isOfficeBearer: false,
    bloodGroup: 'O+',
    status: 'Active',
    address: '',
  });

  // Fetch Wards for Dropdown
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await api.get('/districts/wards');
        if (res.data.success) {
          setWards(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load wards:', err);
      }
    };
    fetchWards();
  }, []);

  // Fetch Members with Filters & Pagination
  const fetchMembers = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
      };

      if (searchName) params.search = searchName;
      if (searchMobile) params.search = searchMobile;
      if (selectedGender && selectedGender !== 'All Gender') params.gender = selectedGender;
      if (selectedWard) params.wardId = selectedWard;

      const res = await api.get('/members', { params });
      if (res.data.success) {
        setMembers(res.data.data);
        setPagination(res.data.meta);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      notifyError('Failed to load members list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(1);
  }, [searchName, searchMobile, selectedGender, selectedWard]);

  // Form Submission
  const handleSubmitMember = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const res = await api.post('/members', formData);
        if (res.data.success) {
          notifySuccess('New TVK member registered successfully!');
        }
      } else {
        const res = await api.put(`/members/${currentMemberId}`, formData);
        if (res.data.success) {
          notifySuccess('Member details updated successfully!');
        }
      }
      setIsModalOpen(false);
      resetForm();
      fetchMembers(pagination.page);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Error saving member');
    }
  };

  const handleEditClick = (member, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setCurrentMemberId(member._id);
    setFormData({
      fullName: member.fullName || '',
      tamilName: member.tamilName || '',
      gender: member.gender || 'Male',
      mobileNumber: member.mobileNumber || '',
      email: member.email || '',
      wardId: member.wardId?._id || member.wardId || '',
      designation: member.designation || 'Active Member',
      isOfficeBearer: member.isOfficeBearer || false,
      bloodGroup: member.bloodGroup || 'O+',
      status: member.status || 'Active',
      address: member.address || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (memberId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this TVK member from the registry?')) return;
    try {
      const res = await api.delete(`/members/${memberId}`);
      if (res.data.success) {
        notifySuccess('Member removed successfully');
        fetchMembers(pagination.page);
      }
    } catch (err) {
      notifyError(err.response?.data?.message || 'Failed to delete member');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      tamilName: '',
      gender: 'Male',
      mobileNumber: '',
      email: '',
      wardId: '',
      designation: 'Active Member',
      isOfficeBearer: false,
      bloodGroup: 'O+',
      status: 'Active',
      address: '',
    });
    setModalMode('create');
    setCurrentMemberId(null);
  };

  const handleExportExcel = () => {
    window.open('/api/members/export', '_blank');
  };

  // 6 Columns Matching Reference Website
  const columns = [
    {
      header: t('members.colMemberId', 'Member ID'),
      accessor: 'memberId',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
          {row.memberId}
        </span>
      ),
    },
    {
      header: t('members.colMemberName', 'Member Name'),
      accessor: 'fullName',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.fullName}</span>
          {row.tamilName && <span className="text-[11px] text-slate-400">{row.tamilName}</span>}
          {row.wardId && (
            <span className="text-[10px] text-slate-500 block">
              {t('district.wardLabel', 'Ward')} {row.wardId.wardNumber} ({row.wardId.wardName})
            </span>
          )}
        </div>
      ),
    },
    {
      header: t('members.colGender', 'Gender'),
      accessor: 'gender',
      render: (row) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.gender === 'Male'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : row.gender === 'Female'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-purple-50 text-purple-700'
          }`}
        >
          {row.gender === 'Male' ? t('members.male', 'Male') : row.gender === 'Female' ? t('members.female', 'Female') : (t('members.other', 'Other') || row.gender)}
        </span>
      ),
    },
    {
      header: t('members.colMobile', 'Mobile'),
      accessor: 'mobileNumber',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">{row.mobileNumber}</span>
      ),
    },
    {
      header: t('members.colDesignation', 'Designation'),
      accessor: 'designation',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800">{row.designation}</span>
          {row.isOfficeBearer && (
            <span className="ml-1.5 inline-block text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
              {t('members.officeBearerBadge', 'Office Bearer')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: t('members.colStatus', 'Status'),
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t('members.colActions', 'Actions'),
      render: (row) => (
        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/admin/members/${row._id}`)}
            title="View Profile"
            className="p-1 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 transition"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleEditClick(row, e)}
            title="Edit Member"
            className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleDeleteClick(row._id, e)}
            title="Delete Member"
            className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Matching Login Theme */}
      <AdminPageHeader
        badge={t('members.headerBadge', 'TVK Coimbatore • Cadre Registry')}
        badgeIcon={Users}
        title={t('members.title', 'Ward Members Management')}
        tamilTitle="கழகத் தோழர்கள் மேலாண்மை"
        subtitle={t('members.subtitle', 'TVK Party Office Bearers, Cadre Registry, and Ward Volunteers across Coimbatore District')}
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2.5 bg-white/95 hover:bg-white text-[#850000] font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-[#A00000]" />
              <span>{t('members.exportExcel', 'Export Excel')}</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 bg-black/40 hover:bg-black/60 text-white font-bold rounded-xl text-xs shadow-sm transition space-x-1.5 border border-[#FFD32A]/50 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FFD32A]" />
              <span>{t('members.registerMember', 'Add Member')}</span>
            </button>
          </div>
        }
      />

      {/* 4 Summary / KPI Cards Matching Reference Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('members.statTotalCadres', 'Total Members')}</p>
            <h4 className="text-2xl font-extrabold text-slate-900">{summary.totalMembers}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('members.statMaleCadres', 'Male')}</p>
            <h4 className="text-2xl font-extrabold text-emerald-700">{summary.maleMembers}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('members.statFemaleCadres', 'Female')}</p>
            <h4 className="text-2xl font-extrabold text-rose-700">{summary.femaleMembers}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('members.statOfficeBearers', 'Office Bearers')}</p>
            <h4 className="text-2xl font-extrabold text-amber-700">{summary.officeBearers}</h4>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar (Matching Reference: Name, Mobile, Gender) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="nameFilter"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={t('members.searchByName', 'Search Member Name')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-red-700 focus:outline-none"
            />
          </div>

          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="mobileFilter"
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              placeholder={t('members.searchByMobile', 'Search Mobile Number')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-red-700 focus:outline-none"
            />
          </div>

          <div>
            <select
              id="genderFilter"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-red-700 focus:outline-none"
            >
              <option value="All Gender">{t('members.allGender', 'All Gender')}</option>
              <option value="Male">{t('members.male', 'Male')}</option>
              <option value="Female">{t('members.female', 'Female')}</option>
            </select>
          </div>

          <div>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-red-700 focus:outline-none"
            >
              <option value="">{t('members.allWards', 'All Wards')}</option>
              {wards.map((w) => (
                <option key={w._id} value={w._id}>
                  {t('district.wardLabel', 'Ward')} {w.wardNumber} - {w.wardName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={members}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchMembers(page)}
        onRowClick={(row) => navigate(`/admin/members/${row._id}`)}
      />

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? t('members.modalRegisterTitle', 'Add New TVK Member') : t('members.modalEditTitle', 'Edit Member Details')}
        subtitle={t('members.modalSubtitle', 'Maintain official Coimbatore district cadre membership records')}
      >
        <form onSubmit={handleSubmitMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.fullNameEn', 'Full Name (English) *')}</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Senthil Kumar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.fullNameTa', 'Tamil Name')}</label>
              <input
                type="text"
                value={formData.tamilName}
                onChange={(e) => setFormData({ ...formData, tamilName: e.target.value })}
                placeholder="e.g. செந்தில் குமார்"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.genderRequired', 'Gender *')}</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              >
                <option value="Male">{t('members.male', 'Male')}</option>
                <option value="Female">{t('members.female', 'Female')}</option>
                <option value="Other">{t('members.other', 'Other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.mobileRequired', 'Mobile Number *')}</label>
              <input
                type="tel"
                required
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="10-digit number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.bloodGroupLabel', 'Blood Group')}</label>
              <input
                type="text"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                placeholder="e.g. O+, B+"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.wardRequired', 'Assigned Municipal Ward *')}</label>
              <select
                value={formData.wardId}
                onChange={(e) => setFormData({ ...formData, wardId: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              >
                <option value="">{t('members.selectWard', 'Select Ward')}</option>
                {wards.map((w) => (
                  <option key={w._id} value={w._id}>
                    {t('district.wardLabel', 'Ward')} {w.wardNumber} - {w.wardName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.designationLabel', 'Party Designation *')}</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Ward Secretary, Active Volunteer"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.emailOptional', 'Email (Optional)')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="member@tvkcbe.org"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.statusLabel', 'Status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              >
                <option value="Active">{t('status.Active', 'Active')}</option>
                <option value="Inactive">{t('status.Inactive', 'Inactive')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.isOfficeBearer}
                onChange={(e) => setFormData({ ...formData, isOfficeBearer: e.target.checked })}
                className="w-4 h-4 rounded text-red-700 border-slate-300 focus:ring-red-700"
              />
              <span>{t('members.isOfficeBearerLabel', 'Designated TVK Office Bearer (நிர்வாகி)')}</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('members.residentialAddress', 'Residential Address')}</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Door No, Street Name, Area, Pincode"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-red-700"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold"
            >
              {modalMode === 'create' ? t('members.registerMember', 'Register Member') : t('common.save', 'Update Member')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MembersPage;
