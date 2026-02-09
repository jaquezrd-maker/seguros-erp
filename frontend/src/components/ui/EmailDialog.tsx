import { useState } from "react"
import Modal from "./Modal"
import { Mail, FileText } from "lucide-react"

interface EmailDialogProps {
  isOpen: boolean
  onClose: () => void
  onSend: (recipients: string[], includeAttachment: boolean) => Promise<void>
  recipientOptions: {
    value: string
    label: string
    description?: string
  }[]
  title?: string
  attachmentLabel?: string
}

export default function EmailDialog({
  isOpen,
  onClose,
  onSend,
  recipientOptions,
  title = "Enviar Email",
  attachmentLabel = "Adjuntar PDF",
}: EmailDialogProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [includeAttachment, setIncludeAttachment] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const toggleRecipient = (value: string) => {
    if (selectedRecipients.includes(value)) {
      setSelectedRecipients(selectedRecipients.filter((r) => r !== value))
    } else {
      setSelectedRecipients([...selectedRecipients, value])
    }
  }

  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      setError("Seleccione al menos un destinatario")
      return
    }

    setError("")
    setSuccess("")
    setSending(true)

    try {
      await onSend(selectedRecipients, includeAttachment)
      setSuccess("Email enviado exitosamente")
      setTimeout(() => {
        onClose()
        setSelectedRecipients([])
        setIncludeAttachment(true)
        setSuccess("")
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Error al enviar email")
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (!sending) {
      onClose()
      setSelectedRecipients([])
      setIncludeAttachment(true)
      setError("")
      setSuccess("")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-4">
        {/* Recipients Section */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Destinatarios
          </h4>
          <div className="space-y-2">
            {recipientOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-teal-500/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(option.value)}
                  onChange={() => toggleRecipient(option.value)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-500 bg-slate-600 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-slate-400 mt-0.5">{option.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Attachment Section */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Adjunto
          </h4>
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-teal-500/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeAttachment}
              onChange={(e) => setIncludeAttachment(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-500 bg-slate-600 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{attachmentLabel}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Incluir documento PDF como adjunto en el email
              </div>
            </div>
          </label>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl p-3 text-sm">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={sending}
            className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedRecipients.length === 0}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Enviar Email
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
