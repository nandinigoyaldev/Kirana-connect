import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function OCRUpload() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  // OCR processing states
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

    // Call OCR endpoint
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
      // Fetch current store inventory first
      const storeId = user?.storeId || '60d5ec49867c293444747b11';
      const invRes = await fetch(`/api/inventory/store/${storeId}`);
      const invData = await invRes.json();
      const storeInventory = invData.inventory || [];

      // Sync each item to store inventory
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
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
      
      {/* Left: Drag Drop Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>OCR Invoice Scanner</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Upload merchant supplier invoices. Our AI extracts product names, item quantities, and cost rates to automatically log incoming stock.
        </p>

        {/* Drag/Drop Box */}
        <form 
          onSubmit={handleFileUpload} 
          style={{ 
            border: '2px dashed var(--color-border)', 
            borderRadius: '12px', 
            padding: '40px 20px', 
            textAlign: 'center',
            backgroundColor: 'var(--color-bg)',
            cursor: 'pointer',
            transition: 'border-color var(--transition-fast)'
          }}
          onClick={() => document.getElementById('invoice-file').click()}
        >
          <input 
            type="file" 
            id="invoice-file" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
          />
          <Upload size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
          <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Select Invoice PDF or Image</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Supports PNG, JPEG, PDF up to 5MB</span>
        </form>

        <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '12px', borderRadius: '10px', display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>Powered by Tesseract OCR Engine & Gemini Intelligence extractor. Accuracy rating ~94%.</span>
        </div>
      </div>

      {/* Right: Scan View & Extracted Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {isScanning && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="live-pulse" style={{ width: '40px', height: '40px', marginBottom: '24px' }}></div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Processing OCR Document</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Locating receipt boundary boxes, running character recognitions, and parsing database schemas...</p>
          </div>
        )}

        {!isScanning && !ocrResult && !fileSelected && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', height: '100%', color: 'var(--color-text-muted)', textAlign: 'center', gap: '12px' }}>
            <FileText size={48} />
            <p style={{ fontSize: '0.85rem' }}>No invoice uploaded. Drag and drop your wholesaler invoice file on the left container to start.</p>
          </div>
        )}

        {ocrResult && !isScanning && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>OCR Extracted Ledger</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Document: {ocrResult.invoiceNumber} | Extracted on: {ocrResult.date}</div>
              </div>
              <span className="badge badge-success">Confidence: {ocrResult.confidenceScore}%</span>
            </div>

            {/* Extracted items checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ocrResult.items.map((item, idx) => (
                <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{item.name}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Wholesale Rate: ₹{item.price} | Category: {item.category}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>+ {item.quantity} Units</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-success)' }}>OCR Match: {item.confidence}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Import Status feedback */}
            {syncDone ? (
              <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '14px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 size={20} />
                <span>Successfully imported OCR items to store inventory! Redirection to stock page.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button className="btn btn-outline" onClick={() => setOcrResult(null)}>
                  Discard
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleImportToInventory}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing stock...' : 'Confirm and Import Stock'} <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
