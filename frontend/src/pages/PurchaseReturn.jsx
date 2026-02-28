import VoucherRegisterPage from '../components/VoucherRegisterPage';

export default function PurchaseReturn() {
  return (
    <VoucherRegisterPage
      title="Purchase Return Voucher"
      endpoint="/purchase-returns"
      addButtonLabel="+ Add Purchase Return"
      partyRequired
      fieldDefinitions={[
        { name: 'debitAccount', label: 'Debit Account', required: true },
        { name: 'creditAccount', label: 'Credit Account', required: true }
      ]}
      buttonClassName="bg-teal-600 hover:bg-teal-700"
      accountPreview={(item) => `Dr: ${item.debitAccount || '-'} | Cr: ${item.creditAccount || '-'}`}
    />
  );
}
