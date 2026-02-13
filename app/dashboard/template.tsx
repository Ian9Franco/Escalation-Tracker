'use client';

/**
 * Dashboard Template
 * 
 * Next.js templates (vs layouts) re-create their children on navigation.
 * This forces the Dashboard and GoogleDashboard page components to fully
 * unmount and remount when navigating between /dashboard and /dashboard/google,
 * ensuring all useEffect hooks fire fresh and data is properly loaded.
 */
export default function DashboardTemplate({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
