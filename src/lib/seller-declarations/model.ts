import { isDeclarationPhotoPath } from "./photo-filename";
export type Room = { id: string; es: string; en: string };
export type Photo = { id: string; roomId: string; path: string };
export type Item = { id: string; roomId: string; es: string; en: string; status: "" | "included" | "excluded"; notesEs: string; notesEn: string; photoIds: string[] };
export type Inventory = { preparedBy?: string[]; address: string; mls: string; sellers: string; date: string; rooms: Room[]; photos: Photo[]; items: Item[]; reviewed: boolean };
export type Declaration = { id: string; owner_id: string; family_id: string; revision: number; version: number; status: "draft" | "final"; content: Inventory; pdf_path: string | null; updated_at: string };
export const BUCKET = "seller-declarations";
export function emptyInventory(): Inventory {
  return { preparedBy: [], address: "", mls: "", sellers: "", date: new Date().toISOString().slice(0, 10), rooms: [], photos: [], items: [], reviewed: false };
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateInventory(value: unknown, owner: string, final = false): asserts value is Inventory {
  const v = value as Inventory;
  const str = (s: unknown, max = 2000) => typeof s === "string" && s.length <= max;
  if (!v || !str(v.address) || !str(v.mls, 100) || !str(v.sellers) || !str(v.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(v.date) || typeof v.reviewed !== "boolean" ||
    !Array.isArray(v.rooms) || !Array.isArray(v.photos) || !Array.isArray(v.items) || v.rooms.length > 60 || v.photos.length > 100 || v.items.length > 600) throw Error("Invalid declaration or size limit exceeded.");
  if (v.preparedBy !== undefined && (!Array.isArray(v.preparedBy) || v.preparedBy.length > 2 || v.preparedBy.some(name => !str(name, 80) || /[\r\n]/.test(name)))) throw Error("Enter up to two agent names, no more than 80 characters each.");
  const ids = new Set<string>();
  for (const row of [...v.rooms, ...v.photos, ...v.items]) {
    if (!uuid.test(row.id) || ids.has(row.id)) throw Error("Invalid or duplicate identifier.");
    ids.add(row.id);
  }
  const rooms = new Set(v.rooms.map(r => r.id));
  const photos = new Map(v.photos.map(p => [p.id, p]));
  for (const r of v.rooms) if (!str(r.es, 120) || !str(r.en, 120)) throw Error("Invalid room name.");
  for (const p of v.photos) if (!rooms.has(p.roomId) || !str(p.path, 200) || !isDeclarationPhotoPath(p.path, owner)) throw Error("Invalid photo reference.");
  for (const i of v.items) {
    if (!rooms.has(i.roomId) || !str(i.es) || !str(i.en) || !str(i.notesEs) || !str(i.notesEn) || !["", "included", "excluded"].includes(i.status) ||
      !Array.isArray(i.photoIds) || i.photoIds.length > 100 || new Set(i.photoIds).size !== i.photoIds.length ||
      i.photoIds.some(id => photos.get(id)?.roomId !== i.roomId)) throw Error("Invalid item or photo association.");
  }
  if (final && (!v.address.trim() || !v.sellers.trim() || !v.reviewed || !v.items.length ||
    v.rooms.some(r => !r.es.trim() || !r.en.trim()) ||
    v.items.some(i => !i.es.trim() || !i.en.trim() || !i.status || !i.photoIds.length || (!!i.notesEs.trim() !== !!i.notesEn.trim())) ||
    v.photos.some(p => !v.items.some(i => i.photoIds.includes(p.id)))))
    throw Error("Complete both languages, property and seller details, select every item, link each item and photo, and confirm bilingual review.");
}
