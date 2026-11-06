/**
 * Gemini Live API Client Service (gemini-3.8-live)
 * Connects to server WebSocket bridge on /live
 * 16kHz microphone capture -> 24kHz gapless playback
 */

export interface LiveVoiceCallbacks {
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error', message?: string) => void;
  onUserTranscript?: (text: string) => void;
  onAiTranscript?: (text: string) => void;
  onVolumeChange?: (volume: number) => void;
}

export class LiveVoiceClient {
  private ws: WebSocket | null = null;
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private callbacks: LiveVoiceCallbacks = {};
  private isConnected: boolean = false;

  constructor(callbacks: LiveVoiceCallbacks) {
    this.callbacks = callbacks;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;
    this.callbacks.onStatusChange?.('connecting', 'Đang kết nối tới Bình Luận Viên AI...');

    try {
      // 1. Request microphone stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Setup AudioContexts: 16kHz input, 24kHz output
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputCtx = new AudioCtx({ sampleRate: 16000 });
      this.outputCtx = new AudioCtx({ sampleRate: 24000 });

      // Resume if suspended
      if (this.inputCtx.state === 'suspended') await this.inputCtx.resume();
      if (this.outputCtx.state === 'suspended') await this.outputCtx.resume();

      // 3. Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.callbacks.onStatusChange?.('connected', 'Đã kết nối! Bạn có thể nói chuyện trực tiếp.');
        this.startMicCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            this.callbacks.onStatusChange?.('speaking', 'Bình Luận Viên đang nói...');
            this.playAudioChunk(msg.audio);
          }
          if (msg.transcript) {
            this.callbacks.onAiTranscript?.(msg.transcript);
          }
          if (msg.userTranscript) {
            this.callbacks.onUserTranscript?.(msg.userTranscript);
          }
          if (msg.interrupted) {
            this.stopAllPlayback();
            this.callbacks.onStatusChange?.('listening', 'Đang lắng nghe bạn...');
          }
        } catch {
          // message parse ignore
        }
      };

      this.ws.onerror = (e) => {
        console.warn('Live API WS Error:', e);
        this.callbacks.onStatusChange?.('error', 'Lỗi kết nối giọng nói.');
      };

      this.ws.onclose = () => {
        this.disconnect();
      };
    } catch (err: any) {
      console.warn('Live API connection failed:', err);
      this.disconnect();
      this.callbacks.onStatusChange?.('error', err?.message || 'Không thể truy cập microphone.');
      throw err;
    }
  }

  private startMicCapture() {
    if (!this.inputCtx || !this.mediaStream || !this.ws) return;

    const source = this.inputCtx.createMediaStreamSource(this.mediaStream);
    // Buffer size 4096 gives ~0.25s chunks at 16kHz
    this.processor = this.inputCtx.createScriptProcessor(4096, 1, 1);

    source.connect(this.processor);
    this.processor.connect(this.inputCtx.destination);

    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Simple RMS volume indicator
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.callbacks.onVolumeChange?.(Math.min(1, rms * 5));

      // Convert Float32Array to 16-bit PCM little-endian
      const base64Pcm = this.floatTo16BitPCMBase64(inputData);
      this.ws.send(JSON.stringify({ audio: base64Pcm }));
    };
  }

  // Convert Float32 [-1, 1] to Base64 Int16 Little-Endian
  private floatTo16BitPCMBase64(input: Float32Array): string {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Play gapless 24kHz PCM chunk
  private playAudioChunk(base64Audio: string) {
    if (!this.outputCtx) return;

    try {
      const binary = window.atob(base64Audio);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Convert 16-bit PCM to Float32
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const numSamples = bytes.byteLength / 2;
      const float32 = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32[i] = int16 / 32768;
      }

      const audioBuffer = this.outputCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const sourceNode = this.outputCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputCtx.destination);

      const currentTime = this.outputCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.05; // tiny buffer
      }

      sourceNode.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(sourceNode);
      sourceNode.onended = () => {
        const idx = this.activeSources.indexOf(sourceNode);
        if (idx > -1) this.activeSources.splice(idx, 1);
        if (this.activeSources.length === 0) {
          this.callbacks.onStatusChange?.('listening', 'Đang lắng nghe...');
        }
      };
    } catch (err) {
      console.warn('Error playing audio chunk:', err);
    }
  }

  private stopAllPlayback() {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {}
    }
    this.activeSources = [];
    if (this.outputCtx) {
      this.nextStartTime = this.outputCtx.currentTime;
    }
  }

  public disconnect() {
    this.stopAllPlayback();

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.inputCtx) {
      this.inputCtx.close().catch(() => {});
      this.inputCtx = null;
    }
    if (this.outputCtx) {
      this.outputCtx.close().catch(() => {});
      this.outputCtx = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.callbacks.onStatusChange?.('disconnected', 'Đã tắt đàm thoại giọng nói.');
  }
}
