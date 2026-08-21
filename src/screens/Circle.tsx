// src/screens/Circle.tsx
import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  GestureResponderEvent,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path, Circle as SvgCircle } from "react-native-svg";
import { Audio } from "expo-av";
import { useTranslation } from "react-i18next";
import { usePro } from "../pro/usePro";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

const writeSfx = require("../../assets/sounds/write.mp3");

/**
 * シンプルな「落書きパッド」
 * - ペンで描く
 * - 書く音
 * - Undo / Clear
 * - 真ん中に薄いガイド円
 * - 多言語対応（Undo / Clear）
 */

type Stroke = { id: string; d: string; color: string };
type Mode = "pen";

export default function Circle() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { hasPro, loading } = usePro();
  const showAd = !loading && !hasPro;
  const [mode, setMode] = useState<Mode>("pen");
  const [color, setColor] = useState<string>("#222");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const drawingRef = useRef<View>(null);
  const layoutRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const soundRef = useRef<Audio.Sound | null>(null);
  const touchingRef = useRef(false);

  // ======= 書く音（初期化） =======
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(writeSfx, {
          isLooping: true,
          volume: 0.1,
          shouldPlay: false,
        });
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {}
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  const startSfx = async () => {
    try {
      touchingRef.current = true;
      const s = soundRef.current;
      if (!s) return;
      const st: any = await s.getStatusAsync();
      if (!st.isLoaded) return;
      if (!st.isPlaying) await s.playAsync();
    } catch {}
  };

  const stopSfx = async () => {
    try {
      touchingRef.current = false;
      const s = soundRef.current;
      if (!s) return;
      const st: any = await s.getStatusAsync();
      if (st.isPlaying) await s.pauseAsync();
    } catch {}
  };

  // ===== レイアウト取得（中央円の座標用） =====
  const onLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    layoutRef.current = { x, y, w: width, h: height };
    setCanvasSize({ w: width, h: height });
  };

  // ===== 描画ヘルパ =====
  const newId = () => Math.random().toString(36).slice(2);

  const startPen = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const d = `M${locationX},${locationY}`;
    const s: Stroke = { id: newId(), d, color };
    setStrokes((prev) => [...prev, s]);
    startSfx();
  };

  const movePen = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated: Stroke = {
        ...last,
        d: last.d + ` L${locationX},${locationY}`,
      };
      return [...prev.slice(0, -1), updated];
    });
  };

  const endPen = () => {
    stopSfx();
  };

  // ===== Undo / Clear =====
  const undo = useCallback(() => {
    if (mode === "pen" && strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1));
    }
  }, [mode, strokes.length]);

  const clearAll = useCallback(() => {
    setStrokes([]);
  }, []);

  // ===== イベントバインド =====
  const onStart = (e: GestureResponderEvent) => {
    if (mode === "pen") startPen(e);
  };
  const onMove = (e: GestureResponderEvent) => {
    if (mode === "pen") movePen(e);
  };
  const onEnd = () => {
    if (mode === "pen") endPen();
  };

  // ===== UI =====
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EAF6FF' }} edges={["left", "right"]}>
      {/* 戻るボタン（固定） */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backTxt}>←</Text>
      </Pressable>
      <View style={[styles.container, { flex: 1, paddingTop: insets.top + 44 }]}>
        {/* ツールバー */}
        <View style={styles.toolbar}>
          <Segment
            options={[{ key: "pen", label: "✏️" }]}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            renderItem={(opt, active) => (
              <View
                style={[
                  styles.penCircle,
                  { borderColor: active ? "#468FDB" : "#ccc", backgroundColor: active ? "#468FDB" : "#fff" },
                ]}
              >
                <Text style={{ fontSize: 18, color: active ? "#fff" : "#333" }}>{opt.label}</Text>
              </View>
            )}
          />
          <Segment
            options={[
              { key: "#222", label: "●" },
              { key: "#0C83FF", label: "●" },
              { key: "#F9703E", label: "●" },
              { key: "#2EB67D", label: "●" },
              { key: "#E91E63", label: "●" },
            ]}
            value={color}
            onChange={(v) => setColor(v)}
            renderItem={(opt, active) => (
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: opt.key as string, borderColor: active ? "#000" : "#ccc" },
                ]}
              />
            )}
          />
        </View>

        {/* アクションボタン */}
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={undo}>
            <Text style={styles.actionText}>↶ {t("circle.undo")}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={clearAll}>
            <Text style={styles.actionText}>🗑 {t("circle.clear")}</Text>
          </Pressable>
        </View>

        {/* 描画エリア */}
        <View
          ref={drawingRef}
          onLayout={onLayout}
          style={styles.canvas}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={onStart}
          onResponderMove={onMove}
          onResponderRelease={onEnd}
          onResponderTerminate={onEnd}
        >
          {/* Fallback guide circle using View (always visible) */}
          {canvasSize.w > 0 && canvasSize.h > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: canvasSize.w / 2 - Math.min(canvasSize.w, canvasSize.h) * 0.35,
                top: canvasSize.h / 2 - Math.min(canvasSize.w, canvasSize.h) * 0.35,
                width: Math.min(canvasSize.w, canvasSize.h) * 0.70,
                height: Math.min(canvasSize.w, canvasSize.h) * 0.70,
                borderRadius: Math.min(canvasSize.w, canvasSize.h) * 0.35,
                borderWidth: 1.5,
                borderColor: "#d9d9d9",
                opacity: 0.8,
                borderStyle: "dashed",
              }}
            />
          )}
          <Svg
            width={canvasSize.w}
            height={canvasSize.h}
            viewBox={`0 0 ${canvasSize.w} ${canvasSize.h}`}
            style={StyleSheet.absoluteFill}
          >
            {/* 真ん中の薄い円ガイド */}
            {canvasSize.w > 0 && canvasSize.h > 0 && (
              <SvgCircle
                cx={canvasSize.w / 2}
                cy={canvasSize.h / 2}
                r={Math.min(canvasSize.w, canvasSize.h) * 0.35}
                stroke="#d9d9d9"
                strokeWidth={1.5}
                fill="none"
                opacity={0.8}
                strokeDasharray="6 8"
              />
            )}

            {/* 描いた線 */}
            {strokes.map((s) => (
              <Path
                key={s.id}
                d={s.d}
                stroke={s.color}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        </View>
      </View>
      {showAd && (
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
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

/* ===== 小さな部品 ===== */
function Segment<T extends string>({
  options,
  value,
  onChange,
  renderItem,
}: {
  options: { key: T | string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  renderItem?: (opt: { key: T | string; label: string }, active: boolean) => React.ReactNode;
}) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = String(opt.key) === value;
        return (
          <Pressable
            key={String(opt.key)}
            onPress={() => onChange(String(opt.key))}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
          >
            {renderItem ? (
              renderItem(opt, active)
            ) : (
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAF6FF" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  segmentBtnActive: {
    backgroundColor: "#468FDB",
  },
  segmentText: { fontSize: 12, color: "#333" },
  segmentTextActive: { color: "#fff" },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginHorizontal: 5,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f1f1f1",
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },
  actionText: { fontSize: 15, color: "#333", fontWeight: "700" },
  canvas: {
    flex: 0.8,
    margin: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#468FDB",
    overflow: "hidden",
  },
  penCircle: {
    width: 25,
    height: 25,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#8BB9F0',
  },
  backTxt: { fontSize: 18, fontWeight: '700', color: '#144B94' },
  },
);
