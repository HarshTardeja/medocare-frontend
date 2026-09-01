"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ResourceManager } from "@/components/admin/resource-manager"
import { useNurses, useCreateNurse, useHospitals } from "@/hooks/use-api"
import { NurseResponse } from "@/types/api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/admin" },
  { title: "Nurses" },
]

export default function AdminNursesPage() {
  const { data: nurses = [], isLoading } = useNurses()
  const { data: hospitals = [] } = useHospitals()
  const create = useCreateNurse()

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["admin"]}>
      <ResourceManager<NurseResponse>
        title="Nurses"
        description="Create nurse logins and assign them to a hospital."
        addLabel="Add nurse"
        rows={nurses}
        isLoading={isLoading}
        creating={create.isPending}
        onCreate={(values) =>
          create.mutateAsync({ ...values, hospital_id: Number(values.hospital_id) } as any)
        }
        fields={[
          { name: "full_name", label: "Full name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "password", label: "Temporary password", type: "password", required: true },
          { name: "license_number", label: "License number", required: true },
          { name: "department", label: "Department", required: true },
          { name: "shift", label: "Shift", required: true, placeholder: "Morning / Evening / Night" },
          { name: "years_of_experience", label: "Years of experience", type: "number", required: true },
          {
            name: "hospital_id",
            label: "Hospital",
            type: "select",
            required: true,
            options: hospitals.map((h) => ({ value: String(h.id), label: h.name })),
          },
        ]}
        columns={[
          { key: "license_number", label: "License" },
          { key: "department", label: "Department" },
          { key: "shift", label: "Shift" },
          { key: "years_of_experience", label: "Experience (yrs)" },
          {
            key: "hospital_id",
            label: "Hospital",
            render: (r) =>
              hospitals.find((h) => h.id === r.hospital_id)?.name ?? r.hospital_id,
          },
        ]}
      />
    </DashboardLayout>
  )
}
