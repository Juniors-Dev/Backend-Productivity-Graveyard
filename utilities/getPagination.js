function getLimitOffset(req) {
  const queryLimit = req.query.limit || 100;
  const queryOffset = req.query.offset || 0;
  let limit = parseInt(queryLimit);
  if (isNaN(limit) || limit < 1 || limit > 100) {
    limit = 100;
  }
  let offset = parseInt(queryOffset);
  if (isNaN(offset) || offset < 0) {
    offset = 0;
  }
  return { limit, offset };
}

module.exports = { getLimitOffset };
