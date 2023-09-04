require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const Note = require('./models/note')

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}


app.use(express.static('build'))
app.use(requestLogger)
app.use(express.json())
app.use(cors())


/*JSON FOR TEST WITHOUT DB
let notes = [
    {
        id: 1,
        content: "HTML is easy",
        important: true
    },
    {
        id: 2,
        content: "Browser can execute only JavaScript",
        important: false
    },
    {
        id: 3,
        content: "GET and POST are the most important methods of HTTP protocol",
        important: true
    }
]
*/

//Function that generates IDs
const generateId = () => {
  const maxId = notes.length > 0
    ? Math.max(...notes.map(n => n.id))
    : 0
  return maxId + 1
}

/*CREATE NEW NOTE WITHOUT DB
app.post('/api/notes', (request, response) => {
  const body = request.body
  if (!body.content) {
    return response.status(400).json({ 
      error: 'content missing' 
    })
  }

  const note = {
    content: body.content,
    important: body.important || false,
    id: generateId(),
  }

  notes = notes.concat(note)

  response.json(note)
})
*/

////GET ALL NOTES IN WITH MONGODB - library:MONGOOSE.JS
app.post('/api/notes', (request, response,next) => {
  const body = request.body

  if (body.content === undefined) {
    return response.status(400).json({ error: 'content missing' })
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
  })

  note.save().then(savedNote => {
    response.json(savedNote)
  })
  .catch(error=>next(error))
})

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

/*GET ALL NOTES IN API WITHOUT DB
app.get('/api/notes', (request, response) => {
  response.json(notes)
})*/

//GET ALL NOTES IN WITH MONGODB - MONGOOSE.JS
app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  })
})


/*GET ALL SINGLE NOTE BY ID WITHOUT DB
app.get('/api/notes/:id', (request, response) => {
  const id = Number(request.params.id)
  const note = notes.find(note => note.id === id)
  console.log(id)
  if (note) {
    response.json(note)
  } else {
    response.status(404).end()
  }
  
  console.log(note)
  response.json(note)
})*/

//GET NOTE BY ID WITH MONGODB - library:MONGOOSE.JS
app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id)
    .then(note => {
      if (note) {
        response.json(note)
      } else {
        response.status(404).end()
      }
    })
    //LOG ERROR WITH MIDDLEWARE
    .catch(error => next(error))
    /*LOG ERROR WITHOUT MIDDLEWARE
      .catch(error => {
        console.log(error)
        response.status(400).send({ error: 'malformatted id' })
      })
    */
})

//EDIT NOTE (MAKE IT IMPORTANT OR NOT) WITH DB
app.put('/api/notes/:id', (request, response, next) => {
  const { content, important } = request.body
  //EDIT NOTE WHITHOUT CONSTRAINT FROM THE DATABASE
  /*const body = request.body

  const note = {
    content: body.content,
    important: body.important,
  }
  */
  Note.findByIdAndUpdate(request.params.id,
    { content, important },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})


//DELETE WITHOUT DB
/*
app.delete('/api/notes/:id', (request, response) => {
  const id = Number(request.params.id)
  notes = notes.filter(note => note.id !== id)

  response.status(204).end()
})*/
//DELETE WITH DB - MOONGOOSEJS
app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

//Middleware UnknownEndPoint - handler of requests with unknown endpoint
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

//Middleware ErrorHandler - handler of requests with result to errors
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)


/*
BASIC SERVER ON WEB (NO EXPRESS)
const app = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(notes))
})
*/
//SERVER WITH EXPRESS
const PORT = process.env.PORT
app.listen(PORT)
console.log(`Server running on port ${PORT}`)