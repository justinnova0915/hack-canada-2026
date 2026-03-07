# Healthy Living App - Design Document

## 1. Project Overview

### Vision
A comprehensive healthy living assistant that empowers users to make better nutritional choices by leveraging AI and computer vision. The app helps users track their kitchen inventory, discover recipes based on available ingredients, get personalized meal recommendations, and manage grocery lists—all while providing an accessible user experience.

### Core Value Propositions
- **Smart Inventory Tracking**: Use your phone camera to automatically detect ingredients in your fridge
- **Personalized Recipe Discovery**: Get recipe recommendations based on what you have and dietary goals
- **Nutrition-Aware Recommendations**: AI suggests meals aligned with calorie and nutritional targets
- **Smart Shopping**: AI-generated grocery lists based on dietary preferences and meal plans

---

## 2. User Personas

### Primary Users
1. **Health-Conscious Home Cooks** (25-45 years old)
   - Goal: Eat healthier while reducing food waste
   - Tech-savvy, willing to use AI tools
   - Interested in calorie tracking and nutrition info

2. **Busy Professionals** (25-40 years old)
   - Goal: Quick, nutritious meals with minimal planning
   - Need convenience and time-saving features
   - Value meal recommendations and prep suggestions

3. **Budget-Conscious Shoppers** (20-50 years old)
   - Goal: Minimize food waste, maximize ingredient utilization
   - Want smart grocery lists based on pantry inventory
   - Track spending on groceries

---

## 3. Feature Breakdown

### 3.1 Image Upload & Management System

**Purpose**: Allow users to upload and manage food images for analysis

**Features**:
- Camera capture or gallery selection
- Image preview before processing
- Batch upload capability
- Image storage with metadata (timestamp, category)
- Image deletion & management
- HEIC/JPEG/PNG support

**Technical Details**:
- Client-side image compression
- Secure storage with user authentication
- Temporary processing cache
- Image quality validation (min 640x480)

---

### 3.2 Smart Fridge Inventory Detection

**Purpose**: Automatically detect ingredients from fridge photos using Gemini multi-modal vision

**Workflow**:
1. User takes photo of fridge/pantry
2. Image sent to Gemini API for analysis
3. Gemini identifies all visible items with descriptions
4. User confirms/edits detected items
5. Items added to "Current Inventory" with expiration dates

**Detection Method**:
- **Model**: Gemini 1.5 Pro/Flash multi-modal vision
- **Capabilities**: Identify produce, packaged items, branded products, containers
- **Output**: Item names, descriptions, quantities, confidence, OCR of labels
- **Post-processing**: Extract expiration dates from labels, estimate quantities from visual cues

**Data Captured**:
```
{
  item_name: string
  confidence: float (0-1)
  category: string (produce, dairy, meat, pantry, frozen)
  quantity: number
  unit: string (pieces, grams, ml)
  expiration_date?: date
  image_coordinates?: {x, y, width, height}
}
```

---

### 3.3 AI Image Processing (Gemini 3.1 Multi-Modal)

**Purpose**: Extract detailed nutritional info and ingredient context from food images

**Use Cases**:
- Analyze fridge photos for nutritional content overview
- Provide ingredient suggestions and alternatives
- Extract packaging information (nutrition labels, ingredients)
- Identify dishes and suggest modifications

**Gemini Primary Role**:
Gemini is now the primary detection engine for inventory. It provides:
- Item identification with confidence levels
- Quantity estimates ("appears to be 2-3 eggs", "half full carton")
- Brand/product extraction from packaging
- Expiration date reading from labels
- Nutritional content summary
- Allergen warnings

**Benefits Over YOLO**:
- No model training needed
- Handles diverse product types naturally
- Better context understanding (reads labels, brands)
- More flexible confidence scoring
- Reduces infrastructure complexity

---

### 3.4 Recipe Recommendation Engine

**Purpose**: Suggest recipes based on available ingredients while optimizing for nutrition

