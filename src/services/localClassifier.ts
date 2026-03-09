/**
 * KrishiAI — Local MobileNetV2 Classifier (PENDING MODEL)
 *
 * STATUS: Disabled until crop_disease.tflite is trained and added.
 * All functions return null safely — app falls through to cloud vision.
 *
 * TO ENABLE:
 *   1. Run ml/train_crop_disease_model.ipynb in Google Colab
 *   2. Copy crop_disease.tflite → assets/models/
 *   3. Add to package.json: "react-native-fast-tflite": "1.4.0"
 *   4. Add to app.json plugins: "react-native-fast-tflite"
 *   5. Set MODEL_READY = true below
 */

export interface LocalClassifierResult {
  diseaseKey: string;
  confidence: number;
  isHighConfidence: boolean;
  allScores: { label: string; score: number }[];
  source: 'local-tflite';
}

// ── Toggle this to true after adding crop_disease.tflite ─────────────────────
const MODEL_READY = false;

const CLASS_NAMES = [
  'brinjal_borer', 'healthy', 'nitrogen_deficiency', 'potato_late_blight',
  'rice_blast', 'rice_blight', 'rice_brown_spot', 'rice_sheath_blight',
  'rice_stem_borer', 'tomato_blight', 'tomato_leaf_curl', 'wheat_rust',
  'zinc_deficiency',
];

const CONFIDENCE_THRESHOLD = 0.70;
const IMG_SIZE = 224;
let modelInstance: any = null;

export async function loadLocalModel(): Promise<boolean> {
  if (!MODEL_READY) return false;
  if (modelInstance) return true;
  try {
    const { loadTensorflowModel } = require('react-native-fast-tflite');
    const { Asset } = require('expo-asset');
    const asset = Asset.fromModule(require('../../assets/models/crop_disease.tflite'));
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error('Asset unavailable');
    modelInstance = await loadTensorflowModel({ url: asset.localUri });
    console.log('[LocalClassifier] ✅ MobileNetV2 loaded');
    return true;
  } catch (err) {
    console.warn('[LocalClassifier] Load failed:', err);
    return false;
  }
}

export async function classifyLocally(
  base64Image: string
): Promise<LocalClassifierResult | null> {
  if (!MODEL_READY) return null;
  try {
    if (!modelInstance) {
      const ok = await loadLocalModel();
      if (!ok) return null;
    }
    const FileSystem = require('expo-file-system');
    const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');

    const tempPath = `${FileSystem.cacheDirectory}tflite_${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(tempPath, base64Image, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const resized = await manipulateAsync(
      tempPath,
      [{ resize: { width: IMG_SIZE, height: IMG_SIZE } }],
      { format: SaveFormat.JPEG, compress: 0.95 }
    );
    const resizedB64: string = await FileSystem.readAsStringAsync(resized.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
    await FileSystem.deleteAsync(resized.uri, { idempotent: true }).catch(() => {});

    // Build pixel array for TFLite
    const binaryStr = atob(resizedB64);
    const pixels = new Uint8Array(IMG_SIZE * IMG_SIZE * 3);
    const skip = Math.min(600, Math.floor(binaryStr.length * 0.1));
    const stride = Math.max(1, Math.floor((binaryStr.length - skip) / pixels.length));
    for (let i = 0; i < pixels.length; i++) {
      pixels[i] = binaryStr.charCodeAt(Math.min(skip + i * stride, binaryStr.length - 1));
    }

    const outputs: any[] = await modelInstance.run([pixels]);
    const raw: number[] = Array.from(outputs[0] as ArrayLike<number>);
    const total = raw.reduce((a, b) => a + b, 0);
    const probs = raw.map(v => total > 0 ? v / total : 0);
    const maxIdx = probs.indexOf(Math.max(...probs));
    const confidence = probs[maxIdx] ?? 0;
    const diseaseKey = CLASS_NAMES[maxIdx] ?? 'unknown';

    return {
      diseaseKey,
      confidence,
      isHighConfidence: confidence >= CONFIDENCE_THRESHOLD,
      allScores: CLASS_NAMES.map((l, i) => ({ label: l, score: probs[i] ?? 0 }))
        .sort((a, b) => b.score - a.score),
      source: 'local-tflite',
    };
  } catch (err) {
    console.warn('[LocalClassifier] Inference error:', err);
    return null;
  }
}

export function isLocalModelAvailable(): boolean {
  return MODEL_READY;
}
