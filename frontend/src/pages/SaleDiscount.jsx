import { useEffect, useMemo, useState } from 'react';
import VoucherRegisterPage from '../components/VoucherRegisterPage';
import apiClient from '../utils/api';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function SaleDiscount({ modalOnly = false, onModalFinish = null }) {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const response = await apiClient.get('/sales');
        setSales(response.data || []);
      } catch (error) {
        console.error('Error fetching sales for sale discount:', error);
        setSales([]);
      }
    };

    loadSales();
  }, []);

  const saleOptions = useMemo(() => (
    sales.map((sale) => ({
      value: sale._id,
      label: `${sale.invoiceNumber || '-'} | ${sale.customerName || 'Walk-in'} | ${formatDate(sale.saleDate)}`,
      linkedFieldValues: {
        party: sale.party?._id || sale.party || ''
      },
      linkedFieldLabels: {
        party: sale.customerName || sale.party?.name || sale.party?.partyName || 'Walk-in'
      }
    }))
  ), [sales]);

  return (
    <VoucherRegisterPage
      title="Discount After Sale"
      endpoint="/sale-discounts"
      addButtonLabel="+ Add Discount After Sale"
      modalOnly={modalOnly}
      onModalFinish={onModalFinish}
      popupVariant="payment"
      popupFieldOrder={['voucherDate', 'sale', 'party', 'amount']}
      showMethod={false}
      showReferenceNo={false}
      fieldDefinitions={[
        {
          name: 'sale',
          label: 'Sale Voucher',
          required: true,
          type: 'select',
          options: saleOptions,
          placeholder: 'Select sale invoice'
        }
      ]}
      buttonClassName="bg-violet-600 hover:bg-violet-700"
      accountPreview={(item) => {
        const invoice = item.sale?.invoiceNumber || item.sale || '-';
        return `Sale: ${invoice}`;
      }}
    />
  );
}
