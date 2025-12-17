export function ok(res, body) {
  res.status(200).json(body);
}

export function created(res, body) {
  res.status(201).json(body);
}

export function updated(res, body) {
  res.status(200).json(body);
}

export function deleted(res, body) {
  res.status(200).json(body);
}

export function badRequest(res, message = "Validation error", details) {
  const payload = details ? { message, details } : { message };
  res.status(400).json(payload);
}

export function unauthorized(res, message = "Unauthorized") {
  res.status(401).json({ message });
}

export function notFound(res, message = "Not found") {
  res.status(404).json({ message });
}

export function conflict(res, message = "Conflict") {
  res.status(409).json({ message });
}

export function serverError(res, message = "Internal server error") {
  res.status(500).json({ message });
}