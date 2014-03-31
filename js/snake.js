function Snake(game, tiles, dir) {
  this.game = game;
  this.grid = game.grid;
  this.tiles = tiles;
  this.direction = dir;
  if (tiles) {
    for (var i=0; i<tiles.length; i++) {
      this.tiles[i].tag = "snake";
      this.tiles[i].snake = this;
    }
  }
}

Snake.prototype.size = function() { return this.tiles.length; }

Snake.prototype.head = function () { return this.tiles[0]; }

Snake.prototype.score = function () {
  var ret = 0;
  for (var i=0; i<this.size(); i++)
  {
    ret += this.tiles[i].value * this.tiles[i].value;
  }
  return ret;
}

Snake.prototype.update = function () {
  var v = this.game.getVector(this.direction);
  var cell = {x: this.head().x+v.x, y: this.head().y+v.y };

  if (this.grid.withinBounds(cell)) {
    var t = this.grid.cells[cell.x][cell.y];
    if (!t) {
        // empty tile: move
        this.game.moveTile(this.tiles[0], cell);
        for (var j=1; j<this.tiles.length; j++) {
            this.game.moveTile(this.tiles[j], this.tiles[j-1].previousPosition);
        }
    } else if (t.tag == "food") {
        this.game.addRandomTile();
        // eat it or merge
        if (t.value == this.head().value)
        {
            this.tiles[0].value *= 2;
            this.grid.removeTile(t);
            this.game.moveTile(this.tiles[0], t);
            for (var j=1; j<this.tiles.length; j++) {
                this.game.moveTile(this.tiles[j], this.tiles[j-1].previousPosition);
            }
        } else {
            t.tag = "snake";
            t.snake = this;
            this.tiles.unshift(t);
            this.update();
        }
    } else if (t.tag == "snake") {
        // eat self or others
    }
  }
}

GameManager.prototype.magic_word = "APRILFOOL";  // length=⑨
GameManager.prototype.random_value = function () {
  var max = 128;
  var x = Math.floor(Math.random() * max);
  var value = 1;
  if (x==0) {
    // letters!
    value = this.magic_word.substr(Math.floor(Math.random() * 9), 1);
  } else {
    while (x<max) { x <<= 1; value <<= 1; }
  }
  return value;
}

GameManager.prototype.setup_player_snake = function () {
  var c = null;
  var d = null;
  do {
    c = this.grid.randomAvailableCell();
    if ( this.grid.cellAvailable({x: c.x-1, y: c.y}) &&
         this.grid.cellAvailable({x: c.x+1, y: c.y}) ) {
      d = {x:c.x-1, y:c.y};
    }
  } while (!d);

  c = new Tile(c, 2); d = new Tile(d, 2);
  c.tag = d.tag = "snake";
  this.grid.insertTile(c);
  this.grid.insertTile(d);
  // start to move right
  this.snakes.push( new Snake(this, [c, d], 1) );
}

GameManager.prototype.update_snake = function () {

  if (this.direction!=null && (this.direction - this.snakes[0].direction) % 2 != 0)
  {
    this.snakes[0].direction = this.direction;
  }
  for (var i=0; i<this.snakes.length; i++) {
    this.snakes[i].update();
  }
  this.score = this.snakes[0].score();
}

GameManager.prototype.update = function () {
  this.prepareTiles();
  this.update_snake();
  this.actuate();
}
