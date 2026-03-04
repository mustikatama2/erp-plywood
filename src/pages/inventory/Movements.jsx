import { PageHeader, Card, EmptyState, Btn } from "../../components/ui";
export default function Movements() {
  return (
    <div>
      <PageHeader title="Stock Movements" actions={<Btn>+ New Movement</Btn>} />
      <Card>
        <EmptyState icon="🔄" title="Movement log" subtitle="All stock moves (goods receipts, production issues, deliveries) will appear here" />
      </Card>
    </div>
  );
}
