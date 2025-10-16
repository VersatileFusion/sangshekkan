import React, { useEffect, useMemo, useRef, useState } from 'react';

type Message = {
  id: string;
  content: string;
  panelType: 'TOP_STUDENTS' | 'FAMILY_CHAT';
  isApproved: boolean;
  createdAt: string;
  senderId: string;
};

export function TopStudentsChat({ isAdmin = false }: { isAdmin?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch('/api/messages?panel=top', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setMessages(data || []));
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`);
    wsRef.current = ws;
    ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'subscribe', rooms: ['panel:TOP_STUDENTS'] })));
    ws.addEventListener('message', (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.kind === 'chat' && data?.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch {}
    });
    return () => { try { ws.close(); } catch {} };
  }, []);

  const approved = useMemo(() => messages.filter((m) => m.isApproved), [messages]);
  const pending = useMemo(() => messages.filter((m) => !m.isApproved), [messages]);

  async function send() {
    const body = { content: text, panelType: 'TOP_STUDENTS' };
    const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
    if (res.ok) setText('');
  }

  async function approve(id: string) {
    await fetch(`/api/admin/messages/${id}/approve`, { method: 'POST', credentials: 'include' });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isApproved: true } : m)));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border rounded p-2 h-64 overflow-y-auto">
        {approved.map((m) => (
          <div key={m.id} className="text-sm py-1">{m.content}</div>
        ))}
        {isAdmin && pending.length > 0 && (
          <div className="mt-2 border-t pt-2">
            <div className="text-xs text-gray-500 mb-1">Pending</div>
            {pending.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1">
                <span className="text-sm">{m.content}</span>
                <button className="text-blue-600 underline" onClick={() => approve(m.id)}>Approve</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input className="border rounded px-2 py-1 flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="پیام شما" />
        <button className="bg-blue-600 text-white rounded px-3" onClick={send}>Send</button>
      </div>
    </div>
  );
}

export default TopStudentsChat;



