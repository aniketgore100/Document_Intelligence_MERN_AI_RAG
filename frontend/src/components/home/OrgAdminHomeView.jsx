import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight, MoreVertical, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useCreateDepartmentMutation,
  useGetDepartmentsQuery,
} from "../../features/departments/departmentsApiSlice";
import { useCreateDepartmentAdminInviteMutation } from "../../features/invites/invitesApiSlice";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE = 10;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getDate()} ${new Intl.DateTimeFormat("en-US", { month: "long" }).format(date)} ${date.getFullYear()}`;
};

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

const OrgAdminHomeView = () => {
  const [page, setPage] = useState(1);
  const departmentsQuery = useGetDepartmentsQuery({ page, limit: PAGE_SIZE });
  const [createDepartment, { isLoading: isCreatingDept }] = useCreateDepartmentMutation();
  const [createDepartmentAdminInvite, { isLoading: isReinviting }] =
    useCreateDepartmentAdminInviteMutation();
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [isReinviteOpen, setIsReinviteOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentAdminEmail, setDepartmentAdminEmail] = useState("");
  const [createError, setCreateError] = useState("");
  const [reinviteError, setReinviteError] = useState("");
  const [reinviteDepartmentId, setReinviteDepartmentId] = useState("");
  const [reinviteDepartmentName, setReinviteDepartmentName] = useState("");
  const [reinviteEmail, setReinviteEmail] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());
  const [openActionId, setOpenActionId] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const orgId = user?.organizationId;

  useEffect(() => {
    const deptModalHandler = () => setIsCreateDeptOpen(true);
    window.addEventListener("open-create-department", deptModalHandler);
    return () => window.removeEventListener("open-create-department", deptModalHandler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!event.target.closest?.('[data-department-actions-root="true"]')) {
        setOpenActionId("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const rows = useMemo(() => {
    const departments = departmentsQuery.data?.departments || [];
    return departments.map((dept) => {
      const owner = dept.Owner || null;
      const pendingTime = formatTimeRemaining(dept.inviteExpiresAt, nowTs);
      return {
        id: dept.id,
        name: dept.name,
        adminName: owner?.name || "",
        adminEmail: owner?.email || "",
        inviteStatus: dept.inviteStatus || null,
        inviteEmail: dept.inviteEmail || "",
        pendingTime,
        inviteExpired: dept.inviteStatus === "expired" || (dept.inviteStatus === "pending" && !pendingTime),
        status: dept.status,
        createdAt: formatDate(dept.createdAt),
      };
    });
  }, [departmentsQuery.data, nowTs]);

  const pagination = departmentsQuery.data?.pagination;

  const closeDeptModal = () => {
    setIsCreateDeptOpen(false);
    setDepartmentName("");
    setDepartmentAdminEmail("");
    setCreateError("");
  };

  const closeReinviteModal = () => {
    setIsReinviteOpen(false);
    setReinviteDepartmentId("");
    setReinviteDepartmentName("");
    setReinviteEmail("");
    setReinviteError("");
  };

  const handleCreateDepartment = async () => {
    setCreateError("");
    if (!departmentName.trim()) return setCreateError("Department name is required");
    if (!departmentAdminEmail.trim() || !EMAIL_REGEX.test(departmentAdminEmail.trim())) {
      return setCreateError("Valid department admin email is required");
    }

    try {
      await createDepartment({
        name: departmentName.trim(),
        adminEmail: departmentAdminEmail.trim(),
      }).unwrap();
      closeDeptModal();
    } catch (error) {
      setCreateError(error?.data?.message || "Failed to create department");
    }
  };

  const openReinvite = ({ id, name, email }) => {
    setReinviteDepartmentId(id);
    setReinviteDepartmentName(name);
    setReinviteEmail(email || "");
    setReinviteError("");
    setIsReinviteOpen(true);
  };

  const handleReinvite = async () => {
    setReinviteError("");
    if (!reinviteDepartmentId) return setReinviteError("Department is required");
    if (!reinviteEmail.trim() || !EMAIL_REGEX.test(reinviteEmail.trim())) {
      return setReinviteError("Valid department admin email is required");
    }

    try {
      await createDepartmentAdminInvite({
        organizationId: orgId,
        departmentId: reinviteDepartmentId,
        email: reinviteEmail.trim(),
      }).unwrap();
      closeReinviteModal();
    } catch (error) {
      setReinviteError(error?.data?.message || "Failed to send invite");
    }
  };

  const openDepartment = (row, deptId) => {
    if (!row.adminName && !row.adminEmail) return;

    navigate(`/department/${orgId}/${deptId}`, {
      state: {
        departmentName: row.name,
      },
    });
  };

  const toggleActionMenu = (event, rowId) => {
    event.stopPropagation();
    setOpenActionId((current) => (current === rowId ? "" : rowId));
  };

  const renderStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {status}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {status}
      </span>
    );
  };

  const isLoading = departmentsQuery.isLoading;
  const isError = departmentsQuery.isError;
  const errorMessage = departmentsQuery.error?.data?.message;
  const hasRows = rows.length > 0;

  return (
    <section className="flex min-h-[calc(100vh-158px)] flex-col space-y-3 p-1">
      {isLoading ? <div className="rounded-xl border bg-transparent p-3 text-sm">Loading...</div> : null}
      {isError ? (
        <div className="rounded-xl border bg-transparent p-3 text-sm text-red-600">
          {errorMessage || "Failed to load data"}
        </div>
      ) : null}

      {!isLoading && !isError && !hasRows ? (
        <div className="flex min-h-[58vh] items-center justify-center rounded-xl bg-transparent">
          <button
            type="button"
            onClick={() => setIsCreateDeptOpen(true)}
            className="surface flex w-full max-w-sm flex-col items-center rounded-2xl px-6 py-8 text-center transition hover:border-blue-300 dark:hover:border-blue-600"
          >
            <span className="mb-3 rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <Building2 size={22} />
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Create Department</p>
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && hasRows ? (
        <div className="flex min-h-[calc(100vh-178px)] flex-1 flex-col overflow-x-auto rounded-xl border bg-transparent">
          <div className="min-w-[780px] shrink-0">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur dark:bg-slate-900/60">
                <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  <th className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700">
                    Department Name
                  </th>
                  <th className="border border-slate-200 px-4 py-2 text-left dark:border-slate-700">
                    Admin
                  </th>
                  <th className="border border-slate-200 px-4 py-2 text-center dark:border-slate-700">
                    Status
                  </th>
                  <th className="border border-slate-200 px-4 py-2 text-center dark:border-slate-700">
                    Created Date
                  </th>
                  <th className="border border-slate-200 px-4 py-2 text-center dark:border-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openDepartment(row, row.id)}
                    className={`transition-colors duration-150 ${
                      row.adminName || row.adminEmail
                        ? "cursor-pointer hover:bg-slate-100/55 dark:hover:bg-slate-800/30"
                        : "cursor-default"
                    }`}
                  >
                    <td className="border border-slate-200 px-4 py-2 align-middle dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
                    </td>
                    <td className="border border-slate-200 px-4 py-2 align-middle text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      {row.adminName || row.adminEmail ? (
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {row.adminName || row.adminEmail}
                          </p>
                          {row.adminEmail && row.adminName ? (
                            <p className="text-xs muted">{row.adminEmail}</p>
                          ) : null}
                        </div>
                      ) : row.inviteStatus === "pending" && row.pendingTime ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            Invite pending
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-300/90">
                            {row.pendingTime}
                          </p>
                        </div>
                      ) : row.inviteExpired ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openReinvite({
                              id: row.id,
                              name: row.name,
                              email: row.inviteEmail || row.adminEmail,
                            });
                          }}
                          className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        >
                          Invite Again
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border border-slate-200 px-4 py-2 text-center align-middle dark:border-slate-700">
                      {renderStatusBadge(row.status)}
                    </td>
                    <td className="border border-slate-200 px-4 py-2 text-center align-middle text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      {row.createdAt}
                    </td>
                    <td className="border border-slate-200 px-4 py-2 align-middle dark:border-slate-700">
                      <div data-department-actions-root="true" className="relative flex justify-center">
                        <button
                          type="button"
                          onClick={(event) => toggleActionMenu(event, row.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          aria-label="Department actions"
                          title="Actions"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {openActionId === row.id ? (
                          <div className="absolute right-1 top-8 z-20 w-36 rounded-lg border bg-white p-1 text-left shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenActionId("");
                                openDepartment(row, row.id);
                              }}
                              disabled={!row.adminName && !row.adminEmail}
                              className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Open
                            </button>
                            {row.inviteExpired ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionId("");
                                  openReinvite({
                                    id: row.id,
                                    name: row.name,
                                    email: row.inviteEmail || row.adminEmail,
                                  });
                                }}
                                className="w-full rounded-md px-3 py-2 text-left text-sm text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
                              >
                                Invite Again
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination ? (
            <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">
                Page {pagination.page} of {pagination.totalPages} - {pagination.total} departments
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!pagination.hasNextPage}
                  className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <AnimatePresence>
        {isCreateDeptOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeptModal}
          >
            <motion.div
              className="w-full max-w-lg rounded-xl border bg-white p-4 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Create Department</h3>
                <button
                  type="button"
                  onClick={closeDeptModal}
                  className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={14} />
                </button>
              </div>
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs text-slate-500">Department Name</span>
                <input
                  value={departmentName}
                  onChange={(event) => setDepartmentName(event.target.value)}
                  className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs text-slate-500">Invite Department Admin</span>
                <input
                  type="email"
                  value={departmentAdminEmail}
                  onChange={(event) => setDepartmentAdminEmail(event.target.value)}
                  className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              {createError ? <p className="mt-1 text-sm text-red-600">{createError}</p> : null}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDeptModal}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateDepartment}
                  disabled={isCreatingDept}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isCreatingDept ? "Creating..." : "Create Department"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isReinviteOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeReinviteModal}
          >
            <motion.div
              className="w-full max-w-lg rounded-xl border bg-white p-4 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Invite Admin Again</h3>
                <button
                  type="button"
                  onClick={closeReinviteModal}
                  className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mb-3 text-sm muted">
                Send a new invite for{" "}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {reinviteDepartmentName}
                </span>
              </p>
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs text-slate-500">Email</span>
                <input
                  type="email"
                  value={reinviteEmail}
                  onChange={(event) => setReinviteEmail(event.target.value)}
                  className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              {reinviteError ? <p className="mt-1 text-sm text-red-600">{reinviteError}</p> : null}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReinviteModal}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReinvite}
                  disabled={isReinviting}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isReinviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default OrgAdminHomeView;
