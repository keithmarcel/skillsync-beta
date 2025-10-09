// Test script for BLS 2024 Regional Data
// Tests the BLS API directly with regional priority

require('dotenv').config({ path: '.env.local' })

async function testRegionalData() {
  console.log('🧪 Testing BLS 2024 Regional Data API\n')
  console.log('=' .repeat(60))
  
  const apiKey = process.env.BLS_API_KEY
  if (!apiKey) {
    console.error('❌ BLS_API_KEY not found in environment')
    process.exit(1)
  }
  
  console.log(`✅ API Key found: ${apiKey.substring(0, 8)}...`)
  
  const oewsUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data'
  const tampaMSA = '45300'
  const floridaState = '12'
  
  // Test SOC codes (common occupations in Tampa Bay)
  const testCodes = [
    { code: '13-2011', name: 'Accountants and Auditors' },
    { code: '15-1252', name: 'Software Developers' },
    { code: '29-1141', name: 'Registered Nurses' },
    { code: '11-1021', name: 'General and Operations Managers' }
  ]
  
  console.log('\n📊 Testing Regional Data Priority:')
  console.log('   1. Tampa-St. Petersburg-Clearwater MSA')
  console.log('   2. Florida State')
  console.log('   3. National\n')
  
  for (const occupation of testCodes) {
    console.log(`\n🔍 Testing: ${occupation.name} (${occupation.code})`)
    console.log('-'.repeat(60))
    
    try {
      // Format SOC code for BLS
      const formattedSOC = occupation.code.replace(/[.-]/g, '').padStart(7, '0')
      
      // Try Tampa MSA first
      const tampaSeries = `OEUM${tampaMSA}000000${formattedSOC}04`
      console.log(`   Trying Tampa MSA: ${tampaSeries}`)
      
      const requestBody = {
        seriesid: [tampaSeries],
        startyear: '2023',
        endyear: '2024',
        registrationkey: apiKey
      }
      
      const response = await fetch(oewsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      
      if (data.status === 'REQUEST_SUCCEEDED' && data.Results?.series?.[0]?.data?.length) {
        const series = data.Results.series[0]
        const latestData = series.data[0]
        
        console.log('✅ Data Retrieved Successfully!')
        console.log(`   Area: Tampa-St. Petersburg-Clearwater, FL`)
        console.log(`   Median Wage: $${parseFloat(latestData.value).toLocaleString()}`)
        console.log(`   Data Year: ${latestData.year}`)
        console.log(`   Period: ${latestData.period}`)
        console.log('   🎯 SUCCESS: Got Tampa Bay MSA data!')
      } else {
        console.log('   ⚠️  Tampa MSA data not available, trying Florida...')
        
        // Try Florida state
        const floridaSeries = `OEUS${floridaState}0000000${formattedSOC}04`
        const floridaRequest = {
          seriesid: [floridaSeries],
          startyear: '2023',
          endyear: '2024',
          registrationkey: apiKey
        }
        
        const floridaResponse = await fetch(oewsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(floridaRequest)
        })
        
        const floridaData = await floridaResponse.json()
        
        if (floridaData.status === 'REQUEST_SUCCEEDED' && floridaData.Results?.series?.[0]?.data?.length) {
          const series = floridaData.Results.series[0]
          const latestData = series.data[0]
          
          console.log('✅ Florida State Data Retrieved!')
          console.log(`   Area: Florida`)
          console.log(`   Median Wage: $${parseFloat(latestData.value).toLocaleString()}`)
          console.log(`   Data Year: ${latestData.year}`)
        } else {
          console.log('   ⚠️  Florida data not available either')
          console.log(`   API Response: ${data.message || floridaData.message || 'No message'}`)
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    
    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Test Complete!\n')
}

// Run the test
testRegionalData().catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})
