"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ResourceManager } from "@/components/admin/resource-manager"
import { useDiagnosticCenters, useCreateDiagnosticCenter } from "@/hooks/use-api"
import { DiagnosticCenterResponse } from "@/types/api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/admin" },
  { title: "Diagnostic Centers" },
]

export default function AdminDiagnosticCentersPage() {
  const { data: centers = [], isLoading } = useDiagnosticCenters()
  const create = useCreateDiagnosticCenter()

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["admin"]}>
      <ResourceManager<DiagnosticCenterResponse>
        title="Diagnostic Centers"
        description="Create lab / diagnostic-center logins."
        addLabel="Add diagnostic center"
        rows={centers}
        isLoading={isLoading}
        creating={create.isPending}
        onCreate={(values) => create.mutateAsync(values as any)}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "password", label: "Temporary password", type: "password", required: true },
          { name: "license_number", label: "License number", required: true },
          { name: "address", label: "Address", required: true },
          { name: "phone", label: "Phone", required: true },
          { name: "services_offered", label: "Services offered", placeholder: "Pathology, Radiology, ECG…" },
          { name: "latitude", label: "Latitude", type: "number" },
          { name: "longitude", label: "Longitude", type: "number" },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "services_offered", label: "Services" },
          { key: "license_number", label: "License" },
          {
            key: "is_active",
            label: "Active",
            render: (r) => (r.is_active ? "Yes" : "No"),
          },
        ]}
      />
    </DashboardLayout>
  )
}
