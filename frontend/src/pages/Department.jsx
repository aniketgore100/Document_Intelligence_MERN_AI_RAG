import React from "react";
import { Building2, CalendarDays, Mail, User, Shield } from "lucide-react";
import { useParams } from "react-router-dom";
import { useGetDepartmentByIdQuery } from "../features/departments/departmentsApiSlice";

const Department = () => {
  const { orgId, deptId } = useParams();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetDepartmentByIdQuery(
    { orgId, deptId },
    {
      skip: !orgId || !deptId,
    }
  );

  const department = data?.department;

  if (isLoading) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading department...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center">
        <p className="text-sm text-red-600">
          {error?.data?.message || "Failed to load department"}
        </p>
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

  return (
    <section className="space-y-4 p-1">

      {/* Details Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Department Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Department Details
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Department Name</p>
              <p className="font-medium">{department.name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Slug</p>
              <p className="font-medium">{department.slug}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Department ID</p>
              <p className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">
                {department.id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Organization ID</p>
              <p className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">
                {department.organization}
              </p>
            </div>
          </div>
        </div>

        {/* Department Owner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Department Owner
          </h2>

          {department.Owner ? (
            <>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <User size={18} />
                </div>

                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {department.Owner.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    Department Administrator
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={14} />
                {department.Owner.email}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
              No department owner assigned.
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Metadata
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <CalendarDays size={16} className="mt-1 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Created At</p>
              <p className="text-sm font-medium">
                {new Date(department.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarDays size={16} className="mt-1 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Last Updated</p>
              <p className="text-sm font-medium">
                {new Date(department.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield size={16} className="mt-1 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Created By</p>
              <p className="break-all text-sm font-medium">
                {department.createdBy}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Department;