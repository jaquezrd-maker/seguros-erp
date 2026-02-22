/**
 * Seed Insurance Catalog
 * Populates categories, products, and plans with real Dominican Republic insurance data
 */
import prisma from '../src/config/database'

async function seedCatalog() {
  console.log('Seeding insurance catalog...\n')

  // ============ CATEGORIES ============
  const categories = [
    { name: 'Vehículos', slug: 'vehiculos', description: 'Seguros para automóviles, motocicletas y flotas vehiculares. Protege tu vehículo contra robos, accidentes, daños y responsabilidad civil.', icon: 'Car', color: '#3b82f6', sortOrder: 1 },
    { name: 'Salud', slug: 'salud', description: 'Planes médicos individuales y familiares. Cobertura hospitalaria, consultas, cirugías, medicamentos y emergencias.', icon: 'Heart', color: '#ef4444', sortOrder: 2 },
    { name: 'Vida', slug: 'vida', description: 'Seguros de vida individual y colectivo. Protección financiera para tu familia con cobertura por fallecimiento, accidentes y ahorro.', icon: 'Shield', color: '#8b5cf6', sortOrder: 3 },
    { name: 'Hogar y Propiedad', slug: 'hogar', description: 'Protección para tu casa, apartamento y contenido. Cobertura contra incendio, huracanes, terremotos, robos y responsabilidad civil.', icon: 'Home', color: '#f59e0b', sortOrder: 4 },
    { name: 'Empresarial', slug: 'empresarial', description: 'Seguros integrales para empresas y negocios. Protección de activos, empleados, responsabilidad civil y continuidad operativa.', icon: 'Briefcase', color: '#10b981', sortOrder: 5 },
    { name: 'Viaje', slug: 'viaje', description: 'Asistencia médica en el extranjero, repatriación, pérdida de equipaje, cancelación de vuelos y más.', icon: 'Plane', color: '#06b6d4', sortOrder: 6 },
    { name: 'Incendio y Líneas Aliadas', slug: 'incendio', description: 'Protección de propiedades comerciales e industriales contra incendio, huracanes, terremotos, inundaciones y explosiones.', icon: 'Flame', color: '#f97316', sortOrder: 7 },
    { name: 'Responsabilidad Civil', slug: 'responsabilidad-civil', description: 'Seguros de responsabilidad civil general, profesional, exceso y de productos para proteger tu patrimonio.', icon: 'Scale', color: '#64748b', sortOrder: 8 },
    { name: 'Transporte y Carga', slug: 'transporte', description: 'Seguros para mercancías en tránsito marítimo, terrestre y aéreo. Protección de carga y naves.', icon: 'Ship', color: '#0ea5e9', sortOrder: 9 },
    { name: 'Agropecuario', slug: 'agropecuario', description: 'Seguros para el sector agrícola y ganadero. Protección de cultivos, ganado y equipos agrícolas.', icon: 'Tractor', color: '#22c55e', sortOrder: 10 },
    { name: 'Fianzas', slug: 'fianzas', description: 'Fianzas de fidelidad, cumplimiento, judiciales y aduanales para garantizar obligaciones contractuales.', icon: 'Award', color: '#a855f7', sortOrder: 11 },
  ]

  const catMap: Record<string, number> = {}
  for (const cat of categories) {
    const created = await prisma.insuranceCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    })
    catMap[cat.slug] = created.id
    console.log(`  Category: ${cat.name} (ID: ${created.id})`)
  }

  // ============ GET INSURERS (from existing data) ============
  const insurers = await prisma.insurer.findMany()
  const insurerMap: Record<string, number> = {}
  for (const ins of insurers) {
    insurerMap[ins.name] = ins.id
  }

  // If no insurers exist, create the main ones
  if (insurers.length === 0) {
    console.log('\n  Creating insurers...')
    const defaultInsurers = [
      { name: 'Seguros Universal', rnc: '101892345', companyId: 4 },
      { name: 'Seguros Reservas', rnc: '101001234', companyId: 4 },
      { name: 'Humano Seguros', rnc: '101567890', companyId: 4 },
      { name: 'MAPFRE BHD', rnc: '101234567', companyId: 4 },
      { name: 'La Colonial', rnc: '101345678', companyId: 4 },
      { name: 'Atlántica Seguros', rnc: '101456789', companyId: 4 },
      { name: 'La Monumental', rnc: '101678901', companyId: 4 },
      { name: 'Seguros Pepín', rnc: '101789012', companyId: 4 },
      { name: 'Seguros SURA', rnc: '101890123', companyId: 4 },
      { name: 'General de Seguros', rnc: '101901234', companyId: 4 },
    ]

    for (const ins of defaultInsurers) {
      const created = await prisma.insurer.create({ data: ins })
      insurerMap[ins.name] = created.id
      console.log(`    Insurer: ${ins.name} (ID: ${created.id})`)
    }
  }

  // Helper to get insurer ID (try exact match or partial)
  function getInsurerId(name: string): number {
    if (insurerMap[name]) return insurerMap[name]
    const key = Object.keys(insurerMap).find(k => k.includes(name) || name.includes(k))
    if (key) return insurerMap[key]
    // Return first insurer as fallback
    return Object.values(insurerMap)[0]
  }

  // ============ PRODUCTS AND PLANS ============
  console.log('\n  Creating products and plans...')

  interface PlanData {
    name: string
    tier: string
    description?: string
    coverages: string[]
    monthlyPremium?: number
    annualPremium?: number
    minCoverage?: number
    maxCoverage?: number
    deductible?: number
    currency?: string
    isPopular?: boolean
    sortOrder: number
  }

  interface ProductData {
    categorySlug: string
    insurerName: string
    name: string
    slug: string
    shortDesc: string
    description: string
    isFeatured?: boolean
    plans: PlanData[]
  }

  const products: ProductData[] = [
    // ====== VEHICULOS ======
    {
      categorySlug: 'vehiculos', insurerName: 'Seguros Universal', name: 'Auto Universal Full', slug: 'auto-universal-full',
      shortDesc: 'Protección completa para tu vehículo con la aseguradora líder del mercado.',
      description: 'Seguros Universal ofrece la protección más completa para tu vehículo. Con más de 60 años en el mercado, es la aseguradora #1 en República Dominicana con 21% de participación.',
      isFeatured: true,
      plans: [
        { name: 'Terceros', tier: 'BASICO', coverages: ['Responsabilidad Civil RD$500,000', 'Daños a terceros', 'Asistencia vial básica'], annualPremium: 8000, maxCoverage: 500000, deductible: 5000, sortOrder: 1 },
        { name: 'Comprensivo', tier: 'INTERMEDIO', coverages: ['RC RD$1,000,000', 'Robo y hurto', 'Incendio', 'Daños parciales', 'Asistencia vial 24/7'], annualPremium: 25000, maxCoverage: 1000000, deductible: 10000, isPopular: true, sortOrder: 2 },
        { name: 'Full', tier: 'FULL', coverages: ['RC RD$1,500,000', 'Todo riesgo', 'Colisión y volcadura', 'Robo total y parcial', 'Incendio', 'Desastres naturales', 'Asistencia vial premium', 'Ambulancia'], annualPremium: 45000, maxCoverage: 2000000, deductible: 5000, sortOrder: 3 },
        { name: 'Super Full', tier: 'PLATINUM', coverages: ['RC RD$2,000,000', 'Todo riesgo cero deducible', 'Vehículo sustituto', 'Ambulancia aérea', 'Cobertura en USA/PR', 'Asistencia vial premium+', 'Grúa ilimitada'], annualPremium: 75000, maxCoverage: 3000000, deductible: 0, sortOrder: 4 },
      ]
    },
    {
      categorySlug: 'vehiculos', insurerName: 'Humano Seguros', name: 'Mi Auto Humano', slug: 'mi-auto-humano',
      shortDesc: 'Seguros de auto con la mejor relación calidad-precio y plataforma 100% digital.',
      description: 'Humano Seguros ofrece planes de auto con gestión digital completa. Cotiza, compra y gestiona tu seguro desde cualquier dispositivo.',
      isFeatured: true,
      plans: [
        { name: 'Mi Auto Básico', tier: 'BASICO', coverages: ['Responsabilidad Civil', 'Asistencia vial', 'Grúa hasta 50km'], annualPremium: 7500, maxCoverage: 500000, deductible: 8000, sortOrder: 1 },
        { name: 'Mi Auto Comprensivo', tier: 'INTERMEDIO', coverages: ['RC RD$1,000,000', 'Robo', 'Incendio', 'Daños propios parciales', 'Asistencia 24/7'], annualPremium: 22000, maxCoverage: 1500000, deductible: 10000, isPopular: true, sortOrder: 2 },
        { name: 'Mi Auto Full', tier: 'FULL', coverages: ['RC RD$2,000,000', 'Todo riesgo', 'Cero deducible opción', 'Vehículo sustituto 5 días', 'Ambulancia', 'Cobertura huracanes'], annualPremium: 40000, maxCoverage: 2500000, deductible: 5000, sortOrder: 3 },
      ]
    },
    {
      categorySlug: 'vehiculos', insurerName: 'MAPFRE BHD', name: 'Trébol Auto MAPFRE', slug: 'trebol-auto-mapfre',
      shortDesc: 'Respaldo internacional MAPFRE con servicio local BHD. Planes especializados.',
      description: 'MAPFRE BHD combina la experiencia global de MAPFRE España con la solidez del grupo financiero BHD León. Planes especiales para mujer conductora.',
      plans: [
        { name: 'Trébol Básico', tier: 'BASICO', coverages: ['RC terceros', 'Defensa legal', 'Asistencia en carretera'], annualPremium: 9000, maxCoverage: 500000, deductible: 7500, sortOrder: 1 },
        { name: 'Trébol Plus', tier: 'INTERMEDIO', coverages: ['RC ampliada', 'Robo y hurto', 'Incendio', 'Cristales', 'Asistencia premium'], annualPremium: 28000, maxCoverage: 1500000, deductible: 8000, isPopular: true, sortOrder: 2 },
        { name: 'Trébol Plus Más', tier: 'PREMIUM', coverages: ['Todo riesgo', 'Auto sustituto', 'Cobertura pasajeros', 'Accidentes personales', 'Asistencia total'], annualPremium: 50000, maxCoverage: 2500000, deductible: 5000, sortOrder: 3 },
        { name: 'Trébol Mujer', tier: 'PREMIUM', description: 'Plan diseñado especialmente para mujeres conductoras', coverages: ['Todo riesgo', 'Cartera y efectos personales', 'Cambio de gomas', 'Cerrajería', 'Taxi de emergencia', 'Asistencia en el hogar'], annualPremium: 35000, maxCoverage: 2000000, deductible: 5000, sortOrder: 4 },
      ]
    },
    {
      categorySlug: 'vehiculos', insurerName: 'Seguros Reservas', name: 'Auto Reservas', slug: 'auto-reservas',
      shortDesc: 'Respaldado por el Grupo Banreservas. Utilidades récord en 2025.',
      description: 'Seguros Reservas, parte del Grupo Banreservas (estatal), ofrece planes de auto con el respaldo financiero más sólido del país.',
      plans: [
        { name: 'Plan Ley', tier: 'BASICO', coverages: ['Cobertura mínima de ley', 'RC básica'], annualPremium: 3500, maxCoverage: 300000, sortOrder: 1 },
        { name: 'Plan Intermedio', tier: 'INTERMEDIO', coverages: ['RC ampliada', 'Robo', 'Incendio', 'Asistencia vial'], annualPremium: 20000, maxCoverage: 1000000, deductible: 10000, isPopular: true, sortOrder: 2 },
        { name: 'Plan Full', tier: 'FULL', coverages: ['Todo riesgo', 'Colisión', 'Volcadura', 'Huracán', 'Terremoto', 'Asistencia vial completa'], annualPremium: 42000, maxCoverage: 2000000, deductible: 5000, sortOrder: 3 },
      ]
    },

    // ====== SALUD ======
    {
      categorySlug: 'salud', insurerName: 'Humano Seguros', name: 'Mi Salud Humano', slug: 'mi-salud-humano',
      shortDesc: 'Planes de salud líderes en RD. Desde cobertura esencial hasta planes internacionales.',
      description: 'Humano Seguros ofrece la gama más completa de planes de salud en República Dominicana, con cobertura desde básica hasta internacional.',
      isFeatured: true,
      plans: [
        { name: 'Mi Salud Esencial', tier: 'BASICO', coverages: ['Hospitalización RD$3,000/día', 'Emergencias', 'Medicamentos RD$4,000/año', 'Red local'], annualPremium: 12000, maxCoverage: 200000, sortOrder: 1 },
        { name: 'Mi Salud Superior', tier: 'INTERMEDIO', coverages: ['Hospitalización ampliada', 'Consultas médicas', 'Cirugías', 'Laboratorios', 'Medicamentos RD$15,000/año', 'Red ampliada'], annualPremium: 35000, maxCoverage: 350000, isPopular: true, sortOrder: 2 },
        { name: 'Mi Salud Prime', tier: 'PREMIUM', coverages: ['Cobertura RD$1,500,000', 'Mejores especialistas', 'Reembolso fuera de red', 'Maternidad', 'Dental básico', 'Emergencias internacionales'], annualPremium: 80000, maxCoverage: 1500000, sortOrder: 3 },
        { name: 'Mi Salud Platinum', tier: 'PLATINUM', coverages: ['Máxima cobertura local', 'Beneficios ejecutivos', 'Habitación privada', 'Segunda opinión médica', 'Chequeo anual completo', 'Dental y visión'], annualPremium: 150000, maxCoverage: 3000000, sortOrder: 4 },
      ]
    },
    {
      categorySlug: 'salud', insurerName: 'Seguros Universal', name: 'Salud Universal Vital', slug: 'salud-universal-vital',
      shortDesc: 'Planes de salud con la mayor red de proveedores médicos del país.',
      description: 'Seguros Universal ofrece planes de salud con acceso a la red médica más amplia de República Dominicana.',
      plans: [
        { name: 'Vital Básico', tier: 'BASICO', coverages: ['Hospitalización', 'Emergencias', 'Consultas médicas', 'Laboratorios básicos'], annualPremium: 15000, maxCoverage: 250000, sortOrder: 1 },
        { name: 'Vital Plus', tier: 'INTERMEDIO', coverages: ['Hospitalización ampliada', 'Cirugías', 'Maternidad', 'Medicamentos', 'Ambulancia'], annualPremium: 40000, maxCoverage: 500000, isPopular: true, sortOrder: 2 },
        { name: 'Vital Alpha', tier: 'PREMIUM', coverages: ['Máxima cobertura', 'Cualquier clínica', 'Chequeo ejecutivo', 'Dental', 'Visión', 'Internacional emergencias'], annualPremium: 95000, maxCoverage: 2000000, sortOrder: 3 },
      ]
    },

    // ====== VIDA ======
    {
      categorySlug: 'vida', insurerName: 'Seguros Universal', name: 'Vida Universal', slug: 'vida-universal',
      shortDesc: 'Protección financiera para tu familia con los planes de vida más completos.',
      description: 'Seguros de vida que garantizan la estabilidad financiera de tu familia. Opciones de vida individual, colectivo y últimos gastos.',
      isFeatured: true,
      plans: [
        { name: 'Últimos Gastos', tier: 'BASICO', coverages: ['Cobertura funeraria RD$200,000', 'Muerte accidental doble indemnización', 'Sin examen médico'], annualPremium: 5000, maxCoverage: 200000, sortOrder: 1 },
        { name: 'Vida Individual', tier: 'INTERMEDIO', coverages: ['Muerte natural RD$1,000,000', 'Muerte accidental doble', 'Incapacidad total', 'Exoneración de primas'], annualPremium: 15000, maxCoverage: 1000000, isPopular: true, sortOrder: 2 },
        { name: 'Vida Premium', tier: 'PREMIUM', coverages: ['Muerte RD$5,000,000', 'Accidental doble', 'Enfermedades críticas', 'Incapacidad', 'Ahorro componente', 'Valor en efectivo'], annualPremium: 40000, maxCoverage: 5000000, sortOrder: 3 },
      ]
    },
    {
      categorySlug: 'vida', insurerName: 'Humano Seguros', name: 'Mi Vida Humano', slug: 'mi-vida-humano',
      shortDesc: 'Planes de vida accesibles para proteger lo que más importa.',
      description: 'Humano Seguros ofrece planes de vida flexibles: individual, colectivo, escolar y crédito.',
      plans: [
        { name: 'Mi Vida Básica', tier: 'BASICO', coverages: ['Muerte natural', 'Muerte accidental', 'Sepelio'], annualPremium: 4000, maxCoverage: 500000, sortOrder: 1 },
        { name: 'Mi Vida Protegida', tier: 'INTERMEDIO', coverages: ['Muerte RD$2,000,000', 'Accidental doble', 'Enfermedades graves', 'Exoneración primas'], annualPremium: 20000, maxCoverage: 2000000, isPopular: true, sortOrder: 2 },
      ]
    },

    // ====== HOGAR ======
    {
      categorySlug: 'hogar', insurerName: 'Seguros Universal', name: 'Garanticasa Universal', slug: 'garanticasa-universal',
      shortDesc: 'Protección integral para tu hogar: estructura, contenido y responsabilidad civil.',
      description: 'Garanticasa de Seguros Universal ofrece la cobertura más completa para tu hogar, incluyendo estructura, contenido, responsabilidad civil y asistencia domiciliaria.',
      isFeatured: true,
      plans: [
        { name: 'Hogar Básico', tier: 'BASICO', coverages: ['Incendio y rayo', 'Huracán', 'Terremoto', 'Explosión'], annualPremium: 8000, maxCoverage: 2000000, sortOrder: 1 },
        { name: 'Hogar Plus', tier: 'INTERMEDIO', coverages: ['Incendio y aliadas', 'Robo', 'Daños por agua', 'Cristales', 'RC del hogar', 'Contenido RD$500,000'], annualPremium: 18000, maxCoverage: 5000000, isPopular: true, sortOrder: 2 },
        { name: 'Hogar Total', tier: 'PREMIUM', coverages: ['Todo riesgo', 'Estructura y contenido', 'Equipos electrónicos', 'Joyas y obras de arte', 'Responsabilidad civil', 'Asistencia domiciliaria 24/7'], annualPremium: 35000, maxCoverage: 10000000, sortOrder: 3 },
      ]
    },

    // ====== EMPRESARIAL ======
    {
      categorySlug: 'empresarial', insurerName: 'La Colonial', name: 'EmprendeSeguro Colonial', slug: 'emprendeseguro-colonial',
      shortDesc: 'Seguros diseñados para PYMES y emprendedores dominicanos con tecnología Insurtech.',
      description: 'La Colonial innova con EmprendeSeguro, un producto digital diseñado especialmente para pequeñas y medianas empresas de República Dominicana.',
      isFeatured: true,
      plans: [
        { name: 'PYME Básico', tier: 'BASICO', coverages: ['Incendio y líneas aliadas', 'Robo', 'RC General básica', 'Cristales'], annualPremium: 15000, maxCoverage: 3000000, sortOrder: 1 },
        { name: 'PYME Integral', tier: 'INTERMEDIO', coverages: ['Todo riesgo propiedad', 'RC General', 'Pérdida de beneficios', 'Equipo electrónico', 'Fidelidad empleados'], annualPremium: 45000, maxCoverage: 10000000, isPopular: true, sortOrder: 2 },
        { name: 'Corporativo', tier: 'PREMIUM', coverages: ['Todo riesgo industrial', 'RC ampliada', 'Pérdida de beneficios', 'Rotura de maquinaria', 'Transporte mercancías', 'D&O', 'Cyber riesgo'], annualPremium: 120000, maxCoverage: 50000000, sortOrder: 3 },
      ]
    },

    // ====== VIAJE ======
    {
      categorySlug: 'viaje', insurerName: 'MAPFRE BHD', name: 'Viaje MAPFRE', slug: 'viaje-mapfre',
      shortDesc: 'Asistencia en viaje con cobertura mundial respaldada por MAPFRE Internacional.',
      description: 'MAPFRE BHD ofrece los planes de viaje más completos con cobertura médica internacional, repatriación y asistencia 24/7 en todo el mundo.',
      plans: [
        { name: 'Viaje Básico', tier: 'BASICO', description: 'Ideal para viajes cortos al Caribe', coverages: ['Asistencia médica US$30,000', 'Repatriación', 'Pérdida equipaje US$500', 'Asistencia 24/7'], annualPremium: 2500, currency: 'USD', maxCoverage: 30000, sortOrder: 1 },
        { name: 'Viaje Plus', tier: 'INTERMEDIO', description: 'Para viajes a cualquier destino', coverages: ['Asistencia médica US$100,000', 'Repatriación sanitaria', 'Pérdida equipaje US$1,500', 'Cancelación viaje', 'Demora vuelo', 'Asistencia legal'], annualPremium: 6000, currency: 'USD', maxCoverage: 100000, isPopular: true, sortOrder: 2 },
        { name: 'Viaje Premium', tier: 'PREMIUM', description: 'Máxima protección mundial', coverages: ['Asistencia médica US$500,000', 'Evacuación médica', 'Repatriación', 'Equipaje US$3,000', 'Cancelación total', 'Deporte aventura', 'COVID-19'], annualPremium: 15000, currency: 'USD', maxCoverage: 500000, sortOrder: 3 },
      ]
    },

    // ====== INCENDIO ======
    {
      categorySlug: 'incendio', insurerName: 'Seguros Reservas', name: 'Propiedad Comercial Reservas', slug: 'propiedad-comercial-reservas',
      shortDesc: 'Protección de propiedades comerciales e industriales. Líder en el ramo de Incendio y Líneas Aliadas.',
      description: 'Seguros Reservas ofrece la protección más completa para propiedades comerciales. El ramo de Incendio y Líneas Aliadas representa el 26% del mercado dominicano.',
      plans: [
        { name: 'Incendio Básico', tier: 'BASICO', coverages: ['Incendio', 'Rayo', 'Explosión', 'Humo'], annualPremium: 12000, sortOrder: 1 },
        { name: 'Incendio y Aliadas', tier: 'INTERMEDIO', coverages: ['Incendio completo', 'Huracán', 'Terremoto', 'Inundación', 'Derrumbe', 'Vandalismo'], annualPremium: 35000, isPopular: true, sortOrder: 2 },
        { name: 'Todo Riesgo Comercial', tier: 'PREMIUM', coverages: ['Todo riesgo', 'Pérdida de beneficios', 'Remoción de escombros', 'Gastos extras', 'Bienes en tránsito', 'Equipos electrónicos'], annualPremium: 80000, sortOrder: 3 },
      ]
    },

    // ====== RESPONSABILIDAD CIVIL ======
    {
      categorySlug: 'responsabilidad-civil', insurerName: 'Seguros SURA', name: 'RC SURA Profesional', slug: 'rc-sura-profesional',
      shortDesc: 'Seguros de responsabilidad civil con respaldo de SURA Colombia, líder en Latinoamérica.',
      description: 'SURA ofrece seguros de responsabilidad civil especializados para profesionales y empresas, con cobertura integral y defensa legal.',
      plans: [
        { name: 'RC General', tier: 'BASICO', coverages: ['Daños a terceros', 'Defensa legal', 'RC productos', 'RC locativa'], annualPremium: 15000, maxCoverage: 5000000, sortOrder: 1 },
        { name: 'RC Profesional', tier: 'INTERMEDIO', description: 'Para médicos, abogados, contadores e ingenieros', coverages: ['Errores y omisiones', 'Negligencia profesional', 'Defensa legal', 'Daños a terceros', 'Gastos de investigación'], annualPremium: 30000, maxCoverage: 10000000, isPopular: true, sortOrder: 2 },
        { name: 'RC Umbrella', tier: 'PREMIUM', coverages: ['Exceso de RC', 'Cobertura ampliada', 'Multi-línea', 'Defensa ilimitada'], annualPremium: 60000, maxCoverage: 50000000, sortOrder: 3 },
      ]
    },

    // ====== TRANSPORTE ======
    {
      categorySlug: 'transporte', insurerName: 'Atlántica Seguros', name: 'Carga Atlántica', slug: 'carga-atlantica',
      shortDesc: 'Seguros de transporte de mercancías por vía marítima, terrestre y aérea.',
      description: 'Atlántica Seguros, con más de 35 años de experiencia, ofrece protección integral para mercancías en tránsito nacional e internacional.',
      plans: [
        { name: 'Transporte Terrestre', tier: 'BASICO', coverages: ['Mercancías en tránsito terrestre', 'Accidente vehículo', 'Robo en tránsito'], annualPremium: 10000, sortOrder: 1 },
        { name: 'Transporte Multimodal', tier: 'INTERMEDIO', coverages: ['Marítimo', 'Terrestre', 'Aéreo', 'Contenedor a contenedor', 'Robo', 'Avería gruesa'], annualPremium: 25000, isPopular: true, sortOrder: 2 },
        { name: 'Todo Riesgo Carga', tier: 'PREMIUM', coverages: ['Todo riesgo', 'Bodega a bodega', 'Gastos de salvamento', 'Contribución avería gruesa', 'Almacenamiento temporal'], annualPremium: 50000, sortOrder: 3 },
      ]
    },
  ]

  for (const product of products) {
    const insurerId = getInsurerId(product.insurerName)
    const categoryId = catMap[product.categorySlug]

    if (!categoryId) {
      console.log(`    SKIP: No category for ${product.categorySlug}`)
      continue
    }

    // Check if product already exists
    const existing = await prisma.insuranceProduct.findFirst({
      where: { slug: product.slug, insurerId }
    })

    let productId: number

    if (existing) {
      await prisma.insuranceProduct.update({
        where: { id: existing.id },
        data: {
          name: product.name,
          categoryId,
          shortDesc: product.shortDesc,
          description: product.description,
          isFeatured: product.isFeatured || false,
        }
      })
      productId = existing.id
      console.log(`    Updated product: ${product.name}`)
    } else {
      const created = await prisma.insuranceProduct.create({
        data: {
          categoryId,
          insurerId,
          name: product.name,
          slug: product.slug,
          shortDesc: product.shortDesc,
          description: product.description,
          isFeatured: product.isFeatured || false,
        }
      })
      productId = created.id
      console.log(`    Created product: ${product.name} (ID: ${created.id})`)
    }

    // Delete existing plans and recreate
    await prisma.insurancePlan.deleteMany({ where: { productId } })

    for (const plan of product.plans) {
      await prisma.insurancePlan.create({
        data: {
          productId,
          name: plan.name,
          tier: plan.tier,
          description: plan.description || null,
          coverages: plan.coverages,
          monthlyPremium: plan.monthlyPremium || null,
          annualPremium: plan.annualPremium || null,
          minCoverage: plan.minCoverage || null,
          maxCoverage: plan.maxCoverage || null,
          deductible: plan.deductible || null,
          currency: plan.currency || 'DOP',
          isPopular: plan.isPopular || false,
          sortOrder: plan.sortOrder,
        }
      })
    }
    console.log(`      ${product.plans.length} plans created`)
  }

  console.log('\n✅ Insurance catalog seeded successfully!')
  await prisma.$disconnect()
}

seedCatalog()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
