import { useEffect, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher';

export function usePusher() {
  const isConnected = useRef(false);

  useEffect(() => {
    if (isConnected.current) return;

    const client = getPusherClient();
    if (client) {
      client.connect();
      isConnected.current = true;
    }

    return () => {
      if (isConnected.current && client) {
        client.disconnect();
        isConnected.current = false;
      }
    };
  }, []);

  return getPusherClient();
}