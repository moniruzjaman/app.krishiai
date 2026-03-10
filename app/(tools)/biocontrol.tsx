import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { chatWithHybridModels } from '../../src/services/hybridModelService';
import { withRetry, getErrorMsg } from '../../src/utils/network';

const CATEGORIES = [
  { id: 'all', label: 'সব', icon: '🌿' },
  { id: 'macrobial', label: 'শিকারি পোকা', icon: '🐞' },
  { id: 'microbial', label: 'অণুজীব', icon: '🦠' },
  { id: 'botanical', label: 'উদ্ভিজ্জ', icon: '🌱' },
  { id: 'physical', label: 'ভৌত পদ্ধতি', icon: '💡' },
];

const AGENTS = [
  { category: 'macrobial', title: 'লেডিবার্ড বিটল', desc: 'এফিড ও সাদামাছি দমনে কার্যকর শিকারি পোকা।', icon: '🐞' },
  { category: 'macrobial', title: 'ট্রাইকোগ্রামা', desc: 'ডিমের পরজীবী — মাজরা পোকার ডিম নষ্ট করে।', icon: '🦋' },
  { category: 'microbial', title: 'Bt বায়োপেস্টিসাইড', desc: 'Bacillus thuringiensis — লেদা পোকা দমনে আন্তর্জাতিকভাবে স্বীকৃত।', icon: '🦠' },
  { category: 'microbial', title: 'ট্রাইকোডার্মা', desc: 'মাটিবাহিত ছত্রাকজনিত রোগ প্রতিরোধে কার্যকর।', icon: '🍄' },
  { category: 'botanical', title: 'নিম তেল স্প্রে', desc: '৫মিলি/লিটার হারে স্প্রে করলে বেশিরভাগ পোকা দমন হয়।', icon: '🌿' },
  { category: 'botanical', title: 'রসুন-মরিচ স্প্রে', desc: 'ঘরে তৈরি জৈব কীটনাশক — সস্তা ও কার্যকর।', icon: '🧄' },
  { category: 'physical', title: 'আলোক ফাঁদ', desc: 'রাতে আলো জ্বেলে পোকা আকর্ষণ করে ধ্বংস করা।', icon: '💡' },
  { category: 'physical', title: 'ফেরোমন ফাঁদ', desc: 'মাজরা পোকার পুরুষ পোকা ধরার জন্য কার্যকর।', icon: '🪤' },
];

export default function BiocontrolScreen() {
  const router = useRouter();
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = cat === 'all' ? AGENTS : AGENTS.filter(a => a.category === cat);

  const askExpert = async () => {
    if (!query.trim()) return;
    setLoading(true); setAdvice('');
    try {
      const { text } = await chatWithHybridModels(
        `জৈবিক বালাই দমন বিশেষজ্ঞ হিসেবে উত্তর দিন: ${query}। DAE/BARI অনুমোদিত পদ্ধতি ব্যবহার করুন।`
      );
      setAdvice(text);
    } catch (e) {
      setAdvice(`❌ ${getErrorMsg(e)}`);
    }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>🐞 জৈব বালাই দমন</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.id} style={[s.catChip, cat === c.id && s.catActive]} onPress={() => setCat(c.id)}>
              <Text style={s.catIcon}>{c.icon}</Text>
              <Text style={[s.catText, cat === c.id && s.catTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Agent cards */}
        <View style={s.grid}>
          {filtered.map((a, i) => (
            <TouchableOpacity key={i} style={s.card} onPress={() => setQuery(`${a.title} সম্পর্কে বিস্তারিত বলুন`)}>
              <Text style={s.cardIcon}>{a.icon}</Text>
              <Text style={s.cardTitle}>{a.title}</Text>
              <Text style={s.cardDesc}>{a.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ask expert */}
        <View style={s.askBox}>
          <Text style={s.askTitle}>🤖 বিশেষজ্ঞকে জিজ্ঞাসা করুন</Text>
          <TextInput style={s.input} value={query} onChangeText={setQuery} placeholder="যেমন: ধানের মাজরা পোকার জৈব সমাধান কী?" placeholderTextColor="#9ca3af" multiline />
          <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={askExpert} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>বিশেষজ্ঞের মত নিন</Text>}
          </TouchableOpacity>
          {advice ? <View style={s.adviceBox}><Text style={s.adviceText}>{advice}</Text></View> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#166534', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#bbf7d0', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  catRow: { paddingHorizontal: 16, paddingVertical: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#dcfce7' },
  catActive: { backgroundColor: '#166534', borderColor: '#166534' },
  catIcon: { fontSize: 14, marginRight: 4 },
  catText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  catTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, paddingBottom: 8 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 2, alignItems: 'center' },
  cardIcon: { fontSize: 30, marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', textAlign: 'center', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
  askBox: { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  askTitle: { fontSize: 15, fontWeight: '700', color: '#166534', marginBottom: 10 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, fontSize: 14, color: '#1f2937', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10, minHeight: 60 },
  btn: { backgroundColor: '#166534', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  adviceBox: { marginTop: 12, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12 },
  adviceText: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
