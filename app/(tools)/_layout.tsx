import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="weather" />
      <Stack.Screen name="nutrient" />
      <Stack.Screen name="disease-library" />
      <Stack.Screen name="soil-expert" />
      <Stack.Screen name="soil-guide" />
      <Stack.Screen name="pesticide" />
      <Stack.Screen name="biocontrol" />
      <Stack.Screen name="yield" />
      <Stack.Screen name="ai-yield" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="leaf-color" />
      <Stack.Screen name="plant-defense" />
      <Stack.Screen name="flashcards" />
      <Stack.Screen name="podcast" />
      <Stack.Screen name="field-monitoring" />
    </Stack>
  );
}
