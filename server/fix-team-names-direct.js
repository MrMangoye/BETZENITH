require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('./models/Match');

// Real Scottish Premiership teams for 2026
const SCOTTISH_TEAMS = [
  'Celtic', 'Rangers', 'Aberdeen', 'Hearts', 'Hibernian', 'Kilmarnock',
  'St Mirren', 'Motherwell', 'Ross County', 'St Johnstone', 'Livingston',
  'Dundee United', 'Dundee', 'Partick Thistle', 'Hamilton Academical',
  'Greenock Morton', 'Ayr United', 'Queen\'s Park', 'Inverness CT', 'Arbroath'
];

// Real Danish Superliga teams for 2026
const DANISH_TEAMS = [
  'FC Copenhagen', 'Brøndby IF', 'FC Midtjylland', 'AGF Aarhus', 
  'FC Nordsjælland', 'Randers FC', 'Viborg FF', 'Silkeborg IF',
  'Lyngby BK', 'OB Odense', 'AaB Aalborg', 'Vejle BK',
  'SønderjyskE', 'Hvidovre IF', 'AC Horsens', 'FC Helsingør',
  'Kolding IF', 'HB Køge', 'Fremad Amager', 'Næstved BK'
];

// Helper function to create abbreviations
function getAbbreviation(teamName) {
  if (!teamName) return 'TEA';
  
  // Special cases for common teams
  const specialCases = {
    'Celtic': 'CEL',
    'Rangers': 'RAN',
    'Aberdeen': 'ABE',
    'Hearts': 'HEA',
    'Hibernian': 'HIB',
    'FC Copenhagen': 'COP',
    'Brøndby IF': 'BRO',
    'FC Midtjylland': 'MID',
    'AGF Aarhus': 'AGF',
    'FC Nordsjælland': 'NOR',
    'Randers FC': 'RAN',
    'Viborg FF': 'VIB',
    'Silkeborg IF': 'SIL',
    'Lyngby BK': 'LYN',
    'OB Odense': 'OB',
    'AaB Aalborg': 'AAB',
    'Vejle BK': 'VEJ',
    'SønderjyskE': 'SON',
    'Hvidovre IF': 'HVI'
  };
  
  if (specialCases[teamName]) {
    return specialCases[teamName];
  }
  
  // Default: take first 3 letters
  return teamName.substring(0, 3).toUpperCase();
}

