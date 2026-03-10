import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';

const TYPE_OPTIONS = [
  {
    value: 'supplier',
    label: 'Supplier',
    description: 'Use for purchase parties and payable accounts.'
  },
  {
    value: 'customer',
    label: 'Customer',
    description: 'Use for sales parties and receivable accounts.'
  }
];

const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([disabled]):not([readonly])',
  'select:not([disabled]):not([readonly])',
  'textarea:not([disabled]):not([readonly])'
].join(', ');

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

const isVisibleField = (element) => {
  if (!element) return false;
  if (element.tabIndex === -1) return false;

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

const getFormFields = (form) => (
  Array.from(form.querySelectorAll(FIELD_SELECTOR)).filter(isVisibleField)
);

const focusNextField = (currentElement) => {
  if (!(currentElement instanceof HTMLElement)) return;

  const form = currentElement.closest('form');
  if (!form) return;

  const fields = getFormFields(form);
  const currentIndex = fields.indexOf(currentElement);
  if (currentIndex === -1) return;

  const nextField = fields[currentIndex + 1];
  if (!(nextField instanceof HTMLElement)) return;

  nextField.focus();
  if (nextField instanceof HTMLInputElement && typeof nextField.select === 'function') {
    nextField.select();
  }
};

const getTypeLabel = (typeValue) => (
  TYPE_OPTIONS.find((option) => option.value === typeValue)?.label || ''
);

export default function AddPartyPopup({
  showForm,
  editingId,
  loading,
  formData,
  handleCloseForm,
  handleSubmit,
  handleChange
}) {
  const [typeQuery, setTypeQuery] = useState('');
  const [typeListIndex, setTypeListIndex] = useState(0);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeSectionRef = useRef(null);
  const typeInputRef = useRef(null);

  const filteredTypeOptions = useMemo(() => {
    const normalized = String(typeQuery || '').trim().toLowerCase();
    if (!normalized) return TYPE_OPTIONS;

    const startsWith = TYPE_OPTIONS.filter((option) => option.label.toLowerCase().startsWith(normalized));
    const includes = TYPE_OPTIONS.filter((option) => (
      !option.label.toLowerCase().startsWith(normalized)
      && option.label.toLowerCase().includes(normalized)
    ));

    return [...startsWith, ...includes];
  }, [typeQuery]);

  useEffect(() => {
    if (!showForm) {
      setTypeQuery('');
      setTypeListIndex(0);
      setIsTypeDropdownOpen(false);
      return;
    }

    const nextLabel = getTypeLabel(formData.type);
    setTypeQuery(nextLabel);
    setTypeListIndex(Math.max(
      TYPE_OPTIONS.findIndex((option) => option.value === formData.type),
      0
    ));
  }, [showForm, formData.type]);

  useEffect(() => {
    if (filteredTypeOptions.length === 0) {
      setTypeListIndex(-1);
      return;
    }

    setTypeListIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredTypeOptions.length) return filteredTypeOptions.length - 1;
      return prev;
    });
  }, [filteredTypeOptions]);

  if (!showForm) return null;

  const setTypeValue = (value) => {
    handleChange({
      target: {
        name: 'type',
        value
      }
    });
  };

  const selectType = (option, moveNext = false) => {
    if (!option) return;

    setTypeValue(option.value);
    setTypeQuery(option.label);
    setTypeListIndex(Math.max(
      TYPE_OPTIONS.findIndex((item) => item.value === option.value),
      0
    ));
    setIsTypeDropdownOpen(false);

    if (moveNext) {
      focusNextField(typeInputRef.current);
    }
  };

  const handleTypeFocus = () => {
    setIsTypeDropdownOpen(true);
    setTypeQuery(getTypeLabel(formData.type));
    setTypeListIndex(Math.max(
      TYPE_OPTIONS.findIndex((option) => option.value === formData.type),
      0
    ));
  };

  const handleTypeInputChange = (event) => {
    const nextValue = event.target.value;
    setTypeQuery(nextValue);
    setIsTypeDropdownOpen(true);

    const exactMatch = TYPE_OPTIONS.find(
      (option) => option.label.toLowerCase() === nextValue.trim().toLowerCase()
    );

    if (exactMatch) {
      setTypeValue(exactMatch.value);
    }
  };

  const handleTypeInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      setIsTypeDropdownOpen(true);
      if (filteredTypeOptions.length === 0) return;
      setTypeListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, filteredTypeOptions.length - 1);
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      setIsTypeDropdownOpen(true);
      if (filteredTypeOptions.length === 0) return;
      setTypeListIndex((prev) => {
        if (prev < 0) return 0;
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      if (!isTypeDropdownOpen) {
        setIsTypeDropdownOpen(true);
        return;
      }

      const activeOption = typeListIndex >= 0 ? filteredTypeOptions[typeListIndex] : null;
      const exactMatch = TYPE_OPTIONS.find(
        (option) => option.label.toLowerCase() === typeQuery.trim().toLowerCase()
      );
      const matchedOption = activeOption || exactMatch || filteredTypeOptions[0] || null;

      if (matchedOption) {
        selectType(matchedOption, true);
      }
      return;
    }

    if (event.key === 'Escape' && isTypeDropdownOpen) {
      event.preventDefault();
      event.stopPropagation();
      setTypeQuery(getTypeLabel(formData.type));
      setIsTypeDropdownOpen(false);
    }
  };

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
                <h2 className="text-lg md:text-2xl font-bold">{editingId ? 'Edit Party' : 'Add New Party'}</h2>
                <p className="text-cyan-100 text-xs md:text-sm mt-1">Create or update party details in a simple format.</p>
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
          id="party-form"
          onSubmit={handleSubmit}
          onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.2fr)] gap-2.5 md:gap-4 items-stretch">
              <div className="h-full min-h-[320px] lg:min-h-[calc(100vh-205px)] bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-2.5 md:p-4">
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">1</span>
                  Party Details
                </h3>

                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div className="flex items-center gap-3">
                    <label htmlFor="party-name-input" className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">
                      Party Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="party-name-input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={getInlineFieldClass('indigo')}
                      placeholder="Enter party name"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <label htmlFor="party-type-input" className="w-28 shrink-0 pt-2 text-xs md:text-sm font-semibold text-gray-700 mb-0">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <div
                      ref={typeSectionRef}
                      className="relative flex-1 min-w-0"
                      onBlurCapture={(event) => {
                        const nextFocused = event.relatedTarget;
                        if (
                          typeSectionRef.current
                          && nextFocused instanceof Node
                          && typeSectionRef.current.contains(nextFocused)
                        ) {
                          return;
                        }

                        setTypeQuery(getTypeLabel(formData.type));
                        setIsTypeDropdownOpen(false);
                      }}
                    >
                      <div className="relative">
                        <input
                          id="party-type-input"
                          ref={typeInputRef}
                          type="text"
                          value={typeQuery}
                          onChange={handleTypeInputChange}
                          onFocus={handleTypeFocus}
                          onKeyDown={handleTypeInputKeyDown}
                          className={`${getInlineFieldClass('indigo')} pr-10`}
                          placeholder="Choose party type"
                          autoComplete="off"
                          required
                        />
                        <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isTypeDropdownOpen && (
                        <div className="mt-2 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-xl md:absolute md:left-0 md:right-0 md:top-[calc(100%+12px)] md:z-30 md:h-[42vh]">
                          <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                            Party Type List
                          </div>
                          <div className="grid h-[18rem] grid-rows-2 gap-3 p-3 md:h-[calc(42vh-53px)]">
                            {(filteredTypeOptions.length > 0 ? filteredTypeOptions : TYPE_OPTIONS).map((option, index) => {
                              const isActive = index === typeListIndex;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onMouseEnter={() => setTypeListIndex(index)}
                                  onClick={() => selectType(option, true)}
                                  className={`flex h-full flex-col items-start justify-between rounded-2xl border px-4 py-4 text-left transition ${
                                    isActive
                                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg'
                                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <div>
                                    <p className="text-lg font-bold tracking-wide">{option.label}</p>
                                    <p className={`mt-2 text-sm leading-6 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                                      {option.description}
                                    </p>
                                  </div>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                    isActive ? 'bg-white/15 text-white' : 'bg-white text-indigo-600'
                                  }`}>
                                    Press Enter
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="party-notes-input" className="w-28 shrink-0 text-xs md:text-sm font-semibold text-gray-700 mb-0">
                      Notes
                    </label>
                    <input
                      id="party-notes-input"
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className={getInlineFieldClass('indigo')}
                      placeholder="Optional remarks"
                    />
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
                    <label htmlFor="party-mobile-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span>Mobile Number</span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="party-mobile-input"
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className={getInlineFieldClass('emerald')}
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="party-email-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span>Email Address</span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="party-email-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={getInlineFieldClass('emerald')}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="party-state-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span>State</span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="party-state-input"
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={getInlineFieldClass('emerald')}
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="party-pincode-input" className="w-52 shrink-0 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span>Pincode</span>
                      <span className="ml-2">:</span>
                    </label>
                    <input
                      id="party-pincode-input"
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
                    <label htmlFor="party-address-input" className="w-52 shrink-0 mt-2 mb-0 flex items-baseline justify-between text-xs md:text-sm font-semibold text-gray-700">
                      <span>Address</span>
                      <span className="ml-2">:</span>
                    </label>
                    <textarea
                      id="party-address-input"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={getInlineTextareaClass('emerald')}
                      placeholder="Enter full address"
                      rows={2}
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
                form="party-form"
                disabled={loading}
                className="flex-1 md:flex-none px-6 md:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingId ? 'Update Party' : 'Save Party'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
