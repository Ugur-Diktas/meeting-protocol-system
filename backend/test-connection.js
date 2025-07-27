require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  const { data, error } = await supabase
    .from('groups')
    .select('*');
  
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('Connection successful!');
  }
}

testConnection();