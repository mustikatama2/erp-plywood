import { PageHeader, Card, EmptyState, Btn } from "../../components/ui";
export default function GoodsReceipts() {
  return (
    <div>
      <PageHeader title="Goods Receipts" actions={<Btn>+ Receive Goods</Btn>} />
      <Card>
        <EmptyState icon="📦" title="No receipts recorded yet"
          subtitle="Receive goods from a Purchase Order to record a GR"
          action={<Btn>Go to Purchase Orders</Btn>} />
      </Card>
    </div>
  );
}
