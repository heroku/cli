'use strict'

import {URL} from 'url'

function insecureURL(uri: any): boolean {
  if (uri.protocol === 'https:') return false
  // allow non-https localhost, 10.*, 127.*, and 192.* clients for testing
  if (/^localhost(?:[:]\d+)?$/.test(uri.host)) return false
  if (/\.local(?:[:]\d+)?$/.test(uri.host)) return false
  if (uri.host.match(/^(10|127|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:[:]\d+)?$/)) return false
  return true
}

export function validateURL(uri: string): string {
  const u = new URL(uri)
  if (!u.protocol) throw new Error('Invalid URL')
  if (insecureURL(u)) throw new Error('Unsupported callback URL. Clients have to use HTTPS for non-local addresses.')
  return uri
}
