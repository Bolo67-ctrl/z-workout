import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

type Place = "home" | "gym";
type Goal =
  | "muscle"
  | "strength"
  | "endurance"
  | "consistency"
  | "mobility";
const COLORS = {
  background: "#080808",
  card: "#111111",
  cardSoft: "#161616",
  border: "#242424",
  green: "#B7FF2A",
  white: "#FFFFFF",
  muted: "#8A8A8A",
};

export default function App() {
  const [step, setStep] = useState(0);

  const [workoutPlace, setWorkoutPlace] = useState<Place | null>(null);

  const [goal, setGoal] = useState<Goal | null>(null);

  const [equipment, setEquipment] = useState<string[]>([]);

 const toggleEquipment = (item: string) => {
  if (item === "No Equipment") {
    setEquipment(["No Equipment"]);
    return;
  }

  let updatedEquipment = equipment.filter(
    (equipmentItem) => equipmentItem !== "No Equipment"
  );

  if (updatedEquipment.includes(item)) {
    updatedEquipment = updatedEquipment.filter(
      (equipmentItem) => equipmentItem !== item
    );
  } else {
    updatedEquipment = [...updatedEquipment, item];
  }

  setEquipment(updatedEquipment);
};

  if (step === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.centerContent}>
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>Z</Text>
          </View>

          <Text style={styles.title}>Z WORKOUT</Text>

          <Text style={styles.subtitle}>
            Train smarter. Stay consistent. Track your progress.
          </Text>

          <View style={styles.featureBox}>
            <Text style={styles.feature}>⚡ Personalized workouts</Text>
            <Text style={styles.feature}>📊 Progress tracking</Text>
            <Text style={styles.feature}>🥗 Meal inspiration</Text>
            <Text style={styles.feature}>🏠 Home & gym training</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStep(1)}
          >
            <Text style={styles.primaryButtonText}>GET STARTED</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView contentContainerStyle={styles.onboarding}>
          <Text style={styles.step}>STEP 1 OF 3</Text>

          <Text style={styles.question}>
            Where do you usually work out?
          </Text>

          <Text style={styles.description}>
            Z Workout will customize your workouts around the equipment you
            have available.
          </Text>

          <OptionCard
            emoji="🏠"
            title="Home"
            description="Bodyweight, dumbbells, bands and home equipment"
            selected={workoutPlace === "home"}
            onPress={() => setWorkoutPlace("home")}
          />

          <OptionCard
            emoji="🏋️"
            title="Gym"
            description="Machines, cables, barbells and gym equipment"
            selected={workoutPlace === "gym"}
            onPress={() => setWorkoutPlace("gym")}
          />

          <TouchableOpacity
            disabled={!workoutPlace}
            style={[
              styles.primaryButton,
              !workoutPlace && styles.disabledButton,
            ]}
            onPress={() => setStep(2)}
          >
            <Text style={styles.primaryButtonText}>CONTINUE</Text>
          </TouchableOpacity>

          <BackButton onPress={() => setStep(0)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView contentContainerStyle={styles.onboarding}>
          <Text style={styles.step}>STEP 2 OF 3</Text>

          <Text style={styles.question}>
            What do you want to improve?
          </Text>

          <Text style={styles.description}>
            Choose the main goal you want Z Workout to focus on.
          </Text>
<OptionCard
  emoji="💪"
  title="Build Muscle"
  description="Build muscle with workouts adapted to the equipment you have"
  selected={goal === "muscle"}
  onPress={() => setGoal("muscle")}
/>
        <OptionCard
  emoji="🏋️"
  title="Build Strength"
  description="Focus on becoming stronger over time"
  selected={goal === "strength"}
  onPress={() => setGoal("strength")}
/>

          <OptionCard
            emoji="⚡"
            title="Improve Endurance"
            description="Build stamina and cardiovascular fitness"
            selected={goal === "endurance"}
            onPress={() => setGoal("endurance")}
          />

          <OptionCard
            emoji="🔥"
            title="Stay Consistent"
            description="Build a regular and sustainable workout habit"
            selected={goal === "consistency"}
            onPress={() => setGoal("consistency")}
          />

          <OptionCard
            emoji="🧘"
            title="Mobility & Flexibility"
            description="Improve movement, flexibility and recovery"
            selected={goal === "mobility"}
            onPress={() => setGoal("mobility")}
          />

          <TouchableOpacity
            disabled={!goal}
            style={[styles.primaryButton, !goal && styles.disabledButton]}
            onPress={() => setStep(3)}
          >
            <Text style={styles.primaryButtonText}>CONTINUE</Text>
          </TouchableOpacity>

          <BackButton onPress={() => setStep(1)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 3) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView contentContainerStyle={styles.onboarding}>
          <Text style={styles.step}>STEP 3 OF 3</Text>

          <Text style={styles.question}>
            What equipment do you have?
          </Text>

          <Text style={styles.description}>
            Select everything available to you. You can change this later.
          </Text>

          <View style={styles.chipContainer}>
            {[[
  "No Equipment",
  "Push-Up Board",
  "Dumbbells",
  "Barbell",
  "Resistance Bands",
  "Bench",
  "Cable Machine",
  "Gym Machines",
  "Pull-Up Bar",
  "Kettlebell",
]
            ].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  equipment.includes(item) && styles.selectedChip,
                ]}
                onPress={() => toggleEquipment(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    equipment.includes(item) && styles.selectedChipText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStep(4)}
          >
            <Text style={styles.primaryButtonText}>CREATE MY PLAN</Text>
          </TouchableOpacity>

          <BackButton onPress={() => setStep(2)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.dashboard}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.smallMuted}>GOOD MORNING</Text>
            <Text style={styles.dashboardTitle}>Ready to train?</Text>
          </View>

          <TouchableOpacity style={styles.profileCircle}>
            <Text style={styles.profileLetter}>D</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.todayCard}>
          <View style={styles.todayTopRow}>
            <View>
              <Text style={styles.todayLabel}>TODAY'S WORKOUT</Text>

              <Text style={styles.todayTitle}>
  {goal === "muscle"
    ? equipment.includes("Push-Up Board")
      ? "Push-Up Board Muscle Builder"
      : equipment.includes("No Equipment")
      ? "Bodyweight Muscle Builder"
      : "Muscle Building Workout"
    : goal === "strength"
    ? "Strength Training"
    : goal === "endurance"
    ? "Full Body Conditioning"
    : goal === "mobility"
    ? "Mobility Flow"
    : "Full Body Workout"}
