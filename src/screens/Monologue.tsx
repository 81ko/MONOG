// src/screens/Monologue.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { openDatabaseSync } from "expo-sqlite";
import { useTranslation } from "react-i18next";
import { usePro } from "../pro/usePro";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TagType = "褒める" | "呟く";
type MsgKind = "text" | "image" | "audio";
type Msg = {
  id: string;
  kind: MsgKind;
  tag: TagType;
  text?: string;
  uri?: string;
  createdAt: number;
  deleteAt?: number; // 1時間後に削除指定のとき
};

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

// ===== SQLite helper =====
const db = openDatabaseSync("monologue.db");

function initDB() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      tag TEXT NOT NULL,
      text TEXT,
      uri TEXT,
      createdAt INTEGER NOT NULL,
      deleteAt INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt);
    CREATE INDEX IF NOT EXISTS idx_messages_deleteAt ON messages(deleteAt);
  `);
}

function insertMessage(m: Msg) {
  db.runSync(
    `INSERT OR REPLACE INTO messages (id, kind, tag, text, uri, createdAt, deleteAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [m.id, m.kind, m.tag, m.text ?? null, m.uri ?? null, m.createdAt, m.deleteAt ?? null]
  );
}

function deleteMessage(id: string) {
  db.runSync(`DELETE FROM messages WHERE id = ?`, [id]);
}

function loadMessages(): Msg[] {
  const rs = db.getAllSync<Msg>(`SELECT id, kind, tag, text, uri, createdAt, deleteAt FROM messages ORDER BY createdAt ASC`);
  return rs.map((r: any) => ({
    ...r,
    deleteAt: r.deleteAt ?? undefined,
  }));
}

function deleteExpired(now: number) {
  db.runSync(`DELETE FROM messages WHERE deleteAt IS NOT NULL AND deleteAt <= ?`, [now]);
}

