import { AnimatePresence, motion } from "framer-motion";
import { Building2, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useCreateOrganizationMutation,
  useGetOrganizationsQuery,
} from "../../features/organizations/organizationsApiSlice";
import { useCreateOrganizationInviteMutation } from "../../features/invites/invitesApiSlice";
import {useNavigate} from "react-router-dom";



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

const GlobalHomeView = () => {



  const organizationsQuery = useGetOrganizationsQuery({ page: 1, limit: 50 });
  const [createOrganization, { isLoading: isCreatingOrg }] = useCreateOrganizationMutation();
  const [createInvite, { isLoading: isReinviting }] = useCreateOrganizationInviteMutation();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isReinviteOpen, setIsReinviteOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgAdminEmail, setOrgAdminEmail] = useState("");
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const [selectedScopeName, setSelectedScopeName] = useState("");
  const [reinviteEmail, setReinviteEmail] = useState("");
  const [createError, setCreateError] = useState("");
  const [reinviteError, setReinviteError] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());
  const Navigate = useNavigate();


  useEffect(() => {
    const orgModalHandler = () => setIsCreateOrgOpen(true);
    window.addEventListener("open-create-organization", orgModalHandler);
    return () => window.removeEventListener("open-create-organization", orgModalHandler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);



  const rows = useMemo(() => {
    const organizations = organizationsQuery.data?.organizations || [];
    return organizations.map((org) => {
      const owner = org.Owner || null;
      const pendingTime = formatTimeRemaining(org.inviteExpiresAt, nowTs);
      return {
        id: org.id,
        name: org.name,
        adminName: owner?.name || "",
        adminEmail: owner?.email || "",
        inviteStatus: org.inviteStatus || null,
        slug : org.slug || " ",
        inviteEmail: org.inviteEmail || org?.metadata?.orgAdminEmail || "",
        pendingTime,
        inviteExpired: org.inviteStatus === "expired" || (org.inviteStatus === "pending" && !pendingTime),
        status: org.status,
        createdAt: org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "-",
      };
    });
  }, [organizationsQuery.data, nowTs]);

  const closeOrgModal = () => {
    setIsCreateOrgOpen(false);
    setOrgName("");
    setOrgAdminEmail("");
    setCreateError("");
  };

  const closeReinviteModal = () => {
    setIsReinviteOpen(false);
    setSelectedScopeId("");
    setSelectedScopeName("");
    setReinviteEmail("");
    setReinviteError("");
  };

  const handleCreateOrganization = async () => {
    setCreateError("");
    if (!orgName.trim()) return setCreateError("Organization name is required");
    if (!orgAdminEmail.trim() || !EMAIL_REGEX.test(orgAdminEmail.trim())) {
      return setCreateError("Valid organization admin email is required");
    }
    try {
      await createOrganization({
        name: orgName.trim(),
        metadata: { orgAdminEmail: orgAdminEmail.trim() },
      }).unwrap();
      closeOrgModal();
    } catch (err) {
      setCreateError(err?.data?.message || "Failed to create organization");
    }
  };

  const openReinvite = ({ id, name, email }) => {
    setSelectedScopeId(id);
    setSelectedScopeName(name);
    setReinviteEmail(email || "");
    setReinviteError("");
    setIsReinviteOpen(true);
  };

  const handleReinvite = async () => {
    setReinviteError("");
    if (!selectedScopeId) return setReinviteError("Target is required");
    if (!reinviteEmail.trim() || !EMAIL_REGEX.test(reinviteEmail.trim())) {
      return setReinviteError("Valid email is required");
    }
    try {
      await createInvite({
        organizationId: selectedScopeId,
        email: reinviteEmail.trim(),
      }).unwrap();
      closeReinviteModal();
    } catch (err) {
      setReinviteError(err?.data?.message || "Failed to send invite");
    }
  };


  const handleOrganizationClick = (row) => {
     Navigate(`/organization/${row.slug}/${row.id}`);
  }

  const isLoading = organizationsQuery.isLoading;
  const isError = organizationsQuery.isError;
  const errorMessage = organizationsQuery.error?.data?.message;
  const hasRows = rows.length > 0;

  return (
    <section className="space-y-3 p-1">
      {isLoading ? <div className="rounded-xl border bg-transparent p-3 text-sm">Loading...</div> : null}
      {isError ? <div className="rounded-xl border bg-transparent p-3 text-sm text-red-600">{errorMessage || "Failed to load data"}</div> : null}

      {!isLoading && !isError && !hasRows ? (
        <div className="flex min-h-[58vh] items-center justify-center rounded-xl bg-transparent">
          <button
            type="button"
            onClick={() => setIsCreateOrgOpen(true)}
            className="surface flex w-full max-w-sm flex-col items-center rounded-2xl px-6 py-8 text-center transition hover:border-blue-300 dark:hover:border-blue-600"
          >
            <span className="mb-3 rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <Building2 size={22} />
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Create Organization</p>
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && hasRows ? (
        <div className="overflow-x-auto rounded-xl bg-transparent">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-12 border-b bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-300">
              <p className="col-span-4">Organization Name</p>
              <p className="col-span-2">Owner</p>
              <p className="col-span-2">Status</p>
              <p className="col-span-2">Created Date</p>
              <p className="col-span-2 text-right pr-2">Actions</p>
            </div>
            <div className="max-h-[66vh] overflow-y-auto">
              {rows.map((row) => (
                <div key={row.id} onClick={() => handleOrganizationClick(row)}
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
                    ) : row.inviteExpired ? (
                      <button type="button" onClick={() => openReinvite({ id: row.id, name: row.name, email: row.inviteEmail })} className="rounded-md border px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30">Invite Again</button>
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
        {isCreateOrgOpen ? (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeOrgModal}>
            <motion.div className="w-full max-w-lg rounded-xl border bg-white p-4 dark:bg-slate-900" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-semibold">Create Organization</h3><button type="button" onClick={closeOrgModal} className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={14} /></button></div>
              <label className="mb-3 block text-sm"><span className="mb-1 block text-xs text-slate-500">Organization Name</span><input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500" /></label>
              <label className="mb-3 block text-sm"><span className="mb-1 block text-xs text-slate-500">Invite Organization Admin</span><input type="email" value={orgAdminEmail} onChange={(e) => setOrgAdminEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500" /></label>
              {createError ? <p className="mt-1 text-sm text-red-600">{createError}</p> : null}
              <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={closeOrgModal} className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button><button type="button" onClick={handleCreateOrganization} disabled={isCreatingOrg} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60">{isCreatingOrg ? "Creating..." : "Create Organization"}</button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isReinviteOpen ? (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeReinviteModal}>
            <motion.div className="w-full max-w-lg rounded-xl border bg-white p-4 dark:bg-slate-900" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-semibold">Invite Admin Again</h3><button type="button" onClick={closeReinviteModal} className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={14} /></button></div>
              <p className="mb-3 text-sm muted">Send a new invite for <span className="font-medium text-slate-800 dark:text-slate-100">{selectedScopeName}</span></p>
              <label className="mb-3 block text-sm"><span className="mb-1 block text-xs text-slate-500">Email</span><input type="email" value={reinviteEmail} onChange={(e) => setReinviteEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500" /></label>
              {reinviteError ? <p className="mt-1 text-sm text-red-600">{reinviteError}</p> : null}
              <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={closeReinviteModal} className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button><button type="button" onClick={handleReinvite} disabled={isReinviting} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60">{isReinviting ? "Sending..." : "Send Invite"}</button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default GlobalHomeView;
