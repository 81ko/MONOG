// src/screens/Relaxation.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Audio, Video, ResizeMode } from "expo-av";
import { useTranslation } from "react-i18next";
import { usePro } from "../pro/usePro";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

/**
 * ローカル（アプリ同梱）ファイルを使う版
 * 事前に下記を配置しておいてください：
 *
 * monologue/
 *  ┣ src/
 *  ┃ ┗ screens/
 *  ┃   ┗ Relaxation.tsx
 *  ┗ assets/
 *      ┣ sounds/
 *      ┃ ┣ tibetan.mp3
 *      ┃ ┣ waves.mp3
 *      ┃ ┣ rain.mp3
 *      ┃ ┗ fire.mp3
 *      ┗ videos/
 *          ┣ fire.mp4
 *          ┣ forest.mp4
 *          ┣ dog.mp4
 *          ┗ sea.mp4
 */

// ===== ローカル音源・動画のインポート =====
const tibetan = require("../../assets/sounds/tibetan.mp3");
const waves = require("../../assets/sounds/waves.mp3");
const rain = require("../../assets/sounds/rain.mp3");
const fire = require("../../assets/sounds/fire.mp3");

const fireVideo = require("../../assets/videos/fire.mp4");
const forestVideo = require("../../assets/videos/forest.mp4");
const dogVideo = require("../../assets/videos/dog.mp4");
const seaVideo = require("../../assets/videos/sea.mp4");

type SoundKey = "tibetan" | "waves" | "rain" | "fire";
type VideoKey = "fireVideo" | "forestVideo" | "dogVideo" | "seaVideo";

// require/import されたローカルファイルは number 型（バンドルIDのようなもの）になります
const SOUND_SOURCES: Record<SoundKey, number> = {
  tibetan,
  waves,
  rain,
  fire,
};

const VIDEO_FILES: Record<VideoKey, number> = {
  fireVideo,
  forestVideo,
  dogVideo,
  seaVideo,
};

export default function Relaxation() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { hasPro, loading } = usePro();
  const showAd = !loading && !hasPro;
  // ===== Audio =====
  const [currentSoundKey, setCurrentSoundKey] = useState<SoundKey | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      // 画面離脱時に解放
      soundRef.current?.unloadAsync();
      videoRef.current?.unloadAsync();
    };
  }, []);

  const playSound = async (key: SoundKey) => {
    try {
      // 同じキーを再タップで停止
      if (currentSoundKey === key && isPlaying) {
        await soundRef.current?.stopAsync();
        setIsPlaying(false);
        return;
      }
      // 他の音が鳴っていたら停止・解放
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
        } catch {}
        try {
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }
      // ローカルファイルをそのまま渡す（{ uri: ... } ではない）
      const { sound } = await Audio.Sound.createAsync(
        SOUND_SOURCES[key],
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      setCurrentSoundKey(key);
      setIsPlaying(true);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  };

  const stopSound = async () => {
    try {
      await soundRef.current?.stopAsync();
      setIsPlaying(false);
    } catch {}
  };

  // ===== Video =====
  const [currentVideoKey, setCurrentVideoKey] = useState<VideoKey | null>(null);
  const videoRef = useRef<Video>(null);

  const selectVideo = async (key: VideoKey) => {
    setCurrentVideoKey(key);
    // 自動再生（ループ）
    await videoRef.current?.setIsMutedAsync(false);
    await videoRef.current?.setIsLoopingAsync(true);
    await videoRef.current?.playAsync();
  };

  const stopVideo = async () => {
    try {
      await videoRef.current?.stopAsync();
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EAF6FF' }} edges={["left", "right"]}>
      {/* 戻るボタン（固定表示） */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backTxt}>←</Text>
      </Pressable>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: 48 + insets.top, paddingBottom: (showAd ? 80 : 20) + insets.bottom },
        ]}
      >
        <View style={{ height: 24 }} />
        <Text style={styles.sectionTitle}>{t("relaxation.sounds")}</Text>
        <View style={styles.grid}>
          <SoundButton
            label={t("relaxation.tibetan")}
            active={currentSoundKey === "tibetan" && isPlaying}
            onPress={() => playSound("tibetan")}
          />
          <SoundButton
            label={t("relaxation.waves")}
            active={currentSoundKey === "waves" && isPlaying}
            onPress={() => playSound("waves")}
          />
          <SoundButton
            label={t("relaxation.rain")}
            active={currentSoundKey === "rain" && isPlaying}
            onPress={() => playSound("rain")}
          />
          <SoundButton
            label={t("relaxation.fire")}
            active={currentSoundKey === "fire" && isPlaying}
            onPress={() => playSound("fire")}
          />
        </View>
        <Pressable style={[styles.controlBtn, styles.stopBtn]} onPress={stopSound}>
          <Text style={styles.controlText}>{t("relaxation.stop_sound")}</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t("relaxation.videos")}</Text>
        <View style={styles.grid}>
          {(Object.keys(VIDEO_FILES) as VideoKey[]).map((k) => (
            <VideoButton
              key={k}
              label={t(`relaxation.${k}`)}
              active={currentVideoKey === k}
              onPress={() => selectVideo(k)}
            />
          ))}
        </View>

        <Pressable style={[styles.controlBtn, styles.stopBtn]} onPress={stopVideo}>
          <Text style={styles.controlText}>{t("relaxation.stop_video")}</Text>
        </Pressable>

        <View style={{ height: 16 }} />

        {/* プレビュー領域（選択した動画を表示） */}
        <View style={styles.preview}>
          {currentVideoKey ? (
            <Video
              ref={videoRef}
              style={styles.video}
              // ローカル動画をそのまま渡す（{ uri: ... } ではない）
              source={VIDEO_FILES[currentVideoKey]}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              isLooping
            />
          ) : (
            <Text style={{ color: "#666", fontSize: 16 }}>{t("relaxation.video_placeholder")}</Text>
          )}
        </View>
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

/* ===== 小さなボタンたち ===== */

function SoundButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.itemBtn, active && styles.activeItem]}>
      <Text style={[styles.itemText, active && styles.activeItemText]}>
        {active ? "▶ " : ""}{label}
      </Text>
    </Pressable>
  );
}

function VideoButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.itemBtn, active && styles.activeItem]}>
      <Text style={[styles.itemText, active && styles.activeItemText]}>
        {active ? "▶ " : ""}{label}
      </Text>
    </Pressable>
  );
}

/* ===== styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF6FF' },
  scrollView: {
    flex: 1,
    backgroundColor: '#EAF6FF',
  },
  scroll: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemBtn: {
    width: '47%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#468FDB',
    backgroundColor: '#468FDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeItem: {
    backgroundColor: '#144B94', // 濃い青
    borderColor: '#144B94',
  },
  itemText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  activeItemText: { color: '#fff' },

  controlBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#efefef",
    alignItems: "center",
  },
  stopBtn: { backgroundColor: "#f2f2f2" },
  controlText: { fontSize: 16, fontWeight: "600" },

  preview: {
    marginTop: 0,
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6FF',
  },
  video: { width: "100%", height: "100%" },
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
});
