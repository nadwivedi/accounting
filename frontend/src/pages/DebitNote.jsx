import VoucherRegisterPage from '../components/VoucherRegisterPage';

export default function DebitNote() {
  return (
    <VoucherRegisterPage
      title="Debit Note Voucher"
      endpoint="/debit-notes"
      addButtonLabel="+ Add Debit Note"
      partyRequired
      fieldDefinitions={[
        { name: 'debitAccount', label: 'Debit Account', required: true }
      ]}
      buttonClassName="bg-orange-600 hover:bg-orange-700"
      accountPreview={(item) => `Dr: ${item.debitAccount || '-'}`}
    />
  );
}
