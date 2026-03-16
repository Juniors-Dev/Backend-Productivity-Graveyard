function sanitizeUser(user, options = {}) {
  const { isOwner = false, isAdmin = false, includeId = false } = options;

  const base = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.Role?.name || "user",
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };

  if (includeId) {
    // QUESTION: this is not needed as base now has user.id. Permission to remove? (unless we change base again?)
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
