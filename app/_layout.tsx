import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2', // 파란 배경
          },
          headerTintColor: '#fff',      // 흰 글씨
          headerTitleAlign: 'center',   // 제목 중앙 정렬
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ headerShown: false, title: '홈' }} />
        <Drawer.Screen name="totalList" options={{ title: '전체 목록' }} />
        <Drawer.Screen name="expenseRegisterScreen" options={{ title: '등록' }} />
        <Drawer.Screen name="incomeStats" options={{ title: '수입 통계' }} />
        <Drawer.Screen name="expenseStats" options={{ title: '매출 통계' }} />
      </Drawer>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}