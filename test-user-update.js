// Test script for user account update endpoint
// Run this after starting the server to test the PUT /api/users/:userID endpoint

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// First, create a test user to update
async function createTestUser() {
  console.log('\n=== Creating Test User ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/users`, {
      first_name: 'Update',
      last_name: 'Test',
      email_address: 'update.test@example.com',
      password: 'OriginalPass123!@#',
      primary_phone: '5551234567',
      city: 'Rochester',
      state: 'NY',
      max_rides_week: 3
    });

    console.log('✅ Test user created:', response.data.data.userID);
    return response.data.data.userID;
  } catch (error) {
    if (error.response) {
      console.log('Note:', error.response.data.message);
      // User might already exist, try to continue with existing user
      return 'UTest';
    } else {
      console.log('❌ Error:', error.message);
      return null;
    }
  }
}

// Test 1: Update basic profile information
async function testBasicUpdate(userID) {
  console.log('\n=== Test 1: Update Basic Profile ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      city: 'Brighton',
      state: 'NY',
      max_rides_week: 5
    });

    console.log('✅ Success:', response.data.message);
    console.log('Updated fields:', {
      city: response.data.data.user.city,
      state: response.data.data.user.state,
      max_rides_week: response.data.data.user.max_rides_week
    });
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

// Test 2: Update single field
async function testSingleFieldUpdate(userID) {
  console.log('\n=== Test 2: Update Single Field ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      max_rides_week: 7
    });

    console.log('✅ Success:', response.data.message);
    console.log('Updated max_rides_week:', response.data.data.user.max_rides_week);
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

// Test 3: Update password
async function testPasswordUpdate(userID) {
  console.log('\n=== Test 3: Update Password ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      password: 'NewSecurePass456!@#'
    });

    console.log('✅ Success:', response.data.message);
    console.log('Note: Password updated and hashed in database');
    // Verify password is NOT in response
    console.log('Password in response:', response.data.data.user.password ? 'EXPOSED ❌' : 'Not exposed ✅');
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

// Test 4: Update email address
async function testEmailUpdate(userID) {
  console.log('\n=== Test 4: Update Email Address ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      email_address: 'update.test.new@example.com'
    });

    console.log('✅ Success:', response.data.message);
    console.log('New email:', response.data.data.user.email_address);
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

// Test 5: Update volunteer availability
async function testAvailabilityUpdate(userID) {
  console.log('\n=== Test 5: Update Volunteer Availability ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      driver_availability_by_day_and_time: 'M09;M12;W09;W12;F09;F15',
      max_rides_week: 8
    });

    console.log('✅ Success:', response.data.message);
    console.log('New availability:', response.data.data.user.driver_availability_by_day_and_time);
    console.log('New max rides:', response.data.data.user.max_rides_week);
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

// Test 6: Update emergency contact
async function testEmergencyContactUpdate(userID) {
  console.log('\n=== Test 6: Update Emergency Contact ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      emergency_contact_name: 'Jane Test',
      emergency_contact_phone: '5559876543',
      relationship_to_volunteer: 'spouse'
    });

    console.log('✅ Success:', response.data.message);
    console.log('Emergency contact:', {
      name: response.data.data.user.emergency_contact_name,
      phone: response.data.data.user.emergency_contact_phone,
      relationship: response.data.data.user.relationship_to_volunteer
    });
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

// Test 7: No fields provided (should fail)
async function testNoFieldsUpdate(userID) {
  console.log('\n=== Test 7: No Fields Provided (Should Fail) ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {});

    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:', error.response.data.message);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test 8: Invalid email format (should fail)
async function testInvalidEmailUpdate(userID) {
  console.log('\n=== Test 8: Invalid Email Format (Should Fail) ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      email_address: 'invalid-email-format'
    });

    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:', error.response.data.message);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test 9: Weak password (should fail)
async function testWeakPasswordUpdate(userID) {
  console.log('\n=== Test 9: Weak Password (Should Fail) ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      password: 'weak'
    });

    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:', error.response.data.message);
      if (error.response.data.errors) {
        console.log('Validation errors:', error.response.data.errors);
      }
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test 10: Update non-existent user (should fail)
async function testNonExistentUserUpdate() {
  console.log('\n=== Test 10: Update Non-Existent User (Should Fail) ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/NonExistentUser`, {
      city: 'Rochester'
    });

    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:', error.response.data.message);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test 11: Multiple field update
async function testMultipleFieldUpdate(userID) {
  console.log('\n=== Test 11: Update Multiple Fields ===');
  try {
    const response = await axios.put(`${BASE_URL}/api/users/${userID}`, {
      first_name: 'UpdatedName',
      city: 'Rochester',
      state: 'NY',
      street_address: '456 Updated Street',
      zip: '14620',
      type_of_vehicle: 'suv',
      color: 'blue',
      max_rides_week: 10,
      mileage_reimbursement: true
    });

    console.log('✅ Success:', response.data.message);
    console.log('Updated user:', {
      first_name: response.data.data.user.first_name,
      city: response.data.data.user.city,
      type_of_vehicle: response.data.data.user.type_of_vehicle,
      max_rides_week: response.data.data.user.max_rides_week
    });
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

// Run all tests
async function runAllTests() {
  console.log('==========================================');
  console.log('User Account Update Endpoint Tests');
  console.log('==========================================');
  console.log('Server URL:', BASE_URL);
  console.log('Testing endpoint: PUT /api/users/:userID');
  console.log('==========================================');

  // Create test user
  const userID = await createTestUser();
  if (!userID) {
    console.log('\n❌ Cannot continue without test user');
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test successful updates
  await testBasicUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testSingleFieldUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testPasswordUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testEmailUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testAvailabilityUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testEmergencyContactUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testMultipleFieldUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test validations (should fail)
  await testNoFieldsUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testInvalidEmailUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testWeakPasswordUpdate(userID);
  await new Promise(resolve => setTimeout(resolve, 500));

  await testNonExistentUserUpdate();

  console.log('\n==========================================');
  console.log('Tests Complete!');
  console.log('==========================================');
  console.log('\nNote: Check Firestore to verify:');
  console.log('1. User document was updated');
  console.log('2. updated_at timestamp was set');
  console.log('3. Password was hashed (if updated)');
  console.log('4. Audit logs were created');
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

