// C++ starter template shown on the "c++ starter" tab.
// The structure follows gurotopia (github.com/gurotopia/Gurotopia):
// one process, a TLS responder on :443, an ENet host on udp/17091,
// MariaDB for accounts and worlds. The code is a teaching skeleton:
// it keeps the wire format exact and leaves gameplay rules out.

import {
  CMakeLists,
  netHpp,
  itemsHpp,
  itemsCpp,
  itemsDumpCpp,
  protocolCpp,
  mainCpp,
  httpsHpp,
  httpsCpp,
  serverDataPhp,
  schemaSql,
  dbHpp,
  dbCpp,
  loginCpp,
  worldHpp,
  worldCpp,
  tilesCpp,
} from "./cppSources.js";

export const starterNav = [
  { id: "s-setup", label: "Setup" },
  { id: "s-build", label: "Project & CMake" },
  { id: "s-https", label: "HTTPS login" },
  { id: "s-items", label: "items.dat" },
  { id: "s-enet", label: "ENet server" },
  { id: "s-db", label: "MySQL" },
  { id: "s-login", label: "Create & log in" },
  { id: "s-join", label: "Join a world" },
  { id: "s-break", label: "Break a block" },
  { id: "s-next", label: "Next steps" },
];

export const requirements = [
  ["compiler", "g++ 13+ / clang 16+", "C++20, needs std::format"],
  ["build", "CMake 3.20+", "or a plain Makefile like gurotopia's"],
  ["enet", "patched fork", "usingNewPacket, enet_crc32, range coder"],
  ["database", "MariaDB or MySQL 8", "client lib: libmariadb / mysqlclient"],
  ["tls", "OpenSSL 3", "the HTTPS responder and SHA-256"],
];

export const setupCommands = {
  "windows · msys2": {
    code: String.raw`# in the MSYS2 UCRT64 shell
pacman -S --needed mingw-w64-ucrt-x86_64-{gcc,cmake,openssl,ninja} make

# MariaDB: install the .msi from mariadb.org, keep the service running`,
    note: "gurotopia's README uses this same package set, without CMake.",
  },
  "debian / ubuntu": {
    code: String.raw`sudo apt update
sudo apt install build-essential cmake libssl-dev libmariadb-dev ninja-build`,
  },
  arch: {
    code: String.raw`sudo pacman -S base-devel cmake openssl mariadb-libs ninja`,
  },
  macos: {
    code: String.raw`brew install cmake openssl@3 mariadb-connector-c ninja
# Apple's SDK has no OpenSSL headers: pass the prefix to CMake
#   -DOPENSSL_ROOT_DIR=$(brew --prefix openssl@3)`,
  },
};

export const enetBuild = {
  "build the fork": {
    code: String.raw`git clone https://github.com/ZTzTopia/enet third_party/enet
cmake -S third_party/enet -B third_party/enet/build -DCMAKE_BUILD_TYPE=Release
cmake --build third_party/enet/build -j`,
    note: "Copy the resulting headers to third_party/enet/include and the library to third_party/enet/lib.",
  },
  "or use gurotopia's copy": {
    code: String.raw`# gurotopia already ships the fork:
#   include/enet/     headers
#   include/enet/lib/ enet_32.lib (Windows), enet.a (Linux)
# point ENET_INCLUDE_DIR / ENET_LIBRARY at those and skip the build`,
  },
};

export const patchTable = [
  ["usingNewPacket", "client", "host->usingNewPacket = 1"],
  ["usingNewPacketForServer", "server", "host->usingNewPacketForServer = true"],
  ["checksum", "both", "host->checksum = enet_crc32"],
  ["range coder", "both", "enet_host_compress_with_range_coder(host)"],
];

