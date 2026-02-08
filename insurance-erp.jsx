import { useState, useEffect, useMemo, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { Search, Bell, Users, Shield, FileText, Calendar, DollarSign, AlertTriangle, Settings, Home, Building2, ChevronDown, Plus, Eye, Edit, Trash2, X, Check, Clock, TrendingUp, TrendingDown, Filter, Download, Upload, Phone, Mail, MapPin, Hash, CreditCard, Briefcase, UserCheck, BarChart3, PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight, ChevronRight, Menu, LogOut, User, Lock, Layers, FolderOpen, MessageSquare, RefreshCw, Star, AlertCircle, CheckCircle, XCircle, Printer, Send } from "lucide-react";

// ==================== DATA STORE ====================
const INITIAL_DATA = {
  clients: [
    { id: 1, type: "fisica", name: "María García Pérez", cedula: "001-0012345-6", phone: "809-555-0101", email: "maria.garcia@email.com", address: "Av. Winston Churchill #45, Piantini, Santo Domingo", status: "activo", created: "2024-01-15", policies: 3, balance: 15000 },
    { id: 2, type: "juridica", name: "Comercial Rodríguez SRL", cedula: "130456789", phone: "809-555-0202", email: "info@comercialrodriguez.com.do", address: "C/ El Conde #200, Zona Colonial, Santo Domingo", status: "activo", created: "2024-02-20", policies: 5, balance: 85000 },
    { id: 3, type: "fisica", name: "Juan Martínez López", cedula: "402-0098765-4", phone: "829-555-0303", email: "juan.martinez@email.com", address: "Av. 27 de Febrero #300, Naco, Santo Domingo", status: "activo", created: "2024-03-10", policies: 2, balance: 8500 },
    { id: 4, type: "juridica", name: "Inversiones del Caribe SA", cedula: "101234567", phone: "809-555-0404", email: "admin@invcaribe.com.do", address: "Av. Abraham Lincoln #900, Torre Empresarial", status: "suspendido", created: "2023-11-05", policies: 8, balance: 250000 },
    { id: 5, type: "fisica", name: "Ana Belén Sánchez", cedula: "031-0054321-8", phone: "849-555-0505", email: "anabelen@email.com", address: "C/ Duarte #55, Santiago de los Caballeros", status: "activo", created: "2024-04-01", policies: 1, balance: 4200 },
    { id: 6, type: "fisica", name: "Carlos Eduardo Reyes", cedula: "001-0067890-2", phone: "809-555-0606", email: "carlos.reyes@email.com", address: "Av. Lope de Vega #120, Ensanche Naco", status: "activo", created: "2024-05-12", policies: 4, balance: 32000 },
    { id: 7, type: "juridica", name: "Tech Solutions Dominicana SRL", cedula: "131567890", phone: "809-555-0707", email: "info@techsolutions.do", address: "Blue Mall, Av. Churchill, Piso 8", status: "activo", created: "2024-01-28", policies: 6, balance: 120000 },
    { id: 8, type: "fisica", name: "Rosa María Hernández", cedula: "054-0011223-5", phone: "829-555-0808", email: "rosa.hernandez@email.com", address: "C/ Sánchez #89, La Romana", status: "cancelado", created: "2023-08-15", policies: 0, balance: 0 },
  ],
  insurers: [
    { id: 1, name: "Seguros Universal", rnc: "101012345", phone: "809-544-7111", email: "comercial@universal.com.do", ramos: ["Vida", "Salud", "Vehículos", "Incendio", "Responsabilidad Civil"], commission: 18, status: "activa", policies: 45 },
    { id: 2, name: "Seguros Reservas", rnc: "101023456", phone: "809-960-3000", email: "ventas@segurosreservas.com", ramos: ["Vida", "Salud", "Vehículos", "Propiedad"], commission: 15, status: "activa", policies: 38 },
    { id: 3, name: "MAPFRE BHD Seguros", rnc: "101034567", phone: "809-562-2000", email: "corredor@mapfrebhd.com.do", ramos: ["Vehículos", "Salud", "Vida", "Hogar", "PYME"], commission: 20, status: "activa", policies: 52 },
    { id: 4, name: "Seguros Perelló", rnc: "101045678", phone: "809-472-2020", email: "info@segurosperello.com", ramos: ["Vida", "Salud", "Incendio"], commission: 16, status: "activa", policies: 22 },
    { id: 5, name: "La Colonial de Seguros", rnc: "101056789", phone: "809-544-2000", email: "comercial@lacolonial.com.do", ramos: ["Vehículos", "Vida", "Salud", "Fianzas"], commission: 17, status: "activa", policies: 30 },
    { id: 6, name: "Seguros Constitución", rnc: "101067890", phone: "809-920-2020", email: "info@segconstitucion.com", ramos: ["Vida", "Salud"], commission: 14, status: "inactiva", policies: 5 },
  ],
  policies: [
    { id: 1, number: "POL-2024-001", clientId: 1, clientName: "María García Pérez", insurerId: 1, insurerName: "Seguros Universal", type: "Vehículos", startDate: "2024-01-15", endDate: "2025-01-15", premium: 28500, paymentMethod: "Mensual", status: "vigente", commission: 5130 },
    { id: 2, number: "POL-2024-002", clientId: 2, clientName: "Comercial Rodríguez SRL", insurerId: 3, insurerName: "MAPFRE BHD Seguros", type: "PYME", startDate: "2024-02-01", endDate: "2025-02-01", premium: 185000, paymentMethod: "Trimestral", status: "vigente", commission: 37000 },
    { id: 3, number: "POL-2024-003", clientId: 1, clientName: "María García Pérez", insurerId: 2, insurerName: "Seguros Reservas", type: "Salud", startDate: "2024-03-01", endDate: "2025-03-01", premium: 45000, paymentMethod: "Mensual", status: "vigente", commission: 6750 },
    { id: 4, number: "POL-2024-004", clientId: 3, clientName: "Juan Martínez López", insurerId: 1, insurerName: "Seguros Universal", type: "Vida", startDate: "2024-04-01", endDate: "2025-04-01", premium: 18000, paymentMethod: "Anual", status: "vigente", commission: 3240 },
    { id: 5, number: "POL-2024-005", clientId: 4, clientName: "Inversiones del Caribe SA", insurerId: 3, insurerName: "MAPFRE BHD Seguros", type: "Propiedad", startDate: "2023-11-01", endDate: "2024-11-01", premium: 350000, paymentMethod: "Semestral", status: "vencida", commission: 70000 },
    { id: 6, number: "POL-2024-006", clientId: 6, clientName: "Carlos Eduardo Reyes", insurerId: 5, insurerName: "La Colonial de Seguros", type: "Vehículos", startDate: "2024-05-15", endDate: "2025-05-15", premium: 32000, paymentMethod: "Mensual", status: "vigente", commission: 5440 },
    { id: 7, number: "POL-2024-007", clientId: 7, clientName: "Tech Solutions Dominicana SRL", insurerId: 1, insurerName: "Seguros Universal", type: "Responsabilidad Civil", startDate: "2024-06-01", endDate: "2025-06-01", premium: 95000, paymentMethod: "Trimestral", status: "vigente", commission: 17100 },
    { id: 8, number: "POL-2024-008", clientId: 2, clientName: "Comercial Rodríguez SRL", insurerId: 2, insurerName: "Seguros Reservas", type: "Salud", startDate: "2024-01-01", endDate: "2025-01-01", premium: 120000, paymentMethod: "Mensual", status: "vigente", commission: 18000 },
    { id: 9, number: "POL-2024-009", clientId: 5, clientName: "Ana Belén Sánchez", insurerId: 4, insurerName: "Seguros Perelló", type: "Vida", startDate: "2024-07-01", endDate: "2025-07-01", premium: 12000, paymentMethod: "Anual", status: "vigente", commission: 1920 },
    { id: 10, number: "POL-2023-010", clientId: 8, clientName: "Rosa María Hernández", insurerId: 6, insurerName: "Seguros Constitución", type: "Salud", startDate: "2023-06-01", endDate: "2024-06-01", premium: 22000, paymentMethod: "Mensual", status: "cancelada", commission: 3080 },
  ],
  claims: [
    { id: 1, policyNumber: "POL-2024-001", clientName: "María García Pérez", insurerName: "Seguros Universal", type: "Colisión", date: "2024-08-15", description: "Accidente de tránsito en Av. 27 de Febrero", amount: 85000, status: "en_proceso", priority: "alta" },
    { id: 2, policyNumber: "POL-2024-003", clientName: "María García Pérez", insurerName: "Seguros Reservas", type: "Hospitalización", date: "2024-09-01", description: "Procedimiento quirúrgico programado", amount: 120000, status: "aprobado", priority: "media" },
    { id: 3, policyNumber: "POL-2024-005", clientName: "Inversiones del Caribe SA", insurerName: "MAPFRE BHD Seguros", type: "Incendio", date: "2024-07-20", description: "Daños por cortocircuito en almacén principal", amount: 450000, status: "en_revision", priority: "alta" },
    { id: 4, policyNumber: "POL-2024-006", clientName: "Carlos Eduardo Reyes", insurerName: "La Colonial de Seguros", type: "Robo", date: "2024-10-05", description: "Robo de vehículo en estacionamiento público", amount: 650000, status: "pendiente", priority: "alta" },
    { id: 5, policyNumber: "POL-2024-008", clientName: "Comercial Rodríguez SRL", insurerName: "Seguros Reservas", type: "Salud", date: "2024-10-10", description: "Atención de emergencia empleado", amount: 35000, status: "pagado", priority: "baja" },
  ],
  payments: [
    { id: 1, clientName: "María García Pérez", policyNumber: "POL-2024-001", amount: 2375, method: "Transferencia", date: "2024-10-01", status: "completado", concept: "Prima mensual Oct 2024" },
    { id: 2, clientName: "Comercial Rodríguez SRL", policyNumber: "POL-2024-002", amount: 46250, method: "Cheque", date: "2024-10-01", status: "completado", concept: "Prima trimestral Q4 2024" },
    { id: 3, clientName: "Juan Martínez López", policyNumber: "POL-2024-004", amount: 18000, method: "Tarjeta", date: "2024-04-01", status: "completado", concept: "Prima anual 2024-2025" },
    { id: 4, clientName: "Carlos Eduardo Reyes", policyNumber: "POL-2024-006", amount: 2667, method: "Transferencia", date: "2024-10-15", status: "completado", concept: "Prima mensual Oct 2024" },
    { id: 5, clientName: "Tech Solutions Dominicana SRL", policyNumber: "POL-2024-007", amount: 23750, method: "Transferencia", date: "2024-10-01", status: "pendiente", concept: "Prima trimestral Q4 2024" },
    { id: 6, clientName: "Ana Belén Sánchez", policyNumber: "POL-2024-009", amount: 12000, method: "Efectivo", date: "2024-07-01", status: "completado", concept: "Prima anual 2024-2025" },
    { id: 7, clientName: "Comercial Rodríguez SRL", policyNumber: "POL-2024-008", amount: 10000, method: "Transferencia", date: "2024-10-01", status: "completado", concept: "Prima mensual Oct 2024" },
    { id: 8, clientName: "María García Pérez", policyNumber: "POL-2024-003", amount: 3750, method: "Tarjeta", date: "2024-10-01", status: "completado", concept: "Prima mensual Oct 2024" },
  ],
  commissions: [
    { id: 1, producer: "Luis Fernández", policyNumber: "POL-2024-001", clientName: "María García Pérez", insurerName: "Seguros Universal", premium: 28500, rate: 18, amount: 5130, month: "Enero 2024", status: "pagada" },
    { id: 2, producer: "Luis Fernández", policyNumber: "POL-2024-002", clientName: "Comercial Rodríguez SRL", insurerName: "MAPFRE BHD Seguros", premium: 185000, rate: 20, amount: 37000, month: "Febrero 2024", status: "pagada" },
    { id: 3, producer: "Carmen Díaz", policyNumber: "POL-2024-003", clientName: "María García Pérez", insurerName: "Seguros Reservas", premium: 45000, rate: 15, amount: 6750, month: "Marzo 2024", status: "pagada" },
    { id: 4, producer: "Luis Fernández", policyNumber: "POL-2024-006", clientName: "Carlos Eduardo Reyes", insurerName: "La Colonial de Seguros", premium: 32000, rate: 17, amount: 5440, month: "Mayo 2024", status: "pendiente" },
    { id: 5, producer: "Carmen Díaz", policyNumber: "POL-2024-007", clientName: "Tech Solutions Dominicana SRL", insurerName: "Seguros Universal", premium: 95000, rate: 18, amount: 17100, month: "Junio 2024", status: "pagada" },
    { id: 6, producer: "Roberto Matos", policyNumber: "POL-2024-009", clientName: "Ana Belén Sánchez", insurerName: "Seguros Perelló", premium: 12000, rate: 16, amount: 1920, month: "Julio 2024", status: "pagada" },
  ],
  renewals: [
    { id: 1, policyNumber: "POL-2024-001", clientName: "María García Pérez", insurerName: "Seguros Universal", type: "Vehículos", endDate: "2025-01-15", daysLeft: 70, status: "pendiente", notified: true },
    { id: 2, policyNumber: "POL-2024-008", clientName: "Comercial Rodríguez SRL", insurerName: "Seguros Reservas", type: "Salud", endDate: "2025-01-01", daysLeft: 56, status: "pendiente", notified: true },
    { id: 3, policyNumber: "POL-2024-002", clientName: "Comercial Rodríguez SRL", insurerName: "MAPFRE BHD Seguros", type: "PYME", endDate: "2025-02-01", daysLeft: 87, status: "pendiente", notified: false },
    { id: 4, policyNumber: "POL-2024-003", clientName: "María García Pérez", insurerName: "Seguros Reservas", type: "Salud", endDate: "2025-03-01", daysLeft: 115, status: "pendiente", notified: false },
    { id: 5, policyNumber: "POL-2024-005", clientName: "Inversiones del Caribe SA", insurerName: "MAPFRE BHD Seguros", type: "Propiedad", endDate: "2024-11-01", daysLeft: -6, status: "vencida", notified: true },
  ],
  users: [
    { id: 1, name: "Emmanuel Admin", email: "admin@corredora.com.do", role: "Administrador", status: "activo", lastLogin: "2024-11-06 09:15" },
    { id: 2, name: "Luis Fernández", email: "luis@corredora.com.do", role: "Ejecutivo de Seguros", status: "activo", lastLogin: "2024-11-06 08:30" },
    { id: 3, name: "Carmen Díaz", email: "carmen@corredora.com.do", role: "Ejecutivo de Seguros", status: "activo", lastLogin: "2024-11-05 16:45" },
    { id: 4, name: "Roberto Matos", email: "roberto@corredora.com.do", role: "Contabilidad", status: "activo", lastLogin: "2024-11-06 07:50" },
    { id: 5, name: "Sandra López", email: "sandra@corredora.com.do", role: "Solo Lectura", status: "inactivo", lastLogin: "2024-10-28 11:20" },
  ],
};

const MONTHS_DATA = [
  { month: "Ene", ventas: 285000, comisiones: 48450, polizas: 12, clientes: 3 },
  { month: "Feb", ventas: 320000, comisiones: 57600, polizas: 15, clientes: 5 },
  { month: "Mar", ventas: 198000, comisiones: 33660, polizas: 8, clientes: 2 },
  { month: "Abr", ventas: 415000, comisiones: 72625, polizas: 18, clientes: 7 },
  { month: "May", ventas: 367000, comisiones: 62390, polizas: 14, clientes: 4 },
  { month: "Jun", ventas: 445000, comisiones: 80100, polizas: 20, clientes: 6 },
  { month: "Jul", ventas: 289000, comisiones: 49130, polizas: 11, clientes: 3 },
  { month: "Ago", ventas: 378000, comisiones: 64260, polizas: 16, clientes: 5 },
  { month: "Sep", ventas: 512000, comisiones: 89600, polizas: 22, clientes: 8 },
  { month: "Oct", ventas: 467000, comisiones: 79390, polizas: 19, clientes: 6 },
];

const RAMO_DATA = [
  { name: "Vehículos", value: 35, color: "#0d9488" },
  { name: "Salud", value: 28, color: "#6366f1" },
  { name: "Vida", value: 18, color: "#f59e0b" },
  { name: "Propiedad", value: 12, color: "#ef4444" },
  { name: "Otros", value: 7, color: "#8b5cf6" },
];

// ==================== UTILITIES ====================
const fmt = (n) => new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 0 }).format(n);
const fmtDate = (d) => { if (!d) return "—"; const dt = new Date(d + "T12:00:00"); return dt.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }); };

