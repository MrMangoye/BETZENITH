// server/data/mockMatches.js

// Helper function to generate random scores
const randomScore = (max) => Math.floor(Math.random() * max);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// League configurations with multiple teams
const leagues = {
  // ============ SOCCER LEAGUES ============
  'Premier League': {
    country: 'England',
    sport: 'soccer',
    teams: [
      'Manchester United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City',
      'Tottenham', 'Newcastle', 'Aston Villa', 'Brighton', 'West Ham',
      'Brentford', 'Fulham', 'Crystal Palace', 'Wolves', 'Nottingham Forest',
      'Everton', 'Bournemouth', 'Sheffield United', 'Burnley', 'Luton Town'
    ],
    abbreviations: ['MUN', 'LIV', 'ARS', 'CHE', 'MCI', 'TOT', 'NEW', 'AVL', 'BHA', 'WHU',
                    'BRE', 'FUL', 'CRY', 'WOL', 'NFO', 'EVE', 'BOU', 'SHU', 'BUR', 'LUT']
  },
  'La Liga': {
    country: 'Spain',
    sport: 'soccer',
    teams: [
      'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad',
      'Athletic Bilbao', 'Valencia', 'Villarreal', 'Betis', 'Getafe',
      'Osasuna', 'Celta Vigo', 'Almeria', 'Mallorca', 'Rayo Vallecano',
      'Granada', 'Cadiz', 'Las Palmas', 'Alaves', 'Girona'
    ],
    abbreviations: ['RMA', 'BAR', 'ATM', 'SEV', 'RSO', 'ATH', 'VAL', 'VIL', 'BET', 'GET',
                    'OSA', 'CEL', 'ALM', 'MLL', 'RAY', 'GRA', 'CAD', 'LPA', 'ALA', 'GIR']
  },
  'Bundesliga': {
    country: 'Germany',
    sport: 'soccer',
    teams: [
      'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
      'Eintracht Frankfurt', 'Wolfsburg', 'Monchengladbach', 'Stuttgart',
      'Hoffenheim', 'Mainz', 'Augsburg', 'Cologne', 'Werder Bremen',
      'Union Berlin', 'Bochum', 'Darmstadt', 'Heidenheim', 'Freiburg'
    ],
    abbreviations: ['BAY', 'DOR', 'RBL', 'LEV', 'SGE', 'WOL', 'BMG', 'STU',
                    'HOF', 'MAI', 'AUG', 'KOL', 'BRE', 'UNB', 'BOC', 'DAR', 'HEI', 'FRE']
  },
  'Serie A': {
    country: 'Italy',
    sport: 'soccer',
    teams: [
      'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma', 'Lazio',
      'Atalanta', 'Fiorentina', 'Torino', 'Bologna', 'Monza', 'Genoa',
      'Lecce', 'Sassuolo', 'Udinese', 'Empoli', 'Salernitana', 'Cagliari',
      'Verona', 'Frosinone'
    ],
    abbreviations: ['JUV', 'INT', 'MIL', 'NAP', 'ROM', 'LAZ', 'ATA', 'FIO', 'TOR', 'BOL',
                    'MNZ', 'GEN', 'LEC', 'SAS', 'UDI', 'EMP', 'SAL', 'CAG', 'VER', 'FRO']
  },
  'Ligue 1': {
    country: 'France',
    sport: 'soccer',
    teams: [
      'PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Rennes',
      'Nice', 'Lens', 'Strasbourg', 'Montpellier', 'Nantes',
      'Reims', 'Toulouse', 'Brest', 'Clermont', 'Lorient',
      'Metz', 'Le Havre'
    ],
    abbreviations: ['PSG', 'MAR', 'MON', 'LYO', 'LIL', 'REN', 'NIC', 'LEN', 'STR', 'MPL',
                    'NAN', 'REI', 'TLS', 'BRE', 'CLE', 'LOR', 'MET', 'LEH']
  },
  'Champions League': {
    country: 'Europe',
    sport: 'soccer',
    teams: [
      'Real Madrid', 'Manchester City', 'Bayern Munich', 'PSG', 'Liverpool',
      'Inter Milan', 'Barcelona', 'Arsenal', 'Atletico Madrid', 'Borussia Dortmund',
      'RB Leipzig', 'Porto', 'Napoli', 'Lazio', 'Real Sociedad',
      'PSV', 'Copenhagen', 'Galatasaray', 'Shakhtar', 'Benfica'
    ],
    abbreviations: ['RMA', 'MCI', 'BAY', 'PSG', 'LIV', 'INT', 'BAR', 'ARS', 'ATM', 'DOR',
                    'RBL', 'POR', 'NAP', 'LAZ', 'RSO', 'PSV', 'COP', 'GAL', 'SHA', 'BEN']
  },

  // ============ BASKETBALL LEAGUES ============
  'NBA': {
    country: 'USA',
    sport: 'basketball',
    teams: [
      'LA Lakers', 'Golden State Warriors', 'Boston Celtics', 'Miami Heat',
      'Milwaukee Bucks', 'Philadelphia 76ers', 'Phoenix Suns', 'Denver Nuggets',
      'LA Clippers', 'Dallas Mavericks', 'New York Knicks', 'Chicago Bulls',
      'Cleveland Cavaliers', 'Memphis Grizzlies', 'Sacramento Kings',
      'Minnesota Timberwolves', 'Oklahoma City Thunder', 'Atlanta Hawks',
      'Toronto Raptors', 'Brooklyn Nets', 'New Orleans Pelicans',
      'Indiana Pacers', 'Utah Jazz', 'San Antonio Spurs', 'Portland Trail Blazers',
      'Orlando Magic', 'Houston Rockets', 'Washington Wizards', 'Detroit Pistons',
      'Charlotte Hornets'
    ],
    abbreviations: ['LAL', 'GSW', 'BOS', 'MIA', 'MIL', 'PHI', 'PHX', 'DEN', 'LAC', 'DAL',
                    'NYK', 'CHI', 'CLE', 'MEM', 'SAC', 'MIN', 'OKC', 'ATL', 'TOR', 'BKN',
                    'NOP', 'IND', 'UTA', 'SAS', 'POR', 'ORL', 'HOU', 'WAS', 'DET', 'CHA']
  },
  'EuroLeague': {
    country: 'Europe',
    sport: 'basketball',
    teams: [
      'Real Madrid', 'Barcelona', 'Olympiacos', 'Fenerbahce', 'Panathinaikos',
      'Maccabi Tel Aviv', 'Monaco', 'ASVEL', 'Bayern Munich', 'Alba Berlin',
      'Virtus Bologna', 'Olimpia Milano', 'Zalgiris', 'Partizan', 'Crvena Zvezda',
      'Anadolu Efes', 'Valencia', 'Baskonia'
    ],
    abbreviations: ['RMA', 'BAR', 'OLY', 'FEN', 'PAO', 'MTA', 'MON', 'ASV', 'BAY', 'BER',
                    'VIR', 'MIL', 'ZAL', 'PAR', 'CZV', 'EFE', 'VAL', 'BAS']
  },

  // ============ AMERICAN FOOTBALL ============
  'NFL': {
    country: 'USA',
    sport: 'football',
    teams: [
      'Kansas City Chiefs', 'San Francisco 49ers', 'Baltimore Ravens', 'Buffalo Bills',
      'Philadelphia Eagles', 'Dallas Cowboys', 'Miami Dolphins', 'Detroit Lions',
      'Cincinnati Bengals', 'Cleveland Browns', 'Jacksonville Jaguars',
      'Pittsburgh Steelers', 'Houston Texans', 'Indianapolis Colts',
      'Tennessee Titans', 'Denver Broncos', 'Las Vegas Raiders',
      'Los Angeles Chargers', 'New York Jets', 'New England Patriots',
      'Atlanta Falcons', 'New Orleans Saints', 'Tampa Bay Buccaneers',
      'Carolina Panthers', 'Chicago Bears', 'Green Bay Packers',
      'Minnesota Vikings', 'Seattle Seahawks', 'Los Angeles Rams',
      'Arizona Cardinals', 'New York Giants', 'Washington Commanders'
    ],
    abbreviations: ['KC', 'SF', 'BAL', 'BUF', 'PHI', 'DAL', 'MIA', 'DET', 'CIN', 'CLE',
                    'JAX', 'PIT', 'HOU', 'IND', 'TEN', 'DEN', 'LV', 'LAC', 'NYJ', 'NE',
                    'ATL', 'NO', 'TB', 'CAR', 'CHI', 'GB', 'MIN', 'SEA', 'LAR', 'ARI',
                    'NYG', 'WAS']
  },

  // ============ TENNIS ============
  'Wimbledon': {
    country: 'UK',
    sport: 'tennis',
    teams: [
      'Novak Djokovic', 'Carlos Alcaraz', 'Daniil Medvedev', 'Jannik Sinner',
      'Alexander Zverev', 'Andrey Rublev', 'Holger Rune', 'Stefanos Tsitsipas',
      'Casper Ruud', 'Taylor Fritz', 'Frances Tiafoe', 'Tommy Paul',
      'Ben Shelton', 'Lorenzo Musetti', 'Felix Auger-Aliassime', 'Hubert Hurkacz',
      'Grigor Dimitrov', 'Karen Khachanov', 'Alex de Minaur', 'Cameron Norrie'
    ],
    abbreviations: ['DJOK', 'ALCA', 'MED', 'SIN', 'ZVE', 'RUB', 'RUN', 'TSI',
                    'RUU', 'FRI', 'TIA', 'PAU', 'SHE', 'MUS', 'FAA', 'HUR',
                    'DIM', 'KHA', 'DEM', 'NOR']
  },
  'US Open': {
    country: 'USA',
    sport: 'tennis',
    teams: [
      'Iga Swiatek', 'Coco Gauff', 'Aryna Sabalenka', 'Elena Rybakina',
      'Jessica Pegula', 'Ons Jabeur', 'Marketa Vondrousova', 'Maria Sakkari',
      'Karolina Muchova', 'Barbora Krejcikova', 'Beatriz Haddad Maia',
      'Jelena Ostapenko', 'Liudmila Samsonova', 'Veronika Kudermetova',
      'Daria Kasatkina', 'Caroline Garcia', 'Madison Keys', 'Sloane Stephens',
      'Emma Navarro', 'Linda Noskova'
    ],
    abbreviations: ['SWI', 'GAU', 'SAB', 'RYB', 'PEG', 'JAB', 'VON', 'SAK',
                    'MUC', 'KRE', 'HAD', 'OST', 'SAM', 'KUD', 'KAS', 'GAR',
                    'KEY', 'STE', 'NAV', 'NOS']
  },

  // ============ BASEBALL ============
  'MLB': {
    country: 'USA',
    sport: 'baseball',
    teams: [
      'New York Yankees', 'Boston Red Sox', 'LA Dodgers', 'San Diego Padres',
      'Atlanta Braves', 'Philadelphia Phillies', 'Houston Astros',
      'Texas Rangers', 'Chicago Cubs', 'St. Louis Cardinals',
      'New York Mets', 'San Francisco Giants', 'Seattle Mariners',
      'Toronto Blue Jays', 'Tampa Bay Rays', 'Baltimore Orioles',
      'Minnesota Twins', 'Cleveland Guardians', 'Chicago White Sox',
      'Detroit Tigers', 'Kansas City Royals', 'Miami Marlins',
      'Cincinnati Reds', 'Milwaukee Brewers', 'Pittsburgh Pirates',
      'Colorado Rockies', 'Arizona Diamondbacks', 'Oakland Athletics',
      'Los Angeles Angels', 'Washington Nationals'
    ],
    abbreviations: ['NYY', 'BOS', 'LAD', 'SD', 'ATL', 'PHI', 'HOU', 'TEX',
                    'CHC', 'STL', 'NYM', 'SF', 'SEA', 'TOR', 'TB', 'BAL',
                    'MIN', 'CLE', 'CHW', 'DET', 'KC', 'MIA', 'CIN', 'MIL',
                    'PIT', 'COL', 'ARI', 'OAK', 'LAA', 'WAS']
  },

  // ============ HOCKEY ============
  'NHL': {
    country: 'USA/Canada',
    sport: 'hockey',
    teams: [
      'Toronto Maple Leafs', 'Montreal Canadiens', 'Boston Bruins',
      'New York Rangers', 'Pittsburgh Penguins', 'Chicago Blackhawks',
      'Edmonton Oilers', 'Vancouver Canucks', 'Calgary Flames',
      'Colorado Avalanche', 'Vegas Golden Knights', 'Tampa Bay Lightning',
      'Florida Panthers', 'Carolina Hurricanes', 'Dallas Stars',
      'Minnesota Wild', 'Winnipeg Jets', 'St. Louis Blues',
      'Nashville Predators', 'Los Angeles Kings', 'San Jose Sharks',
      'Anaheim Ducks', 'Seattle Kraken', 'Detroit Red Wings',
      'Buffalo Sabres', 'Ottawa Senators', 'Philadelphia Flyers',
      'Washington Capitals', 'Columbus Blue Jackets', 'New Jersey Devils',
      'New York Islanders', 'Arizona Coyotes'
    ],
    abbreviations: ['TOR', 'MTL', 'BOS', 'NYR', 'PIT', 'CHI', 'EDM', 'VAN',
                    'CGY', 'COL', 'VGK', 'TB', 'FLA', 'CAR', 'DAL', 'MIN',
                    'WPG', 'STL', 'NSH', 'LAK', 'SJS', 'ANA', 'SEA', 'DET',
                    'BUF', 'OTT', 'PHI', 'WSH', 'CBJ', 'NJD', 'NYI', 'ARI']
  },

  // ============ MMA ============
  'UFC': {
    country: 'USA',
    sport: 'mma',
    teams: [
      'Jon Jones', 'Stipe Miocic', 'Islam Makhachev', 'Alexander Volkanovski',
      'Sean O\'Malley', 'Aljamain Sterling', 'Leon Edwards', 'Kamaru Usman',
      'Israel Adesanya', 'Alex Pereira', 'Dricus du Plessis', 'Sean Strickland',
      'Charles Oliveira', 'Justin Gaethje', 'Max Holloway', 'Ilia Topuria',
      'Tom Aspinall', 'Ciryl Gane', 'Jiri Prochazka', 'Jamahal Hill',
      'Zhang Weili', 'Amanda Nunes', 'Valentina Shevchenko', 'Julianna Pena'
    ],
    abbreviations: ['JON', 'STI', 'MAK', 'VOL', 'OMA', 'STE', 'EDW', 'USM',
                    'ADE', 'PER', 'DUP', 'STR', 'OLI', 'GAE', 'HOL', 'TOP',
                    'ASP', 'GAN', 'PRO', 'HIL', 'ZHA', 'NUN', 'SHE', 'PEN']
  },

  // ============ BOXING ============
  'Heavyweight': {
    country: 'Global',
    sport: 'boxing',
    teams: [
      'Tyson Fury', 'Oleksandr Usyk', 'Anthony Joshua', 'Deontay Wilder',
      'Andy Ruiz Jr', 'Joe Joyce', 'Joseph Parker', 'Dillian Whyte',
      'Luis Ortiz', 'Michael Hunter', 'Otto Wallin', 'Derek Chisora',
      'Martin Bakole', 'Filip Hrgovic', 'Tony Yoka', 'Arslanbek Makhmudov'
    ],
    abbreviations: ['FURY', 'USYK', 'AJ', 'WIL', 'RUIZ', 'JOY', 'PAR', 'WHY',
                    'ORT', 'HUN', 'WAL', 'CHI', 'BAK', 'HRG', 'YOK', 'MAK']
  },

  // ============ GOLF ============
  'PGA Tour': {
    country: 'USA',
    sport: 'golf',
    teams: [
      'Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm', 'Brooks Koepka',
      'Cameron Smith', 'Patrick Cantlay', 'Xander Schauffele', 'Viktor Hovland',
      'Max Homa', 'Jordan Spieth', 'Justin Thomas', 'Collin Morikawa',
      'Matt Fitzpatrick', 'Shane Lowry', 'Tyrrell Hatton', 'Tony Finau',
      'Hideki Matsuyama', 'Sungjae Im', 'Tom Kim', 'Will Zalatoris',
      'Dustin Johnson', 'Phil Mickelson', 'Bryson DeChambeau', 'Patrick Reed'
    ],
    abbreviations: ['SCH', 'McI', 'RAH', 'KOE', 'SMI', 'CAN', 'XAN', 'HOV',
                    'HOM', 'SPI', 'THO', 'MOR', 'FIT', 'LOW', 'HAT', 'FIN',
                    'MAT', 'IM', 'KIM', 'ZAL', 'DJ', 'MICK', 'BDE', 'REE']
  },

  // ============ CRICKET ============
  'IPL': {
    country: 'India',
    sport: 'cricket',
    teams: [
      'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers',
      'Kolkata Knight Riders', 'Delhi Capitals', 'Punjab Kings',
      'Rajasthan Royals', 'Sunrisers Hyderabad', 'Lucknow Super Giants',
      'Gujarat Titans'
    ],
    abbreviations: ['MI', 'CSK', 'RCB', 'KKR', 'DC', 'PBKS', 'RR', 'SRH', 'LSG', 'GT']
  },

  // ============ RUGBY ============
  'Six Nations': {
    country: 'Europe',
    sport: 'rugby',
    teams: [
      'England', 'France', 'Ireland', 'Scotland', 'Wales', 'Italy',
      'New Zealand', 'South Africa', 'Australia', 'Argentina',
      'Fiji', 'Samoa', 'Japan', 'Georgia', 'Portugal', 'Romania'
    ],
    abbreviations: ['ENG', 'FRA', 'IRE', 'SCO', 'WAL', 'ITA', 'NZL', 'RSA',
                    'AUS', 'ARG', 'FIJ', 'SAM', 'JPN', 'GEO', 'POR', 'ROM']
  },

  // ============ F1 ============
  'Formula 1': {
    country: 'Global',
    sport: 'f1',
    teams: [
      'Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc', 'Lando Norris',
      'Carlos Sainz', 'Sergio Perez', 'George Russell', 'Oscar Piastri',
      'Fernando Alonso', 'Lance Stroll', 'Pierre Gasly', 'Esteban Ocon',
      'Alex Albon', 'Logan Sargeant', 'Valtteri Bottas', 'Zhou Guanyu',
      'Kevin Magnussen', 'Nico Hulkenberg', 'Daniel Ricciardo', 'Yuki Tsunoda'
    ],
    abbreviations: ['VER', 'HAM', 'LEC', 'NOR', 'SAI', 'PER', 'RUS', 'PIA',
                    'ALO', 'STR', 'GAS', 'OCO', 'ALB', 'SAR', 'BOT', 'ZHO',
                    'MAG', 'HUL', 'RIC', 'TSU']
  }
};

