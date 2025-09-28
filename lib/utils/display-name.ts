// Utility to get a display name for a user object
// Prioritizes fullName, then email prefix, never returns a generic 'User'
export function getUserDisplayName(user?: { fullName?: string; email?: string }): string {
  if (!user) return "";
  const name = user.fullName?.trim();
  if (name) return name;
  const emailPrefix = user.email?.split("@")[0];
  return emailPrefix || "";
}
