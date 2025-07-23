import { pgTable, serial, integer, text, unique, real, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const assignments = pgTable("assignments", {
	id: serial().primaryKey().notNull(),
	itemId: integer("item_id").notNull(),
	quantity: integer().notNull(),
	assignedTo: text("assigned_to").notNull(),
	reason: text(),
	assignmentDate: text("assignment_date").notNull(),
});

export const invoices = pgTable("invoices", {
	id: serial().primaryKey().notNull(),
	invoiceNumber: text("invoice_number").notNull(),
	vendorName: text("vendor_name").notNull(),
	purchaseDate: text("purchase_date").notNull(),
	fileName: text("file_name"),
	filePath: text("file_path"),
}, (table) => [
	unique("invoices_invoice_number_unique").on(table.invoiceNumber),
]);

export const items = pgTable("items", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	quantityPurchased: integer("quantity_purchased").notNull(),
	quantityAvailable: integer("quantity_available").notNull(),
	unitPrice: real("unit_price").notNull(),
	invoiceId: integer("invoice_id").notNull(),
});

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	priority: text().default('medium').notNull(),
	isRead: integer("is_read").default(0).notNull(),
	relatedId: integer("related_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});
