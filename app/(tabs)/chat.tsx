import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
};

const SUGGESTED = [
  'ধানের ব্লাস্ট রোগের প্রতিকার কী?',
  'আলুর জন্য সার কতটুকু দেব?',
  'মাজরা পোকা দমনের উপায়',
  'জৈব সার তৈরির পদ্ধতি',
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'model',
      text: 'আমি কৃষি AI সহকারী। আপনার ফসল, রোগ, সার, আবহাওয়া বা যেকোনো কৃষি বিষয়ে প্রশ্ন করুন।',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const history = useRef<{ role: string; text: string }[]>([]);

  const sendMessage = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msgText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { text: response, modelUsed } = await chatWithHybridModels(msgText, history.current);
      history.current = [...history.current, { role: 'user', text: msgText }, { role: 'model', text: response }];
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response, modelUsed };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'দুঃখিত, একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।',
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}>
      {item.role === 'model' && <Text style={styles.botLabel}>🌱 {item.modelUsed || 'কৃষি AI'}</Text>}
      <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.botText]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 AI কৃষি সহকারী</Text>
        <View style={styles.onlineDot} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#0A8A1F" />
              <Text style={styles.typingText}>উত্তর লিখছে...</Text>
            </View>
          ) : null
        }
      />

      {/* Suggestions */}
      {messages.length <= 1 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>সাধারণ প্রশ্ন:</Text>
          <View style={styles.suggestionsRow}>
            {SUGGESTED.map(s => (
              <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => sendMessage(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="কৃষি বিষয়ক প্রশ্ন লিখুন..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0A8A1F', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#86efac' },
  list: { padding: 16, gap: 10 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginVertical: 3 },
  userBubble: { backgroundColor: '#0A8A1F', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, elevation: 1 },
  botLabel: { fontSize: 11, color: '#0A8A1F', fontWeight: '700', marginBottom: 4 },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  userText: { color: '#fff' },
  botText: { color: '#1f2937' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  typingText: { fontSize: 13, color: '#6b7280' },
  suggestions: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb' },
  suggestionsLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  suggestionText: { fontSize: 12, color: '#0A8A1F', fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8,
    backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb',
  },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14, color: '#1f2937', maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#0A8A1F',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  sendBtnIcon: { color: '#fff', fontSize: 16 },
});
