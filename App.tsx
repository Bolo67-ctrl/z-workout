import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

type PersistedAppData = {
  workoutPlace: Place | null;
  goal: Goal | null;
  equipment: string[];
  trainingDays: number | null;
  workoutLength: string | null;
  completedWorkouts: number;
  workoutHistory: WorkoutHistoryItem[];
  weekKey: string;
  mealCategory: MealCategory;
  mealTiming: MealTiming;
  recommendedMealsOnly: boolean;
};

const STORAGE_KEY = "z-workout-app-state-v1";

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
  const [workoutLength, setWorkoutLength] = useState<string | null>(null);
  const [completedSets, setCompletedSets] = useState<string[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState(0);
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
  const [coachTime, setCoachTime] = useState("30 min");
  const [coachEnergy, setCoachEnergy] = useState<CoachEnergy>("Ready");
  const [coachEquipmentMode, setCoachEquipmentMode] =
    useState<CoachEquipmentMode>("Use My Plan");
  const [sessionExercises, setSessionExercises] =
    useState<WorkoutExercise[] | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [sessionLength, setSessionLength] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let active = true;

    const restoreApp = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved || !active) {
          return;
        }

        const parsed = JSON.parse(saved) as Partial<PersistedAppData>;

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

        if (parsed.weekKey === getCurrentWeekKey()) {
          setCompletedWorkouts(
            typeof parsed.completedWorkouts === "number"
              ? parsed.completedWorkouts
              : 0
          );
        } else {
          setCompletedWorkouts(0);
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
      const data: PersistedAppData = {
        workoutPlace,
        goal,
        equipment,
        trainingDays,
        workoutLength,
        completedWorkouts,
        workoutHistory,
        weekKey: getCurrentWeekKey(),
        mealCategory,
        mealTiming,
        recommendedMealsOnly,
      };

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
    workoutLength,
    completedWorkouts,
    workoutHistory,
    mealCategory,
    mealTiming,
    recommendedMealsOnly,
  ]);

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

  const getCoachExercises = () => {
    const maxExercises =
      coachTime === "15 min"
        ? 4
        : coachTime === "30 min"
        ? 5
        : coachTime === "45 min"
        ? 6
        : 7;

    if (coachEnergy === "Recovery") {
      const recoveryExercises: WorkoutExercise[] = [
        {
          name: "Cat-Cow",
          target: "2 × 6–8 slow reps",
          focus: "Spine",
          cue: "Move slowly and stay comfortable.",
        },
        {
          name: "Shoulder Wall Slides",
          target: "2 × 8–10",
          focus: "Shoulders",
          cue: "Use a comfortable range without forcing the movement.",
        },
        {
          name: "Glute Bridge",
          target: "2 × 10–12",
          focus: "Hips",
          cue: "Move smoothly and pause briefly at the top.",
        },
        {
          name: "Dead Bug",
          target: "2 × 6–8 each side",
          focus: "Core",
          cue: "Keep the movement slow and controlled.",
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
      ];

      return recoveryExercises.slice(0, Math.min(maxExercises, 6));
    }

    if (coachEquipmentMode === "No Equipment Today") {
      const bodyweightExercises: WorkoutExercise[] = [
        {
          name: "Push-Ups",
          target: "2 × 6–10",
          focus: "Chest + arms",
          cue: "Use a wall, incline, or knees-down version if needed.",
        },
        {
          name: "Bodyweight Squats",
          target: "2 × 10–12",
          focus: "Legs",
          cue: "Use a comfortable depth and steady pace.",
        },
        {
          name: "Reverse Lunges",
          target: "2 × 6–8 each side",
          focus: "Legs",
          cue: "Use support for balance if needed.",
        },
        {
          name: "Glute Bridges",
          target: "2 × 10–12",
          focus: "Hips",
          cue: "Move smoothly and pause briefly at the top.",
        },
        {
          name: "Bird Dog",
          target: "2 × 6–8 each side",
          focus: "Core + back",
          cue: "Move slowly without twisting.",
        },
        {
          name: "Dead Bug",
          target: "2 × 6–8 each side",
          focus: "Core",
          cue: "Keep the movement controlled.",
        },
        {
          name: "Calf Raises",
          target: "2 × 10–15",
          focus: "Calves",
          cue: "Use a wall or chair for balance.",
        },
      ];

      return bodyweightExercises.slice(0, maxExercises);
    }

    const planExercises =
      coachEnergy === "Low Energy"
        ? workoutExercises.slice(0, Math.max(3, Math.min(maxExercises, 5)))
        : workoutExercises.slice(0, maxExercises);

    return planExercises;
  };

  const startCoachWorkout = () => {
    const coachExercises = getCoachExercises();
    const firstExercise = coachExercises[0];

    const title =
      coachEnergy === "Recovery"
        ? "Recovery & Mobility Session"
        : coachEquipmentMode === "No Equipment Today"
        ? "No-Equipment Coach Session"
        : coachEnergy === "Low Energy"
        ? "Light Coach Session"
        : "Z Coach Session";

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
    setCompletedWorkouts((current) =>
      Math.min(current + 1, trainingDays ?? current + 1)
    );

    setWorkoutHistory((current) => [
      {
        id: `${Date.now()}`,
        title: activeWorkoutTitle,
        completedAt: new Date().toISOString(),
        exercises: activeExercises.length,
        plannedDuration: activeWorkoutLength ?? "Custom",
      },
      ...current,
    ]);

    setCompletedSets([]);
    setSetLogs({});
    setTimerRunning(false);
    setSessionExercises(null);
    setSessionTitle(null);
    setSessionLength(null);
    setStep(5);
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

    setCompletedSets((current) =>
      current.includes(key) ? current : [...current, key]
    );

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

  const coachSummary =
    coachEnergy === "Recovery"
      ? "A gentle mobility-focused session with comfortable movement and short recovery breaks."
      : coachEquipmentMode === "No Equipment Today"
      ? `A ${coachTime} bodyweight session using no equipment.`
      : coachEnergy === "Low Energy"
      ? `A lighter ${coachTime} version of your plan with fewer exercises.`
      : `A ${coachTime} session based on your current Z Plan and available equipment.`;

  const weeklyProgressPercent = trainingDays
    ? Math.min(100, Math.round((completedWorkouts / trainingDays) * 100))
    : 0;

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

      return categoryMatch && searchMatch;
    });
  }, [exerciseCategory, exerciseSearch]);

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
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>Z</Text>
          </View>
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
              : `${currentExercise.name} complete • next set coming up`}
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
          <Text style={styles.progressScreenTitle}>Your training activity</Text>
          <Text style={styles.progressScreenSubtitle}>
            Track completed sessions and consistency without turning training
            into a race.
          </Text>

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
              <Text style={styles.progressStatValue}>{workoutLength ?? "-"}</Text>
              <Text style={styles.progressStatLabel}>Planned length</Text>
            </View>

            <View style={styles.progressStatCard}>
              <Text style={styles.progressStatValue}>
                {workoutExercises.length}
              </Text>
              <Text style={styles.progressStatLabel}>Exercises/session</Text>
            </View>
          </View>

          <View style={styles.progressGoalCard}>
            <View style={styles.progressGoalHeader}>
              <View>
                <Text style={styles.progressGoalLabel}>WEEKLY PLAN</Text>
                <Text style={styles.progressGoalValue}>
                  {weeklyProgressPercent}% complete
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

            <Text style={styles.progressGoalNote}>
              Rest days count as part of a balanced plan too.
            </Text>
          </View>

          <Text style={styles.progressSectionTitle}>Recent activity</Text>

          {workoutHistory.length === 0 ? (
            <View style={styles.progressEmptyCard}>
              <Text style={styles.progressEmptyTitle}>No completed sessions yet</Text>
              <Text style={styles.progressEmptyText}>
                Finish a guided workout and it will appear here.
              </Text>
            </View>
          ) : (
            workoutHistory.slice(0, 8).map((item) => (
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
                    })}{" "}
                    • {item.exercises} exercises • {item.plannedDuration}
                  </Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.progressMindsetCard}>
            <Text style={styles.progressMindsetTitle}>Consistency over perfection</Text>
            <Text style={styles.progressMindsetText}>
              A shorter session or an extra recovery day can still be part of a
              healthy routine.
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
                : coachEquipmentMode === "No Equipment Today"
                ? "Bodyweight Session"
                : coachEnergy === "Low Energy"
                ? "Lighter Plan"
                : "Your Plan, Adapted"}
            </Text>
            <Text style={styles.coachRecommendationText}>{coachSummary}</Text>
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

          <TouchableOpacity
            style={styles.startButton}
            onPress={startTimedWorkout}
          >
            <Text style={styles.startButtonText}>START WORKOUT</Text>
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
            <Text style={styles.streakNumber}>🔥 0</Text>
            <Text style={styles.streakLabel}>Day streak</Text>
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
        <NavItem emoji="🏋️" text="Workout" />
        <NavItem emoji="✦" text="Coach" onPress={() => setStep(10)} />
        <NavItem emoji="📈" text="Progress" onPress={() => setStep(8)} />
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

  progressGoalNote: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 10,
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

  libraryExpandIcon: {
    color: COLORS.green,
    fontSize: 25,
    fontWeight: "700",
    marginLeft: 10,
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

  coachSafetyText: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
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
