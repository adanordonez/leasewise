import { HugeiconsIcon } from '@hugeicons/react';
import { type IconSvgObject } from '@hugeicons/react';

interface HugeIconProps {
  icon: IconSvgObject;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

/**
 * Wrapper component for Hugeicons to match Lucide's API
 * Makes it easy to drop-in replace Lucide icons
 * 
 * Usage:
 * import { UploadIcon } from '@hugeicons/core-free-icons';
 * <HugeIcon icon={UploadIcon} size={24} className="text-blue-600" />
 * 
 * Note: Free version uses simple names (UploadIcon).
 * Pro version has variants (Upload01Icon, Upload02Icon, etc.)
 */
export function HugeIcon({ 
  icon, 
  size = 24, 
  strokeWidth = 1.5, 
  className,
  color = "currentColor"
}: HugeIconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
    />
  );
}

