export const normalizeAdminType = (user) => {
  if (user?.role !== 'admin') {
    return null;
  }

  if (user?.adminType) {
    return user.adminType;
  }

  const defaultAdminEmail = (process.env.ADMIN_EMAIL || 'admin@hospital.com').toLowerCase();
  if ((user.email || '').toLowerCase() === defaultAdminEmail) {
    return 'super_admin';
  }

  return 'admin';
};
