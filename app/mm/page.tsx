
import getCurrentUser from '@/app/actions/getCurrentUser';
import MM_CommandDashboard from './DashBoardclient';

/**
 * MM Hub Entry Point (Server Side)
 * Aligned with Guideline 1 of 2025: Standardized Documentation & Leadership.
 */
export default async function MM_Page() {
  // Execute server-side authentication
  const currentUser = await getCurrentUser();

  // Pass currentUser to the Client Component
  return (
    <MM_CommandDashboard currentUser={currentUser} />
  );
}