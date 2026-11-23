import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, Clock, CheckCircle2, Phone, AlertCircle, ChevronRight, Image as ImageIcon, X, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import Footer from '../../components/layout/Footer';
import BeforeAfterComparison from '../../components/common/BeforeAfterComparison';
import ImagePreviewModal from '../../components/common/ImagePreviewModal';
import { getBeforeImageUrl, getAfterImageUrl } from '../../utils/imageUtils';

export const MyComplaintsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [mobileSearch, setMobileSearch] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [searched, setSearched] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  // Zoomable Image Preview Modal State
  const [zoomModal, setZoomModal] = useState({
    isOpen: false,
    imageUrl: null,
    title: '',
    ticketId: '',
    type: 'BEFORE',
  });

  const openZoom = (imageUrl, title, ticketId, type = 'BEFORE') => {
    setZoomModal({
      isOpen: true,
      imageUrl,
      title: title || `${type === 'AFTER' ? 'After Resolution' : 'Before Work'} Proof`,
      ticketId: ticketId || '',
      type,
    });
  };

  const closeZoom = () => {
    setZoomModal((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchComplaints = async (phoneToQuery) => {
    const q = phoneToQuery !== undefined ? phoneToQuery : mobileSearch;

    setLoading(true);
    setSearched(true);
    try {
      const params = { limit: 50 };
      if (q && q.trim()) {
        params.search = q.trim();
      }
      const res = await api.get('/issues', { params });
      if (res.data.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(user?.phone || '');
    // Live status polling every 6 seconds
    const timer = setInterval(() => {
      fetchComplaints(mobileSearch || user?.phone || '');
    }, 6000);
    return () => clearInterval(timer);
  }, [user]);

  const handleDownloadComplaintPDF = async (complaint) => {
    if (!complaint) return;
    const complaintKey = complaint._id || complaint.id;
    setDownloadingPdfId(complaintKey);

    try {
      let cData = complaint;
      try {
        const fetchId = complaint.id || complaint._id;
        if (fetchId) {
          const detailRes = await api.get(`/issues/${fetchId}`);
          if (detailRes.data?.success && detailRes.data?.data) {
            cData = detailRes.data.data.issue || detailRes.data.data;
          }
        }
      } catch (fetchErr) {
        console.warn('Could not fetch single issue detail, using in-memory complaint data:', fetchErr.message);
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      // Header Banner
      doc.setFillColor(160, 0, 0);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setFillColor(255, 211, 42);
      doc.rect(0, 28, pageWidth, 2.5, 'F');

      doc.setTextColor(255, 211, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TAMIZHAGA VETRI KAZHAGAM (TVK)', pageWidth / 2, 11, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('COIMBATORE DISTRICT CITIZEN GRIEVANCE REDRESSAL RECORD', pageWidth / 2, 17.5, { align: 'center' });
      doc.setFontSize(7.5);
      doc.text('Official Digital Governance CRM Portal • Citizen Acknowledgement Copy', pageWidth / 2, 23, { align: 'center' });

      let currentY = 37;
      doc.setTextColor(160, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL COMPLAINT ACKNOWLEDGEMENT & SUMMARY', margin, currentY);

      const issueCode = cData.issueCode || cData.complaintId || (cData.id ? `CMP-${cData.id}` : 'N/A');
      const regDate = cData.createdAt
        ? new Date(cData.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'N/A';

      doc.setTextColor(110, 110, 110);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        pageWidth - margin,
        currentY,
        { align: 'right' }
      );

      // Status indicator on top sub-header
      currentY += 4.5;
      const status = cData.status || 'Pending';
      const isCompleted = ['Completed', 'Resolved', 'Closed'].includes(status);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Current Status: ', margin, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isCompleted ? 16 : 180, isCompleted ? 120 : 80, isCompleted ? 60 : 0);
      doc.text(String(status).toUpperCase(), margin + 21, currentY);

      currentY += 3.5;

      const citizenName = cData.citizenName || user?.name || 'Citizen';
      const citizenMobile = cData.citizenMobile || user?.phone || 'Not Available';
      const paguthi = cData.paguthi || cData.ward?.paguthi || user?.paguthi || 'Coimbatore';
      const wardNum = cData.ward?.wardNumber || cData.wardId?.wardNumber || cData.wardNumber;
      const wardName = cData.ward?.wardName || cData.wardId?.wardName || cData.wardName;
      const assignedWard = wardNum
        ? `Ward ${wardNum}${wardName ? ` - ${wardName}` : ''}`
        : (user?.assignedWard || 'Not Assigned');
      const constituency =
        cData.constituency?.name || cData.constituencyName || cData.constituency || user?.constituency || 'Coimbatore';
      const category = cData.category || 'General Civic Grievance';
      const address = cData.citizenAddress || cData.address || cData.location || user?.address || 'Not Provided';

      const runAutoTable = (options) => {
        if (typeof doc.autoTable === 'function') {
          doc.autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        }
      };

      // 3. Official Complaint Details Table (Exact 1-9 Field Order)
      runAutoTable({
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [
            {
              content: 'OFFICIAL COMPLAINT DETAILS',
              colSpan: 2,
              styles: { fillColor: [133, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            },
          ],
        ],
        body: [
          [
            { content: 'Complaint ID / Reference Number:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: issueCode, styles: { fontStyle: 'bold', textColor: [160, 0, 0] } },
          ],
          [
            { content: 'Citizen Name:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: citizenName },
          ],
          [
            { content: 'Mobile Number:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: citizenMobile },
          ],
          [
            { content: 'Paguthi:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: paguthi },
          ],
          [
            { content: 'Assigned Ward:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: assignedWard },
          ],
          [
            { content: 'Constituency:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: constituency },
          ],
          [
            { content: 'Date:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: regDate },
          ],
          [
            { content: 'Category:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: category },
          ],
          [
            { content: 'Address:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            { content: address },
          ],
        ],
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.8, textColor: [35, 35, 35], overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold', fillColor: [250, 248, 245] },
          1: { cellWidth: 127 },
        },
      });

      currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 65) + 5;

      // 4. Section: Detailed Description of Grievance
      const descBody = cData.title && cData.title !== cData.description
        ? `Subject: ${cData.title}\n\n${cData.description || 'No detailed description provided.'}`
        : (cData.description || 'No detailed description provided.');

      runAutoTable({
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [
            {
              content: 'Detailed Description of Grievance',
              styles: { fillColor: [133, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            },
          ],
        ],
        body: [
          [
            {
              content: descBody,
              styles: { cellPadding: 3.5, fontSize: 8.5, lineHeightFactor: 1.35, overflow: 'linebreak' },
            },
          ],
        ],
        theme: 'grid',
        styles: { textColor: [35, 35, 35] },
      });

      currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 30) + 4;

      // 5. Section: Field Resolution & Administrative Actions (if completed/resolved or has notes)
      const actionTaken = cData.actionTaken || cData.finalReport;
      const remarks = cData.wardSecretaryRemarks;

      if (isCompleted || actionTaken || remarks) {
        const resBody = [];
        if (actionTaken) {
          resBody.push([
            { content: 'Action Taken / Ground Resolution:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            actionTaken,
          ]);
        }
        if (remarks) {
          resBody.push([
            { content: 'Ward Secretary Remarks:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            remarks,
          ]);
        }
        if (cData.completedAt || cData.resolvedAt) {
          const compDate = new Date(cData.completedAt || cData.resolvedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          resBody.push([
            { content: 'Resolution Date:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
            compDate,
          ]);
        }

        runAutoTable({
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [
            [
              {
                content: 'FIELD RESOLUTION & ADMINISTRATIVE ACTIONS',
                colSpan: 2,
                styles: { fillColor: [16, 120, 60], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
              },
            ],
          ],
          body:
            resBody.length > 0
              ? resBody
              : [
                  [
                    { content: 'Status Note:', styles: { fontStyle: 'bold', fillColor: [250, 248, 245] } },
                    'Issue inspected and resolved satisfactorily by Ward team.',
                  ],
                ],
          theme: 'grid',
          styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [35, 35, 35], overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 55, fontStyle: 'bold', fillColor: [250, 248, 245] },
            1: { cellWidth: 127 },
          },
        });
        currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 30) + 4;
      }

      // 6. Authenticity Notice
      if (currentY > pageHeight - 38) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(255, 248, 240);
      doc.setDrawColor(255, 211, 42);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 16, 2, 2, 'FD');

      doc.setTextColor(160, 0, 0);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('DIGITAL GOVERNANCE AUTHENTICITY NOTICE', margin + 3, currentY + 4.5);

      doc.setTextColor(70, 70, 70);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'This document serves as an official electronic acknowledgement issued by the TVK Digital Governance CRM.',
        margin + 3,
        currentY + 8.5
      );
      doc.text(
        'Citizens can track live progress at any time through the TVK Citizen Portal using their registered mobile number.',
        margin + 3,
        currentY + 12.5
      );

      // 7. Footer on all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(
          'Tamizhaga Vetri Kazhagam (TVK) • Coimbatore District Central Administrative Office',
          margin,
          pageHeight - 9
        );
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
      }

      const cleanCode = String(issueCode).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `TVK-Complaint-${cleanCode}.pdf`;
      doc.save(fileName);
      notifySuccess(`Downloaded complaint PDF: ${fileName}`);
    } catch (err) {
      console.error('Error generating complaint PDF:', err);
      notifyError('Failed to generate complaint PDF. Please try again.');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-sans">
      <header className="w-full bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] border-b-[3px] border-[#FFD32A] px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between text-white">
        <Link to="/citizen" className="flex items-center space-x-2 text-xs font-semibold text-white/90 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('citizen.backToServices', 'Back to Citizen Services')}</span>
        </Link>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-[#FFD32A] uppercase hidden sm:inline">{t('citizen.myComplaints', 'My Complaints')}</span>
          <LanguageSwitcher variant="dark" />
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E2DC] shadow-sm space-y-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#A00000]">{t('citizen.myComplaints', 'My Complaints')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{t('citizen.myComplaintsDesc', 'Track your complaint status and field resolution updates.')}</p>
          </div>

          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchComplaints();
            }}
            className="flex items-center gap-2 pt-2"
          >
            <div className="relative flex-1">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                placeholder={t('citizen.trackPlaceholder', 'Enter registered mobile number or issue code (e.g. 9842567890 or GRI-2026-1001)')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:ring-[#A00000]"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 bg-[#B00000] hover:bg-[#850000] text-white font-bold rounded-xl text-xs shadow transition cursor-pointer"
            >
              {t('common.search', 'Search')}
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner text={t('common.loading', 'Searching complaints repository...')} />
        ) : complaints.length === 0 ? (
          searched && (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
              <p className="font-bold text-slate-700 text-sm">{t('reports.noData', 'No complaints found')}</p>
              <p className="text-xs">
                {t('citizen.noComplaintsYetSub', 'No active complaints match the search query. Verify your mobile number or file a new complaint.')}
              </p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => {
              const isCompleted = c.status === 'Completed' || c.status === 'Resolved';
              const beforeImg = c.beforeImage || c.beforePhoto || (c.attachments && c.attachments[0]?.fileUrl);
              const afterImg = c.afterImage || c.afterPhoto;

              return (
                <div
                  key={c._id}
                  className={`bg-white rounded-3xl p-6 border shadow-sm space-y-4 transition ${
                    isCompleted ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-[#E9E2DC]'
                  }`}
                >
                  {/* Status header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                        {c.issueCode || c.complaintId}
                      </span>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center space-x-3 flex-wrap">
                      <span className="text-[11px] text-slate-400">
                        {t('citizen.registeredOn', 'Filed on')} {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadComplaintPDF(c)}
                        disabled={downloadingPdfId === (c._id || c.id)}
                        className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#A00000] border border-red-200 hover:border-red-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50 shrink-0 min-h-[32px]"
                        title="Download Official Complaint PDF"
                      >
                        {downloadingPdfId === (c._id || c.id) ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span>Download PDF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                    <p className="text-xs font-medium text-amber-800 mt-0.5">
                      {t('common.category', 'Category')}: {c.category} • {t('common.ward', 'Ward')} {c.wardNumber || c.wardId?.wardNumber || 'General'}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  {/* USER SUCCESS NOTIFICATION BANNER & RESOLUTION VIEW */}
                  {isCompleted && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-900">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <h4 className="text-sm font-extrabold tracking-wide">
                          {t('citizen.complaintFixedSuccess', 'Your complaint was fixed successfully!')}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-950">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('citizen.colApptId', 'Complaint ID')}:</span>
                          <span className="font-mono font-bold text-slate-900">{c.issueCode || c.complaintId}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('citizen.colConfDateTime', 'Completed Date')}:</span>
                          <span className="font-bold text-slate-900">
                            {c.completedAt || c.resolvedAt ? new Date(c.completedAt || c.resolvedAt).toLocaleString() : 'Recently'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('citizen.actionTaken', 'Action Taken / Ground Resolution')}:</span>
                          <p className="font-semibold bg-white p-2.5 rounded-xl border border-emerald-200 mt-0.5 whitespace-pre-wrap">
                            {c.actionTaken || c.finalReport || 'Issue inspected and resolved satisfactorily by Ward team.'}
                          </p>
                        </div>
                        {c.wardSecretaryRemarks && (
                          <div className="sm:col-span-2">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('citizen.subadminRemarks', 'Ward Secretary Remarks')}:</span>
                            <p className="italic text-slate-700 bg-white/70 p-2 rounded-lg border border-emerald-100 mt-0.5">
                              "{c.wardSecretaryRemarks}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Before / After Images Comparison for Citizen */}
                      <div className="pt-2 border-t border-emerald-200/60">
                        <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block mb-2">
                          {t('citizen.viewEvidencePhotos', 'Ground Resolution Evidence (Before / After Photos)')}:
                        </span>
                        <BeforeAfterComparison
                          complaint={c}
                          onImageClick={openZoom}
                          height="h-40"
                        />
                      </div>
                    </div>
                  )}

                  {/* Supporting Photo if In Progress / Pending / New */}
                  {!isCompleted && getBeforeImageUrl(c) && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Attached Supporting Photo:
                      </span>
                      <div
                        className="inline-block bg-white p-2 rounded-xl border border-slate-200 cursor-pointer hover:border-red-400 transition"
                        onClick={() => openZoom(getBeforeImageUrl(c), 'Citizen Supporting Photo', c.issueCode || c.complaintId, 'BEFORE')}
                      >
                        <img
                          src={getBeforeImageUrl(c)}
                          alt="Supporting Photo"
                          className="w-32 h-24 object-cover rounded-lg border border-slate-100"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Progress Details */}
                  {!isCompleted && (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100">
                      <span>
                        {t('common.status', 'Status')}: <strong className="text-slate-700">{t(`status.${c.status}`, c.status)}</strong>
                        {c.assignedWardSecretaryId && (
                          <span className="ml-2 text-indigo-700 font-semibold">
                            (Assigned to Ward Secretary)
                          </span>
                        )}
                      </span>
                      <span>
                        {t('common.ward', 'Ward')}: <strong>Ward {c.wardNumber || c.wardId?.wardNumber || '72'}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Fullscreen Zoomable Image Preview Modal */}
        <ImagePreviewModal
          isOpen={zoomModal.isOpen}
          onClose={closeZoom}
          imageUrl={zoomModal.imageUrl}
          title={zoomModal.title}
          ticketId={zoomModal.ticketId}
          type={zoomModal.type}
        />
      </main>
      <Footer />
    </div>
  );
};

export default MyComplaintsPage;
