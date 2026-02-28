import { useState, useEffect } from 'react';
import { Package, PackageCheck, PackageX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

export default function Products() {
  const toastOptions = { autoClose: 1200 };
  const navigate = useNavigate();

  const initialFormData = {
    name: '',
    stockGroup: '',
    unit: 'pcs',
    minStockLevel: 10,
    taxRate: 0,
    isActive: true
  };

  const [products, setProducts] = useState([]);
  const [stockGroups, setStockGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchProducts();
    fetchStockGroups();
  }, [search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products', {
        params: { search }
      });
      setProducts(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching stock items');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockGroups = async () => {
    try {
      const response = await apiClient.get('/stock-groups');
      setStockGroups(response.data || []);
    } catch (err) {
      console.error('Error fetching stock groups:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      const isEditMode = Boolean(editingId);
      const submitData = {
        ...formData,
        stockGroup: formData.stockGroup || null,
        minStockLevel: parseInt(formData.minStockLevel || 0),
        taxRate: parseFloat(formData.taxRate || 0)
      };

      if (editingId) {
        await apiClient.put(`/products/${editingId}`, submitData);
      } else {
        await apiClient.post('/products', submitData);
      }

      toast.success(
        isEditMode ? 'Stock Item updated successfully' : 'Stock Item added successfully',
        toastOptions
      );
      fetchProducts();
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      ...initialFormData,
      ...product,
      stockGroup: typeof product.stockGroup === 'object'
        ? product.stockGroup?._id || ''
        : (product.stockGroup || '')
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${id}`);
        toast.success('Stock Item deleted successfully', toastOptions);
        fetchProducts();
      } catch (err) {
        setError(err.message || 'Error deleting product');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleOpenLedger = (productId) => {
    navigate(`/stock/${productId}`);
  };

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.isActive).length;
  const lowStockProducts = products.filter(
    (product) => Number(product.currentStock || 0) <= Number(product.minStockLevel || 0)
  ).length;

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
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Stock Items</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{totalProducts}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Active</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{activeProducts}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <PackageCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80"></div>
        </div>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Low Stock</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{lowStockProducts}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
              <PackageX className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-rose-500 to-orange-400 opacity-80"></div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCancel}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                  {editingId ? 'Edit Stock Item' : 'Add New Stock Item'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Fill the details and save your stock item.</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="h-9 w-9 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition"
                aria-label="Close popup"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="space-y-6 px-6 py-6 bg-white">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Basic Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Stock Item Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Stock Group</label>
                    <select
                      name="stockGroup"
                      value={formData.stockGroup}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No stock group</option>
                      {stockGroups.map((group) => (
                        <option key={group._id} value={group._id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Unit *</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilogram</option>
                      <option value="g">Gram</option>
                      <option value="ltr">Liter</option>
                      <option value="ml">Milliliter</option>
                      <option value="box">Box</option>
                      <option value="hrs">Hours</option>
                      <option value="minutes">Minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Stock & Tax</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Min Stock Level</label>
                    <input
                      type="number"
                      name="minStockLevel"
                      value={formData.minStockLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <label className="inline-flex items-center gap-2 text-gray-700 font-medium">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                  />
                  Active product
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Stock Item' : 'Save Stock Item'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition"
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
          placeholder="Search stock items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
        >
          + Add Stock Item
        </button>
      </div>

      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          No stock items found. Create your first stock item!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Stock Group</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="bg-white hover:bg-slate-50 transition-colors duration-200 cursor-pointer group"
                    onClick={() => handleOpenLedger(product._id)}
                  >
                    <td className="px-6 py-4-slate-800 font-semibold text">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <span className="text-xs font-normal text-blue-600">View ledger</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{product.stockGroup?.name || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{product.unit || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        Number(product.currentStock || 0) > Number(product.minStockLevel || 0)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {product.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6 space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product._id);
                        }}
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

