"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { getNotifications, markNotificationAsRead, type Notification } from "@/lib/actions/notification"
import { cn } from "@/lib/utils"
import { getNotificationStore } from "@/lib/notification-store"

export function NotificationsHistory() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "read">("all")
  const [typeFilter, setTypeFilter] = useState<Notification["type"] | "all">("all")

  // Get the notification store
  const notificationStore = getNotificationStore()

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch notifications when component mounts
  useEffect(() => {
    if (!mounted) return

    async function fetchNotifications() {
      setIsLoading(true)
      try {
        // Get notifications from all units with no limit
        const response = await getNotifications()
        if (response.success && response.data) {
          // Apply read status from our persistent store
          const updatedNotifications = response.data.map((notification) => ({
            ...notification,
            isRead: notificationStore.isRead(notification.id),
          }))
          setNotifications(updatedNotifications)
          setFilteredNotifications(updatedNotifications)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Listen for notification read events from the bell component
    const handleNotificationRead = (event: CustomEvent) => {
      const { id } = event.detail
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      )
    }

    const handleAllNotificationsRead = () => {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, isRead: true })),
      )
    }

    window.addEventListener("notificationRead", handleNotificationRead as EventListener)
    window.addEventListener("allNotificationsRead", handleAllNotificationsRead)

    return () => {
      window.removeEventListener("notificationRead", handleNotificationRead as EventListener)
      window.removeEventListener("allNotificationsRead", handleAllNotificationsRead)
    }
  }, [mounted, notificationStore])

  // Apply filters and search
  useEffect(() => {
    if (!mounted) return

    let filtered = [...notifications]

    // Apply read/unread filter
    if (activeFilter === "unread") {
      filtered = filtered.filter((notification) => !notification.isRead)
    } else if (activeFilter === "read") {
      filtered = filtered.filter((notification) => notification.isRead)
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((notification) => notification.type === typeFilter)
    }

    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          notification.unitName?.toLowerCase().includes(query) ||
          notification.itemName?.toLowerCase().includes(query),
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, activeFilter, typeFilter, mounted])

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        // Add to persistent notification store
        notificationStore.markAsRead(notificationId)

        // Update local state
        setNotifications(
          notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: true } : notification,
          ),
        )

        // Dispatch a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("notificationRead", {
            detail: { id: notificationId },
          }),
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Get notification type color
  const getNotificationTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "success":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Notification History</CardTitle>
        <CardDescription>View all system notifications from the past month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("unread")}
              >
                Unread
              </Button>
              <Button
                variant={activeFilter === "read" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("read")}
              >
                Read
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            <span className="text-sm font-medium mr-2">Filter by type:</span>
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("all")}
            >
              All
            </Button>
            <Button
              variant={typeFilter === "info" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("info")}
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900"
            >
              Info
            </Button>
            <Button
              variant={typeFilter === "warning" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("warning")}
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900"
            >
              Warning
            </Button>
            <Button
              variant={typeFilter === "error" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("error")}
              className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
            >
              Error
            </Button>
            <Button
              variant={typeFilter === "success" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("success")}
              className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900"
            >
              Success
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn("rounded-lg border p-3 transition-colors", !notification.isRead && "bg-muted/20")}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          getNotificationTypeColor(notification.type),
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                    {notification.unitName && (
                      <p className="text-xs text-muted-foreground mt-1">Unit: {notification.unitName}</p>
                    )}
                    {!notification.isRead && (
                      <div className="flex justify-end mt-1">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-500"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Click to mark as read
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No notifications found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
