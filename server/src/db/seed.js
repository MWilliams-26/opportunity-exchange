const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = require('./schema');

// Initialize categories for marketplace listings and brandable names
const categories = [
  { name: 'Tech', slug: 'tech', description: 'Technology and software related assets' },
  { name: 'SaaS', slug: 'saas', description: 'Software as a Service products and platforms' },
  { name: 'E-commerce', slug: 'ecommerce', description: 'Online retail and marketplace assets' },
  { name: 'Health & Wellness', slug: 'health-wellness', description: 'Healthcare, fitness, and wellness assets' },
  { name: 'Finance', slug: 'finance', description: 'Financial services and fintech assets' },
  { name: 'Creative', slug: 'creative', description: 'Creative services, design, and media assets' },
  { name: 'Food & Beverage', slug: 'food-beverage', description: 'Food, drink, and restaurant related assets' },
  { name: 'Lifestyle', slug: 'lifestyle', description: 'Fashion, travel, and lifestyle brand assets' }
];

// Only insert categories if they don't exist
const existingCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (existingCategories.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
  for (const cat of categories) {
    insertCategory.run(cat.name, cat.slug, cat.description);
  }
  console.log('Categories initialized: Tech, SaaS, E-commerce, Health & Wellness, Finance, Creative, Food & Beverage, Lifestyle');
} else {
  console.log('Categories already exist, skipping...');
}

console.log('Database initialized successfully!');
console.log('');
console.log('This marketplace uses REAL domain availability data.');
console.log('Users can:');
console.log('  1. Search for available domains on /discover');
console.log('  2. Register an account to list domains they own for sale');
console.log('  3. Browse and bid on user listings on /marketplace');
