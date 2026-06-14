'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, CreditCard, FileText, FileSpreadsheet, Key, Monitor, Fuel,
  Plus, Search, ChevronRight, X, Printer, Download, Copy,
  CheckCircle2, AlertCircle, Loader2, Building2, Mail, Phone,
  MapPin, Globe, Calendar, DollarSign, Eye, Edit, Trash2,
  MoreHorizontal, ArrowRight, Shield, Zap, Crown, Star, Cpu, Droplets,
  Hash, Link2, Clock, Send, CheckCircle, XCircle, RefreshCw,
  Database, Server, HardDrive, Activity, ChevronDown, ExternalLink,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// ── Types ──────────────────────────────────────────────

type OwnerTab = 'clients' | 'subscriptions' | 'invoices' | 'quotations' | 'license-keys' | 'devices' | 'tenants'

interface Client {
  id: string; companyName: string; slug: string; contactPerson: string; email: string
  phone: string; address?: string; city?: string; state?: string; country: string
  postalCode?: string; website?: string; taxId?: string; registrationNumber?: string
  logo?: string; industry?: string; notes?: string; status: string
  onboardedAt: string; createdAt: string
  databaseUrl?: string; databaseName?: string; databaseStatus?: string
  _count?: { subscriptions: number; invoices: number; devices: number; licenseKeys: number }
  tenantDatabase?: TenantDatabaseInfo
}

interface TenantDatabaseInfo {
  id: string; databaseName: string; status: string; totalSize?: string
  tableCount: number; activatedAt?: string; lastMigratedAt?: string; schemaVersion?: string
}

interface Plan {
  id: string; name: string; slug: string; description?: string; priceMonthly: number
  priceAnnual: number; currency: string; maxStations: number; maxDispensers: number
  maxUsers: number; maxDevices: number; features: string; isPopular: boolean
  _count?: { subscriptions: number; licenseKeys: number }
}

interface Subscription {
  id: string; clientId: string; planId: string; status: string; billingCycle: string
  startDate: string; endDate?: string; autoRenew: boolean; notes?: string
  client?: Client; plan?: Plan
}

interface InvoiceItem { id: string; description: string; quantity: number; unitPrice: number; amount: number }
interface InvoicePayment { id: string; amount: number; method: string; reference?: string; paidAt: string }

interface Invoice {
  id: string; invoiceNumber: string; clientId: string; status: string
  issueDate: string; dueDate: string; paidDate?: string; subtotal: number
  taxRate: number; taxAmount: number; discountRate: number; discountAmount: number
  total: number; paidAmount: number; balanceDue: number; currency: string
  notes?: string; terms?: string; items: InvoiceItem[]; payments: InvoicePayment[]
  client?: Client; subscriptionId?: string
}

interface QuotationItem { id: string; description: string; quantity: number; unitPrice: number; amount: number }

interface Quotation {
  id: string; quotationNumber: string; clientId?: string; clientName: string
  clientEmail?: string; clientPhone?: string; clientAddress?: string
  status: string; issueDate: string; validUntil: string
  subtotal: number; taxRate: number; taxAmount: number; discountRate: number
  discountAmount: number; total: number; currency: string
  notes?: string; terms?: string; internalNotes?: string
  items: QuotationItem[]; client?: Client
}

interface LicenseKey {
  id: string; key: string; clientId?: string; planId?: string; status: string
  maxStations: number; maxDispensers: number; maxUsers: number
  assignedAt?: string; revokedAt?: string; expiresAt?: string; notes?: string
  client?: Client; plan?: Plan
}

interface ClientDevice {
  id: string; clientId: string; deviceName: string; deviceType: string
  serialNumber?: string; macAddress?: string; ipAddress?: string
  location?: string; status: string; activatedAt: string; lastSeenAt?: string; notes?: string
  client?: Client
}

// ── Helpers ────────────────────────────────────────────

const formatPKR = (n: number) => `PKR ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })

const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
  trial: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  churned: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  past_due: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  sent: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  partial: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  converted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  available: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  assigned: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  revoked: 'bg-red-500/10 text-red-500 border-red-500/20',
  maintenance: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  pending: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  provisioning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  provisioning_schema: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  deleted: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const deviceTypeIcon: Record<string, React.ElementType> = {
  pos: Monitor, dispenser_controller: Cpu, atg: Droplets,
  payment_terminal: CreditCard, scanner: Search, other: MoreHorizontal,
}

// ── Sub-Components ─────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusColor[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className="macos-card p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${accent ? 'text-teal-500' : 'text-muted-foreground'}`} />
      </div>
      <p className={`text-[22px] font-bold leading-tight ${accent ? 'fuel-text-gradient' : ''}`}>{value}</p>
    </div>
  )
}

// ── Professional Invoice/Quotation Print Layout ─────────

