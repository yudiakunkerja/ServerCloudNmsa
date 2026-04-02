export function playAlarmTone() {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playBeep = (time: number, freq: number) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + time);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + time);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + time + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + time + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime + time);
    osc.stop(audioCtx.currentTime + time + 0.3);
  };

  playBeep(0, 880);
  playBeep(0.3, 880);
  playBeep(0.6, 880);
  playBeep(1, 1046.50);
}
