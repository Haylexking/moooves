# Moooves - Competitive Gaming Platform

![Moooves Logo](/images/logo.png)

**A modern, competitive gaming platform built for seamless tournament management and real-time multiplayer experiences.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](LICENSE)

[Live Demo](https://mooves.onrender.com) | [Documentation](#overview) | [API Reference](#api-integration)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

Moooves is a comprehensive gaming platform that enables users to create, join, and manage competitive tournaments. The platform supports multiple game modes including real-time multiplayer matches, AI opponents, and tournament brackets with automated matchmaking and scoring.

### Key Capabilities

- **Tournament Management**: Create and manage custom tournaments with flexible configurations
- **Real-time Multiplayer**: WebSocket-based live matches with instant synchronization
- **User Authentication**: Secure login system with Google OAuth integration
- **Payment Processing**: Integrated payment system for tournament entry fees
- **Admin Dashboard**: Comprehensive admin interface for platform management
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Features

### Player Features

- **User Registration & Authentication**
  - Email/password authentication
  - Google OAuth integration
  - Secure session management

- **Game Modes**
  - Player vs Player (PvP)
  - Player vs Computer (AI)
  - Tournament matches
  - Live 1-on-1 battles

- **Tournament System**
  - Create custom tournaments
  - Join tournaments via invite codes
  - Automated bracket generation
  - Real-time score tracking
  - Prize distribution

- **Match Experience**
  - Real-time game board
  - Turn timers and move validation
  - Live opponent moves via WebSocket
  - Match history and statistics

### Host Features

- **Tournament Hosting**
  - Custom tournament creation
  - Entry fee configuration
  - Prize pool management
  - Participant management

- **Admin Dashboard**
  - User management
  - Tournament oversight
  - Payment distribution
  - Platform analytics

### Technical Features

- **Real-time Communication**: WebSocket connections for live gameplay
- **State Management**: Zustand for efficient state handling
- **API Integration**: RESTful API with comprehensive error handling
- **Responsive UI**: Tailwind CSS with mobile-first design
- **Type Safety**: Full TypeScript implementation
- **Testing**: Jest and React Testing Library coverage

## Technology Stack

### Frontend

- **Framework**: Next.js 14.2.35 (App Router)
- **Language**: TypeScript 5.7.3
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI components
- **State Management**: Zustand 5.0.8
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend Integration

- **API**: RESTful API with OpenAPI/Swagger specification
- **Real-time**: WebSocket connections
- **Authentication**: JWT tokens with refresh mechanism
- **File Upload**: Optimized image handling

### Development Tools

- **Testing**: Jest with React Testing Library
- **Linting**: ESLint with Next.js configuration
- **Build**: Next.js optimized builds
- **Deployment**: Vercel/Render compatible

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (or yarn 1.22+)
- **Git**: For version control

```bash
# Check Node.js version
node --version

# Check npm version
npm --version
```

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/moooves.git
   cd moooves
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-websocket-domain.com

# Authentication (if using OAuth)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-vercel-analytics-id

# Development overrides
NODE_ENV=development
```

### Running the Application

1. **Development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at `http://localhost:3000`

2. **Production build**

   ```bash
   npm run build
   npm start
   ```

3. **Linting**

   ```bash
   npm run lint
   ```

## Project Structure

```text
moooves/
# Configuration
.next/                 # Next.js build output
.swc/                  # SWC compiler cache
node_modules/          # Dependencies

# Source Code
app/                   # Next.js App Router pages
  api/                # API routes
  auth/               # Authentication pages
  dashboard/          # User dashboard
  game/               # Game interfaces
  tournaments/        # Tournament pages
  admin/              # Admin interface
  globals.css         # Global styles
  layout.tsx          # Root layout
  page.tsx           # Home page

components/            # Reusable React components
  auth/              # Authentication components
  dashboard/         # Dashboard components
  game/              # Game-specific components
  tournament/        # Tournament components
  ui/                # Base UI components

lib/                  # Utility libraries
  api/               # API client and configuration
  hooks/             # Custom React hooks
  stores/            # State management (Zustand)
  utils/             # Utility functions
  config/            # Configuration files

public/               # Static assets
  images/            # Images and icons
  fonts/             # Font files

tests/                # Test files
__tests__/            # Unit tests
```

### Key Directories Explained

- **`app/`**: Next.js 13+ App Router structure with route-based organization
- **`components/`**: Reusable UI components organized by feature
- **`lib/`**: Shared utilities, API clients, and business logic
- **`public/`**: Static assets served at runtime
- **`tests/`**: Test suites for components and utilities

## API Integration

### API Client Configuration

The application uses a centralized API client located at `lib/api/client.ts`:

```typescript
import { apiClient } from '@/lib/api/client'

// Example usage
const response = await apiClient.getTournaments()
const match = await apiClient.createMatch(matchData)
```

### Available API Endpoints

Key API endpoints are configured in `lib/config/api-config.ts`:

- **Authentication**: `/auth/*`
- **Users**: `/users/*`
- **Tournaments**: `/tournaments/*`
- **Matches**: `/matches/*`
- **Payments**: `/payments/*`

### WebSocket Integration

Real-time features use WebSocket connections:

```typescript
// WebSocket connection for live matches
const wsUrl = `${API_CONFIG.BASE_URL.replace(/^https?/, 'wss')}/ws/matches/${matchId}`
const socket = new WebSocket(wsUrl)
```

### Error Handling

The API client includes comprehensive error handling:

- Automatic retry logic
- Timeout management
- Graceful fallback to HTTP polling
- User-friendly error messages

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test -- --watch

# Run specific test suites
npm run test:api
npm run test:modes
npm run verify:modes
```

### Test Structure

```text
tests/
  __tests__/           # Unit tests
    api/              # API client tests
    components/       # Component tests
  mode-behavior.test.tsx    # Game mode tests
  use-bluetooth-connection.test.tsx  # Connection tests
  use-wifi-connection.test.tsx      # Connection tests
```

### Test Coverage

- **Unit Tests**: Individual component and utility testing
- **Integration Tests**: API integration and workflow testing
- **Mode Tests**: Game mode behavior validation
- **Connection Tests**: Network connectivity scenarios

## Deployment

### Production Deployment

#### Vercel (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy**

   ```bash
   vercel --prod
   ```

3. **Environment Variables**

   Set up production environment variables in Vercel dashboard

#### Render

1. **Connect Repository**

   - Connect your GitHub repository to Render
   - Set build command: `npm run build`
   - Set start command: `npm start`

2. **Environment Variables**

   Configure production environment variables in Render dashboard

#### Docker (Alternative)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Build Optimization

The application includes several optimizations:

- **Next.js optimizations**: Automatic code splitting and tree shaking
- **Image optimization**: Next.js Image component with lazy loading
- **Bundle analysis**: Built-in bundle analyzer for size optimization
- **Caching**: Strategic caching for API responses and static assets

### Environment-Specific Configurations

```javascript
// next.config.mjs
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}
```

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
4. **Run tests**

   ```bash
   npm test
   npm run lint
   ```

5. **Commit changes**

   ```bash
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