export const hsSteps = [
  ["1", "client → :443", "POST /growtopia/server_data.php", "Your TLS responder answers with the server|port|type block."],
  ["2", "client → udp :17091", "ENet connect", "Three patched flags must already be set on the host."],
  ["3", "server → client", "SERVER_HELLO (1)", "Empty body: means send your login."],
  ["4", "client → server", "GENERIC_TEXT (2) · ltoken|…", "base64 of growId=NAME&password=PASS."],
  ["5", "server → client", "OnSendToServer(port, 0, user_id, \"ip|0|0\", 1, growid)", "CALL_FUNCTION 0x01 with a variant list."],
  ["6", "client → server", "GENERIC_TEXT (2) · tankIDName|…", "Full logon blob, arrives on the new peer."],
  ["7", "server → client", "OnSuperMainStartAcceptLogon… + menu", "Logon accepted, main menu appears."],
  ["8", "client → server", "action|enter_game, action|join_request", "GAME_MESSAGE (3). Name is in name|."],
  ["9", "server → client", "SEND_MAP_DATA (0x04) + OnSpawn", "World blob, then the avatar."],
];

// The login half: gurotopia/login-gurotopia. Steps are in the order you
// actually run them — dashboard first, then the token it hands to the C++ side.
export const loginSteps = [
  {
    title: "Know which half does what",
    body: "server_data.php tells the client to open https://<loginurl>/player/login/dashboard. That page is an ordinary web form; it posts to /player/growid/login/validate and the reply carries a base64 token. The game server never sees the form, only that token.",
  },
  {
    title: "Clone the dashboard and install Bun",
    body: "login-gurotopia is an Express app run by Bun because it uses Bun's SQL client for MySQL. Bun also executes the TypeScript directly, so there is no build step.",
    codeTitle: "terminal",
    code: String.raw`git clone https://github.com/gurotopia/login-gurotopia
cd login-gurotopia
bun install`,
  },
  {
    title: "Point it at the same MySQL the server uses",
    body: "One connection string, read from DATABASE_URL at startup; without it the app falls back to a gurotopia database. The repo's queries name the account table peer, not accounts — step 10 reconciles that.",
    codeTitle: ".env",
    code: String.raw`# login-gurotopia/.env
DATABASE_URL=mysql://root:@localhost:3306/gtps`,
  },
  {
    title: "Run it and check it answers",
    body: "bun run dev wraps index.ts in --watch. The port is hard-coded (const PORT = 3000), so a PORT variable is ignored — edit index.ts if 3000 is taken. Leave it running next to the C++ binary.",
    codeTitle: "terminal",
    code: String.raw`bun run dev
# [SERVER] Running on http://localhost:3000

curl -s http://localhost:3000/        # Hello, world!`,
  },
  {
    title: "Look at the page the client would load",
    body: "The client POSTs one pipe-delimited key to the dashboard route; the server base64-encodes that key and drops it into the hidden _token field. That is how client identity (RID, platform, protocol, version) survives the round trip. Open the route with no body and you get the same form, with an empty token.",
    codeTitle: "terminal",
    code: String.raw`curl -s http://localhost:3000/player/login/dashboard \
  | grep -o 'name="_token" value="[^"]*"'`,
  },
  {
    title: "Create the account from the form",
    body: "The register tab posts growId, email, password and password_confirmation. The route checks the name is free and answers success with a token whose reg=1 — but it inserts nothing. That is deliberate: your C++ on_login creates the row the first time it sees that token.",
    codeTitle: "terminal",
    code: String.raw`curl -s -X POST http://localhost:3000/player/growid/login/validate \
  -d 'growId=TESTER&email=t@example.com&password=secret' \
  -d 'password_confirmation=secret&_token=AAAA'`,
  },
  {
    title: "Log in and read the reply",
    body: "Without email the same route is a login: it loads the row, compares the password and returns the same shape with reg=0. Five failures from one IP lock it for an hour in memory, so restarting the dashboard clears the block.",
    codeTitle: "terminal",
    code: String.raw`curl -s -X POST http://localhost:3000/player/growid/login/validate \
  -d 'growId=TESTER&password=secret&_token=AAAA'

# {"status":"success","message":"Account Validated.","token":"...",
#  "url":"","accountType":"growtopia"}`,
  },
  {
    title: "Decode the token once, by hand",
    body: "The token is base64 of a query string, not JSON. Doing this yourself once explains why login.cpp needs nothing more than base64_decode plus field().",
    codeTitle: "terminal",
    code: String.raw`echo 'X3Rva2VuPUFBQUEmZ3Jvd0lkPVRFU1RFUiZwYXNzd29yZD1zZWNyZXQmcmVnPTA=' \
  | base64 -d
# _token=AAAA&growId=TESTER&password=secret&reg=0`,
  },
  {
    title: "Hand the token to the game server",
    body: "The client sends it as ltoken|<token> inside GENERIC_TEXT, followed by protocol, platformID and adc. on_login decodes it, looks the GrowID up, creates the row when it is new, and answers OnSendToServer so the client reconnects to udp/17091.",
    note: "Nothing has touched UDP yet: the whole account half is testable with curl.",
  },
  {
    title: "Make the two schemas agree",
    body: "The repo compares peer.password as plain text; sql/schema.sql stores a salted hash in accounts. Choose one table and one hash before you write more handlers, then keep both processes on it.",
    note: "Cheapest path: keep accounts, rewrite the two repo queries, and hash in the dashboard with the same SHA-256 + salt the server verifies.",
  },
];

