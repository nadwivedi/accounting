import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Receipt, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/api';
import { getBankDisplayName, normalizeBankName } from '../../utils/bankAccounts';
import AddReceiptPopup from './component/AddReceiptPopup';

const buildSaleReceiptMap = (receipts) => {
  const map = new Map();

  (receipts || [])
    .filter((receipt) => receipt.refType === 'sale' && receipt.refId)
    .forEach((receipt) => {
      const key = String(receipt.refId);
      map.set(key, (map.get(key) || 0) + Number(receipt.amount || 0));
    });

  return map;
};

const getInitialForm = (defaultMethod = 'Cash Account') => ({
  party: '',
  amount: '',
  method: defaultMethod,
  receiptDate: new Date().toISOString().split('T')[0],
  notes: '',
  refType: 'none',
  refId: ''
});
const TOAST_OPTIONS = { autoClose: 1200 };

const getReceiptAccountOptions = (banks = []) => {
  const uniqueNames = banks
    .map((bank) => getBankDisplayName(bank))
    .filter((name, index, values) => name && values.indexOf(name) === index);

  return uniqueNames.length > 0 ? uniqueNames : ['Cash Account'];
};

const getDefaultReceiptMethod = (banks = []) => {
  const cashAccount = banks.find((bank) => normalizeBankName(bank?.name) === 'cash account');
  return getBankDisplayName(cashAccount || banks[0]) || 'Cash Account';
};

