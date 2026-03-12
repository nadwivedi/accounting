import { Building2, CalendarDays, ShoppingCart, Trash2, Plus, FileText } from 'lucide-react';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';

export default function AddSalePopup({
  showForm,
  editingId,
  loading,
  formData,
  currentItem,
  products,
  popupFieldClass,
  popupLabelClass,
  leadgerSectionRef,
  leadgerQuery,
  leadgerListIndex,
  filteredLeadgers,
  isLeadgerSectionActive,
  setCurrentItem,
  setIsLeadgerSectionActive,
  setLeadgerListIndex,
  getLeadgerDisplayName,
  handleCancel,
  handleSubmit,
  handleInputChange,
  handleLeadgerInputChange,
  handleLeadgerInputKeyDown,
  handleSelectEnterMoveNext,
  handleAddItem,
  handleRemoveItem,
  selectLeadger
}) {
  if (!showForm) return null;

  const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-800 transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2";
  const labelClass = "mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs";
  const paidAmount = Number(formData.paidAmount || 0);
  const totalAmount = Number(formData.totalAmount || 0);
  const balanceAmount = Math.max(totalAmount - paidAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/60 p-2 md:p-4" onClick={handleCancel}>
      <div className="flex max-h-[95vh] w-full max-w-[84rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-white md:px-4 md:py-3">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold md:text-xl">
              {editingId ? 'Edit Sale Entry' : 'Add New Sale'}
            </h2>
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

        <form id="sales-form" onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="flex flex-1 flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(240px,0.68fr)] xl:items-start">
              
              <div className="space-y-3 md:space-y-4">
                <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-800 md:mb-3 md:text-base">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white md:h-6 md:w-6 md:text-xs">1</span>
                    Sale Details
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-3">
                  <div>
                    <label className={labelClass}>Invoice Date</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-400 pointer-events-none" />
                      <input
                        type="text"
                        name="saleDate"
                        value={formData.saleDate}
                        onChange={handleInputChange}
                        autoFocus
                        inputMode="numeric"
                        placeholder="dd-mm-yyyy"
                        className={`${inputClass} pl-9 focus:ring-indigo-500`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label className={labelClass}>Party Name</label>
                    <div
                      ref={leadgerSectionRef}
                      className="relative"
                      onFocusCapture={() => setIsLeadgerSectionActive(true)}
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (leadgerSectionRef.current && nextFocused instanceof Node && leadgerSectionRef.current.contains(nextFocused)) return;
                        setIsLeadgerSectionActive(false);
                      }}
                    >
                        <div className="relative">
                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-400 pointer-events-none" />
                        <input
                          type="text"
                          value={leadgerQuery}
                          onChange={handleLeadgerInputChange}
                          onKeyDown={handleLeadgerInputKeyDown}
                          className={`${inputClass} pl-9 focus:ring-indigo-500`}
                          placeholder="Type to search party..."
                        />
                      </div>

                      {isLeadgerSectionActive && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden">
                          <div className="px-3 py-2 text-[11px] font-bold text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                            Select Party
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {filteredLeadgers.length === 0 ? (
                              <div className="px-3 py-3 text-center text-sm text-slate-500 border-t">
                                No matching parties found.
                              </div>
                            ) : (
                              filteredLeadgers.map((leadger, index) => {
                                const isActive = index === leadgerListIndex;
                                const isSelected = String(formData.party || '') === String(leadger._id);

                                return (
                                  <button
                                    key={leadger._id}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setLeadgerListIndex(index)}
                                    onClick={() => selectLeadger(leadger)}
                                    className={`w-full px-3 py-2 text-left text-sm transition-colors border-t border-slate-100 first:border-t-0 ${
                                      isActive || isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    {getLeadgerDisplayName(leadger)}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className={`${inputClass} focus:ring-indigo-500`}
                    />
                  </div>
                </div>
                </div>

                <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 md:p-4">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 md:text-base">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white md:h-6 md:w-6 md:text-xs">2</span>
                      Sale Items
                    </h3>
                    <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm">
                      {formData.items.length} Entries
                    </span>
                  </div>
                  
                  <div className="mb-3 grid grid-cols-12 gap-2 items-end rounded-xl border border-dashed border-emerald-300 bg-white p-2.5">
                      <div className="col-span-6 md:col-span-5">
                        <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Product</label>
                        <select
                          value={currentItem.product}
                          onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                          onKeyDown={handleSelectEnterMoveNext}
                          className={`${inputClass} focus:ring-emerald-500`}
                        >
                          <option value="">Select...</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Qty</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={currentItem.quantity}
                          onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                          className={`${inputClass} text-center focus:ring-emerald-500`}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Rate</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={currentItem.unitPrice}
                          onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                          className={`${inputClass} text-right focus:ring-emerald-500`}
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 p-2 text-white shadow-sm transition hover:bg-emerald-700"
                          title="Add Item"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {formData.items.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white shadow-sm">
                        <table className="w-full text-[13px]">
                          <thead className="border-b border-emerald-100 bg-emerald-50/60">
                            <tr>
                              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Item</th>
                              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-16">Qty</th>
                              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-24">Rate</th>
                              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-28">Amount</th>
                              <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-16">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50 bg-white">
                            {formData.items.map((item, index) => (
                              <tr key={index} className="transition-colors hover:bg-emerald-50/40">
                                <td className="px-3 py-2.5 text-slate-800 font-medium">{item.productName}</td>
                                <td className="px-3 py-2.5 text-right text-slate-600">{item.quantity}</td>
                                <td className="px-3 py-2.5 text-right text-slate-600">{Number(item.unitPrice || 0).toFixed(2)}</td>
                                <td className="px-3 py-2.5 text-right font-bold text-slate-900">{Number(item.total || 0).toFixed(2)}</td>
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
                    ) : (
                      <div className="rounded-xl border border-dashed border-emerald-200 bg-white px-5 py-6 text-center text-[13px] text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium">No items added yet.</p>
                        <p className="text-[10px] text-slate-300 mt-1">Use the form above to add line items.</p>
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
                      <label className={labelClass}>Subtotal (Rs)</label>
                      <input
                        type="number"
                        value={Number(formData.subtotal || 0)}
                        readOnly
                        className="w-full rounded-lg border border-gray-300 bg-purple-50 px-2.5 py-1.5 text-[13px] font-semibold text-gray-700"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Total Amount (Rs)</label>
                      <input
                        type="number"
                        value={totalAmount}
                        readOnly
                        className="w-full rounded-lg border border-gray-300 bg-purple-50 px-2.5 py-1.5 text-[13px] font-semibold text-gray-700"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Amount Paid Now (Rs)</label>
                      <input
                        type="number"
                        name="paidAmount"
                        value={formData.paidAmount}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className={`${inputClass} focus:ring-purple-500`}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Balance (Rs)</label>
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
                      <label className={labelClass}>Payment Mode</label>
                      <select
                        name="paymentMode"
                        value={formData.paymentMode}
                        onChange={handleInputChange}
                        onKeyDown={handleSelectEnterMoveNext}
                        className={`${inputClass} focus:ring-purple-500`}
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Item Count</label>
                      <div className="flex min-h-[36px] items-center rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] font-semibold text-gray-700">
                        <ShoppingCart className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
                        {formData.items.length} item(s)
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className={labelClass}>Notes</label>
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
                form="sales-form"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-6"
              >
                {loading ? 'Saving...' : editingId ? 'Update Sale' : 'Save Sale'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
