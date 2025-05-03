/**
 *
 * @param {Object} service - The service object that contains the method to get the entity by ID
 * @yields {Function} - Calls next() if the user owns the entity, otherwise sends a 403 or 404 response
 * @description Middleware to check if the user owns the entity
 * @note This middleware assumes that the request object contains a user object with an id property
 */
const ownsEntity = (service) => async (req, res, next) => {
  const { id } = req.params;
  const entity = await service.getOneId(id);
  if (!entity) {
    return res.status(404).json({
      status: "not found",
      statusCode: 404,
      data: { result: "Entity not found" },
    });
  }
  if (entity.userId !== req.user.id) {
    return res.status(403).json({
      status: "forbidden",
      statusCode: 403,
      data: { result: "Forbidden, you don't own this entity" },
    });
  }
  next();
};

module.exports = ownsEntity;
