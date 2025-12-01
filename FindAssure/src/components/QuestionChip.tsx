import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface QuestionChipProps {
  question: string;
  selected: boolean;
  onPress: () => void;
}

export const QuestionChip: React.FC<QuestionChipProps> = ({
  question,
  selected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.checkboxContainer}>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {question}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B0B0B0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chipText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  chipTextSelected: {
    color: '#1565C0',
    fontWeight: '500',
  },
});
