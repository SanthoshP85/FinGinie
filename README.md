# FinGinie - AI-Powered Financial Assistant

A MERN stack application providing personalized financial guidance using RAG (Retrieval-Augmented Generation) with HuggingFace models and Pinecone vector database.

## Features

- AI-powered financial chat assistant
- Document upload and analysis (financial statements, reports)
- RAG-based contextual responses
- Personal finance tracking
- Investment insights
- Budget recommendations

## Tech Stack

### Backend

- Node.js + Express.js
- MongoDB (database)
- Pinecone (vector store)
- HuggingFace (embeddings + LLM)

### Frontend

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)

## Project Structure

```
FinGinie/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Pinecone account
- HuggingFace API key

### Backend Setup

1. Navigate to backend directory:

   ```bash
   cd backend
   npm install
   ```

2. Create `.env` file:

   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   HF_TOKEN=your_huggingface_token
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_INDEX_NAME=finginie
   JWT_SECRET=your_jwt_secret
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:

   ```bash
   cd frontend
   npm install
   ```

2. Create `.env` file:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Chat

- `POST /api/chat/message` - Send message to AI assistant
- `GET /api/chat/history` - Get chat history

### Documents

- `POST /api/documents/upload` - Upload financial document
- `GET /api/documents` - List uploaded documents
- `DELETE /api/documents/:id` - Delete document

### User

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/user/profile` - Get user profile

## Environment Variables

### Backend

| Variable            | Description                 |
| ------------------- | --------------------------- |
| PORT                | Server port (default: 5000) |
| MONGODB_URI         | MongoDB connection string   |
| HF_TOKEN            | HuggingFace API token       |
| PINECONE_API_KEY    | Pinecone API key            |
| PINECONE_INDEX_NAME | Pinecone index name         |
| JWT_SECRET          | JWT signing secret          |

### Frontend

| Variable     | Description     |
| ------------ | --------------- |
| VITE_API_URL | Backend API URL |

## License

MIT
