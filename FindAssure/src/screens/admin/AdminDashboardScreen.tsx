import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, FoundItem, AdminOverview } from '../../types/models';
import { adminApi } from '../../api/adminApi';
import { AnimatedHeroIllustration } from '../../components/AnimatedHeroIllustration';
import { GlassCard } from '../../components/GlassCard';
import { LoadingScreen } from '../../components/LoadingScreen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StaggeredEntrance } from '../../components/StaggeredEntrance';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { getDisplayImageUri } from '../../utils/cloudinaryImage';
import { getAdminItemStatusTone, getAdminPalette } from './adminTheme';

type AdminDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'AdminDashboard'>;

const AdminDashboardScreen = () => {
  const navigation = useNavigation<AdminDashboardNavigationProp>();
  const { signOut } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const adminPalette = useMemo(() => getAdminPalette(theme), [theme]);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FoundItem['status']>('all');

  const fetchData = useCallback(async () => {
    try {
      const [overviewData, itemsData] = await Promise.all([adminApi.getOverview(), adminApi.getAllFoundItems()]);
      setOverview(overviewData);
      setFoundItems(itemsData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              })
            );
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to logout');
          }
        },
      },
    ]);
  }, [navigation, signOut]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit Dashboard', 'Do you want to logout?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: handleLogout },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleLogout])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchData();
  };

  const handleItemPress = (item: FoundItem) => {
    navigation.navigate('AdminItemDetail', { foundItem: item });
  };

  const statusCounts = useMemo(
    () => ({
      all: foundItems.length,
      available: foundItems.filter((item) => item.status === 'available').length,
      pending_verification: foundItems.filter((item) => item.status === 'pending_verification').length,
      claimed: foundItems.filter((item) => item.status === 'claimed').length,
    }),
    [foundItems]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...foundItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchableFields = [
          item.category,
          item.description,
          item.founderContact?.name,
          item.founderContact?.email,
          item.claimedBy?.name,
          item.claimedBy?.email,
          item.found_location?.map((loc) => [loc.location, loc.floor_id, loc.hall_name].filter(Boolean).join(' ')).join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableFields.includes(normalizedQuery);
      });
  }, [foundItems, searchQuery, statusFilter]);

  const filterChips: Array<{ key: 'all' | FoundItem['status']; label: string; count: number }> = useMemo(
    () => [
      { key: 'all', label: 'All', count: statusCounts.all },
      { key: 'available', label: 'Available', count: statusCounts.available },
      { key: 'pending_verification', label: 'Pending', count: statusCounts.pending_verification },
      { key: 'claimed', label: 'Claimed', count: statusCounts.claimed },
    ],
    [statusCounts]
  );

  if (loading) {
    return (
      <LoadingScreen
        message="Loading admin workspace"
        subtitle="Refreshing oversight metrics and current found-item activity."
      />
    );
  }

  return (
    <LinearGradient colors={theme.gradients.appBackground} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={adminPalette.accent}
            colors={[adminPalette.accent]}
            progressBackgroundColor={theme.colors.card}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <StaggeredEntrance delay={20}>
          <GlassCard style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <View style={[styles.heroBadge, { backgroundColor: adminPalette.accentSoft }]}>
                  <Text style={[styles.heroBadgeText, { color: adminPalette.accentText }]}>Admin overview</Text>
                </View>
                <Text style={styles.heroTitle}>Moderation and verification control.</Text>
                <Text style={styles.heroBody}>
                  Monitor platform health, inspect incoming found items, and jump into user moderation quickly.
                </Text>
              </View>
              <AnimatedHeroIllustration size={104} variant="auth" />
            </View>
          </GlassCard>
        </StaggeredEntrance>

        {overview ? (
          <StaggeredEntrance delay={90}>
            <View style={styles.statsGrid}>
              {[
                { label: 'Total users', value: overview.totalUsers, icon: 'people-outline' as const },
                { label: 'Found items', value: overview.totalFoundItems, icon: 'cube-outline' as const },
                { label: 'Lost requests', value: overview.totalLostRequests, icon: 'search-outline' as const },
                {
                  label: 'Pending checks',
                  value: overview.pendingVerifications,
                  icon: 'shield-checkmark-outline' as const,
                },
              ].map((stat) => (
                <GlassCard key={stat.label} style={styles.statCard} intensity={24}>
                  <View style={styles.statTopRow}>
                    <View style={[styles.statIconWrap, { backgroundColor: adminPalette.accentSoft }]}>
                      <Ionicons name={stat.icon} size={18} color={adminPalette.accent} />
                    </View>
                    <Text style={[styles.statLabel, stat.label === 'Pending checks' && styles.statLabelEmphasis]}>
                      {stat.label}
                    </Text>
                  </View>
                  <Text style={[styles.statNumber, { color: adminPalette.accent }]}>{stat.value}</Text>
                </GlassCard>
              ))}
            </View>
          </StaggeredEntrance>
        ) : null}

        <StaggeredEntrance delay={140}>
          <GlassCard style={styles.actionCard}>
            <Text style={styles.sectionEyebrow}>Controls</Text>
            <Text style={styles.sectionTitle}>Admin tools</Text>
            <Text style={styles.sectionBody}>
              Open user moderation, refresh the oversight feed, or sign out of the protected workspace.
            </Text>
            <View style={styles.actionButtons}>
              <PrimaryButton
                title="Manage Users"
                onPress={() => navigation.navigate('AdminUsers')}
                size="lg"
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: adminPalette.accent }])}
              />
              <PrimaryButton
                title="Logout"
                onPress={handleLogout}
                size="lg"
                variant="secondary"
                textStyle={{ color: adminPalette.accent }}
                style={StyleSheet.flatten([styles.actionButton, styles.logoutButton, { borderColor: adminPalette.accent }])}
              />
            </View>
          </GlassCard>
        </StaggeredEntrance>

        <StaggeredEntrance delay={180}>
          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Inventory oversight</Text>
                <Text style={styles.sectionTitle}>Found items queue</Text>
              </View>
              <Text style={styles.sectionMeta}>{filteredItems.length} visible</Text>
            </View>

            <Text style={styles.sectionBody}>
              Search by item, founder, or location, then narrow the queue by status before opening details.
            </Text>

            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={theme.colors.textSubtle} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search category, founder, location..."
                placeholderTextColor={theme.colors.textSubtle}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.filterRow}>
              {filterChips.map((filter) => {
                const active = statusFilter === filter.key;
                return (
                  <Pressable
                    key={filter.key}
                    onPress={() => setStatusFilter(filter.key)}
                    style={[
                      styles.filterChip,
                      active && { backgroundColor: adminPalette.accent, borderColor: adminPalette.accent },
                    ]}
                  >
                    <Text style={[styles.filterChipText, active && { color: adminPalette.contrastText }]}>
                      {filter.label} {filter.count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No matching items</Text>
                <Text style={styles.emptyText}>Adjust the search or status filter to see more records.</Text>
              </View>
            ) : (
              filteredItems.map((item) => {
                const statusTone = getAdminItemStatusTone(theme, item.status);
                const primaryLocation = item.found_location?.[0];
                const locationLabel = primaryLocation
                  ? [primaryLocation.location, primaryLocation.floor_id ? `Floor ${primaryLocation.floor_id}` : null, primaryLocation.hall_name]
                      .filter(Boolean)
                      .join(' • ')
                  : 'Location not specified';

                return (
                  <Pressable key={item._id} onPress={() => handleItemPress(item)}>
                    <GlassCard style={styles.queueCard} contentStyle={styles.queueCardContent}>
                      <Image
                        source={{ uri: getDisplayImageUri(item.imageUrl) }}
                        style={styles.queueImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={120}
                      />

                      <View style={styles.queueBody}>
                        <View style={styles.queueTopRow}>
                          <Text style={styles.queueTitle} numberOfLines={1}>
                            {item.category}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusTone.backgroundColor }]}>
                            <Text style={[styles.statusBadgeText, { color: statusTone.textColor }]}>
                              {item.status.split('_').join(' ')}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.queueDescription} numberOfLines={2}>
                          {item.description}
                        </Text>

                        <View style={styles.metaRow}>
                          <Ionicons name="location-outline" size={14} color={theme.colors.textSubtle} />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {locationLabel}
                          </Text>
                        </View>

                        <View style={styles.metaRow}>
                          <Ionicons name="person-outline" size={14} color={theme.colors.textSubtle} />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {item.founderContact?.name || 'Unknown founder'}
                          </Text>
                        </View>

                        {item.status === 'claimed' ? (
                          <View style={styles.metaRow}>
                            <Ionicons name="checkmark-done-outline" size={14} color={theme.colors.textSubtle} />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {item.claimedBy?.name
                                ? `Claimed by ${item.claimedBy.name}`
                                : 'Claimed owner not available'}
                            </Text>
                          </View>
                        ) : null}

                        <View style={styles.metaFooter}>
                          <Text style={styles.metaFootText}>
                            {item.status === 'claimed' && item.claimedAt
                              ? `Claimed ${new Date(item.claimedAt).toLocaleDateString()}`
                              : `${item.questions.length} questions`}
                          </Text>
                          <Text style={styles.metaFootText}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })
            )}
          </GlassCard>
        </StaggeredEntrance>
      </ScrollView>
    </LinearGradient>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.md,
    },
    hero: {
      padding: theme.spacing.lg,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    heroCopy: {
      flex: 1,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 5,
      marginBottom: theme.spacing.sm,
    },
    heroBadgeText: {
      ...theme.type.caption,
      fontWeight: '700',
    },
    heroTitle: {
      ...theme.type.title,
      color: theme.colors.textStrong,
      marginBottom: theme.spacing.sm,
    },
    heroBody: {
      ...theme.type.body,
      color: theme.colors.textMuted,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    statCard: {
      flexBasis: '47%',
      flexGrow: 1,
      minWidth: 150,
    },
    statTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    statIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statLabel: {
      ...theme.type.caption,
      color: theme.colors.textMuted,
      flex: 1,
    },
    statLabelEmphasis: {
      color: theme.colors.textStrong,
    },
    statNumber: {
      ...theme.type.hero,
    },
    actionCard: {
      marginBottom: 0,
    },
    actionButtons: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      width: '100%',
    },
    logoutButton: {
      borderWidth: 1,
    },
    sectionCard: {
      marginBottom: 0,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    sectionEyebrow: {
      ...theme.type.label,
      marginBottom: theme.spacing.xs,
    },
    sectionTitle: {
      ...theme.type.section,
      color: theme.colors.textStrong,
    },
    sectionBody: {
      ...theme.type.body,
      color: theme.colors.textMuted,
    },
    sectionMeta: {
      ...theme.type.caption,
      color: theme.colors.textSubtle,
    },
    searchWrap: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardMuted,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
      gap: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      ...theme.type.body,
      color: theme.colors.textStrong,
      paddingVertical: theme.spacing.sm,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    filterChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    filterChipText: {
      ...theme.type.caption,
      color: theme.colors.textStrong,
      fontWeight: '700',
    },
    emptyState: {
      backgroundColor: theme.colors.cardMuted,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
    },
    emptyTitle: {
      ...theme.type.bodyStrong,
      color: theme.colors.textStrong,
      marginBottom: theme.spacing.xs,
    },
    emptyText: {
      ...theme.type.body,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    queueCard: {
      marginBottom: theme.spacing.sm,
    },
    queueCardContent: {
      flexDirection: 'row',
      padding: theme.spacing.sm,
      gap: theme.spacing.md,
      alignItems: 'stretch',
    },
    queueImage: {
      width: 92,
      height: 92,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.inputMuted,
    },
    queueBody: {
      flex: 1,
      minHeight: 92,
    },
    queueTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      marginBottom: 6,
    },
    queueTitle: {
      ...theme.type.bodyStrong,
      color: theme.colors.textStrong,
      flex: 1,
      textTransform: 'capitalize',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.radius.pill,
    },
    statusBadgeText: {
      ...theme.type.caption,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    queueDescription: {
      ...theme.type.body,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    metaText: {
      ...theme.type.caption,
      color: theme.colors.textMuted,
      flex: 1,
    },
    metaFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
      paddingTop: 2,
    },
    metaFootText: {
      ...theme.type.caption,
      color: theme.colors.textSubtle,
    },
  });

export default AdminDashboardScreen;
