// Utility to fix LinearGradient shadow warnings
// This helps optimize shadow rendering for LinearGradient components

export const optimizedShadowStyle = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
};

// Alternative shadow style for better performance
export const lightShadowStyle = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};

// No shadow style for maximum performance
export const noShadowStyle = {
  shadowOpacity: 0,
  elevation: 0,
};
