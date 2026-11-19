import { Op } from 'sequelize';
import Ward from '../models/Ward.js';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import Constituency from '../models/Constituency.js';

// @desc    Get Paguthi Seyalaalar Dashboard Data (Strictly Scoped to req.user.paguthi)
// @route   GET /api/paguthi-seyalaalar/dashboard
// @access  Private (paguthi_seyalaalar, superadmin, district_admin)
export const getPaguthiDashboard = async (req, res) => {
  try {
    const userRole = req.user?.role;
    let paguthi = req.user?.paguthi;

    // Admin override support if query param provided, otherwise default to Pothanur
    if (['superadmin', 'district_admin'].includes(userRole)) {
      paguthi = req.query.paguthi || paguthi || 'Pothanur';
    }

    if (!paguthi) {
      return res.status(400).json({
        success: false,
        message: 'No assigned Paguthi found for this user account',
      });
    }

    // Canonical handling for Pothanur / Podanur
    const paguthiFilter = (paguthi === 'Pothanur' || paguthi === 'Podanur')
      ? ['Pothanur', 'Podanur']
      : [paguthi];
    const canonicalName = (paguthi === 'Podanur') ? 'Pothanur' : paguthi;

    // 1. Fetch all wards for this Paguthi
    const wards = await Ward.findAll({
      where: {
        paguthi: { [Op.in]: paguthiFilter },
      },
      order: [['wardNumber', 'ASC']],
    });

    const wardIds = wards.map((w) => w.id);

    // 2. Fetch all active registered ward secretaries for this Paguthi
    const registeredSecretaries = await User.findAll({
      where: {
        role: { [Op.in]: ['ward_secretary', 'ward', 'ward_officer'] },
        isActive: true,
        [Op.or]: [
          { paguthi: { [Op.in]: paguthiFilter } },
          ...(wardIds.length > 0 ? [{ wardId: { [Op.in]: wardIds } }] : []),
        ],
      },
      attributes: ['id', '_id', 'name', 'username', 'phone', 'email', 'assignedWard', 'paguthi', 'wardId'],
    });

    // 3. Paguthi-level complaint counts
    const paguthiIssueWhere = {
      [Op.or]: [
        { paguthi: { [Op.in]: paguthiFilter } },
        ...(wardIds.length > 0 ? [{ wardId: { [Op.in]: wardIds } }] : []),
      ],
    };

    const totalComplaints = await Issue.count({ where: paguthiIssueWhere });
    const pendingComplaints = await Issue.count({
      where: {
        ...paguthiIssueWhere,
        status: { [Op.in]: ['New', 'Pending', 'Assigned', 'Under Review'] },
      },
    });
    const inProgressComplaints = await Issue.count({
      where: {
        ...paguthiIssueWhere,
        status: 'In Progress',
      },
    });
    const resolvedComplaints = await Issue.count({
      where: {
        ...paguthiIssueWhere,
        status: { [Op.in]: ['Completed', 'Resolved', 'Closed'] },
      },
    });

    // 4. Fetch all complaints for this Paguthi with citizen & ward details
    const allComplaints = await Issue.findAll({
      where: paguthiIssueWhere,
      order: [['createdAt', 'DESC']],
    });

    // 5. Augment each ward with its live secretary and ward-level complaints
    const augmentedWards = wards.map((w) => {
      // Find matching secretary user
      const secUser = registeredSecretaries.find((s) => {
        if (s.wardId && s.wardId === w.id) return true;
        if (s.assignedWard) {
          const matchNum = String(s.assignedWard).match(/\d+/);
          if (matchNum && Number(matchNum[0]) === Number(w.wardNumber)) return true;
        }
        return false;
      });

      let secretaryName = 'Not Assigned';
      let contactNumber = '—';

      if (secUser) {
        secretaryName = secUser.name;
        contactNumber = secUser.phone || '—';
      } else if (w.wardSecretary && w.wardSecretary.trim() && w.wardSecretary !== 'Not Assigned') {
        secretaryName = w.wardSecretary.trim();
        contactNumber = w.contactNumber || '—';
      } else if (w.officeBearer && w.officeBearer.trim() && w.officeBearer !== 'Not Assigned') {
        secretaryName = w.officeBearer.trim();
        contactNumber = w.contactNumber || '—';
      }

      // Filter complaints for this specific ward
      const wardComplaints = allComplaints.filter((c) => {
        if (c.wardId && c.wardId === w.id) return true;
        if (c.wardNumber && Number(c.wardNumber) === Number(w.wardNumber)) return true;
        return false;
      });

      const wTotal = wardComplaints.length;
      const wPending = wardComplaints.filter((c) =>
        ['New', 'Pending', 'Assigned', 'Under Review'].includes(c.status)
      ).length;
      const wInProgress = wardComplaints.filter((c) => c.status === 'In Progress').length;
      const wResolved = wardComplaints.filter((c) =>
        ['Completed', 'Resolved', 'Closed'].includes(c.status)
      ).length;

      return {
        id: w.id,
        _id: w._id,
        wardNumber: w.wardNumber,
        wardName: w.wardName,
        tamilName: w.tamilName || '',
        zone: w.zone || 'South Zone',
        areaCoverage: w.areaCoverage || '',
        population: w.population || 0,
        wardSecretary: secretaryName,
        contactNumber,
        hasAssignedSecretary: secretaryName !== 'Not Assigned',
        secretaryUser: secUser ? { id: secUser.id, name: secUser.name, username: secUser.username, phone: secUser.phone } : null,
        stats: {
          totalComplaints: wTotal,
          pendingComplaints: wPending,
          inProgressComplaints: wInProgress,
          resolvedComplaints: wResolved,
        },
        complaints: wardComplaints.map((c) => ({
          id: c.id,
          _id: c._id,
          issueCode: c.issueCode || `GRI-${c.id}`,
          complaintId: c.complaintId || c.issueCode || `GRI-${c.id}`,
          title: c.title,
          description: c.description,
          category: c.category,
          priority: c.priority,
          status: c.status,
          createdAt: c.createdAt,
          wardNumber: c.wardNumber || w.wardNumber,
          wardName: w.wardName,
          paguthi: canonicalName,
          citizenName: c.citizenName || 'Citizen',
          citizenMobile: c.citizenMobile || '—',
          location: c.location || c.citizenAddress || '—',
          workStartedAt: c.workStartedAt,
          resolvedAt: c.resolvedAt,
        })),
      };
    });

    res.json({
      success: true,
      data: {
        paguthi: canonicalName,
        username: req.user?.username,
        stats: {
          totalWards: wards.length,
          registeredSecretaries: registeredSecretaries.length,
          totalComplaints,
          pendingComplaints,
          inProgressComplaints,
          resolvedComplaints,
        },
        wards: augmentedWards,
        allComplaints: allComplaints.map((c) => ({
          id: c.id,
          _id: c._id,
          issueCode: c.issueCode || `GRI-${c.id}`,
          complaintId: c.complaintId || c.issueCode || `GRI-${c.id}`,
          title: c.title,
          description: c.description,
          category: c.category,
          priority: c.priority,
          status: c.status,
          createdAt: c.createdAt,
          wardNumber: c.wardNumber,
          paguthi: canonicalName,
          citizenName: c.citizenName || 'Citizen',
          citizenMobile: c.citizenMobile || '—',
          location: c.location || c.citizenAddress || '—',
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching Paguthi Seyalaalar dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Ward-specific Complaints for authenticated Paguthi Seyalaalar
// @route   GET /api/paguthi-seyalaalar/wards/:wardId/complaints
// @access  Private (paguthi_seyalaalar, superadmin, district_admin)
export const getPaguthiWardComplaints = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userPaguthi = req.user?.paguthi;
    const { wardId } = req.params;

    const ward = await Ward.findById(wardId);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }

    // Strict Paguthi boundary check
    if (userRole === 'paguthi_seyalaalar') {
      const allowed = (userPaguthi === 'Podanur') ? 'Pothanur' : userPaguthi;
      const wardPaguthi = (ward.paguthi === 'Podanur') ? 'Pothanur' : ward.paguthi;
      if (allowed && wardPaguthi && allowed.toLowerCase() !== wardPaguthi.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You are only authorized to access records for ${allowed} Paguthi.`,
        });
      }
    }

    const complaints = await Issue.findAll({
      where: {
        [Op.or]: [
          { wardId: ward.id },
          {
            [Op.and]: [
              { wardNumber: ward.wardNumber },
              { paguthi: ward.paguthi },
            ],
          },
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        ward: {
          id: ward.id,
          wardNumber: ward.wardNumber,
          wardName: ward.wardName,
          paguthi: ward.paguthi,
        },
        complaints,
      },
    });
  } catch (error) {
    console.error('Error fetching ward complaints:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
