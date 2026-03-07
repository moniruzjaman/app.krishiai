import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

const CROPS = ['ধান', 'গম', 'আলু', 'ভুট্টা', 'সরিষা', 'পাট', 'আখ'];
const LAND_TYPES = ['উঁচু জমি', 'মাঝারি উঁচু', 'মাঝারি নিচু', 'নিচু জমি'];
const PRACTICES = ['সমন্বিত বালাই ব্যবস্থাপনা (IPM)', 'জৈব চাষ', 'প্রচলিত চাষ', 'সুষম সার ব্যবস্থাপনা'];
const WATER = ['পরিমিত সেচ', 'বৃষ্টিনির্ভর', 'সুনিয়ন্ত্রিত AWD সেচ', 'সেচবিহীন'];
const SOIL_STATUS = ['উচ্চ উর্বরতা', 'মাঝারি উর্বরতা', 'নিম্ন উর্বরতা', 'লবণাক্ত'];

export default function AIYieldScreen() {
  const router = useRouter();
  const [crop, setCrop] = useState('ধান');
  const [landType, setLandType] = useState(LAND_TYPES[1]);
  const [practice, setPractice] = useState(PRACTICES[0]);
  const [water, setWater] = useState(WATER[0]);
  const [soilStatus, setSoilStatus] = useState(SOIL_STATUS[1]);
  const [area, setArea] = useState('33');
  const [notes, setNotes] = useState('');
  const [district, setDistrict] = useState('');
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const detectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('অনুমতি প্রয়োজন'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo[0]) setDistrict(geo[0].city || geo[0].subregion || '');
    } catch { Alert.alert('', 'অবস্থান সনাক্ত করা যায়নি।'); }
    finally { setDetecting(false); }
  };

  const predict = async () => {
    setLoading(true); setPrediction('');
    try {
      const { text } = await chatWithHybridModels(
        `ফলন পূর্বাভাস দিন:\n- ফসল: ${crop}\n- এলাকা: ${district || 'বাংলাদেশ'}\n- জমি: ${area} শতাংশ, ${landType}\n- মাটি: ${soilStatus}\n- ব্যবস্থাপনা: ${practice}\n- সেচ: ${water}\n${notes ? `- বিশেষ তথ্য: ${notes}` : ''}\nBRRI/BARI ডেটার ভিত্তিতে হেক্টর প্রতি ও বিঘা প্রতি সম্ভাব্য ফলন, উন্নতির উপায় এবং লাভ-লোকসানের পূর্বাভাস দিন।`
      );
      setPrediction(text);
    } catch { Alert.alert('ত্রুটি', 'আবার চেষ্টা করুন।'); }
    finally { setLoading(false); }
  };

  const PickerRow = ({ label, items, selected, onSelect }: { label: string; items: string[]; selected: string; onSelect: (v: string) => void }) => (
    <View style={p.pickerBlock}>
      <Text style={p.pickerLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map(item => (
          <TouchableOpacity key={item} style={[p.chip, selected === item && p.chipActive]} onPress={() => onSelect(item)}>
            <Text style={[p.chipText, selected === item && p.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={p.container} edges={['top']}>
      <View style={p.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={p.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={p.title}>🤖 AI ফলন পূর্বাভাস</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <PickerRow label="ফসল" items={CROPS} selected={crop} onSelect={setCrop} />
        <PickerRow label="জমির ধরন" items={LAND_TYPES} selected={landType} onSelect={setLandType} />
        <PickerRow label="মাটির অবস্থা" items={SOIL_STATUS} selected={soilStatus} onSelect={setSoilStatus} />
        <PickerRow label="ব্যবস্থাপনা পদ্ধতি" items={PRACTICES} selected={practice} onSelect={setPractice} />
        <PickerRow label="সেচ পদ্ধতি" items={WATER} selected={water} onSelect={setWater} />

        <View style={p.row}>
          <View style={{ flex: 1 }}>
            <Text style={p.pickerLabel}>জমির পরিমাণ (শতাংশ)</Text>
            <TextInput style={p.areaInput} value={area} onChangeText={setArea} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={p.pickerLabel}>জেলা</Text>
            <View style={p.distRow}>
              <TextInput style={[p.areaInput, { flex: 1 }]} value={district} onChangeText={setDistrict} placeholder="স্বয়ংক্রিয়" placeholderTextColor="#9ca3af" />
              <TouchableOpacity style={p.locBtn} onPress={detectLocation}>
                {detecting ? <ActivityIndicator size="small" color="#0A8A1F" /> : <Text style={{ fontSize: 16 }}>📍</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={p.pickerLabel}>অতিরিক্ত তথ্য (ঐচ্ছিক)</Text>
        <TextInput style={p.notesInput} value={notes} onChangeText={setNotes} placeholder="যেমন: গত বছর ব্লাস্ট আক্রমণ হয়েছিল..." placeholderTextColor="#9ca3af" multiline />

        <TouchableOpacity style={[p.btn, loading && { opacity: 0.7 }]} onPress={predict} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={p.btnText}>🤖 AI পূর্বাভাস দিন</Text>}
        </TouchableOpacity>

        {prediction ? (
          <View style={p.predCard}>
            <Text style={p.predTitle}>📊 ফলন পূর্বাভাস — {crop}</Text>
            <Text style={p.predText}>{prediction}</Text>
            <Text style={p.predSource}>সূত্র: BRRI/BARI গবেষণা ডেটাবেস</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0369a1', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#bae6fd', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  pickerBlock: { marginBottom: 14 },
  pickerLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#bae6fd' },
  chipActive: { backgroundColor: '#0369a1', borderColor: '#0369a1' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', marginBottom: 14 },
  areaInput: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#bae6fd', color: '#1f2937' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locBtn: { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bae6fd' },
  notesInput: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#bae6fd', color: '#1f2937', height: 70, marginBottom: 14 },
  btn: { backgroundColor: '#0369a1', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  predCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3 },
  predTitle: { fontSize: 16, fontWeight: '700', color: '#0369a1', marginBottom: 10 },
  predText: { fontSize: 14, color: '#374151', lineHeight: 24 },
  predSource: { fontSize: 11, color: '#9ca3af', marginTop: 10 },
});
