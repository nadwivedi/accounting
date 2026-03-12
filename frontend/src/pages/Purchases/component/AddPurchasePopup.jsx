import { Upload } from 'lucide-react';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';

export default function AddPurchasePopup({
  showForm,
  editingId,
  loading,
  formData,
  currentItem,
  leadgers,
  products,
  uploadingInvoice,
  getLeadgerDisplayName,
  setCurrentItem,
  handleCancel,
  handleSubmit,
  handleInputChange,
  handleInvoiceUpload,
  handleAddItem,
  handleRemoveItem
}) {
  if (!showForm) return null;

  return (
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
              <label className="block text-gray-700 font-medium mb-2">Manage Party *</label>
              <select
                name="party"
                value={formData.party}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                required
              >
                <option value="">Select leadger/account</option>
                {leadgers.map((leadger) => (
                  <option key={leadger._id} value={leadger._id}>
                    {getLeadgerDisplayName(leadger)}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Purchase Invoice No. <span className="text-gray-400 text-sm">(Optional)</span></label>
              <input
                type="text"
                name="invoiceNo"
                value={formData.invoiceNo || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Enter purchase invoice no. if available"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <input
                type="number"
                placeholder="Price"
                value={currentItem.unitPrice}
                onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
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
              <div className="overflow-hidden mb-4 rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="bg-white hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-3 text-slate-800 font-medium">{item.productName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-slate-600">Rs {Number(item.unitPrice || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-800 font-semibold">Rs {Number(item.total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Additional notes"
              rows="2"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition disabled:opacity-50"
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
  );
}
