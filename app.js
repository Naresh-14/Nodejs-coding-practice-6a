const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const convertStateDBObjectResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const covertDistrictDBObjectResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
  SELECT * FROM state;
  `
  const stateArray = await db.all(getStatesQuery)
  response.send(
    stateArray.map(state => convertStateDBObjectResponseObject(state)),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT * FROM state WHERE state_id = ${stateId};
  `
  const state = await db.all(getStateQuery)
  response.send(convertStateDBObjectResponseObject(state))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const UpdateDistrictsQuery = `
  INSERT INTO district (district_name,state_id,cases,curse,active,deaths)
  VALUES
  ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `
  await db.run(UpdateDistrictsQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const getDistrictsQuery = `
  SELECT * FROM district ;
  `
  const districtArray = await db.all(getDistrictsQuery)
  response.send(
    districtArray.map(Object => covertDistrictDBObjectResponseObject(Object)),
  )
})

app.delete('/districts/:districtId/', async (request, response) => {
  const deleteDistrictQuery = `
  DELETE FROM district;
  `
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updatedDistrictQuery = `
  INSERT INTO district (district_name,state_id,cased,cured,active,deaths)
  VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths})
  WHERE
    district_id = ${districtId};
  `
  await db.run(updatedDistrictQuery)
  response.send('District Details Updated')
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`
  const state = await database.get(getStateNameQuery)
  response.send({stateName: state.state_name})
})

module.exports = app
