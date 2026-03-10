import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { withRetry, getErrorMsg, OFFLINE_MSG } from '../../src/utils/network';
import { chatWithHybridModels } from '../../src/services/hybridModelService';

// ─── Free map stack ──────────────────────────────────────────────────────────
//  • Leaflet.js        — open-source, no key
//  • OpenStreetMap     — free tiles, no key
//  • Nominatim         — free search/reverse-geocode, no key
//  • Overpass API      — free POI query (agri shops, DAE offices), no key
// ────────────────────────────────────────────────────────────────────────────

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const OVERPASS = 'https://overpass-api.de/api/interpreter';

const SEARCH_TYPES = [
  { id: 'seed',       label: 'বীজ দোকান',      icon: '🌱', query: 'agricultural seed shop' },
  { id: 'pesticide',  label: 'কীটনাশক',         icon: '🧪', query: 'pesticide shop' },
  { id: 'fertilizer', label: 'সার',              icon: '⚗️', query: 'fertilizer shop' },
  { id: 'dae',        label: 'DAE অফিস',        icon: '🏛️', query: 'agriculture office' },
  { id: 'market',     label: 'বাজার',            icon: '🛒', query: 'market bazaar' },
  { id: 'custom',     label: 'অনুসন্ধান',        icon: '🔍', query: '' },
];

interface LatLng { lat: number; lng: number; }
interface Place { name: string; type: string; lat: number; lng: number; address: string; }

