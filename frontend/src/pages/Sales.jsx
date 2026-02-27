import { useState, useEffect } from 'react';
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
    shippingCharges: 0,
    otherCharges: 0,
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

  const initialNewCustomerForm = {
    partyName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  };

  const [sales, setSales] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [currentItem, setCurrentItem] = useState(initialCurrentItem);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(initialNewCustomerForm);
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchParties();
    fetchProducts();
  }, [search]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sales', {
        params: { search }
      });
      setSales(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await apiClient.get('/parties?type=customer');
      setParties(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error('Error fetching parties:', err);
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

  const buildPartyAddress = (party) => {
    if (!party?.address) return '';
    const { street, city, state, pincode, country } = party.address;
    return [street, city, state, pincode, country].filter(Boolean).join(', ');
  };

  const resetNewCustomerForm = () => {
    setNewCustomerForm(initialNewCustomerForm);
    setShowNewCustomerForm(false);
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const normalizedPhone = String(value || '').replace(/\D/g, '').slice(0, 10);
      setNewCustomerForm((prev) => ({ ...prev, phone: normalizedPhone }));
      return;
    }
    setNewCustomerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCustomer = async () => {
    const partyName = String(newCustomerForm.partyName || '').trim();
    if (!partyName) {
      setError('Customer name is required');
      return;
    }

    try {
      setSavingCustomer(true);
      const payload = {
        partyName,
        type: 'customer',
        phone: String(newCustomerForm.phone || '').replace(/\D/g, '').slice(0, 10),
        email: String(newCustomerForm.email || '').trim(),
        address: {
          street: String(newCustomerForm.street || '').trim(),
          city: String(newCustomerForm.city || '').trim(),
          state: String(newCustomerForm.state || '').trim(),
          pincode: String(newCustomerForm.pincode || '').trim(),
          country: String(newCustomerForm.country || '').trim() || 'India'
        },
        isActive: true
      };

      const response = await apiClient.post('/parties', payload);
      const createdCustomer = response.data;

      if (!createdCustomer?._id) {
        await fetchParties();
        toast.success('Customer added successfully', toastOptions);
        resetNewCustomerForm();
        setError('');
        return;
      }

      setParties((prev) => [createdCustomer, ...prev]);
      setFormData((prev) => ({
        ...prev,
        party: createdCustomer._id,
        customerName: createdCustomer.partyName || '',
        customerPhone: String(createdCustomer.phone || '').replace(/\D/g, '').slice(0, 10),
        customerAddress: buildPartyAddress(createdCustomer)
      }));
      toast.success('Customer added successfully', toastOptions);
      resetNewCustomerForm();
      setError('');
    } catch (err) {
      setError(err.message || 'Error adding customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleCustomerChange = (e) => {
    const selectedPartyId = e.target.value;
    if (!selectedPartyId) {
      setFormData({
        ...formData,
        party: '',
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      });
      return;
    }

    const selectedParty = parties.find((party) => String(party._id) === String(selectedPartyId));
    setFormData({
      ...formData,
      party: selectedPartyId,
      customerName: selectedParty?.partyName || '',
      customerPhone: String(selectedParty?.phone || '').replace(/\D/g, '').slice(0, 10),
      customerAddress: buildPartyAddress(selectedParty)
    });
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

    const total = subtotal + totalTax + (formData.shippingCharges || 0) + (formData.otherCharges || 0) - (formData.discountAmount || 0);

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
      resetNewCustomerForm();
      setEditingId(null);
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

    setFormData({
      ...initialFormData,
      ...sale,
      party: normalizedPartyId,
      customerName: sale.customerName || sale.party?.partyName || '',
      customerPhone: String(sale.customerPhone || sale.party?.phone || '').replace(/\D/g, '').slice(0, 10),
      customerAddress: sale.customerAddress || ''
    });
    resetNewCustomerForm();
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
    resetNewCustomerForm();
  };

  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const totalDue = sales.reduce(
    (sum, sale) => sum + (Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0)),
    0
  );

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCancel}>
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? 'Edit Sale' : 'Create New Sale'}
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
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700 font-medium">Customer Name</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm((prev) => !prev)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {showNewCustomerForm ? 'Close' : '+ Add Customer'}
                  </button>
                </div>
                <select
                  name="party"
                  value={formData.party || ''}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select customer</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party._id}>
                      {party.partyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="10-digit phone number"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Sale Date</label>
                <input
                  type="date"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Payment Mode</label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="credit">Credit</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {showNewCustomerForm && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-blue-800">Add New Customer</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    name="partyName"
                    value={newCustomerForm.partyName}
                    onChange={handleNewCustomerChange}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Customer name *"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={newCustomerForm.phone}
                    onChange={handleNewCustomerChange}
                    maxLength={10}
                    inputMode="numeric"
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Phone"
                  />
                  <input
                    type="email"
                    name="email"
                    value={newCustomerForm.email}
                    onChange={handleNewCustomerChange}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Email"
                  />
                  <input
                    type="text"
                    name="street"
                    value={newCustomerForm.street}
                    onChange={handleNewCustomerChange}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Street"
                  />
                  <input
                    type="text"
                    name="city"
                    value={newCustomerForm.city}
                    onChange={handleNewCustomerChange}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    name="state"
                    value={newCustomerForm.state}
                    onChange={handleNewCustomerChange}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    name="pincode"
                    value={newCustomerForm.pincode}
                    onChange={handleNewCustomerChange}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Pincode"
                  />
                  <input
                    type="text"
                    name="country"
                    value={newCustomerForm.country}
                    onChange={handleNewCustomerChange}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Country"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateCustomer}
                    disabled={savingCustomer}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {savingCustomer ? 'Saving...' : 'Save Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={resetNewCustomerForm}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-2">Customer Address</label>
              <textarea
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Customer address"
                rows="2"
              />
            </div>

            {/* Add Items Section */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
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
                <input
                  type="number"
                  placeholder="Tax %"
                  value={currentItem.taxRate}
                  onChange={(e) => setCurrentItem({ ...currentItem, taxRate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="number"
                  placeholder="Discount"
                  value={currentItem.discount}
                  onChange={(e) => setCurrentItem({ ...currentItem, discount: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Add
                </button>
              </div>

              {/* Items Table */}
              {formData.items.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">Qty</th>
                        <th className="px-4 py-2 text-left">Price</th>
                        <th className="px-4 py-2 text-left">Tax</th>
                        <th className="px-4 py-2 text-left">Discount</th>
                        <th className="px-4 py-2 text-left">Total</th>
                        <th className="px-4 py-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">{item.productName}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">₹{item.unitPrice}</td>
                          <td className="px-4 py-2">₹{item.taxAmount.toFixed(2)}</td>
                          <td className="px-4 py-2">₹{item.discount}</td>
                          <td className="px-4 py-2 font-semibold">₹{item.total.toFixed(2)}</td>
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

            {/* Charges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Discount</label>
                <input
                  type="number"
                  name="discountAmount"
                  value={formData.discountAmount}
                  onChange={(e) => {
                    handleInputChange(e);
                    calculateTotals(formData.items);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Shipping</label>
                <input
                  type="number"
                  name="shippingCharges"
                  value={formData.shippingCharges}
                  onChange={(e) => {
                    handleInputChange(e);
                    calculateTotals(formData.items);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Other Charges</label>
                <input
                  type="number"
                  name="otherCharges"
                  value={formData.otherCharges}
                  onChange={(e) => {
                    handleInputChange(e);
                    calculateTotals(formData.items);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Paid Amount</label>
                <input
                  type="number"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  step="0.01"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Subtotal</p>
                <p className="text-xl font-bold">₹{formData.subtotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Tax</p>
                <p className="text-xl font-bold">₹{formData.taxAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-2xl font-bold text-blue-600">₹{formData.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Due</p>
                <p className="text-2xl font-bold text-red-600">₹{(formData.totalAmount - formData.paidAmount).toFixed(2)}</p>
              </div>
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
                {loading ? 'Saving...' : 'Save Sale'}
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

      {/* Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search sales..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setCurrentItem(initialCurrentItem);
            resetNewCustomerForm();
            setShowForm(true);
          }}
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Invoice</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Products</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Total</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Paid</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Due</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{sale.invoiceNumber}</td>
                  <td className="px-6 py-3">{sale.party?.partyName || sale.customerName || 'Walk-in'}</td>
                  <td className="px-6 py-3 text-slate-700">
                    {sale.items?.length
                      ? (
                        sale.items.slice(0, 2).map((item) => item.productName).join(', ') +
                        (sale.items.length > 2 ? ` +${sale.items.length - 2} more` : '')
                      )
                      : '-'}
                  </td>
                  <td className="px-6 py-3">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3">₹{sale.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-3">₹{sale.paidAmount.toFixed(2)}</td>
                  <td className="px-6 py-3">₹{(sale.totalAmount - sale.paidAmount).toFixed(2)}</td>
                  <td className="px-6 py-3">
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
                  <td className="px-6 py-3 space-x-2 text-sm">
                    <button
                      onClick={() => handleEdit(sale)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(sale._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
