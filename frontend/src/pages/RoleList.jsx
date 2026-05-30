import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Shield } from "lucide-react";
import { useState } from "react";
import { useGetRolesQuery } from "../features/roles/rolesApiSlice";
import { formatRoleName } from "../utils/formatRoleName";

const RoleList = () => {
  const { data, isLoading, isError, error } = useGetRolesQuery();

  const roles = data?.roles || [];
  const [openRoleIds, setOpenRoleIds] = useState({});

  const toggleRole = (roleId) => {
    setOpenRoleIds((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

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
            <p className="col-span-8">Permissions</p>
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

                    <div className="col-span-8">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{permissions.length} permissions</span>
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
                          <div className="col-span-8">
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
    </motion.section>
  );
};

export default RoleList;
