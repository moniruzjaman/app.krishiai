import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

const MODES = [{ id: 'guide', label: '📖 নমুনা গাইড' }, { id: 'interpret', label: '🔬 ফলাফল ব্যাখ্যা' }, { id: 'labs', label: '🏛️ ল্যাব তালিকা' }];

const STEPS = [
  { title: 'সঠিক সরঞ্জাম', desc: 'পরিষ্কার খন্তা বা সয়েল অগার এবং একটি প্লাস্টিকের বালতি নিন।', icon: '🛠️' },
  { title: 'জমি প্রস্তুতি', desc: 'জমির উপরিভাগের লতাপাতা বা আগাছা সরিয়ে ফেলুন।', icon: '🧹' },
  { title: 'নমুনা সংগ্রহ', desc: "জমির ১০-১২টি জায়গা থেকে ৬-৯ ইঞ্চি গভীরতায় 'V' আকারে মাটি সংগ্রহ করুন।", icon: '🚜' },
  { title: 'মিশ্রণ ও শুকানো', desc: 'সব নমুনা মিশিয়ে ছায়ায় শুকিয়ে পাথর ও শিকড় ফেলে দিন।', icon: '☀️' },
  { title: 'লেবেলিং ও পাঠানো', desc: '৫০০ গ্রাম মাটি প্যাকেটে ভরে নাম, দাগ নম্বর ও তারিখ লিখে ল্যাবে পাঠান।', icon: '🏷️' },
];

const LABS = [
  { name: 'SRDI প্রধান কার্যালয়', location: 'খামারবাড়ি, ঢাকা', phone: '02-9111023' },
  { name: 'বিভাগীয় গবেষণাগার', location: 'রাজশাহী', phone: '0721-761518' },
  { name: 'বিভাগীয় গবেষণাগার', location: 'খুলনা', phone: '041-762075' },
  { name: 'বিভাগীয় গবেষণাগার', location: 'কুমিল্লা', phone: '081-64573' },
  { name: 'বিভাগীয় গবেষণাগার', location: 'সিলেট', phone: '0821-711534' },
];

export default function SoilGuideScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('guide');
  const [inputs, setInputs] = useState({ ph: '', n: '', p: '', k: '' });
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const interpret = async () => {
    if (!inputs.ph && !inputs.n) return;
    setLoading(true); setAdvice('');
    try {
      const { text } = await chatWithHybridModels(
        `মাটি পরীক্ষার ফলাফল ব্যাখ্যা করুন: pH=${inputs.ph || 'N/A'}, N=${inputs.n || 'N/A'}%, P=${inputs.p || 'N/A'} ppm, K=${inputs.k || 'N/A'} meq/100g। SRDI/BARC-2024 মান অনুযায়ী কোন পুষ্টির ঘাটতি আছে এবং কী সুপারিশ?`
      );
      setAdvice(text);
    } catch { setAdvice('তথ্য লোড হয়নি।'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>🏺 মাটি পরীক্ষা গাইড</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.tabs}>
        {MODES.map(m => <TouchableOpacity key={m.id} style={[s.tab, mode === m.id && s.tabActive]} onPress={() => setMode(m.id)}><Text style={[s.tabText, mode === m.id && s.tabTextActive]}>{m.label}</Text></TouchableOpacity>)}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {mode === 'guide' && STEPS.map((step, i) => (
          <View key={i} style={s.stepCard}>
            <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.stepIcon}>{step.icon}</Text>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        {mode === 'interpret' && (
          <View>
            {[{ key: 'ph', label: 'pH মান', hint: 'স্বাভাবিক: ৬.০-৭.০' }, { key: 'n', label: 'নাইট্রোজেন %', hint: 'স্বাভাবিক: ০.১৮%+' }, { key: 'p', label: 'ফসফরাস ppm', hint: 'স্বাভাবিক: ১৫+ ppm' }, { key: 'k', label: 'পটাশিয়াম meq/100g', hint: 'স্বাভাবিক: ০.২+' }].map(f => (
              <View key={f.key} style={s.fieldRow}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput style={s.fieldInput} value={inputs[f.key as keyof typeof inputs]} onChangeText={v => setInputs(prev => ({ ...prev, [f.key]: v }))} keyboardType="numeric" placeholder={f.hint} placeholderTextColor="#9ca3af" />
              </View>
            ))}
            <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={interpret} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>🔬 AI ব্যাখ্যা করুন</Text>}
            </TouchableOpacity>
            {advice ? <View style={s.adviceBox}><Text style={s.adviceText}>{advice}</Text></View> : null}
          </View>
        )}

        {mode === 'labs' && LABS.map((lab, i) => (
          <View key={i} style={s.labCard}>
            <Text style={s.labName}>{lab.name}</Text>
            <Text style={s.labLocation}>📍 {lab.location}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${lab.phone}`)} style={s.callBtn}>
              <Text style={s.callBtnText}>📞 {lab.phone}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef9ee' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#78350f', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#fde68a', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#78350f' },
  tabText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#78350f' },
  stepCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, gap: 12 },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#78350f', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepIcon: { fontSize: 20, marginBottom: 4 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  fieldLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },
  fieldInput: { width: 110, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, borderWidth: 1, borderColor: '#d1d5db', color: '#1f2937', textAlign: 'right' },
  btn: { backgroundColor: '#78350f', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  adviceBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2 },
  adviceText: { fontSize: 14, color: '#374151', lineHeight: 24 },
  labCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2 },
  labName: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  labLocation: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  callBtn: { backgroundColor: '#fef3c7', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  callBtnText: { fontSize: 13, fontWeight: '700', color: '#78350f' },
});
