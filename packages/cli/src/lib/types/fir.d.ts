/**
 *
 * [Heroku Platform API - account-delinquency](https://devcenter.heroku.com/articles/platform-api-reference#account-delinquency)
 * A Heroku account becomes delinquent due to non-payment. We [suspend and delete](https://help.heroku.com/EREVRILX/what-happens-if-i-have-unpaid-heroku-invoices) delinquent accounts if their invoices remain unpaid.
 */
export interface AccountDelinquency {
 /**
  * scheduled time of when we will suspend your account due to delinquency
  *
  * @example "2024-01-01T12:00:00Z"
  */
  readonly scheduled_suspension_time: string | null;
 /**
  * scheduled time of when we will delete your account due to delinquency
  *
  * @example "2024-01-01T12:00:00Z"
  */
  readonly scheduled_deletion_time: string | null;
}
/**
 *
 * [Heroku Platform API - account-feature](https://devcenter.heroku.com/articles/platform-api-reference#account-feature)
 * An account feature represents a Heroku labs capability that can be enabled or disabled for an account on Heroku.
 */
export interface AccountFeature {
 /**
  * when account feature was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * description of account feature
  *
  * @example "Causes account to example."
  */
  readonly description: string;
 /**
  * documentation URL of account feature
  *
  * @example "http://devcenter.heroku.com/articles/example"
  */
  readonly doc_url: string;
 /**
  * whether or not account feature has been enabled
  *
  * @example true
  */
  enabled: boolean;
 /**
  * unique identifier of account feature
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of account feature
  *
  * @example "name"
  */
  readonly name: string;
 /**
  * state of account feature
  *
  * @example "public"
  */
  readonly state: string;
 /**
  * when account feature was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * user readable feature name
  *
  * @example "My Feature"
  */
  readonly display_name: string;
 /**
  * e-mail to send feedback about the feature
  *
  * @example "feedback@heroku.com"
  */
  readonly feedback_email: string;
}
export interface AccountFeatureUpdatePayload {
 /**
  * whether or not account feature has been enabled
  *
  * @example true
  */
  enabled: boolean;
}
/**
 *
 * [Heroku Platform API - account](https://devcenter.heroku.com/articles/platform-api-reference#account)
 * An account represents an individual signed up to use the Heroku platform.
 */
export interface Account {
 /**
  * whether to allow third party web activity tracking
  *
  * @example true
  */
  allow_tracking: boolean;
 /**
  * whether allowed to utilize beta Heroku features
  */
  beta: boolean;
 /**
  * when account was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * whether the user is federated and belongs to an Identity Provider
  */
  readonly federated: boolean;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * Identity Provider details for federated users.
  */
  identity_provider: IdentityProvider | null;
 /**
  * when account last authorized with Heroku
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly last_login: string | null;
 /**
  * full name of the account owner
  *
  * @example "Tina Edmonds"
  */
  name: string | null;
 /**
  * SMS number of account
  *
  * @example "+1 ***-***-1234"
  */
  readonly sms_number: string | null;
 /**
  * when account was suspended
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly suspended_at: string | null;
 /**
  * when account became delinquent
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly delinquent_at: string | null;
 /**
  * whether two-factor auth is enabled on the account
  */
  readonly two_factor_authentication: boolean;
 /**
  * when account was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * whether account has been verified with billing information
  */
  readonly verified: boolean;
 /**
  * country where account owner resides
  *
  * @example "United States"
  */
  country_of_residence: string | null;
 /**
  * team selected by default
  */
  default_organization: DefaultOrganization | null;
 /**
  * team selected by default
  */
  default_team: DefaultTeam | null;
}
/**
 *
 * [Heroku Platform API - identity-provider](https://devcenter.heroku.com/articles/platform-api-reference#identity-provider)
 * Identity Providers represent the SAML configuration of teams or an Enterprise account
 */
export interface IdentityProvider {
 /**
  * raw contents of the public certificate (eg: .crt or .pem file)
  *
  * @example "-----BEGIN CERTIFICATE----- ..."
  */
  certificate: string;
 /**
  * when provider record was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * URL identifier provided by the identity provider
  *
  * @example "https://customer-domain.idp.com"
  */
  entity_id: string;
 /**
  * unique identifier of this identity provider
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * single log out URL for this identity provider
  *
  * @example "https://example.com/idp/logout"
  */
  slo_target_url: string;
 /**
  * single sign on URL for this identity provider
  *
  * @example "https://example.com/idp/login"
  */
  sso_target_url: string;
 /**
  * team associated with this identity provider
  */
  organization: null | Organization;
 /**
  * when the identity provider record was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * entity that owns this identity provider
  */
  owner: Owner;
}
/**
 *
 * [Heroku Platform API - team](https://devcenter.heroku.com/articles/platform-api-reference#team)
 * Teams allow you to manage access to a shared group of applications and other resources.
 */
