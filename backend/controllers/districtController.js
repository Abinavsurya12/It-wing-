import { Op } from 'sequelize';
import District from '../models/District.js';
import Constituency from '../models/Constituency.js';
import Ward from '../models/Ward.js';
import Issue from '../models/Issue.js';
import Member from '../models/Member.js';
import User from '../models/User.js';

// @desc    Get District Overview
// @route   GET /api/districts
// @access  Private
export const getDistrictOverview = async (req, res) => {
  try {
    let district = await District.findOne({ where: { code: 'CBE' } });
    if (!district) {
      district = await District.create({
        name: 'Coimbatore',
        tamilName: 'கோயம்புத்தூர்',
        code: 'CBE',
        headquarters: 'Coimbatore Corporation Office, Town Hall',
        totalConstituencies: 10,
        totalWards: 100,
      });
    }

    const constituencies = await Constituency.findAll({ order: [['name', 'ASC']] });
    const totalIssues = await Issue.count();
    const totalMembers = await Member.count();
    const totalWards = await Ward.count();

    res.json({
      success: true,
      data: {
        district,
        constituencies,
        stats: {
          totalConstituencies: constituencies.length,
          totalWards,
          totalIssues,
          totalMembers,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const KINATHUKADAVU_LOCAL_BODIES = [
  'Pothanur',
  'Kurichi',
  'Sundarapuram',
  'Malumichampatti',
  'Thondamuthur Therkku Ondriyam',
  'Thondamuthur Merkku Ondriyam',
  'Madukkarai Therkku Ondriyam',
  'Madukkarai Merkku Ondriyam',
  'Madukkarai Nagaram',
  'Vellalur Nagaram',
  'Othakkalmandapam Peruratchi',
  'Chettipalayam Peruratchi',
];

// @desc    Get all constituencies
// @route   GET /api/constituencies
// @access  Private
export const getConstituencies = async (req, res) => {
  try {
    const constituencies = await Constituency.findAll({ order: [['name', 'ASC']] });
    // Augment with live ward, member, issue, and paguthi counts
    const augmented = await Promise.all(
      constituencies.map(async (c) => {
        const cId = c.id;
        const wardCount = await Ward.count({ where: { constituencyId: cId } });
        const issueCount = await Issue.count({ where: { constituencyId: cId } });
        const memberCount = await Member.count({ where: { constituencyId: cId } });

        // Count distinct paguthis or default for Kinathukadavu
        let paguthiList = c.paguthis || [];
        if (c.name && c.name.toLowerCase().includes('kinathu')) {
          paguthiList = KINATHUKADAVU_LOCAL_BODIES;
        } else if (c.paguthis && c.paguthis.length > 0) {
          paguthiList = typeof c.paguthis === 'string' ? JSON.parse(c.paguthis) : [...c.paguthis];
        }

        // Dynamically include any other paguthis with wards for non-fixed constituencies
        if (!c.name || !c.name.toLowerCase().includes('kinathu')) {
          const dbWardPaguthis = await Ward.findAll({
            where: { constituencyId: cId },
            attributes: ['paguthi'],
            group: ['paguthi'],
          });
          dbWardPaguthis.forEach((wp) => {
            if (wp.paguthi && !paguthiList.includes(wp.paguthi)) {
              paguthiList.push(wp.paguthi);
            }
          });
        }

        const paguthiCount = paguthiList.length || (c.name && c.name.toLowerCase().includes('kinathu') ? 12 : 0);

        return {
          ...c.toObject(),
          wardCount,
          issueCount,
          memberCount,
          totalPaguthi: paguthiCount,
          paguthis: paguthiList,
        };
      })
    );
    res.json({ success: true, data: augmented });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Constituency By ID (with Paguthi statistics)
// @route   GET /api/constituencies/:id
// @access  Private
export const getConstituencyById = async (req, res) => {
  try {
    const constituency = await Constituency.findById(req.params.id);
    if (!constituency) {
      return res.status(404).json({ success: false, message: 'Constituency not found' });
    }
    const wards = await Ward.findAll({
      where: { constituencyId: constituency.id },
      order: [['wardNumber', 'ASC']],
    });
    const issues = await Issue.findAll({
      where: { constituencyId: constituency.id },
      limit: 10,
    });
    const members = await Member.findAll({
      where: { constituencyId: constituency.id },
      limit: 10,
    });

    const isKinathukadavu = constituency.name && constituency.name.toLowerCase().includes('kinathu');
    let paguthiNames = [];
    if (isKinathukadavu) {
      paguthiNames = KINATHUKADAVU_LOCAL_BODIES;
    } else {
      if (constituency.paguthis && constituency.paguthis.length > 0) {
        paguthiNames = typeof constituency.paguthis === 'string'
          ? JSON.parse(constituency.paguthis)
          : [...constituency.paguthis];
      }
      const dbWardPaguthis = await Ward.findAll({
        where: { constituencyId: constituency.id },
        attributes: ['paguthi'],
        group: ['paguthi'],
      });
      dbWardPaguthis.forEach((wp) => {
        const p = (wp.paguthi === 'Podanur') ? 'Pothanur' : wp.paguthi;
        if (p && !paguthiNames.includes(p)) {
          paguthiNames.push(p);
        }
      });
    }

    // Normalize any 'Podanur' to 'Pothanur' and deduplicate
    paguthiNames = [...new Set(paguthiNames.map((p) => (p === 'Podanur' ? 'Pothanur' : p)))];

    // Calculate actual live statistics for each Paguthi from MySQL
    const paguthiCards = await Promise.all(
      paguthiNames.map(async (pName) => {
        const pFilter = (pName === 'Pothanur' || pName === 'Podanur') ? ['Pothanur', 'Podanur'] : [pName];
        const pWards = await Ward.findAll({
          where: {
            [Op.or]: [
              { constituencyId: constituency.id, paguthi: { [Op.in]: pFilter } },
              { paguthi: { [Op.in]: pFilter } },
            ],
          },
        });
        const pWardIds = pWards.map((w) => w.id);

        const totalWards = pWards.length;
        const registeredSecretaries = await User.count({
          where: {
            role: { [Op.in]: ['ward_secretary', 'ward', 'ward_officer'] },
            isActive: true,
            [Op.or]: [
              { paguthi: { [Op.in]: pFilter } },
              ...(pWardIds.length > 0 ? [{ wardId: { [Op.in]: pWardIds } }] : []),
            ],
          },
        });
        const totalMembers = await Member.count({
          where: {
            [Op.or]: [
              ...(pWardIds.length > 0 ? [{ wardId: { [Op.in]: pWardIds } }] : []),
              { paguthi: { [Op.in]: pFilter } },
            ],
          },
        });
        const paguthiIssueWhere = {
          [Op.or]: [
            ...(pWardIds.length > 0 ? [{ wardId: { [Op.in]: pWardIds } }] : []),
            { paguthi: { [Op.in]: pFilter } },
          ],
        };
        const totalComplaints = await Issue.count({ where: paguthiIssueWhere });
        const newComplaints = await Issue.count({
          where: {
            ...paguthiIssueWhere,
            status: 'New',
          },
        });
        const pendingComplaints = await Issue.count({
          where: {
            ...paguthiIssueWhere,
            status: { [Op.in]: ['Pending', 'Assigned', 'Under Review'] },
          },
        });
        const inProgressComplaints = await Issue.count({
          where: {
            ...paguthiIssueWhere,
            status: 'In Progress',
          },
        });
        const completedComplaints = await Issue.count({
          where: {
            ...paguthiIssueWhere,
            status: { [Op.in]: ['Completed', 'Resolved', 'Closed'] },
          },
        });
        const unassignedComplaints = await Issue.count({
          where: {
            ...paguthiIssueWhere,
            assignedWardSecretaryId: null,
          },
        });

        return {
          name: pName,
          totalWards,
          registeredSecretaries,
          totalMembers,
          totalComplaints,
          newComplaints,
          pendingComplaints,
          inProgressComplaints,
          completedComplaints,
          resolvedComplaints: completedComplaints,
          unassignedComplaints,
        };
      })
    );

    res.json({
      success: true,
      data: {
        constituency: {
          ...constituency.toObject(),
          totalPaguthi: paguthiCards.length,
          paguthis: paguthiNames,
        },
        paguthis: paguthiCards,
        wards,
        issues,
        members,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Paguthi Details (Inside Paguthi with Ward Administration)
// @route   GET /api/districts/constituencies/:id/paguthi/:paguthiName
// @access  Private
export const getPaguthiDetails = async (req, res) => {
  try {
    const { id, paguthiName } = req.params;
    const constituency = await Constituency.findById(id);
    if (!constituency) {
      return res.status(404).json({ success: false, message: 'Constituency not found' });
    }

    const targetPaguthis = (paguthiName === 'Pothanur' || paguthiName === 'Podanur')
      ? ['Pothanur', 'Podanur']
      : [paguthiName];
    const canonicalPaguthiName = (paguthiName === 'Podanur') ? 'Pothanur' : paguthiName;

    // Strict Paguthi boundary enforcement for Paguthi Seyalaalar
    if (req.user && req.user.role === 'paguthi_seyalaalar') {
      const userPaguthi = req.user.paguthi || '';
      const allowed = (userPaguthi === 'Podanur') ? 'Pothanur' : userPaguthi;
      if (allowed && canonicalPaguthiName.toLowerCase() !== allowed.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You are only authorized to access ${allowed} Paguthi.`,
        });
      }
    }

    // Find all wards for this paguthi
    const wards = await Ward.findAll({
      where: {
        [Op.or]: [
          { constituencyId: constituency.id, paguthi: { [Op.in]: targetPaguthis } },
          { paguthi: { [Op.in]: targetPaguthis } },
        ],
      },
      order: [['wardNumber', 'ASC']],
    });

    const wardIds = wards.map((w) => w.id);

    const totalWards = wards.length;
    const registeredSecretaries = await User.count({
      where: {
        role: { [Op.in]: ['ward_secretary', 'ward', 'ward_officer'] },
        isActive: true,
        [Op.or]: [
          { paguthi: { [Op.in]: targetPaguthis } },
          ...(wardIds.length > 0 ? [{ wardId: { [Op.in]: wardIds } }] : []),
        ],
      },
    });

    const totalMembers = await Member.count({
      where: {
        [Op.or]: [
          ...(wardIds.length > 0 ? [{ wardId: { [Op.in]: wardIds } }] : []),
          { paguthi: { [Op.in]: targetPaguthis } },
        ],
      },
    });

    const paguthiIssueWhere = {
      [Op.or]: [
        ...(wardIds.length > 0 ? [{ wardId: { [Op.in]: wardIds } }] : []),
        { paguthi: { [Op.in]: targetPaguthis } },
      ],
    };

    const totalComplaints = await Issue.count({ where: paguthiIssueWhere });
    const newComplaints = await Issue.count({
      where: {
        ...paguthiIssueWhere,
        status: 'New',
      },
    });
    const pendingComplaints = await Issue.count({
      where: {
        ...paguthiIssueWhere,
        status: { [Op.in]: ['Pending', 'Assigned', 'Under Review'] },
      },
    });
    const inProgressComplaints = await Issue.count({
      where: {
        ...paguthiIssueWhere,
        status: 'In Progress',
      },
    });
    const completedComplaints = await Issue.count({
      where: {
        ...paguthiIssueWhere,
        status: { [Op.in]: ['Completed', 'Resolved', 'Closed'] },
      },
    });
    const unassignedComplaints = await Issue.count({
      where: {
        ...paguthiIssueWhere,
        assignedWardSecretaryId: null,
      },
    });

    // Augment each ward with its actual live stats and active registered secretary
    const augmentedWards = await Promise.all(
      wards.map(async (w) => {
        // Query active secretary for this ward
        const secretaryUser = await User.findOne({
          where: {
            role: { [Op.in]: ['ward_secretary', 'ward', 'ward_officer'] },
            isActive: true,
            [Op.or]: [
              { wardId: w.id },
              {
                [Op.and]: [
                  { assignedWard: String(w.wardNumber) },
                  { paguthi: { [Op.in]: targetPaguthis } },
                ],
              },
            ],
          },
          attributes: ['id', '_id', 'name', 'username', 'phone', 'email', 'isActive', 'paguthi', 'assignedWard'],
        });

        const wardIssueWhere = {
          [Op.or]: [
            { wardId: w.id },
            {
              [Op.and]: [
                { wardNumber: String(w.wardNumber) },
                { paguthi: { [Op.in]: targetPaguthis } },
              ],
            },
          ],
        };

        const mCount = await Member.count({ where: { wardId: w.id } });
        const cCount = await Issue.count({ where: wardIssueWhere });
        const nCount = await Issue.count({
          where: {
            ...wardIssueWhere,
            status: 'New',
          },
        });
        const pCount = await Issue.count({
          where: {
            ...wardIssueWhere,
            status: { [Op.in]: ['Pending', 'Assigned', 'Under Review'] },
          },
        });
        const ipCount = await Issue.count({
          where: {
            ...wardIssueWhere,
            status: 'In Progress',
          },
        });
        const rCount = await Issue.count({
          where: {
            ...wardIssueWhere,
            status: { [Op.in]: ['Completed', 'Resolved', 'Closed'] },
          },
        });

        return {
          ...w.toObject(),
          wardSecretary: secretaryUser ? secretaryUser.name : (w.wardSecretary || w.officeBearer || 'Unassigned'),
          wardSecretaryRegistrationStatus: secretaryUser ? 'Registered' : 'Unassigned',
          wardSecretaryUser: secretaryUser ? secretaryUser.toJSON() : null,
          totalMembers: mCount,
          totalComplaints: cCount,
          newComplaints: nCount,
          pendingComplaints: pCount,
          inProgressComplaints: ipCount,
          completedComplaints: rCount,
          resolvedComplaints: rCount,
        };
      })
    );

    // Fetch complaints specifically belonging to this Paguthi
    const paguthiIssues = await Issue.findAll({
      where: paguthiIssueWhere,
      include: [
        { model: User, as: 'assignedWardSecretary', attributes: ['id', '_id', 'name', 'username', 'phone'] },
        { model: Ward, as: 'ward', attributes: ['id', '_id', 'wardNumber', 'wardName', 'paguthi'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json({
      success: true,
      data: {
        constituency,
        paguthi: canonicalPaguthiName,
        stats: {
          totalWards,
          registeredSecretaries,
          totalMembers,
          totalComplaints,
          newComplaints,
          pendingComplaints,
          inProgressComplaints,
          completedComplaints,
          resolvedComplaints: completedComplaints,
          unassignedComplaints,
        },
        wards: augmentedWards,
        issues: paguthiIssues,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all wards
// @route   GET /api/wards
// @access  Private
export const getWards = async (req, res) => {
  try {
    const { constituencyId, zone, paguthi, search } = req.query;
    let where = {};

    if (constituencyId) {
      const cNum = Number(constituencyId);
      if (!isNaN(cNum) && cNum > 0) {
        where.constituencyId = cNum;
      } else {
        const c = await Constituency.findOne({ where: { _id: String(constituencyId) } });
        if (c) where.constituencyId = c.id;
      }
    }
    if (zone) where.zone = zone;
    if (paguthi) where.paguthi = paguthi;
    if (search) {
      where[Op.or] = [
        { wardName: { [Op.like]: `%${search}%` } },
        { areaCoverage: { [Op.like]: `%${search}%` } },
        { officeBearer: { [Op.like]: `%${search}%` } },
      ];
    }

    const wards = await Ward.findAll({
      where,
      include: [{ model: Constituency, as: 'constituency', attributes: ['id', '_id', 'name', 'code'] }],
      order: [['wardNumber', 'ASC']],
    });

    const augmented = await Promise.all(
      wards.map(async (w) => {
        const secretaryUser = await User.findOne({
          where: {
            role: { [Op.in]: ['ward_secretary', 'ward', 'ward_officer'] },
            isActive: true,
            [Op.or]: [
              { wardId: w.id },
              ...(w.paguthi
                ? [
                    {
                      [Op.and]: [
                        { assignedWard: String(w.wardNumber) },
                        { paguthi: w.paguthi },
                      ],
                    },
                  ]
                : []),
            ],
          },
          attributes: ['id', 'name', 'username', 'phone'],
        });

        const issueCount = await Issue.count({
          where: {
            [Op.or]: [
              { wardId: w.id },
              ...(w.paguthi
                ? [
                    {
                      [Op.and]: [
                        { wardNumber: String(w.wardNumber) },
                        { paguthi: w.paguthi },
                      ],
                    },
                  ]
                : []),
            ],
          },
        });
        const memberCount = await Member.count({ where: { wardId: w.id } });
        const resolvedCount = await Issue.count({
          where: {
            status: { [Op.in]: ['Completed', 'Resolved', 'Closed'] },
            [Op.or]: [
              { wardId: w.id },
              ...(w.paguthi
                ? [
                    {
                      [Op.and]: [
                        { wardNumber: String(w.wardNumber) },
                        { paguthi: w.paguthi },
                      ],
                    },
                  ]
                : []),
            ],
          },
        });
        return {
          ...w.toObject(),
          wardSecretary: secretaryUser ? secretaryUser.name : (w.wardSecretary || w.officeBearer || 'Unassigned'),
          wardSecretaryUser: secretaryUser ? secretaryUser.toJSON() : null,
          constituencyId: w.constituency,
          issueCount,
          memberCount,
          resolvedCount,
        };
      })
    );

    res.json({ success: true, data: augmented });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Ward Details & Deep-dive Dashboard
// @route   GET /api/wards/:id
// @access  Private
export const getWardById = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }

    // Strict Paguthi boundary enforcement for Paguthi Seyalaalar
    if (req.user && req.user.role === 'paguthi_seyalaalar') {
      const userPaguthi = req.user.paguthi || '';
      const allowed = (userPaguthi === 'Podanur') ? 'Pothanur' : userPaguthi;
      const wardPaguthi = (ward.paguthi === 'Podanur') ? 'Pothanur' : (ward.paguthi || '');
      if (allowed && wardPaguthi && allowed.toLowerCase() !== wardPaguthi.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This ward belongs to ${ward.paguthi}, but your account is assigned to ${allowed}.`,
        });
      }
    }

    const constituency = await Constituency.findByPk(ward.constituencyId);

    const totalMembers = await Member.count({ where: { wardId: ward.id } });
    const maleMembers = await Member.count({ where: { wardId: ward.id, gender: 'Male' } });
    const femaleMembers = await Member.count({ where: { wardId: ward.id, gender: 'Female' } });
    const officeBearers = await Member.count({ where: { wardId: ward.id, isOfficeBearer: true } });

    const wardIssueWhere = {
      [Op.or]: [
        { wardId: ward.id },
        {
          [Op.and]: [
            { wardNumber: ward.wardNumber },
            { paguthi: ward.paguthi },
          ],
        },
      ],
    };

    const totalIssues = await Issue.count({ where: wardIssueWhere });
    const closedIssues = await Issue.count({
      where: {
        ...wardIssueWhere,
        status: { [Op.in]: ['Completed', 'Resolved', 'Closed'] },
      },
    });
    const inProgressIssues = await Issue.count({
      where: { ...wardIssueWhere, status: { [Op.in]: ['In Progress', 'Under Review'] } },
    });
    const pendingIssues = await Issue.count({
      where: { ...wardIssueWhere, status: { [Op.in]: ['New', 'Pending', 'Assigned'] } },
    });

    const members = await Member.findAll({ where: { wardId: ward.id }, limit: 20 });
    const issues = await Issue.findAll({
      where: wardIssueWhere,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json({
      success: true,
      data: {
        ward: {
          ...ward.toObject(),
          constituencyId: constituency,
        },
        membersKpi: {
          totalMembers,
          maleMembers,
          femaleMembers,
          officeBearers,
        },
        issuesKpi: {
          totalIssues,
          closedIssues,
          inProgressIssues,
          pendingIssues,
        },
        members,
        issues,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Ward
// @route   POST /api/wards
// @access  Private/Admin
export const createWard = async (req, res) => {
  try {
    const ward = await Ward.create(req.body);
    res.status(201).json({ success: true, data: ward });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update Ward
// @route   PUT /api/wards/:id
// @access  Private/Admin
export const updateWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ward) return res.status(404).json({ success: false, message: 'Ward not found' });
    res.json({ success: true, data: ward });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete Ward
// @route   DELETE /api/wards/:id
// @access  Private/Admin
export const deleteWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndDelete(req.params.id);
    if (!ward) return res.status(404).json({ success: false, message: 'Ward not found' });
    res.json({ success: true, message: 'Ward deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
