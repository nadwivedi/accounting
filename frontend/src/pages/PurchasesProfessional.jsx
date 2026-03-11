import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  IndianRupee,
  Package2,
  Plus,
  ShoppingCart,
  Upload,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

const TOAST_OPTIONS = { autoClose: 1200 };
const FIELD_CLASS = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100';
const LABEL_CLASS = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600';
const SECTION_CLASS = 'rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' }
];

const getToday = () => new Date().toISOString().split('T')[0];
const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const getErrorMessage = (error, fallback) => (typeof error === 'string' ? error : error?.message || fallback);
const getInvoiceLabel = (invoiceLink) => decodeURIComponent(String(invoiceLink || '').split('/').pop()?.split('?')[0] || '');
const createInitialFormData = () => ({
  party: '',
  invoiceNo: '',
  items: [],
  purchaseDate: getToday(),
  dueDate: '',
  totalAmount: 0,
  invoiceLink: '',
  notes: '',
  paymentAmount: '',
  paymentMethod: 'cash',
  paymentDate: getToday(),
  paymentNotes: '',
  isBillWisePayment: false
});
const createInitialCurrentItem = () => ({
  product: '',
  productName: '',
  quantity: '',
  unitPrice: ''
});

export default function PurchasesProfessional() {
  const [purchases, setPurchases] = useState([]);
  const [leadgers, setLeadgers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [formData, setFormData] = useState(createInitialFormData);
  const [currentItem, setCurrentItem] = useState(createInitialCurrentItem);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [invoiceFileLabel, setInvoiceFileLabel] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, [search, dateFilter]);

  useEffect(() => {
    fetchLeadgers();
    fetchProducts();
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product._id) === String(currentItem.product)),
    [products, currentItem.product]
  );
  const currentItemTotal = useMemo(() => {
    const quantity = Number(currentItem.quantity || 0);
    const unitPrice = Number(currentItem.unitPrice || 0);
    return quantity > 0 && unitPrice >= 0 ? quantity * unitPrice : 0;
  }, [currentItem.quantity, currentItem.unitPrice]);
  const paymentAmount = useMemo(
    () => Math.max(0, Number(formData.paymentAmount || 0)),
    [formData.paymentAmount]
  );
  const balanceAmount = useMemo(
    () => Math.max(0, Number(formData.totalAmount || 0) - paymentAmount),
    [formData.totalAmount, paymentAmount]
  );
  const invoiceLabel = invoiceFileLabel || getInvoiceLabel(formData.invoiceLink) || 'Attached invoice';

  const getFromDateByFilter = () => {
    const now = new Date();
    if (dateFilter === '7d') now.setDate(now.getDate() - 7);
    else if (dateFilter === '30d') now.setDate(now.getDate() - 30);
    else if (dateFilter === '3m') now.setMonth(now.getMonth() - 3);
    else if (dateFilter === '6m') now.setMonth(now.getMonth() - 6);
    else if (dateFilter === '1y') now.setFullYear(now.getFullYear() - 1);
    else return '';
    return now.toISOString().split('T')[0];
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/purchases', {
        params: { search, fromDate: fromDate || undefined }
      });
      setPurchases(response.data || []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Error fetching purchases'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadgers = async () => {
    try {
      const response = await apiClient.get('/parties');
      setLeadgers(response.data || []);
    } catch (err) {
      console.error('Error fetching leadgers:', err);
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

  const getLeadgerDisplayName = (leadger) => String(leadger?.name || '').trim() || 'Party Name';
  const resolveLeadgerNameById = (leadgerId) => {
    const resolvedId = typeof leadgerId === 'object' ? leadgerId?._id : leadgerId;
    if (!resolvedId) return '-';
    const matching = leadgers.find((leadger) => String(leadger._id) === String(resolvedId));
    return matching ? getLeadgerDisplayName(matching) : '-';
  };

  const resetFormState = () => {
    setFormData(createInitialFormData());
    setCurrentItem(createInitialCurrentItem());
    setInvoiceFileLabel('');
  };

  const calculateTotals = (items) => {
    const totalAmount = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    setFormData((prev) => ({ ...prev, totalAmount }));
  };

  const handleItemProductChange = (productId) => {
    const selected = products.find((product) => String(product._id) === String(productId));
    setCurrentItem((prev) => ({
      ...prev,
      product: productId,
      productName: selected?.name || '',
      quantity: prev.quantity || (selected ? '1' : ''),
      unitPrice: selected ? String(selected.purchasePrice ?? '') : ''
    }));
  };

  const handleAddItem = () => {
    if (!currentItem.product || !currentItem.quantity || currentItem.unitPrice === '') {
      setError('Product, quantity and rate are required');
      return;
    }

    const quantity = Number(currentItem.quantity);
    const unitPrice = Number(currentItem.unitPrice);
    if (quantity <= 0 || unitPrice < 0) {
      setError('Quantity must be greater than 0 and rate cannot be negative');
      return;
    }

    const product = products.find((item) => String(item._id) === String(currentItem.product));
    if (!product) {
      setError('Select a valid product');
      return;
    }

    const newItem = {
      product: product._id,
      productName: product.name || currentItem.productName || 'Item',
      quantity,
      unitPrice,
      total: quantity * unitPrice
    };

    const updatedItems = [...formData.items, newItem];
    setFormData((prev) => ({ ...prev, items: updatedItems }));
    setCurrentItem(createInitialCurrentItem());
    calculateTotals(updatedItems);
    setError('');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, itemIndex) => itemIndex !== index);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleOpenForm = () => {
    setEditingId(null);
    resetFormState();
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    resetFormState();
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.party || formData.items.length === 0) {
      setError('Supplier ledger and at least one item are required');
      return;
    }

    if (paymentAmount > Number(formData.totalAmount || 0)) {
      setError('Entry payment amount cannot exceed total purchase amount');
      return;
    }

    try {
      setSaving(true);
      const isEditMode = Boolean(editingId);
      const payload = {
        ...formData,
        invoiceNo: String(formData.invoiceNo || '').trim(),
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        totalAmount: Number(formData.totalAmount || 0),
        notes: String(formData.notes || '').trim(),
        paymentAmount: isEditMode ? 0 : paymentAmount,
        paymentMethod: formData.paymentMethod || 'cash',
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : new Date(),
        paymentNotes: String(formData.paymentNotes || '').trim(),
        isBillWisePayment: Boolean(formData.isBillWisePayment)
      };

      if (editingId) await apiClient.put(`/purchases/${editingId}`, payload);
      else await apiClient.post('/purchases', payload);

      toast.success(
        isEditMode ? 'Purchase updated successfully' : 'Purchase added successfully',
        TOAST_OPTIONS
      );

      setShowForm(false);
      setEditingId(null);
      resetFormState();
      setError('');
      fetchPurchases();
    } catch (err) {
      setError(getErrorMessage(err, 'Error saving purchase'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (purchase) => {
    const normalizedItems = (purchase.items || []).map((item) => ({
      ...item,
      product: item.product?._id || item.product,
      productName: item.productName || item.product?.name || 'Item',
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      total: Number(item.total || (Number(item.quantity || 0) * Number(item.unitPrice || 0)))
    }));

    setFormData({
      party: purchase.party?._id || purchase.party || '',
      invoiceNo: purchase.invoiceNo || purchase.invoiceNumber || '',
      items: normalizedItems,
      purchaseDate: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : getToday(),
      dueDate: purchase.dueDate ? new Date(purchase.dueDate).toISOString().split('T')[0] : '',
      totalAmount: Number(purchase.totalAmount || 0),
      invoiceLink: purchase.invoiceLink || '',
      notes: purchase.notes || '',
      paymentAmount: '',
      paymentMethod: 'cash',
      paymentDate: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : getToday(),
      paymentNotes: '',
      isBillWisePayment: false
    });
    setCurrentItem(createInitialCurrentItem());
    setInvoiceFileLabel('');
    setEditingId(purchase._id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) return;
    try {
      await apiClient.delete(`/purchases/${id}`);
      toast.success('Purchase deleted successfully', TOAST_OPTIONS);
      fetchPurchases();
    } catch (err) {
      setError(getErrorMessage(err, 'Error deleting purchase'));
    }
  };

  const handleInvoiceUpload = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setUploadingInvoice(true);
      const body = new FormData();
      body.append('invoice', file);
      const response = await apiClient.post('/uploads/invoice', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData((prev) => ({
        ...prev,
        invoiceLink: response.data?.url || response.data?.relativePath || ''
      }));
      setInvoiceFileLabel(file.name);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Error uploading invoice'));
    } finally {
      setUploadingInvoice(false);
      input.value = '';
    }
  };

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-16 md:px-8 md:pb-8 md:pt-5">
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4">
        <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 sm:text-xs">Total Purchases</p>
              <p className="mt-1 text-base font-bold text-slate-800 sm:mt-2 sm:text-2xl">{totalPurchases}</p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 sm:flex">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 sm:h-1"></div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 sm:text-xs">Total Amount</p>
              <p className="mt-1 text-[11px] font-bold text-slate-800 sm:mt-2 sm:text-2xl">
                <span className="mr-1 text-[10px] font-medium text-slate-400 sm:text-base">Rs</span>
                {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 sm:flex">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 sm:h-1"></div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-4" onClick={handleCancel}>
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center">
            <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[#fcfbf7] shadow-[0_30px_80px_rgba(15,23,42,0.22)]" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-slate-200 bg-white/90 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">Purchase Voucher</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">{editingId ? 'Edit Purchase Entry' : 'Add Purchase Entry'}</h2>
                    <p className="mt-1 text-sm text-slate-500">Structured voucher popup for supplier bills, line items, and immediate payment posting.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{formData.items.length} items</span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Rs {formatCurrency(formData.totalAmount)}</span>
                    <button type="button" onClick={handleCancel} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700" aria-label="Close purchase popup">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="flex min-h-0 flex-1 flex-col">
                <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_360px]">
                  <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-6">
                    <section className={`${SECTION_CLASS} bg-gradient-to-br from-amber-50 via-white to-orange-50`}>
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Building2 className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Voucher Details</h3>
                          <p className="text-sm text-slate-500">Select supplier, purchase date, due date, and bill number.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="lg:col-span-2">
                          <label className={LABEL_CLASS}>Supplier Ledger *</label>
                          <select name="party" value={formData.party} onChange={handleInputChange} className={FIELD_CLASS} required>
                            <option value="">Select supplier ledger</option>
                            {leadgers.map((leadger) => (
                              <option key={leadger._id} value={leadger._id}>{getLeadgerDisplayName(leadger)}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={LABEL_CLASS}>Purchase Date</label>
                          <div className="relative">
                            <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} className={`${FIELD_CLASS} pr-10`} />
                            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        <div>
                          <label className={LABEL_CLASS}>Due Date</label>
                          <div className="relative">
                            <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className={`${FIELD_CLASS} pr-10`} />
                            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                          <label className={LABEL_CLASS}>Supplier Invoice No.</label>
                          <div className="relative">
                            <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleInputChange} className={`${FIELD_CLASS} pr-10`} placeholder="Bill no. / invoice reference" />
                            <FileText className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className={SECTION_CLASS}>
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Package2 className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Item Entry</h3>
                          <p className="text-sm text-slate-500">Add product lines with quantity and buying rate.</p>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2.2fr)_110px_150px_170px_auto]">
                          <div>
                            <label className={LABEL_CLASS}>Product</label>
                            <select value={currentItem.product} onChange={(e) => handleItemProductChange(e.target.value)} className={FIELD_CLASS}>
                              <option value="">Select product</option>
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>{product.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={LABEL_CLASS}>Quantity</label>
                            <input type="number" value={currentItem.quantity} onChange={(e) => setCurrentItem((prev) => ({ ...prev, quantity: e.target.value }))} className={FIELD_CLASS} min="0" step="0.01" placeholder="0" />
                          </div>

                          <div>
                            <label className={LABEL_CLASS}>Rate</label>
                            <input type="number" value={currentItem.unitPrice} onChange={(e) => setCurrentItem((prev) => ({ ...prev, unitPrice: e.target.value }))} className={FIELD_CLASS} min="0" step="0.01" placeholder="0.00" />
                          </div>

                          <div>
                            <label className={LABEL_CLASS}>Line Amount</label>
                            <div className="flex h-[46px] items-center rounded-xl border border-slate-200 bg-white px-3.5 text-base font-semibold text-slate-900 shadow-sm">Rs {formatCurrency(currentItemTotal)}</div>
                          </div>

                          <div className="flex items-end">
                            <button type="button" onClick={handleAddItem} disabled={!currentItem.product || !currentItem.quantity || currentItem.unitPrice === ''} className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                              <Plus className="h-4 w-4" />
                              Add
                            </button>
                          </div>
                        </div>

                        {selectedProduct && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Stock on hand: {Number(selectedProduct.currentStock || 0)}</span>
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Default rate: Rs {formatCurrency(selectedProduct.purchasePrice || 0)}</span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">Unit: {selectedProduct.unit || 'pcs'}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200">
                        {formData.items.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-sm">
                              <thead className="bg-slate-900 text-left text-white">
                                <tr>
                                  <th className="px-4 py-3 font-semibold uppercase tracking-wide">Product</th>
                                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide">Qty</th>
                                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide">Rate</th>
                                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide">Amount</th>
                                  <th className="px-4 py-3 font-semibold uppercase tracking-wide">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {formData.items.map((item, index) => (
                                  <tr key={`${item.product}-${index}`} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-800">{item.productName}</td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                                    <td className="px-4 py-3">
                                      <button type="button" onClick={() => handleRemoveItem(index)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">Remove</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="px-6 py-10 text-center text-sm text-slate-500">No item lines yet. Add products to build the purchase voucher.</div>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Item Lines</p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">{formData.items.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Entry Payment</p>
                          <p className="mt-1 text-2xl font-bold text-emerald-700">Rs {formatCurrency(paymentAmount)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Voucher Total</p>
                          <p className="mt-1 text-2xl font-bold">Rs {formatCurrency(formData.totalAmount)}</p>
                        </div>
                      </div>
                    </section>

                    <section className={SECTION_CLASS}>
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><FileText className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Narration</h3>
                          <p className="text-sm text-slate-500">Optional remarks for bill terms, transport, or internal note.</p>
                        </div>
                      </div>
                      <textarea name="notes" value={formData.notes} onChange={handleInputChange} className={`${FIELD_CLASS} min-h-[110px] resize-none`} placeholder="Optional notes for this purchase voucher" rows="4" />
                    </section>
                  </div>

                  <aside className="min-h-0 space-y-4 overflow-y-auto border-t border-slate-200 bg-white/90 p-4 sm:p-6 xl:border-l xl:border-t-0">
                    <section className="rounded-[22px] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Voucher Summary</p>
                          <h3 className="mt-2 text-xl font-bold">Purchase Snapshot</h3>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><ShoppingCart className="h-5 w-5" /></div>
                      </div>

                      <div className="mt-5 space-y-2 text-sm">
                        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"><span className="text-slate-300">Supplier</span><span className="max-w-[180px] truncate text-right font-semibold text-white">{resolveLeadgerNameById(formData.party)}</span></div>
                        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"><span className="text-slate-300">Invoice No.</span><span className="font-semibold text-white">{formData.invoiceNo || 'Pending'}</span></div>
                        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"><span className="text-slate-300">Purchase Date</span><span className="font-semibold text-white">{formData.purchaseDate || '-'}</span></div>
                        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"><span className="text-slate-300">Line Items</span><span className="font-semibold text-white">{formData.items.length}</span></div>
                      </div>

                      <div className="mt-5 space-y-3 rounded-[20px] border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between text-sm"><span className="text-slate-300">Purchase Total</span><span className="font-mono text-lg font-bold text-white">Rs {formatCurrency(formData.totalAmount)}</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-slate-300">Paid At Entry</span><span className="font-mono font-semibold text-emerald-300">Rs {formatCurrency(paymentAmount)}</span></div>
                        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm"><span className="font-semibold text-white">Balance</span><span className="font-mono text-lg font-bold text-amber-300">Rs {formatCurrency(balanceAmount)}</span></div>
                      </div>
                    </section>

                    <section className={SECTION_CLASS}>
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Upload className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Invoice Attachment</h3>
                          <p className="text-sm text-slate-500">Upload the supplier bill scan or PDF.</p>
                        </div>
                      </div>

                      <input id="purchase-invoice-upload" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={handleInvoiceUpload} disabled={uploadingInvoice} className="hidden" />
                      <label htmlFor="purchase-invoice-upload" className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed px-4 py-6 text-center transition ${uploadingInvoice ? 'border-blue-200 bg-blue-50 text-blue-600 opacity-75' : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                        <Upload className="h-5 w-5" />
                        <span className="text-sm font-semibold">{uploadingInvoice ? 'Uploading invoice...' : 'Upload invoice file'}</span>
                        <span className="text-xs text-blue-600/80">JPG, PNG, or PDF</span>
                      </label>

                      {formData.invoiceLink && (
                        <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                          <p className={LABEL_CLASS}>Attached File</p>
                          <p className="truncate text-sm font-semibold text-slate-900">{invoiceLabel}</p>
                          <div className="mt-3 flex gap-2">
                            <a href={formData.invoiceLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">View File</a>
                            <button type="button" onClick={() => { setFormData((prev) => ({ ...prev, invoiceLink: '' })); setInvoiceFileLabel(''); }} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Remove</button>
                          </div>
                        </div>
                      )}
                    </section>

                    <section className={SECTION_CLASS}>
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CreditCard className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Payment At Entry</h3>
                          <p className="text-sm text-slate-500">Record immediate payment or keep it on account.</p>
                        </div>
                      </div>

                      {editingId && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">Existing purchases cannot add entry payment here. Use the Payments page for later payment posting.</div>}

                      <div className="space-y-4">
                        <div>
                          <label className={LABEL_CLASS}>Amount Paid Now</label>
                          <div className="relative">
                            <input type="number" name="paymentAmount" value={formData.paymentAmount} onChange={handleInputChange} step="0.01" min="0" disabled={Boolean(editingId)} className={`${FIELD_CLASS} pr-10 disabled:bg-slate-100`} placeholder="0.00" />
                            <IndianRupee className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={LABEL_CLASS}>Payment Method</label>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} disabled={Boolean(editingId) || paymentAmount <= 0} className={`${FIELD_CLASS} disabled:bg-slate-100`}>
                              {PAYMENT_METHODS.map((method) => (
                                <option key={method.value} value={method.value}>{method.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={LABEL_CLASS}>Payment Date</label>
                            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleInputChange} disabled={Boolean(editingId) || paymentAmount <= 0} className={`${FIELD_CLASS} disabled:bg-slate-100`} />
                          </div>
                        </div>

                        <div>
                          <label className={LABEL_CLASS}>Payment Posting</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setFormData((prev) => ({ ...prev, isBillWisePayment: false }))} disabled={Boolean(editingId) || paymentAmount <= 0} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${!formData.isBillWisePayment ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>On Account</button>
                            <button type="button" onClick={() => setFormData((prev) => ({ ...prev, isBillWisePayment: true }))} disabled={Boolean(editingId) || paymentAmount <= 0} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${formData.isBillWisePayment ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>Bill Wise</button>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Bill-wise links the payment to this purchase. On-account leaves it unlinked.</p>
                        </div>

                        <div>
                          <label className={LABEL_CLASS}>Payment Note</label>
                          <textarea name="paymentNotes" value={formData.paymentNotes} onChange={handleInputChange} disabled={Boolean(editingId) || paymentAmount <= 0} className={`${FIELD_CLASS} min-h-[90px] resize-none disabled:bg-slate-100`} placeholder="Optional payment narration" rows="3" />
                        </div>
                      </div>
                    </section>
                  </aside>
                </div>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white/90 px-4 py-3 sm:flex-row sm:px-6">
                  <div className="text-xs text-slate-500"><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600">Esc</kbd> closes the popup and <kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600">Enter</kbd> moves through fields.</div>
                  <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
                    <button type="button" onClick={handleCancel} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:flex-none sm:px-5">Cancel</button>
                    <button type="submit" disabled={saving || uploadingInvoice} className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">{saving ? 'Saving...' : editingId ? 'Update Purchase' : 'Save Purchase'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input type="text" placeholder="Search purchases..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-400" />
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 sm:w-56">
          <option value="">Purchase History - All Time</option>
          <option value="7d">Purchase History - 7 Days</option>
          <option value="30d">Purchase History - 30 Days</option>
          <option value="3m">Purchase History - 3 Months</option>
          <option value="6m">Purchase History - 6 Months</option>
          <option value="1y">Purchase History - 1 Year</option>
        </select>
        <button onClick={handleOpenForm} className="whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-white shadow-sm transition hover:bg-slate-900">+ New Purchase</button>
      </div>

      {loading && !showForm ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : purchases.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-gray-500 shadow-sm">No purchases found. Create your first purchase!</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Invoice No</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Manage Party</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Products</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Invoice File</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 pr-8 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((purchase) => (
                  <tr key={purchase._id} className="group bg-white transition-colors duration-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{purchase.invoiceNo || purchase.invoiceNumber || '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{resolveLeadgerNameById(purchase.party)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {purchase.items?.length ? (
                          <>
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{purchase.items[0]?.productName}</span>
                            {purchase.items.length > 1 && <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{purchase.items[1]?.productName}</span>}
                            {purchase.items.length > 2 && <span className="ml-1 text-xs font-medium text-slate-500">+{purchase.items.length - 2} more</span>}
                          </>
                        ) : (
                          <span className="italic text-slate-400">No items</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(purchase.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      {purchase.invoiceLink ? (
                        <a href={purchase.invoiceLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </a>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">Rs {Number(purchase.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="space-x-2 px-6 py-4 pr-6 text-right">
                      <button onClick={() => handleEdit(purchase)} className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800">Edit</button>
                      <button onClick={() => handleDelete(purchase._id)} className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-800">Delete</button>
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