export const loginEndpoints = [
  ["ALL", "/player/login/dashboard", "renders template/dashboard.html with _token injected"],
  ["ALL", "/player/growid/login/validate", "login or register → {status, message, token, url, accountType}"],
  ["ALL", "/player/growid/checktoken", "307 redirect, which keeps the POST body"],
  ["ALL", "/player/growid/validate/checktoken", "re-checks refreshToken, returns a refreshed token + accountAge"],
];

export const loginSchemaMap = [
  ["peer.uid", "accounts.user_id", "same value, different name"],
  ["peer.growid", "accounts.growid", "keep the UNIQUE index on both"],
  ["peer.password", "accounts.password_hash + salt", "the repo stores plain text today"],
  ["peer.gems / level / inventory", "missing from the starter", "add columns when you answer OnSetBux"],
];

export const loginTraps = [
  ["http on loginurl", "the client loads nothing", "loginurl needs TLS on 443 — proxy the dashboard behind the responder"],
  ["PORT = 3000", "EADDRINUSE on start", "edit index.ts; there is no environment override"],
  ["peer table missing", "500 on every login", "create the table the repo expects, or point its queries at accounts"],
  ["reg=1 returns a token, not a row", "the name looks taken, but no account exists", "let the game server create it on first ltoken"],
  ["password compared as text", "fine locally, wrong everywhere else", "hash on both sides before this leaves your machine"],
  ["five wrong passwords", "the right one is refused for an hour", "restart the dashboard to clear the in-memory block"],
];

export const mapLayout = [
  ["i16", "0", "unknown header, gurotopia writes 0"],
  ["i32", "0", "unknown header"],
  ["i16 + bytes", "name", "world name, length-prefixed"],
  ["i32", "100", "width in tiles"],
  ["i32", "60", "height in tiles"],
  ["i16", "6000", "tile count = width × height"],
  ["i32 i16 u8", "0 0 0", "unknown header"],
  ["8 B × 6000", "tiles", "fg u16, bg u16, state[4] — row-major"],
  ["i32 ×3", "0", "unknown header"],
  ["i32", "drops", "dropped object count"],
  ["i32", "uid", "last drop uid"],
];

