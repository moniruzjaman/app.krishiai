import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TOOLS } from '../../src/toolsData';

// Match actual categories used in TOOLS array
const CATEGORIES = [
  { id: 'all',       label: 'সব',         icon: '🔧' },
  { id: 'diagnosis', label: 'রোগ নির্ণয়', icon: '🔬' },
  { id: 'soil',      label: 'মাটি',        icon: '🌍' },
  { id: 'pest',      label: 'বালাই দমন',   icon: '🐛' },
  { id: 'planning',  label: 'পরিকল্পনা',  icon: '📅' },
  { id: 'weather',   label: 'আবহাওয়া',    icon: '🌤️' },
  { id: 'learning',  label: 'শিক্ষা',      icon: '📚' },
];

export default function ToolsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = TOOLS.filter(t => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛠️ কৃষি টুলস</Text>
        <Text style={styles.headerSub}>{filtered.length}/{TOOLS.length}টি</Text>
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
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ fontSize: 16, color: '#9ca3af', paddingRight: 4 }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.catBtn, activeCategory === c.id && styles.catBtnActive]}
            onPress={() => setActiveCategory(c.id)}
          >
            <Text style={styles.catIcon}>{c.icon}</Text>
            <Text style={[styles.catBtnText, activeCategory === c.id && styles.catBtnTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Tools Grid */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>কোনো টুল পাওয়া যায়নি</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.75}
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
    flexDirection: 'row', alignItems: 'center', margin: 12, marginBottom: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1f2937' },
  catRow: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d1fae5',
  },
  catBtnActive: { backgroundColor: '#0A8A1F', borderColor: '#0A8A1F' },
  catIcon: { fontSize: 13 },
  catBtnText: { fontSize: 12, color: '#0A8A1F', fontWeight: '600' },
  catBtnTextActive: { color: '#fff' },
  grid: { paddingHorizontal: 12, paddingBottom: 24, gap: 12 },
  toolCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  toolIcon: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  toolEmoji: { fontSize: 24 },
  toolName: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  toolDesc: { fontSize: 11, color: '#6b7280', lineHeight: 16 },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
});
