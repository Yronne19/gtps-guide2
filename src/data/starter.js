// C++ starter template shown on the "c++ starter" tab.
// The structure follows gurotopia (github.com/gurotopia/Gurotopia):
// one process, a TLS responder on :443, an ENet host on udp/17091,
// MariaDB for accounts and worlds. The code is a teaching skeleton:
// it keeps the wire format exact and leaves gameplay rules out.

export const starterNav = [
  { id: "s-setup", label: "Setup" },
  { id: "s-build", label: "Project & CMake" },
  { id: "s-https", label: "HTTPS login" },
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
  "broadcast tile updates to every peer in the world, not just the sender",
  "keep the world in memory while someone is inside; a database round trip per punch will not scale",
  "read items.dat so hardness, clothing and collision come from data, not constants",
  "hash passwords with bcrypt or argon2 and give the server its own database user",
  "send SEND_INVENTORY_STATE so the backpack stops showing the default",
  "answer PING_REQUEST with PING_REPLY, or the client drops after a timeout",
  "handle drop, trash and wrench so items survive a broken block",
  "put the world lock / access check in front of place and break",
];

const CMakeLists = `cmake_minimum_required(VERSION 3.20)
project(gtps LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(gtps
    src/main.cpp
    src/https.cpp
    src/db.cpp
    src/protocol.cpp
    src/login.cpp
    src/world.cpp
    src/tiles.cpp
)

target_include_directories(gtps PRIVATE include)

# --- OpenSSL: HTTPS and the password hash ---
find_package(OpenSSL REQUIRED)
target_link_libraries(gtps PRIVATE OpenSSL::SSL OpenSSL::Crypto)

# --- ENet: the patched fork, never a stock package ---
find_path(ENET_INCLUDE_DIR NAMES enet/enet.h
          PATHS third_party/enet/include NO_DEFAULT_PATH)
find_library(ENET_LIBRARY NAMES enet enet_32 enet_macos
             PATHS third_party/enet/lib NO_DEFAULT_PATH)

if(NOT ENET_INCLUDE_DIR OR NOT ENET_LIBRARY)
    message(FATAL_ERROR "Build the patched ENet into third_party/enet first.")
endif()

target_include_directories(gtps PRIVATE \${ENET_INCLUDE_DIR})
target_link_libraries(gtps PRIVATE \${ENET_LIBRARY})

# --- MySQL / MariaDB client ---
find_path(MYSQL_INCLUDE_DIR NAMES mysql/mysql.h)
find_library(MYSQL_LIBRARY NAMES mariadb libmariadb mysqlclient)

if(NOT MYSQL_INCLUDE_DIR OR NOT MYSQL_LIBRARY)
    message(FATAL_ERROR "Install libmariadb-dev / MariaDB Connector/C.")
endif()

target_include_directories(gtps PRIVATE \${MYSQL_INCLUDE_DIR})
target_link_libraries(gtps PRIVATE \${MYSQL_LIBRARY})

find_package(Threads REQUIRED)
target_link_libraries(gtps PRIVATE Threads::Threads)

if(WIN32)
    target_link_libraries(gtps PRIVATE ws2_32 winmm)
endif()

# the server reads these at runtime, relative to its working directory
add_custom_command(TARGET gtps POST_BUILD
    COMMAND \${CMAKE_COMMAND} -E copy_if_different
            \${CMAKE_SOURCE_DIR}/resources/server_data.php
            $<TARGET_FILE_DIR:gtps>/server_data.php
    COMMAND \${CMAKE_COMMAND} -E copy_directory
            \${CMAKE_SOURCE_DIR}/resources/ctx
            $<TARGET_FILE_DIR:gtps>/resources/ctx
)`;

