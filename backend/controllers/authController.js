import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'tvk_default_jwt_secret', {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { username, password, selectedRole } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username/mobile and password' });
    }

    const cleanInput = username.trim();

    // Search by username, email, or phone
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: cleanInput.toLowerCase() },
          { email: cleanInput.toLowerCase() },
          { phone: cleanInput },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User account not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact district administrator.' });
    }

    // Role-based privilege check against dropdown selection
    if (selectedRole) {
      if (selectedRole === 'admin' && !['superadmin', 'district_admin'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Account does not have Admin privileges.' });
      }
      if (selectedRole === 'subadmin' && user.role !== 'subadmin') {
        return res.status(403).json({ success: false, message: 'Access denied. Account is not a registered Subadmin.' });
      }
      if ((selectedRole === 'ward_secretary' || selectedRole === 'ward') && !['ward_secretary', 'ward_officer'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Account is not a registered Ward Secretary.' });
      }
      if ((selectedRole === 'paguthi_seyalaalar' || selectedRole === 'paguthi') && user.role !== 'paguthi_seyalaalar') {
        return res.status(403).json({ success: false, message: 'Access denied. Account is not a registered Paguthi Seyalaalar.' });
      }
      if ((selectedRole === 'citizen' || selectedRole === 'user') && !['citizen', 'user'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Please use the appropriate administrative role.' });
      }
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    // Log login
    await AuditLog.create({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      module: 'AUTH',
      details: `User ${user.username} (${user.role}) logged in successfully`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      data: {
        _id: user._id || String(user.id),
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedDistrict: user.assignedDistrict,
        assignedWard: user.assignedWard,
        wardId: user.wardId || null,
        paguthi: user.paguthi || '',
        constituency: user.constituency,
        address: user.address,
        avatarUrl: user.avatarUrl,
        token: generateToken(user.id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new Citizen / User account
// @route   POST /api/auth/register
// @access  Public
export const registerCitizen = async (req, res) => {
  try {
    const { name, fullName, phoneNumber, mobileNumber, phone, password } = req.body;
    const citizenName = (name || fullName || '').trim();
    const citizenPhone = (phoneNumber || mobileNumber || phone || '').trim();

    if (!citizenName) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    if (!citizenPhone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Validate Indian mobile number format (10 digits starting with 6, 7, 8, 9)
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!indianMobileRegex.test(citizenPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Check duplicate mobile or username
    const duplicatePhone = await User.findOne({
      where: {
        [Op.or]: [{ phone: citizenPhone }, { username: citizenPhone.toLowerCase() }],
      },
    });

    if (duplicatePhone) {
      return res.status(400).json({
        success: false,
        message: 'An account with this phone number already exists. Please Sign In.',
      });
    }

    // Strictly Citizen role only
    const newUser = await User.create({
      name: citizenName,
      username: citizenPhone,
      email: `${citizenPhone}@tvkcitizen.in`,
      password,
      role: 'citizen',
      phone: citizenPhone,
      assignedDistrict: 'Coimbatore',
      constituency: 'Coimbatore South',
      assignedWard: 'Ward 72 - R.S. Puram',
      isActive: true,
    });

    // Audit Log
    await AuditLog.create({
      userId: newUser.id,
      userName: newUser.name,
      action: 'CITIZEN_REGISTRATION',
      module: 'AUTH',
      details: `Citizen ${newUser.name} (${newUser.phone}) registered via 3-field signup portal`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully! Please sign in with your phone number and password.',
      data: {
        _id: newUser._id || String(newUser.id),
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role,
        token: generateToken(newUser.id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email' });
    }

    res.json({
      success: true,
      message: 'Password reset instructions and verification code have been generated.',
      resetToken: 'tvk-reset-' + Buffer.from(String(user.id)).toString('hex').slice(0, 8),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new credentials.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { login, registerCitizen, getMe, forgotPassword, resetPassword };