export default function Monologue() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { hasPro, loading } = usePro();
  const showAd = !loading && !hasPro;
  const AD_H = 60; // 広告の見込み高さ

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [tag, setTag] = useState<TagType>("呟く");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const listRef = useRef<FlatList<Msg>>(null);

  const [kbHeight, setKbHeight] = useState(0);
  const [composerH, setComposerH] = useState(96);

  // アニメ表示フラグ
  const [showFlower, setShowFlower] = useState(false);
  const [showWater, setShowWater] = useState(false);
  const [flowerKey, setFlowerKey] = useState(0);
  const [waterKey, setWaterKey] = useState(0);
  // 選択削除モード
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectionBarH, setSelectionBarH] = useState(0);

  // 初期化：DB。iOSの権限は、該当機能を使う直前に要求する。
  useEffect(() => {
    initDB();
    // 起動時：期限切れ削除 → 残りを読み込み
    const now = Date.now();
    deleteExpired(now);
    setMessages(loadMessages());
  }, []);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      setKbHeight(h);
      // 入力中は末尾へスクロール
      scrollToEnd();
    };
    const onHide = () => setKbHeight(0);

    const subShow = Keyboard.addListener(showEvt as any, onShow);
    const subHide = Keyboard.addListener(hideEvt as any, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // キーボードやコンポーザー高さが変わったら末尾へ自動スクロール
  useEffect(() => {
    const id = setTimeout(() => scrollToEnd(), 60);
    return () => clearTimeout(id);
  }, [kbHeight, composerH]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const selectedCount = () => Object.values(selected).filter(Boolean).length;
  const clearSelection = () => { setSelected({}); setSelectionBarH(0); setSelectionMode(false); };
  const toggleSelect = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const selectAll = () => setSelected(Object.fromEntries(messages.map(m => [m.id, true])));

  const pushMessage = (msg: Omit<Msg, "id" | "createdAt">) => {
    const newMsg: Msg = {
      id: Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      ...msg,
    };
    // 先にDBへ保存（＝リロードしても残る）
    insertMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    scrollToEnd();
  };

  const playFlower = () => {
    setFlowerKey((k) => k + 1);
    setShowFlower(true);
    setTimeout(() => setShowFlower(false), 1600);
  };

  const playWater = () => {
    setWaterKey((k) => k + 1);
    setShowWater(true);
    setTimeout(() => setShowWater(false), 1200);
  };

  // === Picker ===
  const onPickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      pushMessage({ kind: "image", uri: res.assets[0].uri, tag });
    }
  };

  const onTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      pushMessage({ kind: "image", uri: res.assets[0].uri, tag });
    }
  };

  // === Audio ===
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (e) {
      // i18n化（簡易）：録音エラー → 既存キーで代用
      Alert.alert(t("monologue.delete_confirm_title"), t("monologue.delete_confirm_body"));
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) pushMessage({ kind: "audio", uri, tag });
    } catch {
      setRecording(null);
    }
  };

  const onToggleRecord = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  const send = (mode: "normal" | "deleteIn1h") => {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushMessage({
      kind: "text",
      text: trimmed,
      tag,
      deleteAt: mode === "deleteIn1h" ? Date.now() + 60 * 60 * 1000 : undefined,
    });
    setText("");
    if (tag === "褒める") playFlower();
  };

  const onPressSend = () => {
    send("normal");
    setTimeout(scrollToEnd, 80);
  };
  const onLongPressSend = () => {
    if (!text.trim()) return;
    Alert.alert(t("monologue.send_options"), t("monologue.send_options"), [
      { text: t("monologue.send_normal"), onPress: () => { send("normal"); setTimeout(scrollToEnd, 80); } },
      { text: t("monologue.sent_delete_in_1h"), onPress: () => { send("deleteIn1h"); setTimeout(scrollToEnd, 80); } },
      { text: t("monologue.cancel"), style: "cancel" },
    ]);
  };

  const onLongPressMessage = (id: string) => {
    if (selectionMode) {
      toggleSelect(id);
      return;
    }
    Alert.alert(t("monologue.delete_confirm_title"), t("monologue.delete_confirm_body"), [
      {
        text: t("monologue.delete"),
        style: "destructive",
        onPress: () => {
          playWater();
          setTimeout(() => {
            deleteMessage(id);
            setMessages((prev) => prev.filter((m) => m.id !== id));
          }, 600);
        },
      },
      {
        text: t("monologue.send_options"), // ラベル流用："選択削除"相当
        onPress: () => {
          setSelectionMode(true);
          setSelected({ [id]: true });
          setSelectionBarH(52);
        }
      },
      { text: t("monologue.cancel"), style: "cancel" },
    ]);
  };

  // 期限切れ自動削除（10秒ごと）：DB側も削除してから再ロード
  useEffect(() => {
    const i = setInterval(() => {
      const now = Date.now();
      deleteExpired(now);
      setMessages(loadMessages());
    }, 10_000);
    return () => clearInterval(i);
  }, []);

  // メッセージ数が変わったら次のtickでスクロール
  useEffect(() => {
    const id = setTimeout(() => scrollToEnd(), 40);
    return () => clearTimeout(id);
  }, [messages.length]);

  const renderItem = ({ item }: { item: Msg }) => {
    const tagLabel = item.tag === "褒める" ? t("monologue.tag_praise") : t("monologue.tag_mutter");
    return (
      <Pressable
        onPress={() => selectionMode && toggleSelect(item.id)}
        onLongPress={() => onLongPressMessage(item.id)}
        style={styles.msgWrap}
      >
        <View style={[
          styles.bubble,
          item.tag === "褒める" ? styles.praise : styles.mutter,
          selectionMode && selected[item.id] && styles.bubbleSelected,
        ]}>
          {item.kind === "text" && <Text style={styles.msgText}>{item.text}</Text>}
          {item.kind === "image" && <Image source={{ uri: item.uri }} style={styles.msgImage} />}
          {item.kind === "audio" && <AudioPlayer uri={item.uri!} />}
          <Text style={styles.meta}>
            #{tagLabel}{item.deleteAt ? `・${t("monologue.sent_delete_in_1h")}` : ""}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={84}
    >
      <View style={styles.screen}>
        {/* 戻るボタン（固定表示） */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { top: insets.top + 8 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingTop: 56 + insets.top,
            padding: 12,
            paddingBottom:
              composerH +
              selectionBarH +
              (showAd ? AD_H : 0) +
              (kbHeight > 0 ? kbHeight + 72 : 108),
          }}
          scrollIndicatorInsets={{
            bottom:
              composerH +
              selectionBarH +
              (showAd ? AD_H : 0) +
              (kbHeight > 0 ? kbHeight + 72 : 108),
          }}
          ListFooterComponent={<View style={{ height: composerH + (showAd ? AD_H : 0) + 24 }} />}
          contentInset={{ bottom: composerH + selectionBarH + (showAd ? AD_H : 0) + 12 }}
          onLayout={scrollToEnd}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
        />

        {/* アニメレイヤ */}
        {showFlower && <FlowerOverlay key={`flower-${flowerKey}`} />}
        {showWater && <WaterOverlay key={`water-${waterKey}`} />}

        {showAd && (
          <View
            style={[
              styles.adWrap,
              { bottom: (kbHeight > 0 ? kbHeight : 0) + composerH },
            ]}
          >
            <BannerAd
              unitId={TestIds.BANNER}
              size={BannerAdSize.ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
              onAdFailedToLoad={() => {}}
            />
          </View>
        )}
      </View>

      {selectionMode && (
        <Animated.View
          onLayout={(e) => setSelectionBarH(e.nativeEvent.layout.height)}
          style={[
            styles.selectBar,
            { bottom: (kbHeight > 0 ? kbHeight + composerH + 8 : composerH + 8) },
          ]}
        >
          <Text style={styles.selectInfo}>{selectedCount()} {t("monologue.delete")} </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[styles.selBtn, styles.selGhost]} onPress={selectAll}>
              <Text style={styles.selBtnText}>{t("monologue.send_normal") /* 流用: "送信"→ここでは"全選択"に相当 */}</Text>
            </Pressable>
            <Pressable style={[styles.selBtn, styles.selDanger]} onPress={() => {
              const ids = Object.keys(selected).filter((k) => selected[k]);
              if (ids.length === 0) return;
              playWater();
              setTimeout(() => {
                ids.forEach((id) => deleteMessage(id));
                setMessages((prev) => prev.filter((m) => !selected[m.id]));
                clearSelection();
              }, 600);
            }}>
              <Text style={styles.selBtnText}>{t("monologue.delete")}</Text>
            </Pressable>
            <Pressable style={[styles.selBtn]} onPress={clearSelection}>
              <Text style={styles.selBtnText}>{t("monologue.cancel")}</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* 下部コンポーザー（キーボード連動で持ち上げ＋高さ計測） */}
      <Animated.View
        onLayout={(e) => setComposerH(e.nativeEvent.layout.height)}
        style={[styles.composer, { transform: [{ translateY: -(kbHeight + 8) }] }]}
      >
        <View style={styles.tags}>
          <TagButton kind="呟く" label={t("monologue.tag_mutter")} active={tag === "呟く"} onPress={() => setTag("呟く")} />
          <TagButton kind="褒める" label={t("monologue.tag_praise")} active={tag === "褒める"} onPress={() => setTag("褒める")} />
        </View>

        <View style={styles.row}>
          <IconBtn label="📷" onPress={onTakePhoto} accessibilityLabel="camera" />
          <IconBtn label="🖼️" onPress={onPickImage} accessibilityLabel="gallery" />
          <RecordButton recording={!!recording} onPress={onToggleRecord} />
          {!!recording && <Text style={styles.recHint}>REC</Text>}
          <TextInput
            style={styles.input}
            placeholder={t("monologue.placeholder")}
            value={text}
            onChangeText={setText}
            multiline
            onFocus={scrollToEnd}
          />
          <Pressable
            onPress={onPressSend}
            onLongPress={onLongPressSend}
            style={({ pressed }) => [styles.send, pressed && { opacity: 0.6 }]}
            accessibilityLabel="send"
          >
            <Text style={styles.sendText}>➤</Text>
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

/* ===== 小パーツ ===== */

function TagButton({
  kind,
  label,
  active,
  onPress,
}: {
  kind: "呟く" | "褒める";
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const activeStyle = kind === "呟く" ? styles.mutterActive : styles.praiseActive;
  return (
    <Pressable onPress={onPress} style={[styles.tagBtn, active && activeStyle]}>
      <Text style={[styles.tagText, active && styles.tagTextActive]}>{label}</Text>
    </Pressable>
  );
}

function IconBtn({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.iconBtn} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.iconText}>{label}</Text>
    </Pressable>
  );
}

function RecordButton({ recording, onPress }: { recording: boolean; onPress: () => void }) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let running = true;
    if (recording) {
      t.setValue(0);
      const loop = () => {
        if (!running) return;
        Animated.timing(t, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          t.setValue(0);
          loop();
        });
      };
      loop();
    }
    return () => {
      running = false;
      t.stopAnimation();
      t.setValue(0);
    };
  }, [recording, t]);

  const ring1Scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ring1Opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const ring2Scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
  const ring2Opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] });

  return (
    <View style={styles.recordWrap}>
      {recording && (
        <>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
        </>
      )}
      <Pressable onPress={onPress} style={styles.recordCore} accessibilityLabel={recording ? "stop recording" : "start recording"}>
        <Text style={{ fontSize: 18 }}>{recording ? "🔴" : "🎙️"}</Text>
      </Pressable>
    </View>
  );
}

