"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
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

// Improved global cache that preserves user's view state
let globalNotificationCache: {
  allNotifications: Notification[]
  lastFetchTime: number
  unreadCount: number
  hasMore: boolean
  page: number
  displayedNotifications: Notification[] // Track exactly what's being displayed
} | null = null;

// Constants for pagination
const NOTIFICATIONS_PER_PAGE = 20;
const CACHE_DURATION_MS = 1 * 60 * 1000; // 1 minute cache

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Reference to track if we're currently fetching
  const isFetchingRef = useRef(false)

  // Reference to track when we last fetched
  const lastFetchTimeRef = useRef(0)

  // Get the notification store
  const notificationStore = getNotificationStore()

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoized function to fetch notifications
  const fetchNotifications = useCallback(async (options: { 
    force?: boolean, 
    reset?: boolean,
    page?: number,
    preserveDisplayed?: boolean // New option to preserve what's displayed
  } = {}) => {
    const { 
      force = false, 
      reset = false, 
      page = 1,
      preserveDisplayed = false 
    } = options;
    
    // Don't fetch if we're already fetching
    if (isFetchingRef.current) return;

    // If we're reopening with cache, restore the view state without fetching
    const now = Date.now();
    if (!force && !reset && globalNotificationCache && 
        (now - lastFetchTimeRef.current < CACHE_DURATION_MS)) {
      
      if (preserveDisplayed && globalNotificationCache.displayedNotifications) {
        // Restore the exact displayed notifications from cache
        setNotifications(globalNotificationCache.displayedNotifications);
        setUnreadCount(globalNotificationCache.unreadCount);
        setHasMore(globalNotificationCache.hasMore);
        setCurrentPage(globalNotificationCache.page);
        setIsLoading(false);
        return;
      } else if (page === 1) {
        // Use cached data for first page
        const firstPageNotifications = globalNotificationCache.allNotifications
          .filter(notification => !notificationStore.isRead(notification.id))
          .slice(0, NOTIFICATIONS_PER_PAGE);
          
        setNotifications(firstPageNotifications);
        setUnreadCount(globalNotificationCache.unreadCount);
        setIsLoading(false);
        setHasMore(globalNotificationCache.hasMore);
        setCurrentPage(1);
        
        // Update displayed notifications in cache
        if (globalNotificationCache) {
          globalNotificationCache.displayedNotifications = firstPageNotifications;
        }
        return;
      } else if (page <= globalNotificationCache.page) {
        // We're within cached pages, reconstruct pagination view
        const pagedNotifications = globalNotificationCache.allNotifications
          .filter(notification => !notificationStore.isRead(notification.id))
          .slice(0, page * NOTIFICATIONS_PER_PAGE);
          
        setNotifications(pagedNotifications);
        setUnreadCount(globalNotificationCache.unreadCount);
        setIsLoading(false);
        setHasMore(globalNotificationCache.hasMore);
        setCurrentPage(page);
        
        // Update displayed notifications in cache
        if (globalNotificationCache) {
          globalNotificationCache.displayedNotifications = pagedNotifications;
        }
        return;
      } else if (page === globalNotificationCache.page + 1) {
        // We're just loading the next page, set loading more state
        setIsLoadingMore(true);
      }
    } else if (reset || page === 1) {
      // Full reset or first page - show full loading state
      setIsLoading(true);
      setNotifications([]);
    } else {
      // Loading subsequent pages
      setIsLoadingMore(true);
    }

    // Set fetching flag
    isFetchingRef.current = true;

    try {
      // Get notifications with pagination
      const response = await getNotifications(undefined, page * NOTIFICATIONS_PER_PAGE);
      
      if (response.success && response.data) {
        // Apply read status from our persistent store
        const fetchedNotifications = response.data.map(notification => ({
          ...notification,
          isRead: notificationStore.isRead(notification.id)
        }));

        // Filter to only show unread notifications
        const unreadNotifications = fetchedNotifications.filter(
          notification => !notification.isRead
        );

        // Determine if we have more notifications to load
        const hasMoreNotifications = fetchedNotifications.length >= page * NOTIFICATIONS_PER_PAGE;

        // Get paged notifications for display based on the current page
        const pagedUnreadNotifications = unreadNotifications.slice(0, page * NOTIFICATIONS_PER_PAGE);

        // Update global cache
        globalNotificationCache = {
          allNotifications: fetchedNotifications,
          lastFetchTime: now,
          unreadCount: unreadNotifications.length,
          hasMore: hasMoreNotifications,
          page: page,
          displayedNotifications: pagedUnreadNotifications
        };

        // Update component state
        if (reset || page === 1) {
          setNotifications(pagedUnreadNotifications.slice(0, NOTIFICATIONS_PER_PAGE));
        } else {
          // When loading more, preserve current and add new
          setNotifications(pagedUnreadNotifications);
        }
        
        setUnreadCount(unreadNotifications.length);
        setHasMore(hasMoreNotifications);
        setCurrentPage(page);

        // Update last fetch time
        lastFetchTimeRef.current = now;
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [notificationStore]);

  // Load more notifications
  const loadMoreNotifications = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchNotifications({ page: currentPage + 1 });
    }
  }, [fetchNotifications, currentPage, hasMore, isLoadingMore, isLoading]);

  // Fetch notifications when component mounts
  useEffect(() => {
    if (!mounted) return;

    // Initial fetch
    fetchNotifications({ reset: true });

    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(
      () => {
        fetchNotifications({ force: true, reset: true });
      },
      5 * 60 * 1000
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [mounted, fetchNotifications]);

  // Fetch when popover opens - MODIFIED to preserve view state
  useEffect(() => {
    if (isOpen && mounted) {
      if (globalNotificationCache?.displayedNotifications?.length) {
        // Reopen - preserve current view state
        fetchNotifications({ preserveDisplayed: true });
      } else {
        // Initial open - start fresh
        fetchNotifications({ reset: true });
      }
    }
  }, [isOpen, mounted, fetchNotifications]);

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId: string, event?: React.MouseEvent) => {
    // Prevent event bubbling which can cause double-firing
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Prevent duplicate processing
    if (notificationStore.isRead(notificationId)) {
      return;
    }

    try {
      // Remove just this notification from display
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Add to persistent notification store
      notificationStore.markAsRead(notificationId);

      // Update global cache
      if (globalNotificationCache) {
        // Mark as read in all notifications
        globalNotificationCache.allNotifications = globalNotificationCache.allNotifications.map(notification =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        );
        
        // Update displayed notifications
        globalNotificationCache.displayedNotifications = updatedNotifications;
        
        // Recalculate unread count
        const unreadNotifications = globalNotificationCache.allNotifications.filter(
          notification => !notification.isRead
        );
        globalNotificationCache.unreadCount = unreadNotifications.length;
      }

      // Make the API call after UI is updated
      await markNotificationAsRead(notificationId);

      // Dispatch a custom event to notify other components
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("notificationRead", {
            detail: { id: notificationId },
          })
        );
      }, 10);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      // Optimize by collecting IDs first
      const notificationIds = notifications.map(n => n.id);
      
      // Update local state immediately
      setNotifications([]);
      setUnreadCount(0);
      
      // Add all notification IDs to persistent store
      notificationStore.markAllAsRead(notificationIds);
      
      // Update global cache
      if (globalNotificationCache) {
        // Mark all as read in complete notification list
        globalNotificationCache.allNotifications = globalNotificationCache.allNotifications.map(notification => ({
          ...notification,
          isRead: true,
        }));
        
        // Clear displayed notifications since all are read
        globalNotificationCache.displayedNotifications = [];
        globalNotificationCache.unreadCount = 0;
      }
      
      // Call API after UI updates
      await markAllNotificationsAsRead();
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent("allNotificationsRead"));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // The rest of your component remains the same...
  
  // Get notification type color
  const getNotificationTypeColor = useCallback((type: Notification["type"]) => {
    switch (type) {
      case "info": return "bg-blue-100 text-blue-800";
      case "warning": return "bg-amber-100 text-amber-800";
      case "error": return "bg-red-100 text-red-800";
      case "success": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }, []);

  // Format date
  const formatDate = useCallback((date: Date) => {
    if (!mounted) return "";

    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hr ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  }, [mounted]);

  // Handle scroll to implement infinite loading
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    // If we're near the bottom and we have more to load
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoadingMore) {
      loadMoreNotifications();
    }
  }, [hasMore, isLoadingMore, loadMoreNotifications]);

  // Listen for notification read events from other components
  useEffect(() => {
    if (!mounted) return;

    let isProcessingNotification = false;

    const handleNotificationRead = (event: CustomEvent) => {
      if (isProcessingNotification) return;
      isProcessingNotification = true;

      const { id } = event.detail;

      // Skip if already marked as read
      if (!notifications.some(n => n.id === id)) {
        isProcessingNotification = false;
        return;
      }

      // Update local state efficiently
      const updatedNotifications = notifications.filter(notification => notification.id !== id);
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Update global cache
      if (globalNotificationCache) {
        globalNotificationCache.allNotifications = globalNotificationCache.allNotifications.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        );
        
        // Update displayed notifications to match current view
        globalNotificationCache.displayedNotifications = updatedNotifications;
        
        // Recalculate unread count
        const unreadNotifications = globalNotificationCache.allNotifications.filter(
          notification => !notification.isRead
        );
        globalNotificationCache.unreadCount = unreadNotifications.length;
      }

      setTimeout(() => {
        isProcessingNotification = false;
      }, 50);
    };

    const handleAllNotificationsRead = () => {
      // Update global cache
      if (globalNotificationCache) {
        globalNotificationCache.allNotifications = globalNotificationCache.allNotifications.map(notification => ({
          ...notification,
          isRead: true,
        }));
        globalNotificationCache.displayedNotifications = [];
        globalNotificationCache.unreadCount = 0;
      }

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    };

    // Add event listeners
    window.addEventListener("notificationRead", handleNotificationRead as EventListener);
    window.addEventListener("allNotificationsRead", handleAllNotificationsRead);

    // Clean up
    return () => {
      window.removeEventListener("notificationRead", handleNotificationRead as EventListener);
      window.removeEventListener("allNotificationsRead", handleAllNotificationsRead);
    };
  }, [mounted, notifications]);

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
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
          <ScrollArea className="h-80" onScroll={handleScroll}>
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-1 p-3 transition-colors hover:bg-muted/50",
                    !notification.isRead && "bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        getNotificationTypeColor(notification.type)
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
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                      >
                        Mark as read
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {isLoadingMore && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Loading more...
                </div>
              )}
              {!isLoadingMore && hasMore && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full p-2" 
                  onClick={loadMoreNotifications}
                >
                  Load more
                </Button>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center p-4">
            <p className="text-muted-foreground">No notifications</p>
          </div>
        )}
      
      </PopoverContent>
    </Popover>
  );
}