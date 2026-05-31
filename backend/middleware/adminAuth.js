const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_token';

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[ADMIN_COOKIE_NAME] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No admin token provided. Authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found or inactive'
      });
    }

    req.adminId = admin._id;
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin token has expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin token. Authorization denied'
    });
  }
};

module.exports = adminAuth;
