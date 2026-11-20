import {
  enetBuild,
  hsSteps,
  loginEndpoints,
  loginSchemaMap,
  loginSteps,
  loginTraps,
  mapLayout,
  nextSteps,
  patchTable,
  requirements,
  setupCommands,
  starterFiles,
  starterNav,
  traps,
} from "./data/starter.js";
import { Callout, CodeBlock, SectionHeading } from "./components/ui.jsx";
import FileTabs from "./components/FileTabs.jsx";
import { useScrollSpy } from "./useScrollSpy.js";

const NAV_IDS = starterNav.map((section) => section.id);

const pick = (...names) =>
  Object.fromEntries(names.map((name) => [name, starterFiles[name]]));

export default function StarterView() {
  const active = useScrollSpy(NAV_IDS);

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-line/70 lg:block">
        <div className="sticky top-[68px] flex h-[calc(100vh-68px)] flex-col">
          <div className="border-b border-line/70 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded bg-mint font-mono text-[11px] font-bold text-ink">
                C++
              </span>
              <div>
                <div className="font-mono text-[12px] text-white">gtps starter</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-dim">
                  local server skeleton
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3">
            <ul className="space-y-0.5">
              {starterNav.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`flex items-baseline gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] transition ${
                      active === section.id
                        ? "bg-mint/10 text-mint"
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
              c++20 · cmake · enet · mariadb · openssl
            </p>
            <a
              href="https://github.com/gurotopia/Gurotopia"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-mono text-[10px] text-lime hover:text-mint"
            >
              gurotopia source ↗
            </a>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <section className="relative isolate overflow-hidden border-b border-line">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgba(92,225,165,0.16),transparent_55%)]" />
          <div className="relative mx-auto max-w-4xl px-5 py-12">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="chip border-mint/40 text-mint">c++20</span>
              <span className="chip">cmake</span>
              <span className="chip">enet</span>
              <span className="chip">mariadb</span>
              <span className="chip">openssl</span>
            </div>

            <h1 className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl">
              The server, from <span className="text-mint">first build</span> to a
              joined world
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-body/80">
              A starter template for the other half of these notes: one C++ binary
              that serves server_data.php over TLS, accepts an ENet login, creates an
              account on first use, and lets that account walk into a world and punch
              a block. Built from the same sources as the guide — gurotopia's main
              loop, HTTPS responder, world serializer, and the login-gurotopia
              dashboard for the account half.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#s-setup" className="btn border-mint/50 text-mint">
                start at setup →
              </a>
              <a href="#s-join" className="btn">
                jump to joining a world
              </a>
            </div>

            <div className="mt-7 grid max-w-lg grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line/60 sm:grid-cols-4">
              {[
                ["443", "https"],
                ["17091", "udp"],
                ["60 B", "header"],
                ["8 B", "per tile"],
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
          <div className="flex gap-1 overflow-x-auto px-3 py-2">
            {starterNav.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] transition ${
                  active === section.id
                    ? "border-mint/50 bg-mint/10 text-mint"
                    : "border-line text-dim"
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-20 px-5 py-14">
          {/* 01 setup */}
          <section id="s-setup" className="scroll-mt-28">
            <SectionHeading
              index="01"
              eyebrow="Setup"
              title="Five pieces, one binary"
              intro="You need a C++20 compiler, CMake, the patched ENet, a MySQL client library and OpenSSL. Everything below follows gurotopia's dependencies; only the build system differs."
            />

            <div className="panel mb-4 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-panel2 font-mono text-[10px] uppercase tracking-wider text-dim">
                  <tr>
                    <th className="px-3.5 py-2 font-normal">piece</th>
                    <th className="px-3.5 py-2 font-normal">what to install</th>
                    <th className="hidden px-3.5 py-2 font-normal sm:table-cell">
                      why
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map(([piece, install, why]) => (
                    <tr key={piece} className="border-t border-line/70">
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-mint">
                        {piece}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-body/90">
                        {install}
                      </td>
                      <td className="hidden px-3.5 py-2.5 text-xs text-dim sm:table-cell">
                        {why}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <FileTabs
              files={setupCommands}
              note="One shell, four systems. On Windows use the MSYS2 UCRT64 shell, not cmd.exe."
            />

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <CodeBlock
                title="create the two runtime files"
                language="sh"
                code={`mkdir -p resources/ctx

# MariaDB still needs a login and a database
mysql -u root -p -e "SOURCE sql/schema.sql"`}
                note="server_data.php and the certificate live in resources/."
              />
              <div className="panel p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  hosts file · the one system change
                </div>
                <CodeBlock
                  language="text"
                  title="C:\\Windows\\System32\\drivers\\etc\\hosts"
                  code={`127.0.0.1 www.growtopia1.com
127.0.0.1 www.growtopia2.com`}
                  note="/etc/hosts on Linux and macOS."
                />
              </div>
            </div>

            <div className="mt-4">
              <Callout tone="warn" title="this is a reading template">
                The code on this tab compiles as a skeleton, but it is not a
                drop-in server: it has no items.dat, no inventory, no physics and no
                lock checks. Use it to get the handshake and the world on screen,
                then copy behaviour from{" "}
                <a
                  className="link"
                  href="https://github.com/gurotopia/Gurotopia"
                  target="_blank"
                  rel="noreferrer"
                >
                  gurotopia
                </a>{" "}
                one handler at a time.
              </Callout>
            </div>
          </section>

          {/* 02 build */}
          <section id="s-build" className="scroll-mt-28">
            <SectionHeading
              index="02"
              eyebrow="Project"
              title="Layout, CMake, and the wire types"
              intro="Seven translation units, one header for the protocol, one for the world. The CMake file fails loudly when the patched ENet or the MariaDB client is missing, because both are easy to link against by accident."
            />

            <div className="mb-4 grid gap-3 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <CodeBlock
                title="tree"
                language="tree"
                code={`gtps/
├─ CMakeLists.txt
├─ resources/
│  ├─ server_data.php
│  └─ ctx/server.crt · server.key
├─ sql/schema.sql
├─ third_party/enet/     patched fork
├─ include/              your headers, if you split them
└─ src/
   ├─ net.hpp            wire format
   ├─ protocol.cpp       send + dispatch
   ├─ main.cpp           both listeners
   ├─ https.cpp/.hpp     server_data.php
   ├─ db.cpp/.hpp        accounts + worlds
   ├─ world.hpp
   ├─ world.cpp          load, serialize, join
   ├─ login.cpp          ltoken, logon, actions
   └─ tiles.cpp          punch + place`}
              />
              <div className="space-y-3">
                <FileTabs files={enetBuild} />
                <Callout title="why not a system package">
                  Debian's <code className="font-mono text-[11px]">libenet-dev</code>{" "}
                  is stock 1.3. It has no{" "}
                  <code className="font-mono text-[11px]">usingNewPacket</code>, so
                  the client's first reliable packet is dropped and the connection
                  looks dead.
                </Callout>
              </div>
            </div>

            <FileTabs
              files={pick("CMakeLists.txt", "src/net.hpp", "src/protocol.cpp")}
            />

            <div className="mt-4">
              <CodeBlock
                title="configure and run"
                language="sh"
                code={`cmake -S . -B build -DCMAKE_BUILD_TYPE=RelWithDebInfo

# macOS only: Apple's SDK has no OpenSSL headers
#   cmake -S . -B build -DOPENSSL_ROOT_DIR=$(brew --prefix openssl@3)

cmake --build build -j

./build/gtps`}
                note="On Windows: cmake --build build, then run build\\gtps.exe as administrator for port 443."
              />
            </div>
          </section>

          {/* 03 https */}
          <section id="s-https" className="scroll-mt-28">
            <SectionHeading
              index="03"
              eyebrow="HTTPS"
              title="server_data.php on 127.0.0.1"
              intro="Before any UDP, the client asks www.growtopia1.com over HTTPS where the game server is. On localhost that means three things at once: the hostname resolves to loopback, something answers TLS on 443, and the client accepts your certificate."
            />

            <ol className="mb-4 space-y-2">
              {[
                "Add the two hosts entries so the client's request lands on your machine.",
                "Generate a certificate whose subject and SAN are the hostname it asks for.",
                "Run the responder on 443 and trust the certificate locally.",
                "Check it with curl before you involve the game client.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-body/85">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line2 font-mono text-[10px] text-mint">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <CodeBlock
              title="self-signed certificate for localhost"
              language="sh"
              code={`openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \\
  -keyout resources/ctx/server.key \\
  -out    resources/ctx/server.crt \\
  -subj   "/CN=www.growtopia1.com" \\
  -addext "subjectAltName=DNS:www.growtopia1.com,DNS:www.growtopia2.com,IP:127.0.0.1"

# trust it, or the client aborts the handshake
#   Windows (admin): certutil -addstore -f Root resources\\ctx\\server.crt
#   Linux:           sudo cp resources/ctx/server.crt /usr/local/share/ca-certificates/
#                    sudo update-ca-certificates
#   macOS:           sudo security add-trusted-cert -d -r trustRoot \\
#                      -k /Library/Keychains/System.keychain resources/ctx/server.crt`}
              note="The SAN is the part that matters; a CN alone is ignored by every modern TLS stack."
            />

            <div className="mt-4">
              <FileTabs files={pick("src/https.hpp", "src/https.cpp", "resources/server_data.php")} />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <CodeBlock
                title="test before the client"
                language="sh"
                code={`curl -k https://127.0.0.1/growtopia/server_data.php

# server|127.0.0.1
# port|17091
# type|1
# type2|1
# ...
# RTENDMARKERBS1001`}
                note="-k skips verification; if that works but the client fails, the certificate is not trusted."
              />
              <div className="space-y-3">
                <Callout tone="danger" title="port 443 and trust">
                  Binding 443 needs administrator on Windows and root on Linux. If
                  something already owns it, forward instead:{" "}
                  <code className="font-mono text-[11px]">
                    netsh interface portproxy add v4tov4 listenport=443
                    connectport=8443
                  </code>
                  . And a self-signed certificate only works with a client that
                  trusts it — recent Android builds only accept a real CA for
                  growtopia1.com, so test with a desktop client you control.
                </Callout>
                <Callout title="the reply is not the login">
                  server_data.php only says where to connect. The login itself happens
                  over ENet as text, so you never need PHP, a web framework or a real
                  domain for this step.
                </Callout>
              </div>
            </div>
          </section>

          {/* 04 enet */}
          <section id="s-enet" className="scroll-mt-28">
            <SectionHeading
              index="04"
              eyebrow="ENet"
              title="Two listeners, one event loop"
              intro="main opens the TLS thread, then the ENet host on the port server_data.php advertises, applies the three patches, and loops on enet_host_service. Every later feature is a branch in that loop."
            />

            <div className="panel mb-4 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-panel2 font-mono text-[10px] uppercase tracking-wider text-dim">
                  <tr>
                    <th className="px-3.5 py-2 font-normal">modification</th>
                    <th className="px-3.5 py-2 font-normal">side</th>
                    <th className="px-3.5 py-2 font-normal">line</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px]">
                  {patchTable.map(([name, side, line]) => (
                    <tr key={name} className="border-t border-line/70">
                      <td className="px-3.5 py-2.5 text-body">{name}</td>
                      <td className="px-3.5 py-2.5 text-dim">{side}</td>
                      <td className="px-3.5 py-2.5 text-mint/90">{line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <FileTabs files={pick("src/main.cpp")} />

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Callout tone="warn" title="set them before the first connect">
                All three belong right after{" "}
                <code className="font-mono text-[11px]">enet_host_create</code>. A
                peer that connected before{" "}
                <code className="font-mono text-[11px]">checksum</code> was assigned
                will fail its first reliable packet, and ENet reports that as a
                disconnect with no error text.
              </Callout>
              <Callout title="the fork changed the signature">
                <code className="font-mono text-[11px]">
                  enet_host_create(ENET_ADDRESS_TYPE_IPV4, &amp;address, peers,
                  channels, 0, 0)
                </code>{" "}
                is the patched API. Stock ENet 1.3 takes{" "}
                <code className="font-mono text-[11px]">
                  (address, peers, channels, bandwidth, bandwidth)
                </code>{" "}
                — copy the call from whichever fork you linked.
              </Callout>
            </div>
          </section>

          {/* 05 db */}
          <section id="s-db" className="scroll-mt-28">
            <SectionHeading
              index="05"
              eyebrow="MySQL"
              title="Two tables are enough to start"
              intro="Accounts and worlds. gurotopia calls them peer and world and keeps inventory and level on the account; the names do not matter, the columns do. Both statements below are prepared, so a GrowID with a quote in it is just a string."
            />

            <FileTabs files={pick("sql/schema.sql", "src/db.hpp", "src/db.cpp")} />

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Callout tone="danger" title="sha256 is a placeholder">
                Salted SHA-256 keeps the tutorial short, not accounts safe. For
                anything beyond localhost use bcrypt or argon2, and give the server a
                database user that can only touch this schema.
              </Callout>
              <div className="panel p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  world blob
                </div>
                <p className="text-sm leading-6 text-body/85">
                  6000 tiles × 8 bytes:{" "}
                  <code className="font-mono text-[11px] text-mint">
                    fg u16 · bg u16 · state[4]
                  </code>
                  , row-major with 100 tiles per row. 48 KB per world, which is why
                  gurotopia keeps it in one BLOB and updates it on exit.
                </p>
              </div>
            </div>
          </section>

          {/* 06 login */}
          <section id="s-login" className="scroll-mt-28">
            <SectionHeading
              index="06"
              eyebrow="Accounts"
              title="Create & log in, in order"
              intro="Two processes share this job. login-gurotopia serves the page at loginurl and hands back a base64 token; the C++ server receives that token as ltoken, creates the row on first use, and answers OnSendToServer. The ten steps below run in the order you actually do them — and the account half is testable with curl before you touch UDP."
            />

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <a
                className="btn"
                href="https://github.com/gurotopia/login-gurotopia"
                target="_blank"
                rel="noreferrer"
              >
                login-gurotopia ↗
              </a>
              <span className="font-mono text-[10px] text-dim">
                bun + express · :3000 · same MySQL
              </span>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="panel p-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">
                  loginurl · https
                </div>
                <p className="text-xs leading-5 text-body/85">
                  The client opens{" "}
                  <code className="font-mono text-[11px]">
                    /player/login/dashboard
                  </code>
                  , submits the form, and gets a{" "}
                  <code className="font-mono text-[11px]">token</code> back. Its
                  identity (RID, protocol, version) rides inside that token.
                </p>
              </div>
              <div className="panel p-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">
                  udp/17091 · c++
                </div>
                <p className="text-xs leading-5 text-body/85">
                  <code className="font-mono text-[11px]">ltoken|&lt;token&gt;</code>{" "}
                  arrives as GENERIC_TEXT. Decode it, look the GrowID up, create it
                  if it is new, then answer OnSendToServer.
                </p>
              </div>
            </div>

            <ol className="mb-4 space-y-3">
              {loginSteps.map((step, index) => (
                <li key={step.title} className="panel p-4">
                  <div className="flex gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-mint/40 bg-mint/10 font-mono text-[11px] text-mint">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-white">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-dim">{step.body}</p>
                      {step.code ? (
                        <div className="mt-3">
                          <CodeBlock
                            title={step.codeTitle}
                            language={step.language || "sh"}
                            code={step.code}
                            note={step.note}
                          />
                        </div>
                      ) : step.note ? (
                        <p className="mt-2 font-mono text-[10px] leading-5 text-mint/70">
                          {step.note}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <FileTabs
              files={pick(
                "login-gurotopia/index.ts",
                "login-gurotopia/template/dashboard.html",
                "login-gurotopia/.env",
              )}
            />

            <div className="mt-4 grid gap-3 lg:grid-cols-2 lg:items-start">
              <div className="panel overflow-hidden">
                <div className="border-b border-line px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-dim">
                  the four routes
                </div>
                <table className="w-full text-left">
                  <tbody>
                    {loginEndpoints.map(([method, route, meaning]) => (
                      <tr key={route} className="border-t border-line/70 align-top">
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[10px] text-dim">
                          {method}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[10px] text-mint/90">
                          {route}
                          <div className="mt-0.5 font-sans text-[10px] leading-4 text-dim">
                            {meaning}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel overflow-hidden">
                <div className="border-b border-line px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-dim">
                  columns: repo vs starter
                </div>
                <table className="w-full text-left">
                  <tbody>
                    {loginSchemaMap.map(([repo, mine, note]) => (
                      <tr key={repo} className="border-t border-line/70 align-top">
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[10px] text-body/90">
                          {repo}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[10px] text-mint/80">
                          {mine}
                          <div className="mt-0.5 max-w-[13rem] font-sans text-[10px] leading-4 text-dim">
                            {note}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 panel overflow-hidden">
              <div className="border-b border-line px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-dim">
                dashboard side · what bites
              </div>
              <table className="w-full text-left">
                <tbody>
                  {loginTraps.map(([name, symptom, fix]) => (
                    <tr key={name} className="border-t border-line/70 align-top">
                      <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[10px] text-amber-200">
                        {name}
                      </td>
                      <td className="px-3.5 py-2.5 text-[11px] leading-5 text-dim">
                        {symptom}
                        <div className="mt-0.5 text-[10px] text-mint/70">{fix}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mb-3 mt-10 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
              then the udp handshake, step by step
            </h3>

            <div className="panel mb-4 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-panel2 font-mono text-[10px] uppercase tracking-wider text-dim">
                  <tr>
                    <th className="px-3 py-2 font-normal">#</th>
                    <th className="px-3 py-2 font-normal">direction</th>
                    <th className="px-3 py-2 font-normal">message</th>
                    <th className="hidden px-3 py-2 font-normal md:table-cell">
                      what it means
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hsSteps.map(([n, dir, message, detail]) => (
                    <tr key={n} className="border-t border-line/70">
                      <td className="px-3 py-2 font-mono text-[10px] text-dim">{n}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-mint/80">
                        {dir}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-body/90">
                        {message}
                      </td>
                      <td className="hidden px-3 py-2 text-xs leading-5 text-dim md:table-cell">
                        {detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <FileTabs files={pick("src/login.cpp")} />

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Callout tone="warn" title="where the ltoken comes from">
                The official client asks <code className="font-mono text-[11px]">loginurl</code>{" "}
                for a token first — on localhost that is the dashboard from steps
                1–6, pointed at by <code className="font-mono text-[11px]">loginurl|127.0.0.1</code>{" "}
                in server_data.php. Without a page there you have to patch that step
                out and send the base64 yourself.
              </Callout>
              <Callout title="the new peer has no identity yet">
                After OnSendToServer the client reconnects, so{" "}
                <code className="font-mono text-[11px]">tankIDName</code> arrives on
                a different ENetPeer than the one that sent ltoken. In one process
                that is fine: keep the account keyed by GrowID, not by peer pointer.
              </Callout>
            </div>
          </section>

          {/* 07 join */}
          <section id="s-join" className="scroll-mt-28">
            <SectionHeading
              index="07"
              eyebrow="World"
              title="Sending a map the client can stand in"
              intro="join_request carries the world name. Load it, create it if the name is new, ship the tile blob as SEND_MAP_DATA, then spawn the avatar and place it with OnSetPos."
            />

            <FileTabs files={pick("src/world.hpp", "src/world.cpp")} />

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="panel overflow-hidden">
                <div className="border-b border-line px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-dim">
                  SEND_MAP_DATA payload
                </div>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {mapLayout.map(([type, value, meaning]) => (
                      <tr key={type + value} className="border-t border-line/70">
                        <td className="whitespace-nowrap px-3.5 py-2 font-mono text-[10px] text-mint">
                          {type}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2 font-mono text-[10px] text-body/90">
                          {value}
                        </td>
                        <td className="px-3.5 py-2 text-[11px] leading-5 text-dim">
                          {meaning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <div className="panel p-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                    OnSpawn · required lines
                  </div>
                  <ul className="space-y-1.5 text-xs leading-5 text-body/85">
                    <li>
                      <code className="font-mono text-[11px] text-mint">spawn|avatar</code>{" "}
                      then one key per line
                    </li>
                    <li>
                      <code className="font-mono text-[11px] text-mint">netID</code> unique
                      inside the world
                    </li>
                    <li>
                      <code className="font-mono text-[11px] text-mint">colrect|0|0|20|30</code>{" "}
                      hitbox
                    </li>
                    <li>
                      <code className="font-mono text-[11px] text-mint">posXY</code> pixels,
                      not tiles
                    </li>
                    <li>
                      <code className="font-mono text-[11px] text-mint">name</code> with
                      colour codes if you like
                    </li>
                    <li>
                      <code className="font-mono text-[11px] text-mint">invis|0|mstate|1|smstate|0</code>
                    </li>
                  </ul>
                </div>
                <Callout title="map first, avatar second">
                  Send the map before OnSpawn. The client builds the tile world when
                  the map arrives and silently drops a spawn whose position has no
                  floor under it.
                </Callout>
              </div>
            </div>

            <div className="mt-4">
              <Callout tone="warn" title="the blob has request order, not magic">
                Every field above exists because gurotopia writes it, including the
                four zeros with no known meaning. If the client shows a black or
                empty world, compare your blob length with a captured SEND_MAP_DATA:
                6000 tiles must make it 48 000 bytes longer than the header.
              </Callout>
            </div>
          </section>

          {/* 08 break */}
          <section id="s-break" className="scroll-mt-28">
            <SectionHeading
              index="08"
              eyebrow="Tiles"
              title="Breaking a block"
              intro="A punch is not its own packet: the client sends TILE_CHANGE_REQUEST (0x03) with itemID 18, the fist, and the tile it hit. You count the hits, answer with damage, and on the last one clear the tile and broadcast the update."
            />

            <FileTabs files={pick("src/tiles.cpp")} />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  step: "0x03",
                  title: "read the request",
                  body: "tileX at 44 and tileY at 48, itemID at 20, netID at 8. Fist is 18, wrench 32; anything else is the item being placed.",
                },
                {
                  step: "0x08",
                  title: "acknowledge damage",
                  body: "TILE_APPLY_DAMAGE sets buildRange in the top byte: type = (damage << 24) | 0x08. The client plays the crack animation and does not expect a reply.",
                },
                {
                  step: "0x05",
                  title: "send the new tile",
                  body: "SEND_TILE_UPDATE_DATA carries the block blob (fg, bg, state) plus one object-type byte. fg = 0 is an empty tile.",
                },
                {
                  step: "0x0d",
                  title: "give the item back",
                  body: "MODIFY_ITEM_INVENTORY with the count in the type: (count << 24) | 0x0d adds, (count << 16) | 0x0d removes.",
                },
              ].map((item) => (
                <div key={item.step} className="panel p-4">
                  <div className="mb-1.5 flex items-baseline gap-2">
                    <span className="font-mono text-[10px] text-mint/70">{item.step}</span>
                    <h3 className="text-sm font-medium text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs leading-5 text-dim">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Callout tone="danger" title="validate before you trust the tile">
                The client sends whatever tile it likes. Check the bounds, check that
                the peer is inside that world, and — once locks exist — check that it
                may build there. Everything in a 0x03 is attacker-controlled input,
                including itemID.
              </Callout>
            </div>
          </section>

          {/* 09 next */}
          <section id="s-next" className="scroll-mt-28">
            <SectionHeading
              index="09"
              eyebrow="Next"
              title="What to build once a world loads"
              intro="A joined world and a broken block are the floor, not the ceiling. In rough order of what will break next, this is the list I am working through."
            />

            <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] lg:items-start">
              <div className="panel p-4">
                <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">
                  checklist
                </div>
                <ul className="space-y-2">
                  {nextSteps.map((item) => (
                    <li key={item} className="flex gap-2 text-xs leading-5 text-body/85">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-mint/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="panel overflow-hidden">
                <div className="border-b border-line px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-dim">
                  traps, and what they look like
                </div>
                <table className="w-full text-left">
                  <tbody>
                    {traps.map(([name, symptom, fix]) => (
                      <tr key={name} className="border-t border-line/70 align-top">
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[10px] text-amber-200">
                          {name}
                        </td>
                        <td className="px-3.5 py-2.5 text-[11px] leading-5 text-dim">
                          {symptom}
                          <div className="mt-0.5 text-[10px] text-mint/70">{fix}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-line bg-panel p-5">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">
                disclaimer
              </div>
              <div className="space-y-2.5 text-xs leading-6 text-dim">
                <p>
                  This starter is for a private server on my own machine, written to
                  learn ENet, TLS and MySQL. It is not a release, a hosting service or
                  an invitation to run a public server, and it is not affiliated with
                  Ubisoft or Growtopia.
                </p>
                <p>
                  The wire format follows gurotopia and the protocol guide linked in
                  the other tab. Growtopia's assets, items.dat and client are not
                  redistributed here — use your own copy and your own accounts.
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="border-t border-line/70">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[10px] text-dim">
              gtps starter · c++20 · cmake · enet · mariadb
            </p>
            <a
              href="https://github.com/gurotopia/Gurotopia"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] text-dim/70 transition hover:text-mint"
            >
              reference: gurotopia ↗
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
