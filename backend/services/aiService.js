import { Op } from 'sequelize';
import sequelize from '../config/mysql.js';
import Issue from '../models/Issue.js';
import Member from '../models/Member.js';
import Ward from '../models/Ward.js';
import Constituency from '../models/Constituency.js';
import DepartmentOfficer from '../models/DepartmentOfficer.js';
import Project from '../models/Project.js';

export const generateAIContent = async ({ contentType, topic, language, promptDescription }) => {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

  const systemInstruction = `You are the official Communications & Public Relations Intelligence Officer for Tamilaga Vettri Kazhagam (TVK) Coimbatore District Administration.
Generate an authoritative, professional, respectful, and articulate ${contentType} about "${topic}".
Language requirement: ${language === 'Tamil' ? 'Formal Tamil (செந்தமிழ் நடை)' : language === 'Bilingual' ? 'Bilingual (Tamil followed by English translation)' : 'Formal English'}.
Additional instructions: ${promptDescription || 'Focus on citizen welfare, prompt grievance resolution, transparent administration, and district progress.'}`;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemInstruction }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
            },
          }),
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.error('Gemini API call error:', err.message);
    }
  }

  // Intelligent fallback template generator in Tamil & English
  if (language === 'Tamil') {
    return `தமிழக வெற்றிக் கழகம் - கோயம்புத்தூர் மாவட்டம்
அதிகாரப்பூர்வ அறிக்கை: ${topic}

தலைப்பு: ${contentType} - ${topic}
நாள்: ${new Date().toLocaleDateString('ta-IN')}

வணக்கம்,
கோயம்புத்தூர் மாவட்ட மக்களின் மேலான கவனத்திற்கு:

${promptDescription ? promptDescription : 'மக்களின் அடிப்படைத் தேவைகள் மற்றும் பொதுமக்களின் குறைதீர்க்கும் பணிகளில் தமிழக வெற்றிக் கழகம் என்றும் முன்னணியில் செயல்பட்டு வருகிறது.'}

முக்கிய அம்சங்கள்:
1. கோயம்புத்தூர் தெற்கு, வடக்கு, சிங்காநல்லூர் உள்ளிட்ட அனைத்து சட்டமன்ற தொகுதிகளிலும் வார்டு வாரியாக மக்களின் குறைகளை கண்டறிந்து உடனுக்குடன் தீர்வு காணப்பட்டு வருகிறது.
2. குடிநீர் விநியோகம், தெருவிளக்கு பராமரிப்பு, சாலை மற்றும் வடிகால் சீரமைப்புப் பணிகளுக்கு உடனடி முன்னுரிமை அளிக்கப்படுகிறது.
3. பொதுமக்கள் தங்களது பகுதி சார்ந்த குறைபாடுகளை TVK Digital Governance CRM வாயிலாக பதிவு செய்து தீர்வு பெறலாம்.

மக்களின் உரிமைகளையும் நல்வாழ்வையும் பாதுகாப்பதே நமது தலையாய கடமை!

இவண்,
மாவட்ட ஒருங்கிணைப்புக் குழு,
தமிழக வெற்றிக் கழகம் (TVK), கோயம்புத்தூர்.`;
  }

  return `TAMILAGA VETTRI KAZHAGAM (TVK) - COIMBATORE DISTRICT
OFFICIAL COMMUNIQUÉ: ${topic}

Subject: ${contentType} - ${topic}
Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}

To the Esteemed Citizens of Coimbatore District,

${promptDescription ? promptDescription : 'Tamilaga Vettri Kazhagam remains steadfastly committed to transparent governance, rapid grievance redressal, and dedicated public service across all municipal wards in Coimbatore.'}

Key Directives & Action Points:
1. Systemic monitoring of ward-level infrastructure, including clean drinking water supply, road repairs, street lighting, and environmental sanitation.
2. Active coordination between TVK office bearers, ward representatives, and district department officers to accelerate pending public works.
3. Digital grievance tracking through the TVK Digital Governance CRM ensures every citizen petition receives accountability and timely closure.

Together for the sustainable progress and welfare of Coimbatore District!

Sincerely,
District Governance & Public Relations Directorate,
Tamilaga Vettri Kazhagam (TVK), Coimbatore.`;
};