const StatusBadge = ({ status }) => {
  const map = {
    activo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    vigente: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    activa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    completado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    aprobado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pagada: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pagado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    en_proceso: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    en_revision: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    suspendido: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    inactivo: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    inactiva: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    vencida: "bg-red-500/15 text-red-400 border-red-500/30",
    cancelado: "bg-red-500/15 text-red-400 border-red-500/30",
    cancelada: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${map[status] || "bg-slate-500/15 text-slate-400 border-slate-500/30"}`}>
      {label}
    </span>
  );
};

// ==================== MODAL COMPONENT ====================
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[85vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 65px)" }}>{children}</div>
      </div>
    </div>
  );
};

// ==================== SIDEBAR ====================
const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "insurers", label: "Aseguradoras", icon: Building2 },
  { id: "policies", label: "Pólizas", icon: Shield },
  { id: "renewals", label: "Renovaciones", icon: RefreshCw },
  { id: "claims", label: "Siniestros", icon: AlertTriangle },
  { id: "payments", label: "Pagos", icon: CreditCard },
  { id: "commissions", label: "Comisiones", icon: DollarSign },
  { id: "users", label: "Usuarios", icon: Lock },
  { id: "reports", label: "Reportes", icon: BarChart3 },
];

const Sidebar = ({ active, setActive, collapsed, setCollapsed }) => (
  <aside className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700/50 z-40 transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[250px]"}`}>
    <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
      {!collapsed && (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate tracking-tight">SeguroPro</h1>
            <p className="text-[10px] text-slate-500 truncate">Corredora de Seguros</p>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mx-auto">
          <Shield size={16} className="text-white" />
        </div>
      )}
    </div>
    <nav className="p-2 space-y-0.5 mt-2">
      {menuItems.map(item => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive ? "bg-teal-500/15 text-teal-400 shadow-lg shadow-teal-500/5" : "text-slate-400 hover:text-white hover:bg-slate-800"}
              ${collapsed ? "justify-center" : ""}`}>
            <Icon size={18} className={isActive ? "text-teal-400" : ""} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        );
      })}
    </nav>
    <button onClick={() => setCollapsed(!collapsed)}
      className="absolute bottom-4 left-0 right-0 mx-auto w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
      <Menu size={14} />
    </button>
  </aside>
);

// ==================== TOP BAR ====================
const TopBar = ({ title, collapsed }) => (
  <header className={`fixed top-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 z-30 flex items-center justify-between px-6 transition-all duration-300 ${collapsed ? "left-[68px]" : "left-[250px]"}`}>
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <div className="flex items-center gap-3">
      <button className="relative p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
        <Bell size={18} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      </button>
      <div className="flex items-center gap-2.5 pl-3 border-l border-slate-700">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">EA</div>
        <div className="hidden sm:block">
          <p className="text-xs font-medium text-white">Emmanuel</p>
          <p className="text-[10px] text-slate-500">Administrador</p>
        </div>
      </div>
    </div>
  </header>
);

// ==================== STAT CARD ====================
const StatCard = ({ icon: Icon, label, value, change, changeType, color }) => {
  const colors = {
    teal: "from-teal-500/20 to-teal-500/5 border-teal-500/20",
    indigo: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
    red: "from-red-500/20 to-red-500/5 border-red-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20",
  };
  const iconColors = { teal: "text-teal-400", indigo: "text-indigo-400", amber: "text-amber-400", red: "text-red-400", emerald: "text-emerald-400", cyan: "text-cyan-400" };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1.5">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl bg-slate-800/50 ${iconColors[color]}`}><Icon size={20} /></div>
      </div>
      {change && (
        <div className="flex items-center gap-1.5 mt-3">
          {changeType === "up" ? <ArrowUpRight size={14} className="text-emerald-400" /> : <ArrowDownRight size={14} className="text-red-400" />}
          <span className={`text-xs font-medium ${changeType === "up" ? "text-emerald-400" : "text-red-400"}`}>{change}</span>
          <span className="text-xs text-slate-500">vs mes anterior</span>
        </div>
      )}
    </div>
  );
};

