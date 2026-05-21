export const formatRoleName = (value) => {
  if (!value || typeof value !== "string") return "";
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};