export const traps = [
  [
    "stock ENet",
    "The client connects, then nothing arrives.",
    "Build ZTzTopia/enet, or apply the three patches yourself.",
  ],
  [
    "port 443 taken",
    "bind() fails and the client never gets server_data.",
    "Run elevated, or portproxy 443 → 8443.",
  ],
  [
    "self-signed cert",
    "TLS handshake aborts before the POST.",
    "Trust the cert locally, or use a client that skips verification.",
  ],
  [
    "state flag missing",
    "SEND_MAP_DATA / CALL_FUNCTION arrive with no payload.",
    "Set state = 0x08 (S_EXTENDED) whenever extra data is present.",
  ],
  [
    "tile index",
    "cord(x, y) = y * 100 + x, not x * 60 + y.",
    "One width constant used by both load and save.",
  ],
  [
    "world name case",
    "Join and map disagree, so the map loads empty.",
    "Uppercase the name before lookup, like gurotopia does.",
  ],
  [
    "no NUL on text",
    "gurotopia drops the last byte of message type 2 / 3.",
    "Append a trailing 0 after the text.",
  ],
];

export const nextSteps = [
  "handle movement packets (type 0) and broadcast them so other players see you walk",
  "save the inventory in the accounts table; right now it resets to the starter backpack on every login",
  "drop items as objects instead of putting them straight into the backpack",
  "use items.dat collision and clothing data for physics and OnSetClothing",
  "hash passwords with bcrypt or argon2 and give the server its own database user",
  "answer PING_REQUEST with PING_REPLY, or the client drops after a timeout",
  "handle drop, trash and wrench so items survive a broken block",
  "put the world lock / access check in front of place and break",
];

const loginIndexTs = String.raw`// login-gurotopia/index.ts — abridged to the routes that matter
import express from 'express';
import fs from 'fs';
import { SQL } from 'bun';

const db = new SQL(process.env.DATABASE_URL);
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1) the client POSTs one pipe-delimited key:
//    "tankIDName|\ntankIDPass|\nrequestedName|\nf|1\nprotocol|225...": ""
app.all('/player/login/dashboard', (req, res) => {
    const clientData = Object.keys(req.body ?? {})[0] ?? '';
    const token = Buffer.from(clientData).toString('base64');  // no JSON quotes

    const html = fs.readFileSync('template/dashboard.html', 'utf-8')
                   .replace('{{ data }}', token);              // -> hidden _token

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// 2) the form posts here; login and register share the route
app.all('/player/growid/login/validate', async (req, res) => {
    const growId = req.body.growId;
    const password = req.body.password;
    const email = req.body.email;
    const _token = req.body._token;

    // register: reject a taken name, never insert the row
    //   SELECT uid FROM peer WHERE growid = ?  ->  if a row comes back, error
    // login:    SELECT * FROM peer WHERE growid = ? and compare the password

    const reg = email ? '1' : '0';
    const token = Buffer.from(
        '_token=' + _token + '&growId=' + growId +
        '&password=' + password + '&reg=' + reg,
    ).toString('base64');

    res.send(JSON.stringify({
        status: 'success',
        message: email ? 'Account Created and Validated.' : 'Account Validated.',
        token,
        url: '',
        accountType: 'growtopia',
    }));
});

// 3) a saved login refreshes its token; 307 keeps the body intact
app.all('/player/growid/checktoken',
    (_req, res) => res.redirect(307, '/player/growid/validate/checktoken'));

app.all('/player/growid/validate/checktoken', async (req, res) => {
    const decoded = Buffer.from(req.body.refreshToken, 'base64').toString();
    // decoded: _token=...&growId=NAME&password=PASS&reg=0
    // re-check it against MySQL, then swap in the fresh clientData

    res.send(JSON.stringify({
        status: 'success',
        message: 'Account Validated.',
        token: Buffer.from(decoded).toString('base64'),
        url: '',
        accountType: 'growtopia',
        accountAge: 2,
    }));
});

app.listen(3000);`;

