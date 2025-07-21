import { 
  invoices, 
  items, 
  assignments,
  notifications,
  type Invoice, 
  type Item, 
  type Assignment,
  type Notification,
  type InsertInvoice, 
  type InsertItem, 
  type InsertAssignment,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lt } from "drizzle-orm";

export interface IStorage {
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoices(): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;

  // Item operations
  createItem(item: InsertItem): Promise<Item>;
  getItems(): Promise<Item[]>;
  getItemById(id: number): Promise<Item | undefined>;
  getItemsByInvoiceId(invoiceId: number): Promise<Item[]>;
  updateItemQuantity(id: number, quantityAvailable: number): Promise<Item | undefined>;

  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignments(): Promise<Assignment[]>;
  getAssignmentsByItemId(itemId: number): Promise<Assignment[]>;
  
  // Notification methods
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  getNotifications(): Promise<Notification[]>;
  getUnreadNotifications(): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(): Promise<void>;
}

export class MemStorage implements IStorage {
  private invoices: Map<number, Invoice>;
  private items: Map<number, Item>;
  private assignments: Map<number, Assignment>;
  private currentInvoiceId: number;
  private currentItemId: number;
  private currentAssignmentId: number;

  constructor() {
    this.invoices = new Map();
    this.items = new Map();
    this.assignments = new Map();
    this.currentInvoiceId = 1;
    this.currentItemId = 1;
    this.currentAssignmentId = 1;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const invoice: Invoice = { ...insertInvoice, id };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.currentItemId++;
    const item: Item = { 
      ...insertItem, 
      id,
      quantityAvailable: insertItem.quantityPurchased 
    };
    this.items.set(id, item);
    return item;
  }

  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItemById(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getItemsByInvoiceId(invoiceId: number): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.invoiceId === invoiceId);
  }

  async updateItemQuantity(id: number, quantityAvailable: number): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (item) {
      const updatedItem = { ...item, quantityAvailable };
      this.items.set(id, updatedItem);
      return updatedItem;
    }
    return undefined;
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentAssignmentId++;
    const assignment: Assignment = { ...insertAssignment, id };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async getAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values());
  }

  async getAssignmentsByItemId(itemId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(assignment => assignment.itemId === itemId);
  }

  // Notification methods (placeholder for MemStorage)
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notification: Notification = {
      id: Date.now(),
      ...insertNotification,
      isRead: 0,
      createdAt: new Date(),
    };
    return notification;
  }

  async getNotifications(): Promise<Notification[]> {
    return [];
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return [];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    return undefined;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return;
  }
}

export class DatabaseStorage implements IStorage {
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...insertInvoice,
        fileName: insertInvoice.fileName || null,
        filePath: insertInvoice.filePath || null,
      })
      .returning();
    return invoice;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values({
        ...insertItem,
        quantityAvailable: insertItem.quantityPurchased,
      })
      .returning();
    return item;
  }

  async getItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async getItemById(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async getItemsByInvoiceId(invoiceId: number): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.invoiceId, invoiceId));
  }

  async updateItemQuantity(id: number, quantityAvailable: number): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set({ quantityAvailable })
      .where(eq(items.id, id))
      .returning();
    return item || undefined;
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values({
        ...insertAssignment,
        reason: insertAssignment.reason || null,
      })
      .returning();
    return assignment;
  }

  async getAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments);
  }

  async getAssignmentsByItemId(itemId: number): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.itemId, itemId));
  }

  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...insertNotification,
        relatedId: insertNotification.relatedId || null,
      })
      .returning();
    return notification;
  }

  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.isRead, 0))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.isRead, 0));
  }
}

export const storage = new DatabaseStorage();
