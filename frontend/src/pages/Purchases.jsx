import { useState, useEffect } from 'react';
import apiClient from '../utils/api';

export default function Purchases() {
  const initialFormData = {
    party: '',
    items: [],
    purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    shippingCharges: 0,
    otherCharges: 0,
    totalAmount: 0,
    paidAmount: 0,
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

  const [purchases, setPurchases] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [currentItem, setCurrentItem] = useState(initialCurrentItem);

  useEffect(() => {
    fetchPurchases();
    fetchParties();
    fetchProducts();
  }, [search]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/purchases', {
        params: { search }
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

  const handleAddItem = () => {
    if (!currentItem.product || !currentItem.quantity || !currentItem.unitPrice) {
      setError('Product, quantity and price are required');
      return;
    }

    const product = products.find(p => p._id === currentItem.product);
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
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party || formData.items.length === 0) {
      setError('Party and at least one item are required');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        party: formData.party,
        purchaseDate: new Date(formData.purchaseDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null
      };

      if (editingId) {
        await apiClient.put(`/purchases/${editingId}`, submitData);
      } else {
        await apiClient.post('/purchases', submitData);
      }
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
    setFormData(purchase);
    setEditingId(purchase._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        await apiClient.delete(`/purchases/${id}`);
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

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0);
  const totalDue = purchases.reduce(
    (sum, purchase) => sum + (Number(purchase.totalAmount || 0) - Number(purchase.paidAmount || 0)),
    0
  );

  return (
    <div className="ml-64 p-8 bg-slate-50 min-h-screen">

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Purchases</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalPurchases}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-sm text-blue-700">Total Amount</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">Rs {totalAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm text-red-700">Total Due</p>
          <p className="text-2xl font-bold text-red-800 mt-1">Rs {totalDue.toFixed(2)}</p>
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

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {party.PartName}
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

      {/* Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search purchases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
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

      {/* Purchases List */}
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
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Invoice</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Supplier</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Total</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Paid</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Due</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{purchase.invoiceNumber}</td>
                  <td className="px-6 py-3">{purchase.party?.PartName || '-'}</td>
                  <td className="px-6 py-3">{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3">₹{purchase.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-3">₹{purchase.paidAmount.toFixed(2)}</td>
                  <td className="px-6 py-3">₹{(purchase.totalAmount - purchase.paidAmount).toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      purchase.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : purchase.paymentStatus === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {purchase.paymentStatus}
                    </span>
                  </td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
