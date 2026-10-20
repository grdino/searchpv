const uuidPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const uuid = new RegExp("^" + uuidPattern + "$", "i");
const filename = new RegExp("^(?:([a-z0-9]+(?:-[a-z0-9]+)*)_)?" + uuidPattern + "\\.jpg$", "i");

export function photoFilename(roomName: string, uniqueId: string): string {
  if (!uuid.test(uniqueId)) throw Error("Invalid photo identifier.");
  const room = roomName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 60).replace(/-+$/g, "") || "room";
  return room + "_" + uniqueId + ".jpg";
}

export function isDeclarationPhotoPath(path: string, owner: string): boolean {
  const parts = path.split("/");
  if (parts.length !== 2 || parts[0] !== owner) return false;
  const match = filename.exec(parts[1]);
  // Accept both legacy UUID.jpg and new room-name_UUID.jpg files.
  return !!match && (!match[1] || match[1].length <= 60);
}
