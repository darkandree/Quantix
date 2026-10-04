import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

// Camera barcode scanning. `videoRef` must be attached to a <video> that is
// mounted while `scanning` is true.
export function useScanner(onResult) {
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState('Point the camera at a barcode');
  const reader = useRef(null);
  const videoRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = useCallback(() => {
    try { reader.current?.reset(); } catch { /* already stopped */ }
    setScanning(false);
  }, []);

  const start = useCallback(() => {
    setScanning(true);
    setHint('Starting camera…');
  }, []);

  useEffect(() => {
    if (!scanning) return undefined;
    let cancelled = false;
    reader.current = reader.current || new BrowserMultiFormatReader();
    reader.current
      .decodeFromConstraints({ video: { facingMode: 'environment' } }, videoRef.current, (result) => {
        if (result && !cancelled) {
          cancelled = true;
          stop();
          onResultRef.current(result.getText());
        }
      })
      .then(() => !cancelled && setHint('Point the camera at a barcode'))
      .catch((err) => !cancelled && setHint('Camera unavailable: ' + err.message));
    return () => {
      cancelled = true;
      try { reader.current?.reset(); } catch { /* already stopped */ }
    };
  }, [scanning, stop]);

  return { scanning, hint, setHint, videoRef, start, stop, toggle: () => (scanning ? stop() : start()) };
}