**Data Sources**:
- **Primary**: Web scraping (Spoonacular API, RecipeDB, AllRecipes)
- **AI Layer**: Gemini selects best recipes based on:
  - Available ingredients match percentage
  - Calorie alignment
  - User preferences (dietary restrictions, cuisine type)
  - Preparation time

**Recommendation Algorithm**:
```
1. Input: Current inventory + dietary goals
2. Filter: Recipes matchable with 70%+ ingredient availability
3. Score: Weight by:
   - Ingredients available (40%)
   - Calorie match to target (30%)
   - User ratings (20%)
   - Prep time (10%)
4. Rank & present top 5-10 recipes
5. Suggest missing ingredients for top picks
```

**Categories**:
- **"What You Have"**: Recipes using 80%+ current inventory
- **"What You Can Get"**: Recipes requiring 1-3 additional items (suggest shopping list)

---

### 3.5 Recipe Detail Page

**Content**:
- Recipe name, image, cuisine, cuisine type
- Ingredients list with quantities (toggle available vs needed)
- Step-by-step instructions
- Nutritional information:
  - Calories per serving
  - Macros (protein, carbs, fats)
  - Micronutrients (vitamins, minerals)
  - Allergen warnings
- Prep time, cook time, servings
- Difficulty level
- User reviews & ratings
- Save to favorites
- Schedule for meal planning



### 3.8 Grocery List Generator

**Auto-Generation Logic**:
1. User selects recipes for meal planning (next 3-7 days)
2. App aggregates required ingredients
3. Cross-references with current inventory
4. Generates shopping list with:
   - Items needed (quantity, unit)
   - Estimated cost
   - Store sections (produce, dairy, etc.)
   - Quantities combined (e.g., "2 lbs chicken" instead of multiple entries)

**Smart Features**:
- Deduplication (recognize same item by unit variations)
- Budget optimization (suggest bulk options if cheaper)
- Substitution recommendations (e.g., "frozen vs fresh")
- Ability to manually add items
- Checkoff as shopping progresses
- Save lists for reordering

**Data Structure**:
```
{
  shopping_list: [
    {
      item: string
      quantity: number
      unit: string
      category: string
      estimated_price: float
      alternatives: [{item, price}]
      recipes_needed_for: [recipe_ids]
    }
  ],
  total_items: number,
  estimated_cost: float,
  created_at: timestamp
}
```

---

### 3.9 AI Meal Recommendations (Calorie & Ingredient Based)

**Personalization Factors**:
- Daily calorie target (user-defined)
- Dietary restrictions (vegetarian, vegan, keto, etc.)
- Allergies
- Cuisine preferences
- Available ingredients
- Remaining calorie budget for the day

**Recommendation Workflow**:
1. User sets daily calorie goal (default: 2000 cal)
2. System tracks meals logged during the day
3. AI suggests next meal based on:
   - Remaining calories
   - Nutritional balance (carbs, protein, fats)
   - Ingredient availability
   - Time of day (lighter breakfast, substantial lunch, etc.)
4. User can adjust portion sizes to hit targets

**Machine Learning Component** (future enhancement):
- Track user selection patterns
- Learn preferred cuisines, flavors, dietary combos
- Predict user's receptiveness to specific recipes
- Personalized ranking over time

---

### 3.10 Two-Category Inventory System

**"What You Have Now"**
- Current fridge/pantry items
- Organized by:
  - Item type (produce, dairy, meat, pantry, frozen)
  - Freshness indicator (days until expiration)
  - Quantity available
- Color-coded: Green (fresh), Yellow (expiring soon), Red (expired)
- Quick edit: add, remove, or update quantities

**"What You Can Get"**
- Smart grocery suggested list
- Items needed for:
  - Top recommended recipes
  - Meal planning for next N days
  - User shopping list additions
- Organized by store section
- Price estimates & alternatives
- One-click add to shopping cart (integration with local services)

---

## 4. Technical Architecture

### 4.1 Tech Stack

