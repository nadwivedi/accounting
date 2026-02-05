import { useState, useEffect } from 'react';
import apiClient from '../utils/api';

export default function Parties() {
  const initialFormData = {
    PartName: '',
    type: 'both',
    phone: '',
    email: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
    gstin: '',
    panNumber: '',
    openingBalance: 0,
    creditLimit: 0,
    isActive: true
  };

  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchParties();
  }, [search, typeFilter]);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/parties', {
        params: { search, type: typeFilter }
      });
      setParties(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching parties');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      address: { ...formData.address, [name]: value }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.PartName || !formData.type) {
      setError('Party name and type are required');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        openingBalance: parseFloat(formData.openingBalance),
        creditLimit: parseFloat(formData.creditLimit)
      };

      if (editingId) {
        await apiClient.put(`/parties/${editingId}`, submitData);
      } else {
        await apiClient.post('/parties', submitData);
      }
      fetchParties();
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Error saving party');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (party) => {
    setFormData(party);
    setEditingId(party._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      try {
        await apiClient.delete(`/parties/${id}`);
        fetchParties();
      } catch (err) {
        setError(err.message || 'Error deleting party');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  return (
    <div className="ml-64 p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Parties</h1>
          <p className="text-gray-600 mt-2">Manage suppliers and customers</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Party
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCancel}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? 'Edit Party' : 'Add New Party'}
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

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Party Name *</label>
                <input
                  type="text"
                  name="PartName"
                  value={formData.PartName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter party name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="supplier">Supplier</option>
                  <option value="customer">Customer</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">GSTIN</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter GSTIN"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter PAN number"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Opening Balance</label>
                <input
                  type="number"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Credit Limit</label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-gray-800">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="street"
                  value={formData.address.street}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Street"
                />
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="City"
                />
                <input
                  type="text"
                  name="state"
                  value={formData.address.state}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="State"
                />
                <input
                  type="text"
                  name="pincode"
                  value={formData.address.pincode}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Pincode"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
              />
              <label htmlFor="isActive" className="ml-2 text-gray-700">
                Active
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Party'}
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

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search parties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Types</option>
          <option value="supplier">Suppliers</option>
          <option value="customer">Customers</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Parties List */}
      {loading && !showForm ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : parties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          No parties found. Create your first party!
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">City</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Balance</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((party) => (
                <tr key={party._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{party.PartName}</td>
                  <td className="px-6 py-3 capitalize">{party.type}</td>
                  <td className="px-6 py-3">{party.phone || '-'}</td>
                  <td className="px-6 py-3">{party.email || '-'}</td>
                  <td className="px-6 py-3">{party.address?.city || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={party.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{party.currentBalance}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      party.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {party.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 space-x-2">
                    <button
                      onClick={() => handleEdit(party)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(party._id)}
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
