import { hashPassword } from "../utils/password.js";

let users = [];

export async function initMockStore() {
  const existing = users.find(u => u.email === "user@example.com");
  if (existing) return;
  const passwordHash = await hashPassword("Passw0rd!");
  users.push({ id: "u_1", email: "user@example.com", passwordHash });
}

export async function findUserByEmail(email) {
  return users.find(u => u.email === email) || null;
}
