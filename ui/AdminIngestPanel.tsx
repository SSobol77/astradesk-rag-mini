// ui/AdminIngestPanel.tsx
import React, { useRef, useState } from "react";

export default function AdminIngestPanel() {
  const [events, setEvents] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const uploadZip = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setEvents([]); setBusy(true);
    const fd = new FormData();
    fd.append("file", fileRef.current.files[0]);
    fd.append("collection", "manuals");
    fd.append("maxLen", "1200");
    fd.append("overlap", "200");

    const resp = await fetch("/ingest/zip", { method: "POST", body: fd, headers: { Accept: "text/event-stream" } });
    const reader = resp.body!.getReader();
    const dec = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("

")) >= 0) { // SSE frame
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const line = frame.split("
").find(l => l.startsWith("data:"));
        if (line) setEvents(ev => [JSON.parse(line.slice(5).trim()).message, ...ev]);
      }
    }
    setBusy(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">AstraDesk • Ingest ZIP</h2>
      <input type="file" accept=".zip" ref={fileRef} className="block w-full" />
      <button onClick={uploadZip} disabled={busy} className="px-4 py-2 rounded-xl shadow bg-black text-white">
        {busy ? "Uploading…" : "Upload & Index"}
      </button>
      <div className="border rounded-xl p-3 h-60 overflow-auto text-sm bg-gray-50">
        {events.map((e, i) => (<div key={i} className="border-b py-1">{e}</div>))}
      </div>
    </div>
  );
}
