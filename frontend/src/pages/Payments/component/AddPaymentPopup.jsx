import { Building2, Wallet } from 'lucide-react';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';

export default function AddPaymentPopup({
  showForm,
  loading,
  formData,
  parties,
  partySectionRef,
  partyQuery,
  partyListIndex,
  filteredParties,
  isPartySectionActive,
  purchaseOptions,
  purchasePaymentMap,
  setFormData,
  setPartyListIndex,
  setIsPartySectionActive,
  getPartyDisplayName,
  handleCloseForm,
  handleSubmit,
  handleChange,
  handlePartyFocus,
  handlePartyInputChange,
  handlePartyInputKeyDown,
  selectParty
}) {
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[1.5px] sm:p-4" onClick={handleCloseForm}>
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/15 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-2 text-white md:px-4 md:py-2.5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/20 text-white ring-1 ring-white/30">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold md:text-2xl">
                New Payment
                <span className="ml-2 text-sm font-medium text-slate-200 md:text-base">Money Paid to Supplier</span>
              </h2>
              <p className="mt-1 text-xs text-cyan-100 md:text-sm">Capture supplier payment, bill reference, and payment method in one flow.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseForm}
            className="rounded-lg p-1.5 text-white transition hover:bg-white/25 md:p-2"
            aria-label="Close popup"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          id="payment-form"
          onSubmit={handleSubmit}
          onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)}
          className="flex flex-col overflow-y-auto"
        >
          <div className="p-2.5 md:p-4">
            <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800 md:mb-4 md:text-lg">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white md:h-8 md:w-8 md:text-sm">1</span>
                Payment Details
              </h3>

              <div className="grid grid-cols-1 gap-3 md:gap-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="relative space-y-1">
                    <label htmlFor="payment-party" className="block text-xs font-semibold text-gray-700 md:text-sm">
                      Party
                    </label>
                    <div
                      ref={partySectionRef}
                      className="relative"
                      onFocusCapture={handlePartyFocus}
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (partySectionRef.current && nextFocused instanceof Node && partySectionRef.current.contains(nextFocused)) return;
                        setIsPartySectionActive(false);
                      }}
                    >
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
                        <input
                          id="payment-party"
                          type="text"
                          value={partyQuery}
                          onChange={handlePartyInputChange}
                          onKeyDown={handlePartyInputKeyDown}
                          className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 pl-9 text-sm font-medium text-gray-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          placeholder="Type to search party..."
                          autoComplete="off"
                        />
                      </div>

                      {isPartySectionActive && (
                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                          <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Party List</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                              {filteredParties.length}
                            </span>
                          </div>
                          <div className="max-h-64 overflow-y-auto py-1">
                            {filteredParties.length === 0 ? (
                              <div className="px-3 py-3 text-center text-sm text-slate-500">
                                No matching parties found.
                              </div>
                            ) : (
                              filteredParties.map((party, index) => {
                                const isActive = index === partyListIndex;
                                const isSelected = String(formData.party || '') === String(party._id);

                                return (
                                  <button
                                    key={party._id}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setPartyListIndex(index)}
                                    onClick={() => {
                                      selectParty(party);
                                      setIsPartySectionActive(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                                      isActive
                                        ? 'bg-yellow-200 text-amber-950'
                                        : isSelected
                                        ? 'bg-yellow-50 text-amber-800'
                                        : 'text-slate-700 hover:bg-amber-50'
                                    }`}
                                  >
                                    <span className="truncate font-medium">{getPartyDisplayName(party)}</span>
                                    {isSelected && (
                                      <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                        Selected
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <label htmlFor="payment-amount" className="shrink-0 text-xs font-semibold text-gray-700 md:w-36 md:text-sm">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="payment-amount"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      step="0.01"
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm font-bold text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Enter payment amount"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <label htmlFor="payment-date" className="shrink-0 text-xs font-semibold text-gray-700 md:w-36 md:text-sm">
                      Date
                    </label>
                    <input
                      id="payment-date"
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleChange}
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <label htmlFor="payment-method" className="shrink-0 text-xs font-semibold text-gray-700 md:w-36 md:text-sm">
                      Method
                    </label>
                    <select
                      id="payment-method"
                      name="method"
                      value={formData.method}
                      onChange={handleChange}
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <label htmlFor="payment-ref-type" className="shrink-0 text-xs font-semibold text-gray-700 md:w-36 md:text-sm">
                      Payment Type
                    </label>
                    <select
                      id="payment-ref-type"
                      name="refType"
                      value={formData.refType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, refType: e.target.value, refId: '' }))}
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="none">On Account</option>
                      <option value="purchase">Against Purchase Bill</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <label htmlFor="payment-ref-id" className="shrink-0 text-xs font-semibold text-gray-700 md:w-36 md:text-sm">
                      Purchase Bill
                    </label>
                    <select
                      id="payment-ref-id"
                      name="refId"
                      value={formData.refId}
                      onChange={handleChange}
                      disabled={formData.refType !== 'purchase'}
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">Select purchase bill</option>
                      {purchaseOptions.map((purchase) => {
                        const pendingAmount = Math.max(
                          0,
                          Number(purchase.totalAmount || 0) - Number(purchasePaymentMap.get(String(purchase._id)) || 0)
                        );

                        return (
                          <option key={purchase._id} value={purchase._id}>
                            {purchase.supplierInvoice || purchase.invoiceNo || purchase.invoiceNumber || '-'} - {purchase.party?.partyName || '-'} - Pending Rs {pendingAmount.toFixed(2)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3">
                  <label htmlFor="payment-notes" className="shrink-0 pt-0.5 text-xs font-semibold text-gray-700 md:w-36 md:text-sm">
                    Notes
                  </label>
                  <textarea
                    id="payment-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                    className="min-w-0 flex-1 resize-none rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Optional note"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-3 py-2.5 md:flex-row md:px-4 md:py-3">
            <div className="text-xs text-gray-600 md:text-sm">
              <kbd className="rounded bg-gray-200 px-2 py-1 font-mono text-xs">Esc</kbd> to close
            </div>

            <div className="flex w-full gap-2 md:w-auto md:gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-6"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="payment-form"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-8"
              >
                {loading ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