const netHpp = String.raw`#pragma once
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <initializer_list>
#include <string>
#include <vector>
#include <enet/enet.h>

using u8  = std::uint8_t;
using u16 = std::uint16_t;
using u32 = std::uint32_t;
using i32 = std::int32_t;

/* Little-endian builder: every field inside a Growtopia payload is LE. */
struct blob
{
    std::vector<u8> bytes;

    void u8v(u8 v) { bytes.push_back(v); }
    void u16v(u16 v) { u8v(u8(v)); u8v(u8(v >> 8)); }
    void i16v(i32 v) { u16v(u16(v)); }
    void u32v(u32 v) { for (int i = 0; i < 4; ++i) u8v(u8(v >> (8 * i))); }
    void i32v(i32 v) { u32v(u32(v)); }
    void f32v(float v) { u32 raw; std::memcpy(&raw, &v, 4); u32v(raw); }
    void str(const std::string &s)
    {
        i32v(i32(s.size()));
        bytes.insert(bytes.end(), s.begin(), s.end());
    }
    void append(const blob &other)
    {
        bytes.insert(bytes.end(), other.bytes.begin(), other.bytes.end());
    }
};

/* Message type 4 + the 56-byte header. Offsets are header-relative;
   add 4 for the position inside the packet. */
struct game_packet
{
    i32 type = 0;        // 0x03 tile change, 0x04 map, 0x05 tile update
    i32 netid = -1;
    i32 uid = -1;
    i32 state = 0;       // 0x08 = S_EXTENDED
    float count = 0.f;
    i32 id = 0;          // itemID: 18 fist, 32 wrench
    float x = 0.f, y = 0.f;
    float sx = 0.f, sy = 0.f;
    float extra_f = 0.f;
    i32 tile_x = 0, tile_y = 0;
    blob extra;

    blob encode() const
    {
        blob b;
        b.i32v(4);                        // GAME_PACKET
        b.i32v(type);                     // offset  4
        b.i32v(netid);                    // offset  8
        b.i32v(uid);                      // offset 12
        b.i32v(state);                    // offset 16
        b.f32v(count);                    // offset 20
        b.i32v(id);                       // offset 24
        b.f32v(x);      b.f32v(y);        // offset 28, 32
        b.f32v(sx);     b.f32v(sy);       // offset 36, 40
        b.f32v(extra_f);                  // offset 44
        b.i32v(tile_x); b.i32v(tile_y);   // offset 48, 52
        b.i32v(i32(extra.bytes.size()));  // offset 56
        b.append(extra);
        return b;
    }
};

struct peer
{
    i32 user_id = 0;
    i32 netid = -1;
    std::string growid;
    std::string world;
    float x = 0.f, y = 0.f;
};

/* variant list argument: 1 float, 2 string, 3 vec2, 5 u32, 9 i32 */
struct variant
{
    u8 kind = 2;
    float f = 0.f;
    float g = 0.f;
    i32 n = 0;
    std::string s;
};

variant Vstr(std::string v);
variant Vnum(i32 v);
variant Vflt(float v);
variant Vvec(float x, float y);

void send_raw(ENetPeer *peer, const blob &b);
void send_text(ENetPeer *peer, i32 message_type, const std::string &text);
void send_call(ENetPeer *peer, i32 netid, std::initializer_list<variant> args);
void handle_message(ENetPeer *peer, const u8 *data, std::size_t size);

std::string field(const std::string &text, const std::string &key);

bool on_login(peer *p, ENetPeer *ep, const std::string &text);
void on_logon(peer *p, ENetPeer *ep, const std::string &text);
void on_action(peer *p, ENetPeer *ep, const std::string &text);
void on_join(peer *p, ENetPeer *ep, const std::string &name);
void on_tile_change(peer *p, ENetPeer *ep, const game_packet &gp);`;

