from flask import Flask, jsonify, request
from flask_cors import CORS
import string
import random

app = Flask(__name__)
CORS(app)

# Store games in memory
# Structure:
# {
#   "CODE": {
#       "board": [[None]*15]*15,
#       "turn": "black",
#       "players": { "black": "host_id", "white": "guest_id" },
#       "status": "waiting" | "playing" | "finished",
#       "winner": None
#   }
# }
GAMES = {}

def create_board(size=15):
    return [[None for _ in range(size)] for _ in range(size)]

def generate_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        if code not in GAMES:
            return code

@app.route('/game', methods=['POST'])
def create_game():
    data = request.json or {}
    size = data.get('size', 15)
    # Validate size?
    if size not in [9, 13, 15, 19]:
        size = 15

    color = data.get('color', 'black')
    if color not in ['black', 'white']:
        color = 'black'

    code = generate_code()
    GAMES[code] = {
        "board": create_board(size),
        "turn": "black",
        "players": {color: "host"},
        "status": "waiting",
        "winner": None
    }
    return jsonify({"game_code": code, "player_id": "host", "color": color})

@app.route('/game/<code>/join', methods=['POST'])
def join_game(code):
    game = GAMES.get(code)
    if not game:
        return jsonify({"error": "Game not found"}), 404

    if game["status"] != "waiting":
        return jsonify({"error": "Game already started or finished"}), 400

    host_color = list(game["players"].keys())[0]
    guest_color = 'white' if host_color == 'black' else 'black'

    game["players"][guest_color] = "guest"
    game["status"] = "playing"

    return jsonify({"player_id": "guest", "color": guest_color})

@app.route('/game/<code>', methods=['GET'])
def get_game(code):
    game = GAMES.get(code)
    if not game:
        return jsonify({"error": "Game not found"}), 404

    return jsonify({
        "board": game["board"],
        "turn": game["turn"],
        "status": game["status"],
        "winner": game["winner"]
    })

def check_win(board, row, col, color):
    # Basic 5 in a row check
    size = len(board)
    directions = [(0, 1), (1, 0), (1, 1), (1, -1)]

    for dr, dc in directions:
        count = 1
        # Forward
        r, c = row + dr, col + dc
        while 0 <= r < size and 0 <= c < size and board[r][c] == color:
            count += 1
            r += dr
            c += dc

        # Backward
        r, c = row - dr, col - dc
        while 0 <= r < size and 0 <= c < size and board[r][c] == color:
            count += 1
            r -= dr
            c -= dc

        if count >= 5:
            return True
    return False

@app.route('/game/<code>/move', methods=['POST'])
def make_move(code):
    game = GAMES.get(code)
    if not game:
        return jsonify({"error": "Game not found"}), 404

    data = request.json
    player_id = data.get("player_id") # 'host' or 'guest'
    row = data.get("row")
    col = data.get("col")

    if game["status"] != "playing":
        return jsonify({"error": "Game not playing"}), 400

    current_color = game["turn"]
    # Verify player_id maps to current_color
    if game["players"].get(current_color) != player_id:
        return jsonify({"error": "Not your turn"}), 403

    if game["board"][row][col] is not None:
        return jsonify({"error": "Invalid move"}), 400

    game["board"][row][col] = current_color

    if check_win(game["board"], row, col, current_color):
        game["winner"] = current_color
        game["status"] = "finished"
    else:
        game["turn"] = "white" if current_color == "black" else "black"

    return jsonify({
        "board": game["board"],
        "turn": game["turn"],
        "status": game["status"],
        "winner": game["winner"]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
