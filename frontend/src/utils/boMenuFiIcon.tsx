import type { ReactNode } from 'react';
import {
  FiPieChart,
  FiShoppingCart,
  FiPackage,
  FiXCircle,
  FiRefreshCw,
  FiHome,
  FiGlobe,
  FiBriefcase,
  FiMap,
  FiGrid,
  FiGift,
  FiLink,
  FiKey,
  FiLayers,
  FiShoppingBag,
  FiSettings,
  FiDatabase,
  FiUsers,
  FiSliders,
  FiHash,
  FiMenu,
  FiShield,
  FiFileText,
  FiClipboard,
  FiAlertCircle,
  FiCircle,
} from 'react-icons/fi';

const ICONS: Record<string, (size: number) => ReactNode> = {
  FiPieChart: (s) => <FiPieChart size={s} />,
  FiShoppingCart: (s) => <FiShoppingCart size={s} />,
  FiPackage: (s) => <FiPackage size={s} />,
  FiXCircle: (s) => <FiXCircle size={s} />,
  FiRefreshCw: (s) => <FiRefreshCw size={s} />,
  FiHome: (s) => <FiHome size={s} />,
  FiGlobe: (s) => <FiGlobe size={s} />,
  FiBriefcase: (s) => <FiBriefcase size={s} />,
  FiMap: (s) => <FiMap size={s} />,
  FiGrid: (s) => <FiGrid size={s} />,
  FiGift: (s) => <FiGift size={s} />,
  FiLink: (s) => <FiLink size={s} />,
  FiKey: (s) => <FiKey size={s} />,
  FiLayers: (s) => <FiLayers size={s} />,
  FiShoppingBag: (s) => <FiShoppingBag size={s} />,
  FiSettings: (s) => <FiSettings size={s} />,
  FiDatabase: (s) => <FiDatabase size={s} />,
  FiUsers: (s) => <FiUsers size={s} />,
  FiSliders: (s) => <FiSliders size={s} />,
  FiHash: (s) => <FiHash size={s} />,
  FiMenu: (s) => <FiMenu size={s} />,
  FiShield: (s) => <FiShield size={s} />,
  FiFileText: (s) => <FiFileText size={s} />,
  FiClipboard: (s) => <FiClipboard size={s} />,
  FiAlertCircle: (s) => <FiAlertCircle size={s} />,
};

/** DB om_menu_m.icon 값(react-icons/fi export 이름) → 노드. */
export function renderBoMenuFiIcon(iconName: string | undefined | null, size: number): ReactNode {
  const key = iconName?.trim() ?? '';
  const fn = ICONS[key];
  if (fn) return fn(size);
  return <FiCircle size={size} />;
}
