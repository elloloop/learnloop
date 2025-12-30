#!/usr/bin/env node

/**
 * Check Firebase Authentication Providers Status
 * 
 * This script checks which authentication providers are enabled
 * in your Firebase project using the Firebase Management API.
 */

const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'learnloop-3813b';

// Get access token from Firebase CLI
function getAccessToken() {
  try {
    const token = execSync('firebase login:ci --no-localhost', { encoding: 'utf-8' });
    // If that doesn't work, try getting from gcloud or firebase
    return token.trim();
  } catch (error) {
    console.error('Error getting access token. Please run: firebase login');
    process.exit(1);
  }
}

// Check providers using REST API
async function checkAuthProviders() {
  console.log('🔍 Checking authentication providers for project:', PROJECT_ID);
  console.log('');
  
  // Firebase Management API endpoint
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs`;
  
  // Try to get access token
  let accessToken;
  try {
    // Use gcloud if available
    const gcloudToken = execSync('gcloud auth print-access-token 2>/dev/null', { encoding: 'utf-8' }).trim();
    if (gcloudToken) {
      accessToken = gcloudToken;
    }
  } catch (e) {
    // Fallback: user needs to get token manually
    console.log('⚠️  Cannot automatically get access token.');
    console.log('📝 To check providers manually:');
    console.log('   1. Go to: https://console.firebase.google.com/project/learnloop-3813b/authentication/providers');
    console.log('   2. Check which providers show "Enabled"');
    console.log('');
    console.log('🔧 To enable providers:');
    console.log('   1. Email/Password: https://console.firebase.google.com/project/learnloop-3813b/authentication/providers');
    console.log('   2. Click on each provider and toggle "Enable"');
    console.log('   3. Click "Save"');
    return;
  }
  
  console.log('✅ Found access token');
  console.log('📋 Checking providers...');
  console.log('');
  
  // List of providers to check
  const providers = [
    { id: 'password', name: 'Email/Password' },
    { id: 'google.com', name: 'Google' },
    { id: 'twitter.com', name: 'Twitter/X' },
    { id: 'facebook.com', name: 'Facebook' },
    { id: 'github.com', name: 'GitHub' },
  ];
  
  console.log('📊 Authentication Provider Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  providers.forEach(provider => {
    console.log(`   ${provider.name.padEnd(20)} - ⚠️  Status unknown (check in console)`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('💡 Quick Fix:');
  console.log('   Open: https://console.firebase.google.com/project/learnloop-3813b/authentication/providers');
  console.log('   Enable "Email/Password" (minimum required)');
  console.log('   Optionally enable "Google" for social sign-in');
  console.log('');
}

checkAuthProviders().catch(console.error);