function AudioPlayer({ uri }: { uri: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  // format mm:ss
  const fmt = (ms: number | null) => {
    if (ms == null || !isFinite(ms)) return "0:00";
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${m}:${ss}`;
  };

  // Preload sound on mount and get duration (no auto play)
  useEffect(() => {
    let mounted = true;
    let created: Audio.Sound | null = null;

    (async () => {
      try {
        const { sound: s } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, progressUpdateIntervalMillis: 250 }
        );
        created = s;
        if (!mounted) {
          await s.unloadAsync();
          return;
        }
        setSound(s);
        s.setOnPlaybackStatusUpdate(async (st: any) => {
          setPlaying(!!st.isPlaying);
          if (typeof st.durationMillis === "number") setDurationMs(st.durationMillis);
          // 再生が最後まで到達したら、位置を0に戻して何度でも再生できるように
          if (st.didJustFinish) {
            try { await s.setPositionAsync(0); } catch {}
          }
        });
        const st: any = await s.getStatusAsync();
        if (typeof st.durationMillis === "number") setDurationMs(st.durationMillis);
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
      (async () => {
        try { await created?.unloadAsync(); } catch {}
      })();
    };
  }, [uri]);

  const toggle = async () => {
    try {
      if (!sound) {
        const { sound: s } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, progressUpdateIntervalMillis: 250 }
        );
        setSound(s);
        s.setOnPlaybackStatusUpdate(async (st: any) => {
          setPlaying(!!st.isPlaying);
          if (typeof st.durationMillis === "number") setDurationMs(st.durationMillis);
          if (st.didJustFinish) {
            try { await s.setPositionAsync(0); } catch {}
          }
        });
        return;
      }
      const st: any = await sound.getStatusAsync();
      if (st.isPlaying) {
        await sound.pauseAsync();
      } else {
        // 末尾にいる場合は先頭に戻してから再生
        if (
          typeof st.durationMillis === "number" &&
          typeof st.positionMillis === "number" &&
          st.positionMillis >= st.durationMillis - 20
        ) {
          try { await sound.setPositionAsync(0); } catch {}
        }
        await sound.playAsync();
      }
    } catch {}
  };

  return (
    <Pressable onPress={toggle} style={styles.audioBtn}>
      <Text style={styles.audioText}>
        {playing ? "⏸️ Pause" : "▶️ Play"}  {fmt(durationMs)}
      </Text>
    </Pressable>
  );
}

/* ===== アニメオーバーレイ ===== */

// 🌸 花火みたいに画面のあちこちでパッと咲く（10輪）
function FlowerOverlay() {
  // 画面サイズ
  const cx = SCREEN_W * 0.5;
  const cy = SCREEN_H * 0.35; // やや上寄り（下部コンポーザーを避ける）
  const R1 = Math.min(SCREEN_W, SCREEN_H) * 0.28; // 内側リング
  const R2 = Math.min(SCREEN_W, SCREEN_H) * 0.42; // 外側リング

  // 2リング×5箇所 = 10箇所に配置（均等角度＋少しランダム性）
  const items = React.useMemo(() => {
    const arr: { x: number; y: number; size: number; delay: number; glow: number }[] = [];
    for (let i = 0; i < 30; i++) {
  // ランダムな位置に桜を咲かせる
  const x = Math.random() * SCREEN_W;             // 横方向ランダム
  const y = Math.random() * SCREEN_H * 0.8;       // 下部は避ける（コンポーザー重なり防止）
  const size = 30;                                // 全て同じサイズ
  const delay = i * 80;                           // 少しずつ咲く
  const glow = 12 + Math.random() * 10;           // 光り方も少しバラつかせる
  arr.push({ x, y, size, delay, glow });
}
    return arr;
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((b, idx) => (
        <Blossom key={idx} x={b.x} y={b.y} size={b.size} delay={b.delay} glow={b.glow} />
      ))}
    </View>
  );
}

function Blossom({ x, y, size, delay = 0, glow = 18 }: { x: number; y: number; size: number; delay?: number; glow?: number }) {
  const scale = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.4, // 花火っぽく少し大きめに弾ける
          duration: 520,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 380,
        delay: 120,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity, delay]);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        top: y,
        marginLeft: -size * 0.5, // 中心合わせ
        marginTop: -size * 0.5,
        fontSize: size,
        opacity,
        transform: [{ scale }],
        textShadowColor: 'rgba(255,192,203,0.55)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: glow,
      }}
    >
      🌸
    </Animated.Text>
  );
}

function WaterOverlay() {
  // 🫧 画面中央で楕円形の波紋が広がる（ドロップは無し）
  const centerX = SCREEN_W * 0.5;
  const centerY = SCREEN_H * 0.4; // 少し上に配置

  // 波紋は時間差で3つ
  const rippleDelays = React.useMemo(() => [0, 160, 320], []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {rippleDelays.map((d, i) => (
        <Ripple key={i} x={centerX} y={centerY} delay={d} />
      ))}
    </View>
  );
}

function Ripple({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 1200,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [t, delay]);

  // 楕円拡大（横を強めに、縦は控えめ） - ripple made larger
  const scaleX = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 4.0] });
  const scaleY = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 3.0] });
  const opacity = t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.35, 0.25, 0] });

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          left: x,
          top: y,
          transform: [
            { translateX: -25 },
            { translateY: -25 },
            { scaleX },
            { scaleY },
          ],
          opacity,
        },
      ]}
    />
  );
}

/** 絵文字1つを移動＋フェードさせる */
function BurstEmoji({
  emoji,
  dx,
  dy,
  rotate = 0,
  delay = 0,
  duration = 1000,
  scaleTo = 1,
  startX,
  startY,
}: {
  emoji: string;
  dx: number;
  dy: number;
  rotate?: number;
  delay?: number;
  duration?: number;
  scaleTo?: number;
  startX: number;
  startY: number; // ← 数値
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [t, delay, duration]);

  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const opacity = t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 0] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, scaleTo] });
  const rotateZ = `${rotate}deg`; // ← 回転は文字列でOK（公式仕様）

  return (
    <Animated.View
      style={[
        styles.overlayEmoji,
        {
          top: startY,        // ← 数値
          left: startX,       // 画面中央基準
          transform: [{ translateX }, { translateY }, { rotate: rotateZ }, { scale }],
          opacity,
        },
      ]}
    >
      <Text style={styles.overlayText}>{emoji}</Text>
    </Animated.View>
  );
}

/* ===== Styles ===== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF6FF",
  },
  composer: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    backgroundColor: "#EAF6FF",
    paddingBottom: Platform.select({ ios: 24, android: 16 }),
    paddingTop: 8,
    paddingHorizontal: 8,
    gap: 8,
  },
  tags: { flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center", alignSelf: "stretch", paddingHorizontal: 8 },
  tagBtn: {
    width: "40%", // 同じ大きさの長方形（2列）
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  mutterActive: { backgroundColor: "#468FDB", borderColor: "#468FDB" },
  praiseActive: { backgroundColor: "#E86BC5", borderColor: "#E86BC5" },
  tagText: { fontSize: 16, fontWeight: "600", color: "#444" },
  tagTextActive: { color: "#fff" },

  row: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  iconText: { fontSize: 18 },
  recordWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  pulseRing: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ff4d4f",
  },
  recordCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ff4d4f",
    alignItems: "center",
    justifyContent: "center",
  },
  recHint: {
    color: "#ff4d4f",
    fontWeight: "700",
    marginBottom: 6,
    marginRight: 6,
  },

  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#8BB9F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1E5AA8", // 濃い青
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  sendText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  msgWrap: { marginVertical: 6, flexDirection: "row", justifyContent: "flex-end" },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 14 },
  praise: { backgroundColor: "#f9f2ff", borderWidth: 1, borderColor: "#e1d5ff" },
  mutter: { backgroundColor: "#eef6ff", borderWidth: 1, borderColor: "#d7e7ff" },
  bubbleSelected: {
    borderWidth: 2,
    borderColor: '#1E5AA8',
    backgroundColor: '#e6f0ff',
  },
  msgText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500",
    color: "#222",
  },
  msgImage: { width: 200, height: 200, borderRadius: 10, marginVertical: 4 },
  meta: { marginTop: 4, fontSize: 12, color: "#555" },

  audioBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
  },
  audioText: { fontSize: 16, fontWeight: "700", color: "#222" },

  // Overlay
  overlayEmoji: {
    position: "absolute",
    marginLeft: -12, // 絵文字幅の半分くらい
  },
  overlayText: { fontSize: 22 },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4FC3F7', // さわやかな水色
    backgroundColor: 'transparent',
  },
  selectBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfd8ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  selectInfo: { fontSize: 14, fontWeight: '700', color: '#144B94' },
  selBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E5AA8',
  },
  selBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  selGhost: { backgroundColor: '#ef3a03ff' },
  selDanger: { backgroundColor: '#E86B6B' },
  adWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#EAF6FF',
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#8BB9F0',
  },
  backTxt: { fontSize: 18, fontWeight: '700', color: '#144B94' },
});
