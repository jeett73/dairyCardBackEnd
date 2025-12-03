export default function validate(schema) {
  return (req, res, next) => {
    const data = { body: req.body, query: req.query, params: req.params };
    const { error, value } = schema.validate(data, { abortEarly: false, allowUnknown: true });
    if (error) return res.status(400).json({ message: "Validation error", details: error.details.map(d => d.message) });
    next();
  };
}
