//Welcome to app.js!

import { Chess } from "./chess.js";

const STACK_SIZE = 100; //maximum number of undos

const board = null;
const $board = $('#board');
const game = new Chess();
let globalSum = 0; //always 0 from black's perspective; negative for white's perspective
const whiteSquareGray = '#a9a9a9';
const blackSquareGray = '#696969';

const squareClass = 'square-55d63';
let squareToHighlight = null;
let colorToHighlight = null;
let positionCount;

//Setting up the board

const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
};

board = Chessboard('board', config);
timer = null;

// Piece Square Tables for the AI to follow

const weights = { p: 100, n: 280, b: 320, r: 479, q: 929, k: 60000, k_e: 60000 }; //Piece values

//Piece square tables for white pieces
const pst_w = {
    p: [
      [100, 100, 100, 100, 105, 100, 100, 100],
      [78, 83, 86, 73, 102, 82, 85, 90],
      [7, 29, 21, 44, 40, 31, 44, 7],
      [-17, 16, -2, 15, 14, 0, 15, -13],
      [-26, 3, 10, 9, 6, 1, 0, -23],
      [-22, 9, 5, -11, -10, -2, 3, -19],
      [-31, 8, -7, -37, -36, -14, 3, -31],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    n: [
      [-66, -53, -75, -75, -10, -55, -58, -70],
      [-3, -6, 100, -36, 4, 62, -4, -14],
      [10, 67, 1, 74, 73, 27, 62, -2],
      [24, 24, 45, 37, 33, 41, 25, 17],
      [-1, 5, 31, 21, 22, 35, 2, 0],
      [-18, 10, 13, 22, 18, 15, 11, -14],
      [-23, -15, 2, 0, 2, 0, -23, -20],
      [-74, -23, -26, -24, -19, -35, -22, -69],
    ],
    b: [
      [-59, -78, -82, -76, -23, -107, -37, -50],
      [-11, 20, 35, -42, -39, 31, 2, -22],
      [-9, 39, -32, 41, 52, -10, 28, -14],
      [25, 17, 20, 34, 26, 25, 15, 10],
      [13, 10, 17, 23, 17, 16, 0, 7],
      [14, 25, 24, 15, 8, 25, 20, 15],
      [19, 20, 11, 6, 7, 6, 20, 16],
      [-7, 2, -15, -12, -14, -15, -10, -10],
    ],
    r: [
      [35, 29, 33, 4, 37, 33, 56, 50],
      [55, 29, 56, 67, 55, 62, 34, 60],
      [19, 35, 28, 33, 45, 27, 25, 15],
      [0, 5, 16, 13, 18, -4, -9, -6],
      [-28, -35, -16, -21, -13, -29, -46, -30],
      [-42, -28, -42, -25, -25, -35, -26, -46],
      [-53, -38, -31, -26, -29, -43, -44, -53],
      [-30, -24, -18, 5, -2, -18, -31, -32],
    ],
    q: [
      [6, 1, -8, -104, 69, 24, 88, 26],
      [14, 32, 60, -10, 20, 76, 57, 24],
      [-2, 43, 32, 60, 72, 63, 43, 2],
      [1, -16, 22, 17, 25, 20, -13, -6],
      [-14, -15, -2, -5, -1, -10, -20, -22],
      [-30, -6, -13, -11, -16, -11, -16, -27],
      [-36, -18, 0, -19, -15, -15, -21, -38],
      [-39, -30, -31, -13, -31, -36, -34, -42],
    ],
    k: [
      [4, 54, 47, -99, -99, 60, 83, -62],
      [-32, 10, 55, 56, 56, 55, 10, 3],
      [-62, 12, -57, 44, -67, 28, 37, -31],
      [-55, 50, 11, -4, -19, 13, 0, -49],
      [-55, -43, -52, -28, -51, -47, -8, -50],
      [-47, -42, -43, -79, -64, -32, -29, -32],
      [-4, 3, -14, -50, -57, -18, 13, 4],
      [17, 30, -3, -14, 6, -1, 40, 18],
    ],
  
    // Endgame King Table
    k_e: [
      [-50, -40, -30, -20, -20, -30, -40, -50],
      [-30, -20, -10, 0, 0, -10, -20, -30],
      [-30, -10, 20, 30, 30, 20, -10, -30],
      [-30, -10, 30, 40, 40, 30, -10, -30],
      [-30, -10, 30, 40, 40, 30, -10, -30],
      [-30, -10, 20, 30, 30, 20, -10, -30],
      [-30, -30, 0, 0, 0, 0, -30, -30],
      [-50, -30, -30, -30, -30, -30, -30, -50],
    ],
};

//Piece square tables for black pieces
const pst_b = {
    p: pst_w['p'].slice().reverse(),
    n: pst_w['n'].slice().reverse(),
    b: pst_w['b'].slice().reverse(),
    r: pst_w['r'].slice().reverse(),
    q: pst_w['q'].slice().reverse(),
    k: pst_w['k'].slice().reverse(),
    k_e: pst_w['k_e'].slice().reverse(),
};

const pstOpponent = { w: pst_b, b: pst_w };
const pstSelf = { w: pst_w, b: pst_b };

//Evaluating the board in real time, based on PST and weights

function evaluateBoard(game, move, prevSum, color) {
    if (game.in_checkmate()) {
        //Opponent is checkmated, good for us
        if (move.color === color) {
            return 10 ** 10
        }
        //We are checkmated, bad for us
        else {
            return -(10 ** 10);
        }
    }

    //For when the game is in a draw, stalemate, or threefold repitition
    if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate()) {
        return 0;
    }

    if (game.in_check()) {
        //Opponent is in check, good for us
        if (move.color === color) {
            prevSum += 50;
        }

        //We're in check, bad for us
        else {
            prevSum -= 50;
        }
    }

    let from = [
        8 - parseInt(move.from[1]),
        move.from.charCodeAt(0) - 'a'.charCodeAt(0),
    ];
    let to = [
        8 - parseInt(move.to[1]),
        move.to.charCodeAt(0) - 'a'.charCodeAt(0),
    ];

    //Changes endgame behavior for kings
    if (prevSum < - 1500) {
        if (move.piece = 'k') {
            move.piece = 'k_e';
        }
    }

    if ('captured' in move) {
        //We captured, so piece weight added to our score
        if (move.color === color) {
            prevSum += weights[move.captured] + pstOpponent[move.color][move.captured][to[0]][to[1]];
        }
        //Our piece captured, so piece weight added to opponent's score
        else {
            prevSum -= weights[move.captured] + pstSelf[move.color][move.captured][to[0]][to[1]];
        }
    }

    if (move.flags.includes('p')) {
        //promotes to queen for simplicity
        move.promotion = 'q';

        //If our piece is promoted
        if (move.color === color) {
            prevSum -= weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
            prevSum += weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]];
        }

        //If our opponent promotes
        else {
            prevSum += weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
            prevSum -= weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]];
        }
    } else {
        //The promoted piece still exists on the updated board, so we need to change position value only
        if (move.color !== color) {
            prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
            prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]];
        } else {
            prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
            prevSum += pstSelf[move.color][move.piece][to[0]][to[1]];
        }
    }

    return prevSum;
}

