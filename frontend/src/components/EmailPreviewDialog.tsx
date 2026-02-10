import { useState, useEffect } from "react"
import Modal from "./ui/Modal"
import api from "../api/client"

interface EmailPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  previewEndpoint: string // e.g., "/policies/123/email/preview"
  sendEndpoint: string // e.g., "/policies/123/email"
  title?: string
}

interface EmailPreview {
  recipients: string[]
  subject: string
  html: string
  hasAttachment: boolean
  policyNumber?: string
}

export default function EmailPreviewDialog({
  isOpen,
  onClose,
  previewEndpoint,
  sendEndpoint,
  title = "Preview y Envío de Email"
}: EmailPreviewDialogProps) {
  const [step, setStep] = useState<'config' | 'preview' | 'sending'>('config')
  const [recipients, setRecipients] = useState<string[]>(['client'])
  const [includeAttachment, setIncludeAttachment] = useState(false)
  const [preview, setPreview] = useState<EmailPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Editable fields
  const [editedSubject, setEditedSubject] = useState("")
  const [editedHtml, setEditedHtml] = useState("")
  const [isEditingHtml, setIsEditingHtml] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setStep('config')
      setRecipients(['client'])
      setIncludeAttachment(false)
      setPreview(null)
      setError("")
      setSuccess("")
      setEditedSubject("")
      setEditedHtml("")
      setIsEditingHtml(false)
    }
  }, [isOpen])

  const handleLoadPreview = async () => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams({
        recipients: recipients.join(','),
        includeAttachment: includeAttachment.toString()
      })

      const response = await api.get<{ success: boolean; data: EmailPreview }>(
        `${previewEndpoint}?${params.toString()}`
      )

      if (response.success && response.data) {
        setPreview(response.data)
        setEditedSubject(response.data.subject)
        setEditedHtml(response.data.html)
        setStep('preview')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar preview")
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    try {
      setLoading(true)
      setError("")
      setStep('sending')

      const payload: any = {
        recipients,
        includeAttachment
      }

      // Only send custom fields if they were edited
      if (editedSubject !== preview?.subject) {
        payload.customSubject = editedSubject
      }
      if (editedHtml !== preview?.html) {
        payload.customHtml = editedHtml
      }

      const response = await api.post<{ success: boolean; message: string }>(
        sendEndpoint,
        payload
      )

      if (response.success) {
        setSuccess(response.message || "Email enviado exitosamente")
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al enviar email")
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="large">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Step 1: Configuration */}
      {step === 'config' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Destinatarios
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={recipients.includes('client')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRecipients([...recipients, 'client'])
                    } else {
                      setRecipients(recipients.filter(r => r !== 'client'))
                    }
                  }}
                  className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Cliente</span>
              </label>
              <label className="flex items-center space-x-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={recipients.includes('internal')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRecipients([...recipients, 'internal'])
                    } else {
                      setRecipients(recipients.filter(r => r !== 'internal'))
                    }
                  }}
                  className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Interno</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-slate-300">
              <input
                type="checkbox"
                checked={includeAttachment}
                onChange={(e) => setIncludeAttachment(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Incluir PDF adjunto</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleLoadPreview}
              disabled={loading || recipients.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Cargando..." : "Ver Preview"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview & Edit */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
            <p className="text-slate-400">
              <span className="font-semibold">Para:</span>{" "}
              <span className="text-slate-300">{preview.recipients.join(', ')}</span>
            </p>
            {preview.hasAttachment && (
              <p className="text-slate-400 mt-1">
                <span className="font-semibold">Adjunto:</span> PDF incluido
              </p>
            )}
          </div>

          {/* Subject (editable) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Asunto
            </label>
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* HTML Preview/Edit */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Contenido del Email
              </label>
              <button
                onClick={() => setIsEditingHtml(!isEditingHtml)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {isEditingHtml ? "Ver Preview" : "Editar HTML"}
              </button>
            </div>

            {isEditingHtml ? (
              <textarea
                value={editedHtml}
                onChange={(e) => setEditedHtml(e.target.value)}
                rows={15}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="border border-slate-600 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={editedHtml}
                  className="w-full h-96 bg-white"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between space-x-3 pt-4">
            <button
              onClick={() => setStep('config')}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
            >
              Volver
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm transition-colors"
              >
                Enviar Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Sending */}
      {step === 'sending' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Enviando email...</p>
        </div>
      )}
    </Modal>
  )
}
