import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertInvoiceSchema, insertItemSchema, insertAssignmentSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Invoice routes
  app.post("/api/invoices", upload.single('invoiceFile'), async (req, res) => {
    try {
      const invoiceData = {
        invoiceNumber: req.body.invoiceNumber,
        vendorName: req.body.vendorName,
        purchaseDate: req.body.purchaseDate,
        fileName: req.file?.originalname || null,
        filePath: req.file?.path || null
      };

      const validatedData = insertInvoiceSchema.parse(invoiceData);
      const invoice = await storage.createInvoice(validatedData);
      
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create invoice" });
      }
    }
  });

  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Item routes
  app.post("/api/items", async (req, res) => {
    try {
      const items = req.body.items || [req.body];
      const createdItems = [];

      for (const itemData of items) {
        const validatedData = insertItemSchema.parse(itemData);
        const item = await storage.createItem(validatedData);
        createdItems.push(item);
      }

      res.json(createdItems);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create items" });
      }
    }
  });

  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/invoice/:invoiceId", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const items = await storage.getItemsByInvoiceId(invoiceId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  // Assignment routes
  app.post("/api/assignments", async (req, res) => {
    try {
      const validatedData = insertAssignmentSchema.parse(req.body);
      
      // Check if item has enough quantity available
      const item = await storage.getItemById(validatedData.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      if (item.quantityAvailable < validatedData.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity. Only ${item.quantityAvailable} items available.` 
        });
      }

      // Create assignment and update item quantity
      const assignment = await storage.createAssignment(validatedData);
      await storage.updateItemQuantity(
        validatedData.itemId, 
        item.quantityAvailable - validatedData.quantity
      );

      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create assignment" });
      }
    }
  });

  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const items = await storage.getItems();
      const assignments = await storage.getAssignments();

      const totalItems = items.reduce((sum, item) => sum + item.quantityPurchased, 0);
      const availableItems = items.reduce((sum, item) => sum + item.quantityAvailable, 0);
      const assignedItems = assignments.reduce((sum, assignment) => sum + assignment.quantity, 0);
      const lowStockItems = items.filter(item => item.quantityAvailable < 5).length;

      res.json({
        totalItems,
        availableItems,
        assignedItems,
        lowStockItems
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Low stock items
  app.get("/api/items/low-stock", async (req, res) => {
    try {
      const items = await storage.getItems();
      const lowStockItems = items.filter(item => item.quantityAvailable < 5);
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  // Recent assignments with item details
  app.get("/api/assignments/recent", async (req, res) => {
    try {
      const assignments = await storage.getAssignments();
      const items = await storage.getItems();
      
      const recentAssignments = assignments
        .sort((a, b) => new Date(b.assignmentDate).getTime() - new Date(a.assignmentDate).getTime())
        .slice(0, 5)
        .map(assignment => {
          const item = items.find(i => i.id === assignment.itemId);
          return {
            ...assignment,
            item: item ? { name: item.name, category: item.category } : null
          };
        });

      res.json(recentAssignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent assignments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
