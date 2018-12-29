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
            className={'card-layout card-layout-' + props.name.toLowerCase()}
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
                        + (SUITES[props.suite].isRed ? ' red':'' )
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
                    className={'card-layout card card-down'}
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
        this.state = this.newGame();
    }

    newGame() {
        var stockpile = randomFunc(CARDS);
        var tableaus = [];

        for (var i = 0; i < 7; i++) {
            var items = stockpile.splice(0, i + 1);
            var tblItems = [];
            for (var j = 0; j < items.length; j++) {
                tblItems.push({
                    value: items[j].value,
                    suite: items[j].suite,
                    isFaceUp: j >= items.length - 1
                });
            }
            tableaus.push(tblItems);
        }

        var waste = []; //stockpile.splice(0, 23);

        return {
            foundations: [[], [], [], []],
            tableaus: tableaus,
            stockpile: stockpile,
            waste: waste
        };
    }

    createLayout(xIndex, yIndex, props) {
        var l = LAYOUTS[props.name];
        return (<CardLayout
            key={props.name + '-' + xIndex}
            name={props.name}
            value={l.value}
            onClick={props.onClick}
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
            onClick={() => this.handleCardClick(type, xIndex, yIndex, props)}
            x={(CARD_SIZE.x + CARD_SIZE.marginX) * l.baseX + (CARD_SIZE.x + CARD_SIZE.marginX) * xIndex}
            y={(CARD_SIZE.y + CARD_SIZE.marginY) * l.baseY + marginY}
        />);
    }

    handleCardClick(type, xIndex, yIndex, props) {
        const A = {
            W: this.state.waste,
            S: this.state.stockpile,
            F: this.state.foundations,
            T: this.state.tableaus
        };

        const moves = this.getValidMoves(type, xIndex, yIndex, props);
        if (moves.length === 0) {
            console.log('Invalid move');
            return;
        }

        console.log(moves);
        var newState = JSON.parse(JSON.stringify(this.state));
        const firstMove = moves[0];
        var taken = [];

        if (type === 'S') {
            taken = newState.stockpile.splice(newState.stockpile.length - this.props.takeCount);
        } else if (type === 'W') {
            taken.push(newState.waste.pop());
        } else if (type === 'F') {
            taken.push(newState.foundations.pop());
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

        this.setState(newState);
    }

    isSameColor(one, two) {
        return SUITES[one.suite].isRed === SUITES[two.suite].isRed;
    }

    getValidMoves(type, xIndex, yIndex, props) {
        const A = {
            W: this.state.waste,
            S: this.state.stockpile,
            F: this.state.foundations,
            T: this.state.tableaus
        };

        if (['W', 'S', 'F'].indexOf(type) > -1 && yIndex != A[type].length - 1) {
            return [];
        }

        if ('T' === type && !props.isFaceUp) {
            console.log('Invalid move');
            return [];
        }

        if (type === 'S') {
            return [{type: 'W', index: 0, count: 1}];
        }

        var moves = [];
        // Check Foundations
        for (var i = 0; i < 4; i++) {
            if ('F' === type && i === xIndex) {
                continue;
            }

            var AF = A.F[i];
            if (props.value === 'A' && AF.length === 0) {
                moves.push({type: 'F', index: i, count: 1});
                break;
            } else if (AF.length > 0) {
                var sameSuit = AF[AF.length - 1].suite === props.suite;
                if (!sameSuit) continue;
                var prevIndex = ORDER.indexOf(AF[AF.length - 1].value);
                var curIndex = ORDER.indexOf(props.value);

                if (prevIndex > -1 && curIndex > -1 && curIndex - prevIndex === 1) {
                    moves.push({type: 'F', index: i, count: 1});
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
                moves.push({type: 'T', index: i, count: AT.length - yIndex});
                break;
            } else if (AT.length > 0) {
                var diffColor = !this.isSameColor(AT[AT.length - 1], props);
                if (!diffColor) continue;

                var prevIndex = ORDER.indexOf(AT[AT.length - 1].value);
                var curIndex = ORDER.indexOf(props.value);

                if (prevIndex > -1 && curIndex > -1 && prevIndex - curIndex === 1) {
                    moves.push({type: 'T', index: i, count: AT.length - yIndex});
                    break;
                }
            }
        }

        return moves;
    }

    restockPile() {
        var newState = JSON.parse(JSON.stringify(this.state));
        var stockpile = newState.waste.slice().reverse();
        stockpile.forEach((s, i) => {s.isFaceUp = false;});
        newState.waste = [];
        newState.stockpile = stockpile;
        this.setState(newState);
    }

    renderLayouts() {
        var layouts = [];
        var noop = () => {};
        for (var i = 0; i < 4; i++) {
            layouts.push(this.createLayout(i, 0, {name: 'F', onClick: noop}));
        }

        for (var i = 0; i < 7; i++) {
            layouts.push(this.createLayout(i, 0, {name: 'T', onClick: noop}));
        }

        layouts.push(this.createLayout(0, 0, {name: 'S', onClick: () => this.restockPile()}));
        return (layouts);
    }

    renderCards() {
        var cards = {
            foundations: [],
            tableaus: [],
            waste: [],
            stockpile: []
        };

        const foundations = this.state.foundations;
        const tableaus = this.state.tableaus;
        const stockpile = this.state.stockpile;
        const waste = this.state.waste;

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


ReactDOM.render(
  (<div>
    <Board takeCount={1} />
  </div>),
  document.getElementById('root')
);