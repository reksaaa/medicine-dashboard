"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/actions/notification"
import { cn } from "@/lib/utils"
import { getNotificationStore } from "@/lib/notification-store"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Get the notification store
  const notificationStore = getNotificationStore()

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch notifications when component mounts or popover opens
  useEffect(() => {
    if (!mounted) return

    async function fetchNotifications() {
      setIsLoading(true)
      try {
        // Get all notifications without limit
        const response = await getNotifications()
        if (response.success && response.data) {
          // Apply read status from our persistent store
          const allNotifications = response.data.map((notification) => ({
            ...notification,
            isRead: notificationStore.isRead(notification.id),
          }))

          // Filter to only show unread notifications in the bell dropdown
          const unreadNotifications = allNotifications.filter((notification) => !notification.isRead)

          // Set the notifications and update the unread count
          setNotifications(unreadNotifications)
          setUnreadCount(unreadNotifications.length)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch on client-side to avoid hydration mismatch
    if (mounted) {
      fetchNotifications()
    }
  }, [mounted, isOpen, notificationStore])

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        // Add to persistent notification store
        notificationStore.markAsRead(notificationId)

        // Update local state - remove the notification from the bell dropdown
        const updatedNotifications = notifications.filter((notification) => notification.id !== notificationId)
        setNotifications(updatedNotifications)
        setUnreadCount(updatedNotifications.length)

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

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        // Add all notification IDs to persistent store
        notificationStore.markAllAsRead(notifications.map((n) => n.id))

        // Update local state - clear all notifications from the bell dropdown
        setNotifications([])
        setUnreadCount(0)

        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent("allNotificationsRead"))
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
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
    if (!mounted) return "" // Return empty string during server-side rendering

    const now = new Date()
    const diffInMs = now.getTime() - new Date(date).getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hr ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
    } else {
      return new Date(date).toLocaleDateString()
    }
  }

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="h-80">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-1 p-3 transition-colors hover:bg-muted/50",
                    !notification.isRead && "bg-muted/20",
                  )}
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
                  <p className="text-sm">{notification.message}</p>
                  {!notification.isRead && (
                    <div className="flex justify-end">
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
          <div className="flex items-center justify-center p-4">
            <p className="text-muted-foreground">No notifications</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
