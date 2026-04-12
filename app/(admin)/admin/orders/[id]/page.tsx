// Admin order detail — view line items, files, update status
interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main>
      <h1>Order #{id}</h1>
      {/* TODO: OrderStatusBadge, status update controls, file download links */}
    </main>
  );
}
