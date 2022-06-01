if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}

let grid = document.getElementById("grid");
let turnDiv = document.getElementById("turn");
let scorep1 = document.getElementById("scorep1");
let scorep2 = document.getElementById("scorep2");
let playerNumber = document.getElementById("players");
let playerId = document.getElementById("playerId");
let victory = document.getElementById("victory");
let winner = document.getElementById("winner");
let backdrop = document.getElementById("backdrop");
let rules = document.getElementById("rules");
let themebtn = document.getElementById("theme");
backdrop.style.display = "none";

let darkmode = true;

if (localStorage.getItem("theme")) {
	darkmode = localStorage.getItem("theme") === "dark" ? true : false;
}

if (!darkmode) {
	setTheme(false)
}

let squares = new Array(8);
for (let i = 0; i < 8; i++) {
	squares[i] = [];
}

let state = {
	grid: [],
	moves: [],
	isPaused: false,
	focused: {
		i: -1,
		j: -1,
	},
	turn: 1,
	validMoves: {},
	p1: 2,
	p2: 2,
	wasLastTurnSkipped: false,
	cpu: 0,
};

function setTheme(dark = true) {
	if (dark) {
		themebtn.innerText = "Light Mode";
		document.body.classList.remove("light");
		localStorage.setItem("theme", "dark");
	} else {
		themebtn.innerText = "Dark Mode";
		document.body.classList.add("light");
		localStorage.setItem("theme", "light");
	}
}

function initGrid() {
	let alphabets = ["A", "B", "C", "D", "E", "F", "G", "H"];
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			let element = document.createElement("div");
			element.id = `${alphabets[j]}${i + 1}`;
			element.classList.add("square");
			element.addEventListener("click", () => {
				if (state.cpu === state.turn) return;
				logic.clickHandler(i, j);
			});
			grid.appendChild(element);
			squares[i].push(element);
		}
	}
	document.getElementById("undo").addEventListener("click", () => {
		logic.undo();
	});
	playerNumber.addEventListener("input", function () {
		if (this.value === "2") {
			document.getElementById("pid").style.display = "none";
		} else {
			document.getElementById("pid").style.display = "flex";
		}
	});
	playerId.addEventListener("input", () => {
		console.log(playerId.value);
		document.getElementById("setupdisk").style.backgroundColor =
			playerId.value !== "1" ? "black" : "white";
	});
	document.getElementById("play").addEventListener("click", () => {
		document.body.classList.add("fade");
		setTimeout(() => {
			document.body.classList.remove("setup-active");
			document.body.classList.add("game-active");
			document.body.classList.remove("fade");
			let cpu;
			if (playerNumber.value === "2") {
				cpu = 0;
			} else {
				cpu = playerId.value === "1" ? 1 : 2;
			}
			logic.setup(cpu);
		}, 500);
	});
	let stop = () => {
		document.body.classList.add("fade");
		setTimeout(() => {
			document.body.classList.add("setup-active");
			document.body.classList.remove("game-active");
			localStorage.removeItem("lastGame");
			document.body.classList.remove("fade");
		}, 500);
	};
	document.getElementById("stop").addEventListener("click", stop);
	document.getElementById("playAgain").addEventListener("click", () => {
		hideModal(victory);
		logic.setup(state.cpu);
	});
	document.getElementById("back").addEventListener("click", () => {
		hideModal(victory);
		stop();
	});
	document.getElementById("cancel").addEventListener("click", () => {
		hideModal(victory);
	});
	document.getElementById("howto").addEventListener("click", () => {
		showModal(rules);
	});
	document.getElementById("closeModal").addEventListener("click", () => {
		hideModal(rules);
	});
	document.getElementById("theme").addEventListener("click", () => {
		darkmode = !darkmode;
		setTheme(darkmode);
	});
}

function showModal(el) {
	el.classList.add("visible");
	backdrop.style.display = "block";
	setTimeout(() => backdrop.classList.add("active"), 0);
}

function hideModal(el) {
	el.classList.remove("visible");
	backdrop.classList.remove("active");
	setTimeout(() => (backdrop.style.display = "none"), 300);
}

function checkdom() {
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			squares[i][j].dataset.player = state.grid[i][j];
			squares[i][j].classList.remove("valid");
		}
	}
	turnDiv.innerText = state.turn === 1 ? "Black's Turn" : "White's Turn";
	grid.classList.add("turn-" + (state.turn === 1 ? "Black" : "White"));
	grid.classList.remove("turn-" + (state.turn === 2 ? "Black" : "White"));
}

