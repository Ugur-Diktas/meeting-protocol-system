# Meeting Protocol System - Frontend

Vue.js 3 frontend application for the Meeting Protocol System with TypeScript, Pinia, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Technology Stack

- **Vue.js 3.5** - Progressive JavaScript framework
- **TypeScript 5.7** - Type-safe development
- **Vite 7.0** - Next generation frontend tooling
- **Pinia 2.3** - State management
- **Vue Router 4.5** - Official router
- **Vue i18n 9** - Internationalization
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, fonts, styles
│   │   └── main.css    # Global styles with Tailwind
│   ├── components/     # Reusable Vue components
│   ├── i18n/          # Internationalization
│   │   ├── index.ts   # i18n configuration
│   │   └── locales/   # Translation files
│   │       ├── de.json
│   │       ├── en.json
│   │       ├── fr.json
│   │       └── it.json
│   ├── router/        # Vue Router
│   │   └── index.ts   # Route definitions
│   ├── services/      # API services
│   │   ├── api.ts     # Axios instance
│   │   └── auth.ts    # Authentication service
│   ├── stores/        # Pinia stores
│   │   └── auth.ts    # Authentication store
│   ├── types/         # TypeScript definitions
│   │   ├── auth.ts    # Auth types
│   │   └── router.d.ts
│   ├── views/         # Page components
│   │   ├── HomeView.vue
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   └── DashboardView.vue
│   ├── App.vue        # Root component
│   └── main.ts        # Application entry
├── index.html         # HTML entry point
├── .env.example       # Environment variables example
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
├── tailwind.config.cjs # Tailwind configuration
└── postcss.config.cjs # PostCSS configuration
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Tailwind CSS

The project uses Tailwind CSS with custom brand colors:

```javascript
// tailwind.config.cjs
colors: {
  'brand-red': '#e40c2c',
  'brand-red-dark': '#c00a24',
  'brand-red-light': '#ff1a3d',
}
```

## 🌐 Internationalization

The application supports four languages:
- 🇩🇪 German (default)
- 🇬🇧 English
- 🇫🇷 French
- 🇮🇹 Italian

### Adding Translations

1. Add new keys to all locale files in `src/i18n/locales/`
2. Use translations in components:
   ```vue
   <template>
     <h1>{{ $t('common.appName') }}</h1>
   </template>
   ```

### Adding a New Language

1. Create a new locale file: `src/i18n/locales/[lang].json`
2. Import and add to i18n configuration
3. Add language option to language switcher

## 🧩 Components

### Authentication Components
- `LoginView.vue` - User login page
- `RegisterView.vue` - User registration page

### Layout Components
- `App.vue` - Root component with router outlet
- `HomeView.vue` - Public landing page
- `DashboardView.vue` - User dashboard

### Protocol Components (To be implemented)
- `ProtocolForm.vue` - Create/edit protocols
- `ProtocolList.vue` - List all protocols
- `ProtocolDetail.vue` - View protocol details

## 🔌 API Integration

### Authentication Service

```typescript
// Example usage
import { authService } from '@/services/auth';

// Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'password'
});

// Get current user
const user = await authService.getMe();
```

### Store Management

```typescript
// Using auth store
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const { user, isAuthenticated } = storeToRefs(authStore);

// Login
await authStore.login(credentials);

// Logout
await authStore.logout();
```

## 🛡️ Route Guards

Protected routes automatically redirect to login:

```typescript
// Routes with requiresAuth meta field
{
  path: '/dashboard',
  meta: { requiresAuth: true }
}

// Routes requiring group membership
{
  path: '/protocols',
  meta: { requiresAuth: true, requiresGroup: true }
}
```

## 🎨 Styling Guide

### Using Tailwind Classes
```vue
<div class="bg-brand-red text-white p-4 rounded-lg hover:bg-brand-red-dark">
  Button
</div>
```

### Custom CSS
Global styles are in `src/assets/main.css`

## 📦 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview # Test production build locally
```

### Deployment to Vercel
1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Configure environment variables
5. Deploy

## 🧪 Testing

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test
```

## 🐛 Debugging

### Vue Devtools
Install the Vue.js devtools browser extension for debugging

### TypeScript Errors
```bash
# Check TypeScript errors
npm run type-check
```

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Resources

- [Vue.js Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vue i18n Documentation](https://vue-i18n.intlify.dev/)

## 🤝 Development Guidelines

1. **Component Naming**: Use PascalCase for components
2. **Composition API**: Use `<script setup>` syntax
3. **TypeScript**: Always define types for props and emits
4. **i18n**: All user-facing text must use translations
5. **Styling**: Prefer Tailwind classes over custom CSS

## 📄 License

Proprietary - Internal use only