function sanitizeUser(user, options = {}) {
  const { isOwner = false, isAdmin = false } = options;

  const base = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.Role?.name || "user",
    createdAt: user.createdAt,
  };

  if (isOwner || isAdmin) {
    return {
      ...base,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
    };
  }

  return base;
}

module.exports = sanitizeUser;