// Generate live matches
const generateLiveMatches = () => {
  const liveMatches = [];
  
  Object.entries(leagues).forEach(([leagueName, config]) => {
    const { sport, teams, abbreviations, country } = config;
    const numTeams = teams.length;
    
    // Generate 5-10 live matches per league
    const numMatches = randomInt(3, 8);
    
    for (let i = 0; i < numMatches; i++) {
      // Pick two random teams
      let homeIdx = randomInt(0, numTeams - 1);
      let awayIdx = randomInt(0, numTeams - 1);
      
      // Make sure they're different
      while (awayIdx === homeIdx) {
        awayIdx = randomInt(0, numTeams - 1);
      }
      
      const homeTeam = teams[homeIdx];
      const awayTeam = teams[awayIdx];
      const homeAbbr = abbreviations[homeIdx];
      const awayAbbr = abbreviations[awayIdx];
      
      // Random match status
      const statuses = ['LIVE', 'LIVE', 'LIVE', 'LIVE', 'FIRST_HALF', 'HALFTIME', 'SECOND_HALF', 'EXTRA_TIME'];
      const status = statuses[randomInt(0, statuses.length - 1)];
      
      // Random minute based on status
      let minute = 0;
      if (status === 'FIRST_HALF') minute = randomInt(5, 44);
      else if (status === 'HALFTIME') minute = 45;
      else if (status === 'SECOND_HALF') minute = randomInt(46, 89);
      else if (status === 'EXTRA_TIME') minute = randomInt(91, 119);
      else minute = randomInt(5, 89);
      
      // Random scores
      let homeScore = 0, awayScore = 0;
      
      if (sport === 'soccer') {
        homeScore = randomInt(0, 4);
        awayScore = randomInt(0, 4);
      } else if (sport === 'basketball') {
        homeScore = randomInt(60, 120);
        awayScore = randomInt(60, 120);
      } else if (sport === 'football') {
        homeScore = randomInt(0, 35);
        awayScore = randomInt(0, 35);
      } else if (sport === 'tennis') {
        homeScore = randomInt(0, 3);
        awayScore = randomInt(0, 2);
      } else if (sport === 'baseball') {
        homeScore = randomInt(0, 10);
        awayScore = randomInt(0, 10);
      } else if (sport === 'hockey') {
        homeScore = randomInt(0, 5);
        awayScore = randomInt(0, 5);
      } else if (sport === 'mma' || sport === 'boxing') {
        homeScore = randomInt(0, 1);
        awayScore = 0;
      } else if (sport === 'golf') {
        homeScore = randomInt(-15, 0);
        awayScore = randomInt(-12, 2);
      } else if (sport === 'cricket') {
        homeScore = `${randomInt(150, 250)}/${randomInt(3, 9)}`;
        awayScore = `${randomInt(120, 220)}/${randomInt(4, 8)}`;
      } else if (sport === 'rugby') {
        homeScore = randomInt(0, 40);
        awayScore = randomInt(0, 40);
      } else if (sport === 'f1') {
        homeScore = `1:${randomInt(30, 35)}.${randomInt(10, 99)}`;
        awayScore = `1:${randomInt(31, 36)}.${randomInt(10, 99)}`;
      }
      
      // Generate odds
      const homeOdds = (Math.random() * 3 + 1.2).toFixed(2);
      const drawOdds = sport === 'soccer' ? (Math.random() * 2 + 2.5).toFixed(2) : null;
      const awayOdds = (Math.random() * 3 + 1.2).toFixed(2);
      
      // Create match object
      const match = {
        id: `${sport}-${leagueName}-${i}-${Date.now()}`,
        sport: sport,
        league: leagueName,
        country: country,
        homeTeam: { 
          name: homeTeam, 
          abbreviation: homeAbbr,
          logo: null 
        },
        awayTeam: { 
          name: awayTeam, 
          abbreviation: awayAbbr,
          logo: null 
        },
        score: typeof homeScore === 'object' ? homeScore : { home: homeScore, away: awayScore },
        status: status,
        minute: minute,
        period: status === 'LIVE' ? `${Math.floor(minute/12 + 1)}st Quarter` : null,
        inning: sport === 'baseball' ? `${Math.floor(minute/10 + 1)}th` : null,
        set: sport === 'tennis' ? `${Math.floor(minute/15 + 1)}rd Set` : null,
        lap: sport === 'f1' ? randomInt(10, 50) : null,
        round: sport === 'mma' || sport === 'boxing' ? randomInt(1, 12) : null,
        overs: sport === 'cricket' ? `${randomInt(10, 20)}.${randomInt(0, 5)}` : null,
        startsAt: new Date().toISOString(),
        odds: {
          home: parseFloat(homeOdds),
          draw: drawOdds ? parseFloat(drawOdds) : null,
          away: parseFloat(awayOdds)
        },
        markets: [
          { name: '1', odds: parseFloat(homeOdds), isActive: true },
          ...(drawOdds ? [{ name: 'X', odds: parseFloat(drawOdds), isActive: true }] : []),
          { name: '2', odds: parseFloat(awayOdds), isActive: true },
          { name: 'O 2.5', odds: 1.95, isActive: true },
          { name: 'U 2.5', odds: 1.95, isActive: true },
          { name: 'BTTS', odds: 1.90, isActive: true }
        ],
        bettingVolume: randomInt(5000, 50000)
      };
      
      liveMatches.push(match);
    }
  });
  
  return liveMatches;
};

