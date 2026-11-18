import { Op } from 'sequelize';
import Project from '../models/Project.js';
import Ward from '../models/Ward.js';
import Constituency from '../models/Constituency.js';

// @desc    Get all projects with filters
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const { status, search, constituencyId, wardId } = req.query;
    let where = {};

    if (status && status !== 'All') {
      where.status = status;
    }
    if (constituencyId) {
      const cNum = Number(constituencyId);
      if (!isNaN(cNum) && cNum > 0) {
        where.constituencyId = cNum;
      } else {
        const c = await Constituency.findOne({ where: { _id: String(constituencyId) } });
        if (c) where.constituencyId = c.id;
      }
    }
    if (wardId) {
      const wNum = Number(wardId);
      if (!isNaN(wNum) && wNum > 0) {
        where.wardId = wNum;
      } else {
        const w = await Ward.findOne({ where: { _id: String(wardId) } });
        if (w) where.wardId = w.id;
      }
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { projectCode: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } },
      ];
    }

    const projects = await Project.findAll({
      where,
      include: [
        { model: Ward, as: 'ward', attributes: ['id', '_id', 'wardNumber', 'wardName'] },
        { model: Constituency, as: 'constituency', attributes: ['id', '_id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const totalCount = await Project.count();
    const plannedCount = await Project.count({ where: { status: 'Planned' } });
    const ongoingCount = await Project.count({ where: { status: 'Ongoing' } });
    const completedCount = await Project.count({ where: { status: 'Completed' } });

    const formattedProjects = projects.map((p) => ({
      ...p.toObject(),
      wardId: p.ward,
      constituencyId: p.constituency,
    }));

    res.json({
      success: true,
      data: formattedProjects,
      summary: {
        total: totalCount,
        planned: plannedCount,
        ongoing: ongoingCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const ward = project.wardId ? await Ward.findByPk(project.wardId) : null;
    const constituency = project.constituencyId ? await Constituency.findByPk(project.constituencyId) : null;

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        wardId: ward,
        constituencyId: constituency,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    if (!req.body.projectCode) {
      const count = await Project.count();
      req.body.projectCode = `PRJ-CBE-${String(count + 101).padStart(4, '0')}`;
    }

    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
