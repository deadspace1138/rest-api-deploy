const express = require('express') // require --> commonJS
const crypto = require('node:crypto')
const cors = require('cors')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
// app.use(cors()) // se puede usar asi o podes darle opciones para que no sea siempre asterisco
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'http://movies.con',
      'http://midu.dev'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
})) // metodo utilizando middleware de cors y dandole opciones para que no sea un *
app.disable('x-powered-by')

// metodos normales CORS: GET/HEAD/POST
// metodos complejos CORS: PUT/PATCH/DELETE
// para los metodos complejos existe algo llamado:
// CORS PRE-Flight

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://movies.con',
  'http://midu.dev'
] // esto se utiliza con el metodo sin el middleware ni las opciones agregadas sino manualmente

// Todos los recursos que sean MOVIES se identifican con /movies
app.get('/movies', (req, res) => {
  const origin = req.header('origin')
  // cuando la peticion es del mismo ORIGIN
  // hhtp://localhost:1234 --> http://localhost:1234
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', '*') // si le ponemos un asterisco esto dice que
  // todos los origenes que no sean nuestro origen estan permitidos
  }

  const { genre } = req.query
  if (genre) {
    // const filteredMovies = movies.filter(
    //   movie => movie.genre.includes(genre)
    // ) // esto funcionaria pero seria keysensitive entonces en caso de escribir con minuscula o mayuscula afectaria la busqueda
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(), // uuid v4 automaticamente crea un id
    // title,
    // genre,
    // year,
    // director,
    // duration,
    // rate: rate ?? 0,
    // poster // si hicimos bien la validacion vamos a tener todos los datos bien, por ende podriamos poner ...result.data
    ...result.data // req.body --> esto no es lo mismo en uno tenemos todos los datos validados, y en el otro no sabemos que nos estan metiendo
  }

  // Esto no seria Rest, porque estamos guardando
  // el estado de la aplicacion en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie) // actualizar la cache del cliente
})

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', '*')
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id) // de esta forma buscamos la pelicula

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  // aca irian las validaciones pero al no saber cual queremos modificar
  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  }
  res.send(200)
})

const PORT = process.env.PORT ?? 1234
// const PORT = 1234

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
