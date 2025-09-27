// Set up a login User 

const dataAccess = require('./DataAccessLayer');

async function loginUser(email, password, role) {
  const user = await dataAccess.login(email, password, role);
  if (user) {
    // In a real application, you would generate a JWT token here
    // and send it back to the user for session management.
    console.log('Login successful for user:', user.email);
    return { success: true, user: { email: user.email, role: user.role } };
  } else {
    console.log('Login failed');
    return { success: false, message: 'Invalid credentials or role' };
  }
}

module.exports = { loginUser };
