import { useEffect, useMemo, useState } from 'react';
import VoucherRegisterPage from '../components/VoucherRegisterPage';
import apiClient from '../utils/api';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatPurchaseNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return String(value || '-').trim() || '-';
  return `Pur-${String(parsed).padStart(2, '0')}`;
};

export default function PurchaseDiscount({ modalOnly = false, onModalFinish = null }) {
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const response = await apiClient.get('/purchases');
        setPurchases(response.data || []);
      } catch (error) {
        console.error('Error fetching purchases for purchase discount:', error);
        setPurchases([]);
      }
    };

    loadPurchases();
  }, []);

  const purchaseOptions = useMemo(() => (
    purchases.map((purchase) => ({
      value: purchase._id,
      label: `${formatPurchaseNumber(purchase.purchaseNumber)} | ${purchase.party?.name || purchase.partyName || 'Party'} | ${formatDate(purchase.purchaseDate)}`,
      linkedFieldValues: {
        party: purchase.party?._id || purchase.party || ''
      },
      linkedFieldLabels: {
        party: purchase.party?.name || purchase.partyName || 'Party'
      }
    }))
  ), [purchases]);

  return (
    <VoucherRegisterPage
      title="Discount After Purchase"
      endpoint="/purchase-discounts"
      addButtonLabel="+ Add Discount After Purchase"
      modalOnly={modalOnly}
      onModalFinish={onModalFinish}
      popupVariant="payment"
      popupFieldOrder={['voucherDate', 'purchase', 'party', 'amount']}
      partyDisplayMode="readonly"
      showMethod={false}
      showReferenceNo={false}
      fieldDefinitions={[
        {
          name: 'purchase',
          label: 'Purchase Voucher',
          required: true,
          type: 'select',
          options: purchaseOptions,
          placeholder: 'Select purchase voucher'
        }
      ]}
      buttonClassName="bg-emerald-600 hover:bg-emerald-700"
      accountPreview={(item) => {
        const purchaseNumber = item.purchase?.purchaseNumber ? formatPurchaseNumber(item.purchase.purchaseNumber) : (item.purchase || '-');
        return `Purchase: ${purchaseNumber}`;
      }}
    />
  );
}
