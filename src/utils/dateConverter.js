// Simple Persian date converter
export const toPersianDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    calendar: "persian",
  };
  try {
    return date.toLocaleDateString("fa-IR", options);
  } catch {
    // Fallback to simple format
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  }
};
