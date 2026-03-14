const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const ROOT_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const SALE_INVOICE_UPLOAD_DIR = path.join(ROOT_UPLOAD_DIR, 'sale-invoices');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(ROOT_UPLOAD_DIR);
ensureDir(SALE_INVOICE_UPLOAD_DIR);

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 34,
  marginY: 34
};

const BRAND = {
  blue: '#144b96',
  blueDark: '#103f82',
  blueSoft: '#e8eff9',
  slate: '#334155',
  muted: '#64748b',
  line: '#d9e2ec',
  soft: '#f8fafc',
  zebra: '#f1f5f9',
  totalBg: '#144b96'
};

const sanitizeFileSegment = (value = 'invoice') => String(value || 'invoice')
  .replace(/[^a-zA-Z0-9_-]/g, '_')
  .slice(0, 80);

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const joinTextParts = (...values) => values
  .map((value) => String(value || '').trim())
  .filter(Boolean)
  .join(', ');

const getCustomerLabel = (sale) => (
  String(sale?.customerName || sale?.party?.name || sale?.party?.partyName || '').trim() || 'Walk-in Customer'
);

const getBusinessProfile = (sale) => {
  const user = sale?.userId || {};
  return {
    companyName: String(user.companyName || '').trim() || 'Accounts',
    email: String(user.email || '').trim() || '-',
    phone: String(user.phone || '').trim() || '-',
    state: String(user.address?.state || '').trim() || '-',
    pincode: String(user.address?.pincode || '').trim() || '-',
    gstNumber: String(user.gstNumber || '').trim() || '',
    bankName: String(user.bankDetails?.bankName || '').trim() || '-',
    accountNumber: String(user.bankDetails?.accountNumber || '').trim() || '-',
    ifscCode: String(user.bankDetails?.ifscCode || '').trim() || '-',
    accountHolderName: String(user.bankDetails?.accountHolderName || '').trim() || '-',
    upiId: String(user.bankDetails?.upiId || '').trim()
  };
};

const getSaleInvoiceRelativePath = (sale) => {
  const fileName = `${sanitizeFileSegment(sale?.invoiceNumber || 'invoice')}-${sanitizeFileSegment(sale?._id || Date.now())}.pdf`;
  return `/uploads/sale-invoices/${fileName}`;
};

const getSaleInvoiceAbsolutePath = (relativePath = '') => {
  const normalizedRelativePath = String(relativePath || '')
    .replace(/^[/\\]+/, '')
    .split(/[\\/]+/)
    .join(path.sep);

  return path.join(__dirname, '..', normalizedRelativePath);
};

const numberToWordsBelowThousand = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  let value = Number(num) || 0;
  let words = '';

  if (value >= 100) {
    words += `${ones[Math.floor(value / 100)]} Hundred `;
    value %= 100;
  }

  if (value >= 20) {
    words += `${tens[Math.floor(value / 10)]} `;
    value %= 10;
  } else if (value >= 10) {
    words += `${teens[value - 10]} `;
    value = 0;
  }

  if (value > 0) {
    words += `${ones[value]} `;
  }

  return words.trim();
};

const numberToIndianWords = (value) => {
  const amount = Math.max(0, Math.floor(Number(value) || 0));
  if (amount === 0) return 'Zero';

  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const hundred = amount % 1000;
  const parts = [];

  if (crore) parts.push(`${numberToWordsBelowThousand(crore)} Crore`);
  if (lakh) parts.push(`${numberToWordsBelowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${numberToWordsBelowThousand(thousand)} Thousand`);
  if (hundred) parts.push(numberToWordsBelowThousand(hundred));

  return parts.join(' ').trim();
};

const getAmountInWords = (amount) => {
  const absolute = Math.max(0, Number(amount) || 0);
  const rupees = Math.floor(absolute);
  const paise = Math.round((absolute - rupees) * 100);
  const rupeeWords = `${numberToIndianWords(rupees)} Rupees`;
  if (!paise) return `${rupeeWords} Only`;
  return `${rupeeWords} and ${numberToIndianWords(paise)} Paise Only`;
};

