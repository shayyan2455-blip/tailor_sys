/**
 * Pagination middleware
 * Validates and parses pagination parameters from query string
 */
function parsePagination(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  // Validate limits
  if (limit < 1 || limit > 1000) {
    return res.status(400).json({
      error: {
        message: 'Invalid limit parameter',
        details: 'Limit must be between 1 and 1000'
      }
    });
  }

  if (page < 1) {
    return res.status(400).json({
      error: {
        message: 'Invalid page parameter',
        details: 'Page must be greater than 0'
      }
    });
  }

  req.pagination = {
    page,
    limit,
    offset
  };

  next();
}

/**
 * Build SQL Server pagination clause (OFFSET/FETCH)
 */
function buildPaginationClause(pagination) {
  if (!pagination) return '';
  return `ORDER BY id OFFSET ${pagination.offset} ROWS FETCH NEXT ${pagination.limit} ROWS ONLY`;
}

/**
 * Build SQL Server pagination with custom order by
 */
function buildPaginationWithOrder(pagination, orderBy = 'id') {
  if (!pagination) return '';
  return `ORDER BY ${orderBy} OFFSET ${pagination.offset} ROWS FETCH NEXT ${pagination.limit} ROWS ONLY`;
}

module.exports = {
  parsePagination,
  buildPaginationClause,
  buildPaginationWithOrder
};
