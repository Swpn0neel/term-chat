# TermChat

TermChat is a high-fidelity, real-time command-line interface chat application. It provides a sleek and responsive messaging experience directly within the terminal, leveraging modern web technologies like React and Ink to deliver a premium user interface.

![Termchat](public/site.png)

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Technological Stack](#technological-stack)
4. [Web Documentation](#web-documentation--landing-page)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
7. [Configuration](#configuration)
8. [Database Setup](#database-setup)
9. [Usage and Navigation](#usage-and-navigation)
10. [Development](#development)
11. [Architecture](#architecture)
12. [License](#license)

## Overview

TermChat CLI bridges the gap between terminal efficiency and modern chat application features. Designed for developers and terminal enthusiasts, it offers a secure, real-time environment for communication without leaving the command line. The application features a robust social system, group messaging, AI-integrated chat capabilities, and a polished UI built with TermUI components and Clack-inspired styling.

## Core Features

### Real-time Messaging
- **Seamless Sync**: Real-time message delivery and reception for both private and group conversations.
- **Heartbeat System**: Real-time online/offline status indicators for all users.
- **Distortion-Free UI**: Virtual rendering engine with `wrap-ansi` for stable terminal output.

### End-to-End Encryption (E2EE)
- **Zero-Knowledge Privacy**: Message content is encrypted locally before being sent to the server.
- **X25519 & XSalsa20**: Industry-standard cryptographic primitives via `sodium-native`.
- **Key Vault**: Encrypted backup of your private keys stored on the server (AES-256-GCM), allowing seamless multi-device access using your password as a master key.
- **Perfect Forward Secrecy (PFS)**: Support for message-level nonces to ensure replay protection.

### Secure Authentication
- **User Registration**: Secure account creation with bcrypt password hashing.
- **Vault Recovery**: Automatic restoration of E2EE keys on new devices via your password.
- **Persistent Sessions**: User-specific local session management in `.sessions/` to keep you logged in.

### Social Management
- **Global Search**: Find and connect with users by username.
- **Friend System**: Manage friends, pending requests, and real-time status updates.
- **Activity Sorting**: Intelligent sorting of conversations based on recent activity and unread counts.

### Group Messaging
- **Dynamic Groups**: Create groups and invite friends with Admin/Member role support.
- **Real-time Indicators**: Visual tracking of unread messages and new activity in groups.

### AI Integration
- **Built-in Assistant**: Dedicated AI chat screen powered by Google Gemini (Flash 2.5).
- **Persistent History**: AI conversation context is saved securely in the database.

### File & Folder Transfer
- **Cloud Storage**: Powered by Cloudflare R2 for reliable, high-speed storage.
- **Folder Support**: Automatic local zipping of folders before upload.
- **Inbox Notifications**: Real-time alerts for incoming files via the Dashboard.

## Technological Stack

### Frontend Rendering
- **React 19**: Modern UI component architecture.
- **Ink 7**: React-based framework for building interactive CLI tools.
- **TermUI**: A professional-grade UI library for terminal applications.
- **wrap-ansi**: Robust terminal text wrapping for distortion-free rendering.
- **Dracula Theme**: High-contrast, vibrant color palette for optimal readability.

### Security & Cryptography
- **sodium-native**: Native bindings to libsodium for high-performance E2EE (X25519/XSalsa20).
- **node:crypto**: Built-in Node.js crypto for PBKDF2 key derivation and AES-256-GCM vault sealing.
- **Bcryptjs**: Industry-standard password hashing for authentication.

### Data and Backend
- **Prisma 7**: Type-safe ORM for database operations.
- **PostgreSQL** (via Supabase): Centralized, scalable relational database.
- **pg**: Native PostgreSQL driver with Prisma adapter.

### Artificial Intelligence
- **Google Generative AI**: Integration with Gemini 2.5 Flash for AI assistant features.

### Storage & Utilities
- **Cloudflare R2**: Secure, S3-compatible cloud storage for file transfers.
- **AWS SDK**: Direct-to-cloud uploads and downloads.
- **Archiver**: High-performance folder-to-zip compression for directory transfers.
- **mime-types**: Automatic detection of file types for secure handling.

### Build and Tooling
- **TypeScript 6**: Type-safe development.
- **tsup**: Fast, TypeScript-focused ESM bundling.
- **tsx**: Next-generation TypeScript execution for development.

## Installation

### Global Installation
You can install TermChat CLI directly from the NPM registry to use it as a standalone tool:

```bash
npm install -g termchat-cli
```

Once installed, you can start the application by running:

```bash
termchat
```

### Local Setup (For Contributors)
If you wish to contribute or modify the application:

1. Clone the repository:
   ```bash
   git clone https://github.com/Swpn0neel/term-chat.git
   cd term-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see [Configuration](#configuration)).

4. Follow the [Database Setup](#database-setup) instructions.

## Configuration

Configuration is managed via environment variables. Create a `.env` file in the root directory based on `.env.example`:

```env
# Database connection string (PostgreSQL / Supabase)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Google Gemini API Key for AI features
GEMINI_API_KEY="your-gemini-key"

# Cloudflare R2 Configuration (Required for File Transfers)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="termchat-files"
```

## Database Setup

TermChat uses Prisma to manage the database schema. After configuring your `DATABASE_URL`, run the following commands to initialize the database:

1. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Synchronize the database schema:
   ```bash
   npx prisma db push
   ```

## Usage and Navigation

TermChat is designed for keyboard-driven efficiency.

### Navigation Logic
- **Arrow Keys (↑↓)**: Navigate through menus and lists.
- **Enter/Return**: Select options or confirm actions.
- **Esc**: Return to the main Dashboard from any screen; quit from Dashboard/Auth.

### Chat Interface
- **Type and Enter**: Send a message.
- **Arrow Keys (↑↓)**: Scroll through chat history.
- **Real-time Status**: View if a friend is "Online" or "Offline" via indicators in the chat header.
- **`/` (Options)**: Type `/` in the message input to open the **Command Suggestions Overlay**. Use this to quickly access:
  - `/edit [n] [text]`: Edit your Nth last message.
  - `/delete [n|all]`: Delete your Nth last message or clear the chat history.
  - `/ai [prompt]`: Ask the built-in AI for help (requires Gemini key).
  - `/color`: Cycle through different chat accent colors.

### AI Chat
- **Type and Enter**: Send a message to Gemini AI.
- **/clear**: Wipe AI conversation history for a fresh session.

### File Transfers
- **Send File**: Enter the absolute path to any file or folder. Folders are automatically zipped.
- **File Inbox**: Select a pending transfer to Download or Decline.
- **Dashboard Notifications**: The "File Inbox" menu item shows a badge (e.g., `(3 new)`) when files are waiting.

## Development

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

To build the production bundle:

```bash
npm run build
```

The production output is generated in the `dist` directory as a single ESM entry point with a Node.js shebang.

## Architecture

The codebase follows a modular architecture for scalability and maintainability:

```
term-chat/
├── src/
│   ├── index.tsx              # Entry point, renders root App
│   ├── App.tsx                # Root router, session management, heartbeats
│   ├── screens/               # Individual view components
│   │   ├── AuthScreen.tsx     # Sign-in/Sign-up with Vault support
│   │   ├── DashboardScreen.tsx
│   │   ├── ChatScreen.tsx     # E2EE enabled chat
│   │   └── ... (see src/screens)
│   ├── lib/                   # Shared utilities
│   │   ├── prisma.ts          # Database client
│   │   ├── crypto.ts          # E2EE & Vault implementation (X25519/XSalsa20/AES-GCM)
│   │   └── theme.ts           # Styling system
│   ├── services/              # Business logic & API calls
│   │   ├── authService.ts     # Login/SignUp & Vault resolution
│   │   ├── messageService.ts  # E2EE messaging & history management
│   │   ├── sessionService.ts  # Per-user local session management
│   │   ├── socialService.ts   # Friendships & online status
│   │   ├── groupService.ts    # Group chat logic
│   │   ├── aiService.ts       # Gemini AI integration
│   │   └── fileTransferService.ts # R2 storage & folder zipping
│   ├── components/            # Reusable UI elements
│   │   ├── Title.tsx          # Cybermedium font branding
│   │   ├── Heading.tsx        # Section headings
│   │   ├── AppShell.tsx       # Layout (Header/Content/Input/Hints)
│   │   └── ... (see src/components)
│   └── generated/             # Prisma generated client (gitignored)
├── website/                   # Official landing page & documentation hub
├── prisma/
│   └── schema.prisma          # PostgreSQL schema with Vault fields
├── package.json
└── ...
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Swapnoneel.
