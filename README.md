# TermChat CLI

TermChat is a high-fidelity, real-time command-line interface chat application. It provides a sleek and responsive messaging experience directly within the terminal, leveraging modern web technologies like React and Ink to deliver a premium user interface.

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Technological Stack](#technological-stack)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Database Setup](#database-setup)
8. [Usage and Navigation](#usage-and-navigation)
9. [Development](#development)
10. [Architecture](#architecture)
11. [License](#license)

## Overview

TermChat CLI bridges the gap between terminal efficiency and modern chat application features. Designed for developers and terminal enthusiasts, it offers a secure, real-time environment for communication without leaving the command line. The application features a robust social system, AI-integrated chat capabilities, and a polished UI built with TermUI components.

## Core Features

### Secure Authentication
- User registration and login system.
- Secure password hashing using bcrypt.
- Persistent session management with automatic re-authentication.

### Real-time Messaging
- Instant message delivery and reception.
- Heartbeat-driven online/offline status indicators for all users.
- Real-time unread message counters across all conversations.

### Social Management
- Global user search and friend request system.
- Dedicated dashboard for managing pending friend requests.
- Interactive friend list with real-time status updates and unread counts.

### AI Integration
- Built-in AI chat screen powered by Google Gemini.
- Contextual conversations directly within the terminal interface.
- Support for complex queries and assistance via generative AI.

## Technological Stack

### Frontend Rendering
- **React 19**: Modern UI component architecture.
- **Ink 7**: React-based framework for building interactive CLI tools.
- **TermUI**: A professional-grade UI library for terminal applications.
- **Dracula Theme**: High-contrast, vibrant color palette for optimal readability.

### Data and Backend
- **Prisma 7**: Type-safe ORM for database operations.
- **PostgreSQL**: Reliable, enterprise-grade relational database.
- **Bcryptjs**: Industry-standard password encryption.

### Artificial Intelligence
- **Google Generative AI**: Integration with Gemini models for AI assistant features.

### Build and Tooling
- **tsup**: Fast, TypeScript-focused bundling.
- **tsx**: Next-generation TypeScript execution for development.

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: Version 18.0.0 or higher.
- **PostgreSQL**: A running instance accessible via a connection string.
- **NPM/PNPM/Yarn**: Package manager for dependency management.

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
   git clone https://github.com/swapnoneel/cli-chat-app.git
   cd cli-chat-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see [Configuration](#configuration)).

4. Follow the [Database Setup](#database-setup) instructions.

## Configuration

Configuration is managed via environment variables. Create a `.env` file in the root directory based on the following template:

```env
# Database connection string (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/termchat"

# Google Gemini API Key for AI features
GEMINI_API_KEY="your_api_key_here"
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
- **Arrow Keys**: Navigate through menus and lists.
- **Enter/Return**: Select options or confirm actions.
- **Esc**: Return to the main Dashboard from any screen (except Auth).
- **q**: Shutdown the application (available on most screens except during active chat input).

### Chat Interface
- **Type and Enter**: Send a message.
- **Real-time Status**: View if a friend is "Online" or "Offline" via indicators in the chat header.

## Development

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

To build the production bundle:

```bash
npm run build
```

The production output is generated in the `dist` directory.

## Architecture

The codebase follows a modular architecture for scalability and maintainability:

- **src/screens**: Contains individual view components (Auth, Dashboard, Chat, etc.).
- **src/services**: Encapsulates business logic and API interactions (AuthService, SocialService, AIService).
- **src/components**: Reusable UI elements built on top of TermUI.
- **src/lib**: Utility libraries for session management, database adapters, and system shutdown handlers.
- **prisma**: Defines the data model and schema configuration.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Swapnoneel.
