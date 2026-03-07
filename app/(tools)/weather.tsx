import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

// ─── Free APIs ──────────────────────────────────────────────────────────────
// Open-Meteo  — no key, no rate limit, fully free
// Nominatim   — no key, free reverse-geocode
// ────────────────────────────────────────────────────────────────────────────

const OPEN_METEO =
  'https://api.open-meteo.com/v1/forecast';
const NOMINATIM =
  'https://nominatim.openstreetmap.org/reverse';

const WMO: Record<number, { label: string; icon: string }> = {
  0:  { label: 'পরিষ্কার আকাশ',   icon: '☀️' },
  1:  { label: 'প্রায় পরিষ্কার',   icon: '🌤️' },
  2:  { label: 'আংশিক মেঘলা',    icon: '⛅' },
  3:  { label: 'মেঘলা',           icon: '☁️' },
  45: { label: 'কুয়াশা',          icon: '🌫️' },
  48: { label: 'ঘন কুয়াশা',       icon: '🌫️' },
  51: { label: 'হালকা গুঁড়ি বৃষ্টি',icon: '🌦️' },
  61: { label: 'হালকা বৃষ্টি',    icon: '🌧️' },
  63: { label: 'মাঝারি বৃষ্টি',   icon: '🌧️' },
  65: { label: 'ভারী বৃষ্টি',     icon: '🌧️' },
  80: { label: 'বজ্রবৃষ্টি',      icon: '⛈️' },
  95: { label: 'ঝড়',             icon: '🌩️' },
  99: { label: 'তীব্র ঝড়',       icon: '🌩️' },
};
const wmo = (code: number) => WMO[code] ?? WMO[0];

const WEEK_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

type Tab = 'forecast' | 'risks' | 'spray';

interface DayForecast {
  day: string;
  icon: string;
  maxTemp: number;
  minTemp: number;
  rain: number;
  condition: string;
}

interface WeatherState {
  district: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainProb: number;
  condition: string;
  icon: string;
  et0: number;           // Evapotranspiration mm/day
  soilTemp: number;      // °C surface
  solarRad: number;      // W/m²
  uvIndex: number;
  forecast: DayForecast[];
  lat: number;
  lng: number;
}