</Text>
            </View>

            <Text style={styles.workoutEmoji}>⚡</Text>
          </View>

          <View style={styles.workoutDetails}>
            <Text style={styles.detailText}>⏱ 45 min</Text>
            <Text style={styles.detailText}>•</Text>
            <Text style={styles.detailText}>6 exercises</Text>
          </View>

          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>START WORKOUT</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>This Week</Text>

        <View style={styles.progressCard}>
          <View>
            <Text style={styles.progressNumber}>3 / 4</Text>
            <Text style={styles.progressLabel}>Workouts completed</Text>
          </View>

          <View style={styles.streakBox}>
            <Text style={styles.streakNumber}>🔥 6</Text>
            <Text style={styles.streakLabel}>Day streak</Text>
          </View>
        </View>

        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>

        <Text style={styles.sectionTitle}>Explore</Text>

        <View style={styles.grid}>
          <DashboardCard
            emoji="✦"
            title="Z Coach"
            subtitle="Build a workout"
          />

          <DashboardCard
            emoji="🥗"
            title="Meals"
            subtitle="Recipe ideas"
          />

          <DashboardCard
            emoji="📈"
            title="Progress"
            subtitle="View your stats"
          />

          <DashboardCard
            emoji="🏋️"
            title="Exercises"
            subtitle="Exercise library"
          />
        </View>

        <View style={styles.coachCard}>
          <Text style={styles.coachTag}>Z COACH</Text>

          <Text style={styles.coachTitle}>
            Need a different workout today?
          </Text>

          <Text style={styles.coachDescription}>
            Tell Z Coach how much time you have and what equipment is available.
          </Text>

          <TouchableOpacity style={styles.coachButton}>
            <Text style={styles.coachButtonText}>ASK Z COACH ✦</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <NavItem emoji="⌂" text="Home" active />
        <NavItem emoji="🏋️" text="Workout" />
        <NavItem emoji="✦" text="Coach" />
        <NavItem emoji="📈" text="Progress" />
        <NavItem emoji="●" text="Profile" />
      </View>
    </SafeAreaView>
  );
}

