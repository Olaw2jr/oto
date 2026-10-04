import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

import {CatalogueBook} from '../data/catalogue';
import {useTheme} from '../theme/ThemeProvider';

type BookCoverProps = {
  book: CatalogueBook;
  size: number;
  radius?: number;
  raised?: boolean;
  // Covers next to the title are decorative.
  decorative?: boolean;
};

export const BookCover = ({
  book,
  size,
  radius = 8,
  raised = true,
  decorative = true,
}: BookCoverProps) => {
  const {colors} = useTheme();
  return (
    <View
      style={[
        raised && styles.raised,
        {width: size, height: size, borderRadius: radius},
      ]}>
      <Image
        source={book.cover}
        accessible={!decorative}
        accessibilityLabel={decorative ? undefined : `Cover of ${book.title}`}
        style={[
          styles.image,
          {borderRadius: radius, backgroundColor: colors.tonal},
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  raised: {
    shadowColor: '#1B1B19',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },
  image: {width: '100%', height: '100%'},
});
