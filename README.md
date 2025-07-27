# Meeting Protocol System

A comprehensive meeting protocol management system designed for internal organizational use. This application enables teams to create, collaborate on, and manage meeting protocols in real-time with PDF export capabilities.

## 🌟 Features

- **Real-time Collaboration**: Multiple users can edit protocols simultaneously
- **Multi-language Support**: Available in German, English, French, and Italian
- **Dynamic Protocol Forms**: Flexible structure for agenda items, participants, and tasks
- **PDF Generation**: Export protocols as professional PDF documents
- **Group Management**: Organize members with different access rights
- **Task Tracking**: Monitor action items and responsibilities
- **Secure Authentication**: JWT-based authentication with Supabase
- **Archive System**: Search and retrieve past protocols

## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** with Composition API
- **TypeScript** for type safety
- **Pinia** for state management
- **Vue Router** for navigation
- **Vue i18n** for internationalization
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time features
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **Supabase** for database and authentication
- **Socket.io** for real-time communication
- **Puppeteer** for PDF generation
- **JWT** for token management
- **Helmet** for security headers

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Supabase account
- Modern web browser

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/meeting-protocol-system.git
   cd meeting-protocol-system
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` files in both frontend and backend directories
   - Configure with your Supabase credentials

4. **Run the development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📁 Project Structure

```
meeting-protocol-system/
├── frontend/               # Vue.js frontend application
│   ├── src/
│   │   ├── assets/        # Static assets and styles
│   │   ├── components/    # Vue components
│   │   ├── i18n/         # Internationalization files
│   │   ├── router/       # Vue Router configuration
│   │   ├── services/     # API services
│   │   ├── stores/       # Pinia stores
│   │   ├── types/        # TypeScript type definitions
│   │   └── views/        # Page components
│   └── ...
├── backend/               # Node.js backend application
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── ...
└── README.md            # This file
```

## 🌐 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Configure environment variables
4. Deploy

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set root directory to `backend`
3. Configure environment variables
4. Deploy as Web Service

### Database (Supabase)
1. Create a new Supabase project
2. Run the migration scripts
3. Configure authentication settings
4. Set up storage buckets

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

## 🤝 Contributing

This is an internal organizational tool. For contributions:

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Request review from team members

## 📄 License

This project is proprietary and for internal use only.

## 📞 Support

For internal support, contact the development team or create an issue in the project repository.

## 🔗 Links

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [API Documentation](./backend/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)