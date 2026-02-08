import { useState, useEffect } from "react"
import { Car, User, Home, Heart, FileText } from "lucide-react"
import FormInput from "../../components/ui/FormInput"
import type { BeneficiaryData } from "../../types"

interface BeneficiaryFormProps {
  insuranceTypeName: string
  value: BeneficiaryData | null
  onChange: (data: BeneficiaryData | null) => void
}

export default function BeneficiaryForm({ insuranceTypeName, value, onChange }: BeneficiaryFormProps) {
  const [beneficiaryType, setBeneficiaryType] = useState<string>("")
  const [formData, setFormData] = useState<BeneficiaryData>(value || {} as BeneficiaryData)

  useEffect(() => {
    // Auto-detectar tipo de beneficiario basado en el nombre del tipo de seguro
    const typeLower = insuranceTypeName.toLowerCase()
    if (typeLower.includes("auto") || typeLower.includes("vehiculo") || typeLower.includes("vehículo")) {
      setBeneficiaryType("vehicle")
      setFormData(prev => ({ ...prev, type: "vehicle" }))
    } else if (typeLower.includes("vida") || typeLower.includes("persona")) {
      setBeneficiaryType("person")
      setFormData(prev => ({ ...prev, type: "person" }))
    } else if (typeLower.includes("propiedad") || typeLower.includes("inmueble") || typeLower.includes("hogar")) {
      setBeneficiaryType("property")
      setFormData(prev => ({ ...prev, type: "property" }))
    } else if (typeLower.includes("salud") || typeLower.includes("médico") || typeLower.includes("medico")) {
      setBeneficiaryType("health")
      setFormData(prev => ({ ...prev, type: "health" }))
    } else {
      setBeneficiaryType("other")
      setFormData(prev => ({ ...prev, type: "other" }))
    }
  }, [insuranceTypeName])

  useEffect(() => {
    onChange(formData)
  }, [formData])

  const updateField = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  const renderVehicleForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Car className="text-teal-400" size={20} />
        <h4 className="text-sm font-semibold text-white">Datos del Vehículo</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Marca"
          value={formData.vehicleMake || ""}
          onChange={v => updateField("vehicleMake", v)}
          placeholder="Toyota, Honda, etc."
        />
        <FormInput
          label="Modelo"
          value={formData.vehicleModel || ""}
          onChange={v => updateField("vehicleModel", v)}
          placeholder="Corolla, Civic, etc."
        />
        <FormInput
          label="Año"
          type="number"
          value={formData.vehicleYear || ""}
          onChange={v => updateField("vehicleYear", Number(v))}
          placeholder="2024"
        />
        <FormInput
          label="Placa"
          value={formData.vehiclePlate || ""}
          onChange={v => updateField("vehiclePlate", v)}
          placeholder="A123456"
        />
        <FormInput
          label="Chasis"
          value={formData.vehicleChasis || ""}
          onChange={v => updateField("vehicleChasis", v)}
          placeholder="No. de chasis"
        />
        <FormInput
          label="Color"
          value={formData.vehicleColor || ""}
          onChange={v => updateField("vehicleColor", v)}
          placeholder="Blanco, Negro, etc."
        />
        <FormInput
          label="Valor del Vehículo (DOP)"
          type="number"
          value={formData.vehicleValue || ""}
          onChange={v => updateField("vehicleValue", Number(v))}
          placeholder="1500000"
        />
      </div>
    </div>
  )

  const renderPersonForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <User className="text-teal-400" size={20} />
        <h4 className="text-sm font-semibold text-white">Datos del Beneficiario</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Nombre Completo"
          value={formData.personName || ""}
          onChange={v => updateField("personName", v)}
          placeholder="Juan Pérez"
          required
        />
        <FormInput
          label="Cédula/Pasaporte"
          value={formData.personCedula || ""}
          onChange={v => updateField("personCedula", v)}
          placeholder="001-1234567-8"
        />
        <FormInput
          label="Fecha de Nacimiento"
          type="date"
          value={formData.personBirthDate || ""}
          onChange={v => updateField("personBirthDate", v)}
        />
        <FormInput
          label="Parentesco"
          type="select"
          value={formData.personRelationship || ""}
          onChange={v => updateField("personRelationship", v)}
          options={["Cónyuge", "Hijo/a", "Padre/Madre", "Hermano/a", "Otro"]}
        />
        <FormInput
          label="Teléfono"
          value={formData.personPhone || ""}
          onChange={v => updateField("personPhone", v)}
          placeholder="(809) 555-1234"
        />
      </div>
    </div>
  )

  const renderPropertyForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Home className="text-teal-400" size={20} />
        <h4 className="text-sm font-semibold text-white">Datos de la Propiedad</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <FormInput
            label="Dirección de la Propiedad"
            value={formData.propertyAddress || ""}
            onChange={v => updateField("propertyAddress", v)}
            placeholder="Calle, número, sector, ciudad"
            required
          />
        </div>
        <FormInput
          label="Tipo de Propiedad"
          type="select"
          value={formData.propertyType || ""}
          onChange={v => updateField("propertyType", v)}
          options={["Casa", "Apartamento", "Local Comercial", "Edificio", "Terreno", "Otro"]}
        />
        <FormInput
          label="Valor de la Propiedad (DOP)"
          type="number"
          value={formData.propertyValue || ""}
          onChange={v => updateField("propertyValue", Number(v))}
          placeholder="5000000"
        />
        <div className="md:col-span-2">
          <FormInput
            label="Descripción"
            type="textarea"
            value={formData.propertyDescription || ""}
            onChange={v => updateField("propertyDescription", v)}
            placeholder="Detalles adicionales sobre la propiedad..."
          />
        </div>
      </div>
    </div>
  )

  const renderHealthForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="text-teal-400" size={20} />
        <h4 className="text-sm font-semibold text-white">Datos de Salud</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Nombre del Asegurado"
          value={formData.personName || ""}
          onChange={v => updateField("personName", v)}
          placeholder="Nombre completo"
          required
        />
        <FormInput
          label="Fecha de Nacimiento"
          type="date"
          value={formData.personBirthDate || ""}
          onChange={v => updateField("personBirthDate", v)}
        />
        <div className="md:col-span-2">
          <FormInput
            label="Condiciones Médicas Preexistentes"
            type="textarea"
            value={formData.healthConditions || ""}
            onChange={v => updateField("healthConditions", v)}
            placeholder="Diabetes, hipertensión, alergias, etc."
          />
        </div>
      </div>
    </div>
  )

  const renderOtherForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="text-teal-400" size={20} />
        <h4 className="text-sm font-semibold text-white">Información del Beneficiario</h4>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <FormInput
          label="Descripción del Bien Asegurado"
          type="textarea"
          value={formData.propertyDescription || ""}
          onChange={v => updateField("propertyDescription", v)}
          placeholder="Describa el bien o servicio asegurado..."
        />
      </div>
    </div>
  )

  if (!insuranceTypeName) {
    return null
  }

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
      {beneficiaryType === "vehicle" && renderVehicleForm()}
      {beneficiaryType === "person" && renderPersonForm()}
      {beneficiaryType === "property" && renderPropertyForm()}
      {beneficiaryType === "health" && renderHealthForm()}
      {beneficiaryType === "other" && renderOtherForm()}
    </div>
  )
}