// Generate upcoming matches (scheduled for future dates)
const generateUpcomingMatches = () => {
  const upcomingMatches = [];
  const now = Date.now();
  
  Object.entries(leagues).forEach(([leagueName, config]) => {
    const { sport, teams, abbreviations, country } = config;
    const numTeams = teams.length;
    
    // Generate 5-10 upcoming matches per league
    const numMatches = randomInt(5, 10);
    
    for (let i = 0; i < numMatches; i++) {
      let homeIdx = randomInt(0, numTeams - 1);
      let awayIdx = randomInt(0, numTeams - 1);
      
      while (awayIdx === homeIdx) {
        awayIdx = randomInt(0, numTeams - 1);
      }
      
      const homeTeam = teams[homeIdx];
      const awayTeam = teams[awayIdx];
      const homeAbbr = abbreviations[homeIdx];
      const awayAbbr = abbreviations[awayIdx];
      
      // Random future date (1-7 days from now)
      const daysFromNow = randomInt(1, 7);
      const hoursFromNow = randomInt(10, 22);
      const minutesFromNow = randomInt(0, 59);
      
      const startTime = new Date(now + (daysFromNow * 24 * 60 * 60 * 1000) + (hoursFromNow * 60 * 60 * 1000) + (minutesFromNow * 60 * 1000));
      
      // Generate odds
      const homeOdds = (Math.random() * 3 + 1.2).toFixed(2);
      const drawOdds = sport === 'soccer' ? (Math.random() * 2 + 2.5).toFixed(2) : null;
      const awayOdds = (Math.random() * 3 + 1.2).toFixed(2);
      
      const match = {
        id: `upcoming-${sport}-${leagueName}-${i}-${Date.now()}`,
        sport: sport,
        league: leagueName,
        country: country,
        homeTeam: { 
          name: homeTeam, 
          abbreviation: homeAbbr,
          logo: null 
        },
        awayTeam: { 
          name: awayTeam, 
          abbreviation: awayAbbr,
          logo: null 
        },
        score: { home: 0, away: 0 },
        status: 'SCHEDULED',
        minute: 0,
        startsAt: startTime.toISOString(),
        odds: {
          home: parseFloat(homeOdds),
          draw: drawOdds ? parseFloat(drawOdds) : null,
          away: parseFloat(awayOdds)
        },
        markets: [
          { name: '1', odds: parseFloat(homeOdds), isActive: true },
          ...(drawOdds ? [{ name: 'X', odds: parseFloat(drawOdds), isActive: true }] : []),
          { name: '2', odds: parseFloat(awayOdds), isActive: true },
          { name: 'O 2.5', odds: 1.95, isActive: true },
          { name: 'U 2.5', odds: 1.95, isActive: true },
          { name: 'BTTS', odds: 1.90, isActive: true }
        ],
        bettingVolume: randomInt(2000, 30000)
      };
      
      upcomingMatches.push(match);
    }
  });
  
  return upcomingMatches;
};

