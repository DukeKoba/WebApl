import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RaceListScreen from './src/screens/RaceListScreen';
import RaceDetailScreen from './src/screens/RaceDetailScreen';

const Stack = createNativeStackNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    primary: '#818cf8',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#f1f5f9',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="RaceList"
          component={RaceListScreen}
          options={{ title: '大井競馬AI予想', headerShown: false }}
        />
        <Stack.Screen
          name="RaceDetail"
          component={RaceDetailScreen}
          options={({ route }) => ({
            title: `${route.params.raceId}R 詳細`,
            headerBackTitle: '戻る',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
