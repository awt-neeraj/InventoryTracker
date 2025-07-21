# replit.md

## Overview

This is an inventory management system built with React, TypeScript, Express.js, and PostgreSQL. The application allows users to upload invoices, manage inventory items, assign items to personnel, and track assignment history. It uses a modern tech stack with shadcn/ui components for the frontend and Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **File Upload**: Multer middleware for handling invoice file uploads
- **API**: RESTful API design with JSON responses
- **Development**: Vite for development server and hot module replacement

## Key Components

### Database Schema (shared/schema.ts)
- **Invoices**: Store invoice metadata and file references
- **Items**: Track inventory items with quantities and pricing
- **Assignments**: Record item assignments to personnel

### Frontend Pages
- **Dashboard**: Overview metrics and recent activity
- **Upload Invoice**: File upload and invoice metadata entry
- **Add Items**: Bulk item entry linked to invoices
- **Inventory List**: Searchable and filterable item catalog
- **Assign Item**: Item assignment workflow
- **Assignment History**: Historical assignment records

### Storage Layer
- **Database Storage**: PostgreSQL with Drizzle ORM (currently active)
- **Memory Storage**: In-memory storage implementation (available for development/testing)
- **File Storage**: Local filesystem for invoice file uploads

## Data Flow

1. **Invoice Upload**: Users upload invoices with metadata, files stored locally
2. **Item Management**: Items are linked to invoices and tracked with quantities
3. **Assignment Process**: Items are assigned to personnel, reducing available quantities
4. **History Tracking**: All assignments are logged with timestamps and reasons

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL provider (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit with migrations

### UI Framework
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` directory
- Backend bundles to `dist/index.js` using ESBuild
- Static assets served by Express in production

### Environment Configuration
- Development: Vite dev server with Express API
- Production: Single Express server serving both API and static files
- Database: PostgreSQL connection via DATABASE_URL environment variable

### Scripts
- `npm run dev`: Development mode with hot reloading
- `npm run build`: Production build for both client and server
- `npm run start`: Production server
- `npm run db:push`: Apply database schema changes

The architecture prioritizes developer experience with hot reloading in development, type safety throughout the stack, and a clean separation of concerns between data access, business logic, and presentation layers.

## Recent Changes

### January 21, 2025 - Database Integration & Smart Notifications
- **Added PostgreSQL Database**: Migrated from in-memory storage to persistent PostgreSQL database
- **Database Schema**: Created tables for invoices, items, and assignments with proper relationships
- **Drizzle Relations**: Implemented explicit relations between invoices → items → assignments
- **Storage Layer Update**: Replaced MemStorage with DatabaseStorage implementing the IStorage interface
- **Data Persistence**: All inventory data now persists between server restarts
- **Smart Notifications**: Added notification system with automatic alerts for low stock, reorder suggestions, assignment reminders, and invoice approval workflows
- **Custom Categories**: Enhanced category selection with ability to add custom categories beyond default options
- **Indian Rupee Currency**: Updated all currency displays from USD ($) to Indian Rupee (₹)
- **ASI Branding**: Changed application name from "Inventory Manager" to "ASI Inventory" as requested