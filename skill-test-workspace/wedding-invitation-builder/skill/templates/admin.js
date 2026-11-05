const records = document.querySelector("#records");

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const data = {
  rsvp: readList("weddingInvitation.rsvp"),
  music: readList("weddingInvitation.music")
};

for (const [title, values] of [["出席登记", data.rsvp], ["点歌留言", data.music]]) {
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
