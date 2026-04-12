// Order confirmation and live status page
interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;

  return (
    <main>
      <h1>Order #{id}</h1>
      {/* TODO: OrderStatusTimeline, OrderLineItems */}
    </main>
  );
}
