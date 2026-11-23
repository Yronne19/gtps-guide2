import { Callout, SectionHeading } from "./components/ui.jsx";
import {
  ByteOrderLab,
  DnsLab,
  HandshakeLab,
  LayersLab,
  PortsLab,
  ServerCycle,
  TcpUdpLab,
} from "./components/net/animations.jsx";
import { useScrollSpy } from "./useScrollSpy.js";

const NAV = [
  { id: "n-socket", label: "socket: IP + port" },
  { id: "n-layers", label: "mga layer" },
  { id: "n-handshake", label: "handshake" },
  { id: "n-tcpudp", label: "TCP vs UDP" },
  { id: "n-bytes", label: "byte order" },
  { id: "n-dns", label: "DNS" },
  { id: "n-server", label: "buhay ng server" },
  { id: "n-recap", label: "buod at links" },
];

const LINKS = [
  {
    title: "Beej's Guide — buong aklat",
    url: "https://beej.us/guide/bgnet/html/split/",
    note: "Dito nanggaling ang mga ideya sa page na ito. Maikli lang ang bawat kabanata.",
  },
  {
    title: "Ano ang socket?",
    url: "https://beej.us/guide/bgnet/html/split/what-is-a-socket.html",
    note: "Ang dalawang numero na bumubuo ng isang koneksyon.",
  },
  {
    title: "IP address, struct at byte order",
    url: "https://beej.us/guide/bgnet/html/split/ip-addresses-structs-and-data-munging.html",
    note: "Bakit baliktad ang bytes at bakit may htons.",
  },
  {
    title: "IPv4 papuntang IPv6",
    url: "https://beej.us/guide/bgnet/html/split/jumping-from-ipv4-to-ipv6.html",
    note: "Mas mahabang address, pero parehong ideya.",
  },
  {
    title: "Mga system call",
    url: "https://beej.us/guide/bgnet/html/split/system-calls-or-bust.html",
    note: "getaddrinfo, socket, bind, connect, listen, accept.",
  },
  {
    title: "Client-server na background",
    url: "https://beej.us/guide/bgnet/html/split/client-server-background.html",
    note: "Blocking, select, at kung paano maghintay ng maraming client.",
  },
  {
    title: "Medyo advanced na teknik",
    url: "https://beej.us/guide/bgnet/html/split/slightly-advanced-techniques.html",
    note: "Non-blocking, broadcast at pagpapadala ng struct.",
  },
];

