import { Op } from 'sequelize';
import Issue from '../models/Issue.js';
import Member from '../models/Member.js';
import Ward from '../models/Ward.js';
import DepartmentOfficer from '../models/DepartmentOfficer.js';
import Project from '../models/Project.js';
import Constituency from '../models/Constituency.js';
import XLSX from 'xlsx';

// @desc    Get Detailed Consolidated Report Data
// @route   GET /api/reports/data
// @access  Private
export const getReportData = async (req, res) => {
  try {
    const { reportType = 'grievances', startDate, endDate, constituencyId, wardId } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          [Op.gte]: new Date(startDate),
          [Op.lte]: new Date(endDate),
        },
      };
    }

    let result = {};

    switch (reportType) {
      case 'grievances': {
        const where = { ...dateQuery };
        if (constituencyId) {
          const cNum = Number(constituencyId);
          if (!isNaN(cNum) && cNum > 0) where.constituencyId = cNum;
          else {
            const c = await Constituency.findOne({ where: { _id: String(constituencyId) } });
            if (c) where.constituencyId = c.id;
          }
        }
        if (wardId) {
          const wNum = Number(wardId);
          if (!isNaN(wNum) && wNum > 0) where.wardId = wNum;
          else {
            const w = await Ward.findOne({ where: { _id: String(wardId) } });
            if (w) where.wardId = w.id;
          }
        }

        const issues = await Issue.findAll({
          where,
          include: [
            { model: Ward, as: 'ward', attributes: ['id', '_id', 'wardNumber', 'wardName'] },
            { model: Constituency, as: 'constituency', attributes: ['id', '_id', 'name'] },
            { model: DepartmentOfficer, as: 'assignedOfficerDetails', attributes: ['id', '_id', 'officerName', 'department'] },
          ],
          order: [['createdAt', 'DESC']],
        });

        const records = issues.map((r) => ({
          ...r.toObject(),
          wardId: r.ward,
          constituencyId: r.constituency,
          assignedOfficerId: r.assignedOfficerDetails,
        }));

        result = {
          title: 'Coimbatore District Grievances Comprehensive Report',
          records,
          total: records.length,
          resolved: records.filter((r) => r.status === 'Resolved').length,
          pending: records.filter((r) => r.status === 'Pending').length,
          inProgress: records.filter((r) => ['In Progress', 'Under Review'].includes(r.status)).length,
        };
        break;
      }

      case 'members': {
        const where = { ...dateQuery };
        if (constituencyId) {
          const cNum = Number(constituencyId);
          if (!isNaN(cNum) && cNum > 0) where.constituencyId = cNum;
          else {
            const c = await Constituency.findOne({ where: { _id: String(constituencyId) } });
            if (c) where.constituencyId = c.id;
          }
        }
        if (wardId) {
          const wNum = Number(wardId);
          if (!isNaN(wNum) && wNum > 0) where.wardId = wNum;
          else {
            const w = await Ward.findOne({ where: { _id: String(wardId) } });
            if (w) where.wardId = w.id;
          }
        }

        const members = await Member.findAll({
          where,
          include: [
            { model: Ward, as: 'ward', attributes: ['id', '_id', 'wardNumber', 'wardName'] },
            { model: Constituency, as: 'constituency', attributes: ['id', '_id', 'name'] },
          ],
          order: [['memberId', 'ASC']],
        });

        const records = members.map((m) => ({
          ...m.toObject(),
          wardId: m.ward,
          constituencyId: m.constituency,
        }));

        result = {
          title: 'TVK Coimbatore Cadre & Office Bearers Roster',
          records,
          total: records.length,
          male: records.filter((r) => r.gender === 'Male').length,
          female: records.filter((r) => r.gender === 'Female').length,
          officeBearers: records.filter((r) => r.isOfficeBearer).length,
        };
        break;
      }

      case 'wards': {
        const wards = await Ward.findAll({
          include: [{ model: Constituency, as: 'constituency', attributes: ['name'] }],
        });

        const augmented = await Promise.all(
          wards.map(async (w) => {
            const totalIssues = await Issue.count({ where: { wardId: w.id } });
            const resolved = await Issue.count({ where: { wardId: w.id, status: 'Resolved' } });
            const members = await Member.count({ where: { wardId: w.id } });
            return {
              wardNumber: w.wardNumber,
              wardName: w.wardName,
              zone: w.zone,
              constituency: w.constituency ? w.constituency.name : '-',
              totalIssues,
              resolvedIssues: resolved,
              pendingIssues: totalIssues - resolved,
              totalMembers: members,
            };
          })
        );

        result = {
          title: 'Ward-wise Governance & Performance Audit',
          records: augmented,
          totalWards: augmented.length,
        };
        break;
      }

      case 'departments': {
        const officers = await DepartmentOfficer.findAll();
        const depts = [
          'Corporation / Municipal Admin',
          'TWAD Board (Water Supply)',
          'TANGEDCO (Electricity)',
          'Highways & Road Infrastructure',
          'Public Health & Sanitation',
          'Police & Traffic Management',
        ];

        const records = await Promise.all(
          depts.map(async (d) => {
            const total = await Issue.count({ where: { assignedDepartment: d } });
            const resolved = await Issue.count({ where: { assignedDepartment: d, status: 'Resolved' } });
            const officersInDept = officers.filter((o) => o.department.includes(d.split(' ')[0])).length;
            return {
              department: d,
              totalIssues: total,
              resolvedIssues: resolved,
              pendingIssues: total - resolved,
              officersCount: officersInDept,
              resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
            };
          })
        );

        result = {
          title: 'Department Redressal Performance Scorecard',
          records,
        };
        break;
      }

      case 'projects': {
        const projects = await Project.findAll({
          include: [
            { model: Ward, as: 'ward', attributes: ['id', '_id', 'wardNumber', 'wardName'] },
            { model: Constituency, as: 'constituency', attributes: ['id', '_id', 'name'] },
          ],
        });

        const records = projects.map((p) => ({
          ...p.toObject(),
          wardId: p.ward,
          constituencyId: p.constituency,
        }));

        result = {
          title: 'District Initiatives & Infrastructure Projects',
          records,
          total: records.length,
          completed: records.filter((p) => p.status === 'Completed').length,
          ongoing: records.filter((p) => p.status === 'Ongoing').length,
        };
        break;
      }

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export Consolidated Report to Excel
// @route   GET /api/reports/export/excel
// @access  Private
export const exportReportExcel = async (req, res) => {
  try {
    const { reportType = 'grievances' } = req.query;

    if (reportType === 'grievances') {
      const issues = await Issue.findAll({
        include: [
          { model: Ward, as: 'ward', attributes: ['wardNumber', 'wardName'] },
          { model: Constituency, as: 'constituency', attributes: ['name'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      const data = issues.map((r) => ({
        'Grievance Code': r.issueCode,
        'Citizen Name': r.citizenName,
        Contact: r.citizenMobile,
        Category: r.category,
        Ward: r.ward ? `Ward ${r.ward.wardNumber} - ${r.ward.wardName}` : '-',
        Constituency: r.constituency ? r.constituency.name : '-',
        Department: r.assignedDepartment || '-',
        Priority: r.priority,
        Status: r.status,
        'Date Registered': new Date(r.createdAt).toLocaleDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Grievance_Report');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="TVK_Grievances_Report.xlsx"');
      return res.send(buffer);
    }

    if (reportType === 'members') {
      const members = await Member.findAll({
        include: [
          { model: Ward, as: 'ward', attributes: ['wardNumber', 'wardName'] },
          { model: Constituency, as: 'constituency', attributes: ['name'] },
        ],
      });

      const data = members.map((m) => ({
        'Member ID': m.memberId,
        'Full Name': m.fullName,
        Gender: m.gender,
        Mobile: m.mobileNumber,
        Designation: m.designation,
        Ward: m.ward ? `Ward ${m.ward.wardNumber} - ${m.ward.wardName}` : '-',
        Status: m.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Members_Report');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="TVK_Members_Report.xlsx"');
      return res.send(buffer);
    }

    res.status(400).json({ success: false, message: 'Invalid report export type' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
