import VoucherRegisterPage from '../components/VoucherRegisterPage';

export default function Contra() {
  return (
    <VoucherRegisterPage
      title="Contra Voucher"
      endpoint="/contras"
      addButtonLabel="+ Add Contra Voucher"
      fieldDefinitions={[
        { name: 'fromAccount', label: 'From Account', required: true },
        { name: 'toAccount', label: 'To Account', required: true }
      ]}
      buttonClassName="bg-rose-600 hover:bg-rose-700"
      accountPreview={(item) => `${item.fromAccount || '-'} -> ${item.toAccount || '-'}`}
    />
  );
}
