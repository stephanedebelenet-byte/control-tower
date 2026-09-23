import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api'
process.env.NEXT_PUBLIC_SOCKET_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/mojazine_test'
