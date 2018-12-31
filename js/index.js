const MAX_HISTORY = 20;
const SUITES = {
    '♣': {name: 'clubs', isRed: false},
    '♦': {name: 'diamonds', isRed: true},
    '♥': {name: 'hearts', isRed: true},
    '♠': {name: 'spades', isRed: false},
};

const LAYOUTS = {
    'F': {name: 'foundation', value: 'A', baseX: 1, baseY: 0, marginClose: 0, marginOpen: 0},
    'S': {name: 'stock', value: 'S', baseX: 6, baseY: 0, marginClose: 0, marginOpen: 0},
    'T': {name: 'tableau', value: '', baseX: 0, baseY: 1, marginClose: 10, marginOpen: 28},
    'W': {name: 'waste', value: '', baseX: 7, baseY: 0, marginClose: 0, marginOpen: 28},
    'R': {name: 'recycle', value: 'R', baseX: 6, baseY: 0, marginClose: 0, marginOpen: 0}
};

const ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
var CARDS = [];
['♣', '♦', '♥', '♠'].forEach((suite, index) => ORDER.forEach((o,i) => CARDS.push({value: o, suite: suite, isFaceUp: false})));

const CARD_SIZE = {x: 80, y:120, marginX: 10, marginY: 20};

function randomFunc(arr) {
    var myArr = arr.slice();
    var l = myArr.length, temp, index;
    while (l > 0) {
       index = Math.floor(Math.random() * l);
       l--;
       temp = myArr[l];
       myArr[l] = myArr[index];
       myArr[index] = temp;
    }
    return myArr;
}

function CardLayout(props) {
    return (
        <div
            className={'card-layout card-layout-' + props.name.toLowerCase()
                    + (props.isHighlighted ? ' card-highlighted':'')
                }
            onClick={props.onClick}
            style={{
                left: props.x + 'px',
                top: props.y + 'px'
            }}>
                <span className="card-layout-value">{props.value}</span>
        </div>
    );
}

class Card extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const props = this.props;
        if (props.isFaceUp) {
            return (
                <div
                    className={'card-layout card'
                        + (SUITES[props.suite].isRed ? ' red':'')
                        + (props.isHighlighted ? ' card-highlighted':'')
                    }
                    onClick={props.onClick}
                    style={{
                        left: props.x + 'px',
                        top: props.y + 'px'
                    }}>
                        <span className="card-value">{props.value}</span>
                        <span className="card-suite">{props.suite}</span>
                </div>
            );
        } else {
            return (
                <div
                    className={'card-layout card card-down'
                            + (props.isHighlighted ? ' card-highlighted':'')
                        }
                    onClick={props.onClick}
                    style={{
                        left: props.x + 'px',
                        top: props.y + 'px'
                    }}>
                </div>
            );
        }
    }
}

class Board extends React.Component {
    constructor(props) {
        super(props);
    }

    createLayout(xIndex, yIndex, props) {
        var l = LAYOUTS[props.name];
        return (<CardLayout
            key={props.name + '-' + xIndex}
            name={props.name}
            value={l.value}
            onClick={props.onClick}
            isHighlighted={props.isHighlighted}
            x={(CARD_SIZE.x + CARD_SIZE.marginX) * l.baseX + (CARD_SIZE.x + CARD_SIZE.marginX) * xIndex}
            y={(CARD_SIZE.y + CARD_SIZE.marginY) * l.baseY + (CARD_SIZE.y + CARD_SIZE.marginY) * yIndex}
        />);
    }

    createCard(type, xIndex, yIndex, firstOpen, props) {
        var l = LAYOUTS[type];
        var marginY = yIndex < firstOpen ? l.marginClose * yIndex :
            l.marginClose * (firstOpen) + l.marginOpen * (yIndex - firstOpen);
        var isFaceUp = props.isFaceUp;

        if (type === 'W') {
            isFaceUp = true;
            marginY += (yIndex >= firstOpen ? 10: 0);
        }

        return (<Card
            key={props.value + props.suite}
            value={props.value}
            suite={props.suite}
            isFaceUp={isFaceUp}
            isHighlighted={props.isHighlighted}
            onClick={() => this.props.handleCardClick(type, xIndex, yIndex, props)}
            x={(CARD_SIZE.x + CARD_SIZE.marginX) * l.baseX + (CARD_SIZE.x + CARD_SIZE.marginX) * xIndex}
            y={(CARD_SIZE.y + CARD_SIZE.marginY) * l.baseY + marginY}
        />);
    }

