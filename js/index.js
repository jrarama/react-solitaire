const MAX_HISTORY = 20;
const SUITE_TYPES = ['♣', '♦', '♥', '♠'];

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

        this.isAuto = false;
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
        this.isAuto = false;
        this.hintTimer = -1;
    }

    createNewGame() {
        var stockpile = randomFunc(CARDS);
        var tableaus = [];

        for (var i = 0; i < 7; i++) {
            // var items = stockpile.splice(0, i == 1 ? 2: 1);
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

        var waste = []; // stockpile.splice(0, 23);

        stockpile.forEach((s, i) => {s.isFaceUp = false;});

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

    canAutocomplete(latest) {
        const A = latest;
        for (var i = 0; i < A.tableaus.length; i++) {
            const AT = A.tableaus[i];
            if (AT.findIndex((a) => !a.isFaceUp) > -1) {
                return false;
            }
        }
        return true;
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

        if (!this.isAuto) {
            var canWin = this.canAutocomplete(state.history[state.history.length - 1]);
            if (canWin) {
                console.log('Can win');
                this.isAuto = true;
            }
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

    getRestockPile() {
        var history = this.state.history;
        var newState = JSON.parse(JSON.stringify(history[history.length - 1]));
        var stockpile = newState.waste.slice().reverse();
        stockpile.forEach((s, i) => {s.isFaceUp = false;});
        newState.waste = [];
        newState.stockpile = stockpile;
        return newState;
    }
    restockPile() {
        this.onMove(this.getRestockPile());
    }

    isSameColor(one, two) {
        return SUITES[one.suite].isRed === SUITES[two.suite].isRed;
    }

    getValidMoves(type, xIndex, yIndex, props, isHint) {
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
                    if (isHint && type === 'F') {
                        console.log('Already in foundation');
                    } else {
                        moves.push({type: 'F', index: i});
                    }
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
                if (!isHint && props.value === 'K' && AT.length === 0) {
                    if (isHint && type === 'T') {
                        console.log('Already in tableau');
                    } else {
                        moves.push({type: 'T', index: i});
                    }
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

    newMovementState(card, move) {
        if (card.type === 'R') {
            return this.getRestockPile();
        }

        var latest = this.getLatestHistory();
        var newState = JSON.parse(JSON.stringify(latest));
        var type = card.type;
        var taken = [];

        if (type === 'S') {
            taken = newState.stockpile.splice(newState.stockpile.length - this.state.takeCount);
        } else if (type === 'W') {
            taken.push(newState.waste.pop());
        } else if (type === 'F') {
            taken.push(newState.foundations[card.xIndex].pop());
        } else if (type === 'T') {
            var CT = newState.tableaus[card.xIndex];
            taken = newState.tableaus[card.xIndex].splice(card.yIndex);
            if (CT.length > 0) {
                newState.tableaus[card.xIndex][CT.length - 1].isFaceUp = true;
            }
        }

        if ('W' === move.type) {
            newState.waste = newState.waste.concat(taken);
        } else if ('F' === move.type) {
            newState.foundations[move.index] = newState.foundations[move.index].concat(taken);
        } else if ('T' === move.type) {
            newState.tableaus[move.index] = newState.tableaus[move.index].concat(taken);
        }

        return newState;
    }

    handleCardClick(type, xIndex, yIndex, props) {
        this.isAuto = false;
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

        const moves = this.getValidMoves(type, xIndex, yIndex, props, false);
        if (moves.length === 0) {
            return;
        }

        const firstMove = moves[0];
        const card = { type: type, xIndex: xIndex, yIndex: yIndex, props: props };
        var newState = this.newMovementState(card, firstMove);

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
            if (hint.type === 'T') {
                H.tableaus[hint.xIndex][hint.yIndex].isHighlighted = true;
            } else if (hint.type === 'W') {
                H.waste[H.waste.length - 1].isHighlighted = true;
            } else if (hint.type === 'R') {
                H.layouts.recycle.props.isHighlighted = true;
            } else if (hint.type === 'S') {
                H.stockpile[H.stockpile.length - 1].isHighlighted = true;
            } else if (hint.type === 'F') {
                H.foundations[hint.xIndex][hint.yIndex].isHighlighted = true;
            }

        });

        newState.history.pop();
        newState.history.push(H);

        this.hintTimer = window.setTimeout(() => this.removeHints(), 1000);

        this.setState(newState);
    }

    getHints() {
        const A = this.getLatestMove();

        // 1. List all cards that can be moved
        var canMove = [];

        // For foundation, Stock and Waste, only the last item can be moved

        // For Tableaus, any opened card can be moved
        for (var i = 0; i < 7; i++) {
            const AT = A.T[i];

            for (var j = 0; j < AT.length; j++) {
                if (AT[j].isFaceUp) {
                    canMove.push({type: 'T', xIndex: i, yIndex: j, props: AT[j]});
                }
            }
        }

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


        const hints = [];

        for (var i = 0, l = canMove.length; i < l; i++) {
            var M = canMove[i];
            var moves = this.getValidMoves(M.type, M.xIndex, M.yIndex, M.props, true);
            if (moves.length > 0) {
                M.moves = moves;
                hints.push(M);
            }
        }

        console.log(hints);
        return hints;
    }


    moveTopCard(type, xIndex) {
        const A = this.getLatestMove();
        const AX = ['T'].indexOf(type) > -1 ? A[type][xIndex] : A[type];

        if (AX.length === 0 && A.S.length === 0 && A.W.length > 0) {
            this.restockPile();
            return;
        }
        var yIndex = AX.length - 1;
        var moves = this.getValidMoves(type, xIndex, yIndex, AX[yIndex], true);

        const firstMove = moves[0];
        const card = { type: type, xIndex: xIndex, yIndex: yIndex, props: AX[yIndex] };
        var newState = this.newMovementState(card, firstMove);
        this.onMove(newState);
    }

    moveStockPile() {
        const A = this.getLatestMove();
        var moves = this.getValidMoves('S', 0, A.S.length - 1, A.S[A.S.length - 1], true);

        const firstMove = moves[0];
        const card = { type: 'S', xIndex: 0, yIndex: A.S.length - 1, props: A.S[A.S.length - 1] };
        var newState = this.newMovementState(card, firstMove);
        this.onMove(newState);
    }

    autoMove() {
        var ito = this;
        var x = window.setInterval(function() {
            if (ito.state.isWon) {
                window.clearInterval(x);
                return false;
            }
            ito.doAutoMove();
            return true;
        }, 100);
    }

    doAutoMove() {
        const autoMove = this.getAutoMove();
        const A = this.getLatestMove();
        const AX = A[autoMove.type];
        var card = JSON.parse(JSON.stringify(autoMove));


        if (['S', 'W'].indexOf(autoMove.type) > -1) {
            if (autoMove.yIndex !== AX.length -1 || autoMove.type === 'S') {
                this.moveTopCard('S', 0);
                return;
            } else  {
                this.moveTopCard('W', 0);
                return;
            }
        } else if (['T'].indexOf(autoMove.type) > -1) {
            if (autoMove.yIndex === AX[autoMove.xIndex].length -1) {
                this.moveTopCard('T', autoMove.xIndex);
                return;
            }
        }

        if (A.S.length === 0 && A.W.length > 0) {
            this.restockPile();
            return;
        }

        console.log(autoMove);

    }

    getAutoMove() {
        for (var o = 0; o < ORDER.length; o++) {
            var O = ORDER[o];
            for (var s = 0; s < 4; s++) {
                var S = SUITE_TYPES[s];

                var inFoundation = this.findCard('F', O, S);
                if (inFoundation) {
                    continue;
                }

                var inWaste = this.findCard('W', O, S);
                if (inWaste) return inWaste;

                var inStock = this.findCard('S', O, S);
                if (inStock) return inStock;

                var inTableau = this.findCard('T', O, S);
                if (inTableau) return inTableau;
            }
        }
    }

    findCard(layout, value, suite) {
        var A = this.getLatestMove()[layout];

        if (['S', 'W'].indexOf(layout) > -1) {
            var yIndex = A.findIndex((a) => a.value === value && a.suite === suite);
            if (yIndex > -1) {
                return {type: layout, xIndex: 0, yIndex: yIndex, props: A[yIndex]};
            }
        } else {
            for (var i = 0; i < A.length; i++) {
                var yIndex = A[i].findIndex((a) => a.value === value && a.suite === suite);
                if (yIndex > -1) {
                    return {type: layout, xIndex: i, yIndex: yIndex, props: A[i][yIndex]};
                }
            }
        }
        return null;
    }

    render() {
        var history = this.state.history;
        var latest = history[history.length - 1];
        var canAutocomplete = this.canAutocomplete(latest);

        return (
            <div className="game">
                <button className='game-button' onClick={() => this.newGame()}>New Game</button>
                <button className='game-button' onClick={() => this.undo()} style={{top: '25px'}}>Undo</button>
                <button className='game-button' onClick={() => this.showHints()} style={{top: '50px'}}>Hint</button>
                <button className='game-button' onClick={() => this.autoMove()} style={{top: '75px', display: canAutocomplete ? 'block': 'none'}}>Auto Move</button>
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