import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, ChevronRight, CornerDownRight, Play } from 'lucide-react';

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
    }, 2500);
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
      // Fetch current stock from inventory
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
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px' }}>
      
      {/* Left panel: Mic Dictator */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', color: 'var(--color-primary)', marginBottom: '16px' }}>
          <Volume2 size={24} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Multilingual Voice Updates</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '24px' }}>
          Tap the microphone, dictate stock updates in Hindi, English or Hinglish, and watch AI parse and apply them instantly.
        </p>

        {/* Mic Circle */}
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
            boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.4)',
            border: '4px solid white',
            cursor: 'pointer',
            transition: 'all var(--transition-normal)',
            transform: isRecording ? 'scale(1.05)' : 'scale(1)',
            marginBottom: '20px'
          }}
        >
          {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
        </button>

        {isRecording ? (
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-error)' }}>Recoding audio logs...</span>
            <div className="audio-visualizer" style={{ marginTop: '12px' }}>
              <div className="visualizer-bar active" style={{ animationDelay: '0.1s' }}></div>
              <div className="visualizer-bar active" style={{ animationDelay: '0.3s' }}></div>
              <div className="visualizer-bar active" style={{ animationDelay: '0.5s' }}></div>
              <div className="visualizer-bar active" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Tap to record voice log</span>
        )}

        {/* Suggested utterances helper */}
        <div style={{ borderTop: '1px solid var(--color-border)', width: '100%', marginTop: '30px', paddingTop: '20px', textAlign: 'left' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px' }}>Try Spoken Commands:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {sampleCommands.slice(0, 3).map((cmd, i) => (
              <button 
                key={i} 
                onClick={() => { setTranscript(cmd); handleProcessVoiceCommand(cmd); }}
                style={{ 
                  textAlign: 'left', 
                  padding: '6px 8px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--color-border)', 
                  backgroundColor: 'var(--color-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Play size={10} fill="var(--color-text-muted)" /> {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: NLP parsing results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {isProcessing && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="live-pulse" style={{ width: '40px', height: '40px', marginBottom: '24px' }}></div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>AI Speech Parser running</h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Translating speech wave files and tokenizing lexical entities...</p>
          </div>
        )}

        {!isProcessing && !nlpResult && !isRecording && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', height: '100%', color: 'var(--color-text-muted)', textAlign: 'center', gap: '12px' }}>
            <Mic size={48} />
            <p style={{ fontSize: '0.85rem' }}>Microphone inactive. Tap the icon or select a suggested command on the left to test natural speech parsing.</p>
          </div>
        )}

        {nlpResult && !isProcessing && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Speech Parsing Result</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                  "{transcript}"
                </div>
              </div>
              <span className="badge badge-success">Confidence: {nlpResult.confidence}%</span>
            </div>

            {/* Parsing Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>AI Semantic Explanation</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>{nlpResult.nlpExplanation}</div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Identified Product</div>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>{nlpResult.product.name}</strong>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Category: {nlpResult.product.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Requested Action</div>
                  <strong style={{ fontSize: '1rem', color: nlpResult.action === 'decrease' ? 'var(--color-error)' : 'var(--color-primary)', textTransform: 'uppercase' }}>
                    {nlpResult.action === 'decrease' ? 'Reduce Stock' : 'Add Stock'}
                  </strong>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Qty adjustment: {nlpResult.quantity} {nlpResult.product.unit}s</div>
                </div>
              </div>
            </div>

            {syncDone ? (
              <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '14px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 size={20} />
                <span>Successfully updated stock using speech processing logs!</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button className="btn btn-outline" onClick={() => setNlpResult(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleApplyVoiceStock}>
                  Confirm Voice Log Update <ChevronRight size={16} />
                </button>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
