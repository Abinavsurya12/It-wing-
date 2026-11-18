import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CalendarCheck,
  Search,
  ShieldCheck,
  ArrowRight,
  Phone,
  HelpCircle,
  LogOut,
  User,
  Heart,
  Bell,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Menu,
  RotateCcw,
  XCircle,
  CheckSquare,
  Eye,
  PlusCircle,
  RefreshCw,
  Twitter,
  Instagram,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Modal from '../../components/common/Modal';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import { getSafeImageUrl } from '../../utils/imageUtils';
import coimbatoreCityBg from '../../assets/coimbatore-city-bg.png';
import image1 from '../../assets/image1.png';
import image2 from '../../assets/image2.png';
import image3 from '../../assets/image3.png';
import streetlightImg from '../../assets/achievements/streetlight.jpg';
import bridgeImg from '../../assets/achievements/bridge.jpg';
import roadImg from '../../assets/achievements/road.jpg';
import drainageImg from '../../assets/achievements/drainage.jpg';
import waterImg from '../../assets/achievements/water.jpg';
import communityImg from '../../assets/achievements/community.jpg';

export const CitizenPortalPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active section tab: 'overview' | 'book-appointment' | 'my-appointments' | 'my-complaints'
  const [activeSection, setActiveSection] = useState('overview');

  // Appointment Form state
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');
  const [newBookedId, setNewBookedId] = useState('');
  const [appointmentForm, setAppointmentForm] = useState({
    fullName: user?.name || '',
    mobileNumber: user?.phone || '',
    email: user?.email || '',
    subject: '',
    description: '',
    preferredDate: '',
    preferredTime: '10:00 AM - 11:30 AM',
    additionalInfo: '',
  });

  // Appointment details modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);

  const fetchCitizenData = async () => {
    try {
      setLoading(true);
      const [issuesRes, apptRes, notifRes] = await Promise.all([
        api.get('/issues?limit=50'),
        api.get('/appointments/my').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/notifications').catch(() => ({ data: { success: false, data: [], unreadCount: 0 } })),
      ]);

      if (issuesRes.data.success) {
        setComplaints(issuesRes.data.data || []);
      }
      if (apptRes.data.success) {
        setAppointments(apptRes.data.data || []);
      }
      if (notifRes.data.success) {
        setNotifications(notifRes.data.data || []);
        setUnreadCount(notifRes.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading citizen portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Live polling synchronization: updates status automatically every 6 seconds
  useEffect(() => {
    fetchCitizenData();
    const timer = setInterval(fetchCitizenData, 6000);
    return () => clearInterval(timer);
  }, []);

  // Update default form values when user changes
  useEffect(() => {
    if (user) {
      setAppointmentForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        mobileNumber: prev.mobileNumber || user.phone || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Compute live citizen statistics with consistent mapping:
  // - Pending: Pending, New, Assigned, Under Review
  // - In Progress: In Progress
  // - Completed: Completed, Resolved, Closed
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter((c) => ['Pending', 'New', 'Assigned', 'Under Review'].includes(c.status)).length;
  const inProgressComplaints = complaints.filter((c) => c.status === 'In Progress').length;
  const completedComplaints = complaints.filter((c) => ['Completed', 'Resolved', 'Closed'].includes(c.status)).length;
  const resolvedComplaints = completedComplaints;

  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter((a) => ['Pending', 'Pending Approval', 'Requested'].includes(a.status)).length;
  const confirmedAppointments = appointments.filter((a) => ['Confirmed', 'Approved'].includes(a.status)).length;

  const citizenId = `TVK-CIT-${user?._id ? user._id.slice(-4).toUpperCase() : '7201'}`;

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Appointment Booking
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!appointmentForm.fullName.trim() || !appointmentForm.mobileNumber.trim() || !appointmentForm.subject.trim() || !appointmentForm.preferredDate) {
      notifyError('Please fill out all required fields: Full Name, Mobile, Subject, and Preferred Date.');
      return;
    }

    try {
      setBookingLoading(true);
      const payload = {
        fullName: appointmentForm.fullName.trim(),
        citizenName: appointmentForm.fullName.trim(),
        mobileNumber: appointmentForm.mobileNumber.trim(),
        email: appointmentForm.email.trim(),
        subject: appointmentForm.subject.trim(),
        purpose: appointmentForm.subject.trim(),
        description: appointmentForm.description.trim(),
        requestedDate: appointmentForm.preferredDate,
        preferredDate: appointmentForm.preferredDate,
        requestedTime: appointmentForm.preferredTime,
        preferredTimeSlot: appointmentForm.preferredTime,
        additionalInfo: appointmentForm.additionalInfo.trim(),
        constituency: user?.constituency || 'Coimbatore South',
        ward: user?.assignedWard || 'Ward 72',
      };

      const res = await api.post('/appointments', payload);
      if (res.data.success) {
        const booked = res.data.data;
        const aptId = booked.appointmentId || booked.tokenNumber;
        setNewBookedId(aptId);
        setBookingSuccessMsg(`Your appointment request has been submitted successfully with status Pending! Appointment ID: ${aptId}`);
        notifySuccess(`Appointment booked successfully! ID: ${aptId}`);

        // Reset fields except user details
        setAppointmentForm((prev) => ({
          ...prev,
          subject: '',
          description: '',
          preferredDate: '',
          preferredTime: '10:00 AM - 11:30 AM',
          additionalInfo: '',
        }));

        // Refresh appointments list
        fetchCitizenData();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || 'Failed to submit appointment request.');
    } finally {
      setBookingLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
      case 'Pending Approval':
      case 'Requested':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            {t(`status.${status}`, status)}
          </span>
        );
      case 'Confirmed':
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            {t(`status.${status}`, status)}
          </span>
        );
      case 'Rescheduled':
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <RotateCcw className="w-3 h-3 mr-1 text-blue-600" />
            {t(`status.${status}`, status)}
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 mr-1 text-red-600" />
            {t('status.Rejected', 'Rejected')}
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <CheckSquare className="w-3 h-3 mr-1 text-purple-600" />
            {t('status.Completed', 'Completed')}
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {t('status.Cancelled', 'Cancelled')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {t(`status.${status}`, status)}
          </span>
        );
    }
  };

  const services = [
    {
      id: 'register-complaint',
      title: t('citizen.registerComplaint', 'Register Complaint'),
      description: t('citizen.registerComplaintDesc', 'Report civic issues directly with photos, location, and priority assignment.'),
      icon: FileText,
      path: '/citizen/register-complaint',
      badge: t('citizen.complaintFormTitle', 'Civic Grievance'),
    },
    {
      id: 'my-complaints',
      title: t('citizen.myComplaints', 'My Complaints'),
      description: t('citizen.myComplaintsDesc', 'Track live inspection status, work start timestamp, and field resolution reports.'),
      icon: Clock,
      path: '/citizen/my-complaints',
      badge: t('citizen.liveStatusBadge', 'Live Status'),
    },
    {
      id: 'book-appointment',
      title: t('citizen.bookAppointment', 'Book Minister Appointment'),
      description: t('citizen.bookAppointmentDesc', 'Schedule an official consultation slot with the Minister at TVK District Headquarters.'),
      icon: CalendarCheck,
      action: () => setActiveSection('book-appointment'),
      badge: t('citizen.consultationBadge', 'Consultation'),
    },
    {
      id: 'my-appointments',
      title: t('citizen.myAppointments', 'My Appointments'),
      description: t('citizen.trackAppointmentDesc', 'Track official approval status, confirmed date/time, and subadmin remarks.'),
      icon: Search,
      action: () => setActiveSection('my-appointments'),
      badge: t('citizen.historyStatusBadge', 'History & Status'),
    },
  ];

  const achievements = [
    {
      id: 'streetlight',
      title: t('achievements.card1Title', 'Streetlight Development'),
      description: t(
        'achievements.card1Desc',
        'Addressing streetlight-related issues in residential areas. Supporting better road visibility and safer public spaces for local residents.'
      ),
      image: streetlightImg,
      alt: 'Streetlight Development',
      tag: '01',
    },
    {
      id: 'bridge',
      title: t('achievements.card2Title', 'Sundarapuram Bridge Development'),
      description: t(
        'achievements.card2Desc',
        'Highlighting bridge development initiatives in Sundarapuram. Supporting improved connectivity and convenient transportation for the public.'
      ),
      image: bridgeImg,
      alt: 'Sundarapuram Bridge Development',
      tag: '02',
    },
    {
      id: 'road',
      title: t('achievements.card3Title', 'Road Infrastructure Improvement'),
      description: t(
        'achievements.card3Desc',
        'Highlighting road infrastructure improvement initiatives. Supporting smoother transportation and better connectivity across local communities.'
      ),
      image: roadImg,
      alt: 'Road Infrastructure Improvement',
      tag: '03',
    },
    {
      id: 'drainage',
      title: t('achievements.card4Title', 'Drainage Infrastructure'),
      description: t(
        'achievements.card4Desc',
        'Highlighting drainage-related public infrastructure initiatives. Supporting improved water flow and better local environmental conditions.'
      ),
      image: drainageImg,
      alt: 'Drainage Infrastructure',
      tag: '04',
    },
    {
      id: 'water',
      title: t('achievements.card5Title', 'Drinking Water Development'),
      description: t(
        'achievements.card5Desc',
        'Showcasing public drinking water infrastructure initiatives. Supporting accessible and convenient water facilities for local communities.'
      ),
      image: waterImg,
      alt: 'Drinking Water Development',
      tag: '05',
    },
    {
      id: 'community',
      title: t('achievements.card6Title', 'Community Development Initiatives'),
      description: t(
        'achievements.card6Desc',
        'Highlighting infrastructure initiatives that support local communities. Focusing on improved public facilities and neighbourhood development.'
      ),
      image: communityImg,
      alt: 'Community Development Initiatives',
      tag: '06',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-sans overflow-x-hidden">
      {/* ================= 1. TOP NAVIGATION HEADER ================= */}
      <header className="w-full bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] border-b-[3px] border-[#FFD32A] px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 shadow-md flex items-center justify-between text-white sticky top-0 z-50">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1 sm:flex-initial">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFD32A] text-[#850000] font-black text-sm sm:text-base flex items-center justify-center shadow-md flex-shrink-0">
            TVK
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-extrabold tracking-tight truncate max-w-[130px] min-[400px]:max-w-[180px] sm:max-w-none">
              {t('citizen.portalTitle', 'TVK Citizen Service Portal')}
            </h1>
            <p className="text-[10px] sm:text-[10.5px] text-[#FFD32A] font-semibold truncate hidden sm:block">
              {t('citizen.portalTagline', 'Coimbatore Public Redressal Service • Coimbatore South')}
            </p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-4 text-xs font-bold text-white/90">
          <button
            onClick={() => setActiveSection('overview')}
            className={`py-1 cursor-pointer transition ${
              activeSection === 'overview' ? 'text-[#FFD32A] border-b-2 border-[#FFD32A]' : 'hover:text-[#FFD32A]'
            }`}
          >
            {t('header.dashboard', 'Dashboard')}
          </button>
          <button
            onClick={() => setActiveSection('book-appointment')}
            className={`py-1 cursor-pointer transition ${
              activeSection === 'book-appointment' ? 'text-[#FFD32A] border-b-2 border-[#FFD32A]' : 'hover:text-[#FFD32A]'
            }`}
          >
            {t('citizen.bookAppointment', 'Book Appointment')}
          </button>
          <button
            onClick={() => setActiveSection('my-appointments')}
            className={`py-1 cursor-pointer transition ${
              activeSection === 'my-appointments' ? 'text-[#FFD32A] border-b-2 border-[#FFD32A]' : 'hover:text-[#FFD32A]'
            }`}
          >
            {t('citizen.trackAppointment', 'My Appointments')} ({appointments.length})
          </button>
          <Link to="/citizen/my-complaints" className="hover:text-[#FFD32A] transition py-1">
            {t('citizen.myComplaints', 'My Complaints')} ({complaints.length})
          </Link>
          <Link to="/citizen/register-complaint" className="hover:text-[#FFD32A] transition py-1">
            + {t('citizen.registerComplaint', 'New Grievance')}
          </Link>
        </nav>

        {/* Right Section: Notifications, Language, Profile, Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl bg-black/20 hover:bg-black/30 border border-white/20 transition relative cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#FFD32A]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD32A] text-[#850000] font-black rounded-full text-[9px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden text-slate-800">
                <div className="p-3 bg-[#A00000] text-white flex items-center justify-between">
                  <span className="font-bold text-xs">Notifications</span>
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-[#FFD32A] hover:underline font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-slate-400">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} className={`p-3 ${n.isRead ? 'bg-white' : 'bg-red-50/50'}`}>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-[#A00000] text-xs">{n.title}</p>
                          {n.referenceId && (
                            <span className="font-mono text-[9px] font-bold bg-red-100 text-red-800 px-1.5 py-0.2 rounded">
                              {n.referenceId}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-800 font-semibold mt-0.5">{n.message}</p>
                        {n.actionTaken && (
                          <p className="text-[10px] text-slate-600 mt-1 bg-white p-1.5 rounded border border-slate-200">
                            <strong>Action:</strong> {n.actionTaken}
                          </p>
                        )}
                        {(n.beforeImage || n.afterImage) && (
                          <div className="flex items-center space-x-2 mt-1.5">
                            {n.beforeImage && (
                              <img
                                src={getSafeImageUrl(n.beforeImage)}
                                alt="Before Action"
                                title="Before Action"
                                className="w-10 h-10 object-cover rounded border border-red-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            {n.afterImage && (
                              <img
                                src={getSafeImageUrl(n.afterImage)}
                                alt="After Resolution"
                                title="After Resolution"
                                className="w-10 h-10 object-cover rounded border border-emerald-400"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Global Language Switcher */}
          <LanguageSwitcher variant="dark" />

          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/20">
            <User className="w-3.5 h-3.5 text-[#FFD32A]" />
            <span className="text-white font-bold text-xs">{user?.name || 'Citizen'}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-1 bg-black/20 hover:bg-black/40 px-2.5 sm:px-3 py-1.5 rounded-full border border-white/20 transition text-[11px] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#FFD32A]" />
            <span className="font-bold hidden min-[400px]:inline">{t('common.logout', 'Logout')}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-black/20 lg:hidden text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#850000] text-white px-4 py-3 border-b-2 border-[#FFD32A] space-y-2 text-xs font-bold shadow-lg animate-fadeIn">
          <button
            onClick={() => {
              setActiveSection('overview');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-1.5 border-b border-white/10"
          >
            {t('header.dashboard', 'Dashboard')}
          </button>
          <button
            onClick={() => {
              setActiveSection('book-appointment');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-1.5 border-b border-white/10"
          >
            {t('citizen.bookAppointment', 'Book Minister Appointment')}
          </button>
          <button
            onClick={() => {
              setActiveSection('my-appointments');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-1.5 border-b border-white/10"
          >
            {t('citizen.trackAppointment', 'My Appointments')} ({appointments.length})
          </button>
          <Link
            to="/citizen/my-complaints"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 border-b border-white/10"
          >
            {t('citizen.myComplaints', 'My Complaints')} ({complaints.length})
          </Link>
          <Link
            to="/citizen/register-complaint"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-[#FFD32A]"
          >
            + {t('citizen.registerComplaint', 'Register New Grievance')}
          </Link>
        </div>
      )}

      {/* ================= 2. HERO SECTION ================= */}
      <section
        className="w-full relative bg-[#850000] pt-6 sm:pt-8 md:pt-10 pb-0 px-3 sm:px-6 lg:px-8 text-white overflow-hidden shadow-inner"
        style={{
          backgroundImage: `url(${coimbatoreCityBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(120, 0, 0, 0.95) 0%, rgba(133, 0, 0, 0.90) 50%, rgba(100, 0, 0, 0.96) 100%)',
          }}
        />

        {/* Top-Right Corner Image (image3.png) */}
        <div className="absolute top-2.5 sm:top-3.5 md:top-5 right-2.5 sm:right-4 md:right-6 lg:right-8 z-20 pointer-events-none">
          <img
            src={image3}
            alt="TVK Official Emblem"
            className="w-10 h-10 min-[360px]:w-11 min-[360px]:h-11 min-[390px]:w-12 min-[390px]:h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain drop-shadow-xl filter brightness-105 select-none"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* MOBILE VIEW (< md): Text at Top, Both Leadership Images Neatly Positioned at Bottom */}
          <div className="flex flex-col md:hidden items-center">
            {/* Center Content: Heading, Tamil Tagline, Description */}
            <div className="w-full text-center space-y-2 sm:space-y-2.5 pt-1 px-1">
              <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#FFD32A] animate-pulse"></span>
                <span className="text-[#FFD32A] font-bold">மக்கள் சேவை செயலி</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight drop-shadow-md text-white">
                TVK Citizen Public Service Portal
              </h2>

              <h3 className="text-sm sm:text-base font-bold text-[#FFD32A] drop-shadow-sm">
                உங்கள் குறை - எங்கள் பொறுப்பு
              </h3>

              <p className="text-xs sm:text-sm text-white/95 max-w-xl mx-auto font-medium leading-relaxed drop-shadow-xs">
                Directly connect with your local Ward Secretary, report community issues, and book ministerial consultations at TVK Coimbatore Headquarters.
              </p>
            </div>

            {/* Mobile Leadership Portraits: Both Visible, Consistent Bottom Alignment, No Overlap */}
            <div className="w-full flex items-end justify-center gap-4 min-[390px]:gap-6 sm:gap-10 mt-3 self-end">
              <div className="flex justify-center items-end self-end">
                <img
                  src={image1}
                  alt="TVK Leadership - Image 1"
                  className="h-28 min-[375px]:h-32 min-[410px]:h-36 sm:h-44 w-auto max-w-full object-contain object-bottom block align-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] filter brightness-105"
                />
              </div>
              <div className="flex justify-center items-end self-end">
                <img
                  src={image2}
                  alt="TVK Leadership - Image 2"
                  className="h-28 min-[375px]:h-32 min-[410px]:h-36 sm:h-44 w-auto max-w-full object-contain object-bottom block align-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] filter brightness-105"
                />
              </div>
            </div>
          </div>

          {/* DESKTOP & TABLET VIEW (>= md): 3-Column Layout with Prominent Increased Sizing & Flush Bottom Alignment */}
          <div className="hidden md:flex flex-row items-end justify-between gap-4 lg:gap-8">
            {/* Left Side: image1.png (Desktop / Tablet) - Prominent, Flush Bottom */}
            <div className="flex-1 flex justify-start items-end self-end">
              <img
                src={image1}
                alt="TVK Leadership - Image 1"
                className="h-56 md:h-64 lg:h-76 xl:h-88 w-auto max-w-full object-contain object-bottom block align-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] filter brightness-105 transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>

            {/* Center Content: Heading, Tamil Tagline, Description */}
            <div className="w-full md:w-auto md:max-w-xl lg:max-w-2xl text-center space-y-2.5 sm:space-y-3.5 my-auto py-6 lg:py-8">
              <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#FFD32A] animate-pulse"></span>
                <span className="text-[#FFD32A] font-bold">மக்கள் சேவை செயலி</span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-md text-white">
                TVK Citizen Public Service Portal
              </h2>

              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-[#FFD32A] drop-shadow-sm">
                உங்கள் குறை - எங்கள் பொறுப்பு
              </h3>

              <p className="text-xs sm:text-sm lg:text-base text-white/95 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-xs">
                Directly connect with your local Ward Secretary, report community issues, and book ministerial consultations at TVK Coimbatore Headquarters.
              </p>
            </div>

            {/* Right Side: Image 2 (Desktop / Tablet) - Prominent, Flush Bottom */}
            <div className="flex-1 flex justify-end items-end self-end">
              <img
                src={image2}
                alt="TVK Leadership - Image 2"
                className="h-56 md:h-64 lg:h-76 xl:h-88 w-auto max-w-full object-contain object-bottom block align-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] filter brightness-105 transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. USER PROFILE SUMMARY ================= */}
      <section className="max-w-6xl w-full mx-auto px-4 -mt-5 relative z-20">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E9E2DC] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#850000] to-[#A00000] text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-[#FFD32A] flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {user?.name || 'Citizen'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-[#A00000] border border-red-200">
                  Verified Citizen
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Registered Mobile: <strong className="text-slate-800 font-mono">{user?.phone || '9842567890'}</strong>
              </p>
            </div>
          </div>

          {/* Profile Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
            <div className="bg-[#FFF8F0] p-2 rounded-xl border border-[#FFE5A3]/50">
              <span className="text-[10px] text-slate-500 block">Citizen ID</span>
              <strong className="text-slate-900 font-mono font-bold text-[11px]">{citizenId}</strong>
            </div>
            <div className="bg-[#FFF8F0] p-2 rounded-xl border border-[#FFE5A3]/50">
              <span className="text-[10px] text-slate-500 block">Assigned Ward</span>
              <strong className="text-slate-900 font-bold text-[11px]">{user?.assignedWard || 'Ward 72'}</strong>
            </div>
            <div className="bg-[#FFF8F0] p-2 rounded-xl border border-[#FFE5A3]/50">
              <span className="text-[10px] text-slate-500 block">Paguthi</span>
              <strong className="text-[#A00000] font-bold text-[11px]">{user?.paguthi || 'R.S. Puram'}</strong>
            </div>
            <div className="bg-[#FFF8F0] p-2 rounded-xl border border-[#FFE5A3]/50">
              <span className="text-[10px] text-slate-500 block">Constituency</span>
              <strong className="text-slate-900 font-bold text-[11px]">{user?.constituency || 'Coimbatore South'}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION NAVIGATION TABS ================= */}
      <section className="max-w-6xl w-full mx-auto px-4 mt-6">
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-[#A00000] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('citizen.publicServices', 'Public Services Overview')}
          </button>
          <button
            onClick={() => setActiveSection('book-appointment')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
              activeSection === 'book-appointment'
                ? 'bg-[#A00000] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{t('citizen.bookAppointment', 'Book Appointment Form')}</span>
          </button>
          <button
            onClick={() => setActiveSection('my-appointments')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
              activeSection === 'my-appointments'
                ? 'bg-[#A00000] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('citizen.myAppointments', 'My Appointments')} ({appointments.length})</span>
          </button>
        </div>
      </section>

      {/* ================= MAIN CONTENT BASED ON ACTIVE SECTION ================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 my-6 space-y-8">
        {/* ================= 4. DASHBOARD STATISTICS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-[#E9E2DC] shadow-xs text-center">
            <span className="text-[10.5px] text-slate-500 block font-semibold">{t('complaintsReported.cardTotal', 'Total Complaints')}</span>
            <p className="text-xl sm:text-2xl font-black text-[#A00000] mt-0.5">{totalComplaints}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs text-center bg-amber-50/20">
            <span className="text-[10.5px] text-amber-800 block font-semibold">{t('status.Pending', 'Pending')}</span>
            <p className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">{pendingComplaints}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-xs text-center bg-blue-50/20">
            <span className="text-[10.5px] text-blue-800 block font-semibold">{t('status.In Progress', 'In Progress')}</span>
            <p className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5">{inProgressComplaints}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs text-center bg-emerald-50/20">
            <span className="text-[10.5px] text-emerald-800 block font-semibold">{t('status.Resolved', 'Completed')}</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{completedComplaints}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-xs text-center bg-purple-50/20">
            <span className="text-[10.5px] text-purple-800 block font-semibold">{t('citizen.trackAppointment', 'Appointments')}</span>
            <p className="text-xl sm:text-2xl font-black text-purple-700 mt-0.5">{totalAppointments}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-[#FFE5A3] shadow-xs text-center bg-[#FFF8F0]">
            <span className="text-[10.5px] text-[#A00000] block font-semibold">{t('status.Confirmed', 'Confirmed')}</span>
            <p className="text-xl sm:text-2xl font-black text-[#A00000] mt-0.5">{confirmedAppointments}</p>
          </div>
        </div>

        {/* SECTION: OVERVIEW / SERVICES */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Service Cards */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#252525]">{t('citizen.publicServices', 'Citizen Public Services')}</h3>
                <p className="text-xs text-slate-500">{t('citizen.publicServicesDesc', 'Access online grievance redressal and ministerial consultation services')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((srv) => {
                  const Icon = srv.icon;
                  return (
                    <div
                      key={srv.id}
                      className="bg-white rounded-2xl border border-[#E9E2DC] shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-[#A00000] transition-all duration-200 p-5 flex flex-col justify-between group overflow-hidden relative"
                    >
                      <div className="h-1 bg-gradient-to-r from-[#A00000] via-[#FFD32A] to-[#850000] absolute top-0 left-0 right-0"></div>

                      <div>
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-[#FFF8F0] border border-[#FFE5A3] flex items-center justify-center text-[#A00000] shadow-xs group-hover:scale-105 transition">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-50 text-[#A00000] border border-red-200">
                            {srv.badge}
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900 mt-3 group-hover:text-[#A00000] transition">
                          {srv.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{srv.description}</p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100">
                        {srv.path ? (
                          <Link
                            to={srv.path}
                            className="w-full py-2 bg-[#A00000] hover:bg-[#850000] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <span>{t('citizen.proceedToService', 'Proceed to Service')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <button
                            onClick={srv.action}
                            className="w-full py-2 bg-[#A00000] hover:bg-[#850000] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <span>{t('citizen.openModule', 'Open Module')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick My Appointments Glance */}
            <div className="bg-white rounded-3xl p-6 border border-[#E9E2DC] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#252525]">
                    {t('citizen.recentMinisterAppts', 'Recent Minister Appointment Bookings')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('citizen.recentMinisterApptsDesc', 'Your scheduled consultations and live approval status')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('book-appointment')}
                  className="px-3.5 py-1.5 bg-[#A00000] text-white rounded-xl text-xs font-bold hover:bg-[#850000] transition flex items-center space-x-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{t('citizen.bookNewAppt', 'Book New Appointment')}</span>
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="p-8 text-center bg-[#FFF8F0]/40 rounded-2xl border border-dashed border-[#FFE5A3]">
                  <CalendarCheck className="w-10 h-10 text-[#A00000]/60 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">{t('citizen.noApptsYet', 'No appointments booked yet.')}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t('citizen.noApptsYetSub', 'Use the appointment form to schedule your first ministerial grievance consultation slot.')}</p>
                  <button
                    onClick={() => setActiveSection('book-appointment')}
                    className="mt-3 inline-block px-4 py-2 bg-[#A00000] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    {t('citizen.bookAnApptNow', 'Book An Appointment Now')}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {appointments.slice(0, 3).map((a) => (
                    <div key={a._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-[#A00000]">{a.appointmentId || a.tokenNumber}</span>
                          {getStatusBadge(a.status)}
                        </div>
                        <h5 className="font-bold text-slate-800">{a.subject || a.purpose}</h5>
                        <p className="text-[11px] text-slate-500">
                          {t('citizen.requestedFor', 'Requested for')}: {new Date(a.requestedDate || a.preferredDate).toLocaleDateString()} ({a.requestedTime || a.preferredTimeSlot})
                        </p>
                        {['Confirmed', 'Approved', 'Rescheduled'].includes(a.status) && (
                          <p className="text-[11px] text-emerald-800 font-medium flex items-center mt-0.5">
                            <MapPin className="w-3 h-3 mr-1 text-[#A00000] flex-shrink-0" />
                            <span>{t('citizen.confirmedLocation', 'Confirmed Location:')} {a.confirmedLocation || a.approvedVenue || t('citizen.locationNotAssigned', 'Location not assigned')}</span>
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAppointment(a);
                          setIsApptModalOpen(true);
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-bold self-start sm:self-auto cursor-pointer"
                      >
                        {t('citizen.viewFullDetails', 'View Full Details')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Citizen Complaints & Status Tracking Section */}
            <div className="bg-white rounded-3xl p-6 border border-[#E9E2DC] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#252525]">
                    {t('citizen.registeredComplaintsHeading', 'My Registered Complaints & Live Status')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('citizen.registeredComplaintsSub', 'Real-time status updates synced live from your Ward Secretary and District Administration')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to="/citizen/register-complaint"
                    className="px-3.5 py-1.5 bg-[#A00000] text-white rounded-xl text-xs font-bold hover:bg-[#850000] transition flex items-center space-x-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{t('citizen.registerNewComplaint', 'Register New Complaint')}</span>
                  </Link>
                  <Link
                    to="/citizen/my-complaints"
                    className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>{t('citizen.viewAll', 'View All')} ({complaints.length})</span>
                  </Link>
                </div>
              </div>

              {complaints.length === 0 ? (
                <div className="p-8 text-center bg-[#FFF8F0]/40 rounded-2xl border border-dashed border-[#FFE5A3]">
                  <FileText className="w-10 h-10 text-[#A00000]/60 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">{t('citizen.noComplaintsYet', 'No complaints registered yet.')}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t('citizen.noComplaintsYetSub', 'Have an issue in your ward? Register a new complaint for direct field resolution.')}</p>
                  <Link
                    to="/citizen/register-complaint"
                    className="mt-3 inline-block px-4 py-2 bg-[#A00000] text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {t('citizen.registerFirstComplaint', 'Register Your First Complaint')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.slice(0, 4).map((c) => {
                    const isCompleted = ['Completed', 'Resolved', 'Closed'].includes(c.status);
                    const isInProgress = c.status === 'In Progress';
                    const displayStatus = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending';

                    return (
                      <div
                        key={c._id}
                        className={`p-4 rounded-2xl border transition text-xs space-y-2.5 ${
                          isCompleted
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : isInProgress
                            ? 'bg-blue-50/30 border-blue-200'
                            : 'bg-amber-50/20 border-amber-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[#A00000] bg-white border border-red-200 px-2 py-0.5 rounded">
                              {c.issueCode || c.complaintId}
                            </span>
                            <StatusBadge status={displayStatus} />
                            <PriorityBadge priority={c.priority} />
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {t('citizen.registeredOn', 'Registered on')}: {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{c.title}</h4>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{c.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <div>
                            <span>{t('citizen.jurisdiction', 'Jurisdiction')}: </span>
                            <strong className="text-slate-800">
                              {c.wardId?.wardName ? `Ward ${c.wardId.wardNumber} - ${c.wardId.wardName}` : (c.wardNumber ? `Ward ${c.wardNumber}` : (user?.assignedWard || 'Ward 72'))}
                            </strong>
                            {c.category && (
                              <span className="ml-2 px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">
                                {c.category}
                              </span>
                            )}
                          </div>

                          <Link
                            to="/citizen/my-complaints"
                            className="font-bold text-[#A00000] hover:underline flex items-center space-x-1"
                          >
                            <span>{t('citizen.trackTimeline', 'Track Timeline & Resolution')}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>

                        {/* Completed Success Banner Preview */}
                        {isCompleted && (
                          <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 flex items-center justify-between gap-2 text-emerald-950">
                            <div className="flex items-center space-x-1.5 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                              <span>{t('citizen.complaintFixedSuccess', 'Your complaint was fixed successfully!')}</span>
                            </div>
                            <Link
                              to="/citizen/my-complaints"
                              className="text-[11px] font-bold text-emerald-800 hover:underline flex-shrink-0"
                            >
                              {t('citizen.viewEvidencePhotos', 'View Evidence & Photos')} &rarr;
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ================= 5. OUR ACHIEVEMENTS SECTION (EDITORIAL BENTO LAYOUT) ================= */}
            <section className="bg-gradient-to-b from-white via-[#FCFAF7] to-[#F9F5F0] rounded-3xl sm:rounded-[2rem] border border-[#E7DFD7] shadow-lg p-5 sm:p-7 md:p-9 relative overflow-hidden space-y-7">
              {/* Top decorative tricolor bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#850000] via-[#FFD32A] to-[#850000] absolute top-0 left-0 right-0" />

              {/* Section Heading & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-widest bg-red-50 text-[#850000] border border-red-200/80">
                    <Sparkles className="w-3 h-3 text-[#FFD32A]" />
                    <span>{t('achievements.badge', 'TVK Coimbatore Initiatives')}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#252525] tracking-tight">
                    {t('achievements.sectionTitle', 'OUR ACHIEVEMENTS')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
                    "{t('achievements.sectionSubtitle', 'Development Initiatives & Public Welfare Activities')}"
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-extrabold text-[#A00000] uppercase tracking-wider bg-white px-3.5 py-1.5 rounded-xl border border-red-200/90 shadow-2xs">
                    06 Signature Milestones
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1">Field Tested & Community Driven</span>
                </div>
              </div>

              {/* Asymmetric Editorial Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6">
                {/* CARD 1: Large Featured Image Card (Desktop: 8 cols, Tablet: 2 cols, Mobile: 1 col) */}
                <article className="md:col-span-2 lg:col-span-8 bg-white rounded-3xl border border-[#E5DDD5] shadow-xs hover:shadow-2xl hover:border-[#A00000]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  {/* Featured Large Image */}
                  <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/9] overflow-hidden bg-slate-100">
                    <img
                      src={achievements[0].image}
                      alt={achievements[0].alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Number & Spotlight Badges */}
                    <div className="absolute top-3.5 left-3.5 flex items-center space-x-2">
                      <span className="bg-black/75 backdrop-blur-md text-[#FFD32A] text-xs font-black px-3 py-1 rounded-full border border-white/20 shadow-md">
                        01
                      </span>
                      <span className="bg-[#850000]/90 backdrop-blur-md text-white text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20 shadow-md flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 text-[#FFD32A]" />
                        <span>Featured Milestone</span>
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>

                  {/* Description & Content visibly below image */}
                  <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[11px] font-extrabold text-[#A00000] uppercase tracking-wider mb-1">
                        Residential Zone Electrification
                      </div>
                      <h4 className="text-lg sm:text-2xl font-black text-slate-900 group-hover:text-[#A00000] transition-colors leading-snug">
                        {achievements[0].title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5 font-normal line-clamp-3">
                        "{achievements[0].description}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                      <span className="text-slate-500 font-medium">Public Safety & 24/7 Illumination</span>
                      <span className="inline-flex items-center space-x-1 text-[#A00000] font-bold">
                        <span>Verified Resolution</span>
                        <span className="w-2 h-2 rounded-full bg-[#FFD32A]" />
                      </span>
                    </div>
                  </div>
                </article>

                {/* CARD 2: Medium Image Card (Desktop: 4 cols, Tablet: 1 col, Mobile: 1 col) */}
                <article className="md:col-span-1 lg:col-span-4 bg-white rounded-3xl border border-[#E5DDD5] shadow-xs hover:shadow-2xl hover:border-[#A00000]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  {/* Medium Image */}
                  <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-slate-100">
                    <img
                      src={achievements[1].image}
                      alt={achievements[1].alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3.5 left-3.5">
                      <span className="bg-black/75 backdrop-blur-md text-[#FFD32A] text-xs font-black px-3 py-1 rounded-full border border-white/20 shadow-md">
                        02
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>

                  {/* Description & Content visibly below image */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[10.5px] font-extrabold text-[#A00000] uppercase tracking-wider mb-1">
                        Connectivity & Flyover
                      </div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#A00000] transition-colors leading-snug">
                        {achievements[1].title}
                      </h4>
                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-2 font-normal line-clamp-3">
                        "{achievements[1].description}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Sundarapuram Route</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A00000]" />
                    </div>
                  </div>
                </article>

                {/* CARD 3: Wide Horizontal Achievement Card (Desktop: 12 cols, Tablet: 2 cols, Mobile: 1 col) */}
                <article className="md:col-span-2 lg:col-span-12 bg-white rounded-3xl border border-[#E5DDD5] shadow-xs hover:shadow-2xl hover:border-[#A00000]/60 transition-all duration-300 overflow-hidden group">
                  <div className="flex flex-col md:flex-row items-stretch">
                    {/* Left Side: Wide Landscape Image */}
                    <div className="relative md:w-5/12 lg:w-1/2 aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100 min-h-[220px] md:min-h-[280px]">
                      <img
                        src={achievements[2].image}
                        alt={achievements[2].alt}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-3.5 left-3.5 flex items-center space-x-2">
                        <span className="bg-black/75 backdrop-blur-md text-[#FFD32A] text-xs font-black px-3 py-1 rounded-full border border-white/20 shadow-md">
                          03
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20">
                          Corridor Upgrade
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>

                    {/* Right Side: Editorial Content visible beside/below image */}
                    <div className="p-5 sm:p-7 md:w-7/12 lg:w-1/2 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="inline-flex items-center space-x-1.5 text-[10.5px] font-extrabold text-[#A00000] uppercase tracking-wider mb-1.5">
                          <span>★</span>
                          <span>Local Community Connectivity</span>
                        </div>
                        <h4 className="text-lg sm:text-2xl font-black text-slate-900 group-hover:text-[#A00000] transition-colors leading-snug">
                          {achievements[2].title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5 font-normal line-clamp-3">
                          "{achievements[2].description}"
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-semibold">
                        <span className="text-slate-500">Pothole Free & Asphalt Relaying Drive</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-extrabold text-[#A00000] bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
                            Smooth Transit
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                {/* CARD 4: Medium Image Card (Desktop: 4 cols, Tablet: 1 col, Mobile: 1 col) */}
                <article className="md:col-span-1 lg:col-span-4 bg-white rounded-3xl border border-[#E5DDD5] shadow-xs hover:shadow-2xl hover:border-[#A00000]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  {/* Medium Image */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={achievements[3].image}
                      alt={achievements[3].alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3.5 left-3.5">
                      <span className="bg-black/75 backdrop-blur-md text-[#FFD32A] text-xs font-black px-3 py-1 rounded-full border border-white/20 shadow-md">
                        04
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>

                  {/* Description & Content visibly below image */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[10.5px] font-extrabold text-[#A00000] uppercase tracking-wider mb-1">
                        Stormwater & Environmental Flow
                      </div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#A00000] transition-colors leading-snug">
                        {achievements[3].title}
                      </h4>
                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-2 font-normal line-clamp-3">
                        "{achievements[3].description}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Eco-Friendly Drainage</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD32A]" />
                    </div>
                  </div>
                </article>

                {/* CARD 5: Wide Image-Focused Card (Desktop: 5 cols, Tablet: 1 col, Mobile: 1 col) */}
                <article className="md:col-span-1 lg:col-span-5 bg-white rounded-3xl border border-[#E5DDD5] shadow-xs hover:shadow-2xl hover:border-[#A00000]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  {/* Wide Image */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={achievements[4].image}
                      alt={achievements[4].alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3.5 left-3.5 flex items-center space-x-2">
                      <span className="bg-black/75 backdrop-blur-md text-[#FFD32A] text-xs font-black px-3 py-1 rounded-full border border-white/20 shadow-md">
                        05
                      </span>
                      <span className="bg-blue-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20">
                        Water Security
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>

                  {/* Description & Content visibly below image */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[10.5px] font-extrabold text-[#A00000] uppercase tracking-wider mb-1">
                        Clean Public Supply
                      </div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#A00000] transition-colors leading-snug">
                        {achievements[4].title}
                      </h4>
                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-2 font-normal line-clamp-3">
                        "{achievements[4].description}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Purified RO Stations</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                  </div>
                </article>

                {/* CARD 6: Compact But Visually Prominent Card (Desktop: 3 cols, Tablet: 2 cols, Mobile: 1 col) */}
                <article className="md:col-span-2 lg:col-span-3 bg-gradient-to-b from-[#FFFDF8] via-[#FFF9F0] to-[#FFF3E0] rounded-3xl border-2 border-[#FFD32A]/70 shadow-sm hover:shadow-2xl hover:border-[#A00000] transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                  {/* Distinctive Image */}
                  <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-amber-50">
                    <img
                      src={achievements[5].image}
                      alt={achievements[5].alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3.5 left-3.5 flex items-center space-x-1.5">
                      <span className="bg-[#850000] text-[#FFD32A] text-xs font-black px-3 py-1 rounded-full border border-[#FFD32A]/60 shadow-md">
                        06
                      </span>
                      <span className="bg-amber-100/90 text-[#850000] text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300">
                        Civic Park
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>

                  {/* Description & Content visibly below image */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[10px] font-black text-[#A00000] uppercase tracking-wider mb-1">
                        Public Spaces & Parks
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#A00000] transition-colors leading-snug">
                        {achievements[5].title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2 font-normal line-clamp-3">
                        "{achievements[5].description}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-[#850000] font-bold">
                      <span>Neighborhood Upliftment</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#FFD32A]" />
                    </div>
                  </div>
                </article>
              </div>
            </section>

            {/* ================= 6. CONNECT WITH K. VIGNESH SECTION ================= */}
            <section className="bg-gradient-to-r from-[#200303] via-[#450808] to-[#250404] rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 md:p-10 border-2 border-[#FFD32A]/50 shadow-2xl text-white relative overflow-hidden">
              {/* Ambient background lighting */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFD32A]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#850000]/40 rounded-full blur-3xl pointer-events-none" />
              <div className="h-1 bg-gradient-to-r from-transparent via-[#FFD32A] to-transparent absolute top-0 left-0 right-0" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                {/* Left Column: Designation & Public Connect Information */}
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#FFD32A]/50 text-[#FFD32A] text-[11px] font-extrabold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFD32A]" />
                    <span>{t('achievements.connectBadge', 'Official Public Channel')}</span>
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                      {t('achievements.connectTitle', 'Connect with K. Vignesh')}
                    </h3>
                    <p className="text-sm sm:text-base font-bold text-[#FFD32A] mt-1 flex items-center space-x-1.5">
                      <span>{t('achievements.connectDesignation', 'Minister for Prohibition and Excise Department')}</span>
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-white/85 font-normal leading-relaxed">
                    "{t('achievements.connectSubtitle', 'Public Grievance Redressal & Civic Welfare Communications')}"
                  </p>
                </div>

                {/* Right Column: Social Media Interactive Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 shrink-0">
                  {/* Twitter / X Button */}
                  <a
                    href="https://share.google/nPAyQVqIMEpBaDacb"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Connect with K. Vignesh on Twitter / X"
                    className="flex items-center space-x-3.5 px-6 py-3.5 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/20 hover:border-[#FFD32A] text-white shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group min-w-[190px]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/10 group-hover:bg-[#FFD32A] flex items-center justify-center transition-colors">
                      <Twitter className="w-5 h-5 text-white group-hover:text-black transition-colors" />
                    </div>
                    <div className="text-left flex-1">
                      <span className="text-[10px] uppercase font-bold text-white/60 block tracking-wider">
                        {t('achievements.twitter', 'Twitter / X')}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-white group-hover:text-[#FFD32A] transition-colors flex items-center justify-between">
                        <span>@kvignesh</span>
                        <ExternalLink className="w-3.5 h-3.5 text-white/50 group-hover:text-[#FFD32A] ml-2" />
                      </span>
                    </div>
                  </a>

                  {/* Instagram Button */}
                  <a
                    href="https://share.google/RPYFcif2qdXqyEqlP"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Connect with K. Vignesh on Instagram"
                    className="flex items-center space-x-3.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#833ab4]/30 via-[#fd1d1d]/30 to-[#fcb045]/30 hover:from-[#833ab4]/50 hover:via-[#fd1d1d]/50 hover:to-[#fcb045]/50 border border-white/20 hover:border-[#FFD32A] text-white shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group min-w-[190px]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-sm">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <span className="text-[10px] uppercase font-bold text-white/60 block tracking-wider">
                        {t('achievements.instagram', 'Instagram')}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-white group-hover:text-[#FFD32A] transition-colors flex items-center justify-between">
                        <span>@kvignesh</span>
                        <ExternalLink className="w-3.5 h-3.5 text-white/50 group-hover:text-[#FFD32A] ml-2" />
                      </span>
                    </div>
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= 4. USER APPOINTMENT BOOKING SECTION & FORM ================= */}
        {activeSection === 'book-appointment' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E2DC] shadow-sm space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-[#A00000]">
                {t('citizen.bookApptHeading', 'Book Grievance Consultation Appointment')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('citizen.bookApptSub', 'Fill out the required details below. The appointment will be saved with status Pending and assigned a unique Appointment ID for administrative review.')}
              </p>
            </div>

            {bookingSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{bookingSuccessMsg}</span>
                </div>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={() => setActiveSection('my-appointments')}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer"
                  >
                    {t('citizen.viewInMyAppts', 'View in My Appointments')}
                  </button>
                  <button
                    onClick={() => setBookingSuccessMsg('')}
                    className="text-emerald-700 underline font-semibold cursor-pointer"
                  >
                    {t('citizen.bookAnotherSlot', 'Book Another Slot')}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleAppointmentSubmit} className="space-y-4 text-xs">
              {/* Field 1: Full Name & Field 2: Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizen.fullNamePrefilled', 'Full Name (Prefilled from Profile) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={appointmentForm.fullName}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, fullName: e.target.value })}
                    placeholder={t('citizen.fullNamePlaceholder', 'Enter your full name')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-[#A00000]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizen.mobileNumberRequired', 'Mobile Number *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={appointmentForm.mobileNumber}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, mobileNumber: e.target.value })}
                    placeholder={t('citizen.mobilePlaceholder', '10-digit mobile number')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-[#A00000]"
                  />
                </div>
              </div>

              {/* Field 3: Email Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('citizen.emailOptional', 'Email Address')}
                </label>
                <input
                  type="email"
                  value={appointmentForm.email}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, email: e.target.value })}
                  placeholder={t('citizen.emailPlaceholder', 'name@example.com (optional)')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-[#A00000]"
                />
              </div>

              {/* Field 4: Appointment Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('citizen.apptSubjectRequired', 'Appointment Subject *')}
                </label>
                <input
                  type="text"
                  required
                  value={appointmentForm.subject}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, subject: e.target.value })}
                  placeholder={t('citizen.apptSubjectPlaceholder', 'e.g. Community drinking water pipeline representation')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-[#A00000]"
                />
              </div>

              {/* Field 5: Appointment Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('citizen.apptDescLabel', 'Appointment Description')}
                </label>
                <textarea
                  rows="3"
                  value={appointmentForm.description}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, description: e.target.value })}
                  placeholder={t('citizen.apptDescPlaceholder', 'Provide background context and detailed points you plan to present during consultation...')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-[#A00000]"
                />
              </div>

              {/* Field 6: Preferred Date & Field 7: Preferred Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizen.preferredDateRequired', 'Preferred Date *')}
                  </label>
                  <input
                    type="date"
                    required
                    value={appointmentForm.preferredDate}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, preferredDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-[#A00000]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizen.preferredTimeRequired', 'Preferred Time Slot *')}
                  </label>
                  <select
                    value={appointmentForm.preferredTime}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, preferredTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-[#A00000]"
                  >
                    <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM</option>
                    <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM</option>
                    <option value="02:30 PM - 04:00 PM">02:30 PM - 04:00 PM</option>
                    <option value="04:30 PM - 06:00 PM">04:30 PM - 06:00 PM</option>
                    <option value="06:00 PM - 07:30 PM">06:00 PM - 07:30 PM</option>
                  </select>
                </div>
              </div>

              {/* Field 9: Additional Information */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('citizen.additionalInfoLabel', 'Additional Information (Optional)')}
                </label>
                <input
                  type="text"
                  value={appointmentForm.additionalInfo}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, additionalInfo: e.target.value })}
                  placeholder={t('citizen.additionalInfoPlaceholder', 'Supporting documents, attendee names, or special requirements')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-[#A00000]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3 bg-[#A00000] hover:bg-[#850000] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>{bookingLoading ? t('citizen.submittingAppt', 'Submitting Appointment...') : t('citizen.bookAppointment', 'Book Appointment')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= 5. MY APPOINTMENTS SECTION ================= */}
        {activeSection === 'my-appointments' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E2DC] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#252525]">
                  {t('citizen.apptHistoryHeading', 'My Appointment History & Status')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('citizen.apptHistorySub', 'Track your booked slots, confirmed dates, times, venues, and administrative remarks')}
                </p>
              </div>
              <button
                onClick={() => setActiveSection('book-appointment')}
                className="px-4 py-2 bg-[#A00000] hover:bg-[#850000] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('citizen.bookAnotherSlot', 'Book Another Slot')}</span>
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-700 text-sm">{t('citizen.noApptsRecord', 'No Appointments on Record')}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('citizen.noApptsRecordSub', 'You have not submitted any appointment requests yet.')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('book-appointment')}
                  className="px-5 py-2 bg-[#A00000] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t('citizen.bookAppointment', 'Book an Appointment')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Responsive Appointments Table / Card Layout */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-[#FFF8F0] border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-3">{t('citizen.colApptId', 'Appointment ID')}</th>
                        <th className="py-3 px-3">{t('citizen.colSubject', 'Subject')}</th>
                        <th className="py-3 px-3">{t('citizen.colReqDate', 'Requested Date')}</th>
                        <th className="py-3 px-3">{t('citizen.colReqTime', 'Requested Time')}</th>
                        <th className="py-3 px-3">{t('citizen.colConfLocation', 'Confirmed Location')}</th>
                        <th className="py-3 px-3">{t('citizen.colStatus', 'Status')}</th>
                        <th className="py-3 px-3">{t('citizen.colConfDateTime', 'Confirmed Date & Time')}</th>
                        <th className="py-3 px-3 text-right">{t('citizen.colDetails', 'Details')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appointments.map((a) => {
                        const aptId = a.appointmentId || a.tokenNumber || 'APT-2026';
                        const reqDate = a.requestedDate || a.preferredDate
                          ? new Date(a.requestedDate || a.preferredDate).toLocaleDateString()
                          : '-';
                        const reqTime = a.requestedTime || a.preferredTimeSlot || '-';
                        const reqLoc = a.requestedLocation || a.assignedVenue || 'HQ';
                        const hasConfirmed = a.confirmedDate || a.approvedDate;
                        const confDate = hasConfirmed
                          ? `${new Date(a.confirmedDate || a.approvedDate).toLocaleDateString()} (${a.confirmedTime || a.approvedTimeSlot})`
                          : '-';

                        return (
                          <tr key={a._id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 font-mono font-bold text-[#A00000] whitespace-nowrap">
                              {aptId}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 max-w-[180px] truncate" title={a.subject || a.purpose}>
                              {a.subject || a.purpose}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                              {reqDate}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                              {reqTime}
                            </td>
                            <td className="py-3 px-3 max-w-[170px] truncate text-slate-700" title={['Confirmed', 'Approved', 'Rescheduled'].includes(a.status) ? (a.confirmedLocation || a.approvedVenue || t('citizen.locationNotAssigned', 'Location not assigned')) : '-'}>
                              {['Confirmed', 'Approved', 'Rescheduled'].includes(a.status) ? (
                                <span className="flex items-center text-slate-800 font-medium">
                                  <MapPin className="w-3.5 h-3.5 mr-1 text-[#A00000] flex-shrink-0" />
                                  <span className="truncate">{a.confirmedLocation || a.approvedVenue || t('citizen.locationNotAssigned', 'Location not assigned')}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {getStatusBadge(a.status)}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-slate-800 font-medium">
                              {confDate}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedAppointment(a);
                                  setIsApptModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                title={t('citizen.viewFullDetails', 'View Full Details')}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Additional detailed cards for mobile view or quick highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {appointments.map((a) => (
                    <div
                      key={a._id}
                      className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#A00000] bg-white border border-red-200 px-2.5 py-0.5 rounded-md">
                          {a.appointmentId || a.tokenNumber}
                        </span>
                        {getStatusBadge(a.status)}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm">{a.subject || a.purpose}</h4>

                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t('citizen.requestedSchedule', 'Requested Schedule:')}</span>
                          <strong className="text-slate-700">
                            {new Date(a.requestedDate || a.preferredDate).toLocaleDateString()}
                          </strong>
                          <span className="text-[10.5px] text-slate-500 block">
                            {a.requestedTime || a.preferredTimeSlot}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t('citizen.confirmedSchedule', 'Confirmed Schedule:')}</span>
                          {a.confirmedDate || a.approvedDate ? (
                            <>
                              <strong className="text-emerald-800">
                                {new Date(a.confirmedDate || a.approvedDate).toLocaleDateString()}
                              </strong>
                              <span className="text-[10.5px] text-emerald-700 block">
                                {a.confirmedTime || a.approvedTimeSlot}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">{t('citizen.awaitingConfirmation', 'Awaiting Confirmation')}</span>
                          )}
                        </div>
                      </div>

                      {/* Confirmed Location */}
                      {['Confirmed', 'Approved', 'Rescheduled'].includes(a.status) && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-xs">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {t('citizen.confirmedLocation', 'Confirmed Location:')}
                          </span>
                          <p className="text-slate-800 font-bold mt-0.5 flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-[#A00000] flex-shrink-0" />
                            <span>
                              {a.confirmedLocation || a.approvedVenue || t('citizen.locationNotAssigned', 'Location not assigned')}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Reschedule banner */}
                      {a.rescheduleReason && (
                        <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 text-[11px]">
                          <strong>{t('citizen.rescheduleReason', 'Rescheduling Reason:')}</strong> {a.rescheduleReason}
                        </div>
                      )}

                      {/* Rejection banner */}
                      {a.rejectionReason && (
                        <div className="p-2.5 bg-red-50 text-red-900 rounded-xl border border-red-200 text-[11px]">
                          <strong>{t('citizen.rejectionReason', 'Rejection Reason:')}</strong> {a.rejectionReason}
                        </div>
                      )}

                      {/* Subadmin remarks */}
                      {a.subadminRemarks && (
                        <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl text-[11px]">
                          <strong>{t('citizen.subadminRemarks', 'Subadmin Remarks:')}</strong> {a.subadminRemarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* ================= MODAL: APPOINTMENT DETAILS & HISTORY ================= */}
      {isApptModalOpen && selectedAppointment && (
        <Modal
          isOpen={isApptModalOpen}
          onClose={() => setIsApptModalOpen(false)}
          title={`${t('citizen.apptDetailsModalTitle', 'Appointment Details')}: ${selectedAppointment.appointmentId || selectedAppointment.tokenNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">{t('citizen.colApptId', 'Appointment ID')}</span>
                <strong className="text-[#850000] font-mono font-bold text-sm">
                  {selectedAppointment.appointmentId || selectedAppointment.tokenNumber}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">{t('citizen.currentStatus', 'Current Status')}</span>
                <div className="mt-0.5">{getStatusBadge(selectedAppointment.status)}</div>
              </div>
            </div>

            <div className="p-3.5 bg-[#FFF8F0] rounded-2xl border border-[#FFE5A3] space-y-1.5">
              <span className="text-slate-500 block text-[11px]">{t('citizen.subjectPurpose', 'Subject / Purpose')}</span>
              <strong className="text-sm font-extrabold text-[#850000] block">
                {selectedAppointment.subject || selectedAppointment.purpose}
              </strong>
              {selectedAppointment.description && (
                <p className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                  {selectedAppointment.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">{t('citizen.requestedByYou', 'Requested By You')}</span>
                <p className="text-slate-800">
                  <strong>{t('citizen.dateLabel', 'Date:')}</strong> {new Date(selectedAppointment.requestedDate || selectedAppointment.preferredDate).toLocaleDateString()}
                </p>
                <p className="text-slate-800">
                  <strong>{t('citizen.slotLabel', 'Slot:')}</strong> {selectedAppointment.requestedTime || selectedAppointment.preferredTimeSlot}
                </p>
                <p className="text-slate-700">
                  <strong>{t('citizen.locationLabel', 'Location:')}</strong> {selectedAppointment.requestedLocation || selectedAppointment.assignedVenue || 'HQ'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">{t('citizen.officialConfirmedDetails', 'Official Confirmed Details')}</span>
                {selectedAppointment.confirmedDate || selectedAppointment.approvedDate ? (
                  <>
                    <p className="text-emerald-900 font-bold">
                      {t('citizen.dateLabel', 'Date:')} {new Date(selectedAppointment.confirmedDate || selectedAppointment.approvedDate).toLocaleDateString()}
                    </p>
                    <p className="text-emerald-800">
                      {t('citizen.timeLabel', 'Time:')} {selectedAppointment.confirmedTime || selectedAppointment.approvedTimeSlot}
                    </p>
                    <p className="text-emerald-800 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-[#A00000] flex-shrink-0" />
                      <span>
                        <strong>{t('citizen.locationLabel', 'Location:')}</strong>{' '}
                        {selectedAppointment.confirmedLocation || selectedAppointment.approvedVenue || t('citizen.locationNotAssigned', 'Location not assigned')}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 italic pt-2">
                    {t('citizen.pendingAdminConf', 'Pending administrative confirmation by Subadmin.')}
                  </p>
                )}
              </div>
            </div>

            {selectedAppointment.subadminRemarks && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block">{t('citizen.subadminRemarks', 'Subadmin Remarks:')}</span>
                <p className="text-slate-700 mt-0.5">{selectedAppointment.subadminRemarks}</p>
              </div>
            )}

            {selectedAppointment.rescheduleReason && (
              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
                <span className="font-bold block">{t('citizen.reschedulingExpl', 'Rescheduling Explanation:')}</span>
                <p className="mt-0.5">{selectedAppointment.rescheduleReason}</p>
              </div>
            )}

            {selectedAppointment.rejectionReason && (
              <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200">
                <span className="font-bold block">{t('citizen.rejectionExpl', 'Rejection Explanation:')}</span>
                <p className="mt-0.5">{selectedAppointment.rejectionReason}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApptModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-xl font-bold transition cursor-pointer"
              >
                {t('citizen.close', 'Close')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CitizenPortalPage;
