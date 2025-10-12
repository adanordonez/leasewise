// Script to generate realistic mock lease data for Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Realistic US cities and their common neighborhoods
const locations = [
  { city: 'New York, NY', neighborhoods: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx'], state: 'NY' },
  { city: 'Los Angeles, CA', neighborhoods: ['Downtown', 'Santa Monica', 'Hollywood', 'Venice'], state: 'CA' },
  { city: 'Chicago, IL', neighborhoods: ['Loop', 'Lincoln Park', 'Wicker Park', 'River North'], state: 'IL' },
  { city: 'San Francisco, CA', neighborhoods: ['Mission District', 'SOMA', 'Nob Hill', 'Haight-Ashbury'], state: 'CA' },
  { city: 'Austin, TX', neighborhoods: ['Downtown', 'South Congress', 'East Austin', 'West Campus'], state: 'TX' },
  { city: 'Seattle, WA', neighborhoods: ['Capitol Hill', 'Ballard', 'Fremont', 'Queen Anne'], state: 'WA' },
  { city: 'Boston, MA', neighborhoods: ['Back Bay', 'Cambridge', 'Beacon Hill', 'South End'], state: 'MA' },
  { city: 'Denver, CO', neighborhoods: ['LoDo', 'Capitol Hill', 'RiNo', 'Cherry Creek'], state: 'CO' },
  { city: 'Portland, OR', neighborhoods: ['Pearl District', 'Alberta', 'Hawthorne', 'Division'], state: 'OR' },
  { city: 'Miami, FL', neighborhoods: ['Brickell', 'Wynwood', 'Coconut Grove', 'South Beach'], state: 'FL' },
];

const buildingNames = [
  'The Heights', 'Park Place', 'City View Apartments', 'Riverside Lofts', 
  'The Metropolitan', 'Oakwood Residences', 'Sunset Towers', 'Harbor Apartments',
  'The Pinnacle', 'Skyline Condos', 'Willow Creek', 'Urban Living',
  'The Madison', 'Cedar Grove', 'Vista Pointe', 'The Alexandria',
  'Maple Gardens', 'Stone Ridge', 'The Westwood', 'Parkside Manor'
];

const propertyTypes = [
  'Apartment', 'Studio', 'Loft', 'Condo', 'Townhouse', 'Duplex'
];

const amenities = [
  'Gym', 'Pool', 'Parking', 'Laundry', 'Doorman', 'Balcony',
  'Pet Friendly', 'Bike Storage', 'Rooftop Deck', 'Package Room',
  'Concierge', 'Elevator', 'Dishwasher', 'Air Conditioning',
  'In-unit Washer/Dryer', 'Hardwood Floors', 'Storage', 'Security System'
];

const managementCompanies = [
  'City Residential', 'Metro Property Management', 'Urban Living LLC',
  'Premier Properties', 'Summit Management Group', 'Apex Realty',
  'Cornerstone Property', 'Skyline Management', 'Harbor Properties',
  'Greenfield Management'
];

const landlordNames = [
  'John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez',
  'David Kim', 'Jessica Martinez', 'Robert Brown', 'Jennifer Wilson',
  'Christopher Lee', 'Amanda Taylor'
];

const utilitiesOptions = [
  ['Water', 'Trash'],
  ['Heat', 'Hot Water'],
  ['Water', 'Sewer', 'Trash'],
  [],
  ['Water'],
  ['Heat', 'Hot Water', 'Water']
];

const petPolicies = [
  'No pets allowed',
  'Cats allowed with $200 deposit',
  'Dogs under 25lbs allowed with $300 deposit',
  'Cats and small dogs allowed, $250 deposit per pet',
  'Pets allowed with approval, $500 deposit',
  'No pets (service animals only)'
];

// Helper functions
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateAddress(location, neighborhood) {
  const streetNumber = randomInt(100, 9999);
  const streets = ['Main St', 'Oak Ave', 'Pine St', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Park Ave', 'Broadway', 'Market St', 'Washington St'];
  const street = randomChoice(streets);
  const unit = randomInt(1, 50);
  return `${streetNumber} ${street}, Apt ${unit}, ${neighborhood}, ${location.city}`;
}

function generateRent(city, bedrooms) {
  // Base rent by city (rough averages)
  const baseRents = {
    'New York, NY': [2500, 3500, 4800],
    'San Francisco, CA': [2800, 3800, 5200],
    'Los Angeles, CA': [2000, 2800, 3800],
    'Boston, MA': [2200, 3000, 4000],
    'Seattle, WA': [1800, 2500, 3400],
    'Chicago, IL': [1600, 2200, 3000],
    'Austin, TX': [1500, 2000, 2800],
    'Denver, CO': [1600, 2200, 3000],
    'Portland, OR': [1500, 2000, 2700],
    'Miami, FL': [1800, 2400, 3200],
  };
  
  const base = baseRents[city][bedrooms] || 1500;
  const variation = randomInt(-200, 300);
  return Math.round((base + variation) / 50) * 50; // Round to nearest $50
}

function generateSquareFootage(bedrooms) {
  const ranges = {
    0: [400, 600],   // Studio
    1: [600, 900],
    2: [900, 1300],
    3: [1300, 1800]
  };
  const range = ranges[bedrooms] || [800, 1200];
  return randomInt(range[0], range[1]);
}

async function generateMockLease() {
  const location = randomChoice(locations);
  const neighborhood = randomChoice(location.neighborhoods);
  const bedrooms = randomChoice([0, 1, 1, 2, 2, 2, 3]); // Weighted towards 1-2BR
  const bathrooms = bedrooms === 0 ? 1 : randomInt(1, bedrooms + 1);
  
  const monthlyRent = generateRent(location.city, bedrooms);
  const securityDeposit = monthlyRent * randomChoice([1, 1.5, 2]);
  
  const leaseStartDate = randomDate(
    new Date(2023, 0, 1),
    new Date(2024, 11, 31)
  );
  const leaseEndDate = new Date(leaseStartDate);
  leaseEndDate.setFullYear(leaseEndDate.getFullYear() + 1);
  
  const propertyAddress = generateAddress(location, neighborhood);
  const squareFootage = generateSquareFootage(bedrooms);
  
  // Select random amenities (3-6)
  const numAmenities = randomInt(3, 6);
  const selectedAmenities = [];
  const amenitiesCopy = [...amenities];
  for (let i = 0; i < numAmenities; i++) {
    const index = randomInt(0, amenitiesCopy.length - 1);
    selectedAmenities.push(amenitiesCopy.splice(index, 1)[0]);
  }
  
  const marketAnalysis = {
    rent_percentile: randomInt(30, 90),
    deposit_status: securityDeposit > monthlyRent * 1.5 ? 'Above Average' : 'Standard',
    rent_analysis: `This rental is priced at the ${randomInt(30, 90)}th percentile for ${bedrooms === 0 ? 'studio' : bedrooms + ' bedroom'} apartments in ${neighborhood}.`
  };
  
  return {
    pdf_url: '',
    user_address: propertyAddress,
    building_name: randomChoice(buildingNames),
    property_address: propertyAddress,
    monthly_rent: monthlyRent,
    security_deposit: securityDeposit,
    lease_start_date: formatDate(leaseStartDate),
    lease_end_date: formatDate(leaseEndDate),
    notice_period_days: randomChoice([30, 60, 90]),
    property_type: bedrooms === 0 ? 'Studio' : randomChoice(propertyTypes),
    square_footage: squareFootage,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    parking_spaces: randomChoice([0, 0, 1, 1, 2]),
    pet_policy: randomChoice(petPolicies),
    utilities_included: randomChoice(utilitiesOptions),
    amenities: selectedAmenities,
    landlord_name: randomChoice(landlordNames),
    management_company: randomChoice(managementCompanies),
    contact_email: `contact@${randomChoice(managementCompanies).toLowerCase().replace(/\s+/g, '')}.com`,
    contact_phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
    lease_terms: [
      `Rent due on the 1st of each month`,
      `Late fee of $50 after 5 days`,
      `${randomInt(30, 90)} days notice required for termination`,
      `Security deposit refundable within 30 days`,
      `Tenant responsible for utilities not included`
    ],
    special_clauses: [
      `Renters insurance required with minimum $100,000 liability`,
      randomChoice(['Smoking prohibited', 'Smoking allowed on balcony only']),
      'Subletting requires written approval'
    ],
    market_analysis: marketAnalysis,
    red_flags: []
  };
}

async function insertMockData(count = 50) {
  console.log(`Generating ${count} mock lease records...`);
  
  const leases = [];
  for (let i = 0; i < count; i++) {
    leases.push(await generateMockLease());
  }
  
  console.log('Inserting data into Supabase...');
  
  const { data, error } = await supabase
    .from('lease_data')
    .insert(leases)
    .select();
  
  if (error) {
    console.error('Error inserting data:', error);
    return;
  }
  
  console.log(`✅ Successfully inserted ${data.length} lease records!`);
  console.log('\nSample record:');
  console.log(JSON.stringify(data[0], null, 2));
}

// Run the script
const count = process.argv[2] ? parseInt(process.argv[2]) : 50;
insertMockData(count).catch(console.error);

