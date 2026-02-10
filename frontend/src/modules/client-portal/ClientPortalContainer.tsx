import { useState } from "react"
import ClientSidebar from "../../components/layout/ClientSidebar"
import ClientTopBar from "../../components/layout/ClientTopBar"
import ClientDashboard from "./ClientDashboard"
import ClientPoliciesPage from "./ClientPoliciesPage"
import ClientPaymentsPage from "./ClientPaymentsPage"
import ClientRenewalsPage from "./ClientRenewalsPage"
import ClientClaimsPage from "./ClientClaimsPage"
import ClientProfilePage from "./ClientProfilePage"

const titles: Record<string, string> = {
  dashboard: "Inicio",
  policies: "Mis Pólizas",
  payments: "Pagos",
  renewals: "Renovaciones",
  claims: "Reclamos",
  profile: "Mi Perfil",
}

export default function ClientPortalContainer() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <ClientDashboard />
      case "policies":
        return <ClientPoliciesPage />
      case "payments":
        return <ClientPaymentsPage />
      case "renewals":
        return <ClientRenewalsPage />
      case "claims":
        return <ClientClaimsPage />
      case "profile":
        return <ClientProfilePage />
      default:
        return <ClientDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <ClientSidebar
        active={activeModule}
        setActive={setActiveModule}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <ClientTopBar
        title={titles[activeModule] || "Portal de Clientes"}
        collapsed={collapsed}
        onMenuClick={() => setMobileMenuOpen(true)}
      />
      <main className={`pt-24 pb-8 px-4 md:px-6 transition-all duration-300 ${collapsed ? "md:ml-[68px]" : "md:ml-[250px]"}`}>
        {renderModule()}
      </main>
    </div>
  )
}
