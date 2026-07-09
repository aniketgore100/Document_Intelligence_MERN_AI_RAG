import { FileText, MessageSquare, UserCheck, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { useGetMeQuery } from "../../features/auth/authApiSlice";
import { useGetDepartmentAnalyticsQuery } from "../../features/departments/departmentsApiSlice";

const DEPARTMENT_READ_PERMISSION = "department:read";

const MetricCard = ({ title, value, helper, icon: Icon, tone, isLoading }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
    <div className="flex items-center gap-2">
      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={14} />
      </span>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
    </div>
    <div className="mt-4">
      <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {isLoading ? "-" : value}
      </p>
      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  </div>
);

const CombinedTraffic = ({ usersRows, documentRows }) => {
  const rows = (usersRows || [])
    .map((item, index) => ({
      ...item,
      documentCount: documentRows?.[index]?.count || 0,
    }))
    .reverse();

  const maxCount = Math.max(
    1,
    ...rows.map((item) => Math.max(item.count, item.documentCount))
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Department Traffic
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-3 w-3 rounded bg-blue-600" />
            Users
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-3 w-3 rounded bg-blue-100" />
            Documents
          </span>
        </div>
      </div>
      <div className="flex h-36 items-end gap-3">
        {rows.map((item) => {
          const documentCount = item.documentCount;
          const userHeight = item.count
            ? Math.max(8, Math.round((item.count / maxCount) * 110))
            : 8;
          const documentHeight = documentCount
            ? Math.max(8, Math.round((documentCount / maxCount) * 110))
            : 8;
          const label = new Date(item.date).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
          });

          return (
            <div
              key={item.date}
              className="group relative flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5"
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block dark:bg-slate-100 dark:text-slate-900">
                {label}: {item.count} users, {documentCount} docs
              </div>
              <div className="flex h-28 items-end gap-1.5">
                <div
                  title={`${label}: ${item.count} users`}
                  className="w-3 rounded-t-full bg-blue-600 transition group-hover:bg-blue-500"
                  style={{ height: userHeight }}
                />
                <div
                  title={`${label}: ${documentCount} documents`}
                  className="w-3 rounded-t-full bg-blue-100 transition group-hover:bg-blue-200 dark:bg-blue-900/50 dark:group-hover:bg-blue-800/70"
                  style={{ height: documentHeight }}
                />
              </div>
              <span className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WorkloadDonut = ({ percent, isLoading }) => {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <div className="flex min-h-[94px] items-center justify-center">
      <div
        className="group relative grid h-20 w-20 cursor-pointer place-items-center rounded-full"
        style={{
          background: `conic-gradient(#2563eb ${safePercent * 3.6}deg, #dbeafe ${safePercent * 3.6}deg 360deg)`,
        }}
        aria-label={`Workload ${safePercent}%`}
      >
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block dark:bg-slate-100 dark:text-slate-900">
          Workload: {safePercent}% of org docs
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center dark:bg-slate-950">
          <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
            {isLoading ? "-" : `${safePercent}%`}
          </p>
        </div>
      </div>
    </div>
  );
};

const DeptAdminHomeView = () => {
  const storedUser = useSelector((state) => state.auth.user);
  const { data: meData, isFetching: isRefreshingAuth } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const user = meData?.user || storedUser;
  const orgId = user?.organizationId || user?.membership?.organization?._id || user?.membership?.organization;
  const deptId = user?.departmentId || user?.membership?.department?._id || user?.membership?.department;
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions
    : Array.isArray(user?.membership?.permissions)
      ? user.membership.permissions
      : [];
  const canViewDepartmentDashboard = permissions.includes(DEPARTMENT_READ_PERMISSION);

  const {
    data: analyticsData,
    isLoading,
    isError,
  } = useGetDepartmentAnalyticsQuery(
    { orgId, deptId },
    { skip: !orgId || !deptId || !canViewDepartmentDashboard }
  );

  const analytics = analyticsData?.analytics || null;
  const workloadPercent = analytics?.totals?.workloadPercent ?? 0;

  if (!orgId || !deptId) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center p-1">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          Department context not found.
        </div>
      </section>
    );
  }

  if (!canViewDepartmentDashboard) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center p-1">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          {isRefreshingAuth
            ? "Checking your department permissions..."
            : "You do not have permission to view the department dashboard."}
        </div>
      </section>
    );
  }

  return (
    <section className="p-1">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="border-b border-slate-100 p-3 dark:border-slate-800">
          {isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              Failed to load department analytics.
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  title="Total Users"
                  value={analytics?.totals?.users ?? 0}
                  helper="All department members"
                  icon={Users}
                  tone="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  isLoading={isLoading}
                />
                <MetricCard
                  title="Active Users"
                  value={analytics?.totals?.activeUsers ?? 0}
                  helper="Currently active members"
                  icon={UserCheck}
                  tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  isLoading={isLoading}
                />
                <MetricCard
                  title="Documents"
                  value={analytics?.totals?.documents ?? 0}
                  helper="Assigned to department"
                  icon={FileText}
                  tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  isLoading={isLoading}
                />
                <MetricCard
                  title="Total Queries"
                  value={analytics?.totals?.totalQueries ?? 0}
                  helper="All department RAG queries"
                  icon={MessageSquare}
                  tone="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                  isLoading={isLoading}
                />
                <WorkloadDonut percent={workloadPercent} isLoading={isLoading} />
              </div>
              <CombinedTraffic
                usersRows={analytics?.daily?.usersAdded || []}
                documentRows={analytics?.daily?.documentsAdded || []}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DeptAdminHomeView;