const protocolCpp = String.raw`#include "net.hpp"

#include <algorithm>

variant Vstr(std::string v) { variant r; r.kind = 2; r.s = std::move(v); return r; }
variant Vnum(i32 v) { variant r; r.kind = 9; r.n = v; return r; }
variant Vflt(float v) { variant r; r.kind = 1; r.f = v; return r; }
variant Vvec(float x, float y) { variant r; r.kind = 3; r.f = x; r.g = y; return r; }

void send_raw(ENetPeer *peer, const blob &b)
{
    ENetPacket *packet = enet_packet_create(
        b.bytes.data(), b.bytes.size(), ENET_PACKET_FLAG_RELIABLE);
    if (!packet) return;
    if (enet_peer_send(peer, 0, packet) != 0) enet_packet_destroy(packet);
}

/* Message types 2 and 3 are plain text; gurotopia drops the last byte,
   so the trailing NUL has to be there. */
void send_text(ENetPeer *peer, i32 message_type, const std::string &text)
{
    blob b;
    b.i32v(message_type);
    b.bytes.insert(b.bytes.end(), text.begin(), text.end());
    b.u8v(0);
    send_raw(peer, b);
}

void send_call(ENetPeer *peer, i32 netid, std::initializer_list<variant> args)
{
    blob extra;
    extra.u8v(u8(args.size()));

    u8 index = 0;
    for (const variant &v : args) {
        extra.u8v(index++);
        extra.u8v(v.kind);
        if (v.kind == 1)      extra.f32v(v.f);
        else if (v.kind == 2) extra.str(v.s);
        else if (v.kind == 3) { extra.f32v(v.f); extra.f32v(v.g); }
        else                  extra.i32v(v.n);
    }

    game_packet gp;
    gp.type = 0x01;      // CALL_FUNCTION
    gp.netid = netid;
    gp.state = 0x08;     // S_EXTENDED
    gp.extra = extra;
    send_raw(peer, gp.encode());
}

/* key|value on a line, or key=value inside the decoded ltoken. */
std::string field(const std::string &text, const std::string &key)
{
    for (const char separator : {'|', '='}) {
        const std::string needle = key + separator;

        for (std::size_t at = text.find(needle); at != std::string::npos;
             at = text.find(needle, at + 1)) {
            if (at != 0 && text[at - 1] != '\n') continue;

            at += needle.size();
            const std::size_t end = text.find_first_of("\n&", at);
            return text.substr(at, end == std::string::npos ? end : end - at);
        }
    }
    return {};
}

void handle_message(ENetPeer *ep, const u8 *data, std::size_t size)
{
    if (size < 4) return;

    i32 message_type = 0;
    std::memcpy(&message_type, data, 4);

    peer *p = static_cast<peer *>(ep->data);
    if (!p) return;

    if (message_type == 2) {
        const std::string text(reinterpret_cast<const char *>(data + 4), size - 4);
        if (text.find("ltoken|") != std::string::npos) on_login(p, ep, text);
        else                                           on_logon(p, ep, text);
    }
    else if (message_type == 3) {
        on_action(p, ep, std::string(reinterpret_cast<const char *>(data + 4), size - 4));
    }
    else if (message_type == 4 && size >= 60) {
        const u8 *h = data + 4;
        game_packet gp;

        std::memcpy(&gp.type,    h +  0, 4);
        std::memcpy(&gp.netid,   h +  4, 4);
        std::memcpy(&gp.uid,     h +  8, 4);
        std::memcpy(&gp.state,   h + 12, 4);
        std::memcpy(&gp.count,   h + 16, 4);
        std::memcpy(&gp.id,      h + 20, 4);
        std::memcpy(&gp.x,       h + 24, 4);
        std::memcpy(&gp.y,       h + 28, 4);
        std::memcpy(&gp.sx,      h + 32, 4);
        std::memcpy(&gp.sy,      h + 36, 4);
        std::memcpy(&gp.extra_f, h + 40, 4);
        std::memcpy(&gp.tile_x,  h + 44, 4);
        std::memcpy(&gp.tile_y,  h + 48, 4);

        i32 extra_length = 0;
        std::memcpy(&extra_length, h + 52, 4);

        const std::size_t take = std::min<std::size_t>(
            extra_length > 0 ? std::size_t(extra_length) : 0, size - 60);
        gp.extra.bytes.assign(h + 56, h + 56 + take);

        if ((gp.type & 0xff) == 0x03) on_tile_change(p, ep, gp);
    }
}`;

const mainCpp = String.raw`#include "db.hpp"
#include "https.hpp"
#include "net.hpp"

#include <csignal>
#include <cstdio>
#include <thread>

static volatile std::sig_atomic_t g_stop = 0;
static void on_signal(int) { g_stop = 1; }

int main()
{
    std::signal(SIGINT, on_signal);

    if (!db_open("127.0.0.1", "root", "", "gtps")) {
        std::puts("mysql: check the server, the credentials and the gtps database");
        return 1;
    }

    if (enet_initialize() != 0) return 1;

    std::thread(https_run).detach();          // TLS responder on :443

    ENetAddress address{};
    address.type = ENET_ADDRESS_TYPE_IPV4;
    address.port = 17091;
    enet_address_set_host_ip(&address, "127.0.0.1");

    ENetHost *host = enet_host_create(
        ENET_ADDRESS_TYPE_IPV4, &address, 64 /* peers */, 2 /* channels */, 0, 0);
    if (!host) {
        std::puts("enet: cannot bind udp/17091");
        return 1;
    }

    host->usingNewPacketForServer = true;       // 1 of 3 patches
    host->checksum = enet_crc32;                // 2 of 3
    enet_host_compress_with_range_coder(host);  // 3 of 3

    std::puts("https://127.0.0.1/growtopia/server_data.php");
    std::puts("enet udp/17091");

    ENetEvent event{};
    while (!g_stop) {
        if (enet_host_service(host, &event, 50) <= 0) continue;

        if (event.type == ENET_EVENT_TYPE_CONNECT) {
            event.peer->data = new peer{};
            send_text(event.peer, 1, "");   // SERVER_HELLO: send me your login
        }
        else if (event.type == ENET_EVENT_TYPE_RECEIVE) {
            handle_message(event.peer, event.packet->data, event.packet->dataLength);
            enet_packet_destroy(event.packet);
        }
        else if (event.type == ENET_EVENT_TYPE_DISCONNECT) {
            delete static_cast<peer *>(event.peer->data);
            event.peer->data = nullptr;
        }
    }

    enet_host_destroy(host);
    enet_deinitialize();
    std::puts("stopped");
}`;

