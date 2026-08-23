import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeShipment: (trackingNumber: string) => void;
  unsubscribeShipment: (trackingNumber: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  subscribeShipment: () => {},
  unsubscribeShipment: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let socketUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || window.location.origin;
    if (socketUrl.includes('/api')) {
      socketUrl = socketUrl.split('/api')[0];
    }

    const newSocket = io(socketUrl, {
      auth: {
        token: token || localStorage.getItem('dlm_token') || '',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Global listener for live notifications pushed over WebSocket
    newSocket.on('notification:new', (notif: { title: string; message: string; type?: string }) => {
      if (notif.type === 'SUCCESS') {
        toast.success(notif.message ? `${notif.title}: ${notif.message}` : notif.title);
      } else if (notif.type === 'WARNING' || notif.type === 'ERROR') {
        toast.error(notif.message ? `${notif.title}: ${notif.message}` : notif.title);
      } else {
        toast.info(notif.message ? `${notif.title}: ${notif.message}` : notif.title);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  const subscribeShipment = (trackingNumber: string) => {
    if (socket && trackingNumber) {
      socket.emit('subscribe:shipment', trackingNumber);
    }
  };

  const unsubscribeShipment = (trackingNumber: string) => {
    if (socket && trackingNumber) {
      socket.emit('unsubscribe:shipment', trackingNumber);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, subscribeShipment, unsubscribeShipment }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
