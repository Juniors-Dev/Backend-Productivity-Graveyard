function sanitizeUser(user, options = {}) {
  const { isOwner = false, isAdmin = false, includeId = false } = options;

  const base = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.Role?.name || "user",
  };

  if (includeId) {
    base.id = user.id;
  }

  if (isOwner || isAdmin) {
    return {
      ...base,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  return base;
}

module.exports = sanitizeUser;
