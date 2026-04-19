import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";

const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6"];

export default function AdminPresence({ currentTab }) {
  const [otherAdmins, setOtherAdmins] = useState({});
  const [myAdminId, setMyAdminId] = useState(null);
  const wsRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const lastSentRef = useRef(0);

  // Connect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/admin-presence?admin_id=${Date.now()}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Presence] Connected");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === "init") {
        setMyAdminId(message.your_id);
        console.log("[Presence] My ID:", message.your_id);
      } else if (message.type === "update") {
        setOtherAdmins((prev) => ({
          ...prev,
          [message.admin_id]: {
            ...message.data,
            lastSeen: Date.now(),
          },
        }));
      } else if (message.type === "disconnect") {
        setOtherAdmins((prev) => {
          const newAdmins = { ...prev };
          delete newAdmins[message.admin_id];
          return newAdmins;
        });
      }
    };

    ws.onerror = (error) => {
      console.error("[Presence] WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("[Presence] Disconnected");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      
      // Throttle sending (every 50ms)
      const now = Date.now();
      if (now - lastSentRef.current > 50 && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          x: e.clientX,
          y: e.clientY,
          tab: currentTab,
        }));
        lastSentRef.current = now;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [currentTab]);

  // Send tab changes immediately
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        x: mousePositionRef.current.x,
        y: mousePositionRef.current.y,
        tab: currentTab,
      }));
    }
  }, [currentTab]);

  // Clean up stale cursors (not seen for 5s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOtherAdmins((prev) => {
        const filtered = {};
        Object.entries(prev).forEach(([id, data]) => {
          if (now - data.lastSeen < 5000) {
            filtered[id] = data;
          }
        });
        return filtered;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <AnimatePresence>
        {Object.entries(otherAdmins).map(([adminId, data], index) => {
          const color = COLORS[index % COLORS.length];
          const isOnSameTab = data.tab === currentTab;
          
          return (
            <motion.div
              key={adminId}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: isOnSameTab ? 1 : 0.3, 
                scale: 1,
                x: data.x,
                y: data.y,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: 0, top: 0 }}
            >
              {/* Cursor */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))` }}
              >
                <path
                  d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>

              {/* Label */}
              <div
                className="absolute left-6 top-2 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap"
                style={{ 
                  backgroundColor: color,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}
              >
                <User className="inline h-3 w-3 mr-1" />
                Admin {adminId.slice(-4)}
                {!isOnSameTab && (
                  <span className="ml-2 opacity-70 text-[10px]">
                    ({data.tab || "autre"})
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
