import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchWithHybridModels } from '../../src/services/hybridModelService';

type Result = { title: string; content: string; source?: string };

const CATEGORIES = ['রোগ ও পোকা', 'সার ব্যবস্থাপনা', 'সেচ', 'বীজ', 'আবহাওয়া', 'বাজার'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q?: string) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchWithHybridModels(searchQuery);
      setResults(res);
    } catch {
      setResults([{ title: 'ত্রুটি', content: 'অনুসন্ধান ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 কৃষি তথ্য অনুসন্ধান</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="ফসল, রোগ, সার সম্পর্কে খুঁজুন..."
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
          onSubmitEditing={() => doSearch()}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>খুঁজুন</Text>}
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      {!searched && (
        <View style={styles.categories}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={styles.catChip} onPress={() => { setQuery(cat); doSearch(cat); }}>
              <Text style={styles.catText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0A8A1F" />
          <Text style={styles.loadingText}>অনুসন্ধান করা হচ্ছে...</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultContent}>{item.content}</Text>
            {item.source && <Text style={styles.resultSource}>📌 সূত্র: {item.source}</Text>}
          </View>
        )}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🌾</Text>
              <Text style={styles.emptyText}>কোনো ফলাফল পাওয়া যায়নি</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f0' },
  header: {
    backgroundColor: '#0A8A1F', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  searchBox: {
    flexDirection: 'row', margin: 16, gap: 8,
  },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: '#1f2937', elevation: 2,
  },
  searchBtn: {
    backgroundColor: '#0A8A1F', borderRadius: 12, paddingHorizontal: 16,
    justifyContent: 'center', elevation: 2,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  catChip: {
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#d1fae5', elevation: 1,
  },
  catText: { fontSize: 13, color: '#0A8A1F', fontWeight: '500' },
  center: { alignItems: 'center', paddingTop: 40 },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  resultContent: { fontSize: 14, color: '#374151', lineHeight: 22 },
  resultSource: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6b7280' },
});
