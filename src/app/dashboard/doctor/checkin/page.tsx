import { DoctorCheckInComponent } from "@/components/doctor-checkin"

export default function DoctorCheckInPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Check In/Out Management</h1>
        <p className="text-muted-foreground">
          Manage your hospital check-ins and availability status
        </p>
      </div>
      <DoctorCheckInComponent />
    </div>
  )
}