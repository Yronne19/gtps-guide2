import { useEffect, useState } from "react";
import {
  actions,
  flagBits,
  functions,
  headerFields,
  messageTypes,
  navSections,
  packets,
} from "./data/reference.js";
import { Callout, CodeBlock, SectionHeading } from "./components/ui.jsx";
import ItemsBrowser from "./components/ItemsBrowser.jsx";
import ByteMap from "./components/ByteMap.jsx";
import PacketDecoder from "./components/PacketDecoder.jsx";
import EndianLab from "./components/EndianLab.jsx";
import { AnatomyBar, ArchitectureDiagram, Trace } from "./components/Flow.jsx";
import { ActionGrid, FunctionList, PacketTable } from "./components/Reference.jsx";
import StarterView from "./StarterView.jsx";
import NetworkView from "./NetworkView.jsx";

const HANDSHAKE = [
  {
    dir: "web",
    msg: "POST /growtopia/server_data.php",
    detail:
      "Plain text back: server|, port|, loginurl|, type|, maint|. This is the only HTTPS step a private server needs.",
  },
  {
    dir: "c2s",
    msg: "ENet connect · UDP 17091",
    detail:
      "Both sides need the same three ENet changes, or one silently drops everything the other sends.",
  },
  {
    dir: "s2c",
    msg: "SERVER_HELLO (1)",
    detail: "Empty body. It only means: send your login.",
  },
  {
    dir: "c2s",
    msg: "GENERIC_TEXT (2) · protocol|225 · ltoken|…",
    detail:
      "ltoken is base64 of growId=NAME&password=PASS on gurotopia. An unknown GrowID is created with that password.",
  },
  {
    dir: "s2c",
    msg: "OnSendToServer(port, 0, user_id, \"ip|0|0\", 1, growid)",
    detail:
      "CALL_FUNCTION 0x01. Tells the client which game server to use and echoes its user id.",
  },
  {
    dir: "c2s",
    msg: "GENERIC_TEXT (2) · tankIDName|NAME … user|<id>",
    detail:
      "The full logon blob: protocol, game_version, country, user, token, reconnect|1 and more. gurotopia reads tankIDName, protocol, country and user.",
  },
  {
    dir: "s2c",
    msg: "OnSuperMainStartAcceptLogon… + OnConsoleMessage",
    detail: "Logon accepted. The client leaves the login screen and builds the main menu.",
  },
  {
    dir: "c2s",
    msg: "action|enter_game",
    detail: "GAME_MESSAGE (3). The session is now inside the game world.",
  },
  {
    dir: "s2c",
    msg: "OnRequestWorldSelectMenu + OnDialogRequest",
    detail: "World select UI, then the gazette dialog with its buttons.",
  },
  {
    dir: "c2s",
    msg: "action|join_request … world|NAME",
    detail: "Ask to join a world by name.",
  },
  {
    dir: "s2c",
    msg: "OnSpawn + SEND_MAP_DATA (0x04)",
    detail:
      "The world arrives as ENet fragments, gets reassembled, then decoded from the extra data.",
  },
];

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export default function App() {
  const active = useScrollSpy(navSections.map((section) => section.id));
  const [tab, setTab] = useState("guide");

  function switchTab(next) {
    setTab(next);
    window.scrollTo(0, 0);
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 border-b border-line bg-[#0a0d07]/95 backdrop-blur">
        <div className="mx-auto flex h-8 max-w-[1440px] items-center gap-3 px-3 sm:px-4">
          <span className="shrink-0 rounded bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-300">
            personal notes
          </span>
          <p className="truncate text-[11px] text-body/70">
            A learning project, not affiliated with Ubisoft or Growtopia. Keep it local and
            use your own accounts.
          </p>
          <a href="#disclaimer" className="ml-auto hidden shrink-0 font-mono text-[10px] text-amber-300/80 hover:text-amber-200 sm:block">
            full disclaimer
          </a>
        </div>

        <div className="mx-auto flex h-9 max-w-[1440px] items-center gap-1 overflow-x-auto border-t border-line/60 px-2 sm:px-3">
          <button
            type="button"
            onClick={() => switchTab("guide")}
            className={`flex h-full shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2.5 font-mono text-[11px] transition sm:px-3 ${
              tab === "guide"
                ? "border-lime text-lime"
                : "border-transparent text-dim hover:text-body"
            }`}
          >
            <span className="text-[9px] opacity-60">01</span> protocol guide
          </button>
          <button
            type="button"
            onClick={() => switchTab("starter")}
            className={`flex h-full shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2.5 font-mono text-[11px] transition sm:px-3 ${
              tab === "starter"
                ? "border-mint text-mint"
                : "border-transparent text-dim hover:text-body"
            }`}
          >
            <span className="text-[9px] opacity-60">02</span> c++ starter
          </button>
          <button
            type="button"
            onClick={() => switchTab("network")}
            className={`flex h-full shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2.5 font-mono text-[11px] transition sm:px-3 ${
              tab === "network"
                ? "border-sky-300 text-sky-300"
                : "border-transparent text-dim hover:text-body"
            }`}
          >
            <span className="text-[9px] opacity-60">03</span> networking
          </button>
          <button
            type="button"
            onClick={() => switchTab("items")}
            className={`flex h-full shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2.5 font-mono text-[11px] transition sm:px-3 ${
              tab === "items"
                ? "border-amber-300 text-amber-300"
                : "border-transparent text-dim hover:text-body"
            }`}
          >
            <span className="text-[9px] opacity-60">04</span> items browser
          </button>
          <span className="ml-auto hidden truncate font-mono text-[9px] uppercase tracking-wider text-dim/70 sm:block">
            {tab === "guide"
              ? "react · tailwind · 12 sections"
              : tab === "items"
                ? "items.dat · decoded locally"
                : tab === "network"
                  ? "bgnet · tagalog · animated"
                  : "c++20 · enet · cmake · mariadb"}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px]">
        {tab === "guide" ? (
          <>
        <aside className="hidden w-60 shrink-0 border-r border-line/70 lg:block">
          <div className="sticky top-[68px] flex h-[calc(100vh-68px)] flex-col">
            <a href="#top" className="block border-b border-line/70 px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded bg-lime font-mono text-[11px] font-bold text-ink">
                  GT
                </span>
                <div>
                  <div className="font-mono text-[12px] text-white">gtps handbook</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-dim">
                    protocol notes
                  </div>
                </div>
              </div>
            </a>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <ul className="space-y-0.5">
                {navSections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={`flex items-baseline gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] transition ${
                        active === section.id
                          ? "bg-lime/10 text-lime"
                          : "text-dim hover:bg-panel2 hover:text-body"
                      }`}
                    >
                      <span className="font-mono text-[9px] opacity-60">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-line/70 px-4 py-3">
              <p className="font-mono text-[9px] leading-4 text-dim/70">
                based on the 5.60 client, gurotopia and GrowServer
              </p>
              <a
                href="https://voidkle.github.io/gtps-guide/"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-mono text-[10px] text-mint hover:text-lime"
              >
                source guide ↗
              </a>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1" id="top">
          <section className="relative isolate overflow-hidden border-b border-line">
            <img
              src="/hero.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />

            <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-5 sm:py-20">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="chip border-mint/40 text-mint">
                  <i className="size-1.5 rounded-full bg-mint" />
                  enet · udp 17091
                </span>
                <span className="chip">56-byte header</span>
                <span className="chip">little-endian</span>
              </div>

              <h1 className="max-w-2xl text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl">
                A Growtopia private server,{" "}
                <span className="text-lime">byte by byte</span>
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-body/80">
                My working notes for building a GTPS for learning: how the client finds the
                server, how ENet carries the traffic, how the 56-byte header is laid out, and
                how to turn the hex from my packet tracker into numbers I can actually read.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <a href="#flow" className="btn border-lime/50 text-lime">
                  start with the flow →
                </a>
                <a href="#decode" className="btn">
                  open the hex decoder
                </a>
                <a href="#packets" className="btn">
                  packet reference
                </a>
              </div>

              <div className="mt-9 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line/60 sm:grid-cols-4">
                {[
                  ["17091", "UDP port"],
                  ["56 B", "header"],
                  ["87", "actions"],
                  ["47", "packet types"],
                ].map(([value, label]) => (
                  <div key={label} className="bg-panel/90 px-3 py-2.5">
                    <div className="font-mono text-base text-white">{value}</div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-dim">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="sticky top-[68px] z-40 border-b border-line bg-ink/95 backdrop-blur lg:hidden">
            <div className="flex gap-1 overflow-x-auto px-2.5 py-2">
              {navSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] transition ${
                    active === section.id
                      ? "border-lime/50 bg-lime/10 text-lime"
                      : "border-line text-dim"
                  }`}
                >
                  {section.label}
                </a>
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-4xl space-y-14 px-4 py-10 sm:space-y-20 sm:px-5 sm:py-14">
            {/* 01 overview */}
            <section id="overview" className="scroll-mt-24">
              <SectionHeading
                index="01"
                eyebrow="Overview"
                title="Two protocols, one session"
                intro="Everything in a Growtopia session happens twice: a one-off HTTPS request that says where to connect, then a long ENet conversation that never leaves UDP. Once you can reproduce both, your server can stand in for the real one."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="panel p-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">
                    what this is
                  </div>
                  <ul className="space-y-2 text-sm leading-6 text-body/85">
                    <li>· My own reference for packets, fields and byte offsets.</li>
                    <li>· A decoder for the hex my packet tracker shows me.</li>
                    <li>· Notes on ENet, because the transport does half the work.</li>
                  </ul>
                </div>
                <div className="panel p-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300">
                    what this is not
                  </div>
                  <ul className="space-y-2 text-sm leading-6 text-body/85">
                    <li>· Not a public server, release or installer.</li>
                    <li>· Not a client patch, bypass or login workaround.</li>
                    <li>· Not affiliated with Ubisoft, Growtopia or anybody else.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <Callout tone="warn" title="disclaimer">
                  This site documents a personal learning project. Growtopia is a trademark of
                  its owner, and this guide is not affiliated with or endorsed by Ubisoft or
                  Growtopia. Run your server on your own machine, with accounts you own, and
                  keep it off the public internet. Nothing here is a replacement for the
                  official service.
                </Callout>
              </div>

              <div className="mt-8">
                <ArchitectureDiagram />
              </div>
            </section>

            {/* 02 flow */}
            <section id="flow" className="scroll-mt-24">
              <SectionHeading
                index="02"
                eyebrow="Connection flow"
                title="What the client does before gameplay"
                intro="The client posts to server_data.php, gets an address, connects with ENet, logs in as text, then everything becomes either text actions or binary game packets."
              />

              <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:items-start">
                <Trace steps={HANDSHAKE} />
                <div className="space-y-4">
                  <div className="panel p-4">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                      three payload shapes
                    </div>
                    <div className="space-y-2.5 text-sm leading-6 text-body/85">
                      <p>
                        <span className="chip mr-2 text-amber-200">1 / 2 / 3</span>
                        text: <code className="font-mono text-[12px] text-mint">key|value</code>{" "}
                        lines. Every{" "}
                        <code className="font-mono text-[12px] text-mint">action|…</code> is one
                        of these.
                      </p>
                      <p>
                        <span className="chip mr-2 text-mint">4</span>
                        binary: a 56-byte header plus optional extra data.
                      </p>
                      <p>
                        <span className="chip mr-2 text-sky-200">0x01</span>
                        a game packet whose extra data is a variant list — that is how the
                        server calls functions on the client.
                      </p>
                    </div>
                  </div>
                  <Callout title="the one thing that breaks everything">
                    A client and server must agree on ENet's modified header, CRC32 checksums and
                    range coder compression. Mismatch one of them and the other side drops
                    packets without an error.
                  </Callout>
                </div>
              </div>
            </section>

            {/* 03 enet */}
            <section id="enet" className="scroll-mt-24">
              <SectionHeading
                index="03"
                eyebrow="Transport"
                title="ENet over UDP 17091"
                intro="Growtopia uses ENet, a thin reliable-UDP layer: it sequences packets, acknowledges reliable ones, fragments big ones and reports ping and loss. You do not write your own framing — you do have to match three modifications."
              />

              <div className="panel mb-4 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="border-b border-line bg-panel2 font-mono text-[10px] uppercase tracking-wider text-dim">
                    <tr>
                      <th className="px-3.5 py-2 font-normal">change</th>
                      <th className="px-3.5 py-2 font-normal">client</th>
                      <th className="px-3.5 py-2 font-normal">server</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {[
                      ["newer packet header", "host->usingNewPacket = 1", "host->usingNewPacketForServer = 1"],
                      ["CRC32 checksums", "host->checksum = enet_crc32", "host->checksum = enet_crc32"],
                      ["range coder", "enet_host_compress_with_range_coder(host)", "enet_host_compress_with_range_coder(host)"],
                    ].map(([label, client, server]) => (
                      <tr key={label} className="border-t border-line/70">
                        <td className="px-3.5 py-2.5 text-body">{label}</td>
                        <td className="px-3.5 py-2.5 text-mint/90">{client}</td>
                        <td className="px-3.5 py-2.5 text-mint/90">{server}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <CodeBlock
                  title="client · connect"
                  code={`enet_initialize();
ENetHost *host = enet_host_create(ENET_ADDRESS_TYPE_IPV4, nullptr, 1, 2, 0, 0);
host->usingNewPacket = 1;
host->checksum = enet_crc32;
enet_host_compress_with_range_coder(host);

ENetAddress address{ .type = ENET_ADDRESS_TYPE_IPV4, .port = 17091 };
enet_address_set_host_ip(&address, "127.0.0.1");
ENetPeer *server = enet_host_connect(host, &address, 2, 0);`}
                />
                <CodeBlock
                  title="server · listen"
                  code={`ENetAddress address{ .type = ENET_ADDRESS_TYPE_IPV4, .port = 17091 };
host = enet_host_create(ENET_ADDRESS_TYPE_IPV4, &address,
                        50 /* peers */, 2, 0, 0);
host->usingNewPacketForServer = true;
host->checksum = enet_crc32;
enet_host_compress_with_range_coder(host);`}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["channels", "2", "everything goes on channel 0, reliable"],
                  ["send", "ENET_PACKET_FLAG_RELIABLE", "state updates are the exception"],
                  ["port", "17091", "whatever server_data.php returns"],
                ].map(([label, value, note]) => (
                  <div key={label} className="panel p-3.5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-dim">
                      {label}
                    </div>
                    <div className="mt-1 break-words font-mono text-[12px] text-white">{value}</div>
                    <div className="mt-0.5 font-mono text-[10px] leading-4 text-dim">{note}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Callout title="use the patched library">
                  gurotopia ships a patched ENet (ZTzTopia's fork) as{" "}
                  <code className="font-mono text-[11px]">include/enet/</code>, and GrowServer
                  uses a WASM build of the same thing. A stock ENet build will not understand the
                  newer header, so start from a fork that has{" "}
                  <code className="font-mono text-[11px]">usingNewPacket</code> and{" "}
                  <code className="font-mono text-[11px]">enet_crc32</code>.{" "}
                  <a
                    className="link"
                    href="http://enet.bespin.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    enet.bespin.org
                  </a>{" "}
                  is the upstream reference for the API itself.
                </Callout>
              </div>
            </section>

            {/* 04 messages */}
            <section id="messages" className="scroll-mt-24">
              <SectionHeading
                index="04"
                eyebrow="Message types"
                title="The first four bytes decide everything"
                intro="Every ENet payload starts with a little-endian u32. Four values matter in practice; the rest are unused by both open source servers."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {messageTypes.map((type) => (
                  <div key={type.name} className="panel p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] text-white">{type.name}</span>
                      <span className="rounded border border-line bg-ink px-2 py-0.5 font-mono text-[11px] text-lime">
                        {type.hex}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-dim">
                      {type.dir}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-body/80">{type.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <CodeBlock
                  title="send a text message"
                  code={`void send_text(ENetPeer *peer, int type, const std::string &text)
{
    std::vector<unsigned char> data(4 + text.size() + 1, 0);
    memcpy(data.data(), &type, 4);              // 2 or 3, little-endian
    memcpy(data.data() + 4, text.data(), text.size());
    enet_peer_send(peer, 0, enet_packet_create(data.data(), data.size(),
                    ENET_PACKET_FLAG_RELIABLE));
}`}
                  note="gurotopia drops the last byte, so the trailing NUL has to be there."
                />
                <CodeBlock
                  title="variant list · CALL_FUNCTION extra data"
                  code={`u8 count
repeat count times:
  u8 index       0 = function name, 1.. = arguments
  u8 type        1 float, 2 string, 3 vec2, 4 vec3, 5 u32, 9 i32
  data           string = u32 length + bytes (no NUL)`}
                  language="layout"
                  note='netID in the header says who the call is about; itemID is a delay in ms.'
                />
              </div>
            </section>

            {/* 05 header */}
            <section id="header" className="scroll-mt-24">
              <SectionHeading
                index="05"
                eyebrow="Game packets"
                title="Inside the 56-byte header"
                intro="Message type 4 carries a fixed header, then extraDataLength bytes of payload. Tap any block to see its offset, size and type — remember every value in here is read little-endian."
              />

              <ByteMap fields={headerFields} />

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.1fr]">
                <div className="panel p-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                    flags · byte 12
                  </div>
                  <ul className="space-y-1.5">
                    {flagBits.map(([bit, name, note]) => (
                      <li key={bit} className="flex gap-2 text-xs leading-5">
                        <span className="w-14 shrink-0 font-mono text-lime">{bit}</span>
                        <span className="w-36 shrink-0 font-mono text-body/90">{name}</span>
                        <span className="text-dim">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <Callout title="the four type bytes are one int">
                    gurotopia packs them into a single integer, so{" "}
                    <code className="font-mono text-[11px]">(value &lt;&lt; 24) | 0x08</code>{" "}
                    means TILE_APPLY_DAMAGE with a damage value. Always compare{" "}
                    <code className="font-mono text-[11px]">type &amp; 0xff</code> when reading.
                  </Callout>
                  <Callout tone="warn" title="extra data only exists when flagged">
                    The client appends the payload only when bit 3 of the flags byte is set
                    (0x08 / S_EXTENDED). A correct extraDataLength with the bit cleared still
                    means no payload.
                  </Callout>
                </div>
              </div>

              <div className="mt-4">
                <CodeBlock
                  title="build a 60-byte TILE_CHANGE_REQUEST by hand"
                  code={`unsigned char p[60] = {};
int message = 4;                    memcpy(p, &message, 4);
p[4] = 0x03;                        // type: TILE_CHANGE_REQUEST
int netid = my_netid;               memcpy(p + 8,  &netid, 4);  // netID
int item  = 2;                      memcpy(p + 24, &item, 4);   // itemID
float x = 1 * 32.f, y = 23 * 32.f;  memcpy(p + 28, &x, 4); memcpy(p + 32, &y, 4);
int tx = 1, ty = 23;                memcpy(p + 48, &tx, 4); memcpy(p + 52, &ty, 4);
enet_peer_send(peer, 0,
    enet_packet_create(p, sizeof p, ENET_PACKET_FLAG_RELIABLE));`}
                  note="offsets in the code include the 4-byte message type: header offset + 4."
                />
              </div>
            </section>

            {/* 06 decode */}
            <section id="decode" className="scroll-mt-24">
              <SectionHeading
                index="06"
                eyebrow="Endianness"
                title="Turning tracker hex into numbers"
                intro="There are two byte orders in one capture: ENet's own fields are big-endian, while everything inside the Growtopia payload is little-endian. Get that backwards and 17091 becomes 1209159680."
              />

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="panel border-mint/30 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mint">
                    inside the payload · little-endian
                  </div>
                  <p className="mt-2 text-sm leading-6 text-body/85">
                    Integers and floats in the 56-byte header and in the variant list. The low
                    byte comes first, so you read it from right to left.
                  </p>
                  <div className="mt-3 font-mono text-[11px] text-dim">
                    01 00 00 00 → 1
                  </div>
                </div>
                <div className="panel border-violet-400/30 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-violet-200">
                    ENet protocol · big-endian
                  </div>
                  <p className="mt-2 text-sm leading-6 text-body/85">
                    Peer ids, sequence numbers, the CRC32 and the command stream outside your
                    message. ENet's own decoder handles this part.
                  </p>
                  <div className="mt-3 font-mono text-[11px] text-dim">
                    00 00 42 C3 → 17091
                  </div>
                </div>
              </div>

              <AnatomyBar />

              <div className="mt-4">
                <PacketDecoder />
              </div>

              <div className="mt-4">
                <EndianLab />
              </div>

              <div className="mt-4">
                <Callout tone="warn" title="the integrity field is port-bound">
                  The 6 bytes in front of every client command depend on the server's UDP port. A
                  proxy or relay on a different port breaks the connection — that is why the
                  capture tools in the guide bind to the same port on a second loopback address.
                </Callout>
              </div>
            </section>

            {/* 07 login */}
            <section id="login" className="scroll-mt-24">
              <SectionHeading
                index="07"
                eyebrow="Login"
                title="server_data.php and the logon blob"
                intro="A private server only needs the text reply and the ENet login. The official flow adds a web token and a login server in between, which you do not have to reproduce."
              />

              <div className="grid gap-3 lg:grid-cols-2">
                <CodeBlock
                  title="server_data.php · plain text reply"
                  code={`server|127.0.0.1
port|17091
type|1
type2|1
#maint|Server under maintenance. Please try again later.
loginurl|login.example.com
meta|gtps
RTENDMARKERBS1001`}
                  language="text"
                />
                <CodeBlock
                  title="ltoken · GENERIC_TEXT (2)"
                  code={`protocol|225
ltoken|<base64 of "growId=NAME&password=PASS">`}
                  language="text"
                  note="gurotopia creates an unknown GrowID with that password."
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:items-start">
                <div className="panel p-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                    full logon message · fields in order
                  </div>
                  <div className="space-y-1 font-mono text-[11px] leading-6 text-body/80">
                    {[
                      "tankIDName", "tankIDPass", "requestedName", "f", "protocol",
                      "game_version", "fz", "cbits", "hash2", "vid", "aid", "gid", "meta",
                      "rid", "platformID", "deviceVersion", "country", "hash", "mac", "user",
                      "token", "doorID", "wk", "fhash", "GDPR", "player_age", "category",
                      "totalPlaytime", "klv", "lmode", "reconnect|1", "FCMToken",
                    ].map((field) => (
                      <span
                        key={field}
                        className="mr-1.5 inline-block rounded border border-line bg-ink px-1.5 py-0.5"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-dim">
                    gurotopia only reads tankIDName, protocol, country and user — but the client
                    still sends all of it, so your parser must tolerate the rest.
                  </p>
                </div>

                <div className="space-y-3">
                  <Callout tone="danger" title="the Android app will not get past HTTPS">
                    Recent Android builds only accept a certificate signed by a real authority for
                    www.growtopia1.com, so they never reach your server_data.php. Your own client
                    skips HTTPS and connects to the address it already knows.
                  </Callout>
                  <div className="panel p-4">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                      after enter_game · what a real server sent
                    </div>
                    <ul className="space-y-0.5 font-mono text-[10px] leading-5 text-body/75">
                      {[
                        "OnOverrideGDPRFromServer",
                        "OnSuperMainStartAcceptLogon…",
                        "OnConsoleMessage ×3",
                        "0x09 SEND_INVENTORY_STATE (79 B)",
                        "OnSetBux · SetHasGrowID · OnTodaysDate",
                        "OnRequestWorldSelectMenu",
                        "OnDialogRequest · the gazette",
                        "0x16 PING_REQUEST (60 B)",
                        "OnSetFeatureEnableFlags",
                      ].map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 08 packets */}
            <section id="packets" className="scroll-mt-24">
              <SectionHeading
                index="08"
                eyebrow="Reference"
                title="The 47 game packet types"
                intro="All of them fit in one byte, 0x00 to 0x2e. The list is short because most gameplay travels as action| text instead."
              />
              <PacketTable packets={packets} />
              <p className="mt-3 font-mono text-[11px] leading-5 text-dim">
                States marked +data carry payload after the header when S_EXTENDED is set.
                Direction and exact fields for each type are on the per-packet pages of the source
                guide.
              </p>
            </section>

            {/* 09 actions */}
            <section id="actions" className="scroll-mt-24">
              <SectionHeading
                index="09"
                eyebrow="Reference"
                title="87 things the client can say"
                intro="Actions are plain text on message type 3. The server answers with functions, packets, or its own text. Start with the handful that make a world playable: enter_game, join_request, input, drop, wrench and dialog_return."
              />
              <ActionGrid actions={actions} />
            </section>

            {/* 10 functions */}
            <section id="functions" className="scroll-mt-24">
              <SectionHeading
                index="10"
                eyebrow="Reference"
                title="Calling the client"
                intro="The server speaks by calling functions: a CALL_FUNCTION packet (0x01) whose extra data is a variant list. Here are the ones a first server actually needs; the full set is 215."
              />
              <FunctionList functions={functions} />
              <div className="mt-4">
                <CodeBlock
                  title="sending two calls"
                  code={`send_varlist(peer, { "OnConsoleMessage", "hello" });
send_varlist(peer, { "OnSetPos", CL_Vec2f{ 672.f, 1152.f } }, netid);`}
                  note="netid goes in the header and selects who the call is about; -1 for global."
                />
              </div>
            </section>

            {/* 11 tracker */}
            <section id="tracker" className="scroll-mt-24">
              <SectionHeading
                index="11"
                eyebrow="Workflow"
                title="Using the packet tracker"
                intro="The tracker already does the hard part: it strips ENet and hands you a message. The rest is a loop — capture an action, decode it here, reproduce it, compare."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    step: "01",
                    title: "Capture one action",
                    body: "Start a capture with filter udp, do exactly one thing in game, then stop. One action per capture keeps the trace readable.",
                  },
                  {
                    step: "02",
                    title: "Note the port",
                    body: "The client talks to whatever port server_data.php returned. Anything else in the capture is noise.",
                  },
                  {
                    step: "03",
                    title: "Read the message type",
                    body: "First four bytes, little-endian. 3 means text, 4 means a binary header follows. The tracker usually shows this for you.",
                  },
                  {
                    step: "04",
                    title: "Decode the header",
                    body: "Paste the 60 bytes into the decoder above and check netID, itemID, posX/posY and tileX/tileY against what you did in game.",
                  },
                  {
                    step: "05",
                    title: "Reproduce, then diff",
                    body: "Send the same bytes from your server or client and capture again. The first field that differs is your bug.",
                  },
                  {
                    step: "06",
                    title: "Keep a fixture",
                    body: "Save interesting payloads as hex strings. They become regression checks you can paste into the decoder.",
                  },
                ].map((item) => (
                  <div key={item.step} className="panel p-4">
                    <div className="mb-1.5 flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-lime/70">{item.step}</span>
                      <h3 className="text-sm font-medium text-white">{item.title}</h3>
                    </div>
                    <p className="text-xs leading-5 text-dim">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <CodeBlock
                  title="reference decoder · gtcap"
                  language="sh"
                  code={`./tools/gtcap.out game.pcapng                # every message, in order
./tools/gtcap.out game.pcapng --port 17091   # one port only
./tools/gtcap.out game.pcapng --stats        # counts per packet/function
./tools/gtcap.out game.pcapng --only server  # one direction
./tools/gtcap.out game.pcapng --hex          # dump extra data too`}
                  note="from the source repo; keep a copy of a capture you understand."
                />
                <div className="space-y-3">
                  <div className="panel p-4">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                      sanity checks after a capture
                    </div>
                    <ul className="space-y-1.5 text-xs leading-5 text-body/85">
                      <li>· Does extraDataLength match the bytes you have?</li>
                      <li>· Is bit 0x08 set when a payload is present?</li>
                      <li>· Are floats in pixels (tile × 32)?</li>
                      <li>· Is netID -1 where a function is global?</li>
                      <li>· Did a retransmit duplicate the packet?</li>
                    </ul>
                  </div>
                  <Callout title="fragmentation is normal">
                    World maps arrive split across fragments. If SEND_MAP_DATA looks truncated,
                    you are reading one fragment, not a broken packet.
                  </Callout>
                </div>
              </div>
            </section>

            {/* 12 resources */}
            <section id="resources" className="scroll-mt-24">
              <SectionHeading
                index="12"
                eyebrow="Resources"
                title="Where the details live"
                intro="These notes are a working summary. The per-packet pages, field tables and decompiled handlers are in the guide below — that is the source of truth."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "GTPS Protocol guide",
                    url: "https://voidkle.github.io/gtps-guide/",
                    note: "Every packet, function and action, with what the 5.60 client does.",
                  },
                  {
                    title: "voidkle/gtps-guide",
                    url: "https://github.com/voidkle/gtps-guide",
                    note: "The repository, including hello.cpp — the smallest login client.",
                  },
                  {
                    title: "ENet",
                    url: "http://enet.bespin.org/",
                    note: "Reliable UDP library: features, downloads and the function reference.",
                  },
                  {
                    title: "ENet tutorial",
                    url: "http://enet.bespin.org/Tutorial.html",
                    note: "Host, peer, connect, send and receive — the API you build on.",
                  },
                  {
                    title: "Wireshark",
                    url: "https://www.wireshark.org/",
                    note: "Capture with Npcap on Windows and filter on udp.",
                  },
                  {
                    title: "Growtopia",
                    url: "https://www.growtopia.com/",
                    note: "The game these notes are about — play it there, not on a cloned server.",
                  },
                ].map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group panel p-4 transition hover:border-mint/40 hover:bg-panel2"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-white group-hover:text-lime">
                        {link.title}
                      </span>
                      <span className="font-mono text-[10px] text-dim">↗</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-dim">{link.note}</p>
                  </a>
                ))}
              </div>

              <div id="disclaimer" className="mt-4 scroll-mt-24">
                <div className="panel border-line2 p-5">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">
                    disclaimer
                  </div>
                  <div className="space-y-2.5 text-xs leading-6 text-dim">
                    <p>
                      This is a personal study notebook for building a Growtopia-compatible
                      server to learn about networking. It is not a release, a service, or an
                      invitation to run a public server.
                    </p>
                    <p>
                      Growtopia and Ubisoft are trademarks of their respective owners. This site
                      is not affiliated with, sponsored by or endorsed by Ubisoft or Growtopia.
                      Protocol details are documentation, not permission to redistribute the
                      game&apos;s assets or software.
                    </p>
                    <p>
                      Field meanings here come from static analysis and from the open source
                      servers documented in the source guide. Some are marked as uncertain there;
                      treat anything unverified as a hypothesis until your own capture confirms
                      it.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <footer className="border-t border-line/70">
            <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="font-mono text-[10px] text-dim">
                gtps handbook · personal notes · {new Date().getFullYear()}
              </p>
              <p className="font-mono text-[10px] text-dim/70">
                React · Tailwind CSS · no affiliation with Ubisoft
              </p>
            </div>
          </footer>
        </main>
          </>
        ) : tab === "network" ? (
          <NetworkView />
        ) : tab === "items" ? (
          <ItemsBrowser />
        ) : (
          <StarterView />
        )}
      </div>
    </div>
  );
}
