import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../utils/api';
import { handlePopupFormKeyDown } from '../utils/popupFormKeyboard';

export default function Products() {
  const toastOptions = { autoClose: 1200 };

  const initialFormData = {
    name: '',
    category: '',
    unit: 'pcs',
    minStockLevel: 10,
    taxRate: 0,
    isActive: true
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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
      setError(err.message || 'Error fetching stock/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
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
    if (!formData.name || !formData.category) {
      setError('Name and category are required');
      return;
    }

    try {
      setLoading(true);
      const isEditMode = Boolean(editingId);
      const submitData = {
        ...formData,
        minStockLevel: parseInt(formData.minStockLevel || 0),
        taxRate: parseFloat(formData.taxRate || 0)
      };

      if (editingId) {
        await apiClient.put(`/products/${editingId}`, submitData);
      } else {
        await apiClient.post('/products', submitData);
      }

      toast.success(
        isEditMode ? 'Stock/Product updated successfully' : 'Stock/Product added successfully',
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
      category: typeof product.category === 'object' ? product.category?._id || '' : product.category
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${id}`);
        toast.success('Stock/Product deleted successfully', toastOptions);
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

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.isActive).length;
  const lowStockProducts = products.filter(
    (product) => Number(product.currentStock || 0) <= Number(product.minStockLevel || 0)
  ).length;

  return (
    <div className="p-4 pt-20 md:ml-64 md:p-8 bg-slate-50 min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500">Total Stock/Products</p>
          <p className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{totalProducts}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-green-700">Active</p>
          <p className="text-xl md:text-2xl font-bold text-green-800 mt-1">{activeProducts}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 md:p-4 shadow-sm">
          <p className="text-xs md:text-sm text-orange-700">Low Stock</p>
          <p className="text-xl md:text-2xl font-bold text-orange-800 mt-1">{lowStockProducts}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCancel}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                  {editingId ? 'Edit Stock/Product' : 'Add New Stock/Product'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Fill the details and save your product.</p>
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
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Stock/Product Name *</label>
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
                    <label className="block text-sm text-gray-700 font-semibold mb-2">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
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
                  {loading ? 'Saving...' : editingId ? 'Update Stock/Product' : 'Save Stock/Product'}
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
          placeholder="Search stock/products..."
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
          + Add Stock/Product
        </button>
      </div>

      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-500">
          No stock/products found. Create your first stock/product!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Unit</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Stock</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{product.name}</td>
                  <td className="px-6 py-3">{product.category?.name || '-'}</td>
                  <td className="px-6 py-3">{product.unit || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      Number(product.currentStock || 0) > Number(product.minStockLevel || 0)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {product.currentStock}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
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