    renderLayouts() {
        var L = this.props.cards.layouts;
        const layouts = [];
        for (var i = 0; i < L.foundations.length; i++) {
            var F = L.foundations[i];
            layouts.push(this.createLayout(F.xIndex, F.yIndex, F.props));
        }
        for (var i = 0; i < L.tableaus.length; i++) {
            var T = L.tableaus[i];
            layouts.push(this.createLayout(T.xIndex, T.yIndex, T.props));
        }

        var R = L.recycle;
        R.props.onClick = () => this.props.onRestockPile();
        layouts.push(this.createLayout(R.xIndex, R.yIndex, R.props));
        return (layouts);
    }

    renderCards() {
        var cards = {
            foundations: [],
            tableaus: [],
            waste: [],
            stockpile: []
        };

        const foundations = this.props.cards.foundations;
        const tableaus = this.props.cards.tableaus;
        const stockpile = this.props.cards.stockpile;
        const waste = this.props.cards.waste;

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < foundations[i].length; j++) {
                cards.foundations.push(this.createCard('F', i, j, 0, foundations[i][j]));
            }
        }

        for (var i = 0; i < 7; i++) {
            var firstOpen = tableaus[i].findIndex(x => x.isFaceUp);

            for (var j = 0; j < tableaus[i].length; j++) {
                cards.tableaus.push(this.createCard('T', i, j, firstOpen, tableaus[i][j]));
            }
        }

        for (var j = 0; j < stockpile.length; j++) {
            cards.stockpile.push(this.createCard('S', 0, j, 52, stockpile[j]));
        }

        for (var j = 0; j < waste.length; j++) {
            waste[j].isFaceUp = true;
            cards.waste.push(this.createCard('W', 0, j, waste.length - 3, waste[j]));
        }

        return (
            <div className="cards">
                <div className="foundations">{cards.foundations}</div>
                <div className="tableaus">{cards.tableaus}</div>
                <div className="stockpile">{cards.stockpile}</div>
                <div className="waste">{cards.waste}</div>
            </div>
        );
    }

    render() {
        return (
            <div>
                <div className="layouts">
                    {this.renderLayouts()}
                </div>
                {this.renderCards()}
            </div>
        );
    }
}

