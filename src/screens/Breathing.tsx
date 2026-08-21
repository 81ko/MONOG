// src/screens/Breathing.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Modal, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { usePro } from "../pro/usePro";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

// パターン型
type PatternKey = "box" | "fourSevenEight" | "balanced" | "nose";
type PhaseKey = "inhale" | "hold" | "exhale" | "hold2";

const PATTERNS: Record<
  PatternKey,
  { labelKey: string; phases: Array<{ key: PhaseKey; sec: number }> }
> = {
  box: {
    labelKey: "breathing.box",
    phases: [
      { key: "inhale", sec: 4 },
      { key: "hold", sec: 4 },
      { key: "exhale", sec: 4 },
      { key: "hold2", sec: 4 },
    ],
  },
  fourSevenEight: {
    labelKey: "breathing.fourSevenEight",
    phases: [
      { key: "inhale", sec: 4 },
      { key: "hold", sec: 7 },
      { key: "exhale", sec: 8 },
      { key: "hold2", sec: 0 },
    ],
  },
  balanced: {
    labelKey: "breathing.balanced",
    phases: [
      { key: "inhale", sec: 5 },
      { key: "hold", sec: 0 },
      { key: "exhale", sec: 5 },
      { key: "hold2", sec: 0 },
    ],
  },
  // 🆕 鼻呼吸（吸う5秒 → 吐く5秒）※止めない
  nose: {
    labelKey: "breathing.nose",
    phases: [
      { key: "inhale", sec: 5 },
      { key: "hold", sec: 0 },
      { key: "exhale", sec: 5 },
      { key: "hold2", sec: 0 },
    ],
  },
};

// 🌿 フェーズ別カラー（判別しやすい 3 トーン）
const COLORS = {
  inhale: { fill: "#63C174", border: "#2FA85A" }, // 吸う：はっきり緑
  exhale: { fill: "#D9F2DF", border: "#A8E3B7" }, // 吐く：淡い緑
  hold:   { fill: "#BFEACB", border: "#95D8AC" }, // 止める：中間の緑
};

