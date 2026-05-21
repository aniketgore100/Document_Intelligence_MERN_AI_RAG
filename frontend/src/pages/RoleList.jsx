import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight, Pencil, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useCreateRoleMutation,
  useGetRolesQuery,
  useUpdateRolePermissionsMutation,
} from "../features/roles/rolesApiSlice";
import { getAllowedPermissionsForRole } from "../constants/permissions";
import { ROLES } from "../constants/roles";
import { formatRoleName } from "../utils/formatRoleName";

const RoleList = () => {
  const { data, isLoading, isError, error } = useGetRolesQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRolePermissions, { isLoading: isUpdating }] = useUpdateRolePermissionsMutation();

  const roles = data?.roles || [];
  const [openRoleIds, setOpenRoleIds] = useState({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRoleName, setSelectedRoleName] = useState(ROLES.ORG_ADMIN);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [createError, setCreateError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const openModal = () => setIsCreateOpen(true);
    window.addEventListener("open-create-role", openModal);
    return () => window.removeEventListener("open-create-role", openModal);
  }, []);

  const toggleRole = (roleId) => {
    setOpenRoleIds((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  const togglePermission = (permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setSelectedRoleName(ROLES.ORG_ADMIN);
    setSelectedPermissions([]);
    setCreateError("");
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setEditPermissions(Array.isArray(role.permissions) ? role.permissions : []);
    setEditError("");
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingRole(null);
    setEditPermissions([]);
    setEditError("");
  };

  const toggleEditPermission = (permission) => {
    setEditPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const handleCreateRole = async () => {
    setCreateError("");
    const allowedForSelectedRole = getAllowedPermissionsForRole(selectedRoleName);

    try {
      await createRole({
        name: selectedRoleName,
        permissions: selectedPermissions.filter((permission) =>
          allowedForSelectedRole.includes(permission)
        ),
      }).unwrap();
      closeCreateModal();
    } catch (err) {
      setCreateError(err?.data?.message || "Failed to create role");
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingRole?._id) return;
    setEditError("");
    const allowedForRole = getAllowedPermissionsForRole(editingRole?.name);

    try {
      await updateRolePermissions({
        id: editingRole._id,
        permissions: editPermissions.filter((permission) => allowedForRole.includes(permission)),
      }).unwrap();
      closeEditModal();
    } catch (err) {
      setEditError(err?.data?.message || "Failed to update permissions");
    }
  };

  const createPermissionOptions = getAllowedPermissionsForRole(selectedRoleName);
  const editPermissionOptions = getAllowedPermissionsForRole(editingRole?.name);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {isLoading && <div className="rounded-xl border bg-transparent p-3 text-sm">Loading roles...</div>}
      {isError && (
        <div className="rounded-xl border bg-transparent p-3 text-sm text-red-600">{error?.data?.message || "Failed to load roles"}</div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl bg-transparent">
          <div className="grid grid-cols-12 border-b bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-300">
            <p className="col-span-4">Role</p>
            <p className="col-span-6">Permissions</p>
            <p className="col-span-2 text-right pr-2">Action</p>
          </div>

          <div className="max-h-[68vh] overflow-y-auto">
            {roles.length === 0 && <div className="px-4 py-4 text-sm muted">No roles found.</div>}

            {roles.map((role, idx) => {
              const isOpen = !!openRoleIds[role._id];
              const permissions = role.permissions || [];

              return (
                <motion.div
                  key={role._id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, delay: idx * 0.015 }}
                  className="border-b last:border-b-0"
                >
                  <div className="grid grid-cols-12 items-center gap-2 px-4 py-3 transition-colors duration-150 hover:bg-slate-100/55 dark:hover:bg-slate-800/30">
                    <button
                      type="button"
                      onClick={() => toggleRole(role._id)}
                      className="col-span-4 flex items-center gap-2.5 text-left"
                    >
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <Shield size={14} />
                      </span>
                      <span className="text-xs font-medium leading-5 text-slate-800 dark:text-slate-100">
                        {formatRoleName(role.name)}
                      </span>
                    </button>

                    <div className="col-span-6">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{permissions.length} permissions</span>
                    </div>

                    <div className="col-span-2 flex justify-end pr-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(role)}
                        className="rounded-lg border p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={`Edit ${role.name}`}
                        aria-label={`Edit ${role.name}`}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-12 px-4 pb-3">
                          <div className="col-span-4" />
                          <div className="col-span-6">
                            {permissions.length ? (
                              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                {permissions.map((permission) => (
                                  <li key={permission} className="rounded-md border bg-transparent px-2.5 py-1 leading-5">
                                    {permission}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-sm muted">No permissions assigned</span>
                            )}
                          </div>
                          <div className="col-span-2" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreateModal}
          >
            <motion.div
              className="w-full max-w-2xl rounded-xl border bg-white p-4 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Create Role</h3>
                <button type="button" onClick={closeCreateModal} className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={14} />
                </button>
              </div>

              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs text-slate-500">Role</span>
                <select
                  value={selectedRoleName}
                  onChange={(e) => {
                    setSelectedRoleName(e.target.value);
                    setSelectedPermissions([]);
                  }}
                  className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {Object.values(ROLES).map((roleName) => (
                    <option key={roleName} value={roleName}>
                      {formatRoleName(roleName)}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="mb-2 text-xs text-slate-500">Select Permissions</p>
                <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
                  {createPermissionOptions.map((permission) => {
                    const selected = selectedPermissions.includes(permission);
                    return (
                      <button
                        key={permission}
                        type="button"
                        onClick={() => togglePermission(permission)}
                        className={`flex items-center justify-between rounded-md border px-2.5 py-2 text-left text-sm transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{permission}</span>
                        {selected ? <Check size={14} /> : null}
                      </button>
                    );
                  })}
                  {createPermissionOptions.length === 0 ? (
                    <p className="text-xs text-slate-500">No permissions available for this role.</p>
                  ) : null}
                </div>
              </div>

              {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}

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
                  onClick={handleCreateRole}
                  disabled={isCreating}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isCreating ? "Creating..." : "Create Role"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditModal}
          >
            <motion.div
              className="w-full max-w-2xl rounded-xl border bg-white p-4 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  Edit Permissions: {formatRoleName(editingRole?.name)}
                </h3>
                <button type="button" onClick={closeEditModal} className="rounded-md border p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={14} />
                </button>
              </div>

              <div>
                <p className="mb-2 text-xs text-slate-500">Select Permissions</p>
                <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
                  {editPermissionOptions.map((permission) => {
                    const selected = editPermissions.includes(permission);
                    return (
                      <button
                        key={permission}
                        type="button"
                        onClick={() => toggleEditPermission(permission)}
                        className={`flex items-center justify-between rounded-md border px-2.5 py-2 text-left text-sm transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{permission}</span>
                        {selected ? <Check size={14} /> : null}
                      </button>
                    );
                  })}
                  {editPermissionOptions.length === 0 ? (
                    <p className="text-xs text-slate-500">No permissions available for this role.</p>
                  ) : null}
                </div>
              </div>

              {editError ? <p className="mt-2 text-sm text-red-600">{editError}</p> : null}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePermissions}
                  disabled={isUpdating}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default RoleList;
