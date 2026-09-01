"use client"

import * as React from "react"
import {
  Heart,
  User,
  Calendar,
  FileText,
  Pill,
  TestTube,
  Users,
  Building2,
  Stethoscope,
  UserCheck,
  QrCode,
  BarChart3,
  CreditCard,
  ClipboardList,
  LogIn,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

// Navigation data based on user role
const getNavigationData = (userRole: string, user: any) => {
  const baseData = {
    user: {
      name: user?.full_name || (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}`.trim() : "") || user?.email || "User",
      email: user?.email || "",
      avatar: "/avatars/default.jpg",
    },
    teams: [
      {
        name: "MediLink",
        logo: Heart,
        plan: "Healthcare",
      },
    ],
  };

  switch (userRole) {
    case 'patient':
      return {
        ...baseData,
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard/patient",
            icon: BarChart3,
            isActive: true,
          },
          {
            title: "My Profile",
            url: "/dashboard/patient/profile",
            icon: User,
          },
          {
            title: "Medical Records",
            url: "/dashboard/patient/medical-records",
            icon: FileText,
          },
          {
            title: "Prescriptions",
            url: "/dashboard/patient/prescriptions",
            icon: Pill,
          },
          {
            title: "Lab Reports",
            url: "/dashboard/patient/lab-reports",
            icon: TestTube,
          },
          {
            title: "QR Access",
            url: "/dashboard/patient/qr-access",
            icon: QrCode,
          },
          {
            title: "Appointments",
            url: "/dashboard/patient/appointments",
            icon: Calendar,
          },
        ],
        projects: [],
      };

    case 'doctor':
      return {
        ...baseData,
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard/doctor",
            icon: BarChart3,
            isActive: true,
          },
          {
            title: "Check In/Out",
            url: "/dashboard/doctor/checkin",
            icon: LogIn,
          },
          {
            title: "My Patients",
            url: "/dashboard/doctor/patients",
            icon: Users,
          },
          {
            title: "Appointments",
            url: "/dashboard/doctor/appointments",
            icon: Calendar,
          },
          {
            title: "Queue Management",
            url: "/dashboard/doctor/queue-management",
            icon: ClipboardList,
            items: [
              {
                title: "View Queue",
                url: "/dashboard/doctor/queue-management",
              },
            ],
          },
          {
            title: "Medical Records",
            url: "/dashboard/doctor/medical-records",
            icon: FileText,
            items: [
              {
                title: "Create Record",
                url: "/dashboard/doctor/medical-records/create",
              },
              {
                title: "View Records",
                url: "/dashboard/doctor/medical-records",
              },
            ],
          },
          {
            title: "Prescriptions",
            url: "/dashboard/doctor/prescriptions",
            icon: Pill,
            items: [
              {
                title: "Create Prescription",
                url: "/dashboard/doctor/prescriptions/create",
              },
              {
                title: "View Prescriptions",
                url: "/dashboard/doctor/prescriptions",
              },
            ],
          },
        ],
        projects: [],
      };

    case 'admin':
      return {
        ...baseData,
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard/admin",
            icon: BarChart3,
            isActive: true,
          },
          {
            title: "User Management",
            url: "/dashboard/admin/users",
            icon: Users,
          },
          {
            title: "Healthcare Providers",
            url: "#",
            icon: Building2,
            items: [
              {
                title: "Hospitals",
                url: "/dashboard/admin/hospitals",
              },
              {
                title: "Doctors",
                url: "/dashboard/admin/doctors",
              },
              {
                title: "Nurses",
                url: "/dashboard/admin/nurses",
              },
              {
                title: "Pharmacies",
                url: "/dashboard/admin/pharmacies",
              },
              {
                title: "Diagnostic Centers",
                url: "/dashboard/admin/diagnostic-centers",
              },
            ],
          },
        ],
        projects: [],
      };

    case 'pharmacy':
      return {
        ...baseData,
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard/pharmacy",
            icon: BarChart3,
            isActive: true,
          },
          {
            title: "Find prescriptions",
            url: "/dashboard/pharmacy#search",
            icon: Pill,
          },
          {
            title: "Dispensed history",
            url: "/dashboard/pharmacy#dispensed",
            icon: CreditCard,
          },
        ],
        projects: [],
      };

    case 'nurse':
      return {
        ...baseData,
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard/nurse",
            icon: BarChart3,
            isActive: true,
          },
          {
            title: "Patient Lookup",
            url: "/dashboard/nurse#patient-lookup",
            icon: UserCheck,
          },
          {
            title: "Doctor Queues",
            url: "/dashboard/nurse#doctor-queues",
            icon: ClipboardList,
          },
        ],
        projects: [],
      };

    case 'diagnostic_center':
      return {
        ...baseData,
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard/diagnostic-center",
            icon: BarChart3,
            isActive: true,
          },
          {
            title: "Request Queue",
            url: "/dashboard/diagnostic-center#requests",
            icon: ClipboardList,
          },
          {
            title: "QR Lookup",
            url: "/dashboard/diagnostic-center#qr-lookup",
            icon: QrCode,
          },
        ],
        projects: [],
      };

    default:
      return {
        ...baseData,
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: BarChart3,
            isActive: true,
          },
        ],
        projects: [],
      };
  }
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const data = getNavigationData(user?.role || '', user);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
