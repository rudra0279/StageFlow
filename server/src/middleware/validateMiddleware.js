export const validate = (schema, target = 'body') => (req, res, next) => {
  const dataToValidate = target === 'query' ? req.query : req.body;
  const { error } = schema.validate(dataToValidate, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errorMessages
    });
  }
  next();
};
