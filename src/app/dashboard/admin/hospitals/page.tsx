"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ResourceManager } from "@/components/admin/resource-manager"
import { useHospitals, useCreateHospital } from "@/hooks/use-api"
import { HospitalResponse } from "@/types/api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/admin" },
  { title: "Hospitals" },
]

export default function AdminHospitalsPage() {
  const { data: hospitals = [], isLoading } = useHospitals()
  const create = useCreateHospital()

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["admin"]}>
      <ResourceManager<HospitalResponse>
        title="Hospitals"
        description="Register and review hospitals on the network."
        addLabel="Add hospital"
        rows={hospitals}
        isLoading={isLoading}
        creating={create.isPending}
        onCreate={(values) => create.mutateAsync(values as any)}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "address", label: "Address", required: true },
          { name: "phone", label: "Phone", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "license_number", label: "License number", required: true },
          { name: "latitude", label: "Latitude", type: "number" },
          { name: "longitude", label: "Longitude", type: "number" },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "address", label: "Address" },
          { key: "phone", label: "Phone" },
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