// ==================== DATA TABLE ====================
const DataTable = ({ columns, data, onView, onEdit, onDelete, actions = true }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-700/50">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-800/50">
          {columns.map((col, i) => (
            <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
          ))}
          {actions && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-700/30">
        {data.map((row, ri) => (
          <tr key={ri} className="hover:bg-slate-800/30 transition-colors">
            {columns.map((col, ci) => (
              <td key={ci} className="px-4 py-3 text-slate-300 whitespace-nowrap">
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
            {actions && (
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  {onView && <button onClick={() => onView(row)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-teal-400 transition-colors"><Eye size={15} /></button>}
                  {onEdit && <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"><Edit size={15} /></button>}
                  {onDelete && <button onClick={() => onDelete(row)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>}
                </div>
              </td>
            )}
          </tr>
        ))}
        {data.length === 0 && (
          <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-slate-500">No se encontraron registros</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

// ==================== SEARCH BAR ====================
const SearchBar = ({ value, onChange, placeholder = "Buscar...", onAdd, addLabel = "Nuevo" }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="relative flex-1 max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all" />
    </div>
    {onAdd && (
      <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shadow-lg shadow-teal-500/20">
        <Plus size={16} /><span className="hidden sm:inline">{addLabel}</span>
      </button>
    )}
  </div>
);

// ==================== FORM INPUT ====================
const FormInput = ({ label, type = "text", value, onChange, options, placeholder, required }) => (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {type === "select" ? (
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-teal-500 transition-all">
        <option value="">Seleccionar...</option>
        {options?.map((o, i) => <option key={i} value={o.value || o}>{o.label || o}</option>)}
      </select>
    ) : type === "textarea" ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-teal-500 transition-all resize-none" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all" />
    )}
  </div>
);

// ==================== DASHBOARD ====================
const Dashboard = ({ data }) => {
  const activePolicies = data.policies.filter(p => p.status === "vigente").length;
  const totalPremiums = data.policies.filter(p => p.status === "vigente").reduce((s, p) => s + p.premium, 0);
  const totalCommissions = data.commissions.reduce((s, c) => s + c.amount, 0);
  const pendingClaims = data.claims.filter(c => !["pagado", "rechazado"].includes(c.status)).length;
  const urgentRenewals = data.renewals.filter(r => r.daysLeft <= 30).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={Shield} label="Pólizas Activas" value={activePolicies} change="+12%" changeType="up" color="teal" />
        <StatCard icon={DollarSign} label="Primas Totales" value={fmt(totalPremiums)} change="+8%" changeType="up" color="indigo" />
        <StatCard icon={TrendingUp} label="Comisiones" value={fmt(totalCommissions)} change="+15%" changeType="up" color="emerald" />
        <StatCard icon={AlertTriangle} label="Reclamos Activos" value={pendingClaims} change="-5%" changeType="up" color="amber" />
        <StatCard icon={RefreshCw} label="Renovaciones Urgentes" value={urgentRenewals} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Ventas y Comisiones Mensuales</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={MONTHS_DATA}>
              <defs>
                <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} /></linearGradient>
                <linearGradient id="gComisiones" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }} formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#0d9488" fill="url(#gVentas)" strokeWidth={2} />
              <Area type="monotone" dataKey="comisiones" name="Comisiones" stroke="#6366f1" fill="url(#gComisiones)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Distribución por Ramo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={RAMO_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {RAMO_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }} formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {RAMO_DATA.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                <span className="text-slate-400">{r.name}</span>
                <span className="text-white font-medium ml-auto">{r.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Renovaciones Próximas</h3>
            <span className="text-xs text-teal-400 font-medium cursor-pointer hover:underline">Ver todas →</span>
          </div>
          <div className="space-y-3">
            {data.renewals.filter(r => r.daysLeft > 0).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/30">
                <div>
                  <p className="text-sm text-white font-medium">{r.clientName}</p>
                  <p className="text-xs text-slate-400">{r.policyNumber} · {r.type}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${r.daysLeft <= 30 ? "text-red-400" : r.daysLeft <= 60 ? "text-amber-400" : "text-emerald-400"}`}>{r.daysLeft} días</p>
                  <p className="text-xs text-slate-500">{fmtDate(r.endDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Siniestros Recientes</h3>
            <span className="text-xs text-teal-400 font-medium cursor-pointer hover:underline">Ver todos →</span>
          </div>
          <div className="space-y-3">
            {data.claims.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${c.priority === "alta" ? "bg-red-400" : c.priority === "media" ? "bg-amber-400" : "bg-emerald-400"}`} />
                  <div>
                    <p className="text-sm text-white font-medium">{c.clientName}</p>
                    <p className="text-xs text-slate-400">{c.type} · {c.policyNumber}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Nuevas Pólizas por Mes</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={MONTHS_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="polizas" name="Pólizas" fill="#0d9488" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==================== CLIENTS MODULE ====================
const ClientsModule = ({ data, setData }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const filtered = data.clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.cedula.includes(search)
  );

  const openNew = () => { setForm({ type: "fisica", name: "", cedula: "", phone: "", email: "", address: "", status: "activo" }); setModal("form"); };
  const openEdit = (c) => { setForm({ ...c }); setModal("form"); };
  const openView = (c) => { setForm(c); setModal("view"); };

  const save = () => {
    if (form.id) {
      setData(d => ({ ...d, clients: d.clients.map(c => c.id === form.id ? { ...c, ...form } : c) }));
    } else {
      setData(d => ({ ...d, clients: [...d.clients, { ...form, id: Date.now(), created: new Date().toISOString().split("T")[0], policies: 0, balance: 0 }] }));
    }
    setModal(null);
  };

  const remove = (c) => { if (confirm(`¿Eliminar cliente ${c.name}?`)) setData(d => ({ ...d, clients: d.clients.filter(x => x.id !== c.id) })); };

  const columns = [
    { key: "name", label: "Cliente", render: (v, r) => (
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${r.type === "juridica" ? "bg-indigo-500/30 text-indigo-300" : "bg-teal-500/30 text-teal-300"}`}>
          {r.type === "juridica" ? <Building2 size={14} /> : v.split(" ").map(n => n[0]).slice(0, 2).join("")}
        </div>
        <div><p className="text-white font-medium text-sm">{v}</p><p className="text-xs text-slate-500">{r.type === "juridica" ? "Persona Jurídica" : "Persona Física"}</p></div>
      </div>
    )},
    { key: "cedula", label: "Cédula/RNC" },
    { key: "phone", label: "Teléfono" },
    { key: "policies", label: "Pólizas", render: v => <span className="font-semibold text-white">{v}</span> },
    { key: "balance", label: "Balance", render: v => <span className="font-medium">{fmt(v)}</span> },
    { key: "status", label: "Estado", render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o cédula..." onAdd={openNew} addLabel="Nuevo Cliente" />
      <DataTable columns={columns} data={filtered} onView={openView} onEdit={openEdit} onDelete={remove} />

      <Modal isOpen={modal === "form"} onClose={() => setModal(null)} title={form.id ? "Editar Cliente" : "Nuevo Cliente"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Tipo" type="select" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={[{ value: "fisica", label: "Persona Física" }, { value: "juridica", label: "Persona Jurídica" }]} required />
          <FormInput label="Nombre / Razón Social" value={form.name || ""} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <FormInput label={form.type === "juridica" ? "RNC" : "Cédula"} value={form.cedula || ""} onChange={v => setForm(f => ({ ...f, cedula: v }))} required />
          <FormInput label="Teléfono" value={form.phone || ""} onChange={v => setForm(f => ({ ...f, phone: v }))} />
          <FormInput label="Email" type="email" value={form.email || ""} onChange={v => setForm(f => ({ ...f, email: v }))} />
          <FormInput label="Estado" type="select" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={["activo", "suspendido", "cancelado"]} />
          <div className="sm:col-span-2"><FormInput label="Dirección" value={form.address || ""} onChange={v => setForm(f => ({ ...f, address: v }))} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">Cancelar</button>
          <button onClick={save} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shadow-lg shadow-teal-500/20">
            {form.id ? "Guardar Cambios" : "Crear Cliente"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={modal === "view"} onClose={() => setModal(null)} title="Detalle del Cliente" size="lg">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ${form.type === "juridica" ? "bg-indigo-500/20 text-indigo-300" : "bg-teal-500/20 text-teal-300"}`}>
              {form.type === "juridica" ? <Building2 size={24} /> : form.name?.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{form.name}</h3>
              <p className="text-sm text-slate-400">{form.type === "juridica" ? "Persona Jurídica" : "Persona Física"} · {form.cedula}</p>
            </div>
            <div className="ml-auto"><StatusBadge status={form.status || "activo"} /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Teléfono</p><p className="text-sm text-white mt-1 font-medium">{form.phone}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Email</p><p className="text-sm text-white mt-1 font-medium truncate">{form.email}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Pólizas</p><p className="text-sm text-white mt-1 font-bold">{form.policies}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Balance</p><p className="text-sm text-teal-400 mt-1 font-bold">{fmt(form.balance || 0)}</p></div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">Dirección</p>
            <p className="text-sm text-white">{form.address}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Pólizas Asociadas</h4>
            <div className="space-y-2">
              {data.policies.filter(p => p.clientId === form.id).map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700/30">
                  <div><p className="text-sm text-white font-medium">{p.number}</p><p className="text-xs text-slate-400">{p.type} · {p.insurerName}</p></div>
                  <div className="flex items-center gap-3"><span className="text-sm font-medium text-slate-300">{fmt(p.premium)}</span><StatusBadge status={p.status} /></div>
                </div>
              ))}
              {data.policies.filter(p => p.clientId === form.id).length === 0 && <p className="text-sm text-slate-500 py-4 text-center">Sin pólizas registradas</p>}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== INSURERS MODULE ====================
const InsurersModule = ({ data, setData }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const filtered = data.insurers.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm({ name: "", rnc: "", phone: "", email: "", ramos: [], commission: 0, status: "activa" }); setModal("form"); };
  const openView = (i) => { setForm(i); setModal("view"); };

  const columns = [
    { key: "name", label: "Aseguradora", render: (v) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300"><Building2 size={15} /></div>
        <span className="text-white font-medium">{v}</span>
      </div>
    )},
    { key: "rnc", label: "RNC" },
    { key: "ramos", label: "Ramos", render: v => (
      <div className="flex flex-wrap gap-1">{(v || []).slice(0, 3).map((r, i) => <span key={i} className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs">{r}</span>)}
        {(v || []).length > 3 && <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-xs">+{v.length - 3}</span>}
      </div>
    )},
    { key: "commission", label: "Comisión", render: v => <span className="font-semibold text-teal-400">{v}%</span> },
    { key: "policies", label: "Pólizas", render: v => <span className="font-semibold text-white">{v}</span> },
    { key: "status", label: "Estado", render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar aseguradora..." onAdd={openNew} addLabel="Nueva Aseguradora" />
      <DataTable columns={columns} data={filtered} onView={openView} onEdit={() => {}} onDelete={() => {}} />

      <Modal isOpen={modal === "view"} onClose={() => setModal(null)} title="Detalle de Aseguradora" size="lg">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300"><Building2 size={28} /></div>
            <div><h3 className="text-xl font-bold text-white">{form.name}</h3><p className="text-sm text-slate-400">RNC: {form.rnc}</p></div>
            <div className="ml-auto"><StatusBadge status={form.status || "activa"} /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Teléfono</p><p className="text-sm text-white mt-1">{form.phone}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Email</p><p className="text-sm text-white mt-1 truncate">{form.email}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Comisión</p><p className="text-sm text-teal-400 mt-1 font-bold">{form.commission}%</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Pólizas</p><p className="text-sm text-white mt-1 font-bold">{form.policies}</p></div>
          </div>
          <div><p className="text-xs text-slate-400 mb-2">Ramos Disponibles</p>
            <div className="flex flex-wrap gap-2">{(form.ramos || []).map((r, i) => <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">{r}</span>)}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== POLICIES MODULE ====================
const PoliciesModule = ({ data, setData }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState("all");

  const filtered = data.policies.filter(p => {
    const matchSearch = p.number.toLowerCase().includes(search.toLowerCase()) || p.clientName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const openNew = () => {
    setForm({ number: `POL-${new Date().getFullYear()}-${String(data.policies.length + 1).padStart(3, "0")}`, clientId: "", insurerId: "", type: "", startDate: "", endDate: "", premium: "", paymentMethod: "Mensual", status: "vigente" });
    setModal("form");
  };

  const openView = (p) => { setForm(p); setModal("view"); };

  const save = () => {
    const client = data.clients.find(c => c.id === parseInt(form.clientId));
    const insurer = data.insurers.find(i => i.id === parseInt(form.insurerId));
    const newPolicy = {
      ...form,
      clientName: client?.name || "",
      insurerName: insurer?.name || "",
      premium: parseFloat(form.premium) || 0,
      commission: (parseFloat(form.premium) || 0) * ((insurer?.commission || 0) / 100),
      id: form.id || Date.now(),
    };
    if (form.id) {
      setData(d => ({ ...d, policies: d.policies.map(p => p.id === form.id ? newPolicy : p) }));
    } else {
      setData(d => ({ ...d, policies: [...d.policies, newPolicy] }));
    }
    setModal(null);
  };

  const columns = [
    { key: "number", label: "Nº Póliza", render: v => <span className="font-mono text-teal-400 font-medium">{v}</span> },
    { key: "clientName", label: "Cliente", render: v => <span className="text-white font-medium">{v}</span> },
    { key: "insurerName", label: "Aseguradora" },
    { key: "type", label: "Tipo", render: v => <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs">{v}</span> },
    { key: "premium", label: "Prima", render: v => <span className="font-semibold text-white">{fmt(v)}</span> },
    { key: "endDate", label: "Vencimiento", render: v => fmtDate(v) },
    { key: "status", label: "Estado", render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {["all", "vigente", "vencida", "cancelada"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"}`}>
            {f === "all" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
          </button>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por número o cliente..." onAdd={openNew} addLabel="Nueva Póliza" />
      <DataTable columns={columns} data={filtered} onView={openView} onEdit={() => {}} onDelete={() => {}} />

      <Modal isOpen={modal === "form"} onClose={() => setModal(null)} title="Nueva Póliza" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormInput label="Nº Póliza" value={form.number || ""} onChange={v => setForm(f => ({ ...f, number: v }))} required />
          <FormInput label="Cliente" type="select" value={form.clientId} onChange={v => setForm(f => ({ ...f, clientId: v }))} required
            options={data.clients.filter(c => c.status === "activo").map(c => ({ value: c.id, label: c.name }))} />
          <FormInput label="Aseguradora" type="select" value={form.insurerId} onChange={v => setForm(f => ({ ...f, insurerId: v }))} required
            options={data.insurers.filter(i => i.status === "activa").map(i => ({ value: i.id, label: i.name }))} />
          <FormInput label="Tipo de Seguro" type="select" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} required
            options={["Vehículos", "Salud", "Vida", "Incendio", "Propiedad", "Responsabilidad Civil", "PYME", "Hogar", "Fianzas"]} />
          <FormInput label="Fecha Inicio" type="date" value={form.startDate || ""} onChange={v => setForm(f => ({ ...f, startDate: v }))} required />
          <FormInput label="Fecha Vencimiento" type="date" value={form.endDate || ""} onChange={v => setForm(f => ({ ...f, endDate: v }))} required />
          <FormInput label="Prima (RD$)" type="number" value={form.premium || ""} onChange={v => setForm(f => ({ ...f, premium: v }))} required />
          <FormInput label="Forma de Pago" type="select" value={form.paymentMethod} onChange={v => setForm(f => ({ ...f, paymentMethod: v }))}
            options={["Mensual", "Trimestral", "Semestral", "Anual"]} />
          <FormInput label="Estado" type="select" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}
            options={[{ value: "vigente", label: "Vigente" }, { value: "vencida", label: "Vencida" }, { value: "cancelada", label: "Cancelada" }]} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">Cancelar</button>
          <button onClick={save} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shadow-lg shadow-teal-500/20">Crear Póliza</button>
        </div>
      </Modal>

      <Modal isOpen={modal === "view"} onClose={() => setModal(null)} title="Detalle de Póliza" size="lg">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white font-mono">{form.number}</h3>
              <p className="text-sm text-slate-400">{form.type} · {form.insurerName}</p>
            </div>
            <StatusBadge status={form.status || "vigente"} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Cliente</p><p className="text-sm text-white mt-1 font-medium">{form.clientName}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Prima</p><p className="text-sm text-teal-400 mt-1 font-bold">{fmt(form.premium || 0)}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Comisión</p><p className="text-sm text-indigo-400 mt-1 font-bold">{fmt(form.commission || 0)}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Forma de Pago</p><p className="text-sm text-white mt-1">{form.paymentMethod}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Fecha Inicio</p><p className="text-sm text-white mt-1">{fmtDate(form.startDate)}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Fecha Vencimiento</p><p className="text-sm text-white mt-1">{fmtDate(form.endDate)}</p></div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== RENEWALS MODULE ====================
const RenewalsModule = ({ data }) => {
  const [search, setSearch] = useState("");
  const filtered = data.renewals.filter(r => r.clientName.toLowerCase().includes(search.toLowerCase()) || r.policyNumber.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { key: "policyNumber", label: "Póliza", render: v => <span className="font-mono text-teal-400 font-medium">{v}</span> },
    { key: "clientName", label: "Cliente", render: v => <span className="text-white font-medium">{v}</span> },
    { key: "insurerName", label: "Aseguradora" },
    { key: "type", label: "Tipo" },
    { key: "endDate", label: "Vencimiento", render: v => fmtDate(v) },
    { key: "daysLeft", label: "Días Restantes", render: v => (
      <span className={`font-bold ${v <= 0 ? "text-red-400" : v <= 30 ? "text-red-400" : v <= 60 ? "text-amber-400" : "text-emerald-400"}`}>
        {v <= 0 ? `Vencida (${Math.abs(v)}d)` : `${v} días`}
      </span>
    )},
    { key: "notified", label: "Notificado", render: v => v ? <CheckCircle size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-slate-500" /> },
    { key: "status", label: "Estado", render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-red-400 mb-1"><AlertCircle size={16} /><span className="text-xs font-semibold uppercase">Vencidas / Urgentes (≤30d)</span></div>
          <p className="text-2xl font-bold text-white">{data.renewals.filter(r => r.daysLeft <= 30).length}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-400 mb-1"><Clock size={16} /><span className="text-xs font-semibold uppercase">Próximas (31-90d)</span></div>
          <p className="text-2xl font-bold text-white">{data.renewals.filter(r => r.daysLeft > 30 && r.daysLeft <= 90).length}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-1"><CheckCircle size={16} /><span className="text-xs font-semibold uppercase">En Tiempo ({">"}90d)</span></div>
          <p className="text-2xl font-bold text-white">{data.renewals.filter(r => r.daysLeft > 90).length}</p>
        </div>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar renovación..." />
      <DataTable columns={columns} data={filtered.sort((a, b) => a.daysLeft - b.daysLeft)} actions={false} />
    </div>
  );
};

// ==================== CLAIMS MODULE ====================
const ClaimsModule = ({ data, setData }) => {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const filtered = data.claims.filter(c => c.clientName.toLowerCase().includes(search.toLowerCase()) || c.policyNumber.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm({ policyNumber: "", clientName: "", insurerName: "", type: "", date: "", description: "", amount: "", status: "pendiente", priority: "media" }); setModal("form"); };
  const openView = (c) => { setForm(c); setModal("view"); };

  const save = () => {
    const newClaim = { ...form, amount: parseFloat(form.amount) || 0, id: form.id || Date.now() };
    if (form.id) {
      setData(d => ({ ...d, claims: d.claims.map(c => c.id === form.id ? newClaim : c) }));
    } else {
      setData(d => ({ ...d, claims: [...d.claims, newClaim] }));
    }
    setModal(null);
  };

  const columns = [
    { key: "policyNumber", label: "Póliza", render: v => <span className="font-mono text-teal-400 font-medium">{v}</span> },
    { key: "clientName", label: "Cliente", render: v => <span className="text-white font-medium">{v}</span> },
    { key: "type", label: "Tipo" },
    { key: "date", label: "Fecha", render: v => fmtDate(v) },
    { key: "amount", label: "Monto", render: v => <span className="font-semibold text-white">{fmt(v)}</span> },
    { key: "priority", label: "Prioridad", render: v => (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${v === "alta" ? "text-red-400" : v === "media" ? "text-amber-400" : "text-emerald-400"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${v === "alta" ? "bg-red-400" : v === "media" ? "bg-amber-400" : "bg-emerald-400"}`} />
        {v.charAt(0).toUpperCase() + v.slice(1)}
      </span>
    )},
    { key: "status", label: "Estado", render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar siniestro..." onAdd={openNew} addLabel="Nuevo Siniestro" />
      <DataTable columns={columns} data={filtered} onView={openView} onEdit={() => {}} onDelete={() => {}} />

      <Modal isOpen={modal === "form"} onClose={() => setModal(null)} title="Registrar Siniestro" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormInput label="Nº Póliza" type="select" value={form.policyNumber} onChange={v => {
            const pol = data.policies.find(p => p.number === v);
            setForm(f => ({ ...f, policyNumber: v, clientName: pol?.clientName || "", insurerName: pol?.insurerName || "" }));
          }} options={data.policies.filter(p => p.status === "vigente").map(p => ({ value: p.number, label: `${p.number} - ${p.clientName}` }))} required />
          <FormInput label="Tipo de Siniestro" type="select" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}
            options={["Colisión", "Robo", "Incendio", "Hospitalización", "Salud", "Inundación", "Daño a Terceros", "Otro"]} required />
          <FormInput label="Fecha" type="date" value={form.date || ""} onChange={v => setForm(f => ({ ...f, date: v }))} required />
          <FormInput label="Monto Estimado (RD$)" type="number" value={form.amount || ""} onChange={v => setForm(f => ({ ...f, amount: v }))} />
          <FormInput label="Prioridad" type="select" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} options={["baja", "media", "alta"]} />
          <FormInput label="Estado" type="select" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}
            options={[{ value: "pendiente", label: "Pendiente" }, { value: "en_proceso", label: "En Proceso" }, { value: "en_revision", label: "En Revisión" }, { value: "aprobado", label: "Aprobado" }, { value: "pagado", label: "Pagado" }]} />
          <div className="sm:col-span-2 lg:col-span-3"><FormInput label="Descripción" type="textarea" value={form.description || ""} onChange={v => setForm(f => ({ ...f, description: v }))} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">Cancelar</button>
          <button onClick={save} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shadow-lg shadow-teal-500/20">Registrar</button>
        </div>
      </Modal>

      <Modal isOpen={modal === "view"} onClose={() => setModal(null)} title="Detalle del Siniestro" size="lg">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{form.type}</h3>
              <p className="text-sm text-slate-400">{form.policyNumber} · {fmtDate(form.date)}</p>
            </div>
            <StatusBadge status={form.status || "pendiente"} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Cliente</p><p className="text-sm text-white mt-1 font-medium">{form.clientName}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Aseguradora</p><p className="text-sm text-white mt-1">{form.insurerName}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Monto</p><p className="text-sm text-red-400 mt-1 font-bold">{fmt(form.amount || 0)}</p></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"><p className="text-xs text-slate-400">Prioridad</p><p className={`text-sm mt-1 font-bold capitalize ${form.priority === "alta" ? "text-red-400" : form.priority === "media" ? "text-amber-400" : "text-emerald-400"}`}>{form.priority}</p></div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">Descripción</p>
            <p className="text-sm text-white">{form.description}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== PAYMENTS MODULE ====================
const PaymentsModule = ({ data }) => {
  const [search, setSearch] = useState("");
  const filtered = data.payments.filter(p => p.clientName.toLowerCase().includes(search.toLowerCase()) || p.policyNumber.toLowerCase().includes(search.toLowerCase()));

  const totalReceived = data.payments.filter(p => p.status === "completado").reduce((s, p) => s + p.amount, 0);
  const totalPending = data.payments.filter(p => p.status === "pendiente").reduce((s, p) => s + p.amount, 0);

  const columns = [
    { key: "date", label: "Fecha", render: v => fmtDate(v) },
    { key: "clientName", label: "Cliente", render: v => <span className="text-white font-medium">{v}</span> },
    { key: "policyNumber", label: "Póliza", render: v => <span className="font-mono text-teal-400">{v}</span> },
    { key: "concept", label: "Concepto" },
    { key: "method", label: "Método", render: v => (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <CreditCard size={12} className="text-slate-400" />{v}
      </span>
    )},
    { key: "amount", label: "Monto", render: v => <span className="font-semibold text-white">{fmt(v)}</span> },
    { key: "status", label: "Estado", render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={CheckCircle} label="Total Cobrado" value={fmt(totalReceived)} color="emerald" />
        <StatCard icon={Clock} label="Pendiente de Cobro" value={fmt(totalPending)} color="amber" />
        <StatCard icon={DollarSign} label="Total Registrado" value={fmt(totalReceived + totalPending)} color="teal" />
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar pago..." onAdd={() => {}} addLabel="Registrar Pago" />
      <DataTable columns={columns} data={filtered} actions={false} />
    </div>
  );
};

// ==================== COMMISSIONS MODULE ====================
const CommissionsModule = ({ data }) => {
  const [search, setSearch] = useState("");
  const filtered = data.commissions.filter(c => c.producer.toLowerCase().includes(search.toLowerCase()) || c.clientName.toLowerCase().includes(search.toLowerCase()));

  const totalPaid = data.commissions.filter(c => c.status === "pagada").reduce((s, c) => s + c.amount, 0);
  const totalPending = data.commissions.filter(c => c.status === "pendiente").reduce((s, c) => s + c.amount, 0);

  const byProducer = data.commissions.reduce((acc, c) => {
    if (!acc[c.producer]) acc[c.producer] = { total: 0, count: 0 };
    acc[c.producer].total += c.amount;
    acc[c.producer].count++;
    return acc;
  }, {});

  const columns = [
    { key: "producer", label: "Productor", render: v => (
      <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold">{v.split(" ").map(n => n[0]).join("")}</div><span className="text-white font-medium">{v}</span></div>
    )},
    { key: "policyNumber", label: "Póliza", render: v => <span className="font-mono text-teal-400">{v}</span> },
    { key: "clientName", label: "Cliente" },
    { key: "insurerName", label: "Aseguradora" },
    { key: "premium", label: "Prima", render: v => fmt(v) },
    { key: "rate", label: "Tasa", render: v => <span className="font-semibold text-indigo-400">{v}%</span> },
    { key: "amount", label: "Comisión", render: v => <span className="font-bold text-teal-400">{fmt(v)}</span> },
    { key: "status", label: "Estado", render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Comisiones" value={fmt(totalPaid + totalPending)} color="teal" />
        <StatCard icon={CheckCircle} label="Pagadas" value={fmt(totalPaid)} color="emerald" />
        <StatCard icon={Clock} label="Pendientes" value={fmt(totalPending)} color="amber" />
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Por Productor</p>
          {Object.entries(byProducer).map(([name, info], i) => (
            <div key={i} className="flex items-center justify-between mb-2 last:mb-0">
              <span className="text-sm text-slate-300">{name}</span>
              <span className="text-sm font-bold text-white">{fmt(info.total)}</span>
            </div>
          ))}
        </div>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar comisión..." />
      <DataTable columns={columns} data={filtered} actions={false} />
    </div>
  );
};

// ==================== USERS MODULE ====================
const UsersModule = ({ data }) => {
  const [search, setSearch] = useState("");
  const filtered = data.users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  const roleColors = { "Administrador": "bg-red-500/15 text-red-400 border-red-500/30", "Ejecutivo de Seguros": "bg-teal-500/15 text-teal-400 border-teal-500/30", "Contabilidad": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", "Solo Lectura": "bg-slate-500/15 text-slate-400 border-slate-500/30" };

  const columns = [
    { key: "name", label: "Usuario", render: (v, r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center text-teal-300 text-xs font-bold">{v.split(" ").map(n => n[0]).slice(0, 2).join("")}</div>
        <div><p className="text-white font-medium text-sm">{v}</p><p className="text-xs text-slate-500">{r.email}</p></div>
      </div>
    )},
    { key: "role", label: "Rol", render: v => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[v] || ""}`}>{v}</span> },
    { key: "lastLogin", label: "Último Acceso" },
    { key: "status", label: "Estado", render: v => <StatusBadge status={v} /> },
  ];

  const permissions = [
    { module: "Dashboard", admin: true, exec: true, cont: true, read: true },
    { module: "Clientes", admin: true, exec: true, cont: false, read: true },
    { module: "Pólizas", admin: true, exec: true, cont: false, read: true },
    { module: "Siniestros", admin: true, exec: true, cont: false, read: true },
    { module: "Pagos", admin: true, exec: false, cont: true, read: true },
    { module: "Comisiones", admin: true, exec: false, cont: true, read: false },
    { module: "Usuarios", admin: true, exec: false, cont: false, read: false },
    { module: "Reportes", admin: true, exec: true, cont: true, read: true },
  ];

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar usuario..." onAdd={() => {}} addLabel="Nuevo Usuario" />
      <DataTable columns={columns} data={filtered} onEdit={() => {}} onDelete={() => {}} />

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-white mb-4">Matriz de Permisos por Rol</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Módulo</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-red-400">Admin</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-teal-400">Ejecutivo</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-indigo-400">Contabilidad</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400">Lectura</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-700/30">
              {permissions.map((p, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 text-white font-medium">{p.module}</td>
                  {["admin", "exec", "cont", "read"].map((r, j) => (
                    <td key={j} className="text-center px-4 py-2.5">
                      {p[r] ? <CheckCircle size={16} className="inline text-emerald-400" /> : <XCircle size={16} className="inline text-slate-600" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== REPORTS MODULE ====================
const ReportsModule = ({ data }) => {
  const insurerData = data.insurers.filter(i => i.status === "activa").map(i => ({ name: i.name.replace("Seguros ", "").replace("MAPFRE BHD ", "MAPFRE"), polizas: i.policies }));

  const producerData = Object.entries(
    data.commissions.reduce((acc, c) => { acc[c.producer] = (acc[c.producer] || 0) + c.amount; return acc; }, {})
  ).map(([name, total]) => ({ name: name.split(" ")[0], total }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Shield} label="Total Pólizas" value={data.policies.length} color="teal" />
        <StatCard icon={Users} label="Total Clientes" value={data.clients.length} color="indigo" />
        <StatCard icon={Building2} label="Aseguradoras" value={data.insurers.filter(i => i.status === "activa").length} color="cyan" />
        <StatCard icon={AlertTriangle} label="Siniestros Año" value={data.claims.length} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Pólizas por Aseguradora</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={insurerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="polizas" name="Pólizas" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Comisiones por Productor</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={producerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }} formatter={v => fmt(v)} />
              <Bar dataKey="total" name="Comisión Total" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Tendencia de Ventas Mensual</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"><Download size={14} />Exportar</button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={MONTHS_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }} formatter={v => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#0d9488" strokeWidth={2.5} dot={{ fill: "#0d9488", r: 4 }} />
            <Line type="monotone" dataKey="comisiones" name="Comisiones" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Resumen de Pólizas por Estado</h3>
          <div className="space-y-3">
            {[
              { label: "Vigentes", count: data.policies.filter(p => p.status === "vigente").length, total: data.policies.length, color: "bg-emerald-500" },
              { label: "Vencidas", count: data.policies.filter(p => p.status === "vencida").length, total: data.policies.length, color: "bg-red-500" },
              { label: "Canceladas", count: data.policies.filter(p => p.status === "cancelada").length, total: data.policies.length, color: "bg-slate-500" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className="text-sm font-bold text-white">{item.count} <span className="text-slate-500 font-normal">/ {item.total}</span></span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${(item.count / item.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top 5 Clientes por Prima</h3>
          <div className="space-y-3">
            {Object.entries(
              data.policies.filter(p => p.status === "vigente").reduce((acc, p) => { acc[p.clientName] = (acc[p.clientName] || 0) + p.premium; return acc; }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total], i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/30">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300 text-xs font-bold">{i + 1}</div>
                <span className="text-sm text-white font-medium flex-1">{name}</span>
                <span className="text-sm font-bold text-teal-400">{fmt(total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================
export default function InsuranceERP() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState(INITIAL_DATA);

  const titles = { dashboard: "Dashboard", clients: "Gestión de Clientes", insurers: "Aseguradoras", policies: "Gestión de Pólizas", renewals: "Renovaciones y Recordatorios", claims: "Siniestros / Reclamos", payments: "Facturación y Pagos", commissions: "Comisiones", users: "Usuarios y Roles", reports: "Reportes y Análisis" };

  const renderModule = () => {
    switch (active) {
      case "dashboard": return <Dashboard data={data} />;
      case "clients": return <ClientsModule data={data} setData={setData} />;
      case "insurers": return <InsurersModule data={data} setData={setData} />;
      case "policies": return <PoliciesModule data={data} setData={setData} />;
      case "renewals": return <RenewalsModule data={data} />;
      case "claims": return <ClaimsModule data={data} setData={setData} />;
      case "payments": return <PaymentsModule data={data} />;
      case "commissions": return <CommissionsModule data={data} />;
      case "users": return <UsersModule data={data} />;
      case "reports": return <ReportsModule data={data} />;
      default: return <Dashboard data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />
      <TopBar title={titles[active]} collapsed={collapsed} />
      <main className={`pt-20 pb-8 px-6 transition-all duration-300 ${collapsed ? "ml-[68px]" : "ml-[250px]"}`}>
        {renderModule()}
      </main>
    </div>
  );
}
