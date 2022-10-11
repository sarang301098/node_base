export enum Token {
  FORGETPASSWORD = 'forget_password_token',
  ACCESS = 'access_token',
  REFRESH = 'refresh_token',
}

export enum Media {
  USER = 'user',
  COMPANY = 'company',
  APK = 'APK',
  FACTORY = 'factory',
}

/**
 * Propane User types
 *
 * This enum define all user type available in the system.
 *
 * Super admin - Propane user - All access (*)
 * Admin - partner of the super_admin - All access provided by super_admin
 * Vendor - All access of the vendor app.
 * Driver - All sccess of the driver app.
 * User - All access of the user app
 * Sub admin - Al access provided by the admin / super_admin.
 */
export enum PropaneUserType {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  VENDOR = 'vendor',
  DRIVER = 'driver',
  USER = 'user',
  SUB_ADMIN = 'sub_admin',
}

export enum PaymentGateways {
  STRIPE = 'stripe',
}

/**
 * Propane Device Types
 * A = For the Android users
 * I = For the ios users
 */
export enum DeviceTypes {
  A = 'android',
  I = 'ios',
}

/**
 * Permission Type
 * Supervisor - read/create/update
 * manager - create/update
 * worker - read
 */

// export enum PermissionType {
//   Supervisor = 'supervisor',
//   Manager = 'manager',
//   Worker = 'worker',
// }

/**
 * Permission Types (NEW)
 */
export enum PermissionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

/**
 * Actions
 */
export enum Actions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

export enum CkmStatus {
  ON = 'on',
  OFF = 'off',
  STOP = 'stop',
  RUNNING = 'running',
}

export enum NotificationType {
  AC = 'allCustomers',
  AD = 'allDrivers',
  AV = 'allVendors',
  SC = 'selectedCustomers',
  SV = 'selectedVendors',
  SD = 'selectedDrivers',
}

// as assumptions.
export enum StatusType {
  ON = 0,
  OFF = 1,
  STOP = 2,
  RUNNING = 3,
}

export enum LightType {
  IR = 'IR',
  UV = 'UV',
  VIS = 'VIS',
}

export enum LightPosition {
  TOP = 'TOP',
  FRONT = 'FRONT',
  BACK = 'BACK',
}

export enum CameraBarView {
  FRONT = 'FRONT',
  BACK = 'BACK',
}

// label value for no defects
export const NO_DEFECT = 'NoDefect';
export const EDGES = ['Edge', 'Right', 'Left'];
export const DEFECT_LABEL = 'Defect';

// stop motive type
export const DEFECT = 'defect';

// invalid status type
export const INVALID_STATUS_TYPE = 'INVALID';

// cache time
export const cacheTime = {
  DEFECTS: 1000 * 60 * 10,
  DEFECTS_PER_SHIFT: 1000 * 60 * 10,
  DEFECTS_BY_TYPE: 1000 * 60 * 10,
  DEFECTIVE_ROLLS_COUNT: 1000 * 60 * 10,
  INDIVIDUAL_MACHINE_STATUS: 1000 * 60 * 10,
  PRODUCTION_ROTATIONS: 1000 * 60 * 10,
  DASHBOARD_STATISTIC: 1,
};

export type AddMongoDocType<T, U> = T & { mongoDoc?: U };

export enum StopParameter {
  ROLL = 'roll',
  CONTEXTUAL = 'contextual',
}

export enum operators {
  eq = '=',
  ne = '!=',
  lt = '<',
  le = '<=',
  gt = '>',
  ge = '>=',
}
export enum TemplateLanguage {
  EN = 'english',
  PT = 'portuguese',
  IT = 'italian',
  TR = 'turkish',
}

export const DefaultTimezoneForSavingsReport = 'Etc/GMT';

export const MaxMachinesForXavier = 5;

export const DefaultEquipmentId = 4006;

// In minutes
export const minStopDuration = 15;

// Vertical Field Of View = 0.22 meters
export const vfov = 0.22;

export enum TimeFormat {
  '12H' = '12h',
  '24H' = '24h',
}

export enum NotificationActions {
  READ = 'read',
  UN_READ = 'un_read',
}

export const PropaneBaseRoutes = [
  '/dashboard',
  '/governmentHolidays',
  '/deliverylocations',
  '/membershipPlans',
  '/emailtemplates',
  '/vendorProducts',
  '/notifications',
  '/cylinderSize',
  '/appsettings',
  '/accessories',
  '/testPayment',
  '/driverOrder',
  '/manageStock',
  '/promocodes',
  '/categories',
  '/timeslots',
  '/customers',
  '/subAdmins',
  '/usercards',
  '/cmspages',
  '/products',
  '/earnings',
  '/reports',
  '/zipcodes',
  '/counties',
  '/vendors',
  '/ratings',
  '/modules',
  '/drivers',
  '/states',
  '/orders',
  '/users',
  '/mocky',
  '/roles',
  '/cart',
  '/auth',
  '/faqs',
  '/faq',
  '/map',
];

export enum ApiMethods {
  GET = 'GET',
  PUT = 'PUT',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * moduleId -> Array<baseRoutes>
 */
export const MapPropaneBaseRoutes = {
  1: ['/dashboard'],
  3: ['/orders'],
  4: ['/orders'],
  5: ['/orders'],
  6: ['/map'],
  7: ['customers'],
  8: ['/vendors'],
  10: ['/drivers'],
  11: ['/drivers'],
  12: ['/drivers'],
  14: ['/products'],
  15: ['/accessories'],
  16: ['/cylinderSize'],
  17: ['/states', '/counties', '/zipcodes'],
  18: ['/deliverylocations'],
  19: ['/promocodes'],
  20: ['/reports'],
  21: ['/earnings'],
  22: ['/users'],
  23: ['/timeslots'],
  24: ['/governmentHolidays'],
  25: ['/transactions'],
  26: ['/customers'],
  27: ['/membershipPlans'],
  28: ['/emailtemplates'],
  29: ['/roles'],
  30: ['/subAdmins'],
  31: ['/notifications'],
  32: ['/appsettings'],
  33: ['/cmspages'],
};

export enum OrderStatus {
  ONGOING = 'ongoing',
  PENDING = 'pending',
  REFILLED = 'refilled',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  CANCELLED_BY_ADMIN = 'cancelled_by_admin',
  CANCELLED_BY_DRIVER = 'cancelled_by_driver',
  EMERGENCY_ORDER = 'emergency_order',
}
