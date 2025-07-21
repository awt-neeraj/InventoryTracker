import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  vendorName: text("vendor_name").notNull(),
  purchaseDate: text("purchase_date").notNull(),
  fileName: text("file_name"),
  filePath: text("file_path"),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantityPurchased: integer("quantity_purchased").notNull(),
  quantityAvailable: integer("quantity_available").notNull(),
  unitPrice: real("unit_price").notNull(),
  invoiceId: integer("invoice_id").notNull(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  quantity: integer("quantity").notNull(),
  assignedTo: text("assigned_to").notNull(),
  reason: text("reason"),
  assignmentDate: text("assignment_date").notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  quantityAvailable: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;
