import { Check, Mail, Save, Shield, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { DEPARTMENT_PERMISSION_OPTIONS } from "../constants/permissions";
import { ROLES } from "../constants/roles";
import { useGetDepartmentByIdQuery } from "../features/departments/departmentsApiSlice";
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

  const initials = (department.name || "D")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
              <Shield size={12} />
              {departmentAdmin?.roleName || ROLES.DEPT_ADMIN}
            </span>
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

            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-900/95">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
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

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {canManagePermissions
                  ? "Toggle permissions and save to apply changes."
                  : "You can only view the current permissions."}
              </p>
              {canManagePermissions ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedPermissions.length} permission(s) selected
                </div>
              ) : null}
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