class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            history: [this.createNewGame()],
            takeCount: 1,
            isWon: false
        };

        this.hintTimer = -1;
    }

    getLatestHistory() {
        var history = this.state.history;
        return history[history.length - 1];
    }

    getLatestMove() {
        var latest = this.getLatestHistory();
        return {
            W: latest.waste,
            S: latest.stockpile,
            F: latest.foundations,
            T: latest.tableaus,
            L: latest.layouts
        };
    }

    newGame() {
        var state = {
            history: [this.createNewGame()],
            takeCount: 1,
            isWon: false
        };
        this.setState(state);
    }

    createNewGame() {
        var stockpile = randomFunc(CARDS);
        var tableaus = [];

        for (var i = 0; i < 7; i++) {
            var items = stockpile.splice(0, i + 1);
            var tblItems = [];
            for (var j = 0; j < items.length; j++) {
                tblItems.push({
                    value: items[j].value,
                    suite: items[j].suite,
                    isFaceUp: j >= items.length - 1,
                    isHighlighted: false
                });
            }
            tableaus.push(tblItems);
        }

        var waste =  stockpile.splice(0, 23);

        return {
            foundations: [[], [], [], []],
            tableaus: tableaus,
            stockpile: stockpile,
            waste: waste,
            layouts: this.createLayouts(),
        };
    }

    createLayouts() {
        var layout = {
            foundations: [],
            tableaus: [],
            recycle: {}
        };
        var noop = () => console.log('noop');

        for (var i = 0; i < 4; i++) {
            layout.foundations.push({xIndex: i, yIndex: 0, props: {name: 'F', onClick: noop, isHighlighted: false}});
        }

        for (var i = 0; i < 7; i++) {
            layout.tableaus.push({xIndex: i, yIndex: 0, props: {name: 'T', onClick: noop, isHighlighted: false}});
        }

        layout.recycle={xIndex: 0, yIndex: 0, props: {name: 'R', onClick: noop, isHighlighted: false}};
        return layout;
    }

    isWon(cards) {
        if (this.state.isWon) return true;

        var noComplete = cards.foundations.findIndex(a => a.length < 13);
        return noComplete === -1;
    }

    onMove(newState) {
        var state = JSON.parse(JSON.stringify(this.state));
        state.history.push(newState);

        if (state.history.length > MAX_HISTORY) {
            state.history = state.history.splice(state.history.length - MAX_HISTORY);
        }

        if (this.isWon(newState)) {
            state.isWon = true;
            this.setState(state);
            this.render();
            alert("You Win!");
        } else {
            this.setState(state);
        }
    }

    undo() {
        var state = JSON.parse(JSON.stringify(this.state));
        if (state.history.length > 1) {
            state.history.pop();
        }
        if (state.isWon) {
            state.isWon = false;
        }
        this.setState(state);
    }

    restockPile() {
        var history = this.state.history;
        var newState = JSON.parse(JSON.stringify(history[history.length - 1]));
        var stockpile = newState.waste.slice().reverse();
        stockpile.forEach((s, i) => {s.isFaceUp = false;});
        newState.waste = [];
        newState.stockpile = stockpile;
        this.onMove(newState);
    }

    isSameColor(one, two) {
        return SUITES[one.suite].isRed === SUITES[two.suite].isRed;
    }

    getValidMoves(type, xIndex, yIndex, props) {
        const A = this.getLatestMove();

        if (['W', 'S'].indexOf(type) > -1 && yIndex != A[type].length - 1) {
            return [];
        } else if (['F'].indexOf(type) > -1 && yIndex != A[type][xIndex].length - 1) {
            return [];
        }

        if ('T' === type && !props.isFaceUp) {
            console.log('Invalid move');
            return [];
        }

        if (type === 'S') {
            return [{type: 'W', index: 0}];
        }

        var moves = [];

        if ('R' === type) {
            if (A.S.length === 0 && A.W.length > 0) {
                moves.push({type: 'R', index: 0});
            }
        } else {
            // Check Foundations
            for (var i = 0; i < 4; i++) {
                if ('F' === type && i === xIndex) {
                    continue;
                }

                var AF = A.F[i];
                if (props.value === 'A' && AF.length === 0) {
                    moves.push({type: 'F', index: i});
                    break;
                } else if (AF.length > 0) {
                    var sameSuit = AF[AF.length - 1].suite === props.suite;
                    if (!sameSuit) continue;
                    var prevIndex = ORDER.indexOf(AF[AF.length - 1].value);
                    var curIndex = ORDER.indexOf(props.value);

                    if (['W'].indexOf(type) > -1 && yIndex !== A[type].length - 1) {
                        continue;
                    } else if (['T', 'F'].indexOf(type) > -1 && yIndex !== A[type][xIndex].length - 1) {
                        continue;
                    }
                    if (prevIndex > -1 && curIndex > -1 && curIndex - prevIndex === 1) {
                        moves.push({type: 'F', index: i});
                        break;
                    }
                }
            }

            // Check Tableaus
            for (var i = 0; i < 7; i++) {
                if ('T' === type && i === xIndex) {
                    continue;
                }

                var AT = A.T[i];
                if (props.value === 'K' && AT.length === 0) {
                    moves.push({type: 'T', index: i});
                } else if (AT.length > 0) {
                    var diffColor = !this.isSameColor(AT[AT.length - 1], props);
                    if (!diffColor) continue;

                    var prevIndex = ORDER.indexOf(AT[AT.length - 1].value);
                    var curIndex = ORDER.indexOf(props.value);

                    if (prevIndex > -1 && curIndex > -1 && prevIndex - curIndex === 1) {
                        moves.push({type: 'T', index: i});
                        break;
                    }
                }
            }
        }

        return moves;
    }

    handleCardClick(type, xIndex, yIndex, props) {
        var latest = this.getLatestHistory();

        if (this.isWon(latest)) {
            return;
        }

        const A = {
            W: latest.waste,
            S: latest.stockpile,
            F: latest.foundations,
            T: latest.tableaus
        };

        const moves = this.getValidMoves(type, xIndex, yIndex, props);
        if (moves.length === 0) {
            return;
        }

        var newState = JSON.parse(JSON.stringify(latest));
        const firstMove = moves[0];
        var taken = [];

        if (type === 'S') {
            taken = newState.stockpile.splice(newState.stockpile.length - this.state.takeCount);
        } else if (type === 'W') {
            taken.push(newState.waste.pop());
        } else if (type === 'F') {
            taken.push(newState.foundations[xIndex].pop());
        } else if (type === 'T') {
            var CT = newState.tableaus[xIndex];
            taken = newState.tableaus[xIndex].splice(yIndex);
            if (CT.length > 0) {
                newState.tableaus[xIndex][CT.length - 1].isFaceUp = true;
            }
        }

        if ('W' === firstMove.type) {
            newState.waste = newState.waste.concat(taken);
        } else if ('F' === firstMove.type) {
            newState.foundations[firstMove.index] = newState.foundations[firstMove.index].concat(taken);
        } else if ('T' === firstMove.type) {
            newState.tableaus[firstMove.index] = newState.tableaus[firstMove.index].concat(taken);
        }

        this.onMove(newState);
    }

    removeHints() {
        console.log('Removing hints');

        var newState = JSON.parse(JSON.stringify(this.state));
        var H = JSON.parse(JSON.stringify(this.getLatestHistory()));
        H.layouts.recycle.props.isHighlighted = false;
        for (var i = 0; i < H.waste.length; i++) {
            H.waste[i].isHighlighted = false;
        }
        for (var i = 0; i < H.stockpile.length; i++) {
            H.stockpile[i].isHighlighted = false;
        }
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < H.foundations[i].length; j++) {
                H.foundations[i][j].isHighlighted = false;
            }
        }
        for (var i = 0; i < 7; i++) {
            for (var j = 0; j < H.tableaus[i].length; j++) {
                H.tableaus[i][j].isHighlighted = false;
            }
        }

        newState.history.pop();
        newState.history.push(H);

        this.setState(newState);
    }

    showHints() {
        window.clearTimeout(this.hintTimer);
        const hints = this.getHints();

        var newState = JSON.parse(JSON.stringify(this.state));
        var H = JSON.parse(JSON.stringify(this.getLatestHistory()));

        hints.forEach((hint, i) => {
            if (hint.type === 'R') {
                H.layouts.recycle.props.isHighlighted = true;
            } else if (hint.type === 'S') {
                H.stockpile[H.stockpile.length - 1].isHighlighted = true;
            }  else if (hint.type === 'W') {
                H.waste[H.waste.length - 1].isHighlighted = true;
            } else if (hint.type === 'T') {
                H.tableaus[hint.xIndex][hint.yIndex].isHighlighted = true;
            } else if (hint.type === 'F') {
                H.foundations[hint.xIndex][hint.yIndex].isHighlighted = true;
            }

        });

        newState.history.pop();
        newState.history.push(H);

        this.hintTimer = window.setTimeout(() => this.removeHints(), 1000);

        console.log(this.hintTimer);
        this.setState(newState);
    }

    getHints() {
        const A = this.getLatestMove();

        // 1. List all cards that can be moved
        var canMove = [];

        // For foundation, Stock and Waste, only the last item can be moved

        // a. Check Waste
        if (A.W.length > 0) {
            canMove.push({type: 'W', xIndex: 0, yIndex: A.W.length - 1, props: A.W[A.W.length - 1]});

            if (A.S.length === 0) {
                canMove.push({type: 'R', xIndex: 0, yIndex: 0, props: null});
            }
        }

        // b. Check Stockpile
        if (A.S.length > 0) {
            canMove.push({type: 'S', xIndex: 0, yIndex: A.S.length - 1, props: A.S[A.S.length - 1]});
        }

        // c. Check Foundations
        for (var i = 0; i < 4; i++) {
            const AF = A.F[i];
            if (AF.length > 0) {
                canMove.push({type: 'F', xIndex: i, yIndex: AF.length - 1, props: AF[AF.length - 1]});
            }
        }

        // For Tableaus, any opened card can be moved
        for (var i = 0; i < 7; i++) {
            const AT = A.T[i];

            for (var j = 0; j < AT.length; j++) {
                if (AT[j].isFaceUp) {
                    canMove.push({type: 'T', xIndex: i, yIndex: j, props: AT[j]});
                }
            }
        }

        const hints = [];

        for (var i = 0, l = canMove.length; i < l; i++) {
            var M = canMove[i];
            var moves = this.getValidMoves(M.type, M.xIndex, M.yIndex, M.props);
            if (moves.length > 0) {
                M.moves = moves;
                hints.push(M);
            }
        }

        return hints;
    }

    render() {
        var history = this.state.history;
        var latest = history[history.length - 1];

        return (
            <div className="game">
                <button className='game-button' onClick={() => this.newGame()}>New Game</button>
                <button className='game-button' onClick={() => this.undo()} style={{top: '25px'}}>Undo</button>
                <button className='game-button' onClick={() => this.showHints()} style={{top: '50px'}}>Hint</button>
                <Board
                    game={this}
                    takeCount={this.state.takeCount}
                    cards={latest}
                    onMove={(s) => this.onMove(s)}
                    onRestockPile={() => this.restockPile()}
                    handleCardClick={(type, xIndex, yIndex, props) => this.handleCardClick(type, xIndex, yIndex, props)}
                    />
            </div>
        )
    }
}


ReactDOM.render(<Game />,
  document.getElementById('root')
);