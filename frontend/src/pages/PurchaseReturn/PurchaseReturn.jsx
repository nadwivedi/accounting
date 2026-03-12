import { useEffect, useMemo, useState } from 'react';
import { Boxes, RotateCcw, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import { handlePopupFormKeyDown } from '../../utils/popupFormKeyboard';

const TOAST_OPTIONS = { autoClose: 1200 };

const getInitialForm = () => ({
  purchase: '',
  voucherDate: new Date().toISOString().split('T')[0],
  notes: ''
});

const getPurchaseLabel = (purchase) => {
  const invoice = String(purchase?.invoiceNo || purchase?.invoiceNumber || 'No Invoice').trim();
  const date = purchase?.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString('en-GB') : '-';
  return `${invoice} | ${date}`;
};

export default function PurchaseReturn() {
  const [entries, setEntries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(getInitialForm());
  const [returnQuantities, setReturnQuantities] = useState({});

  useEffect(() => {
    fetchEntries();
  }, [search]);

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      if (event.defaultPrevented || !event.altKey || event.ctrlKey || event.metaKey) return;
      if (key !== 'n') return;
      event.preventDefault();
      handleOpenForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/purchase-returns', { params: { search } });
      setEntries(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching purchase returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await apiClient.get('/purchases');
      setPurchases(response.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching purchases');
    }
  };

  const returnedMap = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      (entry.items || []).forEach((item) => {
        const key = String(item.purchaseItemId || '');
        if (!key) return;
        map.set(key, (map.get(key) || 0) + Number(item.quantity || 0));
      });
    });
    return map;
  }, [entries]);

  const selectedPurchase = useMemo(
    () => purchases.find((purchase) => String(purchase._id) === String(formData.purchase)) || null,
    [purchases, formData.purchase]
  );

  const purchaseItems = useMemo(() => {
    if (!selectedPurchase) return [];
    return (selectedPurchase.items || []).map((item) => {
      const purchaseItemId = String(item._id);
      const purchasedQty = Number(item.quantity || 0);
      const returnedQty = Number(returnedMap.get(purchaseItemId) || 0);
      const remainingQty = Math.max(0, purchasedQty - returnedQty);
      return {
        purchaseItemId,
        productId: item.product?._id || item.product,
        productName: item.productName || item.product?.name || 'Item',
        purchasedQty,
        returnedQty,
        remainingQty,
        unitPrice: Number(item.unitPrice || 0)
      };
    });
  }, [selectedPurchase, returnedMap]);

  const selectedItems = useMemo(() => (
    purchaseItems
      .map((item) => ({ ...item, quantity: Number(returnQuantities[item.purchaseItemId] || 0) }))
      .filter((item) => item.quantity > 0)
  ), [purchaseItems, returnQuantities]);

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalReturnedAmount = entries.reduce((sum, entry) => sum + Number(entry.totalAmount || 0), 0);

  const handleOpenForm = () => {
    setFormData(getInitialForm());
    setReturnQuantities({});
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(getInitialForm());
    setReturnQuantities({});
  };

  const handleQuantityChange = (purchaseItemId, value, maxQty) => {
    const normalized = String(value || '').replace(/[^\d.]/g, '');
    const parsed = Number(normalized);
    if (!normalized) {
      setReturnQuantities((prev) => ({ ...prev, [purchaseItemId]: '' }));
      return;
    }
    if (!Number.isFinite(parsed)) return;
    const safeValue = Math.max(0, Math.min(parsed, maxQty));
    setReturnQuantities((prev) => ({ ...prev, [purchaseItemId]: String(safeValue) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.purchase) {
      setError('Purchase invoice is required');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Select at least one item and quantity to return');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post('/purchase-returns', {
        purchase: formData.purchase,
        voucherDate: formData.voucherDate,
        notes: formData.notes,
        items: selectedItems.map((item) => ({
          purchaseItemId: item.purchaseItemId,
          quantity: item.quantity
        }))
      });

      toast.success('Purchase return voucher created successfully', TOAST_OPTIONS);
      handleCloseForm();
      fetchEntries();
      fetchPurchases();
      setError('');
    } catch (err) {
      setError(err.message || 'Error creating purchase return voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-3 pb-8 pt-4 md:px-4 lg:px-6 lg:pt-4">
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="mb-5 mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Purchase Return Count</p>
                <p className="mt-1 text-base font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl">{entries.length}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 sm:flex"><Boxes className="h-6 w-6" /></div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80 sm:h-1"></div>
          </div>
          <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md sm:rounded-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">Return Amount</p>
                <p className="mt-1 text-[11px] font-bold leading-tight text-slate-800 sm:mt-2 sm:text-2xl"><span className="mr-1 text-[10px] font-medium text-slate-400 sm:text-base">Rs</span>{totalReturnedAmount.toFixed(2)}</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 sm:flex"><RotateCcw className="h-6 w-6" /></div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 sm:h-1"></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[22%] lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search purchase returns..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <button onClick={handleOpenForm} className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900">+ Add Purchase Return</button>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm whitespace-nowrap">
                  <thead className="bg-[linear-gradient(135deg,#0f766e_0%,#0d9488_38%,#0891b2_72%,#0284c7_100%)] text-white">
                    <tr>
                      <th className="border-y-2 border-l-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Voucher No</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Purchase ID</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Party</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-sm font-semibold">Returned Items</th>
                      <th className="border-y-2 border-r border-black px-4 py-3.5 text-center text-sm font-semibold">Date</th>
                      <th className="border-y-2 border-r-2 border-black px-4 py-3.5 text-center text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)] text-slate-600">
                    {entries.map((entry) => (
                      <tr key={entry._id} className="transition-colors duration-150 hover:bg-slate-200/45">
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-slate-800">{entry.voucherNumber || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.purchase?.invoiceNo || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.party?.name || '-'}</td>
                        <td className="border border-slate-400 px-4 py-3"><div className="max-w-[24rem] truncate">{(entry.items || []).map((item) => `${item.productName} (${item.quantity})`).join(', ') || '-'}</div></td>
                        <td className="border border-slate-400 px-4 py-3 text-center">{entry.voucherDate ? new Date(entry.voucherDate).toLocaleDateString('en-GB') : '-'}</td>
                        <td className="border border-slate-400 px-4 py-3 text-center font-semibold text-emerald-700">Rs {Number(entry.totalAmount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {!entries.length && <tr><td colSpan="6" className="border border-slate-400 px-6 py-10 text-center text-slate-500">No purchase returns found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/60 p-1.5 backdrop-blur-[1.5px] sm:p-2" onClick={handleCloseForm}>
            <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80 md:w-[78vw] md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex shrink-0 items-center justify-between border-b border-white/15 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 px-3 py-2 text-white md:px-4 md:py-2.5">
                <div>
                  <h2 className="text-lg font-bold md:text-2xl">Purchase Return Voucher</h2>
                  <p className="mt-1 text-xs text-cyan-100 md:text-sm">Select a purchase invoice, choose the returned items, and enter return quantities.</p>
                </div>
                <button type="button" onClick={handleCloseForm} className="rounded-lg p-1.5 text-white transition hover:bg-white/25 md:p-2" aria-label="Close popup">&times;</button>
              </div>

              <form onSubmit={handleSubmit} onKeyDown={(e) => handlePopupFormKeyDown(e, handleCloseForm)} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2.5 md:p-4">
                  <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-[minmax(0,0.95fr)_1px_minmax(0,1.35fr)]">
                    <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 md:p-4">
                      <h3 className="mb-4 text-base font-bold text-gray-800 md:text-lg">Voucher Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Purchase Invoice *</label>
                          <select name="purchase" value={formData.purchase} onChange={(e) => { setFormData((prev) => ({ ...prev, purchase: e.target.value })); setReturnQuantities({}); }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                            <option value="">Select purchase invoice</option>
                            {purchases.map((purchase) => (
                              <option key={purchase._id} value={purchase._id}>{getPurchaseLabel(purchase)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Voucher Date</label>
                          <input type="date" name="voucherDate" value={formData.voucherDate} onChange={(e) => setFormData((prev) => ({ ...prev, voucherDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Notes</label>
                          <textarea name="notes" value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} rows="4" className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Reason for return, damaged items, supplier confirmation, etc." />
                        </div>
                        {selectedPurchase && (
                          <div className="rounded-2xl border border-indigo-200 bg-white/80 p-4 text-sm shadow-sm">
                            <p><span className="font-semibold text-slate-700">Party:</span> {selectedPurchase.party?.name || '-'}</p>
                            <p className="mt-2"><span className="font-semibold text-slate-700">Purchase Date:</span> {selectedPurchase.purchaseDate ? new Date(selectedPurchase.purchaseDate).toLocaleDateString('en-GB') : '-'}</p>
                            <p className="mt-2"><span className="font-semibold text-slate-700">Original Amount:</span> Rs {Number(selectedPurchase.totalAmount || 0).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="hidden w-px bg-slate-300 lg:block" aria-hidden="true"></div>

                    <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 md:p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-gray-800 md:text-lg">Return Items</h3>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">Selected: {selectedItems.length}</div>
                      </div>

                      {!selectedPurchase ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center text-slate-500">Select a purchase invoice to load purchased items.</div>
                      ) : (
                        <div className="space-y-3">
                          {purchaseItems.map((item) => (
                            <div key={item.purchaseItemId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800">{item.productName}</p>
                                  <p className="mt-1 text-xs text-slate-500">Purchased: {item.purchasedQty} | Already Returned: {item.returnedQty} | Returnable: {item.remainingQty}</p>
                                  <p className="mt-1 text-xs font-semibold text-emerald-700">Rate: Rs {item.unitPrice.toFixed(2)}</p>
                                </div>
                                <div className="w-full lg:w-40">
                                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Return Qty</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.remainingQty}
                                    step="0.01"
                                    value={returnQuantities[item.purchaseItemId] || ''}
                                    onChange={(e) => handleQuantityChange(item.purchaseItemId, e.target.value, item.remainingQty)}
                                    disabled={item.remainingQty <= 0}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                                    placeholder={item.remainingQty > 0 ? '0' : 'Fully returned'}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-3 py-2.5 md:flex-row md:px-4 md:py-3">
                  <div className="text-sm font-semibold text-slate-700">Return Total: <span className="text-emerald-700">Rs {totalAmount.toFixed(2)}</span></div>
                  <div className="flex w-full gap-2 md:w-auto md:gap-3">
                    <button type="button" onClick={handleCloseForm} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100 md:flex-none md:px-6">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:flex-none md:px-8">{saving ? 'Saving...' : 'Save Purchase Return'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
