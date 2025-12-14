// Test script to check the API response format
const axios = require('axios');

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

async function testAmharicReportsAPI() {
  try {
    console.log('Testing Amharic reports API...');
    
    // You'll need to get a valid JWT token first
    // For now, let's just test the endpoint structure
    
    const response = await axios.get(`${API_URL}/annual-plans/activity-reports/all`, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    
    console.log('API Response:');
    console.log('Status:', response.status);
    console.log('Data length:', response.data.length);
    console.log('Sample data structure:');
    
    if (response.data.length > 0) {
      const sample = response.data[0];
      console.log('Sample report structure:');
      console.log({
        branch_name: sample.branch_name,
        plan_title: sample.plan_title,
        plan_title_amharic: sample.plan_title_amharic,
        activities: sample.activities ? 'Array with ' + sample.activities.length + ' items' : 'Not found',
        activitiesSample: sample.activities ? sample.activities[0] : 'No activities'
      });
    } else {
      console.log('No data returned from API');
    }
    
  } catch (error) {
    console.error('API Test Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response data:', error.response?.data);
  }
}

// Run the test
testAmharicReportsAPI();