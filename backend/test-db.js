const { db } = require('./models');

async function testConnection() {
  try {
    // This will fail but proves the connection works
    await db.groups.findById('test-id');
  } catch (error) {
    if (error.message.includes('PGRST116')) {
      console.log('✅ Database connection successful!');
      console.log('(No group found with test-id, which is expected)');
    } else {
      console.log('❌ Connection error:', error.message);
    }
  }
}

testConnection();