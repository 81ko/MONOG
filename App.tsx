// App.tsx
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import mobileAds from "react-native-google-mobile-ads";

// 画面
import Home from "./src/screens/Home";
import Monologue from "./src/screens/Monologue";
import Relaxation from "./src/screens/Relaxation";
import Circle from "./src/screens/Circle";
import Breathing from "./src/screens/Breathing";

// i18n
import "./src/i18n";

// Pro（広告オフ管理）
import { ProProvider } from "./src/pro/usePro";

export type RootStackParamList = {
  Home: undefined;
  Monologue: undefined;
  Relaxation: undefined;
  Circle: undefined;
  Breathing: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  React.useEffect(() => {
    mobileAds().initialize().catch(() => {});
  }, []);
  return (
    <ProProvider>
      <NavigationContainer>
        {/* ステータスバーの背景色も薄い青 */}
        <StatusBar backgroundColor="#EAF6FF" barStyle="dark-content" />

        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false, // 全ページでタイトルバーを非表示
            contentStyle: { backgroundColor: "#EAF6FF" }, // 全体背景を青に統一
          }}
        >
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Monologue" component={Monologue} />
          <Stack.Screen name="Relaxation" component={Relaxation} />
          <Stack.Screen name="Circle" component={Circle} />
          <Stack.Screen name="Breathing" component={Breathing} />
        </Stack.Navigator>
      </NavigationContainer>
    </ProProvider>
  );
}