function OptionCard({
  emoji,
  title,
  description,
  selected,
  onPress,
}: {
  emoji: string;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.selectedCard]}
      onPress={onPress}
    >
      <Text style={styles.optionEmoji}>{emoji}</Text>

      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.back}>Back</Text>
    </TouchableOpacity>
  );
}

function DashboardCard({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <TouchableOpacity style={styles.dashboardCard}>
      <Text style={styles.dashboardEmoji}>{emoji}</Text>
      <Text style={styles.dashboardCardTitle}>{title}</Text>
      <Text style={styles.dashboardCardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function NavItem({
  emoji,
  text,
  active = false,
}: {
  emoji: string;
  text: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.navItem}>
      <Text style={[styles.navEmoji, active && styles.activeNav]}>{emoji}</Text>

      <Text style={[styles.navText, active && styles.activeNav]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  onboarding: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },

  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },

  logo: {
    fontSize: 58,
    fontWeight: "900",
    color: COLORS.background,
  },

  title: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 2,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 17,
    textAlign: "center",
    lineHeight: 25,
    marginTop: 12,
    marginBottom: 35,
  },

  featureBox: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 22,
    marginBottom: 35,
    gap: 15,
  },

  feature: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: COLORS.green,
    minHeight: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },

  disabledButton: {
    opacity: 0.35,
  },

  step: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: 1.5,
  },

  question: {
    color: COLORS.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    marginBottom: 12,
  },

  description: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },

  optionCard: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedCard: {
    borderColor: COLORS.green,
    backgroundColor: "#151A0D",
  },

  optionEmoji: {
    fontSize: 38,
    marginRight: 18,
  },

  optionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 5,
  },

  optionDescription: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },

  back: {
    textAlign: "center",
    color: "#777777",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 20,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 30,
    paddingHorizontal: 17,
    paddingVertical: 13,
  },

  selectedChip: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  chipText: {
    color: COLORS.white,
    fontWeight: "700",
  },

  selectedChipText: {
    color: COLORS.background,
  },

  dashboard: {
    padding: 20,
    paddingTop: 35,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  smallMuted: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  dashboardTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },

  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },

  profileLetter: {
    color: COLORS.background,
    fontSize: 19,
    fontWeight: "900",
  },

  todayCard: {
    backgroundColor: COLORS.green,
    padding: 22,
    borderRadius: 26,
    marginBottom: 30,
  },

  todayTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  todayLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#354900",
    letterSpacing: 1.2,
  },

  todayTitle: {
    color: COLORS.background,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 7,
    maxWidth: 250,
  },

  workoutEmoji: {
    fontSize: 32,
  },

  workoutDetails: {
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
    marginBottom: 22,
  },

  detailText: {
    color: "#354900",
    fontWeight: "700",
  },

  startButton: {
    backgroundColor: COLORS.background,
    borderRadius: 17,
    paddingVertical: 17,
    alignItems: "center",
  },

  startButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 15,
  },

  progressCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 22,
  },

  progressNumber: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
  },

  progressLabel: {
    color: COLORS.muted,
    marginTop: 4,
  },

  streakBox: {
    alignItems: "flex-end",
  },

  streakNumber: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },

  streakLabel: {
    color: COLORS.muted,
    marginTop: 4,
  },

  progressBarBackground: {
    height: 8,
    borderRadius: 10,
    backgroundColor: "#222222",
    marginTop: 12,
    marginBottom: 30,
  },

  progressBarFill: {
    width: "75%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.green,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginBottom: 30,
  },

  dashboardCard: {
    width: "48%",
    minHeight: 135,
    borderRadius: 22,
    padding: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  dashboardEmoji: {
    fontSize: 26,
    marginBottom: 17,
  },

  dashboardCardTitle: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 18,
  },

  dashboardCardSubtitle: {
    color: COLORS.muted,
    marginTop: 4,
  },

  coachCard: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  coachTag: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  coachTitle: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 10,
  },

  coachDescription: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
  },

  coachButton: {
    borderWidth: 1,
    borderColor: COLORS.green,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },

  coachButtonText: {
    color: COLORS.green,
    fontWeight: "900",
  },

  bottomNavigation: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#111111",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  navItem: {
    alignItems: "center",
    minWidth: 55,
  },

  navEmoji: {
    color: COLORS.muted,
    fontSize: 20,
  },

  navText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  activeNav: {
    color: COLORS.green,
  },
});