import { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingCart, IndianRupee, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import AddSalePopup from './component/AddSalePopup';

const buildSaleReceiptMap = (receipts) => {
  const map = new Map();

  (receipts || [])
    .filter((receipt) => receipt.refType === 'sale' && receipt.refId)
    .forEach((receipt) => {
      const key = String(receipt.refId);
      map.set(key, (map.get(key) || 0) + Number(receipt.amount || 0));
    });

  return map;
};

const getSalePaymentStats = (sale, receiptMap) => {
  const total = Number(sale?.totalAmount || 0);
  const paid = Number(receiptMap.get(String(sale?._id || '')) || 0);
  const due = Math.max(0, total - paid);
  const status = due === 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');

  return { paid, due, status };
};

const formatDateForInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}-${month}-${year}`;
};

const parseManualDate = (value) => {
  const normalized = String(value || '').trim();
  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
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
  discountAmount: 0,
  taxAmount: 0,
  roundOff: 0,
  totalAmount: 0,
  paidAmount: 0,
  paymentMode: 'cash',
  notes: ''
});

export default function Sales() {
  const toastOptions = { autoClose: 1200 };
  const initialFormData = getInitialFormData();
  const initialCurrentItem = {
    product: '',
    productName: '',
    quantity: '',
    unitPrice: ''
  };

  const [sales, setSales] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);
  const [leadgers, setLeadgers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [currentItem, setCurrentItem] = useState(initialCurrentItem);
  const [leadgerQuery, setLeadgerQuery] = useState('');
  const [leadgerListIndex, setLeadgerListIndex] = useState(-1);
  const [isLeadgerSectionActive, setIsLeadgerSectionActive] = useState(false);
  const leadgerSectionRef = useRef(null);

  useEffect(() => {
    fetchSales();
    fetchLeadgers();
    fetchProducts();
  }, [search, dateFilter]);

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    if (dateFilter !== 'monthwise') {
      setSelectedMonthKey('');
    }
  }, [dateFilter]);

  const getFromDateByFilter = () => {
    const now = new Date();
    if (dateFilter === '7d') {
      now.setDate(now.getDate() - 7);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '30d') {
      now.setDate(now.getDate() - 30);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '3m') {
      now.setMonth(now.getMonth() - 3);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '6m') {
      now.setMonth(now.getMonth() - 6);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '1y') {
      now.setFullYear(now.getFullYear() - 1);
      return now.toISOString().split('T')[0];
    }
    return '';
  };

  const getMonthKey = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/sales', {
        params: {
          search,
          fromDate: fromDate || undefined
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

  const fetchReceipts = async () => {
    try {
      const response = await apiClient.get('/receipts');
      setAllReceipts(response.data || []);
    } catch (err) {
      console.error('Error fetching receipts:', err);
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

  const filteredLeadgers = useMemo(() => getMatchingLeadgers(leadgerQuery), [leadgers, leadgerQuery]);

  useEffect(() => {
    if (!showForm) return;

    if (filteredLeadgers.length === 0) {
      setLeadgerListIndex(-1);
      return;
    }

    setLeadgerListIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredLeadgers.length) return filteredLeadgers.length - 1;
      return prev;
    });
  }, [showForm, filteredLeadgers]);

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

  const handleLeadgerInputKeyDown = (e) => {
    const key = e.key?.toLowerCase();
    const isMoveDownKey = key === 'arrowdown';
    const isMoveUpKey = key === 'arrowup';

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

  const handleAddItem = () => {
    if (!currentItem.product || !currentItem.quantity || !currentItem.unitPrice) {
      setError('Product, quantity and price are required');
      return;
    }

    const product = products.find(p => p._id === currentItem.product);
    if (!product || product.currentStock < currentItem.quantity) {
      setError(`Insufficient stock for ${product?.name}`);
      return;
    }

    const taxAmount = 0;
    const total = currentItem.unitPrice * currentItem.quantity;

    const newItem = {
      ...currentItem,
      productName: product?.name,
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

    calculateTotals([...formData.items, newItem]);
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

    const total = subtotal + totalTax - (formData.discountAmount || 0);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party) {
      setError('Party name is required');
      return;
    }
    const parsedSaleDate = parseManualDate(formData.saleDate);
    if (!parsedSaleDate) {
      setError('Invoice date must be in dd-mm-yyyy format');
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
      fetchReceipts();
      setFormData(getInitialFormData());
      setCurrentItem(initialCurrentItem);
      setEditingId(null);
      setLeadgerQuery('');
      setLeadgerListIndex(-1);
      setIsLeadgerSectionActive(false);
      setShowForm(false);
      setError('');
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
    setEditingId(sale._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await apiClient.delete(`/sales/${id}`);
        toast.success('Sale deleted successfully', toastOptions);
        fetchSales();
        fetchReceipts();
      } catch (err) {
        setError(err.message || 'Error deleting sale');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(getInitialFormData());
    setCurrentItem(initialCurrentItem);
    setLeadgerQuery('');
    setLeadgerListIndex(-1);
    setIsLeadgerSectionActive(false);
  };

  const handleOpenForm = () => {
    setEditingId(null);
    setFormData(getInitialFormData());
    setCurrentItem(initialCurrentItem);
    setLeadgerQuery('');
    setLeadgerListIndex(0);
    setIsLeadgerSectionActive(false);
    setShowForm(true);
  };

  const resolveLeadgerNameById = (leadgerId) => {
    const resolvedId = typeof leadgerId === 'object' ? leadgerId?._id : leadgerId;
    if (!resolvedId) return '';
    const matching = leadgers.find((leadger) => String(leadger._id) === String(resolvedId));
    return matching ? getLeadgerDisplayName(matching) : '';
  };

  const saleReceiptMap = useMemo(() => buildSaleReceiptMap(allReceipts), [allReceipts]);

  const monthWiseSummary = useMemo(() => {
    const grouped = new Map();

    sales.forEach((sale) => {
      const monthKey = getMonthKey(sale.saleDate);
      if (!monthKey) return;

      if (!grouped.has(monthKey)) {
        const monthDate = new Date(sale.saleDate);
        grouped.set(monthKey, {
          key: monthKey,
          label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          saleCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0
        });
      }

      const bucket = grouped.get(monthKey);
      const total = Number(sale.totalAmount || 0);
      const { paid, due } = getSalePaymentStats(sale, saleReceiptMap);

      bucket.saleCount += 1;
      bucket.totalAmount += total;
      bucket.paidAmount += paid;
      bucket.dueAmount += due;
    });

    return Array.from(grouped.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [sales, saleReceiptMap]);

  const visibleSales = useMemo(() => {
    if (dateFilter !== 'monthwise' || !selectedMonthKey) return sales;
    return sales.filter((sale) => getMonthKey(sale.saleDate) === selectedMonthKey);
  }, [sales, dateFilter, selectedMonthKey]);

  const totalSales = visibleSales.length;
  const totalAmount = visibleSales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const totalDue = visibleSales.reduce(
    (sum, sale) => sum + getSalePaymentStats(sale, saleReceiptMap).due,
    0
  );
  const popupFieldClass = 'w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';
  const popupLabelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600';
  const popupSectionClass = 'rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4';

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-16 md:px-8 md:pb-8 md:pt-5">

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
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
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
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
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Due</p>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-2xl font-bold text-slate-800 leading-tight">
                <span className="text-[10px] sm:text-base text-slate-400 font-medium mr-1">Rs</span>
                {totalDue.toFixed(2)}
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-rose-500 to-orange-400 opacity-80"></div>
        </div>
      </div>

      <AddSalePopup
        showForm={showForm}
        editingId={editingId}
        loading={loading}
        formData={formData}
        currentItem={currentItem}
        products={products}
        popupFieldClass={popupFieldClass}
        popupLabelClass={popupLabelClass}
        popupSectionClass={popupSectionClass}
        leadgerSectionRef={leadgerSectionRef}
        leadgerQuery={leadgerQuery}
        leadgerListIndex={leadgerListIndex}
        filteredLeadgers={filteredLeadgers}
        isLeadgerSectionActive={isLeadgerSectionActive}
        setCurrentItem={setCurrentItem}
        setIsLeadgerSectionActive={setIsLeadgerSectionActive}
        setLeadgerListIndex={setLeadgerListIndex}
        getLeadgerDisplayName={getLeadgerDisplayName}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        handleLeadgerInputChange={handleLeadgerInputChange}
        handleLeadgerInputKeyDown={handleLeadgerInputKeyDown}
        handleSelectEnterMoveNext={handleSelectEnterMoveNext}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        selectLeadger={selectLeadger}
      />
      {/* Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search sales..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-56 bg-white px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">Sale History - All Time</option>
          <option value="7d">Sale History - 7 Days</option>
          <option value="30d">Sale History - 30 Days</option>
          <option value="3m">Sale History - 3 Months</option>
          <option value="6m">Sale History - 6 Months</option>
          <option value="1y">Sale History - 1 Year</option>
          <option value="monthwise">Sale History - Month Wise</option>
        </select>
        <button
          onClick={handleOpenForm}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-900 transition shadow-sm whitespace-nowrap"
        >
          + New Sale
        </button>
      </div>

      {dateFilter === 'monthwise' && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedMonthKey('')}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                !selectedMonthKey
                  ? 'border-slate-700 bg-slate-800 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Months
            </button>
            {monthWiseSummary.map((month) => (
              <button
                key={month.key}
                type="button"
                onClick={() => setSelectedMonthKey(month.key)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedMonthKey === month.key
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {month.label}
              </button>
            ))}
          </div>

          {monthWiseSummary.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No monthly sale history available for the current search.
            </div>
          ) : (
            <div className="darkish-table-shell overflow-x-auto rounded-lg">
              <table className="darkish-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Month</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Invoices</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Total Sale</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Received</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {monthWiseSummary.map((month) => (
                    <tr
                      key={month.key}
                      onClick={() => setSelectedMonthKey(month.key)}
                      className={`cursor-pointer transition-colors ${
                        selectedMonthKey === month.key ? 'bg-blue-100/80' : 'hover:bg-slate-700/[0.06]'
                      }`}
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-800">{month.label}</td>
                      <td className="px-4 py-2.5 text-slate-700">{month.saleCount}</td>
                      <td className="px-4 py-2.5 font-semibold text-emerald-700">
                        Rs {month.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        Rs {month.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-rose-700">
                        Rs {month.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sales List */}
      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : visibleSales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          {dateFilter === 'monthwise' && selectedMonthKey
            ? 'No sales found for selected month.'
            : 'No sales found. Create your first sale!'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Party Name</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Products</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Due</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSales.map((sale) => {
                  const { paid, due, status } = getSalePaymentStats(sale, saleReceiptMap);

                  return (
                  <tr key={sale._id} className="bg-white hover:bg-slate-50 transition-colors duration-200 group">
                    <td className="px-6 py-4 font-semibold text-slate-800">{sale.invoiceNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{resolveLeadgerNameById(sale.party) || sale.customerName || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">
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
                    <td className="px-6 py-4 text-slate-600">{new Date(sale.saleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      Rs {Number(sale.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      Rs {paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-600">
                      Rs {due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6 space-x-2">
                      <button
                        onClick={() => handleEdit(sale)}
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sale._id)}
                        className="inline-flex items-center justify-center text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs"
                      >
                        Delete
                      </button>
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
  );
}

