'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { SupplierModal, type SupplierData } from '@/components/suppliers/supplier-modal'
import { SupplierDeleteModal } from '@/components/suppliers/supplier-delete-modal'
import {
  Truck,
  Plus,
  Search,
  Pencil,
  Trash2,
  Star,
  Phone,
  Mail,
  MapPin,
  User,
  Building2,
  FileText,
  Boxes,
  ClipboardList,
  Loader2,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface SupplierItem extends SupplierData {
  id: string
  createdAt: string
  updatedAt: string
  _count?: {
    parts: number
    workOrders: number
  }
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierItem | null>(null)

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (categoryFilter !== 'ALL') query.set('category', categoryFilter)
      if (statusFilter !== 'ALL') query.set('status', statusFilter)
      if (search.trim()) query.set('search', search.trim())

      const res = await fetch(`/api/suppliers?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSuppliers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [categoryFilter, statusFilter, search])

  // Statistics calculation
  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter((s) => s.status === 'ACTIVE').length
  const inactiveSuppliers = suppliers.filter((s) => s.status === 'INACTIVE').length
  const avgRating =
    suppliers.length > 0
      ? (
          suppliers.reduce((acc, curr) => acc + (curr.rating || 0), 0) / suppliers.length
        ).toFixed(1)
      : '0.0'

  const categories = [
    'Repuestos Mecánicos',
    'Automatización/Electricidad',
    'Mecanizado/Tornería',
    'Servicios Generales',
    'Neumática e Hidráulica',
    'Consumibles Industriales',
  ]

  return (
    <div className="flex-1 space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5 min-w-0">
            <Truck className="h-7 w-7 text-primary shrink-0" />
            <span className="truncate">Proveedores & Contratistas</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestión de proveedores de repuestos, insumos y contratistas de servicios mecánicos/eléctricos
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedSupplier(null)
            setIsModalOpen(true)
          }}
          className="w-full sm:w-auto shadow-md shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Proveedor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 w-full">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Proveedores</p>
              <p className="text-2xl font-bold">{totalSuppliers}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Proveedores Activos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeSuppliers}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Inactivos</p>
              <p className="text-2xl font-bold text-muted-foreground">{inactiveSuppliers}</p>
            </div>
            <div className="p-3 bg-muted rounded-xl">
              <XCircle className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Calificación Promedio</p>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold">{avgRating}</p>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <Card className="shadow-sm w-full max-w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por proveedor, RIF, contacto o especialidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-56 flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:inline-block" />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs sm:text-sm"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs sm:text-sm"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Suppliers */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Cargando lista de proveedores...</span>
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="p-12 text-center space-y-3">
            <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-base font-semibold text-muted-foreground">
              No se encontraron proveedores
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Intenta cambiar los términos de búsqueda o registra un nuevo proveedor comercial o contratista externo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-full">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className={`w-full max-w-full overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between ${
                supplier.status === 'INACTIVE' ? 'opacity-70 border-dashed' : ''
              }`}
            >
              <CardContent className="p-3 sm:p-4 space-y-4 flex flex-col justify-between h-full min-w-0">
                <div className="space-y-3 min-w-0">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-bold text-base leading-tight truncate" title={supplier.name}>
                        {supplier.name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap min-w-0">
                        {supplier.taxId && (
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] shrink-0">
                            {supplier.taxId}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[11px] truncate max-w-full">
                          {supplier.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant={supplier.status === 'ACTIVE' ? 'success' : 'secondary'}
                        className="text-[11px] shrink-0"
                      >
                        {supplier.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  {/* Rating stars */}
                  <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 shrink-0 ${
                          star <= (supplier.rating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-semibold text-muted-foreground ml-1">
                      ({supplier.rating || 0}/5)
                    </span>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 text-xs text-muted-foreground min-w-0">
                    {supplier.contactName && (
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="truncate">{supplier.contactName}</span>
                      </div>
                    )}

                    {supplier.phone && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="truncate">{supplier.phone}</span>
                      </div>
                    )}

                    {supplier.email && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="truncate break-all">{supplier.email}</span>
                      </div>
                    )}

                    {supplier.address && (
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}

                    {supplier.notes && (
                      <div className="pt-2 text-[11px] italic line-clamp-2 text-muted-foreground/90 break-words">
                        "{supplier.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Counters and Action buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1" title="Repuestos vinculados">
                      <Boxes className="w-3.5 h-3.5 shrink-0" />
                      <strong className="text-foreground">{supplier._count?.parts || 0}</strong>
                    </span>
                    <span className="flex items-center gap-1" title="Órdenes de trabajo de servicio externo">
                      <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                      <strong className="text-foreground">{supplier._count?.workOrders || 0}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                      onClick={() => {
                        setSelectedSupplier(supplier)
                        setIsModalOpen(true)
                      }}
                      title="Editar Proveedor"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      onClick={() => {
                        setSupplierToDelete(supplier)
                        setIsDeleteModalOpen(true)
                      }}
                      title="Eliminar Proveedor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        supplier={selectedSupplier}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchSuppliers()
        }}
      />

      {/* Delete Confirmation Modal */}
      <SupplierDeleteModal
        isOpen={isDeleteModalOpen}
        supplier={supplierToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          fetchSuppliers()
        }}
      />
    </div>
  )
}
