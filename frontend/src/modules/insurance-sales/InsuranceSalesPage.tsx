import { useState, useEffect } from 'react'
import {
  Car, Heart, Shield, Home, Briefcase, Plane, Flame, Scale,
  Ship, Tractor, Star, Search, ArrowRight, ChevronRight,
  FileText, TrendingUp, Award, CheckCircle2, X, Plus,
  Building2, Phone, Mail, DollarSign, Calculator,
  Pencil, Trash2, Download, Send
} from 'lucide-react'
import { api, getAuthHeaders } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import StatusBadge from '../../components/ui/StatusBadge'
import EmailPreviewDialog from '../../components/EmailPreviewDialog'

// ============ TYPES ============
interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  imageUrl: string | null
  _count: { products: number }
}

interface Plan {
  id: number
  productId?: number
  name: string
  tier: string
  description: string | null
  coverages: string[] | null
  monthlyPremium: string | null
  annualPremium: string | null
  minCoverage: string | null
  maxCoverage: string | null
  deductible: string | null
  currency: string
  isPopular: boolean
  isActive?: boolean
  sortOrder?: number
}

interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  shortDesc: string | null
  imageUrl: string | null
  isFeatured: boolean
  category: { id: number; name: string; slug: string; icon: string | null; color: string | null }
  insurer: { id: number; name: string }
  plans: Plan[]
  _count: { plans: number }
}

interface Quotation {
  id: number
  quotationNo: string
  clientName: string
  clientEmail: string | null
  status: string
  totalPremium: string
  createdAt: string
  _count: { items: number }
}

interface QuotationItem {
  productId: number
  planId: number
  productName: string
  planName: string
  planTier: string
  insurerName: string
  premium: number
  coverage?: number
}

// ============ ICON MAP ============
const iconMap: Record<string, any> = {
  Car, Heart, Shield, Home, Briefcase, Plane, Flame, Scale, Ship, Tractor, Star, Building2
}

function getIcon(name: string | null) {
  if (!name) return Shield
  return iconMap[name] || Shield
}

// ============ CATEGORY IMAGES ============
const categoryImages: Record<string, string> = {
  'vehiculos': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&q=80',
  'salud': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
  'vida': 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80',
  'hogar': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
  'empresarial': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
  'viaje': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
  'incendio': 'https://images.unsplash.com/photo-1486175060817-5663caa69b57?w=600&q=80',
  'responsabilidad-civil': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
  'transporte': 'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=600&q=80',
  'agropecuario': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
  'fianzas': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80',
}

// ============ INSURER COLORS (for logo badge backgrounds) ============
const insurerColors: Record<string, string> = {
  'Seguros Universal': '#1a56db',
  'Seguros Reservas': '#047857',
  'Humano Seguros': '#7c3aed',
  'MAPFRE BHD': '#dc2626',
  'La Colonial': '#0369a1',
  'Atlántica Seguros': '#0e7490',
  'La Monumental': '#b45309',
  'UNIT': '#4f46e5',
  'Seguros Pepín': '#059669',
  'Seguros SURA': '#1d4ed8',
  'Seguros Yunen': '#9333ea',
  'General de Seguros': '#0891b2',
  'Angloamericana': '#6366f1',
}

function getInsurerColor(name: string) {
  return insurerColors[name] || '#475569'
}

function getInsurerInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(c => c && c === c.toUpperCase()).join('').slice(0, 2)
}

