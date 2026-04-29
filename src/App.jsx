import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Bus,
  Car,
  CheckCircle2,
  Clock3,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  User,
  Users,
  MessageSquare,
} from 'lucide-react'
import { useNotification } from './providers/NotificationProvider'
import { applicationAPI, authAPI, driverAPI, messageAPI, reportAPI, reviewAPI, riderAPI, sharedRideAPI } from './api/client'
import { useWebSocket } from './hooks/useWebSocket'

const sampleDriverListings = []
const sampleRiderRequests = []

function LoginModal({ isOpen, onClose, onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required.')
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address.')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }

      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Name is required.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        // Sign up
        const response = await authAPI.register(email, password, name)
        localStorage.setItem('rideboard_token', response.access_token)
        localStorage.setItem('rideboard_user', JSON.stringify(response.user))
        
        addNotification({
          type: 'success',
          title: 'Account Created',
          message: `Welcome, ${response.user.name}!`,
        })
        
        onLogin(response.user, response.access_token)
      } else {
        // Log in
        const response = await authAPI.login(email, password)
        localStorage.setItem('rideboard_token', response.access_token)
        localStorage.setItem('rideboard_user', JSON.stringify(response.user))
        
        addNotification({
          type: 'success',
          title: 'Logged In',
          message: `Welcome back, ${response.user.name}!`,
        })
        
        onLogin(response.user, response.access_token)
      }

      setEmail('')
      setName('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      const errorMsg = err.message || 'An error occurred'
      setError(errorMsg)
      addNotification({
        type: 'error',
        title: 'Auth Error',
        message: errorMsg,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <motion.div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 transition hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <motion.div
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
          )}

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@illinois.edu"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
            />
          </label>

          {isSignUp && (
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError('')
            setEmail('')
            setName('')
            setPassword('')
            setConfirmPassword('')
          }}
          className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </motion.div>
    </div>
  )
}

