import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  Award, BookOpen, BriefcaseBusiness, ChevronRight,
  Folder, Globe2, Mail, Minus, Power, Recycle,
  Send, Settings, ShieldCheck, Terminal as TerminalIcon, UserRound, X, Maximize2,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

type WindowId = 'about' | 'projects' | 'skills' | 'achievements' | 'browser' | 'guestbook' | 'terminal' | 'contact' | 'recycle';
type WinState = { id: WindowId; title: string; icon: ReactNode; x: number; y: number; w: number; h: number; minimized: boolean; maximized: boolean; z: number };
type GuestNote = { name: string; message: string; date: string };

const queryClient = new QueryClient();

const projectData = [
  { id: 'seer', title: 'SEER', kicker: 'AI / research', description: 'An intelligent system that turns complex data into clearer decisions. A study in practical machine learning and human-centered tooling.', tags: ['Python', 'Machine Learning', 'Research'], link: 'https://github.com/' },
  { id: 'gharsa', title: 'GHARSA', kicker: 'community / web', description: 'A platform concept for growing ideas from the ground up — connecting people, resources, and the momentum to make useful things real.', tags: ['Web Development', 'Product Thinking'], link: 'https://github.com/' },
  { id: 'os', title: 'Operating System Development', kicker: 'systems / low-level', description: 'Exploring the machinery beneath the interface: bootstrapping, memory, processes, and the exacting discipline of systems work.', tags: ['C', 'Assembly', 'Systems'], link: 'https://github.com/' },
  { id: 'lfs', title: 'Linux From Scratch', kicker: 'systems / learning', description: 'Built a Linux system component by component to understand what every layer is responsible for — and why it belongs there.', tags: ['Linux', 'Bash', 'Toolchains'], link: 'https://www.linuxfromscratch.org/' },
  { id: 'mentora', title: 'Mentora', kicker: 'education / concept', description: 'A mentorship experience designed around focused progress, useful feedback, and the people who make learning stick.', tags: ['UX', 'React', 'Education'], link: 'https://github.com/' },
];

const skills = ['Python', 'C / C++', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML / CSS', 'SQL', 'Git', 'Linux', 'Bash', 'Machine Learning', 'Problem Solving', 'Teamwork'];

const appMeta: Record<WindowId, { title: string; icon: ReactNode }> = {
  about: { title: 'About Ahmad — README.txt', icon: <UserRound /> },
  projects: { title: 'My Projects', icon: <BriefcaseBusiness /> },
  skills: { title: 'Control Panel — Skills', icon: <Settings /> },
  achievements: { title: 'Achievements.log', icon: <Award /> },
  browser: { title: 'Internet Explorer', icon: <Globe2 /> },
  guestbook: { title: 'SAMEN-PC Guestbook', icon: <BookOpen /> },
  terminal: { title: 'Command Prompt', icon: <TerminalIcon /> },
  contact: { title: 'New Message — Contact Ahmad', icon: <Mail /> },
  recycle: { title: 'Recycle Bin', icon: <Recycle /> },
};

const initialWindows: WinState[] = [];

function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [line, setLine] = useState(0);
  const bootLines = [
    'Award Modular BIOS v4.51PG, An Energy Star Ally',
    'Copyright (C) 2024, SAMEN-PC Industries',
    '',
    'CPU: Intel-compatible processor ............ OK',
    'Memory Test: 16384K OK',
    'Detecting Primary Master: SAMEN-SSD ........ OK',
    'Loading personal portfolio kernel .......... OK',
  ];
  useEffect(() => {
    const timer = window.setInterval(() => setLine((current) => Math.min(current + 1, bootLines.length)), 420);
    const done = window.setTimeout(onComplete, 4200);
    return () => { window.clearInterval(timer); window.clearTimeout(done); };
  }, []);
  return (
    <main className="boot-shell">
      <section className="bios" aria-label="SAMEN-PC boot sequence">
        <div className="bios-top"><span>AMIBIOS SYSTEM CONFIGURATION</span><span>08/24/24</span></div>
        <div className="boot-brand">SAMEN-PC</div>
        {bootLines.slice(0, line).map((item, index) => <div className={item ? 'bios-line' : 'bios-line dim'} key={`${item}-${index}`}>{item || ' '}</div>)}
        <div className="boot-progress"><i /></div>
        <div className="boot-prompt">Starting personal environment... <button data-testid="button-skip-boot" onClick={onComplete} style={{ color: '#f4c95d', background: 'none', border: 0, padding: 0 }}>skip boot</button></div>
      </section>
    </main>
  );
}

