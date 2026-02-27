import { useState, useEffect } from 'react';
import { Upload, ShoppingCart, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

export default function Purchases() {
  const toastOptions = { autoClose: 1200 };

  const initialFormData = {
    party: '',
    invoiceNo: '',
    items: [],
    purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    totalAmount: 0,
    invoiceLink: '',
    notes: '',
    paymentAmount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentNotes: '',
    isBillWisePayment: false
  };

  const initialCurrentItem = {
    product: '',
    productName: '',
    quantity: '',
    unitPrice: ''
  };

  const [purchases, setPurchases] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [currentItem, setCurrentItem] = useState(initialCurrentItem);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchParties();
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

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/purchases', {
        params: {
          search,
          fromDate: fromDate || undefined
        }
      });
      setPurchases(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await apiClient.get('/parties?type=supplier');
      setParties(response.data || []);
    } catch (err) {
      console.error('Error fetching parties:', err);
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

  const calculateTotals = (items) => {
    const totalAmount = items.reduce((sum, item) => {
      return sum + (Number(item.total || 0));
    }, 0);

    setFormData((prev) => ({
      ...prev,
      totalAmount
    }));
  };

  const handleAddItem = () => {
    if (!currentItem.product || !currentItem.quantity || !currentItem.unitPrice) {
      setError('Product, quantity and price are required');
      return;
    }

    const quantity = Number(currentItem.quantity);
    const unitPrice = Number(currentItem.unitPrice);

    if (quantity <= 0 || unitPrice < 0) {
      setError('Quantity must be > 0 and price cannot be negative');
      return;
    }

    const product = products.find((p) => p._id === currentItem.product);

    const newItem = {
      ...currentItem,
      productName: product?.name || currentItem.productName || 'Item',
      quantity,
      unitPrice,
      total: quantity * unitPrice
    };

    const updatedItems = [...formData.items, newItem];

    setFormData((prev) => ({
      ...prev,
      items: updatedItems
    }));

    setCurrentItem(initialCurrentItem);
    calculateTotals(updatedItems);
    setError('');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.party || formData.items.length === 0) {
      setError('Supplier and at least one item are required');
      return;
    }

    const entryPaymentAmount = Math.max(0, Number(formData.paymentAmount || 0));
    if (entryPaymentAmount > Number(formData.totalAmount || 0)) {
      setError('Entry payment amount cannot exceed total purchase amount');
      return;
    }

    try {
      setLoading(true);
      const isEditMode = Boolean(editingId);

      const submitData = {
        ...formData,
        invoiceNo: String(formData.invoiceNo || '').trim(),
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : new Date(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        totalAmount: Number(formData.totalAmount || 0),
        invoiceLink: formData.invoiceLink || '',
        paymentAmount: isEditMode ? 0 : entryPaymentAmount,
        paymentMethod: formData.paymentMethod || 'cash',
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : new Date(),
        paymentNotes: formData.paymentNotes || '',
        isBillWisePayment: isEditMode ? false : Boolean(formData.isBillWisePayment)
      };

      if (editingId) {
        await apiClient.put(`/purchases/${editingId}`, submitData);
      } else {
        await apiClient.post('/purchases', submitData);
      }

      toast.success(
        isEditMode ? 'Purchase updated successfully' : 'Purchase added successfully',
        toastOptions
      );

      fetchPurchases();
      setFormData(initialFormData);
      setCurrentItem(initialCurrentItem);
      setEditingId(null);
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Error saving purchase');
    } finally {
      setLoading(false);
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
      purchaseDate: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : '',
      dueDate: purchase.dueDate ? new Date(purchase.dueDate).toISOString().split('T')[0] : '',
      totalAmount: Number(purchase.totalAmount || 0),
      invoiceLink: purchase.invoiceLink || '',
      notes: purchase.notes || '',
      paymentAmount: '',
      paymentMethod: 'cash',
      paymentDate: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentNotes: '',
      isBillWisePayment: false
    });

    setCurrentItem(initialCurrentItem);
    setEditingId(purchase._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await apiClient.delete(`/purchases/${id}`);
        toast.success('Purchase deleted successfully', toastOptions);
        fetchPurchases();
      } catch (err) {
        setError(err.message || 'Error deleting purchase');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setCurrentItem(initialCurrentItem);
  };

  const handleInvoiceUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingInvoice(true);
      const body = new FormData();
      body.append('invoice', file);

      const response = await apiClient.post('/uploads/invoice', body, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData((prev) => ({
        ...prev,
        invoiceLink: response.data?.url || response.data?.relativePath || ''
      }));
      setError('');
    } catch (err) {
      setError(err.message || 'Error uploading invoice');
    } finally {
      setUploadingInvoice(false);
      event.target.value = '';
    }
  };

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0);
  const entryPaymentPreviewBalance = Math.max(
    0,
    Number(formData.totalAmount || 0) - (formData.isBillWisePayment ? Number(formData.paymentAmount || 0) : 0)
  );

  return (
    <div className="p-4 pt-16 md:ml-64 md:px-8 md:pb-8 md:pt-5 bg-slate-50 min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
        {/* Total Purchases Card */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Purchases</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{totalPurchases}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>

        {/* Total Amount Card */}
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

      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCancel}>
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? 'Edit Purchase' : 'Create New Purchase'}
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="h-9 w-9 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Supplier *</label>
                  <select
                    name="party"
                    value={formData.party}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select supplier</option>
                    {parties.map((party) => (
                      <option key={party._id} value={party._id}>
                        {party.partyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Supplier Invoice No.</label>
                  <input
                    type="text"
                    name="invoiceNo"
                    value={formData.invoiceNo || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Enter supplier invoice no."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Invoice File (JPG/JPEG/PNG/PDF)</label>
                  <input
                    id="purchase-invoice-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={handleInvoiceUpload}
                    disabled={uploadingInvoice}
                    className="hidden"
                  />
                  <label
                    htmlFor="purchase-invoice-upload"
                    className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition ${
                      uploadingInvoice
                        ? 'border-blue-200 bg-blue-50 text-blue-600 opacity-75'
                        : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {uploadingInvoice ? 'Uploading Invoice...' : 'Upload Invoice'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
                  <select
                    value={currentItem.product}
                    onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Product</option>
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
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    Add
                  </button>
                </div>

                {formData.items.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Qty</th>
                          <th className="px-4 py-2 text-left">Price</th>
                          <th className="px-4 py-2 text-left">Total</th>
                          <th className="px-4 py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{item.productName}</td>
                            <td className="px-4 py-2">{item.quantity}</td>
                            <td className="px-4 py-2">Rs {Number(item.unitPrice || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 font-semibold">Rs {Number(item.total || 0).toFixed(2)}</td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800"
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

              <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Items</p>
                  <p className="text-xl font-bold">{formData.items.length}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Purchase</p>
                  <p className="text-2xl font-bold text-blue-600">Rs {Number(formData.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-800">Payment At Entry (Optional)</h3>
                  {editingId && (
                    <span className="text-xs text-slate-500">Use Payments page to add payment for existing purchase</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Amount Paid Now</label>
                    <input
                      type="number"
                      name="paymentAmount"
                      value={formData.paymentAmount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      disabled={Boolean(editingId)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      disabled={Boolean(editingId) || Number(formData.paymentAmount || 0) <= 0}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Payment Date</label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleInputChange}
                      disabled={Boolean(editingId) || Number(formData.paymentAmount || 0) <= 0}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700 pt-7">
                    <input
                      type="checkbox"
                      name="isBillWisePayment"
                      checked={Boolean(formData.isBillWisePayment)}
                      onChange={handleInputChange}
                      disabled={Boolean(editingId) || Number(formData.paymentAmount || 0) <= 0}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                    />
                    Save as bill-wise payment
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Payment Note</label>
                  <input
                    type="text"
                    name="paymentNotes"
                    value={formData.paymentNotes}
                    onChange={handleInputChange}
                    disabled={Boolean(editingId) || Number(formData.paymentAmount || 0) <= 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                    placeholder="Optional payment note"
                  />
                </div>

                {!editingId && Number(formData.paymentAmount || 0) > 0 && (
                  <p className="text-xs text-slate-600">
                    {formData.isBillWisePayment
                      ? `Bill-wise selected: this payment will be linked with this purchase bill. Pending balance will be Rs ${entryPaymentPreviewBalance.toFixed(2)}.`
                      : 'Bill-wise is not selected: payment will be saved as normal on-account party payment (no bill reference).'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Additional notes"
                  rows="2"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Purchase'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search purchases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-56 bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last 1 Year</option>
        </select>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setCurrentItem(initialCurrentItem);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
        >
          + New Purchase
        </button>
      </div>

      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : purchases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          No purchases found. Create your first purchase!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Invoice No</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Supplier</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Products</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Invoice File</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Total</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                return (
                <tr key={purchase._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{purchase.invoiceNo || purchase.invoiceNumber || '-'}</td>
                  <td className="px-6 py-3">{purchase.party?.partyName || '-'}</td>
                  <td className="px-6 py-3 text-slate-700">
                    {purchase.items?.length
                      ? (
                        purchase.items.slice(0, 2).map((item) => item.productName).join(', ') +
                        (purchase.items.length > 2 ? ` +${purchase.items.length - 2} more` : '')
                      )
                      : '-'}
                  </td>
                  <td className="px-6 py-3">{new Date(purchase.purchaseDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-3">
                    {purchase.invoiceLink ? (
                      <a
                        href={purchase.invoiceLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-3">Rs {Number(purchase.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-6 py-3 space-x-2 text-sm">
                    <button
                      onClick={() => handleEdit(purchase)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(purchase._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
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
      )}
    </div>
  );
}
