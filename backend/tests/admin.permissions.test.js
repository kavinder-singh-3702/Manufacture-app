const {
  ADMIN_PERMISSIONS,
  assertAdminPermission,
  validateMutationContext,
} = require('../src/modules/admin/permissions');
const { roleSatisfies } = require('../src/utils/roles');

describe('Admin permissions and role hierarchy', () => {
  test('super-admin satisfies admin role checks', () => {
    expect(roleSatisfies('super-admin', ['admin'])).toBe(true);
    expect(roleSatisfies('admin', ['super-admin'])).toBe(false);
  });

  test('admin can read overview but cannot hard delete companies', () => {
    expect(() =>
      assertAdminPermission({ role: 'admin' }, ADMIN_PERMISSIONS.READ_OVERVIEW)
    ).not.toThrow();

    expect(() =>
      assertAdminPermission({ role: 'admin' }, ADMIN_PERMISSIONS.HARD_DELETE_COMPANY)
    ).toThrow('You are not allowed to perform this admin action');
  });

  test('admin can mutate service workflow but cannot mutate service content directly', () => {
    expect(() =>
      assertAdminPermission({ role: 'admin' }, ADMIN_PERMISSIONS.MUTATE_SERVICE_REQUEST_WORKFLOW)
    ).not.toThrow();

    expect(() =>
      assertAdminPermission({ role: 'admin' }, ADMIN_PERMISSIONS.MUTATE_SERVICE_REQUEST_CONTENT)
    ).toThrow('You are not allowed to perform this admin action');
  });

  test('super-admin can perform hard delete permission checks', () => {
    expect(() =>
      assertAdminPermission({ role: 'super-admin' }, ADMIN_PERMISSIONS.HARD_DELETE_COMPANY)
    ).not.toThrow();
  });

  test('admin mutations require explicit contextCompanyId', () => {
    expect(() =>
      validateMutationContext({
        actorRole: 'admin',
        targetCompanyId: '507f1f77bcf86cd799439011',
      })
    ).toThrow('contextCompanyId is required for admin mutations');
  });

  test('admin mutation context must match target company', () => {
    expect(() =>
      validateMutationContext({
        actorRole: 'admin',
        contextCompanyId: '507f1f77bcf86cd799439011',
        targetCompanyId: '507f1f77bcf86cd799439012',
      })
    ).toThrow('contextCompanyId must match the target company');
  });

  test('super-admin may omit context but cannot send mismatched context', () => {
    expect(() =>
      validateMutationContext({
        actorRole: 'super-admin',
        targetCompanyId: '507f1f77bcf86cd799439011',
      })
    ).not.toThrow();

    expect(() =>
      validateMutationContext({
        actorRole: 'super-admin',
        contextCompanyId: '507f1f77bcf86cd799439011',
        targetCompanyId: '507f1f77bcf86cd799439012',
      })
    ).toThrow('contextCompanyId must match the target company');
  });
});