const httpsHpp = String.raw`#pragma once

/* Blocking TLS responder for server_data.php. Runs on its own thread. */
void https_run();`;

const httpsCpp = String.raw`#include "https.hpp"

#include <cstdio>
#include <string>

#include <openssl/ssl.h>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    using socket_t = SOCKET;
    #define CLOSE_SOCKET closesocket
#else
    #include <arpa/inet.h>
    #include <netinet/in.h>
    #include <sys/socket.h>
    #include <unistd.h>
    using socket_t = int;
    #define INVALID_SOCKET (-1)
    #define CLOSE_SOCKET close
#endif

/* This is exactly what gurotopia serves for server_data.php. */
static const char *kServerData =
    "server|127.0.0.1\n"
    "port|17091\n"
    "type|1\n"
    "type2|1\n"
    "#maint|Server under maintenance. Please try again later.\n"
    "loginurl|127.0.0.1\n"
    "meta|gtps\n"
    "RTENDMARKERBS1001";

static std::string http_reply()
{
    const std::string body = kServerData;

    return "HTTP/1.1 200 OK\r\n"
           "Content-Type: text/plain\r\n"
           "Content-Length: " + std::to_string(body.size()) + "\r\n"
           "Connection: close\r\n\r\n" +
           body;
}

void https_run()
{
#ifdef _WIN32
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
#endif

    SSL_CTX *ctx = SSL_CTX_new(TLS_server_method());
    if (!ctx) return;

    SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION);

    if (SSL_CTX_use_certificate_file(ctx, "resources/ctx/server.crt", SSL_FILETYPE_PEM) != 1 ||
        SSL_CTX_use_PrivateKey_file(ctx, "resources/ctx/server.key", SSL_FILETYPE_PEM) != 1) {
        std::fprintf(stderr, "https: cannot read resources/ctx/server.crt|key\n");
        return;
    }

    socket_t listener = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listener == INVALID_SOCKET) return;

    int enable = 1;
    setsockopt(listener, SOL_SOCKET, SO_REUSEADDR,
               reinterpret_cast<const char *>(&enable), sizeof enable);

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(443);

    if (bind(listener, reinterpret_cast<sockaddr *>(&addr), sizeof addr) != 0) {
        std::fprintf(stderr, "https: cannot bind :443 (run elevated)\n");
        return;
    }

    listen(listener, 16);

    for (;;) {
        socket_t fd = accept(listener, nullptr, nullptr);
        if (fd == INVALID_SOCKET) continue;

        SSL *ssl = SSL_new(ctx);
        SSL_set_fd(ssl, static_cast<int>(fd));

        if (SSL_accept(ssl) <= 0) {
            SSL_free(ssl);
            CLOSE_SOCKET(fd);
            continue;
        }

        char request[1024];
        SSL_read(ssl, request, sizeof request);   // the POST; the reply never varies

        const std::string reply = http_reply();
        SSL_write(ssl, reply.data(), static_cast<int>(reply.size()));

        SSL_shutdown(ssl);
        SSL_free(ssl);
        CLOSE_SOCKET(fd);
    }
}`;

const serverDataPhp = String.raw`server|127.0.0.1
port|17091
type|1
type2|1
#maint|Server under maintenance. Please try again later.
loginurl|127.0.0.1
meta|gtps
RTENDMARKERBS1001`;

const schemaSql = String.raw`CREATE DATABASE IF NOT EXISTS gtps
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE gtps;

CREATE TABLE IF NOT EXISTS accounts (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    growid        VARCHAR(18) NOT NULL UNIQUE,
    password_hash CHAR(64)    NOT NULL,   -- sha256(salt + password), hex
    salt          CHAR(32)    NOT NULL,
    gems          BIGINT      NOT NULL DEFAULT 0,
    level         INT         NOT NULL DEFAULT 1,
    created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS worlds (
    name       VARCHAR(24) NOT NULL PRIMARY KEY,
    owner_id   INT         NOT NULL DEFAULT 0,
    tiles      LONGBLOB,                  -- 8 bytes per tile, 6000 tiles
    updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- For reference, gurotopia creates the same two tables under the names
-- "peer" and "world", with inventory, gems, level and xp on the account.`;

const dbHpp = String.raw`#pragma once
#include "net.hpp"

struct account
{
    i32 user_id = 0;
    std::string growid;
};

bool db_open(const char *host, const char *user, const char *password,
             const char *database);

bool db_exists(const std::string &growid);
bool db_create(const std::string &growid, const std::string &password, account &out);
bool db_login(const std::string &growid, const std::string &password, account &out);

bool db_world_load(const std::string &name, i32 &owner_id, std::vector<u8> &tiles);
void db_world_save(const std::string &name, i32 owner_id, const std::vector<u8> &tiles);`;

