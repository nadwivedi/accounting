import { Building2, CalendarDays, Wallet } from 'lucide-react';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../../../utils/useFloatingDropdownPosition';

export default function AddPaymentPopup({
  showForm,
  loading,
  formData,
  parties,
  paymentAccountOptions,
  paymentAccountSectionRef,
  partySectionRef,
  paymentAccountQuery,
  partyQuery,
  paymentAccountListIndex,
  partyListIndex,
  filteredPaymentAccounts,
  filteredParties,
  isPaymentAccountSectionActive,
  isPartySectionActive,
  purchaseOptions,
  purchasePaymentMap,
  setFormData,
  setPaymentAccountListIndex,
  setPartyListIndex,
  setIsPaymentAccountSectionActive,
  setIsPartySectionActive,
  getPartyDisplayName,
  handleCloseForm,
  handleSubmit,
  handleChange,
  handlePaymentDateBlur,
  handlePaymentAccountFocus,
  handlePartyFocus,
  handlePaymentAccountInputChange,
  handlePartyInputChange,
  handlePaymentAccountInputKeyDown,
  handlePartyInputKeyDown,
  selectPaymentAccount,
  selectParty
}) {
  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-800 focus:border-transparent focus:outline-none focus:ring-2';
  const partyDropdownStyle = useFloatingDropdownPosition(partySectionRef, isPartySectionActive, [filteredParties.length, partyListIndex]);
  const paymentAccountDropdownStyle = useFloatingDropdownPosition(paymentAccountSectionRef, isPaymentAccountSectionActive, [filteredPaymentAccounts.length, paymentAccountListIndex]);

  if (!showForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-[1.5px] md:p-4" onClick={handleCloseForm}>
      <div
        className="flex max-h-[78vh] w-full max-w-[32rem] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-white md:px-4 md:py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold md:text-xl">
                New Payment
                <span className="ml-2 text-sm font-medium text-slate-200 md:text-base">Money Paid</span>
              </h2>
              <p className="mt-1 text-xs text-cyan-100 md:text-sm">
                Capture supplier payment and choose the payment account in one flow.
              </p>
            </div>
          
          <button
            type="button"
            onClick={handleCloseForm}
            className="rounded-lg p-1.5 text-white transition hover:bg-white/20"
            aria-label="Close popup"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          </div>
        </div>

        <form
          id="payment-form"
          onSubmit={handleSubmit}
          onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)}
          className="flex flex-col overflow-hidden"
        >
          <div className="overflow-y-auto p-2.5 md:p-4">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-800 md:mb-3 md:text-base">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white md:h-6 md:w-6 md:text-xs">1</span>
                  Payment Details
                </h3>

                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">Payment Date</label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
                      <input
                        id="payment-date"
                        type="text"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleChange}
                        onBlur={handlePaymentDateBlur}
                        className={`${inputClass} pl-10 focus:ring-indigo-500`}
                        placeholder="DD/MM/YYYY"
                        inputMode="numeric"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="payment-amount"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      step="0.01"
                      className={`${inputClass} font-semibold focus:ring-indigo-500`}
                      placeholder="Enter payment amount"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label htmlFor="payment-party" className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                      Party Name
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
                          className={`${inputClass} pl-9 focus:ring-indigo-500`}
                          placeholder="Type to search party..."
                          autoComplete="off"
                        />
                      </div>

                      {isPartySectionActive && partyDropdownStyle && (
                        <div
                          className="fixed z-[80] overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                          style={partyDropdownStyle}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Party List</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                              {filteredParties.length}
                            </span>
                          </div>
                          <div className="overflow-y-auto py-1" style={{ maxHeight: partyDropdownStyle.maxHeight }}>
                            {filteredParties.length === 0 ? (
                              <div className="px-3 py-3 text-center text-[13px] text-slate-500">
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
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition ${
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

                  <div className="relative">
                    <label htmlFor="payment-method" className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                      Payment Account
                    </label>
                    <div
                      ref={paymentAccountSectionRef}
                      className="relative"
                      onFocusCapture={handlePaymentAccountFocus}
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (paymentAccountSectionRef.current && nextFocused instanceof Node && paymentAccountSectionRef.current.contains(nextFocused)) return;
                        setIsPaymentAccountSectionActive(false);
                      }}
                    >
                      <div className="relative">
                        <Wallet className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
                        <input
                          id="payment-method"
                          type="text"
                          value={paymentAccountQuery}
                          onChange={handlePaymentAccountInputChange}
                          onKeyDown={handlePaymentAccountInputKeyDown}
                          className={`${inputClass} pl-9 focus:ring-indigo-500`}
                          placeholder="Type to search account..."
                          autoComplete="off"
                        />
                      </div>

                      {isPaymentAccountSectionActive && paymentAccountDropdownStyle && (
                        <div
                          className="fixed z-[80] overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                          style={paymentAccountDropdownStyle}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700">Accounts</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700 shadow-sm">
                              {filteredPaymentAccounts.length}
                            </span>
                          </div>
                          <div className="overflow-y-auto py-1" style={{ maxHeight: paymentAccountDropdownStyle.maxHeight }}>
                            {filteredPaymentAccounts.length === 0 ? (
                              <div className="px-3 py-3 text-center text-[13px] text-slate-500">
                                No matching accounts found.
                              </div>
                            ) : (
                              filteredPaymentAccounts.map((accountName, index) => {
                                const isActive = index === paymentAccountListIndex;
                                const isSelected = formData.method === accountName;

                                return (
                                  <button
                                    key={accountName}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setPaymentAccountListIndex(index)}
                                    onClick={() => {
                                      selectPaymentAccount(accountName);
                                      setIsPaymentAccountSectionActive(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition ${
                                      isActive
                                        ? 'bg-indigo-200 text-indigo-950'
                                        : isSelected
                                        ? 'bg-indigo-50 text-indigo-800'
                                        : 'text-slate-700 hover:bg-indigo-50'
                                    }`}
                                  >
                                    <span className="truncate font-medium">{accountName}</span>
                                    {isSelected && (
                                      <span className="shrink-0 rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
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

                  <div className="md:col-span-2">
                    <label htmlFor="payment-notes" className="mb-1 block text-[11px] font-semibold text-gray-700 md:text-xs">
                      Notes
                    </label>
                    <textarea
                      id="payment-notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' || event.shiftKey) return;
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }}
                      rows="3"
                      className={`${inputClass} resize-none focus:ring-indigo-500`}
                      placeholder="Optional note"
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
                onClick={handleCloseForm}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-5"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="payment-form"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-6"
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
