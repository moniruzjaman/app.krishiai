import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

interface FlashCard { question: string; answer: string; }

const TOPICS = ['ধানের রোগ', 'মাটির পুষ্টি', 'জৈব কৃষি', 'সেচ ব্যবস্থাপনা', 'ফসল সংগ্রহ', 'বীজ শোধন'];

export default function FlashcardsScreen() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'input' | 'learning'>('input');
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const generate = async () => {
    if (!topic.trim()) { Alert.alert('', 'একটি বিষয় লিখুন'); return; }
    setLoading(true);
    try {
      const { text } = await chatWithHybridModels(
        `কৃষি বিষয়ক ফ্ল্যাশকার্ড তৈরি করুন বিষয়: "${topic}"। ৬টি প্রশ্ন-উত্তর JSON ফরম্যাটে: [{"question":"প্রশ্ন","answer":"উত্তর"}]। শুধু JSON দিন।`
      );
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        setCards(JSON.parse(match[0]));
        setIndex(0); setFlipped(false);
        setScore({ correct: 0, wrong: 0 });
        setMode('learning');
      } else { Alert.alert('', 'কার্ড তৈরি হয়নি। আবার চেষ্টা করুন।'); }
    } catch { Alert.alert('ত্রুটি', 'আবার চেষ্টা করুন।'); }
    finally { setLoading(false); }
  };

  const next = (correct: boolean) => {
    setScore(prev => ({ ...prev, [correct ? 'correct' : 'wrong']: prev[correct ? 'correct' : 'wrong'] + 1 }));
    if (index < cards.length - 1) { setIndex(prev => prev + 1); setFlipped(false); }
    else setMode('input');
  };

  if (mode === 'learning' && cards.length > 0) {
    const card = cards[index];
    const progress = ((index + 1) / cards.length) * 100;
    return (
      <SafeAreaView style={fs.container} edges={['top']}>
        <View style={fs.header}>
          <TouchableOpacity onPress={() => setMode('input')}><Text style={fs.back}>✕ শেষ করুন</Text></TouchableOpacity>
          <Text style={fs.headerCount}>{index + 1} / {cards.length}</Text>
          <Text style={fs.score}>✅{score.correct} ❌{score.wrong}</Text>
        </View>
        <View style={fs.progressBar}><View style={[fs.progressFill, { width: `${progress}%` as any }]} /></View>

        <View style={fs.cardArea}>
          <TouchableOpacity style={[fs.card, flipped && fs.cardFlipped]} onPress={() => setFlipped(!flipped)} activeOpacity={0.9}>
            {!flipped ? <>
              <Text style={fs.cardLabel}>প্রশ্ন</Text>
              <Text style={fs.cardText}>{card.question}</Text>
              <Text style={fs.tapHint}>উত্তর দেখতে চাপুন</Text>
            </> : <>
              <Text style={[fs.cardLabel, { color: '#059669' }]}>উত্তর</Text>
              <Text style={[fs.cardText, { color: '#059669' }]}>{card.answer}</Text>
            </>}
          </TouchableOpacity>
        </View>

        {flipped && (
          <View style={fs.actionRow}>
            <TouchableOpacity style={fs.wrongBtn} onPress={() => next(false)}><Text style={fs.wrongBtnText}>❌ জানি না</Text></TouchableOpacity>
            <TouchableOpacity style={fs.correctBtn} onPress={() => next(true)}><Text style={fs.correctBtnText}>✅ জানি</Text></TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={fs.container} edges={['top']}>
      <View style={fs.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={fs.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={fs.title}>🃏 ফ্ল্যাশকার্ড</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ padding: 20, flex: 1 }}>
        {score.correct + score.wrong > 0 && (
          <View style={fs.resultBox}>
            <Text style={fs.resultTitle}>শেষ ফলাফল</Text>
            <Text style={fs.resultText}>✅ {score.correct} সঠিক · ❌ {score.wrong} ভুল</Text>
          </View>
        )}
        <Text style={fs.label}>বিষয় লিখুন বা বেছে নিন</Text>
        <TextInput style={fs.input} value={topic} onChangeText={setTopic} placeholder="যেমন: ধানের রোগ, মাটির পুষ্টি..." placeholderTextColor="#9ca3af" />
        <View style={fs.topicRow}>
          {TOPICS.map(t => <TouchableOpacity key={t} style={fs.topicChip} onPress={() => setTopic(t)}><Text style={fs.topicText}>{t}</Text></TouchableOpacity>)}
        </View>
        <TouchableOpacity style={[fs.genBtn, loading && { opacity: 0.7 }]} onPress={generate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={fs.genBtnText}>🃏 কার্ড তৈরি করুন</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const fs = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf5ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#ddd6fe', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerCount: { fontSize: 14, color: '#fff', fontWeight: '700' },
  score: { fontSize: 13, color: '#ddd6fe', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#e9d5ff' },
  progressFill: { height: '100%', backgroundColor: '#7c3aed' },
  cardArea: { flex: 1, padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, minHeight: 220, justifyContent: 'center', alignItems: 'center', elevation: 6, borderWidth: 2, borderColor: '#e9d5ff' },
  cardFlipped: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', marginBottom: 16 },
  cardText: { fontSize: 18, color: '#1f2937', fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  tapHint: { fontSize: 12, color: '#a78bfa', marginTop: 16 },
  actionRow: { flexDirection: 'row', gap: 12, padding: 20 },
  wrongBtn: { flex: 1, backgroundColor: '#fef2f2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#fecaca' },
  wrongBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
  correctBtn: { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#bbf7d0' },
  correctBtnText: { color: '#059669', fontWeight: '700', fontSize: 15 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937', borderWidth: 1, borderColor: '#e9d5ff', marginBottom: 12 },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  topicChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ede9fe', borderWidth: 1, borderColor: '#c4b5fd' },
  topicText: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  genBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  genBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderColor: '#059669' },
  resultTitle: { fontSize: 13, fontWeight: '700', color: '#059669', marginBottom: 4 },
  resultText: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
});
