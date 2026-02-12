import { api } from '../frontend/src/api/client'

// Simulate creating a task
async function testTaskCreate() {
  try {
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test' // You'll need a real token
      },
      body: JSON.stringify({
        title: 'Test task',
        description: 'Testing',
        priority: 'MEDIA'
      })
    })
    
    const text = await response.text()
    console.log('Status:', response.status)
    console.log('Response text:', text)
    console.log('Response text length:', text.length)
    
    try {
      const json = JSON.parse(text)
      console.log('Parsed JSON:', json)
    } catch (e) {
      console.log('Failed to parse JSON:', e.message)
      console.log('First 200 chars:', text.substring(0, 200))
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testTaskCreate()
