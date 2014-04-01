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
    if (parseInt(this.tiles[i].value) == this.tiles[i].value)
        ret += this.tiles[i].value * this.tiles[i].value;
    else
        ret += 10000;
  }
  return ret;
}

Snake.prototype.letters = function () {
    ret = [];
    for (var i=0; i<this.size(); i++)
    {
        if (parseInt(this.tiles[i].value) != this.tiles[i].value)
        {
            ret[this.tiles[i].value] = ret[this.tiles[i].value] || 0;
            ret[this.tiles[i].value]++;
        }
    }
    return ret;
}

Snake.prototype.judge = function () {
  if (this.tiles[0].value >= 2048)
    return true;
  var l = this.letters();
  if (l["A"]>0 && l["P"]>0 && l["R"]>0 && l["I"]>0 && l["L"]>1 && l["F"]>0 && l["O"]>1)
    return true;
  return false;
}

Snake.prototype.index_of = function (tile) {
  for (var i=0; i<this.tiles.length; i++)
  {
    if (this.tiles[i].x == tile.x && this.tiles[i].y == tile.y)
    {
        return i;
    }
  }
  return -1;
}

Snake.prototype.truncate = function(index) {
  // truncates index...tiles.length to become food!
  while (this.tiles.length > index)
  {
    var t = this.tiles.pop();
    t.tag = "food";
  }
}

Snake.prototype.update = function () {
  // if head can merge, merge once
  if (this.tiles.length > 2 && this.tiles[0].value == this.tiles[1].value &&
      parseInt(this.tiles[0].value) == this.tiles[0].value)
  {
    this.grid.removeTile(this.tiles[0]);
    for (var j=1; j<this.tiles.length; j++) {
      this.game.moveTile(this.tiles[j], this.tiles[j-1].previousPosition);
    }
    this.tiles[1].value *= 2;
    this.tiles.shift();
    return;
  }

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
        if (!t.snake)
        {
          this.game.addRandomTile();
        }
        // eat it or merge
        if (t.value == this.head().value && parseInt(t.value) == t.value)
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
        t.snake.truncate(t.snake.index_of(t));
        this.update();
    }
  }
}

GameManager.prototype.magic_word = "APRILFOOL";  // length=⑨
GameManager.prototype.random_value = function () {
  // altered my original random value to make it easier.
  var max = 128;

  // initial type random
  var p = Math.random() * 100;
  var head = this.snakes[0].tiles[0].value;
  var value = 1;
  if (p<9)
  {
    // letters!
    value = this.magic_word.substr(Math.floor(Math.random() * 9), 1);
  }
  else if (p<25 && parseInt(head) == head && head <= max)
  {
    // when head is small, often spawn an easy-to-eat tile
    value = head;
  }
  else
  {
    // original scenario
    var x = Math.floor(Math.random() * max);
    if (x==0) x = 1;
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

GameManager.prototype.setup_magic_word = function () {

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
  if (!this.isGameTerminated())
  {
    this.prepareTiles();
    this.update_snake();
    this.won = this.snakes[0].judge();
    this.actuate();
    this.actuator.actuate_magic(this.snakes[0].letters());
  }
}
