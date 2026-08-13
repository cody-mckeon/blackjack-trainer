import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { radii } from '@/constants/theme';
import { SUIT_SYMBOLS, type PlayingCardModel } from '@/lib/blackjack/cardTypes';

type PlayingCardSize = 'small' | 'medium' | 'large';

interface PlayingCardProps {
  card: PlayingCardModel;
  size?: PlayingCardSize;
  style?: StyleProp<ViewStyle>;
}

const DIMENSIONS: Record<PlayingCardSize, { width: number; height: number; rank: number; suit: number; corner: number }> = {
  small: { width: 58, height: 82, rank: 18, suit: 24, corner: 12 },
  medium: { width: 78, height: 110, rank: 23, suit: 34, corner: 15 },
  large: { width: 96, height: 136, rank: 28, suit: 44, corner: 18 },
};

export function PlayingCard({ card, size = 'large', style }: PlayingCardProps) {
  const dimensions = DIMENSIONS[size];
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const ink = isRed ? '#C92F3C' : '#111714';
  const symbol = SUIT_SYMBOLS[card.suit];

  return (
    <View
      accessible
      accessibilityLabel={`${card.rank} of ${card.suit}`}
      style={[
        styles.card,
        { width: dimensions.width, height: dimensions.height, borderRadius: dimensions.corner },
        style,
      ]}
    >
      <View style={styles.corner}>
        <Text style={[styles.rank, { color: ink, fontSize: dimensions.rank }]}>{card.rank}</Text>
        <Text style={[styles.cornerSuit, { color: ink, fontSize: dimensions.rank - 3 }]}>{symbol}</Text>
      </View>
      <Text style={[styles.centerSuit, { color: ink, fontSize: dimensions.suit }]}>{symbol}</Text>
      <View style={[styles.corner, styles.bottomCorner]}>
        <Text style={[styles.rank, { color: ink, fontSize: dimensions.rank }]}>{card.rank}</Text>
        <Text style={[styles.cornerSuit, { color: ink, fontSize: dimensions.rank - 3 }]}>{symbol}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CDD3D0',
    backgroundColor: '#FFFEF9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  corner: {
    position: 'absolute',
    top: 6,
    left: 7,
    alignItems: 'center',
  },
  bottomCorner: {
    top: undefined,
    left: undefined,
    right: 7,
    bottom: 6,
    transform: [{ rotate: '180deg' }],
  },
  rank: {
    lineHeight: 28,
    fontWeight: '900',
  },
  cornerSuit: {
    lineHeight: 18,
  },
  centerSuit: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    lineHeight: 48,
  },
});
