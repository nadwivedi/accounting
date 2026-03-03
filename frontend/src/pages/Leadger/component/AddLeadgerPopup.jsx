import { Wallet } from 'lucide-react';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';

const getInlineFieldClass = (tone = 'indigo') => {
  const focusTone = tone === 'emerald'
    ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
    : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

  return `flex-1 min-w-0 px-3 py-2 border border-transparent rounded-lg bg-transparent text-sm font-bold text-gray-900 transition-all focus:outline-none focus:bg-white placeholder:font-normal placeholder:text-transparent focus:placeholder:text-gray-400 ${focusTone}`;
};

const getInlineTextareaClass = (tone = 'emerald') => {
  const focusTone = tone === 'emerald'
    ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
    : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

  return `flex-1 min-w-0 px-3 py-2 border border-transparent rounded-lg bg-transparent text-sm font-bold text-gray-900 transition-all resize-none focus:outline-none focus:bg-white placeholder:font-normal placeholder:text-transparent focus:placeholder:text-gray-400 ${focusTone}`;
};

export default function AddLeadgerPopup({
  showForm,
  editingId,
  loading,
  formData,
  groupQuery,
  groupListIndex,
  isGroupSectionActive,
  groupOptions,
  groupSectionRef,
  mobileInputRef,
  handleCloseForm,
  handleSubmit,
  handleChange,
  handleGroupInputChange,
  handleGroupInputKeyDown,
  setIsGroupSectionActive,
  setGroupListIndex,
  selectGroup
}) {
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[1.5px] z-50 flex items-stretch justify-start p-1.5 sm:p-2" onClick={handleCloseForm}>
      <div
        className="bg-white h-full w-full md:w-[75vw] overflow-hidden flex flex-col shadow-2xl ring-1 ring-slate-200/80 rounded-xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-2 md:px-4 md:py-2.5 text-white flex-shrink-0 border-b border-white/15">
          <div className="flex justify-between items-center">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-white/20 ring-1 ring-white/30 flex items-center justify-center text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold">{editingId ? 'Edit Ledger Account' : 'Add New Ledger Account'}</h2>
                <p className="text-cyan-100 text-xs md:text-sm mt-1">Create or update account details in a clean accounting format.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-white hover:bg-white/25 rounded-lg p-1.5 md:p-2 transition"
              aria-label="Close popup"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form
          id="ledger-form"
          onSubmit={handleSubmit}
          onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.2fr)] gap-2.5 md:gap-4 items-stretch">
              <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-205px)] bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-2.5 md:p-4">
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">1</span>
                  Ledger Details
                </h3>

                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div className="flex items-center gap-3">
                    <label htmlFor="ledger-name-input" className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">
                      Ledger Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="ledger-name-input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={getInlineFieldClass('indigo')}
                      placeholder="Enter ledger name"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="ledger-group-input" className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">
                      Under Group <span className="text-red-500">*</span>
                    </label>
                    <div
                      ref={groupSectionRef}
                      className="relative flex-1 min-w-0"
                      onFocusCapture={() => {
                        setIsGroupSectionActive(true);
                        setGroupListIndex(-1);
                      }}
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (
                          groupSectionRef.current
                          && nextFocused instanceof Node
                          && groupSectionRef.current.contains(nextFocused)
                        ) {
                          return;
                        }
                        setIsGroupSectionActive(false);
                      }}
                    >
                      <input
                        id="ledger-group-input"
                        type="text"
                        value={groupQuery}
                        onChange={handleGroupInputChange}
                        onKeyDown={handleGroupInputKeyDown}
                        className={getInlineFieldClass('indigo')}
                        placeholder="Select or type group..."
                      />

                      {isGroupSectionActive && (
                        <div className="mt-2 md:mt-0 md:fixed md:right-4 md:top-20 md:bottom-6 w-full md:w-80 z-30">
                          <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50 via-sky-50 to-white shadow-xl overflow-hidden md:h-full md:flex md:flex-col">
                            <div className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-white border-b border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-600">
                              Group List
                            </div>
                            <div className="max-h-60 md:max-h-none md:flex-1 overflow-y-auto bg-white/80">
                              {groupOptions.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-slate-500">No groups found</div>
                              ) : (
                                groupOptions.map((group, index) => {
                                  const isActive = index === groupListIndex;
                                  return (
                                    <button
                                      key={group._id}
                                      type="button"
                                      onMouseDown={(event) => event.preventDefault()}
                                      onMouseEnter={() => setGroupListIndex(index)}
                                      onClick={() => selectGroup(group, true)}
                                      className={`w-full border-b border-slate-100 last:border-b-0 px-3 py-2 text-left text-sm transition-colors ${
                                        isActive
                                          ? 'bg-yellow-300 text-black font-semibold'
                                          : 'bg-transparent text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      {group.name}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block h-full w-px bg-slate-300" aria-hidden="true"></div>

              <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-205px)] bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-xl p-2.5 md:p-4">
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">2</span>
                  Contact Details
                </h3>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3">
                    <label htmlFor="ledger-mobile-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                        <span>Mobile Number</span>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-500">(Optional)</span>
                      </span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="ledger-mobile-input"
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      ref={mobileInputRef}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className={getInlineFieldClass('emerald')}
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="ledger-email-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                        <span>Email Address</span>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-500">(Optional)</span>
                      </span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="ledger-email-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={getInlineFieldClass('emerald')}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="ledger-state-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                        <span>State</span>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-500">(Optional)</span>
                      </span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="ledger-state-input"
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={getInlineFieldClass('emerald')}
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="ledger-pincode-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                        <span>Pincode</span>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-500">(Optional)</span>
                      </span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="ledger-pincode-input"
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      className={getInlineFieldClass('emerald')}
                      placeholder="6-digit pincode"
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <label htmlFor="ledger-address-input" className="w-52 shrink-0 mt-2 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                        <span>Address</span>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-500">(Optional)</span>
                      </span>
                      <span className="ml-2">:</span>
                    </label>
                    <textarea
                      id="ledger-address-input"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={getInlineTextareaClass('emerald')}
                      placeholder="Enter full address"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="ledger-notes-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                        <span>Remarks / Notes</span>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-500">(Optional)</span>
                      </span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="ledger-notes-input"
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className={getInlineFieldClass('emerald')}
                      placeholder="Optional remarks"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-3 py-2.5 md:px-4 md:py-3 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0">
            <div className="text-xs md:text-sm text-gray-600">
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Esc</kbd> to close
            </div>

            <div className="flex gap-2 md:gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleCloseForm}
                className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="ledger-form"
                disabled={loading}
                className="flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingId ? 'Update Ledger' : 'Save Ledger'}
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
