import VoucherRegisterPage from '../components/VoucherRegisterPage';

export default function StockAdjustmentVoucher() {
  return (
    <VoucherRegisterPage
      title="Stock Adjustment Voucher"
      endpoint="/stock-adjustment-vouchers"
      addButtonLabel="+ Add Stock Adjustment Voucher"
      fieldDefinitions={[
        { name: 'stockItem', label: 'Stock Item', required: true },
        {
          name: 'adjustmentType',
          label: 'Adjustment Type',
          required: true,
          type: 'select',
          options: [
            { label: 'Add Stock', value: 'add' },
            { label: 'Subtract Stock', value: 'subtract' }
          ]
        },
        { name: 'quantity', label: 'Quantity', required: true, type: 'number', step: '0.000001', min: '0.000001' }
      ]}
      buttonClassName="bg-indigo-600 hover:bg-indigo-700"
      accountPreview={(item) => `${item.stockItem || '-'} | ${item.adjustmentType || '-'} | Qty: ${item.quantity || '-'}`}
    />
  );
}
