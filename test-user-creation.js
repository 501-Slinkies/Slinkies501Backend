// Test script for user account creation endpoint
// Run this after starting the server to test the /api/users endpoint

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test 1: Create user with minimal required fields
async function testMinimalUserCreation() {
  console.log('\n=== Test 1: Minimal User Creation ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/users`, {
      first_name: 'John',
      last_name: 'Doe',
      email_address: 'john.doe.test@example.com',
      password: 'SecurePass123!@#',
      primary_phone: '5551234567'
    });

    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log('❌ Failed:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
    return null;
  }
}

// Test 2: Create user with complete volunteer profile
async function testCompleteUserCreation() {
  console.log('\n=== Test 2: Complete Volunteer Profile ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/users`, {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email_address: 'sarah.johnson.test@example.com',
      password: 'SecurePass456!@#',
      primary_phone: '5857633179',
      user_ID: 'SJohnson',
      contact_type_preference: 'email',
      city: 'Rochester',
      state: 'NY',
      street_address: '123 Main Street',
      zip: '14610',
      month_year_of_birth: '3/1985',
      type_of_vehicle: 'sedan',
      color: 'blue',
      seat_height_from_ground: 24,
      max_rides_week: 3,
      mileage_reimbursement: true,
      driver_availability_by_day_and_time: 'M09;M12;W09;W12;F09;F12',
      emergency_contact_name: 'Michael Johnson',
      emergency_contact_phone: '5851234567',
      relationship_to_volunteer: 'husband',
      when_trained_by_lifespan: '1/15/2025',
      when_oriented_to_position: '2/1/2025',
      date_began_volunteering: '2/15/2025',
      how_did_they_hear_about_us: 'Friend referral'
    });

    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log('❌ Failed:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
    return null;
  }
}

// Test 3: Missing required fields
async function testMissingFields() {
  console.log('\n=== Test 3: Missing Required Fields (Should Fail) ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/users`, {
      first_name: 'Jane',
      last_name: 'Smith'
      // Missing email_address, password, primary_phone
    });

    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test 4: Weak password
async function testWeakPassword() {
  console.log('\n=== Test 4: Weak Password (Should Fail) ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/users`, {
      first_name: 'Bob',
      last_name: 'Wilson',
      email_address: 'bob.wilson.test@example.com',
      password: 'weak', // Too weak
      primary_phone: '5559876543'
    });

    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test 5: Invalid email format
async function testInvalidEmail() {
  console.log('\n=== Test 5: Invalid Email Format (Should Fail) ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/users`, {
      first_name: 'Alice',
      last_name: 'Brown',
      email_address: 'invalid-email', // Invalid format
      password: 'SecurePass789!@#',
      primary_phone: '5554567890'
    });

    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test 6: Duplicate email
async function testDuplicateEmail(existingEmail) {
  console.log('\n=== Test 6: Duplicate Email (Should Fail) ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/users`, {
      first_name: 'Another',
      last_name: 'User',
      email_address: existingEmail, // Use email from first test
      password: 'SecurePass999!@#',
      primary_phone: '5556543210'
    });

    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('==========================================');
  console.log('User Account Creation Endpoint Tests');
  console.log('==========================================');
  console.log('Server URL:', BASE_URL);
  console.log('Testing endpoint: POST /api/users');
  console.log('==========================================');

  // Test successful creations
  const result1 = await testMinimalUserCreation();
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  
  const result2 = await testCompleteUserCreation();
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test validations (should fail)
  await testMissingFields();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testWeakPassword();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testInvalidEmail();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test duplicate (should fail)
  if (result1) {
    await testDuplicateEmail('john.doe.test@example.com');
  }

  console.log('\n==========================================');
  console.log('Tests Complete!');
  console.log('==========================================\n');
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };

