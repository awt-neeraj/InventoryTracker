import { storage } from "./storage";
import type { InsertNotification } from "@shared/schema";

export class NotificationService {
  // Check for low stock items and create notifications
  static async checkLowStock(): Promise<void> {
    try {
      const items = await storage.getItems();
      const lowStockItems = items.filter(item => item.quantityAvailable < 5 && item.quantityAvailable > 0);
      
      for (const item of lowStockItems) {
        // Check if we already have a recent low stock notification for this item
        const existingNotifications = await storage.getNotifications();
        const recentLowStockNotification = existingNotifications.find(n => 
          n.type === 'low_stock' && 
          n.relatedId === item.id &&
          n.createdAt && new Date(n.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
        );

        if (!recentLowStockNotification) {
          const notification: InsertNotification = {
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${item.name} is running low (${item.quantityAvailable} remaining)`,
            priority: item.quantityAvailable <= 2 ? 'urgent' : 'high',
            relatedId: item.id,
          };
          await storage.createNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  }

  // Generate reorder suggestions for items that are out of stock
  static async checkReorderSuggestions(): Promise<void> {
    try {
      const items = await storage.getItems();
      const outOfStockItems = items.filter(item => item.quantityAvailable === 0);
      
      for (const item of outOfStockItems) {
        // Check if we already have a recent reorder suggestion for this item
        const existingNotifications = await storage.getNotifications();
        const recentReorderNotification = existingNotifications.find(n => 
          n.type === 'reorder_suggestion' && 
          n.relatedId === item.id &&
          n.createdAt && new Date(n.createdAt).getTime() > Date.now() - (48 * 60 * 60 * 1000) // Last 48 hours
        );

        if (!recentReorderNotification) {
          const notification: InsertNotification = {
            type: 'reorder_suggestion',
            title: 'Reorder Suggestion',
            message: `${item.name} is out of stock. Consider reordering to maintain inventory levels.`,
            priority: 'medium',
            relatedId: item.id,
          };
          await storage.createNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error checking reorder suggestions:', error);
    }
  }

  // Check for assignments that might need follow-up
  static async checkAssignmentReminders(): Promise<void> {
    try {
      const assignments = await storage.getAssignments();
      const items = await storage.getItems();
      
      // Check for assignments made more than 30 days ago for expensive items
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      for (const assignment of assignments) {
        const assignmentDate = new Date(assignment.assignmentDate);
        const item = items.find(i => i.id === assignment.itemId);
        
        if (item && item.unitPrice > 100 && assignmentDate < thirtyDaysAgo) {
          // Check if we already have a recent assignment reminder for this assignment
          const existingNotifications = await storage.getNotifications();
          const recentReminderNotification = existingNotifications.find(n => 
            n.type === 'assignment_reminder' && 
            n.relatedId === assignment.id &&
            n.createdAt && new Date(n.createdAt).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
          );

          if (!recentReminderNotification) {
            const notification: InsertNotification = {
              type: 'assignment_reminder',
              title: 'Assignment Follow-up',
              message: `${item.name} assigned to ${assignment.assignedTo} on ${assignment.assignmentDate}. Consider checking item status.`,
              priority: 'low',
              relatedId: assignment.id,
            };
            await storage.createNotification(notification);
          }
        }
      }
    } catch (error) {
      console.error('Error checking assignment reminders:', error);
    }
  }

  // Check for invoices that might need approval workflow
  static async checkInvoiceApproval(): Promise<void> {
    try {
      const invoices = await storage.getInvoices();
      const items = await storage.getItems();
      
      for (const invoice of invoices) {
        const invoiceItems = items.filter(item => item.invoiceId === invoice.id);
        const totalValue = invoiceItems.reduce((sum, item) => sum + (item.unitPrice * item.quantityPurchased), 0);
        
        // For high-value invoices (>$1000), suggest approval workflow
        if (totalValue > 1000) {
          // Check if we already have a recent approval notification for this invoice
          const existingNotifications = await storage.getNotifications();
          const recentApprovalNotification = existingNotifications.find(n => 
            n.type === 'invoice_approval' && 
            n.relatedId === invoice.id &&
            n.createdAt && new Date(n.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
          );

          if (!recentApprovalNotification) {
            const notification: InsertNotification = {
              type: 'invoice_approval',
              title: 'High-Value Invoice',
              message: `Invoice ${invoice.invoiceNumber} from ${invoice.vendorName} has a total value of $${totalValue.toFixed(2)}. Consider review process.`,
              priority: totalValue > 5000 ? 'high' : 'medium',
              relatedId: invoice.id,
            };
            await storage.createNotification(notification);
          }
        }
      }
    } catch (error) {
      console.error('Error checking invoice approval:', error);
    }
  }

  // Run all notification checks
  static async runAllChecks(): Promise<void> {
    await Promise.all([
      this.checkLowStock(),
      this.checkReorderSuggestions(),
      this.checkAssignmentReminders(),
      this.checkInvoiceApproval()
    ]);
  }
}