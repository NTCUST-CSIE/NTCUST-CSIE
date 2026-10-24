export type WindowStyle = 'mac' | 'windows' | 'linux';

const STYLES: WindowStyle[] = ['mac', 'windows', 'linux'];

// 依使用者的系統決定終端機狀態列長怎樣
// 預覽用：網址加上 ?os=mac / ?os=windows / ?os=linux 可以強制切換
export const detectWindowStyle = (): WindowStyle => {
  const preview = new URLSearchParams(window.location.search).get('os');
  if (preview && STYLES.includes(preview as WindowStyle)) return preview as WindowStyle;

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = (nav.userAgentData?.platform || nav.platform || '').toLowerCase();
  const ua = nav.userAgent.toLowerCase();

  // iPad 的 Safari 會自稱 MacIntel，剛好也歸到 macOS
  if (/mac|iphone|ipad|ipod/.test(platform) || /mac os x|iphone|ipad/.test(ua)) return 'mac';
  if (/win/.test(platform) || /windows/.test(ua)) return 'windows';
  return 'linux';
};
