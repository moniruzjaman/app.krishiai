import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Image, ActivityIndicator, Alert, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { analyzeWithHybridModels, type HybridAnalysisResult } from '../../src/services/hybridModelService';
import { getApiStatus, getApiDebugInfo } from '../../src/services/apiKeys';
import { ALL_CROPS } from '../../src/constants';

const TIER_COLORS: Record<string, string> = {
  premium: '#7c3aed',
  free: '#0891b2',
  'rule-based': '#d97706',
};
const TIER_LABELS: Record<string, string> = {
  premium: '⭐ Premium AI',
  free: '🆓 Free AI',
  'rule-based': '📖 Rule-Based',
};

const POPULAR_CROPS = ['ধান', 'গম', 'আলু', 'টমেটো', 'বেগুন', 'পেঁয়াজ', 'সরিষা', 'ভুট্রা', 'আম', 'পাট'];

export default function AnalyzerScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HybridAnalysisResult | null>(null);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [cropSearch, setCropSearch] = useState('');
  const [showAllCrops, setShowAllCrops] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const apiStatus = getApiStatus();

  const displayCrops = cropSearch.trim()
    ? ALL_CROPS.filter(c => c.toLowerCase().includes(cropSearch.toLowerCase())).slice(0, 30)
    : showAllCrops ? ALL_CROPS : POPULAR_CROPS;

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('অনুমতি প্রয়োজন', 'ক্যামেরা/গ্যালারি অ্যাক্সেস করতে অনুমতি দিন।');
      return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, mediaTypes: 'images' })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: 'images' });
    if (!res.canceled && res.assets[0]) {
      setImage(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 || null);
      setResult(null);
    }
  };

  const analyze = async () => {
    if (!imageBase64) {
      Alert.alert('', 'প্রথমে ছবি তুলুন বা গ্যালারি থেকে ছবি বেছে নিন।');
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeWithHybridModels({
        imageBase64,
        mimeType: 'image/jpeg',
        cropFamily: selectedCrop || 'General',
        lang,
        budget: 'free',
      });
      setResult(res);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('Network')) {
        Alert.alert('📡 ইন্টারনেট সংযোগ নেই',
          'WiFi বা মোবাইল ডেটা চালু করে পুনরায় চেষ্টা করুন।\n💡 Rule-Based বিশ্লেষণ অফলাইনেও কাজ করে।',
          [{ text: 'ঠিক আছে' }]);
      } else if (msg.includes('API') || msg.includes('key') || msg.includes('401') || msg.includes('403')) {
        Alert.alert('🔑 AI সেবা অনুপলব্ধ', 'API সমস্যা। Rule-Based বিশ্লেষণ চলছে।', [{ text: 'ঠিক আছে' }]);
      } else {
        Alert.alert('ত্রুটি', msg || 'বিশ্লেষণ ব্যর্থ। পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat: string) =>
    ({ Pest: '#dc2626', Disease: '#ea580c', Deficiency: '#d97706', Other: '#6b7280' }[cat] || '#6b7280');

  const reset = () => { setResult(null); setImage(null); setImageBase64(null); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔬 ফসলের রোগ বিশ্লেষণ</Text>
        <View style={styles.langToggle}>
          {(['bn', 'en'] as const).map(l => (
            <TouchableOpacity key={l} style={[styles.langBtn, lang === l && styles.langBtnActive]} onPress={() => setLang(l)}>
              <Text style={[styles.langText, lang === l && styles.langTextActive]}>{l === 'bn' ? 'বাং' : 'EN'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* API Status Banner */}
        <TouchableOpacity
          onPress={() => setShowDebug(v => !v)}
          style={[styles.apiBanner, apiStatus.gemini ? styles.apiBannerOk : styles.apiBannerWarn]}
        >
          <Text style={styles.apiBannerText}>
            {apiStatus.gemini ? '✅ Gemini AI সক্রিয়' : '⚠️ API কী পাওয়া যাচ্ছে না — Rule-Based মোডে চলছে'}
          </Text>
          <Text style={styles.apiBannerSub}>{showDebug ? '▲ লুকান' : '▼ বিস্তারিত'}</Text>
        </TouchableOpacity>
        {showDebug && (
          <View style={styles.debugBox}>
            <Text style={styles.debugText}>{getApiDebugInfo()}</Text>
          </View>
        )}
        {/* ── STEP 1: Crop Selection ── */}
        <View style={styles.section}>
          <Text style={styles.stepLabel}>ধাপ ১ — ফসল নির্বাচন করুন</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`ফসল খুঁজুন... (${ALL_CROPS.length}টি ফসল)`}
            value={cropSearch}
            onChangeText={setCropSearch}
            placeholderTextColor="#9ca3af"
          />
          {/* Crop chips - use FlatList instead of nested ScrollView */}
          <View style={styles.cropGrid}>
            {displayCrops.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.cropChip, selectedCrop === c && styles.cropChipActive]}
                onPress={() => setSelectedCrop(selectedCrop === c ? '' : c)}
              >
                <Text style={[styles.cropText, selectedCrop === c && styles.cropTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!cropSearch && (
            <TouchableOpacity onPress={() => setShowAllCrops(v => !v)} style={styles.showAllBtn}>
              <Text style={styles.showAllText}>
                {showAllCrops ? '▲ কম দেখান' : `▼ সব দেখান (${ALL_CROPS.length}টি)`}
              </Text>
            </TouchableOpacity>
          )}
          {selectedCrop ? (
            <Text style={styles.selectedCropText}>✅ নির্বাচিত ফসল: {selectedCrop}</Text>
          ) : null}
        </View>

        {/* ── STEP 2: Image Upload ── */}
        <View style={styles.section}>
          <Text style={styles.stepLabel}>ধাপ ২ — ছবি তুলুন বা আপলোড করুন</Text>
          {image ? (
            <View style={styles.imageBox}>
              <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity style={styles.clearBtn} onPress={reset}>
                <Text style={styles.clearBtnText}>✕ পরিবর্তন করুন</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)}>
                <Text style={styles.cameraIcon}>📸</Text>
                <Text style={styles.cameraBtnText}>ক্যামেরা</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cameraBtn, styles.galleryBtn]} onPress={() => pickImage(false)}>
                <Text style={styles.cameraIcon}>🖼️</Text>
                <Text style={[styles.cameraBtnText, { color: '#0A8A1F' }]}>গ্যালারি</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── STEP 3: Analyze Button ── */}
        {image && !result && (
          <View style={styles.section}>
            <Text style={styles.stepLabel}>ধাপ ৩ — বিশ্লেষণ করুন</Text>
            <TouchableOpacity
              style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
              onPress={analyze}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.analyzeBtnText}>🔍 AI বিশ্লেষণ শুরু করুন</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0A8A1F" />
            <Text style={styles.loadingTitle}>AI বিশ্লেষণ চলছে...</Text>
            <Text style={styles.loadingSteps}>Gemini 2.0 → Gemini 1.5 → Llama → Rule-Based</Text>
          </View>
        )}

        {/* ── RESULT ── */}
        {result && !loading && (
          <View style={styles.resultCard}>
            <View style={[styles.modelBadge, { backgroundColor: (TIER_COLORS[result.tier] || '#666') + '18' }]}>
              <View style={[styles.modelDot, { backgroundColor: TIER_COLORS[result.tier] || '#666' }]} />
              <Text style={[styles.modelBadgeText, { color: TIER_COLORS[result.tier] || '#666' }]}>
                {TIER_LABELS[result.tier] || result.tier} · {result.modelUsed}
              </Text>
            </View>

            <View style={[styles.catBadge, { backgroundColor: getCategoryColor(result.category) + '18' }]}>
              <Text style={[styles.catText, { color: getCategoryColor(result.category) }]}>{result.category}</Text>
            </View>

            <Text style={styles.diagnosisTitle}>{result.diagnosis}</Text>

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>নিশ্চয়তা</Text>
              <View style={styles.confBar}>
                <View style={[styles.confFill, {
                  width: `${result.confidence}%` as any,
                  backgroundColor: result.confidence >= 75 ? '#0A8A1F' : result.confidence >= 55 ? '#d97706' : '#dc2626',
                }]} />
              </View>
              <Text style={[styles.confValue, { color: result.confidence >= 75 ? '#0A8A1F' : '#d97706' }]}>
                {result.confidence}%
              </Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.advisoryTitle}>💡 পরামর্শ</Text>
            <Text style={styles.advisoryText}>{result.advisory}</Text>
            {result.officialSource ? <Text style={styles.sourceText}>📌 {result.officialSource}</Text> : null}

            <TouchableOpacity style={styles.logToggle} onPress={() => setShowLog(v => !v)}>
              <Text style={styles.logToggleText}>{showLog ? '▲' : '▼'} মডেল লগ ({result.attemptLog.length} ধাপ)</Text>
            </TouchableOpacity>

            {showLog && (
              <View style={styles.logBox}>
                {result.attemptLog.map((e, i) => (
                  <View key={i} style={{ marginBottom: 4 }}>
                    <Text style={e.status === 'success' ? styles.logSuccess : styles.logFail}>
                      {e.status === 'success' ? '✅' : '❌'} {e.model}
                    </Text>
                    {e.reason ? <Text style={styles.logReason}>{e.reason}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.retryBtn} onPress={reset}>
              <Text style={styles.retryText}>🔄 নতুন বিশ্লেষণ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info card when idle */}
        {!image && !result && (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>🤖 AI ক্যাসকেড সিস্টেম</Text>
            {[
              ['⭐', 'Gemini 2.0 Flash — সেরা মানের AI বিশ্লেষণ'],
              ['🆓', 'Gemini 1.5 / Llama — বিনামূল্যে ফলব্যাক'],
              ['📖', 'Rule-Based — অফলাইনেও কাজ করে'],
            ].map(([icon, tip], i) => (
              <Text key={i} style={styles.tipItem}>{icon} {tip}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0A8A1F', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  langBtnActive: { backgroundColor: '#fff' },
  langText: { fontSize: 12, color: '#d1fae5', fontWeight: '600' },
  langTextActive: { color: '#0A8A1F' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 12, elevation: 2,
  },
  stepLabel: { fontSize: 13, fontWeight: '700', color: '#0A8A1F', marginBottom: 10 },
  searchInput: {
    backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: '#1f2937',
    borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10,
  },
  cropGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cropChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#f0f7f0', borderWidth: 1.5, borderColor: '#d1fae5',
  },
  cropChipActive: { backgroundColor: '#0A8A1F', borderColor: '#0A8A1F' },
  cropText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  cropTextActive: { color: '#fff' },
  showAllBtn: { paddingVertical: 8, alignItems: 'center', marginTop: 4 },
  showAllText: { fontSize: 12, color: '#0A8A1F', fontWeight: '600' },
  selectedCropText: { fontSize: 12, color: '#059669', fontWeight: '700', marginTop: 8 },
  imageBox: { borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 220 },
  clearBtn: { backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 10, alignItems: 'center' },
  clearBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10 },
  cameraBtn: {
    flex: 1, backgroundColor: '#0A8A1F', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  galleryBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#0A8A1F' },
  cameraIcon: { fontSize: 20 },
  cameraBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  analyzeBtn: {
    backgroundColor: '#0A8A1F', borderRadius: 12,
    paddingVertical: 18, alignItems: 'center',
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingBox: { alignItems: 'center', padding: 24 },
  loadingTitle: { fontSize: 15, fontWeight: '700', color: '#0A8A1F', marginTop: 12 },
  loadingSteps: { fontSize: 11, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3 },
  modelBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8,
  },
  modelDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  modelBadgeText: { fontSize: 11, fontWeight: '700' },
  catBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20, marginBottom: 8,
  },
  catText: { fontSize: 12, fontWeight: '700' },
  diagnosisTitle: { fontSize: 19, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confLabel: { fontSize: 12, color: '#6b7280', width: 48 },
  confBar: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4 },
  confFill: { height: '100%', borderRadius: 4 },
  confValue: { fontSize: 12, fontWeight: '700', width: 36 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  advisoryTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  advisoryText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  sourceText: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  logToggle: { marginTop: 12, paddingVertical: 8, alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8 },
  logToggleText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  logBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, marginTop: 6 },
  logSuccess: { fontSize: 12, color: '#059669', fontWeight: '600' },
  logFail: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  logReason: { fontSize: 11, color: '#9ca3af', marginLeft: 18 },
  retryBtn: { backgroundColor: '#f0f7f0', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  retryText: { color: '#0A8A1F', fontWeight: '700' },
  tipCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  tipTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  tipItem: { fontSize: 13, color: '#374151', marginBottom: 6 },
  apiBanner: {
    borderRadius: 10, padding: 12, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  apiBannerOk: { backgroundColor: '#d1fae5' },
  apiBannerWarn: { backgroundColor: '#fef3c7' },
  apiBannerText: { fontSize: 13, fontWeight: '700', color: '#1f2937', flex: 1 },
  apiBannerSub: { fontSize: 11, color: '#6b7280', marginLeft: 8 },
  debugBox: { backgroundColor: '#1f2937', borderRadius: 8, padding: 12, marginBottom: 12 },
  debugText: { fontSize: 11, color: '#4ade80', fontFamily: 'monospace', lineHeight: 18 },
});
