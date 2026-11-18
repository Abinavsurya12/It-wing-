import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  MapPin,
  Calendar,
  ChevronRight,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import { useNotification } from '../../context/NotificationContext';

export const ProjectsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({ total: 0, planned: 0, ongoing: 0, completed: 0 });
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [wards, setWards] = useState([]);

  // Add / Edit Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Community Infrastructure',
    location: '',
    wardId: '',
    department: 'Coimbatore Municipal Corporation',
    budget: '',
    status: 'Ongoing',
    progressPercentage: 50,
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedStatus && selectedStatus !== 'All') params.status = selectedStatus;

      const res = await api.get('/projects', { params });
      if (res.data.success) {
        setProjects(res.data.data);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      notifyError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await api.get('/districts/wards');
        if (res.data.success) setWards(res.data.data);
      } catch (err) {}
    };
    fetchWards();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [search, selectedStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        const res = await api.post('/projects', formData);
        if (res.data.success) {
          notifySuccess('New project initiative added!');
        }
      } else {
        const res = await api.put(`/projects/${currentId}`, formData);
        if (res.data.success) {
          notifySuccess('Project details updated!');
        }
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      notifyError(err.response?.data?.message || 'Failed to save project');
    }
  };

  const handleEdit = (proj, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setCurrentId(proj._id);
    setFormData({
      title: proj.title || '',
      description: proj.description || '',
      category: proj.category || 'Community Infrastructure',
      location: proj.location || '',
      wardId: proj.wardId?._id || proj.wardId || '',
      department: proj.department || 'Coimbatore Municipal Corporation',
      budget: proj.budget || '',
      status: proj.status || 'Ongoing',
      progressPercentage: proj.progressPercentage || 0,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project record?')) return;
    try {
      const res = await api.delete(`/projects/${id}`);
      if (res.data.success) {
        notifySuccess('Project record deleted');
        fetchProjects();
      }
    } catch (err) {
      notifyError('Failed to delete project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <AdminPageHeader
        badge={t('projects.headerBadge', 'Infrastructure & Public Works')}
        badgeIcon={Award}
        title={t('projects.title', 'Achievements & Projects')}
        tamilTitle="சாதனைகள் மற்றும் மக்கள் நலத்திட்டங்கள்"
        subtitle={t('projects.subtitle', 'Key civic advancements, completed public welfare projects and ongoing municipal initiatives across Coimbatore District.')}
        actions={
          <button
            onClick={() => {
              setModalMode('create');
              setFormData({
                title: '',
                description: '',
                category: 'Community Infrastructure',
                location: '',
                wardId: '',
                department: 'Coimbatore Municipal Corporation',
                budget: '',
                status: 'Ongoing',
                progressPercentage: 50,
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 bg-black/40 hover:bg-black/60 text-white font-bold rounded-xl text-xs shadow-md transition space-x-1.5 border border-[#FFD32A]/50 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#FFD32A]" />
            <span>{t('projects.addNewProject', 'Add New Project')}</span>
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">{t('projects.statTotal', 'Total Projects')}</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{summary.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase">{t('projects.statCompleted', 'Completed')}</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{summary.completed}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-sky-600 uppercase">{t('projects.statOngoing', 'Ongoing')}</p>
          <p className="text-2xl font-extrabold text-sky-700 mt-1">{summary.ongoing}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-purple-600 uppercase">{t('projects.statPlanned', 'Planned')}</p>
          <p className="text-2xl font-extrabold text-purple-700 mt-1">{summary.planned}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('projects.searchPlaceholder', 'Search projects, location, department...')}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-red-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Ongoing', 'Completed', 'Planned'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedStatus === s
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'All' ? t('projects.allStatus', 'All') : s === 'Ongoing' ? t('projects.statusOngoing', 'Ongoing') : s === 'Completed' ? t('projects.statusCompleted', 'Completed') : t('projects.statusPlanned', 'Planned')}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <LoadingSpinner text={t('projects.loadingText', 'Loading District Projects...')} />
      ) : projects.length === 0 ? (
        <p className="text-center py-12 text-slate-400 text-xs">{t('common.noRecords', 'No projects found.')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj._id}
              onClick={() => navigate(`/admin/projects/${proj._id}`)}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                    {proj.projectCode}
                  </span>
                  <StatusBadge status={proj.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-red-700 transition leading-snug">
                  {proj.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{proj.description}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center truncate">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-red-600 flex-shrink-0" />
                    <span>{proj.location}</span>
                  </p>
                  <p className="flex items-center truncate">
                    <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                    <span>{proj.department}</span>
                  </p>
                  {proj.budget > 0 && (
                    <p className="flex items-center font-bold text-emerald-700">
                      <span>{t('projects.budgetLabel', 'Budget')}: ₹{(proj.budget / 10000000).toFixed(2)} Crores</span>
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">{t('projects.progressLabel', 'Progress')}</span>
                    <span className="text-red-700">{proj.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-700 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-red-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                  <span>{t('projects.viewProjectBtn', 'View Details')}</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </span>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleEdit(proj, e)}
                    className="p-1 text-slate-400 hover:text-blue-700 rounded"
                  >
                    {t('common.edit', 'Edit')}
                  </button>
                  <button
                    onClick={(e) => handleDelete(proj._id, e)}
                    className="p-1 text-slate-400 hover:text-rose-700 rounded"
                  >
                    {t('common.delete', 'Delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Adding/Editing Project */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? t('projects.addNewProject', 'Add Civic Initiative') : t('projects.modalEditTitle', 'Edit Project')}
        subtitle={t('projects.subtitle', 'Track municipal development works and achievements in Coimbatore')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('projects.projectTitleRequired', 'Project Title *')}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Model Citizen Health & Maternity Redressal Centre"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('projects.categoryLabel', 'Category')}</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Water Infrastructure, Health"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('projects.locationLabel', 'Location / Ward Area *')}</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. R.S. Puram, Ward 72"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('projects.departmentLabel', 'Department')}</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. TWAD Board & CCMC"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('projects.budgetLabel', 'Budget (INR)')}</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. 25000000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('common.status', 'Status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-red-700"
              >
                <option value="Planned">{t('projects.statusPlanned', 'Planned')}</option>
                <option value="Ongoing">{t('projects.statusOngoing', 'Ongoing')}</option>
                <option value="Completed">{t('projects.statusCompleted', 'Completed')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('projects.progressLabel', 'Progress Percentage')}: {formData.progressPercentage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progressPercentage}
              onChange={(e) => setFormData({ ...formData, progressPercentage: parseInt(e.target.value) })}
              className="w-full accent-red-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('projects.descriptionRequired', 'Description *')}</label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Scope of work, key deliverables, and community benefits..."
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
              {modalMode === 'create' ? t('projects.addNewProject', 'Create Project') : t('common.save', 'Save Changes')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
