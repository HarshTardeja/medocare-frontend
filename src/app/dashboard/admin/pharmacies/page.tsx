"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ResourceManager } from "@/components/admin/resource-manager"
import { usePharmacies, useCreatePharmacy } from "@/hooks/use-api"
import { PharmacyResponse } from "@/types/api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/admin" },
  { title: "Pharmacies" },
]

export default function AdminPharmaciesPage() {
  const { data: pharmacies = [], isLoading } = usePharmacies()
  const create = useCreatePharmacy()

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["admin"]}>
      <ResourceManager<PharmacyResponse>
        title="Pharmacies"
        description="Create pharmacy logins for dispensing partners."
        addLabel="Add pharmacy"
        rows={pharmacies}
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
          { name: "latitude", label: "Latitude", type: "number" },
          { name: "longitude", label: "Longitude", type: "number" },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "address", label: "Address" },
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
