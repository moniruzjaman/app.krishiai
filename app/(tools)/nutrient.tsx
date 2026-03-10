import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { withRetry, getErrorMsg } from '../../src/utils/network';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

const CROPS = ['ধান (বোরো)', 'ধান (আমন)', 'গম', 'ভুট্টা', 'আলু', 'টমেটো', 'পেঁয়াজ', 'মরিচ', 'বেগুন', 'সরিষা'];
const SOIL_TYPES = ['দোআঁশ', 'বেলে দোআঁশ', 'এঁটেল', 'পলি দোআঁশ'];
const LAND_TYPES = ['উচ্চ', 'মধ্যম', 'নিম্ন'];

export default function NutrientScreen() {
  const router = useRouter();
  const [crop, setCrop] = useState('');
  const [soil, setSoil] = useState('');
  const [land, setLand] = useState('');
  const [area, setArea] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!crop || !soil || !area) {
      Alert.alert('', 'ফসল, মাটির ধরন ও জমির পরিমাণ দিন।');
      return;
    }
    setLoading(true);
    try {
      const prompt = `বাংলাদেশে ${area} শতাংশ ${land || 'মধ্যম'} জমিতে ${soil} মাটিতে ${crop} চাষের জন্য BADC/BRRI/DAE সুপারিশ অনুযায়ী সার ব্যবস্থাপনা বলুন। ইউরিয়া, টিএসপি, এমওপি, জিপসাম সহ পরিমাণ ও প্রয়োগের সময় বিস্তারিত বলুন।`;
      const { text: res } = await chatWithHybridModels(prompt);
      setResult(res);
    } catch {
      Alert.alert('ত্রুটি', 'হিসাব করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← ফিরুন</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚗️ সার হিসাব</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>ফসল নির্বাচন করুন</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CROPS.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, crop === c && styles.chipActive]} onPress={() => setCrop(c)}>
              <Text style={[styles.chipText, crop === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>মাটির ধরন</Text>
        <View style={styles.row}>
          {SOIL_TYPES.map(s => (
            <TouchableOpacity key={s} style={[styles.chip, soil === s && styles.chipActive]} onPress={() => setSoil(s)}>
              <Text style={[styles.chipText, soil === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>জমির উচ্চতা</Text>
        <View style={styles.row}>
          {LAND_TYPES.map(l => (
            <TouchableOpacity key={l} style={[styles.chip, land === l && styles.chipActive]} onPress={() => setLand(l)}>
              <Text style={[styles.chipText, land === l && styles.chipTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>জমির পরিমাণ (শতাংশ)</Text>
        <TextInput
          style={styles.input}
          value={area}
          onChangeText={setArea}
          keyboardType="numeric"
          placeholder="যেমন: 33 (১ বিঘা = ৩৩ শতাংশ)"
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity style={[styles.calcBtn, loading && { opacity: 0.7 }]} onPress={calculate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>হিসাব করুন</Text>}
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>সার সুপারিশ</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0891b2', paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { fontSize: 14, color: '#e0f2fe', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d1d5db', marginRight: 8,
  },
  chipActive: { backgroundColor: '#0891b2', borderColor: '#0891b2' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1f2937', marginBottom: 16, elevation: 1,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  calcBtn: {
    backgroundColor: '#0891b2', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginBottom: 16,
  },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  resultText: { fontSize: 14, color: '#374151', lineHeight: 24 },
});
