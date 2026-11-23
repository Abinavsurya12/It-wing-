import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Helper translations for standard CRM terms to Tamil
const DISTRICT_MAP = {
  Coimbatore: 'கோயம்புத்தூர்',
  coimbatore: 'கோயம்புத்தூர்',
};

const CONSTITUENCY_MAP = {
  Kinathukadavu: 'கிணத்துக்கடவு',
  Pollachi: 'பொள்ளாச்சி',
  Sulur: 'சூலூர்',
  Singanallur: 'சிங்கநல்லூர்',
  'Coimbatore South': 'கோயம்புத்தூர் தெற்கு',
  'Coimbatore North': 'கோயம்புத்தூர் வடக்கு',
  Thondamuthur: 'தொண்டாமுத்தூர்',
  Kavundampalayam: 'கவுண்டம்பாளையம்',
  Mettupalayam: 'மேட்டுப்பாளையம்',
  Valparai: 'வால்பாறை',
};

const PAGUTHI_MAP = {
  'Kinathukadavu Ondriyam': 'கிணத்துக்கடவு ஒன்றியம்',
  Pothanur: 'போத்தனூர்',
  Podanur: 'போத்தனூர்',
  Kurichi: 'குறிச்சி',
  Sundarapuram: 'சுந்தராபுரம்',
  Malumichampatti: 'மலுமிச்சம்பட்டி',
  'Madukkarai Nagaram': 'மதுக்கரை நகரம்',
  'Vellalur Nagaram': 'வெள்ளலூர் நகரம்',
  'Othakkalmandapam Peruratchi': 'ஒத்தக்கால்மண்டபம் பேரூராட்சி',
  'Chettipalayam Peruratchi': 'செட்டிபாளையம் பேரூராட்சி',
  'Ettimadai Peruratchi': 'எட்டிமடை பேரூராட்சி',
  'Thirumalayampalayam Peruratchi': 'திருமலையம்பாளையம் பேரூராட்சி',
  Kurumbapalayam: 'குரும்பபாளையம்',
  'Perur Chettipalayam': 'பேரூர் செட்டிபாளையம்',
};

const CATEGORY_MAP = {
  'Drinking Water': 'குடிநீர் விநியோகம்',
  'Sanitation / Drainage': 'சாக்கடை / கழிவுநீர் வடிகால்',
  'Street Lights': 'தெருவிளக்கு பராமரிப்பு',
  'Road Maintenance': 'சாலை பராமரிப்பு',
  'Roads & Transport': 'சாலை & போக்குவரத்து',
  'Solid Waste': 'திடக்கழிவு மேலாண்மை',
  'Public Health': 'பொது சுகாதாரம்',
  Electricity: 'மின்சார வசதி',
  Other: 'இதர பொதுக் குறைகள்',
};

const STATUS_MAP = {
  New: 'புதிய புகார் (New)',
  Pending: 'பரிசீலனையில் உள்ளது (Pending)',
  Assigned: 'பொறுப்பாளருக்கு ஒதுக்கப்பட்டது (Assigned)',
  'Under Review': 'ஆய்வில் உள்ளது (Under Review)',
  'In Progress': 'நடவடிக்கையில் உள்ளது (In Progress)',
  Completed: 'தீர்வு காணப்பட்டது (Completed)',
  Resolved: 'தீர்வு காணப்பட்டது (Resolved)',
  Closed: 'முடிக்கப்பட்டது (Closed)',
  Rejected: 'நிராகரிக்கப்பட்டது (Rejected)',
};

const PRIORITY_MAP = {
  Low: 'குறைந்த முன்னுரிமை (Low)',
  Medium: 'நடுத்தர முன்னுரிமை (Medium)',
  High: 'அதிக முன்னுரிமை (High)',
  Critical: 'அவசர முன்னுரிமை (Critical)',
};

const toTamilDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ta-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Generate and download an authentic, professionally styled Tamil complaint acknowledgement PDF.
 *
 * @param {Object} complaint - Complaint record from MySQL database
 * @param {Object} currentUser - Currently authenticated user profile
 */