const dbCpp = String.raw`#include "db.hpp"

#include <cstdio>
#include <cstring>

#include <mysql/mysql.h>
#include <openssl/evp.h>
#include <openssl/rand.h>

static MYSQL *g_db = nullptr;

static std::string to_hex(const unsigned char *data, unsigned length)
{
    static const char *digits = "0123456789abcdef";

    std::string out;
    out.reserve(length * 2);
    for (unsigned i = 0; i < length; ++i) {
        out.push_back(digits[data[i] >> 4]);
        out.push_back(digits[data[i] & 0x0f]);
    }
    return out;
}

static std::string sha256_hex(const std::string &input)
{
    unsigned char digest[32];
    unsigned int length = 0;

    EVP_Digest(input.data(), input.size(), digest, &length, EVP_sha256(), nullptr);
    return to_hex(digest, length);
}

static std::string random_salt()
{
    unsigned char raw[16];
    if (RAND_bytes(raw, sizeof raw) != 1) return std::string(32, '0');
    return to_hex(raw, sizeof raw);
}

bool db_open(const char *host, const char *user, const char *password,
             const char *database)
{
    g_db = mysql_init(nullptr);
    if (!g_db) return false;

    if (!mysql_real_connect(g_db, host, user, password, database,
                            3306, nullptr, 0)) {
        std::fprintf(stderr, "mysql: %s\n", mysql_error(g_db));
        return false;
    }

    mysql_set_character_set(g_db, "utf8mb4");
    return true;
}

bool db_exists(const std::string &growid)
{
    MYSQL_STMT *stmt = mysql_stmt_init(g_db);
    const char *sql = "SELECT 1 FROM accounts WHERE growid = ? LIMIT 1";
    mysql_stmt_prepare(stmt, sql, (unsigned long)std::strlen(sql));

    MYSQL_BIND in{};
    in.buffer_type = MYSQL_TYPE_STRING;
    in.buffer = (void *)growid.data();
    in.buffer_length = (unsigned long)growid.size();
    mysql_stmt_bind_param(stmt, &in);

    mysql_stmt_execute(stmt);
    mysql_stmt_store_result(stmt);

    const bool found = mysql_stmt_num_rows(stmt) > 0;
    mysql_stmt_close(stmt);
    return found;
}

bool db_create(const std::string &growid, const std::string &password, account &out)
{
    const std::string salt = random_salt();
    const std::string hash = sha256_hex(salt + password);

    MYSQL_STMT *stmt = mysql_stmt_init(g_db);
    const char *sql =
        "INSERT INTO accounts (growid, password_hash, salt) VALUES (?, ?, ?)";
    mysql_stmt_prepare(stmt, sql, (unsigned long)std::strlen(sql));

    MYSQL_BIND in[3]{};
    in[0].buffer_type = MYSQL_TYPE_STRING;
    in[0].buffer = (void *)growid.data();
    in[0].buffer_length = (unsigned long)growid.size();

    in[1].buffer_type = MYSQL_TYPE_STRING;
    in[1].buffer = (void *)hash.data();
    in[1].buffer_length = (unsigned long)hash.size();

    in[2].buffer_type = MYSQL_TYPE_STRING;
    in[2].buffer = (void *)salt.data();
    in[2].buffer_length = (unsigned long)salt.size();

    mysql_stmt_bind_param(stmt, in);
    const bool ok = mysql_stmt_execute(stmt) == 0;
    const i32 id = (i32)mysql_stmt_insert_id(stmt);
    mysql_stmt_close(stmt);

    if (!ok) return false;

    out.user_id = id;
    out.growid = growid;
    return true;
}

bool db_login(const std::string &growid, const std::string &password, account &out)
{
    MYSQL_STMT *stmt = mysql_stmt_init(g_db);
    const char *sql =
        "SELECT user_id, password_hash, salt FROM accounts WHERE growid = ? LIMIT 1";
    mysql_stmt_prepare(stmt, sql, (unsigned long)std::strlen(sql));

    MYSQL_BIND in{};
    in.buffer_type = MYSQL_TYPE_STRING;
    in.buffer = (void *)growid.data();
    in.buffer_length = (unsigned long)growid.size();
    mysql_stmt_bind_param(stmt, &in);
    mysql_stmt_execute(stmt);

    i32 user_id = 0;
    char hash[65]{};
    char salt[33]{};
    unsigned long hash_length = 0;
    unsigned long salt_length = 0;

    MYSQL_BIND res[3]{};
    res[0].buffer_type = MYSQL_TYPE_LONG;
    res[0].buffer = &user_id;

    res[1].buffer_type = MYSQL_TYPE_STRING;
    res[1].buffer = hash;
    res[1].buffer_length = sizeof hash;
    res[1].length = &hash_length;

    res[2].buffer_type = MYSQL_TYPE_STRING;
    res[2].buffer = salt;
    res[2].buffer_length = sizeof salt;
    res[2].length = &salt_length;

    mysql_stmt_bind_result(stmt, res);
    const bool found = mysql_stmt_fetch(stmt) == 0;
    mysql_stmt_close(stmt);

    if (!found) return false;

    const std::string expected(hash, hash_length);
    const std::string computed = sha256_hex(std::string(salt, salt_length) + password);
    if (computed != expected) return false;

    out.user_id = user_id;
    out.growid = growid;
    return true;
}

bool db_world_load(const std::string &name, i32 &owner_id, std::vector<u8> &tiles)
{
    MYSQL_STMT *stmt = mysql_stmt_init(g_db);
    const char *sql = "SELECT owner_id, tiles FROM worlds WHERE name = ? LIMIT 1";
    mysql_stmt_prepare(stmt, sql, (unsigned long)std::strlen(sql));

    MYSQL_BIND in{};
    in.buffer_type = MYSQL_TYPE_STRING;
    in.buffer = (void *)name.data();
    in.buffer_length = (unsigned long)name.size();
    mysql_stmt_bind_param(stmt, &in);
    mysql_stmt_execute(stmt);

    tiles.resize(6000 * 8);
    unsigned long length = 0;

    MYSQL_BIND res[2]{};
    res[0].buffer_type = MYSQL_TYPE_LONG;
    res[0].buffer = &owner_id;

    res[1].buffer_type = MYSQL_TYPE_BLOB;
    res[1].buffer = tiles.data();
    res[1].buffer_length = (unsigned long)tiles.size();
    res[1].length = &length;

    mysql_stmt_bind_result(stmt, res);
    const bool found = mysql_stmt_fetch(stmt) == 0;
    if (found) tiles.resize(length);
    mysql_stmt_close(stmt);
    return found;
}

void db_world_save(const std::string &name, i32 owner_id,
                   const std::vector<u8> &tiles)
{
    MYSQL_STMT *stmt = mysql_stmt_init(g_db);
    const char *sql =
        "INSERT INTO worlds (name, owner_id, tiles) VALUES (?, ?, ?) "
        "ON DUPLICATE KEY UPDATE owner_id = VALUES(owner_id), tiles = VALUES(tiles)";
    mysql_stmt_prepare(stmt, sql, (unsigned long)std::strlen(sql));

    std::vector<u8> copy = tiles;

    MYSQL_BIND in[3]{};
    in[0].buffer_type = MYSQL_TYPE_STRING;
    in[0].buffer = (void *)name.data();
    in[0].buffer_length = (unsigned long)name.size();

    in[1].buffer_type = MYSQL_TYPE_LONG;
    in[1].buffer = &owner_id;

    in[2].buffer_type = MYSQL_TYPE_BLOB;
    in[2].buffer = copy.data();
    in[2].buffer_length = (unsigned long)copy.size();

    mysql_stmt_bind_param(stmt, in);
    mysql_stmt_execute(stmt);
    mysql_stmt_close(stmt);
}`;

