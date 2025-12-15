import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const triggerHaptic = (style = 'medium') => {
  if (Platform.OS === 'ios') {
    if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    // Android fallback
    // Haptics.selectionAsync(); 
  }
};
