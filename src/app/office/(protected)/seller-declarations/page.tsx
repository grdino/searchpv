import Link from "next/link";
import { requireOfficeAppAccess } from "@/lib/office-auth";
import { listDeclarations } from "./actions";
import Editor from "./Editor";

export const runtime = "nodejs";
export const maxDuration = 120;
export const metadata = { title: "Seller Declarations | SearchPV Office" };
export default async function Page() {
  await requireOfficeAppAccess("seller_declarations");
  const records = await listDeclarations().catch(() => null);
  if (records) {
    return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><div className="mx-auto max-w-6xl">
      <Link className="text-sm underline" href="/office">← Private Office</Link>
      <header className="my-6"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">SearchPV Office</p><h1 className="text-3xl font-bold">Seller Declarations</h1><p className="mt-2 text-slate-600">Inclusions & exclusions · Photos by room · Spanish, then English</p></header>
      <Editor initial={records} />
    </div></main>;
  } else {
    return <main className="mx-auto max-w-2xl p-8"><Link href="/office">← Private Office</Link><h1 className="my-4 text-2xl font-bold">Seller Declarations setup required</h1><p>Unable to load declarations. Verify the database migration and your Office app assignment, then reload. Contact the administrator if setup is complete.</p></main>;
  }
}