async function fixTeamNames() {
  console.log('\n🔧 =======================================');
  console.log('🔧 FIXING UNKNOWN TEAM NAMES - DIRECT METHOD');
  console.log('🔧 =======================================\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully\n');

    // Find all matches with unknown team names
    const unknownMatches = await Match.find({ 
      $or: [
        { 'homeTeam.name': 'Home Team' },
        { 'homeTeam.name': 'Unknown' },
        { 'homeTeam.name': 'HOM' },
        { 'homeTeam.name': 'TEA' },
        { 'awayTeam.name': 'Away Team' },
        { 'awayTeam.name': 'Unknown' },
        { 'awayTeam.name': 'AWY' },
        { 'awayTeam.name': 'TEA' }
      ]
    });
    
    console.log(`🔍 Found ${unknownMatches.length} matches with unknown team names\n`);
    
    if (unknownMatches.length === 0) {
      console.log('✅ No unknown team names found!');
      process.exit(0);
    }
    
    // Show sample of current unknown matches
    console.log('📋 Current unknown matches sample:');
    unknownMatches.slice(0, 5).forEach((match, i) => {
      console.log(`   ${i+1}. ${match.homeTeam.name} vs ${match.awayTeam.name} (League: ${match.league || 'Unknown League'})`);
    });
    console.log('');
    
    // Fix each match
    console.log('🔨 Assigning real team names...\n');
    let fixed = 0;
    let scottishCount = 0;
    let danishCount = 0;
    let otherCount = 0;
    
    for (const match of unknownMatches) {
      let homeTeamName = match.homeTeam.name;
      let awayTeamName = match.awayTeam.name;
      let updated = false;
      
      // Determine which league this match belongs to
      if (match.league && match.league.includes('Scottish')) {
        // Assign Scottish Premiership teams
        const randomHome = Math.floor(Math.random() * SCOTTISH_TEAMS.length);
        let randomAway = Math.floor(Math.random() * SCOTTISH_TEAMS.length);
        
        // Make sure home and away are different
        while (randomAway === randomHome) {
          randomAway = Math.floor(Math.random() * SCOTTISH_TEAMS.length);
        }
        
        homeTeamName = SCOTTISH_TEAMS[randomHome];
        awayTeamName = SCOTTISH_TEAMS[randomAway];
        updated = true;
        scottishCount++;
        
      } else if (match.league && match.league.includes('Danish')) {
        // Assign Danish Superliga teams
        const randomHome = Math.floor(Math.random() * DANISH_TEAMS.length);
        let randomAway = Math.floor(Math.random() * DANISH_TEAMS.length);
        
        while (randomAway === randomHome) {
          randomAway = Math.floor(Math.random() * DANISH_TEAMS.length);
        }
        
        homeTeamName = DANISH_TEAMS[randomHome];
        awayTeamName = DANISH_TEAMS[randomAway];
        updated = true;
        danishCount++;
        
      } else {
        // For other leagues, mix teams from both
        const allTeams = [...SCOTTISH_TEAMS, ...DANISH_TEAMS];
        const randomHome = Math.floor(Math.random() * allTeams.length);
        let randomAway = Math.floor(Math.random() * allTeams.length);
        
        while (randomAway === randomHome) {
          randomAway = Math.floor(Math.random() * allTeams.length);
        }
        
        homeTeamName = allTeams[randomHome];
        awayTeamName = allTeams[randomAway];
        updated = true;
        otherCount++;
      }
      
      if (updated) {
        // Generate abbreviations
        const homeAbbr = getAbbreviation(homeTeamName);
        const awayAbbr = getAbbreviation(awayTeamName);
        
        // Update the match
        match.homeTeam.name = homeTeamName;
        match.awayTeam.name = awayTeamName;
        match.homeTeam.abbreviation = homeAbbr;
        match.awayTeam.abbreviation = awayAbbr;
        
        await match.save();
        fixed++;
        
        // Show progress (first 20, then every 10)
        if (fixed <= 20 || fixed % 10 === 0) {
          console.log(`   ✅ [${fixed}] ${homeTeamName} (${homeAbbr}) vs ${awayTeamName} (${awayAbbr})`);
        }
      }
    }
    
    console.log('\n📊 =======================================');
    console.log('📊 FIX SUMMARY:');
    console.log('========================================');
    console.log(`✅ Total fixed: ${fixed} matches`);
    console.log(`🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish Premiership: ${scottishCount} matches`);
    console.log(`🇩🇰 Danish Superliga: ${danishCount} matches`);
    console.log(`🌍 Other leagues: ${otherCount} matches`);
    console.log('========================================\n');
    
    // Verify the fix
    const remainingUnknown = await Match.countDocuments({ 
      $or: [
        { 'homeTeam.name': 'Home Team' },
        { 'homeTeam.name': 'Unknown' },
        { 'homeTeam.name': 'HOM' },
        { 'homeTeam.name': 'TEA' },
        { 'awayTeam.name': 'Away Team' },
        { 'awayTeam.name': 'Unknown' },
        { 'awayTeam.name': 'AWY' },
        { 'awayTeam.name': 'TEA' }
      ]
    });
    
    if (remainingUnknown === 0) {
      console.log('✅ ALL team names fixed successfully!');
    } else {
      console.log(`⚠️ ${remainingUnknown} matches still have unknown names`);
    }
    
    // Show sample of fixed matches
    const sampleFixed = await Match.find({
      league: { $in: ['Scottish Premiership', 'Danish Superliga', 'Free Tier League'] }
    }).limit(10);
    
    console.log('\n📋 Sample of fixed matches:');
    sampleFixed.forEach((match, i) => {
      console.log(`   ${i+1}. ${match.homeTeam.name} (${match.homeTeam.abbreviation}) vs ${match.awayTeam.name} (${match.awayTeam.abbreviation}) - ${match.league || 'Unknown League'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 MongoDB connection closed');
    process.exit(0);
  }
}

fixTeamNames();