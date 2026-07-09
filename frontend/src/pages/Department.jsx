import { Check, FileText, Mail, MessageSquare, Save, Shield, User, UserCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { DEPARTMENT_PERMISSION_OPTIONS } from "../constants/permissions";
import { ROLES } from "../constants/roles";
import {
  useGetDepartmentAnalyticsQuery,
  useGetDepartmentByIdQuery,
} from "../features/departments/departmentsApiSlice";
import { useGetDepartmentUsersQuery } from "../features/invites/invitesApiSlice";
import { useUpdateMembershipPermissionsMutation } from "../features/memberships/membershipsApiSlice";

const Department = () => {
  const { orgId, deptId } = useParams();
  const currentRoleName = useSelector((state) => state.auth.user?.roleName);
  const canManagePermissions = currentRoleName === ROLES.ORG_ADMIN;
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [permissionError, setPermissionError] = useState("");

  const { data, isLoading, isError, error } = useGetDepartmentByIdQuery(
    { orgId, deptId },
    { skip: !orgId || !deptId }
  );

  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    isError: isAnalyticsError,
  } = useGetDepartmentAnalyticsQuery(
    { orgId, deptId },
    { skip: !orgId || !deptId }
  );

  const { data: departmentUsersData, isLoading: isLoadingDepartmentUsers } =
    useGetDepartmentUsersQuery(
      deptId ? { departmentId: deptId } : { departmentId: "" },
      { skip: !deptId || !canManagePermissions }
    );

  const [updateMembershipPermissions, { isLoading: isSavingPermissions }] =
    useUpdateMembershipPermissionsMutation();

  const department = data?.department;

  const departmentAdmin = useMemo(() => {
    const activeUsers = departmentUsersData?.users || [];
    return (
      activeUsers.find((member) => member.roleName === ROLES.DEPT_ADMIN) ||
      activeUsers.find(
        (member) => Array.isArray(member.permissions) && member.permissions.length > 0
      ) ||
      null
    );
  }, [departmentUsersData]);

  const permissionOptions = DEPARTMENT_PERMISSION_OPTIONS[ROLES.DEPT_ADMIN] || [];
  const analytics = analyticsData?.analytics || null;

  useEffect(() => {
    setSelectedPermissions(
      Array.isArray(departmentAdmin?.permissions) ? departmentAdmin.permissions : []
    );
    setPermissionError("");
  }, [departmentAdmin]);

  const togglePermission = (permissionValue) => {
    setSelectedPermissions((current) =>
      current.includes(permissionValue)
        ? current.filter((item) => item !== permissionValue)
        : [...current, permissionValue]
    );
  };

  const handlePermissionSave = async () => {
    if (!departmentAdmin?.membershipId) {
      setPermissionError("Department admin membership not found");
      return;
    }
    try {
      await updateMembershipPermissions({
        membershipId: departmentAdmin.membershipId,
        permissions: selectedPermissions,
      }).unwrap();
      setPermissionError("");
    } catch (err) {
      setPermissionError(err?.data?.message || "Failed to update permissions");
    }
  };

  if (isLoading) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          Loading department...
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error?.data?.message || "Failed to load department"}
        </div>
      </section>
    );
  }

  if (!department) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center">
        <p className="text-sm text-slate-500">Department not found</p>
      </section>
    );
  }

  const workloadPercent = analytics?.totals?.workloadPercent ?? 0;

  const MetricCard = ({ title, value, helper, icon: Icon, tone }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={14} />
        </span>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {isLoadingAnalytics ? "-" : value}
          </p>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{helper}</p>
      </div>
    </div>
  );

  const CombinedTraffic = ({ usersRows, documentRows }) => {
    const rows = (usersRows || []).map((item, index) => ({
      ...item,
      documentCount: documentRows?.[index]?.count || 0,
    })).reverse();
    const maxCount = Math.max(
      1,
      ...rows.map((item) => Math.max(item.count, item.documentCount))
    );

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Department Traffic</h3>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-blue-600" />Users</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-blue-100" />Documents</span>
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
              <div key={item.date} className="group relative flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5">
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

  const WorkloadDonut = ({ percent }) => {
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
            <div>
              <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                {isLoadingAnalytics ? "-" : `${safePercent}%`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="p-1">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">
              <User size={15} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {departmentAdmin?.user?.name || "Department Admin"}
              </p>
              <p className="flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                <Mail size={11} />
                {departmentAdmin?.user?.email || "No email available"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Shield size={12} />
              {departmentAdmin?.roleName || ROLES.DEPT_ADMIN}
            </span>
          </div>
        </div>

        <div className="border-b border-slate-100 p-3 dark:border-slate-800">
          {isAnalyticsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
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
                />
                <MetricCard
                  title="Active Users"
                  value={analytics?.totals?.activeUsers ?? 0}
                  helper="Currently active members"
                  icon={UserCheck}
                  tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                />
                <MetricCard
                  title="Documents"
                  value={analytics?.totals?.documents ?? 0}
                  helper="Assigned to department"
                  icon={FileText}
                  tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                />
                <MetricCard
                  title="Total Queries"
                  value={analytics?.totals?.totalQueries ?? 0}
                  helper="All department RAG queries"
                  icon={MessageSquare}
                  tone="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                />
                <WorkloadDonut
                  percent={workloadPercent}
                />
              </div>
              <div>
                <CombinedTraffic
                  usersRows={analytics?.daily?.usersAdded || []}
                  documentRows={analytics?.daily?.documentsAdded || []}
                />
              </div>
            </div>
          )}
        </div>

        {isLoadingDepartmentUsers ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading permissions...
          </div>
        ) : departmentAdmin ? (
          <>
            {permissionError ? (
              <div className="px-4 pt-3">
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  {permissionError}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Permissions
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {canManagePermissions
                    ? "Toggle permissions and save changes."
                    : "Current permissions are view only."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Check size={12} />
                  {selectedPermissions.length} selected
                </span>
                {canManagePermissions ? (
                  <button
                    type="button"
                    onClick={handlePermissionSave}
                    disabled={isSavingPermissions}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={12} />
                    {isSavingPermissions ? "Saving..." : "Save Permissions"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-900/95">
                  <tr className="text-[11px] font-semibold  tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    <th scope="col" className="border border-slate-100 px-4 py-2 text-left dark:border-slate-800">
                      Permission
                    </th>
                    <th scope="col" className="border border-slate-100 px-4 py-2 text-left dark:border-slate-800">
                      Details
                    </th>
                    <th scope="col" className="border border-slate-100 px-4 py-2 text-center dark:border-slate-800">
                      Enabled
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {permissionOptions.map((permission) => {
                    const checked = selectedPermissions.includes(permission.value);

                    return (
                      <tr
                        key={permission.value}
                        className={`transition ${
                          checked ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="border border-slate-100 px-4 py-2 align-middle dark:border-slate-800">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {permission.label}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {permission.value}
                          </p>
                        </td>
                        <td className="border border-slate-100 px-4 py-2 align-middle dark:border-slate-800">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {permission.description}
                          </p>
                        </td>
                        <td className="border border-slate-100 px-4 py-2 align-middle dark:border-slate-800">
                          <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.value)}
                            disabled={!canManagePermissions}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                          />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                {canManagePermissions
                  ? "Toggle permissions and save to apply changes."
                  : "You can only view the current permissions."}
              </p>
            </div>
          </>
        ) : (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Shield size={18} />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              No department admin assigned
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Assign a department admin to manage permissions.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};


export default Department;
