# JPEG Compressor Application

## Overview

This is a modern web application for compressing JPEG images with user authentication and advanced quality assessment features. The application combines client-side image processing for security and privacy with server-side user management using Replit Auth. Built with a full-stack TypeScript architecture featuring React frontend and Express backend.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript, styled using Tailwind CSS and shadcn/ui components
- **Backend**: Express.js with TypeScript (minimal API surface)
- **Database**: PostgreSQL with Drizzle ORM (configured but not actively used for core functionality)
- **Shared**: Common TypeScript types and schemas using Zod validation

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system using CSS variables
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **State Management**: React state with TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: Native HTML5 File API with drag-and-drop support using react-dropzone

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Development**: Vite dev server integration for hot module replacement
- **Database**: Drizzle ORM with PostgreSQL (using Neon serverless)
- **Session Management**: PostgreSQL session store (configured but minimal usage)

### Core Features
1. **Client-side Image Compression**: All image processing happens in the browser using HTML5 Canvas API
2. **Drag-and-Drop Upload**: Intuitive file upload with validation
3. **Real-time Progress**: Visual feedback during compression process
4. **Bulk Operations**: Process multiple images simultaneously
5. **Download Management**: Individual file downloads and bulk ZIP creation

## Data Flow

1. **File Upload**: Users drag/drop or select JPEG files (validated client-side)
2. **Compression Settings**: Users configure quality and compression mode
3. **Client-side Processing**: Images are compressed using Canvas API with Web Workers for performance
4. **Progress Tracking**: Real-time updates during compression
5. **Download Options**: Individual downloads or bulk ZIP creation
6. **No Server Storage**: All files remain client-side for privacy

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-dropzone**: File upload handling
- **wouter**: Lightweight routing

### UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with file watching
- **Database**: Drizzle kit for schema management and migrations

### Production Build
- **Frontend**: Vite production build with optimization
- **Backend**: esbuild bundling for Node.js deployment
- **Static Assets**: Served from Express with proper caching headers

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable
- **Build Target**: Node.js ESM modules
- **Platform**: Optimized for Replit deployment with cartographer integration

## Recent Changes

```
Changelog:
- June 29, 2025: Stripe subscription system implemented for premium features
  * Complete Stripe integration with subscription management
  * Premium plan offering unlimited compressions ($9.99/month, $99.99/year)
  * Usage limits for free users (10 compressions per day)
  * Real-time subscription status monitoring and updates
  * Secure payment processing with Stripe Elements
  * Premium member UI indicators with crown badges
  * Usage tracking and limit enforcement
  * Subscription cancellation and management features
- June 29, 2025: User authentication system implemented with custom auth
  * Clean landing page with minimalist design and clear call-to-action
  * Secure user authentication using bcrypt password hashing
  * PostgreSQL database integration for user sessions and data
  * User profile display with avatar and account information
  * Protected routes and secure logout functionality
  * Professional landing page showcasing application features
- June 29, 2025: Advanced visual quality assessment system implemented
  * Comprehensive image quality analysis with PSNR, SSIM, and MSE calculations
  * Advanced visual comparison tools with side-by-side, overlay, and difference mapping
  * Real-time quality scoring with professional grade metrics (0-100 scale)
  * Detailed image analysis including sharpness, contrast, brightness, and colorfulness
  * Interactive histogram analysis for color distribution comparison
  * Zoom and pan controls for detailed visual inspection
  * Intelligent quality recommendations based on compression results
  * Professional quality reports with technical metrics and user-friendly explanations
- June 29, 2025: Advanced batch processing queue management implemented
  * Intelligent queue system with priority handling and concurrency controls
  * Real-time progress tracking with time estimation algorithms
  * Automatic retry logic with configurable limits
  * Pause/resume functionality for long-running batches
  * Smart file prioritization (smaller files first for faster completion)
  * Comprehensive error handling and recovery systems
  * Visual queue management interface with detailed status indicators
- June 29, 2025: Advanced JPEG compression technology implemented
  * Enhanced algorithm with unsharp mask sharpening
  * Bilateral noise reduction filtering
  * Web optimization with contrast enhancement
  * Smart dimension calculation with aspect ratio preservation
  * Advanced quality calculation based on image characteristics
  * Configurable compression modes: aggressive, balanced, gentle
  * Real-time compression progress tracking
- June 29, 2025: Enhanced upload system
  * Improved drag-and-drop with visual feedback
  * Comprehensive file validation and error handling
  * Support for multiple file formats and size limits
  * Better image preview functionality
  * ZIP download functionality with JSZip integration
- June 29, 2025: Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```