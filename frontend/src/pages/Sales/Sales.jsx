import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, IndianRupee, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import AddPartyPopup from '../Party/component/AddPartyPopup';
import AddProductPopup from '../Products/component/AddProductPopup';
import AddSalePopup from './component/AddSalePopup';

const formatDateForInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().split('T')[0];
};

const parseSaleDate = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return null;

  const yyyymmddMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const ddmmyyyyMatch = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

  let dayText;
  let monthText;
  let yearText;

  if (yyyymmddMatch) {
    [, yearText, monthText, dayText] = yyyymmddMatch;
  } else if (ddmmyyyyMatch) {
    [, dayText, monthText, yearText] = ddmmyyyyMatch;
  } else {
    return null;
  }

  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const getInitialFormData = () => ({
  party: '',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  items: [],
  saleDate: formatDateForInput(),
  dueDate: '',
  subtotal: 0,
  taxAmount: 0,
  totalAmount: 0,
  paidAmount: 0,
  notes: ''
});

const getInitialPartyFormData = (type = 'customer') => ({
  type,
  name: '',
  mobile: '',
  email: '',
  address: '',
  state: '',
  pincode: '',
  openingBalance: '',
  openingBalanceType: type === 'supplier' ? 'payable' : 'receivable'
});

const toTitleCase = (value) => String(value || '')
  .toLowerCase()
  .replace(/\b[a-z]/g, (char) => char.toUpperCase());

