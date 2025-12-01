import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#4A90E2', '#67B5E8', '#8DCFF5']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <ThemedText style={styles.iconText}>🔍</ThemedText>
          </View>
          <ThemedText style={styles.appTitle}>FIND ASSURE</ThemedText>
          <ThemedText style={styles.tagline}>Reuniting People with Their Belongings</ThemedText>
        </View>
      </LinearGradient>

      <ThemedView style={styles.content}>
        <View style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeTitle}>Welcome Back!</ThemedText>
          <ThemedText style={styles.welcomeSubtitle}>
            Your trusted platform for lost and found items
          </ThemedText>
        </View>

        <View style={styles.featuresContainer}>
          <FeatureCard
            icon="📢"
            title="Report Lost Item"
            description="Quickly report items you've lost with detailed descriptions"
            isDark={isDark}
          />
          <FeatureCard
            icon="🎯"
            title="Found Something?"
            description="Help others by reporting items you've found"
            isDark={isDark}
          />
          <FeatureCard
            icon="🔔"
            title="Smart Alerts"
            description="Get notified when matching items are reported"
            isDark={isDark}
          />
          <FeatureCard
            icon="🤝"
            title="Community"
            description="Join thousands helping reunite lost items"
            isDark={isDark}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard number="10K+" label="Items Found" isDark={isDark} />
          <StatCard number="25K+" label="Active Users" isDark={isDark} />
          <StatCard number="95%" label="Success Rate" isDark={isDark} />
        </View>

        <TouchableOpacity style={[styles.ctaButton, isDark && styles.ctaButtonDark]}>
          <ThemedText style={styles.ctaButtonText}>Get Started</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

function FeatureCard({ icon, title, description, isDark }: any) {
  return (
    <View style={[styles.featureCard, isDark && styles.featureCardDark]}>
      <ThemedText style={styles.featureIcon}>{icon}</ThemedText>
      <ThemedText style={styles.featureTitle}>{title}</ThemedText>
      <ThemedText style={styles.featureDescription}>{description}</ThemedText>
    </View>
  );
}

function StatCard({ number, label, isDark }: any) {
  return (
    <View style={[styles.statCard, isDark && styles.statCardDark]}>
      <ThemedText style={styles.statNumber}>{number}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureCardDark: {
    backgroundColor: '#2A2A3E',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statCardDark: {
    backgroundColor: '#2A2A3E',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaButtonDark: {
    backgroundColor: '#5A9FE8',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
