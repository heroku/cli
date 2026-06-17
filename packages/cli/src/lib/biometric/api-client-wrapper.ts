import {APIClient} from '@heroku-cli/command'
import {HTTP} from '@heroku/http-call'
import {authenticateWithTouchId, requiresTouchIdAuth} from './touch-id'
import {ux} from '@oclif/core'

/**
 * Wraps an APIClient instance to add Touch ID authentication for non-GET requests
 * @param apiClient - The original APIClient instance
 * @returns The same instance with methods wrapped for Touch ID authentication
 */
export function wrapAPIClientWithTouchId(apiClient: APIClient): APIClient {
  // Store original methods
  const originalRequest = apiClient.request.bind(apiClient)
  const originalPost = apiClient.post.bind(apiClient)
  const originalPut = apiClient.put.bind(apiClient)
  const originalPatch = apiClient.patch.bind(apiClient)
  const originalDelete = apiClient.delete.bind(apiClient)

  // Wrap the request method (all other methods call this internally)
  apiClient.request = async function <T>(url: string, options?: APIClient.Options): Promise<HTTP<T>> {
    const method = options?.method || 'GET'

    // Debug logging
    if (process.env.DEBUG_TOUCH_ID) {
      console.error(`[Touch ID Debug] Method: ${method}, URL: ${url}, Requires auth: ${requiresTouchIdAuth(method)}`)
    }

    // Check if this request requires Touch ID
    if (requiresTouchIdAuth(method)) {
      ux.info(`Touch ID required for ${method} request to ${url}`)
      const result = await authenticateWithTouchId(`Heroku CLI is making a ${method} request to ${url}`)

      if (!result.authenticated) {
        if (result.skipped) {
          // Touch ID not available, proceed without it
          ux.warn('Touch ID not available on this device - proceeding without biometric authentication')
        } else {
          // Authentication failed or was cancelled
          throw new Error(result.error || 'Touch ID authentication failed. Cannot proceed with this operation.')
        }
      } else if (!result.skipped) {
        // Successfully authenticated
        ux.action.start('Touch ID authenticated')
        ux.action.stop('✓')
      }
    }

    return originalRequest<T>(url, options)
  }

  // Wrap convenience methods to ensure they all go through our wrapped request
  apiClient.post = async function <T>(url: string, options?: APIClient.Options): Promise<HTTP<T>> {
    return apiClient.request<T>(url, {...options, method: 'POST'})
  }

  apiClient.put = async function <T>(url: string, options?: APIClient.Options): Promise<HTTP<T>> {
    return apiClient.request<T>(url, {...options, method: 'PUT'})
  }

  apiClient.patch = async function <T>(url: string, options?: APIClient.Options): Promise<HTTP<T>> {
    return apiClient.request<T>(url, {...options, method: 'PATCH'})
  }

  apiClient.delete = async function <T>(url: string, options?: APIClient.Options): Promise<HTTP<T>> {
    return apiClient.request<T>(url, {...options, method: 'DELETE'})
  }

  return apiClient
}
