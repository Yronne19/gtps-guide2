import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* shared                                                             */
/* ------------------------------------------------------------------ */

function Controls({ children }) {
  return <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>;
}

function NetBtn({ active, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition ${
        active
          ? "border-sky-300/60 bg-sky-300/10 text-sky-200"
          : "border-line2 bg-panel2 text-dim hover:text-body"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* 01 · socket = IP + port                                            */
/* ------------------------------------------------------------------ */

const PORTS = [
  { port: 443, name: "https", ok: false, why: "May sumasagot, pero web page lang ang nandoon." },
  { port: 17091, name: "game server", ok: true, why: "Tama ito. Dito nakaupo ang laro." },
  { port: 8080, name: "proxy", ok: false, why: "Ibang programa ang nakaupo sa pintong ito." },
];

export function PortsLab() {
  const wrapRef = useRef(null);
  const clientRef = useRef(null);
  const doorRefs = useRef([]);
  const timers = useRef([]);
  const [target, setTarget] = useState(1);
  const [coords, setCoords] = useState(null);
  const [flying, setFlying] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function pick(index) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTarget(index);
    setCoords(null);
    setFlying(false);
    setResult(null);
  }

  function send() {
    const wrap = wrapRef.current?.getBoundingClientRect();
    const client = clientRef.current?.getBoundingClientRect();
    const door = doorRefs.current[target]?.getBoundingClientRect();
    if (!wrap || !client || !door) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResult(null);
    setFlying(false);
    setCoords({
      from: {
        x: client.right - wrap.left - 6,
        y: client.top - wrap.top + client.height / 2 - 6,
      },
      to: {
        x: door.left - wrap.left - 14,
        y: door.top - wrap.top + door.height / 2 - 6,
      },
    });
    requestAnimationFrame(() => requestAnimationFrame(() => setFlying(true)));
    timers.current.push(setTimeout(() => setResult(PORTS[target]), 1050));
  }

  return (
    <div className="panel p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          parehong IP, iba-ibang pinto
        </span>
        <span className="font-mono text-[10px] text-dim/70">pumili ng pinto, tapos padala</span>
      </div>

      <div ref={wrapRef} className="relative h-[15rem] w-full sm:h-[13rem]">
        <div
          ref={clientRef}
          className="absolute left-0 top-1/2 w-[4.75rem] -translate-y-1/2 rounded-lg border border-line2 bg-panel2 p-2 sm:w-28"
        >
          <div className="font-mono text-[9px] uppercase tracking-wider text-sky-300/80">ikaw</div>
          <div className="mt-0.5 font-mono text-[11px] text-white">client</div>
          <div className="mt-1 break-all font-mono text-[9px] leading-4 text-dim">
            10.0.0.5
            <br />
            port 52344
          </div>
        </div>

        {coords ? (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <line
              x1={coords.from.x + 6}
              y1={coords.from.y + 6}
              x2={coords.to.x + 6}
              y2={coords.to.y + 6}
              stroke="#5ce1a5"
              strokeOpacity="0.35"
              strokeDasharray="4 5"
              strokeWidth="1"
            />
          </svg>
        ) : null}

        {coords ? (
          <span
            style={{
              left: flying ? coords.to.x : coords.from.x,
              top: flying ? coords.to.y : coords.from.y,
            }}
            className="pointer-events-none absolute size-3 rounded-full bg-lime shadow-[0_0_12px_2px_rgba(182,243,106,0.45)] transition-all duration-1000 ease-in-out"
          />
        ) : null}

        <div className="absolute right-0 top-1/2 w-[7.75rem] -translate-y-1/2 rounded-lg border border-line2 bg-panel2 p-2 sm:w-44">
          <div className="font-mono text-[9px] uppercase tracking-wider text-dim">
            server · 10.0.0.9
          </div>
          <div className="mt-1.5 space-y-1">
            {PORTS.map((item, index) => (
              <button
                key={item.port}
                ref={(el) => {
                  doorRefs.current[index] = el;
                }}
                type="button"
                onClick={() => pick(index)}
                className={`flex w-full items-center justify-between gap-1 rounded border px-1.5 py-1.5 font-mono text-[9px] transition ${
                  target === index
                    ? "border-sky-300/60 bg-sky-300/10 text-sky-100"
                    : "border-line bg-ink text-dim hover:text-body"
                }`}
              >
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 opacity-70">{item.port}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Controls>
        <NetBtn onClick={send} active>
          padala ang sulat →
        </NetBtn>
        <code className="font-mono text-[10px] text-dim">
          socket: 10.0.0.5:52344 → 10.0.0.9:{PORTS[target].port}
        </code>
      </Controls>

      {result ? (
        <div
          className={`net-fade mt-2 rounded-lg border px-3 py-2 text-[12px] leading-5 ${
            result.ok
              ? "border-mint/40 bg-mint/[0.06] text-mint"
              : "border-rose-400/40 bg-rose-400/[0.06] text-rose-200"
          }`}
        >
          {result.ok ? "Tumunog ang pinto. " : "Walang nakikinig. "}
          {result.why}
        </div>
      ) : (
        <p className="mt-2 font-mono text-[10px] leading-4 text-dim/70">
          kapag mali ang port, hindi lang mabagal — hindi talaga maririnig ng programa mo
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 02 · layers / encapsulation                                        */
/* ------------------------------------------------------------------ */

const LAYERS = [
  {
    key: "app",
    name: "Application",
    header: "ang mensahe mo",
    tone: "border-amber-400/40 bg-amber-400/[0.06]",
    text: "text-amber-200",
  },
  {
    key: "transport",
    name: "Transport",
    header: "TCP · port 17091",
    tone: "border-sky-400/40 bg-sky-400/[0.06]",
    text: "text-sky-200",
  },
  {
    key: "network",
    name: "Network",
    header: "IP · 10.0.0.5 → 10.0.0.9",
    tone: "border-violet-400/40 bg-violet-400/[0.06]",
    text: "text-violet-200",
  },
  {
    key: "link",
    name: "Data link",
    header: "MAC · aa:bb:cc → dd:ee:ff",
    tone: "border-mint/40 bg-mint/[0.06]",
    text: "text-mint",
  },
  {
    key: "physical",
    name: "Physical",
    header: "01001010 11010011 …",
    tone: "border-line2 bg-panel2",
    text: "text-body",
  },
];

const LAYER_STEPS = [
  "Simula pa lang. Nasa Application layer ang mensahe mo — ito yung “Kumusta!”.",
  "Binabalot ng Transport layer. Nilalagyan ito ng port at ng bilang ng piraso, para alam kung saang pinto at saang ayos ito babalik.",
  "Binabalot ng Network layer. Nilalagyan ito ng IP — saang computer ito pupunta. Dito na papasok ang router.",
  "Binabalot ng Data link layer. Nilalagyan ito ng MAC address — saang susunod na device ito sa lokal na kable.",
  "Binabalot ng Physical layer. Nagiging kuryente, ilaw o radyo na siya. Hindi na siya sulat — signal na.",
  "Bumabiyahe siya sa kable o hangin. Ang router ang nagpapasa-pasa nito hanggang makarating sa tamang IP.",
  "Nakarating! Tinatanggal ng Physical layer ang balot nito at ibinabalik ang signal bilang bits.",
  "Tinatanggal ang Data link balot. Tiningnan ang MAC: tama, akin ito.",
  "Tinatanggal ang Network balot. Tiningnan ang IP: tama, ako ang tinutukoy.",
  "Tinatanggal ang Transport balot. Binubuo ulit ang mga piraso ayon sa bilang nila.",
  "Nasa Application layer na ulit siya. Binabasa na ng programa mo ang “Kumusta!”.",
];

export function LayersLab() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return undefined;
    if (step >= 10) {
      setAuto(false);
      return undefined;
    }
    const timer = setTimeout(() => setStep((value) => Math.min(10, value + 1)), 1300);
    return () => clearTimeout(timer);
  }, [auto, step]);

  const wrapped = step <= 5 ? Math.min(step, 4) : Math.max(0, 9 - step);
  const sendActive = step <= 4 ? step : -1;
  const recvActive = step >= 6 ? 10 - step : -1;

  let packet = (
    <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center">
      <span className="font-mono text-[11px] text-white">“Kumusta!”</span>
    </div>
  );

  for (let index = 1; index <= wrapped; index += 1) {
    const layer = LAYERS[index];
    const inner = packet;
    packet = (
      <div key={layer.key} className={`net-pop rounded-lg border ${layer.tone}`}>
        <div
          className={`flex items-center justify-between gap-2 border-b border-white/5 px-2 py-1 font-mono text-[9px] ${layer.text}`}
        >
          <span className="shrink-0">{layer.name}</span>
          <span className="truncate opacity-70">{layer.header}</span>
        </div>
        <div className="p-1.5">{inner}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] lg:items-start">
      <div className="order-2 space-y-3 lg:order-1">
        <LayerColumn title="sender · pababa" layers={LAYERS} active={sendActive} tone="down" />

        <div
          className={`flex h-8 items-center gap-2 rounded-md border px-2 transition ${
            step === 5
              ? "border-mint/50 bg-mint/[0.06]"
              : "border-line/60 bg-panel2/30"
          }`}
        >
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-dim">
            kable
          </span>
          <div className="relative h-1 flex-1 overflow-hidden rounded bg-line2/70">
            {step === 5 ? (
              <span className="net-flow-r absolute top-0 size-1.5 rounded-full bg-mint" />
            ) : null}
          </div>
        </div>

        <LayerColumn title="receiver · pataas" layers={LAYERS} active={recvActive} tone="up" />
      </div>

      <div className="panel order-1 flex flex-col p-3 sm:p-4 lg:order-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
            itsura ng sulat ngayon
          </span>
          <span className="shrink-0 font-mono text-[10px] text-sky-200">
            {wrapped} / 4 balot
          </span>
        </div>

        <div className="min-h-[8.5rem] rounded-lg bg-ink/60 p-2">{packet}</div>

        <p className="mt-3 min-h-[4.5rem] text-[12px] leading-5 text-body/80">
          {LAYER_STEPS[step]}
        </p>

        <Controls>
          <NetBtn onClick={() => setStep((value) => Math.min(10, value + 1))} active>
            hakbang →
          </NetBtn>
          <NetBtn
            active={auto}
            onClick={() => {
              if (auto) {
                setAuto(false);
              } else {
                if (step >= 10) setStep(0);
                setAuto(true);
              }
            }}
          >
            {auto ? "tigil" : "auto-play"}
          </NetBtn>
          <NetBtn
            onClick={() => {
              setAuto(false);
              setStep(0);
            }}
          >
            ulit
          </NetBtn>
          <span className="ml-auto font-mono text-[10px] text-dim/70">
            {step + 1} / 11
          </span>
        </Controls>

        <div className="mt-2 flex gap-1">
          {LAYER_STEPS.map((_, index) => (
            <span
              key={index}
              className={`h-1 flex-1 rounded-full transition ${
                index <= step ? "bg-sky-300/60" : "bg-line2/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LayerColumn({ title, layers, active, tone }) {
  const list = tone === "down" ? layers : [...layers].reverse();

  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-dim">{title}</div>
      <div className="space-y-1">
        {list.map((layer) => {
          const index = layers.indexOf(layer);
          const on = index === active;
          return (
            <div
              key={layer.key}
              className={`flex items-center gap-2 rounded-md border px-2 py-1.5 transition ${
                on
                  ? "border-sky-300/60 bg-sky-300/[0.08] text-white"
                  : "border-line/70 bg-panel2/40 text-dim"
              }`}
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  on ? "net-pulse bg-sky-300" : "bg-line2"
                }`}
              />
              <span className="text-[11px]">{layer.name}</span>
              <span className="ml-auto hidden truncate font-mono text-[9px] opacity-60 sm:block">
                {layer.header.split(" · ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 03 · TCP handshake                                                 */
/* ------------------------------------------------------------------ */

const FRAMES = [
  {
    dir: "c2s",
    label: "SYN",
    detail: "“Kumusta? May nakikinig ba diyan?” Nagsisimula ang client ng usapan.",
    state: "SYN_SENT",
  },
  {
    dir: "s2c",
    label: "SYN-ACK",
    detail: "“Oo, nandito ako.” Sumasagot ang server at nagbibigay ng sariling bilang.",
    state: "ESTABLISHED",
  },
  {
    dir: "c2s",
    label: "ACK",
    detail: "“Sige, sabay na tayo.” Sa puntong ito, konektado na ang dalawa.",
    state: "ESTABLISHED",
  },
  {
    dir: "c2s",
    label: "DATA",
    detail: "Dito na dumadaan ang laro: bawat action at bawat packet.",
    state: "ESTABLISHED",
  },
  {
    dir: "c2s",
    label: "FIN + ACK",
    detail: "“Tapos na ako.” Malinis na pagsara, hindi biglaang bitaw.",
    state: "CLOSED",
  },
];

const STATE_BY_STEP = [
  ["CLOSED", "LISTEN"],
  ["SYN_SENT", "SYN_RECEIVED"],
  ["SYN_SENT", "SYN_RECEIVED"],
  ["ESTABLISHED", "ESTABLISHED"],
  ["ESTABLISHED", "ESTABLISHED"],
  ["CLOSED", "CLOSED"],
];

export function HandshakeLab() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return undefined;
    if (step >= FRAMES.length) {
      setAuto(false);
      return undefined;
    }
    const timer = setTimeout(() => setStep((value) => value + 1), 1500);
    return () => clearTimeout(timer);
  }, [auto, step]);

  const [clientState, serverState] = STATE_BY_STEP[Math.min(step, FRAMES.length)];

  return (
    <div className="panel p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          sequence ng usapan
        </span>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px]">
          <span className="rounded border border-line bg-ink px-1.5 py-0.5 text-dim">
            client <span className="text-sky-200">{clientState}</span>
          </span>
          <span className="rounded border border-line bg-ink px-1.5 py-0.5 text-dim">
            server <span className="text-mint">{serverState}</span>
          </span>
        </div>
      </div>

      <ol className="mt-2.5 space-y-2">
        {FRAMES.map((frame, index) => {
          const done = index < step;
          const active = index === step - 1;
          return (
            <li
              key={frame.label}
              className={`rounded-lg border px-2.5 py-2 transition ${
                active
                  ? "net-fade border-sky-300/50 bg-sky-300/[0.06]"
                  : done
                    ? "border-line bg-panel2/40"
                    : "border-line/50 bg-panel2/10 opacity-45"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[9px] text-dim/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[11px] text-white">{frame.label}</span>
                <span className="ml-auto shrink-0 font-mono text-[9px] text-dim">
                  {frame.dir === "c2s" ? "client → server" : "server → client"}
                </span>
              </div>

              <div className="relative mt-1.5 h-3">
                <span className="absolute inset-x-0 top-1/2 h-px bg-line2" />
                {done ? (
                  <span
                    className={`absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-sky-300 shadow-[0_0_8px_2px_rgba(125,211,252,0.4)] ${
                      frame.dir === "c2s" ? "net-flow-r" : "net-flow-l"
                    }`}
                  />
                ) : null}
              </div>

              <p className="mt-1 text-[11px] leading-5 text-dim">{frame.detail}</p>
            </li>
          );
        })}
      </ol>

      <Controls>
        <NetBtn onClick={() => setStep((value) => Math.min(FRAMES.length, value + 1))} active>
          susunod na hakbang →
        </NetBtn>
        <NetBtn
          active={auto}
          onClick={() => {
            if (auto) {
              setAuto(false);
            } else {
              if (step >= FRAMES.length) setStep(0);
              setAuto(true);
            }
          }}
        >
          {auto ? "tigil" : "auto-play"}
        </NetBtn>
        <NetBtn
          onClick={() => {
            setAuto(false);
            setStep(0);
          }}
        >
          ulit
        </NetBtn>
      </Controls>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 04 · TCP vs UDP                                                    */
/* ------------------------------------------------------------------ */

const TCP_DOTS = [
  { delay: 0 },
  { delay: 0.45 },
  { delay: 0.9, drop: true },
  { delay: 1.95 },
  { delay: 2.4 },
  { delay: 2.85 },
];

const UDP_DOTS = [{ delay: 0 }, { delay: 0.45 }, { delay: 0.9, drop: true }, { delay: 1.35 }, { delay: 1.8 }];

export function TcpUdpLab() {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!run) return undefined;
    const timer = setTimeout(() => setDone(true), 4800);
    return () => clearTimeout(timer);
  }, [run]);

  return (
    <div className="panel p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          parehong 5 packet, isang nawala
        </span>
        <NetBtn
          active
          onClick={() => {
            setDone(false);
            setRun((value) => value + 1);
          }}
        >
          padala ang 5 packet →
        </NetBtn>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Lane
          key={`tcp-${run}`}
          run={run}
          done={done}
          title="TCP"
          tone="text-sky-200"
          subtitle="may kumpiyansa"
          blurb="Kapag may nawala, hinihintay at ipinapadala ulit. Kaya buo at tama ang ayos — pero may dagdag na oras."
          dots={TCP_DOTS}
          result={
            <>
              natanggap: <span className="text-body">1 2 3 4 5</span> · walang butas
            </>
          }
        />
        <Lane
          key={`udp-${run}`}
          run={run}
          done={done}
          title="UDP"
          tone="text-amber-200"
          subtitle="bilisan, walang sigurado"
          blurb="Kapag may nawala, tuloy lang. Walang ipinapadala ulit, kaya mabilis — pero may pwedeng mawalang piraso."
          dots={UDP_DOTS}
          result={
            <>
              natanggap: <span className="text-body">1 2 · 4 5</span> ·{" "}
              <span className="text-rose-300">butas sa gitna</span>
            </>
          }
        />
      </div>

      <p className="mt-3 font-mono text-[10px] leading-4 text-dim/70">
        ang pula ay ang nawalang packet · sa TCP may bumabalik para ipadala itong muli
      </p>
    </div>
  );
}

function Lane({ run, done, title, tone, subtitle, blurb, dots, result }) {
  return (
    <div className="rounded-lg border border-line bg-ink/60 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-mono text-[12px] ${tone}`}>{title}</span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-dim">{subtitle}</span>
      </div>
      <p className="mt-1 text-[11px] leading-5 text-dim">{blurb}</p>

      <div className="relative mt-2 h-10 overflow-hidden rounded-md border border-line bg-ink">
        <span className="absolute left-1 top-1 font-mono text-[8px] uppercase tracking-wider text-dim/50">
          padala
        </span>
        <span className="absolute right-1 top-1 font-mono text-[8px] uppercase tracking-wider text-dim/50">
          tanggap
        </span>
        <span className="absolute inset-y-2 left-1/2 w-px bg-line2/60" />
        {run
          ? dots.map((dot, index) => (
              <span
                key={index}
                style={{
                  animationDelay: `${dot.delay}s`,
                  "--stack": `${index * 0.42}rem`,
                }}
                title={dot.drop ? "nawala ang packet na ito" : undefined}
                className={`absolute top-1/2 size-2 -translate-y-1/2 rounded-full ${
                  dot.drop ? "bg-rose-400" : "bg-sky-300"
                } ${dot.drop ? "net-lane-drop" : "net-lane-move"}`}
              />
            ))
          : null}
      </div>

      <div className="mt-2 min-h-[1rem] font-mono text-[10px] text-dim">
        {done ? <span className="net-fade">{result}</span> : "nagpapadala…"}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 05 · byte order                                                    */
/* ------------------------------------------------------------------ */

export function ByteOrderLab() {
  const [lu, setLu] = useState(true); // little-endian view
  const big = ["00", "00", "42", "C3"];
  const shown = lu ? [...big].reverse() : big;

  return (
    <div className="panel p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          iisang bilang, dalawang ayos
        </span>
        <div className="flex gap-1.5">
          <NetBtn active={!lu} onClick={() => setLu(false)}>
            big-endian
          </NetBtn>
          <NetBtn active={lu} onClick={() => setLu(true)}>
            little-endian
          </NetBtn>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-ink px-3 py-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-dim">
          <span>kuwenta: 17091</span>
          <span>{lu ? "maliit na parte muna" : "malaking parte muna"}</span>
        </div>

        <div key={lu ? "le" : "be"} className="flex gap-1.5 sm:gap-2">
          {shown.map((byte, index) => (
            <span
              key={`${byte}-${index}`}
              style={{ animationDelay: `${index * 0.06}s` }}
              className="net-pop flex-1 rounded-md border border-sky-400/35 bg-sky-400/10 py-2.5 text-center font-mono text-[15px] tracking-[0.1em] text-sky-100 sm:py-3"
            >
              {byte}
            </span>
          ))}
        </div>

        <div className="relative mt-2 h-2">
          <span className="absolute inset-x-0 top-1/2 h-px bg-line2" />
          <span
            className={`absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-mint ${
              lu ? "net-flow-r" : "net-flow-l"
            }`}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-[10px] text-dim">binasa nang tama:</span>
          <span className="font-mono text-base text-lime">17091</span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel2/40 px-3 py-2">
          <div className="font-mono text-[9px] uppercase tracking-wider text-dim">kung mali ang basa</div>
          <div className="mt-0.5 font-mono text-[12px] text-rose-300">
            {lu ? "1209159680" : "49986"}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel2/40 px-3 py-2">
          <div className="font-mono text-[9px] uppercase tracking-wider text-dim">sa C</div>
          <div className="mt-0.5 font-mono text-[12px] text-body">
            htons(17091) → wire bytes
          </div>
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-5 text-body/80">
        Ganito kalaki ang pagkakaiba ng maliit na detalye. Ang <span className="text-body">17091</span>{" "}
        ay <span className="text-body">C3 42</span> sa loob ng laro, pero <span className="text-body">42 C3</span>{" "}
        sa ENet. Kung baliktad ang basa mo, ibang numero ang makikita mo — at hindi magkakaintindihan
        ang dalawang programa.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 06 · DNS                                                           */
/* ------------------------------------------------------------------ */

const DNS_NODES = [
  { name: "Ikaw", note: "Gusto mong pumunta sa growtopia1.com — pero pangalan lang ang alam mo." },
  { name: "DNS resolver", note: "“Saan nakatira ang growtopia1.com?” Tanong muna sa resolver." },
  { name: "Root server", note: "“Hindi ko alam, pero ang .com server ang may alam.”" },
  { name: ".com server", note: "“Tanungin mo ang nameserver ng growtopia1.”" },
  { name: "Address server", note: "“Nandito siya: 203.0.113.10.” Ito ang tunay na address." },
  { name: "Game server", note: "Ngayon may IP na, puwede nang kumonekta sa tamang pinto." },
];

export function DnsLab() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return undefined;
    if (step >= DNS_NODES.length - 1) {
      setAuto(false);
      return undefined;
    }
    const timer = setTimeout(() => setStep((value) => value + 1), 1400);
    return () => clearTimeout(timer);
  }, [auto, step]);

  return (
    <div className="panel p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          pangalan → address
        </span>
        <span className="font-mono text-[10px] text-dim/70">
          hakbang {step + 1} / {DNS_NODES.length}
        </span>
      </div>

      <ol className="space-y-2">
        {DNS_NODES.map((node, index) => {
          const on = index === step;
          const past = index < step;
          return (
            <li key={node.name} className="relative pb-2 pl-7 last:pb-0">
              {index < DNS_NODES.length - 1 ? (
                <span
                  className={`absolute bottom-0 left-[7px] top-6 w-px ${
                    past ? "bg-mint/40" : "bg-line2/60"
                  }`}
                />
              ) : null}
              <span
                className={`absolute left-0 top-2 grid size-[15px] place-items-center rounded-full border font-mono text-[8px] leading-none ${
                  on
                    ? "net-pulse border-sky-300 bg-sky-300/20 text-sky-200"
                    : past
                      ? "border-mint/50 bg-mint/10 text-mint"
                      : "border-line2 bg-panel2 text-dim"
                }`}
              />
              <div
                className={`rounded-md border px-2 py-1.5 transition ${
                  on
                    ? "border-sky-300/50 bg-sky-300/[0.06]"
                    : "border-line/60 bg-panel2/30"
                }`}
              >
                <div className="font-mono text-[11px] text-white">{node.name}</div>
                <div className="text-[11px] leading-5 text-dim">{node.note}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <Controls>
        <NetBtn onClick={() => setStep((value) => Math.min(DNS_NODES.length - 1, value + 1))} active>
          tanong ulit →
        </NetBtn>
        <NetBtn
          active={auto}
          onClick={() => {
            if (auto) {
              setAuto(false);
            } else {
              if (step >= DNS_NODES.length - 1) setStep(0);
              setAuto(true);
            }
          }}
        >
          {auto ? "tigil" : "auto-play"}
        </NetBtn>
        <NetBtn onClick={() => setStep(0)}>ulit</NetBtn>
      </Controls>

      {step === DNS_NODES.length - 1 ? (
        <div className="net-fade mt-2 rounded-lg border border-mint/40 bg-mint/[0.06] px-3 py-2 font-mono text-[11px] text-mint">
          growtopia1.com → 203.0.113.10
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 07 · server life cycle                                             */
/* ------------------------------------------------------------------ */

const CALLS = [
  { fn: "socket()", text: "Gumawa ng pinto. Bibigyan ito ng number ng OS (file descriptor)." },
  { fn: "bind()", text: "Ikabit ang pinto sa IP at port — halimbawa port 17091." },
  { fn: "listen()", text: "Sabihin sa OS: hintayin ang kumakatok sa pintong ito." },
  { fn: "accept()", text: "Pasukin ang isang client. Bagong pinto ang gagamitin nila para sa usapan." },
  { fn: "send() / recv()", text: "Dito na dumadaan ang packets ng laro, pabalik-balik." },
  { fn: "close()", text: "Isara ang pinto. Tapos na ang usapan." },
];

export function ServerCycle() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return undefined;
    if (step >= CALLS.length - 1) {
      setAuto(false);
      return undefined;
    }
    const timer = setTimeout(() => setStep((value) => value + 1), 1300);
    return () => clearTimeout(timer);
  }, [auto, step]);

  return (
    <div className="panel p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          anim na tawag sa OS
        </span>
        <span className="font-mono text-[10px] text-body">{CALLS[step].fn}</span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {CALLS.map((call, index) => (
          <span
            key={call.fn}
            className={`rounded-md border px-2 py-1 font-mono text-[10px] transition ${
              index === step
                ? "border-sky-300/60 bg-sky-300/10 text-sky-100"
                : index < step
                  ? "border-mint/40 bg-mint/[0.06] text-mint/80"
                  : "border-line bg-panel2/60 text-dim"
            }`}
          >
            {call.fn}
          </span>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-line bg-ink px-3 py-2 font-mono text-[11px] leading-6">
        {CALLS.map((call, index) => (
          <div key={call.fn} className={index === step ? "text-sky-200" : "text-dim/60"}>
            {index === step ? "▸ " : "  "}
            {call.fn}
          </div>
        ))}
      </div>

      <p className="mt-2 min-h-[2.5rem] text-[12px] leading-5 text-body/80">{CALLS[step].text}</p>

      <Controls>
        <NetBtn onClick={() => setStep((value) => Math.min(CALLS.length - 1, value + 1))} active>
          susunod →
        </NetBtn>
        <NetBtn
          active={auto}
          onClick={() => {
            if (auto) {
              setAuto(false);
            } else {
              if (step >= CALLS.length - 1) setStep(0);
              setAuto(true);
            }
          }}
        >
          {auto ? "tigil" : "auto-play"}
        </NetBtn>
        <NetBtn onClick={() => setStep(0)}>ulit</NetBtn>
      </Controls>
    </div>
  );
}
