import { CalendarDays, PackagePlus, ShoppingCart, Upload } from 'lucide-react';
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

  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-800 focus:border-transparent focus:outline-none focus:ring-2';
  const paidAmount = Number(formData.paymentAmount || 0);
  const totalAmount = Number(formData.totalAmount || 0);
  const balanceAmount = Math.max(totalAmount - paidAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/60 p-2 md:p-4" onClick={handleCancel}>
      <div className="flex max-h-[95vh] w-full max-w-[84rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-white md:px-4 md:py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold md:text-xl">
                {editingId ? 'Edit Purchase Entry' : 'Add New Purchase'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg p-1.5 text-white transition hover:bg-white/20"
              aria-label="Close popup"
            >
              <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(240px,0.68fr)] xl:items-start">
              <div className="space-y-3 md:space-y-4">
                <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-800 md:mb-3 md:text-base">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white md:h-6 md:w-6 md:text-xs">1</span>
                    Purchase Details
                  </h3>

                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Purchase Date</label>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
                        <input
                          type="text"
                          name="purchaseDate"
                          value={formData.purchaseDate}
                          onChange={handleInputChange}
                          className={`${inputClass} pl-10 focus:ring-indigo-500`}
                          placeholder="DD-MM-YYYY"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                        Party Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="party"
                        value={formData.party}
                        onChange={handleInputChange}
                        className={`${inputClass} focus:ring-indigo-500`}
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
                      <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                        Purchase Invoice No. <span className="text-xs text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        name="invoiceNo"
                        value={formData.invoiceNo || ''}
                        onChange={handleInputChange}
                        className={`${inputClass} focus:ring-indigo-500`}
                        placeholder="Enter invoice no."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Due Date</label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate || ''}
                        onChange={handleInputChange}
                        className={`${inputClass} focus:ring-indigo-500`}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Invoice File</label>
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
                        className={`flex min-h-[36px] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-2.5 py-1.5 text-center text-[13px] font-semibold transition ${
                          uploadingInvoice
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-500 opacity-75'
                            : 'border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50'
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{uploadingInvoice ? 'Uploading...' : formData.invoiceLink ? 'Invoice Uploaded' : 'Upload Invoice'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 md:p-4">
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-800 md:mb-3 md:text-base">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white md:h-6 md:w-6 md:text-xs">2</span>
                    Purchase Items
                  </h3>

                  <div className="mb-3 grid grid-cols-1 gap-2.5 rounded-xl border border-dashed border-emerald-300 bg-white p-2.5 md:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Product</label>
                      <select
                        value={currentItem.product}
                        onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                        className={`${inputClass} focus:ring-emerald-500`}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                        className={`${inputClass} focus:ring-emerald-500`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Price</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={currentItem.unitPrice}
                        onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                        className={`${inputClass} focus:ring-emerald-500`}
                        step="0.01"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Add Item
                      </button>
                    </div>
                  </div>

                  {formData.items.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
                      <div className="border-b border-emerald-100 bg-emerald-50 px-3 py-2">
                        <p className="text-xs font-semibold text-emerald-800">{formData.items.length} item(s) added</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-[13px]">
                          <thead className="bg-white text-gray-600">
                            <tr>
                              <th className="border-b border-emerald-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider">Product</th>
                              <th className="border-b border-emerald-100 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">Qty</th>
                              <th className="border-b border-emerald-100 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">Price</th>
                              <th className="border-b border-emerald-100 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider">Total</th>
                              <th className="border-b border-emerald-100 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50">
                            {formData.items.map((item, index) => (
                              <tr key={index} className="hover:bg-emerald-50/40">
                                <td className="px-3 py-2.5 font-medium text-gray-800">{item.productName}</td>
                                <td className="px-3 py-2.5 text-right text-gray-600">{item.quantity}</td>
                                <td className="px-3 py-2.5 text-right text-gray-600">Rs {Number(item.unitPrice || 0).toFixed(2)}</td>
                                <td className="px-3 py-2.5 text-right font-semibold text-gray-800">Rs {Number(item.total || 0).toFixed(2)}</td>
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-emerald-200 bg-white px-5 py-6 text-center text-[13px] text-gray-500">
                      No items added yet. Use the form above to add purchase items.
                    </div>
                  )}
                </div>
              </div>

              <div className="h-full xl:sticky xl:top-0">
                <div className="flex h-full flex-col rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-2.5 md:p-4">
              <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-800 md:mb-3 md:text-base">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white md:h-6 md:w-6 md:text-xs">3</span>
                Payment And Summary
              </h3>

              <div className="mb-3 space-y-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                    Total Amount (Rs) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    className={`${inputClass} bg-purple-50 font-semibold text-gray-700 focus:ring-purple-500`}
                    readOnly
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Amount Paid Now (Rs)</label>
                  <input
                    type="number"
                    name="paymentAmount"
                    value={formData.paymentAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    disabled={Boolean(editingId)}
                    className={`${inputClass} ${Boolean(editingId) ? 'bg-gray-100 text-gray-500' : 'bg-white'} focus:ring-purple-500`}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                    Balance (Rs) <span className="text-xs text-gray-500">(Auto)</span>
                  </label>
                  <input
                    type="number"
                    value={balanceAmount}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-purple-50 px-2.5 py-1.5 text-[13px] font-semibold text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    disabled={Boolean(editingId) || paidAmount <= 0}
                    className={`${inputClass} ${Boolean(editingId) || paidAmount <= 0 ? 'bg-gray-100 text-gray-500' : 'bg-white'} focus:ring-purple-500`}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Item Count</label>
                  <div className="flex min-h-[36px] items-center rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] font-semibold text-gray-700">
                    <ShoppingCart className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
                    {formData.items.length} item(s)
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Payment Note</label>
                  <input
                    type="text"
                    name="paymentNotes"
                    value={formData.paymentNotes}
                    onChange={handleInputChange}
                    disabled={Boolean(editingId) || paidAmount <= 0}
                    className={`${inputClass} ${Boolean(editingId) || paidAmount <= 0 ? 'bg-gray-100 text-gray-500' : 'bg-white'} focus:ring-purple-500`}
                    placeholder="Optional payment note"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className={`${inputClass} min-h-[64px] resize-none focus:ring-purple-500`}
                    placeholder="Additional notes"
                    rows="3"
                  />
                </div>
              </div>

              {editingId && (
                <div className="mt-4 rounded border-l-4 border-blue-500 bg-blue-50 p-3">
                  <p className="text-sm font-semibold text-blue-700">
                    Use Payments page to add payment for existing purchase
                  </p>
                </div>
              )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2.5 md:flex-row md:px-4 md:py-3">
            <div className="text-[11px] text-gray-600 md:text-xs">
              <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close
            </div>

            <div className="flex w-full gap-2 md:w-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-6"
              >
                {loading ? 'Saving...' : editingId ? 'Update Purchase' : 'Save Purchase'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
