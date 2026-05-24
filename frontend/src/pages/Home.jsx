import { AnimatePresence, motion } from "framer-motion";
import { Building2, Pencil, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useCreateOrganizationMutation,
  useGetOrganizationsQuery,
} from "../features/organizations/organizationsApiSlice";
import { useCreateOrganizationInviteMutation } from "../features/invites/invitesApiSlice";

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

const Home = () => {
  const { data, isLoading, isError, error } = useGetOrganizationsQuery({ page: 1, limit: 50 });
  const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationMutation();
  const [createInvite, { isLoading: isReinviting }] = useCreateOrganizationInviteMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [orgAdminEmail, setOrgAdminEmail] = useState("");
  const [createError, setCreateError] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());
  const [isReinviteOpen, setIsReinviteOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedOrgName, setSelectedOrgName] = useState("");
  const [reinviteEmail, setReinviteEmail] = useState("");
  const [reinviteError, setReinviteError] = useState("");

  const organizations = data?.organizations || [];
  const hasOrganizations = organizations.length > 0;

  const formattedRows = useMemo(() => {
    return organizations.map((org) => {
      const owner = org.Owner || org.owner || null;
      const pendingTime = formatTimeRemaining(org.inviteExpiresAt, nowTs);
      const inviteExpired = Boolean(org.inviteStatus === "expired" || (org.inviteStatus === "pending" && !pendingTime));
      return {
        id: org.id,
        name: org.name,
        ownerName: typeof owner === "object" ? owner?.name : "",
        ownerEmail: typeof owner === "object" ? owner?.email : "",
        status: org.status,
        inviteStatus: org.inviteStatus || null,
        inviteEmail: org.inviteEmail || org?.metadata?.orgAdminEmail || "",
        inviteExpiresAt: org.inviteExpiresAt || null,
        pendingTime,
        inviteExpired,
        createdAt: org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "-",
      };
    });
  }, [organizations, nowTs]);

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setName("");
    setOrgAdminEmail("");
    setCreateError("");
  };

  const closeReinviteModal = () => {
    setIsReinviteOpen(false);
    setSelectedOrgId("");
    setSelectedOrgName("");
    setReinviteEmail("");
    setReinviteError("");
  };

  useEffect(() => {
    const openModal = () => setIsCreateOpen(true);
    window.addEventListener("open-create-organization", openModal);
    return () => window.removeEventListener("open-create-organization", openModal);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreate = async () => {
    setCreateError("");
    if (!name.trim()) {
      setCreateError("Organization name is required");
      return;
    }
    if (!orgAdminEmail.trim()) {
      setCreateError("Organization admin email is required");
      return;
    }
    if (!EMAIL_REGEX.test(orgAdminEmail.trim())) {
      setCreateError("Enter a valid organization admin email");
      return;
    }

    try {
      await createOrganization({
        name: name.trim(),
        metadata: {
          orgAdminEmail: orgAdminEmail.trim(),
        },
      }).unwrap();
      closeCreateModal();
    } catch (err) {
      setCreateError(err?.data?.message || "Failed to create organization");
    }
  };

  const openReinviteModal = ({ orgId, orgName, email }) => {
    setSelectedOrgId(orgId);
    setSelectedOrgName(orgName);
    setReinviteEmail(email || "");
    setReinviteError("");
    setIsReinviteOpen(true);
  };

  const handleReinvite = async () => {
    setReinviteError("");
    if (!selectedOrgId) {
      setReinviteError("Organization is required.");
      return;
    }
    if (!reinviteEmail.trim()) {
      setReinviteError("Organization admin email is required.");
      return;
    }
    if (!EMAIL_REGEX.test(reinviteEmail.trim())) {
      setReinviteError("Enter a valid organization admin email.");
      return;
    }

    try {
      await createInvite({
        organizationId: selectedOrgId,
        email: reinviteEmail.trim(),
      }).unwrap();
      closeReinviteModal();
    } catch (err) {
      setReinviteError(err?.data?.message || "Failed to send invite.");
    }
  };

  return (
    <section className="space-y-3 p-1">
     

      {isLoading ? (
        <div className="rounded-xl border bg-transparent p-3 text-sm">Loading organizations...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border bg-transparent p-3 text-sm text-red-600">
          {error?.data?.message || "Failed to load organizations"}
        </div>
      ) : null}

      {!isLoading && !isError && !hasOrganizations ? (
        <div className="flex min-h-[58vh] items-center justify-center rounded-xl  bg-transparent">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="surface flex w-full max-w-sm flex-col items-center rounded-2xl px-6 py-8 text-center transition hover:border-blue-300 dark:hover:border-blue-600"
          >
            <span className="mb-3 rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <Building2 size={22} />
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Create Organization</p>
            <p className="mt-1 text-xs muted">No organizations found. Create your first organization.</p>
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && hasOrganizations ? (
        <div className="overflow-hidden rounded-xl bg-transparent">
          <div className="grid grid-cols-12 border-b bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-300">
            <p className="col-span-4">Organization Name</p>
            <p className="col-span-2">Owner</p>
            <p className="col-span-2">Status</p>
            <p className="col-span-2">Created Date</p>
            <p className="col-span-2 text-right pr-2">Actions</p>
          </div>

          <div className="max-h-[66vh] overflow-y-auto">
            {formattedRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm transition-colors duration-150 hover:bg-slate-100/55 dark:hover:bg-slate-800/30"
              >
                <div className="col-span-4">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
                </div>
                <div className="col-span-2 text-slate-600 dark:text-slate-300">
                  {row.ownerName || row.ownerEmail ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {row.ownerName || row.ownerEmail}
                      </p>
                      {row.ownerEmail && row.ownerName ? (
                        <p className="text-xs muted">{row.ownerEmail}</p>
                      ) : null}
                    </div>
                  ) : row.inviteStatus === "pending" && row.pendingTime ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        Invite pending
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-300/90">{row.pendingTime}</p>
                    </div>
                  ) : row.inviteExpired ? (
                    <button
                      type="button"
                      onClick={() =>
                        openReinviteModal({
                          orgId: row.id,
                          orgName: row.name,
                          email: row.inviteEmail,
                        })
                      }
                      className="rounded-md border px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      Invite Again
                    </button>
                  ) : (
                    "-"
                  )}
                </div>
                <div className="col-span-2">
                  <span className="rounded-md border px-2 py-0.5 text-xs capitalize">{row.status}</span>
                </div>
                <div className="col-span-2 text-slate-600 dark:text-slate-300">{row.createdAt}</div>
                <div className="col-span-2 flex justify-end pr-2">
                  <button
                    type="button"
                    className="rounded-lg border p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={`Edit ${row.name}`}
                    aria-label={`Edit ${row.name}`}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {isCreateOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreateModal}
          >
            <motion.div
              className="w-full max-w-lg rounded-xl border bg-white p-4 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Create Organization</h3>
                <button type="button" onClick={closeCreateModal} className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={14} />
                </button>
              </div>

              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs text-slate-500">Organization Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs text-slate-500">Invite Organization Admin</span>
                <input
                  type="email"
                  value={orgAdminEmail}
                  onChange={(e) => setOrgAdminEmail(e.target.value)}
                  placeholder="org-admin@company.com"
                  className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>

              {createError ? <p className="mt-1 text-sm text-red-600">{createError}</p> : null}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isCreating ? "Creating..." : "Create Organization"}
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Invite Organization Admin</h3>
                <button type="button" onClick={closeReinviteModal} className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={14} />
                </button>
              </div>

              <p className="mb-3 text-sm muted">
                Send a new invite for <span className="font-medium text-slate-800 dark:text-slate-100">{selectedOrgName}</span>
              </p>

              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs text-slate-500">Organization Admin Email</span>
                <input
                  type="email"
                  value={reinviteEmail}
                  onChange={(e) => setReinviteEmail(e.target.value)}
                  placeholder="org-admin@company.com"
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

export default Home;
