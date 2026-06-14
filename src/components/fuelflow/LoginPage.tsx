'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fuel,
  Key,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Monitor,
  Zap,
  Building2,
  Users,
  Gauge,
  ChevronRight,
  Fingerprint,
  Crown,
  Phone,
  User,
  Cpu,
  Copy,
  Check,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type AuthUser, type AccessLevel } from '@/stores/app-store'

type LoginStep = 'serial-key' | 'credentials' | 'register-admin' | 'registration-success'

interface SerialKeyValidation {
  valid: boolean
  status?: string
  plan?: string
  maxStations?: number
  maxDispensers?: number
  maxUsers?: number
  message?: string
  error?: string
  tenant?: { id: string; name: string; slug: string } | null
}

interface RegistrationResult {
  credentials: {
    email: string
    password: string
    apiKey: string
    userId: string
    ownerId: string
  }
  serialKey: {
    key: string
    plan: string
    maxStations: number
    maxDispensers: number
    maxUsers: number
    expiresAt: string
    status: string
  }
  licenseKey: {
    key: string
    status: string
    expiresAt: string
  }
  device: {
    id: string
    name: string
    type: string
    status: string
  }
  tenant: {
    id: string
    name: string
    slug: string
    subscription: string
  }
}

export default function LoginPage() {
  const { login } = useAppStore()
  const [step, setStep] = useState<LoginStep>('serial-key')
  const [serialKey, setSerialKey] = useState('')
  const [serialKeyValidation, setSerialKeyValidation] = useState<SerialKeyValidation | null>(null)
  const [validatingKey, setValidatingKey] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)

  // Registration form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regCompany, setRegCompany] = useState('')
  const [regDeviceName, setRegDeviceName] = useState('')
  const [regDeviceType, setRegDeviceType] = useState('pos')
  const [regPassword, setRegPassword] = useState('')
  const [regShowPassword, setRegShowPassword] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Auto-validate serial key with debounce
  useEffect(() => {
    if (!serialKey || serialKey.length < 8) {
      setSerialKeyValidation(null)
      return
    }
    const timer = setTimeout(async () => {
      setValidatingKey(true)
      try {
        const res = await fetch('/api/auth/validate-serial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: serialKey }),
        })
        const data = await res.json()
        setSerialKeyValidation(data)
      } catch {
        setSerialKeyValidation({ valid: false, error: 'Validation failed' })
      } finally {
        setValidatingKey(false)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [serialKey])

  const handleSerialKeySubmit = () => {
    if (!serialKeyValidation?.valid) return
    setError(null)
    setStep('credentials')
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, serialKey: serialKey || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      login(data.user as AuthUser, data.accessLevel as AccessLevel)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Demo login failed')
        return
      }
      login(data.user as AuthUser, data.accessLevel as AccessLevel)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setDemoLoading(false)
    }
  }

  const handleSuperAdminRegister = async () => {
    if (!regName || !regEmail || !regCompany || !regDeviceName) {
      setError('Please fill in all required fields')
      return
    }
    setRegLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/setup-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword.trim() || undefined,
          phone: regPhone.trim() || undefined,
          companyName: regCompany.trim(),
          deviceName: regDeviceName.trim(),
          deviceType: regDeviceType,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }
      setRegistrationResult(data)
      setStep('registration-success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setRegLoading(false)
    }
  }

  const handleLoginWithCredentials = async () => {
    if (!registrationResult) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registrationResult.credentials.email,
          password: registrationResult.credentials.password,
          serialKey: registrationResult.serialKey.key,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Auto-login failed')
        return
      }
      login(data.user as AuthUser, data.accessLevel as AccessLevel)
    } catch {
      setError('Network error during auto-login.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action()
  }

  const planColors: Record<string, string> = {
    starter: 'bg-slate-500',
    professional: 'bg-teal-500',
    enterprise: 'bg-orange-600',
  }
  const planLabels: Record<string, string> = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  }

  return (
    <div className="min-h-screen flex macos-login-gradient relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-teal-500/[0.04] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-orange-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-400/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
        backgroundSize: '64px 64px'
      }} />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative z-10 flex-col justify-between p-10">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="flex size-12 items-center justify-center rounded-2xl fuel-gradient shadow-lg shadow-teal-500/20">
              <Fuel className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">FuelFlow OS</h1>
              <p className="text-[12px] text-white/40">ApexFlow Ecosystem</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Enterprise-Grade<br />
            <span className="fuel-text-gradient">Fuel Station OS</span>
          </h2>
          <p className="text-white/40 text-[14px] leading-relaxed max-w-sm">
            Complete ERP solution for modern fuel stations. Real-time forecourt control,
            tank monitoring, fleet management, and AI-powered analytics.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Gauge, label: 'Forecourt Control', desc: 'Real-time pump monitoring' },
            { icon: Fuel, label: 'Wet Stock Mgmt', desc: 'Tank & delivery tracking' },
            { icon: Users, label: 'Fleet & CRM', desc: 'Customer management' },
            { icon: Zap, label: 'AI Analytics', desc: 'Predictive insights' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-4 hover:bg-white/[0.06] transition-colors group"
            >
              <feature.icon className="size-5 text-teal-400 mb-2 group-hover:text-teal-300 transition-colors" />
              <p className="text-[13px] font-medium text-white/80">{feature.label}</p>
              <p className="text-[11px] text-white/30">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex items-center gap-2 text-[11px] text-white/25">
          <Building2 className="size-3.5" />
          <span>Trusted by 500+ fuel stations across Pakistan</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
        <div className={`w-full ${step === 'registration-success' ? 'max-w-[520px]' : 'max-w-[400px]'}`}>
          {/* macOS-style login card */}
          <div className="rounded-2xl bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] p-8 shadow-2xl">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-xl fuel-gradient shadow-lg shadow-teal-500/20">
                <Fuel className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">FuelFlow OS</h1>
                <p className="text-[11px] text-white/40">ApexFlow Ecosystem</p>
              </div>
            </div>

            {/* Form Header */}
            <AnimatePresence mode="wait">
              {step === 'serial-key' && (
                <motion.div key="serial-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10">
                      <Key className="size-4 text-teal-400" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-white">Device Registration</h2>
                      <p className="text-[12px] text-white/40">Enter your serial key to activate this device</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {step === 'credentials' && (
                <motion.div key="creds-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10">
                      <Lock className="size-4 text-teal-400" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-white">Sign In</h2>
                      <p className="text-[12px] text-white/40">Enter your credentials to continue</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {step === 'register-admin' && (
                <motion.div key="reg-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10">
                      <Crown className="size-4 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-white">Super Admin Setup</h2>
                      <p className="text-[12px] text-white/40">Register as owner with lifetime enterprise access</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {step === 'registration-success' && (
                <motion.div key="success-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-white">Registration Complete!</h2>
                      <p className="text-[12px] text-white/40">Save your credentials — they are shown only once</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step: Serial Key */}
            <AnimatePresence mode="wait">
              {step === 'serial-key' && (
                <motion.div
                  key="serial-form"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mt-6 space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="serial-key" className="text-[12px] font-medium text-white/60">
                      Serial Key
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                      <input
                        id="serial-key"
                        type="text"
                        placeholder="FF-XXXX-XXXX-XXXX"
                        value={serialKey}
                        onChange={(e) => {
                          setSerialKey(e.target.value.toUpperCase())
                          setError(null)
                        }}
                        onKeyDown={(e) => handleKeyDown(e, handleSerialKeySubmit)}
                        className="w-full h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-10 pr-10 text-[13px] font-mono tracking-wider text-white placeholder:text-white/20 focus:outline-none focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/15 transition-all"
                        autoComplete="off"
                        autoFocus
                      />
                      {validatingKey && (
                        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/30" />
                      )}
                    </div>

                    {/* Validation Result */}
                    <AnimatePresence>
                      {serialKeyValidation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {serialKeyValidation.valid ? (
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-3.5 text-emerald-400" />
                                <span className="text-[12px] font-semibold text-emerald-400">Valid Serial Key</span>
                                {serialKeyValidation.plan && (
                                  <span className={`text-[9px] font-bold rounded-md px-1.5 py-0.5 text-white ${planColors[serialKeyValidation.plan] || 'bg-slate-500'}`}>
                                    {planLabels[serialKeyValidation.plan] || serialKeyValidation.plan}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-[11px] text-white/40">
                                <div className="flex items-center gap-1">
                                  <Building2 className="size-3" />
                                  <span>{serialKeyValidation.maxStations} Stn</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Fuel className="size-3" />
                                  <span>{serialKeyValidation.maxDispensers} Disp</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="size-3" />
                                  <span>{serialKeyValidation.maxUsers} Users</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                              <AlertCircle className="size-3.5 text-red-400 shrink-0" />
                              <span className="text-[12px] text-red-400">
                                {serialKeyValidation.error || 'Invalid serial key'}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleSerialKeySubmit}
                    disabled={!serialKeyValidation?.valid || validatingKey}
                    className="w-full h-10 rounded-lg fuel-gradient text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15 hover:shadow-teal-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ChevronRight className="size-4" />
                  </button>

                  {/* Separator */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/[0.06]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-transparent px-3 text-[11px] text-white/20">or</span>
                    </div>
                  </div>

                  {/* Super Admin Registration */}
                  <button
                    onClick={() => { setStep('register-admin'); setError(null) }}
                    className="w-full h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15 hover:border-orange-500/30 text-orange-400 text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Crown className="size-4" />
                    Register as Super Admin
                  </button>

                  {/* Separator */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/[0.06]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-transparent px-3 text-[11px] text-white/20">or explore</span>
                    </div>
                  </div>

                  {/* Demo Login Button */}
                  <button
                    onClick={handleDemoLogin}
                    disabled={demoLoading}
                    className="w-full h-10 rounded-lg border border-dashed border-teal-500/25 hover:border-teal-500/40 hover:bg-teal-500/5 text-teal-400 text-[13px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  >
                    {demoLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Monitor className="size-4" />
                    )}
                    Demo Login (View Only)
                  </button>

                  <p className="text-center text-[11px] text-white/20">
                    Demo account provides view-only access to explore the platform
                  </p>
                </motion.div>
              )}

              {/* Step: Credentials */}
              {step === 'credentials' && (
                <motion.div
                  key="credentials-form"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mt-6 space-y-4"
                >
                  {/* Serial Key Summary */}
                  <div className="flex items-center justify-between rounded-lg bg-teal-500/5 border border-teal-500/15 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                      <span className="text-[11px] font-medium text-white/60">Serial Key Verified</span>
                      {serialKeyValidation?.plan && (
                        <span className={`text-[9px] font-bold rounded-md px-1.5 py-0.5 text-white ${planColors[serialKeyValidation.plan] || 'bg-slate-500'}`}>
                          {planLabels[serialKeyValidation.plan]}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { setStep('serial-key'); setError(null) }}
                      className="text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[12px] font-medium text-white/60">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                      <input
                        id="email"
                        type="email"
                        placeholder="you@station.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null) }}
                        onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                        className="w-full h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-10 pr-3 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/15 transition-all"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[12px] font-medium text-white/60">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null) }}
                        onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                        className="w-full h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-10 pr-10 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/15 transition-all"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                      >
                        <AlertCircle className="size-3.5 text-red-400 shrink-0" />
                        <span className="text-[12px] text-red-400">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Button */}
                  <button
                    onClick={handleLogin}
                    disabled={loading || !email || !password}
                    className="w-full h-10 rounded-lg fuel-gradient text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15 hover:shadow-teal-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Sign In
                    {!loading && <ChevronRight className="size-4" />}
                  </button>

                  {/* Back + Demo */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setStep('serial-key'); setError(null) }}
                      className="flex-1 h-9 rounded-lg border border-white/[0.06] text-white/40 text-[12px] font-medium hover:bg-white/[0.03] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleDemoLogin}
                      disabled={demoLoading}
                      className="flex-1 h-9 rounded-lg border border-dashed border-teal-500/20 hover:border-teal-500/35 hover:bg-teal-500/5 text-teal-400 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                    >
                      {demoLoading ? <Loader2 className="size-3 animate-spin" /> : <Monitor className="size-3" />}
                      Demo
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step: Register Super Admin */}
              {step === 'register-admin' && (
                <motion.div
                  key="register-form"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mt-6 space-y-3"
                >
                  {/* Lifetime Badge */}
                  <div className="flex items-center gap-2 rounded-lg bg-orange-500/5 border border-orange-500/15 px-3 py-2">
                    <Crown className="size-3.5 text-orange-400" />
                    <span className="text-[11px] font-semibold text-orange-400">LIFETIME Enterprise Access</span>
                    <span className="text-[9px] font-bold rounded-md px-1.5 py-0.5 text-white bg-orange-600">UNLIMITED</span>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-white/50">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={regName}
                        onChange={(e) => { setRegName(e.target.value); setError(null) }}
                        className="w-full h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-9 pr-3 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-white/50">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={regEmail}
                        onChange={(e) => { setRegEmail(e.target.value); setError(null) }}
                        className="w-full h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-9 pr-3 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-white/50">Password {regPassword.length > 0 && regPassword.length < 6 && <span className="text-red-400 ml-1">(min 6 chars)</span>}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                      <input
                        type={regShowPassword ? 'text' : 'password'}
                        placeholder="Set a password (or leave blank for auto-generated)"
                        value={regPassword}
                        onChange={(e) => { setRegPassword(e.target.value); setError(null) }}
                        className="w-full h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-9 pr-9 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setRegShowPassword(!regShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {regShowPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-white/50">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                      <input
                        type="tel"
                        placeholder="+92-XXX-XXXXXXX"
                        value={regPhone}
                        onChange={(e) => { setRegPhone(e.target.value); setError(null) }}
                        className="w-full h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-9 pr-3 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-white/50">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        placeholder="Your fuel station company"
                        value={regCompany}
                        onChange={(e) => { setRegCompany(e.target.value); setError(null) }}
                        className="w-full h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-9 pr-3 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Device Name */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-white/50">Device Name *</Label>
                    <div className="relative">
                      <Monitor className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        placeholder="e.g., Main Office Terminal"
                        value={regDeviceName}
                        onChange={(e) => { setRegDeviceName(e.target.value); setError(null) }}
                        className="w-full h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-9 pr-3 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Device Type */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-white/50">Device Type</Label>
                    <div className="relative">
                      <Cpu className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                      <select
                        value={regDeviceType}
                        onChange={(e) => setRegDeviceType(e.target.value)}
                        className="w-full h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] pl-9 pr-3 text-[12px] text-white focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 transition-all appearance-none"
                      >
                        <option value="pos" className="bg-neutral-900">POS Terminal</option>
                        <option value="dispenser_controller" className="bg-neutral-900">Dispenser Controller</option>
                        <option value="atg" className="bg-neutral-900">ATG System</option>
                        <option value="payment_terminal" className="bg-neutral-900">Payment Terminal</option>
                        <option value="scanner" className="bg-neutral-900">Scanner / Reader</option>
                        <option value="other" className="bg-neutral-900">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5"
                      >
                        <AlertCircle className="size-3.5 text-red-400 shrink-0" />
                        <span className="text-[11px] text-red-400">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Register Button */}
                  <button
                    onClick={handleSuperAdminRegister}
                    disabled={regLoading || !regName || !regEmail || !regCompany || !regDeviceName}
                    className="w-full h-10 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {regLoading ? <Loader2 className="size-4 animate-spin" /> : <Crown className="size-4" />}
                    {regLoading ? 'Setting up...' : 'Register as Super Admin'}
                  </button>

                  {/* Back */}
                  <button
                    onClick={() => { setStep('serial-key'); setError(null) }}
                    className="w-full h-9 rounded-lg border border-white/[0.06] text-white/40 text-[12px] font-medium hover:bg-white/[0.03] transition-colors"
                  >
                    Back to Login
                  </button>
                </motion.div>
              )}

              {/* Step: Registration Success */}
              {step === 'registration-success' && registrationResult && (
                <motion.div
                  key="success-form"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mt-6 space-y-3"
                >
                  {/* Success Badge */}
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-emerald-400">Super Admin — LIFETIME Enterprise</span>
                  </div>

                  {/* Credentials Card */}
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 space-y-2.5">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Login Credentials</p>

                    {/* Email */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Mail className="size-3 text-white/30 shrink-0" />
                        <span className="text-[11px] text-white/50 shrink-0">Email:</span>
                        <span className="text-[11px] text-white font-mono truncate">{registrationResult.credentials.email}</span>
                      </div>
                      <button onClick={() => copyToClipboard(registrationResult.credentials.email, 'email')} className="shrink-0 ml-2">
                        {copiedField === 'email' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-white/30 hover:text-white/60" />}
                      </button>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Lock className="size-3 text-white/30 shrink-0" />
                        <span className="text-[11px] text-white/50 shrink-0">Password:</span>
                        <span className="text-[11px] text-white font-mono truncate">{registrationResult.credentials.password}</span>
                      </div>
                      <button onClick={() => copyToClipboard(registrationResult.credentials.password, 'password')} className="shrink-0 ml-2">
                        {copiedField === 'password' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-white/30 hover:text-white/60" />}
                      </button>
                    </div>

                    {/* Serial Key */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Key className="size-3 text-white/30 shrink-0" />
                        <span className="text-[11px] text-white/50 shrink-0">Serial Key:</span>
                        <span className="text-[11px] text-teal-400 font-mono truncate">{registrationResult.serialKey.key}</span>
                      </div>
                      <button onClick={() => copyToClipboard(registrationResult.serialKey.key, 'serial')} className="shrink-0 ml-2">
                        {copiedField === 'serial' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-white/30 hover:text-white/60" />}
                      </button>
                    </div>

                    {/* API Key */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Shield className="size-3 text-white/30 shrink-0" />
                        <span className="text-[11px] text-white/50 shrink-0">API Key:</span>
                        <span className="text-[10px] text-orange-400 font-mono truncate">{registrationResult.credentials.apiKey}</span>
                      </div>
                      <button onClick={() => copyToClipboard(registrationResult.credentials.apiKey, 'apikey')} className="shrink-0 ml-2">
                        {copiedField === 'apikey' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-white/30 hover:text-white/60" />}
                      </button>
                    </div>
                  </div>

                  {/* Plan Details */}
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 space-y-1.5">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Plan Details</p>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="flex items-center gap-1 text-white/40">
                        <Building2 className="size-3" />
                        <span>{registrationResult.serialKey.maxStations === 999 ? '∞' : registrationResult.serialKey.maxStations} Stations</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/40">
                        <Fuel className="size-3" />
                        <span>{registrationResult.serialKey.maxDispensers === 9999 ? '∞' : registrationResult.serialKey.maxDispensers} Dispensers</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/40">
                        <Users className="size-3" />
                        <span>{registrationResult.serialKey.maxUsers === 999 ? '∞' : registrationResult.serialKey.maxUsers} Users</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Crown className="size-3 text-orange-400" />
                      <span className="text-orange-400 font-semibold">{registrationResult.serialKey.expiresAt}</span>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-2.5">
                    <AlertCircle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-amber-400/80 leading-relaxed">
                      <strong>Save these credentials now!</strong> Your password and API key will not be shown again. Copy them to a secure location.
                    </span>
                  </div>

                  {/* Auto-Login Button */}
                  <button
                    onClick={handleLoginWithCredentials}
                    disabled={loading}
                    className="w-full h-10 rounded-lg fuel-gradient text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15 hover:shadow-teal-500/25 transition-all disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                    {loading ? 'Signing in...' : 'Enter FuelFlow OS'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-4 text-[11px] text-white/20">
              <div className="flex items-center gap-1">
                <Shield className="size-3" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="size-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Fingerprint className="size-3" />
                <span>Device Bound</span>
              </div>
            </div>
            <p className="text-center text-[10px] text-white/15">
              © {new Date().getFullYear()} ApexFlow Ecosystem. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
