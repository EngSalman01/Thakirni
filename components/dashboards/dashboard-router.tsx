'use client';

import dynamic from 'next/dynamic';
import { useSubscription } from '@/hooks/use-subscription';
import { Skeleton } from '@/components/ui/skeleton';
import { VaultSidebar } from '@/components/thakirni/vault-sidebar';

const IndividualDashboard = dynamic(
  () => import('@/app/vault/page'),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

// Team and Company dashboards will be simple for now - route to individual
const TeamDashboard = IndividualDashboard;
const CompanyDashboard = IndividualDashboard;

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      <main className="lg:me-64 p-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardRouter() {
  const { subscriptionType, loading } = useSubscription();

  if (loading) return <DashboardSkeleton />;

  switch (subscriptionType) {
    case 'individual':
      return <IndividualDashboard />;
    case 'team':
      return <TeamDashboard />;
    case 'company':
      return <CompanyDashboard />;
    default:
      return <IndividualDashboard />;
  }
}
