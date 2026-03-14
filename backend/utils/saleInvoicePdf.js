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
  marginX: 36,
  marginY: 34
};

const BRAND = {
  navy: '#0f172a',
  slate: '#475569',
  muted: '#64748b',
  line: '#dbe2ea',
  soft: '#f8fafc',
  teal: '#0f766e',
  tealSoft: '#ecfeff',
  blueSoft: '#eff6ff',
  totalBg: '#e0f2fe',
  amberSoft: '#fff7ed',
  amberBorder: '#fdba74',
  qrBg: '#f8fafc'
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
    month: 'short',
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

const drawPageFrame = (doc) => {
  doc
    .roundedRect(18, 18, PAGE.width - 36, PAGE.height - 36, 14)
    .lineWidth(1)
    .strokeColor('#cbd5e1')
    .stroke();

  doc
    .roundedRect(18, 18, PAGE.width - 36, 14, 14)
    .fill(BRAND.teal);
};

const drawInfoCard = (doc, x, y, width, height, title, rows) => {
  doc
    .roundedRect(x, y, width, height, 12)
    .fillAndStroke('#ffffff', BRAND.line);

  doc
    .fillColor(BRAND.muted)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(title, x + 14, y + 12, { width: width - 28 });

  let rowY = y + 30;
  rows.forEach((row, index) => {
    if (index > 0) rowY += 18;
    doc
      .fillColor(BRAND.muted)
      .font('Helvetica')
      .fontSize(8.5)
      .text(row.label, x + 14, rowY, { width: 72 });

    doc
      .fillColor(BRAND.navy)
      .font(row.strong ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9.5)
      .text(row.value, x + 88, rowY, { width: width - 102 });
  });
};

const drawTableHeader = (doc, y) => {
  const x = PAGE.marginX;
  const width = PAGE.width - (PAGE.marginX * 2);

  doc
    .roundedRect(x, y, width, 28, 8)
    .fill(BRAND.navy);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .text('#', x + 10, y + 9, { width: 18, align: 'center' })
    .text('Particulars', x + 36, y + 9, { width: 228 })
    .text('Qty', x + 272, y + 9, { width: 40, align: 'right' })
    .text('Unit', x + 322, y + 9, { width: 48, align: 'center' })
    .text('Rate', x + 378, y + 9, { width: 72, align: 'right' })
    .text('Amount', x + 458, y + 9, { width: 66, align: 'right' });
};

const createSaleInvoicePdf = async (sale) => {
  const relativePath = getSaleInvoiceRelativePath(sale);
  const absolutePath = getSaleInvoiceAbsolutePath(relativePath);
  ensureDir(path.dirname(absolutePath));

  const profile = getBusinessProfile(sale);
  const customerName = getCustomerLabel(sale);
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

      drawPageFrame(doc);

      const leftX = PAGE.marginX;
      const rightX = 360;
      let y = PAGE.marginY;

      doc
        .roundedRect(leftX, y, 74, 74, 18)
        .fill(BRAND.tealSoft);

      doc
        .fillColor(BRAND.teal)
        .font('Helvetica-Bold')
        .fontSize(28)
        .text((profile.companyName || 'A').charAt(0).toUpperCase(), leftX, y + 20, {
          width: 74,
          align: 'center'
        });

      doc
        .fillColor(BRAND.navy)
        .font('Helvetica-Bold')
        .fontSize(22)
        .text(profile.companyName, leftX + 92, y + 2, { width: 236 })
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(BRAND.slate)
        .text(joinTextParts(profile.state, profile.pincode), leftX + 92, y + 32)
        .text(`Phone: ${profile.phone}`, leftX + 92, y + 46)
        .text(`Email: ${profile.email}`, leftX + 92, y + 60);

      if (profile.gstNumber) {
        doc
          .fillColor(BRAND.teal)
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(`GSTIN: ${profile.gstNumber}`, leftX + 92, y + 74, { width: 220 });
      }

      doc
        .roundedRect(rightX, y + 2, 200, 88, 16)
        .fillAndStroke(BRAND.soft, BRAND.line);

      doc
        .fillColor(BRAND.muted)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('SALE INVOICE', rightX + 16, y + 14, { width: 168, align: 'right' })
        .fillColor(BRAND.teal)
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(String(sale?.invoiceNumber || '-'), rightX + 16, y + 28, { width: 168, align: 'right' })
        .fillColor(BRAND.slate)
        .font('Helvetica')
        .fontSize(8.5)
        .text(`Invoice Date: ${formatDate(sale?.saleDate)}`, rightX + 16, y + 60, { width: 168, align: 'right' })
        .text(`Due Date: ${formatDate(sale?.dueDate)}`, rightX + 16, y + 74, { width: 168, align: 'right' });

      y += 108;

      drawInfoCard(doc, leftX, y, 250, 106, 'BILL TO', [
        { label: 'Name', value: customerName, strong: true },
        { label: 'Phone', value: String(sale?.customerPhone || '-').trim() || '-' },
        { label: 'Address', value: String(sale?.customerAddress || '-').trim() || '-' },
        { label: 'Type', value: sale?.party ? 'Registered Party' : 'Direct Sale' }
      ]);

      drawInfoCard(doc, 298, y, 262, 106, 'COMPANY DETAILS', [
        { label: 'Company', value: profile.companyName, strong: true },
        { label: 'State', value: profile.state },
        { label: 'Pincode', value: profile.pincode },
        { label: 'GST', value: profile.gstNumber || '-' }
      ]);

      y += 128;

      doc
        .roundedRect(leftX, y, 524, 30, 12)
        .fill('#f1f5f9');

      doc
        .fillColor(BRAND.teal)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('SALE ITEM SUMMARY', leftX + 14, y + 10);

      y += 42;
      drawTableHeader(doc, y);
      y += 36;

      const pageContentBottom = 648;

      items.forEach((item, index) => {
        if (y > pageContentBottom) {
          doc.addPage();
          drawPageFrame(doc);
          y = PAGE.marginY;
          drawTableHeader(doc, y);
          y += 36;
        }

        const rowHeight = 28;
        const rowX = PAGE.marginX;
        const rowWidth = PAGE.width - (PAGE.marginX * 2);

        doc
          .roundedRect(rowX, y - 4, rowWidth, rowHeight, 8)
          .fill(index % 2 === 0 ? '#ffffff' : '#f8fafc');

        doc
          .strokeColor(BRAND.line)
          .lineWidth(0.5)
          .moveTo(rowX, y + 24)
          .lineTo(rowX + rowWidth, y + 24)
          .stroke();

        doc
          .fillColor(BRAND.navy)
          .font('Helvetica')
          .fontSize(9.5)
          .text(String(index + 1).padStart(2, '0'), rowX + 10, y + 4, { width: 18, align: 'center' })
          .text(String(item?.productName || item?.product?.name || 'Item').trim() || 'Item', rowX + 36, y + 4, { width: 228 })
          .text(String(item?.quantity || 0), rowX + 272, y + 4, { width: 40, align: 'right' })
          .text(String(item?.unit || item?.product?.unit || '-').trim() || '-', rowX + 322, y + 4, { width: 48, align: 'center' })
          .text(formatCurrency(item?.unitPrice || 0), rowX + 378, y + 4, { width: 72, align: 'right' })
          .font('Helvetica-Bold')
          .text(formatCurrency(item?.total || 0), rowX + 458, y + 4, { width: 66, align: 'right' });

        y += rowHeight;
      });

      if (items.length === 0) {
        doc
          .roundedRect(PAGE.marginX, y - 4, PAGE.width - (PAGE.marginX * 2), 34, 8)
          .fill('#ffffff');

        doc
          .fillColor(BRAND.muted)
          .font('Helvetica')
          .fontSize(10)
          .text('No sale items available.', PAGE.marginX, y + 6, {
            width: PAGE.width - (PAGE.marginX * 2),
            align: 'center'
          });

        y += 42;
      } else {
        y += 16;
      }

      if (y > 566) {
        doc.addPage();
        drawPageFrame(doc);
        y = PAGE.marginY;
      }

      doc
        .roundedRect(leftX, y, 272, 112, 14)
        .fillAndStroke(BRAND.blueSoft, '#bfdbfe');

      doc
        .fillColor('#1d4ed8')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('AMOUNT IN WORDS', leftX + 16, y + 14);

      doc
        .fillColor(BRAND.navy)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(getAmountInWords(sale?.totalAmount || 0), leftX + 16, y + 36, { width: 240 })
        .fillColor(BRAND.muted)
        .font('Helvetica')
        .fontSize(8.8)
        .text('Payment reference can be matched using invoice number.', leftX + 16, y + 82, { width: 240 });

      doc
        .roundedRect(326, y, 234, 130, 16)
        .fillAndStroke('#ffffff', BRAND.line);

      doc
        .fillColor(BRAND.muted)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('TOTAL SUMMARY', 342, y + 16, { width: 202 });

      doc
        .fillColor(BRAND.slate)
        .font('Helvetica')
        .fontSize(10)
        .text('Subtotal', 342, y + 42)
        .text(`Rs ${formatCurrency(sale?.subtotal || 0)}`, 444, y + 42, { width: 92, align: 'right' })
        .text('Tax Amount', 342, y + 62)
        .text(`Rs ${formatCurrency(sale?.taxAmount || 0)}`, 444, y + 62, { width: 92, align: 'right' });

      doc
        .moveTo(342, y + 84)
        .lineTo(536, y + 84)
        .lineWidth(1)
        .strokeColor(BRAND.line)
        .stroke();

      doc
        .roundedRect(342, y + 92, 194, 26, 8)
        .fill(BRAND.totalBg);

      doc
        .fillColor(BRAND.navy)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Grand Total', 352, y + 100)
        .text(`Rs ${formatCurrency(sale?.totalAmount || 0)}`, 438, y + 100, { width: 88, align: 'right' });

      y += 150;

      if (String(sale?.notes || '').trim()) {
        doc
          .roundedRect(leftX, y, 524, 58, 12)
          .fillAndStroke(BRAND.amberSoft, BRAND.amberBorder);

        doc
          .fillColor('#c2410c')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('NOTES', leftX + 16, y + 14);

        doc
          .fillColor(BRAND.navy)
          .font('Helvetica')
          .fontSize(9.5)
          .text(String(sale.notes).trim(), leftX + 16, y + 30, { width: 492 });

        y += 74;
      }

      if (y > 540) {
        doc.addPage();
        drawPageFrame(doc);
        y = PAGE.marginY;
      }

      doc
        .roundedRect(leftX, y, 324, 154, 14)
        .fillAndStroke('#ffffff', BRAND.line);

      doc
        .fillColor(BRAND.muted)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('BANK DETAILS', leftX + 16, y + 14);

      doc
        .fillColor(BRAND.navy)
        .font('Helvetica')
        .fontSize(9.5)
        .text(`Bank Name: ${profile.bankName}`, leftX + 16, y + 38, { width: 292 })
        .text(`Account Number: ${profile.accountNumber}`, leftX + 16, y + 58, { width: 292 })
        .text(`IFSC Code: ${profile.ifscCode}`, leftX + 16, y + 78, { width: 292 })
        .text(`Account Holder: ${profile.accountHolderName}`, leftX + 16, y + 98, { width: 292 })
        .text(`UPI ID: ${profile.upiId || '-'}`, leftX + 16, y + 118, { width: 292 });

      doc
        .roundedRect(376, y, 184, 154, 14)
        .fillAndStroke(BRAND.qrBg, BRAND.line);

      doc
        .fillColor(BRAND.muted)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('SCAN TO PAY', 392, y + 14, { width: 152, align: 'center' });

      if (qrBuffer) {
        doc.image(qrBuffer, 411, y + 34, { width: 114, height: 114 });
      } else {
        doc
          .fillColor(BRAND.muted)
          .font('Helvetica')
          .fontSize(9)
          .text('UPI ID not available', 392, y + 72, { width: 152, align: 'center' });
      }

      doc
        .fillColor(BRAND.slate)
        .font('Helvetica')
        .fontSize(7.6)
        .text(profile.upiId || '-', 392, y + 128, { width: 152, align: 'center' });

      doc
        .moveTo(leftX, 770)
        .lineTo(PAGE.width - PAGE.marginX, 770)
        .lineWidth(1)
        .strokeColor(BRAND.line)
        .stroke();

      doc
        .fillColor(BRAND.muted)
        .font('Helvetica')
        .fontSize(8.5)
        .text('This is a computer-generated sale invoice from Accounts.', leftX, 780)
        .text('Authorised Signatory', 420, 780, { width: 120, align: 'right' });

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
