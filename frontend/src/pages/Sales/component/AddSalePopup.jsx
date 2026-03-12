import { ShoppingCart, Building2, CalendarDays, Trash2, Plus, FileText } from 'lucide-react';
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

  // Enhanced Input Class for Professional Look
  const inputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCancel}>
      <div className="bg-slate-50 h-full w-full max-w-6xl overflow-hidden flex flex-col shadow-2xl ring-1 ring-slate-200 rounded-xl" onClick={(e) => e.stopPropagation()}>
        
        {/* --- Professional Header --- */}
        <div className="bg-slate-800 px-6 py-4 text-white flex-shrink-0 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {editingId ? 'Edit Sale Voucher' : 'New Sale Invoice'}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Fill in the details below to generate a professional invoice.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-slate-400 hover:bg-slate-700 rounded-lg p-2 transition"
              aria-label="Close popup"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* --- Main Form Body --- */}
        <form id="sales-form" onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)} className="flex flex-col flex-1 overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              
              {/* --- Left Column: Details & Items --- */}
              <div className="col-span-1 lg:col-span-8 p-6 space-y-6 bg-white">
                
                {/* Section 1: Party & Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Invoice Date</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        name="saleDate"
                        value={formData.saleDate}
                        onChange={handleInputChange}
                        autoFocus
                        inputMode="numeric"
                        placeholder="dd-mm-yyyy"
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label className={labelClass}>Customer / Party</label>
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
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={leadgerQuery}
                          onChange={handleLeadgerInputChange}
                          onKeyDown={handleLeadgerInputKeyDown}
                          className={`${inputClass} pl-9`}
                          placeholder="Type to search party..."
                        />
                      </div>

                      {isLeadgerSectionActive && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden">
                          <div className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
                            Select Party
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {filteredLeadgers.length === 0 ? (
                              <div className="px-4 py-3 text-center text-sm text-slate-500 border-t">
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
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors border-t border-slate-100 first:border-t-0 ${
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
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Section 2: Line Items */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm">Line Items</h3>
                    <span className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      {formData.items.length} Entries
                    </span>
                  </div>
                  
                  <div className="p-4">
                    {/* Add Item Input Group */}
                    <div className="grid grid-cols-12 gap-2 mb-4 items-end bg-white p-3 rounded-lg border border-dashed border-slate-300">
                      <div className="col-span-6 md:col-span-5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Product</label>
                        <select
                          value={currentItem.product}
                          onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                          onKeyDown={handleSelectEnterMoveNext}
                          className={`${inputClass} py-1.5 text-xs`}
                        >
                          <option value="">Select...</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Qty</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={currentItem.quantity}
                          onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                          className={`${inputClass} py-1.5 text-xs text-center font-mono`}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Rate</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={currentItem.unitPrice}
                          onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                          className={`${inputClass} py-1.5 text-xs text-right font-mono`}
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition"
                          title="Add Item"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Items Table */}
                    {formData.items.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-md">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider">Item</th>
                              <th className="px-3 py-2 text-right font-bold text-slate-500 uppercase tracking-wider w-16">Qty</th>
                              <th className="px-3 py-2 text-right font-bold text-slate-500 uppercase tracking-wider w-24">Rate</th>
                              <th className="px-3 py-2 text-right font-bold text-slate-500 uppercase tracking-wider w-28">Amount</th>
                              <th className="px-3 py-2 text-center w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {formData.items.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2.5 text-slate-800 font-medium">{item.productName}</td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-600">{item.quantity}</td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-600">{Number(item.unitPrice || 0).toFixed(2)}</td>
                                <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{Number(item.total || 0).toFixed(2)}</td>
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-slate-400 hover:text-red-500 transition p-1 rounded hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-md bg-white">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium">No items added yet.</p>
                        <p className="text-[10px] text-slate-300 mt-1">Use the form above to add line items.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- Right Column: Payment & Summary --- */}
              <div className="col-span-1 lg:col-span-4 bg-slate-50 p-6 space-y-6 border-t lg:border-t-0">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-200 pb-2">Payment Details</h3>
                  
                  <div>
                    <label className={labelClass}>Payment Mode</label>
                    <select
                      name="paymentMode"
                      value={formData.paymentMode}
                      onChange={handleInputChange}
                      onKeyDown={handleSelectEnterMoveNext}
                      className={inputClass}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Amount Received</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">Rs</span>
                      <input
                        type="number"
                        name="paidAmount"
                        value={formData.paidAmount}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className={`${inputClass} pl-10 font-mono text-right font-semibold`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Summary</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-mono text-slate-700">{formData.subtotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-dashed border-slate-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-800 uppercase">Total</span>
                        <span className="font-mono text-lg font-bold text-blue-600">
                          {formData.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Balance Logic */}
                    {(formData.paidAmount > 0 || formData.totalAmount - formData.paidAmount !== 0) && (
                      <div className={`mt-3 p-3 rounded-md border ${
                        (formData.totalAmount - formData.paidAmount) <= 0 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-bold uppercase ${
                            (formData.totalAmount - formData.paidAmount) <= 0 
                            ? 'text-green-700' 
                            : 'text-amber-700'
                          }`}>
                            {(formData.totalAmount - formData.paidAmount) <= 0 ? 'Paid in Full' : 'Balance Due'}
                          </span>
                          <span className={`font-mono font-bold ${
                            (formData.totalAmount - formData.paidAmount) <= 0 
                            ? 'text-green-700' 
                            : 'text-amber-700'
                          }`}>
                            {Math.abs(formData.totalAmount - formData.paidAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Notes / Memo</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className={`${inputClass} resize-none h-20`}
                    placeholder="Private notes regarding this transaction..."
                  />
                </div>
              </div>

            </div>
          </div>

          {/* --- Footer --- */}
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center gap-4 flex-shrink-0">
            <div className="text-xs text-slate-400 hidden md:block">
              Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-sm">Esc</kbd> to cancel
            </div>

            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="sales-form"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingId ? 'Update Invoice' : 'Save Invoice'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