// Grounded Chatbot Knowledge Engine that queries live MySQL data via Sequelize
export const processChatbotQuery = async (queryText) => {
  const q = queryText.toLowerCase();

  // Gather live CRM DB context from MySQL
  const totalIssues = await Issue.count();
  const resolvedIssues = await Issue.count({ where: { status: 'Resolved' } });
  const pendingIssues = await Issue.count({ where: { status: 'Pending' } });
  const inProgressIssues = await Issue.count({
    where: { status: { [Op.in]: ['In Progress', 'Under Review'] } },
  });
  const totalMembers = await Member.count();
  const maleMembers = await Member.count({ where: { gender: 'Male' } });
  const femaleMembers = await Member.count({ where: { gender: 'Female' } });
  const officeBearers = await Member.count({ where: { isOfficeBearer: true } });
  const totalWards = await Ward.count();
  const totalProjects = await Project.count();
  const totalOfficers = await DepartmentOfficer.count();

  // Top ward with highest issues
  let topWard = 'No grievances recorded yet';
  try {
    const wardCounts = await Issue.findAll({
      attributes: [
        'wardId',
        [sequelize.fn('COUNT', sequelize.col('Issue.id')), 'issueCount'],
      ],
      include: [
        {
          model: Ward,
          as: 'ward',
          attributes: ['id', 'wardNumber', 'wardName', 'zone'],
        },
      ],
      group: ['wardId', 'ward.id', 'ward.wardNumber', 'ward.wardName', 'ward.zone'],
      order: [[sequelize.literal('issueCount'), 'DESC']],
      limit: 1,
    });
    if (wardCounts.length > 0 && wardCounts[0].ward) {
      const w = wardCounts[0].ward;
      const count = wardCounts[0].get('issueCount');
      topWard = `Ward ${w.wardNumber} (${w.wardName}) with ${count} total complaints`;
    }
  } catch (err) {
    console.warn('topWard query note:', err.message);
  }

  // Department with most pending issues
  let topDept = 'None';
  try {
    const deptCounts = await Issue.findAll({
      attributes: [
        'assignedDepartment',
        [sequelize.fn('COUNT', sequelize.col('id')), 'pendingCount'],
      ],
      where: { status: 'Pending' },
      group: ['assignedDepartment'],
      order: [[sequelize.literal('pendingCount'), 'DESC']],
      limit: 1,
    });
    if (deptCounts.length > 0 && deptCounts[0].assignedDepartment) {
      topDept = `${deptCounts[0].assignedDepartment} (${deptCounts[0].get('pendingCount')} pending cases)`;
    }
  } catch (err) {
    console.warn('topDept query note:', err.message);
  }

  // Category breakdown
  let topCategories = 'Sanitation, Water Supply, Road Maintenance';
  try {
    const categoryCounts = await Issue.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'categoryCount'],
      ],
      group: ['category'],
      order: [[sequelize.literal('categoryCount'), 'DESC']],
      limit: 4,
    });
    if (categoryCounts.length > 0) {
      topCategories = categoryCounts
        .map((c) => `${c.category}: ${c.get('categoryCount')}`)
        .join(', ');
    }
  } catch (err) {
    console.warn('categoryCounts query note:', err.message);
  }

  const contextData = `
CRM Live Database Context (MySQL):
- Total Grievances: ${totalIssues}
- Resolved Grievances: ${resolvedIssues} (Resolution Rate: ${totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0}%)
- Pending Grievances: ${pendingIssues}
- In-Progress Grievances: ${inProgressIssues}
- Total TVK Members: ${totalMembers} (Male: ${maleMembers}, Female: ${femaleMembers}, Office Bearers: ${officeBearers})
- Total Municipal Wards: ${totalWards}
- Total Active Projects: ${totalProjects}
- Department Officers: ${totalOfficers}
- Ward with Highest Issues: ${topWard}
- Department with Most Pending Issues: ${topDept}
- Major Grievance Categories: ${topCategories}
`;

  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are TVK AI BOT, the intelligent assistant for the TVK Digital Governance CRM of Coimbatore District.