export default function NetworkView() {
  const active = useScrollSpy(NAV.map((section) => section.id));

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-line/70 lg:block">
        <div className="sticky top-[68px] flex h-[calc(100vh-68px)] flex-col">
          <div className="border-b border-line/70 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded bg-sky-300 font-mono text-[11px] font-bold text-ink">
                NET
              </span>
              <div>
                <div className="font-mono text-[12px] text-white">networking basics</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-dim">
                  tagalog · may animation
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3">
            <ul className="space-y-0.5">
              {NAV.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`flex items-baseline gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] transition ${
                      active === section.id
                        ? "bg-sky-300/10 text-sky-200"
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
              hango sa beej&apos;s guide to network programming
            </p>
            <a
              href="https://beej.us/guide/bgnet/html/split/"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-mono text-[10px] text-sky-300 hover:text-mint"
            >
              buksan ang gabay ↗
            </a>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <section className="relative isolate overflow-hidden border-b border-line">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-10%,rgba(125,211,252,0.16),transparent_55%)]" />
          <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-5 sm:py-16">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="chip border-sky-300/40 text-sky-200">
                <i className="size-1.5 rounded-full bg-sky-300" />
                networking basics
              </span>
              <span className="chip">tagalog</span>
              <span className="chip">6 animation</span>
            </div>

            <h1 className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl">
              Ano ba talaga ang <span className="text-sky-300">nangyayari sa ilalim</span>?
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-7 text-body/80 sm:text-[15px]">
              Ang networking ay parang pagpapadala ng sulat. Alam mo ang address, alam mo ang
              pinto, at may nagdadala ng sulat sa gitna. Sa page na ito, panoorin natin nang
              dahan-dahan ang bawat hakbang — walang code na kailangan, puro animation at
              simpleng paliwanag.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#n-socket" className="btn border-sky-300/50 text-sky-200">
                simulan sa socket →
              </a>
              <a href="#n-layers" className="btn">
                ang mga layer
              </a>
              <a href="#n-recap" className="btn">
                buod
              </a>
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line/60 sm:grid-cols-4">
              {[
                ["IP", "saan"],
                ["port", "saang pinto"],
                ["TCP", "sigurado"],
                ["UDP", "mabilis"],
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
            {NAV.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] transition ${
                  active === section.id
                    ? "border-sky-300/50 bg-sky-300/10 text-sky-200"
                    : "border-line text-dim"
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-14 px-4 py-10 sm:space-y-20 sm:px-5 sm:py-14">
          {/* 01 socket */}
          <section id="n-socket" className="scroll-mt-28">
            <SectionHeading
              index="01"
              eyebrow="Simula"
              title="Ang socket ay address + pinto"
              intro="Isipin mo ang isang computer na parang bahay. Ang IP address ang address ng bahay. Ang port ang numero ng pinto. Kapag kumatok ka sa tamang bahay pero maling pinto, walang sasagot."
            />

            <PortsLab />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="panel p-3.5 sm:p-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sky-200">
                  isang computer, maraming pinto
                </div>
                <ul className="space-y-1.5 text-[13px] leading-6 text-body/85">
                  <li>· Isang IP address lang ang computer.</li>
                  <li>· Pero puwedeng may web server, laro at database sa loob nito.</li>
                  <li>· Ang port ang nagsasabi kung alin sa kanila ang kakausapin.</li>
                </ul>
              </div>
              <div className="panel p-3.5 sm:p-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sky-200">
                  mga port na madalas makita
                </div>
                <dl className="space-y-1 font-mono text-[11px]">
                  {[
                    ["80", "http"],
                    ["443", "https"],
                    ["17091", "GTPS · ENet"],
                    ["3306", "MySQL"],
                  ].map(([port, name]) => (
                    <div key={port} className="flex justify-between gap-3">
                      <dt className="text-lime">{port}</dt>
                      <dd className="text-dim">{name}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="mt-4">
              <Callout title="bakit ito mahalaga">
                Kapag gumawa ka ng server, hindi lang IP ang ibibigay mo — kailangan mong
                sabihin kung saang port siya nakaupo, at i-bind ang socket doon. Kung hindi,
                parang bahay na walang pinto: nakikita ang address, pero walang makapasok.
              </Callout>
            </div>
          </section>

          {/* 02 layers */}
          <section id="n-layers" className="scroll-mt-28">
            <SectionHeading
              index="02"
              eyebrow="Ang paglalakbay"
              title="Bawat layer, may idadagdag na balot"
              intro="Hindi direktang lumilipad ang mensahe mo. Bumababa muna siya sa mga layer, nilalagyan ng impormasyon sa bawat isa, tapos pataas ulit sa kabilang dulo. Parang sulat na inilalagay sa sobre, tapos sa bag, tapos sa truck."
            />

            <LayersLab />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="panel p-3.5 sm:p-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  pababa · nagbabalot
                </div>
                <p className="text-[13px] leading-6 text-body/85">
                  Application → Transport → Network → Data link → Physical. Bawat layer ay may
                  sariling trabaho, at wala siyang pakialam sa detalye ng ibang layer.
                </p>
              </div>
              <div className="panel p-3.5 sm:p-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  pataas · nagtatanggal
                </div>
                <p className="text-[13px] leading-6 text-body/85">
                  Sa kabilang dulo, binaliktad ang proseso. Physical muna, tapos data link,
                  network, transport — hanggang umabot sa programa ang orihinal na mensahe.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Callout tone="warn" title="dito nagkakamali ang mga baguhan">
                Ang <span className="text-body">port</span> ay nasa Transport layer. Ang{" "}
                <span className="text-body">IP</span> ay nasa Network layer. Ang{" "}
                <span className="text-body">MAC</span> ay nasa Data link layer. Kapag pinaghalo
                mo sila, magmumukhang tama ang code pero hindi tatakbo.
              </Callout>
            </div>
          </section>

          {/* 03 handshake */}
          <section id="n-handshake" className="scroll-mt-28">
            <SectionHeading
              index="03"
              eyebrow="TCP"
              title="Tatlong tanong bago magsimula"
              intro="Bago magpadala ng laro, may maikling usapan muna ang client at server. Tatlong mensahe lang, pero dito nakasalalay kung may kausap ka ba talaga."
            />

            <HandshakeLab />

            <div className="mt-4">
              <Callout title="bakit tatlo?">
                Kailangan ng bawat isa na malaman na kaya ng kabila ang magpadala at
                makatanggap. Ang SYN, SYN-ACK at ACK ang nagpapatunay ng dalawang direksyon —
                kaya kahit isang beses lang nawala ang isang mensahe, may pagkakataon pang
                maulit.
              </Callout>
            </div>
          </section>

          {/* 04 tcp vs udp */}
          <section id="n-tcpudp" className="scroll-mt-28">
            <SectionHeading
              index="04"
              eyebrow="Dalawang pili"
              title="Sigurado o mabilis?"
              intro="Ang TCP ay parang courier na may resibo: may nawala, ipapadala ulit. Ang UDP ay parang ihinagis na papel: mabilis, pero walang kasiguraduhan. Pareho silang tama — depende sa kailangan mo."
            />

            <TcpUdpLab />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="panel border-sky-400/30 p-3.5 sm:p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-200">
                  piliin ang TCP kapag
                </div>
                <ul className="mt-1.5 space-y-1 text-[13px] leading-6 text-body/85">
                  <li>· Mahalaga na buo at tama ang ayos.</li>
                  <li>· Kailangan ng kumpirmasyon.</li>
                  <li>· Halimbawa: chat, file, o login.</li>
                </ul>
              </div>
              <div className="panel border-amber-400/30 p-3.5 sm:p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-200">
                  piliin ang UDP kapag
                </div>
                <ul className="mt-1.5 space-y-1 text-[13px] leading-6 text-body/85">
                  <li>· Bilis ang mahalaga, hindi ang bawat piraso.</li>
                  <li>· Okay lang na may mawalang kaunti.</li>
                  <li>· Halimbawa: video call, laro, posisyon ng player.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 05 bytes */}
          <section id="n-bytes" className="scroll-mt-28">
            <SectionHeading
              index="05"
              eyebrow="Maliit na detalye"
              title="Bakit baliktad ang bytes"
              intro="Ang computer ay walang konsepto ng “kaliwa” o “kanan”. Kaya may dalawang paraan ng pag-ayos ng bytes. Dito nagkakaproblema ang marami: tama ang numero, mali lang ang pagkakabasa."
            />

            <ByteOrderLab />

            <div className="mt-4">
              <Callout tone="warn" title="tandaan ito">
                Little-endian ang loob ng mga laro at PC. Big-endian ang mga field ng ENet. Kapag
                may numerong parang sobrang laki o kakaiba, malamang binabasa mo lang ito nang
                baliktad — hindi sira ang packet.
              </Callout>
            </div>
          </section>

          {/* 06 dns */}
          <section id="n-dns" className="scroll-mt-28">
            <SectionHeading
              index="06"
              eyebrow="Bago ang lahat"
              title="Paano nagiging address ang pangalan"
              intro="Alam mo ang growtopia1.com, pero ang computer ay numero lang ang naiintindihan. Ang DNS ang nagsasalin ng pangalan papuntang IP — parang phonebook, pero tanong-tanong muna bago ang sagot."
            />

            <DnsLab />

            <div className="mt-4">
              <Callout title="kaya may cache">
                Hindi bawat connection ay nagtatanong ulit. Tinitipid ng resolver at ng browser
                ang sagot sa loob ng ilang minuto o oras. Kaya may pagkakataon na bagong
                server na ang IP, pero luma pa ang nakikita mo.
              </Callout>
            </div>
          </section>

          {/* 07 server */}
          <section id="n-server" className="scroll-mt-28">
            <SectionHeading
              index="07"
              eyebrow="Sa sarili mong code"
              title="Ang buhay ng isang server"
              intro="Kapag gumawa ka ng server, anim lang ang pangunahing tawag. Ang iba ay detalye. Panoorin ang ayos: gumawa, ikabit, makinig, tumanggap, mag-usap, magsara."
            />

            <ServerCycle />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="panel p-3.5 sm:p-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  client side
                </div>
                <p className="font-mono text-[11px] leading-6 text-body/80">
                  socket() → connect() → send() / recv() → close()
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-dim">
                  Mas maikli: pero kailangan muna ng address. Dito papasok ang DNS.
                </p>
              </div>
              <div className="panel p-3.5 sm:p-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  isang mahalagang ugali
                </div>
                <p className="text-[12px] leading-5 text-body/80">
                  Laging tingnan ang return value. Ang bawat isa sa anim ay puwedeng
                  mag-fail — at kapag hindi mo hinawakan ang error, mahirap hanapin ang
                  problema mamaya.
                </p>
              </div>
            </div>
          </section>

          {/* 08 recap */}
          <section id="n-recap" className="scroll-mt-28">
            <SectionHeading
              index="08"
              eyebrow="Buod"
              title="Anim na bagay na pwede mong isulat sa likod ng papel"
              intro="Kung ito lang ang natandaan mo, malayo na ang mararating mo sa pagbasa ng code at pag-debug."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["socket", "IP + port. Kung wala ang isa, walang koneksyon."],
                ["layer", "Bawat layer ay may idinadagdag na balot. Pababa, tapos pataas."],
                ["handshake", "SYN, SYN-ACK, ACK. Tatlong tanong bago magsimula."],
                ["TCP / UDP", "TCP: sigurado, may pagulit. UDP: mabilis, walang pangako."],
                ["byte order", "Maliit na byte muna sa loob. Malaki muna sa ENet."],
                ["DNS", "Pangalan → IP. Pagkatapos, normal na koneksyon na."],
              ].map(([title, body], index) => (
                <div key={title} className="panel p-3.5 sm:p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] text-sky-300/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-mono text-[12px] text-white">{title}</h3>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-dim">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                basahin ang orihinal
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {LINKS.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group panel p-3.5 transition hover:border-sky-300/40 hover:bg-panel2 sm:p-4"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-medium text-white group-hover:text-sky-200">
                        {link.title}
                      </span>
                      <span className="font-mono text-[10px] text-dim">↗</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-dim">{link.note}</p>
                  </a>
                ))}
              </div>
            </div>

            <p className="mt-4 font-mono text-[10px] leading-5 text-dim/70">
              Ang page na ito ay simpleng salin at animation ng mga ideya mula kay Brian “Beej
              Jorgensen” Hall. Ang orihinal na gabay ang pinaka-tumpak na sanggunian.
            </p>
          </section>
        </div>

        <footer className="border-t border-line/70">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="font-mono text-[10px] text-dim">
              networking basics · tagalog · {new Date().getFullYear()}
            </p>
            <p className="font-mono text-[10px] text-dim/70">hango kay beej · may animation</p>
          </div>
        </footer>
      </main>
    </>
  );
}