**Frontend** (React Native / Expo - existing setup):
- React Native with TypeScript
- Expo for deployment
- Image compression & preprocessing (Expo ImageManipulator)
- Redux or Zustand for state management
- React Navigation for routing

**Backend** (Node.js):
- API Gateway (Express.js)
- Gemini API client for image analysis & recommendations
- Database: PostgreSQL with vector search (pgvector for AI)
- Cache: Redis for recipe/ingredient data
- Message Queue: Bull for async tasks (recipe scraping, meal recommendations)

**External APIs**:
- **Gemini 1.5 Pro/Flash**: Image analysis, meal recommendations
- **Recipe APIs**: Spoonacular, EdamamI, or custom scraping
- **Nutrition Database**: USDA FoodData Central, or Edamam
- **Optional**: Firebase for auth, real-time sync, analytics

### 4.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │  Camera  │ │   UI     │ │  Local   │   │
│  │  Module  │ │ Components│ │ Storage  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘   │
└───────┼────────────┼─────────────┼──────────────┘
        │            │             │    
        │            │             │    
┌───────┼────────────┼─────────────┼──────────────┐
│       │  REST API  │             │              │
│       └────────────┼─────────────┼──────────────┘
│                    │             │                
│  ┌────────────────┴─────────┬───┴──────────────────┐  │
│  │                          │                      │  │
│  ▼                          ▼                      ▼  │
│┌──────────────────┐  ┌─────────────────┐  ┌────────────┐│
││ Gemini Multi-    │  │  Gemini Meal    │  │  Recipe    ││
││ modal (Detection)│  │ Recommender     │  │  Service   ││
│└────────┬─────────┘  └────────┬────────┘  └─────┬──────┘│
│         │                     │                  │      │
│         └─────────────────────┼──────────────────┘      │
│                               │                        │
│                    ┌──────────┴───────────┐            │
│                    │                      │            │
│                    ▼                      ▼            │
│              ┌──────────────────────────────────┐     │
│              │     PostgreSQL Database          │     │
│              │ - Users & Auth                   │     │
│              │ - Inventory (current & history)  │     │
│              │ - Recipes & Nutrition Data       │     │
│              │ - Meal Plans & Preferences       │     │
│              │ - Shopping Lists                 │     │
│              └──────────────────────────────────┘     │
│                                                       │
│              Redis Cache (Recipe data)               │
└───────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  External APIs                                          │
│  - Gemini 1.5 (Multi-modal vision + meal recommendations)       │
│  - Recipe APIs (Spoonacular, EdamamI, etc.)          │
│  - USDA FoodData Central (Nutrition data)            │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Data Models

### 5.1 User Schema
```typescript
interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  preferences: {
    daily_calorie_goal: number;
    dietary_restrictions: string[];
    allergies: string[];
    cuisine_preferences: string[];
    units: 'metric' | 'imperial';
  };
  created_at: timestamp;
  updated_at: timestamp;
}
```

### 5.2 Inventory Item Schema
```typescript
interface InventoryItem {
  id: string;
  user_id: string;
  item_name: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen';
  quantity: number;
  unit: string;
  expiration_date: date;
  added_date: timestamp;
  image_reference?: string; // reference to original detection image
  source: 'manual' | 'detected'; // how item was added
}
```

### 5.3 Recipe Schema
```typescript
interface Recipe {
  id: string;
  source: 'spoonacular' | 'external' | 'user_created';
  external_id?: string;
  name: string;
  description: string;
  image: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  
  ingredients: [{
    name: string;
    quantity: number;
    unit: string;
    optional?: boolean;
  }];
  
  instructions: [{
    step_number: number;
    instruction: string;
    duration_minutes?: number;
  }];
  
  nutrition_per_serving: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sodium_mg: number;
    [other_nutrients]: number;
  };
  
  tags: string[]; // cuisine, diet_type, etc.
  ratings?: {
    average: number;
    count: number;
  };
  
  created_at: timestamp;
}
```

