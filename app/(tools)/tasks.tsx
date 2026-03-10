import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withRetry, getErrorMsg } from '../../src/utils/network';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

type TaskCategory = 'irrigation' | 'fertilizer' | 'pesticide' | 'harvest' | 'other';
interface Task { id: string; title: string; dueDate: string; completed: boolean; category: TaskCategory; crop: string; }

const CATS: { id: TaskCategory; label: string; icon: string; color: string }[] = [
  { id: 'irrigation', label: 'সেচ', icon: '💧', color: '#0891b2' },
  { id: 'fertilizer', label: 'সার', icon: '🌱', color: '#059669' },
  { id: 'pesticide', label: 'কীটনাশক', icon: '🐛', color: '#d97706' },
  { id: 'harvest', label: 'ফসল কাটা', icon: '🌾', color: '#7c3aed' },
  { id: 'other', label: 'অন্যান্য', icon: '📋', color: '#6b7280' },
];
const CROPS = ['ধান', 'গম', 'আলু', 'টমেটো', 'বেগুন', 'সরিষা'];
const STORAGE_KEY = 'krishi_tasks_v1';

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<TaskCategory>('other');
  const [crop, setCrop] = useState('ধান');

  useEffect(() => { loadTasks(); }, []);
  const loadTasks = async () => {
    try { const d = await AsyncStorage.getItem(STORAGE_KEY); if (d) setTasks(JSON.parse(d)); } catch {}
  };
  const saveTasks = async (t: Task[]) => {
    setTasks(t);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch {}
  };
  const addTask = () => {
    if (!title.trim()) { Alert.alert('', 'কাজের নাম লিখুন'); return; }
    const t: Task = { id: Date.now().toString(), title, dueDate, completed: false, category, crop };
    saveTasks([t, ...tasks]);
    setTitle(''); setShowModal(false);
  };
  const toggleDone = (id: string) => saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id: string) => saveTasks(tasks.filter(t => t.id !== id));
  const generateAI = async () => {
    setGenerating(true);
    try {
      const { text } = await chatWithHybridModels(
        `${crop} চাষের জন্য আগামী ৭ দিনের কৃষি কাজের তালিকা JSON ফরম্যাটে দিন: [{"title":"কাজ","dueDate":"YYYY-MM-DD","category":"irrigation/fertilizer/pesticide/harvest/other"}]। শুধু JSON দিন।`
      );
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const aiTasks: Task[] = JSON.parse(match[0]).map((t: any) => ({ ...t, id: Date.now().toString() + Math.random(), completed: false, crop }));
        saveTasks([...aiTasks, ...tasks]);
      }
    } catch {} finally { setGenerating(false); }
  };

  const pending = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);

  const TaskCard = ({ task }: { task: Task }) => {
    const cat = CATS.find(c => c.id === task.category) || CATS[4];
    return (
      <View style={[ts.card, task.completed && ts.cardDone]}>
        <TouchableOpacity style={ts.checkbox} onPress={() => toggleDone(task.id)}>
          <Text style={{ fontSize: 18 }}>{task.completed ? '✅' : '⬜'}</Text>
        </TouchableOpacity>
        <View style={ts.cardBody}>
          <View style={[ts.catTag, { backgroundColor: cat.color + '20' }]}>
            <Text style={{ fontSize: 11, color: cat.color, fontWeight: '700' }}>{cat.icon} {cat.label}</Text>
          </View>
          <Text style={[ts.cardTitle, task.completed && ts.cardTitleDone]}>{task.title}</Text>
          <Text style={ts.cardDate}>📅 {task.dueDate} · {task.crop}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteTask(task.id)} style={ts.delBtn}>
          <Text style={{ color: '#ef4444', fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={ts.container} edges={['top']}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={ts.back}>← ফিরুন</Text></TouchableOpacity>
        <Text style={ts.title}>📋 কাজের তালিকা</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}><Text style={ts.addBtn}>+ যোগ</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* AI generate */}
        <View style={ts.aiBox}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {CROPS.map(c => <TouchableOpacity key={c} style={[ts.cropChip, crop === c && ts.cropActive]} onPress={() => setCrop(c)}><Text style={[ts.cropText, crop === c && ts.cropTextActive]}>{c}</Text></TouchableOpacity>)}
          </ScrollView>
          <TouchableOpacity style={[ts.aiBtn, generating && { opacity: 0.7 }]} onPress={generateAI} disabled={generating}>
            {generating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={ts.aiBtnText}>🤖 AI দিয়ে সাপ্তাহিক কাজ তৈরি করুন</Text>}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={ts.statsRow}>
          <View style={ts.statBox}><Text style={ts.statNum}>{pending.length}</Text><Text style={ts.statLabel}>বাকি কাজ</Text></View>
          <View style={ts.statBox}><Text style={[ts.statNum, { color: '#059669' }]}>{done.length}</Text><Text style={ts.statLabel}>সম্পন্ন</Text></View>
          <View style={ts.statBox}><Text style={ts.statNum}>{tasks.length}</Text><Text style={ts.statLabel}>মোট</Text></View>
        </View>

        {pending.length > 0 && <Text style={ts.sectionHead}>বাকি কাজ</Text>}
        {pending.map(t => <TaskCard key={t.id} task={t} />)}
        {done.length > 0 && <Text style={ts.sectionHead}>সম্পন্ন কাজ</Text>}
        {done.map(t => <TaskCard key={t.id} task={t} />)}
        {tasks.length === 0 && <View style={ts.empty}><Text style={ts.emptyIcon}>📋</Text><Text style={ts.emptyText}>কোনো কাজ নেই। উপরে AI দিয়ে তৈরি করুন।</Text></View>}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={ts.overlay}>
          <View style={ts.modal}>
            <Text style={ts.modalTitle}>নতুন কাজ যোগ করুন</Text>
            <TextInput style={ts.minput} value={title} onChangeText={setTitle} placeholder="কাজের নাম লিখুন" placeholderTextColor="#9ca3af" />
            <TextInput style={ts.minput} value={dueDate} onChangeText={setDueDate} placeholder="তারিখ (YYYY-MM-DD)" placeholderTextColor="#9ca3af" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATS.map(c => <TouchableOpacity key={c.id} style={[ts.catBtn, category === c.id && { backgroundColor: c.color }]} onPress={() => setCategory(c.id)}><Text style={{ color: category === c.id ? '#fff' : '#374151', fontSize: 12 }}>{c.icon} {c.label}</Text></TouchableOpacity>)}
            </ScrollView>
            <View style={ts.mrow}>
              <TouchableOpacity style={ts.cancelBtn} onPress={() => setShowModal(false)}><Text style={ts.cancelText}>বাতিল</Text></TouchableOpacity>
              <TouchableOpacity style={ts.saveBtn} onPress={addTask}><Text style={ts.saveText}>সংরক্ষণ করুন</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e40af', paddingHorizontal: 16, paddingVertical: 14 },
  back: { fontSize: 14, color: '#bfdbfe', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  addBtn: { fontSize: 14, color: '#bfdbfe', fontWeight: '700' },
  aiBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cropChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  cropActive: { backgroundColor: '#1e40af' },
  cropText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  cropTextActive: { color: '#fff' },
  aiBtn: { backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  aiBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 22, fontWeight: '900', color: '#1e40af' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  sectionHead: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginVertical: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  cardDone: { opacity: 0.6 },
  checkbox: { marginRight: 10 },
  cardBody: { flex: 1 },
  catTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
  cardDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  delBtn: { padding: 6 },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 16 },
  minput: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, fontSize: 14, color: '#1f2937', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  mrow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelText: { fontWeight: '700', color: '#374151' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#1e40af', alignItems: 'center' },
  saveText: { fontWeight: '700', color: '#fff' },
});
