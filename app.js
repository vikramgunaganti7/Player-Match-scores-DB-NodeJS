const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

app.use(express.json())
module.exports = app
initlizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initlizeDBAndServer()

const converDbResponsetoObjectPlayer = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
const converDbResponsetoObjectMatch = dbObjectMatch => {
  return {
    matchId: dbObjectMatch.match_id,
    match: dbObjectMatch.match,
    year: dbObjectMatch.year,
  }
}

// const converDbResponsetoObjectPlayerMatchScore = dbObjectMatchScore =>{
//   return {
//     player
//   }
// }
app.get('/players/', async (request, response) => {
  const getDetailsOfPlayer = `
    SELECT *
    FROM 
    player_details;`
  const dbResponse = await db.all(getDetailsOfPlayer)
  response.send(
    dbResponse.map(playerDetails => ({
      playerId: playerDetails.player_id,
      playerName: playerDetails.player_name,
    })),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerDetails = `
  SELECT *
  FROM 
  player_details
  WHERE 
  player_id=${playerId};`
  const playerDetailsResponse = await db.get(getPlayerDetails)
  response.send(converDbResponsetoObjectPlayer(playerDetailsResponse))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body

  const updatePlayerDetailsQuery = `
  UPDATE 
  player_details
  SET 
  player_name='${playerName}'
  WHERE 
  player_id=${playerId};`

  await db.run(updatePlayerDetailsQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getmatchDetails = `
  SELECT *
  FROM
  match_details
  WHERE 
  match_id=${matchId};`
  const matchDetailsResponse = await db.get(getmatchDetails)
  response.send(converDbResponsetoObjectMatch(matchDetailsResponse))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getAllMatchOfThePlayer = `SELECT
  * FROM
  match_details INNER JOIN player_match_score 
  ON match_details.match_id = player_match_score.match_id 
  WHERE 
  player_id=${playerId};`
  const playerMatchResponse = await db.all(getAllMatchOfThePlayer)
  response.send(
    playerMatchResponse.map(matchDetails => ({
      matchId: matchDetails.match_id,
      match: matchDetails.match,
      year: matchDetails.year,
    })),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const specificPlayerListQuery = `
  SELECT *
  FROM player_details
  INNER JOIN player_match_score
  ON player_details.player_id = player_match_score.player_id
  WHERE 
  match_id=${matchId};`
  const specificPlayerListResponse = await db.all(specificPlayerListQuery)
  response.send(
    specificPlayerListResponse.map(specificPlayerDetails => ({
      playerId: specificPlayerDetails.player_id,
      playerName: specificPlayerDetails.player_name,
    })),
  )
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const playerScoreDetailsQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score),
    SUM(player_match_score.fours),
    SUM(player_match_score.sixes)  FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_match_score.player_id = ${playerId};
    `
  const playerScoresResponse = await db.all(playerScoreDetailsQuery)
  response.send(
    playerScoresResponse.map(playerScores => ({
      playerId: playerScores.player_id,
      playerName: playerScores.player_name,
      totalScore: playerScores['SUM(player_match_score.score)'],
      totalFours: playerScores['SUM(player_match_score.fours)'],
      totalSixes: playerScores['SUM(player_match_score.sixes)'],
    })),
  )
})
