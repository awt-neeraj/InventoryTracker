import { 
  invoices, 
  items, 
  assignments,
  type Invoice, 
  type Item, 
  type Assignment,
  type InsertInvoice, 
  type InsertItem, 
  type InsertAssignment 
} from "@shared/schema";

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
}

export const storage = new MemStorage();