function DesktopIcon({ label, icon, onOpen, testId }: { label: string; icon: ReactNode; onOpen: () => void; testId: string }) {
  const clickTimer = useRef<number | null>(null);
  const handleClick = () => {
    if (clickTimer.current) { window.clearTimeout(clickTimer.current); clickTimer.current = null; onOpen(); return; }
    clickTimer.current = window.setTimeout(() => { clickTimer.current = null; }, 280);
  };
  return <button className="desktop-icon" data-testid={testId} onClick={handleClick} onDoubleClick={onOpen} title={`Open ${label}`}>
    <span className="icon-tile">{icon}</span><span>{label}</span>
  </button>;
}

function WindowFrame({ win, onFocus, onClose, onMinimize, onMaximize, onDrag, children }: {
  win: WinState; onFocus: () => void; onClose: () => void; onMinimize: () => void; onMaximize: () => void;
  onDrag: (event: ReactPointerEvent<HTMLDivElement>) => void; children: ReactNode;
}) {
  return <section className={`desktop-window ${win.minimized ? 'minimized' : ''} ${win.maximized ? 'maximized' : ''}`}
    style={win.maximized ? { zIndex: win.z } : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
    onPointerDown={onFocus} data-testid={`window-${win.id}`}>
    <header className="window-titlebar" onPointerDown={onDrag}>
      <span className="window-mark">{win.id === 'terminal' ? '>_' : 'S'}</span><span className="window-title">{win.title}</span>
      <div className="window-controls">
        <button data-testid={`button-minimize-${win.id}`} onPointerDown={(event) => event.stopPropagation()} onClick={onMinimize} aria-label={`Minimize ${win.title}`}><Minus size={13} /></button>
        <button data-testid={`button-maximize-${win.id}`} onPointerDown={(event) => event.stopPropagation()} onClick={onMaximize} aria-label={`Maximize ${win.title}`}><Maximize2 size={12} /></button>
        <button className="close" data-testid={`button-close-${win.id}`} onPointerDown={(event) => event.stopPropagation()} onClick={onClose} aria-label={`Close ${win.title}`}><X size={13} /></button>
      </div>
    </header>
    <div className="window-body">{children}</div>
  </section>;
}

function AboutWindow({ open }: { open: (id: WindowId) => void }) {
  return <div>
    <div className="eyebrow">C:\USERS\AHMAD\ABOUT</div>
    <h1 className="display-heading">Ahmad Omar<br />Abu Elsamen.</h1>
    <div className="about-grid">
      <div>
        <p className="body-copy">Computer Science student and software developer based in Amman, Jordan. I like understanding how things work, then making them useful — from the operating system up to the interface someone touches.</p>
        <p className="body-copy">This machine is a small tour through the work, tools, and questions I keep returning to. It is intentionally old-fashioned. The engineering is not.</p>
        <hr className="rule" />
        <button className="dialog-button" data-testid="button-open-projects-about" onClick={() => open('projects')}>Browse project files <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></button>
      </div>
      <div className="spec-list">
        <div><b>LOCATION</b><br />Amman, Jordan</div>
        <div><b>ROLE</b><br />CS student / developer</div>
        <div><b>STATUS</b><br />Open to good problems</div>
        <div><b>UPTIME</b><br />Curiosity: continuous</div>
      </div>
    </div>
  </div>;
}

function ProjectsWindow() {
  return <div><div className="eyebrow">C:\PROJECTS / 05 ITEMS</div><h2 className="display-heading">Work in<br />progress.</h2>
    <div className="project-list">{projectData.map((project) => <article className="project-row" key={project.id} data-testid={`card-project-${project.id}`}>
      <header><h3>{project.title}</h3><span className="eyebrow">{project.kicker}</span></header><p>{project.description}</p>
      <div className="tag-row">{project.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      <a href={project.link} target="_blank" rel="noreferrer" data-testid={`link-project-${project.id}`}>view repository <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></a>
    </article>)}</div>
  </div>;
}

function SkillsWindow({ open }: { open: (id: WindowId) => void }) {
  return <div><div className="eyebrow">CONTROL PANEL / DEVELOPER PROFILE</div><h2 className="display-heading">The toolkit.</h2>
    <p className="body-copy">A practical mix of low-level curiosity and product-minded web development. I reach for the simplest tool that lets the idea hold up.</p>
    <hr className="rule" /><div className="skill-cloud">{skills.map((skill) => <span className="skill" key={skill} data-testid={`skill-${skill.replace(/[^a-z]/gi, '-').toLowerCase()}`}>{skill}</span>)}</div>
    <hr className="rule" /><div className="status-note">Tip: open Command Prompt and type <b>skills</b> for the terminal version of this list.</div>
    <button className="dialog-button" data-testid="button-open-terminal-skills" onClick={() => open('terminal')}>Open Command Prompt <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></button>
  </div>;
}

function AchievementsWindow() {
  const rows = [
    ['2024', 'Computer Science studies', 'Building a strong foundation across algorithms, systems, software design, and the mathematics underneath them.'],
    ['2024', 'Linux From Scratch', 'A deliberate build-from-zero exercise in toolchains, dependencies, and the architecture of a working Linux environment.'],
    ['2023', 'Systems exploration', 'Operating system development work that made the invisible parts of computing feel concrete.'],
    ['Always', 'Learning in public', 'Projects, experiments, and notes that turn questions into working software.'],
  ];
  return <div><div className="eyebrow">ACHIEVEMENTS.LOG / VERIFIED</div><h2 className="display-heading">Milestones.</h2>{rows.map(([year, title, copy]) => <article className="achievement" key={title}><span className="ach-year">{year}</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div>;
}

function BrowserWindow({ open }: { open: (id: WindowId) => void }) {
  const [address, setAddress] = useState('https://samen-pc.local/home');
  const [visited, setVisited] = useState(false);
  const go = (event: FormEvent) => { event.preventDefault(); setVisited(true); };
  return <div className="ie-chrome"><form className="ie-toolbar" onSubmit={go}><button type="button" data-testid="button-browser-back" onClick={() => setVisited(false)}>Back</button><button type="button" data-testid="button-browser-refresh" onClick={() => setVisited(false)}>Refresh</button><input className="ie-address" value={address} onChange={(event) => setAddress(event.target.value)} aria-label="Internet address" data-testid="input-browser-address" /><button type="submit" data-testid="button-browser-go">Go</button></form>
    <div className="ie-page">{visited ? <><div className="eyebrow" style={{ color: '#a44a36' }}>INTRANET RESPONSE 200</div><h2>There is no cloud.<br />Only other computers.</h2><p>This tiny browser is a deliberate relic. The useful link is the one that takes you somewhere: reach Ahmad through the contact panel.</p><button className="ie-link" data-testid="button-browser-contact" onClick={() => open('contact')}>open contact window</button></> : <><div className="eyebrow" style={{ color: '#a44a36' }}>WELCOME TO THE INTERNET</div><h2>Welcome to<br />Ahmad's web.</h2><p>Best viewed with curiosity, a keyboard, and a tolerance for 800x600 interfaces.</p><button className="ie-link" data-testid="button-browser-explore" onClick={() => setAddress('https://samen-pc.local/curious')}>click here to explore</button></>}</div>
  </div>;
}

function GuestbookWindow() {
  const [notes, setNotes] = useState<GuestNote[]>(() => { try { return JSON.parse(localStorage.getItem('samen-pc-guestbook') || '[]'); } catch { return []; } });
  const [name, setName] = useState(''); const [message, setMessage] = useState(''); const [notice, setNotice] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim() || !message.trim()) { setNotice('Please fill in both fields.'); return; } const next = [{ name: name.trim(), message: message.trim(), date: new Date().toLocaleDateString('en-GB') }, ...notes].slice(0, 12); setNotes(next); localStorage.setItem('samen-pc-guestbook', JSON.stringify(next)); setName(''); setMessage(''); setNotice('Entry saved to local storage.'); };
  return <div><div className="eyebrow">GUESTBOOK.DAT / LOCAL ONLY</div><h2 className="display-heading">Leave a note.</h2><p className="body-copy">Say hello. This book stays in your browser — no server, no account, no quiet data collection.</p>
    <form className="contact-form" onSubmit={submit}><label className="field-label">Your name<input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-guestbook-name" maxLength={40} /></label><label className="field-label">Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} data-testid="input-guestbook-message" rows={3} maxLength={180} /></label><button className="submit-button" type="submit" data-testid="button-submit-guestbook"><Send size={13} style={{ verticalAlign: 'middle' }} /> sign guestbook</button></form>
    {notice && <p className="status-note" data-testid="status-guestbook">{notice}</p>}<div className="guest-list">{notes.length ? notes.map((note, index) => <article className="guest-note" key={`${note.date}-${index}`} data-testid={`guest-note-${index}`}><b>{note.name}</b><time>{note.date}</time><p>{note.message}</p></article>) : <p className="body-copy">No entries yet. Make the first mark.</p>}</div>
  </div>;
}

function TerminalWindow({ open }: { open: (id: WindowId) => void }) {
  const [history, setHistory] = useState<string[]>(['SAMEN Command Prompt [Version 1.0.24]', '(c) Ahmad Omar Abu Elsamen. All rights reserved.', '', 'Type "help" for a list of available commands.']);
  const [command, setCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const run = (event: FormEvent) => { event.preventDefault(); const value = command.trim().toLowerCase(); if (!value) return; let result = '';
    if (value === 'help') result = 'help       show this list\\nwhoami     display the operator\\nprojects   list project directories\\nskills     list the toolkit\\ncontact    open a way to say hello\\nclear      clear terminal\\nsecret     ...';
    else if (value === 'whoami') result = 'AHMAD OMAR ABU ELSAMEN\\nComputer Science student / software developer\\nAmman, Jordan';
    else if (value === 'projects') result = projectData.map((project) => `  ${project.title}`).join('\\n');
    else if (value === 'skills') result = skills.join('  ·  ');
    else if (value === 'contact') { open('contact'); result = 'Opening contact window...'; }
    else if (value === 'secret') result = 'You found the quiet room. Try typing "sudo rm -rf /" (it is harmless here).';
    else if (value === 'sudo rm -rf /') result = 'Nice try. SAMEN-PC protected the important files.\\nNo portfolios were harmed.';
    else if (value === 'clear') { setHistory([]); setCommand(''); return; }
    else result = `command not found: ${value}\\nType "help" to see what SAMEN-PC understands.`;
    setHistory((current) => [...current, `C:\\\\USERS\\\\AHMAD> ${command}`, result]); setCommand(''); };
  return <div className="terminal" onClick={() => inputRef.current?.focus()}><div className="terminal-output">{history.join('\\n')}</div><form className="terminal-form" onSubmit={run}><span>C:\USERS\AHMAD&gt;</span><input ref={inputRef} value={command} onChange={(event) => setCommand(event.target.value)} data-testid="input-terminal-command" autoComplete="off" aria-label="Terminal command" /></form></div>;
}

function ContactWindow() {
  const [sent, setSent] = useState(false); const [form, setForm] = useState({ name: '', email: '', message: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); setSent(true); };
  return <div><div className="eyebrow">MAIL.EXE / OUTBOUND MESSAGE</div><h2 className="display-heading">Let's talk.</h2>{sent ? <div className="status-note" data-testid="status-contact">Message staged successfully. Ahmad will receive your note when this portfolio grows a backend.</div> : <form className="contact-form" onSubmit={submit}><label className="field-label">Your name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-contact-name" /></label><label className="field-label">Your email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-contact-email" /></label><label className="field-label">Message<textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="input-contact-message" /></label><button className="submit-button" type="submit" data-testid="button-submit-contact"><Send size={13} style={{ verticalAlign: 'middle' }} /> stage message</button></form>}<hr className="rule" /><p className="body-copy">Prefer a direct route? <a href="mailto:ahmad.omar.elsamen@gmail.com" style={{ color: '#f4c95d' }} data-testid="link-email">ahmad.omar.elsamen@gmail.com</a></p><p className="body-copy"><a href="https://github.com/" target="_blank" rel="noreferrer" style={{ color: '#f4c95d', marginRight: 18 }} data-testid="link-github">GitHub</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" style={{ color: '#f4c95d' }} data-testid="link-linkedin">LinkedIn</a></p></div>;
}

function RecycleWindow() {
  const [restored, setRestored] = useState(false);
  return <div className="recycle"><Recycle className="recycle-icon" size={48} strokeWidth={1.2} /><h2>{restored ? 'Nothing to restore.' : 'Recycle Bin is empty.'}</h2><p>{restored ? 'The deleted tabs were only interface clutter. SAMEN-PC is tidy again.' : 'There are no discarded projects here. Ahmad keeps the useful mistakes.'}</p><button className="dialog-button" data-testid="button-recycle-action" onClick={() => setRestored(true)}>{restored ? 'close the story' : 'try to restore something'}</button></div>;
}

function WindowContent({ id, open }: { id: WindowId; open: (id: WindowId) => void }) {
  if (id === 'about') return <AboutWindow open={open} />; if (id === 'projects') return <ProjectsWindow />; if (id === 'skills') return <SkillsWindow open={open} />; if (id === 'achievements') return <AchievementsWindow />; if (id === 'browser') return <BrowserWindow open={open} />; if (id === 'guestbook') return <GuestbookWindow />; if (id === 'terminal') return <TerminalWindow open={open} />; if (id === 'contact') return <ContactWindow />; return <RecycleWindow />;
}

function Desktop() {
  const [windows, setWindows] = useState<WinState[]>(initialWindows);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [drag, setDrag] = useState<{ id: WindowId; dx: number; dy: number } | null>(null);
  const zRef = useRef(2);
  const firstWindowOpened = useRef(false);
  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const move = (event: PointerEvent) => { if (!drag) return; setWindows((current) => current.map((win) => win.id === drag.id && !win.maximized ? { ...win, x: Math.max(6, event.clientX - drag.dx), y: Math.max(6, event.clientY - drag.dy) } : win)); };
    const up = () => setDrag(null); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag]);
  const open = (id: WindowId) => { zRef.current += 1; setWindows((current) => { const existing = current.find((win) => win.id === id); if (existing) return current.map((win) => win.id === id ? { ...win, minimized: false, z: zRef.current } : win); const meta = appMeta[id]; return [...current, { id, ...meta, x: 150 + current.length * 28, y: 45 + current.length * 22, w: id === 'terminal' ? 530 : 610, h: id === 'projects' ? 550 : 475, minimized: false, maximized: false, z: zRef.current }]; }); setStartOpen(false); };
  useEffect(() => { if (!firstWindowOpened.current) { firstWindowOpened.current = true; open('about'); } }, []);
  const focus = (id: WindowId) => { zRef.current += 1; setWindows((current) => current.map((win) => win.id === id ? { ...win, z: zRef.current } : win)); };
  const close = (id: WindowId) => setWindows((current) => current.filter((win) => win.id !== id));
  const update = (id: WindowId, patch: Partial<WinState>) => setWindows((current) => current.map((win) => win.id === id ? { ...win, ...patch } : win));
  const startDrag = (id: WindowId, event: ReactPointerEvent<HTMLDivElement>) => { const target = event.currentTarget.parentElement?.parentElement; const win = windows.find((item) => item.id === id); if (!target || !win || win.maximized) return; setDrag({ id, dx: event.clientX - win.x, dy: event.clientY - win.y }); focus(id); };
  const icons = useMemo(() => [{ label: 'About Ahmad', id: 'about' as WindowId, icon: <UserRound /> }, { label: 'My Projects', id: 'projects' as WindowId, icon: <Folder /> }, { label: 'Command Prompt', id: 'terminal' as WindowId, icon: <TerminalIcon /> }, { label: 'Guestbook', id: 'guestbook' as WindowId, icon: <BookOpen /> }, { label: 'Recycle Bin', id: 'recycle' as WindowId, icon: <Recycle /> }], []);
  const menuApps = [{ id: 'about' as WindowId, title: 'About Ahmad', icon: <UserRound /> }, { id: 'projects' as WindowId, title: 'My Projects', icon: <BriefcaseBusiness /> }, { id: 'skills' as WindowId, title: 'Skills & Toolkit', icon: <Settings /> }, { id: 'achievements' as WindowId, title: 'Achievements', icon: <Award /> }, { id: 'browser' as WindowId, title: 'Internet Explorer', icon: <Globe2 /> }, { id: 'contact' as WindowId, title: 'Contact Ahmad', icon: <Mail /> }];
  return <main className="desktop-shell">
    <div className="desktop-wallpaper" onClick={() => setStartOpen(false)} />
    <div className="desktop-icons">{icons.map((item) => <DesktopIcon key={item.id} label={item.label} icon={item.icon} onOpen={() => open(item.id)} testId={`desktop-icon-${item.id}`} />)}</div>
    {windows.map((win) => <WindowFrame key={win.id} win={win} onFocus={() => focus(win.id)} onClose={() => close(win.id)} onMinimize={() => update(win.id, { minimized: true })} onMaximize={() => update(win.id, { maximized: !win.maximized })} onDrag={(event) => startDrag(win.id, event)}><WindowContent id={win.id} open={open} /></WindowFrame>)}
    {startOpen && <aside className="start-menu" data-testid="start-menu"><div className="start-banner"><span className="start-avatar">AO</span><div><strong>AHMAD OMAR</strong><small>Abu Elsamen · Amman, JO</small></div></div><div className="start-grid">{menuApps.map((item) => <button className="start-item" key={item.id} onClick={() => open(item.id)} data-testid={`start-item-${item.id}`}>{item.icon}<span>{item.title}</span></button>)}</div><div className="start-footer"><button className="shutdown" onClick={() => window.location.reload()} data-testid="button-restart">Restart SAMEN-PC <Power size={13} style={{ verticalAlign: 'middle' }} /></button></div></aside>}
    <footer className="taskbar"><button className={`start-button ${startOpen ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); setStartOpen((current) => !current); }} data-testid="button-start"><span className="start-mark">S</span><span>start</span></button><div className="task-items">{windows.map((win) => <button className={`task-item ${!win.minimized ? 'active' : ''}`} key={win.id} onClick={() => { if (win.minimized) update(win.id, { minimized: false }); focus(win.id); }} data-testid={`task-${win.id}`}><span>{win.title}</span></button>)}</div><time className="task-clock" data-testid="text-clock">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></footer>
  </main>;
}

function Home() {
  const [booted, setBooted] = useState(false);
  return booted ? <Desktop /> : <BootScreen onComplete={() => setBooted(true)} />;
}

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;