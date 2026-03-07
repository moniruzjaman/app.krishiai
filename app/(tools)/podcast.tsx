import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

const THEMES = [
  { id: 'news', title: 'আজকের কৃষি সংবাদ', icon: '📰', prompt: 'বাংলাদেশের আজকের প্রধান কৃষি সংবাদ ও বাজার দর পডকাস্ট স্টাইলে বলুন।' },
  { id: 'rice', title: 'ধান চাষের লাভজনক টিপস', icon: '🌾', prompt: 'উন্নত ফলন ও মুনাফার জন্য ধান চাষের বৈজ্ঞানিক পদ্ধতি পডকাস্ট স্টাইলে ব্যাখ্যা করুন।' },
  { id: 'soil', title: 'মাটির স্বাস্থ্য রক্ষা', icon: '🏺', prompt: 'দীর্ঘমেয়াদী উর্বরতা ধরে রাখতে মাটির জৈব ব্যবস্থাপনা নিয়ে পডকাস্ট তৈরি করুন।' },
  { id: 'tech', title: 'স্মার্ট কৃষি প্রযুক্তি', icon: '🛰️', prompt: 'চাষাবাদে AI, ড্রোন ও IoT প্রযুক্তির ব্যবহার নিয়ে পডকাস্ট স্টাইলে বলুন।' },
  { id: 'pest', title: 'জৈবিক বালাই দমন', icon: '🐞', prompt: 'পরিবেশবান্ধব উপায়ে পোকা ও রোগ নিয়ন্ত্রণ নিয়ে কৃষক-বান্ধব পডকাস্ট তৈরি করুন।' },
  { id: 'market', title: 'বাজার বিশ্লেষণ', icon: '📊', prompt: 'এই মৌসুমে কোন ফসলে বেশি লাভ? বাজার প্রবণতা নিয়ে পডকাস্ট বলুন।' },
];

export default function PodcastScreen() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const generate = async () => {
    setLoading(true); setScript('');
    if (sound) { await sound.unloadAsync(); setSound(null); setPlaying(false); }
    try {
      const { text } = await chatWithHybridModels(
        `আপনি একজন কৃষি রেডিও উপস্থাপক। নিচের বিষয়ে ৩-৪ মিনিটের পডকাস্ট স্ক্রিপ্ট লিখুন। শুরুতে আকর্ষণীয় ইন্ট্রো, মাঝে মূল তথ্য এবং শেষে কৃষকদের জন্য সহজ পরামর্শ দিন।\n\nবিষয়: ${selectedTheme.prompt}`
      );
      setScript(text);
    } catch { setScript('পডকাস্ট তৈরি হয়নি। আবার চেষ্টা করুন।'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>🎙️ কৃষি পডকাস্ট</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* Theme selector */}
        <Text style={s.label}>পডকাস্টের বিষয় বেছে নিন</Text>
        <View style={s.themeGrid}>
          {THEMES.map(t => (
            <TouchableOpacity key={t.id} style={[s.themeCard, selectedTheme.id === t.id && s.themeCardActive]} onPress={() => { setSelectedTheme(t); setScript(''); }}>
              <Text style={s.themeIcon}>{t.icon}</Text>
              <Text style={[s.themeTitle, selectedTheme.id === t.id && s.themeTitleActive]}>{t.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected theme display */}
        <View style={s.selectedBox}>
          <Text style={s.selectedIcon}>{selectedTheme.icon}</Text>
          <Text style={s.selectedTitle}>{selectedTheme.title}</Text>
        </View>

        <TouchableOpacity style={[s.genBtn, loading && { opacity: 0.7 }]} onPress={generate} disabled={loading}>
          {loading ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator color="#fff" />
              <Text style={[s.genBtnText, { marginTop: 4, fontSize: 12 }]}>পডকাস্ট স্ক্রিপ্ট তৈরি হচ্ছে...</Text>
            </View>
          ) : <Text style={s.genBtnText}>🎙️ পডকাস্ট তৈরি করুন</Text>}
        </TouchableOpacity>

        {script ? (
          <View style={s.scriptCard}>
            <View style={s.scriptHeader}>
              <Text style={s.scriptIcon}>{selectedTheme.icon}</Text>
              <Text style={s.scriptTitle}>{selectedTheme.title}</Text>
              <View style={s.liveTag}><Text style={s.liveText}>AI জেনারেটেড</Text></View>
            </View>
            <Text style={s.scriptText}>{script}</Text>
          </View>
        ) : !loading ? (
          <View style={s.hint}>
            <Text style={s.hintIcon}>🎙️</Text>
            <Text style={s.hintText}>বিষয় বেছে নিন এবং পডকাস্ট তৈরি করুন বোতামে চাপুন</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf4ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#7e22ce', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#e9d5ff', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  themeCard: { width: '30%', backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#f3e8ff' },
  themeCardActive: { backgroundColor: '#7e22ce', borderColor: '#7e22ce' },
  themeIcon: { fontSize: 22, marginBottom: 4 },
  themeTitle: { fontSize: 10, fontWeight: '700', color: '#374151', textAlign: 'center' },
  themeTitleActive: { color: '#fff' },
  selectedBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3e8ff', borderRadius: 12, padding: 14, marginBottom: 12, gap: 10 },
  selectedIcon: { fontSize: 28 },
  selectedTitle: { fontSize: 15, fontWeight: '700', color: '#7e22ce', flex: 1 },
  genBtn: { backgroundColor: '#7e22ce', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  genBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  scriptCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3 },
  scriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scriptIcon: { fontSize: 24 },
  scriptTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1f2937' },
  liveTag: { backgroundColor: '#f3e8ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  liveText: { fontSize: 10, fontWeight: '700', color: '#7e22ce' },
  scriptText: { fontSize: 14, color: '#374151', lineHeight: 26 },
  hint: { alignItems: 'center', padding: 30 },
  hintIcon: { fontSize: 44, marginBottom: 10 },
  hintText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
});
