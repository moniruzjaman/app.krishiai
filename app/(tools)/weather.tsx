import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

type WeatherData = {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  district: string;
};

const WMO_CONDITIONS: Record<number, { label: string; icon: string }> = {
  0: { label: 'পরিষ্কার আকাশ', icon: '☀️' },
  1: { label: 'প্রায় পরিষ্কার', icon: '🌤️' },
  2: { label: 'আংশিক মেঘলা', icon: '⛅' },
  3: { label: 'মেঘলা', icon: '☁️' },
  51: { label: 'হালকা বৃষ্টি', icon: '🌦️' },
  61: { label: 'বৃষ্টি', icon: '🌧️' },
  80: { label: 'বজ্রপাত', icon: '⛈️' },
  95: { label: 'ঝড়', icon: '🌩️' },
};

export default function WeatherScreen() {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 23.8103, lon = 90.4125, district = 'ঢাকা';

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        district = geo[0]?.city || geo[0]?.region || 'ঢাকা';
      }

      const res = await fetch(
        `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      );
      const data = await res.json();
      const curr = data.current;
      const wCode = curr.weather_code;
      const cond = WMO_CONDITIONS[wCode] || WMO_CONDITIONS[0];

      const weatherData: WeatherData = {
        temp: Math.round(curr.temperature_2m),
        humidity: curr.relative_humidity_2m,
        windSpeed: Math.round(curr.wind_speed_10m),
        condition: cond.label,
        district,
      };
      setWeather(weatherData);

      const { text: adv } = await chatWithHybridModels(
        `${district} জেলায় ${cond.label} আবহাওয়ায় কৃষকদের জন্য ৩টি জরুরি পরামর্শ দিন।`
      );
      setAdvice(adv);
    } catch (e) {
      setWeather({ temp: 28, humidity: 75, windSpeed: 12, condition: 'আংশিক মেঘলা', district: 'ঢাকা' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← ফিরুন</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌤️ আবহাওয়া</Text>
        <TouchableOpacity onPress={loadWeather}>
          <Text style={styles.refreshBtn}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>আবহাওয়া তথ্য লোড হচ্ছে...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {weather && (
            <View style={styles.weatherCard}>
              <Text style={styles.district}>{weather.district}</Text>
              <Text style={styles.tempBig}>{weather.temp}°C</Text>
              <Text style={styles.condition}>{weather.condition}</Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>💧</Text>
                  <Text style={styles.statValue}>{weather.humidity}%</Text>
                  <Text style={styles.statLabel}>আর্দ্রতা</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statIcon}>💨</Text>
                  <Text style={styles.statValue}>{weather.windSpeed}</Text>
                  <Text style={styles.statLabel}>কিমি/ঘণ্টা</Text>
                </View>
              </View>
            </View>
          )}

          {advice ? (
            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>🌾 কৃষি পরামর্শ</Text>
              <Text style={styles.adviceText}>{advice}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0369a1' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { fontSize: 14, color: '#bae6fd', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  refreshBtn: { fontSize: 22, color: '#bae6fd' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { color: '#bae6fd', marginTop: 12 },
  weatherCard: {
    alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20,
  },
  district: { fontSize: 18, color: '#bae6fd', fontWeight: '600' },
  tempBig: { fontSize: 72, color: '#fff', fontWeight: '300', marginVertical: 8 },
  condition: { fontSize: 18, color: '#e0f2fe', fontWeight: '500' },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 16, marginTop: 20, width: '80%', justifyContent: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 16 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, color: '#fff', fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#bae6fd', marginTop: 2 },
  adviceCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16,
    elevation: 3,
  },
  adviceTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  adviceText: { fontSize: 14, color: '#374151', lineHeight: 24 },
});
