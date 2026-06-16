import React from 'react';
import { Icon, IconProps } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { MdDownload } from 'react-icons/md';

interface IconWrapperProps extends Omit<IconProps, 'as'> {
  icon: IconType;
}

/**
 * Wrapper component to fix React Icons TypeScript issues
 * Ensures icons are properly typed as ReactElement instead of ReactNode
 */
export const IconWrapper: React.FC<IconWrapperProps> = ({ icon, ...props }) => {
  return <Icon as={icon as any} {...props} />;
};

// Simple icon components for direct usage
interface SimpleIconProps {
  size?: string;
  color?: string;
  style?: React.CSSProperties;
}

export const AddIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>+</span>
);

export const EditIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>✏️</span>
);

export const DeleteIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>🗑️</span>
);

export const BackIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>←</span>
);

export const SearchIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>🔍</span>
);

export const InfoIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>ℹ️</span>
);

export const WarningIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>⚠️</span>
);

export const PersonIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>👤</span>
);

export const TimeIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>🕐</span>
);

export const InventoryIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>📦</span>
);

export const MoneyIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>💰</span>
);

export const UploadIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>📤</span>
);

export const ImageIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>🖼️</span>
);

export const LinkOffIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>🔗</span>
);

export const UpgradeIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>⬆️</span>
);

export const SettingsIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>⚙️</span>
);

export const LightbulbIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>💡</span>
);

export const TravelIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>🧳</span>
);

export const PersonOutlineIcon: React.FC<SimpleIconProps> = (props) => (
  <span style={{ fontSize: props.size || '16px', color: props.color, ...props.style }}>👤</span>
); 

export const DownloadIcon: React.FC<Omit<IconProps, 'as'>> = (props) => (
  <IconWrapper icon={MdDownload} {...props} />
);