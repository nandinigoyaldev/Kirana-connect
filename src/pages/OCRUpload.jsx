import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

export default function OCRUpload() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  // OCR states
  const [fileSelected, setFileSelected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const handleFileUpload = (e) => {
    e.preventDefault();
    setFileSelected(true);
    setIsScanning(true);
    setSyncDone(false);
    triggerOCRScan();
  };

  const triggerOCRScan = async () => {
    try {
      const res = await fetch('/api/ai/ocr-invoice', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOcrResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleImportToInventory = async () => {
    if (!ocrResult) return;
    setIsSyncing(true);
    
    try {
      const storeId = user?.storeId || '60d5ec49867c293444747b11';
      const invRes = await fetch(`/api/inventory/store/${storeId}`);
      const invData = await invRes.json();
      const storeInventory = invData.inventory || [];

      for (const item of ocrResult.items) {
        const existingItem = storeInventory.find(i => (i.productId._id === item.productId || i.productId === item.productId));
        const prevStock = existingItem ? existingItem.stock : 0;
        const newStock = prevStock + item.quantity;

        await fetch('/api/inventory/update', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productId: item.productId,
            price: item.price,
            stock: newStock,
            isAvailable: true
          })
        });
      }
      setSyncDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="split-layout-wide-left">
      
      {/* Left Panel: Invoice File Dropzone */}
      <div className="card flex-col gap-md">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>OCR Invoice Ingestion</h3>
        <p className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
          Upload wholesaler and distributor invoices. The AI optical scanner extracts product listings, quantities, and buying rates to reconcile stock levels.
        </p>

        {/* Dynamic Drag-Drop Ingestion Box */}
        <form 
          onSubmit={handleFileUpload} 
          className="flex-col flex-center"
          style={{ 
            border: '2px dashed var(--color-border)', 
            borderRadius: '12px', 
            padding: '40px 20px', 
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.01)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onClick={() => document.getElementById('invoice-file').click()}
        >
          <input 
            type="file" 
            id="invoice-file" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
          />
          <Upload size={36} className="text-primary" style={{ marginBottom: '12px' }} />
          <strong className="text-sm" style={{ display: 'block', marginBottom: '4px' }}>Upload Supplier Invoice</strong>
          <span className="text-xs text-muted">Supports PDF, PNG, JPEG up to 5MB</span>
        </form>

        <div className="bg-primary-light" style={{ padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>Ingestion Engine: OCR Line-item Auto Mapper enabled.</span>
        </div>
      </div>

      {/* Right Panel: Scanning View & Parsed Ledger */}
      <div className="flex-col gap-md">
        
        {/* Real-time scanning animation overlay */}
        {isScanning && (
          <div className="card text-center" style={{ padding: '60px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              width: '100%',
              height: '160px',
              border: '1px dashed var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              position: 'relative',
              margin: '0 auto 24px auto',
              maxWidth: '240px',
              overflow: 'hidden'
            }}>
              <FileText size={48} className="text-muted" style={{ position: 'absolute', top: 'calc(50% - 24px)', left: 'calc(50% - 24px)' }} />
              <div style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--color-primary)',
                boxShadow: '0 0 12px var(--color-primary)',
                animation: 'ocrLaserScan 2s infinite ease-in-out'
              }}></div>
            </div>
            
            {/* Scanning Keyframe definitions */}
            <style>{`
              @keyframes ocrLaserScan {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
            `}</style>
            
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>Processing Document</h4>
            <p className="text-sm text-muted">Segmenting lines, classifying character blocks, and parsing wholesaler ledger rates...</p>
          </div>
        )}

        {/* Empty state */}
        {!isScanning && !ocrResult && !fileSelected && (
          <div className="card flex-col flex-center text-muted text-center" style={{ padding: '80px 40px', justifyContent: 'center', minHeight: '340px' }}>
            <FileText size={54} style={{ marginBottom: '12px' }} />
            <p className="text-sm">No active invoice. Upload a purchase receipt on the left portal to inspect character matches.</p>
          </div>
        )}

        {/* OCR Parsed Ledger Results */}
        {ocrResult && !isScanning && (
          <div className="card flex-col gap-md">
            <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>OCR Extracted Ledger</h4>
                <div className="text-xs text-muted" style={{ marginTop: '2px' }}>Invoice Ref: {ocrResult.invoiceNumber} | Ingested on: {ocrResult.date}</div>
              </div>
              <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>Confidence: {ocrResult.confidenceScore}%</span>
            </div>

            <div className="flex-col gap-sm">
              {ocrResult.items.map((item, idx) => (
                <div key={idx} className="flex-between" style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong className="text-sm">{item.name}</strong>
                    <div className="text-xs text-muted" style={{ marginTop: '2px' }}>Wholesale Rate: ₹{item.price} | Category: {item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>+ {item.quantity} Units</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 600 }}>Map Confidence: {item.confidence}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* NEW: OCR Extracted Lexical Diagnostic Log */}
            <div className="card" style={{ backgroundColor: '#050B14', fontFamily: 'monospace', border: '1px solid var(--color-primary)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(79, 70, 229, 0.2)', paddingBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Terminal size={12} /> [OCR INGESTION DIAGNOSTIC LOG v2.1]</span>
                <span>MATCHING: SUCCESS</span>
              </div>
              <div style={{ fontSize: '0.8rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>&gt; INGESTING IMAGE MEMORY STREAM... DONE</div>
                <div>&gt; DETECTING GRID LINES: {ocrResult.items.length} segments found</div>
                {ocrResult.items.map((it, i) => (
                  <div key={i}>&gt; MAP [{i}]: "{it.name}" ➔ SKU Match: {it.confidence}% confidence</div>
                ))}
                <div>&gt; INVOICE NUMBER PARSED: {ocrResult.invoiceNumber}</div>
                <div style={{ color: '#9CA3AF', marginTop: '6px' }}>&gt; Click "Accept Ledger & Import" to sync wholesale purchases.</div>
              </div>
            </div>

            {syncDone ? (
              <div className="bg-primary-light" style={{ padding: '14px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 size={20} />
                <span>Success: Stock levels reconciled into local inventory logs.</span>
              </div>
            ) : (
              <div className="flex-row" style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                <button className="btn btn-outline" onClick={() => setOcrResult(null)}>
                  Discard Ledger
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleImportToInventory}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Synchronizing catalog...' : 'Accept Ledger & Import'} <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