const loginCpp = String.raw`#include "db.hpp"
#include "net.hpp"

#include <cctype>
#include <format>

/* ltoken is base64 of growId=NAME&password=PASS */
static std::string base64_decode(const std::string &in)
{
    static const std::string table =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    std::string out;
    int value = 0;
    int bits = -8;

    for (const unsigned char c : in) {
        if (c == '=') break;

        const std::size_t index = table.find(char(c));
        if (index == std::string::npos) continue;

        value = (value << 6) + int(index);
        bits += 6;

        if (bits >= 0) {
            out.push_back(char((value >> bits) & 0xff));
            bits -= 8;
        }
    }
    return out;
}

bool on_login(peer *p, ENetPeer *ep, const std::string &text)
{
    const std::string decoded = base64_decode(field(text, "ltoken"));
    const std::string growid = field(decoded, "growId");
    const std::string password = field(decoded, "password");

    if (growid.empty() || password.empty()) {
        send_text(ep, 3, "action|logon_fail\n");
        return false;
    }

    account acc{};

    if (!db_login(growid, password, acc)) {
        if (db_exists(growid)) {                 // wrong password
            send_text(ep, 3, "action|logon_fail\n");
            return false;
        }

        if (!db_create(growid, password, acc)) { // first login creates the account
            send_text(ep, 3, "action|logon_fail\n");
            return false;
        }

        send_call(ep, -1, {
            Vstr("OnConsoleMessage"),
            Vstr("New account created: " + growid),
        });
    }

    p->user_id = acc.user_id;
    p->growid = acc.growid;

    /* The client reconnects to this port and sends tankIDName next. */
    send_call(ep, -1, {
        Vstr("OnSendToServer"),
        Vnum(17091),              // port
        Vnum(0),                  // token
        Vnum(acc.user_id),        // user id
        Vstr("127.0.0.1|0|0"),    // ip
        Vnum(1),                  // ?
        Vstr(acc.growid),
    });
    return true;
}

void on_logon(peer *p, ENetPeer *ep, const std::string &text)
{
    if (p->user_id == 0) return;    // tankIDName before a login

    p->user_id = field(text, "user").empty()
                     ? p->user_id
                     : std::atoi(field(text, "user").c_str());

    /* gurotopia sends this with its items.dat hash and client flags;
       an empty call is enough to leave the login screen. */
    send_call(ep, -1, { Vstr("OnSuperMainStartAcceptLogonHrdxs47254722215a") });
    send_call(ep, -1, { Vstr("OnConsoleMessage"), Vstr("Logged in as " + p->growid) });
    send_call(ep, -1, { Vstr("OnSetBux"), Vnum(0) });
    send_call(ep, -1, { Vstr("OnRequestWorldSelectMenu") });
}

void on_action(peer *p, ENetPeer *ep, const std::string &text)
{
    if (text.rfind("action|enter_game", 0) == 0) {
        send_call(ep, -1, { Vstr("OnRequestWorldSelectMenu") });
        return;
    }

    if (text.rfind("action|join_request", 0) == 0) {
        std::string name = field(text, "name");
        for (char &c : name) c = char(std::toupper((unsigned char)c));
        on_join(p, ep, name);
        return;
    }

    if (text.rfind("action|quit", 0) == 0) {
        p->world.clear();
        send_call(ep, -1, { Vstr("OnRequestWorldSelectMenu") });
    }
}`;

