// Zod validators with one contract: 400 + per-field `details` the frontend
// can render inline - never a raw 500 or stack trace.
function badRequest(res, details) {
  return res
    .status(400)
    .json({ error: { message: 'Invalid request', code: 'VALIDATION_ERROR', details } });
}

function toDetails(zodError) {
  const details = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || '_';
    if (!details[key]) details[key] = issue.message;
  }
  return details;
}

// Validates req.body. Unknown keys are stripped by Zod - that is how
// client-supplied rewards/status are dropped before they reach controllers.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data; // trimmed / transformed values downstream
      return next();
    }
    return badRequest(res, toDetails(result.error));
  };
}

// Same contract for ?query strings (Express 4 allows reassigning req.query).
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (result.success) {
      req.query = result.data;
      return next();
    }
    return badRequest(res, toDetails(result.error));
  };
}

module.exports = { validate, validateQuery };
