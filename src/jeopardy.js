import mongoose from 'mongoose';
import express from 'express';
import Pageres from 'pageres';
import { join } from 'path';
import { dust } from 'adaro';
import { Game } from './models/Game';
import { Person } from './models/Person';

const MONGO_URL = process.env.MONGOLAB_URI || 'mongodb://localhost/jeopardy'
mongoose.connect(MONGO_URL);

const app = express();

const options = {
  helpers: [
    (dust) => {
      dust.helpers.Card = (chunk, context, bodies, params) => {
        const questions = context.get('questions');
        const value = context.resolve(params.value);
        const id = context.resolve(params.id);
        var question = questions.find((q) => {
          return q.value === value && q.category_id === id;
        });
        if (question.answered) {
          chunk.write('');
        } else {
          chunk.write('$' + value);
        }
      }
    }
  ]
}

app.engine('dust', dust(options));
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

// TODO: Body parsing
// TODO: Stateless, so we can resume back into an in-progress game.

app.post('/command', (req, res) => {

});

app.get('/', (req, res) => {
  Game.activeGame().then(game => {
    res.render('board', {
      categories: game.categories,
      questions: game.questions,
      values: [200, 400, 600, 800, 1000]
    });
  });
});

app.get('/clue', (req, res) => {
  Game.activeGame().then(game => {
    console.log(game.activeQuestion);
    res.render('clue', {
      clue: game.activeClue
    });
  });
});

app.get('/getclue/:title/:value', (req, res) => {
  Game.getClue(req.params.title, req.params.value).then(clue => {
    res.send('Got clue');
  });
});

app.get('/guess/:whatis', (req, res) => {
  Game.guess(req.params.whatis).then(valid => {
    res.send(valid);
  });
});

app.get('/answer', (req, res) => {
  Game.answer().then(() => {
    res.send('done');
  });
});

app.get('/startgame', (req, res) => {
  Game.start().then(() => {
    res.send('ok');
  }).catch((e) => {
    res.send('no');
  });
});

app.get('/endgame', (req, res) => {
  Game.end().then(() => {
    res.send('ok');
  });
});

const port = process.env.PORT || 8000;


app.get('/image', (req, res) => {
  var pageres = new Pageres()
    .src('localhost:' + port, ['1000x500'], {crop: false, filename: 'board'})
    .dest(join(__dirname, 'images'));

  pageres.run(function (err, items) {
    res.sendFile(join(__dirname, 'images', 'board.png'));
  });
});

app.listen(port, () => {
  console.log(`Jeopardy Bot listening on port ${port}`);
});