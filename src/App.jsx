import { useMemo, useState, useEffect, useCallback } from 'react'
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
  MessageSquare,
} from 'lucide-react'
import { useNotification } from './providers/NotificationProvider'
import { applicationAPI, authAPI, driverAPI, messageAPI, reportAPI, reviewAPI, riderAPI } from './api/client'
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
    fullName: '',
    email: '',
    primaryRoute: 'UIUC → ORD',
    availableSeats: '2',
    notes: '',
  })
  const [inboxMessages, setInboxMessages] = useState([])
  const [sentMessages, setSentMessages] = useState([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [adminChatMessages, setAdminChatMessages] = useState([])
  const [isLoadingAdminChats, setIsLoadingAdminChats] = useState(false)
  const [messageTab, setMessageTab] = useState('inbox')
  const [isMarkingReadId, setIsMarkingReadId] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [isSendingReplyId, setIsSendingReplyId] = useState(null)
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
  const [adminReports, setAdminReports] = useState([])
  const [isLoadingAdminReports, setIsLoadingAdminReports] = useState(false)
  const [isUpdatingAdminReportId, setIsUpdatingAdminReportId] = useState(null)
  const { addNotification } = useNotification()

  const routes = [
    'All routes',
    'UIUC → ORD',
    'ORD → UIUC',
    'UIUC → Midway',
    'UIUC → Downtown Chicago',
  ]

  const [selectedRoute, setSelectedRoute] = useState('All routes')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeUtilityPanel, setActiveUtilityPanel] = useState(null)
  const [showAllDriverListings, setShowAllDriverListings] = useState(false)
  const [adminHistorySearchTerm, setAdminHistorySearchTerm] = useState('')
  const [showAllAdminDriverHistory, setShowAllAdminDriverHistory] = useState(false)

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

        const mappedDrivers = drivers.map((driver) => ({
          id: driver.id,
          userId: driver.user_id,
          name: driver.user_name || `Driver #${driver.id}`,
          route: driver.route,
          seats: driver.available_seats,
          pricePerSeat: driver.price_per_seat || 0,
          skills: driver.skills || '',
          labels: driver.labels || '',
          ratingAverage: driver.rating_average || 0,
          ratingCount: driver.rating_count || 0,
          rideHistoryCount: driver.ride_history_count || 0,
          departure: driver.departure_time,
          vehicle: driver.vehicle,
          pickupLocation: driver.pickup_location || '',
          notesRaw: driver.notes || '',
          note: [driver.pickup_location, driver.notes].filter(Boolean).join(' • '),
        }))

        const mappedRequests = requests.map((request) => ({
          id: request.id,
          userId: request.user_id,
          route: request.route,
          rider: request.user_name || `Rider #${request.id}`,
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

  const unreadInboxCount = useMemo(
    () => inboxMessages.filter((message) => !message.is_read).length,
    [inboxMessages]
  )

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

        conversationMap.set(key, {
          key,
          participantAId: participantIds[0],
          participantBId: participantIds[1],
          participantALabel: firstLabel,
          participantBLabel: secondLabel,
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

    try {
      await messageAPI.sendMessage(
        driver.userId,
        `Ride inquiry: ${driver.route}`,
        `Hi! I am interested in your ${driver.route} ride (${driver.departure}).`
      )
      addNotification({
        type: 'success',
        title: 'Message sent',
        message: 'Your interest was sent to the driver.',
      })
      loadMessages()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not send message',
        message: error.message || 'Please try again.',
      })
    }
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

  const handleApplicationSubmit = async (event) => {
    event.preventDefault()
    if (!requireAuth()) return

    const seats = Number(applicationForm.availableSeats)
    if (!applicationForm.fullName.trim() || !applicationForm.email.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing fields',
        message: 'Please fill in your full name and email.',
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
        email: applicationForm.email,
        primary_route: applicationForm.primaryRoute,
        available_seats: seats,
        notes: applicationForm.notes,
      })
      addNotification({
        type: 'success',
        title: 'Application submitted',
        message: 'Your driver application was sent successfully.',
      })
      loadMyApplications()
      loadAdminApplications()
      setApplicationForm((prev) => ({
        ...prev,
        availableSeats: '2',
        notes: '',
      }))
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
      const mappedDrivers = drivers.map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.user_name || `Driver #${item.id}`,
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
      }))
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

      const mappedDriver = {
        id: created.id,
        userId: created.user_id,
        name: created.user_name || user?.name || `Driver #${created.id}`,
        route: created.route,
        seats: created.available_seats,
        pricePerSeat: created.price_per_seat || 0,
        skills: created.skills || '',
        labels: created.labels || '',
        ratingAverage: created.rating_average || 0,
        ratingCount: created.rating_count || 0,
        rideHistoryCount: created.ride_history_count || 0,
        departure: created.departure_time,
        vehicle: created.vehicle,
        pickupLocation: created.pickup_location || '',
        notesRaw: created.notes || '',
        note: [created.pickup_location, created.notes].filter(Boolean).join(' • '),
      }

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
                route: updated.route,
                vehicle: updated.vehicle,
                seats: updated.available_seats,
                pricePerSeat: updated.price_per_seat || 0,
                skills: updated.skills || '',
                labels: updated.labels || '',
                ratingAverage: updated.rating_average || 0,
                ratingCount: updated.rating_count || 0,
                rideHistoryCount: updated.ride_history_count || 0,
                departure: updated.departure_time,
                pickupLocation: updated.pickup_location || '',
                notesRaw: updated.notes || '',
                note: [updated.pickup_location, updated.notes].filter(Boolean).join(' • '),
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

    return driverListings.filter((driver) => {
      const routeMatch =
        selectedRoute === 'All routes' || driver.route === selectedRoute

      const keywordMatch =
        keyword.length === 0 ||
        [driver.name, driver.route, driver.vehicle, driver.note]
          .join(' ')
          .toLowerCase()
          .includes(keyword)

      return routeMatch && keywordMatch
    })
  }, [driverListings, searchTerm, selectedRoute])

  const visibleDrivers = useMemo(() => {
    if (showAllDriverListings) return filteredDrivers
    return filteredDrivers.slice(0, 6)
  }, [filteredDrivers, showAllDriverListings])

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

  const cardMotion = {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.35 },
    viewport: { once: true, amount: 0.15 },
  }

  const formatMessageTime = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown time'

    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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

  const handleReplyChange = (messageId, value) => {
    setReplyDrafts((prev) => ({ ...prev, [messageId]: value }))
  }

  const handleSendReply = async (message) => {
    const replyBody = (replyDrafts[message.id] || '').trim()
    if (!replyBody) {
      addNotification({
        type: 'warning',
        title: 'Reply is empty',
        message: 'Write a message before sending.',
      })
      return
    }

    try {
      setIsSendingReplyId(message.id)
      const replySubject = message.subject.startsWith('Re: ')
        ? message.subject
        : `Re: ${message.subject}`

      await messageAPI.sendMessage(message.sender_id, replySubject, replyBody)

      setReplyDrafts((prev) => ({ ...prev, [message.id]: '' }))
      addNotification({
        type: 'success',
        title: 'Reply sent',
        message: `Your reply was sent to ${message.sender_name || `User #${message.sender_id}`}.`,
      })
      loadMessages()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Could not send reply',
        message: error.message || 'Please try again.',
      })
    } finally {
      setIsSendingReplyId(null)
    }
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bus size={24} className="text-blue-600" />
              <span className="hidden text-lg font-semibold text-slate-900 sm:inline">
                UIUC Ride Board
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                title="Message Box"
                aria-label="Message Box"
                onClick={() =>
                  setActiveUtilityPanel((prev) => (prev === 'messages' ? null : 'messages'))
                }
                className={`inline-flex items-center justify-center rounded-lg border p-2 transition ${
                  activeUtilityPanel === 'messages'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={16} />
              </button>

              <button
                title="Driver Application"
                aria-label="Driver Application"
                onClick={() =>
                  setActiveUtilityPanel((prev) => (prev === 'application' ? null : 'application'))
                }
                className={`inline-flex items-center justify-center rounded-lg border p-2 transition ${
                  activeUtilityPanel === 'application'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <User size={16} />
              </button>

              <button
                title="Post a Driver Listing"
                aria-label="Post a Driver Listing"
                onClick={() =>
                  setActiveUtilityPanel((prev) => (prev === 'listing' ? null : 'listing'))
                }
                className={`inline-flex items-center justify-center rounded-lg border p-2 transition ${
                  activeUtilityPanel === 'listing'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Car size={16} />
              </button>
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
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                value={selectedRoute}
                onChange={(event) => setSelectedRoute(event.target.value)}
              >
                {routes.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
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
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                value={driverForm.route}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, route: event.target.value }))
                }
              >
                {routes.slice(1).map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
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
                type="text"
                value={driverForm.departure}
                onChange={(event) =>
                  setDriverForm((prev) => ({ ...prev, departure: event.target.value }))
                }
                placeholder="Fri, 4:30 PM"
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
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Cost per seat ($)</span>
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
                    View ride inquiries and offers you have sent or received.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMessageTab('inbox')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      messageTab === 'inbox'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Inbox{unreadInboxCount > 0 ? ` (${unreadInboxCount})` : ''}
                  </button>
                  <button
                    onClick={() => setMessageTab('sent')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      messageTab === 'sent'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Sent
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {isLoadingMessages ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Loading messages...
                  </div>
                ) : null}

                {user?.is_admin ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Admin Chat Monitor</h3>
                      <button
                        onClick={() => loadAdminChats({ showError: true })}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Refresh
                      </button>
                    </div>

                    {isLoadingAdminChats ? (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        Loading conversations...
                      </div>
                    ) : null}

                    <div className="mt-3 space-y-3">
                      {adminChatConversations.map((conversation) => (
                        <article key={conversation.key} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                          <p className="text-xs font-semibold text-slate-800">
                            {conversation.participantALabel} ↔ {conversation.participantBLabel}
                          </p>
                          <div className="mt-2 space-y-2">
                            {conversation.messages.map((message) => (
                              <div
                                key={`admin-chat-${message.id}`}
                                className={`rounded-md px-2.5 py-2 text-xs ${
                                  message.sender_id === conversation.participantAId
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'bg-indigo-50 text-indigo-900'
                                }`}
                              >
                                <p className="font-semibold">
                                  {message.sender_name || `User #${message.sender_id}`} → {message.recipient_name || `User #${message.recipient_id}`}
                                </p>
                                <p className="mt-1">{message.body}</p>
                                <p className="mt-1 text-[10px] text-slate-500">{formatMessageTime(message.created_at)}</p>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}

                      {!isLoadingAdminChats && adminChatConversations.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-600">
                          No chat history is available yet.
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {(messageTab === 'inbox' ? inboxMessages : sentMessages).map((message) => {
                  const isInboxView = messageTab === 'inbox'
                  const replyDraft = replyDrafts[message.id] || ''

                  return (
                    <article
                      key={message.id}
                      className={`rounded-xl border p-4 ${
                        isInboxView && !message.is_read
                          ? 'border-blue-200 bg-blue-50/40'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{message.subject}</h3>
                            {isInboxView && !message.is_read ? (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                New
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {isInboxView
                              ? `From ${message.sender_name || `User #${message.sender_id}`}`
                              : `To ${message.recipient_name || `User #${message.recipient_id}`}`} • ${formatMessageTime(message.created_at)}
                          </p>
                        </div>
                        {isInboxView && !message.is_read ? (
                          <button
                            onClick={() => handleMarkMessageRead(message.id)}
                            disabled={isMarkingReadId === message.id}
                            className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
                          >
                            {isMarkingReadId === message.id ? 'Saving...' : 'Mark as read'}
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{message.body}</p>

                      {isInboxView ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            rows="2"
                            value={replyDraft}
                            onChange={(event) => handleReplyChange(message.id, event.target.value)}
                            placeholder="Write a quick reply..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                          />
                          <div>
                            <button
                              onClick={() => handleSendReply(message)}
                              disabled={isSendingReplyId === message.id}
                              className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                            >
                              {isSendingReplyId === message.id ? 'Sending...' : 'Send Reply'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )
                })}

                {!isLoadingMessages && (messageTab === 'inbox' ? inboxMessages : sentMessages).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                    {messageTab === 'inbox'
                      ? 'No messages yet. When riders or drivers contact you, they will appear here.'
                      : 'You have not sent any messages yet.'}
                  </div>
                ) : null}
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
              Interested in posting rides? Submit your basic info below.
            </p>
            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleApplicationSubmit}>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
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
                <span className="mb-1.5 block text-sm font-medium text-slate-700">UIUC email</span>
                <input
                  type="email"
                  placeholder="netid@illinois.edu"
                  value={applicationForm.email}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Primary route</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                  value={applicationForm.primaryRoute}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({ ...prev, primaryRoute: event.target.value }))
                  }
                >
                  {routes.slice(1).map((route) => (
                    <option key={route}>{route}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Available seats</span>
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
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Submit Application
                </button>
              </div>
            </form>
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
          {visibleDrivers.map((driver) => (
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
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{driver.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin size={15} /> {driver.route}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ⭐ {Number(driver.ratingAverage || 0).toFixed(1)} ({driver.ratingCount || 0} rating{(driver.ratingCount || 0) === 1 ? '' : 's'}) • {driver.rideHistoryCount || 0} rides in history
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {editingDriverId === driver.id ? (
                    <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                      Editing...
                    </span>
                  ) : null}
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {driver.seats} seat{driver.seats === 1 ? '' : 's'}
                  </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      ${Number(driver.pricePerSeat || 0).toFixed(2)}/seat
                    </span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {editingDriverId === driver.id ? (
                  <div className="grid gap-2">
                    <select
                      value={editingDriverForm.route}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, route: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 transition focus:ring"
                    >
                      {routes.slice(1).map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editingDriverForm.departure}
                      onChange={(event) =>
                        setEditingDriverForm((prev) => ({ ...prev, departure: event.target.value }))
                      }
                      placeholder="Departure time"
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
                    <p className="flex items-center gap-2">
                      <Clock3 size={15} /> Departure: {driver.departure}
                    </p>
                    <p className="flex items-center gap-2">
                      <Car size={15} /> Vehicle: {driver.vehicle}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Cost:</span> ${Number(driver.pricePerSeat || 0).toFixed(2)} per seat
                    </p>
                    {driver.skills ? <p>Skills: {driver.skills}</p> : null}
                    {driver.labels ? <p>Labels: {driver.labels}</p> : null}
                    <p>{driver.note}</p>
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
                      onClick={() => handleContactDriver(driver)}
                      className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Contact
                    </button>
                    <button className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      View Details
                    </button>
                    {user && (user.id === driver.userId || user.is_admin) ? (
                      <>
                        <button
                          onClick={() => handleEditDriverListing(driver)}
                          className="rounded-lg border border-blue-300 px-3.5 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
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

              {user && user.id !== driver.userId ? (
                <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
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
                </div>
              ) : null}
            </motion.article>
          ))}
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
            No listings matched your search. Try a different route or keyword.
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
                      <p className="font-medium text-slate-900">{driver.full_name}</p>
                      <p className="mt-1 text-xs text-slate-600">{driver.email}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Route: {driver.primary_route} • Seats: {driver.available_seats}
                      </p>
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
                          Driver: {ride.driverName} ({ride.driverEmail})
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
                        <h4 className="text-sm font-semibold text-slate-900">{driverHistory.driver_name}</h4>
                        <p className="mt-1 text-xs text-slate-600">{driverHistory.driver_email}</p>
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
                        <p className="mt-1 text-xs text-slate-600">
                          Reporter: {report.reporter_name || `User #${report.reporter_id}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Against: {report.against_user_name || `User #${report.against_user_id}`} • Listing #{report.driver_listing_id}
                        </p>
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
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                value={requestForm.route}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, route: event.target.value }))
                }
              >
                {routes.slice(1).map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Departure timing</span>
              <input
                type="text"
                value={requestForm.departure}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, departure: event.target.value }))
                }
                placeholder="Sunday evening"
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
          {riderRequests.map((request) => (
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
                  <select
                    value={editingRequestForm.route}
                    onChange={(event) =>
                      setEditingRequestForm((prev) => ({ ...prev, route: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-700 outline-none ring-blue-200 transition focus:ring"
                  >
                    {routes.slice(1).map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                ) : (
                  request.route
                )}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{request.rider}</h3>
              <div className="mt-2 space-y-2">
                {editingRequestId === request.id ? (
                  <>
                    <input
                      type="text"
                      value={editingRequestForm.departure}
                      onChange={(event) =>
                        setEditingRequestForm((prev) => ({ ...prev, departure: event.target.value }))
                      }
                      placeholder="Departure timing"
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
                    <p className="text-sm text-slate-600">{request.timing}</p>
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
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">

        {user && !user.is_admin ? (
          <motion.div
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            {...cardMotion}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">My Application Status</h3>
              <button
                onClick={() => loadMyApplications({ showError: true })}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>

            {isLoadingMyApplications ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Loading your applications...
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {myApplications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{application.primary_route}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Seats: {application.available_seats} • Submitted {formatMessageTime(application.created_at)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getApplicationStatusClass(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                  {application.notes ? (
                    <p className="mt-2 text-sm text-slate-700">{application.notes}</p>
                  ) : null}
                </article>
              ))}

              {!isLoadingMyApplications && myApplications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                  You have not submitted a driver application yet.
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}

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
                      <h4 className="text-sm font-semibold text-slate-900">
                        {application.full_name}
                      </h4>
                      <p className="mt-1 text-xs text-slate-600">{application.email}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {application.primary_route} • {application.available_seats} seat{application.available_seats === 1 ? '' : 's'}
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
