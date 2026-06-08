import { AnimatePresence, motion } from "framer-motion";
import { Check, Shield, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useGetDepartmentsQuery } from "../features/departments/departmentsApiSlice";
import {
  useCreateDepartmentUserInviteMutation,
  useGetDepartmentUsersQuery,
} from "../features/invites/invitesApiSlice";
import { useUpdateMembershipPermissionsMutation } from "../features/memberships/membershipsApiSlice";
import { DEPARTMENT_PERMISSION_OPTIONS } from "../constants/permissions";
import { ROLES } from "../constants/roles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatTimeRemaining = (expiresAt, nowTs) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - nowTs;
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s left`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s left`;
  return `${minutes}m ${seconds}s left`;
};

const DepartmentUsers = () => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [activePermissionRow, setActivePermissionRow] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [nowTs, setNowTs] = useState(Date.now());
  const currentRoleName = useSelector((state) => state.auth.user?.roleName);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: departmentsData, isLoading: isLoadingDepartment } = useGetDepartmentsQuery({ page: 1, limit: 1 });

  const department = departmentsData?.departments?.[0] || null;
  const departmentId = department?.id || null;
  const organizationId = department?.organization || null;

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError,
    error,
  } = useGetDepartmentUsersQuery(
    departmentId ? { departmentId } : { departmentId: "" },
    { skip: !departmentId }
  );

  const [createDepartmentUserInvite, { isLoading: isInviting }] =
    useCreateDepartmentUserInviteMutation();
  const [updateMembershipPermissions, { isLoading: isSavingPermissions }] =
    useUpdateMembershipPermissionsMutation();

  const rows = useMemo(() => {
    const users = usersData?.users || [];
    const pendingInvites = usersData?.pendingInvites || [];

    const userRows = users.map((member) => ({
      type: "active",
      key: member.membershipId || member.id || member._id,
      membershipId: member.membershipId || member.id || member._id,
      name: member.user?.name || "-",
      email: member.user?.email || "-",
      roleName: member.roleName || member.role?.name || member.user?.roleName || member.user?.role?.name,
      permissions: member.permissions || member.role?.permissions || member.user?.permissions || [],
      status: "active",
      joinedAt: member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "-",
      pendingTime: null,
      canReinvite: false,
    }));

    const inviteRows = pendingInvites.map((invite) => {
      const pendingTime = formatTimeRemaining(invite.expiresAt, nowTs);
      const inviteExpired = invite.status === "expired" || (invite.status === "pending" && !pendingTime);
      return {
        type: "invite",
        key: invite.id,
        name: "Invited User",
        email: invite.email,
        status: invite.status,
        joinedAt: "-",
        pendingTime,
        canReinvite: inviteExpired,
      };
    });

    return [...inviteRows, ...userRows];
  }, [usersData, nowTs]);


  const openInviteModal = (prefillEmail = "") => {
    setEmail(prefillEmail);
    setInviteError("");
    setIsInviteOpen(true);
  };

  const openPermissionEditor = (row) => {
    setActivePermissionRow(row);
    setSelectedPermissions(Array.isArray(row.permissions) ? row.permissions : []);
    setPermissionError("");
    setIsPermissionOpen(true);
  };

  const closeModal = () => {
    setIsInviteOpen(false);
    setEmail("");
    setInviteError("");
  };

  const closePermissionModal = () => {
    setIsPermissionOpen(false);
    setActivePermissionRow(null);
    setSelectedPermissions([]);
    setPermissionError("");
  };

  const handleInvite = async () => {
    setInviteError("");

    if (!departmentId || !organizationId) {
      setInviteError("Department context not found");
      return;
    }

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setInviteError("Valid email is required");
      return;
    }

    try {
      await createDepartmentUserInvite({
        organizationId,
        departmentId,
        email: email.trim(),
      }).unwrap();
      closeModal();
    } catch (err) {
      setInviteError(err?.data?.message || "Failed to send invite");
    }
  };

  const permissionOptions = useMemo(() => {
    if (!activePermissionRow?.roleName) return [];
    return DEPARTMENT_PERMISSION_OPTIONS[activePermissionRow.roleName] || [];
  }, [activePermissionRow]);

  const togglePermission = (permissionValue) => {
    setSelectedPermissions((current) =>
      current.includes(permissionValue)
        ? current.filter((item) => item !== permissionValue)
        : [...current, permissionValue]
    );
  };

  const handlePermissionSave = async () => {
    if (!activePermissionRow?.membershipId) {
      setPermissionError("Membership context not found");
      return;
    }

    try {
      await updateMembershipPermissions({
        membershipId: activePermissionRow.membershipId,
        permissions: selectedPermissions,
      }).unwrap();
      closePermissionModal();
    } catch (err) {
      setPermissionError(err?.data?.message || "Failed to update permissions");
    }
  };

  const canManagePermissions = currentRoleName === ROLES.ORG_ADMIN;

  return (
    <section className="space-y-3 p-1">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => openInviteModal()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
        >
          <UserPlus size={13} />
          Invite User
        </button>
      </div>

      {isLoadingDepartment || isLoadingUsers ? (
        <div className="rounded-xl border bg-transparent p-3 text-sm">Loading...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border bg-transparent p-3 text-sm text-red-600">
          {error?.data?.message || "Failed to load department users"}
        </div>
      ) : null}

      {!isLoadingUsers && !isError ? (
        <div className="overflow-x-auto rounded-xl bg-transparent">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-12 border-b bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-300">
              <p className="col-span-4">Name</p>
              <p className="col-span-4">Email</p>
              <p className="col-span-2">Status</p>
              <p className="col-span-1">Joined</p>
              <p className="col-span-1 text-right">Action</p>
            </div>
            <div className="max-h-[66vh] overflow-y-auto">
              {rows.length === 0 ? (
                <div className="px-4 py-6 text-sm muted">No users in this department yet.</div>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm transition-colors duration-150 hover:bg-slate-100/55 dark:hover:bg-slate-800/30"
                  >
                    <p className="col-span-4 font-medium text-slate-800 dark:text-slate-100">
                      {row.name || "-"}
                    </p>
                    <p className="col-span-4 text-slate-600 dark:text-slate-300">{row.email || "-"}</p>
                    <div className="col-span-2">
                      {row.type === "invite" && row.status === "pending" && row.pendingTime ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Invite pending</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-300/90">{row.pendingTime}</p>
                        </div>
                      ) : (
                        <span className="rounded-md border px-2 py-0.5 text-xs capitalize">{row.status}</span>
                      )}
                    </div>
                    <p className="col-span-1 text-slate-600 dark:text-slate-300">
                      {row.joinedAt}
                    </p>
                    <div className="col-span-1 flex justify-end">
                      {row.type === "active" && canManagePermissions ? (
                        <button
                          type="button"
                          onClick={() => openPermissionEditor(row)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/70"
                        >
                          <Shield size={13} />
                          Permissions
                        </button>
                      ) : row.canReinvite ? (
                        <button
                          type="button"
                          onClick={() => openInviteModal(row.email)}
                          className="rounded-md border px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        >
                          Invite Again
                        </button>
                      ) : (
                        <span className="text-xs muted">-</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {isPermissionOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePermissionModal}
          >
            <motion.div
              className="w-full max-w-2xl rounded-xl border bg-white p-4 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Manage Permissions</h3>
                  <p className="text-xs muted">
                    {activePermissionRow?.name} · {activePermissionRow?.roleName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePermissionModal}
                  className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mb-3 rounded-lg border bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Current permissions
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPermissions.length > 0 ? (
                    selectedPermissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <Check size={12} className="text-emerald-600" />
                        {permission}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm muted">No permissions assigned yet.</p>
                  )}
                </div>
              </div>

              <div className="max-h-[48vh] overflow-y-auto rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-950/30">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Available permissions
                </p>
                {permissionOptions.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {permissionOptions.map((permission) => {
                      const checked = selectedPermissions.includes(permission.value);
                      return (
                        <label
                          key={permission.value}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.value)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                              {permission.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {permission.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm muted">No manageable permissions available for this role.</p>
                )}
              </div>

              {permissionError ? <p className="mt-2 text-sm text-red-600">{permissionError}</p> : null}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closePermissionModal}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePermissionSave}
                  disabled={isSavingPermissions}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isSavingPermissions ? "Saving..." : "Save Permissions"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        {isInviteOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="w-full max-w-lg rounded-xl border bg-white p-4 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Invite Department User</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={14} />
                </button>
              </div>
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs text-slate-500">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              {inviteError ? <p className="mt-1 text-sm text-red-600">{inviteError}</p> : null}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={isInviting}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default DepartmentUsers;
