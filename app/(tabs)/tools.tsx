import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TOOLS, ToolCategory } from '../../src/toolsData';

const CATEGORIES: { id: ToolCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'সব' },
  { id: 'diagnosis', label: 'রোগ নির্ণয়' },
  { id: 'calculator', label: 'ক্যালকুলেটর' },
  { id: 'planning', label: 'পরিকল্পনা' },
  { id: 'knowledge', label: 'জ্ঞানভাণ্ডার' },
  { id: 'monitoring', label: 'পর্যবেক্ষণ' },
];

export default function ToolsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = TOOLS.filter(t => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛠️ কৃষি টুলস</Text>
        <Text style={styles.headerSub}>{TOOLS.length}টি টুল</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="টুল খুঁজুন..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Category Filter */}
      <View style={styles.cats}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catBtn, activeCategory === c.id && styles.catBtnActive]}
            onPress={() => setActiveCategory(c.id)}
          >
            <Text style={[styles.catBtnText, activeCategory === c.id && styles.catBtnTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.toolIcon, { backgroundColor: item.color + '22' }]}>
              <Text style={styles.toolEmoji}>{item.icon}</Text>
            </View>
            <Text style={styles.toolName}>{item.name}</Text>
            <Text style={styles.toolDesc} numberOfLines={2}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0A8A1F', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#d1fae5' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', margin: 16,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1f2937' },
  cats: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 8, flexWrap: 'wrap' },
  catBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1fae5',
  },
  catBtnActive: { backgroundColor: '#0A8A1F', borderColor: '#0A8A1F' },
  catBtnText: { fontSize: 12, color: '#0A8A1F', fontWeight: '600' },
  catBtnTextActive: { color: '#fff' },
  grid: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  toolCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  toolIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  toolEmoji: { fontSize: 24 },
  toolName: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  toolDesc: { fontSize: 11, color: '#6b7280', lineHeight: 16 },
});
