#!/bin/bash

echo "🚀 Starting Polygon ID Proof App with Verification Server"
echo "================================================================"

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $VERIFICATION_PID $NEXTJS_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start verification server in background
echo "📡 Starting verification server on port 3001..."
cd verification-server
npm start &
VERIFICATION_PID=$!
cd ..

# Wait a bit for verification server to start
sleep 3

# Start Next.js app
echo "🌐 Starting Next.js app on port 3000..."
npm run dev &
NEXTJS_PID=$!

echo "✅ Both servers started successfully!"
echo "📍 Next.js App: http://localhost:3000"
echo "📍 Verification Server: http://localhost:3001"
echo "📍 Health Check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $VERIFICATION_PID $NEXTJS_PID