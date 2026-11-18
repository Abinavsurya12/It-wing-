import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);

router.post('/', protect, authorize('superadmin', 'district_admin'), createProject);
router.put('/:id', protect, authorize('superadmin', 'district_admin'), updateProject);
router.delete('/:id', protect, authorize('superadmin', 'district_admin'), deleteProject);

export default router;
