import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, ChevronRight, CornerDownRight, ShieldCheck, Sparkles, KeyRound, Mic, MicOff, Volume2, Store } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithOtp, loginWithVoice, register } = useAuth();
  
  const roleParam = searchParams.get('role') || 'customer';
  const [role, setRole] = useState(roleParam);
  const [loginMode, setLoginMode] = useState('otp'); // 'otp' (default like Zepto/Zomato), 'password', 'voice'
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Sign In inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [voicePhrase, setVoicePhrase] = useState('');

  // Sign Up inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('customer');

  // Telemetry & UI States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Sync role selector with URL search param
  useEffect(() => {
    setRole(roleParam);
    clearFormFields();
  }, [roleParam]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const clearFormFields = () => {
    setError('');
    setSuccessMsg('');
    setOtpSent(false);
    setReceivedOtp('');
    setVoicePhrase('');
    setIsVoiceRecording(false);
    
    // Clear inputs
    setEmail('');
    setPassword('');
    setPhone('');
    setOtpCode('');
    
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
  };

  const handleRoleTabClick = (selectedRole) => {
    setRole(selectedRole);
    clearFormFields();
  };

  const handleModeToggle = (mode) => {
    setLoginMode(mode);
    clearFormFields();
  };

  // OTP Flow step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!phone) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      
      setOtpSent(true);
      setReceivedOtp(data.otp);
      setCountdown(30);
      setSuccessMsg('SMS verification code sent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP Flow step 2: Verify & Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpCode) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await loginWithOtp(phone, otpCode, role);
      setSuccessMsg('Login Verified!');
      redirectUser(loggedUser);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Password Login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password, role);
      redirectUser(loggedUser);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Voice Login Biometrics Flow
  const handleVoiceRecordStart = () => {
    setError('');
    setSuccessMsg('');
    setVoicePhrase('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsVoiceRecording(true);
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error: switching to simulation mode", e.error);
        runSimulatedVoiceLogin();
      };

      recognition.onend = () => {
        setIsVoiceRecording(false);
      };

      recognition.onresult = async (event) => {
        const speechText = event.results[0][0].transcript;
        setVoicePhrase(speechText);
        executeVoiceLogin(speechText);
      };

      recognition.start();
    } else {
      runSimulatedVoiceLogin();
    }
  };

  const runSimulatedVoiceLogin = () => {
    setIsVoiceRecording(true);
    setTimeout(() => {
      let phrase = '';
      if (role === 'customer') phrase = 'Aarav Sharma login';
      else if (role === 'shopkeeper') phrase = 'Login as Rajesh Kumar';
      else if (role === 'delivery') phrase = 'Amit Patel';
      else if (role === 'admin') phrase = 'Admin console login';

      setVoicePhrase(phrase);
      setIsVoiceRecording(false);
      executeVoiceLogin(phrase);
    }, 2200);
  };

  const executeVoiceLogin = async (phrase) => {
    setLoading(true);
    try {
      const loggedUser = await loginWithVoice(phrase, role);
      setSuccessMsg(`Voiceprint matched: Authenticated as ${loggedUser.name}!`);
      setTimeout(() => redirectUser(loggedUser), 1000);
    } catch (err) {
      setError(err.message || 'Voiceprint authentication failed. Speak clearly.');
    } finally {
      setLoading(false);
    }
  };

  // SignUp Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        phone: regPhone
      });
      
      // If customer, registration automatically signs them in and redirects
      if (regRole === 'customer') {
        setSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => navigate('/customer'), 1000);
      } else {
        // Driver / shopkeeper needs approvals
        setSuccessMsg('Registration successful! Your merchant/driver account is pending administrator verification. Please wait for an administrator to approve your account before signing in.');
        setIsRegisterMode(false);
        setLoginMode('password');
        setRole(regRole);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (selectedRole, currentMode) => {
    setError('');
    setSuccessMsg('');
    setOtpSent(false);
    setReceivedOtp('');
    setVoicePhrase('');
    setIsVoiceRecording(false);
    
    if (currentMode === 'password') {
      if (selectedRole === 'customer') setEmail('customer@example.com');
      else if (selectedRole === 'shopkeeper') setEmail('shopkeeper@example.com');
      else if (selectedRole === 'delivery') setEmail('delivery@example.com');
      else if (selectedRole === 'admin') setEmail('admin123');
      setPassword(selectedRole === 'admin' ? 'admin123' : 'password');
    } else if (currentMode === 'otp') {
      if (selectedRole === 'customer') setPhone('+91 98765 43210');
      else if (selectedRole === 'shopkeeper') setPhone('+91 87654 32109');
      else if (selectedRole === 'delivery') setPhone('+91 65432 10987');
      else if (selectedRole === 'admin') setPhone('+91 54321 09876');
      setOtpCode('');
    }
  };

  const redirectUser = (loggedUser) => {
    if (loggedUser.role === 'customer') navigate('/customer');
    else if (loggedUser.role === 'shopkeeper') navigate('/shopkeeper');
    else if (loggedUser.role === 'delivery') navigate('/delivery');
    else if (loggedUser.role === 'admin') navigate('/admin');
  };

  return (
    <div style={{ maxWidth: '460px', margin: '50px auto', padding: '0 20px' }}>
      
      {/* Received OTP toast helper */}
      {receivedOtp && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--color-primary)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
            <Sparkles size={14} /> SMS INTERCEPTOR TELEMETRY
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Hackathon Live OTP Intercepted: Enter <strong style={{ color: 'var(--color-text-main)', fontSize: '0.85rem' }}>{receivedOtp}</strong> to authenticate.
          </p>
        </div>
      )}

      <div className="card" style={{ padding: '36px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', backgroundColor: '#FFFFFF' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center', color: 'var(--color-text-main)' }}>
          {isRegisterMode ? 'Partner Sign Up' : 'Sign In to Kirana Connect'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center' }}>
          Real-time Hyperlocal Collaborative Retail Ecosystem
        </p>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 500, lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '20px', fontWeight: 500, lineHeight: 1.4 }}>
            {successMsg}
          </div>
        )}

        {!isRegisterMode ? (
          /* --- SIGN IN PORTLET --- */
          <>
            {/* Portal Role Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', backgroundColor: 'var(--color-bg)', padding: '4px', borderRadius: '10px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
              {['customer', 'shopkeeper', 'delivery', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleTabClick(r)}
                  style={{
                    padding: '8px 2px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    borderRadius: '8px',
                    backgroundColor: role === r ? 'var(--color-card)' : 'transparent',
                    color: role === r ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    boxShadow: role === r ? 'var(--shadow-sm)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {r === 'delivery' ? 'Driver' : r}
                </button>
              ))}
            </div>

            {/* Login Method Toggle */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
              {['otp', 'password', 'voice'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeToggle(mode)}
                  style={{
                    flex: 1,
                    padding: '10px 2px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: loginMode === mode ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: loginMode === mode ? '2px solid var(--color-primary)' : 'none',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {mode === 'otp' ? 'Phone OTP' : (mode === 'voice' ? 'Voice Sign In' : 'Password')}
                </button>
              ))}
            </div>

            {loginMode === 'password' && (
              /* EMAIL PASSWORD FORM */
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Email Address / Username</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      required
                      className="form-control"
                      style={{ paddingLeft: '42px', width: '100%' }}
                      placeholder="you@example.com or admin123"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
                    <input
                      type="password"
                      required
                      className="form-control"
                      style={{ paddingLeft: '42px', width: '100%' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: '12px', fontSize: '0.95rem' }}>
                  {loading ? 'Validating...' : 'Sign In'} <ChevronRight size={18} />
                </button>
              </form>
            )}

            {loginMode === 'otp' && (
              /* PHONE OTP FORM (Zepto/Zomato default) */
              <div>
                {!otpSent ? (
                  <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="form-label">Phone Number</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
                        <input
                          type="tel"
                          required
                          className="form-control"
                          style={{ paddingLeft: '42px', width: '100%' }}
                          placeholder="+91 99999 99999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: '12px', fontSize: '0.95rem' }}>
                      {loading ? 'Sending SMS...' : 'Request OTP Code'} <ChevronRight size={18} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="form-label">Enter 6-Digit OTP</label>
                      <div style={{ position: 'relative' }}>
                        <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          className="form-control"
                          style={{ paddingLeft: '42px', width: '100%', letterSpacing: '4px', fontWeight: 800, textAlign: 'center' }}
                          placeholder="••••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: '12px', fontSize: '0.95rem' }}>
                      {loading ? 'Verifying OTP...' : 'Verify & Sign In'} <ChevronRight size={18} />
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      <span>Didn't get code?</span>
                      {countdown > 0 ? (
                        <span>Resend in {countdown}s</span>
                      ) : (
                        <button type="button" onClick={handleRequestOtp} style={{ color: 'var(--color-primary)', fontWeight: 600, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>Resend OTP</button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {loginMode === 'voice' && (
              /* VOICE BIOMETRIC AUTHENTICATOR */
              <div className="flex-col flex-center text-center" style={{ gap: '20px', padding: '10px 0' }}>
                <div className="icon-container bg-primary-light" style={{ width: '60px', height: '60px', borderRadius: '50%' }}>
                  <Volume2 size={28} />
                </div>
                
                <div>
                  <strong className="text-md" style={{ display: 'block', marginBottom: '4px' }}>Speech Passphrase Ingestor</strong>
                  <p className="text-xs text-muted" style={{ lineHeight: 1.5 }}>
                    Tap the microphone and state your name (e.g. <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>"Aarav Sharma"</span> or <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>"Rajesh Kumar"</span>) to match your voiceprint ledger.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleVoiceRecordStart}
                  disabled={isVoiceRecording || loading}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: isVoiceRecording ? 'var(--color-error)' : 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isVoiceRecording ? '0 0 16px rgba(239, 68, 68, 0.4)' : '0 8px 16px rgba(37, 99, 235, 0.2)',
                    border: '4px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    transform: isVoiceRecording ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {isVoiceRecording ? <MicOff size={28} /> : <Mic size={28} />}
                </button>

                {isVoiceRecording && (
                  <div className="flex-col flex-center">
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-error)', fontWeight: 700 }}>Ingesting audio print...</span>
                    {/* Voice waveform bars */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', height: '16px', alignItems: 'center' }}>
                      <div style={{ width: '3px', height: '10px', backgroundColor: 'var(--color-error)', animation: 'wave 0.5s infinite alternate' }}></div>
                      <div style={{ width: '3px', height: '18px', backgroundColor: 'var(--color-error)', animation: 'wave 0.5s infinite alternate 0.15s' }}></div>
                      <div style={{ width: '3px', height: '8px', backgroundColor: 'var(--color-error)', animation: 'wave 0.5s infinite alternate 0.3s' }}></div>
                    </div>
                    <style>{`
                      @keyframes wave {
                        0% { height: 4px; }
                        100% { height: 18px; }
                      }
                    `}</style>
                  </div>
                )}

                {voicePhrase && (
                  <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '10px 14px', borderRadius: '8px', width: '100%' }}>
                    <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '2px' }}>Ingested Speech Transcription:</span>
                    <strong className="text-sm text-primary">"{voicePhrase}"</strong>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '10px' }}>
                College Review / Hackathon Demo Shortcut:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => fillDemoCredentials(role, loginMode)}
                  style={{ fontSize: '0.75rem', padding: '8px 4px' }}
                >
                  Autofill {role}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setRole('admin');
                    setLoginMode('password');
                    setEmail('admin123');
                    setPassword('admin123');
                  }}
                  style={{ fontSize: '0.75rem', padding: '8px 4px' }}
                >
                  Autofill admin123
                </button>
              </div>
              {loginMode === 'voice' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'var(--color-bg)', padding: '12px', borderRadius: '8px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', gap: '6px', border: '1px solid var(--color-border)' }}>
                  <div>• Customer voicepass: <strong style={{ color: 'var(--color-text-main)' }}>"Aarav Sharma"</strong></div>
                  <div>• Shopkeeper voicepass: <strong style={{ color: 'var(--color-text-main)' }}>"Rajesh Kumar"</strong></div>
                  <div>• Driver voicepass: <strong style={{ color: 'var(--color-text-main)' }}>"Amit Patel"</strong></div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem' }}>
              <span className="text-muted">New partner? </span>
              <button 
                type="button" 
                onClick={() => { setIsRegisterMode(true); clearFormFields(); }} 
                style={{ color: 'var(--color-primary)', fontWeight: 600, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                Register / Sign Up
              </button>
            </div>
          </>
        ) : (
          /* --- SIGN UP REGISTER PORTLET --- */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Register Role selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', backgroundColor: 'var(--color-bg)', padding: '4px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              {['customer', 'shopkeeper', 'delivery'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegRole(r)}
                  style={{
                    padding: '8px 2px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    borderRadius: '8px',
                    backgroundColor: regRole === r ? 'var(--color-card)' : 'transparent',
                    color: regRole === r ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    boxShadow: regRole === r ? 'var(--shadow-sm)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {r === 'delivery' ? 'Driver' : (r === 'shopkeeper' ? 'Merchant' : r)}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  required
                  className="form-control"
                  style={{ paddingLeft: '42px', width: '100%' }}
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
                <input
                  type="email"
                  required
                  className="form-control"
                  style={{ paddingLeft: '42px', width: '100%' }}
                  placeholder="john@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
                <input
                  type="tel"
                  required
                  className="form-control"
                  style={{ paddingLeft: '42px', width: '100%' }}
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
                <input
                  type="password"
                  required
                  className="form-control"
                  style={{ paddingLeft: '42px', width: '100%' }}
                  placeholder="Create password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
            </div>

            {regRole === 'shopkeeper' && (
              <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '12px', borderRadius: '10px', display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-primary)', lineHeight: 1.4 }}>
                <Store size={16} style={{ flexShrink: 0 }} />
                <span>An optimized store profile will be created automatically for your shop in Gurgaon Sector 4 once approved by the administrator.</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: '12px', fontSize: '0.95rem' }}>
              {loading ? 'Creating account...' : 'Create Account'} <ChevronRight size={18} />
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '10px' }}>
              <span className="text-muted">Already have an account? </span>
              <button 
                type="button" 
                onClick={() => { setIsRegisterMode(false); clearFormFields(); }} 
                style={{ color: 'var(--color-primary)', fontWeight: 600, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
