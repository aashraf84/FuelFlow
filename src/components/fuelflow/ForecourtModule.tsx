'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fuel,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  OctagonX,
  Cpu,
  Wifi,
  WifiOff,
  Clock,
  Activity,
  ChevronRight,
  Droplets,
  Zap,
  DollarSign,
  ArrowUpRight,
  Radio,
  CheckCircle2,
  XCircle,
  Timer,
  Gauge,
  Hash,
  Send,
  ShieldAlert,
  Tag,
  Server,
  Cable,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────────────────

type DispenserStatus = 'idle' | 'dispensing' | 'error' | 'offline'
type NozzleStatus = 'idle' | 'dispensing' | 'error' | 'offline'
type CommandStatus = 'pending' | 'sent' | 'acknowledged' | 'failed'

interface Nozzle {
  id: string
  nozzleNumber: number
  fuelType: string
  fuelGrade: string
  pricePerLitre: number
  status: NozzleStatus
  totalVolume: number
  lastTransactionVolume: number
  lastTransactionAmount: number
}

interface Dispenser {
  id: string
  name: string
  code: string
  status: DispenserStatus
  pumpLane: number
  nozzles: Nozzle[]
  currentVolume?: number
  currentAmount?: number
  flowRate?: number
  lastCommunication: string
}

interface CommandQueueEntry {
  id: string
  command: string
  target: string
  status: CommandStatus
  timestamp: string
}

interface NozzleEvent {
  id: string
  nozzleId: string
  eventType: string
  volume: number | null
  fuelType: string | null
  isAuthorized: boolean
  createdAt: string
  nozzle?: {
    id: string
    nozzleNumber: number
    fuelType: string
    dispenser?: { name: string; code: string }
  }
}

// ── Status Config ──────────────────────────────────────────

const STATUS_CONFIG: Record<DispenserStatus, { label: string; borderClass: string; dotClass: string; bgClass: string }> = {
  idle: {
    label: 'Idle',
    borderClass: 'border-teal-400/40',
    dotClass: 'macos-status-dot macos-status-warning',
    bgClass: 'bg-teal-500/5',
  },
  dispensing: {
    label: 'Dispensing',
    borderClass: 'border-emerald-400/50',
    dotClass: 'macos-status-dot macos-status-online',
    bgClass: 'bg-emerald-500/5',
  },
  error: {
    label: 'Error',
    borderClass: 'border-red-400/50',
    dotClass: 'macos-status-dot macos-status-error',
    bgClass: 'bg-red-500/5',
  },
  offline: {
    label: 'Offline',
    borderClass: 'border-gray-300/40 dark:border-gray-600/40',
    dotClass: 'macos-status-dot macos-status-offline',
    bgClass: 'bg-gray-500/5',
  },
}

const NOZZLE_STATUS_CONFIG: Record<NozzleStatus, { label: string; dotClass: string }> = {
  idle: { label: 'Idle', dotClass: 'macos-status-dot macos-status-warning' },
  dispensing: { label: 'Dispensing', dotClass: 'macos-status-dot macos-status-online' },
  error: { label: 'Error', dotClass: 'macos-status-dot macos-status-error' },
  offline: { label: 'Offline', dotClass: 'macos-status-dot macos-status-offline' },
}

const COMMAND_STATUS_CONFIG: Record<CommandStatus, { label: string; icon: typeof CheckCircle2; colorClass: string }> = {
  pending: { label: 'Pending', icon: Timer, colorClass: 'text-teal-500' },
  sent: { label: 'Sent', icon: Send, colorClass: 'text-sky-500' },
  acknowledged: { label: 'ACK', icon: CheckCircle2, colorClass: 'text-emerald-500' },
  failed: { label: 'Failed', icon: XCircle, colorClass: 'text-red-500' },
}

// ── Framer Motion Variants ─────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
}

// ── Helpers ──────────────────────────────────────────────────

function mapApiDispenserStatus(status: string): DispenserStatus {
  if (status === 'dispensing' || status === 'active') return 'dispensing'
  if (status === 'error' || status === 'fault') return 'error'
  if (status === 'offline' || status === 'disconnected') return 'offline'
  return 'idle'
}

function mapApiNozzleStatus(status: string): NozzleStatus {
  if (status === 'dispensing' || status === 'active') return 'dispensing'
  if (status === 'error' || status === 'fault') return 'error'
  if (status === 'offline' || status === 'disconnected') return 'offline'
  return 'idle'
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—'
  const now = new Date()
  const date = new Date(dateStr)
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffSec < 60) return `${diffSec} sec ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`
  return `${Math.floor(diffSec / 3600)} hr ago`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

