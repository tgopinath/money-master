// Android app mode (Material Design 3, from the shared Kolam M3 kit in public/m3).
// Only inside the Android app (or ?app=android); in a browser KolamM3.init returns a stub and nothing changes.
// The kit's callbacks run outside React, so they talk to App through window events.
type M3 = {
  enabled: boolean;
  setTitle(t: string): void;
  setActive(id: string | null): void;
  setBack(v: boolean | string | null): void;
  setActions(a: unknown[]): void;
};
type Kit = { isAndroid: boolean; init(o: unknown): M3 };

export type View = 'play' | 'challenges' | 'change';
export const VIEW_OF_HASH = (h: string): View => (h === '#/challenges' ? 'challenges' : h === '#/change' ? 'change' : 'play');
export const TITLES: Record<View, string> = { play: 'Money Master', challenges: 'Challenges', change: 'Bigger money' };

/** App keeps this up to date so Back can close the celebration before leaving the screen. */
export const backState = { celebrating: false };

const kit = (window as unknown as { KolamM3?: Kit }).KolamM3;

// iPhone app mode (Apple HIG, from the shared Kolam iOS kit in public/ios). Only inside the MoneyMaster-iOS shell
// (or ?app=ios); KolamIOS.init returns null in a browser. If both kits match, iOS wins.
type IOSAction = { id?: string; icon?: string; text?: string; label?: string; onClick?: () => void };
type IOSKit = {
  isIOS: boolean;
  detect(tokens?: string[]): boolean;
  init(o: unknown): unknown;
  navBar: { set(cfg: { title: string; large?: boolean; actions?: IOSAction[]; keepTitle?: boolean }): void };
  tabBar: { select(id: string | null): void; badge(id: string, n: number | string | null): void };
  enhance(el?: Element | null): void;
};
const iosKit = (window as unknown as { KolamIOS?: IOSKit }).KolamIOS;
const SPEAKER_OFF = '<svg class="ios-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>';
export const ios: IOSKit | null =
  iosKit && (iosKit.isIOS || iosKit.detect(['MoneyMaster-iOS'])) &&
  iosKit.init({
    appName: 'Money Master', uaTokens: ['MoneyMaster-iOS'], tint: '#a84508',
    tabs: [
      { id: 'play', label: 'Play', icon: 'house', href: '#/' },
      { id: 'challenges', label: 'Challenges', icon: 'star', href: '#/challenges' },
      { id: 'change', label: 'Bigger money', icon: 'arrow.clockwise', href: '#/change' },
    ],
    currentTab: VIEW_OF_HASH(location.hash), content: '#root',
  })
    ? iosKit
    : null;
if (ios) document.documentElement.classList.remove('k-android', 'k-app');
export const iosMuteAction = (muted: boolean): IOSAction => ({
  id: 'iosMute', icon: muted ? SPEAKER_OFF : 'speaker.wave.2', label: muted ? 'Turn sound on' : 'Turn sound off',
  onClick: () => window.dispatchEvent(new Event('mm:mute')),
});
/** Android (M3) or iPhone (HIG) app: both split the screen into Play / Challenges / Bigger money. */
export const inApp = () => m3.enabled || !!ios;

export const muteAction = (muted: boolean) => ({
  id: 'm3Mute', icon: muted ? 'volume_off' : 'volume_up', label: muted ? 'Turn sound on' : 'Turn sound off',
  onClick: () => window.dispatchEvent(new Event('mm:mute')),
});

export const m3: M3 = kit?.isAndroid && !ios
  ? kit.init({
      primary: '#c55410',
      title: TITLES[VIEW_OF_HASH(location.hash)],
      destinations: [
        { id: 'play', label: 'Play', icon: 'payments', href: '#/' },
        { id: 'challenges', label: 'Challenges', icon: 'military_tech', href: '#/challenges' },
        { id: 'change', label: 'Bigger money', icon: 'currency_exchange', href: '#/change' },
      ],
      actions: [muteAction(false)],
      icons: ['volume_off', 'volume_up'],
      onBack: () => {
        if (!backState.celebrating) return false;
        window.dispatchEvent(new Event('mm:dismiss'));
        return true;
      },
    })
  : { enabled: false, setTitle() {}, setActive() {}, setBack() {}, setActions() {} };
