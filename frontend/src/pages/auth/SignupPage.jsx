import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import Footer from '../../components/layout/Footer';
import coimbatoreCityBg from '../../assets/coimbatore-city-bg.png';
import vickyAnaImg from '../../assets/vicky ana.png';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { success: notifySuccess, error: notifyError } = useNotification();

  // ONLY 3 FIELDS AS REQUIRED: Name, Phone Number, Password
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanName) {
      setErrorMessage(t('auth.namePlaceholder'));
      return;
    }

    // Validate Indian mobile number format: 10 digits starting with 6, 7, 8, or 9
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!indianMobileRegex.test(cleanPhone)) {
      setErrorMessage(
        'Please enter a valid 10-digit Indian mobile number (e.g., 9842567890)'
      );
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: cleanName,
        phoneNumber: cleanPhone,
        password,
      });

      if (res.data.success) {
        notifySuccess(
          'Citizen account registered successfully! Please sign in with your phone number and password.'
        );
        // After successful registration: redirect to Login Page as requested
        navigate('/login');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your phone number and details.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-sans overflow-x-hidden">
      {/* 1. TOP HEADER WITH GLOBAL LANGUAGE SELECTOR */}
      <header className="w-full bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] border-b-[3px] border-[#FFD32A] px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between relative z-20 flex-shrink-0">
        <div className="w-10 sm:w-28"></div>

        {/* Center Headings */}
        <div className="text-center flex-1 px-2">
          <h1 className="text-white text-base sm:text-xl md:text-2xl font-bold tracking-normal drop-shadow-xs">
            {t('header.systemTitle')}
          </h1>
          <div className="flex items-center justify-center space-x-2 mt-0.5">
            <span className="w-6 sm:w-10 h-[1px] bg-[#FFD32A]"></span>
            <span className="text-[#FFD32A] text-[10px] sm:text-xs font-bold tracking-widest uppercase">
              {t('header.adminPortal')}
            </span>
            <span className="w-6 sm:w-10 h-[1px] bg-[#FFD32A]"></span>
          </div>
        </div>

        {/* Right: Global Language Switcher */}
        <div className="w-auto flex justify-end">
          <LanguageSwitcher variant="dark" />
        </div>
      </header>

      {/* 2. MAIN CENTERED SIGNUP CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center py-4 sm:py-6 md:py-8 px-3 sm:px-6 md:px-8 w-full">
        <div className="w-full max-w-[1240px] bg-white rounded-[24px] shadow-[0_10px_40px_rgba(133,0,0,0.08)] border border-[#E9E2DC]/80 overflow-hidden flex flex-col md:flex-row self-center">
          
          {/* ================= LEFT PANEL ================= */}
          <div
            className="w-full md:w-[54%] lg:w-[56%] relative flex flex-col justify-between p-4 sm:p-6 md:p-7 pb-0 sm:pb-0 md:pb-0 text-white min-h-[280px] sm:min-h-[360px] md:min-h-[460px] lg:min-h-[500px] overflow-hidden"
            style={{
              backgroundImage: `url(${coimbatoreCityBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Transparent Maroon Gradient Overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(115, 0, 0, 0.22) 0%, rgba(120, 0, 0, 0.35) 45%, rgba(85, 0, 0, 0.52) 100%)',
              }}
            />

            {/* Top Badge */}
            <div className="relative z-10 pt-1">
              <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#FFD32A] animate-pulse"></span>
                <span className="text-white tracking-wide">{t('auth.adminGovernanceCRM')}</span>
              </div>
            </div>

            {/* Profile Image + Text Side-by-Side Horizontal Layout */}
            <div className="relative z-10 w-full mt-auto pt-3">
              <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-4 md:gap-5">
                
                {/* PROMINENT LARGE PROFILE IMAGE (BIGGER THAN CONTENT) */}
                <div className="flex justify-start items-end flex-shrink-0">
                  <img
                    src={vickyAnaImg}
                    alt="TVK Leadership - Coimbatore"
                    className="w-[180px] sm:w-[240px] md:w-[260px] lg:w-[320px] xl:w-[360px] max-h-[240px] sm:max-h-[300px] md:max-h-[340px] lg:max-h-[390px] object-contain drop-shadow-2xl filter brightness-105"
                    style={{
                      objectPosition: 'bottom left',
                    }}
                  />
                </div>

                {/* TEXT CONTENT IMMEDIATELY TO THE RIGHT */}
                <div className="pb-3 sm:pb-5 md:pb-6 text-left flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl font-extrabold leading-snug text-white drop-shadow-md">
                    {t('auth.dedicated')}
                    <span className="block text-[#FFD32A] mt-0.5">{t('auth.delivering')}</span>
                  </h2>

                  {/* Decorative Underline */}
                  <div className="w-10 h-1 bg-[#FFD32A] rounded-full mt-2 mb-2 shadow-xs"></div>

                  <p className="text-white/95 text-xs sm:text-[12.5px] leading-relaxed drop-shadow-sm font-medium">
                    {t('auth.leftDesc')}
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* ================= RIGHT PANEL (ONLY 3 FIELDS SIGNUP FORM) ================= */}
          <div className="w-full md:w-[46%] lg:w-[44%] p-4 sm:p-6 md:p-8 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto space-y-3.5 sm:space-y-4">
              
              {/* Form Title & Subtitle */}
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#A00000] tracking-tight">
                  {t('auth.signupTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-[#747474] mt-0.5 font-medium">
                  {t('auth.signupSubtitle')}
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[#A00000] text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
                
                {/* FIELD 1: NAME */}
                <div>
                  <label className="block text-[11px] font-bold text-[#252525] mb-1 tracking-wider uppercase">
                    {t('auth.name')} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('auth.namePlaceholder')}
                      className="w-full bg-white border border-[#E9E2DC] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#252525] placeholder-slate-400 focus:outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/20 transition"
                    />
                  </div>
                </div>

                {/* FIELD 2: PHONE NUMBER */}
                <div>
                  <label className="block text-[11px] font-bold text-[#252525] mb-1 tracking-wider uppercase">
                    {t('auth.phoneNumber')} *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder={t('auth.phonePlaceholder')}
                      className="w-full bg-white border border-[#E9E2DC] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#252525] placeholder-slate-400 focus:outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/20 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter valid 10-digit mobile number for SMS notifications
                  </p>
                </div>

                {/* FIELD 3: PASSWORD */}
                <div>
                  <label className="block text-[11px] font-bold text-[#252525] mb-1 tracking-wider uppercase">
                    {t('auth.password')} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.enterPassword')}
                      className="w-full bg-white border border-[#E9E2DC] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#252525] placeholder-slate-400 focus:outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* SUBMIT BUTTON: CREATE ACCOUNT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#B00000] hover:bg-[#850000] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 text-xs sm:text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('auth.creatingAccount')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{t('auth.createAccount')}</span>
                    </>
                  )}
                </button>
              </form>

              {/* BOTTOM TEXT: ALREADY HAVE AN ACCOUNT? SIGN IN */}
              <div className="text-center pt-2 text-xs">
                <span className="text-[#747474]">{t('auth.alreadyAccount')} </span>
                <Link
                  to="/login"
                  className="font-bold text-[#A00000] hover:underline inline-flex items-center"
                >
                  {t('auth.signIn')} →
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignupPage;
