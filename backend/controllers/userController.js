const User = require('../models/User');
const Employee = require('../models/Employee');
const StockGroup = require('../models/master/StockGroup');
const Party = require('../models/master/Party');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ensureCashInHandPartyForUser } = require('../utils/defaultParties');

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '7d'
  });
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: undefined
  });
};

// User Register
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      password,
      state,
      pincode,
      gstNumber,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      upiId,
      role,
      department
    } = req.body;

    if (
      !companyName
      || !email
      || !phone
      || !password
      || !state
      || !pincode
      || !bankName
      || !accountNumber
      || !ifscCode
      || !accountHolderName
      || !upiId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required signup details'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName: String(firstName || '').trim(),
      lastName: String(lastName || '').trim(),
      companyName: String(companyName || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      phone: String(phone || '').trim(),
      password: hashedPassword,
      address: {
        state: String(state || '').trim(),
        pincode: String(pincode || '').trim()
      },
      gstNumber: String(gstNumber || '').trim(),
      bankDetails: {
        bankName: String(bankName || '').trim(),
        accountNumber: String(accountNumber || '').trim(),
        ifscCode: String(ifscCode || '').trim().toUpperCase(),
        accountHolderName: String(accountHolderName || '').trim(),
        upiId: String(upiId || '').trim()
      },
      role: role || 'employee',
      department,
      isActive: true
    });

    try {
      await StockGroup.create({
        userId: user._id,
        name: 'Primary',
        description: 'Default stock group'
      });
      await ensureCashInHandPartyForUser(user._id);
    } catch (stockGroupError) {
      await Promise.allSettled([
        StockGroup.deleteMany({ userId: user._id }),
        Party.deleteMany({ userId: user._id }),
        User.findByIdAndDelete(user._id)
      ]);
      throw stockGroupError;
    }

    const token = generateToken(user._id);

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userSettings: user.userSettings || { expiryAlert: false }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password'
      });
    }

    // Check if input is email or phone
    const isEmail = emailOrPhone.includes('@');
    let user;

    if (isEmail) {
      user = await User.findOne({ email: emailOrPhone }).select('+password');
    } else {
      user = await User.findOne({ phone: emailOrPhone }).select('+password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password'
      });
    }

    const token = generateToken(user._id);

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        userSettings: user.userSettings || { expiryAlert: false }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in'
    });
  }
};

// Employee Login
exports.employeeLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required'
      });
    }

    const emp = await Employee.findOne({ mobile: mobile.trim() }).select('+password');
    if (!emp || !(await bcrypt.compare(password, emp.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password'
      });
    }

    if (!emp.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your access has been revoked by the owner'
      });
    }

    const token = jwt.sign(
      { id: emp.ownerId, employeeId: emp._id, role: 'employee' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: 'Staff login successful',
      user: {
         id: emp.ownerId, 
         employeeId: emp._id,
         name: emp.name,
         mobile: emp.mobile,
         role: 'employee',
         permissions: emp.permissions,
         historyLimitDays: emp.historyLimitDays
      },
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in staff'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging out'
    });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    if (req.employee) {
      // Staff user session
      const owner = await User.findById(req.userId);
      if (!owner) {
        return res.status(404).json({ success: false, message: 'Owner account not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
           id: owner._id,
           employeeId: req.employee._id,
           name: req.employee.name,
           mobile: req.employee.mobile,
           role: 'employee',
         ownerName: owner.companyName || owner.firstName,
         userSettings: owner.userSettings || { expiryAlert: false },
         permissions: req.employee.permissions,
         historyLimitDays: req.employee.historyLimitDays
        }
      });
    }

    // Standard owner session
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Explicitly identify as an owner if they don't have a role assigned
    const userData = user.toObject();
    if (!userData.role || userData.role === 'employee' || userData.role === 'owner') {
      userData.role = 'owner';
    }

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user'
    });
  }
};

// Update Current User Settings
exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { expiryAlert } = req.body?.userSettings || req.body || {};

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'userSettings.expiryAlert': Boolean(expiryAlert)
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        userSettings: user.userSettings || { expiryAlert: false }
      }
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user settings'
    });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    let filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users'
    });
  }
};

// Get User By ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user'
    });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      companyName,
      phone,
      department,
      address,
      gstNumber,
      bankDetails,
      userSettings,
      isActive
    } = req.body;

    const normalizedUserSettings = userSettings && typeof userSettings === 'object'
      ? { expiryAlert: Boolean(userSettings.expiryAlert) }
      : undefined;
    const updatePayload = { firstName, lastName, companyName, phone, department, address, gstNumber, bankDetails, isActive };
    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });
    if (normalizedUserSettings) {
      updatePayload.userSettings = normalizedUserSettings;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user'
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    let user;
    // Check if the request is for an employee changing their own password
    if (req.employee && id === req.employee._id.toString()) {
      user = await Employee.findById(id).select('+password');
    } else {
      user = await User.findById(id).select('+password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password'
    });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user'
    });
  }
};
