export function getFrontendUrl(): string {
  const url = process.env.FRONTEND_URL || "http://localhost:3000";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}
