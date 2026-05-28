import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGetDepartmentsQuery } from "../features/departments/departmentsApiSlice";
import {
  useCreateDepartmentUserInviteMutation,
  useGetDepartmentUsersQuery,
} from "../features/invites/invitesApiSlice";

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
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

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

  const rows = useMemo(() => {
    const users = usersData?.users || [];
    const pendingInvites = usersData?.pendingInvites || [];

    const userRows = users.map((member) => ({
      type: "active",
      key: member.membershipId,
      name: member.user?.name || "-",
      email: member.user?.email || "-",
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

  const closeModal = () => {
    setIsInviteOpen(false);
    setEmail("");
    setInviteError("");
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
                      {row.canReinvite ? (
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
