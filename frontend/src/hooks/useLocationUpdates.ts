import { useEffect } from "react";
import type { LocationEvent } from "@/types";
export function useLocationUpdates(onEvent: (event: LocationEvent) => void) { useEffect(() => { const base = process.env.NEXT_PUBLIC_API_URL || window.location.origin; const url = base.replace(/^http/, "ws") + "/ws/location-updates"; let socket: WebSocket | undefined; try { socket = new WebSocket(url); socket.onmessage = e => onEvent(JSON.parse(e.data) as LocationEvent); } catch { /* API is optional during local development */ } return () => socket?.close(); }, [onEvent]); }
