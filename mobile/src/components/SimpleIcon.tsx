import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

interface SimpleIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
}

const SimpleIcon: React.FC<SimpleIconProps> = ({ name, size = 24, color = '#000', style }) => {
  const materialNameMap: { [key: string]: string } = {
    // Common aliases → Material icon names
    'person-circle': 'account-circle',
    'calendar': 'event',
    'checkmark-circle': 'check-circle',
    'time': 'access-time',
    'cash': 'attach-money',
    'folder': 'folder',
    'flask': 'science',
    'medical': 'medical-services',
    'video': 'videocam',
    'video-call': 'videocam',
    'videocam': 'videocam',
    'home': 'home',
    'dashboard': 'dashboard',
    'people': 'people',
    'help': 'help-outline',
    'menu': 'menu',
    'hospital': 'local-hospital',

    // Auth & user
    'person': 'person',
    'person-add': 'person-add',
    'lock': 'lock',
    'lock-open': 'lock-open',
    'email': 'email',
    'visibility': 'visibility',
    'visibility-off': 'visibility-off',
    'arrow-back': 'arrow-back',
    'arrow-left': 'arrow-back',
    'arrow-forward': 'arrow-forward',
    'close': 'close',
    'check': 'check',
    'edit': 'edit',
    'save': 'save',
    'delete': 'delete',
    'add': 'add',
    'remove': 'remove',

    // Medical & health
    'local-hospital': 'local-hospital',
    'medication': 'medication',
    'science': 'science',
    'emergency': 'emergency',
    'favorite': 'favorite',
    'favorite-border': 'favorite-border',
    'star': 'star',
    'star-border': 'star-border',
    'schedule': 'schedule',
    'event': 'event',
    'event-available': 'event-available',
    'event-busy': 'event-busy',
    'event-note': 'event-note',

    // Communication
    'message': 'message',
    'chat': 'chat',
    'call': 'call',
    'phone': 'phone',
    'notifications': 'notifications',
    'notifications-none': 'notifications-none',
    'notifications-active': 'notifications-active',

    // Actions & controls
    'play-arrow': 'play-arrow',
    'pause': 'pause',
    'stop': 'stop',
    'refresh': 'refresh',
    'search': 'search',
    'filter-list': 'filter-list',
    'sort': 'sort',
    'more-vert': 'more-vert',
    'more-horiz': 'more-horiz',
    'settings': 'settings',
    'info': 'info',
    'warning': 'warning-amber',
    'error': 'error-outline',
    'alert-circle': 'error-outline',
    'check-circle': 'check-circle',
    'cancel': 'cancel',
    'copy': 'content-copy',
    'share': 'share',
    'link': 'link',

    // Navigation & movement
    'keyboard-arrow-up': 'keyboard-arrow-up',
    'keyboard-arrow-down': 'keyboard-arrow-down',
    'keyboard-arrow-left': 'keyboard-arrow-left',
    'keyboard-arrow-right': 'keyboard-arrow-right',
    'expand-more': 'expand-more',
    'expand-less': 'expand-less',
    'chevron-left': 'chevron-left',
    'chevron-right': 'chevron-right',

    // Files & documents
    'description': 'description',
    'attach-file': 'attach-file',
    'download': 'download',
    'upload': 'upload',
    'print': 'print',

    // Status & indicators
    'radio-button-unchecked': 'radio-button-unchecked',
    'radio-button-checked': 'radio-button-checked',
    'check-box': 'check-box',
    'check-box-outline-blank': 'check-box-outline-blank',
    'indeterminate-check-box': 'indeterminate-check-box',

    // Additional
    'account-circle': 'account-circle',
    'calendar-today': 'calendar-today',
    'work': 'work',
    'school': 'school',
    'business': 'business',
    'minimize': 'minimize',
    'videocam-off': 'videocam-off',
    'flip-camera-android': 'flip-camera-android',
    'flip-camera-ios': 'flip-camera-ios',
    'call-end': 'call-end',
    'note-add': 'note-add',
    'person-search': 'person-search',
    'medical-services': 'medical-services',
    'send': 'send',
    'verified': 'verified',
    'logout': 'logout',
    'access-time': 'access-time',
    'history': 'history',
    'security': 'security',
  };

  const materialName = materialNameMap[name] || name || 'help-outline';

  return (
    <MaterialIcon
      name={materialName}
      size={size}
      color={color}
      style={[styles.icon, style as any]}
    />
  );
};

const styles = StyleSheet.create({
  icon: {},
});

export default SimpleIcon;