const logic = {
	setup(cpu = 0) {
		state = {
			grid: new Array(8),
			moves: [],
			isPaused: false,
			focused: {
				i: -1,
				j: -1,
			},
			turn: 1,
			validMoves: {},
			p1: 0,
			p2: 0,
			cpu: cpu,
		};
		for (let i = 0; i < 8; i++) {
			state.grid[i] = new Array(8).fill(0);
		}
		this.setSquare(3, 3, 2);
		this.setSquare(3, 4, 1);
		this.setSquare(4, 3, 1);
		this.setSquare(4, 4, 2);
		checkdom();
		this.validMoves();
		turnDiv.innerText = "Black's Turn";
		grid.classList.add("turn-" + (state.turn === 1 ? "Black" : "White"));
		grid.classList.remove("turn-" + (state.turn === 2 ? "Black" : "White"));
		if (cpu === 1) {
			this.cpu();
		}
	},
	clickHandler(i, j) {
		this.inputHandler(i, j);
	},
	setSquare(i, j, player) {
		if (state.grid[i][j] !== 0) {
			squares[i][j].classList.add("filled");
		}
		state.grid[i][j] = player;
		squares[i][j].dataset.player = player;
	},
	inputHandler(i, j) {
		if (state.grid[i][j] === 0) {
			let move = state.validMoves[i * 10 + j];
			if (typeof move === "undefined") return false;
			let current = JSON.parse(JSON.stringify(state.grid));
			state.moves.push({
				grid: current,
				turn: state.turn,
			});
			this.setSquare(i, j, state.turn);
			this.react(state.turn, move);
			this.switchTurn();
			this.updateScore();
		}
	},
	updateScore() {
		scorep1.innerText = state.p1.toString().padStart(2, "0");
		scorep2.innerText = state.p2.toString().padStart(2, "0");
		localStorage.setItem("lastGame", JSON.stringify(state));
	},
	switchTurn() {
		state.turn = state.turn === 1 ? 2 : 1;
		let ended = this.validMoves();
		if (state.cpu === state.turn) {
			this.cpu();
		}
		if (!ended) return;
		turnDiv.innerText = state.turn === 1 ? "Black's Turn" : "White's Turn";
		grid.classList.add("turn-" + (state.turn === 1 ? "Black" : "White"));
		grid.classList.remove("turn-" + (state.turn === 2 ? "Black" : "White"));
	},
	undo() {
		if (state.moves.length === 0) return;
		let r;
		if (state.cpu !== 0 && state.turn !== state.cpu) {
			if (state.moves.length < 2) return;
			let length = state.moves.length;
			while (state.moves[length - 1].turn === state.cpu && length > 1) {
				state.moves.pop();
				length--;
			}
			r = state.moves[state.moves.length - 1];
			state.moves.pop();
		} else {
			r = state.moves[state.moves.length - 1];
			state.moves.pop();
		}
		state.grid = r.grid;
		state.turn = r.turn;
		checkdom();
		this.validMoves();
		localStorage.setItem("lastGame", JSON.stringify(state));
	},
	endgame() {
		if (state.p1 > state.p2) {
			turnDiv.innerText = winner.innerText = "Black Won!";
		}
		if (state.p1 < state.p2) {
			turnDiv.innerText = winner.innerText = "White Won!";
		}
		if (state.p1 === state.p2) {
			turnDiv.innerText = winner.innerText = "It's a Tie!";
		}
		showModal(victory);
		localStorage.removeItem("lastGame");
	},
	validMoves() {
		if (Object.keys(state.validMoves).length !== 0) {
			for (let id in state.validMoves) {
				squares[Math.floor(id / 10)][id % 10].classList.remove("valid");
			}
		}
		let cp = state.turn;
		state.validMoves = {};
		let validMoveCount = 0;
		let emptyslots = 0;
		state.p1 = 0;
		state.p2 = 0;
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (state.grid[i][j] === 0) {
					emptyslots++;
					let r = this.check(i, j, cp);
					if (r.size > 0) {
						state.validMoves[i * 10 + j] = r;
						validMoveCount++;
					}
				}
				if (state.grid[i][j] === 1) {
					state.p1++;
				}
				if (state.grid[i][j] === 2) {
					state.p2++;
				}
			}
		}
		this.updateScore();
		if (state.p1 === 0 || state.p2 === 0 || emptyslots === 0) {
			this.endgame();
			return false;
		}
		if (validMoveCount === 0) {
			if (state.wasLastTurnSkipped) {
				this.endgame();
				return false;
			}
			state.wasLastTurnSkipped = true;
			this.switchTurn();
		} else {
			state.wasLastTurnSkipped = false;
			Object.keys(state.validMoves).forEach((id) => {
				squares[Math.floor(id / 10)][id % 10].classList.add("valid");
			});
		}
		return true;
	},
	check(i, j, cp) {
		return new Set([
			...this.cRL(i, j, cp),
			...this.cRR(i, j, cp),
			...this.cCT(i, j, cp),
			...this.cCB(i, j, cp),
			...this.cDTL(i, j, cp),
			...this.cDTR(i, j, cp),
			...this.cDBL(i, j, cp),
			...this.cDBR(i, j, cp),
		]);
	},
	cRL(i, j, cp) {
		if (j === 0) return [];
		if (state.grid[i][j - 1] !== (cp === 1 ? 2 : 1)) return [];
		let eps = [];
		for (let n = j - 1; n >= 0; n--) {
			if (state.grid[i][n] === 0) return [];
			if (state.grid[i][n] === cp) return eps;
			eps.push(i * 10 + n);
		}
		return [];
	},
	cRR(i, j, cp) {
		if (j === 7) return [];
		if (state.grid[i][j + 1] !== (cp === 1 ? 2 : 1)) return [];
		let eps = [];
		for (let n = j + 1; n < 8; n++) {
			if (state.grid[i][n] === 0) return [];
			if (state.grid[i][n] === cp) return eps;
			eps.push(i * 10 + n);
		}
		return [];
	},
	cCT(i, j, cp) {
		if (i === 0) return [];
		if (state.grid[i - 1][j] !== (cp === 1 ? 2 : 1)) return [];
		let eps = [];
		for (let n = i - 1; n >= 0; n--) {
			if (state.grid[n][j] === 0) return [];
			if (state.grid[n][j] === cp) return eps;
			eps.push(n * 10 + j);
		}
		return [];
	},
	cCB(i, j, cp) {
		if (i === 7) return [];
		if (state.grid[i + 1][j] !== (cp === 1 ? 2 : 1)) return [];
		let eps = [];
		for (let n = i + 1; n < 8; n++) {
			if (state.grid[n][j] === 0) return [];
			if (state.grid[n][j] === cp) return eps;
			eps.push(n * 10 + j);
		}
		return [];
	},
	cDTL(i, j, cp) {
		if (i === 0 || j === 0) return [];
		if (state.grid[i - 1][j - 1] !== (cp === 1 ? 2 : 1)) return [];
		let eps = [];
		for (let n = i - 1, m = j - 1; n >= 0 && m >= 0; n--, m--) {
			if (state.grid[n][m] === 0) return [];
			if (state.grid[n][m] === cp) return eps;
			eps.push(n * 10 + m);
		}
		return [];
	},
	cDTR(i, j, cp) {
		if (i === 0 || j === 7) return [];
		if (state.grid[i - 1][j + 1] !== (cp === 1 ? 2 : 1)) return [];
		let eps = [];
		for (let n = i - 1, m = j + 1; n >= 0 && m < 8; n--, m++) {
			if (state.grid[n][m] === 0) return [];
			if (state.grid[n][m] === cp) return eps;
			eps.push(n * 10 + m);
		}
		return [];
	},
	cDBL(i, j, cp) {
		if (i === 7 || j === 0) return [];
		if (state.grid[i + 1][j - 1] !== (cp === 1 ? 2 : 1)) return [];
		let eps = [];
		for (let n = i + 1, m = j - 1; n < 8 && m >= 0; n++, m--) {
			if (state.grid[n][m] === 0) return [];
			if (state.grid[n][m] === cp) return eps;
			eps.push(n * 10 + m);
		}
		return [];
	},
	cDBR(i, j, cp) {
		if (i === 7 || j === 7) return [];
		if (state.grid[i + 1][j + 1] !== (cp === 1 ? 2 : 1)) return [];
		let eps = [];
		for (let n = i + 1, m = j + 1; n < 8 && m < 8; n++, m++) {
			if (state.grid[n][m] === 0) return [];
			if (state.grid[n][m] === cp) return eps;
			eps.push(n * 10 + m);
		}
		return [];
	},
	react(cp, move = new Set()) {
		for (let id of move) {
			this.setSquare(Math.floor(id / 10), id % 10, cp);
		}
	},
	cpu() {
		if (Object.keys(state.validMoves).length === 0) return;
		setTimeout(() => {
			let move;
			let size = 0;
			for (let id in state.validMoves) {
				if (state.validMoves[id].size > size) {
					move = id;
					size = state.validMoves[id].size;
				}
			}
			this.inputHandler(Math.floor(move / 10), move % 10);
		}, 1500);
	},
};

initGrid();

if (localStorage.getItem("lastGame")) {
	state = JSON.parse(localStorage.getItem("lastGame"));
	checkdom();
	logic.validMoves();
	document.body.classList.add("game-active");
} else {
	document.body.classList.add("setup-active");
}
