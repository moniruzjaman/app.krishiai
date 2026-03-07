import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Slider } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const LEVELS = [
  { id: 1, title: 'সম্পূর্ণ সালোকসংশ্লেষণ', subtitle: 'লেভেল ১: শর্করা ব্যবস্থাপনা', icon: '☀️', color: '#4ade80', brixRange: '১-৪', resistance: 'ফুসারিয়াম, ভার্টিসিলিয়াম', minerals: ['N', 'Fe', 'Mn', 'P'], desc: 'Brix ৩-৫ এর নিচে থাকলে গাছকে জোর করে খাবার দিতে হয়। এই স্তরে গাছ জটিল কার্বোহাইড্রেট তৈরি শুরু করে।' },
  { id: 2, title: 'সম্পূর্ণ প্রোটিন সংশ্লেষণ', subtitle: 'লেভেল ২: প্যাসিভ ইমিউনিটি', icon: '🧪', color: '#22c55e', brixRange: '৪-৭', resistance: 'লার্ভা, চোষক পোকা, এফিড', minerals: ['Mg', 'S', 'Mo'], desc: 'নাইট্রোজেন দ্রুত প্রোটিনে রূপান্তরিত হয়, ফলে চোষক পোকার জন্য কোনো খাবার থাকে না।' },
  { id: 3, title: 'লিপিড সংশ্লেষণ', subtitle: 'লেভেল ৩: উদ্বৃত্ত শক্তি সঞ্চয়', icon: '🛡️', color: '#16a34a', brixRange: '৮-১২', resistance: 'বায়ুবাহিত রোগজীবাণু ও চিবানো পোকা', minerals: ['Microbial', 'B'], desc: 'পাতার উপরিভাগে মোমের স্তর তৈরি হয় যা ছত্রাক ও ব্যাকটেরিয়া প্রতিরোধ করে।' },
  { id: 4, title: 'উন্নত সেকেন্ডারি মেটাবোলাইট', subtitle: 'লেভেল ৪: সম্পূর্ণ প্রতিরোধ', icon: '🧬', color: '#166534', brixRange: '১২+', resistance: 'সব ধরনের পোকা, ছত্রাক ও ভাইরাস', minerals: ['Chitin', 'Fulvic Acid', 'Seaweed'], desc: 'উদ্ভিদ ফাইটোঅ্যালেক্সিন তৈরি করে। এটি প্রকৃতপক্ষে সুস্থ অবস্থা।' },
];

function getBrixLevel(brix: number) {
  if (brix >= 12) return 4;
  if (brix >= 8) return 3;
  if (brix >= 4) return 2;
  return 1;
}

export default function PlantDefenseScreen() {
  const router = useRouter();
  const [brix, setBrix] = useState(5);
  const [selected, setSelected] = useState(2);
  const currentLevel = getBrixLevel(brix);
  const level = LEVELS.find(l => l.id === selected) || LEVELS[0];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>🛡️ উদ্ভিদ প্রতিরোধ গাইড</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* Brix slider */}
        <View style={s.brixCard}>
          <Text style={s.brixTitle}>আপনার Brix মান</Text>
          <Text style={s.brixValue}>{brix}</Text>
          <View style={s.sliderRow}>
            <Text style={s.sliderMin}>1</Text>
            <View style={{ flex: 1 }}>
              {/* Simple +/- since Slider needs extra package */}
              <View style={s.brixBtns}>
                <TouchableOpacity style={s.brixBtn} onPress={() => { const v = Math.max(1, brix - 1); setBrix(v); setSelected(getBrixLevel(v)); }}><Text style={s.brixBtnText}>−</Text></TouchableOpacity>
                <View style={s.brixBar}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => (
                    <TouchableOpacity key={n} onPress={() => { setBrix(n); setSelected(getBrixLevel(n)); }} style={[s.brixDot, { backgroundColor: n <= brix ? '#0A8A1F' : '#e5e7eb' }]} />
                  ))}
                </View>
                <TouchableOpacity style={s.brixBtn} onPress={() => { const v = Math.min(20, brix + 1); setBrix(v); setSelected(getBrixLevel(v)); }}><Text style={s.brixBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>
            <Text style={s.sliderMax}>20+</Text>
          </View>
          <Text style={s.brixLevel}>বর্তমান স্তর: লেভেল {currentLevel}</Text>
        </View>

        {/* Pyramid levels */}
        <Text style={s.sectionTitle}>প্রতিরোধ পিরামিড</Text>
        {[...LEVELS].reverse().map(l => (
          <TouchableOpacity key={l.id} style={[s.levelCard, selected === l.id && s.levelCardActive, { borderColor: l.color }]} onPress={() => setSelected(l.id)}>
            <View style={[s.levelHeader, { backgroundColor: l.color + '20' }]}>
              <Text style={s.levelIcon}>{l.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.levelTitle, { color: l.color }]}>{l.subtitle}</Text>
                <Text style={s.levelBrix}>Brix: {l.brixRange}</Text>
              </View>
              {currentLevel === l.id && <View style={[s.currentBadge, { backgroundColor: l.color }]}><Text style={s.currentBadgeText}>আপনি এখানে</Text></View>}
            </View>
            {selected === l.id && (
              <View style={s.levelDetails}>
                <Text style={s.levelDesc}>{l.desc}</Text>
                <Text style={s.detailLabel}>প্রতিরোধ করে:</Text>
                <Text style={s.detailVal}>{l.resistance}</Text>
                <Text style={s.detailLabel}>প্রয়োজনীয় পুষ্টি:</Text>
                <View style={s.mineralRow}>{l.minerals.map(m => <View key={m} style={[s.mineralTag, { backgroundColor: l.color + '20' }]}><Text style={[s.mineralText, { color: l.color }]}>{m}</Text></View>)}</View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#166534', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#bbf7d0', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  brixCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 3, alignItems: 'center' },
  brixTitle: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  brixValue: { fontSize: 52, fontWeight: '900', color: '#0A8A1F' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 8 },
  sliderMin: { fontSize: 12, color: '#9ca3af', width: 20 },
  sliderMax: { fontSize: 12, color: '#9ca3af', width: 30, textAlign: 'right' },
  brixBtns: { flexDirection: 'row', alignItems: 'center' },
  brixBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0A8A1F', alignItems: 'center', justifyContent: 'center' },
  brixBtnText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 30 },
  brixBar: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginHorizontal: 8 },
  brixDot: { width: 12, height: 12, borderRadius: 6 },
  brixLevel: { fontSize: 13, fontWeight: '700', color: '#0A8A1F', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  levelCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, borderWidth: 1.5, overflow: 'hidden', elevation: 2 },
  levelCardActive: { elevation: 4 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  levelIcon: { fontSize: 26 },
  levelTitle: { fontSize: 13, fontWeight: '700' },
  levelBrix: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  currentBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  levelDetails: { padding: 12, borderTopWidth: 1, borderColor: '#f3f4f6' },
  levelDesc: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 8 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 4 },
  detailVal: { fontSize: 13, color: '#1f2937', marginBottom: 8 },
  mineralRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mineralTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  mineralText: { fontSize: 12, fontWeight: '700' },
});
