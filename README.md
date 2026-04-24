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

### Secure Authentication
- User registration and login system.
- Secure password hashing using bcrypt.
- Persistent session management with automatic re-authentication.

### Real-time Messaging
- Instant message delivery and reception for both private and group conversations.
- Heartbeat-driven online/offline status indicators for all users.
- Real-time unread message counters across all conversations.
- Virtual rendering engine with `wrap-ansi` for distortion-free terminal output.

### Social Management
- Global user search and friend request system.
- Dedicated dashboard for managing pending friend requests.
- Interactive friend list with real-time status updates and unread counts.
- Activity-based sorting for friends and groups.
- Friend removal management.

### Group Messaging
- Create groups and invite friends as members.
- Group member management with Admin/Member roles.
- Real-time group chat with unread indicators.
- Two-step group creation flow (name → member selection).

### AI Integration
- Built-in AI chat screen powered by Google Gemini.
- Persistent AI conversation history stored in the database.
- `/clear` command to reset AI chat history.
- Harmonized UI consistent with the main chat interface.

### File & Folder Transfer
- Securely send files and folders between users.
- **Cloud Storage**: Powered by Cloudflare R2 for reliable, high-speed storage.
- **Folder Support**: Automatic local zipping of folders before upload.
- **Persistence**: Transfers remain pending for recipients until accepted or declined.
- **Status Tracking**: Real-time notifications for new files via the Dashboard inbox.

## Technological Stack

### Frontend Rendering
- **React 19**: Modern UI component architecture.
- **Ink 7**: React-based framework for building interactive CLI tools.
- **TermUI**: A professional-grade UI library for terminal applications.
- **wrap-ansi**: Robust terminal text wrapping for distortion-free rendering.
- **Dracula Theme**: High-contrast, vibrant color palette for optimal readability.

### Data and Backend
- **Prisma 7**: Type-safe ORM for database operations.
- **PostgreSQL** (via Supabase): Centralized, scalable relational database.
- **pg**: Native PostgreSQL driver with Prisma adapter.
- **Bcryptjs**: Industry-standard password encryption.

### Artificial Intelligence
- **Google Generative AI**: Integration with Gemini 2.5 Flash for AI assistant features.

### Storage & Utilities
- **Cloudflare R2**: Secure, S3-compatible cloud storage for file transfers.
- **AWS SDK (@aws-sdk/client-s3)**: For direct-to-cloud uploads and downloads.
- **Archiver**: High-performance folder-to-zip compression for directory transfers.
- **mime-types**: Automatic detection of file types for secure handling.

### Build and Tooling
- **TypeScript 6**: Type-safe development.
- **tsup**: Fast, TypeScript-focused ESM bundling.
- **tsx**: Next-generation TypeScript execution for development.

## Web Documentation & Landing Page

TermChat Official Site serves as a high-fidelity documentation hub and a visual mirror of the CLI experience. It is located in the `website/` directory of this repository.

### Tech Stack:
- **Framework:** [TanStack Start](https://tanstack.com/router/v1/docs/guide/start/overview) (React 19)
- **Styling:** Tailwind CSS 4.0
- **Aesthetics:** CSS-based CRT scanlines and interactive terminal simulations.

### Local Web Setup:
```bash
cd website
bun install
bun dev
```
The site will be available at `http://localhost:3000`.

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: Version 20.0.0 or higher.
- **PostgreSQL**: A running instance accessible via a connection string (e.g. Supabase).
- **NPM**: Package manager for dependency management.

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
│   │   ├── AuthScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── AddFriendScreen.tsx
│   │   ├── PendingRequestsScreen.tsx
│   │   ├── FriendListScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── GroupListScreen.tsx
│   │   ├── CreateGroupScreen.tsx
│   │   ├── GroupChatScreen.tsx
│   │   ├── RemoveFriendScreen.tsx
│   │   ├── AIChatScreen.tsx
│   │   ├── SendFileScreen.tsx
│   │   └── InboxScreen.tsx
│   ├── components/            # Reusable UI elements
│   │   ├── Title.tsx          # Cybermedium font branding
│   │   ├── Heading.tsx        # Section headings
│   │   ├── AppShell.tsx       # Layout (Header/Content/Input/Hints)
│   │   ├── Menu.tsx           # Clack-inspired select & multi-select
│   │   ├── Alert.tsx          # Status alerts
│   │   ├── Spinner.tsx        # Loading indicators
│   │   └── TextInput.tsx      # Text input component
│   ├── services/              # Business logic & DB abstraction
│   │   ├── authService.ts
│   │   ├── socialService.ts
│   │   ├── groupService.ts
│   │   ├── messageService.ts
│   │   ├── aiService.ts
│   │   ├── fileTransferService.ts
│   │   └── sessionService.ts
│   ├── lib/                   # Utility libraries
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── session.ts         # Shared session state
│   │   ├── dateUtils.ts       # Formatting helpers
│   │   └── shutdown.ts        # Cleanup & exit logic
│   └── generated/             # Prisma generated client (gitignored)
├── website/                   # Official landing page & documentation hub
├── prisma/
│   └── schema.prisma          # PostgreSQL schema
├── prisma.config.ts           # Prisma datasource configuration
├── termui.config.ts           # TermUI registry settings
├── tsconfig.json              # TypeScript configuration
├── tsup.config.ts             # Build config for npm distribution
└── package.json
```

### Key Directories
- **src/screens**: Contains individual view components (Auth, Dashboard, Chat, etc.).
- **src/services**: Encapsulates business logic and database interactions (AuthService, SocialService, GroupService, AIService).
- **src/components**: Reusable UI elements built on top of TermUI with Clack-inspired styling.
- **src/lib**: Utility libraries for session management, database adapters, and system shutdown handlers.
- **website**: TanStack Start web application for project documentation and landing page.
- **prisma**: Defines the data model and schema configuration.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Swapnoneel.
