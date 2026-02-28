import VoucherRegisterPage from '../components/VoucherRegisterPage';

export default function CreditNote() {
  return (
    <VoucherRegisterPage
      title="Credit Note Voucher"
      endpoint="/credit-notes"
      addButtonLabel="+ Add Credit Note"
      partyRequired
      fieldDefinitions={[
        { name: 'creditAccount', label: 'Credit Account', required: true }
      ]}
      buttonClassName="bg-emerald-600 hover:bg-emerald-700"
      accountPreview={(item) => `Cr: ${item.creditAccount || '-'}`}
    />
  );
}
