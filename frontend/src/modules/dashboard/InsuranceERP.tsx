import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import Sidebar from "../../components/layout/Sidebar"
import TopBar from "../../components/layout/TopBar"
import DashboardPage from "./DashboardPage"
import ClientsPage from "../clients/ClientsPage"
import InsurersPage from "../insurers/InsurersPage"
import PoliciesPage from "../policies/PoliciesPage"
import RenewalsPage from "../renewals/RenewalsPage"
import ClaimsPage from "../claims/ClaimsPage"
import PaymentsPage from "../payments/PaymentsPage"
import CommissionsPage from "../commissions/CommissionsPage"
import UsersPage from "../users/UsersPage"
import ReportsPage from "../reports/ReportsPage"
import NotificationManager from "../notifications/NotificationManager"
import AIAssistantPage from "../ai/AIAssistantPage"
import CompaniesPage from "../companies/CompaniesPage"
import PermissionsPage from "../permissions/PermissionsPage"
import InsuranceSalesPage from "../insurance-sales/InsuranceSalesPage"

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  "insurance-sales": "Venta de Seguros",
  clients: "Clientes",
  insurers: "Aseguradoras",
  policies: "Pólizas",
  renewals: "Renovaciones",
  claims: "Siniestros",
  payments: "Pagos",
  commissions: "Comisiones",
  users: "Usuarios",
  reports: "Reportes",
  notifications: "Notificaciones",
  ai: "Asistente IA",
  companies: "Empresas",
  permissions: "Permisos",
}

export default function InsuranceERP() {
  const { user } = useAuth()
  const [activeModule, setActiveModule] = useState("dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario"
  const userRole = user?.user_metadata?.role || "Usuario"

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <DashboardPage />
      case "insurance-sales": return <InsuranceSalesPage />
      case "clients": return <ClientsPage />
      case "insurers": return <InsurersPage />
      case "policies": return <PoliciesPage />
      case "renewals": return <RenewalsPage />
      case "claims": return <ClaimsPage />
      case "payments": return <PaymentsPage />
      case "commissions": return <CommissionsPage />
      case "users": return <UsersPage />
      case "reports": return <ReportsPage />
      case "notifications": return <NotificationManager />
      case "ai": return <AIAssistantPage />
      case "companies": return <CompaniesPage />
      case "permissions": return <PermissionsPage />
      default: return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar
        active={activeModule}
        setActive={setActiveModule}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <TopBar
        title={titles[activeModule] || "Dashboard"}
        collapsed={collapsed}
        userName={userName}
        userRole={userRole}
        onMenuClick={() => setMobileMenuOpen(true)}
      />
      <main className={`pt-24 pb-8 px-4 md:px-6 transition-all duration-300 ${collapsed ? "md:ml-[68px]" : "md:ml-[250px]"}`}>
        {renderModule()}
      </main>
    </div>
  )
}
