import React, { ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

interface ResponsiveContainerProps {
  children: ReactNode;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children }) => {
  const { width } = useWindowDimensions(); // dynamically updates on resize
  const isWeb = Platform.OS === 'web';
  const shouldCenter = isWeb && width > 768;

  if (!shouldCenter) {
    return <>{children}</>;
  }

  return (
    <View style={styles.webContainer}>
      <View style={[styles.webContent, { maxWidth: 600 }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  webContent: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
  },
});

export default ResponsiveContainer;
