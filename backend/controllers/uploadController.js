const path = require('path');

exports.uploadInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Invoice file is required'
      });
    }

    const normalizedPath = req.file.path.split(path.sep).join('/');
    const uploadsIndex = normalizedPath.lastIndexOf('/uploads/');
    const relativePath = uploadsIndex >= 0
      ? normalizedPath.slice(uploadsIndex)
      : `/uploads/invoices/${req.file.filename}`;

    const absoluteUrl = `${req.protocol}://${req.get('host')}${relativePath}`;

    res.status(201).json({
      success: true,
      message: 'Invoice uploaded successfully',
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        relativePath,
        url: absoluteUrl
      }
    });
  } catch (error) {
    console.error('Upload invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading invoice'
    });
  }
};
