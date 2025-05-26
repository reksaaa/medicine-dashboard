// Client-side store for notification read status
// This is used to persist read status across page navigations

// Define a type for our notification store
type NotificationStore = {
  readNotifications: Set<string>
  isRead: (id: string) => boolean
  markAsRead: (id: string) => void
  markAllAsRead: (ids: string[]) => void
  debug: () => { readCount: number; ids: string[] }
}

// Create a singleton store with debounced save
let store: NotificationStore | null = null
let saveTimeoutId: NodeJS.Timeout | null = null

// Function to get or create the notification store
export function getNotificationStore(): NotificationStore {
  // If we're not in a browser environment, return a dummy store
  if (typeof window === "undefined") {
    return {
      readNotifications: new Set<string>(),
      isRead: () => false,
      markAsRead: () => {},
      markAllAsRead: () => {},
      debug: () => ({ readCount: 0, ids: [] }),
    }
  }

  // If the store already exists, return it
  if (store) {
    return store
  }

  // Initialize the set of read notifications from localStorage
  const readNotifications = new Set<string>()
  try {
    const storedIds = localStorage.getItem("readNotifications")
    if (storedIds) {
      // Parse once and add all at once for better performance
      JSON.parse(storedIds).forEach((id: string) => readNotifications.add(id))
    }
  } catch (error) {
    console.error("Error loading read notifications from localStorage:", error)
  }

  // Implement a debounced save to localStorage to prevent excessive writes
  const debouncedSave = (notifications: Set<string>) => {
    // Clear any existing timeout
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId)
    }
    
    // Set a new timeout
    saveTimeoutId = setTimeout(() => {
      try {
        localStorage.setItem("readNotifications", JSON.stringify(Array.from(notifications)))
      } catch (error) {
        console.error("Error saving read notifications to localStorage:", error)
      }
      saveTimeoutId = null
    }, 500) // 500ms debounce
  }

  // Create the store
  store = {
    readNotifications,

    // Check if a notification has been read
    isRead(id: string) {
      // If we're not in a browser environment, return false
      if (typeof window === "undefined") {
        return false
      }

      // Check if the ID is in the set of read notifications
      return this.readNotifications.has(id)
    },

    // Mark a notification as read
    markAsRead(id: string) {
      if (this.readNotifications.has(id)) return // Skip if already read
      
      this.readNotifications.add(id)
      debouncedSave(this.readNotifications)
    },

    // Mark multiple notifications as read
    markAllAsRead(ids: string[]) {
      let changed = false
      
      ids.forEach((id) => {
        if (!this.readNotifications.has(id)) {
          this.readNotifications.add(id)
          changed = true
        }
      })
      
      if (changed) {
        debouncedSave(this.readNotifications)
      }
    },

    // Debug function remains the same
    debug() {
      if (typeof window === "undefined") {
        return { readCount: 0, ids: [] }
      }

      return {
        readCount: this.readNotifications.size,
        ids: Array.from(this.readNotifications),
      }
    },
  }

  return store
}