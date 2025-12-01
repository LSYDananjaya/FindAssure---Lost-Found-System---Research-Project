// FindLostResultsScreen – follow the spec
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, FoundItem } from '../../types/models';
import { ItemCard } from '../../components/ItemCard';

type FindLostResultsNavigationProp = StackNavigationProp<RootStackParamList, 'FindLostResults'>;
type FindLostResultsRouteProp = RouteProp<RootStackParamList, 'FindLostResults'>;

const FindLostResultsScreen = () => {
  const navigation = useNavigation<FindLostResultsNavigationProp>();
  const route = useRoute<FindLostResultsRouteProp>();
  const { foundItems } = route.params;

  const handleItemPress = (item: FoundItem) => {
    navigation.navigate('ItemDetail', { foundItem: item });
  };

  const renderItem = ({ item }: { item: FoundItem }) => (
    <ItemCard item={item} onPress={() => handleItemPress(item)} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No Items Found</Text>
      <Text style={styles.emptyText}>
        We couldn't find any matching items at the moment.
      </Text>
      <Text style={styles.emptyText}>
        Your search has been saved and you'll be notified if a match is found.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Found Items</Text>
        <Text style={styles.subtitle}>
          {foundItems.length} item{foundItems.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={foundItems}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default FindLostResultsScreen;