const worldHpp = String.raw`#pragma once
#include "net.hpp"

struct tile
{
    u16 fg = 0;
    u16 bg = 0;
    u8 state[4] = {0, 0, 0, 0};
    u8 hits = 0;            // punches so far, not persisted
};

struct world
{
    std::string name;
    i32 owner_id = 0;
    std::vector<tile> tiles;         // 100 * 60, row-major
    float spawn_x = 50 * 32.f + 16.f;
    float spawn_y = 36 * 32.f + 16.f;
};

inline constexpr i32 kWidth = 100;
inline constexpr i32 kHeight = 60;

/* row-major: 100 tiles per row, not 60 */
inline int cord(i32 x, i32 y) { return y * kWidth + x; }

bool world_load(const std::string &name, world &w);
void world_save(const world &w);
blob serialize_world(const world &w);`;

const worldCpp = String.raw`#include "world.hpp"
#include "db.hpp"

#include <cctype>
#include <format>

static blob serialize_tiles(const world &w)
{
    blob b;
    for (const tile &t : w.tiles) {
        b.i16v(t.fg);
        b.i16v(t.bg);
        for (const u8 s : t.state) b.u8v(s);
    }
    return b;
}

static void deserialize_tiles(world &w, const std::vector<u8> &bytes)
{
    w.tiles.assign(kWidth * kHeight, tile{});

    for (std::size_t i = 0, at = 0; i < w.tiles.size() && at + 8 <= bytes.size();
         ++i, at += 8) {
        std::memcpy(&w.tiles[i].fg, bytes.data() + at, 2);
        std::memcpy(&w.tiles[i].bg, bytes.data() + at + 2, 2);
        std::memcpy(w.tiles[i].state, bytes.data() + at + 4, 4);
    }
}

bool world_load(const std::string &name, world &w)
{
    std::vector<u8> bytes;
    w.name = name;

    if (!db_world_load(name, w.owner_id, bytes)) return false;

    deserialize_tiles(w, bytes);
    return true;
}

void world_save(const world &w)
{
    db_world_save(w.name, w.owner_id, serialize_tiles(w).bytes);
}

/* SEND_MAP_DATA payload, in the order gurotopia's world::serialize() writes.
   Doors, signs, locks and seeds append a type byte plus their own data after
   a tile; a fresh world has none, so that part is left out here. */
blob serialize_world(const world &w)
{
    blob b;

    b.i16v(0x00);
    b.i32v(0x00);
    b.i16v(i32(w.name.size()));
    b.bytes.insert(b.bytes.end(), w.name.begin(), w.name.end());

    b.i32v(kWidth);
    b.i32v(kHeight);
    b.i16v(i32(w.tiles.size()));   // 6000
    b.i32v(0x00);
    b.i16v(0x00);
    b.u8v(0x00);

    b.append(serialize_tiles(w));

    b.i32v(0x00);
    b.i32v(0x00);
    b.i32v(0x00);
    b.i32v(0x00);                  // dropped objects
    b.i32v(0x00);                  // last drop uid

    return b;
}

void on_join(peer *p, ENetPeer *ep, const std::string &name)
{
    if (name.empty() || name.size() > 24) {
        send_call(ep, -1, { Vstr("OnFailedToEnterWorld") });
        return;
    }

    world w;
    if (!world_load(name, w)) {
        w.name = name;
        w.tiles.assign(kWidth * kHeight, tile{});
        w.tiles[cord(50, 36)].fg = 6;     // main door
        w.tiles[cord(50, 37)].fg = 8;     // bedrock under the door
        world_save(w);
    }

    p->world = name;
    p->netid = 1;
    p->x = w.spawn_x;
    p->y = w.spawn_y;

    game_packet map;
    map.type = 0x04;         // SEND_MAP_DATA
    map.netid = p->netid;
    map.state = 0x08;        // S_EXTENDED
    map.extra = serialize_world(w);
    send_raw(ep, map.encode());

    send_call(ep, p->netid, {
        Vstr("OnSpawn"),
        Vstr(std::format(
            "spawn|avatar\n"
            "netID|{}\n"
            "userID|{}\n"
            "colrect|0|0|20|30\n"
            "posXY|{}|{}\n"
            "name|{}\n"
            "country|us\n"
            "invis|0\n"
            "mstate|1\n"
            "smstate|0\n",
            p->netid, p->user_id, w.spawn_x, w.spawn_y, p->growid)),
    });

    send_call(ep, p->netid, { Vstr("OnSetPos"), Vvec(w.spawn_x, w.spawn_y) });
    send_call(ep, -1, {
        Vstr("OnConsoleMessage"),
        Vstr("World " + name + " entered."),
    });
}`;

