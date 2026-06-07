import { AnimatePresence, motion } from "framer-motion";
import { Building2, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  useCreateDepartmentMutation,
  useGetDepartmentsQuery,
} from "../../features/departments/departmentsApiSlice";
import { useNavigate } from "react-router-dom";


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



const OrgAdminHomeView = () => {

  const departmentsQuery = useGetDepartmentsQuery({ page: 1, limit: 50 });
  const [createDepartment, { isLoading: isCreatingDept }] = useCreateDepartmentMutation();
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentAdminEmail, setDepartmentAdminEmail] = useState("");
  const [createError, setCreateError] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());
  const Navigate = useNavigate();
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

  const rows = useMemo(() => {
    const departments = departmentsQuery.data?.departments || [];
    return departments.map((dept) => {
      const owner = dept.Owner || null;
      return {
        id: dept.id,
        name: dept.name,
        adminName: owner?.name || "",
        adminEmail: owner?.email || "",
        inviteStatus: dept.inviteStatus || null,
        pendingTime: formatTimeRemaining(dept.inviteExpiresAt, nowTs),
        status: dept.status,
        createdAt: dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : "-",
      };
    });
  }, [departmentsQuery.data, nowTs]);



  const closeDeptModal = () => {
    setIsCreateDeptOpen(false);
    setDepartmentName("");
    setDepartmentAdminEmail("");
    setCreateError("");
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
    } catch (err) {
      setCreateError(err?.data?.message || "Failed to create department");
    }
  };

  const openDepartment = (row, deptId) => {
    Navigate(`/department/${orgId}/${deptId}`, {
      state: {
        departmentName: row.name,
      },
    });
  };

  const isLoading = departmentsQuery.isLoading;
  const isError = departmentsQuery.isError;
  const errorMessage = departmentsQuery.error?.data?.message;
  const hasRows = rows.length > 0;

  return (
    <section className="space-y-3 p-1">
      {isLoading ? <div className="rounded-xl border bg-transparent p-3 text-sm">Loading...</div> : null}
      {isError ? <div className="rounded-xl border bg-transparent p-3 text-sm text-red-600">{errorMessage || "Failed to load data"}</div> : null}

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
        <div className="overflow-x-auto rounded-xl bg-transparent">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-12 border-b bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-300">
              <p className="col-span-4">Department Name</p>
              <p className="col-span-2">Admin</p>
              <p className="col-span-2">Status</p>
              <p className="col-span-2">Created Date</p>
              <p className="col-span-2 text-right pr-2">Actions</p>
            </div>
            <div className="max-h-[66vh] overflow-y-auto">
              {rows.map((row) => (
                <div key={row.id}
                  onClick={() => openDepartment(row, row.id)}
                  className="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm transition-colors duration-150 hover:bg-slate-100/55 dark:hover:bg-slate-800/30">
                  <div className="col-span-4"><p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p></div>
                  <div className="col-span-2 text-slate-600 dark:text-slate-300">
                    {row.adminName || row.adminEmail ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{row.adminName || row.adminEmail}</p>
                        {row.adminEmail && row.adminName ? <p className="text-xs muted">{row.adminEmail}</p> : null}
                      </div>
                    ) : row.inviteStatus === "pending" && row.pendingTime ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Invite pending</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-300/90">{row.pendingTime}</p>
                      </div>
                    ) : "-"}
                  </div>
                  <div className="col-span-2"><span className="rounded-md border px-2 py-0.5 text-xs capitalize">{row.status}</span></div>
                  <div className="col-span-2 text-slate-600 dark:text-slate-300">{row.createdAt}</div>
                  <div className="col-span-2 flex justify-end pr-2"><button type="button" className="rounded-lg border p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={13} /></button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {isCreateDeptOpen ? (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDeptModal}>
            <motion.div className="w-full max-w-lg rounded-xl border bg-white p-4 dark:bg-slate-900" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-semibold">Create Department</h3><button type="button" onClick={closeDeptModal} className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={14} /></button></div>
              <label className="mb-3 block text-sm"><span className="mb-1 block text-xs text-slate-500">Department Name</span><input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500" /></label>
              <label className="mb-3 block text-sm"><span className="mb-1 block text-xs text-slate-500">Invite Department Admin</span><input type="email" value={departmentAdminEmail} onChange={(e) => setDepartmentAdminEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500" /></label>
              {createError ? <p className="mt-1 text-sm text-red-600">{createError}</p> : null}
              <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={closeDeptModal} className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button><button type="button" onClick={handleCreateDepartment} disabled={isCreatingDept} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60">{isCreatingDept ? "Creating..." : "Create Department"}</button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default OrgAdminHomeView;
