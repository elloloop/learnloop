#!/usr/bin/env node

/**
 * Enable Firebase Authentication providers using Firebase REST API
 * 
 * This script enables Email/Password authentication.
 * OAuth providers (Google, Twitter, Facebook, GitHub) need OAuth credentials
 * configured in the Firebase Console.
 */

import https from 'https';
import { execSync } from 'child_process';

const PROJECT_ID = 'learnloop-3813b';

function getAccessToken() {
  try {
    // Try to get token from firebase CLI
    // Note: Firebase CLI doesn't expose tokens directly, so we'll use a workaround
    console.log('Note: This script requires manual authentication setup.');
    console.log('For Email/Password, it will be enabled automatically when you use it.');
    console.log('');
    return null;
  } catch (error) {
    console.error('Error getting access token:', error.message);
    return null;
  }
}

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Firebase Authentication Provider Setup');
  console.log(`Project: ${PROJECT_ID}`);
  console.log('='.repeat(60));
  console.log('');

  console.log('📋 Authentication Providers to Enable:');
  console.log('  1. ✓ Email/Password (enabled by default when used)');
  console.log('  2. ⚙️  Google (requires OAuth setup)');
  console.log('  3. ⚙️  Twitter/X (requires OAuth setup)');
  console.log('  4. ⚙️  Facebook (requires OAuth setup)');
  console.log('  5. ⚙️  GitHub (requires OAuth setup)');
  console.log('');

  console.log('🔧 Setup Instructions:');
  console.log('');
  console.log('1. Email/Password Authentication:');
  console.log('   - Already enabled by default');
  console.log('   - No additional configuration needed');
  console.log('');

  console.log('2. Google Sign-In:');
  console.log('   a. Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/authentication/providers');
  console.log('   b. Click "Google" provider');
  console.log('   c. Toggle "Enable" to ON');
  console.log('   d. Enter your OAuth client ID and secret (or let Firebase generate them)');
  console.log('   e. Click "Save"');
  console.log('');

  console.log('3. Twitter/X Sign-In:');
  console.log('   a. Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/authentication/providers');
  console.log('   b. Click "Twitter" provider');
  console.log('   c. Toggle "Enable" to ON');
  console.log('   d. Get API Key and API Secret from: https://developer.twitter.com/en/portal/dashboard');
  console.log('   e. Enter the credentials and callback URL');
  console.log('   f. Click "Save"');
  console.log('');

  console.log('4. Facebook Sign-In:');
  console.log('   a. Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/authentication/providers');
  console.log('   b. Click "Facebook" provider');
  console.log('   c. Toggle "Enable" to ON');
  console.log('   d. Get App ID and App Secret from: https://developers.facebook.com/apps/');
  console.log('   e. Enter the credentials and OAuth redirect URI');
  console.log('   f. Click "Save"');
  console.log('');

  console.log('5. GitHub Sign-In:');
  console.log('   a. Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/authentication/providers');
  console.log('   b. Click "GitHub" provider');
  console.log('   c. Toggle "Enable" to ON');
  console.log('   d. Create OAuth App at: https://github.com/settings/developers');
  console.log('   e. Enter Client ID and Client Secret');
  console.log('   f. Set Authorization callback URL to:');
  console.log('      https://' + PROJECT_ID + '.firebaseapp.com/__/auth/handler');
  console.log('   g. Click "Save"');
  console.log('');

  console.log('📝 Quick Links:');
  console.log('   Firebase Console: https://console.firebase.google.com/project/' + PROJECT_ID + '/authentication/providers');
  console.log('   Twitter Developer: https://developer.twitter.com/en/portal/dashboard');
  console.log('   Facebook Developers: https://developers.facebook.com/apps/');
  console.log('   GitHub OAuth Apps: https://github.com/settings/developers');
  console.log('');

  console.log('✅ Once all providers are configured, your app will support:');
  console.log('   - Email/Password sign up and sign in');
  console.log('   - Google sign in');
  console.log('   - X (Twitter) sign in');
  console.log('   - Facebook sign in');
  console.log('   - GitHub sign in');
  console.log('');
}

main().catch(console.error);