//The minimax function to choose the move with the highest possible score

/* 
    Inputs:
        - game:                 the game object.
        - depth:                the depth of the recursive tree of all possible moves (i.e. height limit).
        - isMaximizingPlayer:   true if the current layer is maximizing, false otherwise.
        - sum:                  the sum (evaluation) so far at the current layer.
        - color:                the color of the current player.
*/

function minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color) {
    positionCount++;
    let children = game.ugly_moves({verbose: true});

    //Sorts moves randomly, so same moves aren't always chosen
    children.sort(function (a, b) {
        return 0.5 - Math.random();
    });

    let currMove;
    //If maximum depth exceeded or node is a terminal node (with no children)
    if (depth === 0 || children.length === 0) {
        return [null, sum];
    }

    //Find the max/min from a list of children (possible moves)
    //By testing how it would play out in the evaluateBoard function
    let maxValue = Number.NEGATIVE_INFINITY;
    let minValue = Number.POSITIVE_INFINITY;
    let bestMove;
    for (let i = 0; i < children.length; i++) {
        currMove = children[i];

        //In our case, the 'children' are modified game states
        let currPrettyMove = game.ugly_move(currMove);
        let newSum = evaluateBoard(game, currPrettyMove, sum, color);
        let [childBestMove, childValue] = minimax(
            game,
            depth - 1,
            alpha,
            beta,
            !isMaximizingPlayer,
            newSum,
            color
        );

        game.undo();

        //if the current move's value proves to be 
        //more than the max value so far,
        //the current move is chosen to be the new max value
        if (isMaximizingPlayer) {
            if (childValue > maxValue) {
              maxValue = childValue;
              bestMove = currPrettyMove;
            }
            if (childValue > alpha) {
              alpha = childValue;
            }
        } else {
            if (childValue < minValue) {
              minValue = childValue;
              bestMove = currPrettyMove;
            }
            if (childValue < beta) {
              beta = childValue;
            }
        }

        //Alpha-beta pruning, removes extra steps that the processor has to take
        //making the application faster and better performing

        if (alpha >= beta) {
            break;
        }
    }

    if (isMaximizingPlayer) {
        return [bestMove, maxValue];
    } else {
        return [bestMove, minValue];
    }
}   

function checkStatus(color) {
    if (game.in_checkmate()) {
        $('#status').html(`Checkmate! <strong>${color} lost.</strong>`);
    } else if (game.insufficient_material()) {
        $('#status').html(`<strong>Draw</strong> (Insufficient Material)`);
    } else if (game.in_threefold_repetition()) {
        $('#status').html(`<strong>Draw</strong> (Threefold Repetition)`);
    } else if (game.in_stalemate()) {
        $('#status').html(`<strong>Stalemate</strong> - No one wins`);
    } else if (game.in_draw()) {
        $('#status').html(`<strong>Draw</strong> (50-move Rule)`);
    } else if (game.in_check()) {
        $('#status').html(`<strong>${color}</strong> is in <strong>check!</strong>`);
        return false;
    } else {
        $('#status').html(`No check, checkmate, or draw.`);
        return false;
    }

    return true;
}

// function updateAdvantage() {
//     if (globalSum > 0) {
//       $('#advantageColor').text('Black');
//       $('#advantageNumber').text(globalSum);
//     } else if (globalSum < 0) {
//       $('#advantageColor').text('White');
//       $('#advantageNumber').text(-globalSum);
//     } else {
//       $('#advantageColor').text('Neither side');
//       $('#advantageNumber').text(globalSum);
//     }
//     $('#advantageBar').attr({
//       'aria-valuenow': `${-globalSum}`,
//       style: `width: ${((-globalSum + 2000) / 4000) * 100}%`,
//     });
// }

//Calculates the best legal move for the given color
function getBestMove(game, color, currSum) {
    positionCount = 0;

    //keep working...
}