const buildUpiPaymentUrl = ({ upiId, companyName, invoiceNumber, totalAmount }) => {
  if (!upiId) return '';

  const params = new URLSearchParams({
    pa: upiId,
    pn: companyName || 'Accounts',
    am: String(Number(totalAmount || 0).toFixed(2)),
    cu: 'INR',
    tn: `Invoice ${invoiceNumber || ''}`.trim()
  });

  return `upi://pay?${params.toString()}`;
};

const drawOuterFrame = (doc) => {
  doc
    .rect(16, 16, PAGE.width - 32, PAGE.height - 32)
    .lineWidth(1)
    .strokeColor('#dbe4ee')
    .stroke();
};

const drawTopRule = (doc, y) => {
  doc
    .moveTo(PAGE.marginX, y)
    .lineTo(PAGE.width - PAGE.marginX, y)
    .lineWidth(1)
    .strokeColor('#cad5e2')
    .stroke();
};

const drawLogoMark = (doc, x, y) => {
  doc.save();
  doc.circle(x + 18, y + 18, 18).fill('#4b8ed5');
  doc.circle(x + 34, y + 28, 12).fill('#b6d2f2');
  doc
    .moveTo(x + 2, y + 28)
    .lineTo(x + 48, y + 18)
    .lineWidth(7)
    .lineCap('round')
    .strokeColor(BRAND.blue)
    .stroke();
  doc.restore();
};

