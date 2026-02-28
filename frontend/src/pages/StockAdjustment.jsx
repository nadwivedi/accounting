import { useEffect, useMemo, useState } from 'react';
import VoucherRegisterPage from '../components/VoucherRegisterPage';
import apiClient from '../utils/api';

export default function StockAdjustment() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/products');
        setProducts(response.data || []);
      } catch (error) {
        console.error('Error fetching stock items for stock adjustment:', error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  const stockOptions = useMemo(() => (
    products.map((product) => ({
      label: product.name,
      value: product.name
    }))
  ), [products]);

  return (
    <VoucherRegisterPage
      title="Stock Adjustment"
      endpoint="/stock-adjustments"
      addButtonLabel="+ Add Stock Adjustment"
      showParty={false}
      showAmount={false}
      showMethod={false}
      showReferenceNo={false}
      staticPayload={{ adjustmentType: 'subtract' }}
      fieldDefinitions={[
        {
          name: 'stockItem',
          label: 'Stock Item',
          required: true,
          type: 'select',
          options: stockOptions,
          placeholder: 'Select stock item'
        },
        {
          name: 'quantity',
          label: 'Quantity',
          required: true,
          type: 'number',
          step: '0.000001',
          min: '0.000001'
        },
        {
          name: 'reason',
          label: 'Reason',
          required: true,
          type: 'select',
          options: [
            { label: 'Loss due to expiry date', value: 'Loss due to expiry date' },
            { label: 'Theft loss', value: 'Theft loss' },
            { label: 'Other losses', value: 'Other losses' }
          ],
          placeholder: 'Select reason'
        }
      ]}
      buttonClassName="bg-indigo-600 hover:bg-indigo-700"
      accountPreview={(item) => `${item.stockItem || '-'} | Qty: ${item.quantity || '-'} | ${item.reason || '-'}`}
    />
  );
}