export default function WeatherScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('forecast');
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1. GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 23.8103, lng = 90.4125;
      let district = 'ঢাকা';

      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;

        // 2. Reverse geocode via Nominatim (free)
        try {
          const geo = await fetch(
            `${NOMINATIM}?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'bn', 'User-Agent': 'KrishiAI/1.0' } }
          ).then(r => r.json());
          district =
            geo?.address?.city ||
            geo?.address?.county ||
            geo?.address?.state_district ||
            geo?.address?.state ||
            'বাংলাদেশ';
        } catch {}
      }

      // 3. Open-Meteo — all agri params, 7-day forecast, no key needed
      const params = [
        'temperature_2m', 'apparent_temperature',
        'relative_humidity_2m', 'wind_speed_10m',
        'weather_code', 'precipitation_probability',
        'et0_fao_evapotranspiration',
        'soil_temperature_0cm',
        'shortwave_radiation',
        'uv_index',
      ].join(',');

      const dailyParams = [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'precipitation_probability_max',
      ].join(',');

      const url =
        `${OPEN_METEO}?latitude=${lat}&longitude=${lng}` +
        `&current=${params}` +
        `&daily=${dailyParams}` +
        `&timezone=Asia/Dhaka&forecast_days=7`;

      const data = await fetch(url).then(r => r.json());
      const c = data.current;
      const d = data.daily;
      const cond = wmo(c.weather_code);

      const forecast: DayForecast[] = (d.time as string[]).map(
        (dateStr: string, i: number) => {
          const dayIdx = new Date(dateStr).getDay();
          const dc = wmo(d.weather_code[i]);
          return {
            day: i === 0 ? 'আজ' : WEEK_DAYS[dayIdx],
            icon: dc.icon,
            maxTemp: Math.round(d.temperature_2m_max[i]),
            minTemp: Math.round(d.temperature_2m_min[i]),
            rain: d.precipitation_probability_max[i] ?? 0,
            condition: dc.label,
          };
        }
      );

      const w: WeatherState = {
        district,
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        windSpeed: Math.round(c.wind_speed_10m),
        rainProb: c.precipitation_probability ?? 0,
        condition: cond.label,
        icon: cond.icon,
        et0: +(c.et0_fao_evapotranspiration ?? 0).toFixed(1),
        soilTemp: Math.round(c.soil_temperature_0cm ?? c.temperature_2m - 2),
        solarRad: Math.round(c.shortwave_radiation ?? 0),
        uvIndex: +(c.uv_index ?? 0).toFixed(1),
        forecast,
        lat,
        lng,
      };
      setWeather(w);

      // 4. AI farming advice (hybrid cascade)
      const { text } = await chatWithHybridModels(
        `${district} জেলায় ${cond.label}, তাপমাত্রা ${w.temp}°C, আর্দ্রতা ${w.humidity}%, বৃষ্টির সম্ভাবনা ${w.rainProb}%। কৃষকদের জন্য আজকের ৩টি জরুরি পরামর্শ দিন।`
      );
      setAdvice(text);
    } catch (e) {
      // Fallback static data so UI never crashes
      setWeather({
        district: 'ঢাকা', temp: 28, feelsLike: 31, humidity: 75,
        windSpeed: 12, rainProb: 20, condition: 'আংশিক মেঘলা', icon: '⛅',
        et0: 3.2, soilTemp: 26, solarRad: 320, uvIndex: 7,
        forecast: WEEK_DAYS.map((day, i) => ({
          day, icon: '⛅', maxTemp: 30 - i, minTemp: 22,
          rain: 10 + i * 5, condition: 'আংশিক মেঘলা',
        })),
        lat: 23.8103, lng: 90.4125,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, []);

  // ── Spray safety logic (mirrors original) ─────────────────────────────────
  const spray = (() => {
    if (!weather) return { status: 'অজানা', color: '#6b7280', icon: '❓', desc: '' };
    let risk = 0;
    if (weather.windSpeed > 12) risk += 2;
    if (weather.rainProb > 25) risk += 2;
    if (weather.humidity > 80) risk += 1;
    if (weather.temp > 32) risk += 1;
    if (risk >= 3) return { status: 'ঝুঁকিপূর্ণ', color: '#dc2626', icon: '❌', desc: 'এখন স্প্রে করা থেকে বিরত থাকুন। বাতাস ও বৃষ্টির সম্ভাবনা বেশি।' };
    if (risk >= 2) return { status: 'সতর্কতা', color: '#d97706', icon: '⚠️', desc: 'সকাল বা সন্ধ্যায় স্প্রে করুন। আবহাওয়া নিবিড়ভাবে দেখুন।' };
    return { status: 'আদর্শ সময়', color: '#059669', icon: '✅', desc: 'বালাইনাশক প্রয়োগের জন্য উপযুক্ত আবহাওয়া।' };
  })();

  // ── Pest risk logic ────────────────────────────────────────────────────────
  const pests = weather ? [
    {
      name: 'ব্লাস্ট রোগ (Blast)',
      icon: '🌾',
      desc: 'তাপমাত্রা ২২-২৮°C ও আর্দ্রতা ৯০%+ ব্লাস্টের জন্য অনুকূল।',
      high: weather.humidity > 85 && weather.temp < 28,
    },
    {
      name: 'লেট ব্লাইট',
      icon: '🥔',
      desc: 'কুয়াশা ও মেঘলা আকাশ পচন রোগের ঝুঁকি বাড়ায়।',
      high: weather.condition.includes('কুয়াশা') || weather.condition.includes('মেঘ'),
    },
    {
      name: 'চোষক পোকা',
      icon: '🦟',
      desc: 'শুষ্ক ও গরম আবহাওয়া এফিড ও জাব পোকার অনুকূল।',
      high: weather.temp > 30 && weather.humidity < 60,
    },
    {
      name: 'শীষকাটা লেদাপোকা',
      icon: '🐛',
      desc: 'উষ্ণ ও আর্দ্র রাতে পোকার আক্রমণ বাড়ে।',
      high: weather.temp > 26 && weather.humidity > 70,
    },
  ] : [];

  const hasAlert = weather && weather.rainProb > 60;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'forecast', label: '৭ দিনের পূর্বাভাস', icon: '📅' },
    { id: 'risks', label: 'বালাই ঝুঁকি', icon: '⚠️' },
    { id: 'spray', label: 'স্প্রে গাইড', icon: '🧪' },
  ];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backBtn}>← ফিরুন</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>🌤️ স্মার্ট কৃষি আবহাওয়া</Text>
          {weather && <Text style={s.headerSub}>📍 {weather.district}</Text>}
        </View>
        <TouchableOpacity onPress={fetchAll}>
          <Text style={s.refreshBtn}>{loading ? '…' : '↻'}</Text>
        </TouchableOpacity>
      </View>

      {loading && !weather ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.loadingText}>আবহাওয়া তথ্য লোড হচ্ছে…{'\n'}(Open-Meteo • Nominatim)</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
          {/* ── Main Hero Card ─────────────────────────────────────────── */}
          {weather && (
            <View style={s.heroCard}>
              {hasAlert && (
                <View style={s.alertBanner}>
                  <Text style={s.alertText}>⛈️ সতর্কতা: ভারী বৃষ্টির সম্ভাবনা {weather.rainProb}%</Text>
                </View>
              )}
              <Text style={s.heroIcon}>{weather.icon}</Text>
              <Text style={s.heroTemp}>{weather.temp}°C</Text>
              <Text style={s.heroFeels}>অনুভূতি {weather.feelsLike}°C</Text>
              <Text style={s.heroCondition}>{weather.condition}</Text>

              <View style={s.statsRow}>
                <StatPill icon="💧" val={`${weather.humidity}%`} label="আর্দ্রতা" />
                <StatPill icon="💨" val={`${weather.windSpeed}কিমি`} label="বাতাস" />
                <StatPill icon="🌧️" val={`${weather.rainProb}%`} label="বৃষ্টি" />
                <StatPill icon="🔆" val={`UV ${weather.uvIndex}`} label="UV সূচক" />
              </View>
            </View>
          )}

          {/* ── Agri Metrics Row (Open-Meteo fields) ──────────────────── */}
          {weather && (
            <View style={s.agriRow}>
              <AgriMetric icon="🚿" val={`${weather.et0}mm`} label="সেচ চাহিদা (ET0)" />
              <AgriMetric icon="🏺" val={`${weather.soilTemp}°C`} label="মাটির তাপমাত্রা" />
              <AgriMetric icon="☀️" val={`${weather.solarRad}W`} label="সৌর বিকিরণ" />
            </View>
          )}

          {/* ── Tabs ──────────────────────────────────────────────────── */}
          <View style={s.tabs}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.tabBtn, tab === t.id && s.tabBtnActive]}
                onPress={() => setTab(t.id)}
              >
                <Text style={s.tabIcon}>{t.icon}</Text>
                <Text style={[s.tabLabel, tab === t.id && s.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Tab: 7-Day Forecast ───────────────────────────────────── */}
          {tab === 'forecast' && weather && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>আগামী ৭ দিনের আবহাওয়া</Text>
              {weather.forecast.map((d, i) => (
                <View key={i} style={[s.dayRow, i === 0 && s.dayRowToday]}>
                  <Text style={[s.dayName, i === 0 && { fontWeight: '900' }]}>{d.day}</Text>
                  <Text style={s.dayIcon}>{d.icon}</Text>
                  <Text style={s.dayCondition}>{d.condition}</Text>
                  <View style={s.dayRain}>
                    <Text style={s.dayRainText}>🌧️ {d.rain}%</Text>
                  </View>
                  <Text style={s.dayTemp}>
                    <Text style={s.dayMax}>{d.maxTemp}°</Text>
                    <Text style={s.dayMin}> / {d.minTemp}°</Text>
                  </Text>
                </View>
              ))}

              {/* AI Agri Advice */}
              {advice ? (
                <View style={s.adviceCard}>
                  <Text style={s.adviceTitle}>🌾 AI কৃষি পরামর্শ</Text>
                  <Text style={s.adviceText}>{advice}</Text>
                  <Text style={s.adviceSource}>সূত্র: Open-Meteo • AI বিশ্লেষণ</Text>
                </View>
              ) : (
                <View style={s.center}><ActivityIndicator color="#0369a1" /><Text style={s.loadSmall}>পরামর্শ লোড হচ্ছে…</Text></View>
              )}
            </View>
          )}

          {/* ── Tab: Pest Risk ────────────────────────────────────────── */}
          {tab === 'risks' && weather && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>⚠️ বালাই ও রোগ ঝুঁকি</Text>
              <Text style={s.riskSubtitle}>বর্তমান আবহাওয়া বিশ্লেষণ ভিত্তিক (BAMIS পদ্ধতি)</Text>
              {pests.map((p, i) => (
                <View key={i} style={[s.riskCard, p.high ? s.riskHigh : s.riskLow]}>
                  <Text style={s.riskIcon}>{p.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={s.riskHeader}>
                      <Text style={s.riskName}>{p.name}</Text>
                      <View style={[s.riskBadge, { backgroundColor: p.high ? '#dc2626' : '#6b7280' }]}>
                        <Text style={s.riskBadgeText}>{p.high ? 'উচ্চ ঝুঁকি' : 'কম ঝুঁকি'}</Text>
                      </View>
                    </View>
                    <Text style={s.riskDesc}>{p.desc}</Text>
                  </View>
                </View>
              ))}

              <View style={s.condBox}>
                <Text style={s.condTitle}>বর্তমান আবহাওয়া মেট্রিক্স</Text>
                <Text style={s.condText}>তাপমাত্রা: {weather.temp}°C | আর্দ্রতা: {weather.humidity}% | বায়ু: {weather.windSpeed} কিমি/ঘণ্টা</Text>
                <Text style={s.condText}>ET0: {weather.et0} mm/day | মাটির তাপ: {weather.soilTemp}°C</Text>
              </View>
            </View>
          )}

          {/* ── Tab: Spray Guide ─────────────────────────────────────── */}
          {tab === 'spray' && weather && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>🧪 বালাইনাশক স্প্রে গাইড</Text>

              {/* Decision banner */}
              <View style={[s.sprayBanner, { borderColor: spray.color }]}>
                <Text style={s.sprayIcon}>{spray.icon}</Text>
                <Text style={[s.sprayStatus, { color: spray.color }]}>{spray.status}</Text>
                <Text style={s.sprayDesc}>{spray.desc}</Text>
              </View>

              {/* Conditions */}
              <View style={s.sprayGrid}>
                <SprayFactor
                  label="বাতাসের গতি"
                  val={`${weather.windSpeed} কিমি/ঘণ্টা`}
                  ok={weather.windSpeed <= 10}
                  limit="≤ ১০ কিমি/ঘণ্টা"
                />
                <SprayFactor
                  label="আর্দ্রতা"
                  val={`${weather.humidity}%`}
                  ok={weather.humidity >= 50 && weather.humidity <= 80}
                  limit="৫০–৮০%"
                />
                <SprayFactor
                  label="তাপমাত্রা"
                  val={`${weather.temp}°C`}
                  ok={weather.temp <= 32}
                  limit="≤ ৩২°C"
                />
                <SprayFactor
                  label="বৃষ্টির সম্ভাবনা"
                  val={`${weather.rainProb}%`}
                  ok={weather.rainProb < 25}
                  limit="< ২৫%"
                />
              </View>

              {/* Tips */}
              <View style={s.tipsCard}>
                <Text style={s.tipsTitle}>✅ স্প্রে করার সেরা সময়</Text>
                {[
                  'সকাল ৬-৯টা বা বিকাল ৪-৬টা',
                  'বাতাসের বিপরীতে স্প্রে করবেন না',
                  'স্প্রের পর ৪৮ ঘণ্টা বৃষ্টির পূর্বাভাস না থাকলে ভালো',
                  'PPE পরিধান করুন — হাতমোজা, মাস্ক, চশমা',
                  'খালি পেটে বা কড়া রোদে স্প্রে করবেন না',
                ].map((tip, i) => (
                  <Text key={i} style={s.tip}>• {tip}</Text>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatPill = ({ icon, val, label }: { icon: string; val: string; label: string }) => (
  <View style={s.statPill}>
    <Text style={s.statPillIcon}>{icon}</Text>
    <Text style={s.statPillVal}>{val}</Text>
    <Text style={s.statPillLabel}>{label}</Text>
  </View>
);

const AgriMetric = ({ icon, val, label }: { icon: string; val: string; label: string }) => (
  <View style={s.agriMetric}>
    <Text style={s.agriIcon}>{icon}</Text>
    <Text style={s.agriVal}>{val}</Text>
    <Text style={s.agriLabel}>{label}</Text>
  </View>
);

const SprayFactor = ({ label, val, ok, limit }: { label: string; val: string; ok: boolean; limit: string }) => (
  <View style={[s.sprayFactor, ok ? s.sprayFactorOk : s.sprayFactorBad]}>
    <Text style={s.sprayFactorLabel}>{label}</Text>
    <Text style={[s.sprayFactorVal, { color: ok ? '#059669' : '#dc2626' }]}>{val}</Text>
    <Text style={s.sprayFactorLimit}>সীমা: {limit}</Text>
    <Text style={{ fontSize: 18 }}>{ok ? '✅' : '❌'}</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0369a1' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { fontSize: 14, color: '#bae6fd', fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 11, color: '#bae6fd', textAlign: 'center', marginTop: 2 },
  refreshBtn: { fontSize: 22, color: '#bae6fd', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { color: '#bae6fd', marginTop: 12, textAlign: 'center', fontSize: 13, lineHeight: 22 },
  loadSmall: { color: '#6b7280', marginTop: 6, fontSize: 12 },
  // Hero card
  heroCard: {
    alignItems: 'center', paddingTop: 16, paddingBottom: 24,
    paddingHorizontal: 20,
  },
  alertBanner: {
    backgroundColor: '#dc2626', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 8, marginBottom: 12, width: '100%',
  },
  alertText: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  heroIcon: { fontSize: 64, marginBottom: 8 },
  heroTemp: { fontSize: 72, color: '#fff', fontWeight: '200', lineHeight: 80 },
  heroFeels: { fontSize: 13, color: '#bae6fd', marginTop: 2 },
  heroCondition: { fontSize: 18, color: '#e0f2fe', fontWeight: '600', marginTop: 4 },
  statsRow: {
    flexDirection: 'row', marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 4, width: '100%',
  },
  statPill: { flex: 1, alignItems: 'center' },
  statPillIcon: { fontSize: 18 },
  statPillVal: { fontSize: 13, color: '#fff', fontWeight: '700', marginTop: 2 },
  statPillLabel: { fontSize: 10, color: '#bae6fd', marginTop: 1 },
  // Agri metrics
  agriRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
    paddingVertical: 12,
  },
  agriMetric: { flex: 1, alignItems: 'center' },
  agriIcon: { fontSize: 20, marginBottom: 4 },
  agriVal: { fontSize: 13, color: '#fff', fontWeight: '700' },
  agriLabel: { fontSize: 9, color: '#bae6fd', marginTop: 2, textAlign: 'center' },
  // Tabs
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 0, marginTop: 12,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  tabBtnActive: { borderColor: '#0369a1' },
  tabIcon: { fontSize: 16, marginBottom: 2 },
  tabLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280' },
  tabLabelActive: { color: '#0369a1' },
  // Common section
  section: { backgroundColor: '#fff', padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginBottom: 12 },
  // Day row
  dayRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderColor: '#f3f4f6',
  },
  dayRowToday: { backgroundColor: '#f0f9ff', borderRadius: 10, paddingHorizontal: 6 },
  dayName: { width: 42, fontSize: 13, color: '#374151', fontWeight: '600' },
  dayIcon: { fontSize: 20, marginHorizontal: 8 },
  dayCondition: { flex: 1, fontSize: 11, color: '#6b7280' },
  dayRain: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#eff6ff', borderRadius: 8, marginRight: 8 },
  dayRainText: { fontSize: 10, color: '#2563eb', fontWeight: '700' },
  dayTemp: { fontSize: 14 },
  dayMax: { fontWeight: '700', color: '#1f2937' },
  dayMin: { color: '#9ca3af' },
  // AI advice
  adviceCard: {
    backgroundColor: '#f0f9ff', borderRadius: 14, padding: 14,
    marginTop: 16, borderLeftWidth: 4, borderColor: '#0369a1',
  },
  adviceTitle: { fontSize: 14, fontWeight: '800', color: '#0369a1', marginBottom: 8 },
  adviceText: { fontSize: 13, color: '#374151', lineHeight: 22 },
  adviceSource: { fontSize: 10, color: '#9ca3af', marginTop: 8 },
  // Risk
  riskSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  riskCard: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 12,
    borderRadius: 12, marginBottom: 10, gap: 10,
  },
  riskHigh: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  riskLow: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', opacity: 0.7 },
  riskIcon: { fontSize: 24 },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  riskName: { fontSize: 13, fontWeight: '700', color: '#1f2937', flex: 1 },
  riskBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  riskBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  riskDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  condBox: {
    backgroundColor: '#f0f9ff', borderRadius: 12, padding: 12, marginTop: 10,
  },
  condTitle: { fontSize: 12, fontWeight: '700', color: '#0369a1', marginBottom: 4 },
  condText: { fontSize: 12, color: '#374151', lineHeight: 20 },
  // Spray
  sprayBanner: {
    alignItems: 'center', borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 3, backgroundColor: '#f9fafb',
  },
  sprayIcon: { fontSize: 44, marginBottom: 8 },
  sprayStatus: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
  sprayDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  sprayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  sprayFactor: {
    width: '47%', borderRadius: 12, padding: 12,
    borderWidth: 1.5, alignItems: 'center',
  },
  sprayFactorOk: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  sprayFactorBad: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  sprayFactorLabel: { fontSize: 11, color: '#6b7280', fontWeight: '700', marginBottom: 4 },
  sprayFactorVal: { fontSize: 16, fontWeight: '900' },
  sprayFactorLimit: { fontSize: 10, color: '#9ca3af', marginVertical: 4 },
  tipsCard: { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14 },
  tipsTitle: { fontSize: 13, fontWeight: '800', color: '#059669', marginBottom: 10 },
  tip: { fontSize: 13, color: '#374151', lineHeight: 24 },
});
