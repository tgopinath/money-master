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
export const muteAction = (muted: boolean) => ({
  id: 'm3Mute', icon: muted ? 'volume_off' : 'volume_up', label: muted ? 'Turn sound on' : 'Turn sound off',
  onClick: () => window.dispatchEvent(new Event('mm:mute')),
});

export const m3: M3 = kit?.isAndroid
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
