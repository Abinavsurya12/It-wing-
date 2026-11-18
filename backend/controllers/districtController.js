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
  'Podanur',
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
    const paguthiNames = isKinathukadavu
      ? KINATHUKADAVU_LOCAL_BODIES
      : (constituency.paguthis && constituency.paguthis.length > 0 ? constituency.paguthis : []);

    // Calculate actual live statistics for each Paguthi from MySQL
    const paguthiCards = await Promise.all(
      paguthiNames.map(async (pName) => {
        const pWards = await Ward.findAll({
          where: {
            [Op.or]: [
              { constituencyId: constituency.id, paguthi: pName },
              { paguthi: pName },
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
              { paguthi: pName },
              ...(pWardIds.length > 0 ? [{ wardId: { [Op.in]: pWardIds } }] : []),
            ],
          },
        });
        const totalMembers = await Member.count({
          where: {
            [Op.or]: [
              ...(pWardIds.length > 0 ? [{ wardId: { [Op.in]: pWardIds } }] : []),
              { paguthi: pName },
            ],
          },
        });
        const paguthiIssueWhere = {
          [Op.or]: [
            ...(pWardIds.length > 0 ? [{ wardId: { [Op.in]: pWardIds } }] : []),
            { paguthi: pName },
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

    // Find all wards for this paguthi
    const wards = await Ward.findAll({
      where: {
        [Op.or]: [
          { constituencyId: constituency.id, paguthi: paguthiName },
          { paguthi: paguthiName },
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
          { paguthi: paguthiName },
          ...(wardIds.length > 0 ? [{ wardId: { [Op.in]: wardIds } }] : []),
        ],
      },
    });

    const totalMembers = await Member.count({
      where: {
        [Op.or]: [
          ...(wardIds.length > 0 ? [{ wardId: { [Op.in]: wardIds } }] : []),
          { paguthi: paguthiName },
        ],
      },
    });

    const paguthiIssueWhere = {
      [Op.or]: [
        ...(wardIds.length > 0 ? [{ wardId: { [Op.in]: wardIds } }] : []),
        { paguthi: paguthiName },
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
                  { paguthi: paguthiName },
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
                { paguthi: paguthiName },
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
        paguthi: paguthiName,
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

    const constituency = await Constituency.findByPk(ward.constituencyId);

    const totalMembers = await Member.count({ where: { wardId: ward.id } });
    const maleMembers = await Member.count({ where: { wardId: ward.id, gender: 'Male' } });
    const femaleMembers = await Member.count({ where: { wardId: ward.id, gender: 'Female' } });
    const officeBearers = await Member.count({ where: { wardId: ward.id, isOfficeBearer: true } });

    const totalIssues = await Issue.count({ where: { wardId: ward.id } });
    const closedIssues = await Issue.count({ where: { wardId: ward.id, status: 'Resolved' } });
    const inProgressIssues = await Issue.count({
      where: { wardId: ward.id, status: { [Op.in]: ['In Progress', 'Under Review'] } },
    });
    const pendingIssues = await Issue.count({ where: { wardId: ward.id, status: 'Pending' } });

    const members = await Member.findAll({ where: { wardId: ward.id }, limit: 20 });
    const issues = await Issue.findAll({
      where: { wardId: ward.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
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
