#!/bin/bash

# Script to guide enabling Firebase Authentication Providers
# Note: Firebase CLI doesn't support enabling providers directly
# This script provides instructions and opens the console

PROJECT_ID="learnloop-3813b"
CONSOLE_URL="https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"

echo "🔍 Firebase Authentication Provider Checker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project: ${PROJECT_ID}"
echo ""
echo "⚠️  Firebase CLI cannot directly check/enable auth providers"
echo "   You need to use the Firebase Console web interface"
echo ""
echo "📋 Providers used in this app:"
echo "   1. Email/Password (REQUIRED)"
echo "   2. Google (Recommended)"
echo "   3. Twitter/X (Optional)"
echo "   4. Facebook (Optional)"
echo "   5. GitHub (Optional)"
echo ""
echo "🔧 To enable providers:"
echo "   1. Opening Firebase Console..."
echo "   2. Go to Authentication > Sign-in method"
echo "   3. Click on each provider"
echo "   4. Toggle 'Enable' to ON"
echo "   5. Click 'Save'"
echo ""
echo "🌐 Opening console in browser..."
echo ""

# Try to open browser (works on macOS and Linux)
if command -v open &> /dev/null; then
    open "${CONSOLE_URL}"
elif command -v xdg-open &> /dev/null; then
    xdg-open "${CONSOLE_URL}"
else
    echo "Please open this URL manually:"
    echo "${CONSOLE_URL}"
fi

echo ""
echo "✅ After enabling providers:"
echo "   1. Wait 10-30 seconds"
echo "   2. Refresh your app browser"
echo "   3. Try signing in again"
echo ""
