"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Icon } from "@/components/Icon";

export function ScanModal({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserQRCodeReader();
    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result && !cancelled) {
            controlsRef.current?.stop();
            onResult(result.getText());
          }
        });
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch {
        setErr("Couldn't open the camera. Allow camera access, or paste the link instead.");
      }
    })();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-3xl"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <span className="font-display text-base font-bold text-text">Scan to pay</span>
          <button onClick={onClose} className="text-muted hover:text-text" aria-label="Close"><Icon name="check" size={18} /></button>
        </div>
        <div className="relative aspect-square w-full bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {/* framing reticle */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-2xl border-2" style={{ borderColor: "var(--accent)" }} />
          </div>
        </div>
        <div className="px-5 py-4 text-center text-xs text-muted">
          {err || "Point at a LitZap QR code to pay."}
        </div>
      </motion.div>
    </div>
  );
}
