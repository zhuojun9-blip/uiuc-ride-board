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

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 unauthorized
  if (response.status === 401) {
    localStorage.removeItem('rideboard_user')
    localStorage.removeItem('rideboard_token')
    window.location.href = '/'
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `API error: ${response.statusText}`)
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

  getApplication: (id) => apiCall(`/applications/${id}`),

  updateApplication: (id, data) =>
    apiCall(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  markAsRead: (id) =>
    apiCall(`/messages/${id}/read`, {
      method: 'PUT',
    }),
}
