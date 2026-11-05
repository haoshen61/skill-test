const records = document.querySelector("#records");
const guestContributions = __GUEST_CONTRIBUTIONS_JSON__;

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const data = Object.create(null);
data.rsvp = readList("weddingInvitation.rsvp");
for (const contribution of guestContributions) data[contribution.id] = readList(contribution.storageKey);

const sections = [["出席登记", data.rsvp], ...guestContributions.map((contribution) => [contribution.title, data[contribution.id]])];
for (const [title, values] of sections) {
  const heading = document.createElement("h2");
  heading.textContent = `${title} (${values.length})`;
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(values, null, 2);
  records.append(heading, pre);
}

document.querySelector("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "wedding-local-records.json";
  link.click();
  URL.revokeObjectURL(link.href);
});
