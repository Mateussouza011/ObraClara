/**
 * App.tsx - Ponto de entrada da aplicação mobile
 * Configura navegação e contextos globais
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import { MapaObrasScreen } from '@views/MapaObrasScreen';
import { CriarDenunciaScreen } from '@views/CriarDenunciaScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Stack de Abas
 */
function MapasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Mapa"
        component={MapaObrasScreen}
        options={{
          title: 'Obras Próximas',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Stack de Perfil/Configurações
 */
function ConfigStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Stack.Screen
        name="Configuracoes"
        component={PlaceholderScreen}
        options={{
          title: 'Configurações',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Stack de Minhas Denúncias
 */
function DenunciasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Stack.Screen
        name="MinhasDenuncias"
        component={PlaceholderScreen}
        options={{
          title: 'Minhas Denúncias',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Navegação principal com abas
 */
function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Mapa"
        component={MapasStack}
        options={{
          tabBarLabel: 'Obras',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🗺️</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Denuncias"
        component={DenunciasStack}
        options={{
          tabBarLabel: 'Denúncias',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>⚠️</Text>
          ),
        }}
      />

      <Tab.Screen
        name="Configuracoes"
        component={ConfigStack}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Componente placeholder para telas não implementadas
 */
function PlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Em construção... 🚧</Text>
    </View>
  );
}

/**
 * App principal
 */
export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 18,
    color: '#6B7280',
  },
});