export default function Receipts({ modalOnly = false, onModalFinish = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [sales, setSales] = useState([]);
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, [search, dateFilter]);

  useEffect(() => {
    fetchParties();
    fetchAllReceipts();
    fetchSales();
    fetchBanks();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName?.toLowerCase();
      const isTypingTarget = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || event.target?.isContentEditable;
      const key = event.key?.toLowerCase();

      if (event.defaultPrevented || !event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget || showForm) return;
      if (key !== 'r') return;

      event.preventDefault();
      handleOpenForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  useEffect(() => {
    if (location.state?.openShortcut !== 'receipt' || showForm) return;

    handleOpenForm();
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, showForm]);

  useEffect(() => {
    if (!modalOnly || showForm) return;
    handleOpenForm();
  }, [modalOnly, showForm]);

  const getFromDateByFilter = () => {
    const now = new Date();
    if (dateFilter === '7d') {
      now.setDate(now.getDate() - 7);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '30d') {
      now.setDate(now.getDate() - 30);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '3m') {
      now.setMonth(now.getMonth() - 3);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '6m') {
      now.setMonth(now.getMonth() - 6);
      return now.toISOString().split('T')[0];
    }
    if (dateFilter === '1y') {
      now.setFullYear(now.getFullYear() - 1);
      return now.toISOString().split('T')[0];
    }
    return '';
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const fromDate = getFromDateByFilter();
      const response = await apiClient.get('/receipts', {
        params: {
          search,
          fromDate: fromDate || undefined
        }
      });
      setReceipts(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching receipts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReceipts = async () => {
    try {
      const response = await apiClient.get('/receipts');
      setAllReceipts(response.data || []);
    } catch (err) {
      console.error('Error fetching all receipts:', err);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await apiClient.get('/parties');
      setParties((response.data || []).filter((p) => p.type === 'customer' || p.type === 'both'));
    } catch (err) {
      console.error('Error fetching parties:', err);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await apiClient.get('/sales');
      setSales(response.data || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await apiClient.get('/banks');
      setBanks(response.data || []);
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  const saleReceiptMap = useMemo(() => buildSaleReceiptMap(allReceipts), [allReceipts]);
  const receiptAccountOptions = useMemo(() => getReceiptAccountOptions(banks), [banks]);
  const defaultReceiptMethod = useMemo(() => getDefaultReceiptMethod(banks), [banks]);

  useEffect(() => {
    setFormData((prev) => {
      const currentMethod = String(prev.method || '').trim();
      const hasMatchingAccount = receiptAccountOptions.includes(currentMethod);
      const isLegacyMethod = ['cash', 'bank', 'upi', 'card', 'credit', 'other'].includes(currentMethod.toLowerCase());

      if (currentMethod && hasMatchingAccount && !isLegacyMethod) {
        return prev;
      }

      if (currentMethod === defaultReceiptMethod) {
        return prev;
      }

      return {
        ...prev,
        method: defaultReceiptMethod
      };
    });
  }, [defaultReceiptMethod, receiptAccountOptions]);

  const saleOptions = useMemo(() => {
    if (formData.refType !== 'sale') return [];
    return sales.filter((s) => {
      if (!formData.party) return true;
      return String(s.party?._id || s.party) === String(formData.party);
    }).filter((sale) => (
      Math.max(0, Number(sale.totalAmount || 0) - Number(saleReceiptMap.get(String(sale._id)) || 0)) > 0
    ));
  }, [sales, saleReceiptMap, formData.refType, formData.party]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    setFormData(getInitialForm(defaultReceiptMethod));
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (modalOnly && typeof onModalFinish === 'function') {
      onModalFinish();
      return;
    }

    setShowForm(false);
    setFormData(getInitialForm(defaultReceiptMethod));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Valid amount is required');
      return;
    }

    if (formData.refType === 'sale' && !formData.refId) {
      setError('Select sale bill for bill-wise receipt');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/receipts', {
        party: formData.party || null,
        amount: Number(formData.amount),
        method: formData.method,
        receiptDate: formData.receiptDate ? new Date(formData.receiptDate) : new Date(),
        notes: formData.notes,
        refType: formData.refType,
        refId: formData.refType === 'sale' ? formData.refId : null
      });

      handleCloseForm();
      setError('');
      fetchReceipts();
      fetchAllReceipts();
      fetchSales();
      toast.success('Receipt created successfully', TOAST_OPTIONS);
      if (modalOnly && typeof onModalFinish === 'function') {
        onModalFinish();
      }
    } catch (err) {
      setError(err.message || 'Error creating receipt');
    } finally {
      setLoading(false);
    }
  };

  const totalReceipts = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  if (modalOnly) {
    return (
      <>
        {error && (
          <div className="fixed left-4 right-4 top-4 z-[60] rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 shadow-lg md:left-auto md:right-4 md:w-[26rem]">
            {error}
          </div>
        )}
        <AddReceiptPopup
          showForm={showForm}
          loading={loading}
          formData={formData}
          parties={parties}
          receiptAccountOptions={receiptAccountOptions}
          saleOptions={saleOptions}
          saleReceiptMap={saleReceiptMap}
          setFormData={setFormData}
          handleCloseForm={handleCloseForm}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-16 md:px-8 md:pb-8 md:pt-5">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Total Receipts</p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold text-slate-800 leading-tight">{receipts.length}</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Receipt className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
        </div>
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-tight">Amount Received</p>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-2xl font-bold text-slate-800 leading-tight">
                <span className="text-[10px] sm:text-base text-slate-400 font-medium mr-1">Rs</span>
                {totalReceipts.toFixed(2)}
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80"></div>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full md:w-56 bg-white px-4 py-2.5 text-sm border border-gray-300 rounded-lg"
        >
          <option value="">Receipt History - All Time</option>
          <option value="7d">Receipt History - 7 Days</option>
          <option value="30d">Receipt History - 30 Days</option>
          <option value="3m">Receipt History - 3 Months</option>
          <option value="6m">Receipt History - 6 Months</option>
          <option value="1y">Receipt History - 1 Year</option>
        </select>
        <button
          onClick={handleOpenForm}
          className="inline-flex flex-col items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-white shadow-sm transition hover:bg-emerald-700 whitespace-nowrap"
        >
          <span className="text-sm font-semibold">+ New Receipt</span>
          <span className="text-[11px] font-medium text-emerald-100">Money Received</span>
        </button>
      </div>

      <AddReceiptPopup
        showForm={showForm}
        loading={loading}
        formData={formData}
        parties={parties}
        receiptAccountOptions={receiptAccountOptions}
        saleOptions={saleOptions}
        saleReceiptMap={saleReceiptMap}
        setFormData={setFormData}
        handleCloseForm={handleCloseForm}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Party</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Reference</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map((receipt) => (
                <tr key={receipt._id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-slate-600 font-medium">{new Date(receipt.receiptDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{receipt.party?.partyName || '-'}</td>
                  <td className="px-6 py-4 text-emerald-600 font-semibold">Rs {Number(receipt.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200">
                      {receipt.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 whitespace-nowrap">
                      {receipt.refType === 'sale' ? 'Against Sale' : 'On Account'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">{receipt.notes || '-'}</td>
                </tr>
              ))}
              {!loading && receipts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 italic bg-slate-50/50">
                    No receipts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

