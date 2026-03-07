import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

const TABS = [{ id: 'audit', label: '🧪 অডিট' }, { id: 'texture', label: '🌍 বুনট' }, { id: 'organic', label: '♻️ জৈব সার' }];
const SOIL_TYPES = ['দোআঁশ', 'বেলে দোআঁশ', 'এঁটেল', 'পলি দোআঁশ', 'বেলে'];

export default function SoilExpertScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('audit');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  // Audit
  const [ph, setPh] = useState('6.5'); const [oc, setOc] = useState('0.8');
  const [n, setN] = useState('0.1'); const [p, setP] = useState('15'); const [k, setK] = useState('0.15');
  // Texture
  const [sand, setSand] = useState('40'); const [silt, setSilt] = useState('40'); const [clay, setClay] = useState('20');
  // Organic
  const [currentOM, setCurrentOM] = useState('1.5'); const [targetOM, setTargetOM] = useState('3.5'); const [area, setArea] = useState('33');

  const analyze = async () => {
    setLoading(true); setResult('');
    let prompt = '';
    if (tab === 'audit') prompt = `মাটি পরীক্ষার ফলাফল: pH ${ph}, OC ${oc}%, N ${n}%, P ${p} ppm, K ${k} meq/100g। SRDI/BARC-2024 অনুযায়ী মাটির স্বাস্থ্য বিশ্লেষণ করুন এবং সুপারিশ দিন।`;
    else if (tab === 'texture') prompt = `মাটির বুনট: বালি ${sand}%, পলি ${silt}%, কাদা ${clay}%। মাটির শ্রেণী নির্ণয় করুন এবং উপযুক্ত ফসল ও ব্যবস্থাপনা বলুন।`;
    else prompt = `জমির পরিমাণ ${area} শতাংশ। বর্তমান জৈব পদার্থ ${currentOM}%, লক্ষ্য ${targetOM}%। কি পরিমাণ কম্পোস্ট/জৈব সার দরকার তা BARC গাইড অনুযায়ী বলুন।`;
    try {
      const { text } = await chatWithHybridModels(prompt);
      setResult(text);
    } catch { Alert.alert('ত্রুটি', 'আবার চেষ্টা করুন।'); }
    finally { setLoading(false); }
  };

  const inp = (label: string, val: string, set: (v: string) => void, unit = '') => (
    <View style={s.row} key={label}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={val} onChangeText={set} keyboardType="numeric" />
      {unit ? <Text style={s.unit}>{unit}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>🌍 মৃত্তিকা বিশেষজ্ঞ</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.tabs}>
        {TABS.map(t => <TouchableOpacity key={t.id} style={[s.tab, tab === t.id && s.tabActive]} onPress={() => { setTab(t.id); setResult(''); }}><Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text></TouchableOpacity>)}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tab === 'audit' && <>{inp('pH মান', ph, setPh)}{inp('জৈব কার্বন %', oc, setOc)}{inp('নাইট্রোজেন %', n, setN)}{inp('ফসফরাস ppm', p, setP)}{inp('পটাশিয়াম', k, setK)}</>}
        {tab === 'texture' && <>{inp('বালি %', sand, setSand)}{inp('পলি %', silt, setSilt)}{inp('কাদা %', clay, setClay)}</>}
        {tab === 'organic' && <>{inp('বর্তমান জৈব পদার্থ %', currentOM, setCurrentOM)}{inp('লক্ষ্য জৈব পদার্থ %', targetOM, setTargetOM)}{inp('জমির পরিমাণ', area, setArea, 'শতাংশ')}</>}
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={analyze} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>AI বিশ্লেষণ করুন</Text>}
        </TouchableOpacity>
        {result ? <View style={s.resultCard}><Text style={s.resultTitle}>বিশ্লেষণ ফলাফল</Text><Text style={s.resultText}>{result}</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef3c7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#92400e', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#fde68a', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#92400e' },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#92400e' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600' },
  input: { width: 80, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: '#d1d5db', textAlign: 'right' },
  unit: { fontSize: 12, color: '#6b7280', marginLeft: 6, width: 50 },
  btn: { backgroundColor: '#92400e', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  resultText: { fontSize: 14, color: '#374151', lineHeight: 24 },
});
