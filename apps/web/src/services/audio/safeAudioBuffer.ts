/**
 * Sonora Academy - Safe Web Audio / Tone.js AudioBuffer Protections
 *
 * Prevents fatal Web Audio API and Tone.js exceptions:
 * "channelData must be a non-empty array at Object.createBuffer"
 * and "The number of frames provided (0) is less than the minimum bound (1)".
 */

/**
 * Valida estrictamente que channelData contenga muestras válidas antes de procesar o crear buffers.
 */
export function validateChannelData(channelData?: Float32Array | number[] | null): boolean {
  if (!channelData || channelData.length === 0) {
    console.warn("Se previno la creación de un AudioBuffer vacío.");
    return false;
  }
  return true;
}

/**
 * Generador sintético seguro de AudioBuffer (metrónomo, impulsos, clics o silencios).
 * Garantiza que la longitud sea como mínimo 1 muestra según la especificación de Web Audio API.
 */
export function createSafeAudioBuffer(
  audioContext: BaseAudioContext | AudioContext,
  numberOfChannels = 1,
  duration = 0.05,
  sampleRate?: number
): AudioBuffer | null {
  try {
    const sr = sampleRate || audioContext?.sampleRate || 44100;
    if (sr <= 0) {
      console.warn("Se previno la creación de un AudioBuffer con sampleRate <= 0:", sr);
      return null;
    }
    const safeChannels = Math.max(1, numberOfChannels || 1);
    const safeLength = Math.max(1, Math.floor(sr * (duration || 0.05)));
    const buffer = audioContext.createBuffer(safeChannels, safeLength, sr);

    // Validar canales creados
    for (let c = 0; c < safeChannels; c++) {
      const channelData = buffer.getChannelData(c);
      if (!channelData || channelData.length === 0) {
        console.warn("Se previno la creación de un AudioBuffer vacío.");
        return null;
      }
    }

    return buffer;
  } catch (err) {
    console.warn("Se previno fallo al crear AudioBuffer:", err);
    return null;
  }
}

/**
 * Instala protecciones globales contra buffers vacíos en Web Audio API y Tone.js
 * en el entorno del navegador.
 */
export function installAudioBufferProtections(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Proteger AudioContext.prototype.createBuffer
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx && AudioCtx.prototype && !(AudioCtx.prototype.createBuffer as any)?.__protected) {
      const origCreateBuffer = AudioCtx.prototype.createBuffer;
      AudioCtx.prototype.createBuffer = function (
        numberOfChannels: number,
        length: number,
        sampleRate: number
      ) {
        const safeChannels = Math.max(1, numberOfChannels || 1);
        const sr = sampleRate > 0 ? sampleRate : (this.sampleRate > 0 ? this.sampleRate : 44100);
        const safeLength = Math.max(1, length > 0 ? length : Math.floor(sr * 0.05));
        return origCreateBuffer.call(this, safeChannels, safeLength, sr);
      };
      (AudioCtx.prototype.createBuffer as any).__protected = true;
    }

    // 2. Proteger OfflineAudioContext si existe
    const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (OfflineCtx && OfflineCtx.prototype && !(OfflineCtx.prototype.createBuffer as any)?.__protected) {
      const origOfflineCreateBuffer = OfflineCtx.prototype.createBuffer;
      OfflineCtx.prototype.createBuffer = function (
        numberOfChannels: number,
        length: number,
        sampleRate: number
      ) {
        const safeChannels = Math.max(1, numberOfChannels || 1);
        const sr = sampleRate > 0 ? sampleRate : (this.sampleRate > 0 ? this.sampleRate : 44100);
        const safeLength = Math.max(1, length > 0 ? length : Math.floor(sr * 0.05));
        return origOfflineCreateBuffer.call(this, safeChannels, safeLength, sr);
      };
      (OfflineCtx.prototype.createBuffer as any).__protected = true;
    }
  } catch (e) {
    console.warn('[safeAudioBuffer] No se pudo parchar AudioContext prototype:', e);
  }

  // 3. Proteger Tone.ToneAudioBuffer si Tone está cargado
  try {
    import('tone').then((Tone) => {
      if (Tone && Tone.ToneAudioBuffer) {
        // Parchar Tone.ToneAudioBuffer.fromArray (estático)
        const origStaticFromArray = Tone.ToneAudioBuffer.fromArray;
        if (origStaticFromArray && !(origStaticFromArray as any).__protected) {
          Tone.ToneAudioBuffer.fromArray = function (array: any) {
            if (!array || array.length === 0 || (Array.isArray(array) && array[0]?.length === 0)) {
              console.warn("Se previno la creación de un AudioBuffer vacío.");
              const dummy = new Float32Array(1);
              return origStaticFromArray.call(Tone.ToneAudioBuffer, dummy);
            }
            return origStaticFromArray.call(Tone.ToneAudioBuffer, array);
          };
          (Tone.ToneAudioBuffer.fromArray as any).__protected = true;
        }

        // Parchar Tone.ToneAudioBuffer.prototype.fromArray (instancia)
        const origProtoFromArray = Tone.ToneAudioBuffer.prototype.fromArray;
        if (origProtoFromArray && !(origProtoFromArray as any).__protected) {
          Tone.ToneAudioBuffer.prototype.fromArray = function (array: any) {
            if (!array || array.length === 0 || (Array.isArray(array) && array[0]?.length === 0)) {
              console.warn("Se previno la creación de un AudioBuffer vacío.");
              const dummy = new Float32Array(1);
              return origProtoFromArray.call(this, dummy);
            }
            return origProtoFromArray.call(this, array);
          };
          (Tone.ToneAudioBuffer.prototype.fromArray as any).__protected = true;
        }
      }
    }).catch(() => {});
  } catch (_) {}
}

// Ejecutar automáticamente al importar en navegador
if (typeof window !== 'undefined') {
  installAudioBufferProtections();
}
