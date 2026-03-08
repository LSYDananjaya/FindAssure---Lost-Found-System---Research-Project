import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type KeyboardAwareFormScreenProps = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
};

export const KeyboardAwareFormScreen = ({
  children,
  contentContainerStyle,
  style,
  scrollProps,
}: KeyboardAwareFormScreenProps) => {
  // useSafeAreaInsets() is native-backed and always returns correct values from the
  // first render — unlike useHeaderHeight() which can return 0 while the navigation
  // entrance animation is running, causing the KAV to fight with the keyboard animation.
  // 44pt = standard iOS navigation bar height for stack navigators without large titles.
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + 44 : 0;

  const {
    keyboardShouldPersistTaps = 'handled',
    keyboardDismissMode = (Platform.OS === 'ios' ? 'interactive' : 'on-drag') as ScrollViewProps['keyboardDismissMode'],
    automaticallyAdjustKeyboardInsets = false,
    showsVerticalScrollIndicator = false,
    ...restScrollProps
  } = scrollProps ?? {};

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        {...restScrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