export default function Breathing() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const insets = useSafeAreaInsets();

  const [pattern, setPattern] = useState<PatternKey>("box");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);

  // 長押しで出す「各呼吸法の説明」モーダル
  const [showInfo, setShowInfo] = useState(false);
  const [infoKey, setInfoKey] = useState<PatternKey | null>(null);
  const openInfo = (k: PatternKey) => { setInfoKey(k); setShowInfo(true); };

  // 残り秒数（円の中央に表示）
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  // 円のアニメ用
  const scale = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0.95)).current;

  // 円の色（フェーズで切替）
  const [circleFill, setCircleFill] = useState(COLORS.inhale.fill);
  const [circleBorder, setCircleBorder] = useState(COLORS.inhale.border);

  // 表示テキスト
  const phaseKey = PATTERNS[pattern].phases[phaseIdx].key;
  const phaseText =
    phaseKey === "inhale" ? t("breathing.inhale") :
    phaseKey === "exhale" ? t("breathing.exhale") :
    t("breathing.hold");

  // ループ（アニメ＋カウントダウン）
  useEffect(() => {
    let mounted = true;

    const setPhaseColor = (key: PhaseKey) => {
      if (key === "inhale") {
        setCircleFill(COLORS.inhale.fill);
        setCircleBorder(COLORS.inhale.border);
      } else if (key === "exhale") {
        setCircleFill(COLORS.exhale.fill);
        setCircleBorder(COLORS.exhale.border);
      } else {
        setCircleFill(COLORS.hold.fill);
        setCircleBorder(COLORS.hold.border);
      }
    };

    const countdown = async (sec: number) => {
      setRemainingSec(sec);
      for (let s = sec - 1; s >= 0 && mounted && running; s--) {
        await waitMs(1000);
        setRemainingSec(s);
      }
      if (mounted) setRemainingSec(null);
    };

    const loop = async () => {
      while (mounted && running) {
        const phases = PATTERNS[pattern].phases;
        for (let i = 0; i < phases.length && mounted && running; i++) {
          const p = phases[i];
          setPhaseIdx(i);
          setPhaseColor(p.key);

          if (p.sec > 0) {
            const cd = countdown(p.sec);
            if (p.key === "inhale") {
              // 吸う：より大きく（1.2 倍）
              await Promise.all([animateTo(1.2, 1.0, p.sec * 1000), cd]);
            } else if (p.key === "exhale") {
              // 吐く：より小さく（0.6 倍）
              await Promise.all([animateTo(0.6, 0.85, p.sec * 1000), cd]);
            } else {
              // 止める：円サイズは固定（アニメなし）
              await Promise.all([waitMs(p.sec * 1000), cd]);
            }
          } else {
            // 0秒フェーズ（hold2 など）は軽く遷移
            if (p.key === "inhale")      await animateTo(1.2, 1.0, 280);
            else if (p.key === "exhale") await animateTo(0.6, 0.85, 280);
            else                         await waitMs(80);
          }
        }
      }
    };

    if (running) loop();
    return () => { mounted = false; setRemainingSec(null); };
  }, [running, pattern]);

  // パターン変更時に初期状態へ戻す
  useEffect(() => {
    setPhaseIdx(0);
    setCircleFill(COLORS.inhale.fill);
    setCircleBorder(COLORS.inhale.border);
    Animated.parallel([
      Animated.timing(scale,   { toValue: 0.75, duration: 240, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.95, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [pattern]);

  const animateTo = (toScale: number, toOpacity: number, duration: number) => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(scale,   { toValue: toScale,   duration, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: toOpacity, duration, useNativeDriver: true }),
      ]).start(() => resolve());
    });
  };

  const waitMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const toggle = () => setRunning((v) => !v);

  const { hasPro, loading } = usePro();
  const showAd = !loading && !hasPro;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EAF6FF" }} edges={["left", "right"]}>
      {/* 戻るボタン（固定表示） */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backTxt}>←</Text>
      </Pressable>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 16 + insets.top,
          paddingBottom: (showAd ? 80 : 20) + insets.bottom,
        }}
      >
        {/* パターン切替（長押しで解説） */}
        <View style={styles.rows}>
          {/* 上段：口呼吸（Box / 4-7-8 / Balanced） */}
          <View style={styles.rowTop}>
            {["box","fourSevenEight","balanced"].map((k) => {
              const active = k === pattern;
              return (
                <Pressable
                  key={k}
                  onPress={() => setPattern(k as PatternKey)}
                  onLongPress={() => openInfo(k as PatternKey)}
                  style={[styles.segBtn, active && styles.segBtnActive]}
                >
                  <Text style={[styles.segText, active && styles.segTextActive]}>
                    {t(PATTERNS[k as PatternKey].labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {/* 下段：鼻呼吸のみ中央配置 */}
          <View style={styles.rowBottom}>
            {(["nose"] as PatternKey[]).map((k) => {
              const active = k === pattern;
              return (
                <Pressable
                  key={k}
                  onPress={() => setPattern(k)}
                  onLongPress={() => openInfo(k)}
                  style={[styles.segBtn, active && styles.segBtnActive]}
                >
                  <Text style={[styles.segText, active && styles.segTextActive]}>
                    {t(PATTERNS[k].labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 円アニメ */}
        <View style={styles.stage}>
          <Animated.View
            style={[
              styles.circle,
              {
                backgroundColor: circleFill,
                borderColor: circleBorder,
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
          {remainingSec !== null && <Text style={styles.timerNum}>{remainingSec}</Text>}
        </View>
        <Text style={styles.phase}>{phaseText}</Text>

        {/* スタート/ストップ */}
        <Pressable onPress={toggle} style={[styles.cta, running ? styles.stop : styles.start]}>
          <Text style={styles.ctaText}>
            {running ? t("breathing.stop") : t("breathing.start")}
          </Text>
        </Pressable>

        {/* 呼吸法の説明モーダル（長押しで表示） */}
        <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
          <Pressable style={styles.overlay} onPress={() => setShowInfo(false)}>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                {infoKey ? t(`breathing.info.${infoKey}.title`) : ""}
              </Text>
              <Text style={styles.infoBody}>
                {infoKey ? t(`breathing.info.${infoKey}.body`) : ""}
              </Text>
              <Pressable style={styles.infoBtn} onPress={() => setShowInfo(false)}>
                <Text style={styles.infoBtnText}>{t("breathing.ok")}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
      {showAd && (
        <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: Math.max(8, insets.bottom) }}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdFailedToLoad={() => {}}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#8BB9F0',
  },
  backTxt: { fontSize: 18, fontWeight: '700', color: '#144B94' },
  container: { flex: 1, padding: 16, backgroundColor: "#EAF6FF" },

  // セグメント（呼吸タイプ）
  segments: { flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 8 },
  segmentsGrid: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 8 },
  col: { flexDirection: "column", gap: 8, alignItems: "center" },
  rows: { marginTop: 8, gap: 10, marginBottom: 12 },
  rowTop: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  rowBottom: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 2 },
  segBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  segBtnActive: { backgroundColor: "#1E5AA8", borderColor: "#1E5AA8" },
  segText: { fontSize: 16, fontWeight: "600", color: "#333" },
  segTextActive: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // ステージ（円）
  stage: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 50 },
  circle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 3,
    // 初期色は state で上書き
    backgroundColor: COLORS.inhale.fill,
    borderColor: COLORS.inhale.border,
    // ほんのり光彩
    shadowColor: "#2FA85A",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  phase: {
    alignSelf: 'center',
    marginTop: 60,
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3A3A',
  },
  timerNum: {
    position: "absolute",
    textAlign: "center",
    fontSize: 52,
    fontWeight: "800",
    color: "#144B94",
    textShadowColor: "rgba(0,0,0,0.10)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // CTA
  cta: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 70, marginBottom: 12 },
  start: { backgroundColor: "#144B94" },
  stop: { backgroundColor: "#3d373bff" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // 情報モーダル
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: 280,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#222" },
  infoBody: { fontSize: 14, color: "#333", lineHeight: 20 },
  infoBtn: { alignSelf: "flex-end", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#222" },
  infoBtnText: { color: "#fff", fontWeight: "700" },
});
