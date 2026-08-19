import { useCallback, useEffect, useRef, useState } from "react";
import type { FloorPlanImage, FloorPlanMarker, MarkerKind, Point } from "@/types/floorPlan";
import { DEFAULT_MARKER_KIND, MARKER_KIND_OPTIONS } from "@/types/floorPlan";
import { renderPdfFirstPageToDataUrl } from "@/utils/pdfToImage";

const STORAGE_PREFIX = "assettrack:floor-plan-markers";

function loadStoredMarkers(planName: string): FloorPlanMarker[] {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${planName}`);
    return raw ? (JSON.parse(raw) as FloorPlanMarker[]) : [];
  } catch {
    return [];
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the floor plan image."));
    img.src = src;
  });
}

export function useFloorPlan() {
  const [floorPlan, setFloorPlan] = useState<FloorPlanImage | null>(null);
  const [markers, setMarkers] = useState<FloorPlanMarker[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [pingedMarkerId, setPingedMarkerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const uploadFloorPlan = useCallback(async (file: File) => {
    setError(null);
    try {
      const isPdf = file.type === "application/pdf";
      const src = isPdf ? await renderPdfFirstPageToDataUrl(file) : URL.createObjectURL(file);
      const img = await loadImage(src);

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = isPdf ? null : src;

      setFloorPlan({
        name: file.name,
        url: src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeBytes: file.size,
      });
      setMarkers(loadStoredMarkers(file.name));
      setStartPoint(null);
      setPingedMarkerId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  }, []);

  const addMarker = useCallback((xPct: number, yPct: number, kind: MarkerKind = DEFAULT_MARKER_KIND.kind) => {
    const icon = MARKER_KIND_OPTIONS.find((option) => option.kind === kind)?.icon ?? DEFAULT_MARKER_KIND.icon;
    setMarkers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: `Location ${prev.length + 1}`, xPct, yPct, kind, icon },
    ]);
  }, []);

  const renameMarker = useCallback((id: string, label: string) => {
    setMarkers((prev) => prev.map((marker) => (marker.id === id ? { ...marker, label } : marker)));
  }, []);

  const setMarkerKind = useCallback((id: string, kind: MarkerKind) => {
    const icon = MARKER_KIND_OPTIONS.find((option) => option.kind === kind)?.icon ?? DEFAULT_MARKER_KIND.icon;
    setMarkers((prev) => prev.map((marker) => (marker.id === id ? { ...marker, kind, icon } : marker)));
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id));
    setPingedMarkerId((current) => (current === id ? null : current));
  }, []);

  const saveMarkers = useCallback(() => {
    if (!floorPlan) return;
    window.localStorage.setItem(`${STORAGE_PREFIX}:${floorPlan.name}`, JSON.stringify(markers));
  }, [floorPlan, markers]);

  const pingMarker = useCallback((id: string | null) => {
    setPingedMarkerId(id);
  }, []);

  const reset = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setFloorPlan(null);
    setMarkers([]);
    setStartPoint(null);
    setPingedMarkerId(null);
    setError(null);
  }, []);

  return {
    floorPlan,
    markers,
    startPoint,
    pingedMarkerId,
    error,
    uploadFloorPlan,
    addMarker,
    renameMarker,
    setMarkerKind,
    removeMarker,
    saveMarkers,
    setStartPoint,
    pingMarker,
    reset,
  };
}
