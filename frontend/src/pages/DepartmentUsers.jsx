import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, MessageSquare, Shield, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useGetDepartmentsQuery } from "../features/departments/departmentsApiSlice";
import { useGetMemberAnalyticsQuery } from "../features/departments/departmentsApiSlice";
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

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const MemberProfileDrawer = ({ member, orgId, deptId, onClose }) => {
  const { data, isLoading, isError } = useGetMemberAnalyticsQuery(
    { orgId, deptId, memberId: member.userId },
    { skip: !orgId || !deptId || !member.userId }
  );

  const analytics = data || null;
  const maxQueryCount = analytics?.queriesByDocument?.length
    ? Math.max(...analytics.queriesByDocument.map((d) => d.count))
    : 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <motion.div
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              {getInitials(member.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {member.name || "—"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{member.email || "—"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={14} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
            <Shield size={10} />
            {member.roleName || "User"}
          </span>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            {member.status || "active"}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Joined {member.joinedAt}
          </span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Permissions */}
          {Array.isArray(member.permissions) && member.permissions.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {member.permissions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Check size={10} className="text-emerald-500" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Stats */}
          {isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              Failed to load analytics.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <FileText size={14} />
                    <p className="text-xs font-medium">Documents</p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {isLoading ? "—" : analytics?.totals?.documents ?? 0}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">In department</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MessageSquare size={14} />
                    <p className="text-xs font-medium">Queries</p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {isLoading ? "—" : analytics?.totals?.queries ?? 0}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Total by this user</p>
                </div>
              </div>

              {/* Queries by document */}
              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Queries per document
                </p>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    ))}
                  </div>
                ) : analytics?.queriesByDocument?.length ? (
                  <div className="space-y-2">
                    {analytics.queriesByDocument.map((doc) => {
                      const barWidth = Math.max(4, Math.round((doc.count / maxQueryCount) * 100));
                      return (
                        <div
                          key={String(doc.documentId)}
                          className="rounded-lg border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p
                              className="min-w-0 truncate text-xs font-medium text-slate-700 dark:text-slate-200"
                              title={doc.documentName}
                            >
                              {doc.documentName}
                            </p>
                            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              {doc.count}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                            <div
                              className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No queries performed yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const DepartmentUsers = () => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [activePermissionRow, setActivePermissionRow] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [nowTs, setNowTs] = useState(Date.now());
  const user = useSelector((state) => state.auth.user);
  const currentRoleName = user?.roleName;

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: departmentsData, isLoading: isLoadingDepartment } = useGetDepartmentsQuery(
    { page: 1, limit: 1 },
    { skip: currentRoleName === ROLES.DEPT_ADMIN }
  );

  const department = departmentsData?.departments?.[0] || null;
  const departmentId = user?.departmentId || department?.id || null;
  const organizationId = user?.organizationId || department?.organization || null;

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
      userId: member.user?.id || member.user?._id,
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
                    className={`grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm transition-colors duration-150 hover:bg-slate-100/55 dark:hover:bg-slate-800/30 ${row.type === "active" ? "cursor-pointer" : ""}`}
                    onClick={
                      row.type === "active"
                        ? () => setSelectedMember(row)
                        : undefined
                    }
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
                          onClick={(e) => {
                            e.stopPropagation();
                            openPermissionEditor(row);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/70"
                        >
                          <Shield size={13} />
                          Permissions
                        </button>
                      ) : row.canReinvite ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInviteModal(row.email);
                          }}
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
        {selectedMember ? (
          <MemberProfileDrawer
            key={selectedMember.userId}
            member={selectedMember}
            orgId={organizationId}
            deptId={departmentId}
            onClose={() => setSelectedMember(null)}
          />
        ) : null}

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
