import { useEffect, useRef, useState } from 'react';
import { Building2, CalendarDays, Package, Upload, X, ChevronRight, Hash } from 'lucide-react';
import { handlePopupFormKeyDown } from '../../../utils/popupFormKeyboard';
import { useFloatingDropdownPosition } from '../../../utils/useFloatingDropdownPosition';

export default function AddPurchasePopup({
  showForm,
  editingId,
  loading,
  formData,
  currentItem,
  products,
  uploadingInvoice,
  leadgerSectionRef,
  leadgerInputRef,
  leadgerQuery,
  leadgerListIndex,
  filteredLeadgers,
  isLeadgerSectionActive,
  productSectionRef,
  productInputRef,
  productQuery,
  productListIndex,
  filteredProducts,
  isProductSectionActive,
  getLeadgerDisplayName,
  getProductDisplayName,
  setCurrentItem,
  setIsLeadgerSectionActive,
  setLeadgerListIndex,
  setIsProductSectionActive,
  setProductListIndex,
  handleCancel,
  handleSubmit,
  handleInputChange,
  handleLeadgerFocus,
  handleLeadgerInputChange,
  handleLeadgerInputKeyDown,
  onOpenNewParty,
  handleProductFocus,
  handleProductInputChange,
  handleProductInputKeyDown,
  onOpenNewProduct,
  handleSelectEnterMoveNext,
  handleInvoiceUpload,
  handleAddItem,
  handleRemoveItem,
  selectLeadger,
  selectProduct
}) {
  const localLeadgerInputRef = useRef(null);
  const localProductInputRef = useRef(null);
  const paidAmountInputRef = useRef(null);
  const [isItemEntryClosed, setIsItemEntryClosed] = useState(false);

  const inputClass =
    'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-800 placeholder-stone-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-150';

  const currentItemTotal = Math.max(0, Number(currentItem.quantity || 0) * Number(currentItem.unitPrice || 0));
  const resolvedLeadgerInputRef = leadgerInputRef || localLeadgerInputRef;
  const resolvedProductInputRef = productInputRef || localProductInputRef;
  const leadgerDropdownStyle = useFloatingDropdownPosition(leadgerSectionRef, isLeadgerSectionActive, [filteredLeadgers.length, leadgerListIndex]);
  const productDropdownStyle = useFloatingDropdownPosition(productSectionRef, isProductSectionActive, [filteredProducts.length, productListIndex]);

  const resolveItemUnit = (item) => {
    const itemUnit = String(item?.unit || '').trim();
    if (itemUnit) return itemUnit;
    const matchingProduct = products.find((p) => String(p?._id) === String(item?.product || ''));
    return String(matchingProduct?.unit || '').trim() || '—';
  };
  const currentItemUnit = String(currentItem.unit || '').trim() || '—';

  useEffect(() => {
    if (showForm) setIsItemEntryClosed(false);
  }, [showForm, editingId]);

  if (!showForm) return null;

  const closeItemEntryRow = () => {
    selectProduct(null);
    setCurrentItem((prev) => ({ ...prev, quantity: '', unitPrice: '' }));
    setIsProductSectionActive(false);
    setIsItemEntryClosed(true);
  };

  const closeItemEntryAndFocusPaidAmount = () => {
    closeItemEntryRow();
    requestAnimationFrame(() => {
      paidAmountInputRef.current?.focus();
      paidAmountInputRef.current?.select?.();
    });
  };

  const FieldLabel = ({ children }) => (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">{children}</p>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-2 backdrop-blur-sm md:p-6"
      onClick={handleCancel}
    >
      {/* max-w-5xl = 64rem wide popup */}
      <div
        className="flex h-[96dvh] max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-stone-50 shadow-[0_32px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER ── */}
        <div className="flex shrink-0 items-center justify-between bg-stone-900 px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-400/25">
              <Package className="h-[18px] w-[18px] text-teal-400" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold tracking-tight text-white">
                {editingId ? 'Edit Purchase' : 'New Purchase Entry'}
              </h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                {editingId ? 'Update an existing purchase record' : 'Record incoming stock & payment'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-stone-500 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => handlePopupFormKeyDown(e, handleCancel)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto">

            {/* ── SECTION 1: Purchase Details ── */}
            <div className="border-b border-stone-200 bg-white px-6 py-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-[11px] font-bold text-white">1</span>
                <h3 className="text-sm font-bold text-stone-700">Purchase Details</h3>
                <div className="h-px flex-1 bg-stone-100" />
              </div>

              {/* Row 1: Date | Party (2 cols) | Due Date */}
              <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-4">

                {/* Purchase Date */}
                <div>
                  <FieldLabel>Purchase Date</FieldLabel>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-teal-500" />
                    <input
                      type="text"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                      onKeyDown={handleSelectEnterMoveNext}
                      className={`${inputClass} pl-9`}
                      placeholder="DD-MM-YYYY"
                      inputMode="numeric"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Party Name — 2 cols */}
                <div className="relative md:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <FieldLabel>Party Name <span className="text-rose-400">*</span></FieldLabel>
                    {isLeadgerSectionActive && (
                      <button
                        type="button"
                        onClick={onOpenNewParty}
                        className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 transition hover:bg-teal-100"
                      >
                        <kbd className="font-mono text-[9px]">Ctrl</kbd> New Party
                      </button>
                    )}
                  </div>
                  <div
                    ref={leadgerSectionRef}
                    className="relative"
                    onFocusCapture={handleLeadgerFocus}
                    onBlurCapture={(event) => {
                      const nf = event.relatedTarget;
                      if (leadgerSectionRef.current && nf instanceof Node && leadgerSectionRef.current.contains(nf)) return;
                      setIsLeadgerSectionActive(false);
                    }}
                  >
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-teal-500" />
                      <input
                        ref={resolvedLeadgerInputRef}
                        type="text"
                        value={leadgerQuery}
                        onChange={handleLeadgerInputChange}
                        onKeyDown={handleLeadgerInputKeyDown}
                        className={`${inputClass} pl-9`}
                        placeholder="Search or type party name…"
                        autoComplete="off"
                        required
                      />
                    </div>
                    {isLeadgerSectionActive && leadgerDropdownStyle && (
                      <div
                        className="fixed z-[80] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl"
                        style={leadgerDropdownStyle}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-3.5 py-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Party List</span>
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600">{filteredLeadgers.length}</span>
                        </div>
                        <div className="overflow-y-auto py-1" style={{ maxHeight: leadgerDropdownStyle.maxHeight }}>
                          {filteredLeadgers.length === 0 ? (
                            <div className="px-4 py-5 text-center">
                              <p className="text-[13px] text-stone-500">No matching parties.</p>
                              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onOpenNewParty}
                                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-semibold text-teal-700 hover:bg-teal-100 transition">
                                Create New Party <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          ) : filteredLeadgers.map((l, i) => {
                            const isActive = i === leadgerListIndex;
                            const isSel = String(formData.party || '') === String(l._id);
                            return (
                              <button key={l._id} type="button" onMouseDown={(e) => e.preventDefault()}
                                onMouseEnter={() => setLeadgerListIndex(i)} onClick={() => selectLeadger(l)}
                                className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[13px] transition ${isActive ? 'bg-teal-50 text-teal-900' : isSel ? 'bg-teal-50/50 text-teal-800' : 'text-stone-700 hover:bg-stone-50'}`}>
                                <span className="truncate font-medium">{getLeadgerDisplayName(l)}</span>
                                {isSel && <span className="shrink-0 rounded-full border border-teal-200 bg-white px-2 py-0.5 text-[10px] font-bold text-teal-600">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <FieldLabel>Due Date</FieldLabel>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate || ''}
                    onChange={handleInputChange}
                    onKeyDown={handleSelectEnterMoveNext}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row 2: Supplier Invoice | Invoice Upload (wider) */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <FieldLabel>Supplier Invoice <span className="normal-case font-normal text-stone-300">(optional)</span></FieldLabel>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      name="supplierInvoice"
                      value={formData.supplierInvoice || ''}
                      onChange={handleInputChange}
                      onKeyDown={handleSelectEnterMoveNext}
                      className={`${inputClass} pl-9`}
                      placeholder="INV-0001"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <FieldLabel>Invoice File</FieldLabel>
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
                    className={`flex h-[38px] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed text-[13px] font-semibold transition-all duration-150 ${
                      uploadingInvoice
                        ? 'border-stone-200 bg-stone-50 text-stone-400 opacity-60'
                        : formData.invoiceLink
                        ? 'border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100'
                        : 'border-stone-300 bg-stone-50 text-stone-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingInvoice ? 'Uploading…' : formData.invoiceLink ? '✓ Invoice Attached' : 'Click to upload invoice (JPG, PNG, PDF)'}
                  </label>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Items Table ── */}
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500 text-[11px] font-bold text-white">2</span>
                <h3 className="text-sm font-bold text-stone-700">Purchase Items</h3>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-stone-500 shadow-sm">
                  {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
                </span>
                <div className="h-px flex-1 bg-stone-100" />
              </div>

              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]" style={{ minWidth: '680px' }}>
                    <colgroup>
                      <col style={{ width: '38%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '19%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50">
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">Product</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">Qty</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">Unit</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">Unit Price</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">

                      {/* Saved rows */}
                      {formData.items.map((item, index) => (
                        <tr key={index} className="transition-colors hover:bg-stone-50/80">
                          <td className="px-4 py-3 font-medium text-stone-800">{item.productName}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-stone-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-center text-stone-500">{resolveItemUnit(item)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-stone-600">₹{Number(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-stone-800">₹{Number(item.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}

                      {isItemEntryClosed ? (
                        <>
                          <tr className="bg-teal-50/70">
                            <td colSpan={4} className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-teal-700">
                              Total Amount
                            </td>
                            <td className="px-4 py-3 text-right text-[15px] font-bold tabular-nums text-teal-800">
                              ₹{Number(formData.totalAmount || 0).toFixed(2)}
                            </td>
                          </tr>
                          <tr className="bg-white">
                            <td colSpan={4} className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">
                              Paid Amount
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                ref={paidAmountInputRef}
                                type="number"
                                name="paymentAmount"
                                value={formData.paymentAmount}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                disabled={Boolean(editingId)}
                                className={`${inputClass} text-right tabular-nums ${Boolean(editingId) ? 'bg-stone-100 text-stone-400' : ''}`}
                                placeholder="0.00"
                              />
                            </td>
                          </tr>
                        </>
                      ) : (
                        /* Entry row */
                        <tr className="bg-amber-50/50 align-middle">

                          {/* Product search */}
                          <td className="px-3 py-3">
                            <div
                              ref={productSectionRef}
                              className="relative"
                              onFocusCapture={handleProductFocus}
                              onBlurCapture={(event) => {
                                const nf = event.relatedTarget;
                                if (productSectionRef.current && nf instanceof Node && productSectionRef.current.contains(nf)) return;
                                setIsProductSectionActive(false);
                              }}
                            >
                              <div className="relative">
                                <Package className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-500" />
                                <input
                                  ref={resolvedProductInputRef}
                                  type="text"
                                  value={productQuery}
                                  onChange={handleProductInputChange}
                                  onKeyDown={(e) => handleProductInputKeyDown(e, closeItemEntryAndFocusPaidAmount)}
                                  className={`${inputClass} border-amber-200 pl-9 focus:ring-amber-400`}
                                  placeholder="Search product…"
                                  autoComplete="off"
                                />
                              </div>

                              {isProductSectionActive && productDropdownStyle && (
                                <div
                                  className="fixed z-[80] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl"
                                  style={productDropdownStyle}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-3.5 py-2.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Products</span>
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">{filteredProducts.length}</span>
                                  </div>
                                  <div className="overflow-y-auto py-1" style={{ maxHeight: productDropdownStyle.maxHeight }}>
                                    {filteredProducts.length === 0 ? (
                                      <div className="px-4 py-5 text-center">
                                        <p className="text-[13px] text-stone-500">No matching products.</p>
                                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onOpenNewProduct}
                                          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700 hover:bg-amber-100 transition">
                                          Create New Stock <ChevronRight className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : filteredProducts.map((p, i) => {
                                      const isActive = i === productListIndex;
                                      const isSel = String(currentItem.product || '') === String(p._id);
                                      return (
                                        <button key={p._id} type="button" onMouseDown={(e) => e.preventDefault()}
                                          onMouseEnter={() => setProductListIndex(i)} onClick={() => selectProduct(p)}
                                          className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[13px] transition ${isActive ? 'bg-amber-50 text-amber-900' : isSel ? 'bg-amber-50/50' : 'text-stone-700 hover:bg-stone-50'}`}>
                                          <span className="truncate font-medium">{getProductDisplayName(p)}</span>
                                          {isSel && <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-bold text-amber-600">✓</span>}
                                        </button>
                                      );
                                    })}
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onMouseEnter={() => setProductListIndex(filteredProducts.length)}
                                      onClick={closeItemEntryAndFocusPaidAmount}
                                      className={`flex w-full items-center justify-between gap-3 border-t border-stone-100 px-3.5 py-2.5 text-[12px] font-bold transition ${productListIndex === filteredProducts.length ? 'bg-stone-100 text-stone-800' : 'text-stone-400 hover:bg-stone-50'}`}
                                    >
                                      <span>End Item Entry</span>
                                      <span className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] text-stone-500">↵ Done</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Quantity — full column width, no truncation */}
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              placeholder="0"
                              value={currentItem.quantity}
                              onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                              onKeyDown={handleSelectEnterMoveNext}
                              className={`${inputClass} border-amber-200 text-right tabular-nums focus:ring-amber-400`}
                            />
                          </td>

                          {/* Unit chip */}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center rounded-lg border border-stone-200 bg-stone-50 py-2 text-[13px] font-medium text-stone-600">
                              {currentItemUnit}
                            </div>
                          </td>

                          {/* Unit Price */}
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              placeholder="0.00"
                              value={currentItem.unitPrice}
                              onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const added = handleAddItem();
                                  if (!added) return;
                                  requestAnimationFrame(() => {
                                    resolvedProductInputRef.current?.focus();
                                    resolvedProductInputRef.current?.select?.();
                                  });
                                }
                              }}
                              className={`${inputClass} border-amber-200 text-right tabular-nums focus:ring-amber-400`}
                              step="0.01"
                            />
                          </td>

                          {/* Row total */}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-right text-[13px] font-bold tabular-nums text-amber-800">
                              ₹{currentItemTotal.toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* ── FOOTER ── */}
          <div className="flex shrink-0 items-center justify-between border-t border-stone-200 bg-white px-6 py-3.5">
            <p className="hidden text-[11px] text-stone-400 md:block">
              <kbd className="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">Esc</kbd>
              {' '}close &nbsp;·&nbsp;
              <kbd className="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">Enter</kbd>
              {' '}next field
            </p>
            <div className="flex w-full items-center justify-end gap-3 md:w-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 hover:border-stone-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-stone-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving…' : editingId ? '↑ Update Purchase' : '✓ Save Purchase'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}