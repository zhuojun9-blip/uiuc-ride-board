const BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('rideboard_token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error('Network error: could not reach the backend service.')
  }

  // Handle 401 unauthorized
  if (response.status === 401) {
    localStorage.removeItem('rideboard_user')
    localStorage.removeItem('rideboard_token')
    window.location.href = '/'
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    const fallbackMessage = `API error (${response.status}): ${response.statusText}`
    throw new Error(error?.detail || error?.message || fallbackMessage)
  }

  return response.json()
}

// Auth endpoints
export const authAPI = {
  register: (email, password, name) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () => apiCall('/auth/me'),

  uploadAvatar: async (file) => {
    const token = localStorage.getItem('rideboard_token')
    const formData = new FormData()
    formData.append('file', file)

    let response
    try {
      response = await fetch(`${BASE_URL}/auth/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
    } catch {
      throw new Error('Network error: could not reach the backend service.')
    }

    if (response.status === 401) {
      localStorage.removeItem('rideboard_user')
      localStorage.removeItem('rideboard_token')
      window.location.href = '/'
    }

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      const fallbackMessage = `API error (${response.status}): ${response.statusText}`
      throw new Error(error?.detail || error?.message || fallbackMessage)
    }

    return response.json()
  },
}

// Driver endpoints
export const driverAPI = {
  createListing: (data) =>
    apiCall('/drivers/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getListings: (route = null) => {
    const query = route ? `?route=${encodeURIComponent(route)}` : ''
    return apiCall(`/drivers/${query}`)
  },

  getDriver: (id) => apiCall(`/drivers/${id}`),

  updateListing: (id, data) =>
    apiCall(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteListing: (id) =>
    apiCall(`/drivers/${id}`, {
      method: 'DELETE',
    }),

  getAdminOverview: () => apiCall('/drivers/admin/overview'),

  getAdminDriverHistory: (driverUserId) => apiCall(`/drivers/admin/history/${driverUserId}`),
}

// Rider request endpoints
export const riderAPI = {
  createRequest: (data) =>
    apiCall('/requests/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRequests: (route = null) => {
    const query = route ? `?route=${encodeURIComponent(route)}` : ''
    return apiCall(`/requests/${query}`)
  },

  getRequest: (id) => apiCall(`/requests/${id}`),

  updateRequest: (id, data) =>
    apiCall(`/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRequest: (id) =>
    apiCall(`/requests/${id}`, {
      method: 'DELETE',
    }),
}

// Driver application endpoints
export const applicationAPI = {
  submitApplication: (data) =>
    apiCall('/applications/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyApplications: () => apiCall('/applications/'),

  getAllApplications: () => apiCall('/applications/all'),

  getApplication: (id) => apiCall(`/applications/${id}`),

  updateApplication: (id, data) =>
    apiCall(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateApplicationStatus: (id, status) =>
    apiCall(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  deleteApplication: (id) =>
    apiCall(`/applications/${id}`, {
      method: 'DELETE',
    }),
}

// Message endpoints
export const messageAPI = {
  sendMessage: (recipientId, subject, body) =>
    apiCall('/messages/', {
      method: 'POST',
      body: JSON.stringify({
        recipient_id: recipientId,
        subject,
        body,
      }),
    }),

  getInbox: () => apiCall('/messages/inbox'),

  getSent: () => apiCall('/messages/sent'),

  getAdminMessages: () => apiCall('/messages/admin/all'),

  markAsRead: (id) =>
    apiCall(`/messages/${id}/read`, {
      method: 'PUT',
    }),
}

export const reviewAPI = {
  createReview: (data) =>
    apiCall('/reviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDriverReviews: (driverUserId) => apiCall(`/reviews/driver/${driverUserId}`),
}

export const reportAPI = {
  createReport: (data) =>
    apiCall('/reports/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyReports: () => apiCall('/reports/mine'),

  getAdminReports: () => apiCall('/reports/admin/all'),

  updateReportStatus: (reportId, status) =>
    apiCall(`/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
}