### 5.4 Meal Plan Schema
```typescript
interface MealPlan {
  id: string;
  user_id: string;
  date: date;
  meals: [{
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    recipe_id: string;
    servings: number;
    logged_at: timestamp;
  }];
  total_calories: number;
  nutritional_totals: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}
```

### 5.5 Shopping List Schema
```typescript
interface ShoppingList {
  id: string;
  user_id: string;
  created_at: timestamp;
  items: [{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
    estimated_price: number;
    checked: boolean;
    recipes_needed_for: string[];
  }];
  total_items: number;
  estimated_total_cost: number;
  status: 'draft' | 'active' | 'completed';
}
```

---

## 6. API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Inventory Management
- `GET /inventory` - Get current inventory
- `POST /inventory` - Add item manually
- `PUT /inventory/:id` - Update item
- `DELETE /inventory/:id` - Remove item
- `POST /inventory/detect` - Detect items from image via Gemini
- `GET /inventory/history` - View past inventory snapshots

### Recipe Management
- `GET /recipes` - Search recipes (filters: ingredients, calories, cuisine)
- `GET /recipes/:id` - Get recipe details
- `POST /recipes/favorite` - Save recipe
- `GET /recipes/favorites` - Get user's favorite recipes
- `GET /recipes/recommended` - Get AI recommendations

### Meal Planning
- `POST /meals/log` - Log a meal
- `GET /meals/today` - Get today's meals & calorie summary
- `GET /meals/history` - Get meal history
- `DELETE /meals/:id` - Delete logged meal

### Grocery Lists
- `GET /shopping-lists` - Get all shopping lists
- `POST /shopping-lists` - Create new list
- `PUT /shopping-lists/:id` - Update list
- `POST /shopping-lists/:id/generate` - Auto-generate from meal plan

### Image Processing
- `POST /images/upload` - Upload image
- `POST /images/analyze` - Analyze with Gemini
- `GET /images/:id` - Retrieve image metadata

---

## 7. User Flows

### User Flow 1: Detect Ingredients & Get Recipe
```
1. Open app → Camera view
2. Take photo of fridge
3. Gemini detects items via multi-modal vision
4. User confirms detected items
5. Items added to inventory
6. Tap "Get Recipe Ideas"
7. Gemini + AI recommends recipes
8. Browse recommendations
9. Select recipe → View details
10. View recipe and start cooking
```

### User Flow 2: Plan Meals & Generate Shopping List
```
1. View meal recommendations
2. Select 3-5 recipes for next week
3. Tap "Generate Shopping List"
4. System deduplicates & combines ingredients
5. Suggests budget optimizations
6. User reviews & adjusts list
7. Share list or export to notes
8. Go to store with list
9. Check off items while shopping
```



## 8. Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)
- [x] Project setup & architecture
- [ ] User authentication (email/password)
- [ ] Image upload system
- [ ] YOLO food detection & integration
- [ ] Basic inventory management UI
- [ ] Recipe API integration (fetch & cache)
- [ ] Recipe recommendation algorithm (basic)
- [ ] Recipe detail page with nutrition

### Phase 2: AI & Meal Tracking (Weeks 5-8)
- [ ] Gemini integration for image analysis
- [ ] Meal logging & calorie tracking
- [ ] AI meal recommendations (calories + ingredients)
- [ ] Advanced recommendation algorithm (personalization)
- [ ] User testing & feedback

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] Grocery list generation & optimization
- [ ] Meal planning interface
- [ ] Shopping list management
- [ ] Budget optimization

### Phase 4: Polish & Optimization (Weeks 13-16)
- [ ] Performance optimization
- [ ] Caching & offline support
- [ ] User testing & feedback
- [ ] Analytics & monitoring
- [ ] Deployment & launch

---

## 9. Success Metrics

- **User Engagement**: 
  - DAU (Daily Active Users)
  - Recipes viewed/cooked per user per week
  - Average meal plan creation frequency

