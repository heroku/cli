import { APIClient } from '@heroku-cli/command'

// If HEROKU_API_URL is set, intercept HTTP requests at the network level
const customApiUrl = process.env.HEROKU_API_URL

if (customApiUrl) {
  // Parse the custom URL
  let customUrl: URL
  try {
    customUrl = new URL(customApiUrl)
  } catch (error) {
    throw new Error(`Invalid : ${customApiUrl}`)
  }
  
  // Intercept Node.js HTTP/HTTPS modules
  const http = require('http')
  const https = require('https')
  
  const originalHttpsRequest = https.request
  const originalHttpRequest = http.request
  
  function interceptRequest(originalRequest: any, isHttps: boolean) {
    return function(options: any, callback?: any) {
      // Check if this is a request to api.heroku.com
      if (options && (
        (typeof options === 'string' && options.includes('api.heroku.com')) ||
        (options.hostname === 'api.heroku.com') ||
        (options.host === 'api.heroku.com')
      )) {
        // Modify the options to use our custom URL
        if (typeof options === 'string') {
          options = options.replace('api.heroku.com', customUrl.host)
          options = options.replace('https://', `${customUrl.protocol}//`)
        } else {
          options = { ...options }
          options.hostname = customUrl.hostname
          options.host = customUrl.host
          options.port = customUrl.port || (customUrl.protocol === 'https:' ? 443 : 80)
          options.protocol = customUrl.protocol
          
          // If there's a path in the custom URL, prepend it
          if (customUrl.pathname && customUrl.pathname !== '/') {
            options.path = customUrl.pathname + (options.path || '')
          }
        }
        
        // If custom URL is HTTP but original request was HTTPS, use HTTP module instead
        if (customUrl.protocol === 'http:' && isHttps) {
          return http.request(options, callback)
        }
      }
      
      return originalRequest.call(isHttps ? https : http, options, callback)
    }
  }
  
  https.request = interceptRequest(originalHttpsRequest, true)
  http.request = interceptRequest(originalHttpRequest, false)
}

export function createAPIClient(config: any, options?: any): APIClient {
  return new APIClient(config, options)
}