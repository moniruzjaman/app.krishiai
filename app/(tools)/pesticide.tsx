import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { chatWithHybridModels } from '../../src/services/hybridModelService';
import { withRetry, getErrorMsg } from '../../src/utils/network';

const TABS = [{ id: 'advisor', label: '💊 পরামর্শ' }, { id: 'mixing', label: '🧪 মিশ্রণ' }, { id: 'rotation', label: '🔄 রোটেশন' }];
const CROPS = ['ধান', 'গম', 'আলু', 'টমেটো', 'বেগুন', 'পেঁয়াজ', 'সরিষা', 'ভুট্টা'];

export default function PesticideScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('advisor');
  const [crop, setCrop] = useState('ধান');
  const [pest, setPest] = useState('');
  const [mixing, setMixing] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    if (!pest.trim()) { Alert.alert('', 'রোগ বা পোকার নাম লিখুন'); return; }
    setLoading(true); setResult('');
    let prompt = '';
    if (tab === 'advisor') prompt = `${crop} ফসলে ${pest} সমস্যার জন্য DAE অনুমোদিত কীটনাশক/ছত্রাকনাশক সুপারিশ করুন। ডোজ, প্রয়োগের সময় ও সতর্কতা বলুন।`;
    else if (tab === 'mixing') prompt = `কীটনাশক মিশ্রণ প্রশ্ন: ${mixing || pest}। কোন কীটনাশক একসাথে মেশানো যাবে এবং কোনটি যাবে না? DAE গাইড অনুযায়ী বলুন।`;
    else prompt = `${crop} ফসলে কীটনাশক রেজিস্ট্যান্স রোধে রোটেশন পরিকল্পনা দিন। কোন গ্রুপের কীটনাশক পর্যায়ক্রমে ব্যবহার করবেন?`;
    try {
      const { text } = await chatWithHybridModels(prompt);
      setResult(text);
    } catch (e) {
      Alert.alert('সংযোগ সমস্যা', getErrorMsg(e));
    }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>🐛 কীটনাশক বিশেষজ্ঞ</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.tabs}>
        {TABS.map(t => <TouchableOpacity key={t.id} style={[s.tab, tab === t.id && s.tabActive]} onPress={() => { setTab(t.id); setResult(''); }}><Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text></TouchableOpacity>)}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.label}>ফসল নির্বাচন</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {CROPS.map(c => <TouchableOpacity key={c} style={[s.cropChip, crop === c && s.cropActive]} onPress={() => setCrop(c)}><Text style={[s.cropText, crop === c && s.cropTextActive]}>{c}</Text></TouchableOpacity>)}
        </ScrollView>
        {tab !== 'mixing' ? <>
          <Text style={s.label}>{tab === 'rotation' ? 'ফসলের অবস্থা' : 'রোগ / পোকার নাম'}</Text>
          <TextInput style={s.input} value={pest} onChangeText={setPest} placeholder="যেমন: মাজরা পোকা, ব্লাস্ট..." placeholderTextColor="#9ca3af" />
        </> : <>
          <Text style={s.label}>মেশাতে চান এমন কীটনাশকের নাম</Text>
          <TextInput style={[s.input, { height: 80 }]} value={mixing} onChangeText={setMixing} placeholder="যেমন: কার্বেনডাজিম + ম্যানকোজেব" placeholderTextColor="#9ca3af" multiline />
        </>}
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={getAdvice} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>AI পরামর্শ নিন</Text>}
        </TouchableOpacity>
        {result ? <View style={s.card}><Text style={s.cardTitle}>📋 পরামর্শ</Text><Text style={s.cardText}>{result}</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#b45309', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#fed7aa', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#b45309' },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#b45309' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  cropChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#e5e7eb' },
  cropActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  cropText: { fontSize: 13, color: '#374151' },
  cropTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1f2937', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 14 },
  btn: { backgroundColor: '#b45309', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#374151', lineHeight: 24 },
});
