"use client";
import { useEffect, useRef, useState } from "react";
import type { Declaration, Inventory, Item } from "@/lib/seller-declarations/model";
import { createDeclaration, saveDeclaration, uploadDeclarationPhoto, photoUrls, exportDeclaration, translateInventoryItem } from "./actions";

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100";
const button = "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50";
const presets = [["Sala", "Living room"], ["Comedor", "Dining room"], ["Cocina", "Kitchen"], ["Recámara principal", "Primary bedroom"], ["Recámara", "Bedroom"], ["Baño", "Bathroom"], ["Terraza", "Terrace"], ["Jardín", "Garden"], ["Lavandería", "Laundry"], ["Otro", "Other"]];
async function compress(file: File): Promise<Blob> {
  if (file.size > 30000000) throw Error("Choose a photo smaller than 30 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d"); if (!ctx) throw Error("Photo processing is unavailable.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.65, 0.5, 0.35]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= 750000) return blob;
    }
    throw Error("Photo could not be compressed. Try a smaller image.");
  } catch (e) { throw e instanceof Error ? e : Error("Cannot read this photo. Try JPEG or PNG."); }
  finally { URL.revokeObjectURL(url); }
}
export default function Editor({ initial }: { initial: Declaration[] }) {
  const [records, setRecords] = useState(initial);
  const [record, setRecord] = useState<Declaration | null>(null);
  const [roomId, setRoomId] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [download, setDownload] = useState("");
  const [dictation, setDictation] = useState("");
  const [language, setLanguage] = useState<"es" | "en">("en");
  const [dictationPhoto, setDictationPhoto] = useState("");
  const current = useRef<Declaration | null>(null);
  const changed = useRef(false);
  const pending = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  function remember(next: Declaration) {
    current.current = next; setRecord(next);
    setRecords(old => [next, ...old.filter(r => r.id !== next.id)]);
  }
  function edit(fn: (v: Inventory) => Inventory) {
    if (!current.current || current.current.status === "final") return;
    const next = { ...current.current, content: { ...fn(current.current.content), reviewed: false } };
    current.current = next; setRecord(next); changed.current = true; setDirty(true); setDownload(""); setMessage("");
  }
  async function persist(): Promise<void> {
    if (pending.current) { await pending.current; if (changed.current) return persist(); return; }
    if (!changed.current || !current.current) return;
    const snapshot = current.current;
    setSaving(true);
    const task = (async () => {
      const saved = await saveDeclaration(snapshot.id, snapshot.version, snapshot.content);
      const latest = current.current!;
      const same = latest.content === snapshot.content;
      const next = { ...saved, content: same ? saved.content : latest.content };
      if (mounted.current) remember(next);
      changed.current = !same; if (mounted.current) setDirty(!same);
    })();
    pending.current = task;
    try { await task; }
    finally { pending.current = null; if (mounted.current) setSaving(false); }
  }
  useEffect(() => {
    if (!dirty || busy) return;
    const timer = window.setTimeout(() => { void persist().catch(e => setError(String(e.message ?? e))); }, 1400);
    return () => window.clearTimeout(timer);
    // Re-arm after edits; persist uses refs to serialize saves and preserve newer edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, dirty, busy]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (changed.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  // Renew private photo URLs while a long inventory session remains open.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const r = current.current;
      if (r) void photoUrls(r.content.photos.map(p => p.path)).then(setUrls).catch(() => {});
    }, 45 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  async function open(next: Declaration) {
    await persist();
    const latest = current.current?.id === next.id ? current.current : next;
    const signed = await photoUrls(latest.content.photos.map(p => p.path));
    remember(latest); changed.current = false; setDirty(false); setRoomId(latest.content.rooms[0]?.id ?? ""); setUrls(signed); setDownload(""); setDictation(""); setDictationPhoto("");
  }
  async function addPhoto(file: File) {
    const blob = await compress(file); const data = new FormData(); data.set("photo", blob, "photo.jpg");
    const uploaded = await uploadDeclarationPhoto(data);
    const id = crypto.randomUUID();
    setUrls(old => ({ ...old, [uploaded.path]: uploaded.url }));
    edit(v => ({ ...v, photos: [...v.photos, { id, roomId, path: uploaded.path }] }));
    setDictationPhoto(id); await persist();
  }
  function changeItem(id: string, patch: Partial<Item>) {
    edit(v => ({ ...v, items: v.items.map(i => i.id === id ? { ...i, ...patch } : i) }));
  }
  function addItems() {
    const lines = dictation.split(/\n|;/).map(s => s.trim()).filter(Boolean);
    if (!lines.length) return;
    edit(v => ({ ...v, items: [...v.items, ...lines.map(line => ({ id: crypto.randomUUID(), roomId, es: language === "es" ? line : "", en: language === "en" ? line : "", status: "" as const, notesEs: "", notesEn: "", photoIds: dictationPhoto ? [dictationPhoto] : [] }))] }));
    setDictation("");
  }
  const content = record?.content;
  const room = content?.rooms.find(r => r.id === roomId);
  const photos = content?.photos.filter(p => p.roomId === roomId) ?? [];
  const items = content?.items.filter(i => i.roomId === roomId) ?? [];
  const locked = record?.status === "final";
  return <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 self-start">
      <button className={button + " w-full bg-slate-950 !text-white"} disabled={busy} onClick={() => void run(async () => { await persist(); await open(await createDeclaration()); })}>+ New declaration</button>
      <p className="my-4 text-xs text-slate-500">Your private declarations · Drafts save automatically</p>
      <div className="max-h-[65vh] space-y-2 overflow-auto">{records.map(r => <button key={r.id} disabled={busy} className={"w-full rounded-lg border p-3 text-left " + (r.id === record?.id ? "border-sky-600 bg-sky-50" : "border-slate-200")} onClick={() => void run(() => open(r))}>
        <span className="block text-sm font-semibold">{r.content.address || "Untitled property"}</span><span className="text-xs text-slate-500">Rev. {r.revision} · {r.status === "final" ? "Finalized" : "Draft"} · {r.content.date}</span>
      </button>)}</div>
    </aside>
    <section className="min-w-0 space-y-5">
      <div aria-live="polite">{error && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} Your unsaved edits remain on this screen. Use Save to retry; reload only after copying any unsaved text.</p>}{message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}</div>
      {!content || !record ? <div className="rounded-2xl bg-white p-10 text-slate-500">Start a declaration or open a saved property.</div> : <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
          <p className="text-sm font-semibold">Revision {record.revision} · {locked ? "Finalized · Read only" : saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}</p>
          <div className="flex flex-wrap gap-2">
            {!locked && <button className={button} disabled={busy} onClick={() => void run(async () => { await persist(); setMessage("Saved."); })}>Save</button>}
            <button className={button} disabled={busy} onClick={() => void run(async () => { await persist(); const result = await exportDeclaration(current.current!.id, current.current!.version, false); remember(result.record); setDownload(result.url); })}>{locked ? "Download PDF" : "Preview draft PDF"}</button>
            {locked ? <button className={button} disabled={busy} onClick={() => void run(async () => { await open(await createDeclaration(record.id)); })}>Create revision</button> :
              <button className={button + " !bg-slate-950 !text-white"} disabled={busy || !content.reviewed} onClick={() => {
                if (!window.confirm("Finalize this revision? It will become read only. Later changes require a new revision.")) return;
                void run(async () => { await persist(); const result = await exportDeclaration(current.current!.id, current.current!.version, true); remember(result.record); setDownload(result.url); setMessage("Finalized. The PDF and this revision are preserved."); });
              }}>Finalize & generate PDF</button>}
          </div>
          {busy && <p className="w-full text-sm text-slate-500" role="status">Working… Please keep this page open.</p>}
          {download && <a className="w-full font-semibold text-sky-700 underline" href={download} target="_blank" rel="noopener noreferrer">Open / download PDF (link valid for 5 minutes)</a>}
        </div>
        <fieldset disabled={busy || locked} className="space-y-5 disabled:opacity-90">
          <div className="grid gap-4 rounded-2xl bg-white p-5 sm:grid-cols-2">
            {(["address", "sellers", "mls", "date"] as const).map(key => <label key={key} className="text-sm font-semibold">{({ address: "Property address", sellers: "Seller name(s)", mls: "MLS (optional)", date: "Document date" })[key]}
              <input className={input + " mt-1"} type={key === "date" ? "date" : "text"} maxLength={key === "mls" ? 100 : 2000} value={content[key]} onChange={e => edit(v => ({ ...v, [key]: e.target.value }))} /></label>)}
          </div>
          <div className="rounded-2xl bg-white p-5">
            <p className="text-sm font-semibold">Preparado por / Prepared by</p>
            <p className="mt-1 text-sm text-slate-500">Optional. Names appear in the PDF footer on every page.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">{[0, 1].map(index => <label key={index} className="text-sm font-semibold">Agent {index + 1}{index === 1 ? " (optional)" : ""}
              <input className={input + " mt-1"} maxLength={80} value={content.preparedBy?.[index] ?? ""} onChange={e => edit(v => { const names = [...(v.preparedBy ?? [])]; while (names.length <= index) names.push(""); names[index] = e.target.value; return { ...v, preparedBy: names }; })} />
            </label>)}</div>
          </div>
          <div className="rounded-2xl bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              {content.rooms.map(r => <button type="button" key={r.id} className={button + (r.id === roomId ? " !border-sky-600 !bg-sky-50" : "")} onClick={() => { setRoomId(r.id); setDictation(""); setDictationPhoto(""); }}>{r.en || r.es || "Room"}</button>)}
              <select aria-label="Add a room" className={input + " !w-auto"} value="" onChange={e => { const preset = presets[Number(e.target.value)]; if (!preset) return; const id = crypto.randomUUID(); edit(v => ({ ...v, rooms: [...v.rooms, { id, es: preset[0], en: preset[1] }] })); setRoomId(id); setDictationPhoto(""); setDictation(""); }}>
                <option value="">+ Add room…</option>{presets.map((p, index) => <option key={index} value={index}>{p[1]} / {p[0]}</option>)}
              </select>
            </div>
            {room && <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">{(["es", "en"] as const).map(lang => <label key={lang} className="text-sm font-semibold">Room name · {lang === "es" ? "Español" : "English"}<input className={input + " mt-1"} maxLength={120} value={room[lang]} onChange={e => edit(v => ({ ...v, rooms: v.rooms.map(r => r.id === roomId ? { ...r, [lang]: e.target.value } : r) }))} /></label>)}</div>
              <div className="flex flex-wrap gap-3">{[true, false].map(camera => <label key={String(camera)} className={button + " cursor-pointer"}>{camera ? "Take photo" : "Upload photo"}<input className="sr-only" type="file" accept="image/*" {...(camera ? { capture: "environment" as const } : {})} onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void run(() => addPhoto(f)); }} /></label>)}</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map(p => <div key={p.id} className="overflow-hidden rounded-xl border border-slate-200">
                {/* Signed private image URLs expire and are renewed above. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={"Photo " + (content.photos.indexOf(p) + 1) + " - " + room.en} src={urls[p.path]} className="h-36 w-full object-contain bg-slate-100" />
                <div className="flex justify-between p-2 text-xs"><span>Photo {content.photos.indexOf(p) + 1}</span><button type="button" className="text-red-700 underline" onClick={() => { if (window.confirm("Remove this photo from the draft and its item links?")) edit(v => ({ ...v, photos: v.photos.filter(a => a.id !== p.id), items: v.items.map(i => ({ ...i, photoIds: i.photoIds.filter(id => id !== p.id) })) })); }}>Remove</button></div>
              </div>)}</div>
              <div className="rounded-xl bg-slate-50 p-4">
                <h2 className="font-bold">Add inventory items</h2><p className="my-2 text-sm text-slate-600">Use your phone keyboard’s microphone or type. Separate items with a new line or semicolon. Review both languages below.</p>
                <div className="mb-3 flex flex-wrap gap-2"><select aria-label="Dictation language" className={input + " !w-auto"} value={language} onChange={e => setLanguage(e.target.value as "en" | "es")}><option value="en">English</option><option value="es">Español</option></select>
                <select aria-label="Associate new items with photo" className={input + " !w-auto"} value={dictationPhoto} onChange={e => setDictationPhoto(e.target.value)}><option value="">Link photo later</option>{photos.map(p => <option key={p.id} value={p.id}>Photo {content.photos.indexOf(p) + 1}</option>)}</select></div>
                <textarea aria-label="Inventory items, one per line" className={input} rows={3} maxLength={20000} value={dictation} onChange={e => setDictation(e.target.value)} placeholder="Sofa; coffee table; television" />
                <button type="button" className={button + " mt-2"} disabled={!dictation.trim()} onClick={addItems}>Add items for review</button>
              </div>
              {items.map((item, index) => <div key={item.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Item {index + 1}</h3><button type="button" className="text-xs text-red-700 underline" onClick={() => { if (window.confirm("Remove this item from the draft?")) edit(v => ({ ...v, items: v.items.filter(i => i.id !== item.id) })); }}>Remove item</button></div>
                <div className="grid gap-3 sm:grid-cols-2">{(["es", "en"] as const).map(lang => <label key={lang} className="text-sm">Description · {lang === "es" ? "Español" : "English"}<textarea className={input + " mt-1"} rows={2} maxLength={2000} value={item[lang]} onChange={e => changeItem(item.id, { [lang]: e.target.value })} /></label>)}</div>
                <button type="button" className={button} disabled={!item.es.trim() && !item.en.trim()} onClick={() => void run(async () => { const translated = await translateInventoryItem({ es: item.es, en: item.en, notesEs: item.notesEs, notesEn: item.notesEn }); changeItem(item.id, translated); setMessage("Missing translations filled. Please review both languages before finalizing."); })}>Fill missing translation</button>
                <p className="text-xs text-slate-500">Translation sends this item’s descriptions and notes to OpenAI. Existing text is preserved.</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={"Selection for item " + (index + 1)}>{(["included", "excluded"] as const).map(status => <button type="button" key={status} aria-pressed={item.status === status} className={button + (item.status === status ? status === "included" ? " !border-emerald-600 !bg-emerald-50" : " !border-amber-600 !bg-amber-50" : "")} onClick={() => changeItem(item.id, { status: item.status === status ? "" : status })}>{status === "included" ? "Included / Incluido" : "Excluded / Excluido"}</button>)}{!item.status && <span className="self-center text-xs text-amber-700">Selection required</span>}</div>
                <div className="flex flex-wrap gap-3">{photos.map(p => <label key={p.id} className="text-sm"><input type="checkbox" checked={item.photoIds.includes(p.id)} onChange={e => changeItem(item.id, { photoIds: e.target.checked ? [...item.photoIds, p.id] : item.photoIds.filter(id => id !== p.id) })} /> Photo {content.photos.indexOf(p) + 1}</label>)}</div>
                <details><summary className="cursor-pointer text-sm text-slate-500">Notes / Observaciones (optional)</summary><div className="mt-2 grid gap-3 sm:grid-cols-2">{(["notesEs", "notesEn"] as const).map(key => <label key={key} className="text-xs">{key === "notesEs" ? "Observaciones · Español" : "Notes · English"}<textarea className={input} maxLength={2000} value={item[key]} onChange={e => changeItem(item.id, { [key]: e.target.value })} /></label>)}</div></details>
              </div>)}
              <button className="text-xs text-red-700 underline" type="button" onClick={() => { if (window.confirm("Remove this room, all its items, and its photo links from this draft?")) { edit(v => ({ ...v, rooms: v.rooms.filter(r => r.id !== roomId), photos: v.photos.filter(p => p.roomId !== roomId), items: v.items.filter(i => i.roomId !== roomId) })); setRoomId(""); } }}>Remove room</button>
            </div>}
          </div>
          <div className="rounded-2xl bg-white p-5">
            <h2 className="font-bold">Final review</h2>
            <p className="my-2 text-sm text-slate-600">{content.rooms.length} rooms · {content.photos.length} photos · {content.items.length} items · {content.items.filter(i => !i.status || !i.es.trim() || !i.en.trim() || !i.photoIds.length).length} items need completion</p>
            <label className="flex gap-3 text-sm"><input type="checkbox" checked={content.reviewed} onChange={e => { const next = { ...current.current!, content: { ...current.current!.content, reviewed: e.target.checked } }; current.current = next; setRecord(next); changed.current = true; setDirty(true); }} />I have reviewed all rooms, both languages, photo associations, and inclusion/exclusion selections. Any edit will require review again.</label>
          </div>
        </fieldset>
        {locked && <div className="flex flex-wrap gap-2 rounded-xl bg-white p-4"><span className="text-sm">View room:</span>{content.rooms.map(r => <button key={r.id} className={button} onClick={() => setRoomId(r.id)}>{r.en || r.es}</button>)}</div>}
      </>}
    </section>
  </div>;
}