const getSalePriceInputValue = (product) => String(Number(product?.salePrice || 0));
const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const formatDisplayDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Sales({ modalOnly = false, onModalFinish = null }) {
  const toastOptions = { autoClose: 1200 };
  const location = useLocation();
  const navigate = useNavigate();
  const initialFormData = getInitialFormData();
  const initialCurrentItem = {
    product: '',
    productName: '',
    unit: '',
    quantity: '',
    unitPrice: ''
  };

  const [sales, setSales] = useState([]);
  const [leadgers, setLeadgers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceNumberPreview, setInvoiceNumberPreview] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [currentItem, setCurrentItem] = useState(initialCurrentItem);
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [partyFormData, setPartyFormData] = useState(getInitialPartyFormData());
  const [partyPopupLoading, setPartyPopupLoading] = useState(false);
  const [partyPopupError, setPartyPopupError] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [leadgerQuery, setLeadgerQuery] = useState('');
  const [leadgerListIndex, setLeadgerListIndex] = useState(-1);
  const [isLeadgerSectionActive, setIsLeadgerSectionActive] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productListIndex, setProductListIndex] = useState(-1);
  const [isProductSectionActive, setIsProductSectionActive] = useState(false);
  const leadgerSectionRef = useRef(null);
  const leadgerInputRef = useRef(null);
  const productSectionRef = useRef(null);
  const productInputRef = useRef(null);

  useEffect(() => {
    fetchSales();
    fetchLeadgers();
    fetchProducts();
  }, [search]);

  useEffect(() => {
    if (location.state?.openShortcut !== 'sale' || showForm) return;

    handleOpenForm();
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, showForm]);

  useEffect(() => {
    if (!modalOnly || showForm) return;
    handleOpenForm();
  }, [modalOnly, showForm]);

  useEffect(() => {
    if (!showForm || editingId) {
      setInvoiceNumberPreview('');
      return;
    }

    let ignore = false;

    const loadNextInvoiceNumber = async () => {
      try {
        const response = await apiClient.get('/sales/next-invoice-number', {
          params: {
            saleDate: formData.saleDate || undefined
          }
        });

        if (!ignore) {
          setInvoiceNumberPreview(response.data?.invoiceNumber || '');
        }
      } catch (err) {
        if (!ignore) {
          setInvoiceNumberPreview('');
        }
      }
    };

    loadNextInvoiceNumber();

    return () => {
      ignore = true;
    };
  }, [showForm, editingId, formData.saleDate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName?.toLowerCase();
      const isTypingTarget = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || event.target?.isContentEditable;
      const key = event.key?.toLowerCase();
      const isSaleShortcut = event.altKey && key === 's';
      const isF1Shortcut = key === 'f1';
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget || showForm) return;
      if (!isSaleShortcut && !isF1Shortcut) return;

      event.preventDefault();
      handleOpenForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  const getSaleInvoicePdfUrl = (saleId) => {
    const configuredBaseUrl = String(apiClient.defaults.baseURL || '/api').trim();
    const resolvedBaseUrl = configuredBaseUrl
      ? new URL(configuredBaseUrl, window.location.origin).toString().replace(/\/+$/, '')
      : `${window.location.origin}/api`;

    return `${resolvedBaseUrl}/sales/${saleId}/invoice-pdf`;
  };

  const handleOpenInvoicePdf = (saleId) => {
    if (!saleId) return;
    window.open(getSaleInvoicePdfUrl(saleId), '_blank', 'noopener,noreferrer');
  };

  const handleShareOnWhatsApp = (sale) => {
    if (!sale?._id) return;

    const rawPhone = String(sale.customerPhone || resolveLeadgerMobileById(sale.party) || '').replace(/\D/g, '');
    if (!rawPhone) {
      toast.error('Customer mobile number not found for this sale', toastOptions);
      return;
    }

    const whatsappPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const partyName = resolveLeadgerNameById(sale.party) || sale.customerName || 'Customer';
    const invoicePdfUrl = getSaleInvoicePdfUrl(sale._id);
    const message = [
      `Hello ${partyName},`,
      '',
      'Please find your bill details below:',
      `Invoice No: ${sale.invoiceNumber || '-'}`,
      `Invoice Date: ${formatDisplayDate(sale.saleDate)}`,
      `Bill Amount: ${formatCurrency(sale.totalAmount)}`,
      '',
      `Download Bill PDF: ${invoicePdfUrl}`,
      '',
      'Thank you.'
    ].join('\n');

    window.location.href = `whatsapp://send?phone=${whatsappPhone}&text=${encodeURIComponent(message)}`;
  };

  const handleShareBySms = (sale) => {
    if (!sale?._id) return;

    const rawPhone = String(sale.customerPhone || resolveLeadgerMobileById(sale.party) || '').replace(/\D/g, '');
    if (!rawPhone) {
      toast.error('Customer mobile number not found for this sale', toastOptions);
      return;
    }

    const partyName = resolveLeadgerNameById(sale.party) || sale.customerName || 'Customer';
    const invoicePdfUrl = getSaleInvoicePdfUrl(sale._id);
    const message = [
      `Hello ${partyName},`,
      `Your invoice number is ${sale.invoiceNumber || '-'}.`,
      `Invoice date: ${formatDisplayDate(sale.saleDate)}`,
      `Bill amount: ${formatCurrency(sale.totalAmount)}`,
      `Download invoice: ${invoicePdfUrl}`
    ].join('\n');

    window.location.href = `sms:${rawPhone}?body=${encodeURIComponent(message)}`;
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sales', {
        params: {
          search
        }
      });
      setSales(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadgers = async () => {
    try {
      const response = await apiClient.get('/parties');
      setLeadgers(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error('Error fetching leadgers:', err);
      return [];
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const getLeadgerDisplayName = (leadger) => {
    const name = String(leadger?.name || '').trim();

    if (name) return name;
    return 'Party Name';
  };

  const resolveLeadgerNameById = (leadgerId) => {
    const resolvedId = typeof leadgerId === 'object' ? leadgerId?._id : leadgerId;
    if (!resolvedId) return '';
    const matching = leadgers.find((leadger) => String(leadger._id) === String(resolvedId));
    return matching ? getLeadgerDisplayName(matching) : '';
  };

  const resolveLeadgerMobileById = (leadgerId) => {
    const resolvedId = typeof leadgerId === 'object' ? leadgerId?._id : leadgerId;
    if (!resolvedId) return '';
    const matching = leadgers.find((leadger) => String(leadger._id) === String(resolvedId));
    return String(matching?.mobile || '').replace(/\D/g, '');
  };

  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const getMatchingLeadgers = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return leadgers;

    const startsWith = leadgers.filter((leadger) => normalizeText(getLeadgerDisplayName(leadger)).startsWith(normalized));
    const includes = leadgers.filter((leadger) => (
      !normalizeText(getLeadgerDisplayName(leadger)).startsWith(normalized)
      && normalizeText(getLeadgerDisplayName(leadger)).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const selectedLeadgerName = useMemo(() => resolveLeadgerNameById(formData.party), [formData.party, leadgers]);

  const filteredLeadgers = useMemo(() => {
    const normalizedQuery = normalizeText(leadgerQuery);
    const normalizedSelectedName = normalizeText(selectedLeadgerName);

    if (
      isLeadgerSectionActive
      && normalizedQuery
      && normalizedQuery === normalizedSelectedName
    ) {
      return leadgers;
    }

    return getMatchingLeadgers(leadgerQuery);
  }, [leadgers, leadgerQuery, isLeadgerSectionActive, selectedLeadgerName]);

  const selectedLeadger = useMemo(
    () => leadgers.find((leadger) => String(leadger._id) === String(formData.party || '')) || null,
    [leadgers, formData.party]
  );
  const isCashParty = String(selectedLeadger?.type || '').trim().toLowerCase() === 'cash-in-hand';

  useEffect(() => {
    if (!showForm) return;

    if (filteredLeadgers.length === 0) {
      setLeadgerListIndex(-1);
      return;
    }

    const shouldHighlightSelectedLeadger = (
      isLeadgerSectionActive
      && normalizeText(leadgerQuery)
      && normalizeText(leadgerQuery) === normalizeText(selectedLeadgerName)
      && formData.party
    );

    if (shouldHighlightSelectedLeadger) {
      const selectedIndex = filteredLeadgers.findIndex((item) => String(item._id) === String(formData.party));
      setLeadgerListIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }

    setLeadgerListIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredLeadgers.length) return filteredLeadgers.length - 1;
      return prev;
    });
  }, [showForm, filteredLeadgers, isLeadgerSectionActive, leadgerQuery, selectedLeadgerName, formData.party]);

  const handleLeadgerFocus = () => {
    setIsLeadgerSectionActive(true);
  };

  useEffect(() => {
    if (!showForm || editingId || !isCashParty) return;

    setFormData((prev) => {
      const nextPaidAmount = Number(prev.totalAmount || 0);
      if (
        Number(prev.paidAmount || 0) === nextPaidAmount
        && prev.dueDate === ''
      ) {
        return prev;
      }

      return {
        ...prev,
        paidAmount: nextPaidAmount,
        dueDate: ''
      };
    });
  }, [showForm, editingId, isCashParty, formData.totalAmount]);

  const findExactLeadger = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return leadgers.find((leadger) => normalizeText(getLeadgerDisplayName(leadger)) === normalized) || null;
  };

  const findBestLeadgerMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return leadgers.find((leadger) => normalizeText(getLeadgerDisplayName(leadger)).startsWith(normalized))
      || leadgers.find((leadger) => normalizeText(getLeadgerDisplayName(leadger)).includes(normalized))
      || null;
  };

  const selectLeadger = (leadger) => {
    if (!leadger) {
      setLeadgerQuery('');
      setFormData((prev) => ({
        ...prev,
        party: '',
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }));
      setLeadgerListIndex(-1);
      return;
    }

    const leadgerName = getLeadgerDisplayName(leadger);
    setLeadgerQuery(leadgerName);
    setFormData((prev) => ({
      ...prev,
      party: leadger._id,
      customerName: leadgerName,
      customerPhone: '',
      customerAddress: ''
    }));

    const selectedIndex = filteredLeadgers.findIndex((item) => String(item._id) === String(leadger._id));
    setLeadgerListIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const handleLeadgerInputChange = (e) => {
    const value = e.target.value;
    setLeadgerQuery(value);

    if (!normalizeText(value)) {
      selectLeadger(null);
      return;
    }

    const exactLeadger = findExactLeadger(value);
    if (exactLeadger) {
      setFormData((prev) => ({
        ...prev,
        party: exactLeadger._id,
        customerName: getLeadgerDisplayName(exactLeadger),
        customerPhone: '',
        customerAddress: ''
      }));
      const exactIndex = getMatchingLeadgers(value).findIndex((item) => String(item._id) === String(exactLeadger._id));
      setLeadgerListIndex(exactIndex >= 0 ? exactIndex : 0);
      return;
    }

    const matches = getMatchingLeadgers(value);
    const firstMatch = matches[0] || null;
    setFormData((prev) => ({
      ...prev,
      party: firstMatch?._id || '',
      customerName: firstMatch ? getLeadgerDisplayName(firstMatch) : '',
      customerPhone: '',
      customerAddress: ''
    }));
    setLeadgerListIndex(firstMatch ? 0 : -1);
  };

  const focusNextPopupField = (element) => {
    if (!(element instanceof HTMLElement)) return;
    const form = element.closest('form');
    if (!form) return;

    const fields = Array.from(form.querySelectorAll(
      'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'
    )).filter((field) => {
      if (!(field instanceof HTMLElement)) return false;
      if (field.tabIndex === -1) return false;
      const style = window.getComputedStyle(field);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    const currentIndex = fields.indexOf(element);
    if (currentIndex === -1) return;

    const nextField = fields[currentIndex + 1];
    if (!(nextField instanceof HTMLElement)) return;
    nextField.focus();
    if (nextField instanceof HTMLInputElement && typeof nextField.select === 'function') {
      nextField.select();
    }
  };

  const handleSelectEnterMoveNext = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    focusNextPopupField(e.currentTarget);
  };

  const openInlinePartyForm = () => {
    setPartyFormData((prev) => ({
      ...getInitialPartyFormData('customer'),
      name: toTitleCase(leadgerQuery || prev.name || '')
    }));
    setPartyPopupError('');
    setIsLeadgerSectionActive(false);
    setShowPartyForm(true);
  };

  const closeInlinePartyForm = (shouldRefocusLeadger = true) => {
    setShowPartyForm(false);
    setPartyFormData(getInitialPartyFormData('customer'));
    setPartyPopupError('');

    if (!shouldRefocusLeadger) return;

    requestAnimationFrame(() => {
      leadgerInputRef.current?.focus();
      leadgerInputRef.current?.select?.();
    });
  };

  const handlePartyPopupChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      setPartyFormData((prev) => ({ ...prev, [name]: toTitleCase(value) }));
      return;
    }

    if (name === 'mobile') {
      const normalized = String(value || '').replace(/\D/g, '').slice(0, 10);
      setPartyFormData((prev) => ({ ...prev, [name]: normalized }));
      return;
    }

    if (name === 'pincode') {
      const normalized = String(value || '').replace(/\D/g, '').slice(0, 6);
      setPartyFormData((prev) => ({ ...prev, [name]: normalized }));
      return;
    }
    if (name === 'openingBalance') {
      setPartyFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    if (name === 'type') {
      setPartyFormData((prev) => ({
        ...prev,
        [name]: value,
        openingBalanceType: prev.openingBalance ? prev.openingBalanceType : (value === 'supplier' ? 'payable' : 'receivable')
      }));
      return;
    }

    setPartyFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openInlineProductForm = () => {
    setIsProductSectionActive(false);
    setShowProductForm(true);
  };

  const closeInlineProductForm = (shouldRefocusProduct = true) => {
    setShowProductForm(false);

    if (!shouldRefocusProduct) return;

    requestAnimationFrame(() => {
      productInputRef.current?.focus();
      productInputRef.current?.select?.();
    });
  };

  const handleLeadgerInputKeyDown = (e) => {
    const key = e.key?.toLowerCase();
    const isMoveDownKey = key === 'arrowdown';
    const isMoveUpKey = key === 'arrowup';

    if (key === 'control' && !e.altKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      openInlinePartyForm();
      return;
    }

    if (isMoveDownKey) {
      e.preventDefault();
      e.stopPropagation();
      if (filteredLeadgers.length === 0) return;
      setLeadgerListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredLeadgers.length - 1);
      });
      return;
    }

    if (isMoveUpKey) {
      e.preventDefault();
      e.stopPropagation();
      if (filteredLeadgers.length === 0) return;
      setLeadgerListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const activeLeadger = leadgerListIndex >= 0 ? filteredLeadgers[leadgerListIndex] : null;
      const matchedLeadger = activeLeadger || findExactLeadger(leadgerQuery) || findBestLeadgerMatch(leadgerQuery);
      if (matchedLeadger) {
        selectLeadger(matchedLeadger);
      }
      setIsLeadgerSectionActive(false);
      focusNextPopupField(e.currentTarget);
    }
  };

  const getProductDisplayName = (product) => String(product?.name || '').trim() || 'Product';

  const resolveProductNameById = (productId) => {
    const resolvedId = typeof productId === 'object' ? productId?._id : productId;
    if (!resolvedId) return '';
    const matching = products.find((product) => String(product._id) === String(resolvedId));
    return matching ? getProductDisplayName(matching) : '';
  };

  const getMatchingProducts = (queryValue) => {
    const normalized = normalizeText(queryValue);
    if (!normalized) return products;

    const startsWith = products.filter((product) => normalizeText(getProductDisplayName(product)).startsWith(normalized));
    const includes = products.filter((product) => (
      !normalizeText(getProductDisplayName(product)).startsWith(normalized)
      && normalizeText(getProductDisplayName(product)).includes(normalized)
    ));

    return [...startsWith, ...includes];
  };

  const selectedProductName = useMemo(() => {
    const resolvedName = resolveProductNameById(currentItem.product);
    return resolvedName || currentItem.productName || '';
  }, [currentItem.product, currentItem.productName, products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(productQuery);
    const normalizedSelectedName = normalizeText(selectedProductName);

    if (
      isProductSectionActive
      && normalizedQuery
      && normalizedQuery === normalizedSelectedName
    ) {
      return products;
    }

    return getMatchingProducts(productQuery);
  }, [products, productQuery, isProductSectionActive, selectedProductName]);

  useEffect(() => {
    if (!showForm) return;

    if (filteredProducts.length === 0) {
      setProductListIndex(isProductSectionActive ? 0 : -1);
      return;
    }

    const shouldHighlightSelectedProduct = (
      isProductSectionActive
      && normalizeText(productQuery)
      && normalizeText(productQuery) === normalizeText(selectedProductName)
      && currentItem.product
    );

    if (shouldHighlightSelectedProduct) {
      const selectedIndex = filteredProducts.findIndex((item) => String(item._id) === String(currentItem.product));
      setProductListIndex(selectedIndex >= 0 ? selectedIndex + 1 : 1);
      return;
    }

    setProductListIndex((prev) => {
      if (prev < 0) return 1;
      if (prev > filteredProducts.length) return filteredProducts.length;
      return prev;
    });
  }, [showForm, filteredProducts, isProductSectionActive, productQuery, selectedProductName, currentItem.product]);

  const findExactProduct = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return products.find((product) => normalizeText(getProductDisplayName(product)) === normalized) || null;
  };

  const findBestProductMatch = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return products.find((product) => normalizeText(getProductDisplayName(product)).startsWith(normalized))
      || products.find((product) => normalizeText(getProductDisplayName(product)).includes(normalized))
      || null;
  };

  const selectProduct = (product) => {
    if (!product) {
      setProductQuery('');
      setCurrentItem((prev) => ({
        ...prev,
        product: '',
        productName: '',
        unit: '',
        unitPrice: ''
      }));
      setProductListIndex(-1);
      return;
    }

    const productName = getProductDisplayName(product);
    setProductQuery(productName);
    setCurrentItem((prev) => ({
      ...prev,
      product: product._id,
      productName,
      unit: String(product.unit || '').trim(),
      unitPrice: getSalePriceInputValue(product)
    }));

    const selectedIndex = filteredProducts.findIndex((item) => String(item._id) === String(product._id));
    setProductListIndex(selectedIndex >= 0 ? selectedIndex + 1 : 1);
  };

  const handleProductFocus = () => {
    setIsProductSectionActive(true);
  };

  const handleProductInputChange = (e) => {
    const value = e.target.value;
    setProductQuery(value);

    if (!normalizeText(value)) {
      selectProduct(null);
      return;
    }

    const exactProduct = findExactProduct(value);
    if (exactProduct) {
      setCurrentItem((prev) => ({
        ...prev,
        product: exactProduct._id,
        productName: getProductDisplayName(exactProduct),
        unit: String(exactProduct.unit || '').trim(),
        unitPrice: getSalePriceInputValue(exactProduct)
      }));
      const exactIndex = getMatchingProducts(value).findIndex((item) => String(item._id) === String(exactProduct._id));
      setProductListIndex(exactIndex >= 0 ? exactIndex + 1 : 1);
      return;
    }

    const matches = getMatchingProducts(value);
    const firstMatch = matches[0] || null;
    setCurrentItem((prev) => ({
      ...prev,
      product: firstMatch?._id || '',
      productName: firstMatch ? getProductDisplayName(firstMatch) : '',
      unit: firstMatch ? String(firstMatch.unit || '').trim() : '',
      unitPrice: firstMatch ? getSalePriceInputValue(firstMatch) : ''
    }));
    setProductListIndex(firstMatch ? 1 : 0);
  };

  const handleProductInputKeyDown = (e, endItemList) => {
    const key = e.key?.toLowerCase();
    const endListIndex = 0;
    const lastProductIndex = filteredProducts.length;

    if (key === 'control' && !e.altKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      openInlineProductForm();
      return;
    }

    if (key === 'arrowdown') {
      e.preventDefault();
      e.stopPropagation();
      setProductListIndex((prev) => {
        if (prev < 0) return filteredProducts.length > 0 ? 1 : endListIndex;
        return Math.min(prev + 1, lastProductIndex);
      });
      return;
    }

    if (key === 'arrowup') {
      e.preventDefault();
      e.stopPropagation();
      setProductListIndex((prev) => {
        if (prev < 0) return filteredProducts.length > 0 ? 1 : endListIndex;
        return Math.max(prev - 1, endListIndex);
      });
      return;
    }

    if (key === 'delete') {
      e.preventDefault();
      e.stopPropagation();
      setIsProductSectionActive(false);
      endItemList?.();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      if (productListIndex === endListIndex) {
        setIsProductSectionActive(false);
        endItemList?.();
        return;
      }

      const activeProduct = productListIndex > 0 ? filteredProducts[productListIndex - 1] : null;
      const matchedProduct = activeProduct || findExactProduct(productQuery) || findBestProductMatch(productQuery);
      if (matchedProduct) {
        selectProduct(matchedProduct);
      }
      setIsProductSectionActive(false);
      focusNextPopupField(e.currentTarget);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.product || !currentItem.quantity || !currentItem.unitPrice) {
      setError('Product, quantity and price are required');
      return false;
    }

    const product = products.find(p => p._id === currentItem.product);
    if (!product || product.currentStock < currentItem.quantity) {
      setError(`Insufficient stock for ${product?.name}`);
      return false;
    }

    const taxAmount = 0;
    const total = currentItem.unitPrice * currentItem.quantity;

    const newItem = {
      ...currentItem,
      productName: product?.name,
      unit: String(product?.unit || currentItem.unit || '').trim(),
      quantity: parseFloat(currentItem.quantity),
      unitPrice: parseFloat(currentItem.unitPrice),
      taxAmount,
      discount: 0,
      total
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setCurrentItem(initialCurrentItem);
    setProductQuery('');
    setProductListIndex(-1);
    setIsProductSectionActive(false);

    calculateTotals([...formData.items, newItem]);
    setError('');
    return true;
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }
    
    updatedItems[index] = item;
    setFormData((prev) => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    calculateTotals(newItems);
  };

  const calculateTotals = (items) => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
      subtotal += item.unitPrice * item.quantity;
      totalTax += item.taxAmount || 0;
    });

    const total = subtotal + totalTax;

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount: totalTax,
      totalAmount: total
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customerPhone') {
      const normalizedPhone = String(value || '').replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, customerPhone: normalizedPhone });
      return;
    }
    if (name === 'saleDate') {
      setFormData({ ...formData, saleDate: value });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleProductCreated = (createdProduct) => {
    if (!createdProduct?._id) return;

    setProducts((prev) => [
      createdProduct,
      ...prev.filter((item) => String(item._id) !== String(createdProduct._id))
    ]);
    selectProduct(createdProduct);
    setError('');
    setShowProductForm(false);
    toast.success('Stock item created successfully', toastOptions);

    requestAnimationFrame(() => {
      focusNextPopupField(productInputRef.current);
    });
  };

  const handlePartyPopupSubmit = async (e) => {
    e.preventDefault();

    if (!String(partyFormData.name || '').trim()) {
      setPartyPopupError('Party name is required');
      return;
    }

    if (!['supplier', 'customer', 'cash-in-hand'].includes(partyFormData.type)) {
      setPartyPopupError('Party type is required');
      return;
    }

    try {
      setPartyPopupLoading(true);

      const payload = {
        type: String(partyFormData.type || '').trim(),
        name: String(partyFormData.name || '').trim(),
        mobile: String(partyFormData.mobile || '').trim(),
        email: String(partyFormData.email || '').trim(),
        address: String(partyFormData.address || '').trim(),
        state: String(partyFormData.state || '').trim(),
        pincode: String(partyFormData.pincode || '').trim(),
        openingBalance: Number(partyFormData.openingBalance || 0),
        openingBalanceType: String(partyFormData.openingBalanceType || 'receivable')
      };

      const response = await apiClient.post('/parties', payload);
      const createdParty = response?.data || null;

      if (!createdParty?._id) {
        throw new Error('Party created but response was incomplete');
      }

      setLeadgers((prev) => [
        createdParty,
        ...prev.filter((item) => String(item._id) !== String(createdParty._id))
      ]);
      selectLeadger(createdParty);
      setError('');
      setPartyPopupError('');
      setShowPartyForm(false);
      setPartyFormData(getInitialPartyFormData('customer'));
      toast.success('Party created successfully', toastOptions);

      requestAnimationFrame(() => {
        focusNextPopupField(leadgerInputRef.current);
      });
    } catch (err) {
      setPartyPopupError(err.message || 'Error creating party');
    } finally {
      setPartyPopupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party) {
      setError('Party name is required');
      return;
    }
    const parsedSaleDate = parseSaleDate(formData.saleDate);
    if (!parsedSaleDate) {
      setError('Please select a valid sale date');
      return;
    }
    if (formData.items.length === 0) {
      setError('At least one item is required');
      return;
    }

    try {
      setLoading(true);
      const isEditMode = Boolean(editingId);
      const submitData = {
        ...formData,
        paidAmount: !isEditMode && isCashParty ? Number(formData.totalAmount || 0) : formData.paidAmount,
        saleDate: parsedSaleDate,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null
      };

      if (editingId) {
        await apiClient.put(`/sales/${editingId}`, submitData);
      } else {
        await apiClient.post('/sales', submitData);
      }
      toast.success(
        isEditMode ? 'Sale updated successfully' : 'Sale added successfully',
        toastOptions
      );
      fetchSales();
      setFormData(getInitialFormData());
      setCurrentItem(initialCurrentItem);
      setEditingId(null);
      setShowPartyForm(false);
      setShowProductForm(false);
      setLeadgerQuery('');
      setLeadgerListIndex(-1);
      setIsLeadgerSectionActive(false);
      setProductQuery('');
      setProductListIndex(-1);
      setIsProductSectionActive(false);
      setShowForm(false);
      setError('');
      if (modalOnly && typeof onModalFinish === 'function') {
        onModalFinish();
      }
    } catch (err) {
      setError(err.message || 'Error saving sale');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sale) => {
    const normalizedPartyId = typeof sale.party === 'object'
      ? sale.party?._id || ''
      : (sale.party || '');
    const resolvedLeadgerName = resolveLeadgerNameById(normalizedPartyId) || sale.customerName || '';

    setFormData({
      ...getInitialFormData(),
      ...sale,
      party: normalizedPartyId,
      saleDate: formatDateForInput(sale.saleDate),
      customerName: resolvedLeadgerName,
      customerPhone: String(sale.customerPhone || '').replace(/\D/g, '').slice(0, 10),
      customerAddress: sale.customerAddress || ''
    });
    setLeadgerQuery(resolvedLeadgerName);
    setLeadgerListIndex(resolvedLeadgerName ? 0 : -1);
    setIsLeadgerSectionActive(false);
    setProductQuery('');
    setProductListIndex(-1);
    setIsProductSectionActive(false);
    setEditingId(sale._id);
    setShowForm(true);
  };

  useEffect(() => {
    const saleToEdit = location.state?.editSale;
    if (!saleToEdit || showForm) return;

    handleEdit(saleToEdit);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, showForm]);

  const handleCancel = () => {
    setShowPartyForm(false);
    setShowProductForm(false);

    if (modalOnly && typeof onModalFinish === 'function') {
      onModalFinish();
      return;
    }

    setPartyFormData(getInitialPartyFormData('customer'));
    setPartyPopupError('');
    setShowForm(false);
    setEditingId(null);
    setFormData(getInitialFormData());
    setCurrentItem(initialCurrentItem);
    setLeadgerQuery('');
    setLeadgerListIndex(-1);
    setIsLeadgerSectionActive(false);
    setProductQuery('');
    setProductListIndex(-1);
    setIsProductSectionActive(false);
  };

  const handleOpenForm = () => {
    setEditingId(null);
    setShowPartyForm(false);
    setShowProductForm(false);
    setPartyFormData(getInitialPartyFormData('customer'));
    setPartyPopupError('');
    setFormData(getInitialFormData());
    setCurrentItem(initialCurrentItem);
    setLeadgerQuery('');
    setLeadgerListIndex(0);
    setIsLeadgerSectionActive(false);
    setProductQuery('');
    setProductListIndex(1);
    setIsProductSectionActive(false);
    setShowForm(true);
  };

  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const popupFieldClass = 'w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';
  const popupLabelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600';
  const popupSectionClass = 'rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4';

  if (modalOnly) {
    return (
      <>
        {error && (
          <div className="fixed left-4 right-4 top-4 z-[60] rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 shadow-lg md:left-auto md:right-4 md:w-[26rem]">
            {error}
          </div>
        )}
        <AddSalePopup
          showForm={showForm}
          editingId={editingId}
          loading={loading}
          isCashParty={isCashParty}
          invoiceNumberPreview={invoiceNumberPreview}
          formData={formData}
          currentItem={currentItem}
          products={products}
          popupFieldClass={popupFieldClass}
          popupLabelClass={popupLabelClass}
          leadgerSectionRef={leadgerSectionRef}
          leadgerInputRef={leadgerInputRef}
          productSectionRef={productSectionRef}
          productInputRef={productInputRef}
          leadgerQuery={leadgerQuery}
          productQuery={productQuery}
          leadgerListIndex={leadgerListIndex}
          productListIndex={productListIndex}
          filteredLeadgers={filteredLeadgers}
          filteredProducts={filteredProducts}
          isLeadgerSectionActive={isLeadgerSectionActive}
          isProductSectionActive={isProductSectionActive}
          setCurrentItem={setCurrentItem}
          setIsLeadgerSectionActive={setIsLeadgerSectionActive}
          setIsProductSectionActive={setIsProductSectionActive}
          setLeadgerListIndex={setLeadgerListIndex}
          setProductListIndex={setProductListIndex}
          getLeadgerDisplayName={getLeadgerDisplayName}
          getProductDisplayName={getProductDisplayName}
          handleCancel={handleCancel}
          handleSubmit={handleSubmit}
          handleInputChange={handleInputChange}
          handleLeadgerFocus={handleLeadgerFocus}
          handleLeadgerInputChange={handleLeadgerInputChange}
          handleLeadgerInputKeyDown={handleLeadgerInputKeyDown}
          onOpenNewParty={openInlinePartyForm}
          handleProductFocus={handleProductFocus}
          handleProductInputChange={handleProductInputChange}
          handleProductInputKeyDown={handleProductInputKeyDown}
          onOpenNewProduct={openInlineProductForm}
          handleSelectEnterMoveNext={handleSelectEnterMoveNext}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          handleItemChange={handleItemChange}
          selectLeadger={selectLeadger}
          selectProduct={selectProduct}
        />
        <AddPartyPopup
          showForm={showPartyForm}
          editingId={null}
          loading={partyPopupLoading}
          formData={partyFormData}
          error={partyPopupError}
          handleCloseForm={() => closeInlinePartyForm(true)}
          handleSubmit={handlePartyPopupSubmit}
          handleChange={handlePartyPopupChange}
        />
        <AddProductPopup
          showForm={showProductForm}
          initialName={productQuery}
          onClose={() => closeInlineProductForm(true)}
          onProductCreated={handleProductCreated}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-3 pb-8 pt-4 md:px-4 lg:px-6 lg:pt-4">

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Sales</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{totalSales}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>
        <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Amount</p>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-2xl font-bold text-slate-800 leading-tight">
                <span className="text-[10px] sm:text-base text-slate-400 font-medium mr-1">Rs</span>
                {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80"></div>
        </div>
      </div>

      <AddSalePopup
        showForm={showForm}
        editingId={editingId}
        loading={loading}
        isCashParty={isCashParty}
        invoiceNumberPreview={invoiceNumberPreview}
        formData={formData}
        currentItem={currentItem}
        products={products}
        popupFieldClass={popupFieldClass}
        popupLabelClass={popupLabelClass}
        popupSectionClass={popupSectionClass}
        leadgerSectionRef={leadgerSectionRef}
        leadgerInputRef={leadgerInputRef}
        productSectionRef={productSectionRef}
        productInputRef={productInputRef}
        leadgerQuery={leadgerQuery}
        productQuery={productQuery}
        leadgerListIndex={leadgerListIndex}
        productListIndex={productListIndex}
        filteredLeadgers={filteredLeadgers}
        filteredProducts={filteredProducts}
        isLeadgerSectionActive={isLeadgerSectionActive}
        isProductSectionActive={isProductSectionActive}
        setCurrentItem={setCurrentItem}
        setIsLeadgerSectionActive={setIsLeadgerSectionActive}
        setIsProductSectionActive={setIsProductSectionActive}
        setLeadgerListIndex={setLeadgerListIndex}
        setProductListIndex={setProductListIndex}
        getLeadgerDisplayName={getLeadgerDisplayName}
        getProductDisplayName={getProductDisplayName}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        handleLeadgerFocus={handleLeadgerFocus}
        handleLeadgerInputChange={handleLeadgerInputChange}
        handleLeadgerInputKeyDown={handleLeadgerInputKeyDown}
        onOpenNewParty={openInlinePartyForm}
        handleProductFocus={handleProductFocus}
        handleProductInputChange={handleProductInputChange}
        handleProductInputKeyDown={handleProductInputKeyDown}
        onOpenNewProduct={openInlineProductForm}
        handleSelectEnterMoveNext={handleSelectEnterMoveNext}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        handleItemChange={handleItemChange}
        selectLeadger={selectLeadger}
        selectProduct={selectProduct}
      />
      <AddPartyPopup
        showForm={showPartyForm}
        editingId={null}
        loading={partyPopupLoading}
        formData={partyFormData}
        error={partyPopupError}
        handleCloseForm={() => closeInlinePartyForm(true)}
        handleSubmit={handlePartyPopupSubmit}
        handleChange={handlePartyPopupChange}
      />
      <AddProductPopup
        showForm={showProductForm}
        initialName={productQuery}
        onClose={() => closeInlineProductForm(true)}
        onProductCreated={handleProductCreated}
      />
      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <button
              onClick={handleOpenForm}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
            >
              + New Sale
            </button>
          </div>
        </div>

      {/* Sales List */}
      {loading && !showForm ? (
        <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
      ) : sales.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-slate-500">
          No sales found. Create your first sale!
        </div>
      ) : (
        <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap">
              <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                <tr>
                  <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Invoice</th>
                  <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Party Name</th>
                  <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold">Products</th>
                  <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Date</th>
                  <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Type</th>
                  <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Total</th>
                  <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Paid</th>
                  <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Balance</th>
                  <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                {sales.map((sale) => {
                  const saleTotal = Number(sale.totalAmount || 0);
                  const salePaid = Number(sale.paidAmount || 0);
                  const saleBalance = saleTotal - salePaid;
                  const typeNorm = String(sale.type || '').toLowerCase();
                  const isCashType = typeNorm === 'cash' || typeNorm === 'cash sale';
                  const isPartialType = typeNorm === 'partial' || typeNorm === 'sale';
                  const isCreditType = typeNorm === 'credit' || typeNorm === 'credit sale';
                  let typeBadge;
                  if (isCashType) {
                    typeBadge = <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">Cash</span>;
                  } else if (isPartialType) {
                    typeBadge = <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">Partial</span>;
                  } else {
                    typeBadge = <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">Credit</span>;
                  }
                  return (
                  <tr key={sale._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                    <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenInvoicePdf(sale._id)}
                        className="text-blue-700 underline underline-offset-2 transition hover:text-blue-900"
                      >
                        {sale.invoiceNumber}
                      </button>
                    </td>
                    <td className="border border-slate-400 px-4 py-3 text-center font-medium text-slate-700">{resolveLeadgerNameById(sale.party) || sale.customerName || '-'}</td>
                    <td className="border border-slate-400 px-4 py-3 text-slate-600">
                      {sale.items?.length
                        ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {sale.items.slice(0, 2).map((item, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100">
                                {item.productName}
                              </span>
                            ))}
                            {sale.items.length > 2 && (
                              <span className="text-xs font-medium text-slate-500 ml-1">
                                +{sale.items.length - 2} more
                              </span>
                            )}
                          </div>
                        )
                        : '-'}
                    </td>
                    <td className="border border-slate-400 px-4 py-3 text-center text-slate-600">{new Date(sale.saleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    {/* Type badge */}
                    <td className="border border-slate-400 px-4 py-3 text-center">{typeBadge}</td>
                    {/* Total */}
                    <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-700">
                      ₹{saleTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    {/* Paid */}
                    <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-emerald-600">
                      ₹{salePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    {/* Balance — can be negative (advance) */}
                    <td className={`border border-slate-400 px-4 py-3 text-center font-semibold ${
                      saleBalance < 0 ? 'text-purple-600' : saleBalance === 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {saleBalance < 0 ? (
                        <span title="Party has paid in advance">
                          -₹{Math.abs(saleBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <span className="ml-1 text-[10px] font-medium text-purple-400">(Adv)</span>
                        </span>
                      ) : (
                        `₹${saleBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="border border-slate-400 px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleShareOnWhatsApp(sale)}
                        className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                        aria-label={`Share ${sale.invoiceNumber || 'bill'} on WhatsApp`}
                        title="Share bill on WhatsApp"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.34-1.66a11.87 11.87 0 0 0 5.72 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.45-8.42ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.76.99 1-3.67-.24-.38a9.88 9.88 0 0 1-1.52-5.24C2.13 6.43 6.59 1.98 12.07 1.98c2.64 0 5.12 1.03 6.98 2.89a9.8 9.8 0 0 1 2.89 6.98c0 5.48-4.46 9.95-9.87 9.95Zm5.46-7.43c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.5-1.77-1.68-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.66-1.6-.9-2.19-.24-.58-.48-.5-.66-.5h-.56c-.2 0-.53.08-.8.38-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.35.19 1.86.11.57-.09 1.77-.72 2.02-1.42.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.56-.35Z" />
                          </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareBySms(sale)}
                        className="inline-flex items-center justify-center rounded-md border border-cyan-200 bg-white px-3 py-1.5 text-xs font-medium text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
                        aria-label={`Send ${sale.invoiceNumber || 'invoice'} by SMS`}
                        title="Send invoice by SMS"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m-7 6 3.8-3H19a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1v3Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(sale)}
                        className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