// Generate all matches
const allLiveMatches = generateLiveMatches();
const allUpcomingMatches = generateUpcomingMatches();

// Helper functions
const getLiveMatches = (sport = null) => {
  if (!sport || sport === 'all') return allLiveMatches;
  
  const sportKey = sport === 'football' ? 'football' : sport;
  return allLiveMatches.filter(m => m.sport === sportKey);
};

const getUpcomingMatches = (sport = null) => {
  if (!sport || sport === 'all') return allUpcomingMatches;
  
  const sportKey = sport === 'football' ? 'football' : sport;
  return allUpcomingMatches.filter(m => m.sport === sportKey);
};

const searchMatches = (query, sport = null) => {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  // Search in live matches
  const liveResults = allLiveMatches.filter(m => 
    (!sport || m.sport === sport) &&
    (m.homeTeam.name.toLowerCase().includes(lowerQuery) ||
     m.awayTeam.name.toLowerCase().includes(lowerQuery) ||
     m.league.toLowerCase().includes(lowerQuery))
  );
  
  // Search in upcoming matches
  const upcomingResults = allUpcomingMatches.filter(m => 
    (!sport || m.sport === sport) &&
    (m.homeTeam.name.toLowerCase().includes(lowerQuery) ||
     m.awayTeam.name.toLowerCase().includes(lowerQuery) ||
     m.league.toLowerCase().includes(lowerQuery))
  );
  
  return [...liveResults, ...upcomingResults];
};

