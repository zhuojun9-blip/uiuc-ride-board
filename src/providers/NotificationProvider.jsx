import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export const NotificationContext = React.createContext()

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now()
    const newNotif = {
      id,
      ...notification,
      createdAt: new Date()
    }

    setNotifications((prev) => [...prev, newNotif])

    // Auto-remove after 5 seconds
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(id)
      }, 5000)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

function NotificationContainer({ notifications, onRemove }) {
  return (
    <div className="fixed right-4 top-20 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className={`rounded-lg p-4 shadow-lg text-white flex items-start justify-between gap-3 ${
              notif.type === 'error'
                ? 'bg-red-500'
                : notif.type === 'success'
                  ? 'bg-green-500'
                  : notif.type === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold text-sm">{notif.title}</p>
              {notif.message && <p className="text-xs opacity-90 mt-1">{notif.message}</p>}
            </div>
            <button
              onClick={() => onRemove(notif.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export const useNotification = () => {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
