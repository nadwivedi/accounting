const path = require('path');

const buildFileResponse = (req, filePathFallback) => {
  const normalizedPath = req.file.path.split(path.sep).join('/');
  const uploadsIndex = normalizedPath.lastIndexOf('/uploads/');
  const relativePath = uploadsIndex >= 0
    ? normalizedPath.slice(uploadsIndex)
    : filePathFallback;

  return {
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    relativePath,
    url: `${req.protocol}://${req.get('host')}${relativePath}`
  };
};

exports.uploadInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Invoice file is required'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Invoice uploaded successfully',
      data: buildFileResponse(req, `/uploads/invoices/${req.file.filename}`)
    });
  } catch (error) {
    console.error('Upload invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading invoice'
    });
  }
};

exports.uploadPartyImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Party image file is required'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Party image uploaded successfully',
      data: buildFileResponse(req, `/uploads/party-images/${req.file.filename}`)
    });
  } catch (error) {
    console.error('Upload party image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading party image'
    });
  }
};