export interface Team {
 /**
  * unique identifier of team
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * when the team was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * whether charges incurred by the team are paid by credit card.
  *
  * @example true
  */
  readonly credit_card_collections: boolean;
 /**
  * whether to use this team when none is specified
  *
  * @example true
  */
  default: boolean;
 enterprise_account: null | TeamEnterpriseAccount;
 /**
  * Identity Provider associated with the Team
  */
  identity_provider: null | TeamIdentityProvider;
 /**
  * upper limit of members allowed in a team.
  *
  * @example 25
  */
  readonly membership_limit: number | null;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name: string;
 /**
  * whether the team is provisioned licenses by salesforce.
  *
  * @example true
  */
  readonly provisioned_licenses: boolean;
 /**
  * role in the team
  *
  * @example "admin"
  */
  readonly role: null | 'admin' | 'collaborator' | 'member' | 'owner' | '';
 /**
  * type of team.
  *
  * @example "team"
  */
  readonly type: 'enterprise' | 'team';
 /**
  * when the team was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
export interface Organization {
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name?: string;
}
/**
 *
 * entity that owns this identity provider
 */
export interface Owner {
 /**
  * unique identifier of the owner
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * name of the owner
  *
  * @example "acme"
  */
  readonly name?: string;
 /**
  * type of the owner
  *
  * @example "team"
  */
  readonly type: 'team' | 'enterprise-account';
}
/**
 *
 * team selected by default
 */
export interface DefaultOrganization {
 /**
  * unique identifier of team
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name: string;
}
/**
 *
 * team selected by default
 */
export interface DefaultTeam {
 /**
  * unique identifier of team
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name: string;
}
export interface AccountUpdatePayload {
 /**
  * whether to allow third party web activity tracking
  *
  * @example true
  */
  allow_tracking?: boolean;
 /**
  * whether allowed to utilize beta Heroku features
  */
  beta?: boolean;
 /**
  * full name of the account owner
  *
  * @example "Tina Edmonds"
  */
  name?: string | null;
}
export interface AccountUpdateByUserPayload {
 /**
  * whether to allow third party web activity tracking
  *
  * @example true
  */
  allow_tracking?: boolean;
 /**
  * whether allowed to utilize beta Heroku features
  */
  beta?: boolean;
 /**
  * full name of the account owner
  *
  * @example "Tina Edmonds"
  */
  name?: string | null;
}
/**
 *
 * [Heroku Platform API - add-on-action](https://devcenter.heroku.com/articles/platform-api-reference#add-on-action)
 * Add-on Actions are lifecycle operations for add-on provisioning and deprovisioning. They allow add-on providers to (de)provision add-ons in the background and then report back when (de)provisioning is complete.
 */
export interface AddOnAction {

}
/**
 *
 * Add-ons represent add-ons that have been provisioned and attached to one or more apps.
 */
export interface AddOn {
 /**
  * provider actions for this specific add-on
  */
  readonly actions: Array<Record<string, unknown>>;
 /**
  * identity of add-on serviceAdd-on services represent add-ons that may be provisioned for apps. Endpoints under add-on services can be accessed without authentication.
  */
  addon_service: {
 /**
  * unique identifier of this add-on-service
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of this add-on-service
  *
  * @example "heroku-postgresql"
  */
  readonly name: string;
} | AddOnService;
 /**
  * billing entity associated with this add-on
  */
  billing_entity: BillingEntity;
 /**
  * billing application associated with this add-on
  */
  app: App;
 /**
  * billed price
  */
  billed_price: BilledPrice | null;
 /**
  * config vars exposed to the owning app by this add-on
  *
  * @example ["FOO","BAZ"]
  */
  readonly config_vars: string[];
 /**
  * when add-on was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of add-on
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * globally unique name of the add-on
  *
  * @example "acme-inc-primary-database"
  */
  name: string;
 /**
  * identity of add-on planPlans represent different configurations of add-ons that may be added to apps. Endpoints under add-on services can be accessed without authentication.
  */
  plan: {
 /**
  * unique identifier of this plan
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of this plan
  *
  * @example "heroku-postgresql:dev"
  */
  readonly name: string;
} | Plan;
 /**
  * id of this add-on with its provider
  *
  * @example "abcd1234"
  */
  readonly provider_id: string;
 /**
  * A provision message
  */
  readonly provision_message?: string;
 /**
  * state in the add-on's lifecycle
  *
  * @example "provisioned"
  */
  readonly state: 'provisioning' | 'provisioned' | 'deprovisioned';
 /**
  * when add-on was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * URL for logging into web interface of add-on (e.g. a dashboard)
  *
  * @example "https://postgres.heroku.com/databases/01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly web_url: null | string;
}
/**
 *
 * [Heroku Platform API - add-on-service](https://devcenter.heroku.com/articles/platform-api-reference#add-on-service)
 * Add-on services represent add-ons that may be provisioned for apps. Endpoints under add-on services can be accessed without authentication.
 */
export interface AddOnService {
 /**
  * npm package name of the add-on service's Heroku CLI plugin
  *
  * @example "heroku-papertrail"
  */
  readonly cli_plugin_name: string | null;
 /**
  * when add-on-service was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * human-readable name of the add-on service provider
  *
  * @example "Heroku Postgres"
  */
  readonly human_name: string;
 /**
  * unique identifier of this add-on-service
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of this add-on-service
  *
  * @example "heroku-postgresql"
  */
  readonly name: string;
 /**
  * release status for add-on service
  *
  * @example "ga"
  */
  readonly state: 'alpha' | 'beta' | 'ga' | 'shutdown';
 /**
  * whether or not apps can have access to more than one instance of this add-on at the same time
  */
  readonly supports_multiple_installations: boolean;
 /**
  * whether or not apps can have access to add-ons billed to a different app
  */
  readonly supports_sharing: boolean;
 /**
  * when add-on-service was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * billing entity associated with this add-on
 */
export interface BillingEntity {
 /**
  * unique identifier of the billing entity
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * name of the billing entity
  *
  * @example "example"
  */
  readonly name: string;
 /**
  * type of Object of the billing entity; new types allowed at any time.
  *
  * @example "app"
  */
  readonly type: 'app' | 'team';
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * An app represents the program that you would like to deploy and run on Heroku.
 */
export interface App {
 /**
  * ACM status of this app
  */
  readonly acm: boolean;
 /**
  * when app was archived
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly archived_at: null | string;
 /**
  * name of the image used for the base layers of the OCI image
  *
  * @example "heroku/heroku:22-cnb"
  */
  readonly base_image_name: null | string;
 /**
  * identity of the stack that will be used for new builds
  */
  build_stack: BuildStack;
 /**
  * description from buildpack of app
  *
  * @example "Ruby/Rack"
  */
  readonly buildpack_provided_description: null | string;
 /**
  * buildpacks of the OCI image
  */
  buildpacks: null | Buildpack[];
 /**
  * when app was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * current build architecture for the app
  *
  * @example "[arm64]"
  */
  current_build_architecture: unknown[];
 /**
  * the generation of the app
  *
  * @example "fir"
  */
  readonly generation: string;
 /**
  * git repo URL of app
  *
  * @example "https://git.heroku.com/example.git"
  */
  readonly git_url: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * describes whether a Private Spaces app is externally routable or not
  */
  internal_routing: boolean | null;
 /**
  * maintenance status of app
  */
  maintenance: boolean;
 /**
  * unique name of app
  *
  * @example "example"
  */
  name: string;
 /**
  * identity of app owner
  */
  owner: AppOwner;
 /**
  * identity of team
  */
  organization: null | AppOrganization;
 /**
  * identity of team
  */
  team: null | AppTeam;
 /**
  * identity of app region
  */
  region: AppRegion;
 /**
  * when app was released
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly released_at: null | string;
 /**
  * git repo size in bytes of app
  */
  readonly repo_size: number | null;
 /**
  * slug size in bytes of app
  */
  readonly slug_size: number | null;
 /**
  * identity of space
  */
  space: null | Space;
 /**
  * identity of app stack
  */
  stack: Stack;
 /**
  * when app was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * web URL of app
  *
  * @example "https://example.herokuapp.com/"
  */
  readonly web_url: null | string;
}
/**
 *
 * billed price
 */
export interface BilledPrice {
 /**
  * price in cents per unit of plan
  */
  readonly cents: number;
 /**
  * price is negotiated in a contract outside of monthly add-on billing
  */
  readonly contract: boolean;
 /**
  * unit of price for plan
  *
  * @example "month"
  */
  readonly unit: string;
}
/**
 *
 * [Heroku Platform API - plan](https://devcenter.heroku.com/articles/platform-api-reference#plan)
 * Plans represent different configurations of add-ons that may be added to apps. Endpoints under add-on services can be accessed without authentication.
 */
export interface Plan {
 /**
  * identity of add-on service
  */
  addon_service: AddonService;
 /**
  * when plan was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * the compliance regimes applied to an add-on plan
  *
  * @example ["HIPAA"]
  */
  compliance: null | 'HIPAA' | Array<'PCI'>;
 /**
  * whether this plan is the default for its add-on service
  */
  readonly default: boolean;
 /**
  * description of plan
  *
  * @example "Heroku Postgres Dev"
  */
  readonly description: string;
 /**
  * human readable name of the add-on plan
  *
  * @example "Dev"
  */
  readonly human_name: string;
 /**
  * unique identifier of this plan
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * whether this plan is installable to a Private Spaces app
  */
  readonly installable_inside_private_network: boolean;
 /**
  * whether this plan is installable to a Common Runtime app
  *
  * @example true
  */
  readonly installable_outside_private_network: boolean;
 /**
  * unique name of this plan
  *
  * @example "heroku-postgresql:dev"
  */
  readonly name: string;
 /**
  * price
  */
  price: Price;
 /**
  * whether this plan is the default for apps in Private Spaces
  */
  readonly space_default: boolean;
 /**
  * release status for plan
  *
  * @example "public"
  */
  readonly state: string;
 /**
  * when plan was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * whether this plan is publicly visible
  *
  * @example true
  */
  readonly visible: boolean;
}
/**
 *
 * identity of add-on service
 */
export interface AddonService {
 /**
  * unique identifier of this add-on-service
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of this add-on-service
  *
  * @example "heroku-postgresql"
  */
  readonly name: string;
}
/**
 *
 * price
 */
export interface Price {
 /**
  * price in cents per unit of plan
  */
  readonly cents: number;
 /**
  * price is negotiated in a contract outside of monthly add-on billing
  */
  readonly contract: boolean;
 /**
  * unit of price for plan
  *
  * @example "month"
  */
  readonly unit: string;
}
export interface AddOnActionPeerPayload {
 /**
  * The AWS VPC Peering Connection ID of the peering.
  *
  * @example "pcx-123456789012"
  */
  readonly pcx_id: string;
}
/**
 *
 * [Heroku Platform API - add-on-attachment](https://devcenter.heroku.com/articles/platform-api-reference#add-on-attachment)
 * An add-on attachment represents a connection between an app and an add-on that it has been given access to.
 */
export interface AddOnAttachment {
 /**
  * identity of add-on
  */
  addon: Addon;
 /**
  * application that is attached to add-on
  */
  app: App;
 /**
  * when add-on attachment was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of this add-on attachment
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name for this add-on attachment to this app
  *
  * @example "DATABASE"
  */
  readonly name: string;
 /**
  * attachment namespace
  *
  * @example "role:analytics"
  */
  readonly namespace: null | string;
 /**
  * when add-on attachment was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * URL for logging into web interface of add-on in attached app context
  *
  * @example "https://postgres.heroku.com/databases/01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly web_url: null | string;
 /**
  * URL for add-on partners to write to an add-on's logs
  *
  * @example "https://token:t.abcdef12-3456-7890-abcd-ef1234567890@1.us.logplex.io/logs"
  */
  readonly log_input_url: null | string;
}
/**
 *
 * identity of add-on
 */
export interface Addon {
 /**
  * unique identifier of add-on
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * globally unique name of the add-on
  *
  * @example "acme-inc-primary-database"
  */
  name: string;
 /**
  * billing application associated with this add-on
  */
  app: App;
}
export interface AddOnAttachmentCreatePayload {
 /**
  * unique identifier of add-on or globally unique name of the add-on
  */
  addon: string;
 /**
  * unique identifier of app or unique name of app
  */
  app: string;
 /**
  * name of owning app for confirmation
  *
  * @example "example"
  */
  confirm?: string;
 /**
  * unique name for this add-on attachment to this app
  *
  * @example "DATABASE"
  */
  readonly name?: string;
 /**
  * attachment namespace
  *
  * @example "role:analytics"
  */
  readonly namespace?: null | string;
}
export interface AddOnAttachmentResolutionPayload {
 /**
  * unique name for this add-on attachment to this app
  *
  * @example "DATABASE"
  */
  readonly addon_attachment: string;
 /**
  * unique name of app
  *
  * @example "example"
  */
  app?: string;
 /**
  * unique name of this add-on-service
  *
  * @example "heroku-postgresql"
  */
  readonly addon_service?: string;
}
/**
 *
 * [Heroku Platform API - add-on-config](https://devcenter.heroku.com/articles/platform-api-reference#add-on-config)
 * Configuration of an Add-on
 */
export interface AddOnConfig {
 /**
  * unique name of the config
  *
  * @example "FOO"
  */
  name: string;
 /**
  * value of the config
  *
  * @example "bar"
  */
  value: string | null;
}
export interface AddOnConfigUpdatePayload {
 config?: AddOnConfig[];
}
/**
 *
 * [Heroku Platform API - add-on-plan-action](https://devcenter.heroku.com/articles/platform-api-reference#add-on-plan-action)
 * Add-on Plan Actions are Provider functionality for specific add-on installations
 */
export interface AddOnPlanAction {
 /**
  * a unique identifier
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * the display text shown in Dashboard
  *
  * @example "Example"
  */
  readonly label: string;
 /**
  * identifier of the action to take that is sent via SSO
  *
  * @example "example"
  */
  readonly action: string;
 /**
  * absolute URL to use instead of an action
  *
  * @example "http://example.com?resource_id=:resource_id"
  */
  readonly url: string;
 /**
  * if the action requires the user to own the app
  *
  * @example true
  */
  readonly requires_owner: boolean;
}
/**
 *
 * [Heroku Platform API - add-on-region-capability](https://devcenter.heroku.com/articles/platform-api-reference#add-on-region-capability)
 * Add-on region capabilities represent the relationship between an Add-on Service and a specific Region. Only Beta and GA add-ons are returned by these endpoints.
 */
export interface AddOnRegionCapability {
 /**
  * unique identifier of this add-on-region-capability
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * whether the add-on can be installed to a Space
  */
  readonly supports_private_networking: boolean;
 /**
  * Add-on services represent add-ons that may be provisioned for apps. Endpoints under add-on services can be accessed without authentication.
  */
  addon_service: AddOnService;
 /**
  * A region represents a geographic location in which your application may run.
  */
  region: Region;
}
/**
 *
 * [Heroku Platform API - region](https://devcenter.heroku.com/articles/platform-api-reference#region)
 * A region represents a geographic location in which your application may run.
 */
export interface Region {
 /**
  * country where the region exists
  *
  * @example "United States"
  */
  readonly country: string;
 /**
  * when region was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * description of region
  *
  * @example "United States"
  */
  readonly description: string;
 /**
  * unique identifier of region
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * area in the country where the region exists
  *
  * @example "Virginia"
  */
  readonly locale: string;
 /**
  * unique name of region
  *
  * @example "us"
  */
  readonly name: string;
 /**
  * whether or not region is available for creating a Private Space
  */
  readonly private_capable: boolean;
 /**
  * provider of underlying substrate
  */
  readonly provider: Provider;
 /**
  * when region was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * provider of underlying substrate
 */
export interface Provider {
 /**
  * name of provider
  *
  * @example "amazon-web-services"
  */
  readonly name?: string;
 /**
  * region name used by provider
  *
  * @example "us-east-1"
  */
  readonly region?: 'ap-south-1' | 'eu-west-1' | 'ap-southeast-1' | 'ap-southeast-2' | 'eu-central-1' | 'eu-west-2' | 'ap-northeast-2' | 'ap-northeast-1' | 'us-east-1' | 'sa-east-1' | 'us-west-1' | 'us-west-2' | 'ca-central-1';
}
/**
 *
 * Represents the delivery of a webhook notification, including its current status.
 */
export interface AppWebhookDelivery {
 /**
  * when the delivery was created
  */
  created_at: string;
 /**
  * identity of event
  */
  event: Event;
 /**
  * the delivery's unique identifier
  */
  readonly id: string;
 /**
  * number of times a delivery has been attempted
  */
  readonly num_attempts: number;
 /**
  * when delivery will be attempted again
  */
  next_attempt_at: string | null;
 /**
  * last attempt of a delivery
  */
  last_attempt: LastAttempt | null;
 /**
  * the delivery's status
  *
  * @example "pending"
  */
  status: 'pending' | 'scheduled' | 'retrying' | 'failed' | 'succeeded';
 /**
  * when the delivery was last updated
  */
  updated_at: string;
 /**
  * identity of webhook
  */
  webhook: Webhook;
}
/**
 *
 * identity of event
 */
export interface Event {
 /**
  * the event's unique identifier
  */
  readonly id: string;
 /**
  * the type of entity that the event is related to
  *
  * @example "api:release"
  */
  include: string;
}
/**
 *
 * last attempt of a delivery
 */
export interface LastAttempt {
 /**
  * unique identifier of attempt
  */
  readonly id: string;
 /**
  * http response code received during attempt
  */
  readonly code: number | null;
 /**
  * error class encountered during attempt
  */
  readonly error_class: string | null;
 /**
  * status of an attempt
  *
  * @example "scheduled"
  */
  status: 'scheduled' | 'succeeded' | 'failed';
 /**
  * when attempt was created
  */
  created_at: string;
 /**
  * when attempt was updated
  */
  updated_at: string;
}
/**
 *
 * identity of webhook
 */
export interface Webhook {
 /**
  * the webhook's unique identifier
  */
  readonly id: string;
 /**
  * if `notify`, Heroku makes a single, fire-and-forget delivery attempt. If `sync`, Heroku attempts multiple deliveries until the request is successful or a limit is reached
  *
  * @example "notify"
  */
  level: 'notify' | 'sync';
}
/**
 *
 * Represents a webhook event that occurred.
 */
export interface AppWebhookEvent {
 /**
  * when event was created
  */
  created_at: string;
 /**
  * the event's unique identifier
  */
  readonly id: string;
 /**
  * the type of entity that the event is related to
  *
  * @example "api:release"
  */
  include: string;
 /**
  * payload of event
  */
  payload: Payload;
 /**
  * when the event was last updated
  */
  updated_at: string;
}
/**
 *
 * payload of event
 */
export interface Payload {
 /**
  * the type of event that occurred
  *
  * @example "create"
  */
  action: string;
 /**
  * user that caused event
  */
  actor: Actor;
 /**
  * the current details of the event
  */
  data: Record<string, unknown>;
 /**
  * previous details of the event (if any)
  */
  previous_data: Record<string, unknown>;
 /**
  * the type of resource associated with the event
  *
  * @example "release"
  */
  resource: string;
 /**
  * the version of the details provided for the event
  *
  * @example "1"
  */
  version: string;
}
/**
 *
 * user that caused event
 */
export interface Actor {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * [Heroku Platform API - add-on-webhook](https://devcenter.heroku.com/articles/platform-api-reference#add-on-webhook)
 * Represents the details of a webhook subscription
 */
export interface AddOnWebhook {
 /**
  * when the webhook was created
  */
  created_at: string;
 /**
  * the webhook's unique identifier
  */
  readonly id: string;
 /**
  * the entities that the subscription provides notifications for
  */
  include: string[];
 /**
  * if `notify`, Heroku makes a single, fire-and-forget delivery attempt. If `sync`, Heroku attempts multiple deliveries until the request is successful or a limit is reached
  *
  * @example "notify"
  */
  level: 'notify' | 'sync';
 /**
  * when the webhook was updated
  */
  updated_at: string;
 /**
  * the URL where the webhook's notification requests are sent
  */
  url: string;
}
export interface AddOnWebhookCreatePayload {
 /**
  * a custom `Authorization` header that Heroku will include with all webhook notifications
  *
  * @example "Bearer 9266671b2767f804c9d5809c2d384ed57d8f8ce1abd1043e1fb3fbbcb8c3"
  */
  authorization?: null | string;
 /**
  * the entities that the subscription provides notifications for
  */
  include: string[];
 /**
  * if `notify`, Heroku makes a single, fire-and-forget delivery attempt. If `sync`, Heroku attempts multiple deliveries until the request is successful or a limit is reached
  *
  * @example "notify"
  */
  level: 'notify' | 'sync';
 /**
  * a value that Heroku will use to sign all webhook notification requests (the signature is included in the request’s `Heroku-Webhook-Hmac-SHA256` header)
  *
  * @example "dcbff0c4430a2960a2552389d587bc58d30a37a8cf3f75f8fb77abe667ad"
  */
  secret?: null | string;
 /**
  * the URL where the webhook's notification requests are sent
  */
  url: string;
}
/**
 *
 * add-on webhook
 */
export interface AddonWebhook {
 /**
  * identity of add-on. Only used for add-on partner webhooks.
  */
  addon?: AddonWebhookAddon;
 /**
  * when the webhook was created
  */
  created_at?: string;
 /**
  * the webhook's unique identifier
  */
  readonly id?: string;
 /**
  * the entities that the subscription provides notifications for
  */
  include?: string[];
 /**
  * if `notify`, Heroku makes a single, fire-and-forget delivery attempt. If `sync`, Heroku attempts multiple deliveries until the request is successful or a limit is reached
  *
  * @example "notify"
  */
  level?: 'notify' | 'sync';
 /**
  * when the webhook was updated
  */
  updated_at?: string;
 /**
  * the URL where the webhook's notification requests are sent
  */
  url?: string;
}
/**
 *
 * identity of add-on. Only used for add-on partner webhooks.
 */
export interface AddonWebhookAddon {
 /**
  * unique identifier of add-on
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * globally unique name of the add-on
  *
  * @example "acme-inc-primary-database"
  */
  name: string;
}
export interface AddOnWebhookUpdatePayload {
 /**
  * a custom `Authorization` header that Heroku will include with all webhook notifications
  *
  * @example "Bearer 9266671b2767f804c9d5809c2d384ed57d8f8ce1abd1043e1fb3fbbcb8c3"
  */
  authorization?: null | string;
 /**
  * the entities that the subscription provides notifications for
  */
  include?: string[];
 /**
  * if `notify`, Heroku makes a single, fire-and-forget delivery attempt. If `sync`, Heroku attempts multiple deliveries until the request is successful or a limit is reached
  *
  * @example "notify"
  */
  level?: 'notify' | 'sync';
 /**
  * a value that Heroku will use to sign all webhook notification requests (the signature is included in the request’s `Heroku-Webhook-Hmac-SHA256` header)
  *
  * @example "dcbff0c4430a2960a2552389d587bc58d30a37a8cf3f75f8fb77abe667ad"
  */
  secret?: null | string;
 /**
  * the URL where the webhook's notification requests are sent
  */
  url?: string;
}
export interface AddOnCreatePayload {
 /**
  * name for add-on's initial attachment
  *
  * @example {"name":"DATABASE_FOLLOWER"}
  */
  attachment?: Attachment;
 /**
  * custom add-on provisioning options
  *
  * @example {"db-version":"1.2.3"}
  */
  config?: Record<string, unknown>;
 /**
  * name of billing entity for confirmation
  *
  * @example "example"
  */
  confirm?: string;
 /**
  * unique identifier of this plan or unique name of this plan
  */
  plan: string;
 /**
  * globally unique name of the add-on
  *
  * @example "acme-inc-primary-database"
  */
  name?: string;
}
/**
 *
 * name for add-on's initial attachment
 */
export interface Attachment {
 /**
  * unique name for this add-on attachment to this app
  *
  * @example "DATABASE"
  */
  readonly name?: string;
}
export interface AddOnUpdatePayload {
 /**
  * globally unique name of the add-on
  *
  * @example "acme-inc-primary-database"
  */
  name?: string;
 /**
  * unique identifier of this plan or unique name of this plan
  */
  plan: string;
}
export interface AddOnResolutionPayload {
 /**
  * globally unique name of the add-on
  *
  * @example "acme-inc-primary-database"
  */
  addon: string;
 /**
  * unique name of app
  *
  * @example "example"
  */
  app?: string;
 /**
  * unique name of this add-on-service
  *
  * @example "heroku-postgresql"
  */
  readonly addon_service?: string;
}
/**
 *
 * [Heroku Platform API - allowed-add-on-service](https://devcenter.heroku.com/articles/platform-api-reference#allowed-add-on-service)
 * Entities that have been allowed to be used by a Team
 */
export interface AllowedAddOnService {
 /**
  * when the add-on service was allowed
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly added_at: string;
 /**
  * the user which allowed the add-on service
  */
  readonly added_by: AddedBy;
 /**
  * the add-on service allowed for use
  */
  readonly addon_service: AllowedAddOnServiceAddonService;
 /**
  * unique identifier for this allowed add-on service record
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * the user which allowed the add-on service
 */
export interface AddedBy {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email?: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
/**
 *
 * the add-on service allowed for use
 */
export interface AllowedAddOnServiceAddonService {
 /**
  * unique identifier of this add-on-service
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of this add-on-service
  *
  * @example "heroku-postgresql"
  */
  readonly name?: string;
 /**
  * human-readable name of the add-on service provider
  *
  * @example "Heroku Postgres"
  */
  readonly human_name?: string;
}
export interface AllowedAddOnServiceCreateByTeamPayload {
 /**
  * name of the add-on service to allow
  *
  * @example "heroku-postgresql"
  */
  addon_service?: string;
}
/**
 *
 * [Heroku Platform API - app-feature](https://devcenter.heroku.com/articles/platform-api-reference#app-feature)
 * An app feature represents a Heroku labs capability that can be enabled or disabled for an app on Heroku.
 */
export interface AppFeature {
 /**
  * when app feature was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * description of app feature
  *
  * @example "Causes app to example."
  */
  readonly description: string;
 /**
  * documentation URL of app feature
  *
  * @example "http://devcenter.heroku.com/articles/example"
  */
  readonly doc_url: string;
 /**
  * whether or not app feature has been enabled
  *
  * @example true
  */
  enabled: boolean;
 /**
  * unique identifier of app feature
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of app feature
  *
  * @example "name"
  */
  readonly name: string;
 /**
  * state of app feature
  *
  * @example "public"
  */
  readonly state: string;
 /**
  * when app feature was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * user readable feature name
  *
  * @example "My Feature"
  */
  readonly display_name: string;
 /**
  * e-mail to send feedback about the feature
  *
  * @example "feedback@heroku.com"
  */
  readonly feedback_email: string;
}
export interface AppFeatureUpdatePayload {
 /**
  * whether or not app feature has been enabled
  *
  * @example true
  */
  enabled: boolean;
}
/**
 *
 * [Heroku Platform API - app-setup](https://devcenter.heroku.com/articles/platform-api-reference#app-setup)
 * An app setup represents an app on Heroku that is setup using an environment, addons, and scripts described in an app.json manifest file.
 */
export interface AppSetup {
 /**
  * unique identifier of app setup
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * when app setup was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * when app setup was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * the overall status of app setup
  *
  * @example "failed"
  */
  readonly status: 'failed' | 'pending' | 'succeeded';
 /**
  * reason that app setup has failed
  *
  * @example "invalid app.json"
  */
  readonly failure_message: string | null;
 /**
  * identity of app
  */
  app: App;
 /**
  * identity and status of build
  */
  build: null | Build;
 /**
  * errors associated with invalid app.json manifest file
  *
  * @example ["config var FOO is required"]
  */
  readonly manifest_errors: string[];
 /**
  * result of postdeploy script
  */
  readonly postdeploy: Postdeploy | null;
 /**
  * fully qualified success url
  *
  * @example "https://example.herokuapp.com/welcome"
  */
  readonly resolved_success_url: string | null;
}
/**
 *
 * [Heroku Platform API - build](https://devcenter.heroku.com/articles/platform-api-reference#build)
 * A build represents the process of transforming a code tarball into a slug
 */
export interface Build {
 /**
  * app that the build belongs to
  */
  app?: BuildApp;
 /**
  * buildpacks executed for this build, in order
  */
  buildpacks?: Array<{
 /**
  * the URL of the buildpack for the app
  *
  * @example "https://github.com/heroku/heroku-buildpack-ruby"
  */
  url?: string;
 /**
  * Buildpack Registry name of the buildpack for the app
  *
  * @example "heroku/ruby"
  */
  name?: string;
}> | null;
 /**
  * when build was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of build
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * Build process output will be available from this URL as a stream. The stream is available as either `text/plain` or `text/event-stream`. Clients should be prepared to handle disconnects and can resume the stream by sending a `Range` header (for `text/plain`) or a `Last-Event-Id` header (for `text/event-stream`).
  *
  * @example "https://build-output.heroku.com/streams/01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly output_stream_url?: string;
 /**
  * location of gzipped tarball of source code used to create build
  */
  source_blob: BuildSourceBlob;
 /**
  * release resulting from the build
  *
  * @example {"id":"01234567-89ab-cdef-0123-456789abcdef"}
  */
  readonly release?: null | BuildRelease;
 /**
  * slug created by this build
  */
  slug?: Slug | null;
 /**
  * stack of build
  *
  * @example "heroku-22"
  */
  readonly stack?: string;
 /**
  * status of build
  *
  * @example "succeeded"
  */
  readonly status: 'failed' | 'pending' | 'succeeded';
 /**
  * when build was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * user that started the build
  */
  user: User;
}
/**
 *
 * result of postdeploy script
 */
export interface Postdeploy {
 /**
  * output of the postdeploy script
  *
  * @example "assets precompiled"
  */
  readonly output?: string;
 /**
  * The exit code of the postdeploy script
  *
  * @example 1
  */
  readonly exit_code?: number;
}
export interface AppSetupCreatePayload {
 /**
  * optional parameters for created app
  */
  app?: AppSetupCreatePayloadApp;
 /**
  * gzipped tarball of source code containing app.json manifest file
  */
  source_blob: SourceBlob;
 /**
  * overrides of keys in the app.json manifest file
  *
  * @example {"buildpacks":[{"url":"https://example.com/buildpack.tgz"}],"env":{"FOO":"bar","BAZ":"qux"}}
  */
  overrides?: Overrides;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * optional parameters for created app
 */
export interface AppSetupCreatePayloadApp {
 /**
  * are other team members forbidden from joining this app.
  */
  locked?: boolean;
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly organization?: string;
 /**
  * force creation of the app in the user account even if a default team is set.
  */
  personal?: boolean;
 /**
  * unique name of region
  *
  * @example "us"
  */
  readonly region?: string;
 /**
  * unique name of space
  *
  * @example "nasa"
  */
  space?: string;
 /**
  * unique name of stack
  *
  * @example "heroku-18"
  */
  readonly stack?: string;
}
/**
 *
 * gzipped tarball of source code containing app.json manifest file
 */
export interface SourceBlob {
 /**
  * an optional checksum of the gzipped tarball for verifying its integrity
  *
  * @example "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  */
  readonly checksum?: null | string;
 /**
  * URL of gzipped tarball of source code containing app.json manifest file
  *
  * @example "https://example.com/source.tgz?token=xyz"
  */
  readonly url?: string;
 /**
  * Version of the gzipped tarball.
  *
  * @example "v1.3.0"
  */
  readonly version?: string | null;
}
/**
 *
 * overrides of keys in the app.json manifest file
 */
export interface Overrides {
 /**
  * overrides the buildpacks specified in the app.json manifest file
  *
  * @example [{"url":"https://example.com/buildpack.tgz"}]
  */
  buildpacks?: BuildpackOverride[];
 /**
  * overrides of the env specified in the app.json manifest file
  *
  * @example {"FOO":"bar","BAZ":"qux"}
  */
  readonly env?: Record<string, unknown>;
}
/**
 *
 * a buildpack override
 */
export interface BuildpackOverride {
 /**
  * location of the buildpack
  *
  * @example "https://example.com/buildpack.tgz"
  */
  url?: string;
}
/**
 *
 * [Heroku Platform API - app-transfer](https://devcenter.heroku.com/articles/platform-api-reference#app-transfer)
 * An app transfer represents a two party interaction for transferring ownership of an app.
 */
export interface AppTransfer {
 /**
  * app involved in the transfer
  */
  app: App;
 /**
  * when app transfer was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of app transfer
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * identity of the owner of the transfer
  */
  owner: AppTransferOwner;
 /**
  * identity of the recipient of the transfer
  */
  recipient: Recipient;
 /**
  * the current state of an app transfer
  *
  * @example "pending"
  */
  readonly state: 'pending' | 'accepted' | 'declined';
 /**
  * when app transfer was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * identity of the owner of the transfer
 */
export interface AppTransferOwner {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * identity of the recipient of the transfer
 */
export interface Recipient {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
export interface AppTransferCreatePayload {
 /**
  * unique identifier of app or unique name of app
  */
  app: string;
 /**
  * unique email address of account or unique identifier of an account or Implicit reference to currently authorized user
  */
  recipient: string;
 /**
  * whether to suppress email notification when transferring apps
  */
  readonly silent?: boolean;
}
export interface AppTransferUpdatePayload {
 /**
  * the current state of an app transfer
  *
  * @example "pending"
  */
  readonly state: 'pending' | 'accepted' | 'declined';
}
export interface AppWebhookCreatePayload {
 /**
  * a custom `Authorization` header that Heroku will include with all webhook notifications
  *
  * @example "Bearer 9266671b2767f804c9d5809c2d384ed57d8f8ce1abd1043e1fb3fbbcb8c3"
  */
  authorization?: null | string;
 /**
  * the entities that the subscription provides notifications for
  */
  include: string[];
 /**
  * if `notify`, Heroku makes a single, fire-and-forget delivery attempt. If `sync`, Heroku attempts multiple deliveries until the request is successful or a limit is reached
  *
  * @example "notify"
  */
  level: 'notify' | 'sync';
 /**
  * a value that Heroku will use to sign all webhook notification requests (the signature is included in the request’s `Heroku-Webhook-Hmac-SHA256` header)
  *
  * @example "dcbff0c4430a2960a2552389d587bc58d30a37a8cf3f75f8fb77abe667ad"
  */
  secret?: null | string;
 /**
  * the URL where the webhook's notification requests are sent
  */
  url: string;
}
/**
 *
 * app webhook
 */
export interface AppWebhook {
 /**
  * identity of app. Only used for customer webhooks.
  */
  app?: App;
 /**
  * when the webhook was created
  */
  created_at?: string;
 /**
  * the webhook's unique identifier
  */
  readonly id?: string;
 /**
  * the entities that the subscription provides notifications for
  */
  include?: string[];
 /**
  * if `notify`, Heroku makes a single, fire-and-forget delivery attempt. If `sync`, Heroku attempts multiple deliveries until the request is successful or a limit is reached
  *
  * @example "notify"
  */
  level?: 'notify' | 'sync';
 /**
  * when the webhook was updated
  */
  updated_at?: string;
 /**
  * the URL where the webhook's notification requests are sent
  */
  url?: string;
}
export interface AppWebhookUpdatePayload {
 /**
  * a custom `Authorization` header that Heroku will include with all webhook notifications
  *
  * @example "Bearer 9266671b2767f804c9d5809c2d384ed57d8f8ce1abd1043e1fb3fbbcb8c3"
  */
  authorization?: null | string;
 /**
  * the entities that the subscription provides notifications for
  */
  include?: string[];
 /**
  * if `notify`, Heroku makes a single, fire-and-forget delivery attempt. If `sync`, Heroku attempts multiple deliveries until the request is successful or a limit is reached
  *
  * @example "notify"
  */
  level?: 'notify' | 'sync';
 /**
  * a value that Heroku will use to sign all webhook notification requests (the signature is included in the request’s `Heroku-Webhook-Hmac-SHA256` header)
  *
  * @example "dcbff0c4430a2960a2552389d587bc58d30a37a8cf3f75f8fb77abe667ad"
  */
  secret?: null | string;
 /**
  * the URL where the webhook's notification requests are sent
  */
  url?: string;
}
/**
 *
 * identity of the stack that will be used for new builds
 */
export interface BuildStack {
 /**
  * unique identifier of stack
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of stack
  *
  * @example "heroku-18"
  */
  readonly name?: string;
}
/**
 *
 * set of executables that inspects app source code and creates a plan to build and run your image
 */
export interface Buildpack {
 /**
  * identifier of the buildpack
  *
  * @example "heroku/ruby"
  */
  id?: string;
 /**
  * version of the buildpack
  *
  * @example "2.0.0"
  */
  version?: string;
 /**
  * homepage of the buildpack
  *
  * @example "https://github.com/heroku/buildpacks-ruby"
  */
  homepage?: string;
}
/**
 *
 * identity of app owner
 */
export interface AppOwner {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * identity of team
 */
export interface AppOrganization {
 /**
  * unique identifier of team
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name?: string;
}
/**
 *
 * [Heroku Platform API - team](https://devcenter.heroku.com/articles/platform-api-reference#team)
 * identity of team
 */
export interface AppTeam {
 /**
  * unique identifier of team
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name?: string;
}
/**
 *
 * [Heroku Platform API - region](https://devcenter.heroku.com/articles/platform-api-reference#region)
 * identity of app region
 */
export interface AppRegion {
 /**
  * unique identifier of region
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of region
  *
  * @example "us"
  */
  readonly name: string;
}
/**
 *
 * A space is an isolated, highly available, secure app execution environment.
 */
export interface Space {
 /**
  * when space was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of space
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of space
  *
  * @example "nasa"
  */
  name: string;
 /**
  * organization that owns this space
  */
  organization: Organization;
 /**
  * team that owns this space
  */
  team: SpaceTeam;
 /**
  * identity of space region
  */
  region: SpaceRegion;
 /**
  * true if this space has shield enabled
  *
  * @example true
  */
  readonly shield: boolean;
 /**
  * availability of this space
  *
  * @example "allocated"
  */
  readonly state: 'allocating' | 'allocated' | 'deleting';
 /**
  * when space was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * The RFC-1918 CIDR the Private Space will use. It must be a /16 in 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16
  *
  * @example "172.20.20.30/16"
  */
  cidr: string;
 /**
  * The RFC-1918 CIDR that the Private Space will use for the Heroku-managed peering connection that's automatically created when using Heroku Data add-ons. It must be between a /16 and a /20
  *
  * @example "10.2.0.0/16"
  */
  data_cidr: string;
 /**
  * generation for space
  *
  * @example "fir"
  */
  generation: {
    id: string,
    name: string,
 }
}
/**
 *
 * [Heroku Platform API - stack](https://devcenter.heroku.com/articles/platform-api-reference#stack)
 * Stacks are the different application execution environments available in the Heroku platform.
 */
export interface Stack {
 /**
  * indicates this stack is the default for new apps
  *
  * @example true
  */
  readonly default: boolean;
 /**
  * when stack was introduced
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of stack
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of stack
  *
  * @example "heroku-18"
  */
  readonly name: string;
 /**
  * availability of this stack: beta, deprecated or public
  *
  * @example "public"
  */
  readonly state: string;
 /**
  * when stack was last modified
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
export interface AppCreatePayload {
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
 /**
  * unique identifier of region or unique name of region
  */
  region?: string;
 /**
  * unique name of stack or unique identifier of stack
  */
  stack?: string;
 /**
  * unique name of app feature
  */
  feature_flags?: string[];
}
export interface AppUpdatePayload {
 /**
  * unique name of stack or unique identifier of stack
  */
  build_stack?: string;
 /**
  * maintenance status of app
  */
  maintenance?: boolean;
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
}
/**
 *
 * [Heroku Platform API - archive](https://devcenter.heroku.com/articles/platform-api-reference#archive)
 * An audit trail archive represents a monthly json zipped file containing events
 */
export interface Archive {
 /**
  * when archive was created
  */
  created_at: string;
 /**
  * month of the archive
  *
  * @example "10"
  */
  readonly month: '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12';
 /**
  * year of the archive
  *
  * @example 2019
  */
  readonly year: number;
 /**
  * url where to download the archive
  */
  readonly url: string;
 /**
  * checksum for the archive
  */
  readonly checksum: string;
 /**
  * size of the archive in bytes
  *
  * @example 100
  */
  readonly size: number;
}
/**
 *
 * [Heroku Platform API - audit-trail-event](https://devcenter.heroku.com/articles/platform-api-reference#audit-trail-event)
 * An audit trail event represents some action on the platform
 */
export interface AuditTrailEvent {
 /**
  * when event was created
  */
  created_at: string;
 /**
  * unique identifier of event
  */
  readonly id: string;
 /**
  * type of event
  */
  readonly type: string;
 /**
  * action for the event
  */
  readonly action: string;
 /**
  * user who caused event
  */
  readonly actor: AuditTrailEventActor;
 /**
  * app upon which event took place
  */
  readonly app: AuditTrailEventApp;
 /**
  * owner of the app targeted by the event
  */
  readonly owner: AuditTrailEventOwner;
 /**
  * enterprise account on which the event happened
  */
  readonly enterprise_account: EnterpriseAccount;
 /**
  * team on which the event happened
  */
  readonly team: AuditTrailEventTeam;
 /**
  * information about where the action was triggered
  */
  readonly request: Request;
 /**
  * data specific to the event
  */
  readonly data: Record<string, unknown>;
}
/**
 *
 * user who caused event
 */
export interface AuditTrailEventActor {
 id?: string;
 email?: string;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app upon which event took place
 */
export interface AuditTrailEventApp {
 id?: string;
 name?: string;
}
/**
 *
 * owner of the app targeted by the event
 */
export interface AuditTrailEventOwner {
 id?: string;
 email?: string;
}
/**
 *
 * [Heroku Platform API - enterprise-account](https://devcenter.heroku.com/articles/platform-api-reference#enterprise-account)
 * Enterprise accounts allow companies to manage their development teams and billing.
 */
export interface EnterpriseAccount {
 /**
  * unique identifier of the enterprise account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * when the enterprise account was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique name of the enterprise account
  *
  * @example "example"
  */
  readonly name: string;
 /**
  * when the enterprise account was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * the current user's permissions for this enterprise account
  */
  readonly permissions: string[];
 /**
  * whether the enterprise account is a trial or not
  */
  readonly trial: boolean;
 /**
  * Identity Provider associated with the Enterprise Account
  */
  identity_provider: null | EnterpriseAccountIdentityProvider;
}
/**
 *
 * [Heroku Platform API - team](https://devcenter.heroku.com/articles/platform-api-reference#team)
 * team on which the event happened
 */
export interface AuditTrailEventTeam {
 id?: string;
 name?: string;
}
/**
 *
 * information about where the action was triggered
 */
export interface Request {
 ip_address?: string;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app that the build belongs to
 */
export interface BuildApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * location of gzipped tarball of source code used to create build
 */
export interface BuildSourceBlob {
 /**
  * an optional checksum of the gzipped tarball for verifying its integrity
  *
  * @example "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  */
  readonly checksum: null | string;
 /**
  * URL where gzipped tar archive of source code for build was downloaded.
  *
  * @example "https://example.com/source.tgz?token=xyz"
  */
  readonly url: string;
 /**
  * Version of the gzipped tarball.
  *
  * @example "v1.3.0"
  */
  readonly version: string | null;
 /**
  * Version description of the gzipped tarball.
  *
  * @example "* Fake User: Change session key"
  */
  readonly version_description: string | null;
}
/**
 *
 * [Heroku Platform API - release](https://devcenter.heroku.com/articles/platform-api-reference#release)
 * release resulting from the build
 */
export interface BuildRelease {
 /**
  * unique identifier of release
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * [Heroku Platform API - slug](https://devcenter.heroku.com/articles/platform-api-reference#slug)
 * A slug is a snapshot of your application code that is ready to run on the platform.
 */
export interface Slug {
 /**
  * pointer to the url where clients can fetch or store the actual release binary
  */
  blob: Blob;
 /**
  * description from buildpack of slug
  *
  * @example "Ruby/Rack"
  */
  buildpack_provided_description: null | string;
 /**
  * an optional checksum of the slug for verifying its integrity
  *
  * @example "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  */
  readonly checksum: null | string;
 /**
  * identification of the code with your version control system (eg: SHA of the git HEAD)
  *
  * @example "60883d9e8947a57e04dc9124f25df004866a2051"
  */
  commit: null | string;
 /**
  * an optional description of the provided commit
  *
  * @example "fixed a bug with API documentation"
  */
  commit_description: null | string;
 /**
  * when slug was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of slug
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * hash mapping process type names to their respective command
  *
  * @example {"web":"./bin/web -p $PORT"}
  */
  process_types: Record<string, unknown>;
 /**
  * size of slug, in bytes
  *
  * @example 2048
  */
  readonly size: number | null;
 /**
  * identity of slug stack
  */
  stack: Stack;
 /**
  * when slug was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * user that started the build
 */
export interface User {
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
}
export interface BuildCreatePayload {
 /**
  * buildpacks executed for this build, in order
  */
  buildpacks?: Array<{
 /**
  * the URL of the buildpack for the app
  *
  * @example "https://github.com/heroku/heroku-buildpack-ruby"
  */
  url?: string;
 /**
  * Buildpack Registry name of the buildpack for the app
  *
  * @example "heroku/ruby"
  */
  name?: string;
}> | null;
 /**
  * location of gzipped tarball of source code used to create build
  */
  source_blob: BuildCreatePayloadSourceBlob;
}
/**
 *
 * location of gzipped tarball of source code used to create build
 */
export interface BuildCreatePayloadSourceBlob {
 /**
  * an optional checksum of the gzipped tarball for verifying its integrity
  *
  * @example "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  */
  readonly checksum: null | string;
 /**
  * URL where gzipped tar archive of source code for build was downloaded.
  *
  * @example "https://example.com/source.tgz?token=xyz"
  */
  readonly url: string;
 /**
  * Version of the gzipped tarball.
  *
  * @example "v1.3.0"
  */
  readonly version: string | null;
 /**
  * Version description of the gzipped tarball.
  *
  * @example "* Fake User: Change session key"
  */
  readonly version_description: string | null;
}
/**
 *
 * [Heroku Platform API - buildpack-installation](https://devcenter.heroku.com/articles/platform-api-reference#buildpack-installation)
 * A buildpack installation represents a buildpack that will be run against an app.
 */
export interface BuildpackInstallation {
 /**
  * determines the order in which the buildpacks will execute
  */
  readonly ordinal: number;
 /**
  * buildpack
  */
  buildpack: BuildpackInstallationBuildpack;
}
/**
 *
 * buildpack
 */
export interface BuildpackInstallationBuildpack {
 /**
  * location of the buildpack for the app. Either a url (unofficial buildpacks) or an internal urn (heroku official buildpacks).
  *
  * @example "https://github.com/heroku/heroku-buildpack-ruby"
  */
  url?: string;
 /**
  * either the Buildpack Registry name or a URL of the buildpack for the app
  *
  * @example "heroku/ruby"
  */
  name?: string;
}
export interface BuildpackInstallationUpdatePayload {
 /**
  * The buildpack attribute can accept a name, a url, or a urn.
  */
  updates: Update[];
}
/**
 *
 * Properties to update a buildpack installation
 */
export interface Update {
 /**
  * location of the buildpack for the app. Either a url (unofficial buildpacks) or an internal urn (heroku official buildpacks).
  *
  * @example "https://github.com/heroku/heroku-buildpack-ruby"
  */
  buildpack: string;
}
/**
 *
 * [Heroku Platform API - collaborator](https://devcenter.heroku.com/articles/platform-api-reference#collaborator)
 * A collaborator represents an account that has been given access to an app on Heroku.
 */
export interface Collaborator {
 /**
  * app collaborator belongs to
  */
  app: CollaboratorApp;
 /**
  * when collaborator was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of collaborator
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 permissions?: TeamAppPermission[];
 /**
  * role in the team
  *
  * @example "admin"
  */
  readonly role?: null | 'admin' | 'collaborator' | 'member' | 'owner' | '';
 /**
  * when collaborator was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * identity of collaborated account
  */
  user: CollaboratorUser;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app collaborator belongs to
 */
export interface CollaboratorApp {
 /**
  * unique name of app
  *
  * @example "example"
  */
  name: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * [Heroku Platform API - team-app-permission](https://devcenter.heroku.com/articles/platform-api-reference#team-app-permission)
 * A team app permission is a behavior that is assigned to a user in a team app.
 */
export interface TeamAppPermission {
 /**
  * The name of the app permission.
  *
  * @example "view"
  */
  readonly name?: string;
 /**
  * A description of what the app permission allows.
  *
  * @example "Can manage config, deploy, run commands and restart the app."
  */
  readonly description?: string;
}
/**
 *
 * identity of collaborated account
 */
export interface CollaboratorUser {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * whether the user is federated and belongs to an Identity Provider
  */
  readonly federated: boolean;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
export interface CollaboratorCreatePayload {
 /**
  * whether to suppress email invitation when creating collaborator
  */
  silent?: boolean;
 /**
  * unique email address of account or unique identifier of an account or Implicit reference to currently authorized user
  */
  user: string;
}
/**
 *
 * [Heroku Platform API - credit](https://devcenter.heroku.com/articles/platform-api-reference#credit)
 * A credit represents value that will be used up before further charges are assigned to an account.
 */
export interface Credit {
 /**
  * total value of credit in cents
  *
  * @example 10000
  */
  amount: number;
 /**
  * remaining value of credit in cents
  *
  * @example 5000
  */
  balance: number;
 /**
  * when credit was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  created_at: string;
 /**
  * when credit will expire
  *
  * @example "2012-01-01T12:00:00Z"
  */
  expires_at: string;
 /**
  * unique identifier of credit
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  id: string;
 /**
  * a name for credit
  *
  * @example "gift card"
  */
  title: string;
 /**
  * when credit was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  updated_at: string;
}
export interface CreditCreatePayload {
 /**
  * first code from a discount card
  *
  * @example "012abc"
  */
  code1?: string;
 /**
  * second code from a discount card
  *
  * @example "012abc"
  */
  code2?: string;
}
/**
 *
 * [Heroku Platform API - domain](https://devcenter.heroku.com/articles/platform-api-reference#domain)
 * Domains define what web routes should be routed to an app on Heroku.
 */
export interface Domain {
 /**
  * status of this record's ACM
  *
  * @example "pending"
  */
  readonly acm_status: null | string;
 /**
  * reason for the status of this record's ACM
  *
  * @example "Failing CCA check"
  */
  readonly acm_status_reason: null | string;
 /**
  * app that owns the domain
  */
  app: DomainApp;
 /**
  * canonical name record, the address to point a domain at
  *
  * @example "example.herokudns.com"
  */
  readonly cname: null | string;
 /**
  * when domain was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * full hostname
  *
  * @example "subdomain.example.com"
  */
  readonly hostname: string;
 /**
  * unique identifier of this domain
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * type of domain name
  *
  * @example "custom"
  */
  readonly kind: 'heroku' | 'custom';
 /**
  * when domain was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * status of this record's cname
  *
  * @example "pending"
  */
  readonly status: string;
 /**
  * sni endpoint the domain is associated with
  */
  sni_endpoint: null | SniEndpoint;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app that owns the domain
 */
export interface DomainApp {
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
/**
 *
 * [Heroku Platform API - sni-endpoint](https://devcenter.heroku.com/articles/platform-api-reference#sni-endpoint)
 * SNI Endpoint is a public address serving a custom SSL cert for HTTPS traffic, using the SNI TLS extension, to a Heroku app.
 */
export interface SniEndpoint {
 /**
  * raw contents of the public certificate chain (eg: .crt or .pem file)
  *
  * @example "-----BEGIN CERTIFICATE----- ..."
  */
  certificate_chain: string;
 /**
  * when endpoint was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of this SNI endpoint
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name for SNI endpoint
  *
  * @example "example"
  */
  readonly name: string;
 /**
  * when SNI endpoint was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * unique name for SSL certificate
  *
  * @example "example"
  */
  display_name: string | null;
 /**
  * domains associated with this SSL certificate
  */
  readonly domains: string[];
 /**
  * application that this SSL certificate is on
  */
  app: SniEndpointApp;
 /**
  * certificate provided by this endpoint
  */
  ssl_cert: SslCert;
}
export interface DomainCreatePayload {
 /**
  * full hostname
  *
  * @example "subdomain.example.com"
  */
  readonly hostname: string;
 /**
  * null or unique identifier or name for SNI endpoint
  */
  sni_endpoint: null | string;
}
export interface DomainUpdatePayload {
 /**
  * null or unique identifier or name for SNI endpoint
  */
  sni_endpoint: null | string;
}
/**
 *
 * [Heroku Platform API - dyno-size](https://devcenter.heroku.com/articles/platform-api-reference#dyno-size)
 * Dyno sizes are the values and details of sizes that can be assigned to dynos. This information can also be found at : [https://devcenter.heroku.com/articles/dyno-types](https://devcenter.heroku.com/articles/dyno-types).
 */
export interface DynoSize {
 /**
  * CPU architecture of this dyno
  *
  * @example "arm64"
  */
  readonly architecture: string;
 /**
  * minimum vCPUs, non-dedicated may get more depending on load
  *
  * @example 1
  */
  readonly compute: number;
 /**
  * price information for this dyno size
  */
  readonly cost: null | Record<string, unknown>;
 /**
  * whether this dyno will be dedicated to one user
  */
  readonly dedicated: boolean;
 /**
  * unit of consumption for Heroku Enterprise customers to 2 decimal places
  *
  * @example 0.28
  */
  readonly precise_dyno_units: number;
 /**
  * unique identifier of this dyno size
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * amount of RAM in GB
  *
  * @example 0.5
  */
  readonly memory: number;
 /**
  * the name of this dyno-size
  *
  * @example "eco"
  */
  readonly name: string;
 /**
  * whether this dyno can only be provisioned in a private space
  */
  readonly private_space_only: boolean;
 /**
  * generation for space
  *
  * @example "fir"
  */
  generation: string;
}
/**
 *
 * [Heroku Platform API - dyno](https://devcenter.heroku.com/articles/platform-api-reference#dyno)
 * Dynos encapsulate running processes of an app on Heroku. Detailed information about dyno sizes can be found at: [https://devcenter.heroku.com/articles/dyno-types](https://devcenter.heroku.com/articles/dyno-types).
 */
export interface Dyno {
 /**
  * a URL to stream output from for attached processes or null for non-attached processes
  *
  * @example "rendezvous://rendezvous.runtime.heroku.com:5000/{rendezvous-id}"
  */
  readonly attach_url: string | null;
 /**
  * command used to start this process
  *
  * @example "bash"
  */
  command: string;
 /**
  * when dyno was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of this dyno
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * the name of this process on this dyno
  *
  * @example "run.1"
  */
  readonly name: string;
 /**
  * app release of the dyno
  */
  release: Release;
 /**
  * app formation belongs to
  */
  app: DynoApp;
 /**
  * dyno size
  *
  * @example "standard-1X"
  */
  size: string;
 /**
  * current status of process (either: crashed, down, idle, starting, or up)
  *
  * @example "up"
  */
  readonly state: string;
 /**
  * type of process
  *
  * @example "run"
  */
  type: string;
 /**
  * when process last changed state
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * [Heroku Platform API - release](https://devcenter.heroku.com/articles/platform-api-reference#release)
 * A release represents a combination of code, config vars and add-ons for an app on Heroku.
 */
export interface Release {
 /**
  * add-on plans installed on the app for this release
  */
  addon_plan_names: string[];
 /**
  * build artifacts for the release
  */
  artifacts: Artifact[];
 /**
  * app involved in the release
  */
  app: ReleaseApp;
 /**
  * when release was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * description of changes in this release
  *
  * @example "Added new feature"
  */
  readonly description: string;
 /**
  * unique identifier of release
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * when release was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * OCI image running in this release
  */
  oci_image: OciImage | null;
 /**
  * slug running in this release. Not applicable to apps using Cloud Native Buildpacks.
  */
  slug: Slug | null;
 /**
  * current status of the release
  *
  * @example "succeeded"
  */
  readonly status: 'failed' | 'pending' | 'succeeded';
 /**
  * user that created the release
  */
  user: User;
 /**
  * unique version assigned to the release
  *
  * @example 11
  */
  readonly version: number;
 /**
  * indicates if this release is the current one for the app
  *
  * @example true
  */
  readonly current: boolean;
 /**
  * the URL that the release command output streams to. The stream is available as either `text/plain` or `text/event-stream`. Prepare clients to handle disconnects and to resume the stream by sending a `Range` header for `text/plain` or a `Last-Event-Id` header for `text/event-stream`.
  *
  * @example "https://release-output.heroku.com/streams/01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly output_stream_url: string | null;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app formation belongs to
 */
export interface DynoApp {
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
export interface DynoCreatePayload {
 /**
  * whether to stream output or not
  *
  * @example true
  */
  attach?: boolean;
 /**
  * command used to start this process
  *
  * @example "bash"
  */
  command: string;
 /**
  * custom environment to add to the dyno config vars
  *
  * @example {"COLUMNS":"80","LINES":"24"}
  */
  env?: Record<string, unknown>;
 /**
  * force an attached one-off dyno to not run in a tty
  */
  force_no_tty?: boolean | null;
 /**
  * dyno size
  *
  * @example "standard-1X"
  */
  size?: string;
 /**
  * type of process
  *
  * @example "run"
  */
  type?: string;
 /**
  * seconds until dyno expires, after which it will soon be killed, max 86400 seconds (24 hours)
  *
  * @example 1800
  */
  time_to_live?: number;
}
/**
 *
 * [Heroku Platform API - enterprise-account-daily-usage](https://devcenter.heroku.com/articles/platform-api-reference#enterprise-account-daily-usage)
 * Usage for an enterprise account at a daily resolution.
 */
export interface EnterpriseAccountDailyUsage {
 /**
  * total add-on credits used
  *
  * @example 250
  */
  readonly addons: number;
 /**
  * usage by team
  */
  teams: Array<{
 /**
  * total add-on credits used
  *
  * @example 250
  */
  readonly addons?: number;
 /**
  * app usage in the team
  */
  apps?: AppUsageDaily[];
 /**
  * total add-on credits used for first party add-ons
  *
  * @example 34.89
  */
  readonly data?: number;
 /**
  * dynos used
  *
  * @example 1.548
  */
  readonly dynos?: number;
 /**
  * team identifier
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * name of the team
  *
  * @example "ops"
  */
  readonly name?: string;
 /**
  * total add-on credits used for third party add-ons
  *
  * @example 12.34
  */
  readonly partner?: number;
 /**
  * space credits used
  *
  * @example 1.548
  */
  readonly space?: number;
}>;
 /**
  * total add-on credits used for first party add-ons
  *
  * @example 34.89
  */
  readonly data: number;
 /**
  * date of the usage
  *
  * @example "2019-01-01"
  */
  readonly date: string;
 /**
  * dynos used
  *
  * @example 1.548
  */
  readonly dynos: number;
 /**
  * enterprise account identifier
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * name of the enterprise account
  *
  * @example "example-co"
  */
  readonly name: string;
 /**
  * total add-on credits used for third party add-ons
  *
  * @example 12.34
  */
  readonly partner: number;
 /**
  * space credits used
  *
  * @example 1.548
  */
  readonly space: number;
}
/**
 *
 * Usage for an app at a daily resolution.
 */
export interface AppUsageDaily {
 /**
  * total add-on credits used
  *
  * @example 250
  */
  readonly addons?: number;
 /**
  * unique name of app
  *
  * @example "example"
  */
  app_name?: string;
 /**
  * total add-on credits used for first party add-ons
  *
  * @example 34.89
  */
  readonly data?: number;
 /**
  * dynos used
  *
  * @example 1.548
  */
  readonly dynos?: number;
 /**
  * total add-on credits used for third party add-ons
  *
  * @example 12.34
  */
  readonly partner?: number;
}
export interface EnterpriseAccountDailyUsageInfoPayload {
 /**
  * range start date
  *
  * @example "2019-01-25"
  */
  readonly start: string;
 /**
  * range end date
  *
  * @example "2019-02-25"
  */
  readonly end?: string;
}
/**
 *
 * [Heroku Platform API - enterprise-account-member](https://devcenter.heroku.com/articles/platform-api-reference#enterprise-account-member)
 * Enterprise account members are users with access to an enterprise account.
 */
export interface EnterpriseAccountMember {
 enterprise_account: EnterpriseAccountMemberEnterpriseAccount;
 /**
  * unique identifier of the member
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * enterprise account permissions
  */
  permissions: Array<{
 /**
  *
  * @example "View enterprise account members and teams."
  */
  description?: string;
 /**
  * permission in the enterprise account
  *
  * @example "view"
  */
  readonly name?: 'view' | 'create' | 'manage' | 'billing';
}>;
 /**
  * user information for the membership
  */
  user: User;
 /**
  * whether the Enterprise Account member has two factor authentication enabled
  *
  * @example true
  */
  readonly two_factor_authentication: boolean;
 /**
  * Identity Provider information the member is federated with
  */
  identity_provider: null | EnterpriseAccountMemberIdentityProvider;
}
export interface EnterpriseAccountMemberEnterpriseAccount {
 /**
  * unique identifier of the enterprise account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of the enterprise account
  *
  * @example "example"
  */
  readonly name?: string;
}
/**
 *
 * Identity Provider information the member is federated with
 */
export interface EnterpriseAccountMemberIdentityProvider {
 /**
  * unique identifier of this identity provider
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * name of the identity provider
  *
  * @example "acme"
  */
  readonly name?: string;
 /**
  * whether the identity_provider information is redacted or not
  */
  readonly redacted?: boolean;
 /**
  * entity that owns this identity provider
  */
  owner?: Owner;
}
export interface EnterpriseAccountMemberCreatePayload {
 /**
  * unique email address of account or unique identifier of an account
  */
  user: string;
 /**
  * permissions for enterprise account
  *
  * @example ["view"]
  */
  readonly permissions: 'view' | 'create' | 'manage' | Array<'billing'>;
 /**
  * whether membership is being created as part of SSO JIT
  */
  federated?: boolean;
}
export interface EnterpriseAccountMemberUpdatePayload {
 /**
  * permissions for enterprise account
  *
  * @example ["view"]
  */
  readonly permissions: 'view' | 'create' | 'manage' | Array<'billing'>;
}
/**
 *
 * [Heroku Platform API - enterprise-account-monthly-usage](https://devcenter.heroku.com/articles/platform-api-reference#enterprise-account-monthly-usage)
 * Usage for an enterprise account at a monthly resolution.
 */
export interface EnterpriseAccountMonthlyUsage {
 /**
  * total add-on credits used
  *
  * @example 250
  */
  readonly addons: number;
 /**
  * usage by team
  */
  teams: Array<{
 /**
  * total add-on credits used
  *
  * @example 250
  */
  readonly addons?: number;
 /**
  * app usage in the team
  */
  apps?: AppUsageMonthly[];
 /**
  * max connect rows synced
  *
  * @example 15000
  */
  readonly connect?: number;
 /**
  * total add-on credits used for first party add-ons
  *
  * @example 34.89
  */
  readonly data?: number;
 /**
  * dynos used
  *
  * @example 1.548
  */
  readonly dynos?: number;
 /**
  * team identifier
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * name of the team
  *
  * @example "ops"
  */
  readonly name?: string;
 /**
  * total add-on credits used for third party add-ons
  *
  * @example 12.34
  */
  readonly partner?: number;
 /**
  * space credits used
  *
  * @example 1.548
  */
  readonly space?: number;
}>;
 /**
  * max connect rows synced
  *
  * @example 15000
  */
  readonly connect: number;
 /**
  * total add-on credits used for first party add-ons
  *
  * @example 34.89
  */
  readonly data: number;
 /**
  * dynos used
  *
  * @example 1.548
  */
  readonly dynos: number;
 /**
  * enterprise account identifier
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * year and month of the usage
  *
  * @example "2019-01"
  */
  readonly month: string;
 /**
  * name of the enterprise account
  *
  * @example "example-co"
  */
  readonly name: string;
 /**
  * total add-on credits used for third party add-ons
  *
  * @example 12.34
  */
  readonly partner: number;
 /**
  * space credits used
  *
  * @example 1.548
  */
  readonly space: number;
}
/**
 *
 * Usage for an app at a monthly resolution.
 */
export interface AppUsageMonthly {
 /**
  * total add-on credits used
  *
  * @example 250
  */
  readonly addons?: number;
 /**
  * unique name of app
  *
  * @example "example"
  */
  app_name?: string;
 /**
  * total add-on credits used for first party add-ons
  *
  * @example 34.89
  */
  readonly data?: number;
 /**
  * dynos used
  *
  * @example 1.548
  */
  readonly dynos?: number;
 /**
  * total add-on credits used for third party add-ons
  *
  * @example 12.34
  */
  readonly partner?: number;
}
export interface EnterpriseAccountMonthlyUsageInfoPayload {
 /**
  * range start date
  *
  * @example "2019-01"
  */
  readonly start: string;
 /**
  * range end date
  *
  * @example "2019-02"
  */
  readonly end?: string;
}
/**
 *
 * Identity Provider associated with the Enterprise Account
 */
export interface EnterpriseAccountIdentityProvider {
 /**
  * unique identifier of this identity provider
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * user-friendly unique identifier for this identity provider
  *
  * @example "acme-sso"
  */
  name: string;
 /**
  * entity that owns this identity provider
  */
  owner: Owner;
}
export interface EnterpriseAccountUpdatePayload {
 /**
  * unique name of the enterprise account
  *
  * @example "example"
  */
  readonly name?: string;
}
export interface Filter {
 in?: In;
}
export interface In {
 id?: string[];
}
/**
 *
 * [Heroku Platform API - team-app](https://devcenter.heroku.com/articles/platform-api-reference#team-app)
 * A team app encapsulates the team specific functionality of Heroku apps.
 */
export interface TeamApp {
 /**
  * when app was archived
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly archived_at?: null | string;
 /**
  * name of the image used for the base layers of the OCI image
  *
  * @example "heroku/heroku:22-cnb"
  */
  readonly base_image_name?: null | string;
 /**
  * identity of the stack that will be used for new builds
  */
  build_stack?: BuildStack;
 /**
  * description from buildpack of app
  *
  * @example "Ruby/Rack"
  */
  readonly buildpack_provided_description?: null | string;
 /**
  * buildpacks of the OCI image
  */
  buildpacks?: null | Buildpack[];
 /**
  * current build architecture for the app
  *
  * @example "[arm64]"
  */
  current_build_architecture?: unknown[];
 /**
  * when app was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at?: string;
 /**
  * the generation of the app
  *
  * @example "fir"
  */
  readonly generation?: string;
 /**
  * git repo URL of app
  *
  * @example "https://git.heroku.com/example.git"
  */
  readonly git_url?: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * describes whether a Private Spaces app is externally routable or not
  */
  internal_routing?: boolean | null;
 /**
  * is the current member a collaborator on this app.
  */
  joined?: boolean;
 /**
  * are other team members forbidden from joining this app.
  */
  locked?: boolean;
 /**
  * maintenance status of app
  */
  maintenance?: boolean;
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
 /**
  * team that owns this app
  */
  team?: null | Team;
 /**
  * identity of app owner
  */
  owner?: null | TeamAppOwner;
 /**
  * identity of app region
  */
  region?: TeamAppRegion;
 /**
  * when app was released
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly released_at?: null | string;
 /**
  * git repo size in bytes of app
  */
  readonly repo_size?: number | null;
 /**
  * slug size in bytes of app
  */
  readonly slug_size?: number | null;
 /**
  * identity of space
  */
  space?: null | TeamAppSpace;
 /**
  * identity of app stack
  */
  stack?: Stack;
 /**
  * when app was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at?: string;
 /**
  * web URL of app
  *
  * @example "https://example.herokuapp.com/"
  */
  readonly web_url?: null | string;
}
/**
 *
 * identity of app owner
 */
export interface TeamAppOwner {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email?: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
/**
 *
 * [Heroku Platform API - region](https://devcenter.heroku.com/articles/platform-api-reference#region)
 * identity of app region
 */
export interface TeamAppRegion {
 /**
  * unique identifier of region
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of region
  *
  * @example "us"
  */
  readonly name?: string;
}
/**
 *
 * [Heroku Platform API - space](https://devcenter.heroku.com/articles/platform-api-reference#space)
 * identity of space
 */
export interface TeamAppSpace {
 /**
  * unique identifier of space
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of space
  *
  * @example "nasa"
  */
  name?: string;
}
/**
 *
 * [Heroku Platform API - formation](https://devcenter.heroku.com/articles/platform-api-reference#formation)
 * The formation of processes that should be maintained for an app. Update the formation to scale processes or change dyno sizes. Available process type names and commands are defined by the `process_types` attribute for the [slug](#slug) currently released on an app.
 */
export interface Formation {
 /**
  * app formation belongs to
  */
  app: FormationApp;
 /**
  * command to use to launch this process
  *
  * @example "bundle exec rails server -p $PORT"
  */
  command: string;
 /**
  * when process type was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of this process type
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * number of processes to maintain
  *
  * @example 1
  */
  quantity: number;
 /**
  * dyno size
  *
  * @example "standard-1X"
  */
  size: string;
 /**
  * type of process to maintain
  *
  * @example "web"
  */
  readonly type: string;
 /**
  * when dyno type was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app formation belongs to
 */
export interface FormationApp {
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
export interface FormationBatchUpdatePayload {
 /**
  * Array with formation updates. Each element must have "type", the id or name of the process type to be updated, and can optionally update its "quantity" or "size".
  */
  updates: FormationBatchUpdatePayloadUpdate[];
}
/**
 *
 * Properties to update a process type
 */
export interface FormationBatchUpdatePayloadUpdate {
 /**
  * number of processes to maintain
  *
  * @example 1
  */
  quantity?: number;
 /**
  * dyno size
  *
  * @example "standard-1X"
  */
  size?: string;
 /**
  * type of process to maintain
  *
  * @example "web"
  */
  readonly type: string;
}
export interface FormationUpdatePayload {
 /**
  * number of processes to maintain
  *
  * @example 1
  */
  quantity?: number;
 /**
  * dyno size
  *
  * @example "standard-1X"
  */
  size?: string;
}
export interface IdentityProviderCreateByTeamPayload {
 /**
  * raw contents of the public certificate (eg: .crt or .pem file)
  *
  * @example "-----BEGIN CERTIFICATE----- ..."
  */
  certificate: string;
 /**
  * URL identifier provided by the identity provider
  *
  * @example "https://customer-domain.idp.com"
  */
  entity_id: string;
 /**
  * single log out URL for this identity provider
  *
  * @example "https://example.com/idp/logout"
  */
  slo_target_url?: string;
 /**
  * single sign on URL for this identity provider
  *
  * @example "https://example.com/idp/login"
  */
  sso_target_url: string;
}
export interface IdentityProviderUpdateByTeamPayload {
 /**
  * raw contents of the public certificate (eg: .crt or .pem file)
  *
  * @example "-----BEGIN CERTIFICATE----- ..."
  */
  certificate?: string;
 /**
  * URL identifier provided by the identity provider
  *
  * @example "https://customer-domain.idp.com"
  */
  entity_id?: string;
 /**
  * single log out URL for this identity provider
  *
  * @example "https://example.com/idp/logout"
  */
  slo_target_url?: string;
 /**
  * single sign on URL for this identity provider
  *
  * @example "https://example.com/idp/login"
  */
  sso_target_url?: string;
}
/**
 *
 * [Heroku Platform API - inbound-ruleset](https://devcenter.heroku.com/articles/platform-api-reference#inbound-ruleset)
 * An inbound-ruleset is a collection of rules that specify what hosts can or cannot connect to an application.
 */
export interface InboundRuleset {
 /**
  * unique identifier of an inbound-ruleset
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * identity of space
  */
  space: InboundRulesetSpace;
 /**
  * when inbound-ruleset was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 rules: Rule[];
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  created_by: string;
}
/**
 *
 * [Heroku Platform API - space](https://devcenter.heroku.com/articles/platform-api-reference#space)
 * identity of space
 */
export interface InboundRulesetSpace {
 /**
  * unique identifier of space
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of space
  *
  * @example "nasa"
  */
  name?: string;
}
/**
 *
 * the combination of an IP address in CIDR notation and whether to allow or deny it's traffic.
 */
export interface Rule {
 /**
  * states whether the connection is allowed or denied
  *
  * @example "allow"
  */
  action: 'allow' | 'deny';
 /**
  * is the request’s source in CIDR notation
  *
  * @example "1.1.1.1/1"
  */
  source: string;
}
export interface InboundRulesetCreatePayload {
 rules?: Rule[];
}
/**
 *
 * [Heroku Platform API - invoice-address](https://devcenter.heroku.com/articles/platform-api-reference#invoice-address)
 * An invoice address represents the address that should be listed on an invoice.
 */
export interface InvoiceAddress {
 /**
  * invoice street address line 1
  *
  * @example "40 Hickory Blvd."
  */
  address_1?: string;
 /**
  * invoice street address line 2
  *
  * @example "Suite 300"
  */
  address_2?: string;
 /**
  * invoice city
  *
  * @example "Seattle"
  */
  city?: string;
 /**
  * country
  *
  * @example "US"
  */
  country?: string;
 /**
  * heroku_id identifier reference
  */
  heroku_id?: string;
 /**
  * metadata / additional information to go on invoice
  *
  * @example "Company ABC Inc. VAT 903820"
  */
  other?: string;
 /**
  * invoice zip code
  *
  * @example "98101"
  */
  postal_code?: string;
 /**
  * invoice state
  *
  * @example "WA"
  */
  state?: string;
 /**
  * flag to use the invoice address for an account or not
  *
  * @example true
  */
  use_invoice_address?: boolean;
}
export interface InvoiceAddressUpdatePayload {
 /**
  * invoice street address line 1
  *
  * @example "40 Hickory Blvd."
  */
  address_1?: string;
 /**
  * invoice street address line 2
  *
  * @example "Suite 300"
  */
  address_2?: string;
 /**
  * invoice city
  *
  * @example "Seattle"
  */
  city?: string;
 /**
  * country
  *
  * @example "US"
  */
  country?: string;
 /**
  * metadata / additional information to go on invoice
  *
  * @example "Company ABC Inc. VAT 903820"
  */
  other?: string;
 /**
  * invoice zip code
  *
  * @example "98101"
  */
  postal_code?: string;
 /**
  * invoice state
  *
  * @example "WA"
  */
  state?: string;
 /**
  * flag to use the invoice address for an account or not
  *
  * @example true
  */
  use_invoice_address?: boolean;
}
/**
 *
 * [Heroku Platform API - invoice](https://devcenter.heroku.com/articles/platform-api-reference#invoice)
 * An invoice is an itemized bill of goods for an account which includes pricing and charges.
 */
export interface Invoice {
 /**
  * total charges on this invoice
  *
  * @example 100
  */
  readonly charges_total: number;
 /**
  * when invoice was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * total credits on this invoice
  *
  * @example 100
  */
  readonly credits_total: number;
 /**
  * unique identifier of this invoice
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * human readable invoice number
  *
  * @example 9403943
  */
  readonly number: number;
 /**
  * the ending date that the invoice covers
  *
  * @example "01/31/2014"
  */
  readonly period_end: string;
 /**
  * the starting date that this invoice covers
  *
  * @example "01/01/2014"
  */
  readonly period_start: string;
 /**
  * payment status for this invoice (pending, successful, failed)
  *
  * @example 1
  */
  readonly state: number;
 /**
  * combined total of charges and credits on this invoice
  *
  * @example 100
  */
  readonly total: number;
 /**
  * when invoice was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * [Heroku Platform API - key](https://devcenter.heroku.com/articles/platform-api-reference#key)
 * Keys represent public SSH keys associated with an account and are used to authorize accounts as they are performing git operations.
 */
export interface Key {
 /**
  * comment on the key
  *
  * @example "username@host"
  */
  readonly comment: string;
 /**
  * when key was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * deprecated. Please refer to 'comment' instead
  *
  * @example "username@host"
  */
  readonly email: string;
 /**
  * a unique identifying string based on contents
  *
  * @example "17:63:a4:ba:24:d3:7f:af:17:c8:94:82:7e:80:56:bf"
  */
  readonly fingerprint: string;
 /**
  * unique identifier of this key
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * full public_key as uploaded
  *
  * @example "ssh-rsa AAAAB3NzaC1ycVc/../839Uv username@example.com"
  */
  readonly public_key: string;
 /**
  * when key was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * [Heroku Platform API - log-drain](https://devcenter.heroku.com/articles/platform-api-reference#log-drain)
 * [Log drains](https://devcenter.heroku.com/articles/log-drains) provide a way to forward your Heroku logs to an external syslog server for long-term archiving. This external service must be configured to receive syslog packets from Heroku, whereupon its URL can be added to an app using this API. Some add-ons will add a log drain when they are provisioned to an app. These drains can only be removed by removing the add-on.
 */
export interface LogDrain {
 /**
  * add-on that created the drain
  *
  * @example {"id":"01234567-89ab-cdef-0123-456789abcdef","name":"singing-swiftly-1242","app":{"id":"01234567-89ab-cdef-0123-456789abcdef","name":"example"}}
  */
  readonly addon: Addon | null;
 /**
  * application that is attached to this drain
  *
  * @example {"id":"01234567-89ab-cdef-0123-456789abcdef","name":"example"}
  */
  readonly app: LogDrainApp | null;
 /**
  * when log drain was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of this log drain
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * token associated with the log drain
  *
  * @example "d.01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly token: string;
 /**
  * when log drain was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * url associated with the log drain
  *
  * @example "https://example.com/drain"
  */
  readonly url: string;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * application that is attached to this drain
 */
export interface LogDrainApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of app
  *
  * @example "example"
  */
  name: string;
}
export interface LogDrainCreatePayload {
 /**
  * url associated with the log drain
  *
  * @example "https://example.com/drain"
  */
  readonly url: string;
}
export interface LogDrainUpdatePayload {
 /**
  * url associated with the log drain
  *
  * @example "https://example.com/drain"
  */
  readonly url: string;
}
/**
 *
 * [Heroku Platform API - log-session](https://devcenter.heroku.com/articles/platform-api-reference#log-session)
 * A log session is a reference to the http based log stream for an app.
 */
export interface LogSession {
 /**
  * when log connection was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of this log session
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * URL for log streaming session
  *
  * @example "https://logplex.heroku.com/sessions/01234567-89ab-cdef-0123-456789abcdef?srv=1325419200"
  */
  readonly logplex_url: string;
 /**
  * when log session was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
export interface LogSessionCreatePayload {
 /**
  * dyno to limit results to
  *
  * @example "'web.1' (Cedar-generation) or 'web-1234abcde-123ab' (Fir-generation)"
  */
  dyno?: string;
 /**
  * process type to limit results to (for Fir-generation apps only)
  *
  * @example "web"
  */
  type?: string;
 /**
  * number of log lines to stream at a time (for Cedar-generation apps only)
  *
  * @example 10
  */
  lines?: number;
 /**
  * log source to limit results to
  *
  * @example "app"
  */
  source?: string;
 /**
  * whether to stream ongoing logs
  *
  * @example true
  */
  tail?: boolean;
}
/**
 *
 * [Heroku Platform API - oauth-authorization](https://devcenter.heroku.com/articles/platform-api-reference#oauth-authorization)
 * OAuth authorizations represent clients that a Heroku user has authorized to automate, customize or extend their usage of the platform. For more information please refer to the [Heroku OAuth documentation](https://devcenter.heroku.com/articles/oauth)
 */
export interface OauthAuthorization {
 /**
  * access token for this authorization
  */
  access_token: null | AccessToken;
 /**
  * identifier of the client that obtained this authorization, if any
  */
  client: null | Client;
 /**
  * when OAuth authorization was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * this authorization's grant
  */
  grant: null | Grant;
 /**
  * unique identifier of OAuth authorization
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * refresh token for this authorization
  */
  refresh_token: null | RefreshToken;
 /**
  * The scope of access OAuth authorization allows
  *
  * @example ["global"]
  */
  readonly scope: string[];
 /**
  * when OAuth authorization was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * authenticated user associated with this authorization
  */
  user: OauthAuthorizationUser;
}
/**
 *
 * access token for this authorization
 */
export interface AccessToken {
 /**
  * seconds until OAuth token expires; may be `null` for tokens with indefinite lifetime
  *
  * @example 2592000
  */
  readonly expires_in?: null | number;
 /**
  * unique identifier of OAuth token
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * contents of the token to be used for authorization
  *
  * @example "HRKU-01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly token?: string;
}
/**
 *
 * identifier of the client that obtained this authorization, if any
 */
export interface Client {
 /**
  * unique identifier of this OAuth client
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * OAuth client name
  *
  * @example "example"
  */
  readonly name?: string;
 /**
  * endpoint for redirection after authorization with OAuth client
  *
  * @example "https://example.com/auth/heroku/callback"
  */
  readonly redirect_uri?: string;
}
/**
 *
 * this authorization's grant
 */
export interface Grant {
 /**
  * grant code received from OAuth web application authorization
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly code: string;
 /**
  * seconds until OAuth grant expires
  *
  * @example 2592000
  */
  readonly expires_in: number;
 /**
  * unique identifier of OAuth grant
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * refresh token for this authorization
 */
export interface RefreshToken {
 /**
  * seconds until OAuth token expires; may be `null` for tokens with indefinite lifetime
  *
  * @example 2592000
  */
  readonly expires_in: null | number;
 /**
  * unique identifier of OAuth token
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * contents of the token to be used for authorization
  *
  * @example "HRKU-01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly token: string;
}
/**
 *
 * authenticated user associated with this authorization
 */
export interface OauthAuthorizationUser {
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * full name of the account owner
  *
  * @example "Tina Edmonds"
  */
  full_name: string | null;
}
export interface OauthAuthorizationCreatePayload {
 /**
  * unique identifier of this OAuth client
  */
  client?: string;
 /**
  * human-friendly description of this OAuth authorization
  *
  * @example "sample authorization"
  */
  readonly description?: string;
 /**
  * seconds until OAuth token expires; may be `null` for tokens with indefinite lifetime
  *
  * @example 2592000
  */
  readonly expires_in?: null | number;
 /**
  * The scope of access OAuth authorization allows
  *
  * @example ["global"]
  */
  readonly scope: string[];
}
/**
 *
 * [Heroku Platform API - oauth-client](https://devcenter.heroku.com/articles/platform-api-reference#oauth-client)
 * OAuth clients are applications that Heroku users can authorize to automate, customize or extend their usage of the platform. For more information please refer to the [Heroku OAuth documentation](https://devcenter.heroku.com/articles/oauth).
 */
export interface OauthClient {
 /**
  * when OAuth client was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of this OAuth client
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * whether the client is still operable given a delinquent account
  */
  readonly ignores_delinquent: boolean | null;
 /**
  * OAuth client name
  *
  * @example "example"
  */
  readonly name: string;
 /**
  * endpoint for redirection after authorization with OAuth client
  *
  * @example "https://example.com/auth/heroku/callback"
  */
  readonly redirect_uri: string;
 /**
  * secret used to obtain OAuth authorizations under this client
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly secret: string;
 /**
  * when OAuth client was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
export interface OauthClientCreatePayload {
 /**
  * OAuth client name
  *
  * @example "example"
  */
  readonly name: string;
 /**
  * endpoint for redirection after authorization with OAuth client
  *
  * @example "https://example.com/auth/heroku/callback"
  */
  readonly redirect_uri: string;
}
export interface OauthClientUpdatePayload {
 /**
  * OAuth client name
  *
  * @example "example"
  */
  readonly name?: string;
 /**
  * endpoint for redirection after authorization with OAuth client
  *
  * @example "https://example.com/auth/heroku/callback"
  */
  readonly redirect_uri?: string;
}
/**
 *
 * [Heroku Platform API - oauth-grant](https://devcenter.heroku.com/articles/platform-api-reference#oauth-grant)
 * OAuth grants are used to obtain authorizations on behalf of a user. For more information please refer to the [Heroku OAuth documentation](https://devcenter.heroku.com/articles/oauth)
 */
export interface OauthGrant {

}
/**
 *
 * [Heroku Platform API - oauth-token](https://devcenter.heroku.com/articles/platform-api-reference#oauth-token)
 * OAuth tokens provide access for authorized clients to act on behalf of a Heroku user to automate, customize or extend their usage of the platform. For more information please refer to the [Heroku OAuth documentation](https://devcenter.heroku.com/articles/oauth)
 */
export interface OauthToken {
 /**
  * current access token
  */
  access_token: AccessToken;
 /**
  * authorization for this set of tokens
  */
  authorization: Authorization;
 /**
  * OAuth client secret used to obtain token
  */
  client: null | OauthTokenClient;
 /**
  * when OAuth token was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * grant used on the underlying authorization
  */
  grant: OauthTokenGrant;
 /**
  * unique identifier of OAuth token
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * refresh token for this authorization
  */
  refresh_token: RefreshToken;
 /**
  * OAuth session using this token
  */
  session: Session;
 /**
  * when OAuth token was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * Reference to the user associated with this token
  */
  user: OauthTokenUser;
}
/**
 *
 * authorization for this set of tokens
 */
export interface Authorization {
 /**
  * unique identifier of OAuth authorization
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * OAuth client secret used to obtain token
 */
export interface OauthTokenClient {
 /**
  * secret used to obtain OAuth authorizations under this client
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly secret: string;
}
/**
 *
 * grant used on the underlying authorization
 */
export interface OauthTokenGrant {
 /**
  * grant code received from OAuth web application authorization
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly code: string;
 /**
  * type of grant requested, one of `authorization_code` or `refresh_token`
  *
  * @example "authorization_code"
  */
  type: string;
}
/**
 *
 * OAuth session using this token
 */
export interface Session {
 /**
  * unique identifier of OAuth token
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * Reference to the user associated with this token
 */
export interface OauthTokenUser {
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
export interface OauthTokenCreatePayload {
 client: OauthTokenCreatePayloadClient;
 grant: OauthTokenCreatePayloadGrant;
 refresh_token: OauthTokenCreatePayloadRefreshToken;
}
export interface OauthTokenCreatePayloadClient {
 /**
  * secret used to obtain OAuth authorizations under this client
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly secret?: string;
}
export interface OauthTokenCreatePayloadGrant {
 /**
  * grant code received from OAuth web application authorization
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly code?: string;
 /**
  * type of grant requested, one of `authorization_code` or `refresh_token`
  *
  * @example "authorization_code"
  */
  type?: string;
}
export interface OauthTokenCreatePayloadRefreshToken {
 /**
  * contents of the token to be used for authorization
  *
  * @example "HRKU-01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly token?: string;
}
/**
 *
 * [Heroku Platform API - password-reset](https://devcenter.heroku.com/articles/platform-api-reference#password-reset)
 * A password reset represents a in-process password reset attempt.
 */
export interface PasswordReset {
 /**
  * when password reset was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 user: User;
}
export interface PasswordResetResetPasswordPayload {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
}
export interface PasswordResetCompleteResetPasswordPayload {
 /**
  * current password on the account
  *
  * @example "currentpassword"
  */
  readonly password: string;
 /**
  * confirmation of the new password
  *
  * @example "newpassword"
  */
  readonly password_confirmation: string;
}
/**
 *
 * [Heroku Platform API - peering-info](https://devcenter.heroku.com/articles/platform-api-reference#peering-info)
 * [Peering Info](https://devcenter.heroku.com/articles/private-space-peering) gives you the information necessary to peer an AWS VPC to a Private Space.
 */
export interface PeeringInfo {
 /**
  * The AWS account ID of your Private Space.
  *
  * @example "123456789012"
  */
  readonly aws_account_id: string;
 /**
  * region name used by provider
  *
  * @example "us-east-1"
  */
  readonly aws_region: 'ap-south-1' | 'eu-west-1' | 'ap-southeast-1' | 'ap-southeast-2' | 'eu-central-1' | 'eu-west-2' | 'ap-northeast-2' | 'ap-northeast-1' | 'us-east-1' | 'sa-east-1' | 'us-west-1' | 'us-west-2' | 'ca-central-1';
 /**
  * The AWS VPC ID of the peer.
  *
  * @example "vpc-1234567890"
  */
  readonly vpc_id: string;
 /**
  * An IP address and the number of significant bits that make up the routing or networking portion.
  *
  * @example "10.0.0.0/16"
  */
  vpc_cidr: string;
 /**
  * The CIDR ranges that should be routed to the Private Space VPC.
  */
  dyno_cidr_blocks: string[];
 /**
  * The CIDR ranges that you must not conflict with.
  */
  unavailable_cidr_blocks: string[];
 /**
  * The CIDR ranges that should be routed to the Private Space VPC.
  */
  space_cidr_blocks: string[];
}
/**
 *
 * [Heroku Platform API - peering](https://devcenter.heroku.com/articles/platform-api-reference#peering)
 * [Peering](https://devcenter.heroku.com/articles/private-space-peering) provides a way to peer your Private Space VPC to another AWS VPC.
 */
export interface Peering {
 /**
  * The type of peering connection.
  *
  * @example "heroku-managed"
  */
  type: 'heroku-managed' | 'customer-managed' | 'unknown';
 /**
  * The AWS VPC Peering Connection ID of the peering.
  *
  * @example "pcx-123456789012"
  */
  readonly pcx_id: string;
 /**
  * The CIDR blocks of the peer.
  */
  cidr_blocks: string[];
 /**
  * The status of the peering connection.
  *
  * @example "pending-acceptance"
  */
  readonly status: 'initiating-request' | 'pending-acceptance' | 'provisioning' | 'active' | 'failed' | 'expired' | 'rejected' | 'deleted';
 /**
  * The AWS VPC ID of the peer.
  *
  * @example "vpc-1234567890"
  */
  readonly aws_vpc_id: string;
 /**
  * The AWS region of the peer connection.
  *
  * @example "us-east-1"
  */
  readonly aws_region: string;
 /**
  * The AWS account ID of your Private Space.
  *
  * @example "123456789012"
  */
  readonly aws_account_id: string;
 /**
  * When a peering connection will expire.
  *
  * @example "2020-01-01T12:00:00Z"
  */
  readonly expires: string;
}
/**
 *
 * [Heroku Platform API - permission-entity](https://devcenter.heroku.com/articles/platform-api-reference#permission-entity)
 * An owned entity including users' permissions.
 */
export interface PermissionEntity {
 /**
  * ID of the entity.
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * Name of the entity.
  *
  * @example "polar-lake-12345"
  */
  readonly name: string;
 /**
  * unique identifier of team
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly team_id: string;
 /**
  * The type of object the entity is referring to.
  *
  * @example "app"
  */
  readonly type: 'app' | 'space';
 /**
  * Users that have access to the entity.
  */
  users: Array<{
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email?: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * enterprise account permissions
  */
  permissions?: string[];
}>;
}
/**
 *
 * [Heroku Platform API - pipeline-coupling](https://devcenter.heroku.com/articles/platform-api-reference#pipeline-coupling)
 * Information about an app's coupling to a pipeline
 */
export interface PipelineCoupling {
 /**
  * app involved in the pipeline coupling
  */
  app?: PipelineCouplingApp;
 /**
  * when pipeline coupling was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at?: string;
 /**
  * unique identifier of pipeline coupling
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * pipeline involved in the coupling
  */
  pipeline?: Pipeline;
 /**
  * target pipeline stage
  *
  * @example "production"
  */
  stage?: 'test' | 'review' | 'development' | 'staging' | 'production';
 /**
  * when pipeline coupling was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at?: string;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app involved in the pipeline coupling
 */
export interface PipelineCouplingApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
/**
 *
 * [Heroku Platform API - pipeline](https://devcenter.heroku.com/articles/platform-api-reference#pipeline)
 * A pipeline allows grouping of apps into different stages.
 */
export interface Pipeline {
 /**
  * when pipeline was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at?: string;
 /**
  * unique identifier of pipeline
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * name of pipeline
  *
  * @example "example"
  */
  name?: string;
 /**
  * Owner of a pipeline.
  */
  owner?: PipelineOwner | null;
 /**
  * when pipeline was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at?: string;
}
export interface PipelineCouplingCreatePayload {
 /**
  * unique identifier of app or unique name of app
  */
  app: string;
 /**
  * unique identifier of pipeline
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly pipeline: string;
 /**
  * target pipeline stage
  *
  * @example "production"
  */
  stage: 'test' | 'review' | 'development' | 'staging' | 'production';
}
export interface PipelineCouplingUpdatePayload {
 /**
  * target pipeline stage
  *
  * @example "production"
  */
  stage?: 'test' | 'review' | 'development' | 'staging' | 'production';
}
/**
 *
 * a build artifact for the release
 */
export interface Artifact {
 /**
  * type of artifact
  *
  * @example "oci-image"
  */
  type?: string;
 /**
  * unique identifier of slug or unique identifier of the OCI image
  */
  id?: string;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app involved in the release
 */
export interface ReleaseApp {
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
/**
 *
 * [Heroku Platform API - oci-image](https://devcenter.heroku.com/articles/platform-api-reference#oci-image)
 * An OCI image is a snapshot of your application code that is ready to run on the platform.
 */
export interface OciImage {
 /**
  * unique identifier of the OCI image
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * name of the image used for the base layers of the OCI image
  *
  * @example "heroku/heroku:22-cnb"
  */
  base_image_name: string;
 /**
  * the digest of the top most layer of the base image. Used for rebase seam
  *
  * @example "sha256:ea36ae5fbc1e7230e0a782bf216fb46500e210382703baa6bab8acf2c6a23f78"
  */
  base_top_layer: string;
 /**
  * identification of the code in your version control system (eg: SHA of the git HEAD)
  *
  * @example "60883d9e8947a57e04dc9124f25df004866a2051"
  */
  commit: string;
 /**
  * an optional description of the provided commit
  *
  * @example "fixed a bug with API documentation"
  */
  commit_description: string;
 /**
  * name of the image registry repository used for storage
  *
  * @example "d7ba1ace-b396-4691-968c-37ae53153426/builds"
  */
  image_repo: string;
 /**
  * uniquely identifies the content of the OCI image (consisting of an algorithm portion and an encoded portion)
  *
  * @example "sha256:dc14ae5fbc1e7230e0a782bf216fb46500e210631703bcc6bab8acf2c6a23f42"
  */
  digest: string;
 /**
  * stack associated to the OCI image
  *
  * @example {"id":"ba46bf09-7bd1-42fd-90df-a1a9a93eb4a2","name":"cnb"}
  */
  stack: OciImageStack;
 /**
  * process types of the OCI image
  *
  * @example {"web":{"name":"web","display_cmd":"bundle exec puma -p $PORT","command":"/cnb/process/web","working_dir":"/workspace/webapp","default":true}}
  */
  process_types: Record<string, unknown>;
 /**
  * buildpacks of the OCI image
  */
  buildpacks: Buildpack[];
 /**
  * when the OCI image was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * when the OCI image was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * build architecture for OCI image
  *
  * @example "arm64"
  */
  architecture: string | null;
}
/**
 *
 * [Heroku Platform API - pipeline-promotion-target](https://devcenter.heroku.com/articles/platform-api-reference#pipeline-promotion-target)
 * Promotion targets represent an individual app being promoted to
 */
export interface PipelinePromotionTarget {
 /**
  * the app which was promoted to
  */
  app: PipelinePromotionTargetApp;
 /**
  * an error message for why the promotion failed
  *
  * @example "User does not have access to that app"
  */
  error_message: null | string;
 /**
  * unique identifier of promotion target
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * the promotion which the target belongs to
  */
  pipeline_promotion: PipelinePromotion;
 /**
  * the release which was created on the target app
  */
  release: PipelinePromotionTargetRelease | null;
 /**
  * status of promotion
  *
  * @example "pending"
  */
  readonly status: 'pending' | 'succeeded' | 'failed';
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * the app which was promoted to
 */
export interface PipelinePromotionTargetApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * [Heroku Platform API - pipeline-promotion](https://devcenter.heroku.com/articles/platform-api-reference#pipeline-promotion)
 * Promotions allow you to move code from an app in a pipeline to all targets
 */
export interface PipelinePromotion {
 /**
  * when promotion was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  created_at: string;
 /**
  * unique identifier of promotion
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * the pipeline which the promotion belongs to
  */
  pipeline: Pipeline;
 /**
  * the app being promoted from
  */
  source: Source;
 /**
  * status of promotion
  *
  * @example "pending"
  */
  readonly status: 'pending' | 'completed';
 /**
  * when promotion was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  updated_at: string | null;
}
/**
 *
 * [Heroku Platform API - release](https://devcenter.heroku.com/articles/platform-api-reference#release)
 * the release which was created on the target app
 */
export interface PipelinePromotionTargetRelease {
 /**
  * unique identifier of release
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
/**
 *
 * [Heroku Platform API - source](https://devcenter.heroku.com/articles/platform-api-reference#source)
 * A source is a location for uploading and downloading an application's source code.
 */
export interface Source {
 /**
  * pointer to the URL where clients can fetch or store the source
  */
  source_blob: SourceSourceBlob;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * the app which was promoted from
 */
export interface SourceApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * [Heroku Platform API - release](https://devcenter.heroku.com/articles/platform-api-reference#release)
 * the release used to promoted from
 */
export interface SourceRelease {
 /**
  * unique identifier of release
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
export interface PipelinePromotionCreatePayload {
 /**
  * pipeline involved in the promotion
  */
  pipeline: Pipeline;
 /**
  * the app being promoted from
  */
  source: PipelinePromotionCreatePayloadSource;
 targets: Array<{
 /**
  * the app is being promoted to
  */
  app?: PipelinePromotionCreatePayloadApp;
}>;
}
/**
 *
 * [Heroku Platform API - source](https://devcenter.heroku.com/articles/platform-api-reference#source)
 * the app being promoted from
 */
export interface PipelinePromotionCreatePayloadSource {
 /**
  * the app which was promoted from
  */
  app?: PipelinePromotionCreatePayloadSourceApp;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * the app which was promoted from
 */
export interface PipelinePromotionCreatePayloadSourceApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * the app is being promoted to
 */
export interface PipelinePromotionCreatePayloadApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * [Heroku Platform API - pipeline-stack](https://devcenter.heroku.com/articles/platform-api-reference#pipeline-stack)
 * A pipeline's stack is determined by the apps in the pipeline. This is used during creation of CI and Review Apps that have no stack defined in app.json
 */
export interface PipelineStack {
 /**
  * identity of the stack that will be used for new builds without a stack defined in CI and Review Apps
  */
  stack?: Stack | null;
}
/**
 *
 * [Heroku Platform API - pipeline-transfer](https://devcenter.heroku.com/articles/platform-api-reference#pipeline-transfer)
 * A pipeline transfer is the process of changing pipeline ownership along with the contained apps.
 */
export interface PipelineTransfer {
 /**
  * pipeline being transferred
  */
  pipeline?: Pipeline;
 /**
  * Previous owner of the pipeline.
  */
  previous_owner?: Record<string, unknown>;
 /**
  * New owner of the pipeline.
  */
  new_owner?: Record<string, unknown>;
}
export interface PipelineTransferCreatePayload {
 /**
  * The pipeline to transfer
  */
  pipeline: Pipeline;
 /**
  * New pipeline owner
  */
  new_owner: NewOwner;
}
/**
 *
 * New pipeline owner
 */
export interface NewOwner {
 /**
  * unique identifier of a pipeline owner
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  id?: string;
 /**
  * type of pipeline owner
  *
  * @example "team"
  */
  type?: string;
}
/**
 *
 * Owner of a pipeline.
 */
export interface PipelineOwner {
 /**
  * unique identifier of a pipeline owner
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  id: string;
 /**
  * type of pipeline owner
  *
  * @example "team"
  */
  type: string;
}
export interface PipelineCreatePayload {
 /**
  * name of pipeline
  *
  * @example "example"
  */
  name: string;
 /**
  * Owner of a pipeline.
  */
  owner?: PipelineCreatePayloadOwner | null;
}
/**
 *
 * Owner of a pipeline.
 */
export interface PipelineCreatePayloadOwner {
 /**
  * unique identifier of a pipeline owner
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  id: string;
 /**
  * type of pipeline owner
  *
  * @example "team"
  */
  type: string;
}
export interface PipelineUpdatePayload {
 /**
  * name of pipeline
  *
  * @example "example"
  */
  name?: string;
}
/**
 *
 * [Heroku Platform API - rate-limit](https://devcenter.heroku.com/articles/platform-api-reference#rate-limit)
 * Rate Limit represents the number of request tokens each account holds. Requests to this endpoint do not count towards the rate limit.
 */
export interface RateLimit {
 /**
  * allowed requests remaining in current interval
  *
  * @example 2399
  */
  readonly remaining: number;
}
export interface ReleaseCreatePayload {
 /**
  * description of changes in this release
  *
  * @example "Added new feature"
  */
  readonly description?: string;
 /**
  * unique identifier of the OCI image or uniquely identifies the content of the OCI image (consisting of an algorithm portion and an encoded portion)
  */
  oci_image?: string;
 /**
  * unique identifier of slug
  */
  slug?: string;
}
export interface ReleaseRollbackPayload {
 /**
  * unique identifier of release
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly release: string;
}
/**
 *
 * [Heroku Platform API - review-app](https://devcenter.heroku.com/articles/platform-api-reference#review-app)
 * An ephemeral app to review a set of changes
 */
export interface ReviewApp {
 /**
  * the Heroku app associated to this review app
  */
  app: null | ReviewAppApp;
 /**
  * the app setup for this review app
  */
  app_setup: null | ReviewAppAppSetup;
 /**
  * the branch of the repository which the review app is based on
  */
  readonly branch: string;
 /**
  * when test run was created
  */
  readonly created_at: string;
 /**
  * unique identifier of the review app
  */
  readonly id: string;
 /**
  * the pipeline which this review app belongs to
  */
  pipeline: ReviewAppPipeline;
 /**
  * current state of the review app
  */
  readonly status: 'pending' | 'creating' | 'created' | 'deleting' | 'deleted' | 'errored';
 /**
  * when review app was updated
  */
  readonly updated_at: string;
 /**
  * The user who created the review app
  */
  readonly creator: Record<string, unknown>;
 /**
  * wait for ci before building the app
  *
  * @example true
  */
  readonly wait_for_ci: boolean;
 /**
  * error message from creating the review app if any
  */
  readonly error_status: string | null;
 /**
  * message from creating the review app if any
  */
  readonly message: string | null;
 fork_repo: ForkRepo | null;
 /**
  * pull request number the review app is built for
  *
  * @example 24
  */
  readonly pr_number: number | null;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * the Heroku app associated to this review app
 */
export interface ReviewAppApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
/**
 *
 * the app setup for this review app
 */
export interface ReviewAppAppSetup {
 /**
  * unique identifier of app setup
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
/**
 *
 * [Heroku Platform API - pipeline](https://devcenter.heroku.com/articles/platform-api-reference#pipeline)
 * the pipeline which this review app belongs to
 */
export interface ReviewAppPipeline {
 /**
  * unique identifier of pipeline
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
export interface ForkRepo {
 /**
  * repository id of the fork the branch resides in
  *
  * @example "123456"
  */
  readonly id: number | null;
}
export interface ReviewAppCreatePayload {
 /**
  * the branch of the repository which the review app is based on
  */
  readonly branch: string;
 /**
  * pull request number the review app is built for
  *
  * @example 24
  */
  readonly pr_number?: number | null;
 /**
  * unique identifier of pipeline
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly pipeline: string;
 /**
  * The download location for the review app's source code
  */
  source_blob: ReviewAppCreatePayloadSourceBlob;
 /**
  * hash of config vars
  *
  * @example {"FOO":"bar","BAZ":"qux"}
  */
  environment?: Record<string, unknown> | null;
 /**
  * repository id of the fork the branch resides in
  *
  * @example "123456"
  */
  readonly fork_repo_id?: number | null;
}
/**
 *
 * The download location for the review app's source code
 */
export interface ReviewAppCreatePayloadSourceBlob {
 /**
  * URL where gzipped tar archive of source code for build was downloaded.
  *
  * @example "https://example.com/source.tgz?token=xyz"
  */
  readonly url: string;
 /**
  * The version number (or SHA) of the code to build.
  *
  * @example "v1.2.0"
  */
  version: string | null;
}
/**
 *
 * [Heroku Platform API - review-app-config](https://devcenter.heroku.com/articles/platform-api-reference#review-app-config)
 * Review apps can be configured for pipelines.
 */
export interface ReviewAppConfig {
 repo?: Repo;
 /**
  * enable automatic review apps for pull requests
  *
  * @example true
  */
  readonly automatic_review_apps?: boolean;
 /**
  * the deploy target for the review apps of a pipeline
  */
  deploy_target?: DeployTarget | null;
 /**
  * automatically destroy review apps when they haven't been deployed for a number of days
  *
  * @example true
  */
  readonly destroy_stale_apps?: boolean;
 /**
  * number of days without a deployment after which to consider a review app stale
  *
  * @example "5"
  */
  readonly stale_days?: number;
 /**
  * unique identifier of pipeline
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly pipeline_id?: string;
 /**
  * If true, review apps are created only when CI passes
  *
  * @example true
  */
  readonly wait_for_ci?: boolean;
 /**
  * A unique prefix that will be used to create review app names
  *
  * @example "singular-app"
  */
  readonly base_name?: null | string;
}
export interface Repo {
 /**
  * repository id
  *
  * @example "123456"
  */
  readonly id: number;
}
/**
 *
 * the deploy target for the review apps of a pipeline
 */
export interface DeployTarget {
 /**
  * unique identifier of deploy target
  *
  * @example "us"
  */
  readonly id: string;
 /**
  * type of deploy target
  *
  * @example "region"
  */
  readonly type: string;
}
export interface ReviewAppConfigEnablePayload {
 /**
  * repository name
  *
  * @example "heroku/homebrew-brew"
  */
  readonly repo: string;
 /**
  * enable automatic review apps for pull requests
  *
  * @example true
  */
  readonly automatic_review_apps?: boolean;
 /**
  * automatically destroy review apps when they haven't been deployed for a number of days
  *
  * @example true
  */
  readonly destroy_stale_apps?: boolean;
 /**
  * number of days without a deployment after which to consider a review app stale
  *
  * @example "5"
  */
  readonly stale_days?: number;
 /**
  * the deploy target for the review apps of a pipeline
  */
  deploy_target?: DeployTarget | null;
 /**
  * If true, review apps are created only when CI passes
  *
  * @example true
  */
  readonly wait_for_ci?: boolean;
 /**
  * A unique prefix that will be used to create review app names
  *
  * @example "singular-app"
  */
  readonly base_name?: null | string;
}
export interface ReviewAppConfigUpdatePayload {
 /**
  * enable automatic review apps for pull requests
  *
  * @example true
  */
  readonly automatic_review_apps?: boolean;
 /**
  * automatically destroy review apps when they haven't been deployed for a number of days
  *
  * @example true
  */
  readonly destroy_stale_apps?: boolean;
 /**
  * number of days without a deployment after which to consider a review app stale
  *
  * @example "5"
  */
  readonly stale_days?: number;
 /**
  * the deploy target for the review apps of a pipeline
  */
  deploy_target?: DeployTarget | null;
 /**
  * If true, review apps are created only when CI passes
  *
  * @example true
  */
  readonly wait_for_ci?: boolean;
 /**
  * A unique prefix that will be used to create review app names
  *
  * @example "singular-app"
  */
  readonly base_name?: null | string;
}
/**
 *
 * pointer to the url where clients can fetch or store the actual release binary
 */
export interface Blob {
 /**
  * method to be used to interact with the slug blob
  *
  * @example "GET"
  */
  readonly method: string;
 /**
  * URL to interact with the slug blob
  *
  * @example "https://api.heroku.com/slugs/1234.tgz"
  */
  readonly url: string;
}
export interface SlugCreatePayload {
 /**
  * description from buildpack of slug
  *
  * @example "Ruby/Rack"
  */
  buildpack_provided_description?: null | string;
 /**
  * an optional checksum of the slug for verifying its integrity
  *
  * @example "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  */
  readonly checksum?: null | string;
 /**
  * identification of the code with your version control system (eg: SHA of the git HEAD)
  *
  * @example "60883d9e8947a57e04dc9124f25df004866a2051"
  */
  commit?: null | string;
 /**
  * an optional description of the provided commit
  *
  * @example "fixed a bug with API documentation"
  */
  commit_description?: null | string;
 /**
  * hash mapping process type names to their respective command
  *
  * @example {"web":"./bin/web -p $PORT"}
  */
  process_types: Record<string, unknown>;
 /**
  * unique name of stack or unique identifier of stack
  */
  stack?: string;
}
/**
 *
 * [Heroku Platform API - sms-number](https://devcenter.heroku.com/articles/platform-api-reference#sms-number)
 * SMS numbers are used for recovery on accounts with two-factor authentication enabled.
 */
export interface SmsNumber {
 /**
  * SMS number of account
  *
  * @example "+1 ***-***-1234"
  */
  readonly sms_number: string | null;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * application that this SSL certificate is on
 */
export interface SniEndpointApp {
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of app
  *
  * @example "example"
  */
  name: string;
}
/**
 *
 * certificate provided by this endpoint
 */
export interface SslCert {
 readonly 'ca_signed?'?: boolean;
 readonly cert_domains?: unknown[];
 readonly expires_at?: string;
 readonly issuer?: string;
 readonly 'self_signed?'?: boolean;
 readonly starts_at?: string;
 readonly subject?: string;
 /**
  * unique identifier of this SSL certificate
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
}
export interface SniEndpointCreatePayload {
 /**
  * raw contents of the public certificate chain (eg: .crt or .pem file)
  *
  * @example "-----BEGIN CERTIFICATE----- ..."
  */
  certificate_chain: string;
 /**
  * contents of the private key (eg .key file)
  *
  * @example "-----BEGIN RSA PRIVATE KEY----- ..."
  */
  private_key: string;
}
export interface SniEndpointUpdatePayload {
 /**
  * raw contents of the public certificate chain (eg: .crt or .pem file)
  *
  * @example "-----BEGIN CERTIFICATE----- ..."
  */
  certificate_chain: string;
 /**
  * contents of the private key (eg .key file)
  *
  * @example "-----BEGIN RSA PRIVATE KEY----- ..."
  */
  private_key: string;
}
/**
 *
 * pointer to the URL where clients can fetch or store the source
 */
export interface SourceSourceBlob {
 /**
  * URL to download the source
  *
  * @example "https://api.heroku.com/sources/1234.tgz"
  */
  readonly get_url: string;
 /**
  * URL to upload the source
  *
  * @example "https://api.heroku.com/sources/1234.tgz"
  */
  readonly put_url: string;
}
/**
 *
 * [Heroku Platform API - space-app-access](https://devcenter.heroku.com/articles/platform-api-reference#space-app-access)
 * Space access represents the permissions a particular user has on a particular space.
 */
export interface SpaceAppAccess {
 /**
  * space user belongs to
  */
  space?: SpaceAppAccessSpace;
 /**
  * when space was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at?: string;
 /**
  * unique identifier of space
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * user space permissions
  */
  permissions?: Array<{
 description?: string;
 name?: string;
}>;
 /**
  * when space was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at?: string;
 /**
  * identity of user account
  */
  user?: User;
}
/**
 *
 * [Heroku Platform API - space](https://devcenter.heroku.com/articles/platform-api-reference#space)
 * space user belongs to
 */
export interface SpaceAppAccessSpace {
 /**
  * unique name of app
  *
  * @example "example"
  */
  name: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
export interface SpaceAppAccessUpdatePayload {
 permissions: Array<{
 name?: string;
}>;
}
/**
 *
 * [Heroku Platform API - space-nat](https://devcenter.heroku.com/articles/platform-api-reference#space-nat)
 * Network address translation (NAT) for stable outbound IP addresses from a space
 */
export interface SpaceNat {
 /**
  * when network address translation for a space was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * potential IPs from which outbound network traffic will originate
  */
  readonly sources: string[];
 /**
  * availability of network address translation for a space
  *
  * @example "enabled"
  */
  readonly state: 'disabled' | 'updating' | 'enabled';
 /**
  * when network address translation for a space was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
}
/**
 *
 * [Heroku Platform API - space-topology](https://devcenter.heroku.com/articles/platform-api-reference#space-topology)
 * Space Topology provides you with a mechanism for viewing all the running dynos, formations and applications for a space. This is the same data thats used to power our DNS Service Discovery.
 */
export interface SpaceTopology {
 /**
  * version of the space topology payload
  *
  * @example 1
  */
  readonly version: number;
 /**
  * The apps within this space
  */
  readonly apps: Array<{
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  *
  * @example ["example.com","example.net"]
  */
  readonly domains?: unknown[];
 /**
  * formations for application
  */
  readonly formation?: SpaceTopologyFormation[];
}>;
}
/**
 *
 * formations for application
 */
export interface SpaceTopologyFormation {
 /**
  * unique identifier of this process type
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * Name of process type
  *
  * @example "web"
  */
  process_type?: string;
 /**
  * Current dynos for application
  */
  dynos?: SpaceTopologyDyno[];
}
/**
 *
 * A dyno
 */
export interface SpaceTopologyDyno {
 /**
  * unique identifier of this dyno
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * process number, e.g. 1 in web.1
  *
  * @example 1
  */
  number?: number;
 /**
  * RFC1918 Address of Dyno
  *
  * @example "10.0.134.42"
  */
  private_ip?: string;
 /**
  * localspace hostname of resource
  *
  * @example "1.example-app-90210.app.localspace"
  */
  hostname?: string;
}
export interface SpaceTransferTransferPayload {
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly new_owner: string;
}
/**
 *
 * [Heroku Platform API - team](https://devcenter.heroku.com/articles/platform-api-reference#team)
 * team that owns this space
 */
export interface SpaceTeam {
 /**
  * unique identifier of team
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name?: string;
}
/**
 *
 * [Heroku Platform API - region](https://devcenter.heroku.com/articles/platform-api-reference#region)
 * identity of space region
 */
export interface SpaceRegion {
 /**
  * unique identifier of region
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of region
  *
  * @example "us"
  */
  readonly name: string;
}
export interface SpaceUpdatePayload {
 /**
  * unique name of space
  *
  * @example "nasa"
  */
  name?: string;
}
export interface SpaceCreatePayload {
 /**
  * unique name of space
  *
  * @example "nasa"
  */
  name: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly team: string;
 /**
  * unique identifier of region or unique name of region
  */
  region?: string;
 /**
  * true if this space has shield enabled
  *
  * @example true
  */
  readonly shield?: boolean;
 /**
  * The RFC-1918 CIDR the Private Space will use. It must be a /16 in 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16
  *
  * @example "172.20.20.30/16"
  */
  cidr?: string;
 /**
  * The RFC-1918 CIDR that the Private Space will use for the Heroku-managed peering connection that's automatically created when using Heroku Data add-ons. It must be between a /16 and a /20
  *
  * @example "10.2.0.0/16"
  */
  data_cidr?: string;
 /**
  * URL to which all apps will drain logs. Only settable during space creation and enables direct logging. Must use HTTPS.
  *
  * @example "https://example.com/logs"
  */
  log_drain_url?: string;
 /**
  * channel to create the space on
  *
  * @example "some-channel"
  */
  channel_name?: string;
 /**
  * generation for space
  *
  * @example "fir"
  */
  generation?: string;
}
/**
 *
 * [Heroku Platform API - team-app-collaborator](https://devcenter.heroku.com/articles/platform-api-reference#team-app-collaborator)
 * A team collaborator represents an account that has been given access to a team app on Heroku.
 */
export interface TeamAppCollaborator {
 /**
  * app collaborator belongs to
  */
  app?: TeamAppCollaboratorApp;
 /**
  * when collaborator was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at?: string;
 /**
  * unique identifier of collaborator
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * array of permissions for the collaborator (only applicable if the app is on a team)
  */
  permissions?: TeamAppPermission[];
 /**
  * role in the team
  *
  * @example "admin"
  */
  readonly role?: null | 'admin' | 'collaborator' | 'member' | 'owner' | '';
 /**
  * when collaborator was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at?: string;
 /**
  * identity of collaborated account
  */
  user?: TeamAppCollaboratorUser;
}
/**
 *
 * [Heroku Platform API - app](https://devcenter.heroku.com/articles/platform-api-reference#app)
 * app collaborator belongs to
 */
export interface TeamAppCollaboratorApp {
 /**
  * unique name of app
  *
  * @example "example"
  */
  name: string;
 /**
  * unique identifier of app
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
/**
 *
 * identity of collaborated account
 */
export interface TeamAppCollaboratorUser {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * whether the user is federated and belongs to an Identity Provider
  */
  readonly federated: boolean;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
}
export interface TeamAppCollaboratorCreatePayload {
 /**
  * An array of permissions to give to the collaborator.
  */
  permissions?: string[];
 /**
  * whether to suppress email invitation when creating collaborator
  */
  silent?: boolean;
 /**
  * unique email address of account or unique identifier of an account or Implicit reference to currently authorized user
  */
  user: string;
}
export interface TeamAppCollaboratorUpdatePayload {
 /**
  * An array of permissions to give to the collaborator.
  */
  permissions: string[];
}
export interface TeamAppCreatePayload {
 /**
  * are other team members forbidden from joining this app.
  */
  locked?: boolean;
 /**
  * unique name of app
  *
  * @example "example"
  */
  name?: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly team?: string;
 /**
  * force creation of the app in the user account even if a default team is set.
  */
  personal?: boolean;
 /**
  * unique name of region
  *
  * @example "us"
  */
  readonly region?: string;
 /**
  * unique name of space
  *
  * @example "nasa"
  */
  space?: string;
 /**
  * unique name of stack
  *
  * @example "heroku-18"
  */
  readonly stack?: string;
 /**
  * describes whether a Private Spaces app is externally routable or not
  */
  internal_routing?: boolean | null;
}
export interface TeamAppUpdateLockedPayload {
 /**
  * are other team members forbidden from joining this app.
  */
  locked: boolean;
}
export interface TeamAppTransferToAccountPayload {
 /**
  * unique email address of account or unique identifier of an account or Implicit reference to currently authorized user
  */
  owner: string;
}
export interface TeamAppTransferToTeamPayload {
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly owner: string;
}
/**
 *
 * [Heroku Platform API - team-daily-usage](https://devcenter.heroku.com/articles/platform-api-reference#team-daily-usage)
 * Usage for an enterprise team at a daily resolution.
 */
export interface TeamDailyUsage {
 /**
  * total add-on credits used
  *
  * @example 250
  */
  readonly addons: number;
 /**
  * app usage in the team
  */
  apps: AppUsageDaily[];
 /**
  * total add-on credits used for first party add-ons
  *
  * @example 34.89
  */
  readonly data: number;
 /**
  * date of the usage
  *
  * @example "2019-01-01"
  */
  readonly date: string;
 /**
  * dynos used
  *
  * @example 1.548
  */
  readonly dynos: number;
 /**
  * team identifier
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * name of the team
  *
  * @example "ops"
  */
  readonly name: string;
 /**
  * total add-on credits used for third party add-ons
  *
  * @example 12.34
  */
  readonly partner: number;
 /**
  * space credits used
  *
  * @example 1.548
  */
  readonly space: number;
}
export interface TeamDailyUsageInfoPayload {
 /**
  * range start date
  *
  * @example "2019-01-25"
  */
  readonly start: string;
 /**
  * range end date
  *
  * @example "2019-02-25"
  */
  readonly end?: string;
}
/**
 *
 * [Heroku Platform API - team-delinquency](https://devcenter.heroku.com/articles/platform-api-reference#team-delinquency)
 * A Heroku team becomes delinquent due to non-payment. We [suspend and delete](https://help.heroku.com/EREVRILX/what-happens-if-i-have-unpaid-heroku-invoices) delinquent teams if their invoices remain unpaid.
 */
export interface TeamDelinquency {
 /**
  * scheduled time of when we will suspend your team due to delinquency
  *
  * @example "2024-01-01T12:00:00Z"
  */
  readonly scheduled_suspension_time: string | null;
 /**
  * scheduled time of when we will delete your team due to delinquency
  *
  * @example "2024-01-01T12:00:00Z"
  */
  readonly scheduled_deletion_time: string | null;
}
/**
 *
 * [Heroku Platform API - team-feature](https://devcenter.heroku.com/articles/platform-api-reference#team-feature)
 * A team feature represents a feature enabled on a team account.
 */
export interface TeamFeature {
 /**
  * when team feature was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * description of team feature
  *
  * @example "Causes account to example."
  */
  readonly description: string;
 /**
  * documentation URL of team feature
  *
  * @example "http://devcenter.heroku.com/articles/example"
  */
  readonly doc_url: string;
 /**
  * whether or not team feature has been enabled
  *
  * @example true
  */
  enabled: boolean;
 /**
  * unique identifier of team feature
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of team feature
  *
  * @example "name"
  */
  readonly name: string;
 /**
  * state of team feature
  *
  * @example "public"
  */
  readonly state: string;
 /**
  * when team feature was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * user readable feature name
  *
  * @example "My Feature"
  */
  readonly display_name: string;
 /**
  * e-mail to send feedback about the feature
  *
  * @example "feedback@heroku.com"
  */
  readonly feedback_email: string;
}
/**
 *
 * [Heroku Platform API - team-invitation](https://devcenter.heroku.com/articles/platform-api-reference#team-invitation)
 * A team invitation represents an invite to a team.
 */
export interface TeamInvitation {
 /**
  * when invitation was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of an invitation
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 invited_by: InvitedBy;
 team: TeamInvitationTeam;
 /**
  * role in the team
  *
  * @example "admin"
  */
  readonly role: null | 'admin' | 'collaborator' | 'member' | 'owner' | '';
 /**
  * when invitation was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 user: TeamInvitationUser;
}
export interface InvitedBy {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * full name of the account owner
  *
  * @example "Tina Edmonds"
  */
  name: string | null;
}
export interface TeamInvitationTeam {
 /**
  * unique identifier of team
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name: string;
}
export interface TeamInvitationUser {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * full name of the account owner
  *
  * @example "Tina Edmonds"
  */
  name: string | null;
}
export interface TeamInvitationCreatePayload {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * role in the team
  *
  * @example "admin"
  */
  readonly role: null | 'admin' | 'collaborator' | 'member' | 'owner' | '';
}
/**
 *
 * A team member is an individual with access to a team.
 */
export interface TeamMember {
 /**
  * when the membership record was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * email address of the team member
  *
  * @example "someone@example.org"
  */
  readonly email: string;
 /**
  * whether the user is federated and belongs to an Identity Provider
  */
  readonly federated: boolean;
 /**
  * unique identifier of the team member
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * Identity Provider information the member is federated with
  */
  identity_provider?: null | TeamMemberIdentityProvider;
 /**
  * role in the team
  *
  * @example "admin"
  */
  readonly role?: null | 'admin' | 'collaborator' | 'member' | 'owner' | '';
 /**
  * whether the team member has two factor authentication enabled
  *
  * @example true
  */
  readonly two_factor_authentication?: boolean;
 /**
  * when the membership record was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * user information for the membership
  */
  user?: TeamMemberUser;
}
/**
 *
 * Identity Provider information the member is federated with
 */
export interface TeamMemberIdentityProvider {
 /**
  * unique identifier of this identity provider
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * name of the identity provider
  *
  * @example "acme"
  */
  readonly name?: string;
 /**
  * whether the identity_provider information is redacted or not
  */
  readonly redacted?: boolean;
 /**
  * entity that owns this identity provider
  */
  owner?: Owner;
}
/**
 *
 * user information for the membership
 */
export interface TeamMemberUser {
 /**
  * unique email address of account
  *
  * @example "username@example.com"
  */
  email: string;
 /**
  * unique identifier of an account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * full name of the account owner
  *
  * @example "Tina Edmonds"
  */
  name: string | null;
}
/**
 *
 * [Heroku Platform API - team-invoice](https://devcenter.heroku.com/articles/platform-api-reference#team-invoice)
 * A Team Invoice is an itemized bill of goods for a team which includes pricing and charges.
 */
export interface TeamInvoice {
 /**
  * total add-ons charges in on this invoice
  *
  * @example 25000
  */
  readonly addons_total: number;
 /**
  * total database charges on this invoice
  *
  * @example 25000
  */
  readonly database_total: number;
 /**
  * total charges on this invoice
  */
  readonly charges_total: number;
 /**
  * when invoice was created
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * total credits on this invoice
  *
  * @example 100000
  */
  readonly credits_total: number;
 /**
  * total amount of dyno units consumed across dyno types.
  *
  * @example 1.92
  */
  readonly dyno_units: number;
 /**
  * unique identifier of this invoice
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * human readable invoice number
  *
  * @example 9403943
  */
  readonly number: number;
 /**
  * status of the invoice payment
  *
  * @example "Paid"
  */
  readonly payment_status: string;
 /**
  * the ending date that the invoice covers
  *
  * @example "01/31/2014"
  */
  readonly period_end: string;
 /**
  * the starting date that this invoice covers
  *
  * @example "01/01/2014"
  */
  readonly period_start: string;
 /**
  * total platform charges on this invoice
  *
  * @example 50000
  */
  readonly platform_total: number;
 /**
  * payment status for this invoice (pending, successful, failed)
  *
  * @example 1
  */
  readonly state: number;
 /**
  * combined total of charges and credits on this invoice
  *
  * @example 100000
  */
  readonly total: number;
 /**
  * when invoice was updated
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * The total amount of hours consumed across dyno types.
  *
  * @example 1488
  */
  readonly weighted_dyno_hours: number;
}
export interface TeamMemberCreateOrUpdatePayload {
 /**
  * email address of the team member
  *
  * @example "someone@example.org"
  */
  readonly email: string;
 /**
  * whether the user is federated and belongs to an Identity Provider
  */
  readonly federated?: boolean;
 /**
  * role in the team
  *
  * @example "admin"
  */
  role: 'admin' | 'viewer' | 'member';
}
export interface TeamMemberCreatePayload {
 /**
  * email address of the team member
  *
  * @example "someone@example.org"
  */
  readonly email: string;
 /**
  * whether the user is federated and belongs to an Identity Provider
  */
  readonly federated?: boolean;
 /**
  * role in the team
  *
  * @example "admin"
  */
  role: 'admin' | 'viewer' | 'member';
}
export interface TeamMemberUpdatePayload {
 /**
  * email address of the team member
  *
  * @example "someone@example.org"
  */
  readonly email: string;
 /**
  * whether the user is federated and belongs to an Identity Provider
  */
  readonly federated?: boolean;
 /**
  * role in the team
  *
  * @example "admin"
  */
  role: 'admin' | 'viewer' | 'member';
}
/**
 *
 * [Heroku Platform API - team-monthly-usage](https://devcenter.heroku.com/articles/platform-api-reference#team-monthly-usage)
 * Usage for an enterprise team at a monthly resolution.
 */
export interface TeamMonthlyUsage {
 /**
  * total add-on credits used
  *
  * @example 250
  */
  readonly addons: number;
 /**
  * app usage in the team
  */
  apps: AppUsageMonthly[];
 /**
  * max connect rows synced
  *
  * @example 15000
  */
  readonly connect: number;
 /**
  * total add-on credits used for first party add-ons
  *
  * @example 34.89
  */
  readonly data: number;
 /**
  * dynos used
  *
  * @example 1.548
  */
  readonly dynos: number;
 /**
  * team identifier
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * year and month of the usage
  *
  * @example "2019-01"
  */
  readonly month: string;
 /**
  * name of the team
  *
  * @example "ops"
  */
  readonly name: string;
 /**
  * total add-on credits used for third party add-ons
  *
  * @example 12.34
  */
  readonly partner: number;
 /**
  * space credits used
  *
  * @example 1.548
  */
  readonly space: number;
}
export interface TeamMonthlyUsageInfoPayload {
 /**
  * range start date
  *
  * @example "2019-01"
  */
  readonly start: string;
 /**
  * range end date
  *
  * @example "2019-02"
  */
  readonly end?: string;
}
/**
 *
 * [Heroku Platform API - team-preferences](https://devcenter.heroku.com/articles/platform-api-reference#team-preferences)
 * Tracks a Team's Preferences
 */
export interface TeamPreferences {
 /**
  * The default permission used when adding new members to the team
  *
  * @example "member"
  */
  'default-permission': null | 'admin' | 'member' | 'viewer' | '';
 /**
  * Whether add-on service rules should be applied to add-on installations
  *
  * @example true
  */
  'addons-controls': boolean | null;
}
export interface TeamPreferencesUpdatePayload {
 /**
  * Whether add-on service rules should be applied to add-on installations
  *
  * @example true
  */
  'addons-controls'?: boolean | null;
}
export interface TeamEnterpriseAccount {
 /**
  * unique identifier of the enterprise account
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of the enterprise account
  *
  * @example "example"
  */
  readonly name?: string;
}
/**
 *
 * Identity Provider associated with the Team
 */
export interface TeamIdentityProvider {
 /**
  * unique identifier of this identity provider
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * user-friendly unique identifier for this identity provider
  *
  * @example "acme-sso"
  */
  name: string;
 /**
  * entity that owns this identity provider
  */
  owner: Owner;
}
export interface TeamUpdatePayload {
 /**
  * whether to use this team when none is specified
  *
  * @example true
  */
  default?: boolean;
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name?: string;
}
export interface TeamCreatePayload {
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name: string;
 /**
  * street address line 1
  *
  * @example "40 Hickory Lane"
  */
  address_1?: string;
 /**
  * street address line 2
  *
  * @example "Suite 103"
  */
  address_2?: string | null;
 /**
  * encrypted card number of payment method
  *
  * @example "encrypted-card-number"
  */
  card_number?: string | null;
 /**
  * city
  *
  * @example "San Francisco"
  */
  city?: string;
 /**
  * country
  *
  * @example "US"
  */
  country?: string;
 /**
  * card verification value
  *
  * @example "123"
  */
  cvv?: string | null;
 /**
  * expiration month
  *
  * @example "11"
  */
  expiration_month?: string | null;
 /**
  * expiration year
  *
  * @example "2014"
  */
  expiration_year?: string | null;
 /**
  * the first name for payment method
  *
  * @example "Jason"
  */
  first_name?: string;
 /**
  * the last name for payment method
  *
  * @example "Walker"
  */
  last_name?: string;
 /**
  * metadata
  *
  * @example "Additional information for payment method"
  */
  other?: string | null;
 /**
  * postal code
  *
  * @example "90210"
  */
  postal_code?: string;
 /**
  * state
  *
  * @example "CA"
  */
  state?: string;
 /**
  * Nonce generated by Braintree hosted fields form
  *
  * @example "VGhpcyBpcyBhIGdvb2QgZGF5IHRvIGRpZQ=="
  */
  nonce?: string | null;
 /**
  * Device data string generated by the client
  *
  * @example "VGhpcyBpcyBhIGdvb2QgZGF5IHRvIGRpZQ=="
  */
  device_data?: string | null;
}
export interface TeamCreateInEnterpriseAccountPayload {
 /**
  * unique name of team
  *
  * @example "example"
  */
  readonly name: string;
}
/**
 *
 * [Heroku Platform API - test-case](https://devcenter.heroku.com/articles/platform-api-reference#test-case)
 * A single test case belonging to a test run
 */
export interface TestCase {
 /**
  * unique identifier of a test case
  */
  readonly id: string;
 /**
  * when test case was created
  */
  readonly created_at: string;
 /**
  * when test case was updated
  */
  readonly updated_at: string;
 /**
  * description of the test case
  */
  description: string;
 /**
  * meta information about the test case
  */
  diagnostic: string;
 /**
  * special note about the test case e.g. skipped, todo
  */
  directive: string;
 /**
  * whether the test case was successful
  */
  passed: boolean;
 /**
  * the test number
  */
  number: number;
 /**
  * the test node which executed this test case
  */
  test_node: TestNode;
 /**
  * the test run which owns this test case
  */
  test_run: TestRun;
}
/**
 *
 * [Heroku Platform API - test-node](https://devcenter.heroku.com/articles/platform-api-reference#test-node)
 * A single test node belonging to a test run
 */
export interface TestNode {
 /**
  * when test node was created
  */
  readonly created_at: string;
 /**
  * the dyno which belongs to this test node
  */
  dyno: TestNodeDyno | null;
 /**
  * the status of the test run when the error occurred
  */
  error_status: string | null;
 /**
  * the exit code of the test script
  */
  exit_code: number | null;
 /**
  * unique identifier of a test node
  */
  id: string;
 /**
  * The index of the test node
  */
  index: number;
 /**
  * human friendly message indicating reason for an error
  */
  message: string | null;
 /**
  * the streaming output for the test node
  *
  * @example "https://example.com/output.log"
  */
  output_stream_url: string;
 /**
  * the pipeline which owns this test node
  */
  pipeline: TestNodePipeline;
 /**
  * the streaming test setup output for the test node
  *
  * @example "https://example.com/test-setup.log"
  */
  setup_stream_url: string;
 /**
  * current state of the test run
  */
  readonly status: 'pending' | 'cancelled' | 'creating' | 'building' | 'running' | 'succeeded' | 'failed' | 'errored' | 'debugging';
 /**
  * when test node was updated
  */
  readonly updated_at: string;
 /**
  * the test run which owns this test node
  */
  test_run: TestRun;
}
/**
 *
 * [Heroku Platform API - test-run](https://devcenter.heroku.com/articles/platform-api-reference#test-run)
 * An execution or trial of one or more tests
 */
export interface TestRun {
 /**
  * the email of the actor triggering the test run
  */
  actor_email: string;
 /**
  * whether the test was run with an empty cache
  */
  clear_cache: boolean | null;
 /**
  * the branch of the repository that the test run concerns
  */
  commit_branch: string;
 /**
  * the message for the commit under test
  */
  commit_message: string;
 /**
  * the SHA hash of the commit under test
  */
  commit_sha: string;
 /**
  * whether the test run was started for interactive debugging
  */
  debug: boolean;
 /**
  * the app setup for the test run
  */
  app_setup: null | Record<string, unknown>;
 /**
  * when test run was created
  */
  readonly created_at: string;
 /**
  * the type of dynos used for this test-run
  */
  dyno: null | TestRunDyno;
 /**
  * unique identifier of a test run
  */
  readonly id: string;
 /**
  * human friendly message indicating reason for an error
  */
  message: string | null;
 /**
  * the auto incrementing test run number
  */
  number: number;
 /**
  * the team that owns this test-run
  */
  organization: null | Organization;
 /**
  * the pipeline which owns this test-run
  */
  pipeline: TestRunPipeline;
 /**
  * current state of the test run
  */
  readonly status: 'pending' | 'cancelled' | 'creating' | 'building' | 'running' | 'succeeded' | 'failed' | 'errored' | 'debugging';
 /**
  * The download location for the source code to be tested
  */
  source_blob_url: string;
 /**
  * when test-run was updated
  */
  readonly updated_at: string;
 /**
  * An account represents an individual signed up to use the Heroku platform.
  */
  user: Account;
 /**
  * human friendly warning emitted during the test run
  */
  warning_message: string | null;
}
/**
 *
 * [Heroku Platform API - dyno](https://devcenter.heroku.com/articles/platform-api-reference#dyno)
 * the dyno which belongs to this test node
 */
export interface TestNodeDyno {
 /**
  * unique identifier of this dyno or the name of this process on this dyno
  */
  id?: string;
 /**
  * a URL to stream output from for debug runs or null for non-debug runs
  *
  * @example "rendezvous://rendezvous.runtime.heroku.com:5000/{rendezvous-id}"
  */
  readonly attach_url?: string | null;
}
/**
 *
 * [Heroku Platform API - pipeline](https://devcenter.heroku.com/articles/platform-api-reference#pipeline)
 * the pipeline which owns this test node
 */
export interface TestNodePipeline {
 /**
  * unique identifier of pipeline or name of pipeline
  */
  id?: string;
}
/**
 *
 * [Heroku Platform API - dyno](https://devcenter.heroku.com/articles/platform-api-reference#dyno)
 * the type of dynos used for this test-run
 */
export interface TestRunDyno {
 /**
  * dyno size
  *
  * @example "standard-1X"
  */
  size?: string;
}
/**
 *
 * [Heroku Platform API - pipeline](https://devcenter.heroku.com/articles/platform-api-reference#pipeline)
 * the pipeline which owns this test-run
 */
export interface TestRunPipeline {
 /**
  * unique identifier of pipeline or name of pipeline
  */
  id?: string;
}
export interface TestRunCreatePayload {
 /**
  * the branch of the repository that the test run concerns
  */
  commit_branch: string;
 /**
  * the message for the commit under test
  */
  commit_message: string;
 /**
  * the SHA hash of the commit under test
  */
  commit_sha: string;
 /**
  * whether the test run was started for interactive debugging
  */
  debug?: boolean;
 /**
  * unique name of team or unique identifier of team
  */
  organization?: string;
 /**
  * unique identifier of pipeline or name of pipeline
  */
  pipeline: string;
 /**
  * The download location for the source code to be tested
  */
  source_blob_url: string;
}
export interface TestRunUpdatePayload {
 /**
  * current state of the test run
  */
  readonly status: 'pending' | 'cancelled' | 'creating' | 'building' | 'running' | 'succeeded' | 'failed' | 'errored' | 'debugging';
 /**
  * human friendly message indicating reason for an error
  */
  message: string | null;
}
/**
 *
 * [Heroku Platform API - user-preferences](https://devcenter.heroku.com/articles/platform-api-reference#user-preferences)
 * Tracks a user's preferences and message dismissals
 */
export interface UserPreferences {
 /**
  * User's default timezone
  *
  * @example "UTC"
  */
  timezone: string | null;
 /**
  * User's default team
  *
  * @example "sushi-inc"
  */
  'default-organization': string | null;
 /**
  * Whether the user has dismissed the GitHub link banner
  *
  * @example true
  */
  'dismissed-github-banner': boolean | null;
 /**
  * Whether the user has dismissed the getting started banner
  *
  * @example true
  */
  'dismissed-getting-started': boolean | null;
 /**
  * Whether the user has dismissed the Organization Access Controls banner
  *
  * @example true
  */
  'dismissed-org-access-controls': boolean | null;
 /**
  * Whether the user has dismissed the Organization Wizard
  *
  * @example true
  */
  'dismissed-org-wizard-notification': boolean | null;
 /**
  * Whether the user has dismissed the Pipelines banner
  *
  * @example true
  */
  'dismissed-pipelines-banner': boolean | null;
 /**
  * Whether the user has dismissed the GitHub banner on a pipeline overview
  *
  * @example true
  */
  'dismissed-pipelines-github-banner': boolean | null;
 /**
  * Which pipeline uuids the user has dismissed the GitHub banner for
  *
  * @example ["96c68759-f310-4910-9867-e0b062064098"]
  */
  'dismissed-pipelines-github-banners': null | string[];
 /**
  * Whether the user has dismissed the 2FA SMS banner
  *
  * @example true
  */
  'dismissed-sms-banner': boolean | null;
}
export interface UserPreferencesUpdatePayload {
 /**
  * User's default timezone
  *
  * @example "UTC"
  */
  timezone?: string | null;
 /**
  * User's default team
  *
  * @example "sushi-inc"
  */
  'default-organization'?: string | null;
 /**
  * Whether the user has dismissed the GitHub link banner
  *
  * @example true
  */
  'dismissed-github-banner'?: boolean | null;
 /**
  * Whether the user has dismissed the getting started banner
  *
  * @example true
  */
  'dismissed-getting-started'?: boolean | null;
 /**
  * Whether the user has dismissed the Organization Access Controls banner
  *
  * @example true
  */
  'dismissed-org-access-controls'?: boolean | null;
 /**
  * Whether the user has dismissed the Organization Wizard
  *
  * @example true
  */
  'dismissed-org-wizard-notification'?: boolean | null;
 /**
  * Whether the user has dismissed the Pipelines banner
  *
  * @example true
  */
  'dismissed-pipelines-banner'?: boolean | null;
 /**
  * Whether the user has dismissed the GitHub banner on a pipeline overview
  *
  * @example true
  */
  'dismissed-pipelines-github-banner'?: boolean | null;
 /**
  * Which pipeline uuids the user has dismissed the GitHub banner for
  *
  * @example ["96c68759-f310-4910-9867-e0b062064098"]
  */
  'dismissed-pipelines-github-banners'?: null | string[];
 /**
  * Whether the user has dismissed the 2FA SMS banner
  *
  * @example true
  */
  'dismissed-sms-banner'?: boolean | null;
}
/**
 *
 * [Heroku Platform API - vpn-connection](https://devcenter.heroku.com/articles/platform-api-reference#vpn-connection)
 * [VPN](https://devcenter.heroku.com/articles/private-space-vpn-connection) provides a way to connect your Private Spaces to your network via VPN.
 */
export interface VpnConnection {
 /**
  * VPN ID
  *
  * @example "123456789012"
  */
  readonly id: string;
 /**
  * VPN Name
  *
  * @example "office"
  */
  name: string;
 /**
  * Public IP of VPN customer gateway
  *
  * @example "35.161.69.30"
  */
  public_ip: string;
 /**
  * Routable CIDRs of VPN
  */
  routable_cidrs: string[];
 /**
  * CIDR Block of the Private Space
  *
  * @example "10.0.0.0/16"
  */
  readonly space_cidr_block: string;
 tunnels: Tunnel[];
 /**
  * IKE Version
  *
  * @example 1
  */
  readonly ike_version: number;
 /**
  * Status of the VPN
  *
  * @example "active"
  */
  readonly status: 'pending' | 'provisioning' | 'active' | 'deprovisioning' | 'failed';
 /**
  * Details of the status
  *
  * @example "supplied CIDR block already in use"
  */
  readonly status_message: string;
}
/**
 *
 * Tunnel info
 */
export interface Tunnel {
 /**
  * Timestamp of last status changed
  *
  * @example "2016-10-25T22:09:05Z"
  */
  last_status_change?: string;
 /**
  * Public IP address for the tunnel
  *
  * @example "52.44.146.197"
  */
  ip?: string;
 /**
  * Public IP address for the customer side of the tunnel
  *
  * @example "52.44.146.197"
  */
  customer_ip?: string;
 /**
  * Pre-shared key
  *
  * @example "secret"
  */
  pre_shared_key?: string;
 /**
  * Status of the tunnel
  *
  * @example "UP"
  */
  status?: 'UP' | 'DOWN';
 /**
  * Details of the status
  *
  * @example "status message"
  */
  status_message?: string;
}
export interface VpnConnectionCreatePayload {
 /**
  * VPN Name
  *
  * @example "office"
  */
  name: string;
 /**
  * Public IP of VPN customer gateway
  *
  * @example "35.161.69.30"
  */
  public_ip: string;
 /**
  * Routable CIDRs of VPN
  */
  routable_cidrs: string[];
}
export interface VpnConnectionUpdatePayload {
 /**
  * Routable CIDRs of VPN
  */
  routable_cidrs: string[];
}
/**
 *
 * [Heroku Platform API - generation](https://devcenter.heroku.com/articles/platform-api-reference#generation)
 * Generations are the different application execution environments available in the Heroku platform.
 */
export interface Generation {
 /**
  * when generation was introduced
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly created_at: string;
 /**
  * unique identifier of generation
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id: string;
 /**
  * unique name of generation
  *
  * @example "fir"
  */
  readonly name: string;
 /**
  * when generation was last modified
  *
  * @example "2012-01-01T12:00:00Z"
  */
  readonly updated_at: string;
 /**
  * features unsupported by this generation
  */
  unsupported_features: string[] | null;
}
/**
 *
 * [Heroku Platform API - stack](https://devcenter.heroku.com/articles/platform-api-reference#stack)
 * stack associated to the OCI image
 */
export interface OciImageStack {
 /**
  * unique identifier of stack
  *
  * @example "01234567-89ab-cdef-0123-456789abcdef"
  */
  readonly id?: string;
 /**
  * unique name of stack
  *
  * @example "heroku-18"
  */
  readonly name?: string;
}
export interface OciImageCreatePayload {
 /**
  * build architecture for OCI image
  *
  * @example "arm64"
  */
  architecture?: string | null;
 /**
  * name of the image used for the base layers of the OCI image
  *
  * @example "heroku/heroku:22-cnb"
  */
  base_image_name?: string;
 /**
  * the digest of the top most layer of the base image. Used for rebase seam
  *
  * @example "sha256:ea36ae5fbc1e7230e0a782bf216fb46500e210382703baa6bab8acf2c6a23f78"
  */
  base_top_layer?: string;
 /**
  * identification of the code in your version control system (eg: SHA of the git HEAD)
  *
  * @example "60883d9e8947a57e04dc9124f25df004866a2051"
  */
  commit?: string;
 /**
  * an optional description of the provided commit
  *
  * @example "fixed a bug with API documentation"
  */
  commit_description?: string;
 /**
  * name of the image registry repository used for storage
  *
  * @example "d7ba1ace-b396-4691-968c-37ae53153426/builds"
  */
  image_repo?: string;
 /**
  * uniquely identifies the content of the OCI image (consisting of an algorithm portion and an encoded portion)
  *
  * @example "sha256:dc14ae5fbc1e7230e0a782bf216fb46500e210631703bcc6bab8acf2c6a23f42"
  */
  digest?: string;
 /**
  * unique name of stack or unique identifier of stack
  */
  stack?: string;
 /**
  * process types of the OCI image
  *
  * @example {"web":{"name":"web","display_cmd":"bundle exec puma -p $PORT","command":"/cnb/process/web","working_dir":"/workspace/webapp","default":true}}
  */
  process_types?: Record<string, unknown>;
 /**
  * buildpacks of the OCI image
  */
  buildpacks?: Buildpack[];
}
