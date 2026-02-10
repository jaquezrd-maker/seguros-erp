import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client'
import type { PaginatedResponse, ApiResponse } from '../types'

type ModalMode = 'closed' | 'view' | 'create' | 'edit'

interface UseCrudModuleOptions<T> {
  endpoint: string
  defaultForm?: Record<string, any>
  searchParam?: string
}

export default function useCrudModule<T extends { id: number }>({ endpoint, defaultForm = {}, searchParam = 'search' }: UseCrudModuleOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<Record<string, any>>({})
  const [modal, setModal] = useState<ModalMode>('closed')
  const [selected, setSelected] = useState<T | null>(null)
  const [form, setForm] = useState<Record<string, any>>(defaultForm)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchItems = useCallback(async (searchVal?: string, pageVal?: number) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      const s = searchVal ?? search
      const p = pageVal ?? page
      if (s) params.set(searchParam, s)
      params.set('page', String(p))
      params.set('limit', '20')
      const qs = params.toString()
      // Check if endpoint already has query params
      const separator = endpoint.includes('?') ? '&' : '?'
      const res = await api.get<PaginatedResponse<T>>(`${endpoint}${separator}${qs}`)
      setItems(res.data)
      setTotal(res.pagination?.total ?? res.data.length)
      if (res.summary) setSummary(res.summary)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [endpoint, search, page, searchParam])

  useEffect(() => {
    fetchItems()
  }, [page])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchItems(search, 1)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const openNew = () => { setForm({ ...defaultForm }); setSelected(null); setModal('create') }
  const openEdit = (item: T) => { setForm({ ...item }); setSelected(item); setModal('edit') }
  const openView = (item: T) => { setSelected(item); setModal('view') }
  const closeModal = () => { setModal('closed'); setSelected(null); setError('') }
  const askDelete = (item: T) => setDeleteTarget(item)
  const cancelDelete = () => setDeleteTarget(null)

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const createItem = async (data?: Record<string, any>) => {
    setSaving(true)
    setError('')
    try {
      await api.post<ApiResponse<T>>(endpoint, data || form)
      closeModal()
      fetchItems()
    } catch (err: any) {
      setError(err.message || 'Error al crear')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const updateItem = async (id: number, data?: Record<string, any>) => {
    setSaving(true)
    setError('')
    try {
      await api.put<ApiResponse<T>>(`${endpoint}/${id}`, data || form)
      closeModal()
      fetchItems()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (permanent: boolean = false) => {
    if (!deleteTarget) return
    setSaving(true)
    setError('')
    try {
      const url = `${endpoint}/${deleteTarget.id}${permanent ? '?permanent=true' : ''}`
      const response = await api.delete<ApiResponse<T>>(url)
      setDeleteTarget(null)
      setSuccess(response.message || 'Operación exitosa')
      // Auto-clear success message after 5 seconds
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = setTimeout(() => setSuccess(''), 5000)
      fetchItems()
    } catch (err: any) {
      setDeleteTarget(null)
      setError(err.message || 'Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  const patchItem = async (id: number, path: string, data: Record<string, any>) => {
    setSaving(true)
    try {
      await api.patch(`${endpoint}/${id}/${path}`, data)
      fetchItems()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  return {
    items, loading, saving, error, success, search, setSearch, page, setPage, total, summary,
    modal, selected, form, setForm, deleteTarget,
    openNew, openEdit, openView, closeModal,
    askDelete, cancelDelete,
    updateField, createItem, updateItem, deleteItem, patchItem,
    fetchItems, setError, setSuccess,
  }
}
