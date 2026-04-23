import { useEffect } from 'react';
import { Platform } from 'react-native';

const VERSION_KEY = 'app_version';
const VERSION_URL = '/marui-ranger-app/version.txt';

/**
 * PWA 自動更新チェック
 * - 初回：現在のバージョンを localStorage に記録
 * - 起動・バックグラウンド復帰時：リモートバージョンを取得して比較
 * - 異なればサイレントリロード（キャッシュ無視）
 * Native では何もしない。
 */
export function useAutoUpdate() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    async function check() {
      try {
        const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const remote = (await res.text()).trim();
        if (!remote) return;
        const local = window.localStorage.getItem(VERSION_KEY);
        if (!local) {
          window.localStorage.setItem(VERSION_KEY, remote);
          return;
        }
        if (local !== remote) {
          window.localStorage.setItem(VERSION_KEY, remote);
          // キャッシュ無視で再読み込み
          window.location.reload();
        }
      } catch {
        // ネットワークエラー等は無視
      }
    }

    check();

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    // 定期チェック（10分おき、バックグラウンドから戻らなくても反映）
    const id = window.setInterval(check, 10 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(id);
    };
  }, []);
}
