import React, { useState, useEffect } from 'react';
import { Bell, X, Eye, EyeOff, CheckCircle, AlertCircle, Clock, MapPin, User } from 'lucide-react';
import { adminApi, AdminNotification } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '../hooks/use-toast';

interface AdminNotificationsProps {
  className?: string;
}

export function AdminNotifications({ className }: AdminNotificationsProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getNotifications({
        unreadOnly: showUnreadOnly,
        limit: 50
      });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await adminApi.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'READ' as const } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast({
        title: "Marked as read",
        description: "Notification has been marked as read",
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await adminApi.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'READ' as const }))
      );
      setUnreadCount(0);
      toast({
        title: "All marked as read",
        description: "All notifications have been marked as read",
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [showUnreadOnly]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [showUnreadOnly]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNotificationIcon = (notification: AdminNotification) => {
    if (notification.metadata?.action === 'VENUE_APPROVAL_REQUIRED') {
      return <AlertCircle className="h-5 w-5 text-orange-600" />;
    }
    return <Bell className="h-5 w-5 text-blue-600" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={className}>
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Notification Panel */}
        {isOpen && (
          <Card className="absolute top-12 right-0 w-96 z-50 shadow-lg border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Admin Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className="text-xs"
                  >
                    {showUnreadOnly ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Show All
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Unread Only
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          notification.status === 'UNREAD' ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => notification.status === 'UNREAD' && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              {notification.metadata?.priority && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPriorityColor(notification.metadata.priority)}`}
                                >
                                  {notification.metadata.priority}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>

                            {/* Venue Details for approval notifications */}
                            {notification.metadata?.action === 'VENUE_APPROVAL_REQUIRED' && (
                              <div className="bg-gray-50 rounded-lg p-2 mb-2 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <MapPin className="h-3 w-3" />
                                  <span>{notification.metadata.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <User className="h-3 w-3" />
                                  <span>{notification.metadata.ownerName}</span>
                                </div>
                                {notification.metadata.sports && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {notification.metadata.sports.slice(0, 3).map((sport: string, idx: number) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {sport}
                                      </Badge>
                                    ))}
                                    {notification.metadata.sports.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{notification.metadata.sports.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {notification.status === 'UNREAD' && (
                                <Badge variant="default" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
