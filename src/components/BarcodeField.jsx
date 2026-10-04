import React from 'react';

// Text input + camera "Scan" toggle, driven by a useScanner() instance.
export default function BarcodeField({ id, value, onChange, onCommit, placeholder, scanner }) {
  return (
    <>
      <div className="barcode-row">
        <input
          type="text"
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit ? () => onCommit(value) : undefined}
        />
        <button type="button" className={'btn-ghost scan-toggle-btn' + (scanner.scanning ? ' active' : '')} onClick={scanner.toggle}>
          {scanner.scanning ? 'Stop scan' : 'Scan'}
        </button>
      </div>
      {scanner.scanning && (
        <div className="scanner-wrap">
          <div className="scanner-viewport">
            <video ref={scanner.videoRef} autoPlay playsInline muted />
            <div className="scan-target">
              <span className="scan-corner tl" /><span className="scan-corner tr" />
              <span className="scan-corner bl" /><span className="scan-corner br" />
              <div className="scan-line" />
            </div>
          </div>
          <div className="scan-hint">{scanner.hint}</div>
        </div>
      )}
    </>
  );
}
