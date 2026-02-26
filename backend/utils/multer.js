const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ROOT_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const INVOICE_UPLOAD_DIR = path.join(ROOT_UPLOAD_DIR, 'invoices');
const PARTY_IMAGE_UPLOAD_DIR = path.join(ROOT_UPLOAD_DIR, 'party-images');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(ROOT_UPLOAD_DIR);
ensureDir(INVOICE_UPLOAD_DIR);
ensureDir(PARTY_IMAGE_UPLOAD_DIR);

const sanitizeBaseName = (name = 'file') => {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
};

const buildStorage = (destinationDir) => multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, destinationDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const originalBase = path.basename(file.originalname || 'file', ext);
    const safeBase = sanitizeBaseName(originalBase || 'file');
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const createMulter = ({ destinationDir, allowedMimeTypes, errorMessage }) => {
  return multer({
    storage: buildStorage(destinationDir),
    fileFilter: (_req, file, cb) => {
      if (!file || !allowedMimeTypes.has(file.mimetype)) {
        cb(new Error(errorMessage));
        return;
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });
};

const commonUpload = createMulter({
  destinationDir: ROOT_UPLOAD_DIR,
  allowedMimeTypes: new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]),
  errorMessage: 'Only JPG, PNG, WEBP images and PDF files are allowed'
});

const invoiceUpload = createMulter({
  destinationDir: INVOICE_UPLOAD_DIR,
  allowedMimeTypes: new Set([
    'image/jpeg',
    'image/png',
    'application/pdf'
  ]),
  errorMessage: 'Only JPG, JPEG, PNG and PDF files are allowed for invoice upload'
});

const partyImageUpload = createMulter({
  destinationDir: PARTY_IMAGE_UPLOAD_DIR,
  allowedMimeTypes: new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
  ]),
  errorMessage: 'Only JPG, JPEG, PNG and WEBP images are allowed for party image upload'
});

module.exports = {
  upload: commonUpload,
  uploadSingle: (field = 'file') => commonUpload.single(field),
  uploadArray: (field = 'files', maxCount = 5) => commonUpload.array(field, maxCount),
  uploadInvoiceSingle: (field = 'invoice') => invoiceUpload.single(field),
  uploadPartyImageSingle: (field = 'partyImage') => partyImageUpload.single(field)
};
