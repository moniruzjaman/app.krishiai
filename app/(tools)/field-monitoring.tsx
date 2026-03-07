import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { analyzeWithHybridModels } from '../../src/services/hybridModelService';

const MONITOR_TYPES = [
  { id: 'disease', label: 'রোগ পর্যবেক্ষণ', icon: '🔬' },
  { id: 'growth', label: 'বৃদ্ধি পর্যবেক্ষণ', icon: '📈' },
  { id: 'soil', label: 'মাটির অবস্থা', icon: '🌍' },
  { id: 'pest', label: 'পোকামাকড়', icon: '🐛' },
];

export default function FieldMonitoringScreen() {
  const router = useRouter();
  const [monitorType, setMonitorType] = useState('disease');
  const [images, setImages] = useState<string[]>([]);
  const [imageBase64s, setImageBase64s] = useState<string[]>([]);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [detecting, setDetecting] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6, mediaTypes: 'images', allowsMultipleSelection: false });
    if (!res.canceled && res.assets[0]) {
      setImages(prev => [...prev.slice(-2), res.assets[0].uri]);
      setImageBase64s(prev => [...prev.slice(-2), res.assets[0].base64 || '']);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') return;
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6, mediaTypes: 'images' });
    if (!res.canceled && res.assets[0]) {
      setImages(prev => [...prev.slice(-2), res.assets[0].uri]);
      setImageBase64s(prev => [...prev.slice(-2), res.assets[0].base64 || '']);
    }
  };

  const detectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {} finally { setDetecting(false); }
  };

  const startMonitoring = async () => {
    if (imageBase64s.length === 0) { Alert.alert('', 'কমপক্ষে একটি ছবি যোগ করুন'); return; }
    setLoading(true); setReport('');
    const typeLabel = MONITOR_TYPES.find(t => t.id === monitorType)?.label || '';
    try {
      const result = await analyzeWithHybridModels({
        imageBase64: imageBase64s[imageBase64s.length - 1],
        mimeType: 'image/jpeg',
        cropFamily: 'General',
        query: `মাঠ পর্যবেক্ষণ রিপোর্ট: ${typeLabel}। ${location ? `GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}।` : ''} বিস্তারিত মাঠ অডিট দিন।`,
        lang: 'bn',
      });
      setReport(`📊 মাঠ পর্যবেক্ষণ রিপোর্ট\n\n🔍 রোগ/সমস্যা: ${result.diagnosis}\n📂 শ্রেণী: ${result.category}\n💯 নিশ্চয়তা: ${result.confidence}%\n\n💡 পরামর্শ:\n${result.advisory}\n\n📌 সূত্র: ${result.officialSource}`);
    } catch { Alert.alert('ত্রুটি', 'পর্যবেক্ষণ ব্যর্থ।'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={s.title}>🛰️ মাঠ পর্যবেক্ষণ</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* Monitor type */}
        <Text style={s.label}>পর্যবেক্ষণের ধরন</Text>
        <View style={s.typeGrid}>
          {MONITOR_TYPES.map(t => (
            <TouchableOpacity key={t.id} style={[s.typeCard, monitorType === t.id && s.typeCardActive]} onPress={() => setMonitorType(t.id)}>
              <Text style={s.typeIcon}>{t.icon}</Text>
              <Text style={[s.typeLabel, monitorType === t.id && s.typeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* GPS */}
        <TouchableOpacity style={s.gpsBtn} onPress={detectLocation}>
          {detecting ? <ActivityIndicator color="#0A8A1F" size="small" /> : <Text style={s.gpsBtnText}>{location ? `📍 GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : '📍 GPS অবস্থান নিন'}</Text>}
        </TouchableOpacity>

        {/* Images */}
        <Text style={s.label}>মাঠের ছবি ({images.length}/3)</Text>
        <View style={s.imgRow}>
          {images.map((img, i) => <Image key={i} source={{ uri: img }} style={s.thumb} />)}
          {images.length < 3 && (
            <View style={s.addImgCol}>
              <TouchableOpacity style={s.addImgBtn} onPress={takePhoto}><Text style={s.addImgText}>📸</Text></TouchableOpacity>
              <TouchableOpacity style={[s.addImgBtn, { marginTop: 6 }]} onPress={pickImage}><Text style={s.addImgText}>🖼️</Text></TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={[s.startBtn, loading && { opacity: 0.7 }]} onPress={startMonitoring} disabled={loading}>
          {loading ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator color="#fff" />
              <Text style={[s.startBtnText, { marginTop: 4, fontSize: 12 }]}>AI বিশ্লেষণ চলছে...</Text>
            </View>
          ) : <Text style={s.startBtnText}>🛰️ মাঠ পর্যবেক্ষণ শুরু করুন</Text>}
        </TouchableOpacity>

        {report ? (
          <View style={s.reportCard}>
            <Text style={s.reportTitle}>📋 পর্যবেক্ষণ রিপোর্ট</Text>
            <Text style={s.reportText}>{report}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1d4ed8', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#bfdbfe', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  typeCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#dbeafe' },
  typeCardActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  typeIcon: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },
  typeLabelActive: { color: '#fff' },
  gpsBtn: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#bfdbfe', alignItems: 'center' },
  gpsBtnText: { fontSize: 13, fontWeight: '600', color: '#1d4ed8' },
  imgRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  thumb: { width: 90, height: 90, borderRadius: 10 },
  addImgCol: { flexDirection: 'column' },
  addImgBtn: { width: 90, height: 40, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#bfdbfe', borderStyle: 'dashed' },
  addImgText: { fontSize: 20 },
  startBtn: { backgroundColor: '#1d4ed8', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  reportCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 3 },
  reportTitle: { fontSize: 15, fontWeight: '700', color: '#1d4ed8', marginBottom: 10 },
  reportText: { fontSize: 14, color: '#374151', lineHeight: 24 },
});