export const downloadTamilComplaintPdf = async (complaint, currentUser) => {
  if (!complaint) return;

  const cData = complaint.issue || complaint;

  // Extract clean data fields
  const issueCode = cData.issueCode || cData.complaintId || (cData.id ? `GRI-${cData.id}` : 'N/A');
  const regDate = toTamilDate(cData.createdAt);
  const citizenName = cData.citizenName || currentUser?.name || 'பொதுமக்கள்';
  const citizenMobile = cData.citizenMobile || currentUser?.phone || 'கிடைக்கவில்லை';
  const rawDistrict = cData.district?.name || cData.district || 'Coimbatore';
  const district = DISTRICT_MAP[rawDistrict] || rawDistrict;
  const rawConstituency = cData.constituency?.name || cData.constituencyName || cData.constituency || currentUser?.constituency || 'Kinathukadavu';
  const constituency = CONSTITUENCY_MAP[rawConstituency] || rawConstituency;
  const rawPaguthi = cData.paguthi || cData.ward?.paguthi || currentUser?.paguthi || 'கிணத்துக்கடவு ஒன்றியம்';
  const paguthi = PAGUTHI_MAP[rawPaguthi] || rawPaguthi;
  const wardNum = cData.ward?.wardNumber || cData.wardNumber || cData.wardId?.wardNumber || 'குறிப்பிடப்படவில்லை';
  const wardDisplay = wardNum !== 'குறிப்பிடப்படவில்லை' ? `வார்டு ${wardNum}` : 'குறிப்பிடப்படவில்லை';
  const rawCategory = cData.category || 'Drinking Water';
  const category = CATEGORY_MAP[rawCategory] || rawCategory;
  const title = cData.title || 'பொது மக்கள் குறை';
  const description = cData.description || 'விவரம் வழங்கப்படவில்லை.';
  const rawStatus = cData.status || 'New';
  const status = STATUS_MAP[rawStatus] || rawStatus;
  const rawPriority = cData.priority || 'Medium';
  const priority = PRIORITY_MAP[rawPriority] || rawPriority;

  // Official assignment details
  const assignedSecretary = cData.assignedWardSecretary?.name || cData.assignedWardSecretaryName || null;
  const secretaryPhone = cData.assignedWardSecretary?.phone || null;
  const assignedDepartment = cData.assignedDepartment || null;
  const officialDetails = assignedSecretary
    ? `${assignedSecretary}${secretaryPhone ? ` (${secretaryPhone})` : ''}${assignedDepartment ? ` • ${assignedDepartment}` : ''}`
    : assignedDepartment
    ? assignedDepartment
    : 'ஒதுக்கீடு பரிசீலனையில் உள்ளது (Under Assignment)';

  const actionTaken = cData.actionTaken || cData.finalReport || null;
  const wardRemarks = cData.wardSecretaryRemarks || null;
  const resolvedDate = cData.completedAt || cData.resolvedAt ? toTamilDate(cData.completedAt || cData.resolvedAt) : null;
  const citizenAddress = cData.citizenAddress || cData.address || cData.location || currentUser?.address || null;

  // Multi-page determination
  const isLengthy = description.length > 550 || Boolean(actionTaken || wardRemarks);
  const totalPages = isLengthy ? 2 : 1;

  // Split description across pages if multi-page
  let page1Desc = description;
  let page2Desc = '';
  if (isLengthy) {
    if (description.length > 550) {
      // Clean split around word boundary
      const splitIndex = description.lastIndexOf(' ', 500);
      page1Desc = description.slice(0, splitIndex > 0 ? splitIndex : 500) + '... (தொடர்ச்சி அடுத்த பக்கத்தில்)';
      page2Desc = description.slice(splitIndex > 0 ? splitIndex : 500).trim();
    } else {
      page1Desc = description;
      page2Desc = '';
    }
  }

  // Create temporary container for high-res rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // 210mm at 96 DPI
  container.style.zIndex = '-9999';
  container.style.fontFamily = "'Noto Sans Tamil', 'Nirmala UI', 'Latha', 'Tamil Sangam MN', sans-serif";

  const renderDate = toTamilDate(new Date());

  // Page 1 HTML
  const page1 = document.createElement('div');
  page1.style.width = '794px';
  page1.style.minHeight = '1123px';
  page1.style.height = '1123px';
  page1.style.boxSizing = 'border-box';
  page1.style.backgroundColor = '#ffffff';
  page1.style.color = '#1f2937';
  page1.style.display = 'flex';
  page1.style.flexDirection = 'column';
  page1.style.justifyContent = 'space-between';
  page1.style.padding = '32px 36px';
  page1.style.position = 'relative';

  page1.innerHTML = `
    <div>
      <!-- Official Header Banner -->
      <div style="background: linear-gradient(135deg, #850000 0%, #A00000 50%, #850000 100%); padding: 16px 20px; border-radius: 12px; border-bottom: 4px solid #FFD32A; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; color: #ffffff;">
        <div style="font-size: 20px; font-weight: 800; color: #FFD32A; letter-spacing: 0.5px; margin-bottom: 4px;">
          தமிழ்நாடு வெற்றி கழகம் – Digital Governance
        </div>
        <div style="font-size: 11px; font-weight: 600; opacity: 0.95; letter-spacing: 0.3px;">
          கோயம்புத்தூர் மாவட்டம் • மக்கள் குறைதீர்வு நிர்வாக அமைப்பு (Citizen Grievance Redressal)
        </div>
        <div style="font-size: 9.5px; opacity: 0.85; margin-top: 2px;">
          உத்தியோகபூர்வ டிஜிட்டல் ஆளுகை குறைதீர்ப்பு பதிவுத் தொகுதி
        </div>
      </div>

      <!-- Document Title & Identification Strip -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding: 10px 14px; background: #FFF8F0; border: 1px solid #FFE5A3; border-radius: 10px;">
        <div>
          <div style="font-size: 13px; font-weight: 800; color: #A00000;">
            புகார் பதிவு ஒப்புகைச் சீட்டு
          </div>
          <div style="font-size: 9.5px; color: #6b7280; margin-top: 1px;">
            Official Complaint Acknowledgement Slip
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 9px; color: #6b7280;">புகார் எண் / Reference No:</div>
          <div style="font-size: 14px; font-weight: 800; color: #A00000; font-family: monospace; letter-spacing: 0.5px;">
            ${issueCode}
          </div>
        </div>
      </div>

      <!-- Priority & Date Meta Bar -->
      <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 9.5px; padding: 6px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div><strong>புகார் பதிவு செய்த தேதி:</strong> ${regDate}</div>
        <div><strong>முன்னுரிமை:</strong> <span style="color: #A00000; font-weight: 700;">${priority}</span></div>
        <div><strong>தற்போதைய நிலை:</strong> <span style="color: #047857; font-weight: 700;">${status}</span></div>
      </div>

      <!-- Comprehensive 2-Column Table of Complaint Details -->
      <div style="margin-top: 14px;">
        <div style="font-size: 10.5px; font-weight: 800; color: #850000; text-transform: uppercase; margin-bottom: 6px; border-left: 3px solid #FFD32A; padding-left: 6px;">
          புகார் மற்றும் கள இருப்பிட விவரங்கள் (Grievance & Jurisdiction Details)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #E9E2DC; border-radius: 8px; overflow: hidden;">
          <tbody>
            <tr style="border-bottom: 1px solid #E9E2DC;">
              <td style="width: 25%; padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">புகார் அளித்தவரின் பெயர்:</td>
              <td style="width: 25%; padding: 7px 10px; font-weight: 600; color: #111827;">${citizenName}</td>
              <td style="width: 25%; padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">பதிவு செய்யப்பட்ட மொபைல் எண்:</td>
              <td style="width: 25%; padding: 7px 10px; font-weight: 600; color: #111827; font-family: monospace;">${citizenMobile}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E9E2DC;">
              <td style="padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">மாவட்டம்:</td>
              <td style="padding: 7px 10px; font-weight: 600; color: #111827;">${district}</td>
              <td style="padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">சட்டமன்றத் தொகுதி:</td>
              <td style="padding: 7px 10px; font-weight: 600; color: #111827;">${constituency}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E9E2DC;">
              <td style="padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">ஒன்றியம் / பகுதி (Paguthi):</td>
              <td style="padding: 7px 10px; font-weight: 600; color: #111827;">${paguthi}</td>
              <td style="padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">வார்டு எண்:</td>
              <td style="padding: 7px 10px; font-weight: 600; color: #111827;">${wardDisplay}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E9E2DC;">
              <td style="padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">புகார் வகை:</td>
              <td style="padding: 7px 10px; font-weight: 600; color: #A00000;">${category}</td>
              <td style="padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">இருப்பிட முகவரி:</td>
              <td style="padding: 7px 10px; color: #374151;">${citizenAddress || 'வழங்கப்படவில்லை'}</td>
            </tr>
            <tr>
              <td style="padding: 7px 10px; background: #FFF8F0; font-weight: 700; color: #374151;">தொடர்புடைய ஒதுக்கீடு / அதிகாரி:</td>
              <td colspan="3" style="padding: 7px 10px; font-weight: 600; color: #1e3a8a;">${officialDetails}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grievance Subject / Title -->
      <div style="margin-top: 14px; background: #ffffff; border: 1px solid #E9E2DC; border-radius: 8px; padding: 9px 12px;">
        <div style="font-size: 9.5px; font-weight: 700; color: #850000; margin-bottom: 3px;">
          புகார் தலைப்பு (Subject):
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #111827;">
          ${title}
        </div>
      </div>

      <!-- Grievance Full Description -->
      <div style="margin-top: 12px; background: #ffffff; border: 1px solid #E9E2DC; border-radius: 8px; padding: 10px 12px;">
        <div style="font-size: 9.5px; font-weight: 700; color: #850000; margin-bottom: 4px;">
          புகாரின் முழு விவரம் (Detailed Grievance Description):
        </div>
        <div style="font-size: 10px; line-height: 1.6; color: #374151; white-space: pre-wrap;">
          ${page1Desc}
        </div>
      </div>

      ${!isLengthy && (actionTaken || wardRemarks) ? `
      <!-- Single Page Field Resolution Section if present -->
      <div style="margin-top: 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 9px 12px;">
        <div style="font-size: 10px; font-weight: 800; color: #166534; margin-bottom: 4px;">
          கள நடவடிக்கை & தீர்வு விவரங்கள் (Field Resolution & Remarks):
        </div>
        ${actionTaken ? `<div style="font-size: 9.5px; color: #14532d; margin-bottom: 2px;"><strong>மேற்கொள்ளப்பட்ட நடவடிக்கை:</strong> ${actionTaken}</div>` : ''}
        ${wardRemarks ? `<div style="font-size: 9.5px; color: #14532d; margin-bottom: 2px;"><strong>வார்டு செயலாளர் குறிப்பு:</strong> ${wardRemarks}</div>` : ''}
        ${resolvedDate ? `<div style="font-size: 9px; color: #15803d;"><strong>தீர்வு நாள்:</strong> ${resolvedDate}</div>` : ''}
      </div>
      ` : ''}

      ${!isLengthy ? `
      <!-- Official TVK Verification Box -->
      <div style="margin-top: 14px; background: #FFF8F0; border: 1px dashed #FFD32A; border-radius: 8px; padding: 10px 12px; font-size: 8.5px; color: #78350f; line-height: 1.5;">
        <strong>டிஜிட்டல் ஆளுகை உறுதிமொழி:</strong> உங்கள் புகார் வெற்றிகரமாக TVK நிர்வாகத் தளத்தில் பதிவு செய்யப்பட்டு தொடர்புடைய வார்டு பொறுப்பாளர்களுக்கு ஒதுக்கீட்டிற்கு அனுப்பப்பட்டுள்ளது. உங்கள் பதிவு செய்யப்பட்ட கைபேசி எண் மூலம் எப்போது வேண்டுமானாலும் புகார் நிலையை நேரலையாகக் கண்காணிக்கலாம்.
      </div>
      ` : ''}
    </div>

    <!-- Official Footer Page 1 -->
    <div style="margin-top: 16px; border-top: 1px solid #E5E7EB; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #6b7280;">
      <div>
        தமிழ்நாடு வெற்றி கழகம் (TVK) • கோயம்புத்தூர் மாவட்ட மத்திய தலைமை நிர்வாகம்
      </div>
      <div>
        பதிவிறக்கம்: ${renderDate} • பக்கம் 1 / ${totalPages}
      </div>
    </div>
  `;

  container.appendChild(page1);

  // Page 2 HTML (if multi-page)
  let page2 = null;
  if (isLengthy) {
    page2 = document.createElement('div');
    page2.style.width = '794px';
    page2.style.minHeight = '1123px';
    page2.style.height = '1123px';
    page2.style.boxSizing = 'border-box';
    page2.style.backgroundColor = '#ffffff';
    page2.style.color = '#1f2937';
    page2.style.display = 'flex';
    page2.style.flexDirection = 'column';
    page2.style.justifyContent = 'space-between';
    page2.style.padding = '32px 36px';
    page2.style.position = 'relative';

    page2.innerHTML = `
      <div>
        <!-- Compact Header for Continued Page -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #850000; color: #ffffff; padding: 10px 16px; border-radius: 8px; border-bottom: 3px solid #FFD32A;">
          <div>
            <span style="font-size: 13px; font-weight: 800; color: #FFD32A;">தமிழ்நாடு வெற்றி கழகம் – Digital Governance</span>
            <span style="font-size: 10px; margin-left: 8px; opacity: 0.9;">(தொடர்ச்சி / Continued)</span>
          </div>
          <div style="font-size: 11px; font-weight: 700; font-family: monospace;">
            ${issueCode}
          </div>
        </div>

        ${page2Desc ? `
        <!-- Continued Grievance Description -->
        <div style="margin-top: 16px; background: #ffffff; border: 1px solid #E9E2DC; border-radius: 8px; padding: 12px 14px;">
          <div style="font-size: 10px; font-weight: 800; color: #850000; margin-bottom: 6px;">
            புகாரின் தொடர்ச்சி (Grievance Description Continued):
          </div>
          <div style="font-size: 10px; line-height: 1.6; color: #374151; white-space: pre-wrap;">
            ${page2Desc}
          </div>
        </div>
        ` : ''}

        ${actionTaken || wardRemarks ? `
        <!-- Field Resolution & Administrative Actions -->
        <div style="margin-top: 16px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 800; color: #166534; margin-bottom: 6px; border-left: 3px solid #22c55e; padding-left: 6px;">
            கள நடவடிக்கை & தீர்வு விவரங்கள் (Field Resolution & Actions Taken)
          </div>
          ${actionTaken ? `
          <div style="font-size: 10px; color: #14532d; margin-bottom: 5px;">
            <strong>மேற்கொள்ளப்பட்ட கள நடவடிக்கை:</strong><br/>
            <span style="display: block; margin-top: 2px; color: #1f2937;">${actionTaken}</span>
          </div>` : ''}
          ${wardRemarks ? `
          <div style="font-size: 10px; color: #14532d; margin-bottom: 5px;">
            <strong>வார்டு செயலாளர் குறிப்புகள்:</strong><br/>
            <span style="display: block; margin-top: 2px; color: #1f2937;">${wardRemarks}</span>
          </div>` : ''}
          ${resolvedDate ? `
          <div style="font-size: 9.5px; color: #15803d; margin-top: 6px;">
            <strong>தீர்வு காணப்பட்ட தேதி:</strong> ${resolvedDate}
          </div>` : ''}
        </div>
        ` : ''}

        <!-- Official Seal and Authenticity Section -->
        <div style="margin-top: 24px; padding: 14px 16px; background: #FFF8F0; border: 1px solid #FFE5A3; border-radius: 10px;">
          <div style="font-size: 11px; font-weight: 800; color: #850000; margin-bottom: 4px;">
            டிஜிட்டல் ஆளுகை உத்தியோகபூர்வ சான்றிதழ் (Digital Governance Certificate)
          </div>
          <p style="font-size: 9px; line-height: 1.5; color: #4b5563; margin-bottom: 12px;">
            இந்த ஆவணம் TVK டிஜிட்டல் ஆளுகை CRM தளம் மூலம் முறையாகப் பதிவு செய்யப்பட்டு களப் பணிகளுக்குப் பரிந்துரைக்கப்பட்ட மக்கள் குறையின் அதிகாரப்பூர்வ மின்னணு ஒப்புகைச் சீட்டு ஆகும். கணினியால் உருவாக்கப்பட்ட இந்த ஆவணத்திற்கு கையொப்பம் தேவையில்லை.
          </p>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; border-top: 1px dashed #e5e7eb;">
            <div style="font-size: 9px; color: #6b7280;">
              <div>TVK கோயம்புத்தூர் மாவட்ட தகவல் மேலாண்மை மையம்</div>
              <div>மின்னஞ்சல்: support@tvkcrm.org • இணையதளம்: tvk.governance.crm</div>
            </div>
            <div style="text-align: center; border: 2px solid #A00000; border-radius: 8px; padding: 6px 12px; color: #A00000; font-size: 9px; font-weight: 800;">
              TVK DIGITAL VERIFIED<br/>
              <span style="font-size: 7.5px; font-weight: normal; color: #374151;">மின்னணு சரிபார்ப்பு பெற்றது</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Official Footer Page 2 -->
      <div style="margin-top: 16px; border-top: 1px solid #E5E7EB; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #6b7280;">
        <div>
          தமிழ்நாடு வெற்றி கழகம் (TVK) • கோயம்புத்தூர் மாவட்ட மத்திய தலைமை நிர்வாகம்
        </div>
        <div>
          பதிவிறக்கம்: ${renderDate} • பக்கம் 2 / ${totalPages}
        </div>
      </div>
    `;

    container.appendChild(page2);
  }

  document.body.appendChild(container);

  try {
    // Wait for document fonts to load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // High quality rasterization of Page 1
    const canvas1 = await html2canvas(page1, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData1, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    // Page 2 if multi-page
    if (page2) {
      const canvas2 = await html2canvas(page2, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
      doc.addPage('a4', 'portrait');
      doc.addImage(imgData2, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const cleanCode = String(issueCode).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `TVK-Grievance-Tamil-${cleanCode}.pdf`;
    doc.save(fileName);
    return { success: true, fileName };
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};
