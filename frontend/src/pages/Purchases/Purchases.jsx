import { useState, useEffect } from 'react';
import { Upload, ShoppingCart, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import AddPurchasePopup from './component/AddPurchasePopup';

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
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  useEffect(() => {
    fetchPurchases();
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

  const fetchLeadgers = async () => {
    try {
      const response = await apiClient.get('/parties');
      setLeadgers(response.data || []);
    } catch (err) {
      console.error('Error fetching leadgers:', err);
    }
  };

  const getLeadgerDisplayName = (leadger) => {
    const name = String(leadger?.name || '').trim();

    if (name) return name;
    return 'Manage Party';
  };

  const resolveLeadgerNameById = (leadgerId) => {
    const resolvedId = typeof leadgerId === 'object' ? leadgerId?._id : leadgerId;
    if (!resolvedId) return '-';
    const matching = leadgers.find((leadger) => String(leadger._id) === String(resolvedId));
    return matching ? getLeadgerDisplayName(matching) : '-';
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
      setError('Manage Party and at least one item are required');
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
        isBillWisePayment: false
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
  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-16 md:px-8 md:pb-8 md:pt-5">
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

      <AddPurchasePopup
        showForm={showForm}
        editingId={editingId}
        loading={loading}
        formData={formData}
        currentItem={currentItem}
        leadgers={leadgers}
        products={products}
        uploadingInvoice={uploadingInvoice}
        getLeadgerDisplayName={getLeadgerDisplayName}
        setCurrentItem={setCurrentItem}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        handleInvoiceUpload={handleInvoiceUpload}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search purchases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-56 bg-white px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">Purchase History - All Time</option>
          <option value="7d">Purchase History - 7 Days</option>
          <option value="30d">Purchase History - 30 Days</option>
          <option value="3m">Purchase History - 3 Months</option>
          <option value="6m">Purchase History - 6 Months</option>
          <option value="1y">Purchase History - 1 Year</option>
        </select>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setCurrentItem(initialCurrentItem);
            setShowForm(true);
          }}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-900 transition shadow-sm whitespace-nowrap"
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Invoice No</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Manage Party</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Products</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Invoice File</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((purchase) => {
                  return (
                    <tr key={purchase._id} className="bg-white hover:bg-slate-50 transition-colors duration-200 group">
                      <td className="px-6 py-4 font-semibold text-slate-800">{purchase.invoiceNo || purchase.invoiceNumber || '-'}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{resolveLeadgerNameById(purchase.party)}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {purchase.items?.length
                            ? (
                              <>
                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100">
                                  {purchase.items[0]?.productName}
                                </span>
                                {purchase.items.length > 1 && (
                                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100">
                                    {purchase.items[1]?.productName}
                                  </span>
                                )}
                                {purchase.items.length > 2 && (
                                  <span className="text-xs font-medium text-slate-500 ml-1">
                                    +{purchase.items.length - 2} more
                                  </span>
                                )}
                              </>
                            )
                            : <span className="text-slate-400 italic">No items</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{new Date(purchase.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4">
                        {purchase.invoiceLink ? (
                          <a
                            href={purchase.invoiceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View
                          </a>
                        ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        Rs {Number(purchase.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right pr-6 space-x-2">
                        <button
                          onClick={() => handleEdit(purchase)}
                          className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(purchase._id)}
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

