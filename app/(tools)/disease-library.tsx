import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { chatWithHybridModels } from '../../src/services/hybridModelService';
import { CROP_CATEGORIES, CROPS_BY_CATEGORY } from '../../src/constants';

export default function DiseaseLibraryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('cereals');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  const crops = CROPS_BY_CATEGORY[selectedCategory] || [];

  const fetchInfo = async (crop: string) => {
    setSelectedCrop(crop);
    setLoading(true);
    setReport('');
    try {
      const { text } = await chatWithHybridModels(
        `${crop} ফসলের প্রধান রোগ ও পোকামাকড়ের তালিকা দিন। প্রতিটির জন্য: লক্ষণ, জৈব প্রতিকার ও রাসায়নিক প্রতিকার বলুন। BARI/BRRI/DAE সূত্র উল্লেখ করুন।`
      );
      setReport(text);
    } catch { setReport('তথ্য লোড হয়নি। আবার চেষ্টা করুন।'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>📚 রোগ লাইব্রেরি</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catRow}>
          {CROP_CATEGORIES.map(c => (
            <TouchableOpacity key={c.id} style={[s.catChip, selectedCategory === c.id && s.catActive]} onPress={() => { setSelectedCategory(c.id); setSelectedCrop(''); setReport(''); }}>
              <Text style={s.catIcon}>{c.icon}</Text>
              <Text style={[s.catText, selectedCategory === c.id && s.catTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={s.cropGrid}>
          {crops.slice(0, 20).map(crop => (
            <TouchableOpacity key={crop} style={[s.cropBtn, selectedCrop === crop && s.cropBtnActive]} onPress={() => fetchInfo(crop)}>
              <Text style={[s.cropBtnText, selectedCrop === crop && s.cropBtnTextActive]}>{crop}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading && <View style={s.center}><ActivityIndicator size="large" color="#7c3aed" /><Text style={s.loadText}>তথ্য লোড হচ্ছে...</Text></View>}
        {report ? <View style={s.reportCard}><Text style={s.reportTitle}>🌿 {selectedCrop} — রোগ ও পোকা</Text><Text style={s.reportText}>{report}</Text></View> : null}
        {!selectedCrop && !loading && <View style={s.hint}><Text style={s.hintText}>উপরে একটি ফসল বেছে নিন</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#ddd6fe', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  catRow: { paddingHorizontal: 16, paddingVertical: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#ddd6fe' },
  catActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  catIcon: { fontSize: 14, marginRight: 4 },
  catText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  catTextActive: { color: '#fff' },
  cropGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  cropBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9d5ff' },
  cropBtnActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  cropBtnText: { fontSize: 13, color: '#374151' },
  cropBtnTextActive: { color: '#fff' },
  center: { alignItems: 'center', padding: 30 },
  loadText: { marginTop: 10, color: '#7c3aed', fontSize: 14 },
  reportCard: { margin: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  reportTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  reportText: { fontSize: 14, color: '#374151', lineHeight: 24 },
  hint: { alignItems: 'center', padding: 40 },
  hintText: { fontSize: 15, color: '#9ca3af' },
});
