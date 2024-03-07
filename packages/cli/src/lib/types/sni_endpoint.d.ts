// This should've been imported from @heroku-cli/schema (SniEndpoint), but the schema definition it's
// extremely outdated for this interface and doesn't reflects the correct serialization from Platform API.
// This interface export can be removed when the schema is updated and use imports from schema where required.

export interface SniEndpoint {
  app: {
    /**
     * unique identifier
     */
    id: string,
    /**
     * name of app
     */
    name: string,
  },
  /**
   * raw contents of the public certificate chain (eg: .crt or .pem file)
   */
  certificate_chain: string | null,
  /**
   * when endpoint was created
   */
  created_at: string,
  /**
   * unique identifier of this SNI endpoint
   */
  /**
   * domains associated with this SSL certificate
   */
  domains: string[],
  /**
   * unique name for SSL certificate
   */
  display_name: string,
  id: string,
  /**
   * unique name for SNI endpoint
   */
  name: string,
  ssl_cert: Record<string, never> | {
    acm: boolean,
    'ca_signed?': boolean,
    cert_domains: string[],
    expires_at: string,
    /**
     * unique identifier of this SSL certificate
     */
    id: string,
    issuer: string,
    'self_signed?': boolean,
    starts_at: string,
    subject: string,
  },
  /**
   * when SNI endpoint was updated
   */
  updated_at: string,
}
