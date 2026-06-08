import { Check, Shield, Building2, Hash, Fingerprint, Mail, User, Lock, Sparkles, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { DEPARTMENT_PERMISSION_OPTIONS } from "../constants/permissions";
import { ROLES } from "../constants/roles";
import { useGetDepartmentByIdQuery } from "../features/departments/departmentsApiSlice";
import { useGetDepartmentUsersQuery } from "../features/invites/invitesApiSlice";
import { useUpdateMembershipPermissionsMutation } from "../features/memberships/membershipsApiSlice";
import { ChevronDown } from "lucide-react";

const Department = () => {
  const { orgId, deptId } = useParams();
  const currentRoleName = useSelector((state) => state.auth.user?.roleName);
  const canManagePermissions = currentRoleName === ROLES.ORG_ADMIN;
  const [showPermissions, setShowPermissions] = useState(false);

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
    <section className="space-y-3 p-1">

      {/* Permissions */}
      <div className="max-w-2xl">
        <div className="h-full rounded-2xl border border-slate-200 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                <Lock size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Department Permissions
                </h2>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
              <Shield size={12} />
              {departmentAdmin?.roleName || ROLES.DEPT_ADMIN}
            </div>
          </div>

          {isLoadingDepartmentUsers ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              Loading permissions...
            </div>
          ) : departmentAdmin ? (
            <>
              {/* Admin card */}
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 dark:border-slate-800 dark:from-slate-800/50 dark:to-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white shadow">
                  <User size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {departmentAdmin.user?.name || "Department Admin"}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    <Mail size={11} />
                    {departmentAdmin.user?.email || "No email available"}
                  </p>
                </div>
              </div>

              {/* Assigned chips */}
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles size={12} className="text-indigo-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Assigned ({selectedPermissions.length})
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPermissions.length > 0 ? (
                    selectedPermissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                      >
                        <Check size={11} />
                        {permission}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No permissions assigned yet.</p>
                  )}
                </div>
              </div>

              {/* Available list */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPermissions((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>
                    Available Permissions ({selectedPermissions.length} selected)
                  </span>

                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${showPermissions ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {showPermissions && (
                  <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {permissionOptions.map((permission) => {
                        const checked = selectedPermissions.includes(permission.value);

                        return (
                          <label
                            key={permission.value}
                            className={`group relative flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-all ${checked
                                ? "border-indigo-300 bg-indigo-50/60 shadow-sm dark:border-indigo-800/60 dark:bg-indigo-950/30"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                              } ${!canManagePermissions
                                ? "cursor-not-allowed opacity-70"
                                : ""
                              }`}
                          >
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${checked
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                                }`}
                            >
                              {checked && <Check size={11} strokeWidth={3} />}
                            </div>

                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(permission.value)}
                              disabled={!canManagePermissions}
                              className="sr-only"
                            />

                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {permission.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {permissionError ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  {permissionError}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {canManagePermissions
                    ? "Toggle permissions and save to apply changes."
                    : "You can only view the current permissions."}
                </p>
                {canManagePermissions ? (
                  <button
                    type="button"
                    onClick={handlePermissionSave}
                    disabled={isSavingPermissions}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={14} />
                    {isSavingPermissions ? "Saving..." : "Save Permissions"}
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Shield size={18} />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No department admin assigned
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Assign a department admin to manage permissions.
              </p>
            </div>
          )}
        </div>
      </div>



    </section>
  );
};


export default Department;
