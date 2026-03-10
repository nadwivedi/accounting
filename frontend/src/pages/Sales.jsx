import { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingCart, IndianRupee, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

export default function Sales() {
  const toastOptions = { autoClose: 1200 };

  const initialFormData = {
    party: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [],
    saleDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    roundOff: 0,
    totalAmount: 0,
    paidAmount: 0,
    paymentMode: 'cash',
    notes: ''
  };
  const initialCurrentItem = {
    product: '',
    productName: '',
    quantity: '',
    unitPrice: ''
  };

  const [sales, setSales] = useState([]);
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
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      setError('At least one item is required');
      return;
    }

    try {
      setLoading(true);
      const isEditMode = Boolean(editingId);
      const submitData = {
        ...formData,
        saleDate: new Date(formData.saleDate),
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
      setFormData(initialFormData);
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
      ...initialFormData,
      ...sale,
      party: normalizedPartyId,
      customerName: resolvedLeadgerName,
      customerPhone: String(sale.customerPhone || '').replace(/\D/g, '').slice(0, 10),
      customerAddress: sale.customerAddress || ''
    });
    setLeadgerQuery(resolvedLeadgerName);
    setLeadgerListIndex(resolvedLeadgerName ? 0 : -1);
    setIsLeadgerSectionActive(true);
    setEditingId(sale._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await apiClient.delete(`/sales/${id}`);
        toast.success('Sale deleted successfully', toastOptions);
        fetchSales();
      } catch (err) {
        setError(err.message || 'Error deleting sale');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setCurrentItem(initialCurrentItem);
    setLeadgerQuery('');
    setLeadgerListIndex(-1);
    setIsLeadgerSectionActive(false);
  };

  const handleOpenForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setCurrentItem(initialCurrentItem);
    setLeadgerQuery('');
    setLeadgerListIndex(0);
    setIsLeadgerSectionActive(true);
    setShowForm(true);
  };

  const resolveLeadgerNameById = (leadgerId) => {
    const resolvedId = typeof leadgerId === 'object' ? leadgerId?._id : leadgerId;
    if (!resolvedId) return '';
    const matching = leadgers.find((leadger) => String(leadger._id) === String(resolvedId));
    return matching ? getLeadgerDisplayName(matching) : '';
  };

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
      const paid = Number(sale.paidAmount || 0);
      const due = total - paid;

      bucket.saleCount += 1;
      bucket.totalAmount += total;
      bucket.paidAmount += paid;
      bucket.dueAmount += due;
    });

    return Array.from(grouped.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [sales]);

  const visibleSales = useMemo(() => {
    if (dateFilter !== 'monthwise' || !selectedMonthKey) return sales;
    return sales.filter((sale) => getMonthKey(sale.saleDate) === selectedMonthKey);
  }, [sales, dateFilter, selectedMonthKey]);

  const totalSales = visibleSales.length;
  const totalAmount = visibleSales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const totalDue = visibleSales.reduce(
    (sum, sale) => sum + (Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0)),
    0
  );
  const popupFieldClass = 'w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';
  const popupLabelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600';
  const popupSectionClass = 'rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 md:p-4';

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-16 md:ml-[13.25rem] md:px-8 md:pb-8 md:pt-5">

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

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[1.5px] z-50 flex items-stretch justify-start p-1.5 sm:p-2" onClick={handleCancel}>
          <div className="bg-white h-full w-full md:w-[75vw] overflow-hidden flex flex-col shadow-2xl ring-1 ring-slate-200/80 rounded-xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-2 md:px-4 md:py-2.5 text-white flex-shrink-0 border-b border-white/15">
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-md bg-white/20 ring-1 ring-white/30 flex items-center justify-center text-white">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold">
                      {editingId ? 'Edit Sale Voucher' : 'Add New Sale Voucher'}
                    </h2>
                    <p className="text-cyan-100 text-xs md:text-sm mt-1">Create or update sale entries in a clean accounting format.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-white hover:bg-white/25 rounded-lg p-1.5 md:p-2 transition"
                  aria-label="Close popup"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form id="sales-form" onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-2.5 md:p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.15fr)] gap-2.5 md:gap-4 items-stretch">
                <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-205px)] bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-2.5 md:p-4 space-y-4">
                  <div className={popupSectionClass}>
                    <div className="mb-4 border-b border-indigo-200 pb-2">
                      <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">1</span>
                        Voucher Details
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">Select party and voucher dates.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className={popupLabelClass}>Party Name</label>
                        <div
                          ref={leadgerSectionRef}
                          className="relative"
                          onFocusCapture={() => setIsLeadgerSectionActive(true)}
                          onBlurCapture={(event) => {
                            const nextFocused = event.relatedTarget;
                            if (
                              leadgerSectionRef.current
                              && nextFocused instanceof Node
                              && leadgerSectionRef.current.contains(nextFocused)
                            ) {
                              return;
                            }
                            setIsLeadgerSectionActive(false);
                          }}
                        >
                          <input
                            type="text"
                            value={leadgerQuery}
                            onChange={handleLeadgerInputChange}
                            onKeyDown={handleLeadgerInputKeyDown}
                            autoFocus
                            className={popupFieldClass}
                            placeholder="Select party name only"
                          />

                          {isLeadgerSectionActive && (
                            <div className="mt-2 md:mt-0 md:fixed md:right-4 md:top-20 md:bottom-6 w-full md:w-80 z-30">
                              <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50 via-sky-50 to-white shadow-xl overflow-hidden md:h-full md:flex md:flex-col">
                                <div className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-white border-b border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-600">
                                  Party List
                                </div>
                                <div className="max-h-60 md:max-h-none md:flex-1 overflow-y-auto bg-white/80">
                                  <button
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => selectLeadger(null)}
                                    className={`w-full border-b border-slate-100 px-3 py-2 text-left text-sm transition-colors ${
                                      !formData.party
                                        ? 'bg-yellow-300 text-black font-semibold'
                                        : 'bg-transparent text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    Walk-in / No Party
                                  </button>
                                  {filteredLeadgers.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-slate-500">No matching parties</div>
                                  ) : (
                                    filteredLeadgers.map((leadger, index) => {
                                      const isActive = index === leadgerListIndex;
                                      const isSelected = String(formData.party || '') === String(leadger._id);
                                      return (
                                        <button
                                          key={leadger._id}
                                          type="button"
                                          onMouseDown={(event) => event.preventDefault()}
                                          onMouseEnter={() => setLeadgerListIndex(index)}
                                          onClick={() => selectLeadger(leadger)}
                                          className={`w-full border-b border-slate-100 last:border-b-0 px-3 py-2 text-left text-sm transition-colors ${
                                            isActive || isSelected
                                              ? 'bg-yellow-300 text-black font-semibold'
                                              : 'bg-transparent text-slate-700 hover:bg-slate-50'
                                          }`}
                                        >
                                          {getLeadgerDisplayName(leadger)}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className={popupLabelClass}>Sale Date</label>
                        <input
                          type="date"
                          name="saleDate"
                          value={formData.saleDate}
                          onChange={handleInputChange}
                          className={popupFieldClass}
                        />
                      </div>

                      <div>
                        <label className={popupLabelClass}>Due Date</label>
                        <input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          className={popupFieldClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-white/75 p-3 md:p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm md:text-base font-bold text-slate-800">Item Entry</h3>
                        <p className="mt-1 text-xs text-slate-500">Add stock items with product, quantity and rate.</p>
                      </div>
                      <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {formData.items.length} item(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 mb-4 items-end">
                      <select
                        value={currentItem.product}
                        onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                        onKeyDown={handleSelectEnterMoveNext}
                        className={popupFieldClass}
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                        className={popupFieldClass}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={currentItem.unitPrice}
                        onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                        className={popupFieldClass}
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition whitespace-nowrap"
                      >
                        Add Item
                      </button>
                    </div>

                    {formData.items.length > 0 && (
                      <div className="overflow-hidden rounded-lg border border-indigo-200">
                        <table className="w-full text-xs">
                          <thead className="bg-indigo-100 text-slate-700">
                            <tr>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Product</th>
                              <th className="px-2 py-2 text-right font-semibold sm:px-3">Qty</th>
                              <th className="px-2 py-2 text-right font-semibold sm:px-3">Rate</th>
                              <th className="px-2 py-2 text-right font-semibold sm:px-3">Amount</th>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {formData.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-2 py-2 font-medium text-slate-700 sm:px-3">{item.productName}</td>
                                <td className="px-2 py-2 text-right font-mono text-slate-600 sm:px-3">{item.quantity}</td>
                                <td className="px-2 py-2 text-right font-mono text-slate-600 sm:px-3">{Number(item.unitPrice || 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-right font-mono font-semibold text-slate-800 sm:px-3">{Number(item.total || 0).toFixed(2)}</td>
                                <td className="px-2 py-2 sm:px-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>

                <div className="hidden lg:block h-full w-px bg-slate-300" aria-hidden="true"></div>

                <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-205px)] bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-2.5 md:p-4 space-y-3">
                  <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">2</span>
                    Payment & Summary
                  </h3>

                  <div className="rounded-xl border border-emerald-200 bg-white/75 p-3 md:p-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Paid Amount</label>
                      <input
                        type="number"
                        name="paidAmount"
                        value={formData.paidAmount}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        placeholder="Enter paid amount"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Payment Mode</label>
                      <select
                        name="paymentMode"
                        value={formData.paymentMode}
                        onChange={handleInputChange}
                        onKeyDown={handleSelectEnterMoveNext}
                        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                    <h4 className="mb-3 border-b border-emerald-100 pb-2 text-sm font-bold uppercase tracking-wide text-slate-800">Voucher Totals</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-mono font-semibold text-slate-800">Rs {formData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-100 px-3 py-2">
                        <span className="font-semibold text-slate-700">Total Amount</span>
                        <span className="font-mono font-bold text-slate-900">Rs {formData.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-100 px-3 py-2">
                        <span className="font-semibold text-slate-700">Balance Due</span>
                        <span className="font-mono font-bold text-slate-900">Rs {(formData.totalAmount - formData.paidAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                      placeholder="Optional notes"
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-3 py-2.5 md:px-4 md:py-3 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0">
                <div className="text-xs md:text-sm text-gray-600">
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Esc</kbd> to close
                </div>

                <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="sales-form"
                    disabled={loading}
                    className="flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editingId ? 'Update Sale' : 'Save Sale'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
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
                {visibleSales.map((sale) => (
                  <tr key={sale._id} className="bg-white hover:bg-slate-50 transition-colors duration-200 group">
                    <td className="px-6 py-4 font-semibold text-slate-800">{sale.invoiceNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{resolveLeadgerNameById(sale.party) || sale.customerName || 'Walk-in'}</td>
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
                      Rs {Number(sale.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-600">
                      Rs {Number((sale.totalAmount || 0) - (sale.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sale.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : sale.paymentStatus === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.paymentStatus}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

