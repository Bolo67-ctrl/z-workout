import React, { useMemo, useState } from "react";
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

const EQUIPMENT = [
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
];

export default function App() {
  const [step, setStep] = useState(0);
  const [workoutPlace, setWorkoutPlace] = useState<Place | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [workoutLength, setWorkoutLength] = useState<string | null>(null);

  const toggleEquipment = (item: string) => {
    if (item === "No Equipment") {
      setEquipment(["No Equipment"]);
      return;
    }

    const withoutNoEquipment = equipment.filter(
      (equipmentItem) => equipmentItem !== "No Equipment"
    );

    if (withoutNoEquipment.includes(item)) {
      setEquipment(
        withoutNoEquipment.filter((equipmentItem) => equipmentItem !== item)
      );
    } else {
      setEquipment([...withoutNoEquipment, item]);
    }
  };

  const todayWorkout = useMemo(() => {
    if (goal === "muscle") {
      if (equipment.includes("Push-Up Board")) {
        return "Push-Up Board Muscle Builder";
      }

      if (equipment.includes("No Equipment")) {
        return "Bodyweight Muscle Builder";
      }

      return "Muscle Building Workout";
    }

    if (goal === "strength") return "Strength Training";
    if (goal === "endurance") return "Full Body Conditioning";
    if (goal === "mobility") return "Mobility Flow";

    return "Full Body Workout";
  }, [goal, equipment]);

  const planDescription = useMemo(() => {
    const locationText = workoutPlace === "gym" ? "Gym" : "Home";
    const equipmentText = equipment.includes("No Equipment")
      ? "No equipment"
      : equipment.join(", ");

    return `${locationText} • ${trainingDays ?? "-"} days/week • ${workoutLength ?? "-"} • ${equipmentText || "Equipment not set"}`;
  }, [workoutPlace, trainingDays, workoutLength, equipment]);

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
          <Text style={styles.step}>STEP 1 OF 4</Text>

          <Text style={styles.question}>Where do you usually work out?</Text>

          <Text style={styles.description}>
            Z Workout will customize your workouts around the space and
            equipment you have available.
          </Text>

          <OptionCard
            emoji="🏠"
            title="Home"
            description="Bodyweight, push-up boards, dumbbells, bands and home equipment"
            selected={workoutPlace === "home"}
            onPress={() => setWorkoutPlace("home")}
          />

          <OptionCard
            emoji="🏋️"
            title="Gym"
            description="Machines, cables, barbells, dumbbells and gym equipment"
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
          <Text style={styles.step}>STEP 2 OF 4</Text>

          <Text style={styles.question}>What do you want to improve?</Text>

          <Text style={styles.description}>
            Choose your main goal. Your plan will still adapt to the equipment
            you actually have.
          </Text>

          <OptionCard
            emoji="💪"
            title="Build Muscle"
            description="Build muscle with training adapted to your available equipment"
            selected={goal === "muscle"}
            onPress={() => setGoal("muscle")}
          />

          <OptionCard
            emoji="🏋️"
            title="Build Strength"
            description="Focus on gradually getting stronger over time"
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
          <Text style={styles.step}>STEP 3 OF 4</Text>

          <Text style={styles.question}>What equipment do you have?</Text>

          <Text style={styles.description}>
            Select everything available to you. Choose No Equipment if you only
            want bodyweight workouts.
          </Text>

          <View style={styles.chipContainer}>
            {EQUIPMENT.map((item) => (
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

          {equipment.includes("Push-Up Board") && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Push-Up Board selected</Text>
              <Text style={styles.infoText}>
                Z Workout will use your board for upper-body exercises and
                combine it with bodyweight movements for the rest of your plan.
              </Text>
            </View>
          )}

          <TouchableOpacity
            disabled={equipment.length === 0}
            style={[
              styles.primaryButton,
              equipment.length === 0 && styles.disabledButton,
            ]}
            onPress={() => setStep(4)}
          >
            <Text style={styles.primaryButtonText}>CONTINUE</Text>
          </TouchableOpacity>

          <BackButton onPress={() => setStep(2)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 4) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView contentContainerStyle={styles.onboarding}>
          <Text style={styles.step}>STEP 4 OF 4</Text>

          <Text style={styles.question}>Build your schedule</Text>

          <Text style={styles.description}>
            Tell Z Workout how often you want to train and how much time you
            usually have for each workout.
          </Text>

          <Text style={styles.sectionQuestion}>
            How many days per week?
          </Text>

          <View style={styles.choiceRow}>
            {[2, 3, 4, 5, 6].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.numberChoice,
                  trainingDays === day && styles.selectedNumberChoice,
                ]}
                onPress={() => setTrainingDays(day)}
              >
                <Text
                  style={[
                    styles.numberChoiceText,
                    trainingDays === day && styles.selectedNumberChoiceText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.scheduleHint}>
            Rest and recovery days are part of your plan too.
          </Text>

          <Text style={styles.sectionQuestion}>
            How long should each workout be?
          </Text>

          <View style={styles.timeGrid}>
            {["15 min", "30 min", "45 min", "60+ min"].map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeChoice,
                  workoutLength === time && styles.selectedTimeChoice,
                ]}
                onPress={() => setWorkoutLength(time)}
              >
                <Text
                  style={[
                    styles.timeChoiceText,
                    workoutLength === time && styles.selectedTimeChoiceText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            disabled={!trainingDays || !workoutLength}
            style={[
              styles.primaryButton,
              (!trainingDays || !workoutLength) && styles.disabledButton,
            ]}
            onPress={() => setStep(5)}
          >
            <Text style={styles.primaryButtonText}>CREATE MY PLAN</Text>
          </TouchableOpacity>

          <BackButton onPress={() => setStep(3)} />
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
            <Text style={styles.smallMuted}>YOUR Z PLAN</Text>
            <Text style={styles.dashboardTitle}>Ready to train?</Text>
          </View>

          <TouchableOpacity style={styles.profileCircle}>
            <Text style={styles.profileLetter}>Z</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.planSummary}>
          <Text style={styles.planSummaryLabel}>PERSONALIZED FOR YOU</Text>
          <Text style={styles.planSummaryText}>{planDescription}</Text>
        </View>

        <View style={styles.todayCard}>
          <View style={styles.todayTopRow}>
            <View style={styles.todayTextWrap}>
              <Text style={styles.todayLabel}>TODAY'S WORKOUT</Text>
              <Text style={styles.todayTitle}>{todayWorkout}</Text>
            </View>

            <Text style={styles.workoutEmoji}>⚡</Text>
          </View>

          <View style={styles.workoutDetails}>
            <Text style={styles.detailText}>⏱ {workoutLength}</Text>
            <Text style={styles.detailText}>•</Text>
            <Text style={styles.detailText}>
              {trainingDays} days/week plan
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>START WORKOUT</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>This Week</Text>

        <View style={styles.progressCard}>
          <View>
            <Text style={styles.progressNumber}>0 / {trainingDays}</Text>
            <Text style={styles.progressLabel}>Workouts completed</Text>
          </View>

          <View style={styles.streakBox}>
            <Text style={styles.streakNumber}>🔥 0</Text>
            <Text style={styles.streakLabel}>Day streak</Text>
          </View>
        </View>

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: "0%" }]} />
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

          <Text style={styles.coachTitle}>Need a different workout today?</Text>

          <Text style={styles.coachDescription}>
            Tell Z Coach how much time you have and what equipment is available.
            Your plan can adapt without making you restart.
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

  infoCard: {
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },

  infoTitle: {
    color: COLORS.green,
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 6,
  },

  infoText: {
    color: COLORS.muted,
    lineHeight: 20,
  },

  sectionQuestion: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 15,
    marginTop: 10,
  },

  choiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  numberChoice: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedNumberChoice: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  numberChoiceText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  selectedNumberChoiceText: {
    color: COLORS.background,
  },

  scheduleHint: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 26,
  },

  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 15,
  },

  timeChoice: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },

  selectedTimeChoice: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  timeChoiceText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  selectedTimeChoiceText: {
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
    marginBottom: 20,
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

  planSummary: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },

  planSummaryLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 7,
  },

  planSummaryText: {
    color: COLORS.white,
    lineHeight: 20,
    fontWeight: "700",
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

  todayTextWrap: {
    flex: 1,
    paddingRight: 10,
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
  },

  workoutEmoji: {
    fontSize: 32,
  },

  workoutDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
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
