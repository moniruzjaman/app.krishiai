import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function YieldCalculatorScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'sample' | 'factors'>('sample');
  // Sample Cutting
  const [sampleArea, setSampleArea] = useState('25');
  const [sampleWeight, setSampleWeight] = useState('10');
  const [moisture, setMoisture] = useState('14');
  // Yield Factors
  const [plantsPerSqm, setPlantsPerSqm] = useState('25');
  const [paniclesPerPlant, setPaniclesPerPlant] = useState('10');
  const [grainsPerPanicle, setGrainsPerPanicle] = useState('120');
  const [tgw, setTgw] = useState('24');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    if (tab === 'sample') {
      const freshWeight = parseFloat(sampleWeight);
      const area = parseFloat(sampleArea);
      const moist = parseFloat(moisture);
      const dryWeight = freshWeight * (1 - moist / 100);
      const yieldPerSqm = dryWeight / area;
      const tHa = (yieldPerSqm * 10000) / 1000;
      const tBigha = tHa * 0.1337;
      setResult({ tHa: tHa.toFixed(2), tBigha: tBigha.toFixed(2), method: 'স্যাম্পল কাটিং' });
    } else {
      const plants = parseFloat(plantsPerSqm);
      const panicles = parseFloat(paniclesPerPlant);
      const grains = parseFloat(grainsPerPanicle);
      const weight = parseFloat(tgw);
      const tHa = (plants * panicles * grains * weight) / (10000 * 1000 * 1000);
      const tBigha = tHa * 0.1337;
      setResult({ tHa: (tHa * 10000).toFixed(2), tBigha: (tBigha * 10000).toFixed(2), method: 'ফলন উপাদান' });
    }
  };

  const Field = ({ label, val, set, hint = '' }: any) => (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRight}>
        <TextInput style={s.fieldInput} value={val} onChangeText={set} keyboardType="numeric" />
        {hint ? <Text style={s.fieldHint}>{hint}</Text> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>📊 ফলন হিসাব</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.tabs}>
        {[{ id: 'sample', label: 'স্যাম্পল কাটিং' }, { id: 'factors', label: 'ফলন উপাদান' }].map(t => (
          <TouchableOpacity key={t.id} style={[s.tab, tab === t.id && s.tabActive]} onPress={() => { setTab(t.id as any); setResult(null); }}>
            <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tab === 'sample' ? <>
          <Field label="স্যাম্পল এরিয়া" val={sampleArea} set={setSampleArea} hint="বর্গ মিটার" />
          <Field label="কাঁচা ওজন" val={sampleWeight} set={setSampleWeight} hint="কেজি" />
          <Field label="আর্দ্রতা %" val={moisture} set={setMoisture} hint="%" />
        </> : <>
          <Field label="গাছ/বর্গমিটার" val={plantsPerSqm} set={setPlantsPerSqm} />
          <Field label="কুশি/গাছ" val={paniclesPerPlant} set={setPaniclesPerPlant} />
          <Field label="দানা/কুশি" val={grainsPerPanicle} set={setGrainsPerPanicle} />
          <Field label="হাজার দানার ওজন" val={tgw} set={setTgw} hint="গ্রাম" />
        </>}
        <TouchableOpacity style={s.calcBtn} onPress={calculate}><Text style={s.calcBtnText}>হিসাব করুন</Text></TouchableOpacity>
        {result && (
          <View style={s.resultCard}>
            <Text style={s.resultMethod}>পদ্ধতি: {result.method}</Text>
            <View style={s.resultRow}><Text style={s.resultLabel}>প্রত্যাশিত ফলন</Text><Text style={s.resultValue}>{result.tHa} টন/হেক্টর</Text></View>
            <View style={s.resultRow}><Text style={s.resultLabel}>বিঘা প্রতি</Text><Text style={s.resultValue}>{result.tBigha} মণ</Text></View>
            <Text style={s.resultNote}>* আর্দ্রতা ও মাঠের ক্ষতি বাদে প্রকৃত ফলন ১০-১৫% কম হতে পারে</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#a7f3d0', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#059669' },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#059669' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  fieldLabel: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600' },
  fieldRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldInput: { width: 90, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 15, fontWeight: '700', borderWidth: 1, borderColor: '#d1fae5', textAlign: 'center', color: '#059669' },
  fieldHint: { fontSize: 12, color: '#6b7280' },
  calcBtn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginVertical: 8 },
  calcBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 3, marginTop: 8 },
  resultMethod: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  resultLabel: { fontSize: 14, color: '#374151' },
  resultValue: { fontSize: 16, fontWeight: '700', color: '#059669' },
  resultNote: { fontSize: 11, color: '#9ca3af', marginTop: 10 },
});
