export const Role = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const TenantStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  ERROR: 'ERROR',
} as const;

export type TenantStatus = typeof TenantStatus[keyof typeof TenantStatus];

export const TenantEventType = {
  PROVISION_REQUESTED: 'PROVISION_REQUESTED',
  STACK_CREATED: 'STACK_CREATED',
  ERROR: 'ERROR',
} as const;

export type TenantEventType = typeof TenantEventType[keyof typeof TenantEventType];