// Update scores function (simulates live updates)
const updateLiveScores = () => {
  allLiveMatches.forEach(match => {
    // 30% chance to update score
    if (Math.random() < 0.3) {
      if (match.sport === 'soccer') {
        // 10% chance of goal
        if (Math.random() < 0.1) {
          if (Math.random() < 0.5) {
            match.score.home += 1;
          } else {
            match.score.away += 1;
          }
        }
        // Update minute
        if (match.minute < 90) {
          match.minute += 1;
        }
      } else if (match.sport === 'basketball') {
        // 50% chance of score update
        if (Math.random() < 0.5) {
          match.score.home += randomInt(2, 3);
          match.score.away += randomInt(2, 3);
        }
        match.minute += 1;
      } else if (match.sport === 'football') {
        if (Math.random() < 0.2) {
          match.score.home += 3;
          match.score.away += 3;
        }
        match.minute += 1;
      }
    }
  });
  
  return allLiveMatches;
};

// Update every 30 seconds
setInterval(() => {
  updateLiveScores();
  console.log('🔄 Live scores updated at', new Date().toLocaleTimeString());
}, 30000);

module.exports = {
  getLiveMatches,
  getUpcomingMatches,
  searchMatches,
  updateLiveScores,
  // Keep direct access for backward compatibility
  soccer: allLiveMatches.filter(m => m.sport === 'soccer'),
  basketball: allLiveMatches.filter(m => m.sport === 'basketball'),
  football: allLiveMatches.filter(m => m.sport === 'football'),
  tennis: allLiveMatches.filter(m => m.sport === 'tennis'),
  baseball: allLiveMatches.filter(m => m.sport === 'baseball'),
  hockey: allLiveMatches.filter(m => m.sport === 'hockey'),
  mma: allLiveMatches.filter(m => m.sport === 'mma'),
  boxing: allLiveMatches.filter(m => m.sport === 'boxing'),
  golf: allLiveMatches.filter(m => m.sport === 'golf'),
  cricket: allLiveMatches.filter(m => m.sport === 'cricket'),
  rugby: allLiveMatches.filter(m => m.sport === 'rugby'),
  f1: allLiveMatches.filter(m => m.sport === 'f1')
};