const loginDashboardHtml = String.raw`<!-- login-gurotopia/template/dashboard.html (form only) -->
<form action="/player/growid/login/validate" method="POST">
  <input type="hidden" name="_token" value="{{ data }}">

  <!-- shared -->
  <input name="growId"   pattern="[A-Za-z0-9]+" required>
  <input name="password" type="password"
         pattern="[A-Za-z0-9@._!\-]+" required>

  <!-- registration tab only -->
  <input name="email" type="email">
  <input name="password_confirmation" type="password">

  <button type="submit">Log in</button>
</form>

<!-- the server replaces {{ data }} with base64 of the client's raw POST key;
     the template's JS only toggles the two tabs and filters keystrokes -->`;

const loginEnv = String.raw`# login-gurotopia/.env
DATABASE_URL=mysql://root:@localhost:3306/gtps

# the listening port is NOT read from here:
#   const PORT = 3000;   // index.ts, edit the file`;

export const starterFiles = {
  "CMakeLists.txt": {
    code: CMakeLists,
    note: "Three targets: items (decoder library), items_dump (test tool, no dependencies) and gtps. Put your items.dat next to this file before building the server.",
  },
  "src/net.hpp": {
    code: netHpp,
    note: "The whole wire format in one header: little-endian blob, 56-byte header, variant list.",
  },
  "src/items.hpp": {
    code: itemsHpp,
    note: "item_info keeps only what the starter uses; items_db also keeps the raw file bytes to send to the client.",
  },
  "src/items.cpp": {
    code: itemsCpp,
    note: "Bounds-checked port of gurotopia's include/database/items.cpp. Every read goes through reader, so a wrong file fails with a message instead of crashing.",
  },
  "tools/items_dump.cpp": {
    code: itemsDumpCpp,
    note: "Test tool, needs no ENet/MySQL/OpenSSL:  items_dump items.dat gem",
  },
  "src/protocol.cpp": {
    code: protocolCpp,
    note: "Send helpers, send_items / send_inventory, broadcast_world and the receive switch: message type 2 is text, 3 is an action, 4 is a game packet.",
  },
  "src/main.cpp": {
    code: mainCpp,
    note: "Two listeners, one loop. The three ENet lines must run before the first peer connects.",
  },
  "src/https.hpp": { code: httpsHpp },
  "src/https.cpp": {
    code: httpsCpp,
    note: "One reply for every request, like gurotopia. Port 443 needs admin/root.",
  },
  "resources/server_data.php": {
    code: serverDataPhp,
    note: "The file the responder serves. Kept as a file so you can edit the address without recompiling.",
  },
  "sql/schema.sql": {
    code: schemaSql,
    note: "mysql -u root -p < sql/schema.sql",
  },
  "src/db.hpp": { code: dbHpp },
  "src/db.cpp": {
    code: dbCpp,
    note: "Every query is a prepared statement; the only concatenation is salt + password before hashing.",
  },
  "src/login.cpp": {
    code: loginCpp,
    note: "Account creation happens on the first successful ltoken, the way gurotopia does it.",
  },
  "login-gurotopia/index.ts": {
    code: loginIndexTs,
    note: "Abridged from the repo: same routes, same token format. The real file also adds CORS, a 50/min limiter and per-IP attempt tracking.",
  },
  "login-gurotopia/template/dashboard.html": {
    code: loginDashboardHtml,
    note: "The form half of the template. {{ data }} is the only placeholder the server replaces.",
  },
  "login-gurotopia/.env": {
    code: loginEnv,
    note: "Same MySQL as the C++ server. Table names still differ — see step 10.",
  },
  "src/world.hpp": {
    code: worldHpp,
    note: "cord() is the only place the 100-wide row stride lives.",
  },
  "src/world.cpp": {
    code: worldCpp,
    note: "World cache, serialize, send the map, spawn everyone for everyone, OnRemove when someone leaves.",
  },
  "src/tiles.cpp": {
    code: tilesCpp,
    note: "Hits and heal time come from items.dat. Breaking returns the block to the backpack; placing consumes one. Every change is broadcast to the world.",
  },
};
