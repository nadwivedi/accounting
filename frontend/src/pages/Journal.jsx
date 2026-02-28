import VoucherRegisterPage from '../components/VoucherRegisterPage';

export default function Journal() {
  return (
    <VoucherRegisterPage
      title="Journal Voucher"
      endpoint="/journals"
      addButtonLabel="+ Add Journal Voucher"
      fieldDefinitions={[
        { name: 'debitAccount', label: 'Debit Account', required: true },
        { name: 'creditAccount', label: 'Credit Account', required: true }
      ]}
      buttonClassName="bg-amber-600 hover:bg-amber-700"
      accountPreview={(item) => `Dr: ${item.debitAccount || '-'} | Cr: ${item.creditAccount || '-'}`}
    />
  );
}