function AvatarName({
  name,
  avatarUrl,
  resolveAvatarUrl,
  subtitle = null,
  className = '',
  avatarClassName = 'h-10 w-10',
  nameClassName = 'text-sm font-semibold text-slate-900',
  subtitleClassName = 'text-xs text-slate-600',
}) {
  const displayName = name || 'Unknown user'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?'
  const resolvedAvatarUrl = avatarUrl ? resolveAvatarUrl(avatarUrl) : ''

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {resolvedAvatarUrl ? (
        <img
          src={resolvedAvatarUrl}
          alt={`${displayName} avatar`}
          className={`${avatarClassName} rounded-full object-cover ring-1 ring-slate-200`.trim()}
        />
      ) : (
        <div
          className={`${avatarClassName} flex items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 ring-1 ring-slate-200`.trim()}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className={`${nameClassName} truncate`.trim()}>{displayName}</p>
        {subtitle ? <div className={subtitleClassName}>{subtitle}</div> : null}
      </div>
    </div>
  )
}

function DepartureBadge({ departure, now }) {
  if (!departure) return null
  const d = new Date(departure)
  if (isNaN(d.getTime())) return null

  const diffMs = d.getTime() - now
  const diffMin = Math.round(diffMs / 60000)

  let text, cls

  if (diffMs < 0) {
    text = 'Departed'
    cls = 'bg-slate-100 text-slate-500'
  } else if (diffMin < 120) {
    text = `Leaving in ${diffMin}m`
    cls = 'bg-red-100 text-red-700'
  } else if (diffMin < 360) {
    const h = Math.floor(diffMin / 60)
    const m = diffMin % 60
    text = m > 0 ? `Leaving in ${h}h ${m}m` : `Leaving in ${h}h`
    cls = 'bg-orange-100 text-orange-700'
  } else {
    const today = new Date(now)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    if (d.toDateString() === tomorrow.toDateString()) {
      text = `Tomorrow ${timeStr}`
      cls = 'bg-slate-100 text-slate-600'
    } else if (d.toDateString() === today.toDateString()) {
      text = `Today ${timeStr}`
      cls = 'bg-slate-100 text-slate-600'
    } else {
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      text = `${dateStr} ${timeStr}`
      cls = 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(true)
  const [driverListings, setDriverListings] = useState([])
  const [riderRequests, setRiderRequests] = useState([])
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [driverForm, setDriverForm] = useState({
    route: 'UIUC → ORD',
    vehicle: '',
    seats: '2',
    pricePerSeat: '0',
    skills: '',
    labels: '',
    departure: '',
    pickupLocation: '',
    notes: '',
  })
  const [requestForm, setRequestForm] = useState({
    route: 'UIUC → ORD',
    departure: '',
    passengers: '1',
    details: '',
  })
  const [editingDriverId, setEditingDriverId] = useState(null)
  const [editingDriverForm, setEditingDriverForm] = useState({
    route: 'UIUC → ORD',
    vehicle: '',
    seats: '1',
    pricePerSeat: '0',
    skills: '',
    labels: '',
    departure: '',
    pickupLocation: '',
    notes: '',
  })
  const [isSavingDriverEdit, setIsSavingDriverEdit] = useState(false)
  const [editingRequestId, setEditingRequestId] = useState(null)
  const [editingRequestForm, setEditingRequestForm] = useState({
    route: 'UIUC → ORD',
    departure: '',
    passengers: '1',
    details: '',
  })
  const [isSavingRequestEdit, setIsSavingRequestEdit] = useState(false)
  const [applicationForm, setApplicationForm] = useState({
    driverTier: 'uiuc_verified',
    fullName: '',
    email: '',
    phoneNumber: '',
    vehicleInfo: '',
    emailVerified: false,
    smsVerified: false,
    idUploadStatus: 'coming_soon',
    availableSeats: '2',
    notes: '',
  })
  const [emailOtpInput, setEmailOtpInput] = useState('')
  const [smsOtpInput, setSmsOtpInput] = useState('')
  const [sentEmailOtp, setSentEmailOtp] = useState('')
  const [sentSmsOtp, setSentSmsOtp] = useState('')
  const [inboxMessages, setInboxMessages] = useState([])
  const [sentMessages, setSentMessages] = useState([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [adminChatMessages, setAdminChatMessages] = useState([])
  const [isLoadingAdminChats, setIsLoadingAdminChats] = useState(false)
  const [isMarkingReadId, setIsMarkingReadId] = useState(null)
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [conversationDraft, setConversationDraft] = useState('')
  const [isSendingConversationId, setIsSendingConversationId] = useState(null)
  const [adminApplications, setAdminApplications] = useState([])
  const [isLoadingAdminApplications, setIsLoadingAdminApplications] = useState(false)
  const [isUpdatingApplicationId, setIsUpdatingApplicationId] = useState(null)
  const [isDeletingApplicationId, setIsDeletingApplicationId] = useState(null)
  const [myApplications, setMyApplications] = useState([])
  const [isLoadingMyApplications, setIsLoadingMyApplications] = useState(false)
  const [adminDriverOverview, setAdminDriverOverview] = useState([])
  const [isLoadingAdminDriverOverview, setIsLoadingAdminDriverOverview] = useState(false)
  const [expandedDriverHistoryId, setExpandedDriverHistoryId] = useState(null)
  const [isDeletingAdminRideId, setIsDeletingAdminRideId] = useState(null)
  const [ratingDrafts, setRatingDrafts] = useState({})
  const [isSubmittingRatingId, setIsSubmittingRatingId] = useState(null)
  const [reportDrafts, setReportDrafts] = useState({})
  const [isSubmittingReportId, setIsSubmittingReportId] = useState(null)
  const [expandedDriverDetailsId, setExpandedDriverDetailsId] = useState(null)
  const [adminReports, setAdminReports] = useState([])
  const [isLoadingAdminReports, setIsLoadingAdminReports] = useState(false)
  const [isUpdatingAdminReportId, setIsUpdatingAdminReportId] = useState(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [mySharedRideRequests, setMySharedRideRequests] = useState([])
  const [driverSharedRideRequests, setDriverSharedRideRequests] = useState([])
  const [isLoadingSharedRideRequests, setIsLoadingSharedRideRequests] = useState(false)
  const [sharedRideDrafts, setSharedRideDrafts] = useState({})
  const [isSubmittingSharedRideId, setIsSubmittingSharedRideId] = useState(null)
  const [isUpdatingSharedRideRequestId, setIsUpdatingSharedRideRequestId] = useState(null)
  const { addNotification } = useNotification()
  const avatarInputRef = useRef(null)
  const conversationInputRef = useRef(null)

  const routes = [
    'All routes',
    'UIUC → ORD',
    'ORD → UIUC',
    'UIUC → Midway',
    'UIUC → Downtown Chicago',
  ]

  const routeFocusOptions = [
    'All routes',
    'UIUC-ORD',
    'ORD-UIUC',
    'UIUC-Midway',
    'UIUC-Downtown Chicago',
  ]

  const [selectedRoute, setSelectedRoute] = useState('All routes')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeUtilityPanel, setActiveUtilityPanel] = useState(null)
  const [showAllDriverListings, setShowAllDriverListings] = useState(false)
  const [adminHistorySearchTerm, setAdminHistorySearchTerm] = useState('')
  const [showAllAdminDriverHistory, setShowAllAdminDriverHistory] = useState(false)
  const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')
  const [now, setNow] = useState(() => Date.now())

  // Tick every minute so DepartureBadge labels stay current
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  // Load user and token from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('rideboard_user')
    const savedToken = localStorage.getItem('rideboard_token')
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
        setToken(savedToken)
      } catch (e) {
        localStorage.removeItem('rideboard_user')
        localStorage.removeItem('rideboard_token')
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      setApplicationForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
      }))
    }
  }, [user])

  const loadMessages = useCallback(
    async ({ showError = false } = {}) => {
      if (!token) {
        setInboxMessages([])
        setSentMessages([])
        return
      }

      setIsLoadingMessages(true)
      try {
        const [inbox, sent] = await Promise.all([
          messageAPI.getInbox(),
          messageAPI.getSent(),
        ])

        setInboxMessages(inbox)
        setSentMessages(sent)
      } catch (error) {
        if (showError) {
          addNotification({
            type: 'error',
            title: 'Could not load messages',
            message: error.message || 'Please try again.',
          })
        }
      } finally {
        setIsLoadingMessages(false)
      }
    },
    [addNotification, token]
  )

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const loadAdminChats = useCallback(
    async ({ showError = false } = {}) => {
      if (!token || !user?.is_admin) {
        setAdminChatMessages([])
        return
      }

      setIsLoadingAdminChats(true)
      try {
        const messages = await messageAPI.getAdminMessages()
        setAdminChatMessages(messages)
      } catch (error) {
        if (showError) {
          addNotification({
            type: 'error',
            title: 'Could not load chat monitor',
            message: error.message || 'Please try again.',
          })
        }
      } finally {
        setIsLoadingAdminChats(false)
      }
    },
    [addNotification, token, user?.is_admin]
  )

  useEffect(() => {
    loadAdminChats()
  }, [loadAdminChats])

  useEffect(() => {
    let isMounted = true

    const loadMarketplace = async () => {
      setIsLoadingMarketplace(true)
      try {
        const [drivers, requests] = await Promise.all([
          driverAPI.getListings(),
          riderAPI.getRequests(),
        ])

        if (!isMounted) return

        const mappedDrivers = drivers.map((driver) => mapDriverListing(driver))

        const mappedRequests = requests.map((request) => ({
          id: request.id,
          userId: request.user_id,
          route: request.route,
          rider: request.user_name || `Rider #${request.id}`,
          avatarUrl: request.user_avatar_url || '',
          timing: request.departure_time,
          passengers: request.passengers,
          details: request.details || `${request.passengers} passenger(s)`,
        }))

        setDriverListings(mappedDrivers)
        setRiderRequests(mappedRequests)
      } catch (error) {
        if (!isMounted) return
        setDriverListings(sampleDriverListings)
        setRiderRequests(sampleRiderRequests)
        addNotification({
          type: 'error',
          title: 'Could not load marketplace data',
          message: error.message || 'Please refresh and try again.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingMarketplace(false)
        }
      }
    }

    loadMarketplace()
    return () => {
      isMounted = false
    }
  }, [addNotification])

  const loadAdminApplications = useCallback(
    async ({ showError = false } = {}) => {
      if (!token || !user?.is_admin) {
        setAdminApplications([])
        return
      }

      setIsLoadingAdminApplications(true)
      try {
        const applications = await applicationAPI.getAllApplications()
        setAdminApplications(applications)
      } catch (error) {
        if (showError) {
          addNotification({
            type: 'error',
            title: 'Could not load applications',
            message: error.message || 'Please try again.',
          })
        }
      } finally {
        setIsLoadingAdminApplications(false)
      }
    },
    [addNotification, token, user?.is_admin]
  )

  useEffect(() => {
    loadAdminApplications()
  }, [loadAdminApplications])

  const loadMyApplications = useCallback(
    async ({ showError = false } = {}) => {
      if (!token || !user || user.is_admin) {
        setMyApplications([])
        return
      }

      setIsLoadingMyApplications(true)
      try {
        const applications = await applicationAPI.getMyApplications()
        setMyApplications(applications)
      } catch (error) {
        if (showError) {
          addNotification({
            type: 'error',
            title: 'Could not load your applications',
            message: error.message || 'Please try again.',
          })
        }
      } finally {
        setIsLoadingMyApplications(false)
      }
    },
    [addNotification, token, user]
  )

  useEffect(() => {
    loadMyApplications()
  }, [loadMyApplications])

  const loadSharedRideRequests = useCallback(
    async ({ showError = false } = {}) => {
      if (!token || !user) {
        setMySharedRideRequests([])
        setDriverSharedRideRequests([])
        return
      }

      setIsLoadingSharedRideRequests(true)
      try {
        const [mine, driverSide] = await Promise.all([
          sharedRideAPI.getMyRequests(),
          sharedRideAPI.getDriverRequests().catch(() => []),
        ])
        setMySharedRideRequests(mine)
        setDriverSharedRideRequests(driverSide)
      } catch (error) {
        if (showError) {
          addNotification({
            type: 'error',
            title: 'Could not load shared rides',
            message: error.message || 'Please try again.',
          })
        }
      } finally {
        setIsLoadingSharedRideRequests(false)
      }
    },
    [addNotification, token, user]
  )

  useEffect(() => {
    loadSharedRideRequests()
  }, [loadSharedRideRequests])

  const loadAdminDriverOverview = useCallback(
    async ({ showError = false } = {}) => {
      if (!token || !user?.is_admin) {
        setAdminDriverOverview([])
        return
      }

      setIsLoadingAdminDriverOverview(true)
      try {
        const overview = await driverAPI.getAdminOverview()
        setAdminDriverOverview(overview)
      } catch (error) {
        if (showError) {
          addNotification({
            type: 'error',
            title: 'Could not load driver history',
            message: error.message || 'Please try again.',
          })
        }
      } finally {
        setIsLoadingAdminDriverOverview(false)
      }
    },
    [addNotification, token, user?.is_admin]
  )

  useEffect(() => {
    loadAdminDriverOverview()
  }, [loadAdminDriverOverview])

  const loadAdminReports = useCallback(
    async ({ showError = false } = {}) => {
      if (!token || !user?.is_admin) {
        setAdminReports([])
        return
      }

      setIsLoadingAdminReports(true)
      try {
        const reports = await reportAPI.getAdminReports()
        setAdminReports(reports)
      } catch (error) {
        if (showError) {
          addNotification({
            type: 'error',
            title: 'Could not load reports',
            message: error.message || 'Please try again.',
          })
        }
      } finally {
        setIsLoadingAdminReports(false)
      }
    },
    [addNotification, token, user?.is_admin]
  )

  useEffect(() => {
    loadAdminReports()
  }, [loadAdminReports])

  // Set up WebSocket connection for real-time updates
  const handleWebSocketMessage = (message) => {
    if (message.type === 'message_sent' || message.type === 'contact_sent' || message.type === 'offer_sent') {
      loadMessages()
    }
  }

  const handleWebSocketNotification = (notification) => {
    // Handle notifications
    if (notification.type === 'new_message') {
      loadMessages()
      addNotification({
        type: 'info',
        title: 'New Message',
        message: `You have a new message from user ${notification.data.sender_id}`,
      })
    } else if (notification.type === 'driver_contacted') {
      addNotification({
        type: 'info',
        title: 'Driver Contacted',
        message: `A rider contacted you about ${notification.data.route}`,
      })
    } else if (notification.type === 'ride_offered') {
      addNotification({
        type: 'info',
        title: 'Ride Offered',
        message: `A driver offered a ride for ${notification.data.route}`,
      })
    }
  }

  const { connectionStatus } = useWebSocket(
    token,
    handleWebSocketMessage,
    handleWebSocketNotification
  )

  const buildThreadSubject = useCallback((listingId, requestId, route = '') => {
    const suffix = route ? ` ${route}` : ''
    return `[THREAD|listing:${listingId}|request:${requestId}]${suffix}`
  }, [])

  const parseThreadSubject = useCallback((subject) => {
    if (!subject) return null
    const match = subject.match(/^\[THREAD\|listing:(\d+)\|request:(\d+)\]/)
    if (!match) return null
    return {
      listingId: Number(match[1]),
      requestId: Number(match[2]),
    }
  }, [])

  const getSharedRideStatusMeta = useCallback((status) => {
    if (status === 'approved') {
      return {
        label: 'Approved - waiting for confirmation',
        badgeClass: 'bg-blue-100 text-blue-700',
      }
    }
    if (status === 'confirmed') {
      return {
        label: 'Ride confirmed',
        badgeClass: 'bg-green-100 text-green-700',
      }
    }
    if (status === 'rejected') {
      return {
        label: 'Rejected',
        badgeClass: 'bg-red-100 text-red-700',
      }
    }
    if (status === 'completed') {
      return {
        label: 'Ride completed',
        badgeClass: 'bg-emerald-100 text-emerald-700',
      }
    }
    if (status === 'cancelled') {
      return {
        label: 'Request cancelled',
        badgeClass: 'bg-slate-200 text-slate-700',
      }
    }
    return {
      label: 'Pending approval',
      badgeClass: 'bg-amber-100 text-amber-700',
    }
  }, [])

  const allSharedRideRequests = useMemo(() => {
    const byId = new Map()
    for (const item of [...mySharedRideRequests, ...driverSharedRideRequests]) {
      byId.set(item.id, item)
    }
    return Array.from(byId.values())
  }, [mySharedRideRequests, driverSharedRideRequests])

  const allDirectMessages = useMemo(() => {
    const byId = new Map()
    for (const message of [...inboxMessages, ...sentMessages]) {
      byId.set(message.id, message)
    }
    return Array.from(byId.values())
  }, [inboxMessages, sentMessages])

  const driverListingById = useMemo(() => {
    const byId = new Map()
    for (const listing of driverListings) {
      byId.set(listing.id, listing)
    }
    return byId
  }, [driverListings])

  const threadConversations = useMemo(() => {
    return allSharedRideRequests
      .map((request) => {
        const messages = allDirectMessages
          .filter((message) => {
            const parsed = parseThreadSubject(message.subject)
            return parsed && parsed.requestId === request.id && parsed.listingId === request.driver_listing_id
          })
          .sort((left, right) => new Date(left.created_at) - new Date(right.created_at))

        const participants = [
          {
            id: request.driver_user_id,
            name: request.driver_user_id === user?.id ? user?.name || 'You' : 'Driver',
            avatarUrl: request.driver_user_id === user?.id ? user?.avatar_url || '' : '',
          },
          {
            id: request.rider_user_id,
            name: request.rider_name || `User #${request.rider_user_id}`,
            avatarUrl: request.rider_avatar_url || '',
          },
        ]

        const lastMessage = messages[messages.length - 1]
        const listing = driverListingById.get(request.driver_listing_id)
        const hasUnread = messages.some(
          (message) => message.recipient_id === user?.id && !message.is_read
        )

        return {
          id: request.id,
          request,
          messages,
          participants,
          route: request.driver_route || listing?.route || `Listing #${request.driver_listing_id}`,
          departureTime: request.driver_departure_time || listing?.departure || null,
          seats: request.seats_requested,
          pricePerSeat: listing?.pricePerSeat,
          driverName: listing?.name || 'Driver',
          driverAvatarUrl: listing?.avatarUrl || '',
          status: request.status,
          hasUnread,
          lastActivityAt: lastMessage?.created_at || request.updated_at || request.created_at,
        }
      })
      .sort((left, right) => new Date(right.lastActivityAt || 0) - new Date(left.lastActivityAt || 0))
  }, [allSharedRideRequests, allDirectMessages, driverListingById, parseThreadSubject, user?.avatar_url, user?.id, user?.name])

  const unreadInboxCount = useMemo(
    () => threadConversations.reduce((sum, conversation) => sum + (conversation.hasUnread ? 1 : 0), 0),
    [threadConversations]
  )

  const selectedConversation = useMemo(
    () => threadConversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [threadConversations, selectedConversationId]
  )

  useEffect(() => {
    if (!threadConversations.length) {
      setSelectedConversationId(null)
      return
    }

    if (!selectedConversationId || !threadConversations.some((item) => item.id === selectedConversationId)) {
      setSelectedConversationId(threadConversations[0].id)
    }
  }, [selectedConversationId, threadConversations])

  useEffect(() => {
    if (!selectedConversation) return
    const unreadIds = selectedConversation.messages
      .filter((message) => message.recipient_id === user?.id && !message.is_read)
      .map((message) => message.id)

    if (unreadIds.length === 0) return

    Promise.all(unreadIds.map((id) => messageAPI.markAsRead(id)))
      .then(() => loadMessages())
      .catch(() => null)
  }, [loadMessages, selectedConversation, user?.id])

  useEffect(() => {
    if (activeUtilityPanel === 'messages' && selectedConversation && conversationInputRef.current) {
      conversationInputRef.current.focus()
    }
  }, [activeUtilityPanel, selectedConversation])

  const approvedSharedRideListingIds = useMemo(() => {
    if (!user) return new Set()
    return new Set(
      mySharedRideRequests
        .filter((request) => ['approved', 'confirmed', 'completed'].includes(request.status))
        .map((request) => request.driver_listing_id)
    )
  }, [mySharedRideRequests, user])

  const lockedDriverListingIds = useMemo(() => {
    return new Set(
      driverSharedRideRequests
        .filter((request) => ['confirmed', 'completed'].includes(request.status))
        .map((request) => request.driver_listing_id)
    )
  }, [driverSharedRideRequests])

  const adminChatConversations = useMemo(() => {
    const conversationMap = new Map()

    for (const message of adminChatMessages) {
      const participantIds = [message.sender_id, message.recipient_id].sort((left, right) => left - right)
      const key = `${participantIds[0]}-${participantIds[1]}`

      if (!conversationMap.has(key)) {
        const firstLabel = message.sender_id === participantIds[0]
          ? (message.sender_name || `User #${message.sender_id}`)
          : (message.recipient_name || `User #${message.recipient_id}`)
        const secondLabel = message.sender_id === participantIds[1]
          ? (message.sender_name || `User #${message.sender_id}`)
          : (message.recipient_name || `User #${message.recipient_id}`)
        const firstAvatarUrl = message.sender_id === participantIds[0]
          ? message.sender_avatar_url
          : message.recipient_avatar_url
        const secondAvatarUrl = message.sender_id === participantIds[1]
          ? message.sender_avatar_url
          : message.recipient_avatar_url

        conversationMap.set(key, {
          key,
          participantAId: participantIds[0],
          participantBId: participantIds[1],
          participantALabel: firstLabel,
          participantAAvatarUrl: firstAvatarUrl,
          participantBLabel: secondLabel,
          participantBAvatarUrl: secondAvatarUrl,
          messages: [],
        })
      }

      conversationMap.get(key).messages.push(message)
    }

    return Array.from(conversationMap.values())
      .map((conversation) => ({
        ...conversation,
        messages: conversation.messages.sort(
          (left, right) => new Date(left.created_at) - new Date(right.created_at)
        ),
      }))
      .sort((left, right) => {
        const leftLast = left.messages[left.messages.length - 1]
        const rightLast = right.messages[right.messages.length - 1]
        return new Date(rightLast?.created_at || 0) - new Date(leftLast?.created_at || 0)
      })
  }, [adminChatMessages])

  const adminRideLedger = useMemo(() => {
    return adminDriverOverview
      .flatMap((driverHistory) =>
        (driverHistory.rides || []).map((ride) => ({
          ...ride,
          driverUserId: driverHistory.driver_user_id,
          driverName: driverHistory.driver_name,
          driverAvatarUrl: driverHistory.driver_avatar_url,
          driverEmail: driverHistory.driver_email,
        }))
      )
      .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
  }, [adminDriverOverview])

  const handleLogin = (userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    setShowLoginModal(false)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setActiveUtilityPanel(null)
    localStorage.removeItem('rideboard_user')
    localStorage.removeItem('rideboard_token')
    setInboxMessages([])
    setSentMessages([])
    addNotification({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been logged out successfully.',
    })
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingAvatar(true)
      const updatedUser = await authAPI.uploadAvatar(file)
      setUser(updatedUser)
      localStorage.setItem('rideboard_user', JSON.stringify(updatedUser))
      addNotification({
        type: 'success',
        title: 'Avatar updated',
        message: 'Your profile image was uploaded successfully.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Avatar upload failed',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const requireAuth = () => {
    if (!user) {
      setShowLoginModal(true)
      return false
    }
    return true
  }

  const handleContactDriver = async (driver) => {
    if (!requireAuth()) return
    if (!driver.userId || driver.userId === user.id) {
      addNotification({
        type: 'warning',
        title: 'Contact unavailable',
        message: 'This listing cannot be contacted from this account.',
      })
      return
    }

    const defaultBody = `Hi! I am interested in your ${driver.route} ride (${driver.departure}).`

    try {
      const existing = mySharedRideRequests.find(
        (request) =>
          request.driver_listing_id === driver.id &&
          !['rejected', 'cancelled', 'completed'].includes(request.status)
      )

      if (existing) {
        setSelectedConversationId(existing.id)
      } else {
        const createdRequest = await sharedRideAPI.createRequest({
          driver_listing_id: driver.id,
          seats_requested: 1,
          message: '',
        })

        try {
          await sendThreadSystemMessage(
            createdRequest,
            `${user.name || 'A rider'} sent a request`
          )
        } catch {
        }

        setSelectedConversationId(createdRequest.id)
      }

      setConversationDraft(defaultBody)
      setActiveUtilityPanel('messages')
      await Promise.all([loadSharedRideRequests(), loadMessages()])

      addNotification({
        type: 'success',
        title: 'Connected to message',
        message: 'You are now in the driver conversation thread.',
      })
    } catch (error) {
      addNotification({
        type: 'warning',
        title: 'Using existing request',
        message:
          error.message?.includes('active shared ride request')
            ? 'Opening your existing ride conversation thread.'
            : error.message || 'Please try again.',
      })

      if (error.message?.includes('active shared ride request')) {
        try {
          const mine = await sharedRideAPI.getMyRequests()
          setMySharedRideRequests(mine)
          const existing = mine.find(
            (request) =>
              request.driver_listing_id === driver.id &&
              !['rejected', 'cancelled', 'completed'].includes(request.status)
          )
          if (existing) {
            setSelectedConversationId(existing.id)
            setConversationDraft(defaultBody)
            setActiveUtilityPanel('messages')
            loadMessages()
          }
        } catch {
        }
      }
    } finally {
    }
  }

  const handleToggleDriverDetails = (driverId) => {
    setExpandedDriverDetailsId((prev) => (prev === driverId ? null : driverId))
  }

  const handleToggleContactDraft = (driver) => {
    handleContactDriver(driver)
  }

  const handleOfferRide = async (request) => {
    if (!requireAuth()) return
    if (!request.userId || request.userId === user.id) {
      addNotification({
        type: 'warning',
        title: 'Offer unavailable',
        message: 'This request cannot be contacted from this account.',
      })
      return
    }

    try {
      await messageAPI.sendMessage(
        request.userId,
        `Ride offer: ${request.route}`,
        `Hi! I can offer a ride for ${request.route}. Timing: ${request.timing}.`
      )
      addNotification({
        type: 'success',
        title: 'Offer sent',
        message: 'Your ride offer was sent to the requester.',
      })
      loadMessages()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not send offer',
        message: error.message || 'Please try again.',
      })
    }
  }

  const refreshDriverListings = async () => {
    const drivers = await driverAPI.getListings()
    const mappedDrivers = drivers.map((item) => mapDriverListing(item))
    setDriverListings(mappedDrivers)
  }

  const sendThreadSystemMessage = useCallback(
    async (request, body) => {
      if (!request || !body?.trim() || !user) return
      const recipientId =
        request.driver_user_id === user.id ? request.rider_user_id : request.driver_user_id
      if (!recipientId) return

      await messageAPI.sendMessage(
        recipientId,
        buildThreadSubject(request.driver_listing_id, request.id, request.driver_route || ''),
        `[SYSTEM] ${body.trim()}`
      )
    },
    [buildThreadSubject, user]
  )

  const handleCreateSharedRideRequest = async (driver) => {
    if (!requireAuth()) return

    const draft = sharedRideDrafts[driver.id] || { seats: '1', message: '' }
    const seatsRequested = Number(draft.seats)
    if (!seatsRequested || seatsRequested < 1 || seatsRequested > driver.seats) {
      addNotification({
        type: 'error',
        title: 'Invalid seat request',
        message: `Choose between 1 and ${driver.seats} seat(s).`,
      })
      return
    }

    try {
      setIsSubmittingSharedRideId(driver.id)
      const createdRequest = await sharedRideAPI.createRequest({
        driver_listing_id: driver.id,
        seats_requested: seatsRequested,
        message: draft.message,
      })
      try {
        await sendThreadSystemMessage(
          createdRequest,
          `${user.name || 'A rider'} sent a request`
        )
      } catch {
      }
      setSharedRideDrafts((prev) => ({ ...prev, [driver.id]: { seats: '1', message: '' } }))
      addNotification({
        type: 'success',
        title: 'Shared ride requested',
        message: 'Your shared ride request was sent to the driver.',
      })
      loadSharedRideRequests()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not request shared ride',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsSubmittingSharedRideId(null)
    }
  }

  const handleSharedRideConversationAction = async (request, status) => {
    if (!request) return

    const actionLabels = {
      approved: 'approved this request',
      rejected: 'rejected this request',
      confirmed: 'confirmed the ride',
      cancelled: 'cancelled this request',
      completed: 'marked this ride as completed',
    }

    try {
      setIsUpdatingSharedRideRequestId(request.id)
      await sharedRideAPI.updateRequestStatus(request.id, status)
      try {
        await sendThreadSystemMessage(
          request,
          `${user?.name || 'A user'} ${actionLabels[status] || `updated this request to ${status}`}`
        )
      } catch {
      }
      addNotification({
        type: 'success',
        title: 'Shared ride updated',
        message: `Shared ride request marked as ${status}.`,
      })
      await Promise.all([loadSharedRideRequests(), refreshDriverListings(), loadAdminDriverOverview(), loadMessages()])
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not update shared ride',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsUpdatingSharedRideRequestId(null)
    }
  }

  const handleApplicationSubmit = async (event) => {
    event.preventDefault()
    if (!requireAuth()) return

    const seats = Number(applicationForm.availableSeats)
    const normalizedEmail = applicationForm.email.trim().toLowerCase()
    const isUiucTier = applicationForm.driverTier === 'uiuc_verified'

    if (!applicationForm.fullName.trim() || !normalizedEmail || !applicationForm.phoneNumber.trim() || !applicationForm.vehicleInfo.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing fields',
        message: 'Please complete full name, email, phone number, and vehicle info.',
      })
      return
    }
    if (isUiucTier && !normalizedEmail.endsWith('@illinois.edu')) {
      addNotification({
        type: 'error',
        title: 'Invalid UIUC email',
        message: 'Only @illinois.edu emails can access UIUC Verified Driver tier.',
      })
      return
    }
    if (isUiucTier && !applicationForm.emailVerified) {
      addNotification({
        type: 'error',
        title: 'Email not verified',
        message: 'Verify your UIUC email before submitting this tier.',
      })
      return
    }
    if (!isUiucTier && !applicationForm.smsVerified) {
      addNotification({
        type: 'error',
        title: 'Phone not verified',
        message: 'SMS verification is required for Community Driver tier.',
      })
      return
    }
    if (!seats || seats < 1 || seats > 6) {
      addNotification({
        type: 'error',
        title: 'Invalid seats',
        message: 'Available seats must be between 1 and 6.',
      })
      return
    }

    try {
      await applicationAPI.submitApplication({
        full_name: applicationForm.fullName,
        email: normalizedEmail,
        driver_tier: applicationForm.driverTier,
        phone_number: applicationForm.phoneNumber,
        vehicle_info: applicationForm.vehicleInfo,
        email_verified: applicationForm.emailVerified,
        sms_verified: applicationForm.smsVerified,
        id_upload_status: applicationForm.idUploadStatus,
        primary_route: 'All routes',
        available_seats: seats,
        notes: applicationForm.notes,
      })
      addNotification({
        type: 'success',
        title: 'Application saved',
        message: `${getDriverTierLabel(applicationForm.driverTier)} application submitted successfully.`,
      })
      loadMyApplications()
      loadAdminApplications()
      setApplicationForm((prev) => ({
        ...prev,
        driverTier: 'uiuc_verified',
        phoneNumber: '',
        vehicleInfo: '',
        emailVerified: false,
        smsVerified: false,
        idUploadStatus: 'coming_soon',
        availableSeats: '2',
        notes: '',
      }))
      setEmailOtpInput('')
      setSmsOtpInput('')
      setSentEmailOtp('')
      setSentSmsOtp('')
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Submission failed',
        message: error.message || 'Could not submit your application.',
      })
    }
  }

  const handleApplicationStatusUpdate = async (applicationId, status) => {
    try {
      setIsUpdatingApplicationId(applicationId)
      const updated = await applicationAPI.updateApplicationStatus(applicationId, status)
      setAdminApplications((prev) =>
        prev.map((application) =>
          application.id === applicationId ? { ...application, status: updated.status } : application
        )
      )
      addNotification({
        type: 'success',
        title: 'Application updated',
        message: `Application marked as ${updated.status}.`,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Status update failed',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsUpdatingApplicationId(null)
    }
  }

  const handleDeleteApplication = async (applicationId) => {
    try {
      setIsDeletingApplicationId(applicationId)
      await applicationAPI.deleteApplication(applicationId)
      setAdminApplications((prev) => prev.filter((application) => application.id !== applicationId))
      addNotification({
        type: 'success',
        title: 'Application deleted',
        message: 'The application was removed successfully.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message || 'Could not delete application.',
      })
    } finally {
      setIsDeletingApplicationId(null)
    }
  }

  const handleAdminDeleteRide = async (rideId) => {
    try {
      setIsDeletingAdminRideId(rideId)
      await driverAPI.deleteListing(rideId)
      setDriverListings((prev) => prev.filter((driver) => driver.id !== rideId))
      await loadAdminDriverOverview()
      addNotification({
        type: 'success',
        title: 'Ride deleted',
        message: 'The ride listing was removed from driver history.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message || 'Could not delete ride listing.',
      })
    } finally {
      setIsDeletingAdminRideId(null)
    }
  }

  const handleSubmitRideRating = async (driver) => {
    if (!requireAuth()) return

    const draft = ratingDrafts[driver.id] || { rating: '5', comment: '' }
    const rating = Number(draft.rating)
    if (!rating || rating < 1 || rating > 5) {
      addNotification({
        type: 'error',
        title: 'Invalid rating',
        message: 'Please choose a rating between 1 and 5.',
      })
      return
    }

    try {
      setIsSubmittingRatingId(driver.id)
      await reviewAPI.createReview({
        driver_user_id: driver.userId,
        driver_listing_id: driver.id,
        rating,
        comment: draft.comment,
      })
      setRatingDrafts((prev) => ({ ...prev, [driver.id]: { rating: '5', comment: '' } }))
      addNotification({
        type: 'success',
        title: 'Rating submitted',
        message: 'Thanks for rating this ride experience.',
      })

      const drivers = await driverAPI.getListings()
      const mappedDrivers = drivers.map((item) => mapDriverListing(item))
      setDriverListings(mappedDrivers)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not submit rating',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsSubmittingRatingId(null)
    }
  }

  const handleSubmitRideReport = async (driver) => {
    if (!requireAuth()) return

    const draft = reportDrafts[driver.id] || { category: 'safety', details: '' }
    if (!draft.details.trim()) {
      addNotification({
        type: 'error',
        title: 'Report details required',
        message: 'Please describe what happened.',
      })
      return
    }

    try {
      setIsSubmittingReportId(driver.id)
      await reportAPI.createReport({
        against_user_id: driver.userId,
        driver_listing_id: driver.id,
        category: draft.category,
        details: draft.details,
      })
      setReportDrafts((prev) => ({ ...prev, [driver.id]: { category: 'safety', details: '' } }))
      addNotification({
        type: 'success',
        title: 'Report sent to admin',
        message: 'Your report has been submitted for admin review.',
      })
      loadAdminReports()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not submit report',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsSubmittingReportId(null)
    }
  }

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      setIsUpdatingAdminReportId(reportId)
      const updated = await reportAPI.updateReportStatus(reportId, status)
      setAdminReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status: updated.status } : report
        )
      )
      addNotification({
        type: 'success',
        title: 'Report updated',
        message: `Report marked as ${updated.status}.`,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not update report',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsUpdatingAdminReportId(null)
    }
  }

  const handleCreateDriverListing = async (event) => {
    event.preventDefault()
    if (!requireAuth()) return

    const seats = Number(driverForm.seats)
    const pricePerSeat = Number(driverForm.pricePerSeat)
    if (!driverForm.route.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing route',
        message: 'Route is required.',
      })
      return
    }
    if (!driverForm.vehicle.trim() || !driverForm.departure.trim() || !driverForm.pickupLocation.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing fields',
        message: 'Vehicle, departure, and pickup location are required.',
      })
      return
    }
    if (!seats || seats < 1 || seats > 6) {
      addNotification({
        type: 'error',
        title: 'Invalid seats',
        message: 'Available seats must be between 1 and 6.',
      })
      return
    }
    if (Number.isNaN(pricePerSeat) || pricePerSeat < 0) {
      addNotification({
        type: 'error',
        title: 'Invalid cost',
        message: 'Cost per seat must be 0 or higher.',
      })
      return
    }

    try {
      setIsSubmittingDriver(true)
      const created = await driverAPI.createListing({
        route: driverForm.route,
        vehicle: driverForm.vehicle,
        available_seats: seats,
        departure_time: driverForm.departure,
        price_per_seat: pricePerSeat,
        skills: driverForm.skills,
        labels: driverForm.labels,
        pickup_location: driverForm.pickupLocation,
        notes: driverForm.notes,
      })

      const mappedDriver = mapDriverListing(created, {
        name: user?.name || `Driver #${created.id}`,
        avatarUrl: user?.avatar_url || '',
      })

      setDriverListings((prev) => [mappedDriver, ...prev])
      setDriverForm({
        route: 'UIUC → ORD',
        vehicle: '',
        seats: '2',
        pricePerSeat: '0',
        skills: '',
        labels: '',
        departure: '',
        pickupLocation: '',
        notes: '',
      })
      loadAdminDriverOverview()
      addNotification({
        type: 'success',
        title: 'Listing posted',
        message: 'Your driver listing is now live.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not post listing',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsSubmittingDriver(false)
    }
  }

  const handleCreateRiderRequest = async (event) => {
    event.preventDefault()
    if (!requireAuth()) return

    const passengers = Number(requestForm.passengers)
    if (!requestForm.route.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing route',
        message: 'Route is required.',
      })
      return
    }
    if (!requestForm.departure.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing departure',
        message: 'Departure timing is required.',
      })
      return
    }
    if (!passengers || passengers < 1 || passengers > 6) {
      addNotification({
        type: 'error',
        title: 'Invalid passengers',
        message: 'Passengers must be between 1 and 6.',
      })
      return
    }

    try {
      setIsSubmittingRequest(true)
      const created = await riderAPI.createRequest({
        route: requestForm.route,
        departure_time: requestForm.departure,
        passengers,
        details: requestForm.details,
      })

      const mappedRequest = {
        id: created.id,
        userId: created.user_id,
        route: created.route,
        rider: created.user_name || user?.name || `Rider #${created.id}`,
        avatarUrl: created.user_avatar_url || user?.avatar_url || '',
        timing: created.departure_time,
        passengers: created.passengers,
        details: created.details || `${created.passengers} passenger(s)`,
      }

      setRiderRequests((prev) => [mappedRequest, ...prev])
      setRequestForm({
        route: 'UIUC → ORD',
        departure: '',
        passengers: '1',
        details: '',
      })
      addNotification({
        type: 'success',
        title: 'Request posted',
        message: 'Your ride request is now visible.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not post request',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  const handleDeleteDriverListing = async (driver) => {
    if (!requireAuth()) return
    if (driver.userId !== user?.id && !user?.is_admin) return

    try {
      await driverAPI.deleteListing(driver.id)
      setDriverListings((prev) => prev.filter((item) => item.id !== driver.id))
      loadAdminDriverOverview()
      if (editingDriverId === driver.id) {
        setEditingDriverId(null)
      }
      addNotification({
        type: 'success',
        title: 'Listing removed',
        message: 'Your driver listing was deleted.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message || 'Could not delete listing.',
      })
    }
  }

  const handleEditDriverListing = async (driver) => {
    if (!requireAuth()) return
    if (driver.userId !== user?.id && !user?.is_admin) return

    if (lockedDriverListingIds.has(driver.id)) {
      addNotification({
        type: 'warning',
        title: 'Editing locked',
        message: 'Price, departure time, seats, pickup location, and notes can only be edited before a ride is confirmed.',
      })
      return
    }

    setEditingDriverId(driver.id)
    setEditingDriverForm({
      route: driver.route,
      vehicle: driver.vehicle,
      seats: String(driver.seats),
      pricePerSeat: String(driver.pricePerSeat || 0),
      skills: driver.skills || '',
      labels: driver.labels || '',
      departure: driver.departure,
      pickupLocation: driver.pickupLocation || '',
      notes: driver.notesRaw || '',
    })
  }

  const handleCancelDriverEdit = () => {
    setEditingDriverId(null)
  }

  const handleSaveDriverEdit = async (driverId) => {
    if (!requireAuth()) return

    const seats = Number(editingDriverForm.seats)
    const pricePerSeat = Number(editingDriverForm.pricePerSeat)
    if (!editingDriverForm.route.trim() || !editingDriverForm.vehicle.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing fields',
        message: 'Route and vehicle are required.',
      })
      return
    }
    if (!seats || seats < 1 || seats > 6) {
      addNotification({
        type: 'error',
        title: 'Invalid seats',
        message: 'Available seats must be between 1 and 6.',
      })
      return
    }
    if (Number.isNaN(pricePerSeat) || pricePerSeat < 0) {
      addNotification({
        type: 'error',
        title: 'Invalid cost',
        message: 'Cost per seat must be 0 or higher.',
      })
      return
    }
    if (!editingDriverForm.departure.trim() || !editingDriverForm.pickupLocation.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing fields',
        message: 'Departure and pickup location are required.',
      })
      return
    }

    try {
      setIsSavingDriverEdit(true)
      const updated = await driverAPI.updateListing(driverId, {
        route: editingDriverForm.route,
        vehicle: editingDriverForm.vehicle,
        available_seats: seats,
        departure_time: editingDriverForm.departure,
        price_per_seat: pricePerSeat,
        skills: editingDriverForm.skills,
        labels: editingDriverForm.labels,
        pickup_location: editingDriverForm.pickupLocation,
        notes: editingDriverForm.notes,
      })

      setDriverListings((prev) =>
        prev.map((item) =>
          item.id === driverId
            ? {
                ...item,
                ...mapDriverListing(updated, {
                  name: item.name,
                  avatarUrl: item.avatarUrl || '',
                }),
              }
            : item
        )
      )
      setEditingDriverId(null)
      loadAdminDriverOverview()

      addNotification({
        type: 'success',
        title: 'Listing updated',
        message: 'Your driver listing was updated.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: error.message || 'Could not update listing.',
      })
    } finally {
      setIsSavingDriverEdit(false)
    }
  }

  const handleDeleteRiderRequest = async (request) => {
    if (!requireAuth()) return
    if (request.userId !== user?.id && !user?.is_admin) return

    try {
      await riderAPI.deleteRequest(request.id)
      setRiderRequests((prev) => prev.filter((item) => item.id !== request.id))
      if (editingRequestId === request.id) {
        setEditingRequestId(null)
      }
      addNotification({
        type: 'success',
        title: 'Request removed',
        message: 'Your ride request was deleted.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message || 'Could not delete request.',
      })
    }
  }

  const handleEditRiderRequest = async (request) => {
    if (!requireAuth()) return
    if (request.userId !== user?.id && !user?.is_admin) return

    setEditingRequestId(request.id)
    setEditingRequestForm({
      route: request.route,
      departure: request.timing,
      passengers: String(request.passengers || 1),
      details: request.details || '',
    })
  }

  const handleCancelRiderRequestEdit = () => {
    setEditingRequestId(null)
  }

  const handleSaveRiderRequestEdit = async (requestId) => {
    if (!requireAuth()) return

    const passengers = Number(editingRequestForm.passengers)
    if (!editingRequestForm.route.trim() || !editingRequestForm.departure.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing fields',
        message: 'Route and departure are required.',
      })
      return
    }
    if (!passengers || passengers < 1 || passengers > 6) {
      addNotification({
        type: 'error',
        title: 'Invalid passengers',
        message: 'Passengers must be between 1 and 6.',
      })
      return
    }

    try {
      setIsSavingRequestEdit(true)
      const updated = await riderAPI.updateRequest(requestId, {
        route: editingRequestForm.route,
        departure_time: editingRequestForm.departure,
        passengers,
        details: editingRequestForm.details,
      })

      setRiderRequests((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
                ...item,
                rider: updated.user_name || item.rider,
                avatarUrl: updated.user_avatar_url || item.avatarUrl || '',
                route: updated.route,
                timing: updated.departure_time,
                passengers: updated.passengers,
                details: updated.details || `${updated.passengers} passenger(s)`,
              }
            : item
        )
      )
      setEditingRequestId(null)

      addNotification({
        type: 'success',
        title: 'Request updated',
        message: 'Your ride request was updated.',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: error.message || 'Could not update request.',
      })
    } finally {
      setIsSavingRequestEdit(false)
    }
  }

  const filteredDrivers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    const normalizeRouteText = (value) =>
      (value || '')
        .toLowerCase()
        .replace(/(→|->|—|–)/g, '-')
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9-]/g, '')

    const routeFilter = normalizeRouteText(selectedRoute)

    return driverListings.filter((driver) => {
      const normalizedDriverRoute = normalizeRouteText(driver.route)
      const routeMatch =
        routeFilter.length === 0 ||
        routeFilter === 'allroutes' ||
        routeFilter === 'all-routes' ||
        normalizedDriverRoute.includes(routeFilter)

      const keywordMatch =
        keyword.length === 0 ||
        [driver.name, driver.route, driver.vehicle, driver.note]
          .join(' ')
          .toLowerCase()
          .includes(keyword)

      const departureTimestamp = driver.departure ? new Date(driver.departure).getTime() : NaN
      const isDeparted = Number.isFinite(departureTimestamp) && departureTimestamp < now

      return routeMatch && keywordMatch && !isDeparted
    })
  }, [driverListings, searchTerm, selectedRoute, now])

  const upcomingDriverCount = useMemo(() => {
    return driverListings.filter((driver) => {
      const departureTimestamp = driver.departure ? new Date(driver.departure).getTime() : NaN
      const isDeparted = Number.isFinite(departureTimestamp) && departureTimestamp < now
      return !isDeparted
    }).length
  }, [driverListings, now])

  const hasActiveDriverFilter = useMemo(() => {
    const routeFilter = selectedRoute.trim().toLowerCase()
    const hasRouteFilter =
      routeFilter.length > 0 &&
      routeFilter !== 'all routes' &&
      routeFilter !== 'allroutes' &&
      routeFilter !== 'all-routes'
    return searchTerm.trim().length > 0 || hasRouteFilter
  }, [searchTerm, selectedRoute])

  const visibleDrivers = useMemo(() => {
    if (showAllDriverListings) return filteredDrivers
    return filteredDrivers.slice(0, 6)
  }, [filteredDrivers, showAllDriverListings])

  const filteredRiderRequests = useMemo(() => {
    return riderRequests.filter((request) => {
      const departureTimestamp = request.timing ? new Date(request.timing).getTime() : NaN
      const isDeparted = Number.isFinite(departureTimestamp) && departureTimestamp < now
      return !isDeparted
    })
  }, [riderRequests, now])

  const filteredAdminDriverOverview = useMemo(() => {
    const keyword = adminHistorySearchTerm.trim().toLowerCase()
    if (!keyword) return adminDriverOverview

    return adminDriverOverview.filter((history) =>
      [history.driver_name, history.driver_email]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    )
  }, [adminDriverOverview, adminHistorySearchTerm])

  const visibleAdminDriverOverview = useMemo(() => {
    if (showAllAdminDriverHistory) return filteredAdminDriverOverview
    return filteredAdminDriverOverview.slice(0, 5)
  }, [filteredAdminDriverOverview, showAllAdminDriverHistory])

  const canPostDriverListing = useMemo(() => {
    if (!user) return false
    if (user.is_admin) return true
    return myApplications.some((application) => application.status === 'approved')
  }, [myApplications, user])

  const approvedDriverDirectory = useMemo(() => {
    const approved = adminApplications.filter((application) => application.status === 'approved')
    const latestByUser = new Map()

    for (const application of approved) {
      const existing = latestByUser.get(application.user_id)
      if (!existing || new Date(application.created_at) > new Date(existing.created_at)) {
        latestByUser.set(application.user_id, application)
      }
    }

    return Array.from(latestByUser.values()).sort((left, right) =>
      left.full_name.localeCompare(right.full_name)
    )
  }, [adminApplications])

  const adminDriverDirectory = useMemo(() => {
    const byUserId = new Map()

    for (const application of adminApplications) {
      const existing = byUserId.get(application.user_id)
      if (!existing || new Date(application.created_at) > new Date(existing.submittedAt || 0)) {
        byUserId.set(application.user_id, {
          userId: application.user_id,
          name: application.full_name,
          avatarUrl: application.user_avatar_url || '',
          email: application.email,
          driverTier: application.driver_tier,
          emailVerified: application.email_verified,
          smsVerified: application.sms_verified,
          status: application.status,
          primaryRoute: 'All routes',
          seats: application.available_seats,
          submittedAt: application.created_at,
          totalRides: 0,
          activeRides: 0,
        })
      }
    }

    for (const history of adminDriverOverview) {
      const existing = byUserId.get(history.driver_user_id)
      if (existing) {
        byUserId.set(history.driver_user_id, {
          ...existing,
          avatarUrl: existing.avatarUrl || history.driver_avatar_url || '',
          totalRides: history.total_rides,
          activeRides: history.active_rides,
        })
      } else {
        byUserId.set(history.driver_user_id, {
          userId: history.driver_user_id,
          name: history.driver_name,
          avatarUrl: history.driver_avatar_url || '',
          email: history.driver_email,
          driverTier: 'uiuc_verified',
          emailVerified: true,
          smsVerified: false,
          status: 'approved',
          primaryRoute: '-',
          seats: '-',
          submittedAt: history.rides?.[0]?.created_at || null,
          totalRides: history.total_rides,
          activeRides: history.active_rides,
        })
      }
    }

    return Array.from(byUserId.values()).sort((left, right) => left.name.localeCompare(right.name))
  }, [adminApplications, adminDriverOverview])

  const resolveAvatarUrl = useCallback(
    (avatarUrl) => {
      if (!avatarUrl) return ''
      if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl
      return `${backendBaseUrl}${avatarUrl}`
    },
    [backendBaseUrl]
  )

  const cardMotion = {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.35 },
    viewport: { once: true, amount: 0.15 },
  }

  const DISPLAY_TIMEZONE = 'America/Chicago'

  const formatMessageTime = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown time'

    return date.toLocaleString([], {
      timeZone: DISPLAY_TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  }

  const getApplicationStatusClass = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
  }

  const getReportStatusClass = (status) => {
    if (status === 'resolved') return 'bg-green-100 text-green-700'
    if (status === 'reviewing') return 'bg-blue-100 text-blue-700'
    return 'bg-amber-100 text-amber-700'
  }

  const getDriverTierLabel = (tier) => {
    if (tier === 'community') return 'Community Driver (Limited Verification)'
    return 'UIUC Verified Driver'
  }

  const getTrustLevelLabel = (level) => {
    if (level === 'high') return 'High Trust'
    if (level === 'medium') return 'Medium Trust'
    return 'Low Trust'
  }

  const getTrustLevelClass = (level) => {
    if (level === 'high') return 'bg-green-100 text-green-700'
    if (level === 'medium') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-200 text-slate-700'
  }

  function mapDriverListing(item, fallback = {}) {
    return {
      id: item.id,
      userId: item.user_id,
      name: item.user_name || fallback.name || `Driver #${item.id}`,
      avatarUrl: item.user_avatar_url || fallback.avatarUrl || '',
      route: item.route,
      seats: item.available_seats,
      pricePerSeat: item.price_per_seat || 0,
      skills: item.skills || '',
      labels: item.labels || '',
      ratingAverage: item.rating_average || 0,
      ratingCount: item.rating_count || 0,
      rideHistoryCount: item.ride_history_count || 0,
      departure: item.departure_time,
      vehicle: item.vehicle,
      pickupLocation: item.pickup_location || '',
      notesRaw: item.notes || '',
      note: [item.pickup_location, item.notes].filter(Boolean).join(' • '),
      driverTier: item.driver_tier || 'community',
      emailVerified: Boolean(item.email_verified),
      smsVerified: Boolean(item.sms_verified),
      trustScore: Number(item.trust_score || 0),
      trustLevel: item.trust_level || 'low',
    }
  }

  const sendEmailVerificationOtp = () => {
    const email = applicationForm.email.trim().toLowerCase()
    if (!email.endsWith('@illinois.edu')) {
      addNotification({
        type: 'error',
        title: 'Invalid UIUC email',
        message: 'Use your @illinois.edu email to verify UIUC driver tier.',
      })
      return
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    setSentEmailOtp(otp)
    setApplicationForm((prev) => ({ ...prev, emailVerified: false }))
    addNotification({
      type: 'info',
      title: 'Verification code sent',
      message: `Demo code: ${otp}`,
    })
  }

  const verifyEmailOtp = () => {
    if (!sentEmailOtp) {
      addNotification({
        type: 'warning',
        title: 'Send code first',
        message: 'Request an email verification code before confirming.',
      })
      return
    }
    if (emailOtpInput.trim() !== sentEmailOtp) {
      addNotification({
        type: 'error',
        title: 'Invalid code',
        message: 'Email verification code does not match.',
      })
      return
    }
    setApplicationForm((prev) => ({ ...prev, emailVerified: true }))
    addNotification({
      type: 'success',
      title: 'Email verified',
      message: 'UIUC email verification completed.',
    })
  }

  const sendSmsVerificationOtp = () => {
    const phone = applicationForm.phoneNumber.trim()
    if (!phone) {
      addNotification({
        type: 'error',
        title: 'Phone required',
        message: 'Enter a phone number before requesting SMS verification.',
      })
      return
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    setSentSmsOtp(otp)
    setApplicationForm((prev) => ({ ...prev, smsVerified: false }))
    addNotification({
      type: 'info',
      title: 'SMS code sent',
      message: `Demo code: ${otp}`,
    })
  }

  const verifySmsOtp = () => {
    if (!sentSmsOtp) {
      addNotification({
        type: 'warning',
        title: 'Send code first',
        message: 'Request an SMS code before confirming.',
      })
      return
    }
    if (smsOtpInput.trim() !== sentSmsOtp) {
      addNotification({
        type: 'error',
        title: 'Invalid code',
        message: 'SMS verification code does not match.',
      })
      return
    }
    setApplicationForm((prev) => ({ ...prev, smsVerified: true }))
    addNotification({
      type: 'success',
      title: 'Phone verified',
      message: 'SMS verification completed.',
    })
  }

  const handleMarkMessageRead = async (messageId) => {
    try {
      setIsMarkingReadId(messageId)
      const updated = await messageAPI.markAsRead(messageId)
      setInboxMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, is_read: updated.is_read } : message
        )
      )
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not mark message',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsMarkingReadId(null)
    }
  }

  const sendConversationMessage = async (conversation, rawBody) => {
    const body = (rawBody || '').trim()
    if (!conversation || !body) {
      addNotification({
        type: 'warning',
        title: 'Reply is empty',
        message: 'Write a message before sending.',
      })
      return
    }

    const request = conversation.request
    const recipientId = request.driver_user_id === user?.id ? request.rider_user_id : request.driver_user_id
    if (!recipientId) return

    try {
      setIsSendingConversationId(conversation.id)
      await messageAPI.sendMessage(
        recipientId,
        buildThreadSubject(request.driver_listing_id, request.id, request.driver_route || ''),
        body
      )

      setConversationDraft('')
      addNotification({
        type: 'success',
        title: 'Reply sent',
        message: 'Your message was sent.',
      })
      loadMessages()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not send reply',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsSendingConversationId(null)
    }
  }

  const handleConversationKeyDown = (event, conversation) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendConversationMessage(conversation, conversationDraft)
    }
  }

  const handleQuickReply = (text) => {
    setConversationDraft(text)
    if (conversationInputRef.current) {
      conversationInputRef.current.focus()
    }
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Bus size={24} className="text-blue-600" />
              <span className="hidden text-lg font-semibold text-slate-900 sm:inline">
                UIUC Ride Board
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                title="Message Box"
                aria-label="Message Box"
                onClick={() =>
                  setActiveUtilityPanel((prev) => (prev === 'messages' ? null : 'messages'))
                }
                className={`relative inline-flex flex-col items-center justify-center rounded-lg border px-1.5 py-1 transition ${
                  activeUtilityPanel === 'messages'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={16} />
                <span className="text-[10px] leading-none">Msg</span>
                {unreadInboxCount > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    {unreadInboxCount}
                  </span>
                ) : null}
              </button>

              <button
                title="Driver Application"
                aria-label="Driver Application"
                onClick={() =>
                  setActiveUtilityPanel((prev) => (prev === 'application' ? null : 'application'))
                }
                className={`inline-flex flex-col items-center justify-center rounded-lg border px-1.5 py-1 transition ${
                  activeUtilityPanel === 'application'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <User size={16} />
                <span className="text-[10px] leading-none">Apply</span>
              </button>

              <button
                title="Post a Driver Listing"
                aria-label="Post a Driver Listing"
                onClick={() =>
                  setActiveUtilityPanel((prev) => (prev === 'listing' ? null : 'listing'))
                }
                className={`inline-flex flex-col items-center justify-center rounded-lg border px-1.5 py-1 transition ${
                  activeUtilityPanel === 'listing'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Car size={16} />
                <span className="text-[10px] leading-none">Post</span>
              </button>

              {user?.is_admin ? (
                <button
                  title="All Drivers"
                  aria-label="All Drivers"
                  onClick={() =>
                    setActiveUtilityPanel((prev) => (prev === 'drivers' ? null : 'drivers'))
                  }
                  className={`inline-flex flex-col items-center justify-center rounded-lg border px-1.5 py-1 transition ${
                    activeUtilityPanel === 'drivers'
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Users size={16} />
                  <span className="text-[10px] leading-none">Drivers</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {token && (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <span className="hidden text-xs text-slate-500 sm:inline">
                  {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
                </span>
              </div>
            )}

            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <div className="relative">
                    {user.avatar_url ? (
                      <img
                        src={resolveAvatarUrl(user.avatar_url)}
                        alt="avatar"
                        className="h-8 w-8 rounded-full border border-slate-300 object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs font-semibold text-slate-700">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute -bottom-1 -right-1 rounded-full border border-slate-300 bg-white px-1 text-[10px] text-slate-700"
                    >
                      {isUploadingAvatar ? '...' : '+'}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <span className="relative hidden sm:inline-flex">
                    <MessageSquare size={16} />
                    {unreadInboxCount > 0 ? (
                      <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {unreadInboxCount}
                      </span>
                    ) : null}
                  </span>
                  <User size={16} />
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                  {user.is_admin ? (
                    <span className="hidden rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 sm:inline">
                      Admin
                    </span>
                  ) : null}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <motion.div
          className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-xl sm:p-12"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs">
            <Bus size={16} />
            UIUC Intercity Ride Board
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            Find student-friendly rides between UIUC and Chicago-area stops.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-100 sm:text-lg">
            A simple listing and request platform to help UIUC students connect
            with drivers, share routes, and coordinate travel plans.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#search"
              className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Browse Listings
            </a>
            <a
              href="#requests"
              className="rounded-xl border border-white/40 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Post a Request
            </a>
          </div>
        </motion.div>
      </section>

      <section id="search" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <datalist id="route-focus-options">
          {routeFocusOptions.map((route) => (
            <option key={`route-focus-option-${route}`} value={route} />
          ))}
        </datalist>
        <datalist id="route-options">
          {routes.slice(1).map((route) => (
            <option key={`route-option-${route}`} value={route} />
          ))}
        </datalist>
        <motion.div
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          {...cardMotion}
        >
          <div className="mb-4 flex items-center gap-2 text-slate-700">
            <Search size={18} />
            <h2 className="text-xl font-semibold">Route Search</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="md:col-span-1">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Route focus
              </span>
              <input
                type="text"
                list="route-focus-options"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                value={selectedRoute}
                onChange={(event) => setSelectedRoute(event.target.value)}
                placeholder="All routes or type any route"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Keyword
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by driver name, route, vehicle, or notes"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        {activeUtilityPanel ? (
        <div className="fixed inset-0 z-40 bg-slate-900/30 p-4 sm:p-6">
          <div className="mx-auto mt-16 max-h-[calc(100vh-6rem)] max-w-5xl overflow-y-auto rounded-2xl">
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setActiveUtilityPanel(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          {activeUtilityPanel === 'listing' ? (
            <motion.div
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...cardMotion}
          >
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Post a Driver Listing</h3>
          {!canPostDriverListing ? (
            <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              Your driver application must be approved by an admin before you can post listings.
            </div>
          ) : null}
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateDriverListing}>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Route</span>
              <input
                type="text"
                list="route-options"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                value={driverForm.route}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, route: event.target.value }))
                }
                placeholder="e.g. UIUC → Naperville"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Vehicle</span>
              <input
                type="text"
                value={driverForm.vehicle}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, vehicle: event.target.value }))
                }
                placeholder="Toyota Camry"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Departure</span>
              <input
                type="datetime-local"
                value={driverForm.departure}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, departure: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Available seats</span>
              <input
                type="number"
                min="1"
                max="6"
                value={driverForm.seats}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, seats: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Price per seat (can update before booking)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={driverForm.pricePerSeat}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, pricePerSeat: event.target.value }))
                }
                placeholder="25"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Characteristics / Skills</span>
              <input
                type="text"
                value={driverForm.skills}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, skills: event.target.value }))
                }
                placeholder="Speaks Mandarin, Non-smoker"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Driver Labels</span>
              <input
                type="text"
                value={driverForm.labels}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, labels: event.target.value }))
                }
                placeholder="On-time, Quiet ride, Pet-friendly"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Pickup location</span>
              <input
                type="text"
                value={driverForm.pickupLocation}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, pickupLocation: event.target.value }))
                }
                placeholder="Near Illini Union"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Notes</span>
              <textarea
                rows="3"
                value={driverForm.notes}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Any luggage limits or drop-off details"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmittingDriver || !canPostDriverListing}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {!canPostDriverListing ? 'Approval required' : isSubmittingDriver ? 'Posting...' : 'Post Listing'}
              </button>
            </div>
          </form>
          </motion.div>
          ) : null}

          {activeUtilityPanel === 'messages' && user ? (
            <motion.div
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              {...cardMotion}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <MessageSquare size={18} />
                    <h2 className="text-2xl font-semibold text-slate-900">Messages</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Conversations are grouped by ride request so details and status stay in one thread.
                  </p>
                </div>
                <span className="text-sm text-slate-500">{threadConversations.length} conversation{threadConversations.length === 1 ? '' : 's'}</span>
              </div>

              <div className="mt-5">
                {isLoadingSharedRideRequests || isLoadingMessages ? (
                  <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Loading conversations...
                  </div>
                ) : null}

                <div className="grid h-[560px] gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
                  <aside className="overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                    <div className="space-y-2">
                      {threadConversations.map((conversation) => {
                        const statusMeta = getSharedRideStatusMeta(conversation.status)
                        const lastMessage = conversation.messages[conversation.messages.length - 1]
                        const previewText = (lastMessage?.body || '').replace(/^\[SYSTEM\]\s*/i, '')
                        const isSelected = selectedConversation?.id === conversation.id

                        return (
                          <button
                            key={`conversation-${conversation.id}`}
                            onClick={() => setSelectedConversationId(conversation.id)}
                            className={`w-full rounded-lg border p-3 text-left transition ${
                              isSelected
                                ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-100'
                                : conversation.hasUnread
                                ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900">{conversation.route}</p>
                              {conversation.hasUnread ? <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" /> : null}
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-600">
                              {previewText || statusMeta.label}
                            </p>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${statusMeta.badgeClass}`}>
                                {statusMeta.label}
                              </span>
                              <span>{formatMessageTime(conversation.lastActivityAt)}</span>
                            </div>
                          </button>
                        )
                      })}

                      {!isLoadingSharedRideRequests && !isLoadingMessages && threadConversations.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-600">
                          No ride conversations yet.
                        </div>
                      ) : null}
                    </div>
                  </aside>

                  <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white">
                    {selectedConversation ? (
                      <>
                        {(() => {
                          const request = selectedConversation.request
                          const statusMeta = getSharedRideStatusMeta(selectedConversation.status)
                          const isDriver = user?.id === request.driver_user_id
                          const isRider = user?.id === request.rider_user_id
                          const quickReplies = ['What time exactly?', 'Where is pickup?', 'I can bring luggage']
                          if (selectedConversation.status === 'approved') {
                            quickReplies.push('I confirm this ride.')
                          }

                          return (
                            <>
                              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{selectedConversation.route}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                      {selectedConversation.departureTime ? <span>Departure: {selectedConversation.departureTime}</span> : null}
                                      {selectedConversation.seats ? <span>Seats: {selectedConversation.seats}</span> : null}
                                      {Number.isFinite(Number(selectedConversation.pricePerSeat)) ? (
                                        <span>Price: ${Number(selectedConversation.pricePerSeat).toFixed(2)}/seat</span>
                                      ) : null}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.badgeClass}`}>
                                        {statusMeta.label}
                                      </span>
                                      <span className="text-xs text-slate-500">Participants:</span>
                                      <AvatarName
                                        name={selectedConversation.driverName}
                                        avatarUrl={selectedConversation.driverAvatarUrl}
                                        resolveAvatarUrl={resolveAvatarUrl}
                                        avatarClassName="h-5 w-5"
                                        nameClassName="text-xs font-medium text-slate-700"
                                        className="gap-1"
                                      />
                                      <AvatarName
                                        name={request.rider_name || `User #${request.rider_user_id}`}
                                        avatarUrl={request.rider_avatar_url || ''}
                                        resolveAvatarUrl={resolveAvatarUrl}
                                        avatarClassName="h-5 w-5"
                                        nameClassName="text-xs font-medium text-slate-700"
                                        className="gap-1"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {isDriver && selectedConversation.status === 'pending' ? (
                                      <>
                                        <button
                                          onClick={() => handleSharedRideConversationAction(request, 'approved')}
                                          disabled={isUpdatingSharedRideRequestId === request.id}
                                          className="rounded-lg border border-green-300 px-2.5 py-1 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleSharedRideConversationAction(request, 'rejected')}
                                          disabled={isUpdatingSharedRideRequestId === request.id}
                                          className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    ) : null}

                                    {isRider && selectedConversation.status === 'approved' ? (
                                      <button
                                        onClick={() => handleSharedRideConversationAction(request, 'confirmed')}
                                        disabled={isUpdatingSharedRideRequestId === request.id}
                                        className="rounded-lg border border-green-300 px-2.5 py-1 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                                      >
                                        Confirm ride
                                      </button>
                                    ) : null}

                                    {isRider && ['pending', 'approved', 'confirmed'].includes(selectedConversation.status) ? (
                                      <button
                                        onClick={() => handleSharedRideConversationAction(request, 'cancelled')}
                                        disabled={isUpdatingSharedRideRequestId === request.id}
                                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                                      >
                                        Cancel request
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                                <div className="space-y-4">
                                  {selectedConversation.messages.map((message) => {
                                    const isMine = message.sender_id === user?.id
                                    const isSystem = /^\[SYSTEM\]\s*/i.test(message.body || '')
                                    const cleanBody = (message.body || '').replace(/^\[SYSTEM\]\s*/i, '')

                                    if (isSystem) {
                                      return (
                                        <p key={`system-${message.id}`} className="text-center text-xs text-slate-500">
                                          {cleanBody}
                                        </p>
                                      )
                                    }

                                    return (
                                      <div
                                        key={`conversation-message-${message.id}`}
                                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                      >
                                        <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                          <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                                            <AvatarName
                                              name={
                                                isMine
                                                  ? (user?.name || 'You')
                                                  : (message.sender_name || `User #${message.sender_id}`)
                                              }
                                              avatarUrl={isMine ? user?.avatar_url || '' : message.sender_avatar_url || ''}
                                              resolveAvatarUrl={resolveAvatarUrl}
                                              avatarClassName="h-6 w-6"
                                              nameClassName="text-xs font-semibold text-slate-700"
                                              className="gap-1"
                                            />
                                          </div>
                                          <div
                                            className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
                                              isMine
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-800'
                                            }`}
                                          >
                                            {cleanBody}
                                          </div>
                                          <p className="text-xs text-slate-500">{formatMessageTime(message.created_at)}</p>
                                        </div>
                                      </div>
                                    )
                                  })}

                                  {selectedConversation.messages.length === 0 ? (
                                    <p className="text-center text-sm text-slate-500">No messages yet in this thread.</p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="border-t border-slate-200 px-4 py-3">
                                <div className="mb-2 flex flex-wrap gap-2">
                                  {quickReplies.map((text) => (
                                    <button
                                      key={`quick-reply-${text}`}
                                      onClick={() => handleQuickReply(text)}
                                      className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
                                    >
                                      {text}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-end gap-2">
                                  <textarea
                                    ref={conversationInputRef}
                                    rows="2"
                                    value={conversationDraft}
                                    onChange={(event) => setConversationDraft(event.target.value)}
                                    onKeyDown={(event) => handleConversationKeyDown(event, selectedConversation)}
                                    placeholder="Reply in this ride thread..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                                  />
                                  <button
                                    onClick={() => sendConversationMessage(selectedConversation, conversationDraft)}
                                    disabled={isSendingConversationId === selectedConversation.id}
                                    className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                                  >
                                    {isSendingConversationId === selectedConversation.id ? 'Sending...' : 'Send'}
                                  </button>
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
                        Select a conversation to view details.
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </motion.div>
          ) : null}

          {activeUtilityPanel === 'application' ? (
          <motion.div
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            {...cardMotion}
          >
            <h2 className="text-2xl font-semibold text-slate-900">Driver Application</h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose your driver tier and complete verification to unlock posting access.
            </p>
            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleApplicationSubmit}>
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Step 1: Choose verification tier</p>
                <p className="mt-1 text-xs text-slate-600">Only UIUC students can access the UIUC Verified tier.</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setApplicationForm((prev) => ({ ...prev, driverTier: 'uiuc_verified' }))}
                    className={`rounded-lg border p-3 text-left transition ${
                      applicationForm.driverTier === 'uiuc_verified'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-300 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">UIUC Verified Driver</p>
                    <p className="mt-1 text-xs text-slate-600">@illinois.edu email verification required. SMS optional.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplicationForm((prev) => ({ ...prev, driverTier: 'community' }))}
                    className={`rounded-lg border p-3 text-left transition ${
                      applicationForm.driverTier === 'community'
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-slate-300 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">Community Driver (Limited Verification)</p>
                    <p className="mt-1 text-xs text-slate-600">No .edu requirement, but SMS verification is mandatory.</p>
                  </button>
                </div>
              </div>

              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Step 2: Full name</span>
                <input
                  type="text"
                  placeholder="Your name"
                  value={applicationForm.fullName}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  {applicationForm.driverTier === 'uiuc_verified' ? 'UIUC email' : 'Email'}
                </span>
                <input
                  type="email"
                  placeholder={applicationForm.driverTier === 'uiuc_verified' ? 'netid@illinois.edu' : 'name@email.com'}
                  value={applicationForm.email}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({ ...prev, email: event.target.value, emailVerified: false }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                />
              </label>

              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Step 3: Verification</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">Email verification {applicationForm.driverTier === 'uiuc_verified' ? '(required)' : '(optional)'}</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={emailOtpInput}
                        onChange={(event) => setEmailOtpInput(event.target.value)}
                        placeholder="Enter email OTP"
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none ring-blue-200 transition focus:ring"
                      />
                      <button
                        type="button"
                        onClick={sendEmailVerificationOtp}
                        className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        onClick={verifyEmailOtp}
                        className="rounded-lg border border-blue-300 px-2.5 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                      >
                        Verify
                      </button>
                    </div>
                    <p className={`mt-2 text-xs ${applicationForm.emailVerified ? 'text-green-700' : 'text-slate-600'}`}>
                      {applicationForm.emailVerified ? 'Email verified' : 'Email not verified'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">SMS verification {applicationForm.driverTier === 'community' ? '(required)' : '(optional)'}</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={smsOtpInput}
                        onChange={(event) => setSmsOtpInput(event.target.value)}
                        placeholder="Enter SMS OTP"
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none ring-blue-200 transition focus:ring"
                      />
                      <button
                        type="button"
                        onClick={sendSmsVerificationOtp}
                        className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        onClick={verifySmsOtp}
                        className="rounded-lg border border-blue-300 px-2.5 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                      >
                        Verify
                      </button>
                    </div>
                    <p className={`mt-2 text-xs ${applicationForm.smsVerified ? 'text-green-700' : 'text-slate-600'}`}>
                      {applicationForm.smsVerified ? 'Phone verified' : 'Phone not verified'}
                    </p>
                  </div>
                </div>
              </div>

              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Step 4: Phone number</span>
                <input
                  type="tel"
                  placeholder="(217) 555-1234"
                  value={applicationForm.phoneNumber}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({ ...prev, phoneNumber: event.target.value, smsVerified: false }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Vehicle info (make/model)</span>
                <input
                  type="text"
                  placeholder="Toyota Camry"
                  value={applicationForm.vehicleInfo}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({ ...prev, vehicleInfo: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Seats available</span>
                <input
                  type="number"
                  min="1"
                  max="6"
                  placeholder="2"
                  value={applicationForm.availableSeats}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({ ...prev, availableSeats: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                />
              </label>

              {applicationForm.driverTier === 'community' ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">Optional ID upload (coming soon)</p>
                  <p className="mt-1 text-xs">Future feature placeholder for additional trust signals.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  Only UIUC students can access this tier.
                </div>
              )}

              <label className="md:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Notes</span>
                <textarea
                  rows="4"
                  placeholder="Share your typical departure times, pickup area, and any rider expectations"
                  value={applicationForm.notes}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                />
              </label>

              {applicationForm.driverTier === 'community' ? (
                <div className="md:col-span-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                  Passengers should review driver details carefully.
                </div>
              ) : null}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Submit Application
                </button>
              </div>
            </form>

            {user && !user.is_admin ? (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">My Application Status</h3>
                  <button
                    onClick={() => loadMyApplications({ showError: true })}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Refresh
                  </button>
                </div>

                {isLoadingMyApplications ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Loading your applications...
                  </div>
                ) : null}

                <div className="mt-3 space-y-3">
                  {myApplications.map((application) => (
                    <article
                      key={application.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Driver application</p>
                          <p className="mt-1 text-xs text-slate-600">
                            Coverage: All routes • Seats: {application.available_seats} • Submitted {formatMessageTime(application.created_at)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${application.driver_tier === 'community' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {getDriverTierLabel(application.driver_tier)}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${application.email_verified ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                              Email {application.email_verified ? 'verified' : 'not verified'}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${application.sms_verified ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                              SMS {application.sms_verified ? 'verified' : 'not verified'}
                            </span>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getApplicationStatusClass(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      {application.driver_tier === 'community' ? (
                        <p className="mt-2 text-xs text-amber-700">Community tier: passengers should review driver details carefully.</p>
                      ) : null}
                      {application.notes ? (
                        <p className="mt-2 text-sm text-slate-700">{application.notes}</p>
                      ) : null}
                    </article>
                  ))}

                  {!isLoadingMyApplications && myApplications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                      You have not submitted a driver application yet.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>
          ) : null}

          {activeUtilityPanel === 'drivers' && user?.is_admin ? (
            <motion.div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" {...cardMotion}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-900">All Drivers</h2>
                <span className="text-sm text-slate-500">{adminDriverDirectory.length} total</span>
              </div>

              <div className="mt-4 space-y-3">
                {adminDriverDirectory.map((driver) => (
                  <article key={`admin-driver-${driver.userId}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <AvatarName
                          name={driver.name}
                          avatarUrl={driver.avatarUrl}
                          resolveAvatarUrl={resolveAvatarUrl}
                          subtitle={<p className="truncate">{driver.email}</p>}
                          avatarClassName="h-10 w-10"
                        />
                        <p className="mt-1 text-xs text-slate-600">
                          Coverage: {driver.primaryRoute} • Seats: {driver.seats}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Total rides: {driver.totalRides} • Active rides: {driver.activeRides}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${driver.driverTier === 'community' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {getDriverTierLabel(driver.driverTier)}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${driver.emailVerified ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                            Email {driver.emailVerified ? '✓' : '✕'}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${driver.smsVerified ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                            SMS {driver.smsVerified ? '✓' : '✕'}
                          </span>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getApplicationStatusClass(driver.status)}`}>
                        {driver.status}
                      </span>
                    </div>
                  </article>
                ))}

                {adminDriverDirectory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                    No drivers found yet.
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
          </div>
        </div>
        ) : null}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Driver Listings</h2>
          <span className="text-sm text-slate-500">
            {visibleDrivers.length} / {filteredDrivers.length} result{filteredDrivers.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoadingMarketplace ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Loading live listings...
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {visibleDrivers.map((driver) => {
            const seatCount = Number(driver.seats)
            const hasSeatCount = Number.isFinite(seatCount) && seatCount >= 0
            const parsedPrice = Number(driver.pricePerSeat)
            const hasPrice =
              driver.pricePerSeat !== '' &&
              driver.pricePerSeat !== null &&
              driver.pricePerSeat !== undefined &&
              Number.isFinite(parsedPrice)
            const ratingCount = Number(driver.ratingCount)
            const ratingAverage = Number(driver.ratingAverage)
            const rideHistoryCount = Number(driver.rideHistoryCount)
            const activitySignal =
              Number.isFinite(ratingCount) && ratingCount > 0 && Number.isFinite(ratingAverage)
                ? `⭐ ${ratingAverage.toFixed(1)} from ${ratingCount} rating${ratingCount === 1 ? '' : 's'}`
                : Number.isFinite(rideHistoryCount) && rideHistoryCount > 0
                ? `${rideHistoryCount} completed ride${rideHistoryCount === 1 ? '' : 's'}`
                : null

            return (
            <motion.article
              key={driver.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                editingDriverId === driver.id
                  ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/30'
                  : 'border-slate-200'
              }`}
              {...cardMotion}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <AvatarName
                    name={driver.name}
                    avatarUrl={driver.avatarUrl}
                    resolveAvatarUrl={resolveAvatarUrl}
                    avatarClassName="h-11 w-11"
                    nameClassName="text-lg font-semibold text-slate-900"
                  />
                  <div className="mt-2 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      {driver.route ? (
                        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-800">
                          <MapPin size={15} className="shrink-0" />
                          <span className="truncate">{driver.route}</span>
                        </p>
                      ) : null}
                      {hasPrice ? (
                        <p className="text-sm font-semibold text-emerald-700">
                          ${parsedPrice.toFixed(2)}/seat
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <DepartureBadge departure={driver.departure} now={now} />
                      {hasSeatCount ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {seatCount} seat{seatCount === 1 ? '' : 's'} left
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${driver.driverTier === 'community' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {getDriverTierLabel(driver.driverTier)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getTrustLevelClass(driver.trustLevel)}`}>
                        {getTrustLevelLabel(driver.trustLevel)} • {driver.trustScore}
                      </span>
                    </div>

                    {activitySignal ? (
                      <p className="text-xs text-slate-500">{activitySignal}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {editingDriverId === driver.id ? (
                    <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                      Editing...
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {editingDriverId === driver.id ? (
                  <div className="grid gap-2">
                    <input
                      type="text"
                      list="route-options"
                      value={editingDriverForm.route}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, route: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                      placeholder="e.g. UIUC → Schaumburg"
                    />
                    <input
                      type="datetime-local"
                      value={editingDriverForm.departure}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, departure: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <input
                      type="text"
                      value={editingDriverForm.vehicle}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, vehicle: event.target.value }))
                      }
                      placeholder="Vehicle"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={editingDriverForm.seats}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, seats: event.target.value }))
                      }
                      placeholder="Seats"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingDriverForm.pricePerSeat}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, pricePerSeat: event.target.value }))
                      }
                      placeholder="Cost per seat"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <input
                      type="text"
                      value={editingDriverForm.skills}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, skills: event.target.value }))
                      }
                      placeholder="Skills / characteristics"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <input
                      type="text"
                      value={editingDriverForm.labels}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, labels: event.target.value }))
                      }
                      placeholder="Labels"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <input
                      type="text"
                      value={editingDriverForm.pickupLocation}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, pickupLocation: event.target.value }))
                      }
                      placeholder="Pickup location"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <textarea
                      rows="2"
                      value={editingDriverForm.notes}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Notes"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                  </div>
                ) : (
                  <>
                    {driver.departure ? (
                      <p className="flex items-center gap-2">
                        <Clock3 size={15} /> Departure: {new Date(driver.departure).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    ) : null}
                    {driver.vehicle ? (
                      <p className="flex items-center gap-2">
                        <Car size={15} /> Vehicle: {driver.vehicle}
                      </p>
                    ) : null}
                    {hasPrice ? (
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Cost:</span> ${parsedPrice.toFixed(2)} per seat
                      </p>
                    ) : null}
                    {driver.skills ? <p>Skills: {driver.skills}</p> : null}
                    {driver.labels ? <p>Labels: {driver.labels}</p> : null}
                    {driver.note ? <p>{driver.note}</p> : null}
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {editingDriverId === driver.id ? (
                  <>
                    <button
                      onClick={() => handleSaveDriverEdit(driver.id)}
                      disabled={isSavingDriverEdit}
                      className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {isSavingDriverEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelDriverEdit}
                      className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggleContactDraft(driver)}
                      className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Contact
                    </button>
                    <button
                      onClick={() => handleToggleDriverDetails(driver.id)}
                      className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {expandedDriverDetailsId === driver.id ? 'Hide Details' : 'View Details'}
                    </button>
                    {user && (user.id === driver.userId || user.is_admin) ? (
                      <>
                        <button
                          onClick={() => handleEditDriverListing(driver)}
                          disabled={lockedDriverListingIds.has(driver.id)}
                          className="rounded-lg border border-blue-300 px-3.5 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                          title={
                            lockedDriverListingIds.has(driver.id)
                              ? 'This listing has a confirmed ride and can no longer be edited.'
                              : undefined
                          }
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDriverListing(driver)}
                          className="rounded-lg border border-red-300 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </>
                )}
                {editingDriverId === driver.id && user && (user.id === driver.userId || user.is_admin) ? (
                  <button
                    onClick={() => handleDeleteDriverListing(driver)}
                    className="rounded-lg border border-red-300 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : null}
              </div>

              {expandedDriverDetailsId === driver.id ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p><span className="font-medium">Route:</span> {driver.route}</p>
                  <p className="mt-1"><span className="font-medium">Departure:</span> {driver.departure}</p>
                  <p className="mt-1"><span className="font-medium">Pickup:</span> {driver.pickupLocation || 'Not specified'}</p>
                  <p className="mt-1"><span className="font-medium">Seats:</span> {driver.seats}</p>
                  <p className="mt-1"><span className="font-medium">Cost:</span> ${Number(driver.pricePerSeat || 0).toFixed(2)} per seat</p>
                  {driver.skills ? <p className="mt-1"><span className="font-medium">Skills:</span> {driver.skills}</p> : null}
                  {driver.labels ? <p className="mt-1"><span className="font-medium">Labels:</span> {driver.labels}</p> : null}
                  {driver.notesRaw ? <p className="mt-1"><span className="font-medium">Notes:</span> {driver.notesRaw}</p> : null}
                </div>
              ) : null}

              {user && user.id !== driver.userId ? (
                <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Request shared ride</p>
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="number"
                          min="1"
                          max={driver.seats}
                          value={sharedRideDrafts[driver.id]?.seats || '1'}
                          onChange={(event) =>
                            setSharedRideDrafts((prev) => ({
                              ...prev,
                              [driver.id]: {
                                seats: event.target.value,
                                message: prev[driver.id]?.message || '',
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none ring-blue-200 transition focus:ring sm:w-28"
                          placeholder="Seats"
                        />
                        <button
                          onClick={() => handleCreateSharedRideRequest(driver)}
                          disabled={isSubmittingSharedRideId === driver.id || driver.seats < 1}
                          className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60"
                        >
                          {isSubmittingSharedRideId === driver.id ? 'Requesting...' : 'Request Ride Share'}
                        </button>
                      </div>
                      <textarea
                        rows="2"
                        value={sharedRideDrafts[driver.id]?.message || ''}
                        onChange={(event) =>
                          setSharedRideDrafts((prev) => ({
                            ...prev,
                            [driver.id]: {
                              seats: prev[driver.id]?.seats || '1',
                              message: event.target.value,
                            },
                          }))
                        }
                        placeholder="Optional note to the driver"
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none ring-blue-200 transition focus:ring"
                      />
                    </div>
                  </div>

                  {approvedSharedRideListingIds.has(driver.id) ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Rate this ride experience</p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={ratingDrafts[driver.id]?.rating || '5'}
                            onChange={(event) =>
                              setRatingDrafts((prev) => ({
                                ...prev,
                                [driver.id]: {
                                  rating: event.target.value,
                                  comment: prev[driver.id]?.comment || '',
                                },
                              }))
                            }
                            className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none ring-blue-200 transition focus:ring"
                          >
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Good</option>
                            <option value="3">3 - Okay</option>
                            <option value="2">2 - Poor</option>
                            <option value="1">1 - Bad</option>
                          </select>
                          <input
                            type="text"
                            value={ratingDrafts[driver.id]?.comment || ''}
                            onChange={(event) =>
                              setRatingDrafts((prev) => ({
                                ...prev,
                                [driver.id]: {
                                  rating: prev[driver.id]?.rating || '5',
                                  comment: event.target.value,
                                },
                              }))
                            }
                            placeholder="Optional comment"
                            className="flex-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none ring-blue-200 transition focus:ring"
                          />
                          <button
                            onClick={() => handleSubmitRideRating(driver)}
                            disabled={isSubmittingRatingId === driver.id}
                            className="rounded-lg border border-blue-300 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
                          >
                            {isSubmittingRatingId === driver.id ? 'Submitting...' : 'Submit Rating'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-700">Report to admin</p>
                        <div className="mt-2 space-y-2">
                          <select
                            value={reportDrafts[driver.id]?.category || 'safety'}
                            onChange={(event) =>
                              setReportDrafts((prev) => ({
                                ...prev,
                                [driver.id]: {
                                  category: event.target.value,
                                  details: prev[driver.id]?.details || '',
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none ring-blue-200 transition focus:ring"
                          >
                            <option value="safety">Safety concern</option>
                            <option value="behavior">Behavior issue</option>
                            <option value="payment">Payment dispute</option>
                            <option value="other">Other</option>
                          </select>
                          <textarea
                            rows="2"
                            value={reportDrafts[driver.id]?.details || ''}
                            onChange={(event) =>
                              setReportDrafts((prev) => ({
                                ...prev,
                                [driver.id]: {
                                  category: prev[driver.id]?.category || 'safety',
                                  details: event.target.value,
                                },
                              }))
                            }
                            placeholder="Describe the issue for admins"
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs outline-none ring-blue-200 transition focus:ring"
                          />
                          <button
                            onClick={() => handleSubmitRideReport(driver)}
                            disabled={isSubmittingReportId === driver.id}
                            className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            {isSubmittingReportId === driver.id ? 'Sending...' : 'Send Report'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-600">
                      Only riders with an approved shared ride for this listing can rate or report.
                    </div>
                  )}
                </div>
              ) : null}
            </motion.article>
            )
          })}
        </div>

        {filteredDrivers.length > 6 ? (
          <div className="mt-4">
            <button
              onClick={() => setShowAllDriverListings((prev) => !prev)}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {showAllDriverListings ? 'Show fewer listings' : `Show more listings (${filteredDrivers.length - visibleDrivers.length} more)`}
            </button>
          </div>
        ) : null}

        {filteredDrivers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            {upcomingDriverCount === 0 && !hasActiveDriverFilter
              ? 'No upcoming driver listings right now.'
              : 'No listings matched your search. Try a different route or keyword.'}
          </div>
        ) : null}

        {user?.is_admin ? (
          <>
            <motion.div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" {...cardMotion}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Admin Ride Cost & Driver History</h3>
                <button
                  onClick={() => loadAdminDriverOverview({ showError: true })}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-3">
                <input
                  type="text"
                  value={adminHistorySearchTerm}
                  onChange={(event) => setAdminHistorySearchTerm(event.target.value)}
                  placeholder="Search driver history by name or email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Approved drivers</p>
                  <p className="text-lg font-semibold text-slate-900">{approvedDriverDirectory.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Drivers with listings</p>
                  <p className="text-lg font-semibold text-slate-900">{adminDriverOverview.length}</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-900">Approved Driver Information</h4>
                <div className="mt-2 space-y-2">
                  {approvedDriverDirectory.map((driver) => (
                    <div key={driver.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700">
                      <AvatarName
                        name={driver.full_name}
                        avatarUrl={driver.user_avatar_url}
                        resolveAvatarUrl={resolveAvatarUrl}
                        subtitle={<p className="truncate">{driver.email}</p>}
                        avatarClassName="h-10 w-10"
                      />
                      <p className="mt-1 text-xs text-slate-600">
                        Coverage: All routes • Seats: {driver.available_seats}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${driver.driver_tier === 'community' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {getDriverTierLabel(driver.driver_tier)}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${driver.email_verified ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                          Email {driver.email_verified ? '✓' : '✕'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${driver.sms_verified ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                          SMS {driver.sms_verified ? '✓' : '✕'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {!isLoadingAdminApplications && approvedDriverDirectory.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
                      No approved drivers yet.
                    </div>
                  ) : null}
                </div>
              </div>

              {isLoadingAdminDriverOverview ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Loading driver history...
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Ride Cost Ledger</h4>
                  <p className="mt-1 text-xs text-slate-600">
                    Complete list of rides and estimated costs.
                  </p>

                  <div className="mt-3 space-y-2">
                    {adminRideLedger.map((ride) => (
                      <div
                        key={`ledger-${ride.id}`}
                        className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-medium text-slate-900">
                            {ride.route} • {ride.departure_time}
                          </p>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            ${Number(ride.estimated_total_cost || 0).toFixed(2)} total
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          <span className="mr-2">Driver:</span>
                          <span className="inline-flex align-middle">
                            <AvatarName
                              name={ride.driverName}
                              avatarUrl={ride.driverAvatarUrl}
                              resolveAvatarUrl={resolveAvatarUrl}
                              subtitle={<p className="truncate">{ride.driverEmail}</p>}
                              avatarClassName="h-6 w-6"
                              nameClassName="text-xs font-semibold text-slate-700"
                              subtitleClassName="text-[11px] text-slate-500"
                              className="gap-2"
                            />
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Seats: {ride.available_seats} • ${Number(ride.price_per_seat || 0).toFixed(2)}/seat • Created: {formatMessageTime(ride.created_at)}
                        </p>
                      </div>
                    ))}

                    {!isLoadingAdminDriverOverview && adminRideLedger.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                        No rides available in the cost ledger yet.
                      </div>
                    ) : null}
                  </div>
                </div>

                {visibleAdminDriverOverview.map((driverHistory) => (
                  <article key={driverHistory.driver_user_id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <AvatarName
                          name={driverHistory.driver_name}
                          avatarUrl={driverHistory.driver_avatar_url}
                          resolveAvatarUrl={resolveAvatarUrl}
                          subtitle={<p className="truncate">{driverHistory.driver_email}</p>}
                          avatarClassName="h-10 w-10"
                        />
                        <p className="mt-2 text-xs text-slate-600">
                          {driverHistory.total_rides} ride{driverHistory.total_rides === 1 ? '' : 's'} •
                          {' '}Active: {driverHistory.active_rides} • Inactive: {driverHistory.inactive_rides}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600">Total estimated cost</p>
                        <p className="text-sm font-semibold text-slate-900">${Number(driverHistory.total_estimated_cost || 0).toFixed(2)}</p>
                        <p className="mt-1 text-xs text-slate-600">Avg ${Number(driverHistory.average_price_per_seat || 0).toFixed(2)}/seat</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() =>
                          setExpandedDriverHistoryId((prev) =>
                            prev === driverHistory.driver_user_id ? null : driverHistory.driver_user_id
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        {expandedDriverHistoryId === driverHistory.driver_user_id ? 'Hide history' : 'View history'}
                      </button>
                    </div>

                    {expandedDriverHistoryId === driverHistory.driver_user_id ? (
                      <div className="mt-3 space-y-2">
                        {driverHistory.rides.map((ride) => (
                          <div key={ride.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-medium text-slate-900">{ride.route} • {ride.departure_time}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ride.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                                {ride.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">Vehicle: {ride.vehicle} • Seats: {ride.available_seats}</p>
                            <p className="mt-1 text-xs text-slate-600">Cost: ${Number(ride.price_per_seat || 0).toFixed(2)}/seat • Ride total: ${Number(ride.estimated_total_cost || 0).toFixed(2)}</p>
                            <p className="mt-1 text-xs text-slate-500">Created: {formatMessageTime(ride.created_at)}</p>
                            <div className="mt-2">
                              <button
                                onClick={() => handleAdminDeleteRide(ride.id)}
                                disabled={isDeletingAdminRideId === ride.id}
                                className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                              >
                                {isDeletingAdminRideId === ride.id ? 'Deleting...' : 'Delete ride'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}

                {filteredAdminDriverOverview.length > 5 ? (
                  <div>
                    <button
                      onClick={() => setShowAllAdminDriverHistory((prev) => !prev)}
                      className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {showAllAdminDriverHistory
                        ? 'Show fewer history entries'
                        : `Show more history entries (${filteredAdminDriverOverview.length - visibleAdminDriverOverview.length} more)`}
                    </button>
                  </div>
                ) : null}

                {!isLoadingAdminDriverOverview && filteredAdminDriverOverview.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                    No driver history is available yet.
                  </div>
                ) : null}
              </div>
            </motion.div>

            <motion.div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" {...cardMotion}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Admin Ride Reports</h3>
                <button
                  onClick={() => loadAdminReports({ showError: true })}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Refresh
                </button>
              </div>

              {isLoadingAdminReports ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Loading reports...
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {adminReports.map((report) => (
                  <article key={report.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {report.category || 'Issue'} • Report #{report.id}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span>Reporter:</span>
                          <AvatarName
                            name={report.reporter_name || `User #${report.reporter_id}`}
                            avatarUrl={report.reporter_avatar_url}
                            resolveAvatarUrl={resolveAvatarUrl}
                            avatarClassName="h-6 w-6"
                            nameClassName="text-xs font-semibold text-slate-700"
                            className="gap-2"
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span>Against:</span>
                          <AvatarName
                            name={report.against_user_name || `User #${report.against_user_id}`}
                            avatarUrl={report.against_user_avatar_url}
                            resolveAvatarUrl={resolveAvatarUrl}
                            avatarClassName="h-6 w-6"
                            nameClassName="text-xs font-semibold text-slate-700"
                            className="gap-2"
                          />
                          <span>• Listing #{report.driver_listing_id}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Submitted: {formatMessageTime(report.created_at)}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getReportStatusClass(report.status || 'open')}`}>
                        {(report.status || 'open').toUpperCase()}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">{report.details}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleUpdateReportStatus(report.id, 'open')}
                        disabled={isUpdatingAdminReportId === report.id || report.status === 'open'}
                        className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleUpdateReportStatus(report.id, 'reviewing')}
                        disabled={isUpdatingAdminReportId === report.id || report.status === 'reviewing'}
                        className="rounded-lg border border-blue-300 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
                      >
                        Reviewing
                      </button>
                      <button
                        onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                        disabled={isUpdatingAdminReportId === report.id || report.status === 'resolved'}
                        className="rounded-lg border border-green-300 px-2.5 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                      >
                        {isUpdatingAdminReportId === report.id ? 'Updating...' : 'Resolved'}
                      </button>
                    </div>
                  </article>
                ))}

                {!isLoadingAdminReports && adminReports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                    No reports submitted yet.
                  </div>
                ) : null}
              </div>
            </motion.div>
          </>
        ) : null}
      </section>

      <section id="requests" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-semibold text-slate-900">Ride Requests</h2>

        <motion.div
          className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          {...cardMotion}
        >
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Post a Ride Request</h3>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateRiderRequest}>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Route</span>
              <input
                type="text"
                list="route-options"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                value={requestForm.route}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, route: event.target.value }))
                }
                placeholder="e.g. UIUC → Evanston"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Departure timing</span>
              <input
                type="datetime-local"
                value={requestForm.departure}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, departure: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Passengers</span>
              <input
                type="number"
                min="1"
                max="6"
                value={requestForm.passengers}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, passengers: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Details</span>
              <textarea
                rows="3"
                value={requestForm.details}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, details: event.target.value }))
                }
                placeholder="Pickup area, luggage, and flexibility"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {isSubmittingRequest ? 'Posting...' : 'Post Request'}
              </button>
            </div>
          </form>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {filteredRiderRequests.map((request) => (
            <motion.article
              key={request.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                editingRequestId === request.id
                  ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/30'
                  : 'border-slate-200'
              }`}
              {...cardMotion}
            >
              {editingRequestId === request.id ? (
                <div className="mb-2">
                  <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                    Editing...
                  </span>
                </div>
              ) : null}
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {editingRequestId === request.id ? (
                  <input
                    type="text"
                    list="route-options"
                    value={editingRequestForm.route}
                    onChange={(event) =>
                      setEditingRequestForm((prev) => ({ ...prev, route: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    placeholder="Route"
                  />
                ) : (
                  request.route
                )}
              </p>
              <div className="mt-2">
                <AvatarName
                  name={request.rider}
                  avatarUrl={request.avatarUrl}
                  resolveAvatarUrl={resolveAvatarUrl}
                  avatarClassName="h-10 w-10"
                  nameClassName="text-lg font-semibold text-slate-900"
                />
              </div>
              <div className="mt-2 space-y-2">
                {editingRequestId === request.id ? (
                  <>
                    <input
                      type="datetime-local"
                      value={editingRequestForm.departure}
                      onChange={(event) =>
                        setEditingRequestForm((prev) => ({ ...prev, departure: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={editingRequestForm.passengers}
                      onChange={(event) =>
                        setEditingRequestForm((prev) => ({ ...prev, passengers: event.target.value }))
                      }
                      placeholder="Passengers"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                    <textarea
                      rows="2"
                      value={editingRequestForm.details}
                      onChange={(event) =>
                        setEditingRequestForm((prev) => ({ ...prev, details: event.target.value }))
                      }
                      placeholder="Details"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    />
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                      {request.timing ? new Date(request.timing).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : request.timing}
                      <DepartureBadge departure={request.timing} now={now} />
                    </p>
                    <p className="text-sm text-slate-700">{request.details}</p>
                  </>
                )}
              </div>
              {editingRequestId === request.id ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSaveRiderRequestEdit(request.id)}
                    disabled={isSavingRequestEdit}
                    className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSavingRequestEdit ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelRiderRequestEdit}
                    className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  {user && (user.id === request.userId || user.is_admin) ? (
                    <button
                      onClick={() => handleDeleteRiderRequest(request)}
                      className="rounded-lg border border-red-300 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => handleOfferRide(request)}
                  className="mt-4 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                  Offer Ride
                </button>
              )}
              {editingRequestId !== request.id && user && (user.id === request.userId || user.is_admin) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEditRiderRequest(request)}
                    className="rounded-lg border border-blue-300 px-3.5 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRiderRequest(request)}
                    className="rounded-lg border border-red-300 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </motion.article>
          ))}
          {filteredRiderRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600 lg:col-span-3">
              {riderRequests.length === 0
                ? 'No ride requests posted yet.'
                : 'No upcoming ride requests right now.'}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        {user?.is_admin ? (
          <motion.div
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            {...cardMotion}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Admin Application Review</h3>
              <button
                onClick={() => loadAdminApplications({ showError: true })}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>

            {isLoadingAdminApplications ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Loading applications...
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {adminApplications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <AvatarName
                        name={application.full_name}
                        avatarUrl={application.user_avatar_url}
                        resolveAvatarUrl={resolveAvatarUrl}
                        subtitle={<p className="truncate">{application.email}</p>}
                        avatarClassName="h-10 w-10"
                      />
                      <p className="mt-1 text-xs text-slate-600">
                        All routes • {application.available_seats} seat{application.available_seats === 1 ? '' : 's'}
                      </p>
                      {application.notes ? (
                        <p className="mt-2 text-sm text-slate-700">{application.notes}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getApplicationStatusClass(application.status)}`}
                      >
                        {application.status}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApplicationStatusUpdate(application.id, 'approved')}
                          disabled={isUpdatingApplicationId === application.id || application.status === 'approved'}
                          className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplicationStatusUpdate(application.id, 'rejected')}
                          disabled={isUpdatingApplicationId === application.id || application.status === 'rejected'}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDeleteApplication(application.id)}
                          disabled={isDeletingApplicationId === application.id}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                        >
                          {isDeletingApplicationId === application.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {!isLoadingAdminApplications && adminApplications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                  No driver applications submitted yet.
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.article
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          {...cardMotion}
        >
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <ShieldCheck size={18} />
            <h2 className="text-xl font-semibold">Trust & Safety</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5" size={15} /> Encourage riders and drivers to verify UIUC email addresses.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5" size={15} /> Meet at public pickup points and share itinerary with friends.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5" size={15} /> Use in-app messaging before sharing personal details.
            </li>
          </ul>
        </motion.article>

        <motion.article
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          {...cardMotion}
        >
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <Phone size={18} />
            <h2 className="text-xl font-semibold">Contact & Support</h2>
          </div>
          <p className="text-sm text-slate-700">
            Questions, feedback, or reporting issues? Reach out and we’ll follow
            up as this MVP evolves.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p className="flex items-center gap-2">
              <Mail size={15} /> support@uiucrideboard.com
            </p>
            <p className="flex items-center gap-2">
              <User size={15} /> Built for UIUC intercity ride coordination
            </p>
          </div>
          <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
            <input
              type="email"
              placeholder="Your email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
            />
            <textarea
              rows="3"
              placeholder="How can we help?"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Send Message
            </button>
          </form>
        </motion.article>
      </section>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
    </main>
  )
}

export default App
