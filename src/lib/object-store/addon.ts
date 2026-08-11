// Defaults to the production add-on service slug. Overridable via env so the
// CLI can be pointed at a dev control plane whose add-on service is named
// differently (e.g. heroku-object-store-<env>) alongside HEROKU_DATA_HOST.
export const OBJECT_STORE_ADDON_SERVICE = process.env.OBJECT_STORE_ADDON_SERVICE || 'heroku-object-store'
