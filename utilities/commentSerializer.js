/**
 * Formats a raw comment into the structure needed for API responses.
 * @param {object | null} commentJSON - The comment object (result of comment.toJSON()), or null.
 * @returns {object | null} - The formatted comment object for the API, or null if input was null.
 */
function serializeComment(commentJSON) {
  if (!commentJSON) {
    return null;
  }

  const { id, message, projectId, parentId, userId, isDeleted, createdAt, updatedAt, User, replies } = commentJSON;

  let displayUser = null;

  if (isDeleted) {
    displayUser = { username: "[deleted]", id: null, avatarUrl: null }; //[deleted] = placeholder - FE decides display
  } else if (User) {
    displayUser = {
      id: User.id,
      username: User.username,
      avatarUrl: User.avatarUrl,
    };
  } else {
    console.warn(`Serializer: Missing User data for comment ${id} (userId: ${userId}). Returning null.`);
    displayUser = null;
  }

  const isEdited = !isDeleted && createdAt?.getTime() !== updatedAt?.getTime();

  const processedReplies = (replies ?? []).map((reply) => serializeComment(reply));

  return {
    id: id,
    message: message,
    User: displayUser,
    projectId: projectId,
    parentId: parentId,
    createdAt: createdAt,
    updatedAt: updatedAt,
    edited: isEdited,
    replies: processedReplies,
  };
}

module.exports = serializeComment;
