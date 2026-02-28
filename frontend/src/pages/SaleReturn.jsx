import VoucherRegisterPage from '../components/VoucherRegisterPage';

export default function SaleReturn() {
  return (
    <VoucherRegisterPage
      title="Sale Return Voucher"
      endpoint="/sale-returns"
      addButtonLabel="+ Add Sale Return"
      partyRequired
      fieldDefinitions={[
        { name: 'debitAccount', label: 'Debit Account', required: true },
        { name: 'creditAccount', label: 'Credit Account', required: true }
      ]}
      buttonClassName="bg-cyan-600 hover:bg-cyan-700"
      accountPreview={(item) => `Dr: ${item.debitAccount || '-'} | Cr: ${item.creditAccount || '-'}`}
    />
  );
}
