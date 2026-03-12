import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';

export default function AddReceiptPopup({
  showForm,
  loading,
  formData,
  parties,
  saleOptions,
  saleReceiptMap,
  setFormData,
  handleCloseForm,
  handleSubmit,
  handleChange
}) {
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleCloseForm}>
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">New Receipt (Money Received)</h2>
          <button
            type="button"
            onClick={handleCloseForm}
            className="h-9 w-9 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition"
            aria-label="Close popup"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Party</label>
            <select
              name="party"
              value={formData.party}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select party</option>
              {parties.map((party) => (
                <option key={party._id} value={party._id}>
                  {party.partyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Date</label>
            <input
              type="date"
              name="receiptDate"
              value={formData.receiptDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Method</label>
            <select
              name="method"
              value={formData.method}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Receipt Type</label>
            <select
              name="refType"
              value={formData.refType}
              onChange={(e) => setFormData((prev) => ({ ...prev, refType: e.target.value, refId: '' }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="none">On Account</option>
              <option value="sale">Against Sale Bill</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Sale Bill</label>
            <select
              name="refId"
              value={formData.refId}
              onChange={handleChange}
              disabled={formData.refType !== 'sale'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
            >
              <option value="">Select sale bill</option>
              {saleOptions.map((sale) => {
                const pending = Math.max(
                  0,
                  Number(sale.totalAmount || 0) - Number(saleReceiptMap.get(String(sale._id)) || 0)
                );

                return (
                  <option key={sale._id} value={sale._id}>
                    {sale.invoiceNumber} - {sale.party?.partyName || sale.customerName || '-'} - Pending Rs {pending.toFixed(2)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-slate-600 mb-1">Notes</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Optional note"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
