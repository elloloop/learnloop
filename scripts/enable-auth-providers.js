#!/usr/bin/env node

/**
 * Script to enable Firebase Authentication providers using Firebase Management API
 * 
 * This script enables:
 * - Email/Password
 * - Google
 * - Twitter (X)
 * - Facebook
 * - GitHub
 */

const { execSync } = require('child_process');
const https = require('https');

const PROJECT_ID = 'learnloop-3813b';
const PROJECT_NUMBER = '274154825762'; // From firebase projects:list

// Get access token from gcloud or firebase
function getAccessToken() {
  try {
    // Try gcloud first
    return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (e) {
    try {
      // Fallback to firebase token
      const token = execSync('firebase login:ci --no-localhost', { encoding: 'utf8' });
      // Parse token from output if needed
      return token.trim();
    } catch (e2) {
      console.error('Could not get access token. Please run: gcloud auth login');
      process.exit(1);
    }
  }
}

// Make API request to Firebase Management API
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const accessToken = getAccessToken();
    
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

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

// Enable authentication providers
async function enableAuthProviders() {
  console.log(`Enabling authentication providers for project: ${PROJECT_ID}\n`);

  const providers = [
    {
      name: 'Email/Password',
      providerId: 'password',
      enabled: true,
      allowPasswordSignup: true,
    },
    {
      name: 'Google',
      providerId: 'google.com',
      enabled: true,
    },
    {
      name: 'Twitter (X)',
      providerId: 'twitter.com',
      enabled: true,
    },
    {
      name: 'Facebook',
      providerId: 'facebook.com',
      enabled: true,
    },
    {
      name: 'GitHub',
      providerId: 'github.com',
      enabled: true,
    },
  ];

  for (const provider of providers) {
    try {
      console.log(`Enabling ${provider.name}...`);
      
      // Get current config
      const path = `/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/${provider.providerId}`;
      
      let config = {};
      if (provider.providerId === 'password') {
        // For email/password, we need to update the project config
        const updatePath = `/v2/projects/${PROJECT_ID}/config`;
        const updateData = {
          signIn: {
            allowDuplicateEmails: false,
            email: {
              enabled: true,
              passwordRequired: true,
            },
          },
        };
        
        await makeRequest('PATCH', updatePath, updateData);
        console.log(`✓ ${provider.name} enabled\n`);
      } else {
        // For OAuth providers, enable them
        const enablePath = `/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/${provider.providerId}:enable`;
        await makeRequest('POST', enablePath, {});
        console.log(`✓ ${provider.name} enabled\n`);
      }
    } catch (error) {
      console.error(`✗ Failed to enable ${provider.name}:`, error.message);
      // Continue with other providers
    }
  }

  console.log('\n✓ Authentication providers configuration complete!');
  console.log('\nNote: For OAuth providers (Google, Twitter, Facebook, GitHub),');
  console.log('you still need to configure OAuth credentials in the Firebase Console:');
  console.log(`https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers`);
}

// Run the script
enableAuthProviders().catch(console.error);

