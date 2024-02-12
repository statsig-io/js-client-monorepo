import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeBaseProvider } from 'native-base';
import React from 'react';

import BootstrapExampleScreen from './BootstrapExampleScreen';
import HomeScreen from './HomeScreen';

const Stack = createNativeStackNavigator();

const routes = [
  {
    name: 'Home',
    component: HomeScreen,
    options: {
      headerShown: false,
      statusBarHidden: true,
    },
  },
  {
    name: 'Bootstrap',
    component: BootstrapExampleScreen,
    options: {
      statusBarHidden: true,
      headerStyle: {
        backgroundColor: '#1f222a',
      },
      headerTintColor: 'white',
    },
  },
];

export default function App(): React.ReactNode {
  return (
    <NativeBaseProvider
      initialWindowMetrics={{
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <NavigationContainer>
        <Stack.Navigator>
          {routes.map((routeConfig) => (
            <Stack.Screen key={routeConfig.name} {...routeConfig} />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </NativeBaseProvider>
  );
}
