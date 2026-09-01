"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ResourceManager } from "@/components/admin/resource-manager"
import { useDoctors, useCreateDoctor, useHospitals } from "@/hooks/use-api"
import { DoctorResponse } from "@/types/api"

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard/admin" },
  { title: "Doctors" },
]

export default function AdminDoctorsPage() {
  const { data: doctors = [], isLoading } = useDoctors()
  const { data: hospitals = [] } = useHospitals()
  const create = useCreateDoctor()

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} allowedRoles={["admin"]}>
      <ResourceManager<DoctorResponse>
        title="Doctors"
        description="Create doctor logins and assign them to a hospital."
        addLabel="Add doctor"
        rows={doctors}
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
          { name: "specialization", label: "Specialization", required: true },
          { name: "qualification", label: "Qualification", required: true },
          { name: "years_of_experience", label: "Years of experience", type: "number", required: true },
          { name: "consultation_fee", label: "Consultation fee", type: "number" },
          {
            name: "hospital_id",
            label: "Hospital",
            type: "select",
            required: true,
            options: hospitals.map((h) => ({ value: String(h.id), label: h.name })),
          },
        ]}
        columns={[
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "specialization", label: "Specialization" },
          { key: "license_number", label: "License" },
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
