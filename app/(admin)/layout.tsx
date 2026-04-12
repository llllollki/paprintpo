// Admin shell — auth is enforced by middleware.ts, not here
// Add admin nav/sidebar here
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
