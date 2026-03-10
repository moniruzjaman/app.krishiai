import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { chatWithHybridModels } from '../../src/services/hybridModelService';
import { AGRI_SEASONS, CROPS_BY_CATEGORY } from '../../src/constants';
import { withRetry, getErrorMsg } from '../../src/utils/network';

const CROPS = ['ধান', 'গম', 'আলু', 'সরিষা', 'ভুট্টা', 'পাট', 'আখ', 'টমেটো'];

export default function CropCalendarScreen() {
  const router = useRouter();
  const currentMonth = new Date().getMonth();
  const currentSeason = AGRI_SEASONS.find(s => s.months.includes(currentMonth)) || AGRI_SEASONS[0];
  const [activeSeason, setActiveSeason] = useState(currentSeason.id);
  const [selectedCrop, setSelectedCrop] = useState('ধান');
  const [advice, setAdvice] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    const key = `${activeSeason}-${selectedCrop}`;
    if (advice[key]) return;
    setLoading(true);
    try {
      const season = AGRI_SEASONS.find(s => s.id === activeSeason);
      const { text } = await chatWithHybridModels(
        `${season?.name} মৌসুমে ${selectedCrop} চাষের সম্পূর্ণ পঞ্জিকা দিন। বীজ বপন, সার প্রয়োগ, সেচ, রোগ দমন ও ফসল কাটার সময়সূচি BRRI/BARI অনুযায়ী দিন।`
      );
      setAdvice(prev => ({ ...prev, [key]: text }));
    } catch (e) {
      setAdvice(prev => ({ ...prev, [`${activeSeason}-${selectedCrop}`]: `❌ ${getErrorMsg(e)}` }));
    }
    finally { setLoading(false); }
  };

  const currentKey = `${activeSeason}-${selectedCrop}`;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>📅 চাষ পঞ্জিকা</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* Current season indicator */}
        <View style={s.currentSeasonBadge}>
          <Text style={s.currentSeasonText}>বর্তমান মৌসুম: {currentSeason.name}</Text>
        </View>

        {/* Season selector */}
        <Text style={s.label}>মৌসুম নির্বাচন করুন</Text>
        <View style={s.seasonRow}>
          {AGRI_SEASONS.map(season => (
            <TouchableOpacity key={season.id} style={[s.seasonBtn, activeSeason === season.id && s.seasonActive]} onPress={() => setActiveSeason(season.id)}>
              <Text style={s.seasonIcon}>{season.id === 'rabi' ? '🌫️' : season.id === 'kharif1' ? '☀️' : '🌧️'}</Text>
              <Text style={[s.seasonText, activeSeason === season.id && s.seasonTextActive]}>{season.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Crop selector */}
        <Text style={s.label}>ফসল নির্বাচন করুন</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {CROPS.map(c => (
            <TouchableOpacity key={c} style={[s.cropChip, selectedCrop === c && s.cropActive]} onPress={() => setSelectedCrop(c)}>
              <Text style={[s.cropText, selectedCrop === c && s.cropTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={getAdvice} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>📅 পঞ্জিকা দেখুন</Text>}
        </TouchableOpacity>

        {advice[currentKey] ? (
          <View style={s.adviceCard}>
            <Text style={s.adviceTitle}>🌾 {selectedCrop} — {AGRI_SEASONS.find(s => s.id === activeSeason)?.name}</Text>
            <Text style={s.adviceText}>{advice[currentKey]}</Text>
          </View>
        ) : !loading ? (
          <View style={s.hint}>
            <Text style={s.hintIcon}>📅</Text>
            <Text style={s.hintText}>মৌসুম ও ফসল বেছে নিন, তারপর পঞ্জিকা দেখুন বোতামে চাপুন</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffbeb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#d97706', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#fde68a', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  currentSeasonBadge: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginBottom: 14, borderLeftWidth: 4, borderColor: '#d97706' },
  currentSeasonText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  seasonRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  seasonBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  seasonActive: { backgroundColor: '#d97706', borderColor: '#d97706' },
  seasonIcon: { fontSize: 22, marginBottom: 4 },
  seasonText: { fontSize: 11, fontWeight: '700', color: '#6b7280', textAlign: 'center' },
  seasonTextActive: { color: '#fff' },
  cropChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#e5e7eb' },
  cropActive: { backgroundColor: '#d97706', borderColor: '#d97706' },
  cropText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  cropTextActive: { color: '#fff' },
  btn: { backgroundColor: '#d97706', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  adviceCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  adviceTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  adviceText: { fontSize: 14, color: '#374151', lineHeight: 24 },
  hint: { alignItems: 'center', padding: 30 },
  hintIcon: { fontSize: 40, marginBottom: 10 },
  hintText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
});
