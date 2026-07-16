import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, ChevronRight, CornerDownRight, Play, Terminal } from 'lucide-react';

export default function VoiceInventory() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [nlpResult, setNlpResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const sampleCommands = [
    "Add 20 packets of Amul Gold Milk",
    "Update Britannia Bread stock level to 15",
    "Reduce Farm Fresh Eggs by 8 units",
    "Restock 5 bags of Aashirvaad Chakki Atta"
  ];

  const handleStartRecording = () => {
    setNlpResult(null);
    setSyncDone(false);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setTranscript('Listening for stock commands...');
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        runSimulatedVoiceCommand();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        setTranscript(speechToText);
        handleProcessVoiceCommand(speechToText);
      };

      recognition.start();
    } else {
      runSimulatedVoiceCommand();
    }
  };

  const runSimulatedVoiceCommand = () => {
    setIsRecording(true);
    setTranscript('Listening to spoken stock updates (simulated)...');
    setTimeout(() => {
      const randomCommand = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];
      setTranscript(randomCommand);
      setIsRecording(false);
      handleProcessVoiceCommand(randomCommand);
    }, 2200);
  };

  const handleProcessVoiceCommand = async (spokenText) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ai/voice-inventory', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transcript: spokenText })
      });
      const data = await res.json();
      if (res.ok) {
        setNlpResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyVoiceStock = async () => {
    if (!nlpResult) return;
    setIsProcessing(true);
    try {
      const storeId = user?.storeId || '60d5ec49867c293444747b11';
      const invRes = await fetch(`/api/inventory/store/${storeId}`);
      const invData = await invRes.json();
      const currentItem = invData.inventory.find(i => i.productId._id === nlpResult.product._id);
      
      const prevStock = currentItem ? currentItem.stock : 0;
      const prevPrice = currentItem ? currentItem.price : nlpResult.product.price;
      const adjustment = nlpResult.action === 'decrease' ? -nlpResult.quantity : nlpResult.quantity;
      const nextStock = Math.max(0, prevStock + adjustment);

      const res = await fetch('/api/inventory/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: nlpResult.product._id,
          price: prevPrice,
          stock: nextStock,
          isAvailable: true
        })
      });
      if (res.ok) {
        setSyncDone(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="split-layout-wide-left">
      
      {/* Left Panel: Mic Command Center */}
      <div className="card flex-col flex-center text-center" style={{ padding: '30px' }}>
        <div className="icon-container bg-primary-light" style={{ marginBottom: '16px' }}>
          <Volume2 size={24} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Multilingual Stock Logs</h3>
        <p className="text-sm text-muted" style={{ marginBottom: '24px', lineHeight: 1.5 }}>
          Tap the microphone and state stock changes in English, Hindi, or Hinglish (e.g. "Add 10 packets of milk").
        </p>

        {/* Microphone Ingestion Circle */}
        <button 
          onClick={handleStartRecording}
          disabled={isRecording || isProcessing}
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            backgroundColor: isRecording ? 'var(--color-error)' : 'var(--color-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
            border: '4px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'all var(--transition-normal)',
            transform: isRecording ? 'scale(1.05)' : 'scale(1)',
            marginBottom: '20px'
          }}
        >
          {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
        </button>

        {isRecording ? (
          <div className="flex-col flex-center">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-error)' }}>Ingesting audio wave logs...</span>
            <div style={{ display: 'flex', gap: '4px', marginTop: '12px', height: '20px', alignItems: 'center' }}>
              <div style={{ width: '4px', height: '16px', backgroundColor: 'var(--color-error)', animation: 'voiceBar 0.8s infinite alternate' }}></div>
              <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--color-error)', animation: 'voiceBar 0.8s infinite alternate 0.2s' }}></div>
              <div style={{ width: '4px', height: '12px', backgroundColor: 'var(--color-error)', animation: 'voiceBar 0.8s infinite alternate 0.4s' }}></div>
            </div>
            <style>{`
              @keyframes voiceBar {
                0% { height: 6px; }
                100% { height: 24px; }
              }
            `}</style>
          </div>
        ) : (
          <span className="text-sm text-muted font-bold">Tap microphone to dictate</span>
        )}

        {/* Fast Action Shortcuts */}
        <div style={{ borderTop: '1px solid var(--color-border)', width: '100%', marginTop: '30px', paddingTop: '20px', textAlign: 'left' }}>
          <h4 className="text-xs text-muted" style={{ marginBottom: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Dictation Demo Shortcuts</h4>
          <div className="flex-col gap-sm">
            {sampleCommands.slice(0, 3).map((cmd, i) => (
              <button 
                key={i} 
                className="flex-row"
                onClick={() => { setTranscript(cmd); handleProcessVoiceCommand(cmd); }}
                style={{ 
                  textAlign: 'left', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--color-border)', 
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}
              >
                <Play size={10} fill="var(--color-text-muted)" style={{ color: 'transparent' }} /> {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Parser Diagnostics Log & Output */}
      <div className="flex-col gap-md">
        
        {isProcessing && (
          <div className="card text-center" style={{ padding: '60px 20px' }}>
            <div className="live-pulse" style={{ width: '40px', height: '40px', marginBottom: '24px' }}></div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>AI Parser Processing</h4>
            <p className="text-sm text-muted">Running lexical parser maps, identifying verbs and nouns, and retrieving database indexes...</p>
          </div>
        )}

        {!isProcessing && !nlpResult && !isRecording && (
          <div className="card flex-col flex-center text-muted text-center" style={{ padding: '80px 40px', minHeight: '340px' }}>
            <Mic size={54} style={{ marginBottom: '12px' }} />
            <p className="text-sm">Speech parser offline. Tap the mic or choose a demo log shortcut to dictation streams.</p>
          </div>
        )}

        {nlpResult && !isProcessing && (
          <div className="flex-col gap-md">
            
            {/* Parser Results Card */}
            <div className="card flex-col gap-md">
              <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Speech Parser Output</h4>
                  <div className="text-sm font-bold text-primary" style={{ fontStyle: 'italic', marginTop: '4px' }}>
                    "{transcript}"
                  </div>
                </div>
                <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>Confidence: {nlpResult.confidence}%</span>
              </div>

              {/* Identified Data block */}
              <div className="flex-col gap-sm">
                <div className="glass-card flex-row" style={{ padding: '16px', gap: '12px', alignItems: 'center' }}>
                  <Sparkles size={20} className="text-primary" />
                  <div>
                    <div className="text-xs text-muted" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Semantic Explanation</div>
                    <div className="text-sm font-bold" style={{ marginTop: '2px' }}>{nlpResult.nlpExplanation}</div>
                  </div>
                </div>

                <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <div className="text-xs text-muted">Matched Catalog SKU</div>
                    <strong className="text-md" style={{ color: 'var(--color-text-main)' }}>{nlpResult.product.name}</strong>
                    <div className="text-xs text-muted" style={{ marginTop: '2px' }}>Category: {nlpResult.product.category}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Parsed Intent Action</div>
                    <strong className="text-md" style={{ color: nlpResult.action === 'decrease' ? 'var(--color-error)' : 'var(--color-primary)', textTransform: 'uppercase' }}>
                      {nlpResult.action === 'decrease' ? 'Reduce Stock' : 'Add Stock'}
                    </strong>
                    <div className="text-sm font-bold" style={{ marginTop: '2px' }}>Adjustment: {nlpResult.quantity} units</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion Telemetry Console */}
            <div className="card" style={{ backgroundColor: '#050B14', fontFamily: 'monospace', border: '1px solid #10B981', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Terminal size={12} /> [VYAPAAR LIVE LEXICAL PARSER v1.0.4]</span>
                <span>STATUS: READY</span>
              </div>
              <div style={{ fontSize: '0.8rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>&gt; INGESTING SPEECH UTTERANCE: "{transcript}"</div>
                <div>&gt; TOKENIZING INPUT STRING... DONE</div>
                <div>&gt; ACTION CLASSIFIER MATCHED: <span style={{ color: nlpResult.action === 'decrease' ? '#EF4444' : '#10B981', fontWeight: 700 }}>{nlpResult.action.toUpperCase()}</span></div>
                <div>&gt; DETECTED ENTITY QUANTITY: <span style={{ color: '#FFF' }}>{nlpResult.quantity} units</span></div>
                <div>&gt; SKU RESOLVER SEARCH: "{nlpResult.product.name}"</div>
                <div>&gt; RESOLUTION CONFIDENCE SCORE: <span style={{ color: '#FFF' }}>{nlpResult.confidence}% (EXCELLENT)</span></div>
                <div style={{ color: '#9CA3AF', marginTop: '6px' }}>&gt; Ready to execute database delta update...</div>
              </div>
            </div>

            {/* Confirmation actions */}
            {syncDone ? (
              <div className="bg-primary-light" style={{ padding: '14px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 size={20} />
                <span>Success: Stock levels parsed and catalog record updated.</span>
              </div>
            ) : (
              <div className="flex-row" style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button className="btn btn-outline" onClick={() => setNlpResult(null)}>
                  Discard Ingestion
                </button>
                <button className="btn btn-primary" onClick={handleApplyVoiceStock}>
                  Execute Database Update <ChevronRight size={16} />
                </button>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
