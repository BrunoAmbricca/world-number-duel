import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance (only initialize on server)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

// Client-side Pusher instance (only initialize on client)
let pusherClient: PusherClient | null = null;

export const getPusherClient = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!pusherKey) {
    console.warn('Pusher key not found. Real-time features will be disabled.');
    return null;
  }

  if (!pusherClient) {
    pusherClient = new PusherClient(pusherKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    });
  }
  
  return pusherClient;
};

export { pusherClient };