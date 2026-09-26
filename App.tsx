import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Place = "home" | "gym";
type Goal =
  | "muscle"
  | "strength"
  | "endurance"
  | "consistency"
  | "mobility";

type WorkoutExercise = {
  name: string;
  target: string;
  focus: string;
  cue: string;
};

type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

type WorkoutPlanSession = {
  id: string;
  day: Weekday | null;
  title: string;
  focus: string;
  emoji: string;
  exercises: WorkoutExercise[];
};

type SetLog = {
  reps: string;
  weight: string;
};

type MealCategory =
  | "All"
  | "Breakfast"
  | "Lunch"
  | "Dinner"
  | "Snack"
  | "Vegetarian"
  | "Quick";

type MealTiming = "Anytime" | "Before Workout" | "After Workout";

type MealRecipe = {
  title: string;
  emoji: string;
  categories: Exclude<MealCategory, "All">[];
  workoutGoals: Goal[];
  timing: Exclude<MealTiming, "Anytime">[];
  prepTime: string;
  cookTime: string;
  servings: string;
  summary: string;
  ingredients: string[];
  steps: string[];
  tips: string[];
};

type WorkoutHistoryItem = {
  id: string;
  title: string;
  completedAt: string;
  exercises: number;
  plannedDuration: string;
};

type ExerciseCategory =
  | "All"
  | "Upper Body"
  | "Lower Body"
  | "Core"
  | "Mobility"
  | "Gym";

type ExerciseLibraryItem = {
  name: string;
  emoji: string;
  category: Exclude<ExerciseCategory, "All">;
  focus: string;
  equipment: string;
  cue: string;
  easierOption: string;
};

type CoachEnergy = "Ready" | "Low Energy" | "Recovery";
type CoachEquipmentMode = "Use My Plan" | "No Equipment Today";
type CoachFocus =
  | "Today's Plan"
  | "Chest"
  | "Core"
  | "Legs"
  | "Back & Arms"
  | "Mobility";

type PersistedAppData = {
  workoutPlace: Place | null;
  goal: Goal | null;
  equipment: string[];
  trainingDays: number | null;
  workoutDays: Weekday[];
  workoutLength: string | null;
  completedWorkouts: number;
  completedPlanSessionIds: string[];
  workoutHistory: WorkoutHistoryItem[];
  weekKey: string;
  mealCategory: MealCategory;
  mealTiming: MealTiming;
  recommendedMealsOnly: boolean;
  favoriteExercises: string[];
};

const STORAGE_KEY = "z-workout-app-state-v1";

const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getDefaultWorkoutDays = (count: number): Weekday[] => {
  if (count === 2) return ["Tue", "Fri"];
  if (count === 3) return ["Mon", "Wed", "Fri"];
  if (count === 4) return ["Mon", "Tue", "Thu", "Sat"];
  if (count === 5) return ["Mon", "Tue", "Wed", "Fri", "Sat"];
  if (count === 6) return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return ["Mon", "Wed", "Fri"];
};

const sortWorkoutDays = (days: Weekday[]) =>
  [...days].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));

const getTodayWeekday = (): Weekday => {
  const map: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[new Date().getDay()];
};

const getCurrentWeekKey = () => {
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const difference = monday.getDate() - day + (day === 0 ? -6 : 1);

  monday.setDate(difference);
  monday.setHours(0, 0, 0, 0);

  return monday.toISOString().slice(0, 10);
};

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

const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  {
    name: "Push-Ups",
    emoji: "💪",
    category: "Upper Body",
    focus: "Chest, shoulders, arms",
    equipment: "No equipment",
    cue: "Keep the movement controlled and choose a version that feels comfortable.",
    easierOption: "Use a wall, counter, or knees-down version.",
  },
  {
    name: "Push-Up Board Chest Press",
    emoji: "🟩",
    category: "Upper Body",
    focus: "Chest and arms",
    equipment: "Push-Up Board",
    cue: "Use a handle position that feels natural on your shoulders and wrists.",
    easierOption: "Use an incline or knees-down setup with the board.",
  },
  {
    name: "One-Arm Row",
    emoji: "🏋️",
    category: "Upper Body",
    focus: "Back and arms",
    equipment: "Dumbbell or kettlebell",
    cue: "Keep your torso steady and use a weight you can control smoothly.",
    easierOption: "Use a lighter weight or support one hand on a stable surface.",
  },
  {
    name: "Standing Shoulder Press",
    emoji: "⬆️",
    category: "Upper Body",
    focus: "Shoulders and arms",
    equipment: "Dumbbells",
    cue: "Press smoothly without leaning back to force the movement.",
    easierOption: "Use lighter weights or press one side at a time.",
  },
  {
    name: "Bodyweight Squats",
    emoji: "🦵",
    category: "Lower Body",
    focus: "Legs and hips",
    equipment: "No equipment",
    cue: "Use a comfortable depth and keep each rep steady.",
    easierOption: "Squat toward a chair or hold a stable support.",
  },
  {
    name: "Reverse Lunges",
    emoji: "↩️",
    category: "Lower Body",
    focus: "Legs and balance",
    equipment: "No equipment",
    cue: "Step back under control and keep the range comfortable.",
    easierOption: "Hold a wall or chair for balance.",
  },
  {
    name: "Glute Bridges",
    emoji: "🌉",
    category: "Lower Body",
    focus: "Hips and glutes",
    equipment: "No equipment",
    cue: "Move smoothly and pause briefly at the top without forcing the range.",
    easierOption: "Use a smaller range of motion.",
  },
  {
    name: "Goblet Squat",
    emoji: "🏋️",
    category: "Lower Body",
    focus: "Legs and hips",
    equipment: "Dumbbell or kettlebell",
    cue: "Choose a manageable weight and keep the movement controlled.",
    easierOption: "Practice the same movement without weight first.",
  },
  {
    name: "Dead Bug",
    emoji: "🧩",
    category: "Core",
    focus: "Core control",
    equipment: "No equipment",
    cue: "Move slowly and keep your back in a comfortable position.",
    easierOption: "Move one arm or one leg at a time.",
  },
  {
    name: "Bird Dog",
    emoji: "🐦",
    category: "Core",
    focus: "Core and back control",
    equipment: "No equipment",
    cue: "Reach slowly without twisting your body.",
    easierOption: "Move only an arm or only a leg.",
  },
  {
    name: "Plank",
    emoji: "▬",
    category: "Core",
    focus: "Core and shoulder stability",
    equipment: "No equipment",
    cue: "Keep a comfortable position and finish before your form breaks down.",
    easierOption: "Use an elevated surface or knees-down position.",
  },
  {
    name: "Cat-Cow",
    emoji: "🧘",
    category: "Mobility",
    focus: "Spine and gentle movement",
    equipment: "No equipment",
    cue: "Move slowly through a comfortable range.",
    easierOption: "Use a smaller range and move at your own pace.",
  },
  {
    name: "Shoulder Wall Slides",
    emoji: "🧱",
    category: "Mobility",
    focus: "Shoulders and upper back",
    equipment: "Wall",
    cue: "Keep the movement smooth and do not force your arms higher.",
    easierOption: "Use a smaller range of motion.",
  },
  {
    name: "Leg Press",
    emoji: "🏋️",
    category: "Gym",
    focus: "Legs",
    equipment: "Leg press machine",
    cue: "Set the machine comfortably and use a load you can control.",
    easierOption: "Reduce the load or use a shorter comfortable range.",
  },
  {
    name: "Lat Pulldown",
    emoji: "⬇️",
    category: "Gym",
    focus: "Back and arms",
    equipment: "Cable machine",
    cue: "Pull smoothly without swinging your body.",
    easierOption: "Reduce the weight and slow the movement down.",
  },
  {
    name: "Chest Press Machine",
    emoji: "➡️",
    category: "Gym",
    focus: "Chest and arms",
    equipment: "Chest press machine",
    cue: "Adjust the seat so the handles feel comfortable and press smoothly.",
    easierOption: "Reduce the weight and use a comfortable range.",
  },
  {
    name: "Floor Press",
    emoji: "🏋️",
    category: "Upper Body",
    focus: "Chest and arms",
    equipment: "Dumbbells",
    cue: "Keep the movement smooth and use a weight you can control through the full rep.",
    easierOption: "Use lighter dumbbells or practice one side at a time.",
  },
  {
    name: "Romanian Deadlift",
    emoji: "↘️",
    category: "Lower Body",
    focus: "Hamstrings and hips",
    equipment: "Dumbbells or kettlebell",
    cue: "Keep the weight close and use a comfortable hip-hinge range.",
    easierOption: "Use a lighter weight or practice the hinge without weight.",
  },
  {
    name: "Calf Raises",
    emoji: "⬆️",
    category: "Lower Body",
    focus: "Calves and ankle control",
    equipment: "No equipment",
    cue: "Rise and lower under control and use support for balance if needed.",
    easierOption: "Hold a wall or chair and use a smaller range.",
  },
  {
    name: "Push-Up Board Triceps",
    emoji: "🟩",
    category: "Upper Body",
    focus: "Triceps, chest, shoulders",
    equipment: "Push-Up Board",
    cue: "Use a board position that feels comfortable on your shoulders and wrists.",
    easierOption: "Use an incline or knees-down setup.",
  },
  {
    name: "Bodyweight Squat Hold",
    emoji: "🦵",
    category: "Mobility",
    focus: "Hips, legs, ankles",
    equipment: "No equipment",
    cue: "Hold a comfortable position and use support when needed.",
    easierOption: "Hold a higher position or use a chair for support.",
  },
  {
    name: "Cable Row",
    emoji: "↔️",
    category: "Gym",
    focus: "Back and arms",
    equipment: "Cable machine",
    cue: "Sit tall and pull smoothly without jerking the handle.",
    easierOption: "Reduce the weight and shorten the range slightly.",
  },
  {
    name: "Machine Shoulder Press",
    emoji: "⬆️",
    category: "Gym",
    focus: "Shoulders and arms",
    equipment: "Shoulder press machine",
    cue: "Adjust the seat comfortably and press without forcing the range.",
    easierOption: "Reduce the weight and use a smaller comfortable range.",
  },
  {
    name: "Seated Leg Curl",
    emoji: "🦵",
    category: "Gym",
    focus: "Hamstrings",
    equipment: "Leg curl machine",
    cue: "Adjust the machine comfortably and keep the movement controlled.",
    easierOption: "Reduce the weight and use a comfortable range.",
  },
];

const MEALS: MealRecipe[] = [
  {
    title: "Banana Oatmeal with Peanut Butter",
    emoji: "🥣",
    categories: ["Breakfast", "Vegetarian", "Quick"],
    workoutGoals: ["muscle", "strength", "endurance", "consistency", "mobility"],
    timing: ["Before Workout", "After Workout"],
    prepTime: "3 min",
    cookTime: "7 min",
    servings: "1 serving",
    summary: "Warm oats with banana, milk, and peanut butter for an easy mix of carbohydrates, protein, and fats.",
    ingredients: [
      "1/2 cup rolled oats",
      "1 cup milk or fortified non-dairy milk",
      "1 banana",
      "1 tablespoon peanut butter",
      "1/2 teaspoon cinnamon",
      "Optional: berries or chopped nuts",
    ],
    steps: [
      "Add the oats and milk to a small saucepan.",
      "Cook over medium-low heat for about 5 to 7 minutes, stirring often, until the oats are soft and creamy.",
      "Slice half of the banana and stir it into the oatmeal during the last minute of cooking.",
      "Pour the oatmeal into a bowl.",
      "Top with the remaining banana, peanut butter, and cinnamon.",
      "Add berries or chopped nuts if you want extra texture and variety.",
    ],
    tips: [
      "If you are eating close to a workout, keep the toppings simple and choose what feels comfortable for your stomach.",
      "You can also make this in the microwave in short intervals, stirring between each one.",
    ],
  },
  {
    title: "Egg & Avocado Toast",
    emoji: "🥑",
    categories: ["Breakfast", "Quick"],
    workoutGoals: ["muscle", "strength", "consistency", "mobility"],
    timing: ["After Workout"],
    prepTime: "5 min",
    cookTime: "8 min",
    servings: "1 serving",
    summary: "Eggs, whole-grain toast, avocado, and tomato make a simple balanced breakfast or post-workout meal.",
    ingredients: [
      "2 eggs",
      "2 slices whole-grain bread",
      "1/2 avocado",
      "1 small tomato, sliced",
      "1 teaspoon olive oil or a small amount of cooking spray",
      "Black pepper or herbs to taste",
    ],
    steps: [
      "Toast the bread until it reaches the texture you like.",
      "Heat a nonstick pan over medium heat and add the olive oil.",
      "Crack in the eggs and cook them until the whites and yolks are done the way you prefer.",
      "Mash the avocado with a fork and spread it over the toast.",
      "Add the tomato slices.",
      "Place the cooked eggs on top and finish with pepper or herbs.",
    ],
    tips: [
      "For a bigger meal, add fruit or yogurt on the side.",
      "Cook eggs until they are safely done and use clean utensils for raw egg.",
    ],
  },
  {
    title: "Berry Yogurt Oat Bowl",
    emoji: "🫐",
    categories: ["Breakfast", "Snack", "Vegetarian", "Quick"],
    workoutGoals: ["muscle", "strength", "endurance", "consistency", "mobility"],
    timing: ["Before Workout", "After Workout"],
    prepTime: "5 min",
    cookTime: "No cooking",
    servings: "1 serving",
    summary: "A no-cook bowl with yogurt, fruit, oats, and seeds that works for breakfast or a quick snack.",
    ingredients: [
      "1 cup Greek yogurt or another yogurt you enjoy",
      "1/2 cup berries",
      "1/2 banana, sliced",
      "1/3 cup oats or granola",
      "1 teaspoon chia seeds or ground flaxseed",
      "Optional: a small drizzle of honey",
    ],
    steps: [
      "Spoon the yogurt into a bowl.",
      "Wash the berries and add them with the sliced banana.",
      "Sprinkle the oats or granola over the fruit.",
      "Add the chia seeds or ground flaxseed.",
      "Add a small drizzle of honey if you want a little more sweetness.",
    ],
    tips: [
      "Use a yogurt you actually enjoy; dairy and fortified non-dairy options can both work.",
      "If eating right before training, use a smaller portion if that feels more comfortable.",
    ],
  },
  {
    title: "Peanut Butter Banana Wrap",
    emoji: "🍌",
    categories: ["Snack", "Vegetarian", "Quick"],
    workoutGoals: ["endurance", "consistency", "muscle", "strength"],
    timing: ["Before Workout"],
    prepTime: "5 min",
    cookTime: "No cooking",
    servings: "1 serving",
    summary: "A fast portable snack with a tortilla, banana, and peanut butter.",
    ingredients: [
      "1 whole-grain tortilla",
      "1 banana",
      "1 to 2 tablespoons peanut butter",
      "Optional: a pinch of cinnamon",
    ],
    steps: [
      "Lay the tortilla flat on a plate.",
      "Spread the peanut butter evenly over the tortilla.",
      "Place the banana near one edge.",
      "Add cinnamon if you like it.",
      "Roll the tortilla around the banana and slice it in half.",
    ],
    tips: [
      "This is easy to make before school, practice, or a workout.",
      "If peanut butter does not work for you, use another nut or seed butter you can safely eat.",
    ],
  },
  {
    title: "Chicken Rice Vegetable Bowl",
    emoji: "🍚",
    categories: ["Lunch", "Dinner"],
    workoutGoals: ["muscle", "strength", "endurance", "consistency"],
    timing: ["After Workout"],
    prepTime: "10 min",
    cookTime: "25 min",
    servings: "2 servings",
    summary: "Chicken, rice, and colorful vegetables make a flexible meal that is easy to prepare ahead.",
    ingredients: [
      "2 boneless chicken breasts or thighs",
      "1 cup uncooked rice",
      "2 cups water or low-sodium broth",
      "2 cups mixed vegetables",
      "1 tablespoon olive oil",
      "1/2 teaspoon garlic powder",
      "1/2 teaspoon paprika",
      "Black pepper to taste",
    ],
    steps: [
      "Rinse the rice if the package recommends it.",
      "Add the rice and water or broth to a saucepan, bring to a boil, then cover and reduce to low heat.",
      "Cook the rice according to the package directions until tender.",
      "Cut the chicken into even pieces and season with garlic powder, paprika, and pepper.",
      "Heat half of the olive oil in a pan over medium heat.",
      "Cook the chicken, turning the pieces so they cook evenly, until fully cooked through.",
      "Remove the chicken and add the remaining oil and vegetables to the same pan.",
      "Cook the vegetables until tender but still colorful.",
      "Divide rice, chicken, and vegetables into bowls and serve warm.",
    ],
    tips: [
      "Use frozen vegetables when you want to make this faster.",
      "Leftovers can be refrigerated promptly and reheated until hot.",
    ],
  },
  {
    title: "Turkey Tomato Pasta",
    emoji: "🍝",
    categories: ["Lunch", "Dinner"],
    workoutGoals: ["muscle", "strength", "endurance"],
    timing: ["After Workout"],
    prepTime: "8 min",
    cookTime: "22 min",
    servings: "3 servings",
    summary: "Pasta with lean ground turkey and tomato sauce is a simple meal for active days.",
    ingredients: [
      "8 ounces pasta",
      "12 ounces ground turkey",
      "2 cups tomato pasta sauce",
      "1 teaspoon olive oil",
      "1/2 onion, diced",
      "1 teaspoon Italian seasoning",
      "Optional: spinach",
    ],
    steps: [
      "Bring a pot of water to a boil and cook the pasta according to the package directions.",
      "While the pasta cooks, heat olive oil in a large pan over medium heat.",
      "Add the diced onion and cook for 3 to 4 minutes until softened.",
      "Add the ground turkey and break it into small pieces with a spoon.",
      "Cook the turkey until it is fully cooked with no pink remaining.",
      "Stir in the tomato sauce and Italian seasoning.",
      "Add spinach if using and cook until wilted.",
      "Drain the pasta and mix it into the sauce, or spoon the sauce over each serving.",
    ],
    tips: [
      "Choose any pasta shape you like, including whole-grain pasta if you enjoy it.",
      "Add a side salad or another vegetable for variety.",
    ],
  },
  {
    title: "Salmon, Potatoes & Green Vegetables",
    emoji: "🐟",
    categories: ["Dinner"],
    workoutGoals: ["muscle", "strength", "endurance", "mobility"],
    timing: ["After Workout"],
    prepTime: "10 min",
    cookTime: "30 min",
    servings: "2 servings",
    summary: "A complete dinner with salmon, roasted potatoes, and vegetables.",
    ingredients: [
      "2 salmon fillets",
      "2 medium potatoes",
      "2 cups broccoli, green beans, or another green vegetable",
      "1 tablespoon olive oil",
      "1/2 teaspoon garlic powder",
      "Black pepper and lemon to taste",
    ],
    steps: [
      "Heat the oven to 425°F (220°C).",
      "Wash the potatoes and cut them into small even pieces.",
      "Toss the potatoes with half of the olive oil, garlic powder, and pepper.",
      "Spread the potatoes on a baking sheet and roast for about 15 minutes.",
      "Move the potatoes to one side and add the salmon and vegetables to the pan.",
      "Brush the salmon and vegetables lightly with the remaining olive oil.",
      "Return the pan to the oven and cook until the salmon is fully cooked and the vegetables are tender.",
      "Serve with lemon if you like.",
    ],
    tips: [
      "Cooking time changes with the thickness of the salmon, so check that it is cooked safely before serving.",
      "Frozen vegetables can make this meal easier.",
    ],
  },
  {
    title: "Beef & Vegetable Rice Stir-Fry",
    emoji: "🥘",
    categories: ["Lunch", "Dinner"],
    workoutGoals: ["muscle", "strength", "endurance"],
    timing: ["After Workout"],
    prepTime: "12 min",
    cookTime: "18 min",
    servings: "3 servings",
    summary: "A quick pan meal with beef, rice, and mixed vegetables.",
    ingredients: [
      "12 ounces lean beef strips",
      "3 cups cooked rice",
      "3 cups mixed stir-fry vegetables",
      "1 tablespoon cooking oil",
      "2 tablespoons low-sodium soy sauce",
      "1 teaspoon minced garlic",
      "Optional: grated ginger",
    ],
    steps: [
      "Prepare the rice first if you do not already have cooked rice.",
      "Heat a large pan over medium-high heat and add half of the oil.",
      "Add the beef in a single layer and cook in batches if needed so it browns instead of steaming.",
      "Remove the fully cooked beef to a clean plate.",
      "Add the remaining oil and vegetables to the pan.",
      "Cook the vegetables for several minutes until tender-crisp.",
      "Add garlic and ginger if using and stir for about 30 seconds.",
      "Return the beef to the pan and add the soy sauce.",
      "Stir everything together and serve over warm rice.",
    ],
    tips: [
      "You can replace the beef with chicken, tofu, or another protein you enjoy.",
      "Using leftover cooked rice makes this especially quick.",
    ],
  },
  {
    title: "Chicken Potato Power Bowl",
    emoji: "🥔",
    categories: ["Lunch", "Dinner"],
    workoutGoals: ["muscle", "strength", "consistency"],
    timing: ["After Workout"],
    prepTime: "10 min",
    cookTime: "30 min",
    servings: "2 servings",
    summary: "Roasted potatoes, chicken, vegetables, and a yogurt sauce in one easy bowl.",
    ingredients: [
      "2 medium potatoes, diced",
      "2 boneless chicken breasts or thighs",
      "2 cups mixed vegetables",
      "1 tablespoon olive oil",
      "1/2 cup plain yogurt",
      "1 teaspoon lemon juice",
      "Garlic powder and black pepper to taste",
    ],
    steps: [
      "Heat the oven to 425°F (220°C).",
      "Toss the diced potatoes with half the olive oil and place them on a baking sheet.",
      "Roast the potatoes for about 25 to 30 minutes, turning once.",
      "Season the chicken with garlic powder and pepper.",
      "Heat the remaining oil in a pan over medium heat and cook the chicken until fully cooked.",
      "Cook or steam the vegetables until tender.",
      "Mix the yogurt and lemon juice in a small bowl.",
      "Slice the cooked chicken and divide the potatoes, vegetables, and chicken between two bowls.",
      "Spoon the yogurt sauce over the top.",
    ],
    tips: [
      "You can swap regular potatoes for sweet potatoes.",
      "Use whatever vegetables you have available.",
    ],
  },
  {
    title: "Tuna Pasta & Peas",
    emoji: "🥫",
    categories: ["Lunch", "Dinner", "Quick"],
    workoutGoals: ["muscle", "strength", "endurance", "consistency"],
    timing: ["After Workout"],
    prepTime: "5 min",
    cookTime: "15 min",
    servings: "2 servings",
    summary: "A pantry-friendly pasta meal with tuna and peas.",
    ingredients: [
      "6 ounces pasta",
      "1 can tuna, drained",
      "1 cup frozen peas",
      "1 tablespoon olive oil",
      "1 tablespoon lemon juice",
      "Black pepper to taste",
      "Optional: grated cheese",
    ],
    steps: [
      "Bring a pot of water to a boil.",
      "Add the pasta and cook according to the package directions.",
      "Add the frozen peas during the last 2 to 3 minutes of pasta cooking.",
      "Drain the pasta and peas well.",
      "Return them to the pot and stir in the drained tuna.",
      "Add olive oil, lemon juice, and pepper.",
      "Mix until everything is warmed through and add grated cheese if you like.",
    ],
    tips: [
      "This recipe is useful when you need something fast with shelf-stable ingredients.",
      "Choose tuna packed in water or oil based on what you prefer.",
    ],
  },
  {
    title: "Bean & Cheese Quesadilla",
    emoji: "🌯",
    categories: ["Lunch", "Dinner", "Vegetarian", "Quick"],
    workoutGoals: ["strength", "endurance", "consistency", "mobility"],
    timing: ["After Workout"],
    prepTime: "5 min",
    cookTime: "8 min",
    servings: "1 serving",
    summary: "Beans and cheese in a crispy tortilla with vegetables on the side.",
    ingredients: [
      "1 large tortilla",
      "1/2 cup beans, drained and rinsed",
      "1/3 cup shredded cheese",
      "1/2 tomato, diced",
      "1 handful lettuce or spinach",
      "Optional: salsa",
    ],
    steps: [
      "Place the tortilla on a clean cutting board.",
      "Spread the beans over one half of the tortilla and lightly mash them with a fork.",
      "Sprinkle the cheese over the beans.",
      "Fold the tortilla in half.",
      "Heat a nonstick pan over medium heat.",
      "Cook the quesadilla for 2 to 4 minutes per side until the tortilla is crisp and the cheese has melted.",
      "Cut into wedges and serve with tomato, lettuce or spinach, and salsa if you like.",
    ],
    tips: [
      "Use black beans, pinto beans, or whichever beans you enjoy.",
      "Add leftover cooked chicken if you want a non-vegetarian version.",
    ],
  },
  {
    title: "Lentil Rice Bowl",
    emoji: "🫘",
    categories: ["Lunch", "Dinner", "Vegetarian"],
    workoutGoals: ["muscle", "strength", "endurance", "consistency", "mobility"],
    timing: ["After Workout"],
    prepTime: "10 min",
    cookTime: "25 min",
    servings: "3 servings",
    summary: "Lentils, rice, vegetables, and a simple lemon dressing make a filling meat-free meal.",
    ingredients: [
      "1 cup cooked lentils",
      "2 cups cooked rice",
      "2 cups chopped vegetables",
      "1 tablespoon olive oil",
      "1 tablespoon lemon juice",
      "1/2 teaspoon garlic powder",
      "Optional: plain yogurt or crumbled cheese",
    ],
    steps: [
      "Cook the rice and lentils according to their package directions if they are not already prepared.",
      "Cook, roast, or steam the vegetables until tender.",
      "Whisk the olive oil, lemon juice, and garlic powder together in a small bowl.",
      "Divide the rice and lentils into bowls.",
      "Add the cooked vegetables.",
      "Spoon the lemon dressing over the bowls.",
      "Add yogurt or crumbled cheese if you want.",
    ],
    tips: [
      "Canned lentils can save time; drain and rinse them before using.",
      "This is easy to prepare in a larger batch for later meals.",
    ],
  },
  {
    title: "Chicken Sandwich & Fruit",
    emoji: "🥪",
    categories: ["Lunch", "Quick"],
    workoutGoals: ["muscle", "strength", "endurance", "consistency"],
    timing: ["Before Workout", "After Workout"],
    prepTime: "8 min",
    cookTime: "No cooking with pre-cooked chicken",
    servings: "1 serving",
    summary: "A simple sandwich using cooked chicken, whole-grain bread, vegetables, and fruit.",
    ingredients: [
      "2 slices whole-grain bread",
      "3 to 4 ounces cooked chicken, sliced",
      "Lettuce or spinach",
      "Tomato slices",
      "1 slice cheese, optional",
      "Mustard or another sandwich spread",
      "1 piece of fruit",
    ],
    steps: [
      "Place the bread slices on a clean plate.",
      "Spread a small amount of mustard or your preferred spread on the bread.",
      "Add the cooked chicken, lettuce or spinach, tomato, and cheese if using.",
      "Close the sandwich and cut it in half.",
      "Wash the fruit and serve it on the side.",
    ],
    tips: [
      "This works well with leftover cooked chicken.",
      "Keep cooked chicken refrigerated until you are ready to make the sandwich.",
    ],
  },
  {
    title: "Egg Fried Rice with Vegetables",
    emoji: "🍳",
    categories: ["Lunch", "Dinner", "Quick", "Vegetarian"],
    workoutGoals: ["strength", "endurance", "consistency", "mobility"],
    timing: ["After Workout"],
    prepTime: "8 min",
    cookTime: "12 min",
    servings: "2 servings",
    summary: "A fast way to turn cooked rice, eggs, and vegetables into a complete meal.",
    ingredients: [
      "2 cups cooked and cooled rice",
      "2 eggs",
      "2 cups mixed vegetables",
      "1 tablespoon cooking oil",
      "1 to 2 tablespoons low-sodium soy sauce",
      "Optional: green onion",
    ],
    steps: [
      "Heat half of the oil in a large pan over medium heat.",
      "Crack in the eggs and scramble them until fully cooked.",
      "Move the eggs to a clean plate.",
      "Add the remaining oil and vegetables to the pan and cook until tender.",
      "Add the cooked rice and stir until it is hot throughout.",
      "Return the eggs to the pan.",
      "Add soy sauce and stir everything together.",
      "Top with green onion if you like.",
    ],
    tips: [
      "Cold leftover rice works especially well because it is less sticky.",
      "You can add cooked chicken, tofu, or another protein if you want.",
    ],
  },
  {
    title: "Fruit Yogurt Smoothie",
    emoji: "🥤",
    categories: ["Breakfast", "Snack", "Vegetarian", "Quick"],
    workoutGoals: ["endurance", "consistency", "muscle", "strength", "mobility"],
    timing: ["Before Workout", "After Workout"],
    prepTime: "5 min",
    cookTime: "No cooking",
    servings: "1 serving",
    summary: "A quick smoothie with fruit, yogurt, milk, and oats.",
    ingredients: [
      "1 banana",
      "1 cup frozen or fresh berries",
      "3/4 cup yogurt",
      "3/4 cup milk or fortified non-dairy milk",
      "1/4 cup oats",
      "Optional: 1 tablespoon peanut or seed butter",
    ],
    steps: [
      "Add the milk to the blender first.",
      "Add yogurt, banana, berries, and oats.",
      "Add peanut or seed butter if using.",
      "Blend until smooth.",
      "If the smoothie is too thick, add a small splash of milk and blend again.",
      "Pour into a glass and drink soon after blending.",
    ],
    tips: [
      "Use frozen fruit for a colder, thicker smoothie.",
      "If you are eating before exercise, adjust the size based on what feels comfortable.",
    ],
  },
];

