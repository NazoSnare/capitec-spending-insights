/**
 * The fixed reference data: categories, merchants, the customer and their budgets.
 *
 * Categories, colours and icon names are exactly the ones in the brief's
 * `/filters` example, so a client written against the spec renders them as it
 * expects. Merchants are South African, because a Capitec customer's statement
 * says "Pick n Pay", not "Grocery Store 1".
 */

/** @typedef {{ name: string, color: string, icon: string }} Category */

/** @type {Category[]} */
export const CATEGORIES = [
  { name: "Groceries", color: "#FF6B6B", icon: "shopping-cart" },
  { name: "Entertainment", color: "#4ECDC4", icon: "film" },
  { name: "Transportation", color: "#45B7D1", icon: "car" },
  { name: "Dining", color: "#F7DC6F", icon: "utensils" },
  { name: "Shopping", color: "#BB8FCE", icon: "shopping-bag" },
  { name: "Utilities", color: "#85C1E9", icon: "zap" },
];

export const CATEGORY_BY_NAME = new Map(CATEGORIES.map((c) => [c.name.toLowerCase(), c]));

export const DATE_RANGE_PRESETS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last year", value: "1y" },
];

/**
 * How each category's day-to-day spending is generated: roughly how many purchases a
 * month, the range of one purchase in cents, where it is bought and how it is paid.
 * Recurring debits (subscriptions, airtime, rates) are listed separately below so they
 * land on the same day each month, the way a real statement looks.
 */
export const SPEND_PROFILE = {
  // Each merchant carries what is bought there, so a row never reads "Uber, train fare".
  Groceries: {
    perMonth: 15, min: 3_500, max: 15_000,
    merchants: [
      ["Pick n Pay", ["Weekly groceries", "Top-up shop"]],
      ["Checkers", ["Weekly groceries", "Fresh produce"]],
      ["Woolworths Food", ["Fresh produce", "Top-up shop"]],
      ["Spar", ["Top-up shop", "Monthly stock-up"]],
      ["Shoprite", ["Monthly stock-up", "Top-up shop"]],
    ],
    methods: ["Debit Card", "Credit Card", "Tap to Pay"],
  },
  Entertainment: {
    perMonth: 3, min: 4_000, max: 20_000,
    merchants: [
      ["Ster-Kinekor", ["Movie tickets"]],
      ["Nu Metro", ["Movie tickets"]],
      ["Computicket", ["Event tickets"]],
      ["PlayStation Store", ["Game purchase"]],
    ],
    methods: ["Credit Card", "Debit Card"],
  },
  Transportation: {
    perMonth: 12, min: 2_500, max: 11_000,
    merchants: [
      ["Uber", ["Ride"]],
      ["Bolt", ["Ride"]],
      ["Engen", ["Fuel"]],
      ["Shell", ["Fuel"]],
      ["Gautrain", ["Train fare"]],
      ["Sandton City Parking", ["Parking"]],
    ],
    methods: ["Credit Card", "Debit Card", "Tap to Pay"],
  },
  Dining: {
    perMonth: 9, min: 2_500, max: 9_000,
    merchants: [
      ["Nando's", ["Lunch", "Dinner out"]],
      ["Steers", ["Lunch", "Takeaway"]],
      ["Ocean Basket", ["Dinner out"]],
      ["Mugg & Bean", ["Coffee", "Breakfast"]],
      ["Wimpy", ["Breakfast", "Coffee"]],
      ["Uber Eats", ["Takeaway"]],
    ],
    methods: ["Credit Card", "Debit Card", "Tap to Pay"],
  },
  Shopping: {
    perMonth: 6, min: 3_000, max: 15_000,
    merchants: [
      ["Takealot", ["Online order"]],
      ["Mr Price", ["Clothing"]],
      ["Woolworths", ["Clothing", "Household items"]],
      ["Clicks", ["Toiletries"]],
      ["Dis-Chem", ["Toiletries", "Pharmacy"]],
    ],
    methods: ["Credit Card", "Debit Card"],
  },
  Utilities: { perMonth: 0, min: 0, max: 0, merchants: [], methods: [] },
};

/** Debits that recur on a fixed day of every month, in cents. */
export const RECURRING = [
  { day: 1, merchant: "Vodacom", category: "Utilities", amount: 9_900, description: "Prepaid airtime", method: "Debit Order" },
  { day: 3, merchant: "City Power", category: "Utilities", amount: 25_000, spread: 8_000, description: "Prepaid electricity", method: "EFT" },
  { day: 7, merchant: "City of Johannesburg", category: "Utilities", amount: 11_000, spread: 2_000, description: "Water and refuse", method: "Debit Order" },
  { day: 15, merchant: "Netflix", category: "Entertainment", amount: 19_900, description: "Monthly subscription", method: "Debit Order" },
  { day: 20, merchant: "Spotify", category: "Entertainment", amount: 5_999, description: "Monthly subscription", method: "Debit Order" },
  { day: 25, merchant: "Showmax", category: "Entertainment", amount: 9_900, description: "Monthly subscription", method: "Debit Order" },
];

/**
 * The mock customers. The brief's examples use customer 12345, so that is the one the
 * dashboard opens; a second customer shows that every figure is computed per customer
 * rather than hard-coded.
 */
export const CUSTOMERS = {
  "12345": {
    customerId: "12345",
    name: "Thandiwe Mokoena",
    email: "thandiwe.mokoena@example.co.za",
    joinDate: "2023-01-15",
    accountType: "premium",
    currency: "ZAR",
    // Monthly budgets in cents, per category: the "Spending Goals" endpoint.
    budgets: { Entertainment: 100_000, Groceries: 150_000, Dining: 60_000, Transportation: 90_000 },
    // Scales how much this customer spends, so two customers do not look identical.
    appetite: 1,
  },
  "67890": {
    customerId: "67890",
    name: "Sipho Dlamini",
    email: "sipho.dlamini@example.co.za",
    joinDate: "2024-06-01",
    accountType: "standard",
    currency: "ZAR",
    budgets: { Groceries: 110_000, Transportation: 60_000 },
    appetite: 0.7,
  },
};