const tilesCpp = String.raw`#include "world.hpp"
#include "db.hpp"

/* SEND_TILE_UPDATE_DATA: the block blob, then an object-type byte. */
static void send_tile(ENetPeer *ep, const peer *p, i32 tx, i32 ty, const tile &t)
{
    game_packet upd;
    upd.type = 0x05;
    upd.netid = p->netid;
    upd.state = 0x08;        // S_EXTENDED
    upd.tile_x = tx;
    upd.tile_y = ty;

    upd.extra.i16v(t.fg);
    upd.extra.i16v(t.bg);
    for (const u8 s : t.state) upd.extra.u8v(s);
    upd.extra.u8v(0x00);     // object type: none

    send_raw(ep, upd.encode());
}

void on_tile_change(peer *p, ENetPeer *ep, const game_packet &gp)
{
    if (p->world.empty()) return;
    if (gp.tile_x < 0 || gp.tile_x >= kWidth) return;
    if (gp.tile_y < 0 || gp.tile_y >= kHeight) return;

    world w;
    if (!world_load(p->world, w)) return;

    tile &t = w.tiles[cord(gp.tile_x, gp.tile_y)];

    if (gp.id == 18) {                    // fist: punch, damage, then break
        if (t.fg == 0) return;

        if (++t.hits < 3) {               // real hardness comes from items.dat
            game_packet dmg;
            dmg.type = (1 << 24) | 0x08;  // TILE_APPLY_DAMAGE, buildRange = 1
            dmg.netid = p->netid;
            dmg.tile_x = gp.tile_x;
            dmg.tile_y = gp.tile_y;
            dmg.extra_f = float(t.hits);
            send_raw(ep, dmg.encode());
            return;
        }

        t.fg = 0;
        t.hits = 0;
        world_save(w);
        send_tile(ep, p, gp.tile_x, gp.tile_y, t);
        return;
    }

    if (gp.id == 0 || t.fg != 0) return;  // place: one block per tile
    t.fg = u16(gp.id);
    world_save(w);
    send_tile(ep, p, gp.tile_x, gp.tile_y, t);
}`;

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
    note: "One target. ENet and MySQL are looked up by path because a distro package will not have the patched ENet.",
  },
  "src/net.hpp": {
    code: netHpp,
    note: "The whole wire format in one header: little-endian blob, 56-byte header, variant list.",
  },
  "src/protocol.cpp": {
    code: protocolCpp,
    note: "Send helpers plus the receive switch: message type 2 is text, 3 is an action, 4 is a game packet.",
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
    note: "Load or create, serialize, send the map, then spawn the avatar.",
  },
  "src/tiles.cpp": {
    code: tilesCpp,
    note: "Punch three times, or place one block. Broadcast the same packet to the world later.",
  },
};
