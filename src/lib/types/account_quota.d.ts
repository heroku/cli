/**
 * Account quota informs you how much quota you have remaining for your apps.
 */
export interface AccountQuota {
  /**
   * The number of quota seconds consumed within the current quota period.
   */
  quota_used: number
  /**
   * The number of quota seconds available within the current calendar month.
   */
  account_quota: number
  /**
   * The earliest time at which apps in this account will wake up if the account is over quota.
   */
  force_idle_until: string
  /**
   * Unique identifier of an account.
   */
  account_uuid: string
  /**
   * A list of apps that have used quota in the current calendar month.
   */
  apps: {
    /**
     * Unique identifier of app.
     */
    app_uuid: string
    /**
     * The number of hours used by this app within the current calendar month.
     */
    quota_used: number
  }[]

  /**
   * Error ID returned on 200 response, are we sure of this?
   */
  id?: string
}
