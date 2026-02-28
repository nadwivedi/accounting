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
    unitPrice: '',
    taxRate: 0,
    discount: 0
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
      const response = await apiClient.get('/leadgers');
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

  const handleLeadgerInputKeyDown = (e) => {
    const key = e.key?.toLowerCase();
    const isMoveDownKey = key === 'control';
    const isMoveUpKey = key === 'shift' && !e.ctrlKey;

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

    const taxAmount = (currentItem.unitPrice * currentItem.quantity * currentItem.taxRate) / 100;
    const discountAmount = currentItem.discount || 0;
    const total = (currentItem.unitPrice * currentItem.quantity) + taxAmount - discountAmount;

    const newItem = {
      ...currentItem,
      productName: product?.name,
      quantity: parseFloat(currentItem.quantity),
      unitPrice: parseFloat(currentItem.unitPrice),
      taxAmount,
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

  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const totalDue = sales.reduce(
    (sum, sale) => sum + (Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0)),
    0
  );
  const popupFieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2 text-slate-800 shadow-sm transition focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100';
  const popupLabelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500';
  const popupSectionClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.55)]';

  return (
    <div className="p-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-5 bg-slate-50 min-h-screen">

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-2 sm:p-3 backdrop-blur-[2px]" onClick={handleCancel}>
          <div className="h-[95vh] w-[95vw] sm:w-[88vw] lg:w-[40%] overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-[0_35px_80px_-35px_rgba(2,6,23,0.65)]" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                  {editingId ? 'Edit Sale' : 'Create New Sale'}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-300">Party details, item entry, and quick totals</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="h-9 w-9 rounded-full border border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-300 transition"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="flex h-[calc(95vh-82px)] flex-col">
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-cyan-50/40">
                <div className="space-y-4 p-4 sm:p-5">
                  <div className={popupSectionClass}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
                          Party
                        </span>
                        <h3 className="mt-2 text-base font-semibold text-slate-800">Customer Information</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Select party name and fill billing details.</p>
                      </div>
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
                            <div className="mt-2 w-full z-30 lg:fixed lg:right-4 lg:top-20 lg:bottom-6 lg:mt-0 lg:w-80">
                              <div className="overflow-hidden rounded-xl border border-cyan-200 bg-gradient-to-b from-cyan-50 via-sky-50 to-white shadow-xl lg:h-full lg:flex lg:flex-col">
                                <div className="border-b border-cyan-300 bg-gradient-to-r from-cyan-700 to-sky-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                                  Party List
                                </div>
                                <div className="max-h-60 overflow-y-auto bg-white/90 lg:max-h-none lg:flex-1">
                                  <button
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => selectLeadger(null)}
                                    className={`w-full border-b border-slate-100 px-3 py-2 text-left text-sm transition-colors ${
                                      !formData.party
                                        ? 'bg-emerald-100 text-emerald-800 font-medium'
                                        : 'text-slate-700 hover:bg-blue-50'
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
                                          onClick={() => selectLeadger(leadger)}
                                          className={`w-full border-b border-slate-100 last:border-b-0 px-3 py-2 text-left text-sm transition-colors ${
                                            isActive
                                              ? 'bg-blue-100 text-blue-800 font-semibold'
                                              : isSelected
                                                ? 'bg-emerald-100 text-emerald-800 font-medium'
                                                : 'text-slate-700 hover:bg-blue-50'
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

                  <div className={popupSectionClass}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                          Billing
                        </span>
                        <h3 className="mt-2 text-base font-semibold text-slate-800">Add Items</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Add products one by one and build the sale bill.</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                        {formData.items.length} item(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <select
                        value={currentItem.product}
                        onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                        className={`col-span-2 ${popupFieldClass}`}
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
                      <input
                        type="number"
                        placeholder="Tax %"
                        value={currentItem.taxRate}
                        onChange={(e) => setCurrentItem({ ...currentItem, taxRate: e.target.value })}
                        className={popupFieldClass}
                      />
                      <input
                        type="number"
                        placeholder="Discount"
                        value={currentItem.discount}
                        onChange={(e) => setCurrentItem({ ...currentItem, discount: e.target.value })}
                        className={popupFieldClass}
                      />
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="col-span-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                      >
                        Add Item
                      </button>
                    </div>

                    {formData.items.length > 0 && (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-xs sm:text-sm">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Product</th>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Qty</th>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Price</th>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Tax</th>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Discount</th>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Total</th>
                              <th className="px-2 py-2 text-left font-semibold sm:px-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {formData.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-2 py-2 font-medium text-slate-700 sm:px-3">{item.productName}</td>
                                <td className="px-2 py-2 text-slate-600 sm:px-3">{item.quantity}</td>
                                <td className="px-2 py-2 text-slate-600 sm:px-3">Rs {Number(item.unitPrice || 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-slate-600 sm:px-3">Rs {Number(item.taxAmount || 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-slate-600 sm:px-3">Rs {Number(item.discount || 0).toFixed(2)}</td>
                                <td className="px-2 py-2 font-semibold text-slate-800 sm:px-3">Rs {Number(item.total || 0).toFixed(2)}</td>
                                <td className="px-2 py-2 sm:px-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
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

                <div className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)]">
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">Bill Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Subtotal</p>
                        <p className="font-semibold text-slate-800">Rs {formData.subtotal.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Tax</p>
                        <p className="font-semibold text-slate-800">Rs {formData.taxAmount.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                        <p className="text-blue-600">Total</p>
                        <p className="font-bold text-blue-700">Rs {formData.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
                        <p className="text-rose-600">Due</p>
                        <p className="font-bold text-rose-700">Rs {(formData.totalAmount - formData.paidAmount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.55)]">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100 transition"
                      placeholder="Notes"
                      rows="1"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white/95 p-3 sm:p-4">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-xl border border-slate-300 bg-slate-100 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:from-sky-700 hover:to-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Sale'}
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
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-56 bg-white px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Sale History - All Time</option>
          <option value="7d">Sale History - 7 Days</option>
          <option value="30d">Sale History - 30 Days</option>
          <option value="3m">Sale History - 3 Months</option>
          <option value="6m">Sale History - 6 Months</option>
          <option value="1y">Sale History - 1 Year</option>
        </select>
        <button
          onClick={handleOpenForm}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
        >
          + New Sale
        </button>
      </div>

      {/* Sales List */}
      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          No sales found. Create your first sale!
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
                {sales.map((sale) => (
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