// ── Skeleton ───────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="macos-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-muted/30" />
        <div className="h-3 w-12 rounded bg-muted/30" />
      </div>
      <div className="space-y-2">
        <div className="h-8 rounded bg-muted/20" />
        <div className="h-8 rounded bg-muted/20" />
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="macos-card p-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="size-8 text-teal-500" />
        <p className="text-[13px] text-muted-foreground">{message}</p>
        <button onClick={onRetry} className="macos-btn gap-1.5">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    </div>
  )
}

// ── Sub-Components ─────────────────────────────────────────

function DispenserCard({ dispenser, index, selected, onSelect }: {
  dispenser: Dispenser
  index: number
  selected: boolean
  onSelect: () => void
}) {
  const cfg = STATUS_CONFIG[dispenser.status]
  const isDispensing = dispenser.status === 'dispensing'
  const isOffline = dispenser.status === 'offline'
  const isError = dispenser.status === 'error'

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className={`macos-card cursor-pointer overflow-hidden border-2 transition-colors duration-200 ${
        selected ? 'border-[var(--macos-accent)]' : cfg.borderClass
      } ${isOffline ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className={`px-4 py-3 ${cfg.bgClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className={`size-4 ${isDispensing ? 'text-emerald-500' : isError ? 'text-red-500' : isOffline ? 'text-gray-400' : 'text-teal-500'}`} />
            <span className="text-[13px] font-semibold text-foreground">{dispenser.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono">{dispenser.code}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cfg.dotClass} />
            <span className="text-[11px] font-medium text-muted-foreground">{cfg.label}</span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Lane {dispenser.pumpLane}</span>
          <span className="text-border">|</span>
          <span>{dispenser.nozzles.length} nozzle{dispenser.nozzles.length > 1 ? 's' : ''}</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <Radio className="size-3" />
            {dispenser.lastCommunication}
          </span>
        </div>
      </div>

      {/* Nozzles */}
      <div className="px-4 py-3 space-y-2">
        {dispenser.nozzles.map((nozzle) => {
          const nCfg = NOZZLE_STATUS_CONFIG[nozzle.status]
          const isActiveNozzle = nozzle.status === 'dispensing'
          return (
            <div
              key={nozzle.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                isActiveNozzle ? 'bg-emerald-500/8 dark:bg-emerald-500/10' : 'bg-black/[0.02] dark:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Droplets className={`size-3.5 ${isActiveNozzle ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-foreground">N{nozzle.nozzleNumber}</span>
                    <span className="text-[11px] text-muted-foreground">{nozzle.fuelGrade}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">PKR {nozzle.pricePerLitre.toFixed(2)}/L</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[12px] font-mono text-foreground">
                    {nozzle.totalVolume.toLocaleString('en-PK', { maximumFractionDigits: 1 })} L
                  </p>
                </div>
                <div className={nCfg.dotClass} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Live Transaction (when dispensing) */}
      {isDispensing && dispenser.currentVolume !== undefined && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-emerald-500/15 bg-emerald-500/[0.03] px-4 py-3"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="size-3.5 text-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Live Transaction</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Volume</p>
              <p className="text-[15px] font-semibold text-foreground font-mono">
                {dispenser.currentVolume.toFixed(2)} <span className="text-[11px] text-muted-foreground font-normal">L</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Amount</p>
              <p className="text-[15px] font-semibold text-foreground font-mono">
                PKR {dispenser.currentAmount!.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Flow Rate</p>
              <p className="text-[15px] font-semibold text-foreground font-mono">
                {dispenser.flowRate!.toFixed(1)} <span className="text-[11px] text-muted-foreground font-normal">L/m</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="border-t border-red-500/15 bg-red-500/[0.03] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-red-500" />
            <span className="text-[11px] font-medium text-red-600 dark:text-red-400">Communication error — pump unresponsive</span>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {isOffline && (
        <div className="border-t border-gray-300/15 dark:border-gray-600/15 bg-gray-500/[0.03] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <WifiOff className="size-3.5 text-gray-400" />
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Controller offline — no communication</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function NozzleStatusTable({ dispensers }: { dispensers: Dispenser[] }) {
  const allNozzles = dispensers.flatMap((d) =>
    d.nozzles.map((n) => ({
      ...n,
      dispenserName: d.name,
      dispenserCode: d.code,
    }))
  )

  return (
    <motion.div variants={sectionVariants} initial="hidden" animate="visible">
      <div className="macos-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Nozzle Status</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{allNozzles.length} nozzles across {dispensers.length} dispensers</p>
            </div>
            <Badge variant="outline" className="text-[11px] rounded-md px-2 py-0.5 font-medium border-teal-500/20 text-teal-600 dark:text-teal-400">
              <Hash className="size-3 mr-1" />
              {allNozzles.filter((n) => n.status === 'dispensing').length} Active
            </Badge>
          </div>
        </div>
        <ScrollArea className="max-h-96">
          <table className="macos-table">
            <thead>
              <tr>
                <th>Dispenser</th>
                <th>Nozzle</th>
                <th>Fuel Type</th>
                <th>Status</th>
                <th className="text-right">Total Volume</th>
                <th className="text-right">Last Txn</th>
              </tr>
            </thead>
            <tbody>
              {allNozzles.map((nozzle) => {
                const nCfg = NOZZLE_STATUS_CONFIG[nozzle.status]
                return (
                  <tr key={nozzle.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Fuel className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">{nozzle.dispenserName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <Droplets className="size-3 text-muted-foreground" />
                        N{nozzle.nozzleNumber}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className="text-[13px]">{nozzle.fuelType}</span>
                        <span className="text-[11px] text-muted-foreground ml-1.5">{nozzle.fuelGrade}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={nCfg.dotClass} />
                        <span className="text-[12px]">{nCfg.label}</span>
                      </div>
                    </td>
                    <td className="text-right font-mono text-[12px]">
                      {nozzle.totalVolume.toLocaleString('en-PK', { maximumFractionDigits: 1 })} L
                    </td>
                    <td className="text-right">
                      <div className="text-[12px] font-mono">
                        {nozzle.lastTransactionVolume} L
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        PKR {nozzle.lastTransactionAmount.toLocaleString('en-PK')}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </motion.div>
  )
}

function ControllerStatusPanel({ dispensers }: { dispensers: Dispenser[] }) {
  const connectedCount = dispensers.filter(d => d.status !== 'offline').length
  return (
    <motion.div variants={sectionVariants} initial="hidden" animate="visible">
      <div className="macos-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-[var(--macos-accent)]" />
            <h3 className="text-[13px] font-semibold text-foreground">Forecourt Controller</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`macos-status-dot ${connectedCount > 0 ? 'macos-status-online' : 'macos-status-error'}`} />
              <span className="text-[13px] font-medium text-foreground">{connectedCount > 0 ? 'Connected' : 'Disconnected'}</span>
            </div>
            <Badge variant="outline" className={`text-[11px] rounded-md px-2 py-0.5 font-medium ${connectedCount > 0 ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'border-red-500/20 text-red-600 bg-red-500/5'}`}>
              {connectedCount > 0 ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <Separator />

          {/* Controller Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Controller Type</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Cpu className="size-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground">PTS-2</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Protocol</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Cable className="size-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground">IFSF</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Last Poll</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground">2 sec ago</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">IP Address</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Wifi className="size-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-mono text-foreground">192.168.1.100</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Connected Dispensers</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Fuel className="size-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground">{connectedCount} / {dispensers.length}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Active Commands</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Zap className="size-3.5 text-[var(--macos-accent)]" />
                  <span className="text-[13px] font-medium text-foreground">{dispensers.filter(d => d.status === 'dispensing').length}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dispenser Connectivity Bar */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Dispenser Connectivity</p>
            <div className={`grid gap-1.5 ${dispensers.length <= 4 ? 'grid-cols-4' : dispensers.length <= 6 ? 'grid-cols-6' : 'grid-cols-8'}`}>
              {dispensers.map((d) => {
                const isOn = d.status !== 'offline'
                return (
                  <div
                    key={d.id}
                    className={`flex flex-col items-center gap-1 rounded-md px-1 py-1.5 ${
                      isOn ? 'bg-emerald-500/8 dark:bg-emerald-500/10' : 'bg-red-500/8 dark:bg-red-500/10'
                    }`}
                  >
                    <div className={`macos-status-dot ${isOn ? 'macos-status-online' : 'macos-status-error'}`} />
                    <span className="text-[10px] font-medium text-muted-foreground">{d.name.replace('Dispenser ', '')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CommandQueuePanel({ commandQueue }: { commandQueue: CommandQueueEntry[] }) {
  return (
    <motion.div variants={sectionVariants} initial="hidden" animate="visible">
      <div className="macos-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-[var(--macos-accent)]" />
              <h3 className="text-[13px] font-semibold text-foreground">Command Queue</h3>
            </div>
            <Badge variant="outline" className="text-[11px] rounded-md px-2 py-0.5 font-medium">
              {commandQueue.length} Recent
            </Badge>
          </div>
        </div>
        {commandQueue.length === 0 ? (
          <div className="p-5 text-center text-[12px] text-muted-foreground">No recent commands</div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-border">
              {commandQueue.map((cmd) => {
                const cfg = COMMAND_STATUS_CONFIG[cmd.status]
                const StatusIcon = cfg.icon
                return (
                  <div
                    key={cmd.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <StatusIcon className={`size-4 shrink-0 ${cfg.colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-foreground">{cmd.command}</span>
                        <span className="text-[11px] text-muted-foreground">→</span>
                        <span className="text-[12px] text-muted-foreground truncate">{cmd.target}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] font-semibold ${cfg.colorClass}`}>{cfg.label}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{cmd.timestamp}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </motion.div>
  )
}

function QuickActions({ selectedDispenser }: { selectedDispenser: Dispenser | null }) {
  const actions = [
    {
      label: 'Authorize Pump',
      icon: Play,
      className: 'macos-btn',
      disabled: !selectedDispenser || selectedDispenser.status === 'dispensing' || selectedDispenser.status === 'offline',
    },
    {
      label: 'Stop Pump',
      icon: Square,
      className: 'macos-btn-secondary',
      disabled: !selectedDispenser || selectedDispenser.status !== 'dispensing',
    },
    {
      label: 'Reset Pump',
      icon: RotateCcw,
      className: 'macos-btn-secondary',
      disabled: !selectedDispenser || selectedDispenser.status !== 'error',
    },
    {
      label: 'Price Change',
      icon: Tag,
      className: 'macos-btn-secondary',
      disabled: false,
    },
    {
      label: 'Emergency Stop',
      icon: OctagonX,
      className: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all duration-150 shadow-sm active:scale-[0.98]',
      disabled: false,
    },
  ]

  return (
    <motion.div variants={sectionVariants} initial="hidden" animate="visible">
      <div className="macos-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-[var(--macos-accent)]" />
            <h3 className="text-[13px] font-semibold text-foreground">Quick Actions</h3>
            {selectedDispenser && (
              <Badge variant="outline" className="text-[11px] rounded-md px-2 py-0.5 font-medium ml-1">
                {selectedDispenser.name}
              </Badge>
            )}
          </div>
          {!selectedDispenser && (
            <p className="text-[11px] text-muted-foreground mt-1">Select a dispenser to enable pump controls</p>
          )}
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {actions.map((action) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: action.disabled ? 1 : 1.02 }}
                  whileTap={{ scale: action.disabled ? 1 : 0.97 }}
                  className={`${action.className} gap-2 w-full ${action.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={action.disabled}
                >
                  <Icon className="size-4" />
                  {action.label}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Detail Drawer ──────────────────────────────────────────

function DispenserDetailPanel({ dispenser, onClose }: { dispenser: Dispenser; onClose: () => void }) {
  const cfg = STATUS_CONFIG[dispenser.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="macos-card overflow-hidden"
    >
      <div className={`px-5 py-4 ${cfg.bgClass} border-b border-border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Fuel className={`size-5 ${dispenser.status === 'dispensing' ? 'text-emerald-500' : dispenser.status === 'error' ? 'text-red-500' : 'text-[var(--macos-accent)]'}`} />
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">{dispenser.name}</h3>
              <p className="text-[11px] text-muted-foreground">{dispenser.code} • Lane {dispenser.pumpLane}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-6 rounded-md hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
          >
            <ChevronRight className="size-4 text-muted-foreground rotate-180" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Status</span>
          <div className="flex items-center gap-1.5">
            <div className={cfg.dotClass} />
            <span className="text-[13px] font-medium">{cfg.label}</span>
          </div>
        </div>

        <Separator />

        {/* Nozzles Detail */}
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Nozzles</p>
          <div className="space-y-2">
            {dispenser.nozzles.map((nozzle) => (
              <div key={nozzle.id} className="macos-group">
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="size-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium">Nozzle {nozzle.nozzleNumber}</span>
                    </div>
                    <div className={NOZZLE_STATUS_CONFIG[nozzle.status].dotClass} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-muted-foreground">Fuel</span>
                      <span className="text-[11px] font-medium">{nozzle.fuelGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-muted-foreground">Price</span>
                      <span className="text-[11px] font-medium font-mono">PKR {nozzle.pricePerLitre.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-muted-foreground">Totalizer</span>
                      <span className="text-[11px] font-medium font-mono">{nozzle.totalVolume.toLocaleString('en-PK', { maximumFractionDigits: 1 })} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-muted-foreground">Last Txn</span>
                      <span className="text-[11px] font-medium font-mono">{nozzle.lastTransactionVolume} L / PKR {nozzle.lastTransactionAmount.toLocaleString('en-PK')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Communication */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Last Comm:</span>
            <span className="text-[11px] font-medium">{dispenser.lastCommunication}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Protocol:</span>
            <span className="text-[11px] font-medium">IFSF</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────

export default function ForecourtModule() {
  const [selectedDispenserId, setSelectedDispenserId] = useState<string | null>(null)
  const { selectedStation } = useAppStore()

  // Data state
  const [dispensers, setDispensers] = useState<Dispenser[]>([])
  const [commandQueue, setCommandQueue] = useState<CommandQueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const stationParam = selectedStation && selectedStation !== 'all' ? `?stationId=${selectedStation}` : ''

      const [dispRes, eventsRes] = await Promise.all([
        fetch(`/api/dispensers${stationParam ? `?stationId=${selectedStation}` : ''}`),
        fetch('/api/nozzle-events'),
      ])

      if (!dispRes.ok) throw new Error('Failed to fetch dispensers')

      const dispData = await dispRes.json()
      const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] }

      // Map API dispensers to UI dispensers
      const mappedDispensers: Dispenser[] = (dispData.dispensers || []).map((d: Record<string, unknown>, idx: number) => {
        const apiStatus = mapApiDispenserStatus(d.status as string || 'idle')
        const nozzles = (d.nozzles || []) as Record<string, unknown>[]
        // Price defaults based on fuel type (PKR per litre)
        const priceMap: Record<string, number> = {
          petrol: 272.50, diesel: 285.00, hobc: 302.00, premium: 272.50, xl: 295.00,
        }
        return {
          id: d.id as string,
          name: (d.name as string) || `Dispenser ${idx + 1}`,
          code: (d.code as string) || `DSP-${String(idx + 1).padStart(3, '0')}`,
          status: apiStatus,
          pumpLane: (d.pumpLane as number) || Math.floor(idx / 2) + 1,
          nozzles: nozzles.map((n: Record<string, unknown>, nIdx: number) => {
            const fuelType = (n.fuelType as string) || 'petrol'
            const pricePerLitre = (n.pricePerLitre as number) || priceMap[fuelType.toLowerCase()] || 272.50
            const meterReading = (n.meterReading as number) || 0
            const previousReading = (n.previousReading as number) || 0
            const lastTxnVol = meterReading - previousReading
            return {
              id: n.id as string,
              nozzleNumber: (n.nozzleNumber as number) || nIdx + 1,
              fuelType: fuelType,
              fuelGrade: (n.fuelGrade as string) || fuelType.charAt(0).toUpperCase() + fuelType.slice(1),
              pricePerLitre,
              status: mapApiNozzleStatus((n.status as string) || 'idle'),
              totalVolume: (n.totalizer as number) || (n.totalVolume as number) || meterReading,
              lastTransactionVolume: lastTxnVol > 0 ? lastTxnVol : 0,
              lastTransactionAmount: lastTxnVol > 0 ? Math.round(lastTxnVol * pricePerLitre) : 0,
            }
          }),
          lastCommunication: (d.lastCommunication as string) || (d.updatedAt ? timeAgo(d.updatedAt as string) : '—'),
        }
      })

      setDispensers(mappedDispensers)

      // Build command queue from nozzle events
      const apiEvents = eventsData.events || []
      const cmdQueue: CommandQueueEntry[] = apiEvents
        .slice(0, 10)
        .map((evt: Record<string, unknown>, i: number) => {
          const eventType = evt.eventType as string || 'unknown'
          const nozzleInfo = evt.nozzle as Record<string, unknown> | undefined
          const dispenserInfo = nozzleInfo?.dispenser as Record<string, unknown> | undefined
          let command = eventType.toUpperCase().replace(/_/g, ' ')
          let cmdStatus: CommandStatus = evt.isAuthorized ? 'acknowledged' : 'failed'
          if (eventType === 'nozzle_up') command = 'AUTHORIZE'
          else if (eventType === 'nozzle_down') command = 'STOP'
          else if (eventType === 'fueling_start') command = 'AUTHORIZE'
          else if (eventType === 'fueling_end') command = 'STOP'

          return {
            id: evt.id as string || `cmd-${i}`,
            command,
            target: dispenserInfo ? `${dispenserInfo.name} N${nozzleInfo?.nozzleNumber || '?'}` : `Nozzle ${evt.nozzleId}`,
            status: cmdStatus,
            timestamp: evt.createdAt ? formatTime(evt.createdAt as string) : '—',
          }
        })

      setCommandQueue(cmdQueue)
    } catch (err) {
      console.error('ForecourtModule fetch error:', err)
      setError('Unable to load forecourt data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedStation])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectedDispenser = dispensers.find((d) => d.id === selectedDispenserId) || null

  // Summary stats
  const summary = {
    idle: dispensers.filter((d) => d.status === 'idle').length,
    dispensing: dispensers.filter((d) => d.status === 'dispensing').length,
    error: dispensers.filter((d) => d.status === 'error').length,
    offline: dispensers.filter((d) => d.status === 'offline').length,
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-5" style={{ fontStyle: 'normal !important' }}>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--macos-accent)]/10">
            <Fuel className="size-5 text-[var(--macos-accent)]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-foreground tracking-tight">Forecourt Control</h2>
            <p className="text-[11px] text-muted-foreground">Real-time dispenser monitoring &amp; control</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <div className="macos-status-dot macos-status-online" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">LIVE</span>
          </div>

          {/* Refresh */}
          <button onClick={fetchData} className="macos-btn-secondary gap-1 px-2 py-1.5" title="Refresh data">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Summary Pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            {[
              { label: 'Dispensing', count: summary.dispensing, color: 'text-emerald-500' },
              { label: 'Idle', count: summary.idle, color: 'text-teal-500' },
              { label: 'Error', count: summary.error, color: 'text-red-500' },
              { label: 'Offline', count: summary.offline, color: 'text-gray-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/[0.02] dark:bg-white/[0.03]">
                <span className={`text-[13px] font-semibold ${item.color}`}>{item.count}</span>
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Dispenser Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : dispensers.length === 0 ? (
        <div className="macos-card p-8 text-center">
          <Fuel className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-[13px] font-medium text-foreground">No dispensers found</p>
          <p className="text-[11px] text-muted-foreground mt-1">Dispensers will appear here once configured for your station.</p>
          <button className="macos-btn gap-1 mt-4 mx-auto" onClick={fetchData}>
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {dispensers.map((dispenser, i) => (
              <DispenserCard
                key={dispenser.id}
                dispenser={dispenser}
                index={i}
                selected={selectedDispenserId === dispenser.id}
                onSelect={() => setSelectedDispenserId(selectedDispenserId === dispenser.id ? null : dispenser.id)}
              />
            ))}
          </div>

          {/* ── Detail Panel (when dispenser selected) ── */}
          <AnimatePresence>
            {selectedDispenser && (
              <DispenserDetailPanel
                dispenser={selectedDispenser}
                onClose={() => setSelectedDispenserId(null)}
              />
            )}
          </AnimatePresence>

          {/* ── Nozzle Status Table ── */}
          <NozzleStatusTable dispensers={dispensers} />

          {/* ── Controller + Command Queue Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ControllerStatusPanel dispensers={dispensers} />
            <CommandQueuePanel commandQueue={commandQueue} />
          </div>

          {/* ── Quick Actions ── */}
          <QuickActions selectedDispenser={selectedDispenser} />

          {/* ── Emergency Stop (Standalone) ── */}
          <motion.div variants={sectionVariants} initial="hidden" animate="visible">
            <div className="macos-card overflow-hidden border-red-200/40 dark:border-red-800/30">
              <div className="px-5 py-4 border-b border-red-200/20 dark:border-red-800/20 bg-red-500/[0.02]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-red-500" />
                  <h3 className="text-[13px] font-semibold text-red-600 dark:text-red-400">Emergency Controls</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white py-5 text-[15px] font-bold transition-colors shadow-sm"
                >
                  <OctagonX className="size-6" />
                  EMERGENCY STOP ALL PUMPS
                </motion.button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Immediately halts all dispensers and locks the forecourt. Use only in case of emergency.
                </p>
                <Separator />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Individual Pump Lockdown</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {dispensers.map((d) => (
                      <motion.button
                        key={d.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="macos-btn-secondary gap-1.5 text-[12px] w-full"
                      >
                        <Square className="size-3 text-red-500" />
                        {d.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
