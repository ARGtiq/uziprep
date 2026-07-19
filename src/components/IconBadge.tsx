import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { getIconColor } from '@/lib/iconColors';

interface Props {
  icon: IconName;
  /** id станции или ключ режима — определяет цвет в разноцветном режиме */
  colorKey: string;
  size?: 'sm' | 'md';
}

const SIZE_CLASSES = { sm: 'h-10 w-10', md: 'h-11 w-11' } as const;
const ICON_SIZE = { sm: 20, md: 22 } as const;

/**
 * Единая точка рендера "иконка в бейдже" — используется на карточках
 * станций, кнопках режимов экзамена и т.д. Переключатель "Разноцветные
 * иконки" в Профиле (ThemeProvider.colorfulIcons) меняет вид сразу
 * везде, где используется этот компонент, а не в одном месте.
 */
export function IconBadge({ icon, colorKey, size = 'md' }: Props) {
  const { colorfulIcons } = useTheme();
  const dim = SIZE_CLASSES[size];
  const iconSize = ICON_SIZE[size];

  if (colorfulIcons) {
    const hex = getIconColor(colorKey);
    return (
      <span className={`flex ${dim} shrink-0 items-center justify-center rounded-m3-md`} style={{ backgroundColor: `${hex}1F` }}>
        <Icon name={icon} size={iconSize} color={hex} />
      </span>
    );
  }

  return (
    <span className={`flex ${dim} shrink-0 items-center justify-center rounded-m3-md bg-primary-container text-on-primary-container`}>
      <Icon name={icon} size={iconSize} />
    </span>
  );
}
