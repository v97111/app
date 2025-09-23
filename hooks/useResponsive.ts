import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

const { width: initialWidth } = Dimensions.get('window');

export function useResponsive() {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const isTablet = dimensions.width >= 768;
  const isPhone = dimensions.width < 768;

  return {
    ...dimensions,
    isTablet,
    isPhone,
  };
}