function PrintDocument({ type, data }: { type: 'invoice' | 'quotation'; data: Invoice | Quotation }) {
  const isInvoice = type === 'invoice'
  const inv = isInvoice ? data as Invoice : null
  const quote = !isInvoice ? data as Quotation : null
  const items = data.items
  const companyName = data.client?.companyName || (quote?.clientName) || ''
  const clientEmail = data.client?.email || quote?.clientEmail || ''
  const clientPhone = data.client?.phone || quote?.clientPhone || ''
  const clientAddress = data.client?.address || quote?.clientAddress || ''

  return (
    <div id="print-area" className="bg-white text-black p-10 max-w-[800px] mx-auto" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e8930c, #ea580c)' }}>
              <Fuel className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ApexFlow Ecosystem</h1>
              <p className="text-xs text-gray-500">Enterprise Fuel Station Solutions</p>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 mt-2 leading-relaxed">
            <p>Office 1207, Business Avenue Tower</p>
            <p>Block 9, Clifton, Karachi 75600, Pakistan</p>
            <p>Tax ID: NTN-4021948-6 | STR: 3210-948-1234</p>
            <p>info@apexflow.io | +92-21-3589-1234</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#e8930c' }}>
            {isInvoice ? 'INVOICE' : 'QUOTATION'}
          </h2>
          <div className="text-[12px] text-gray-600 space-y-0.5">
            <p><span className="font-semibold">{isInvoice ? 'Invoice' : 'Quotation'} #:</span> {isInvoice ? inv?.invoiceNumber : quote?.quotationNumber}</p>
            <p><span className="font-semibold">Date:</span> {formatDate(data.issueDate)}</p>
            {isInvoice ? (
              <p><span className="font-semibold">Due Date:</span> {formatDate(inv!.dueDate)}</p>
            ) : (
              <p><span className="font-semibold">Valid Until:</span> {formatDate(quote!.validUntil)}</p>
            )}
            <div className="mt-1">
              <StatusBadge status={data.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-[10px] font-semibold uppercase text-gray-400 mb-1.5">{isInvoice ? 'Bill To' : 'Quote To'}</p>
        <p className="text-[14px] font-bold text-gray-900">{companyName}</p>
        {clientAddress && <p className="text-[12px] text-gray-600">{clientAddress}</p>}
        <div className="text-[12px] text-gray-500 space-x-4 mt-1">
          {clientEmail && <span>{clientEmail}</span>}
          {clientPhone && <span>{clientPhone}</span>}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 text-[12px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e8930c' }}>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-700">#</th>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Description</th>
            <th className="text-center py-2.5 px-3 font-semibold text-gray-700">Qty</th>
            <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Unit Price</th>
            <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
              <td className="py-2.5 px-3 text-gray-900">{item.description}</td>
              <td className="py-2.5 px-3 text-center text-gray-700">{item.quantity}</td>
              <td className="py-2.5 px-3 text-right text-gray-700">{formatPKR(item.unitPrice)}</td>
              <td className="py-2.5 px-3 text-right font-medium text-gray-900">{formatPKR(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-[300px]">
          <div className="flex justify-between py-1.5 text-[12px]">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900">{formatPKR(data.subtotal)}</span>
          </div>
          {data.discountAmount > 0 && (
            <div className="flex justify-between py-1.5 text-[12px]">
              <span className="text-gray-500">Discount ({data.discountRate}%)</span>
              <span className="text-red-500">-{formatPKR(data.discountAmount)}</span>
            </div>
          )}
          {data.taxAmount > 0 && (
            <div className="flex justify-between py-1.5 text-[12px]">
              <span className="text-gray-500">Tax ({data.taxRate}%)</span>
              <span className="text-gray-700">{formatPKR(data.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 text-[14px] font-bold mt-1" style={{ borderTop: '2px solid #e8930c' }}>
            <span>Total</span>
            <span style={{ color: '#e8930c' }}>{formatPKR(data.total)}</span>
          </div>
          {isInvoice && inv && inv.balanceDue > 0 && (
            <div className="flex justify-between py-1.5 text-[12px] bg-red-50 -mx-3 px-3 rounded">
              <span className="text-red-600 font-semibold">Balance Due</span>
              <span className="text-red-600 font-bold">{formatPKR(inv.balanceDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bank Details (invoice only) */}
      {isInvoice && inv && inv.balanceDue > 0 && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-[10px] font-semibold uppercase text-teal-600 mb-2">Bank Payment Details</p>
          <div className="grid grid-cols-2 gap-x-8 text-[11px]">
            <div><span className="text-gray-500">Bank:</span> <span className="font-medium text-gray-800">HBL — Habib Bank Limited</span></div>
            <div><span className="text-gray-500">Account Name:</span> <span className="font-medium text-gray-800">ApexFlow Technologies (Pvt) Ltd</span></div>
            <div><span className="text-gray-500">Account #:</span> <span className="font-medium text-gray-800">0022-7901-001234-01</span></div>
            <div><span className="text-gray-500">IBAN:</span> <span className="font-medium text-gray-800">PK36HABB0022790100123401</span></div>
            <div><span className="text-gray-500">Branch:</span> <span className="font-medium text-gray-800">Clifton, Karachi</span></div>
            <div><span className="text-gray-500">Swift Code:</span> <span className="font-medium text-gray-800">HABBPKKA</span></div>
          </div>
        </div>
      )}

      {/* Payments (invoice only) */}
      {isInvoice && inv && inv.payments && inv.payments.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Payments Received</p>
          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Date</th>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Method</th>
                <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Reference</th>
                <th className="text-right py-1.5 px-2 font-semibold text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td className="py-1.5 px-2 text-gray-600">{formatDate(p.paidAt)}</td>
                  <td className="py-1.5 px-2 text-gray-600 capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="py-1.5 px-2 text-gray-600">{p.reference || '--'}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-emerald-600">{formatPKR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes & Terms */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {data.notes && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Notes</p>
            <p className="text-[12px] text-gray-600">{data.notes}</p>
          </div>
        )}
        {data.terms && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Terms & Conditions</p>
            <p className="text-[12px] text-gray-600">{data.terms}</p>
          </div>
        )}
      </div>

      {/* Quotation signature line */}
      {!isInvoice && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Authorized By</p>
              <div className="w-48 border-b border-gray-300 mb-1" />
              <p className="text-[11px] text-gray-500">ApexFlow Ecosystem</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Accepted By</p>
              <div className="w-48 border-b border-gray-300 mb-1" />
              <p className="text-[11px] text-gray-500">{companyName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-[11px] text-gray-400">ApexFlow Ecosystem -- FuelFlow OS &copy; {new Date().getFullYear()}</p>
        <p className="text-[10px] text-gray-300">Registered Office: Business Avenue Tower, Clifton, Karachi, Pakistan | NTN: 4021948-6 | SECP: 0012345</p>
      </div>
    </div>
  )
}

// ── Tenant Databases Management Tab ──────────────────────

function TenantDatabasesTab({ clients, onRefresh }: { clients: Client[]; onRefresh: () => void }) {
  const [provisioning, setProvisioning] = useState<string | null>(null)
  const [dropping, setDropping] = useState<string | null>(null)
  const [migrating, setMigrating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleProvision = async (clientId: string, companyName: string) => {
    setProvisioning(clientId)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/owner/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Provisioning failed')
      } else {
        setSuccess(`Database for ${companyName} provisioned successfully (${data.tablesCreated || 0} tables created)`)
        onRefresh()
      }
    } catch {
      setError('Network error during provisioning')
    } finally {
      setProvisioning(null)
    }
  }

  const handleDrop = async (clientId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to DROP the database for ${companyName}? This action is irreversible and will delete ALL data.`)) return
    setDropping(clientId)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/owner/tenants?clientId=${clientId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to drop database')
      } else {
        setSuccess(`Database for ${companyName} dropped successfully`)
        onRefresh()
      }
    } catch {
      setError('Network error during drop')
    } finally {
      setDropping(null)
    }
  }

  const handleMigrate = async (clientId: string, companyName: string) => {
    setMigrating(clientId)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/owner/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, force: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Migration failed')
      } else {
        setSuccess(`Schema migration for ${companyName} completed`)
        onRefresh()
      }
    } catch {
      setError('Network error during migration')
    } finally {
      setMigrating(null)
    }
  }

  const activeClients = clients.filter(c => c.status === 'active' || c.status === 'trial')
  const withDb = clients.filter(c => c.databaseStatus === 'active')
  const pendingDb = clients.filter(c => c.databaseStatus === 'pending' || c.databaseStatus === 'error')
  const provisioningDb = clients.filter(c => c.databaseStatus === 'provisioning' || c.databaseStatus === 'provisioning_schema')

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Clients" value={String(activeClients.length)} icon={Users} accent />
        <StatCard label="With Database" value={String(withDb.length)} icon={Database} />
        <StatCard label="Pending Setup" value={String(pendingDb.length)} icon={Clock} />
        <StatCard label="Provisioning" value={String(provisioningDb.length)} icon={Loader2} />
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2.5 rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-2.5">
            <AlertCircle className="size-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className="size-3.5 text-red-400" /></button>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-2.5">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <p className="text-[12px] text-emerald-600 dark:text-emerald-400">{success}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto"><X className="size-3.5 text-emerald-400" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Architecture Info */}
      <div className="macos-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-9 rounded-xl flex items-center justify-center bg-teal-500/10">
            <Server className="size-4.5 text-teal-500" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold">Multi-Tenant Database Architecture</h3>
            <p className="text-[11px] text-muted-foreground">Neon PostgreSQL -- Each client operates in a fully isolated database</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-black/[0.02] dark:bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Database className="size-3.5 text-teal-500" />
              <span className="text-[11px] font-semibold">Platform DB</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Owner data, clients, billing, licensing -- shared platform database</p>
            <code className="text-[9px] text-muted-foreground/70 mt-1 block truncate">neondb (Neon PostgreSQL)</code>
          </div>
          <div className="rounded-lg border border-border bg-black/[0.02] dark:bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <HardDrive className="size-3.5 text-emerald-500" />
              <span className="text-[11px] font-semibold">Tenant DBs</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Per-client isolated databases with full ERP schema for data separation</p>
            <code className="text-[9px] text-muted-foreground/70 mt-1 block truncate">ff_&lt;slug&gt;_&lt;id&gt; (Neon PostgreSQL)</code>
          </div>
          <div className="rounded-lg border border-border bg-black/[0.02] dark:bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity className="size-3.5 text-blue-500" />
              <span className="text-[11px] font-semibold">Connection Pool</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Neon pooler for efficient connection management with auto-scaling</p>
            <code className="text-[9px] text-muted-foreground/70 mt-1 block truncate">ep-*-pooler.neon.tech</code>
          </div>
        </div>
      </div>

      {/* Client Database List */}
      <div className="macos-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-[13px] font-semibold">Client Databases</h3>
          <button onClick={onRefresh} className="macos-btn-secondary text-[11px] flex items-center gap-1.5">
            <RefreshCw className="size-3" /> Refresh
          </button>
        </div>
        <div className="divide-y divide-border">
          {clients.map(client => {
            const dbStatus = client.databaseStatus || 'pending'
            const isProvisioning = provisioning === client.id
            const isDropping = dropping === client.id
            const isMigrating = migrating === client.id
            const td = client.tenantDatabase

            return (
              <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                {/* Client Info */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="size-9 rounded-lg flex items-center justify-center bg-teal-500/10 shrink-0">
                    <Building2 className="size-4 text-teal-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate">{client.companyName}</p>
                    <p className="text-[11px] text-muted-foreground">{client.city || '--'}, {client.country}</p>
                  </div>
                </div>

                {/* Database Name */}
                <div className="min-w-[180px]">
                  {client.databaseName ? (
                    <code className="text-[11px] font-mono bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">{client.databaseName}</code>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Not provisioned</span>
                  )}
                </div>

                {/* Database Status */}
                <div className="min-w-[130px]">
                  <StatusBadge status={dbStatus} />
                </div>

                {/* Tenant DB Details */}
                {td && td.status === 'active' && (
                  <div className="flex-1 flex items-center gap-4 text-[11px] text-muted-foreground">
                    {td.totalSize && (
                      <div className="flex items-center gap-1"><HardDrive className="size-3" /><span>{td.totalSize}</span></div>
                    )}
                    {td.tableCount > 0 && (
                      <div className="flex items-center gap-1"><Hash className="size-3" /><span>{td.tableCount} tables</span></div>
                    )}
                    {td.schemaVersion && (
                      <div className="flex items-center gap-1"><Shield className="size-3" /><span>v{td.schemaVersion}</span></div>
                    )}
                  </div>
                )}

                {dbStatus === 'error' && (
                  <div className="flex-1"><p className="text-[11px] text-red-500">Provisioning error</p></div>
                )}

                {(!td || td.status !== 'active') && dbStatus !== 'error' && <div className="flex-1" />}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {dbStatus === 'pending' || dbStatus === 'error' ? (
                    <button onClick={() => handleProvision(client.id, client.companyName)} disabled={isProvisioning}
                      className="macos-btn text-[11px] flex items-center gap-1.5 disabled:opacity-50">
                      {isProvisioning ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                      {isProvisioning ? 'Provisioning...' : 'Provision DB'}
                    </button>
                  ) : dbStatus === 'active' ? (
                    <>
                      <button onClick={() => handleMigrate(client.id, client.companyName)} disabled={isMigrating}
                        className="macos-btn-secondary text-[11px] flex items-center gap-1.5 disabled:opacity-50">
                        {isMigrating ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                        Migrate
                      </button>
                      <button onClick={() => handleDrop(client.id, client.companyName)} disabled={isDropping}
                        className="macos-btn-secondary text-[11px] flex items-center gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/5 disabled:opacity-50">
                        {isDropping ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                        Drop
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="size-3 animate-spin" /> In progress...
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main OwnerModule ────────────────────────────────────

export default function OwnerModule() {
  const [activeTab, setActiveTab] = useState<OwnerTab>('clients')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null)
  const [showPrintView, setShowPrintView] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Dialog states
  const [showCreateClient, setShowCreateClient] = useState(false)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showCreateQuotation, setShowCreateQuotation] = useState(false)
  const [showGenerateKey, setShowGenerateKey] = useState(false)
  const [showRegisterDevice, setShowRegisterDevice] = useState(false)
  const [showClientDetail, setShowClientDetail] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [saving, setSaving] = useState(false)

  // Data state
  const [clients, setClients] = useState<Client[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([])
  const [devices, setDevices] = useState<ClientDevice[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [newClient, setNewClient] = useState({ companyName: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '', country: 'Pakistan', postalCode: '', website: '', taxId: '', industry: '', notes: '' })
  const [newInvoice, setNewInvoice] = useState({ clientId: '', subscriptionId: '', issueDate: '', dueDate: '', taxRate: 16, discountRate: 0, notes: '', terms: 'Payment due within 15 days of issue date.', items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }] })
  const [newQuotation, setNewQuotation] = useState({ clientId: '', clientName: '', clientEmail: '', clientPhone: '', clientAddress: '', issueDate: '', validUntil: '', taxRate: 16, discountRate: 0, notes: '', terms: 'Valid for 30 days from issue date.', items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }] })
  const [newKey, setNewKey] = useState({ planId: '', maxStations: 1, maxDispensers: 4, maxUsers: 5, notes: '' })
  const [newDevice, setNewDevice] = useState({ clientId: '', deviceName: '', deviceType: 'pos', serialNumber: '', macAddress: '', ipAddress: '', location: '', notes: '' })

  // Fetch data on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [clientsRes, plansRes, subsRes, invRes, quotRes, keysRes, devRes] = await Promise.allSettled([
          fetch('/api/owner/clients'), fetch('/api/owner/plans'), fetch('/api/owner/subscriptions'),
          fetch('/api/owner/invoices'), fetch('/api/owner/quotations'), fetch('/api/owner/license-keys'),
          fetch('/api/owner/devices'),
        ])
        if (cancelled) return
        if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) { const d = await clientsRes.value.json(); if (d.clients?.length) setClients(d.clients) }
        if (plansRes.status === 'fulfilled' && plansRes.value.ok) { const d = await plansRes.value.json(); if (d.length) setPlans(d) }
        if (subsRes.status === 'fulfilled' && subsRes.value.ok) { const d = await subsRes.value.json(); if (d.length) setSubscriptions(d) }
        if (invRes.status === 'fulfilled' && invRes.value.ok) { const d = await invRes.value.json(); if (d.invoices?.length) setInvoices(d.invoices) }
        if (quotRes.status === 'fulfilled' && quotRes.value.ok) { const d = await quotRes.value.json(); if (d.quotations?.length) setQuotations(d.quotations) }
        if (keysRes.status === 'fulfilled' && keysRes.value.ok) { const d = await keysRes.value.json(); if (d.length) setLicenseKeys(d) }
        if (devRes.status === 'fulfilled' && devRes.value.ok) { const d = await devRes.value.json(); if (d.length) setDevices(d) }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      const [clientsRes, plansRes, subsRes, invRes, quotRes, keysRes, devRes] = await Promise.allSettled([
        fetch('/api/owner/clients'), fetch('/api/owner/plans'), fetch('/api/owner/subscriptions'),
        fetch('/api/owner/invoices'), fetch('/api/owner/quotations'), fetch('/api/owner/license-keys'),
        fetch('/api/owner/devices'),
      ])
      if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) { const d = await clientsRes.value.json(); if (d.clients?.length) setClients(d.clients) }
      if (plansRes.status === 'fulfilled' && plansRes.value.ok) { const d = await plansRes.value.json(); if (d.length) setPlans(d) }
      if (subsRes.status === 'fulfilled' && subsRes.value.ok) { const d = await subsRes.value.json(); if (d.length) setSubscriptions(d) }
      if (invRes.status === 'fulfilled' && invRes.value.ok) { const d = await invRes.value.json(); if (d.invoices?.length) setInvoices(d.invoices) }
      if (quotRes.status === 'fulfilled' && quotRes.value.ok) { const d = await quotRes.value.json(); if (d.quotations?.length) setQuotations(d.quotations) }
      if (keysRes.status === 'fulfilled' && keysRes.value.ok) { const d = await keysRes.value.json(); if (d.length) setLicenseKeys(d) }
      if (devRes.status === 'fulfilled' && devRes.value.ok) { const d = await devRes.value.json(); if (d.length) setDevices(d) }
    } catch { /* ignore */ }
  }, [])

  // Seed data
  const handleSeed = async () => {
    try { await fetch('/api/owner/seed', { method: 'POST' }); refreshData() } catch { /* ignore */ }
  }

  // Print
  const handlePrint = () => {
    const printContents = document.getElementById('print-area')
    if (!printContents) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>${viewingInvoice ? 'Invoice' : 'Quotation'} -- FuelFlow OS</title>
      <style>
        * { font-style: normal !important; margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        @page { margin: 0.5in; size: A4; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${printContents.innerHTML}</body></html>
    `)
    printWindow.document.close()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 250)
  }

  // Copy key
  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Create client
  const handleCreateClient = async () => {
    if (!newClient.companyName || !newClient.contactPerson || !newClient.email || !newClient.phone) return
    setSaving(true)
    try {
      const res = await fetch('/api/owner/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      })
      if (res.ok) {
        setShowCreateClient(false)
        setNewClient({ companyName: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '', country: 'Pakistan', postalCode: '', website: '', taxId: '', industry: '', notes: '' })
        refreshData()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!newInvoice.clientId || !newInvoice.issueDate || !newInvoice.dueDate) return
    setSaving(true)
    try {
      const subtotal = newInvoice.items.reduce((s, i) => s + i.amount, 0)
      const taxAmount = subtotal * (newInvoice.taxRate / 100)
      const discountAmount = subtotal * (newInvoice.discountRate / 100)
      const total = subtotal + taxAmount - discountAmount
      const res = await fetch('/api/owner/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newInvoice, subtotal, taxAmount, total }),
      })
      if (res.ok) {
        setShowCreateInvoice(false)
        setNewInvoice({ clientId: '', subscriptionId: '', issueDate: '', dueDate: '', taxRate: 16, discountRate: 0, notes: '', terms: 'Payment due within 15 days of issue date.', items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }] })
        refreshData()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  // Create quotation
  const handleCreateQuotation = async () => {
    if (!newQuotation.clientName || !newQuotation.issueDate || !newQuotation.validUntil) return
    setSaving(true)
    try {
      const subtotal = newQuotation.items.reduce((s, i) => s + i.amount, 0)
      const taxAmount = subtotal * (newQuotation.taxRate / 100)
      const discountAmount = subtotal * (newQuotation.discountRate / 100)
      const total = subtotal + taxAmount - discountAmount
      const res = await fetch('/api/owner/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newQuotation, subtotal, taxAmount, total }),
      })
      if (res.ok) {
        setShowCreateQuotation(false)
        setNewQuotation({ clientId: '', clientName: '', clientEmail: '', clientPhone: '', clientAddress: '', issueDate: '', validUntil: '', taxRate: 16, discountRate: 0, notes: '', terms: 'Valid for 30 days from issue date.', items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }] })
        refreshData()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  // Generate license key
  const handleGenerateKey = async () => {
    if (!newKey.planId) return
    setSaving(true)
    try {
      const res = await fetch('/api/owner/license-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      })
      if (res.ok) {
        setShowGenerateKey(false)
        setNewKey({ planId: '', maxStations: 1, maxDispensers: 4, maxUsers: 5, notes: '' })
        refreshData()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  // Register device
  const handleRegisterDevice = async () => {
    if (!newDevice.clientId || !newDevice.deviceName) return
    setSaving(true)
    try {
      const res = await fetch('/api/owner/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice),
      })
      if (res.ok) {
        setShowRegisterDevice(false)
        setNewDevice({ clientId: '', deviceName: '', deviceType: 'pos', serialNumber: '', macAddress: '', ipAddress: '', location: '', notes: '' })
        refreshData()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  // Open client detail
  const openClientDetail = (client: Client) => {
    setSelectedClient(client)
    setShowClientDetail(true)
  }

  // Tab config
  const tabs: { key: OwnerTab; label: string; icon: React.ElementType }[] = [
    { key: 'clients', label: 'Clients', icon: Users },
    { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { key: 'invoices', label: 'Invoices', icon: FileText },
    { key: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
    { key: 'license-keys', label: 'License Keys', icon: Key },
    { key: 'devices', label: 'Devices', icon: Monitor },
    { key: 'tenants', label: 'Databases', icon: Database },
  ]

  // ── Render ──

  // Print view overlay
  if (showPrintView && (viewingInvoice || viewingQuotation)) {
    const doc = viewingInvoice || viewingQuotation!
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-3 flex items-center justify-between print:hidden">
          <h2 className="text-[13px] font-semibold">
            {viewingInvoice ? `Invoice ${viewingInvoice.invoiceNumber}` : `Quotation ${viewingQuotation?.quotationNumber}`}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="macos-btn flex items-center gap-2">
              <Printer className="size-4" /> Print
            </button>
            <button onClick={() => { setShowPrintView(false); setViewingInvoice(null); setViewingQuotation(null) }} className="macos-btn-secondary flex items-center gap-2">
              <X className="size-4" /> Close
            </button>
          </div>
        </div>
        <div className="py-8" ref={printRef}>
          <PrintDocument type={viewingInvoice ? 'invoice' : 'quotation'} data={doc} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">Owner Console</h2>
          <p className="text-[13px] text-muted-foreground">Manage clients, subscriptions, billing & licensing</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshData} className="macos-btn-secondary text-[12px] flex items-center gap-1.5">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
          <button onClick={handleSeed} className="macos-btn-secondary text-[12px] flex items-center gap-1.5">
            <Database className="size-3.5" /> Seed Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 text-teal-500 animate-spin" />
          <span className="ml-3 text-[13px] text-muted-foreground">Loading data from Neon PostgreSQL...</span>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>

            {/* ── CLIENTS TAB ── */}
            {activeTab === 'clients' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Clients" value={String(clients.length)} icon={Users} accent />
                  <StatCard label="Active" value={String(clients.filter(c => c.status === 'active').length)} icon={CheckCircle2} />
                  <StatCard label="Trial" value={String(clients.filter(c => c.status === 'trial').length)} icon={Clock} />
                  <StatCard label="Suspended" value={String(clients.filter(c => c.status === 'churned' || c.status === 'suspended').length)} icon={XCircle} />
                </div>

                <div className="macos-card overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input className="macos-search !pl-8 !h-8" placeholder="Search clients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={() => setShowCreateClient(true)} className="macos-btn text-[12px] flex items-center gap-1.5">
                      <Plus className="size-3.5" /> New Client
                    </button>
                  </div>
                  {clients.length === 0 ? (
                    <div className="py-16 text-center">
                      <Users className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-[13px] text-muted-foreground">No clients yet. Add your first client or seed sample data.</p>
                    </div>
                  ) : (
                    <table className="macos-table">
                      <thead><tr><th>Company</th><th>Contact</th><th>City</th><th>Plan</th><th>Status</th><th>DB</th><th>Devices</th></tr></thead>
                      <tbody>
                        {clients.filter(c => !searchQuery || c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase())).map(client => {
                          const sub = subscriptions.find(s => s.clientId === client.id && (s.status === 'active' || s.status === 'trial'))
                          return (
                            <tr key={client.id} className="cursor-pointer" onClick={() => openClientDetail(client)}>
                              <td className="font-medium">{client.companyName}</td>
                              <td>{client.contactPerson}</td>
                              <td className="text-muted-foreground text-[12px]">{client.city || '--'}</td>
                              <td><span className="text-[11px] font-medium">{sub?.plan?.name || '--'}</span></td>
                              <td><StatusBadge status={client.status} /></td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <div className={`macos-status-dot ${client.databaseStatus === 'active' ? 'macos-status-online' : client.databaseStatus === 'error' ? 'macos-status-error' : 'macos-status-offline'}`} />
                                  <span className="text-[11px] text-muted-foreground">{client.databaseStatus || 'pending'}</span>
                                </div>
                              </td>
                              <td className="text-center">{client._count?.devices || 0}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── SUBSCRIPTIONS TAB ── */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map(plan => (
                    <div key={plan.id} className={`macos-card p-5 relative ${plan.isPopular ? 'ring-2 ring-teal-500/30' : ''}`}>
                      {plan.isPopular && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full">POPULAR</div>}
                      <div className="flex items-center gap-2 mb-3">
                        {plan.name === 'Starter' ? <Zap className="size-4 text-gray-400" /> : plan.name === 'Professional' ? <Star className="size-4 text-teal-500" /> : <Crown className="size-4 text-orange-500" />}
                        <h3 className="text-[15px] font-bold">{plan.name}</h3>
                      </div>
                      <div className="mb-3">
                        <span className="text-[28px] font-bold">{formatPKR(plan.priceMonthly)}</span>
                        <span className="text-[12px] text-muted-foreground">/mo</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatPKR(plan.priceAnnual)}/yr (save {Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100)}%)</p>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {(() => { try { return JSON.parse(plan.features).map((f: string, i: number) => <div key={i} className="flex items-center gap-1.5 text-[11px]"><CheckCircle2 className="size-3 text-emerald-500 shrink-0" />{f}</div>) } catch { return null } })()}
                      </div>
                      <div className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-2">
                        {plan._count?.subscriptions || 0} active subscriptions
                      </div>
                    </div>
                  ))}
                </div>

                <div className="macos-card overflow-hidden">
                  <div className="p-4 border-b border-border"><h3 className="text-[13px] font-semibold">Client Subscriptions</h3></div>
                  <table className="macos-table">
                    <thead><tr><th>Client</th><th>Plan</th><th>Billing</th><th>Status</th><th>Start</th><th>End</th><th>Auto-Renew</th></tr></thead>
                    <tbody>
                      {subscriptions.map(sub => (
                        <tr key={sub.id}>
                          <td className="font-medium">{sub.client?.companyName || '--'}</td>
                          <td><span className="text-[11px] font-medium">{sub.plan?.name || '--'}</span></td>
                          <td className="capitalize text-[12px]">{sub.billingCycle}</td>
                          <td><StatusBadge status={sub.status} /></td>
                          <td className="text-[12px] text-muted-foreground">{formatDate(sub.startDate)}</td>
                          <td className="text-[12px] text-muted-foreground">{sub.endDate ? formatDate(sub.endDate) : '--'}</td>
                          <td>{sub.autoRenew ? <CheckCircle2 className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-gray-300" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── INVOICES TAB ── */}
            {activeTab === 'invoices' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Revenue" value={formatPKR(invoices.reduce((s, i) => s + i.total, 0))} icon={DollarSign} accent />
                  <StatCard label="Outstanding" value={formatPKR(invoices.filter(i => i.balanceDue > 0).reduce((s, i) => s + i.balanceDue, 0))} icon={AlertCircle} />
                  <StatCard label="Overdue" value={String(invoices.filter(i => i.status === 'overdue').length)} icon={Clock} />
                  <StatCard label="Paid" value={String(invoices.filter(i => i.status === 'paid').length)} icon={CheckCircle2} />
                </div>

                <div className="macos-card overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-[13px] font-semibold">Invoices</h3>
                    <button onClick={() => setShowCreateInvoice(true)} className="macos-btn text-[12px] flex items-center gap-1.5">
                      <Plus className="size-3.5" /> New Invoice
                    </button>
                  </div>
                  <table className="macos-table">
                    <thead><tr><th>Invoice #</th><th>Client</th><th>Issue Date</th><th>Due Date</th><th>Total</th><th>Balance</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id}>
                          <td className="font-mono text-[12px] font-semibold">{inv.invoiceNumber}</td>
                          <td className="font-medium">{inv.client?.companyName || '--'}</td>
                          <td className="text-[12px] text-muted-foreground">{formatDate(inv.issueDate)}</td>
                          <td className="text-[12px] text-muted-foreground">{formatDate(inv.dueDate)}</td>
                          <td className="font-medium">{formatPKR(inv.total)}</td>
                          <td className={inv.balanceDue > 0 ? 'text-red-500 font-medium' : 'text-emerald-500'}>{formatPKR(inv.balanceDue)}</td>
                          <td><StatusBadge status={inv.status} /></td>
                          <td>
                            <button onClick={() => { setViewingInvoice(inv); setShowPrintView(true) }} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <Eye className="size-4 text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── QUOTATIONS TAB ── */}
            {activeTab === 'quotations' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Quotes" value={String(quotations.length)} icon={FileSpreadsheet} accent />
                  <StatCard label="Sent" value={String(quotations.filter(q => q.status === 'sent').length)} icon={Send} />
                  <StatCard label="Accepted" value={String(quotations.filter(q => q.status === 'accepted').length)} icon={CheckCircle2} />
                  <StatCard label="Total Value" value={formatPKR(quotations.reduce((s, q) => s + q.total, 0))} icon={DollarSign} />
                </div>

                <div className="macos-card overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-[13px] font-semibold">Quotations</h3>
                    <button onClick={() => setShowCreateQuotation(true)} className="macos-btn text-[12px] flex items-center gap-1.5">
                      <Plus className="size-3.5" /> New Quotation
                    </button>
                  </div>
                  <table className="macos-table">
                    <thead><tr><th>Quote #</th><th>Client</th><th>Issue Date</th><th>Valid Until</th><th>Total</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {quotations.map(q => (
                        <tr key={q.id}>
                          <td className="font-mono text-[12px] font-semibold">{q.quotationNumber}</td>
                          <td className="font-medium">{q.clientName}</td>
                          <td className="text-[12px] text-muted-foreground">{formatDate(q.issueDate)}</td>
                          <td className="text-[12px] text-muted-foreground">{formatDate(q.validUntil)}</td>
                          <td className="font-medium">{formatPKR(q.total)}</td>
                          <td><StatusBadge status={q.status} /></td>
                          <td>
                            <button onClick={() => { setViewingQuotation(q); setShowPrintView(true) }} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <Eye className="size-4 text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── LICENSE KEYS TAB ── */}
            {activeTab === 'license-keys' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Keys" value={String(licenseKeys.length)} icon={Key} accent />
                  <StatCard label="Available" value={String(licenseKeys.filter(k => k.status === 'available').length)} icon={CheckCircle2} />
                  <StatCard label="Assigned" value={String(licenseKeys.filter(k => k.status === 'assigned').length)} icon={Link2} />
                  <StatCard label="Revoked" value={String(licenseKeys.filter(k => k.status === 'revoked').length)} icon={XCircle} />
                </div>

                <div className="macos-card overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-[13px] font-semibold">License Keys</h3>
                    <button onClick={() => setShowGenerateKey(true)} className="macos-btn text-[12px] flex items-center gap-1.5">
                      <Plus className="size-3.5" /> Generate Key
                    </button>
                  </div>
                  <table className="macos-table">
                    <thead><tr><th>License Key</th><th>Client</th><th>Plan</th><th>Stations</th><th>Status</th><th>Assigned</th><th>Expires</th></tr></thead>
                    <tbody>
                      {licenseKeys.map(lk => (
                        <tr key={lk.id}>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <code className="text-[12px] font-mono font-semibold bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">{lk.key}</code>
                              <button onClick={() => copyKey(lk.key)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                {copiedKey === lk.key ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
                              </button>
                            </div>
                          </td>
                          <td className="font-medium">{lk.client?.companyName || '--'}</td>
                          <td className="text-[11px] font-medium">{lk.plan?.name || '--'}</td>
                          <td className="text-center text-[12px]">{lk.maxStations}</td>
                          <td><StatusBadge status={lk.status} /></td>
                          <td className="text-[12px] text-muted-foreground">{lk.assignedAt ? formatDate(lk.assignedAt) : '--'}</td>
                          <td className="text-[12px] text-muted-foreground">{lk.expiresAt ? formatDate(lk.expiresAt) : '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── DEVICES TAB ── */}
            {activeTab === 'devices' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Devices" value={String(devices.length)} icon={Monitor} accent />
                  <StatCard label="Active" value={String(devices.filter(d => d.status === 'active').length)} icon={CheckCircle2} />
                  <StatCard label="Maintenance" value={String(devices.filter(d => d.status === 'maintenance').length)} icon={AlertCircle} />
                  <StatCard label="Inactive" value={String(devices.filter(d => d.status === 'inactive').length)} icon={XCircle} />
                </div>

                <div className="macos-card overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-[13px] font-semibold">Client Devices</h3>
                    <button onClick={() => setShowRegisterDevice(true)} className="macos-btn text-[12px] flex items-center gap-1.5">
                      <Plus className="size-3.5" /> Register Device
                    </button>
                  </div>
                  <table className="macos-table">
                    <thead><tr><th>Client</th><th>Device</th><th>Type</th><th>Serial #</th><th>IP Address</th><th>Location</th><th>Status</th><th>Last Seen</th></tr></thead>
                    <tbody>
                      {devices.map(dev => {
                        const IconComp = deviceTypeIcon[dev.deviceType] || Monitor
                        return (
                          <tr key={dev.id}>
                            <td className="font-medium">{dev.client?.companyName || '--'}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <IconComp className="size-3.5 text-muted-foreground" />
                                <span>{dev.deviceName}</span>
                              </div>
                            </td>
                            <td className="text-[11px] capitalize">{dev.deviceType.replace('_', ' ')}</td>
                            <td className="font-mono text-[11px] text-muted-foreground">{dev.serialNumber || '--'}</td>
                            <td className="font-mono text-[11px] text-muted-foreground">{dev.ipAddress || '--'}</td>
                            <td className="text-[12px]">{dev.location || '--'}</td>
                            <td><StatusBadge status={dev.status} /></td>
                            <td className="text-[12px] text-muted-foreground">{dev.lastSeenAt ? formatDate(dev.lastSeenAt) : '--'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TENANT DATABASES TAB ── */}
            {activeTab === 'tenants' && (
              <TenantDatabasesTab clients={clients} onRefresh={refreshData} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── DIALOGS ── */}

      {/* Create Client Dialog */}
      <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
        <DialogContent className="sm:max-w-[525px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="size-4 text-teal-500" /> New Client</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Company Name *</Label><Input value={newClient.companyName} onChange={e => setNewClient(p => ({ ...p, companyName: e.target.value }))} placeholder="e.g. Al-Falah Petroleum" /></div>
              <div><Label className="text-[11px]">Contact Person *</Label><Input value={newClient.contactPerson} onChange={e => setNewClient(p => ({ ...p, contactPerson: e.target.value }))} placeholder="e.g. Ahmed Khan" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Email *</Label><Input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} placeholder="ahmed@company.pk" /></div>
              <div><Label className="text-[11px]">Phone *</Label><Input value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} placeholder="+92-300-1234567" /></div>
            </div>
            <div><Label className="text-[11px]">Address</Label><Input value={newClient.address} onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} placeholder="Street address" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-[11px]">City</Label><Input value={newClient.city} onChange={e => setNewClient(p => ({ ...p, city: e.target.value }))} placeholder="Karachi" /></div>
              <div><Label className="text-[11px]">State</Label><Input value={newClient.state} onChange={e => setNewClient(p => ({ ...p, state: e.target.value }))} placeholder="Sindh" /></div>
              <div><Label className="text-[11px]">Country</Label><Input value={newClient.country} onChange={e => setNewClient(p => ({ ...p, country: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Industry</Label><Input value={newClient.industry} onChange={e => setNewClient(p => ({ ...p, industry: e.target.value }))} placeholder="Fuel Retail" /></div>
              <div><Label className="text-[11px]">Website</Label><Input value={newClient.website} onChange={e => setNewClient(p => ({ ...p, website: e.target.value }))} placeholder="https://..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Tax ID (NTN)</Label><Input value={newClient.taxId} onChange={e => setNewClient(p => ({ ...p, taxId: e.target.value }))} placeholder="NTN-1234567-8" /></div>
              <div><Label className="text-[11px]">Postal Code</Label><Input value={newClient.postalCode} onChange={e => setNewClient(p => ({ ...p, postalCode: e.target.value }))} /></div>
            </div>
            <div><Label className="text-[11px]">Notes</Label><Textarea value={newClient.notes} onChange={e => setNewClient(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateClient(false)}>Cancel</Button>
            <Button onClick={handleCreateClient} disabled={saving || !newClient.companyName || !newClient.email} className="bg-teal-500 hover:bg-teal-600 text-white">
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />} Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
        <DialogContent className="sm:max-w-[600px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="size-4 text-teal-500" /> New Invoice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Client *</Label>
                <Select value={newInvoice.clientId} onValueChange={v => setNewInvoice(p => ({ ...p, clientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Subscription</Label>
                <Select value={newInvoice.subscriptionId} onValueChange={v => setNewInvoice(p => ({ ...p, subscriptionId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {subscriptions.filter(s => s.clientId === newInvoice.clientId).map(s => <SelectItem key={s.id} value={s.id}>{s.plan?.name} ({s.billingCycle})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Issue Date *</Label><Input type="date" value={newInvoice.issueDate} onChange={e => setNewInvoice(p => ({ ...p, issueDate: e.target.value }))} /></div>
              <div><Label className="text-[11px]">Due Date *</Label><Input type="date" value={newInvoice.dueDate} onChange={e => setNewInvoice(p => ({ ...p, dueDate: e.target.value }))} /></div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[11px] font-semibold">Line Items</Label>
                <button onClick={() => setNewInvoice(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }] }))}
                  className="text-[11px] text-teal-500 hover:text-teal-600 flex items-center gap-1"><Plus className="size-3" /> Add Item</button>
              </div>
              {newInvoice.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                  <div className="col-span-5"><Input placeholder="Description" value={item.description} onChange={e => {
                    const items = [...newInvoice.items]; items[idx] = { ...items[idx], description: e.target.value }; setNewInvoice(p => ({ ...p, items }))
                  }} /></div>
                  <div className="col-span-2"><Input type="number" placeholder="Qty" value={item.quantity || ''} onChange={e => {
                    const q = parseFloat(e.target.value) || 0; const items = [...newInvoice.items]; items[idx] = { ...items[idx], quantity: q, amount: q * items[idx].unitPrice }; setNewInvoice(p => ({ ...p, items }))
                  }} /></div>
                  <div className="col-span-3"><Input type="number" placeholder="Unit Price" value={item.unitPrice || ''} onChange={e => {
                    const up = parseFloat(e.target.value) || 0; const items = [...newInvoice.items]; items[idx] = { ...items[idx], unitPrice: up, amount: items[idx].quantity * up }; setNewInvoice(p => ({ ...p, items }))
                  }} /></div>
                  <div className="col-span-1 text-[12px] font-medium text-right">{formatPKR(item.amount)}</div>
                  <div className="col-span-1">
                    {newInvoice.items.length > 1 && (
                      <button onClick={() => setNewInvoice(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))} className="p-1 text-red-400 hover:text-red-500"><X className="size-3.5" /></button>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-right text-[13px] font-bold mt-2">
                Total: {formatPKR(newInvoice.items.reduce((s, i) => s + i.amount, 0) * (1 + newInvoice.taxRate / 100) * (1 - newInvoice.discountRate / 100))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Tax Rate (%)</Label><Input type="number" value={newInvoice.taxRate} onChange={e => setNewInvoice(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label className="text-[11px]">Discount (%)</Label><Input type="number" value={newInvoice.discountRate} onChange={e => setNewInvoice(p => ({ ...p, discountRate: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label className="text-[11px]">Terms</Label><Textarea value={newInvoice.terms} onChange={e => setNewInvoice(p => ({ ...p, terms: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateInvoice(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={saving || !newInvoice.clientId || !newInvoice.issueDate} className="bg-teal-500 hover:bg-teal-600 text-white">
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />} Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quotation Dialog */}
      <Dialog open={showCreateQuotation} onOpenChange={setShowCreateQuotation}>
        <DialogContent className="sm:max-w-[600px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="size-4 text-teal-500" /> New Quotation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Client (existing)</Label>
                <Select value={newQuotation.clientId} onValueChange={v => {
                  const c = clients.find(cl => cl.id === v)
                  setNewQuotation(p => ({ ...p, clientId: v, clientName: c?.companyName || '', clientEmail: c?.email || '', clientPhone: c?.phone || '', clientAddress: c?.address || '' }))
                }}>
                  <SelectTrigger><SelectValue placeholder="Select or fill manually" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[11px]">Client Name *</Label><Input value={newQuotation.clientName} onChange={e => setNewQuotation(p => ({ ...p, clientName: e.target.value }))} placeholder="Company name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Email</Label><Input value={newQuotation.clientEmail} onChange={e => setNewQuotation(p => ({ ...p, clientEmail: e.target.value }))} /></div>
              <div><Label className="text-[11px]">Phone</Label><Input value={newQuotation.clientPhone} onChange={e => setNewQuotation(p => ({ ...p, clientPhone: e.target.value }))} /></div>
            </div>
            <div><Label className="text-[11px]">Address</Label><Input value={newQuotation.clientAddress} onChange={e => setNewQuotation(p => ({ ...p, clientAddress: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Issue Date *</Label><Input type="date" value={newQuotation.issueDate} onChange={e => setNewQuotation(p => ({ ...p, issueDate: e.target.value }))} /></div>
              <div><Label className="text-[11px]">Valid Until *</Label><Input type="date" value={newQuotation.validUntil} onChange={e => setNewQuotation(p => ({ ...p, validUntil: e.target.value }))} /></div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[11px] font-semibold">Line Items</Label>
                <button onClick={() => setNewQuotation(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }] }))}
                  className="text-[11px] text-teal-500 hover:text-teal-600 flex items-center gap-1"><Plus className="size-3" /> Add Item</button>
              </div>
              {newQuotation.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                  <div className="col-span-5"><Input placeholder="Description" value={item.description} onChange={e => {
                    const items = [...newQuotation.items]; items[idx] = { ...items[idx], description: e.target.value }; setNewQuotation(p => ({ ...p, items }))
                  }} /></div>
                  <div className="col-span-2"><Input type="number" placeholder="Qty" value={item.quantity || ''} onChange={e => {
                    const q = parseFloat(e.target.value) || 0; const items = [...newQuotation.items]; items[idx] = { ...items[idx], quantity: q, amount: q * items[idx].unitPrice }; setNewQuotation(p => ({ ...p, items }))
                  }} /></div>
                  <div className="col-span-3"><Input type="number" placeholder="Unit Price" value={item.unitPrice || ''} onChange={e => {
                    const up = parseFloat(e.target.value) || 0; const items = [...newQuotation.items]; items[idx] = { ...items[idx], unitPrice: up, amount: items[idx].quantity * up }; setNewQuotation(p => ({ ...p, items }))
                  }} /></div>
                  <div className="col-span-1 text-[12px] font-medium text-right">{formatPKR(item.amount)}</div>
                  <div className="col-span-1">
                    {newQuotation.items.length > 1 && (
                      <button onClick={() => setNewQuotation(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))} className="p-1 text-red-400 hover:text-red-500"><X className="size-3.5" /></button>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-right text-[13px] font-bold mt-2">
                Total: {formatPKR(newQuotation.items.reduce((s, i) => s + i.amount, 0) * (1 + newQuotation.taxRate / 100) * (1 - newQuotation.discountRate / 100))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Tax Rate (%)</Label><Input type="number" value={newQuotation.taxRate} onChange={e => setNewQuotation(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label className="text-[11px]">Discount (%)</Label><Input type="number" value={newQuotation.discountRate} onChange={e => setNewQuotation(p => ({ ...p, discountRate: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label className="text-[11px]">Terms</Label><Textarea value={newQuotation.terms} onChange={e => setNewQuotation(p => ({ ...p, terms: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateQuotation(false)}>Cancel</Button>
            <Button onClick={handleCreateQuotation} disabled={saving || !newQuotation.clientName || !newQuotation.issueDate} className="bg-teal-500 hover:bg-teal-600 text-white">
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />} Create Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate License Key Dialog */}
      <Dialog open={showGenerateKey} onOpenChange={setShowGenerateKey}>
        <DialogContent className="sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="size-4 text-teal-500" /> Generate License Key</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div>
              <Label className="text-[11px]">Plan *</Label>
              <Select value={newKey.planId} onValueChange={v => {
                const plan = plans.find(p => p.id === v)
                setNewKey(p => ({ ...p, planId: v, maxStations: plan?.maxStations || 1, maxDispensers: plan?.maxDispensers || 4, maxUsers: plan?.maxUsers || 5 }))
              }}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} -- {formatPKR(p.priceMonthly)}/mo</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-[11px]">Max Stations</Label><Input type="number" value={newKey.maxStations} onChange={e => setNewKey(p => ({ ...p, maxStations: parseInt(e.target.value) || 1 }))} /></div>
              <div><Label className="text-[11px]">Max Dispensers</Label><Input type="number" value={newKey.maxDispensers} onChange={e => setNewKey(p => ({ ...p, maxDispensers: parseInt(e.target.value) || 4 }))} /></div>
              <div><Label className="text-[11px]">Max Users</Label><Input type="number" value={newKey.maxUsers} onChange={e => setNewKey(p => ({ ...p, maxUsers: parseInt(e.target.value) || 5 }))} /></div>
            </div>
            <div><Label className="text-[11px]">Notes</Label><Textarea value={newKey.notes} onChange={e => setNewKey(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateKey(false)}>Cancel</Button>
            <Button onClick={handleGenerateKey} disabled={saving || !newKey.planId} className="bg-teal-500 hover:bg-teal-600 text-white">
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />} Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Device Dialog */}
      <Dialog open={showRegisterDevice} onOpenChange={setShowRegisterDevice}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Monitor className="size-4 text-teal-500" /> Register Device</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div>
              <Label className="text-[11px]">Client *</Label>
              <Select value={newDevice.clientId} onValueChange={v => setNewDevice(p => ({ ...p, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Device Name *</Label><Input value={newDevice.deviceName} onChange={e => setNewDevice(p => ({ ...p, deviceName: e.target.value }))} placeholder="e.g. POS Terminal - Counter 1" /></div>
              <div>
                <Label className="text-[11px]">Device Type</Label>
                <Select value={newDevice.deviceType} onValueChange={v => setNewDevice(p => ({ ...p, deviceType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pos">POS Terminal</SelectItem>
                    <SelectItem value="dispenser_controller">Dispenser Controller</SelectItem>
                    <SelectItem value="atg">ATG Probe</SelectItem>
                    <SelectItem value="payment_terminal">Payment Terminal</SelectItem>
                    <SelectItem value="scanner">Scanner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">Serial Number</Label><Input value={newDevice.serialNumber} onChange={e => setNewDevice(p => ({ ...p, serialNumber: e.target.value }))} /></div>
              <div><Label className="text-[11px]">MAC Address</Label><Input value={newDevice.macAddress} onChange={e => setNewDevice(p => ({ ...p, macAddress: e.target.value }))} placeholder="AA:BB:CC:DD:EE:FF" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px]">IP Address</Label><Input value={newDevice.ipAddress} onChange={e => setNewDevice(p => ({ ...p, ipAddress: e.target.value }))} placeholder="192.168.1.100" /></div>
              <div><Label className="text-[11px]">Location</Label><Input value={newDevice.location} onChange={e => setNewDevice(p => ({ ...p, location: e.target.value }))} placeholder="Station name" /></div>
            </div>
            <div><Label className="text-[11px]">Notes</Label><Textarea value={newDevice.notes} onChange={e => setNewDevice(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegisterDevice(false)}>Cancel</Button>
            <Button onClick={handleRegisterDevice} disabled={saving || !newDevice.clientId || !newDevice.deviceName} className="bg-teal-500 hover:bg-teal-600 text-white">
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />} Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Detail Sheet */}
      <Sheet open={showClientDetail} onOpenChange={setShowClientDetail}>
        <SheetContent className="sm:max-w-[480px] p-0 overflow-y-auto">
          <SheetHeader className="p-5 border-b border-border">
            <SheetTitle className="flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center bg-teal-500/10">
                <Building2 className="size-5 text-teal-500" />
              </div>
              <div>
                <p className="text-[15px] font-bold">{selectedClient?.companyName}</p>
                <p className="text-[11px] text-muted-foreground">{selectedClient?.industry || 'Fuel Retail'}</p>
              </div>
            </SheetTitle>
          </SheetHeader>

          {selectedClient && (
            <div className="p-5 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedClient.status} />
                <StatusBadge status={selectedClient.databaseStatus || 'pending'} />
              </div>

              {/* Contact Info */}
              <div className="macos-group">
                <div className="macos-section-header px-1 mb-1">Contact Information</div>
                <div className="macos-group-item flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /><span className="text-[12px]">{selectedClient.email}</span></div>
                <div className="macos-group-item flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /><span className="text-[12px]">{selectedClient.phone}</span></div>
                <div className="macos-group-item flex items-center gap-2"><Users className="size-3.5 text-muted-foreground" /><span className="text-[12px]">{selectedClient.contactPerson}</span></div>
                {selectedClient.address && <div className="macos-group-item flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /><span className="text-[12px]">{selectedClient.address}, {selectedClient.city}, {selectedClient.country}</span></div>}
                {selectedClient.website && <div className="macos-group-item flex items-center gap-2"><Globe className="size-3.5 text-muted-foreground" /><span className="text-[12px]">{selectedClient.website}</span></div>}
                {selectedClient.taxId && <div className="macos-group-item flex items-center gap-2"><Hash className="size-3.5 text-muted-foreground" /><span className="text-[12px]">NTN: {selectedClient.taxId}</span></div>}
              </div>

              {/* Subscription */}
              <div>
                <div className="macos-section-header px-1 mb-1">Subscription</div>
                {(() => {
                  const sub = subscriptions.find(s => s.clientId === selectedClient.id && (s.status === 'active' || s.status === 'trial'))
                  return sub ? (
                    <div className="macos-card p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold">{sub.plan?.name || 'Unknown'}</span>
                        <StatusBadge status={sub.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{sub.billingCycle} billing -- {sub.autoRenew ? 'Auto-renew' : 'Manual'}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground px-1">No active subscription</p>
                  )
                })()}
              </div>

              {/* Database */}
              <div>
                <div className="macos-section-header px-1 mb-1">Database</div>
                {selectedClient.databaseName ? (
                  <div className="macos-card p-3">
                    <div className="flex items-center justify-between">
                      <code className="text-[11px] font-mono bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">{selectedClient.databaseName}</code>
                      <StatusBadge status={selectedClient.databaseStatus || 'active'} />
                    </div>
                    {selectedClient.tenantDatabase && (
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        {selectedClient.tenantDatabase.totalSize && <span>{selectedClient.tenantDatabase.totalSize}</span>}
                        <span>{selectedClient.tenantDatabase.tableCount} tables</span>
                        {selectedClient.tenantDatabase.schemaVersion && <span>v{selectedClient.tenantDatabase.schemaVersion}</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground px-1">No database provisioned</p>
                )}
              </div>

              {/* Stats */}
              <div>
                <div className="macos-section-header px-1 mb-1">Activity</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="macos-card p-3 text-center">
                    <p className="text-[18px] font-bold">{selectedClient._count?.invoices || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Invoices</p>
                  </div>
                  <div className="macos-card p-3 text-center">
                    <p className="text-[18px] font-bold">{selectedClient._count?.devices || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Devices</p>
                  </div>
                  <div className="macos-card p-3 text-center">
                    <p className="text-[18px] font-bold">{selectedClient._count?.licenseKeys || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Keys</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedClient.notes && (
                <div>
                  <div className="macos-section-header px-1 mb-1">Notes</div>
                  <p className="text-[12px] text-muted-foreground px-1">{selectedClient.notes}</p>
                </div>
              )}

              {/* Onboarded */}
              <p className="text-[11px] text-muted-foreground px-1">Client since {formatDate(selectedClient.onboardedAt)}</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
