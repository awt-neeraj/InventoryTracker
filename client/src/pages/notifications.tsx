import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, BellIcon, AlertTriangleIcon, InfoIcon, AlertCircleIcon } from "lucide-react";
import type { Notification } from "@shared/schema";

const priorityColors = {
  low: "text-blue-600 bg-blue-50 border-blue-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200", 
  high: "text-orange-600 bg-orange-50 border-orange-200",
  urgent: "text-red-600 bg-red-50 border-red-200"
};

const typeIcons = {
  low_stock: AlertTriangleIcon,
  reorder_suggestion: InfoIcon,
  assignment_reminder: BellIcon,
  invoice_approval: AlertCircleIcon
};

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: filter === "all"
  });

  const { data: unreadNotifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: filter === "unread"
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => 
      apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => 
      apiRequest("/api/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    }
  });

  const displayNotifications = filter === "all" ? notifications : unreadNotifications;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString();
  };

  const getPriorityBadge = (priority: string) => {
    const colorClass = priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;
    return (
      <Badge variant="outline" className={`${colorClass} font-medium`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const IconComponent = typeIcons[type as keyof typeof typeIcons] || BellIcon;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with inventory alerts and system notifications
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={filter === "unread" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
              className="relative"
            >
              Unread
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {displayNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BellIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-lg mb-2">No notifications</CardTitle>
              <CardDescription>
                {filter === "unread" 
                  ? "You're all caught up! No unread notifications."
                  : "No notifications found."
                }
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          displayNotifications.map((notification) => (
            <Card key={notification.id} className={`transition-all hover:shadow-md ${
              notification.isRead === 0 ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {notification.createdAt && formatDate(notification.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(notification.priority)}
                    {notification.isRead === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{notification.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}