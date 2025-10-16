import { useEffect, useRef } from 'react';

export function useWebSocket(rooms: string[]) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`);
    wsRef.current = ws;
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'subscribe', rooms }));
    });
    return () => {
      try { ws.close(); } catch {}
    };
  }, [rooms.join(',')]);

  return wsRef;
}

export default useWebSocket;