// ============ FORMAT CURRENCY ============
function formatCurrency(value: string | number | null, currency = 'DOP') {
  if (!value) return 'Consultar'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'Consultar'
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// ============ TIER COLORS ============
function getTierColor(tier: string) {
  const t = tier.toUpperCase()
  if (t === 'BASICO') return 'from-slate-500 to-slate-600'
  if (t === 'INTERMEDIO') return 'from-blue-500 to-blue-600'
  if (t === 'PREMIUM' || t === 'FULL') return 'from-amber-500 to-amber-600'
  if (t === 'SUPER_FULL' || t === 'PLATINUM') return 'from-purple-500 to-purple-600'
  return 'from-teal-500 to-teal-600'
}

// ============ MAIN COMPONENT ============
export default function InsuranceSalesPage() {
  const [view, setView] = useState<'catalog' | 'category' | 'product' | 'quotations'>('catalog')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Auth
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMINISTRADOR' || user?.globalRole === 'SUPER_ADMIN'

  // Quotation builder state
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false)
  const [quoteItems, setQuoteItems] = useState<QuotationItem[]>([])
  const [quoteClient, setQuoteClient] = useState({ name: '', email: '', phone: '' })
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(null)

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailQuotationId, setEmailQuotationId] = useState<number | null>(null)

  // Plan CRUD state
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planProductId, setPlanProductId] = useState<number | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [catRes, featRes] = await Promise.all([
        api.get<{ success: boolean; data: Category[] }>('/insurance-catalog/categories'),
        api.get<{ success: boolean; data: Product[] }>('/insurance-catalog/featured'),
      ])
      setCategories(catRes.data)
      setFeaturedProducts(featRes.data)
    } catch (error) {
      console.error('Error loading catalog:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = async (category: Category) => {
    try {
      setLoading(true)
      const res = await api.get<{ success: boolean; data: Category & { products: Product[] } }>(
        `/insurance-catalog/categories/${category.slug}`
      )
      setSelectedCategory(res.data)
      setProducts(res.data.products || [])
      setView('category')
    } catch (error) {
      console.error('Error loading category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = async (product: Product) => {
    try {
      setLoading(true)
      const res = await api.get<{ success: boolean; data: Product }>(`/insurance-catalog/products/${product.id}`)
      setSelectedProduct(res.data)
      setView('product')
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      setIsSearching(true)
      const res = await api.get<{ success: boolean; data: Product[] }>(
        `/insurance-catalog/search?q=${encodeURIComponent(searchQuery)}`
      )
      setSearchResults(res.data)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const addToQuote = (product: Product, plan: Plan) => {
    const exists = quoteItems.find(i => i.productId === product.id && i.planId === plan.id)
    if (exists) return

    setQuoteItems([...quoteItems, {
      productId: product.id,
      planId: plan.id,
      productName: product.name,
      planName: plan.name,
      planTier: plan.tier,
      insurerName: product.insurer.name,
      premium: parseFloat(plan.annualPremium || plan.monthlyPremium || '0'),
      coverage: plan.maxCoverage ? parseFloat(plan.maxCoverage) : undefined,
    }])
    setShowQuoteBuilder(true)
  }

  const removeFromQuote = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index))
  }

  const submitQuotation = async () => {
    if (!quoteClient.name || quoteItems.length === 0) return
    try {
      const payload = {
        clientName: quoteClient.name,
        clientEmail: quoteClient.email || undefined,
        clientPhone: quoteClient.phone || undefined,
        items: quoteItems.map(item => ({
          productId: item.productId,
          planId: item.planId,
          premium: item.premium,
          coverage: item.coverage,
        })),
      }
      if (editingQuotationId) {
        await api.put(`/quotations/${editingQuotationId}`, payload)
      } else {
        await api.post('/quotations', payload)
      }
      setQuoteItems([])
      setQuoteClient({ name: '', email: '', phone: '' })
      setEditingQuotationId(null)
      setShowQuoteBuilder(false)
      alert(editingQuotationId ? 'Cotización actualizada exitosamente' : 'Cotización creada exitosamente')
      if (view === 'quotations') fetchQuotations()
    } catch (error: any) {
      alert(error.message || 'Error al guardar cotización')
    }
  }

  const handleEditQuotation = async (id: number) => {
    try {
      const res = await api.get<{ success: boolean; data: any }>(`/quotations/${id}`)
      const q = res.data
      setQuoteClient({ name: q.clientName, email: q.clientEmail || '', phone: q.clientPhone || '' })
      setQuoteItems(
        (q.items || []).map((item: any) => ({
          productId: item.productId,
          planId: item.planId,
          productName: item.product?.name || '',
          planName: item.plan?.name || '',
          planTier: item.plan?.tier || '',
          insurerName: item.product?.insurer?.name || '',
          premium: Number(item.premium),
          coverage: item.coverage ? Number(item.coverage) : undefined,
        }))
      )
      setEditingQuotationId(id)
      setShowQuoteBuilder(true)
    } catch (error: any) {
      alert(error.message || 'Error al cargar cotización')
    }
  }

  const handleDownloadPdf = async (id: number, quotationNo: string) => {
    try {
      const headers = await getAuthHeaders()
      const API_BASE = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${API_BASE}/quotations/${id}/pdf`, { headers })
      if (!res.ok) throw new Error('Error al generar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion-${quotationNo}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || 'Error al descargar PDF')
    }
  }

  // Plan CRUD handlers
  const handleCreatePlan = (productId: number) => {
    setPlanProductId(productId)
    setEditingPlan(null)
    setShowPlanModal(true)
  }

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    setPlanProductId(null)
    setShowPlanModal(true)
  }

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('¿Estás seguro de eliminar este plan?')) return
    try {
      await api.delete(`/insurance-catalog/plans/${planId}`)
      // Refresh product view
      if (selectedProduct) {
        const res = await api.get<{ success: boolean; data: Product }>(`/insurance-catalog/products/${selectedProduct.id}`)
        setSelectedProduct(res.data)
      }
    } catch (error: any) {
      alert(error.message || 'Error al eliminar plan')
    }
  }

  const handleSavePlan = async (data: any) => {
    try {
      if (editingPlan) {
        await api.put(`/insurance-catalog/plans/${editingPlan.id}`, data)
      } else {
        await api.post('/insurance-catalog/plans', { ...data, productId: planProductId })
      }
      setShowPlanModal(false)
      setEditingPlan(null)
      // Refresh product view
      if (selectedProduct) {
        const res = await api.get<{ success: boolean; data: Product }>(`/insurance-catalog/products/${selectedProduct.id}`)
        setSelectedProduct(res.data)
      }
    } catch (error: any) {
      alert(error.message || 'Error al guardar plan')
    }
  }

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ success: boolean; data: Quotation[] }>('/quotations')
      setQuotations(res.data)
      setView('quotations')
    } catch (error) {
      console.error('Error loading quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============ LOADING STATE ============
  if (loading && view === 'catalog' && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {view === 'catalog' && (
            <p className="text-slate-400 text-sm">Explora nuestro catálogo de seguros y genera cotizaciones</p>
          )}
          {view === 'category' && selectedCategory && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <button onClick={() => setView('catalog')} className="hover:text-teal-400 transition-colors">Catálogo</button>
              <ChevronRight size={14} />
              <span className="text-white">{selectedCategory.name}</span>
            </div>
          )}
          {view === 'product' && selectedProduct && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <button onClick={() => setView('catalog')} className="hover:text-teal-400 transition-colors">Catálogo</button>
              <ChevronRight size={14} />
              <button onClick={() => selectedCategory && setView('category')} className="hover:text-teal-400 transition-colors">
                {selectedProduct.category.name}
              </button>
              <ChevronRight size={14} />
              <span className="text-white">{selectedProduct.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar seguros..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                if (!e.target.value) setSearchResults([])
              }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-64"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.map(product => (
                  <button
                    key={product.id}
                    onClick={() => { handleProductClick(product); setSearchResults([]); setSearchQuery('') }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: getInsurerColor(product.insurer.name) }}
                    >
                      {getInsurerInitials(product.insurer.name)}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.insurer.name} · {product.category.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quote counter */}
          {quoteItems.length > 0 && (
            <button
              onClick={() => setShowQuoteBuilder(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium text-white transition-colors"
            >
              <Calculator size={16} />
              Cotización
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {quoteItems.length}
              </span>
            </button>
          )}

          {/* Quotations list */}
          <button
            onClick={fetchQuotations}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white transition-colors"
          >
            <FileText size={16} />
            Mis Cotizaciones
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {view === 'catalog' && <CatalogView categories={categories} featured={featuredProducts} onCategoryClick={handleCategoryClick} onProductClick={handleProductClick} onAddToQuote={addToQuote} />}
      {view === 'category' && selectedCategory && <CategoryView category={selectedCategory} products={products} onProductClick={handleProductClick} onAddToQuote={addToQuote} onBack={() => setView('catalog')} />}
      {view === 'product' && selectedProduct && (
        <ProductView
          product={selectedProduct}
          onAddToQuote={addToQuote}
          onBack={() => selectedCategory ? setView('category') : setView('catalog')}
          isAdmin={isAdmin}
          onCreatePlan={handleCreatePlan}
          onEditPlan={handleEditPlan}
          onDeletePlan={handleDeletePlan}
        />
      )}
      {view === 'quotations' && (
        <QuotationsView
          quotations={quotations}
          onBack={() => setView('catalog')}
          onEdit={handleEditQuotation}
          onDownloadPdf={handleDownloadPdf}
          onEmail={(id) => { setEmailQuotationId(id); setEmailDialogOpen(true) }}
        />
      )}

      {/* QUOTATION BUILDER MODAL */}
      {showQuoteBuilder && (
        <QuoteBuilderModal
          items={quoteItems}
          client={quoteClient}
          onClientChange={setQuoteClient}
          onRemoveItem={removeFromQuote}
          onSubmit={submitQuotation}
          onClose={() => { setShowQuoteBuilder(false); setEditingQuotationId(null) }}
          isEditing={!!editingQuotationId}
        />
      )}

      {/* PLAN FORM MODAL */}
      {showPlanModal && (
        <PlanFormModal
          plan={editingPlan}
          onSave={handleSavePlan}
          onClose={() => { setShowPlanModal(false); setEditingPlan(null) }}
        />
      )}

      {/* EMAIL PREVIEW DIALOG */}
      {emailQuotationId && (
        <EmailPreviewDialog
          isOpen={emailDialogOpen}
          onClose={() => { setEmailDialogOpen(false); setEmailQuotationId(null) }}
          previewEndpoint={`/quotations/${emailQuotationId}/email/preview`}
          sendEndpoint={`/quotations/${emailQuotationId}/email`}
          title="Enviar Cotización por Email"
        />
      )}
    </div>
  )
}

// ============ CATALOG VIEW ============
function CatalogView({ categories, featured, onCategoryClick, onProductClick, onAddToQuote }: {
  categories: Category[]
  featured: Product[]
  onCategoryClick: (cat: Category) => void
  onProductClick: (prod: Product) => void
  onAddToQuote: (prod: Product, plan: Plan) => void
}) {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800 p-8 md:p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Protección para cada momento
          </h2>
          <p className="text-teal-100 text-lg mb-6">
            Cotiza y compara las mejores opciones de seguros de las principales aseguradoras de República Dominicana.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white">
              <CheckCircle2 size={16} className="text-teal-300" />
              +15 Aseguradoras
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white">
              <CheckCircle2 size={16} className="text-teal-300" />
              +10 Categorías
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white">
              <CheckCircle2 size={16} className="text-teal-300" />
              Cotizaciones Instantáneas
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Categorías', value: categories.length, icon: Shield, color: 'text-teal-400' },
          { label: 'Productos', value: categories.reduce((s, c) => s + c._count.products, 0), icon: FileText, color: 'text-blue-400' },
          { label: 'Aseguradoras', value: '15+', icon: Building2, color: 'text-purple-400' },
          { label: 'Mercado RD 2025', value: 'RD$153B', icon: TrendingUp, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <stat.icon size={20} className={stat.color} />
            <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Categories Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-teal-400" />
          Categorías de Seguros
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(category => {
            const Icon = getIcon(category.icon)
            const img = categoryImages[category.slug] || categoryImages['vehiculos']
            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category)}
                className="group relative overflow-hidden rounded-xl bg-slate-800 border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300 text-left"
              >
                {/* Image */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={img}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                  <div
                    className="absolute top-3 left-3 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color || '#14b8a6' }}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
                {/* Content */}
                <div className="p-3">
                  <h4 className="font-semibold text-white text-sm group-hover:text-teal-400 transition-colors">
                    {category.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{category.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-teal-400">{category._count.products} productos</span>
                    <ArrowRight size={14} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Featured Products */}
      {featured.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Star size={20} className="text-amber-400" />
            Productos Destacados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} onProductClick={onProductClick} onAddToQuote={onAddToQuote} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ CATEGORY VIEW ============
function CategoryView({ category, products, onProductClick, onAddToQuote, onBack }: {
  category: Category
  products: Product[]
  onProductClick: (prod: Product) => void
  onAddToQuote: (prod: Product, plan: Plan) => void
  onBack: () => void
}) {
  const Icon = getIcon(category.icon)
  const img = categoryImages[category.slug] || categoryImages['vehiculos']

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="relative overflow-hidden rounded-2xl h-48">
        <img src={img} alt={category.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent" />
        <div className="absolute inset-0 flex items-center p-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: category.color || '#14b8a6' }}>
                <Icon size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                <p className="text-slate-300 text-sm">{products.length} productos disponibles</p>
              </div>
            </div>
            {category.description && <p className="text-slate-300 text-sm mt-2 max-w-lg">{category.description}</p>}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onProductClick={onProductClick} onAddToQuote={onAddToQuote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Shield size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">No hay productos disponibles en esta categoría</p>
        </div>
      )}
    </div>
  )
}

// ============ PRODUCT CARD ============
function ProductCard({ product, onProductClick, onAddToQuote }: {
  product: Product
  onProductClick: (prod: Product) => void
  onAddToQuote: (prod: Product, plan: Plan) => void
}) {
  const lowestPlan = product.plans?.[0]
  const lowestPrice = lowestPlan?.annualPremium || lowestPlan?.monthlyPremium

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-teal-500/30 transition-all group">
      {/* Header with insurer badge */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: getInsurerColor(product.insurer.name) }}
          >
            {getInsurerInitials(product.insurer.name)}
          </div>
          {product.isFeatured && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-medium">
              <Star size={10} /> Destacado
            </span>
          )}
        </div>
        <p className="text-xs text-teal-400 font-medium mb-1">{product.insurer.name}</p>
        <h4 className="text-white font-semibold group-hover:text-teal-400 transition-colors">{product.name}</h4>
        {product.shortDesc && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.shortDesc}</p>}
      </div>

      {/* Price preview */}
      {lowestPrice && (
        <div className="px-4 py-2 bg-slate-900/50 border-t border-b border-slate-700/30">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-400">Desde</span>
            <span className="text-lg font-bold text-teal-400">{formatCurrency(lowestPrice, lowestPlan?.currency)}</span>
            <span className="text-xs text-slate-500">/ año</span>
          </div>
        </div>
      )}

      {/* Plans preview */}
      <div className="p-4 pt-3 space-y-2">
        {product.plans?.slice(0, 3).map(plan => (
          <div key={plan.id} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${getTierColor(plan.tier)}`} />
              <span className="text-xs text-slate-300">{plan.name}</span>
              {plan.isPopular && <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-400 rounded-full">Popular</span>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onAddToQuote(product, plan) }}
              className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
              title="Agregar a cotización"
            >
              <Plus size={14} />
            </button>
          </div>
        ))}
        {(product._count?.plans ?? 0) > 3 && (
          <p className="text-[10px] text-slate-500">+{(product._count?.plans ?? 0) - 3} planes más</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onProductClick(product)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600/20 hover:bg-teal-600/40 border border-teal-500/30 rounded-lg text-sm text-teal-400 font-medium transition-colors"
        >
          Ver Detalles
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ============ PRODUCT DETAIL VIEW ============
function ProductView({ product, onAddToQuote, onBack, isAdmin, onCreatePlan, onEditPlan, onDeletePlan }: {
  product: Product
  onAddToQuote: (prod: Product, plan: Plan) => void
  onBack: () => void
  isAdmin: boolean
  onCreatePlan: (productId: number) => void
  onEditPlan: (plan: Plan) => void
  onDeletePlan: (planId: number) => void
}) {
  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0"
            style={{ backgroundColor: getInsurerColor(product.insurer.name) }}
          >
            {getInsurerInitials(product.insurer.name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-teal-400 font-medium">{product.insurer.name}</span>
              <span className="text-slate-600">·</span>
              <span className="text-sm text-slate-400">{product.category.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{product.name}</h2>
            {product.description && <p className="text-slate-300 text-sm leading-relaxed">{product.description}</p>}
          </div>
        </div>
      </div>

      {/* Plans Comparison */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award size={20} className="text-teal-400" />
            Planes Disponibles
          </h3>
          {isAdmin && (
            <button
              onClick={() => onCreatePlan(product.id)}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-xs text-white font-medium transition-colors"
            >
              <Plus size={14} />
              Agregar Plan
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {product.plans?.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-slate-800/50 border rounded-xl overflow-hidden ${
                plan.isPopular ? 'border-teal-500 ring-1 ring-teal-500/20' : 'border-slate-700/50'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                  MÁS POPULAR
                </div>
              )}
              {/* Admin actions */}
              {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-1 z-10">
                  <button
                    onClick={() => onEditPlan(plan)}
                    className="w-7 h-7 rounded-lg bg-slate-700/80 hover:bg-blue-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                    title="Editar plan"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => onDeletePlan(plan.id)}
                    className="w-7 h-7 rounded-lg bg-slate-700/80 hover:bg-red-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                    title="Eliminar plan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
              {/* Plan tier badge */}
              <div className={`h-1.5 bg-gradient-to-r ${getTierColor(plan.tier)}`} />

              <div className="p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{plan.tier}</p>
                <h4 className="text-lg font-bold text-white mb-3">{plan.name}</h4>

                {/* Price */}
                <div className="mb-4">
                  {plan.annualPremium && (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-teal-400">{formatCurrency(plan.annualPremium, plan.currency)}</span>
                      <span className="text-sm text-slate-500">/ año</span>
                    </div>
                  )}
                  {plan.monthlyPremium && (
                    <p className="text-xs text-slate-400 mt-1">
                      o {formatCurrency(plan.monthlyPremium, plan.currency)} / mes
                    </p>
                  )}
                  {!plan.annualPremium && !plan.monthlyPremium && (
                    <p className="text-lg font-semibold text-amber-400">Consultar Precio</p>
                  )}
                </div>

                {/* Coverage */}
                {(plan.minCoverage || plan.maxCoverage) && (
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Cobertura</p>
                    <p className="text-sm text-white font-medium">
                      {plan.minCoverage && plan.maxCoverage
                        ? `${formatCurrency(plan.minCoverage)} - ${formatCurrency(plan.maxCoverage)}`
                        : formatCurrency(plan.maxCoverage || plan.minCoverage)}
                    </p>
                    {plan.deductible && (
                      <p className="text-xs text-slate-400 mt-1">Deducible: {formatCurrency(plan.deductible)}</p>
                    )}
                  </div>
                )}

                {/* Coverages list */}
                {plan.coverages && Array.isArray(plan.coverages) && plan.coverages.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {(plan.coverages as string[]).map((coverage, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-teal-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-300">{coverage}</span>
                      </div>
                    ))}
                  </div>
                )}

                {plan.description && <p className="text-xs text-slate-400 mb-4">{plan.description}</p>}

                {/* Actions */}
                <button
                  onClick={() => onAddToQuote(product, plan)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm text-white font-medium transition-colors"
                >
                  <Calculator size={16} />
                  Agregar a Cotización
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insurer Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-teal-400" />
          Sobre la Aseguradora
        </h3>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: getInsurerColor(product.insurer.name) }}
          >
            {getInsurerInitials(product.insurer.name)}
          </div>
          <div>
            <p className="text-white font-semibold">{product.insurer.name}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
              {(product.insurer as any).email && (
                <span className="flex items-center gap-1"><Mail size={12} /> {(product.insurer as any).email}</span>
              )}
              {(product.insurer as any).phone && (
                <span className="flex items-center gap-1"><Phone size={12} /> {(product.insurer as any).phone}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ QUOTATIONS VIEW ============
function QuotationsView({ quotations, onBack, onEdit, onDownloadPdf, onEmail }: {
  quotations: Quotation[]
  onBack: () => void
  onEdit: (id: number) => void
  onDownloadPdf: (id: number, quotationNo: string) => void
  onEmail: (id: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText size={20} className="text-teal-400" />
          Mis Cotizaciones
        </h3>
        <button onClick={onBack} className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
          Volver al Catálogo
        </button>
      </div>

      {quotations.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 border border-slate-700/50 rounded-xl">
          <FileText size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No tienes cotizaciones aún</p>
          <p className="text-sm text-slate-500 mt-1">Explora el catálogo y agrega productos a tu cotización</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map(q => (
            <div key={q.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-semibold">{q.quotationNo}</span>
                  <StatusBadge status={q.status} />
                </div>
                <p className="text-sm text-slate-400">{q.clientName}</p>
                <p className="text-xs text-slate-500">{new Date(q.createdAt).toLocaleDateString('es-DO')} · {q._count.items} productos</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-2">
                  <p className="text-lg font-bold text-teal-400">{formatCurrency(q.totalPremium)}</p>
                  <p className="text-xs text-slate-500">Prima Total</p>
                </div>
                <button
                  onClick={() => onEdit(q.id)}
                  className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-blue-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Editar cotización"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onDownloadPdf(q.id, q.quotationNo)}
                  className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-teal-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Descargar PDF"
                >
                  <Download size={15} />
                </button>
                <button
                  onClick={() => onEmail(q.id)}
                  className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-green-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="Enviar por email"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ QUOTE BUILDER MODAL ============
function QuoteBuilderModal({ items, client, onClientChange, onRemoveItem, onSubmit, onClose, isEditing }: {
  items: QuotationItem[]
  client: { name: string; email: string; phone: string }
  onClientChange: (client: { name: string; email: string; phone: string }) => void
  onRemoveItem: (index: number) => void
  onSubmit: () => void
  onClose: () => void
  isEditing?: boolean
}) {
  const total = items.reduce((sum, item) => sum + item.premium, 0)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator size={20} className="text-teal-400" />
            {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Client Info */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Datos del Cliente</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={client.name}
                onChange={e => onClientChange({ ...client, name: e.target.value })}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
              <input
                type="email"
                placeholder="Email"
                value={client.email}
                onChange={e => onClientChange({ ...client, email: e.target.value })}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={client.phone}
                onChange={e => onClientChange({ ...client, phone: e.target.value })}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Productos Seleccionados</h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: getInsurerColor(item.insurerName) }}
                    >
                      {getInsurerInitials(item.insurerName)}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{item.productName}</p>
                      <p className="text-xs text-slate-400">{item.insurerName} · {item.planName} ({item.planTier})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-teal-400">{formatCurrency(item.premium)}</span>
                    <button onClick={() => onRemoveItem(index)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <span className="text-sm font-semibold text-slate-300">Prima Total Anual</span>
            <span className="text-xl font-bold text-teal-400">{formatCurrency(total)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSubmit}
              disabled={!client.name || items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm text-white font-medium transition-colors"
            >
              <FileText size={16} />
              {isEditing ? 'Guardar Cambios' : 'Crear Cotización'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ PLAN FORM MODAL ============
const TIER_OPTIONS = ['BASICO', 'INTERMEDIO', 'PREMIUM', 'FULL', 'SUPER_FULL'] as const

function PlanFormModal({ plan, onSave, onClose }: {
  plan: Plan | null
  onSave: (data: any) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: plan?.name || '',
    tier: plan?.tier || 'BASICO',
    description: plan?.description || '',
    coverages: plan?.coverages?.join('\n') || '',
    monthlyPremium: plan?.monthlyPremium || '',
    annualPremium: plan?.annualPremium || '',
    minCoverage: plan?.minCoverage || '',
    maxCoverage: plan?.maxCoverage || '',
    deductible: plan?.deductible || '',
    currency: plan?.currency || 'DOP',
    isPopular: plan?.isPopular || false,
    sortOrder: plan?.sortOrder ?? 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.monthlyPremium || !form.annualPremium) {
      alert('Nombre, prima mensual y prima anual son requeridos')
      return
    }
    setSaving(true)
    try {
      const coveragesArray = form.coverages
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)

      await onSave({
        name: form.name,
        tier: form.tier,
        description: form.description || undefined,
        coverages: coveragesArray,
        monthlyPremium: parseFloat(form.monthlyPremium as string),
        annualPremium: parseFloat(form.annualPremium as string),
        minCoverage: form.minCoverage ? parseFloat(form.minCoverage as string) : undefined,
        maxCoverage: form.maxCoverage ? parseFloat(form.maxCoverage as string) : undefined,
        deductible: form.deductible ? parseFloat(form.deductible as string) : undefined,
        currency: form.currency,
        isPopular: form.isPopular,
        sortOrder: form.sortOrder,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">
            {plan ? 'Editar Plan' : 'Nuevo Plan'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Plan Básico" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nivel *</label>
              <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} className={inputClass}>
                {TIER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Moneda</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={inputClass}>
                <option value="DOP">DOP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Descripción</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Descripción del plan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prima Mensual *</label>
              <input type="number" value={form.monthlyPremium} onChange={e => setForm({ ...form, monthlyPremium: e.target.value })} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prima Anual *</label>
              <input type="number" value={form.annualPremium} onChange={e => setForm({ ...form, annualPremium: e.target.value })} className={inputClass} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cob. Mínima</label>
              <input type="number" value={form.minCoverage} onChange={e => setForm({ ...form, minCoverage: e.target.value })} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cob. Máxima</label>
              <input type="number" value={form.maxCoverage} onChange={e => setForm({ ...form, maxCoverage: e.target.value })} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Deducible</label>
              <input type="number" value={form.deductible} onChange={e => setForm({ ...form, deductible: e.target.value })} className={inputClass} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Coberturas (una por línea)</label>
            <textarea
              value={form.coverages}
              onChange={e => setForm({ ...form, coverages: e.target.value })}
              rows={4}
              className={inputClass}
              placeholder={"Responsabilidad civil\nDaños propios\nRobo total"}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={e => setForm({ ...form, isPopular: e.target.checked })}
                className="rounded border-slate-600 bg-slate-700 text-teal-600 focus:ring-teal-500"
              />
              Popular
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Orden:</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 rounded-lg text-sm text-white font-medium transition-colors"
            >
              {saving ? 'Guardando...' : plan ? 'Guardar Cambios' : 'Crear Plan'}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
