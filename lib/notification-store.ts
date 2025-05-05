// This file creates a persistent store for notification read status
// that will be shared across all components and persist across page navigations

// Create a type for our notification store
export type NotificationStore = {
    readIds: Set<string>
    markAsRead: (id: string) => void
    markAllAsRead: (ids: string[]) => void
    isRead: (id: string) => boolean
  }
  
  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"
  
  // Initialize the store
  let store: NotificationStore
  
  // Create a function to initialize the store
  const createStore = (): NotificationStore => {
    // Try to load previously saved read IDs from localStorage
    let savedReadIds: string[] = []
    if (isBrowser) {
      try {
        const saved = localStorage.getItem("notification-read-ids")
        if (saved) {
          savedReadIds = JSON.parse(saved)
        }
      } catch (error) {
        console.error("Failed to load notification read status from localStorage:", error)
      }
    }
  
    // Create a new Set with the saved read IDs
    const readIds = new Set<string>(savedReadIds)
  
    // Create the store object
    return {
      readIds,
      markAsRead: (id: string) => {
        readIds.add(id)
        // Save to localStorage
        if (isBrowser) {
          try {
            localStorage.setItem("notification-read-ids", JSON.stringify([...readIds]))
          } catch (error) {
            console.error("Failed to save notification read status to localStorage:", error)
          }
        }
      },
      markAllAsRead: (ids: string[]) => {
        ids.forEach((id) => readIds.add(id))
        // Save to localStorage
        if (isBrowser) {
          try {
            localStorage.setItem("notification-read-ids", JSON.stringify([...readIds]))
          } catch (error) {
            console.error("Failed to save notification read status to localStorage:", error)
          }
        }
      },
      isRead: (id: string) => readIds.has(id),
    }
  }
  
  // Get the store (initialize it if it doesn't exist)
  export const getNotificationStore = (): NotificationStore => {
    if (!store) {
      store = createStore()
    }
    return store
  }
  