### Code Standards

- **TypeScript**: All new code must be typed
- **Components**: Use functional components with hooks
- **Styling**: Tailwind CSS classes only
- **Testing**: Add tests for new features
- **Documentation**: Update README and inline comments

### Commit Message Convention

```text
feat: new feature
fix: bug fix
docs: documentation update
style: code style changes
refactor: code refactoring
test: adding or updating tests
chore: build process or auxiliary tool changes
```

## Troubleshooting

### Common Issues

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npm run type-check
```

#### API Connection Issues

```bash
# Check environment variables
echo $NEXT_PUBLIC_API_BASE_URL

# Test API connectivity
curl -X GET https://your-api-domain.com/api/v1/health
```

#### WebSocket Connection Failures

1. **Check WebSocket URL configuration**
2. **Verify server WebSocket support**
3. **Check firewall/proxy settings**
4. **Monitor browser console for errors**

#### Performance Issues

1. **Check bundle size**

   ```bash
   npm run analyze
   ```

2. **Monitor API response times**
3. **Check for memory leaks in dev tools**
4. **Optimize image sizes and formats**

### Debug Mode

Enable debug logging:

```env
DEBUG=true
NEXT_PUBLIC_DEBUG=true
```

### Getting Help

- **Documentation**: Check inline code comments
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Support**: Contact development team for urgent issues

## License

This project is licensed under the Private License. See the [LICENSE](LICENSE) file for details.

---

## Built With

**Built with passion for competitive gaming**

[![Built with Next.js](https://img.shields.io/badge/Built_with-Next.js-black?style=flat-square)](https://nextjs.org/)
[![Powered by TypeScript](https://img.shields.io/badge/Powered_by-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
