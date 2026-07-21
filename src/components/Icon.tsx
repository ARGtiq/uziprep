import {
  LayoutGrid, Timer, Sparkles, CircleUserRound, Clock, ArrowLeft, ArrowRight,
  CheckCircle2, XCircle, GripVertical, X, Award, RotateCcw, ChevronUp, ChevronDown,
  HeartPulse, Heart, MessageSquare, Siren, Waves, ArrowLeftRight, HelpCircle,
  type LucideProps,
} from 'lucide-react';

/**
 * Единственная точка входа для иконок в приложении.
 * Раньше использовался веб-шрифт Material Symbols с Google Fonts —
 * это ломало офлайн-режим PWA и при медленной сети иконки на миг (а то
 * и насовсем, если сети нет) превращались в "сырой" текст лигатуры
 * (monitor_heart, drag_indicator и т.д.), который вылезал за рамки
 * бейджей. lucide-react зашивается в JS-бандл при сборке — иконки
 * работают всегда, в том числе офлайн.
 */
const REGISTRY = {
  grid_view: LayoutGrid,
  timer: Timer,
  auto_awesome: Sparkles,
  account_circle: CircleUserRound,
  schedule: Clock,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  check_circle: CheckCircle2,
  cancel: XCircle,
  drag_indicator: GripVertical,
  close: X,
  workspace_premium: Award,
  refresh: RotateCcw,
  keyboard_arrow_up: ChevronUp,
  keyboard_arrow_down: ChevronDown,
  monitor_heart: HeartPulse,
  cardiology: Heart,
  forum: MessageSquare,
  emergency: Siren,
  waves: Waves,
  compare: ArrowLeftRight,
  help: HelpCircle,
} as const;

export type IconName = keyof typeof REGISTRY;

interface Props extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 20, strokeWidth = 2, ...rest }: Props) {
  const Cmp = REGISTRY[name];
  return <Cmp size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}
