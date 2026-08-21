// src/screens/Home.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable, Modal, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { usePro } from "../pro/usePro";
import { usePurchase } from "../pro/purchase";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

// ✅ ローカルロゴ
import logo from "../../assets/images/logo.png";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function Home({ navigation }: Props) {
  const { t } = useTranslation();
  const [showLangModal, setShowLangModal] = useState(false);

  const { hasPro, loading } = usePro();
  const { buy, restore, loading: paying } = usePurchase();
  const insets = useSafeAreaInsets();


  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <View style={{ flex: 1 }}>
        {/* 🌐 言語切替ボタン（画面右上に固定） */}
        <Pressable
          onPress={() => setShowLangModal(true)}
          style={[styles.langFab, { top: insets.top + 8 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 20 }}>🌐</Text>
        </Pressable>
        {/** 上部コンテンツ（広告の高さぶんを下に余白として確保） */}
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: 16 + insets.top,
              paddingBottom: (!loading && !hasPro ? 80 : 24) + insets.bottom,
            },
          ]}
        >
          {/* ✅ アプリロゴ */}
          <Image style={styles.logo} source={logo} resizeMode="contain" />

          {/* タイトル＆サブタイトル */}
          <Text style={styles.title}>{t("app.title")}</Text>
          <Text style={styles.subtitle}>{t("app.subtitle")}</Text>

          {/* メニュー（濃いブルー＋白文字） */}
          <View style={styles.menuGrid}>
            <MenuCard label={t("menu.monologue")} onPress={() => navigation.navigate("Monologue")} />
            <MenuCard label={t("menu.relaxation")} onPress={() => navigation.navigate("Relaxation")} />
            <MenuCard label={t("menu.circle")} onPress={() => navigation.navigate("Circle")} />
            <MenuCard label={t("menu.breathing")} onPress={() => navigation.navigate("Breathing")} />
          </View>

          {/* 購入セクション：広告を外す/復元 */}
          <View style={{ width: '100%', marginTop: 16, alignItems: 'center' }}>
            {hasPro ? (
              <View style={{
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: '#cfe7ff',
                borderWidth: 1,
                borderColor: '#8bb9f0',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#144B94', fontWeight: '700' }}>{t('pro.purchased') || '購入済み（広告なし）'}</Text>
              </View>
            ) : (
              <View style={{ width: '90%', alignSelf: 'center', flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={buy}
                  disabled={paying}
                  style={({ pressed }) => [
                    styles.card,
                    { flex: 1, width: 'auto', alignSelf: 'auto' },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                 { backgroundColor: '#959090ff', borderColor: '#515050ff', borderWidth: 1 },
                  ]}
                  android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {paying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.cardText}>{t('pro.remove_ads_buy') || '広告を外す ¥100'}</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={restore}
                  disabled={paying}
                  style={({ pressed }) => [
                    styles.card,
                    { flex: 1, width: 'auto', alignSelf: 'auto' },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    { backgroundColor: '#EAF6FF', borderColor: '#468FDB', borderWidth: 1 },
                  ]}
                  android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  <Text style={[styles.cardText, { color: '#144B94' }]}>{t('pro.restore') || '復元'}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* 🌐 言語選択モーダル */}
          <Modal
            visible={showLangModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowLangModal(false)}
          >
            <Pressable style={styles.overlay} onPress={() => setShowLangModal(false)}>
              <View style={styles.langModal}>
                {(["ja", "en", "fr", "zh"] as const).map((code) => (
                  <Pressable
                    key={code}
                    style={styles.langOption}
                    onPress={() => {
                      i18n.changeLanguage(code);
                      navigation.setOptions({ headerTitle: i18n.t("app.title") });
                      setShowLangModal(false);
                    }}
                  >
                    <Text style={styles.langText}>{t(`common.${code}`)}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Modal>
        </ScrollView>

        {/* 下部固定：広告（Proでない時だけ） */}
        {!loading && !hasPro && (
          <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: Math.max(8, insets.bottom) }}>
            <BannerAd
              unitId={TestIds.BANNER}
              size={BannerAdSize.ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
              onAdFailedToLoad={() => {}}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function MenuCard({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      android_ripple={{ color: "rgba(255,255,255,0.25)" }}
    >
      <Text style={styles.cardText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#EAF6FF",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#EAF6FF",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#EAF6FF",
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
    backgroundColor: "#f4f4f4",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  title: { fontSize: 34, fontWeight: "700", textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 6,
    marginBottom: 28,
    textAlign: "center",
  },

  // ✅ メニュー配置
  menuGrid: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    marginTop: 20, // ← 少し下に下げた
  },

  // ✅ メニューボタンデザイン
  card: {
    width: "90%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#468FDB", // 濃いブルー
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff", // 白文字
    textAlign: "center",
    paddingHorizontal: 8,
  },

  // 🌐 モーダル用スタイル
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  langModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: 220,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  langOption: {
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  langText: { fontSize: 16, color: "#333" },
  langFab: {
    position: 'absolute',
    right: 12,
    zIndex: 50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#8BB9F0',
  },
});