- **Detection Accuracy**:
  - Gemini detection accuracy rate
  - User confirmation acceptance rate

- **Nutrition Tracking**:
  - Meals logged per user per day
  - Calorie goal adherence percentage

- **Feature Adoption**:
  - % users generating shopping lists
  - Meal plan creation frequency

- **Retention**:
  - Week 1, Week 4, Week 12 retention rates
  - Churn rate

---

## 10. Security & Privacy Considerations

- **Data Encryption**: All user data encrypted in transit (HTTPS) and at rest
- **Authentication**: JWT tokens with refresh mechanism
- **Image Handling**: User photos not shared with third parties unless necessary
- **Gemini Privacy**: Transient processing of images (not stored long-term)
- **User Control**: Users can delete their data & images anytime
- **Compliance**: GDPR, CCPA ready (user consent, data portability)

---

## 11. Challenges & Mitigation Strategies

| Challenge | Impact | Mitigation |
|-----------|--------|-----------|
| Gemini detection hallucinations | Poor inventory | User confirmation UI, fallback mechanisms, continuous monitoring |
| API quota limits (Gemini) | Increased costs | Caching, request batching, rate limiting |
| Complex recipe matching | Inconsistent recommendations | Robust ingredient normalization, synonym database |
| Expiration date OCR errors | Inventory inaccuracy | Manual override UI prominently featured |
| Cold start problem (new user) | Poor recommendations | Default preferences, trending recipes, curated baselines |

---

## 12. Future Enhancements

1. **Social Features**: Share recipes, meal plans with friends
2. **Barcode Scanning**: Quick add via barcode
3. **Restaurant Integration**: Log meals from restaurants
4. **Nutrition Analytics**: Trends, nutrient deficiencies, warnings
5. **Smart Substitutions**: ML-powered ingredient swaps
6. **Group Meal Planning**: Family or household planning
7. **Voice Interface** (Optional): Voice assistant for recipe guidance
8. **Fitness Integration**: Sync with Apple Health, Google Fit
9. **Community Recipes**: User-submitted recipes with ratings
10. **Meal Prep Automation**: Suggest batch cooking strategies

---

## Appendix: Technology Details

### Gemini Multi-Modal Configuration
- **Model**: Gemini 1.5 Flash (for speed) or 1.5 Pro (for accuracy)
- **Input**: JPEG/PNG images (compressed to ~2-5MB)
- **Detection Capability**: Open-ended (handles any food item, packaged product, etc.)
- **Response Time**: ~2-5 seconds per image
- **Confidence**: Gemini provides natural language confidence ("likely", "appears to be", etc.)
- **Image Processing**: Client-side compression before sending to API

### Gemini Multi-Modal Prompts

**Prompt 1: Inventory Detection**
```
Analyze this photo of a refrigerator/pantry. For each visible food item, provide:
1. Item name (be specific: "2% milk" not just "milk")
2. Quantity estimate (e.g., "approximately 3/4 full", "2 pieces")
3. Confidence level (high/medium/low)
4. Any visible expiration dates
5. Brand name if visible

Format as JSON array with {name, quantity, confidence, expiration_date, brand} objects.
```

**Prompt 2: Recipe Recommendation (using detected inventory)**
```
Given these available ingredients: [INGREDIENT LIST]
And user preferences: daily_calorie_goal={CALORIES}, dietary_restrictions={RESTRICTIONS}

Suggest 5 recipes that can be made with 80%+ of these ingredients. For each recipe:
1. Recipe name
2. Missing ingredients (1-3 items)
3. Estimated calories per serving
4. Prep + cook time
5. Why this matches their preferences

Prioritize recipes that minimize food waste.
```

**Prompt 3: Nutrition Label Extraction**
```
Extract the nutrition facts from this food package label. Provide:
- Serving size
- Calories per serving
- Macronutrients (protein, carbs, fat)
- Key micronutrients (fiber, sodium, sugar)
- Allergens and ingredients list

If the label is partially visible, estimate based on common product variants.
```