export default function App() {
  const [step, setStep] = useState(0);
  const [workoutPlace, setWorkoutPlace] = useState<Place | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [workoutDays, setWorkoutDays] = useState<Weekday[]>([]);
  const [workoutLength, setWorkoutLength] = useState<string | null>(null);
  const [editWorkoutPlace, setEditWorkoutPlace] = useState<Place | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editEquipment, setEditEquipment] = useState<string[]>([]);
  const [editTrainingDays, setEditTrainingDays] = useState<number | null>(null);
  const [editWorkoutDays, setEditWorkoutDays] = useState<Weekday[]>([]);
  const [editWorkoutLength, setEditWorkoutLength] = useState<string | null>(null);
  const [completedSets, setCompletedSets] = useState<string[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState(0);
  const [completedPlanSessionIds, setCompletedPlanSessionIds] = useState<string[]>([]);
  const [activePlanSessionId, setActivePlanSessionId] = useState<string | null>(null);
  const [selectedPlanSession, setSelectedPlanSession] =
    useState<WorkoutPlanSession | null>(null);
  const [setLogs, setSetLogs] = useState<Record<string, SetLog>>({});
  const [previousSetLogs, setPreviousSetLogs] = useState<Record<string, SetLog>>({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [timerPhase, setTimerPhase] = useState<"work" | "rest">("work");
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [mealCategory, setMealCategory] = useState<MealCategory>("All");
  const [mealTiming, setMealTiming] = useState<MealTiming>("Anytime");
  const [mealSearch, setMealSearch] = useState("");
  const [recommendedMealsOnly, setRecommendedMealsOnly] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [exerciseCategory, setExerciseCategory] = useState<ExerciseCategory>("All");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [favoriteExercises, setFavoriteExercises] = useState<string[]>([]);
  const [showFavoriteExercises, setShowFavoriteExercises] = useState(false);
  const [selectedLibraryExercise, setSelectedLibraryExercise] =
    useState<ExerciseLibraryItem | null>(null);
  const [coachTime, setCoachTime] = useState("30 min");
  const [coachFocus, setCoachFocus] = useState<CoachFocus>("Today's Plan");
  const [coachEnergy, setCoachEnergy] = useState<CoachEnergy>("Ready");
  const [coachEquipmentMode, setCoachEquipmentMode] =
    useState<CoachEquipmentMode>("Use My Plan");
  const [sessionExercises, setSessionExercises] =
    useState<WorkoutExercise[] | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [sessionLength, setSessionLength] = useState<string | null>(null);
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState<{
    title: string;
    exercises: number;
    plannedDuration: string;
  } | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    "Local only" | "Connecting" | "Syncing" | "Synced" | "Error"
  >("Local only");

  const getPersistedSnapshot = (): PersistedAppData => ({
    workoutPlace,
    goal,
    equipment,
    trainingDays,
    workoutDays,
    workoutLength,
    completedWorkouts,
    completedPlanSessionIds,
    workoutHistory,
    weekKey: getCurrentWeekKey(),
    mealCategory,
    mealTiming,
    recommendedMealsOnly,
    favoriteExercises,
  });

  const applyPersistedData = (parsed: Partial<PersistedAppData>) => {
    if (parsed.workoutPlace === "home" || parsed.workoutPlace === "gym") {
      setWorkoutPlace(parsed.workoutPlace);
    }

    if (
      parsed.goal === "muscle" ||
      parsed.goal === "strength" ||
      parsed.goal === "endurance" ||
      parsed.goal === "consistency" ||
      parsed.goal === "mobility"
    ) {
      setGoal(parsed.goal);
    }

    if (Array.isArray(parsed.equipment)) {
      setEquipment(parsed.equipment);
    }

    if (typeof parsed.trainingDays === "number") {
      setTrainingDays(parsed.trainingDays);

      const savedDays = Array.isArray(parsed.workoutDays)
        ? parsed.workoutDays.filter((day): day is Weekday =>
            WEEKDAYS.includes(day as Weekday)
          )
        : [];

      setWorkoutDays(
        savedDays.length === parsed.trainingDays
          ? sortWorkoutDays(savedDays)
          : getDefaultWorkoutDays(parsed.trainingDays)
      );
    }

    if (typeof parsed.workoutLength === "string") {
      setWorkoutLength(parsed.workoutLength);
    }

    if (Array.isArray(parsed.workoutHistory)) {
      setWorkoutHistory(parsed.workoutHistory);
    }

    if (
      parsed.mealCategory === "All" ||
      parsed.mealCategory === "Breakfast" ||
      parsed.mealCategory === "Lunch" ||
      parsed.mealCategory === "Dinner" ||
      parsed.mealCategory === "Snack" ||
      parsed.mealCategory === "Vegetarian" ||
      parsed.mealCategory === "Quick"
    ) {
      setMealCategory(parsed.mealCategory);
    }

    if (
      parsed.mealTiming === "Anytime" ||
      parsed.mealTiming === "Before Workout" ||
      parsed.mealTiming === "After Workout"
    ) {
      setMealTiming(parsed.mealTiming);
    }

    if (typeof parsed.recommendedMealsOnly === "boolean") {
      setRecommendedMealsOnly(parsed.recommendedMealsOnly);
    }

    if (Array.isArray(parsed.favoriteExercises)) {
      setFavoriteExercises(
        parsed.favoriteExercises.filter(
          (item): item is string => typeof item === "string"
        )
      );
    }

    if (parsed.weekKey === getCurrentWeekKey()) {
      setCompletedWorkouts(
        typeof parsed.completedWorkouts === "number"
          ? parsed.completedWorkouts
          : 0
      );
      setCompletedPlanSessionIds(
        Array.isArray(parsed.completedPlanSessionIds)
          ? parsed.completedPlanSessionIds.filter(
              (item): item is string => typeof item === "string"
            )
          : []
      );
    } else {
      setCompletedWorkouts(0);
      setCompletedPlanSessionIds([]);
    }

    const hasSavedPlan =
      (parsed.workoutPlace === "home" || parsed.workoutPlace === "gym") &&
      !!parsed.goal &&
      Array.isArray(parsed.equipment) &&
      parsed.equipment.length > 0 &&
      typeof parsed.trainingDays === "number" &&
      typeof parsed.workoutLength === "string";

    if (hasSavedPlan) {
      setStep(5);
    }
  };

  useEffect(() => {
    let active = true;

    const restoreApp = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved || !active) {
          return;
        }

        const parsed = JSON.parse(saved) as Partial<PersistedAppData>;
        applyPersistedData(parsed);
      } catch {
        // If saved data is unavailable or invalid, the app starts fresh.
      } finally {
        if (active) {
          setStorageReady(true);
        }
      }
    };

    restoreApp();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    const saveApp = async () => {
      const data = getPersistedSnapshot();

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Keep the app usable even if local storage is temporarily unavailable.
      }
    };

    saveApp();
  }, [
    storageReady,
    workoutPlace,
    goal,
    equipment,
    trainingDays,
    workoutDays,
    workoutLength,
    completedWorkouts,
    completedPlanSessionIds,
    workoutHistory,
    mealCategory,
    mealTiming,
    recommendedMealsOnly,
    favoriteExercises,
  ]);

  useEffect(() => {
    if (!storageReady || !supabaseConfigured) {
      setCloudSyncStatus("Local only");
      return;
    }

    let mounted = true;

    const applySession = (session: any) => {
      if (!mounted) return;

      const user = session?.user;

      setSessionUserId(user?.id ?? null);
      setSessionEmail(user?.email ?? "");
      setCloudReady(false);
      setCloudSyncStatus(user ? "Connecting" : "Local only");
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || !supabaseConfigured || !sessionUserId) return;

    let cancelled = false;

    const loadCloud = async () => {
      setCloudSyncStatus("Connecting");

      const { data, error } = await supabase
        .from("user_app_state")
        .select("data")
        .eq("user_id", sessionUserId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setCloudSyncStatus("Error");
        return;
      }

      if (data?.data) {
        applyPersistedData(data.data as Partial<PersistedAppData>);
      } else {
        const { error: saveError } = await supabase
          .from("user_app_state")
          .upsert({
            user_id: sessionUserId,
            data: getPersistedSnapshot(),
            updated_at: new Date().toISOString(),
          });

        if (saveError) {
          setCloudSyncStatus("Error");
          return;
        }
      }

      if (!cancelled) {
        setCloudReady(true);
        setCloudSyncStatus("Synced");
      }
    };

    loadCloud();

    return () => {
      cancelled = true;
    };
  }, [storageReady, sessionUserId]);

  useEffect(() => {
    if (
      !storageReady ||
      !supabaseConfigured ||
      !sessionUserId ||
      !cloudReady
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      setCloudSyncStatus("Syncing");

      const { error } = await supabase.from("user_app_state").upsert({
        user_id: sessionUserId,
        data: getPersistedSnapshot(),
        updated_at: new Date().toISOString(),
      });

      setCloudSyncStatus(error ? "Error" : "Synced");
    }, 700);

    return () => clearTimeout(timer);
  }, [
    storageReady,
    sessionUserId,
    cloudReady,
    workoutPlace,
    goal,
    equipment,
    trainingDays,
    workoutDays,
    workoutLength,
    completedWorkouts,
    completedPlanSessionIds,
    workoutHistory,
    mealCategory,
    mealTiming,
    recommendedMealsOnly,
    favoriteExercises,
  ]);

  const submitAuth = async () => {
    if (!supabaseConfigured) {
      setAuthMessage("Account access needs Supabase setup first.");
      return;
    }

    const email = authEmail.trim();

    if (!email || authPassword.length < 6) {
      setAuthMessage("Enter an email and a password with at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: authPassword,
        });

        if (error) {
          setAuthMessage(error.message);
        } else {
          setAuthMessage("Signed in successfully.");
          setAuthPassword("");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: authPassword,
        });

        if (error) {
          setAuthMessage(error.message);
        } else if (!data.session) {
          setAuthMessage("Account created. Check your email to confirm it, then sign in.");
          setAuthMode("signin");
          setAuthPassword("");
        } else {
          setAuthMessage("Account created successfully.");
          setAuthPassword("");
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signOut();

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setSessionUserId(null);
    setSessionEmail("");
    setCloudReady(false);
    setCloudSyncStatus("Local only");
    setAuthMessage("Signed out. Your local data stays on this device.");
  };

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

  const toggleWorkoutDay = (day: Weekday) => {
    if (!trainingDays) return;

    setWorkoutDays((current) => {
      if (current.includes(day)) {
        return current.filter((item) => item !== day);
      }

      if (current.length >= trainingDays) {
        return current;
      }

      return sortWorkoutDays([...current, day]);
    });
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

  const workoutExercises = useMemo<WorkoutExercise[]>(() => {
    let exercises: WorkoutExercise[];

    if (goal === "mobility") {
      exercises = [
        { name: "Cat-Cow", target: "2 × 6–8 slow reps", focus: "Spine", cue: "Move slowly and stay comfortable." },
        { name: "World's Greatest Stretch", target: "2 × 4 each side", focus: "Hips + upper back", cue: "Use a comfortable range of motion." },
        { name: "Bodyweight Squat Hold", target: "2 × 20–30 sec", focus: "Hips + ankles", cue: "Hold onto support if needed." },
        { name: "Shoulder Wall Slides", target: "2 × 8–10", focus: "Shoulders", cue: "Keep the movement controlled." },
        { name: "Glute Bridge", target: "2 × 10–12", focus: "Hips", cue: "Pause briefly at the top." },
        { name: "Dead Bug", target: "2 × 6–8 each side", focus: "Core", cue: "Keep your lower back comfortable." },
      ];
    } else if (equipment.includes("Push-Up Board")) {
      exercises = [
        { name: "Push-Up Board Chest Press", target: "3 × 8–12", focus: "Chest", cue: "Use a board position that feels natural on your shoulders." },
        { name: "Push-Up Board Triceps", target: "2–3 × 8–12", focus: "Triceps", cue: "Keep your body in one straight line." },
        { name: "Bodyweight Squats", target: "3 × 10–15", focus: "Legs", cue: "Use a comfortable depth and steady tempo." },
        { name: "Reverse Lunges", target: "2 × 8 each side", focus: "Legs", cue: "Step back under control and use support if needed." },
        { name: "Glute Bridges", target: "3 × 10–15", focus: "Glutes", cue: "Move smoothly and pause at the top." },
        { name: "Dead Bug", target: "2 × 8 each side", focus: "Core", cue: "Slow reps; stop if your back feels uncomfortable." },
        { name: "Calf Raises", target: "2 × 12–15", focus: "Calves", cue: "Use a wall or chair for balance." },
      ];
    } else if (equipment.includes("No Equipment")) {
      exercises = [
        { name: "Push-Ups", target: "2–3 × 6–12", focus: "Chest + arms", cue: "Use an incline or knees-down version if needed." },
        { name: "Bodyweight Squats", target: "3 × 10–15", focus: "Legs", cue: "Keep the reps controlled." },
        { name: "Reverse Lunges", target: "2 × 8 each side", focus: "Legs", cue: "Use support for balance if needed." },
        { name: "Glute Bridges", target: "3 × 10–15", focus: "Glutes", cue: "Pause briefly at the top." },
        { name: "Bird Dog", target: "2 × 6–8 each side", focus: "Core + back", cue: "Move slowly without twisting." },
        { name: "Plank", target: "2 × 20–30 sec", focus: "Core", cue: "Finish the set early if your form starts to break down." },
        { name: "Calf Raises", target: "2 × 12–15", focus: "Calves", cue: "Use support for balance." },
      ];
    } else if (
      equipment.includes("Dumbbells") ||
      equipment.includes("Kettlebell")
    ) {
      exercises = [
        { name: "Goblet Squat", target: "3 × 8–12", focus: "Legs", cue: "Choose a manageable weight and move with control." },
        { name: "One-Arm Row", target: "3 × 8–12 each side", focus: "Back", cue: "Keep your torso steady." },
        { name: "Floor Press", target: "3 × 8–12", focus: "Chest", cue: "Use a weight you can control through every rep." },
        { name: "Romanian Deadlift", target: "2–3 × 8–12", focus: "Hamstrings", cue: "Keep the weight close and use a comfortable range." },
        { name: "Standing Shoulder Press", target: "2 × 8–10", focus: "Shoulders", cue: "Avoid leaning back to finish reps." },
        { name: "Dead Bug", target: "2 × 8 each side", focus: "Core", cue: "Slow, controlled reps." },
        { name: "Calf Raises", target: "2 × 12–15", focus: "Calves", cue: "Use support for balance." },
      ];
    } else if (workoutPlace === "gym") {
      exercises = [
        { name: "Leg Press", target: "3 × 8–12", focus: "Legs", cue: "Use a comfortable range and controlled reps." },
        { name: "Chest Press Machine", target: "3 × 8–12", focus: "Chest", cue: "Set the seat so the handles feel comfortable." },
        { name: "Lat Pulldown", target: "3 × 8–12", focus: "Back", cue: "Pull smoothly without swinging." },
        { name: "Seated Leg Curl", target: "2 × 10–12", focus: "Hamstrings", cue: "Keep the movement controlled." },
        { name: "Cable Row", target: "2 × 8–12", focus: "Back", cue: "Sit tall and avoid jerking the weight." },
        { name: "Machine Shoulder Press", target: "2 × 8–10", focus: "Shoulders", cue: "Use a light-to-moderate load you can control." },
        { name: "Easy Core Circuit", target: "2 rounds", focus: "Core", cue: "Keep it comfortable and stop if anything hurts." },
      ];
    } else {
      exercises = [
        { name: "Bodyweight Squats", target: "3 × 10–15", focus: "Legs", cue: "Use a comfortable depth." },
        { name: "Push-Ups", target: "2–3 × 6–12", focus: "Chest + arms", cue: "Choose a version you can do with good form." },
        { name: "Glute Bridges", target: "3 × 10–15", focus: "Glutes", cue: "Pause briefly at the top." },
        { name: "Reverse Lunges", target: "2 × 8 each side", focus: "Legs", cue: "Use support if needed." },
        { name: "Bird Dog", target: "2 × 8 each side", focus: "Core", cue: "Move slowly." },
        { name: "Plank", target: "2 × 20–30 sec", focus: "Core", cue: "Stop before your form breaks down." },
      ];
    }

    const maxExercises =
      workoutLength === "15 min"
        ? 4
        : workoutLength === "30 min"
        ? 5
        : workoutLength === "45 min"
        ? 6
        : 7;

    return exercises.slice(0, maxExercises);
  }, [goal, equipment, workoutPlace, workoutLength]);

  const weeklySessions = useMemo<WorkoutPlanSession[]>(() => {
    const limitForTime = (items: WorkoutExercise[]) => {
      const maxExercises =
        workoutLength === "15 min"
          ? 4
          : workoutLength === "30 min"
          ? 5
          : workoutLength === "45 min"
          ? 6
          : 7;

      return items.slice(0, maxExercises);
    };

    const bodyweightChest: WorkoutExercise[] = [
      { name: "Push-Ups", target: "2–3 × 6–12", focus: "Chest + arms", cue: "Choose a version you can do with smooth form." },
      { name: "Shoulder Wall Slides", target: "2 × 8–10", focus: "Shoulders", cue: "Use a comfortable range." },
      { name: "Dead Bug", target: "2 × 8 each side", focus: "Core", cue: "Move slowly and stay controlled." },
      { name: "Plank", target: "2 × 20–30 sec", focus: "Core + shoulders", cue: "Finish before your form breaks down." },
    ];

    const bodyweightLegs: WorkoutExercise[] = [
      { name: "Bodyweight Squats", target: "2–3 × 10–15", focus: "Legs", cue: "Use a comfortable depth." },
      { name: "Reverse Lunges", target: "2 × 6–8 each side", focus: "Legs + balance", cue: "Use support if needed." },
      { name: "Glute Bridges", target: "2–3 × 10–15", focus: "Hips", cue: "Pause briefly at the top." },
      { name: "Calf Raises", target: "2 × 10–15", focus: "Calves", cue: "Use a wall or chair for balance." },
      { name: "Bodyweight Squat Hold", target: "2 × 20–30 sec", focus: "Hips + ankles", cue: "Hold a comfortable position." },
    ];

    const coreMobility: WorkoutExercise[] = [
      { name: "Dead Bug", target: "2 × 6–8 each side", focus: "Core", cue: "Move slowly and stay controlled." },
      { name: "Bird Dog", target: "2 × 6–8 each side", focus: "Core + back", cue: "Reach without twisting." },
      { name: "Plank", target: "2 × 20–30 sec", focus: "Core", cue: "Stop before your form breaks down." },
      { name: "Cat-Cow", target: "2 × 6–8 slow reps", focus: "Spine", cue: "Keep the motion gentle." },
      { name: "Shoulder Wall Slides", target: "2 × 8–10", focus: "Shoulders", cue: "Do not force the range." },
      { name: "Bodyweight Squat Hold", target: "2 × 20–30 sec", focus: "Hips + ankles", cue: "Use support if needed." },
    ];

    const mobilityReset: WorkoutExercise[] = [
      { name: "Cat-Cow", target: "2 × 6–8 slow reps", focus: "Spine", cue: "Move slowly through a comfortable range." },
      { name: "Shoulder Wall Slides", target: "2 × 8–10", focus: "Shoulders", cue: "Keep the motion smooth." },
      { name: "Bird Dog", target: "2 × 6–8 each side", focus: "Core + back", cue: "Move without twisting." },
      { name: "Glute Bridges", target: "2 × 10–12", focus: "Hips", cue: "Use a smooth range." },
      { name: "Bodyweight Squat Hold", target: "2 × 20–30 sec", focus: "Hips + ankles", cue: "Use support if needed." },
    ];

    const hasDumbbells =
      equipment.includes("Dumbbells") || equipment.includes("Kettlebell");
    const hasBoard = equipment.includes("Push-Up Board");
    const useGym = workoutPlace === "gym";

    const chestShoulders: WorkoutExercise[] = useGym
      ? [
          { name: "Chest Press Machine", target: "2–3 × 8–12", focus: "Chest", cue: "Adjust the seat comfortably and press smoothly." },
          { name: "Machine Shoulder Press", target: "2 × 8–10", focus: "Shoulders", cue: "Use a load you can control." },
          { name: "Push-Ups", target: "2 × 6–10", focus: "Chest + arms", cue: "Choose a comfortable variation." },
          { name: "Dead Bug", target: "2 × 8 each side", focus: "Core", cue: "Keep the movement controlled." },
        ]
      : hasDumbbells
      ? [
          { name: "Floor Press", target: "2–3 × 8–12", focus: "Chest", cue: "Control every rep." },
          { name: "Standing Shoulder Press", target: "2 × 8–10", focus: "Shoulders", cue: "Avoid leaning back." },
          { name: "Push-Ups", target: "2 × 6–10", focus: "Chest + arms", cue: "Use an easier version if needed." },
          { name: "Dead Bug", target: "2 × 8 each side", focus: "Core", cue: "Move slowly." },
        ]
      : hasBoard
      ? [
          { name: "Push-Up Board Chest Press", target: "2–3 × 8–12", focus: "Chest", cue: "Use a comfortable handle position." },
          { name: "Push-Up Board Triceps", target: "2 × 8–12", focus: "Arms", cue: "Keep your body controlled." },
          { name: "Shoulder Wall Slides", target: "2 × 8–10", focus: "Shoulders", cue: "Use a comfortable range." },
          { name: "Dead Bug", target: "2 × 8 each side", focus: "Core", cue: "Move slowly." },
        ]
      : bodyweightChest;

    const legsHips: WorkoutExercise[] = useGym
      ? [
          { name: "Leg Press", target: "2–3 × 8–12", focus: "Legs", cue: "Use a comfortable range and smooth reps." },
          { name: "Seated Leg Curl", target: "2 × 10–12", focus: "Hamstrings", cue: "Keep the movement controlled." },
          { name: "Glute Bridges", target: "2 × 10–15", focus: "Hips", cue: "Pause briefly at the top." },
          { name: "Calf Raises", target: "2 × 10–15", focus: "Calves", cue: "Use support if needed." },
          { name: "Reverse Lunges", target: "2 × 6 each side", focus: "Legs + balance", cue: "Use support if needed." },
        ]
      : hasDumbbells
      ? [
          { name: "Goblet Squat", target: "2–3 × 8–12", focus: "Legs", cue: "Use a manageable weight." },
          { name: "Romanian Deadlift", target: "2 × 8–12", focus: "Hamstrings + hips", cue: "Keep the weight close and use a comfortable range." },
          { name: "Reverse Lunges", target: "2 × 6–8 each side", focus: "Legs", cue: "Use support if needed." },
          { name: "Glute Bridges", target: "2 × 10–15", focus: "Hips", cue: "Move smoothly." },
          { name: "Calf Raises", target: "2 × 10–15", focus: "Calves", cue: "Use support for balance." },
        ]
      : bodyweightLegs;

    const backArms: WorkoutExercise[] = useGym
      ? [
          { name: "Lat Pulldown", target: "2–3 × 8–12", focus: "Back + arms", cue: "Pull smoothly without swinging." },
          { name: "Cable Row", target: "2–3 × 8–12", focus: "Back", cue: "Sit tall and avoid jerking the handle." },
          { name: "Machine Shoulder Press", target: "2 × 8–10", focus: "Shoulders + arms", cue: "Use a comfortable range." },
          { name: "Bird Dog", target: "2 × 8 each side", focus: "Back + core", cue: "Move slowly." },
        ]
      : hasDumbbells
      ? [
          { name: "One-Arm Row", target: "2–3 × 8–12 each side", focus: "Back + arms", cue: "Keep your torso steady." },
          { name: "Standing Shoulder Press", target: "2 × 8–10", focus: "Shoulders + arms", cue: "Press smoothly." },
          { name: "Bird Dog", target: "2 × 8 each side", focus: "Back + core", cue: "Do not twist." },
          { name: "Plank", target: "2 × 20–30 sec", focus: "Core + shoulders", cue: "Stop before form breaks down." },
        ]
      : hasBoard
      ? [
          { name: "Push-Up Board Triceps", target: "2–3 × 8–12", focus: "Arms", cue: "Use a comfortable board setup." },
          { name: "Bird Dog", target: "2 × 8 each side", focus: "Back + core", cue: "Move without twisting." },
          { name: "Shoulder Wall Slides", target: "2 × 8–10", focus: "Upper back + shoulders", cue: "Use a comfortable range." },
          { name: "Plank", target: "2 × 20–30 sec", focus: "Core + shoulders", cue: "Finish before your form breaks down." },
        ]
      : [
          { name: "Bird Dog", target: "2–3 × 8 each side", focus: "Back + core", cue: "Reach slowly without twisting." },
          { name: "Shoulder Wall Slides", target: "2 × 8–10", focus: "Upper back + shoulders", cue: "Use a comfortable range." },
          { name: "Push-Ups", target: "2 × 6–10", focus: "Arms + shoulders", cue: "Choose a comfortable variation." },
          { name: "Plank", target: "2 × 20–30 sec", focus: "Core + shoulders", cue: "Stop before form breaks down." },
        ];

    const balancedTechnique: WorkoutExercise[] = [
      ...chestShoulders.slice(0, 2),
      ...legsHips.slice(0, 2),
      ...coreMobility.slice(0, 2),
    ];

    let focusTemplates: Omit<WorkoutPlanSession, "id" | "day">[];

    if (goal === "mobility") {
      focusTemplates = [
        {
          title: "Upper Mobility",
          focus: "Shoulders, upper back, and core",
          emoji: "✨",
          exercises: [
            { name: "Shoulder Wall Slides", target: "2 × 8–10", focus: "Shoulders", cue: "Use a comfortable range." },
            { name: "Cat-Cow", target: "2 × 6–8 slow reps", focus: "Spine", cue: "Move gently." },
            { name: "Bird Dog", target: "2 × 6–8 each side", focus: "Back + core", cue: "Keep your torso steady." },
            { name: "Dead Bug", target: "2 × 6–8 each side", focus: "Core", cue: "Stay controlled." },
          ],
        },
        {
          title: "Hips & Legs Mobility",
          focus: "Hips, legs, and ankles",
          emoji: "🌿",
          exercises: [
            { name: "Bodyweight Squat Hold", target: "2 × 20–30 sec", focus: "Hips + ankles", cue: "Use support if needed." },
            { name: "Glute Bridges", target: "2 × 10–12", focus: "Hips", cue: "Use a smooth range." },
            { name: "Reverse Lunges", target: "2 × 6 each side", focus: "Hips + legs", cue: "Use support if needed." },
            { name: "Calf Raises", target: "2 × 10–15", focus: "Calves", cue: "Use support for balance." },
          ],
        },
        {
          title: "Core & Stability",
          focus: "Core, balance, and control",
          emoji: "🧩",
          exercises: coreMobility,
        },
        {
          title: "Mobility Reset",
          focus: "Gentle full-body movement",
          emoji: "🧘",
          exercises: mobilityReset,
        },
      ];
    } else {
      const count = trainingDays ?? 3;

      if (count === 2) {
        focusTemplates = [
          {
            title: "Upper Body",
            focus: "Chest, back, shoulders, and arms",
            emoji: "💪",
            exercises: [...chestShoulders.slice(0, 2), ...backArms.slice(0, 2)],
          },
          {
            title: "Lower Body & Core",
            focus: "Legs, hips, and core",
            emoji: "🦵",
            exercises: [...legsHips.slice(0, 4), ...coreMobility.slice(0, 2)],
          },
        ];
      } else {
        focusTemplates = [
          {
            title: "Chest & Shoulders",
            focus: "Chest, shoulders, and controlled pressing",
            emoji: "💪",
            exercises: chestShoulders,
          },
          {
            title: "Core & Mobility",
            focus: "Core control and comfortable mobility",
            emoji: "🧩",
            exercises: coreMobility,
          },
          {
            title: "Legs & Hips",
            focus: "Legs, hips, balance, and control",
            emoji: "🦵",
            exercises: legsHips,
          },
          {
            title: "Back & Arms",
            focus: "Back, arms, shoulders, and posture",
            emoji: "↔️",
            exercises: backArms,
          },
          {
            title: "Balanced Technique",
            focus: "Full-body movement practice",
            emoji: "🎯",
            exercises: balancedTechnique,
          },
          {
            title: "Mobility Reset",
            focus: "Gentle full-body mobility and recovery",
            emoji: "🧘",
            exercises: mobilityReset,
          },
        ];
      }
    }

    const count = trainingDays ?? 3;

    return Array.from({ length: count }, (_, index) => {
      const template = focusTemplates[index % focusTemplates.length];

      return {
        id: `session-${index + 1}`,
        day: workoutDays[index] ?? null,
        title: template.title,
        focus: template.focus,
        emoji: template.emoji,
        exercises: limitForTime(template.exercises),
      };
    });
  }, [
    goal,
    equipment,
    workoutPlace,
    workoutLength,
    trainingDays,
    workoutDays,
  ]);

  const todayWeekday = getTodayWeekday();
  const todayPlanSession =
    weeklySessions.find((session) => session.day === todayWeekday) ?? null;
  const todayPlanCompleted = !!todayPlanSession &&
    completedPlanSessionIds.includes(todayPlanSession.id);

  const nextPlanSession = useMemo(() => {
    const todayIndex = WEEKDAYS.indexOf(todayWeekday);

    return (
      weeklySessions
        .filter((session) => !completedPlanSessionIds.includes(session.id))
        .sort((a, b) => {
          const aIndex = a.day ? WEEKDAYS.indexOf(a.day) : todayIndex;
          const bIndex = b.day ? WEEKDAYS.indexOf(b.day) : todayIndex;
          const aDistance = (aIndex - todayIndex + 7) % 7;
          const bDistance = (bIndex - todayIndex + 7) % 7;

          return aDistance - bDistance;
        })[0] ?? null
    );
  }, [weeklySessions, completedPlanSessionIds, todayWeekday]);

  const activeExercises = sessionExercises ?? workoutExercises;
  const activeWorkoutTitle = sessionTitle ?? todayWorkout;
  const activeWorkoutLength = sessionLength ?? workoutLength;

  const getSetCount = (target: string) => {
    const match = target.match(/^(\d+)/);
    return match ? Math.max(1, Number(match[1])) : 1;
  };

  const getSetTarget = (target: string) => {
    if (target.includes("×")) {
      return target.split("×").slice(1).join("×").trim();
    }

    if (target.toLowerCase().includes("round")) {
      return "1 round";
    }

    return target;
  };

  const usesExternalWeight = (exercise: WorkoutExercise) => {
    const weightedNames = [
      "Goblet Squat",
      "One-Arm Row",
      "Floor Press",
      "Romanian Deadlift",
      "Standing Shoulder Press",
      "Leg Press",
      "Chest Press Machine",
      "Lat Pulldown",
      "Seated Leg Curl",
      "Cable Row",
      "Machine Shoulder Press",
    ];

    return weightedNames.includes(exercise.name);
  };

  const getResultLabel = (target: string) => {
    const normalized = target.toLowerCase();

    if (normalized.includes("sec")) return "Seconds";
    if (normalized.includes("round")) return "Rounds";

    return "Reps";
  };

  const updateSetLog = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof SetLog,
    value: string
  ) => {
    const key = `${exerciseIndex}-${setIndex}`;

    setSetLogs((current) => ({
      ...current,
      [key]: {
        reps: current[key]?.reps ?? "",
        weight: current[key]?.weight ?? "",
        [field]: value,
      },
    }));
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const key = `${exerciseIndex}-${setIndex}`;

    setCompletedSets((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  };

  const getWorkWindow = (exercise: WorkoutExercise) => {
    const target = exercise.target.toLowerCase();

    if (target.includes("sec")) return 120;
    if (target.includes("round")) return 180;

    // This is a comfortable window, not a speed goal.
    return 300;
  };

  const getRestSeconds = (exercise: WorkoutExercise) => {
    if (goal === "mobility") return 30;
    if (usesExternalWeight(exercise)) return 60;
    if (goal === "strength") return 60;
    if (goal === "muscle") return 45;

    return 30;
  };

  const formatTimer = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const minutes = Math.floor(safe / 60);
    const remaining = safe % 60;

    return `${minutes}:${remaining.toString().padStart(2, "0")}`;
  };

  const startTimedWorkout = () => {
    const firstExercise = workoutExercises[0];

    setActivePlanSessionId(null);
    setSessionExercises(null);
    setSessionTitle(null);
    setSessionLength(null);
    setCompletedSets([]);
    setSetLogs({});
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setTimerPhase("work");
    setTimeLeft(firstExercise ? getWorkWindow(firstExercise) : 300);
    setTimerRunning(true);
    setStep(6);
  };

  const openEditPlan = () => {
    setEditWorkoutPlace(workoutPlace);
    setEditGoal(goal);
    setEditEquipment([...equipment]);
    setEditTrainingDays(trainingDays);
    setEditWorkoutDays(
      workoutDays.length === trainingDays
        ? [...workoutDays]
        : getDefaultWorkoutDays(trainingDays ?? 3)
    );
    setEditWorkoutLength(workoutLength);
    setStep(14);
  };

  const toggleEditEquipment = (item: string) => {
    if (item === "No Equipment") {
      setEditEquipment(["No Equipment"]);
      return;
    }

    const withoutNoEquipment = editEquipment.filter(
      (equipmentItem) => equipmentItem !== "No Equipment"
    );

    if (withoutNoEquipment.includes(item)) {
      setEditEquipment(
        withoutNoEquipment.filter((equipmentItem) => equipmentItem !== item)
      );
    } else {
      setEditEquipment([...withoutNoEquipment, item]);
    }
  };

  const toggleEditWorkoutDay = (day: Weekday) => {
    if (!editTrainingDays) return;

    setEditWorkoutDays((current) => {
      if (current.includes(day)) {
        return current.filter((item) => item !== day);
      }

      if (current.length >= editTrainingDays) {
        return current;
      }

      return sortWorkoutDays([...current, day]);
    });
  };

  const saveEditedPlan = () => {
    if (
      !editWorkoutPlace ||
      !editGoal ||
      editEquipment.length === 0 ||
      !editTrainingDays ||
      editWorkoutDays.length !== editTrainingDays ||
      !editWorkoutLength
    ) {
      return;
    }

    setWorkoutPlace(editWorkoutPlace);
    setGoal(editGoal);
    setEquipment(editEquipment);
    setTrainingDays(editTrainingDays);
    setWorkoutDays(sortWorkoutDays(editWorkoutDays));
    setWorkoutLength(editWorkoutLength);
    setCompletedWorkouts((current) => Math.min(current, editTrainingDays));
    setStep(13);
  };

  const openPlanSessionDetails = (session: WorkoutPlanSession) => {
    setSelectedPlanSession(session);
    setStep(15);
  };

  const startPlanSession = (session: WorkoutPlanSession) => {
    const firstExercise = session.exercises[0];

    setActivePlanSessionId(session.id);
    setSessionExercises(session.exercises);
    setSessionTitle(session.title);
    setSessionLength(workoutLength);
    setCompletedSets([]);
    setSetLogs({});
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setTimerPhase("work");
    setTimeLeft(firstExercise ? getWorkWindow(firstExercise) : 300);
    setTimerRunning(true);
    setStep(6);
  };

  const getCoachExercises = () => {
    const maxExercises =
      coachTime === "15 min"
        ? 4
        : coachTime === "30 min"
        ? 5
        : coachTime === "45 min"
        ? 6
        : 7;

    const comfortableLimit =
      coachEnergy === "Low Energy" ? Math.min(maxExercises, 4) : maxExercises;

    const bodyweightByFocus: Record<
      Exclude<CoachFocus, "Today's Plan">,
      WorkoutExercise[]
    > = {
      Chest: [
        {
          name: "Push-Ups",
          target: "2 × 6–10",
          focus: "Chest + arms",
          cue: "Use a wall, incline, or knees-down version if needed.",
        },
        {
          name: "Shoulder Wall Slides",
          target: "2 × 8–10",
          focus: "Shoulders",
          cue: "Use a comfortable range.",
        },
        {
          name: "Plank",
          target: "2 × 20–30 sec",
          focus: "Core + shoulders",
          cue: "Finish before your form breaks down.",
        },
        {
          name: "Dead Bug",
          target: "2 × 6–8 each side",
          focus: "Core",
          cue: "Move slowly and stay controlled.",
        },
      ],
      Core: [
        {
          name: "Dead Bug",
          target: "2 × 6–8 each side",
          focus: "Core",
          cue: "Move slowly and keep the movement controlled.",
        },
        {
          name: "Bird Dog",
          target: "2 × 6–8 each side",
          focus: "Core + back",
          cue: "Reach without twisting.",
        },
        {
          name: "Plank",
          target: "2 × 20–30 sec",
          focus: "Core",
          cue: "Stop before your form breaks down.",
        },
        {
          name: "Glute Bridges",
          target: "2 × 10–12",
          focus: "Hips + core",
          cue: "Move smoothly and pause briefly at the top.",
        },
      ],
      Legs: [
        {
          name: "Bodyweight Squats",
          target: "2 × 10–12",
          focus: "Legs",
          cue: "Use a comfortable depth and steady pace.",
        },
        {
          name: "Reverse Lunges",
          target: "2 × 6–8 each side",
          focus: "Legs + balance",
          cue: "Use support for balance if needed.",
        },
        {
          name: "Glute Bridges",
          target: "2 × 10–12",
          focus: "Hips",
          cue: "Move smoothly and pause briefly at the top.",
        },
        {
          name: "Calf Raises",
          target: "2 × 10–15",
          focus: "Calves",
          cue: "Use a wall or chair for balance.",
        },
      ],
      "Back & Arms": [
        {
          name: "Bird Dog",
          target: "2 × 6–8 each side",
          focus: "Back + core",
          cue: "Move slowly without twisting.",
        },
        {
          name: "Shoulder Wall Slides",
          target: "2 × 8–10",
          focus: "Upper back + shoulders",
          cue: "Use a comfortable range.",
        },
        {
          name: "Push-Ups",
          target: "2 × 6–10",
          focus: "Arms + shoulders",
          cue: "Choose a comfortable variation.",
        },
        {
          name: "Plank",
          target: "2 × 20–30 sec",
          focus: "Core + shoulders",
          cue: "Stop before your form breaks down.",
        },
      ],
      Mobility: [
        {
          name: "Cat-Cow",
          target: "2 × 6–8 slow reps",
          focus: "Spine",
          cue: "Move slowly through a comfortable range.",
        },
        {
          name: "Shoulder Wall Slides",
          target: "2 × 8–10",
          focus: "Shoulders",
          cue: "Use a comfortable range without forcing the movement.",
        },
        {
          name: "Bodyweight Squat Hold",
          target: "2 × 20–30 sec",
          focus: "Hips + ankles",
          cue: "Hold onto support if that feels better.",
        },
        {
          name: "Bird Dog",
          target: "2 × 6–8 each side",
          focus: "Core + back",
          cue: "Move slowly without twisting.",
        },
      ],
    };

    if (coachEnergy === "Recovery") {
      return bodyweightByFocus.Mobility.slice(
        0,
        Math.min(comfortableLimit, bodyweightByFocus.Mobility.length)
      );
    }

    if (coachEquipmentMode === "No Equipment Today") {
      const fallbackFocus =
        coachFocus === "Today's Plan" ? "Core" : coachFocus;

      return bodyweightByFocus[fallbackFocus].slice(0, comfortableLimit);
    }

    let sourceSession: WorkoutPlanSession | null = null;

    if (coachFocus === "Today's Plan") {
      sourceSession =
        (todayPlanSession && !todayPlanCompleted
          ? todayPlanSession
          : nextPlanSession) ??
        weeklySessions[0] ??
        null;
    } else {
      const titleMatch =
        coachFocus === "Chest"
          ? ["Chest", "Upper Body"]
          : coachFocus === "Core"
          ? ["Core"]
          : coachFocus === "Legs"
          ? ["Legs", "Lower Body"]
          : coachFocus === "Back & Arms"
          ? ["Back", "Upper Body"]
          : ["Mobility"];

      sourceSession =
        weeklySessions.find((session) =>
          titleMatch.some(
            (term) =>
              session.title.includes(term) || session.focus.includes(term)
          )
        ) ?? null;
    }

    const sourceExercises =
      sourceSession?.exercises ??
      bodyweightByFocus[
        coachFocus === "Today's Plan" ? "Core" : coachFocus
      ];

    return sourceExercises.slice(0, comfortableLimit);
  };

  const startCoachWorkout = () => {
    const coachExercises = getCoachExercises();
    const firstExercise = coachExercises[0];

    const focusTitle =
      coachFocus === "Today's Plan" ? "Today's Plan" : coachFocus;

    const title =
      coachEnergy === "Recovery"
        ? "Recovery & Mobility Session"
        : coachEnergy === "Low Energy"
        ? `Light ${focusTitle} Session`
        : coachEquipmentMode === "No Equipment Today"
        ? `No-Equipment ${focusTitle} Session`
        : `${focusTitle} Coach Session`;

    setActivePlanSessionId(null);
    setSessionExercises(coachExercises);
    setSessionTitle(title);
    setSessionLength(coachTime);
    setCompletedSets([]);
    setSetLogs({});
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setTimerPhase("work");
    setTimeLeft(firstExercise ? getWorkWindow(firstExercise) : 300);
    setTimerRunning(true);
    setStep(6);
  };

  const finishTimedWorkout = () => {
    const summary = {
      title: activeWorkoutTitle,
      exercises: activeExercises.length,
      plannedDuration: activeWorkoutLength ?? "Custom",
    };

    const isNewPlannedCompletion =
      !!activePlanSessionId &&
      !completedPlanSessionIds.includes(activePlanSessionId);

    if (!activePlanSessionId || isNewPlannedCompletion) {
      setCompletedWorkouts((current) =>
        Math.min(current + 1, trainingDays ?? current + 1)
      );
    }

    if (activePlanSessionId && isNewPlannedCompletion) {
      setCompletedPlanSessionIds((current) => [
        ...current,
        activePlanSessionId,
      ]);
    }

    setWorkoutHistory((current) => [
      {
        id: `${Date.now()}`,
        title: summary.title,
        completedAt: new Date().toISOString(),
        exercises: summary.exercises,
        plannedDuration: summary.plannedDuration,
      },
      ...current,
    ]);

    setLastWorkoutSummary(summary);
    setCompletedSets([]);
    setSetLogs({});
    setTimerRunning(false);
    setActivePlanSessionId(null);
    setSessionExercises(null);
    setSessionTitle(null);
    setSessionLength(null);
    setStep(12);
  };

  const moveToNextSet = () => {
    const exercise = activeExercises[currentExerciseIndex];

    if (!exercise) {
      finishTimedWorkout();
      return;
    }

    const setCount = getSetCount(exercise.target);
    const isLastSet = currentSetIndex >= setCount - 1;
    const isLastExercise =
      currentExerciseIndex >= activeExercises.length - 1;

    if (!isLastSet) {
      const nextSetIndex = currentSetIndex + 1;
      setCurrentSetIndex(nextSetIndex);
      setTimerPhase("work");
      setTimeLeft(getWorkWindow(exercise));
      setTimerRunning(true);
      return;
    }

    if (!isLastExercise) {
      const nextExerciseIndex = currentExerciseIndex + 1;
      const nextExercise = activeExercises[nextExerciseIndex];

      setCurrentExerciseIndex(nextExerciseIndex);
      setCurrentSetIndex(0);
      setTimerPhase("work");
      setTimeLeft(getWorkWindow(nextExercise));
      setTimerRunning(true);
      return;
    }

    finishTimedWorkout();
  };

  const completeTimedSet = () => {
    const exercise = activeExercises[currentExerciseIndex];

    if (!exercise) return;

    const key = `${currentExerciseIndex}-${currentSetIndex}`;
    const setCount = getSetCount(exercise.target);
    const isLastSet = currentSetIndex >= setCount - 1;
    const isLastExercise =
      currentExerciseIndex >= activeExercises.length - 1;

    setCompletedSets((current) =>
      current.includes(key) ? current : [...current, key]
    );

    if (isLastSet && isLastExercise) {
      finishTimedWorkout();
      return;
    }

    setTimerPhase("rest");
    setTimeLeft(getRestSeconds(exercise));
    setTimerRunning(true);
  };

  const skipRest = () => {
    moveToNextSet();
  };

  useEffect(() => {
    if (step !== 6 || !timerRunning) return;

    if (timeLeft <= 0) {
      setTimerRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timer);

          if (timerPhase === "rest") {
            setTimeout(() => moveToNextSet(), 0);
          } else {
            setTimerRunning(false);
          }

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    step,
    timerRunning,
    timeLeft,
    timerPhase,
    currentExerciseIndex,
    currentSetIndex,
  ]);

  const coachPreviewExercises = getCoachExercises();

  const coachSummary =
    coachEnergy === "Recovery"
      ? "A gentle mobility-focused session with comfortable movement and short recovery breaks."
      : coachEquipmentMode === "No Equipment Today"
      ? `A ${coachTime} ${coachFocus === "Today's Plan" ? "bodyweight" : coachFocus.toLowerCase()} session using no equipment.`
      : coachEnergy === "Low Energy"
      ? `A lighter ${coachTime} ${coachFocus === "Today's Plan" ? "version of your plan" : coachFocus.toLowerCase() + " session"} with fewer exercises.`
      : coachFocus === "Today's Plan"
      ? `A ${coachTime} session based on your next planned workout.`
      : `A ${coachTime} ${coachFocus.toLowerCase()} session matched to your current equipment.`;

  const weeklyProgressPercent = trainingDays
    ? Math.min(100, Math.round((completedWorkouts / trainingDays) * 100))
    : 0;

  const progressWeeks = useMemo(() => {
    const startOfWeek = (date: Date) => {
      const start = new Date(date);
      const day = start.getDay();
      const difference = start.getDate() - day + (day === 0 ? -6 : 1);

      start.setDate(difference);
      start.setHours(0, 0, 0, 0);
      return start;
    };

    const now = new Date();
    const currentStart = startOfWeek(now);

    return [3, 2, 1, 0].map((weeksAgo) => {
      const start = new Date(currentStart);
      start.setDate(start.getDate() - weeksAgo * 7);

      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const count = workoutHistory.filter((item) => {
        const completedAt = new Date(item.completedAt);
        return completedAt >= start && completedAt < end;
      }).length;

      return {
        key: start.toISOString().slice(0, 10),
        label:
          weeksAgo === 0
            ? "This week"
            : start.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              }),
        count,
      };
    });
  }, [workoutHistory]);

  const activeWeeks = useMemo(() => {
    const keys = new Set<string>();

    workoutHistory.forEach((item) => {
      const date = new Date(item.completedAt);
      const monday = new Date(date);
      const day = monday.getDay();
      const difference = monday.getDate() - day + (day === 0 ? -6 : 1);

      monday.setDate(difference);
      monday.setHours(0, 0, 0, 0);
      keys.add(monday.toISOString().slice(0, 10));
    });

    return keys.size;
  }, [workoutHistory]);

  const maxProgressWeekCount = Math.max(
    1,
    ...progressWeeks.map((week) => week.count)
  );

  const toggleFavoriteExercise = (name: string) => {
    setFavoriteExercises((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  };

  const openExerciseGuide = (exercise: ExerciseLibraryItem) => {
    setSelectedLibraryExercise(exercise);
    setStep(16);
  };

  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();

    return EXERCISE_LIBRARY.filter((exercise) => {
      const categoryMatch =
        exerciseCategory === "All" || exercise.category === exerciseCategory;

      const searchMatch =
        !query ||
        exercise.name.toLowerCase().includes(query) ||
        exercise.focus.toLowerCase().includes(query) ||
        exercise.equipment.toLowerCase().includes(query);

      const favoriteMatch =
        !showFavoriteExercises || favoriteExercises.includes(exercise.name);

      return categoryMatch && searchMatch && favoriteMatch;
    });
  }, [
    exerciseCategory,
    exerciseSearch,
    showFavoriteExercises,
    favoriteExercises,
  ]);

  const mealGoalLabel =
    goal === "muscle"
      ? "Build Muscle"
      : goal === "strength"
      ? "Build Strength"
      : goal === "endurance"
      ? "Improve Endurance"
      : goal === "mobility"
      ? "Mobility & Recovery"
      : "Stay Consistent";

  const filteredMeals = useMemo(() => {
    const query = mealSearch.trim().toLowerCase();

    const matches = MEALS.filter((meal) => {
      const categoryMatch =
        mealCategory === "All" || meal.categories.includes(mealCategory);

      const timingMatch =
        mealTiming === "Anytime" || meal.timing.includes(mealTiming);

      const goalMatch = !goal || meal.workoutGoals.includes(goal);

      const searchableText = [
        meal.title,
        meal.summary,
        ...meal.ingredients,
        ...meal.categories,
        ...meal.timing,
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = !query || searchableText.includes(query);

      return (
        categoryMatch &&
        timingMatch &&
        searchMatch &&
        (!recommendedMealsOnly || goalMatch)
      );
    });

    return matches.sort((a, b) => {
      if (!goal) return 0;

      const aMatch = a.workoutGoals.includes(goal) ? 1 : 0;
      const bMatch = b.workoutGoals.includes(goal) ? 1 : 0;

      return bMatch - aMatch;
    });
  }, [
    mealCategory,
    mealTiming,
    mealSearch,
    recommendedMealsOnly,
    goal,
  ]);

  const finishWorkout = () => {
    if (completedSets.length > 0) {
      setCompletedWorkouts((current) =>
        Math.min(current + 1, trainingDays ?? current + 1)
      );

      const completedLogs: Record<string, SetLog> = {};

      completedSets.forEach((key) => {
        const log = setLogs[key];

        if (log && (log.reps || log.weight)) {
          completedLogs[key] = log;
        }
      });

      if (Object.keys(completedLogs).length > 0) {
        setPreviousSetLogs(completedLogs);
      }
    }

    setCompletedSets([]);
    setSetLogs({});
    setStep(5);
  };

  if (!storageReady) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.storageLoading}>
          <Image
            source={require("./assets/icon.png")}
            style={styles.brandLogoLarge}
            resizeMode="contain"
          />
          <Text style={styles.storageLoadingTitle}>Z WORKOUT</Text>
          <Text style={styles.storageLoadingText}>Loading your plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.centerContent}>
          <Image
            source={require("./assets/icon.png")}
            style={styles.brandLogoLarge}
            resizeMode="contain"
          />

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
                onPress={() => {
                  setTrainingDays(day);
                  setWorkoutDays(getDefaultWorkoutDays(day));
                }}
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

          <Text style={styles.sectionQuestion}>Which days work best?</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.weekdayChoice,
                  workoutDays.includes(day) && styles.weekdayChoiceActive,
                ]}
                onPress={() => toggleWorkoutDay(day)}
              >
                <Text
                  style={[
                    styles.weekdayChoiceText,
                    workoutDays.includes(day) && styles.weekdayChoiceTextActive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.weekdayHint}>
            Pick {trainingDays ?? "-"} day{trainingDays === 1 ? "" : "s"}.
            You can change them later.
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
            disabled={
              !trainingDays ||
              workoutDays.length !== trainingDays ||
              !workoutLength
            }
            style={[
              styles.primaryButton,
              (!trainingDays ||
                workoutDays.length !== trainingDays ||
                !workoutLength) &&
                styles.disabledButton,
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

  if (step === 13) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.workoutPlanScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(5)}>
            <Text style={styles.workoutBack}>‹ Back home</Text>
          </TouchableOpacity>

          <Text style={styles.workoutScreenLabel}>YOUR WORKOUTS</Text>
          <Text style={styles.workoutPlanTitle}>Your weekly plan</Text>
          <Text style={styles.workoutPlanSubtitle}>
            {trainingDays ?? "-"} planned sessions • {workoutLength ?? "-"} each
            {workoutDays.length ? ` • ${workoutDays.join(", ")}` : ""}.
            Pick a session when you are ready. Rest days can go between them.
          </Text>

          <View style={styles.workoutPlanOverview}>
            <View style={styles.workoutPlanOverviewText}>
              <Text style={styles.workoutPlanOverviewLabel}>CURRENT PLAN</Text>
              <Text style={styles.workoutPlanOverviewTitle}>{todayWorkout}</Text>
              <Text style={styles.workoutPlanOverviewMeta}>{planDescription}</Text>
            </View>
            <Text style={styles.workoutPlanOverviewEmoji}>⚡</Text>
          </View>

          <TouchableOpacity
            style={styles.editPlanButton}
            onPress={openEditPlan}
          >
            <Text style={styles.editPlanButtonText}>EDIT MY PLAN</Text>
          </TouchableOpacity>

          <View style={styles.workoutPlanProgressRow}>
            <Text style={styles.workoutPlanProgressText}>
              {completedWorkouts}/{trainingDays ?? "-"} completed this week
            </Text>
            <Text style={styles.workoutPlanProgressPercent}>
              {weeklyProgressPercent}%
            </Text>
          </View>

          <View style={styles.workoutPlanBar}>
            <View
              style={[
                styles.workoutPlanBarFill,
                { width: `${weeklyProgressPercent}%` },
              ]}
            />
          </View>

          <Text style={styles.workoutPlanSectionTitle}>This week</Text>

          <View style={styles.weekCalendar}>
            {WEEKDAYS.map((day) => {
              const plannedSession =
                weeklySessions.find((session) => session.day === day) ?? null;
              const completed =
                !!plannedSession &&
                completedPlanSessionIds.includes(plannedSession.id);
              const isToday = day === todayWeekday;

              return (
                <TouchableOpacity
                  key={day}
                  disabled={!plannedSession}
                  style={[
                    styles.weekCalendarDay,
                    plannedSession && styles.weekCalendarDayPlanned,
                    completed && styles.weekCalendarDayCompleted,
                    isToday && styles.weekCalendarDayToday,
                  ]}
                  onPress={() =>
                    plannedSession && openPlanSessionDetails(plannedSession)
                  }
                >
                  <Text
                    style={[
                      styles.weekCalendarLabel,
                      plannedSession && styles.weekCalendarLabelPlanned,
                      completed && styles.weekCalendarLabelCompleted,
                    ]}
                  >
                    {day}
                  </Text>

                  <View
                    style={[
                      styles.weekCalendarDot,
                      plannedSession && styles.weekCalendarDotPlanned,
                      completed && styles.weekCalendarDotCompleted,
                    ]}
                  />

                  <Text
                    style={[
                      styles.weekCalendarStatus,
                      plannedSession && styles.weekCalendarStatusPlanned,
                      completed && styles.weekCalendarStatusCompleted,
                    ]}
                  >
                    {completed ? "Done" : plannedSession ? "Train" : "Rest"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {nextPlanSession && (
            <TouchableOpacity
              style={styles.nextSessionCard}
              onPress={() => openPlanSessionDetails(nextPlanSession)}
            >
              <View style={styles.nextSessionTextWrap}>
                <Text style={styles.nextSessionLabel}>NEXT PLANNED SESSION</Text>
                <Text style={styles.nextSessionTitle}>
                  {nextPlanSession.day} • {nextPlanSession.title}
                </Text>
                <Text style={styles.nextSessionMeta}>
                  {nextPlanSession.focus} • {nextPlanSession.exercises.length} exercises
                </Text>
              </View>
              <Text style={styles.nextSessionArrow}>›</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.workoutPlanSectionTitle}>Planned sessions</Text>

          {weeklySessions.map((session, index) => {
            const completed = completedPlanSessionIds.includes(session.id);

            return (
              <View
                key={session.id}
                style={[
                  styles.workoutPlanCard,
                  completed && styles.workoutPlanCardCompleted,
                ]}
              >
                <View style={styles.workoutPlanCardHeader}>
                  <View style={styles.workoutPlanIcon}>
                    <Text style={styles.workoutPlanIconText}>
                      {completed ? "✓" : session.emoji}
                    </Text>
                  </View>

                  <View style={styles.workoutPlanCardTitleWrap}>
                    <View style={styles.workoutPlanDayRow}>
                      <Text style={styles.workoutPlanDay}>
                        {session.day ?? `SESSION ${index + 1}`}
                      </Text>
                      {completed && (
                        <Text style={styles.workoutPlanCompletedBadge}>
                          COMPLETE
                        </Text>
                      )}
                    </View>
                    <Text style={styles.workoutPlanCardTitle}>{session.title}</Text>
                    <Text style={styles.workoutPlanCardMeta}>
                      {session.focus} • {session.exercises.length} exercises
                    </Text>
                  </View>
                </View>

                <View style={styles.workoutPlanExercisePreview}>
                  {session.exercises.slice(0, 4).map((exercise) => (
                    <Text
                      key={`${session.id}-${exercise.name}`}
                      style={styles.workoutPlanExerciseText}
                    >
                      • {exercise.name}
                    </Text>
                  ))}
                  {session.exercises.length > 4 && (
                    <Text style={styles.workoutPlanMoreText}>
                      + {session.exercises.length - 4} more
                    </Text>
                  )}
                </View>

                <View style={styles.workoutPlanActionRow}>
                  <TouchableOpacity
                    style={styles.workoutPlanDetailsButton}
                    onPress={() => openPlanSessionDetails(session)}
                  >
                    <Text style={styles.workoutPlanDetailsText}>VIEW DETAILS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={completed}
                    style={[
                      styles.workoutPlanStartButton,
                      styles.workoutPlanStartButtonHalf,
                      completed && styles.workoutPlanStartButtonCompleted,
                    ]}
                    onPress={() => startPlanSession(session)}
                  >
                    <Text
                      style={[
                        styles.workoutPlanStartText,
                        completed && styles.workoutPlanStartTextCompleted,
                      ]}
                    >
                      {completed ? "COMPLETED ✓" : "START SESSION"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={styles.workoutPlanNote}>
            <Text style={styles.workoutPlanNoteTitle}>Keep it flexible</Text>
            <Text style={styles.workoutPlanNoteText}>
              You do not need to complete sessions on consecutive days. Use Z
              Coach when you need a shorter, no-equipment, or recovery option.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 15 && selectedPlanSession) {
    const selectedCompleted = completedPlanSessionIds.includes(
      selectedPlanSession.id
    );

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.sessionDetailScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(13)}>
            <Text style={styles.workoutBack}>‹ Back to weekly plan</Text>
          </TouchableOpacity>

          <View style={styles.sessionDetailHero}>
            <View style={styles.sessionDetailHeroTop}>
              <View style={styles.sessionDetailIcon}>
                <Text style={styles.sessionDetailIconText}>
                  {selectedCompleted ? "✓" : selectedPlanSession.emoji}
                </Text>
              </View>

              <View style={styles.sessionDetailHeroText}>
                <Text style={styles.sessionDetailDay}>
                  {selectedPlanSession.day ?? "PLANNED SESSION"}
                </Text>
                <Text style={styles.sessionDetailTitle}>
                  {selectedPlanSession.title}
                </Text>
              </View>
            </View>

            <Text style={styles.sessionDetailFocus}>
              {selectedPlanSession.focus}
            </Text>

            <View style={styles.sessionDetailMetaRow}>
              <View style={styles.sessionDetailMetaCard}>
                <Text style={styles.sessionDetailMetaValue}>
                  {selectedPlanSession.exercises.length}
                </Text>
                <Text style={styles.sessionDetailMetaLabel}>Exercises</Text>
              </View>

              <View style={styles.sessionDetailMetaCard}>
                <Text style={styles.sessionDetailMetaValue}>
                  {workoutLength ?? "-"}
                </Text>
                <Text style={styles.sessionDetailMetaLabel}>Planned time</Text>
              </View>

              <View style={styles.sessionDetailMetaCard}>
                <Text style={styles.sessionDetailMetaValue}>
                  {selectedCompleted ? "Done" : "Ready"}
                </Text>
                <Text style={styles.sessionDetailMetaLabel}>Status</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sessionDetailSectionTitle}>Session exercises</Text>
          <Text style={styles.sessionDetailSectionText}>
            Move with control and use the easier option when an exercise does not
            feel comfortable.
          </Text>

          {selectedPlanSession.exercises.map((exercise, index) => (
            <View
              key={`${selectedPlanSession.id}-detail-${exercise.name}`}
              style={styles.sessionExerciseCard}
            >
              <View style={styles.sessionExerciseNumber}>
                <Text style={styles.sessionExerciseNumberText}>{index + 1}</Text>
              </View>

              <View style={styles.sessionExerciseContent}>
                <Text style={styles.sessionExerciseName}>{exercise.name}</Text>
                <Text style={styles.sessionExerciseTarget}>{exercise.target}</Text>

                <View style={styles.sessionExerciseFocusRow}>
                  <Text style={styles.sessionExerciseFocusLabel}>FOCUS</Text>
                  <Text style={styles.sessionExerciseFocusText}>
                    {exercise.focus}
                  </Text>
                </View>

                <Text style={styles.sessionExerciseCue}>{exercise.cue}</Text>
              </View>
            </View>
          ))}

          <View style={styles.sessionDetailNote}>
            <Text style={styles.sessionDetailNoteTitle}>Before you start</Text>
            <Text style={styles.sessionDetailNoteText}>
              You can pause the guided timer, take more recovery time, and stop
              the session if something hurts.
            </Text>
          </View>

          <TouchableOpacity
            disabled={selectedCompleted}
            style={[
              styles.sessionDetailStartButton,
              selectedCompleted && styles.sessionDetailStartButtonCompleted,
            ]}
            onPress={() => startPlanSession(selectedPlanSession)}
          >
            <Text
              style={[
                styles.sessionDetailStartButtonText,
                selectedCompleted &&
                  styles.sessionDetailStartButtonTextCompleted,
              ]}
            >
              {selectedCompleted ? "SESSION COMPLETED ✓" : "START THIS SESSION"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 14) {
    const editPlanReady =
      !!editWorkoutPlace &&
      !!editGoal &&
      editEquipment.length > 0 &&
      !!editTrainingDays &&
      editWorkoutDays.length === editTrainingDays &&
      !!editWorkoutLength;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.editPlanScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(13)}>
            <Text style={styles.workoutBack}>‹ Back to workouts</Text>
          </TouchableOpacity>

          <Text style={styles.workoutScreenLabel}>EDIT PLAN</Text>
          <Text style={styles.editPlanTitle}>Change your workout plan</Text>
          <Text style={styles.editPlanSubtitle}>
            Update any part of your plan. Your completed workout history stays
            saved.
          </Text>

          <Text style={styles.editPlanSectionTitle}>Where do you train?</Text>
          <View style={styles.editPlanTwoColumn}>
            <TouchableOpacity
              style={[
                styles.editPlanChoiceCard,
                editWorkoutPlace === "home" && styles.editPlanChoiceCardActive,
              ]}
              onPress={() => setEditWorkoutPlace("home")}
            >
              <Text style={styles.editPlanChoiceEmoji}>🏠</Text>
              <Text
                style={[
                  styles.editPlanChoiceTitle,
                  editWorkoutPlace === "home" &&
                    styles.editPlanChoiceTitleActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editPlanChoiceCard,
                editWorkoutPlace === "gym" && styles.editPlanChoiceCardActive,
              ]}
              onPress={() => setEditWorkoutPlace("gym")}
            >
              <Text style={styles.editPlanChoiceEmoji}>🏋️</Text>
              <Text
                style={[
                  styles.editPlanChoiceTitle,
                  editWorkoutPlace === "gym" &&
                    styles.editPlanChoiceTitleActive,
                ]}
              >
                Gym
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.editPlanSectionTitle}>Main workout goal</Text>
          <View style={styles.editGoalStack}>
            {(
              [
                ["muscle", "💪", "Build Muscle"],
                ["strength", "🏋️", "Build Strength"],
                ["endurance", "⚡", "Improve Endurance"],
                ["consistency", "✓", "Stay Consistent"],
                ["mobility", "🧘", "Mobility & Flexibility"],
              ] as [Goal, string, string][]
            ).map(([value, emoji, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.editGoalCard,
                  editGoal === value && styles.editGoalCardActive,
                ]}
                onPress={() => setEditGoal(value)}
              >
                <Text style={styles.editGoalEmoji}>{emoji}</Text>
                <Text
                  style={[
                    styles.editGoalText,
                    editGoal === value && styles.editGoalTextActive,
                  ]}
                >
                  {label}
                </Text>
                <Text style={styles.editGoalCheck}>
                  {editGoal === value ? "✓" : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.editPlanSectionTitle}>Available equipment</Text>
          <View style={styles.chipContainer}>
            {EQUIPMENT.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  editEquipment.includes(item) && styles.selectedChip,
                ]}
                onPress={() => toggleEditEquipment(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    editEquipment.includes(item) && styles.selectedChipText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.editPlanSectionTitle}>Sessions per week</Text>
          <View style={styles.choiceRow}>
            {[2, 3, 4, 5, 6].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.numberChoice,
                  editTrainingDays === day && styles.selectedNumberChoice,
                ]}
                onPress={() => {
                  setEditTrainingDays(day);
                  setEditWorkoutDays(getDefaultWorkoutDays(day));
                }}
              >
                <Text
                  style={[
                    styles.numberChoiceText,
                    editTrainingDays === day &&
                      styles.selectedNumberChoiceText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.editPlanHint}>
            Rest and recovery days can go between sessions.
          </Text>

          <Text style={styles.editPlanSectionTitle}>Workout days</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.weekdayChoice,
                  editWorkoutDays.includes(day) && styles.weekdayChoiceActive,
                ]}
                onPress={() => toggleEditWorkoutDay(day)}
              >
                <Text
                  style={[
                    styles.weekdayChoiceText,
                    editWorkoutDays.includes(day) &&
                      styles.weekdayChoiceTextActive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.weekdayHint}>
            Select exactly {editTrainingDays ?? "-"} day
            {editTrainingDays === 1 ? "" : "s"}.
          </Text>

          <Text style={styles.editPlanSectionTitle}>Workout length</Text>
          <View style={styles.timeGrid}>
            {["15 min", "30 min", "45 min", "60+ min"].map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeChoice,
                  editWorkoutLength === time && styles.selectedTimeChoice,
                ]}
                onPress={() => setEditWorkoutLength(time)}
              >
                <Text
                  style={[
                    styles.timeChoiceText,
                    editWorkoutLength === time &&
                      styles.selectedTimeChoiceText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            disabled={!editPlanReady}
            style={[
              styles.editPlanSaveButton,
              !editPlanReady && styles.disabledButton,
            ]}
            onPress={saveEditedPlan}
          >
            <Text style={styles.editPlanSaveButtonText}>SAVE NEW PLAN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editPlanCancelButton}
            onPress={() => setStep(13)}
          >
            <Text style={styles.editPlanCancelText}>CANCEL</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 6) {
    const currentExercise = activeExercises[currentExerciseIndex];

    if (!currentExercise) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.timerEmptyState}>
            <Text style={styles.timerExerciseTitle}>No workout found</Text>
            <TouchableOpacity style={styles.finishWorkoutButton} onPress={() => setStep(5)}>
              <Text style={styles.finishWorkoutButtonText}>BACK TO PLAN</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    const setCount = getSetCount(currentExercise.target);
    const setTarget = getSetTarget(currentExercise.target);
    const restSeconds = getRestSeconds(currentExercise);
    const isWork = timerPhase === "work";
    const isLastSet = currentSetIndex >= setCount - 1;
    const nextExercise = activeExercises[currentExerciseIndex + 1];
    const recoveryDestination = isLastSet
      ? nextExercise
        ? `Up next: ${nextExercise.name}`
        : "Workout complete"
      : `${currentExercise.name} • Set ${currentSetIndex + 2}`;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.timerWorkoutScreen}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.timerTopBar}>
            <TouchableOpacity
              onPress={() => {
                setTimerRunning(false);
                setActivePlanSessionId(null);
                setSessionExercises(null);
                setSessionTitle(null);
                setSessionLength(null);
                setStep(5);
              }}
            >
              <Text style={styles.workoutBack}>‹ End session</Text>
            </TouchableOpacity>

            <Text style={styles.timerProgressText}>
              {currentExerciseIndex + 1}/{activeExercises.length}
            </Text>
          </View>

          <Text style={styles.workoutScreenLabel}>
            {isWork ? "WORK" : "RECOVERY"}
          </Text>

          <Text style={styles.timerExerciseTitle}>
            {isWork ? currentExercise.name : "Take a short break"}
          </Text>

          <Text style={styles.timerSetLabel}>
            {isWork
              ? `Set ${currentSetIndex + 1} of ${setCount} • ${setTarget}`
              : recoveryDestination}
          </Text>

          <View
            style={[
              styles.timerCircle,
              !isWork && styles.timerCircleRest,
            ]}
          >
            <Text style={styles.timerTime}>{formatTimer(timeLeft)}</Text>
            <Text style={styles.timerCaption}>
              {timeLeft === 0
                ? isWork
                  ? "Need more time?"
                  : "Rest complete"
                : isWork
                ? "comfortable time window"
                : "rest"}
            </Text>
          </View>

          {isWork ? (
            <>
              <View style={styles.timerTargetCard}>
                <Text style={styles.timerTargetLabel}>YOUR TARGET</Text>
                <Text style={styles.timerTargetValue}>{setTarget}</Text>
                <Text style={styles.timerTargetCue}>{currentExercise.cue}</Text>
              </View>

              <Text style={styles.timerSafetyText}>
                The timer is not a race. Use good form, pause when you need to,
                and stop if an exercise causes pain.
              </Text>

              <TouchableOpacity
                style={styles.timerPrimaryButton}
                onPress={completeTimedSet}
              >
                <Text style={styles.timerPrimaryButtonText}>DONE • NEXT</Text>
              </TouchableOpacity>

              <View style={styles.timerSecondaryRow}>
                <TouchableOpacity
                  style={styles.timerSecondaryButton}
                  onPress={() => setTimeLeft((current) => current + 30)}
                >
                  <Text style={styles.timerSecondaryButtonText}>+30 SEC</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timerSecondaryButton}
                  onPress={() => setTimerRunning((current) => !current)}
                >
                  <Text style={styles.timerSecondaryButtonText}>
                    {timerRunning ? "PAUSE" : "RESUME"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.restInfoCard}>
                <Text style={styles.restInfoTitle}>
                  {restSeconds} sec recovery
                </Text>
                <Text style={styles.restInfoText}>
                  Breathe, get comfortable, and get ready for the next set.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.timerPrimaryButton}
                onPress={skipRest}
              >
                <Text style={styles.timerPrimaryButtonText}>START NEXT NOW</Text>
              </TouchableOpacity>

              <View style={styles.timerSecondaryRow}>
                <TouchableOpacity
                  style={styles.timerSecondaryButton}
                  onPress={() => setTimeLeft((current) => current + 30)}
                >
                  <Text style={styles.timerSecondaryButtonText}>+30 SEC REST</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timerSecondaryButton}
                  onPress={() => setTimerRunning((current) => !current)}
                >
                  <Text style={styles.timerSecondaryButtonText}>
                    {timerRunning ? "PAUSE" : "RESUME"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.upNextCard}>
            <Text style={styles.upNextLabel}>UP NEXT</Text>
            <Text style={styles.upNextText}>
              {currentSetIndex < setCount - 1
                ? `${currentExercise.name} • Set ${currentSetIndex + 2}`
                : activeExercises[currentExerciseIndex + 1]?.name ??
                  "Workout complete"}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 12 && lastWorkoutSummary) {
    const weeklyTarget = trainingDays ?? 0;
    const weeklyRemaining = Math.max(weeklyTarget - completedWorkouts, 0);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.completeScreen}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.completeCheck}>
            <Text style={styles.completeCheckText}>✓</Text>
          </View>

          <Text style={styles.workoutScreenLabel}>SESSION COMPLETE</Text>
          <Text style={styles.completeTitle}>Nice work showing up.</Text>
          <Text style={styles.completeSubtitle}>
            Your workout is saved. Recovery is part of the plan too, so there is
            no need to add extra work just to do more.
          </Text>

          <View style={styles.completeWorkoutCard}>
            <Text style={styles.completeWorkoutLabel}>COMPLETED WORKOUT</Text>
            <Text style={styles.completeWorkoutTitle}>
              {lastWorkoutSummary.title}
            </Text>

            <View style={styles.completeStatsRow}>
              <View style={styles.completeStat}>
                <Text style={styles.completeStatValue}>
                  {lastWorkoutSummary.exercises}
                </Text>
                <Text style={styles.completeStatLabel}>Exercises</Text>
              </View>

              <View style={styles.completeStat}>
                <Text style={styles.completeStatValue}>
                  {lastWorkoutSummary.plannedDuration}
                </Text>
                <Text style={styles.completeStatLabel}>Planned time</Text>
              </View>

              <View style={styles.completeStat}>
                <Text style={styles.completeStatValue}>
                  {completedWorkouts}/{trainingDays ?? "-"}
                </Text>
                <Text style={styles.completeStatLabel}>This week</Text>
              </View>
            </View>
          </View>

          <View style={styles.completeRecoveryCard}>
            <Text style={styles.completeRecoveryTitle}>
              {weeklyRemaining === 0
                ? "Weekly plan complete"
                : `${weeklyRemaining} planned session${weeklyRemaining === 1 ? "" : "s"} remaining`}
            </Text>
            <Text style={styles.completeRecoveryText}>
              Eat normally, hydrate, sleep, and give your body time to recover
              before your next session.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.timerPrimaryButton}
            onPress={() => setStep(5)}
          >
            <Text style={styles.timerPrimaryButtonText}>BACK TO HOME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.completeSecondaryButton}
            onPress={() => setStep(8)}
          >
            <Text style={styles.completeSecondaryButtonText}>VIEW PROGRESS</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 7) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.mealsScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(5)}>
            <Text style={styles.workoutBack}>‹ Back home</Text>
          </TouchableOpacity>

          <Text style={styles.workoutScreenLabel}>Z MEALS</Text>
          <Text style={styles.mealsTitle}>Workout meals made easy</Text>
          <Text style={styles.mealsSubtitle}>
            Search by food, ingredient, or meal type. Open any meal to see the
            complete ingredients and cooking instructions.
          </Text>

          <View style={styles.mealPlanCard}>
            <View style={styles.mealPlanTopRow}>
              <View style={styles.mealPlanTextWrap}>
                <Text style={styles.mealPlanLabel}>YOUR Z PLAN</Text>
                <Text style={styles.mealPlanTitle}>{mealGoalLabel}</Text>
                <Text style={styles.mealPlanText}>
                  Recipes that match your workout goal appear first.
                </Text>
              </View>
              <Text style={styles.mealPlanEmoji}>⚡</Text>
            </View>

            <View style={styles.mealModeRow}>
              <TouchableOpacity
                style={[
                  styles.mealModeButton,
                  recommendedMealsOnly && styles.mealModeButtonActive,
                ]}
                onPress={() => setRecommendedMealsOnly(true)}
              >
                <Text
                  style={[
                    styles.mealModeText,
                    recommendedMealsOnly && styles.mealModeTextActive,
                  ]}
                >
                  FOR MY PLAN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mealModeButton,
                  !recommendedMealsOnly && styles.mealModeButtonActive,
                ]}
                onPress={() => setRecommendedMealsOnly(false)}
              >
                <Text
                  style={[
                    styles.mealModeText,
                    !recommendedMealsOnly && styles.mealModeTextActive,
                  ]}
                >
                  ALL MEALS
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            value={mealSearch}
            onChangeText={setMealSearch}
            placeholder="Search chicken, rice, pasta, banana..."
            placeholderTextColor="#5D5D5D"
            style={styles.mealSearch}
          />

          <Text style={styles.mealFilterLabel}>WHEN DO YOU WANT IT?</Text>
          <View style={styles.mealTimingRow}>
            {(["Anytime", "Before Workout", "After Workout"] as MealTiming[]).map(
              (timing) => (
                <TouchableOpacity
                  key={timing}
                  style={[
                    styles.mealTimingButton,
                    mealTiming === timing && styles.mealTimingButtonActive,
                  ]}
                  onPress={() => setMealTiming(timing)}
                >
                  <Text
                    style={[
                      styles.mealTimingText,
                      mealTiming === timing && styles.mealTimingTextActive,
                    ]}
                  >
                    {timing}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <Text style={styles.mealFilterLabel}>MEAL TYPE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mealCategoryRow}
          >
            {(
              [
                "All",
                "Breakfast",
                "Lunch",
                "Dinner",
                "Snack",
                "Vegetarian",
                "Quick",
              ] as MealCategory[]
            ).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.mealCategoryChip,
                  mealCategory === category && styles.mealCategoryChipActive,
                ]}
                onPress={() => setMealCategory(category)}
              >
                <Text
                  style={[
                    styles.mealCategoryText,
                    mealCategory === category && styles.mealCategoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.mealResultsText}>
            {filteredMeals.length} recipe{filteredMeals.length === 1 ? "" : "s"}
          </Text>

          {filteredMeals.length === 0 ? (
            <View style={styles.mealEmptyCard}>
              <Text style={styles.mealEmptyTitle}>No matches yet</Text>
              <Text style={styles.mealEmptyText}>
                Try another ingredient, choose Anytime, or switch to All Meals.
              </Text>
            </View>
          ) : (
            filteredMeals.map((meal) => {
              const expanded = expandedMeal === meal.title;
              const isRecommended = !!goal && meal.workoutGoals.includes(goal);

              return (
                <TouchableOpacity
                  key={meal.title}
                  activeOpacity={0.86}
                  style={[
                    styles.mealCard,
                    expanded && styles.mealCardExpanded,
                  ]}
                  onPress={() => setExpandedMeal(expanded ? null : meal.title)}
                >
                  <View style={styles.mealCardHeader}>
                    <View style={styles.mealEmojiBox}>
                      <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                    </View>

                    <View style={styles.mealCardTitleWrap}>
                      <Text style={styles.mealCardTitle}>{meal.title}</Text>
                      <Text style={styles.mealMeta}>
                        {meal.prepTime} prep • {meal.cookTime} cook • {meal.servings}
                      </Text>
                    </View>

                    <Text style={styles.mealExpandIcon}>
                      {expanded ? "−" : "+"}
                    </Text>
                  </View>

                  {isRecommended && (
                    <View style={styles.mealRecommendedBadge}>
                      <Text style={styles.mealRecommendedText}>
                        ✓ Fits your {mealGoalLabel} plan
                      </Text>
                    </View>
                  )}

                  <Text style={styles.mealSummary}>{meal.summary}</Text>

                  <View style={styles.mealTagRow}>
                    {meal.timing.map((timing) => (
                      <View key={timing} style={styles.mealTag}>
                        <Text style={styles.mealTagText}>{timing}</Text>
                      </View>
                    ))}
                    {meal.categories.slice(0, 2).map((category) => (
                      <View key={category} style={styles.mealTag}>
                        <Text style={styles.mealTagText}>{category}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.mealTapHint}>
                    {expanded ? "Tap to close recipe" : "Tap for full recipe"}
                  </Text>

                  {expanded && (
                    <View style={styles.mealFullRecipe}>
                      <Text style={styles.mealSectionLabel}>INGREDIENTS</Text>
                      {meal.ingredients.map((ingredient, index) => (
                        <View
                          key={`${meal.title}-ingredient-${index}`}
                          style={styles.mealIngredientRow}
                        >
                          <Text style={styles.mealIngredientBullet}>•</Text>
                          <Text style={styles.mealIngredientText}>
                            {ingredient}
                          </Text>
                        </View>
                      ))}

                      <Text style={styles.mealSectionLabel}>
                        STEP-BY-STEP PREPARATION
                      </Text>
                      {meal.steps.map((item, index) => (
                        <View
                          key={`${meal.title}-step-${index}`}
                          style={styles.mealStepRow}
                        >
                          <View style={styles.mealStepNumber}>
                            <Text style={styles.mealStepNumberText}>
                              {index + 1}
                            </Text>
                          </View>
                          <Text style={styles.mealStepText}>{item}</Text>
                        </View>
                      ))}

                      <Text style={styles.mealSectionLabel}>HELPFUL TIPS</Text>
                      {meal.tips.map((tip, index) => (
                        <View
                          key={`${meal.title}-tip-${index}`}
                          style={styles.mealTipRow}
                        >
                          <Text style={styles.mealTipIcon}>✓</Text>
                          <Text style={styles.mealTipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          <View style={styles.mealNote}>
            <Text style={styles.mealNoteTitle}>Balanced, not restrictive</Text>
            <Text style={styles.mealNoteText}>
              Z Meals helps you find practical food for training, recovery, and
              everyday energy. It does not require skipping meals or chasing a
              specific body shape.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 8) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.progressScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(5)}>
            <Text style={styles.workoutBack}>‹ Back home</Text>
          </TouchableOpacity>

          <Text style={styles.workoutScreenLabel}>Z PROGRESS</Text>
          <Text style={styles.progressScreenTitle}>Your training dashboard</Text>
          <Text style={styles.progressScreenSubtitle}>
            See the sessions you have completed, how your current week is going,
            and your recent activity without turning training into a competition.
          </Text>

          <View style={styles.progressFocusCard}>
            <View style={styles.progressFocusTop}>
              <View style={styles.progressFocusTextWrap}>
                <Text style={styles.progressFocusLabel}>CURRENT FOCUS</Text>
                <Text style={styles.progressFocusTitle}>{mealGoalLabel}</Text>
                <Text style={styles.progressFocusMeta}>
                  {trainingDays ?? "-"} sessions/week • {workoutLength ?? "-"} •{" "}
                  {workoutPlace === "gym" ? "Gym" : "Home"}
                </Text>
              </View>
              <Text style={styles.progressFocusEmoji}>⚡</Text>
            </View>

            <TouchableOpacity
              style={styles.progressFocusButton}
              onPress={() => setStep(13)}
            >
              <Text style={styles.progressFocusButtonText}>
                VIEW WEEKLY PLAN
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressStatGrid}>
            <View style={styles.progressStatCard}>
              <Text style={styles.progressStatValue}>{workoutHistory.length}</Text>
              <Text style={styles.progressStatLabel}>Total sessions</Text>
            </View>

            <View style={styles.progressStatCard}>
              <Text style={styles.progressStatValue}>
                {completedWorkouts}/{trainingDays ?? "-"}
              </Text>
              <Text style={styles.progressStatLabel}>This week</Text>
            </View>

            <View style={styles.progressStatCard}>
              <Text style={styles.progressStatValue}>{activeWeeks}</Text>
              <Text style={styles.progressStatLabel}>Active weeks</Text>
            </View>

            <View style={styles.progressStatCard}>
              <Text style={styles.progressStatValue}>{workoutLength ?? "-"}</Text>
              <Text style={styles.progressStatLabel}>Planned session</Text>
            </View>
          </View>

          <View style={styles.progressGoalCard}>
            <View style={styles.progressGoalHeader}>
              <View>
                <Text style={styles.progressGoalLabel}>THIS WEEK</Text>
                <Text style={styles.progressGoalValue}>
                  {weeklyProgressPercent}% of plan completed
                </Text>
              </View>
              <Text style={styles.progressGoalCount}>
                {completedWorkouts}/{trainingDays ?? "-"}
              </Text>
            </View>

            <View style={styles.progressScreenBarBackground}>
              <View
                style={[
                  styles.progressScreenBarFill,
                  { width: `${weeklyProgressPercent}%` },
                ]}
              />
            </View>

            <View style={styles.progressWeekSchedule}>
              {WEEKDAYS.map((day) => {
                const session =
                  weeklySessions.find((item) => item.day === day) ?? null;
                const completed =
                  !!session && completedPlanSessionIds.includes(session.id);
                const isToday = day === todayWeekday;

                return (
                  <View
                    key={day}
                    style={[
                      styles.progressWeekDay,
                      session && styles.progressWeekDayPlanned,
                      completed && styles.progressWeekDayCompleted,
                      isToday && styles.progressWeekDayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.progressWeekDayLabel,
                        session && styles.progressWeekDayLabelPlanned,
                        completed && styles.progressWeekDayLabelCompleted,
                      ]}
                    >
                      {day}
                    </Text>
                    <Text style={styles.progressWeekDayMark}>
                      {completed ? "✓" : session ? "•" : "—"}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.progressGoalNote}>
              Planned recovery days are part of the week too.
            </Text>
          </View>

          <Text style={styles.progressSectionTitle}>Last 4 weeks</Text>

          <View style={styles.progressTrendCard}>
            {progressWeeks.map((week) => {
              const width =
                week.count === 0
                  ? 0
                  : Math.max(
                      12,
                      Math.round((week.count / maxProgressWeekCount) * 100)
                    );

              return (
                <View key={week.key} style={styles.progressTrendRow}>
                  <Text style={styles.progressTrendLabel}>{week.label}</Text>

                  <View style={styles.progressTrendTrack}>
                    <View
                      style={[
                        styles.progressTrendFill,
                        { width: `${width}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.progressTrendValue}>{week.count}</Text>
                </View>
              );
            })}

            <Text style={styles.progressTrendNote}>
              This view shows completed sessions, not a target you need to beat.
            </Text>
          </View>

          <Text style={styles.progressSectionTitle}>Recent activity</Text>

          {workoutHistory.length === 0 ? (
            <View style={styles.progressEmptyCard}>
              <Text style={styles.progressEmptyTitle}>
                No completed sessions yet
              </Text>
              <Text style={styles.progressEmptyText}>
                Finish a guided workout and it will appear here.
              </Text>
            </View>
          ) : (
            workoutHistory.slice(0, 10).map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyIcon}>
                  <Text style={styles.historyIconText}>✓</Text>
                </View>

                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyMeta}>
                    {new Date(item.completedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year:
                        new Date(item.completedAt).getFullYear() !==
                        new Date().getFullYear()
                          ? "numeric"
                          : undefined,
                    })}{" "}
                    • {item.exercises} exercises • {item.plannedDuration}
                  </Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.progressMindsetCard}>
            <Text style={styles.progressMindsetTitle}>
              Progress includes recovery
            </Text>
            <Text style={styles.progressMindsetText}>
              Training regularly matters, but rest, sleep, food, and easier days
              are part of a healthy routine too.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 9) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.libraryScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(5)}>
            <Text style={styles.workoutBack}>‹ Back home</Text>
          </TouchableOpacity>

          <Text style={styles.workoutScreenLabel}>EXERCISE LIBRARY</Text>
          <Text style={styles.libraryTitle}>Learn the movements</Text>
          <Text style={styles.librarySubtitle}>
            Browse exercises by body area or equipment. Z Workout still chooses
            the actual sets, reps, and recovery when it builds a session.
          </Text>

          <View style={styles.libraryModeRow}>
            <TouchableOpacity
              style={[
                styles.libraryModeButton,
                !showFavoriteExercises && styles.libraryModeButtonActive,
              ]}
              onPress={() => setShowFavoriteExercises(false)}
            >
              <Text
                style={[
                  styles.libraryModeText,
                  !showFavoriteExercises && styles.libraryModeTextActive,
                ]}
              >
                ALL EXERCISES
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.libraryModeButton,
                showFavoriteExercises && styles.libraryModeButtonActive,
              ]}
              onPress={() => setShowFavoriteExercises(true)}
            >
              <Text
                style={[
                  styles.libraryModeText,
                  showFavoriteExercises && styles.libraryModeTextActive,
                ]}
              >
                SAVED ({favoriteExercises.length})
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={exerciseSearch}
            onChangeText={setExerciseSearch}
            placeholder="Search push-ups, legs, dumbbells..."
            placeholderTextColor="#5D5D5D"
            style={styles.librarySearch}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.libraryCategoryRow}
          >
            {(
              [
                "All",
                "Upper Body",
                "Lower Body",
                "Core",
                "Mobility",
                "Gym",
              ] as ExerciseCategory[]
            ).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.libraryCategoryChip,
                  exerciseCategory === category &&
                    styles.libraryCategoryChipActive,
                ]}
                onPress={() => setExerciseCategory(category)}
              >
                <Text
                  style={[
                    styles.libraryCategoryText,
                    exerciseCategory === category &&
                      styles.libraryCategoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.libraryResultCount}>
            {filteredExercises.length} exercise
            {filteredExercises.length === 1 ? "" : "s"}
          </Text>

          {filteredExercises.length === 0 ? (
            <View style={styles.libraryEmptyCard}>
              <Text style={styles.libraryEmptyTitle}>No exercises found</Text>
              <Text style={styles.libraryEmptyText}>
                Try another search or choose All.
              </Text>
            </View>
          ) : (
            filteredExercises.map((exercise) => {
              const expanded = expandedExercise === exercise.name;

              return (
                <TouchableOpacity
                  key={exercise.name}
                  activeOpacity={0.85}
                  style={[
                    styles.libraryCard,
                    expanded && styles.libraryCardExpanded,
                  ]}
                  onPress={() =>
                    setExpandedExercise(expanded ? null : exercise.name)
                  }
                >
                  <View style={styles.libraryCardHeader}>
                    <View style={styles.libraryEmojiBox}>
                      <Text style={styles.libraryEmoji}>{exercise.emoji}</Text>
                    </View>

                    <View style={styles.libraryCardTitleWrap}>
                      <Text style={styles.libraryCardTitle}>{exercise.name}</Text>
                      <Text style={styles.libraryCardMeta}>
                        {exercise.category} • {exercise.equipment}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.librarySaveButton}
                      onPress={() => toggleFavoriteExercise(exercise.name)}
                    >
                      <Text
                        style={[
                          styles.librarySaveIcon,
                          favoriteExercises.includes(exercise.name) &&
                            styles.librarySaveIconActive,
                        ]}
                      >
                        {favoriteExercises.includes(exercise.name) ? "★" : "☆"}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.libraryExpandIcon}>
                      {expanded ? "−" : "+"}
                    </Text>
                  </View>

                  <View style={styles.libraryFocusRow}>
                    <Text style={styles.libraryFocusLabel}>FOCUS</Text>
                    <Text style={styles.libraryFocusText}>{exercise.focus}</Text>
                  </View>

                  {expanded && (
                    <View style={styles.libraryDetails}>
                      <Text style={styles.libraryDetailLabel}>FORM CUE</Text>
                      <Text style={styles.libraryDetailText}>{exercise.cue}</Text>

                      <Text style={styles.libraryDetailLabel}>EASIER OPTION</Text>
                      <Text style={styles.libraryDetailText}>
                        {exercise.easierOption}
                      </Text>

                      <View style={styles.librarySafetyBox}>
                        <Text style={styles.librarySafetyText}>
                          Use a comfortable range, move with control, and stop if
                          the exercise causes pain.
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.libraryGuideButton}
                        onPress={() => openExerciseGuide(exercise)}
                      >
                        <Text style={styles.libraryGuideButtonText}>
                          OPEN EXERCISE GUIDE
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          <View style={styles.libraryFooterNote}>
            <Text style={styles.libraryFooterTitle}>Use the library to learn</Text>
            <Text style={styles.libraryFooterText}>
              Your guided workout handles the timing and progression so you do
              not have to build the session manually.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }


  if (step === 16 && selectedLibraryExercise) {
    const saved = favoriteExercises.includes(selectedLibraryExercise.name);
    const appearsInPlan = weeklySessions.some((session) =>
      session.exercises.some(
        (exercise) => exercise.name === selectedLibraryExercise.name
      )
    );

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.exerciseGuideScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(9)}>
            <Text style={styles.workoutBack}>‹ Back to exercises</Text>
          </TouchableOpacity>

          <View style={styles.exerciseGuideHero}>
            <View style={styles.exerciseGuideEmojiBox}>
              <Text style={styles.exerciseGuideEmoji}>
                {selectedLibraryExercise.emoji}
              </Text>
            </View>

            <View style={styles.exerciseGuideHeroText}>
              <Text style={styles.exerciseGuideCategory}>
                {selectedLibraryExercise.category}
              </Text>
              <Text style={styles.exerciseGuideTitle}>
                {selectedLibraryExercise.name}
              </Text>
              <Text style={styles.exerciseGuideEquipment}>
                {selectedLibraryExercise.equipment}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.exerciseGuideSaveButton,
              saved && styles.exerciseGuideSaveButtonActive,
            ]}
            onPress={() => toggleFavoriteExercise(selectedLibraryExercise.name)}
          >
            <Text
              style={[
                styles.exerciseGuideSaveText,
                saved && styles.exerciseGuideSaveTextActive,
              ]}
            >
              {saved ? "★ SAVED" : "☆ SAVE EXERCISE"}
            </Text>
          </TouchableOpacity>

          {appearsInPlan && (
            <View style={styles.exerciseGuidePlanBadge}>
              <Text style={styles.exerciseGuidePlanBadgeText}>
                ✓ THIS EXERCISE IS IN YOUR CURRENT PLAN
              </Text>
            </View>
          )}

          <View style={styles.exerciseGuideInfoCard}>
            <Text style={styles.exerciseGuideInfoLabel}>FOCUS</Text>
            <Text style={styles.exerciseGuideInfoTitle}>
              {selectedLibraryExercise.focus}
            </Text>
          </View>

          <Text style={styles.exerciseGuideSectionTitle}>How to approach it</Text>
          <View style={styles.exerciseGuideStepCard}>
            <Text style={styles.exerciseGuideStepNumber}>1</Text>
            <View style={styles.exerciseGuideStepContent}>
              <Text style={styles.exerciseGuideStepTitle}>Set up comfortably</Text>
              <Text style={styles.exerciseGuideStepText}>
                Make sure the equipment and starting position feel stable before
                you begin.
              </Text>
            </View>
          </View>

          <View style={styles.exerciseGuideStepCard}>
            <Text style={styles.exerciseGuideStepNumber}>2</Text>
            <View style={styles.exerciseGuideStepContent}>
              <Text style={styles.exerciseGuideStepTitle}>Use this form cue</Text>
              <Text style={styles.exerciseGuideStepText}>
                {selectedLibraryExercise.cue}
              </Text>
            </View>
          </View>

          <View style={styles.exerciseGuideStepCard}>
            <Text style={styles.exerciseGuideStepNumber}>3</Text>
            <View style={styles.exerciseGuideStepContent}>
              <Text style={styles.exerciseGuideStepTitle}>Make it easier</Text>
              <Text style={styles.exerciseGuideStepText}>
                {selectedLibraryExercise.easierOption}
              </Text>
            </View>
          </View>

          <View style={styles.exerciseGuideSafetyCard}>
            <Text style={styles.exerciseGuideSafetyTitle}>Comfort first</Text>
            <Text style={styles.exerciseGuideSafetyText}>
              Move with control, take breaks when you need them, and stop the
              exercise if it causes pain. The goal is good movement, not rushing.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.exerciseGuidePlanButton}
            onPress={() => setStep(13)}
          >
            <Text style={styles.exerciseGuidePlanButtonText}>
              VIEW MY WORKOUT PLAN
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }


  if (step === 10) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.coachScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(5)}>
            <Text style={styles.workoutBack}>‹ Back home</Text>
          </TouchableOpacity>

          <Text style={styles.workoutScreenLabel}>Z COACH ✦</Text>
          <Text style={styles.coachScreenTitle}>Adapt today's workout</Text>
          <Text style={styles.coachScreenSubtitle}>
            Tell Z Coach what today looks like. It will adjust the session
            without changing your main plan.
          </Text>

          <Text style={styles.coachQuestion}>How much time do you have?</Text>
          <View style={styles.coachChoiceGrid}>
            {["15 min", "30 min", "45 min", "60+ min"].map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.coachChoiceButton,
                  coachTime === time && styles.coachChoiceButtonActive,
                ]}
                onPress={() => setCoachTime(time)}
              >
                <Text
                  style={[
                    styles.coachChoiceText,
                    coachTime === time && styles.coachChoiceTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.coachQuestion}>What do you want to train?</Text>
          <View style={styles.coachFocusGrid}>
            {(
              [
                "Today's Plan",
                "Chest",
                "Core",
                "Legs",
                "Back & Arms",
                "Mobility",
              ] as CoachFocus[]
            ).map((focus) => (
              <TouchableOpacity
                key={focus}
                style={[
                  styles.coachFocusChip,
                  coachFocus === focus && styles.coachFocusChipActive,
                ]}
                onPress={() => setCoachFocus(focus)}
              >
                <Text
                  style={[
                    styles.coachFocusText,
                    coachFocus === focus && styles.coachFocusTextActive,
                  ]}
                >
                  {focus}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.coachQuestion}>What equipment is available now?</Text>
          <View style={styles.coachStack}>
            {(["Use My Plan", "No Equipment Today"] as CoachEquipmentMode[]).map(
              (mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.coachWideChoice,
                    coachEquipmentMode === mode && styles.coachWideChoiceActive,
                  ]}
                  onPress={() => setCoachEquipmentMode(mode)}
                >
                  <Text
                    style={[
                      styles.coachWideChoiceTitle,
                      coachEquipmentMode === mode &&
                        styles.coachWideChoiceTitleActive,
                    ]}
                  >
                    {mode}
                  </Text>
                  <Text style={styles.coachWideChoiceSub}>
                    {mode === "Use My Plan"
                      ? equipment.includes("No Equipment")
                        ? "Your plan is already bodyweight-based."
                        : equipment.join(", ")
                      : "Z Coach will build a bodyweight session for today."}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <Text style={styles.coachQuestion}>How are you feeling today?</Text>
          <View style={styles.coachStack}>
            {(["Ready", "Low Energy", "Recovery"] as CoachEnergy[]).map(
              (energy) => (
                <TouchableOpacity
                  key={energy}
                  style={[
                    styles.coachWideChoice,
                    coachEnergy === energy && styles.coachWideChoiceActive,
                  ]}
                  onPress={() => setCoachEnergy(energy)}
                >
                  <Text
                    style={[
                      styles.coachWideChoiceTitle,
                      coachEnergy === energy && styles.coachWideChoiceTitleActive,
                    ]}
                  >
                    {energy}
                  </Text>
                  <Text style={styles.coachWideChoiceSub}>
                    {energy === "Ready"
                      ? "Use the normal session structure."
                      : energy === "Low Energy"
                      ? "Keep the session shorter and more comfortable."
                      : "Switch today to gentle mobility and recovery."}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <View style={styles.coachRecommendation}>
            <Text style={styles.coachRecommendationLabel}>TODAY'S ADJUSTMENT</Text>
            <Text style={styles.coachRecommendationTitle}>
              {coachEnergy === "Recovery"
                ? "Recovery & Mobility"
                : coachFocus === "Today's Plan"
                ? coachEnergy === "Low Energy"
                  ? "Today's Plan, Lighter"
                  : "Today's Plan, Adapted"
                : coachFocus}
            </Text>
            <Text style={styles.coachRecommendationText}>{coachSummary}</Text>

            <View style={styles.coachPreviewDivider} />

            <Text style={styles.coachPreviewLabel}>SESSION PREVIEW</Text>
            {coachPreviewExercises.map((exercise, index) => (
              <View
                key={`coach-preview-${exercise.name}-${index}`}
                style={styles.coachPreviewRow}
              >
                <View style={styles.coachPreviewNumber}>
                  <Text style={styles.coachPreviewNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.coachPreviewContent}>
                  <Text style={styles.coachPreviewName}>{exercise.name}</Text>
                  <Text style={styles.coachPreviewMeta}>
                    {exercise.target} • {exercise.focus}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.timerPrimaryButton}
            onPress={startCoachWorkout}
          >
            <Text style={styles.timerPrimaryButtonText}>
              START COACH SESSION
            </Text>
          </TouchableOpacity>

          <Text style={styles.coachSafetyText}>
            Z Coach keeps the timer flexible. Good form and recovery matter more
            than rushing to finish.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }


  if (step === 11) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.profileScreen}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setStep(5)}>
            <Text style={styles.workoutBack}>‹ Back home</Text>
          </TouchableOpacity>

          <Text style={styles.workoutScreenLabel}>PROFILE</Text>
          <Text style={styles.profileTitle}>Your Z profile</Text>
          <Text style={styles.profileSubtitle}>
            Manage your account and keep your workout plan connected to your Z
            profile.
          </Text>

          {!supabaseConfigured ? (
            <View style={styles.profileSetupCard}>
              <Text style={styles.profileSetupTitle}>Cloud setup needed</Text>
              <Text style={styles.profileSetupText}>
                The account screen is ready, but this project still needs its
                Supabase URL and publishable key before sign-in can work.
              </Text>
              <Text style={styles.profileSetupText}>
                Until then, Z Workout continues saving everything locally.
              </Text>
            </View>
          ) : sessionUserId ? (
            <>
              <View style={styles.profileAccountCard}>
                <View style={styles.profileAvatarLarge}>
                  <Text style={styles.profileAvatarLetter}>
                    {(sessionEmail[0] ?? "Z").toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.profileEmail}>{sessionEmail}</Text>
                <Text style={styles.profileCloudNote}>
                  Your workout plan, progress, history, and meal preferences are
                  connected to this account.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.profilePrimaryButton}
                onPress={openEditPlan}
              >
                <Text style={styles.profilePrimaryButtonText}>EDIT WORKOUT PLAN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileSecondaryButton}
                onPress={signOut}
                disabled={authLoading}
              >
                <Text style={styles.profileSecondaryButtonText}>
                  {authLoading ? "PLEASE WAIT..." : "SIGN OUT"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.authToggle}>
                <TouchableOpacity
                  style={[
                    styles.authToggleButton,
                    authMode === "signin" && styles.authToggleButtonActive,
                  ]}
                  onPress={() => {
                    setAuthMode("signin");
                    setAuthMessage("");
                  }}
                >
                  <Text
                    style={[
                      styles.authToggleText,
                      authMode === "signin" && styles.authToggleTextActive,
                    ]}
                  >
                    SIGN IN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.authToggleButton,
                    authMode === "signup" && styles.authToggleButtonActive,
                  ]}
                  onPress={() => {
                    setAuthMode("signup");
                    setAuthMessage("");
                  }}
                >
                  <Text
                    style={[
                      styles.authToggleText,
                      authMode === "signup" && styles.authToggleTextActive,
                    ]}
                  >
                    CREATE ACCOUNT
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={authEmail}
                onChangeText={setAuthEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor="#5D5D5D"
                style={styles.authInput}
              />

              <TextInput
                value={authPassword}
                onChangeText={setAuthPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Password"
                placeholderTextColor="#5D5D5D"
                style={styles.authInput}
              />

              <TouchableOpacity
                style={styles.profilePrimaryButton}
                onPress={submitAuth}
                disabled={authLoading}
              >
                <Text style={styles.profilePrimaryButtonText}>
                  {authLoading
                    ? "PLEASE WAIT..."
                    : authMode === "signin"
                    ? "SIGN IN"
                    : "CREATE ACCOUNT"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.profilePrivacyText}>
                Z Workout only needs an email for account access. Your workout
                plan can still be used without creating an account.
              </Text>
            </>
          )}

          {!!authMessage && (
            <View style={styles.authMessageCard}>
              <Text style={styles.authMessageText}>{authMessage}</Text>
            </View>
          )}
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
          <View style={styles.headerBrand}>
            <Image
              source={require("./assets/icon.png")}
              style={styles.headerBrandLogo}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.smallMuted}>YOUR Z PLAN</Text>
              <Text style={styles.dashboardTitle}>Ready to train?</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileCircle}
            onPress={() => setStep(11)}
          >
            <Text style={styles.profileLetter}>
              {sessionEmail ? sessionEmail[0].toUpperCase() : "Z"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.planSummary}>
          <Text style={styles.planSummaryLabel}>PERSONALIZED FOR YOU</Text>
          <Text style={styles.planSummaryText}>{planDescription}</Text>
        </View>

        <View style={styles.todayCard}>
          <View style={styles.todayTopRow}>
            <View style={styles.todayTextWrap}>
              <Text style={styles.todayLabel}>
                {todayPlanSession
                  ? todayPlanCompleted
                    ? `${todayWeekday} • COMPLETE`
                    : `${todayWeekday} • TODAY'S WORKOUT`
                  : `${todayWeekday} • FLEXIBLE DAY`}
              </Text>
              <Text style={styles.todayTitle}>
                {todayPlanSession
                  ? todayPlanCompleted
                    ? "Today's planned session is done"
                    : todayPlanSession.title
                  : "No planned session today"}
              </Text>
            </View>

            <Text style={styles.workoutEmoji}>⚡</Text>
          </View>

          <View style={styles.workoutDetails}>
            <Text style={styles.detailText}>⏱ {workoutLength}</Text>
            <Text style={styles.detailText}>•</Text>
            <Text style={styles.detailText}>
              {todayPlanSession
                ? todayPlanCompleted
                  ? nextPlanSession
                    ? `Next planned: ${nextPlanSession.day} • ${nextPlanSession.title}`
                    : "Your planned sessions are complete for this week"
                  : todayPlanSession.focus
                : nextPlanSession
                ? `Next planned: ${nextPlanSession.day} • ${nextPlanSession.title}`
                : "Rest and recovery are part of the plan"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() =>
              todayPlanSession && !todayPlanCompleted
                ? startPlanSession(todayPlanSession)
                : setStep(13)
            }
          >
            <Text style={styles.startButtonText}>
              {todayPlanSession && !todayPlanCompleted
                ? "START TODAY'S SESSION"
                : "VIEW WEEKLY PLAN"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewPlanButton}
            onPress={() => setStep(13)}
          >
            <Text style={styles.viewPlanButtonText}>VIEW WEEKLY PLAN</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>This Week</Text>

        <View style={styles.progressCard}>
          <View>
            <Text style={styles.progressNumber}>
              {completedWorkouts} / {trainingDays}
            </Text>
            <Text style={styles.progressLabel}>Workouts completed</Text>
          </View>

          <View style={styles.streakBox}>
            <Text style={styles.streakNumber}>
              {Math.max((trainingDays ?? 0) - completedWorkouts, 0)}
            </Text>
            <Text style={styles.streakLabel}>Sessions remaining</Text>
          </View>
        </View>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${trainingDays ? (completedWorkouts / trainingDays) * 100 : 0}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.sectionTitle}>Explore</Text>

        <View style={styles.grid}>
          <DashboardCard
            emoji="✦"
            title="Z Coach"
            subtitle="Adapt today's workout"
            onPress={() => setStep(10)}
          />

          <DashboardCard
            emoji="🥗"
            title="Meals"
            subtitle="Recipe ideas"
            onPress={() => setStep(7)}
          />

          <DashboardCard
            emoji="📈"
            title="Progress"
            subtitle="View your stats"
            onPress={() => setStep(8)}
          />

          <DashboardCard
            emoji="🏋️"
            title="Exercises"
            subtitle="Exercise library"
            onPress={() => setStep(9)}
          />
        </View>

        <View style={styles.coachCard}>
          <Text style={styles.coachTag}>Z COACH</Text>

          <Text style={styles.coachTitle}>Need a different workout today?</Text>

          <Text style={styles.coachDescription}>
            Tell Z Coach how much time you have and what equipment is available.
            Your plan can adapt without making you restart.
          </Text>

          <TouchableOpacity
            style={styles.coachButton}
            onPress={() => setStep(10)}
          >
            <Text style={styles.coachButtonText}>ASK Z COACH ✦</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <NavItem emoji="⌂" text="Home" active />
        <NavItem emoji="🏋️" text="Workout" onPress={() => setStep(13)} />
        <NavItem emoji="✦" text="Coach" onPress={() => setStep(10)} />
        <NavItem emoji="📈" text="Progress" onPress={() => setStep(8)} />
        <NavItem emoji="●" text="Profile" onPress={() => setStep(11)} />
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
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.dashboardCard} onPress={onPress}>
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
  onPress,
}: {
  emoji: string;
  text: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
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

  storageLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  storageLoadingTitle: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 2,
  },

  storageLoadingText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
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

  brandLogoLarge: {
    width: 112,
    height: 112,
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: 24,
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
    marginBottom: 18,
  },

  weekdayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  weekdayChoice: {
    minWidth: 46,
    height: 43,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },

  weekdayChoiceActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  weekdayChoiceText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  weekdayChoiceTextActive: {
    color: COLORS.background,
  },

  weekdayHint: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
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

  sessionDetailScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  sessionDetailHero: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 23,
    padding: 18,
    marginTop: 20,
  },

  sessionDetailHeroTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  sessionDetailIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  sessionDetailIconText: {
    fontSize: 29,
  },

  sessionDetailHeroText: {
    flex: 1,
  },

  sessionDetailDay: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sessionDetailTitle: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    marginTop: 4,
  },

  sessionDetailFocus: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 14,
  },

  sessionDetailMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  sessionDetailMetaCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 15,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  sessionDetailMetaValue: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  sessionDetailMetaLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
  },

  sessionDetailSectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 25,
  },

  sessionDetailSectionText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 12,
  },

  sessionExerciseCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    padding: 15,
    marginBottom: 10,
  },

  sessionExerciseNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sessionExerciseNumberText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
  },

  sessionExerciseContent: {
    flex: 1,
  },

  sessionExerciseName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  sessionExerciseTarget: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },

  sessionExerciseFocusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
  },

  sessionExerciseFocusLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  sessionExerciseFocusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
  },

  sessionExerciseCue: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  sessionDetailNote: {
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginTop: 5,
  },

  sessionDetailNoteTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  sessionDetailNoteText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 5,
  },

  sessionDetailStartButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  sessionDetailStartButtonCompleted: {
    backgroundColor: "#1A2410",
    borderWidth: 1,
    borderColor: "#365018",
  },

  sessionDetailStartButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  sessionDetailStartButtonTextCompleted: {
    color: COLORS.green,
  },

  editPlanScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  editPlanTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 7,
  },

  editPlanSubtitle: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 24,
  },

  editPlanSectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 12,
  },

  editPlanTwoColumn: {
    flexDirection: "row",
    gap: 10,
  },

  editPlanChoiceCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },

  editPlanChoiceCardActive: {
    borderColor: COLORS.green,
    backgroundColor: "#151A0D",
  },

  editPlanChoiceEmoji: {
    fontSize: 29,
    marginBottom: 8,
  },

  editPlanChoiceTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  editPlanChoiceTitleActive: {
    color: COLORS.green,
  },

  editGoalStack: {
    gap: 9,
  },

  editGoalCard: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  editGoalCardActive: {
    borderColor: COLORS.green,
    backgroundColor: "#151A0D",
  },

  editGoalEmoji: {
    width: 36,
    fontSize: 21,
  },

  editGoalText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  editGoalTextActive: {
    color: COLORS.green,
  },

  editGoalCheck: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: "900",
  },

  editPlanHint: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
  },

  editPlanSaveButton: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  editPlanSaveButtonText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.7,
  },

  editPlanCancelButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  editPlanCancelText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.6,
  },

  workoutPlanScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  workoutPlanTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 7,
  },

  workoutPlanSubtitle: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 20,
  },

  workoutPlanOverview: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 21,
    padding: 18,
  },

  workoutPlanOverviewText: {
    flex: 1,
  },

  workoutPlanOverviewLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  workoutPlanOverviewTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },

  workoutPlanOverviewMeta: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  workoutPlanOverviewEmoji: {
    fontSize: 28,
    marginLeft: 12,
  },

  editPlanButton: {
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  editPlanButtonText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  workoutPlanProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 17,
  },

  workoutPlanProgressText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  workoutPlanProgressPercent: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "900",
  },

  workoutPlanBar: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "#222222",
    marginTop: 9,
    marginBottom: 25,
    overflow: "hidden",
  },

  workoutPlanBarFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.green,
  },

  weekCalendar: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },

  weekCalendarDay: {
    flex: 1,
    minHeight: 76,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  weekCalendarDayPlanned: {
    borderColor: "#344716",
    backgroundColor: "#11170C",
  },

  weekCalendarDayCompleted: {
    borderColor: "#4C711D",
    backgroundColor: "#17200F",
  },

  weekCalendarDayToday: {
    borderWidth: 2,
    borderColor: COLORS.green,
  },

  weekCalendarLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
  },

  weekCalendarLabelPlanned: {
    color: COLORS.white,
  },

  weekCalendarLabelCompleted: {
    color: COLORS.green,
  },

  weekCalendarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3A3A3A",
    marginVertical: 7,
  },

  weekCalendarDotPlanned: {
    backgroundColor: COLORS.green,
  },

  weekCalendarDotCompleted: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.green,
  },

  weekCalendarStatus: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "800",
  },

  weekCalendarStatusPlanned: {
    color: COLORS.white,
  },

  weekCalendarStatusCompleted: {
    color: COLORS.green,
  },

  nextSessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 22,
  },

  nextSessionTextWrap: {
    flex: 1,
  },

  nextSessionLabel: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  nextSessionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },

  nextSessionMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  nextSessionArrow: {
    color: COLORS.green,
    fontSize: 28,
    fontWeight: "500",
    marginLeft: 10,
  },

  workoutPlanSectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 13,
  },

  workoutPlanCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 17,
    marginBottom: 13,
  },

  workoutPlanCardCompleted: {
    borderColor: "#365018",
    backgroundColor: "#0D130A",
  },

  workoutPlanCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  workoutPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  workoutPlanIconText: {
    fontSize: 24,
  },

  workoutPlanCardTitleWrap: {
    flex: 1,
  },

  workoutPlanDayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  workoutPlanDay: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  workoutPlanCompletedBadge: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  workoutPlanCardTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },

  workoutPlanCardMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  workoutPlanExercisePreview: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 15,
    padding: 13,
    marginTop: 14,
  },

  workoutPlanExerciseText: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 21,
  },

  workoutPlanMoreText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  workoutPlanActionRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
  },

  workoutPlanDetailsButton: {
    flex: 1,
    minHeight: 49,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  workoutPlanDetailsText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  workoutPlanStartButton: {
    minHeight: 49,
    borderRadius: 15,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },

  workoutPlanStartButtonHalf: {
    flex: 1.25,
    marginTop: 0,
  },

  workoutPlanStartButtonCompleted: {
    backgroundColor: "#1A2410",
    borderWidth: 1,
    borderColor: "#365018",
  },

  workoutPlanStartText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.6,
  },

  workoutPlanStartTextCompleted: {
    color: COLORS.green,
  },

  workoutPlanNote: {
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginTop: 3,
  },

  workoutPlanNoteTitle: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 15,
  },

  workoutPlanNoteText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 5,
  },

  timerWorkoutScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  timerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  timerProgressText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 13,
  },

  timerExerciseTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 7,
  },

  timerSetLabel: {
    color: COLORS.muted,
    fontSize: 15,
    marginTop: 8,
  },

  timerCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 8,
    borderColor: COLORS.green,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
    backgroundColor: "#0D100A",
  },

  timerCircleRest: {
    borderColor: "#FFFFFF",
    backgroundColor: COLORS.card,
  },

  timerTime: {
    color: COLORS.white,
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: 1,
  },

  timerCaption: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },

  timerTargetCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
  },

  timerTargetLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  timerTargetValue: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 6,
  },

  timerTargetCue: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 8,
  },

  timerSafetyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 15,
  },

  timerPrimaryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 22,
  },

  timerPrimaryButtonText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.8,
  },

  timerSecondaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 11,
  },

  timerSecondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  timerSecondaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },

  restInfoCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
  },

  restInfoTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },

  restInfoText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 6,
  },

  upNextCard: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 18,
  },

  upNextLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  upNextText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 5,
  },

  timerEmptyState: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  workoutScreen: {
    padding: 20,
    paddingTop: 34,
    paddingBottom: 60,
  },

  workoutBack: {
    color: COLORS.green,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 26,
  },

  workoutScreenLabel: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  workoutScreenTitle: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    marginTop: 7,
  },

  workoutScreenMeta: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
  },

  safetyNote: {
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  safetyNoteTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5,
  },

  safetyNoteText: {
    color: COLORS.muted,
    lineHeight: 20,
  },

  exerciseCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },

  exerciseCardDone: {
    borderColor: COLORS.green,
    backgroundColor: "#12180C",
  },

  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  exerciseNumber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  exerciseNumberText: {
    color: COLORS.green,
    fontWeight: "900",
  },

  exerciseTitleWrap: {
    flex: 1,
  },

  exerciseName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  exerciseFocus: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },

  exerciseStatus: {
    color: COLORS.green,
    fontSize: 24,
    fontWeight: "900",
  },

  exerciseTarget: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 16,
  },

  exerciseCue: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 7,
  },

  setList: {
    marginTop: 16,
    gap: 9,
  },

  setRow: {
    borderRadius: 15,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },

  setRowDone: {
    borderColor: COLORS.green,
    backgroundColor: "#151A0D",
  },

  setTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  setInfo: {
    flex: 1,
  },

  setLabel: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.7,
  },

  setLabelDone: {
    color: COLORS.green,
  },

  setTarget: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },

  setCheck: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  setCheckDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  setCheckText: {
    color: COLORS.muted,
    fontWeight: "900",
  },

  setCheckTextDone: {
    color: COLORS.background,
  },

  previousSetText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },

  logInputRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  logInputWrap: {
    flex: 1,
  },

  logInputLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  logInput: {
    backgroundColor: COLORS.background,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    fontWeight: "800",
  },

  previousWorkoutNote: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 18,
    padding: 15,
    marginBottom: 20,
  },

  previousWorkoutNoteTitle: {
    color: COLORS.green,
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 4,
  },

  previousWorkoutNoteText: {
    color: COLORS.muted,
    lineHeight: 19,
    fontSize: 13,
  },

  finishWorkoutButton: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 10,
  },

  finishWorkoutButtonText: {
    color: COLORS.background,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  finishHint: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },

  mealsScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  mealsTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 7,
  },

  mealsSubtitle: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 18,
  },

  mealPlanCard: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 20,
    padding: 17,
    marginBottom: 16,
  },

  mealPlanTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  mealPlanTextWrap: {
    flex: 1,
  },

  mealPlanLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  mealPlanTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },

  mealPlanText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  mealPlanEmoji: {
    fontSize: 26,
    marginLeft: 12,
  },

  mealModeRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },

  mealModeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  mealModeButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  mealModeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  mealModeTextActive: {
    color: COLORS.background,
  },

  mealSearch: {
    backgroundColor: COLORS.card,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },

  mealFilterLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 9,
  },

  mealTimingRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 17,
  },

  mealTimingButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  mealTimingButtonActive: {
    borderColor: COLORS.green,
    backgroundColor: "#151A0D",
  },

  mealTimingText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },

  mealTimingTextActive: {
    color: COLORS.green,
  },

  mealCategoryRow: {
    gap: 9,
    paddingBottom: 13,
  },

  mealCategoryChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  mealCategoryChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  mealCategoryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  mealCategoryTextActive: {
    color: COLORS.background,
  },

  mealResultsText: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 11,
  },

  mealCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 17,
    marginBottom: 13,
  },

  mealCardExpanded: {
    borderColor: "#3A4F15",
    backgroundColor: "#10140C",
  },

  mealCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  mealEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  mealEmoji: {
    fontSize: 27,
  },

  mealCardTitleWrap: {
    flex: 1,
  },

  mealCardTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  mealMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  mealExpandIcon: {
    color: COLORS.green,
    fontSize: 25,
    fontWeight: "700",
    marginLeft: 10,
  },

  mealRecommendedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#17200C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 13,
  },

  mealRecommendedText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
  },

  mealSummary: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 12,
  },

  mealTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },

  mealTag: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  mealTagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
  },

  mealTapHint: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 13,
  },

  mealFullRecipe: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 15,
    paddingTop: 12,
  },

  mealSectionLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 9,
  },

  mealIngredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 7,
  },

  mealIngredientBullet: {
    color: COLORS.green,
    width: 18,
    fontWeight: "900",
  },

  mealIngredientText: {
    flex: 1,
    color: COLORS.white,
    lineHeight: 20,
  },

  mealStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 11,
  },

  mealStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  mealStepNumberText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 12,
  },

  mealStepText: {
    flex: 1,
    color: COLORS.muted,
    lineHeight: 20,
    paddingTop: 2,
  },

  mealTipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  mealTipIcon: {
    color: COLORS.green,
    fontWeight: "900",
    width: 22,
  },

  mealTipText: {
    flex: 1,
    color: COLORS.muted,
    lineHeight: 19,
  },

  mealEmptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },

  mealEmptyTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  mealEmptyText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
  },

  mealNote: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 18,
    padding: 16,
    marginTop: 5,
  },

  mealNoteTitle: {
    color: COLORS.green,
    fontWeight: "900",
    marginBottom: 5,
  },

  mealNoteText: {
    color: COLORS.muted,
    lineHeight: 20,
  },

  progressScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  progressScreenTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 7,
  },

  progressScreenSubtitle: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 22,
  },

  progressFocusCard: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },

  progressFocusTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  progressFocusTextWrap: {
    flex: 1,
  },

  progressFocusLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  progressFocusTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
  },

  progressFocusMeta: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  progressFocusEmoji: {
    fontSize: 28,
    marginLeft: 12,
  },

  progressFocusButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#385015",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },

  progressFocusButtonText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  progressStatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 18,
  },

  progressStatCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 17,
    minHeight: 105,
  },

  progressStatValue: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
  },

  progressStatLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },

  progressGoalCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 26,
  },

  progressGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  progressGoalLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  progressGoalValue: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 5,
  },

  progressGoalCount: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  progressScreenBarBackground: {
    height: 9,
    borderRadius: 10,
    backgroundColor: "#222222",
    marginTop: 17,
  },

  progressScreenBarFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.green,
  },

  progressWeekSchedule: {
    flexDirection: "row",
    gap: 5,
    marginTop: 16,
  },

  progressWeekDay: {
    flex: 1,
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  progressWeekDayPlanned: {
    borderColor: "#344716",
    backgroundColor: "#11170C",
  },

  progressWeekDayCompleted: {
    borderColor: "#4C711D",
    backgroundColor: "#17200F",
  },

  progressWeekDayToday: {
    borderWidth: 2,
    borderColor: COLORS.green,
  },

  progressWeekDayLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
  },

  progressWeekDayLabelPlanned: {
    color: COLORS.white,
  },

  progressWeekDayLabelCompleted: {
    color: COLORS.green,
  },

  progressWeekDayMark: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },

  progressGoalNote: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 10,
  },

  progressTrendCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },

  progressTrendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  progressTrendLabel: {
    width: 72,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  progressTrendTrack: {
    flex: 1,
    height: 10,
    borderRadius: 8,
    backgroundColor: "#242424",
    overflow: "hidden",
  },

  progressTrendFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.green,
  },

  progressTrendValue: {
    width: 30,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },

  progressTrendNote: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 1,
  },

  progressSectionTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 13,
  },

  progressEmptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },

  progressEmptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  progressEmptyText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 5,
  },

  historyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#151A0D",
    borderWidth: 1,
    borderColor: "#2E4516",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  historyIconText: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: "900",
  },

  historyContent: {
    flex: 1,
  },

  historyTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  historyMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  progressMindsetCard: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
  },

  progressMindsetTitle: {
    color: COLORS.green,
    fontWeight: "900",
    marginBottom: 5,
  },

  progressMindsetText: {
    color: COLORS.muted,
    lineHeight: 20,
  },

  libraryScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  libraryTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 7,
  },

  librarySubtitle: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 20,
  },

  libraryModeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  libraryModeButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },

  libraryModeButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  libraryModeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  libraryModeTextActive: {
    color: COLORS.background,
  },

  librarySearch: {
    backgroundColor: COLORS.card,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 14,
  },

  libraryCategoryRow: {
    gap: 9,
    paddingBottom: 16,
  },

  libraryCategoryChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  libraryCategoryChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  libraryCategoryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  libraryCategoryTextActive: {
    color: COLORS.background,
  },

  libraryResultCount: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },

  libraryCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 11,
  },

  libraryCardExpanded: {
    borderColor: "#3A4F15",
    backgroundColor: "#10140C",
  },

  libraryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  libraryEmojiBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  libraryEmoji: {
    fontSize: 22,
  },

  libraryCardTitleWrap: {
    flex: 1,
  },

  libraryCardTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  libraryCardMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  librarySaveButton: {
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  librarySaveIcon: {
    color: COLORS.muted,
    fontSize: 22,
    fontWeight: "800",
  },

  librarySaveIconActive: {
    color: COLORS.green,
  },

  libraryExpandIcon: {
    color: COLORS.green,
    fontSize: 25,
    fontWeight: "700",
    marginLeft: 6,
  },

  libraryFocusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
  },

  libraryFocusLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginRight: 8,
  },

  libraryFocusText: {
    color: COLORS.white,
    flex: 1,
    fontSize: 13,
  },

  libraryDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 14,
    paddingTop: 14,
  },

  libraryDetailLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginBottom: 5,
    marginTop: 4,
  },

  libraryDetailText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 10,
  },

  librarySafetyBox: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 3,
  },

  librarySafetyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  libraryGuideButton: {
    minHeight: 45,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  libraryGuideButtonText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  libraryEmptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
  },

  libraryEmptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  libraryEmptyText: {
    color: COLORS.muted,
    marginTop: 5,
  },

  libraryFooterNote: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
  },

  libraryFooterTitle: {
    color: COLORS.green,
    fontWeight: "900",
    marginBottom: 5,
  },

  libraryFooterText: {
    color: COLORS.muted,
    lineHeight: 20,
  },

  exerciseGuideScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  exerciseGuideHero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 22,
    padding: 18,
    marginTop: 20,
  },

  exerciseGuideEmojiBox: {
    width: 68,
    height: 68,
    borderRadius: 21,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  exerciseGuideEmoji: {
    fontSize: 34,
  },

  exerciseGuideHeroText: {
    flex: 1,
  },

  exerciseGuideCategory: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  exerciseGuideTitle: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    marginTop: 4,
  },

  exerciseGuideEquipment: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },

  exerciseGuideSaveButton: {
    minHeight: 47,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  exerciseGuideSaveButtonActive: {
    borderColor: "#365018",
    backgroundColor: "#151D0D",
  },

  exerciseGuideSaveText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  exerciseGuideSaveTextActive: {
    color: COLORS.green,
  },

  exerciseGuidePlanBadge: {
    borderRadius: 14,
    backgroundColor: "#151D0D",
    borderWidth: 1,
    borderColor: "#365018",
    padding: 12,
    marginTop: 10,
  },

  exerciseGuidePlanBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  exerciseGuideInfoCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    padding: 16,
    marginTop: 18,
  },

  exerciseGuideInfoLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  exerciseGuideInfoTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 5,
  },

  exerciseGuideSectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 12,
  },

  exerciseGuideStepCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 9,
  },

  exerciseGuideStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: COLORS.green,
    color: COLORS.background,
    textAlign: "center",
    lineHeight: 32,
    fontSize: 13,
    fontWeight: "900",
    marginRight: 11,
  },

  exerciseGuideStepContent: {
    flex: 1,
  },

  exerciseGuideStepTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  exerciseGuideStepText: {
    color: COLORS.muted,
    lineHeight: 19,
    fontSize: 12,
    marginTop: 4,
  },

  exerciseGuideSafetyCard: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 18,
    padding: 16,
    marginTop: 7,
  },

  exerciseGuideSafetyTitle: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "900",
  },

  exerciseGuideSafetyText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 5,
  },

  exerciseGuidePlanButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  exerciseGuidePlanButtonText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.7,
  },

  coachScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  coachScreenTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 7,
  },

  coachScreenSubtitle: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 24,
  },

  coachQuestion: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    marginTop: 8,
  },

  coachChoiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 22,
  },

  coachChoiceButton: {
    width: "48%",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },

  coachChoiceButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  coachChoiceText: {
    color: COLORS.white,
    fontWeight: "900",
  },

  coachChoiceTextActive: {
    color: COLORS.background,
  },

  coachFocusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 22,
  },

  coachFocusChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  coachFocusChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  coachFocusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  coachFocusTextActive: {
    color: COLORS.background,
  },

  coachStack: {
    gap: 10,
    marginBottom: 22,
  },

  coachWideChoice: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
  },

  coachWideChoiceActive: {
    borderColor: COLORS.green,
    backgroundColor: "#10160C",
  },

  coachWideChoiceTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  coachWideChoiceTitleActive: {
    color: COLORS.green,
  },

  coachWideChoiceSub: {
    color: COLORS.muted,
    lineHeight: 19,
    fontSize: 13,
    marginTop: 5,
  },

  coachRecommendation: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 21,
    padding: 18,
    marginTop: 2,
  },

  coachRecommendationLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  coachRecommendationTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },

  coachRecommendationText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 7,
  },

  coachPreviewDivider: {
    height: 1,
    backgroundColor: "#2E4516",
    marginVertical: 15,
  },

  coachPreviewLabel: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 9,
  },

  coachPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1209",
    borderRadius: 14,
    padding: 10,
    marginBottom: 7,
  },

  coachPreviewNumber: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  coachPreviewNumberText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "900",
  },

  coachPreviewContent: {
    flex: 1,
  },

  coachPreviewName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  coachPreviewMeta: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  coachSafetyText: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  completeScreen: {
    padding: 22,
    paddingTop: 54,
    paddingBottom: 60,
  },

  completeCheck: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  completeCheckText: {
    color: COLORS.background,
    fontSize: 36,
    fontWeight: "900",
  },

  completeTitle: {
    color: COLORS.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    marginTop: 8,
  },

  completeSubtitle: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 22,
  },

  completeWorkoutCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 18,
  },

  completeWorkoutLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  completeWorkoutTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 6,
  },

  completeStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },

  completeStat: {
    flex: 1,
    minHeight: 82,
    borderRadius: 16,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  completeStatValue: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  completeStatLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },

  completeRecoveryCard: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 19,
    padding: 17,
    marginTop: 14,
  },

  completeRecoveryTitle: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "900",
  },

  completeRecoveryText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 6,
  },

  completeSecondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 17,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  completeSecondaryButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  profileScreen: {
    padding: 22,
    paddingTop: 34,
    paddingBottom: 60,
  },

  profileTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    marginTop: 7,
  },

  profileSubtitle: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 20,
  },

  syncStatusCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 17,
    marginBottom: 14,
  },

  syncStatusTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  syncStatusLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  syncStatusValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },

  syncStatusText: {
    color: COLORS.muted,
    lineHeight: 19,
    marginTop: 10,
    fontSize: 13,
  },

  syncDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#555555",
  },

  syncDotReady: {
    backgroundColor: COLORS.green,
  },

  profileSetupCard: {
    backgroundColor: "#10160C",
    borderWidth: 1,
    borderColor: "#2E4516",
    borderRadius: 20,
    padding: 18,
  },

  profileSetupTitle: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 7,
  },

  profileSetupText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 7,
  },

  profileAccountCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
  },

  profileAvatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  profileAvatarLetter: {
    color: COLORS.background,
    fontSize: 28,
    fontWeight: "900",
  },

  profileEmail: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  profileCloudNote: {
    color: COLORS.muted,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  authToggle: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 13,
  },

  authToggleButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  authToggleButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  authToggleText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  authToggleTextActive: {
    color: COLORS.background,
  },

  authInput: {
    backgroundColor: COLORS.card,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 10,
  },

  profilePrimaryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 17,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  profilePrimaryButtonText: {
    color: COLORS.background,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  profileSecondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 17,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  profileSecondaryButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  profilePrivacyText: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  authMessageCard: {
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 13,
    marginTop: 12,
  },

  authMessageText: {
    color: COLORS.white,
    lineHeight: 19,
    fontSize: 13,
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

  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },

  headerBrandLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginRight: 12,
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

  viewPlanButton: {
    borderWidth: 1,
    borderColor: "#354900",
    borderRadius: 15,
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },

  viewPlanButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
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
