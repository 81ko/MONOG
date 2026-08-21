// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "ja",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: {
        app: { title: "monologue", subtitle: "A gentle self‑talk app", home: "Home" },
        menu: {
          monologue: "Say a monologue",
          relaxation: "Relaxation",
          circle: "Draw a circle",
          breathing: "Breathing",
          nose: "Nasal breathing",
        },
        headers: {
          monologue: "Monologue",
          relaxation: "Relaxation",
          circle: "Draw a circle",
          breathing: "Breathing",
        },
        monologue: {
          placeholder: "Write a comment…",
          tag_mutter: "Mutter",
          tag_praise: "Praise",
          sent_delete_in_1h: "Delete in 1 hour",
          delete_confirm_title: "Message",
          delete_confirm_body: "Delete this message?",
          delete: "Delete",
          cancel: "Cancel",
          send_options: "Selective delete",
          send_normal: "Delete all",
          audio_play: "Play",
          audio_pause: "Pause",
        },
        relaxation: {
          sounds: "Sounds",
          videos: "Videos",
          stop_sound: "Stop sound",
          stop_video: "Stop video",
          tibetan: "Tibetan bell",
          waves: "Ocean waves",
          rain: "Rain",
          fire: "Fire crackle",
          fireVideo: "Fire burning",
          forestVideo: "Forest video",
          dogVideo: "Dog video",
          seaVideo: "Sea waves video",
          video_placeholder: "Selected video appears here",
        },
        breathing: {
          header: "Breathing",
          start: "Start",
          stop: "Stop",
          inhale: "Inhale",
          exhale: "Exhale",
          hold: "Hold",
          box: "Box 4-4-4-4",
          fourSevenEight: "4-7-8",
          balanced: "Balanced 5-5",
          nose: "Nasal breathing",
          ok: "OK",
          info: {
            box: {
              title: "Box 4-4-4-4",
              body: "Inhale 4s • Hold 4s • Exhale 4s • Hold 4s. Great for quickly resetting stress, improving focus, and balancing the nervous system. Used by athletes and first responders."
            },
            fourSevenEight: {
              title: "4-7-8",
              body: "Inhale 4s • Hold 7s • Exhale 8s. The longer exhale activates the parasympathetic system and can calm anxiety and help sleep. Start with up to 4 cycles to avoid lightheadedness."
            },
            balanced: {
              title: "Balanced 5-5",
              body: "Inhale 5s • Exhale 5s (no holds). About 6 breaths/min, often called coherent breathing. Supports calm focus and heart‑rate variability; good for longer sessions."
            },
            nose: {
    title: "Nasal breathing",
    body: "Inhale and exhale gently through the nose only. Nasal breathing filters and humidifies the air, activates nitric oxide, and supports calm and focus."
  }
          }
        },
        circle: {
          undo: "Undo",
          clear: "Clear",
        },
        common: { lang: "Language", en: "English", ja: "日本語", fr: "Français", zh: "中文" },
        pro: {
          remove_ads_buy: "Remove ads",
          restore: "Restore purchase",
          purchased: "Purchased (No ads)"
        },
      },
    },
    ja: {
      translation: {
        app: { title: "monologue", subtitle: "こころを整える独り言アプリ", home: "ホーム" },
        menu: { monologue: "独り言をいう", relaxation: "リラクゼーション", circle: "円を書く", breathing: "呼吸をする" },
        headers: { monologue: "独り言をいう", relaxation: "リラクゼーション", circle: "円を書く", breathing: "呼吸をする" },
        monologue: {
          placeholder: "コメントを書く…",
          tag_mutter: "呟く",
          tag_praise: "褒める",
          sent_delete_in_1h: "1時間後に消す",
          delete_confirm_title: "メッセージ",
          delete_confirm_body: "削除しますか？",
          delete: "削除",
          cancel: "キャンセル",
          send_options: "選択削除",
          send_normal: "全て削除",
          audio_play: "再生",
          audio_pause: "一時停止",
        },
        relaxation: {
          sounds: "サウンド",
          videos: "動画",
          stop_sound: "サウンド停止",
          stop_video: "動画停止",
          tibetan: "チベットの鐘",
          waves: "波の音",
          rain: "雨の音",
          fire: "火の音",
          fireVideo: "火が燃える",
          forestVideo: "森の動画",
          dogVideo: "犬の動画",
          seaVideo: "海の動画",
          video_placeholder: "動画がここに表示されます",
        },
        breathing: {
          header: "呼吸をする",
          start: "開始",
          stop: "停止",
          inhale: "吸って",
          exhale: "吐いて",
          hold: "止めて",
          box: "ボックス 4-4-4-4",
          fourSevenEight: "4-7-8",
          balanced: "バランス 5-5",
          nose: "鼻呼吸",
          ok: "OK",
          info: {
            box: {
              title: "ボックス呼吸 4-4-4-4",
              body: "4秒吸う・4秒止める・4秒吐く・4秒止める。短時間で気持ちをリセットし、集中を高め、自律神経のバランスを整えます。アスリートや現場職でも使われます。"
            },
            fourSevenEight: {
              title: "4-7-8 呼吸",
              body: "4秒吸う・7秒止める・8秒吐く。長めの吐息で副交感神経が働き、不安の鎮静や入眠サポートに向きます。最初はめまい防止のため最大4サイクルから。"
            },
            balanced: {
              title: "バランス呼吸 5-5",
              body: "5秒吸う・5秒吐く（止めはなし）。1分あたり約6呼吸＝コヒーレント呼吸とも呼ばれます。落ち着いた集中やHRVの向上に役立ち、長めの練習に適します。"
            },
            nose: {
    title: "鼻呼吸",
    body: "鼻だけでゆっくり吸って吐く。鼻呼吸は空気を浄化・加湿し、一酸化窒素を生成してリラックスと集中を助けます。"
  }
          }
        },
        circle: {
          undo: "戻す",
          clear: "全消去",
        },
        common: { lang: "言語", en: "English", ja: "日本語", fr: "Français", zh: "中文" },
        pro: {
          remove_ads_buy: "広告を外す",
          restore: "復元",
          purchased: "購入済み（広告なし）"
        },
      },
    },
    fr: {
      translation: {
        app: { title: "monologue", subtitle: "Une appli pour se parler avec douceur", home: "Accueil" },
        menu: { monologue: "Dire un monologue", relaxation: "Relaxation", circle: "Tracer un cercle", breathing: "Respirer" },
        headers: { monologue: "Monologue", relaxation: "Relaxation", circle: "Tracer un cercle", breathing: "Respiration" },
        monologue: {
          placeholder: "Écrire un commentaire…",
          tag_mutter: "Murmure",
          tag_praise: "Éloge",
          sent_delete_in_1h: "Supprimer dans 1 heure",
          delete_confirm_title: "Message",
          delete_confirm_body: "Supprimer ce message ?",
          delete: "Supprimer",
          cancel: "Annuler",
          send_options: "Suppression sélective",
          send_normal: "Tout supprimer",
          audio_play: "Lire",
          audio_pause: "Pause",
        },
        relaxation: {
          sounds: "Sons",
          videos: "Vidéos",
          stop_sound: "Arrêter le son",
          stop_video: "Arrêter la vidéo",
          tibetan: "Cloche tibétaine",
          waves: "Bruit des vagues",
          rain: "Pluie",
          fire: "Feu de cheminée",
          fireVideo: "Feu qui brûle",
          forestVideo: "Forêt",
          dogVideo: "Chien",
          seaVideo: "Mer",
          video_placeholder: "La vidéo s’affiche ici",
        },
        breathing: {
          header: "Respiration",
          start: "Démarrer",
          stop: "Arrêter",
          inhale: "Inspire",
          exhale: "Expire",
          hold: "Retiens",
          box: "Carré 4-4-4-4",
          fourSevenEight: "4-7-8",
          balanced: "Équilibré 5-5",
          nose: "Respiration nasale",
          ok: "OK",
          info: {
            box: {
              title: "Carré 4-4-4-4",
              body: "Inspire 4 s • Retiens 4 s • Expire 4 s • Retiens 4 s. Idéal pour se recentrer rapidement, calmer le stress et équilibrer le système nerveux. Utilisé par des athlètes."
            },
            fourSevenEight: {
              title: "4-7-8",
              body: "Inspire 4 s • Retiens 7 s • Expire 8 s. L’expiration prolongée active le parasympathique ; utile contre l’anxiété et pour s’endormir. Commencez par ~4 cycles pour éviter l’étourdissement."
            },
            balanced: {
              title: "Équilibré 5-5",
              body: "Inspire 5 s • Expire 5 s (sans pauses). Environ 6 respirations/min, dite cohérente. Favorise le calme, la concentration et la variabilité cardiaque ; adapté aux séances plus longues."
            },
            nose: {
    title: "Respiration nasale",
    body: "Inspire et expire doucement par le nez uniquement. La respiration nasale filtre l’air, favorise l’oxyde nitrique et soutient la concentration et le calme."
  }
          }
        },
        circle: {
          undo: "Annuler",
          clear: "Tout effacer",
        },
        common: { lang: "Langue", en: "English", ja: "日本語", fr: "Français", zh: "中文" },
        pro: {
          remove_ads_buy: "Supprimer les publicités",
          restore: "Restaurer l’achat",
          purchased: "Acheté (sans pub)"
        },
      },
    },
    zh: {
      translation: {
        app: { title: "monologue", subtitle: "温柔的自我独白应用", home: "首页" },
        menu: { monologue: "说独白", relaxation: "放松", circle: "画圆", breathing: "呼吸" },
        headers: { monologue: "独白", relaxation: "放松", circle: "画圆", breathing: "呼吸" },
        monologue: {
          placeholder: "写下评论…",
          tag_mutter: "低语",
          tag_praise: "称赞",
          sent_delete_in_1h: "一小时后删除",
          delete_confirm_title: "消息",
          delete_confirm_body: "要删除这条消息吗？",
          delete: "删除",
          cancel: "取消",
          send_options: "选择性删除",
          send_normal: "全部删除",
          audio_play: "播放",
          audio_pause: "暂停",
        },
        relaxation: {
          sounds: "声音",
          videos: "视频",
          stop_sound: "停止声音",
          stop_video: "停止视频",
          tibetan: "藏钟",
          waves: "海浪声",
          rain: "雨声",
          fire: "火焰声",
          fireVideo: "燃烧的火焰",
          forestVideo: "森林视频",
          dogVideo: "狗狗视频",
          seaVideo: "海浪视频",
          video_placeholder: "视频会显示在这里",
        },
        breathing: {
          header: "呼吸",
          start: "开始",
          stop: "停止",
          inhale: "吸气",
          exhale: "呼气",
          hold: "停留",
          box: "方形 4-4-4-4",
          fourSevenEight: "4-7-8",
          balanced: "均衡 5-5",
          nose: "鼻呼吸",
          ok: "好的",
          info: {
            box: {
              title: "方形呼吸 4-4-4-4",
              body: "吸气4秒 • 屏息4秒 • 呼气4秒 • 再屏息4秒。可快速重置压力、提升专注、平衡神经系统；常被运动员等人群使用。"
            },
            fourSevenEight: {
              title: "4-7-8 呼吸",
              body: "吸气4秒 • 屏息7秒 • 呼气8秒。较长的呼气能激活副交感神经，有助于缓解焦虑与入睡。初学者建议先做不超过4轮，以免头晕。"
            },
            balanced: {
              title: "均衡呼吸 5-5",
              body: "吸气5秒 • 呼气5秒（无屏息）。约每分钟6次，也称“共振/相干呼吸”。有助于平静专注与心率变异性，适合较长时间练习。"
            },
            nose: {
              title: "鼻呼吸",
              body: "仅通过鼻子轻柔地吸气和呼气。鼻呼吸能过滤和加湿空气，促进一氧化氮生成，有助于放松与专注。"
            }
          }
        },
        circle: {
          undo: "撤销",
          clear: "清除",
        },
        common: { lang: "语言", en: "English", ja: "日本語", fr: "Français", zh: "中文" },
        pro: {
          remove_ads_buy: "去除广告",
          restore: "恢复购买",
          purchased: "已购买（无广告）"
        },
      },
    },
  },
});

export default i18n;