// Builds the Leaflet HTML injected into WebView — pure HTML+JS, no server needed
function buildMapHTML(center: LatLng, places: Place[], activeIdx: number | null): string {
  const markers = places.map((p, i) => {
    const color = i === activeIdx ? '#dc2626' : '#0369a1';
    return `
      L.circleMarker([${p.lat},${p.lng}], {
        radius: ${i === activeIdx ? 14 : 10},
        color: '${color}', fillColor: '${color}', fillOpacity: 0.85, weight: 2
      })
      .addTo(map)
      .bindPopup('<b>${p.name.replace(/'/g, "\\'")}</b><br>${p.address.replace(/'/g, "\\'")}')
      ${i === activeIdx ? '.openPopup()' : ''};
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([${center.lat},${center.lng}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 19
  }).addTo(map);

  // User location marker
  L.circleMarker([${center.lat},${center.lng}], {
    radius: 12, color: '#059669', fillColor: '#059669',
    fillOpacity: 1, weight: 3
  }).addTo(map).bindPopup('<b>📍 আপনার অবস্থান</b>');

  // POI markers
  ${markers}
</script>
</body>
</html>`;
}

export default function FieldMapScreen() {
  const router = useRouter();
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [district, setDistrict] = useState('');
  const [searchType, setSearchType] = useState(SEARCH_TYPES[0]);
  const [customQuery, setCustomQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // ── Get GPS + reverse geocode on mount ──────────────────────────────────
  useEffect(() => { requestLocation(); }, []);

  const requestLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fall back to Dhaka
        const dhaka = { lat: 23.8103, lng: 90.4125 };
        setCoords(dhaka);
        setDistrict('ঢাকা (ডিফল্ট)');
        searchPlaces(dhaka, searchType.query || 'agricultural seed shop');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(latlng);

      // Reverse geocode with Nominatim
      try {
        const geo = await fetch(
          `${NOMINATIM_REVERSE}?lat=${latlng.lat}&lon=${latlng.lng}&format=json`,
          { headers: { 'User-Agent': 'KrishiAI/1.0', 'Accept-Language': 'bn' } }
        ).then(r => r.json());
        setDistrict(
          geo?.address?.city ||
          geo?.address?.county ||
          geo?.address?.state_district ||
          geo?.address?.state || ''
        );
      } catch {}

      searchPlaces(latlng, searchType.query || 'agricultural seed shop');
    } catch (e) {
      Alert.alert('', 'GPS চালু করুন অথবা অনুমতি দিন।');
    } finally { setGpsLoading(false); }
  };

  // ── Nominatim nearby search ──────────────────────────────────────────────
  const searchPlaces = async (center: LatLng, q: string) => {
    if (!q.trim()) return;
    setLoading(true); setPlaces([]); setActiveIdx(null);
    try {
      // Nominatim free-text search biased to the user's location
      const url =
        `${NOMINATIM_SEARCH}?q=${encodeURIComponent(q + ' near ' + district)}` +
        `&format=json&limit=8` +
        `&viewbox=${center.lng - 0.1},${center.lat + 0.1},${center.lng + 0.1},${center.lat - 0.1}` +
        `&bounded=0&countrycodes=bd`;

      const results: any[] = await fetch(url, { headers: { 'User-Agent': 'KrishiAI/1.0' } }).then(r => r.json());

      if (results.length === 0) {
        // If Nominatim finds nothing locally, fall back to Overpass within 5 km radius
        const overpassQuery = `[out:json];(
          node["shop"~"agricultural|seeds|fertilizer|garden"](around:5000,${center.lat},${center.lng});
          node["office"="government"](around:5000,${center.lat},${center.lng});
          node["amenity"="marketplace"](around:5000,${center.lat},${center.lng});
        );out;`;
        const op = await fetch(OVERPASS, {
          method: 'POST', body: 'data=' + encodeURIComponent(overpassQuery),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }).then(r => r.json());

        const opPlaces: Place[] = (op.elements || []).slice(0, 8).map((el: any) => ({
          name: el.tags?.name || el.tags?.['name:bn'] || q,
          type: el.tags?.shop || el.tags?.amenity || 'shop',
          lat: el.lat, lng: el.lon,
          address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || '',
        }));
        setPlaces(opPlaces);
      } else {
        const ps: Place[] = results.map((r: any) => ({
          name: r.display_name.split(',')[0],
          type: r.type || r.class,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          address: r.display_name.split(',').slice(1, 3).join(', '),
        }));
        setPlaces(ps);
      }
    } catch (e) { setPlaces([]); console.warn('Map places error:', getErrorMsg(e)); }
    finally { setLoading(false); }
  };

  // ── Ask AI about a place ─────────────────────────────────────────────────
  const askAI = async (place: Place) => {
    setAiLoading(true); setAiResult('');
    try {
      const { text } = await chatWithHybridModels(
        `বাংলাদেশের ${district} এলাকার "${place.name}" কৃষি উপকরণ কেন্দ্রে কী পাওয়া যায়? সাধারণত কী কী সেবা দেয়?`
      );
      setAiResult(text);
    } catch {} finally { setAiLoading(false); }
  };

  const doSearch = () => {
    if (!coords) return;
    const q = searchType.id === 'custom' ? customQuery : searchType.query;
    if (!q.trim()) { Alert.alert('', 'অনুসন্ধানের বিষয় লিখুন'); return; }
    searchPlaces(coords, q);
  };

  const openInMaps = (place: Place) => {
    Linking.openURL(`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}&zoom=18`);
  };

  const mapHTML = coords ? buildMapHTML(coords, places, activeIdx) : '';

  return (
    <SafeAreaView style={m.container} edges={['top']}>
      <View style={m.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={m.back}>← ফিরুন</Text></TouchableOpacity>
        <View>
          <Text style={m.title}>📍 এগ্রি-ম্যাপ</Text>
          {district ? <Text style={m.sub}>{district}</Text> : null}
        </View>
        <TouchableOpacity onPress={requestLocation}>
          {gpsLoading ? <ActivityIndicator color="#bbf7d0" size="small" /> : <Text style={m.gpsBtn}>🎯</Text>}
        </TouchableOpacity>
      </View>

      {/* Map — Leaflet in WebView */}
      <View style={m.mapBox}>
        {coords ? (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: buildMapHTML(coords, places, activeIdx) }}
            style={m.map}
            javaScriptEnabled
            scrollEnabled={false}
          />
        ) : (
          <View style={m.mapPlaceholder}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={m.mapPlaceholderText}>GPS সংযোগ হচ্ছে…</Text>
          </View>
        )}
        {/* Live indicator */}
        <View style={m.liveTag}>
          <View style={[m.liveDot, { backgroundColor: coords ? '#22c55e' : '#ef4444' }]} />
          <Text style={m.liveText}>{coords ? 'লাইভ GPS' : 'সংযোগ নেই'}</Text>
        </View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.chipRow} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {SEARCH_TYPES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[m.chip, searchType.id === t.id && m.chipActive]}
            onPress={() => { setSearchType(t); if (t.id !== 'custom' && coords) searchPlaces(coords, t.query); }}
          >
            <Text style={m.chipIcon}>{t.icon}</Text>
            <Text style={[m.chipText, searchType.id === t.id && m.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom search row */}
      {searchType.id === 'custom' && (
        <View style={m.customRow}>
          <TextInput
            style={m.customInput}
            value={customQuery}
            onChangeText={setCustomQuery}
            placeholder="যেমন: কৃষি যন্ত্রপাতি দোকান..."
            placeholderTextColor="#9ca3af"
            onSubmitEditing={doSearch}
          />
          <TouchableOpacity style={m.searchBtn} onPress={doSearch}>
            <Text style={m.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results list */}
      <ScrollView style={m.list} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={m.listCenter}>
            <ActivityIndicator color="#059669" />
            <Text style={m.listLoadText}>অনুসন্ধান চলছে… (Nominatim • Overpass)</Text>
          </View>
        )}

        {!loading && places.length === 0 && coords && (
          <View style={m.listCenter}>
            <Text style={m.emptyIcon}>🏜️</Text>
            <Text style={m.emptyText}>এই এলাকায় কোনো ফলাফল পাওয়া যায়নি।{'\n'}অন্য ক্যাটাগরি চেষ্টা করুন।</Text>
          </View>
        )}

        {places.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[m.placeCard, activeIdx === i && m.placeCardActive]}
            onPress={() => { setActiveIdx(i === activeIdx ? null : i); if (i !== activeIdx) askAI(p); }}
          >
            <View style={m.placeRow}>
              <View style={m.placeInfo}>
                <Text style={m.placeName}>{p.name}</Text>
                <Text style={m.placeAddress}>{p.address || p.type}</Text>
              </View>
              <TouchableOpacity style={m.navBtn} onPress={() => openInMaps(p)}>
                <Text style={m.navBtnText}>🗺️ OSM</Text>
              </TouchableOpacity>
            </View>

            {activeIdx === i && (
              <View style={m.aiBox}>
                {aiLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#059669" />
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>AI তথ্য লোড হচ্ছে…</Text>
                  </View>
                ) : aiResult ? (
                  <Text style={m.aiText}>{aiResult}</Text>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Attribution */}
        <View style={m.attrib}>
          <Text style={m.attribText}>🗺️ মানচিত্র: OpenStreetMap • অনুসন্ধান: Nominatim / Overpass API</Text>
          <Text style={m.attribText}>সম্পূর্ণ বিনামূল্যে — কোনো API key প্রয়োজন নেই</Text>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#166534', paddingHorizontal: 16, paddingVertical: 12,
  },
  back: { fontSize: 14, color: '#bbf7d0', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  sub: { fontSize: 11, color: '#bbf7d0', textAlign: 'center' },
  gpsBtn: { fontSize: 22 },
  mapBox: { height: 240, position: 'relative', backgroundColor: '#e5e7eb' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapPlaceholderText: { color: '#6b7280', marginTop: 10, fontSize: 13 },
  liveTag: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5, gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  chipRow: { flexShrink: 0, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8,
    borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#166534', borderColor: '#166534' },
  chipIcon: { fontSize: 14, marginRight: 4 },
  chipText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  chipTextActive: { color: '#fff' },
  customRow: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', gap: 8 },
  customInput: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 13,
    borderWidth: 1, borderColor: '#d1fae5', color: '#1f2937',
  },
  searchBtn: { backgroundColor: '#166534', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { fontSize: 16 },
  list: { flex: 1, backgroundColor: '#fff' },
  listCenter: { alignItems: 'center', paddingVertical: 24 },
  listLoadText: { color: '#6b7280', fontSize: 12, marginTop: 8 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#9ca3af', fontSize: 13, textAlign: 'center', lineHeight: 22 },
  placeCard: {
    marginHorizontal: 12, marginTop: 8, backgroundColor: '#f9fafb',
    borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  placeCardActive: { borderColor: '#166534', backgroundColor: '#f0fdf4' },
  placeRow: { flexDirection: 'row', alignItems: 'center' },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 2 },
  placeAddress: { fontSize: 11, color: '#6b7280' },
  navBtn: {
    backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0',
  },
  navBtnText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  aiBox: { marginTop: 10, borderTopWidth: 1, borderColor: '#d1fae5', paddingTop: 8 },
  aiText: { fontSize: 12, color: '#374151', lineHeight: 20 },
  attrib: { padding: 16, alignItems: 'center' },
  attribText: { fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 16 },
});
