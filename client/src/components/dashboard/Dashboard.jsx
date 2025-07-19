import  {StatsCards} from './StatsCard';
import  {AttendanceChart} from './AttendanceChart';
import {FeesTable}  from './FeesTable';
import  {AnnouncementsPanel}  from './AnnoucementPanel';
import { QuickActions } from './QuickActions';

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Chart and Table */}
        <div className="lg:col-span-2 space-y-6">
          <AttendanceChart />
          <FeesTable />
        </div>

        {/* Right Column - Announcements and Quick Actions */}
        <div className="space-y-6">
          <AnnouncementsPanel />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}