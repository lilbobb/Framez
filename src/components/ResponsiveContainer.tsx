import React, { ReactNode } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

interface ResponsiveContainerProps {
  children: ReactNode;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children }) => {
  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;
  const shouldCenter = isWeb && windowWidth > 768;

  if (!shouldCenter) {
    return <>{children}</>;
  }

  return (
    <View style={styles.webContainer}>
      <View style={styles.webContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  webContent: {
    width: '100%',
    maxWidth: 600,
    flex: 1,
  },
  ScrollView: {
    overflow: 'hidden',
  }
});

export default ResponsiveContainer;