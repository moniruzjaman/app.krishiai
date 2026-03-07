import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { COMMODITIES_DATA } from '../../src/constants';
import { TOOLS } from '../../src/toolsData';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const WEATHER_TIPS: Record<string, string[]> = {
  rain: ['সেচ বন্ধ রাখুন', 'কীটনাশক স্প্রে এড়িয়ে চলুন', 'জলাবদ্ধতা রোধ করুন'],
  sun: ['সকালে সেচ দিন', 'মালচিং ব্যবহার করুন', 'পর্যাপ্ত আর্দ্রতা বজায় রাখুন'],
  default: ['ফসলের অবস্থা পর্যবেক্ষণ করুন', 'সুষম সার প্রয়োগ করুন'],
};

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<string>('লোকেশন লোড হচ্ছে...');
  const [weather, setWeather] = useState({ temp: '--', condition: 'সূর্যকর' });
  const [newsIndex, setNewsIndex] = useState(0);

  const NEWS_ITEMS = [
    '🌾 বোরো মৌসুমে ব্লাস্ট রোগ সতর্কতা জারি',
    '💧 সেচ দক্ষতা বাড়াতে ড্রিপ ইরিগেশন ব্যবহার করুন',
    '🌿 জৈব সার ব্যবহারে ৩০% ফলন বৃদ্ধি সম্ভব',
    '🐛 মাজরা পোকা দমনে আলোক ফাঁদ ব্যবহার করুন',
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync(loc.coords);
        if (geo[0]) {
          setLocation(`${geo[0].city || ''}, ${geo[0].region || 'বাংলাদেশ'}`);
        }
      } else {
        setLocation('ঢাকা, বাংলাদেশ');
      }
    })();

    // Rotate news ticker
    const interval = setInterval(() => {
      setNewsIndex(i => (i + 1) % NEWS_ITEMS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const featuredTools = TOOLS.slice(0, 6);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>কৃষি AI</Text>
          <Text style={styles.headerSub}>{location}</Text>
        </View>
        <TouchableOpacity
          style={styles.weatherBadge}
          onPress={() => router.push('/(tools)/weather')}
        >
          <Text style={styles.weatherEmoji}>☀️</Text>
          <Text style={styles.weatherTemp}>{weather.temp}°</Text>
        </TouchableOpacity>
      </View>

      {/* News Ticker */}
      <View style={styles.ticker}>
        <Text style={styles.tickerLabel}>📢</Text>
        <Text style={styles.tickerText} numberOfLines={1}>
          {NEWS_ITEMS[newsIndex]}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A8A1F" />}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>ডিজিটাল কৃষি সহায়তা</Text>
          <Text style={styles.heroSub}>AI-চালিত কৃষি পরামর্শ এখন আপনার হাতে</Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => router.push('/(tabs)/analyzer')}
          >
            <Text style={styles.heroBtnText}>🔬 ফসলের রোগ শনাক্ত করুন</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>দ্রুত সেবা</Text>
          <View style={styles.quickGrid}>
            {[
              { label: 'রোগ বিশ্লেষণ', icon: '🔬', route: '/(tabs)/analyzer' },
              { label: 'AI চ্যাট', icon: '💬', route: '/(tabs)/chat' },
              { label: 'আবহাওয়া', icon: '🌤️', route: '/(tools)/weather' },
              { label: 'সার হিসাব', icon: '⚗️', route: '/(tools)/nutrient' },
              { label: 'ফলন পূর্বাভাস', icon: '📊', route: '/(tools)/yield' },
              { label: 'ফসল ক্যালেন্ডার', icon: '📅', route: '/(tools)/calendar' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickCard}
                onPress={() => router.push(item.route as any)}
              >
                <Text style={styles.quickIcon}>{item.icon}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Market Prices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>বাজার দর</Text>
            <Text style={styles.seeAll}>আজকের মূল্য</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {COMMODITIES_DATA.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.priceCard}>
                <Text style={styles.priceName}>{item.name}</Text>
                <Text style={styles.priceValue}>৳{item.retail[0]}-{item.retail[1]}</Text>
                <Text style={[
                  styles.priceTrend,
                  item.trend === 'up' ? styles.trendUp : item.trend === 'down' ? styles.trendDown : styles.trendStable
                ]}>
                  {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'} {item.change}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* All Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>সব টুলস</Text>
          <View style={styles.toolsGrid}>
            {featuredTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolCard}
                onPress={() => router.push(tool.route as any)}
              >
                <View style={[styles.toolIcon, { backgroundColor: tool.color + '22' }]}>
                  <Text style={styles.toolEmoji}>{tool.icon}</Text>
                </View>
                <Text style={styles.toolName} numberOfLines={2}>{tool.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push('/(tabs)/tools')}
          >
            <Text style={styles.viewAllText}>সব টুলস দেখুন →</Text>
          </TouchableOpacity>
        </View>

        {/* Agri Tips */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <Text style={styles.sectionTitle}>কৃষি পরামর্শ</Text>
          {WEATHER_TIPS.default.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>✅</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0A8A1F', paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: '#d1fae5', marginTop: 2 },
  weatherBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  weatherEmoji: { fontSize: 16 },
  weatherTemp: { color: '#fff', fontWeight: '700', marginLeft: 4 },
  ticker: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7',
    paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#fde68a',
  },
  tickerLabel: { fontSize: 14, marginRight: 8 },
  tickerText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '500' },
  heroBanner: {
    backgroundColor: '#0A8A1F', margin: 16, borderRadius: 16,
    padding: 20, alignItems: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  heroSub: { fontSize: 13, color: '#d1fae5', marginTop: 6, textAlign: 'center' },
  heroBtn: {
    backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10,
    marginTop: 14,
  },
  heroBtnText: { color: '#0A8A1F', fontWeight: '700', fontSize: 15 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#0A8A1F' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
  priceCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginRight: 10,
    minWidth: 120, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
  },
  priceName: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  priceValue: { fontSize: 15, fontWeight: 'bold', color: '#1f2937', marginTop: 4 },
  priceTrend: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  trendUp: { color: '#dc2626' },
  trendDown: { color: '#059669' },
  trendStable: { color: '#6b7280' },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard: {
    width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
  },
  toolIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  toolEmoji: { fontSize: 24 },
  toolName: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  viewAllBtn: {
    backgroundColor: '#0A8A1F', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', marginTop: 14,
  },
  viewAllText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  tipBullet: { fontSize: 14, marginRight: 8, marginTop: 1 },
  tipText: { flex: 1, fontSize: 14, color: '#374151' },
});