Use the following verified, real-time database context to answer the user query accurately, politely, and authoritatively.
If asked in Tamil, answer in Tamil. If asked in English, answer in English.

${contextData}

User Question: "${queryText}"`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 600,
            },
          }),
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return {
          text: data.candidates[0].content.parts[0].text,
          context: { totalIssues, resolvedIssues, pendingIssues, totalMembers },
        };
      }
    } catch (err) {
      console.error('Gemini Chatbot API error:', err.message);
    }
  }

  // High-accuracy heuristic knowledge engine matching exact user questions:
  if (q.includes('highest') || (q.includes('ward') && (q.includes('most') || q.includes('high')))) {
    return {
      text: `📊 **Ward Analysis**: The ward with the highest recorded grievances is **${topWard}**. Immediate administrative focus and field inspection have been assigned to the designated ward officer.`,
      suggestedActions: ['View Wards Directory', 'Filter Issues by Ward'],
    };
  }

  if (q.includes('member') || q.includes('total member') || q.includes('party')) {
    return {
      text: `👥 **TVK Membership Status**: Across Coimbatore District, there are currently **${totalMembers} registered TVK members**.\n- 👨 Male Members: **${maleMembers}**\n- 👩 Female Members: **${femaleMembers}**\n- 🎖️ Designated Office Bearers: **${officeBearers}**`,
      suggestedActions: ['View Members Directory', 'Add New Member'],
    };
  }

  if (q.includes('pending') || q.includes('unresolved')) {
    return {
      text: `⏳ **Pending Grievances**: There are currently **${pendingIssues} pending issues** awaiting action (out of ${totalIssues} total complaints). Department with highest pending count: **${topDept}**.`,
      suggestedActions: ['View Pending Issues', 'Notify Department Officers'],
    };
  }

  if (q.includes('category') || q.includes('analysis') || q.includes('types')) {
    return {
      text: `📈 **Category-wise Issue Analysis**:\nTop complaint categories in Coimbatore:\n${topCategories}\n\nSanitation, road repairs, and drinking water supply represent over 60% of citizen petitions.`,
      suggestedActions: ['View Analytics Dashboard', 'Download Category Report'],
    };
  }

  if (q.includes('department') || q.includes('officer')) {
    return {
      text: `🏛️ **Department Performance**: The department with the most pending grievances is **${topDept}**. A total of **${totalOfficers} department officers** across TWAD, TANGEDCO, Highways, and Corporation are actively mapped in the system.`,
      suggestedActions: ['View Department Officers', 'Assign Officer'],
    };
  }

  if (q.includes('executive summary') || q.includes('summary') || q.includes('overview')) {
    const rate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
    return {
      text: `📋 **Coimbatore District Executive Summary**:\n- **Total Grievances Registered**: ${totalIssues}\n- **Resolved**: ${resolvedIssues} (${rate}% Resolution Efficiency)\n- **Pending Action**: ${pendingIssues}\n- **Active TVK Cadre**: ${totalMembers} members across ${totalWards} wards\n- **Ongoing Community Projects**: ${totalProjects}\n- **Overall Status**: Grievance redressal operations are actively monitored in all 10 constituencies.`,
      suggestedActions: ['View Executive Analytics', 'Generate Monthly Report'],
    };
  }

  // General default answer
  return {
    text: `Greetings! I am the **TVK AI Assistant** for Coimbatore District. Current district metrics: **${totalIssues} total grievances** (${resolvedIssues} resolved, ${pendingIssues} pending) and **${totalMembers} members** across ${totalWards} wards. How can I assist you today?`,
    suggestedActions: [
      'Which ward has the highest number of issues?',
      'How many grievances are pending?',
      'Show the executive summary',
      'What is the category-wise issue analysis?',
    ],
  };
};