const drawHeader = (doc, sale, profile) => {
  drawLogoMark(doc, PAGE.marginX + 8, PAGE.marginY + 4);

  doc
    .fillColor(BRAND.blue)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(profile.companyName, PAGE.marginX, 76, { width: 220 });

  const companyLines = [
    joinTextParts(profile.state, profile.pincode) || '-',
    `Email: ${profile.email}`,
    `Phone: ${profile.phone}${profile.gstNumber ? ` | GST: ${profile.gstNumber}` : ''}`
  ];

  let companyY = 96;
  companyLines.forEach((line) => {
    doc
      .fillColor(BRAND.slate)
      .font('Helvetica')
      .fontSize(9.5)
      .text(line, PAGE.marginX, companyY, { width: 250 });
    companyY += 15;
  });

  doc
    .fillColor(BRAND.blue)
    .font('Helvetica-Bold')
    .fontSize(42)
    .text('INVOICE', PAGE.width - PAGE.marginX - 210, 40, { width: 210, align: 'right' });

  drawTopRule(doc, 128);

  const customerName = getCustomerLabel(sale);
  const leftX = PAGE.marginX;
  const rightX = 330;
  let leftY = 144;

  doc
    .fillColor(BRAND.blue)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('BILL TO:', leftX, leftY);

  leftY += 20;

  [
    customerName,
    String(sale?.customerAddress || '-').trim() || '-',
    joinTextParts(sale?.customerEmail, sale?.customerPhone) || (String(sale?.customerPhone || '-').trim() || '-')
  ].forEach((line, index) => {
    doc
      .fillColor(BRAND.slate)
      .font(index === 0 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(10)
      .text(line, leftX, leftY, { width: 240 });
    leftY += index === 1 ? 28 : 16;
  });

  const rightLabelX = rightX;
  const rightValueX = rightX + 120;
  let rightY = 144;

  const invoiceMeta = [
    ['Invoice Number:', String(sale?.invoiceNumber || '-')],
    ['Invoice Date:', formatDate(sale?.saleDate)],
    ['Due Date:', formatDate(sale?.dueDate || sale?.saleDate)]
  ];

  invoiceMeta.forEach(([label, value]) => {
    doc
      .fillColor(BRAND.slate)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(label, rightLabelX, rightY, { width: 110 })
      .font('Helvetica-Bold')
      .text(value, rightValueX, rightY, { width: 110, align: 'right' });
    rightY += 20;
  });

  drawTopRule(doc, 236);
  return 252;
};

const drawTableHeader = (doc, y) => {
  const x = PAGE.marginX;
  const width = PAGE.width - (PAGE.marginX * 2);

  doc.rect(x, y, width, 28).fill(BRAND.blue);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('DESCRIPTION', x + 8, y + 9, { width: 210 })
    .text('QUANTITY', x + 218, y + 9, { width: 72, align: 'center' })
    .text('UNIT PRICE', x + 300, y + 9, { width: 94, align: 'center' })
    .text('TOTAL', x + 412, y + 9, { width: 110, align: 'center' });
};

const drawItemsTable = (doc, items, startY) => {
  let y = startY;
  const x = PAGE.marginX;
  const width = PAGE.width - (PAGE.marginX * 2);

  drawTableHeader(doc, y);
  y += 28;

  const rowHeight = 26;
  const contentBottom = 570;

  if (!items.length) {
    doc
      .rect(x, y, width, rowHeight)
      .fill('#ffffff');

    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(10)
      .text('No sale items available.', x, y + 8, { width, align: 'center' });

    return y + rowHeight + 12;
  }

  items.forEach((item, index) => {
    if (y + rowHeight > contentBottom) {
      doc.addPage({ margin: 0 });
      drawOuterFrame(doc);
      drawTableHeader(doc, PAGE.marginY);
      y = PAGE.marginY + 28;
    }

    doc
      .rect(x, y, width, rowHeight)
      .fill(index % 2 === 0 ? '#ffffff' : BRAND.zebra);

    doc
      .fillColor(BRAND.slate)
      .font('Helvetica')
      .fontSize(10)
      .text(String(item?.productName || item?.product?.name || 'Item').trim() || 'Item', x + 8, y + 8, { width: 210 })
      .text(String(item?.quantity || 0), x + 218, y + 8, { width: 72, align: 'center' })
      .text(formatCurrency(item?.unitPrice || 0), x + 300, y + 8, { width: 94, align: 'center' })
      .text(formatCurrency(item?.total || 0), x + 412, y + 8, { width: 110, align: 'center' });

    doc
      .moveTo(x, y + rowHeight)
      .lineTo(x + width, y + rowHeight)
      .lineWidth(0.6)
      .strokeColor(BRAND.line)
      .stroke();

    y += rowHeight;
  });

  return y + 14;
};

const drawTotals = (doc, sale, y) => {
  const labelX = 336;
  const valueX = 450;
  const totalWidth = 110;

  doc
    .fillColor(BRAND.slate)
    .font('Helvetica')
    .fontSize(10.5)
    .text('Subtotal:', labelX, y, { width: 92, align: 'right' })
    .text(formatCurrency(sale?.subtotal || 0), valueX, y, { width: totalWidth, align: 'right' });

  doc
    .moveTo(labelX, y + 18)
    .lineTo(PAGE.width - PAGE.marginX, y + 18)
    .lineWidth(1)
    .strokeColor(BRAND.line)
    .stroke();

  doc
    .fillColor(BRAND.slate)
    .font('Helvetica')
    .fontSize(10.5)
    .text(`Tax${Number(sale?.taxAmount || 0) ? ':' : ' (0%):'}`, labelX, y + 26, { width: 92, align: 'right' })
    .text(formatCurrency(sale?.taxAmount || 0), valueX, y + 26, { width: totalWidth, align: 'right' });

  doc
    .moveTo(labelX, y + 44)
    .lineTo(PAGE.width - PAGE.marginX, y + 44)
    .lineWidth(1)
    .strokeColor(BRAND.line)
    .stroke();

  doc.rect(labelX - 12, y + 54, 236, 30).fill(BRAND.totalBg);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Grand Total:', labelX, y + 63, { width: 98, align: 'right' })
    .text(formatCurrency(sale?.totalAmount || 0), valueX, y + 63, { width: totalWidth, align: 'right' });

  return y + 96;
};

const drawBankAndQr = (doc, profile, qrBuffer, y) => {
  const leftX = PAGE.marginX;
  const rightX = 410;

  drawTopRule(doc, y);

  doc
    .fillColor(BRAND.blue)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('BANK DETAILS:', leftX, y + 18);

  const bankRows = [
    ['Account Name:', profile.accountHolderName],
    ['Bank Name:', profile.bankName],
    ['Account Number:', profile.accountNumber],
    ['SWIFT / IFSC Code:', profile.ifscCode]
  ];

  let rowY = y + 44;
  bankRows.forEach(([label, value]) => {
    doc
      .fillColor(BRAND.slate)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(label, leftX, rowY, { width: 120 })
      .font('Helvetica')
      .text(value || '-', leftX + 122, rowY, { width: 230 });
    rowY += 24;
  });

  doc
    .moveTo(leftX, y + 150)
    .lineTo(390, y + 150)
    .lineWidth(1)
    .strokeColor(BRAND.line)
    .stroke();

  doc.rect(rightX, y + 18, 118, 118).lineWidth(1).strokeColor(BRAND.line).stroke();

  if (qrBuffer) {
    doc.image(qrBuffer, rightX + 10, y + 28, { width: 98, height: 98 });
  } else {
    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(9)
      .text('UPI QR not available', rightX + 10, y + 68, { width: 98, align: 'center' });
  }

  doc.rect(rightX, y + 136, 118, 24).fill(BRAND.blue);
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Scan to Pay', rightX, y + 144, { width: 118, align: 'center' });

  return y + 178;
};

const drawFooter = (doc) => {
  drawTopRule(doc, 684);

  doc
    .fillColor(BRAND.slate)
    .font('Helvetica-Oblique')
    .fontSize(20)
    .text('Thank you for your business!', 0, 702, { width: PAGE.width, align: 'center' });

  doc.save();
  doc
    .fillColor('#1d5cab')
    .moveTo(0, PAGE.height - 82)
    .quadraticCurveTo(PAGE.width * 0.28, PAGE.height - 28, PAGE.width * 0.58, PAGE.height - 64)
    .quadraticCurveTo(PAGE.width * 0.82, PAGE.height - 94, PAGE.width, PAGE.height - 54)
    .lineTo(PAGE.width, PAGE.height)
    .lineTo(0, PAGE.height)
    .closePath()
    .fill();

  doc
    .fillColor('#7fa9d8')
    .moveTo(0, PAGE.height - 66)
    .quadraticCurveTo(PAGE.width * 0.32, PAGE.height - 22, PAGE.width * 0.64, PAGE.height - 52)
    .quadraticCurveTo(PAGE.width * 0.84, PAGE.height - 72, PAGE.width, PAGE.height - 48)
    .lineTo(PAGE.width, PAGE.height)
    .lineTo(0, PAGE.height)
    .closePath()
    .fillOpacity(0.45)
    .fill();
  doc.restore();
};

const createSaleInvoicePdf = async (sale) => {
  const relativePath = getSaleInvoiceRelativePath(sale);
  const absolutePath = getSaleInvoiceAbsolutePath(relativePath);
  ensureDir(path.dirname(absolutePath));

  const profile = getBusinessProfile(sale);
  const items = Array.isArray(sale?.items) ? sale.items : [];
  const upiPaymentUrl = buildUpiPaymentUrl({
    upiId: profile.upiId,
    companyName: profile.companyName,
    invoiceNumber: sale?.invoiceNumber,
    totalAmount: sale?.totalAmount
  });
  const qrBuffer = upiPaymentUrl
    ? await QRCode.toBuffer(upiPaymentUrl, { margin: 1, width: 180 })
    : null;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const stream = fs.createWriteStream(absolutePath);

      doc.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', () => resolve({ relativePath, absolutePath }));

      doc.pipe(stream);

      drawOuterFrame(doc);
      let y = drawHeader(doc, sale, profile);
      y = drawItemsTable(doc, items, y);

      if (y > 478) {
        doc.addPage({ margin: 0 });
        drawOuterFrame(doc);
        y = PAGE.marginY + 24;
      }

      y = drawTotals(doc, sale, y);

      doc
        .fillColor(BRAND.slate)
        .font('Helvetica')
        .fontSize(9)
        .text(getAmountInWords(sale?.totalAmount || 0), PAGE.marginX, y - 4, {
          width: 280
        });

      if (String(sale?.notes || '').trim()) {
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor(BRAND.blue)
          .text('Notes:', PAGE.marginX, y + 20);
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(BRAND.slate)
          .text(String(sale.notes).trim(), PAGE.marginX + 40, y + 20, {
            width: 500
          });
        y += 36;
      }

      drawBankAndQr(doc, profile, qrBuffer, Math.max(y + 18, 504));
      drawFooter(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createSaleInvoicePdf,
  getSaleInvoiceAbsolutePath
};
