import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import blissWallpaper from '@assets/bliss-xp.jpg';
import {
  Award, BookOpen, BriefcaseBusiness, ChevronRight, ImagePlus, LockKeyhole, Pencil, Plus, Trash2,
  FileText, Folder, Globe2, Mail, Minus, Power, Recycle,
  Send, Settings, ShieldCheck, Terminal as TerminalIcon, UserRound, X, Maximize2,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

type BuiltInWindowId = 'files' | 'about' | 'projects' | 'skills' | 'achievements' | 'browser' | 'guestbook' | 'terminal' | 'contact' | 'recycle' | 'admin';
type WindowId = BuiltInWindowId | `custom-${string}`;
type WinState = { id: WindowId; title: string; icon: ReactNode; x: number; y: number; w: number; h: number; minimized: boolean; maximized: boolean; z: number };
type GuestNote = { name: string; message: string; date: string };
type Project = { id: string; title: string; kicker: string; description: string; tags: string[]; link: string; image?: string; retroButtonEnabled?: boolean; retroButtonLabel?: string; retroButtonLink?: string };
type Achievement = { id: string; year: string; title: string; description: string; image?: string; button?: ContentButton };
type GalleryImage = { id: string; title: string; src: string };
type ContentApp = Exclude<WindowId, 'admin'>;
type ContentButton = { label: string; link: string };
type CurriculumVitae = { name: string; src: string };
type CustomSection = { id: string; app: ContentApp; title: string; description: string; image?: string; button?: ContentButton };
type AboutContent = { title: string; intro: string; details: { location: string; role: string; status: string; uptime: string }; button?: ContentButton };
type CustomApp = { id: string; title: string; description: string; image?: string; icon?: string; button?: ContentButton };
type PortfolioContent = { projects: Project[]; achievements: Achievement[]; gallery: GalleryImage[]; aboutImage?: string; cv?: CurriculumVitae; about: AboutContent; sections: CustomSection[]; apps: CustomApp[]; appIcons: Record<string, string>; skillIcons: Record<string, string> };

const queryClient = new QueryClient();

const defaultContent: PortfolioContent = {
  projects: [
  { id: 'seer', title: 'SEER', kicker: 'AI / research', description: 'An intelligent system that turns complex data into clearer decisions. A study in practical machine learning and human-centered tooling.', tags: ['Python', 'Machine Learning', 'Research'], link: 'https://github.com/Samenx' },
  { id: 'gharsa', title: 'GHARSA', kicker: 'community / web', description: 'A platform concept for growing ideas from the ground up — connecting people, resources, and the momentum to make useful things real.', tags: ['Web Development', 'Product Thinking'], link: 'https://github.com/Samenx' },
  { id: 'os', title: 'Operating System Development', kicker: 'systems / low-level', description: 'Exploring the machinery beneath the interface: bootstrapping, memory, processes, and the exacting discipline of systems work.', tags: ['C', 'Assembly', 'Systems'], link: 'https://github.com/Samenx' },
  { id: 'lfs', title: 'Linux From Scratch', kicker: 'systems / learning', description: 'Built a Linux system component by component to understand what every layer is responsible for — and why it belongs there.', tags: ['Linux', 'Bash', 'Toolchains'], link: 'https://www.linuxfromscratch.org/' },
  { id: 'mentora', title: 'Mentora', kicker: 'education / concept', description: 'A mentorship experience designed around focused progress, useful feedback, and the people who make learning stick.', tags: ['UX', 'React', 'Education'], link: 'https://github.com/Samenx' },
  ],
  achievements: [
    { id: 'blue-horizons', year: '2026', title: '3rd Place — HTU Blue Horizons Hackathon', description: 'Led the development of SEER, a marine fishing support system combining environmental sensor data, GPS, and software analytics to help fishermen identify potential fishing areas and reduce wasted time and resources. The project qualified for the Blue Horizons Exhibition in Aqaba.' },
    { id: 'ecommerce', year: '2026', title: '2nd Place — E-Commerce Website Competition', description: 'GHARSA — Plant E-Commerce Platform: Developed a plant e-commerce website designed for the Jordanian market. Customers can browse and purchase plants while viewing suitable temperature and humidity conditions, combining online shopping with practical plant-care guidance.' },
    { id: 'jcpc', year: '2024', title: 'JCPC — Jordan Collegiate Programming Contest', description: 'Participated as part of a team in a competitive programming environment focused on algorithmic problem solving.' },
    { id: 'problems', year: '200+', title: 'Competitive Programming', description: 'Solved more than 200 problems across competitive programming platforms. Highest Codeforces rating: 1009.' },
  ],
  gallery: [],
  aboutImage: '',
  about: { title: 'Ahmad Omar\nAbu Elsamen.', intro: 'Computer Science student and software developer based in Amman, Jordan. I like understanding how things work, then making them useful — from the operating system up to the interface someone touches.\n\nThis machine is a small tour through the work, tools, and questions I keep returning to. It is intentionally old-fashioned. The engineering is not.', details: { location: 'Amman, Jordan', role: 'CS student / developer', status: 'Open to good problems', uptime: 'Curiosity: continuous' } },
  sections: [],
  apps: [],
  appIcons: {},
  skillIcons: {},
};

function usePortfolioContent() {
  const normalise = (value: Partial<PortfolioContent>) => ({ ...defaultContent, ...value, about: { ...defaultContent.about, ...value.about, details: { ...defaultContent.about.details, ...value.about?.details } }, sections: Array.isArray(value.sections) ? value.sections : [], apps: Array.isArray(value.apps) ? value.apps : [], appIcons: value.appIcons && typeof value.appIcons === 'object' ? value.appIcons : {}, skillIcons: value.skillIcons && typeof value.skillIcons === 'object' ? value.skillIcons : {} });
  const storageKey = 'samen-pc-portfolio-content';
  const readLocal = (): { content: PortfolioContent; updatedAt: string } | null => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as { content?: Partial<PortfolioContent>; updatedAt?: string };
      return parsed.content && parsed.updatedAt ? { content: normalise(parsed.content), updatedAt: parsed.updatedAt } : null;
    } catch {
      return null;
    }
  };
  const persistLocal = (next: PortfolioContent, updatedAt = new Date().toISOString()) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ content: next, updatedAt }));
    } catch {
      // The API remains the permanent source of truth if local storage is unavailable.
    }
  };
  const [content, setContent] = useState<PortfolioContent>(() => readLocal()?.content || defaultContent);
  useEffect(() => {
    void fetch('/api/portfolio').then(async (response) => {
      if (!response.ok) return;
      const saved = await response.json() as { content?: Partial<PortfolioContent>; updatedAt?: string | null };
      const local = readLocal();
      if (saved.content && (!local || !saved.updatedAt || saved.updatedAt >= local.updatedAt)) {
        const next = normalise(saved.content);
        setContent(next);
        persistLocal(next, saved.updatedAt || new Date().toISOString());
      }
    }).catch(() => { /* Local storage keeps permanent edits available when the API is offline. */ });
  }, []);
  const save = (next: PortfolioContent) => {
    // Update every open portfolio view immediately, then make the edit durable.
    setContent(next);
    persistLocal(next);
    // Save immediately: a delayed request can be lost if the user closes the
    // admin or opens the portfolio in another browser right after clicking Save.
    void fetch('/api/portfolio', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: next }),
    }).then(async (response) => {
      if (!response.ok) throw new Error('Unable to save portfolio content.');
      const saved = await response.json() as { updatedAt?: string };
      persistLocal(next, saved.updatedAt);
    }).catch(() => { /* The locally saved version will be used until the API is available. */ });
  };
  return [content, save] as const;
}

const skills = ['Python', 'C / C++', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML / CSS', 'SQL', 'Git', 'Linux', 'Bash', 'Machine Learning', 'Problem Solving', 'Teamwork'];

const appMeta: Record<BuiltInWindowId, { title: string; icon: ReactNode }> = {
  files: { title: 'File Manager — SAMEN-PC', icon: <Folder /> },
  about: { title: 'About Ahmad — README.txt', icon: <UserRound /> },
  projects: { title: 'My Projects', icon: <BriefcaseBusiness /> },
  skills: { title: 'Skills', icon: <Settings /> },
  achievements: { title: 'Achievements.log', icon: <Award /> },
  browser: { title: 'Internet Explorer', icon: <Globe2 /> },
  guestbook: { title: 'SAMEN-PC Guestbook', icon: <BookOpen /> },
  terminal: { title: 'Command Prompt', icon: <TerminalIcon /> },
  contact: { title: 'New Message — Contact Ahmad', icon: <Mail /> },
  recycle: { title: 'Recycle Bin', icon: <Recycle /> },
  admin: { title: 'SAMEN-PC Content Admin', icon: <LockKeyhole /> },
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

function DesktopIcon({ label, icon, onOpen, testId, className = '' }: { label: string; icon: ReactNode; onOpen: () => void; testId: string; className?: string }) {
  const clickTimer = useRef<number | null>(null);
  const handleClick = () => {
    if (clickTimer.current) { window.clearTimeout(clickTimer.current); clickTimer.current = null; onOpen(); return; }
    clickTimer.current = window.setTimeout(() => { clickTimer.current = null; }, 280);
  };
  return <button className={`desktop-icon ${className}`} data-testid={testId} onClick={handleClick} onDoubleClick={onOpen} title={`Open ${label}`}>
    <span className="icon-tile">{icon}</span><span>{label}</span>
  </button>;
}

function WindowFrame({ win, onFocus, onClose, onMinimize, onMaximize, onDrag, navigation, children }: {
  win: WinState; onFocus: () => void; onClose: () => void; onMinimize: () => void; onMaximize: () => void;
  onDrag: (event: ReactPointerEvent<HTMLDivElement>) => void; navigation?: ReactNode; children: ReactNode;
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
    {win.id !== 'files' && win.id !== 'skills' && <div className="window-explorer-bar"><b>Address</b><span>C:\SAMEN-PC\{win.id.toUpperCase()}</span></div>}
    <div className={win.id === 'files' || win.id === 'skills' ? 'file-manager-workspace' : 'window-workspace'}>{navigation}<div className="window-body">{children}</div></div>
  </section>;
}

function AppNavigation({ apps, onNavigate }: { apps: Array<{ id: WindowId; title: string; icon: ReactNode }>; onNavigate: (id: WindowId) => void }) {
  return <aside className="app-navigation" aria-label="Applications">
    <div className="app-navigation-heading"><Folder size={16} /><span>My Applications</span></div>
    <p>Open an application</p>
    <nav>{apps.map((app) => <button key={app.id} onPointerDown={(event) => event.stopPropagation()} onClick={() => onNavigate(app.id)}>
      <i>{app.icon}</i><span>{app.title}</span>
    </button>)}</nav>
  </aside>;
}

function CustomSections({ sections }: { sections: CustomSection[] }) {
  if (!sections.length) return null;
  return <div className="custom-sections">{sections.map((section) => <section className="custom-section" key={section.id}>
    {section.image && <img src={section.image} alt="" />}
    <div><h3>{section.title}</h3><p>{section.description}</p>{section.button?.label && section.button.link && <a className="content-button" href={section.button.link} target="_blank" rel="noreferrer">{section.button.label} <ChevronRight size={12} /></a>}</div>
  </section>)}</div>;
}

function CustomAppWindow({ app, sections }: { app: CustomApp; sections: CustomSection[] }) {
  return <div><div className="eyebrow">CUSTOM APP / {app.title.toUpperCase()}</div><h2 className="display-heading">{app.title}</h2>
    {app.image && <img className="custom-app-image" src={app.image} alt="" />}<p className="body-copy custom-app-copy">{app.description}</p>
    {app.button?.label && app.button.link && <a className="content-button" href={app.button.link} target="_blank" rel="noreferrer">{app.button.label} <ChevronRight size={12} /></a>}<CustomSections sections={sections} />
  </div>;
}

function FileManagerWindow({ open, apps, appIcons }: { open: (id: WindowId) => void; apps: CustomApp[]; appIcons: Record<string, string> }) {
  type Folder = 'computer' | 'apps' | 'documents';
  type Entry = { id: string; name: string; type: 'folder' | 'app' | 'file'; size: string; date: string; target?: WindowId; folder?: Folder; icon?: ReactNode };
  const paths: Record<Folder, string> = { computer: 'C:\\', apps: 'C:\\Documents and Settings\\Ahmad\\My Applications', documents: 'C:\\Documents and Settings\\Ahmad\\My Documents' };
  const [folder, setFolder] = useState<Folder>('apps'); const [history, setHistory] = useState<Folder[]>(['apps']); const [historyIndex, setHistoryIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); const [view, setView] = useState<'icons' | 'details'>('icons'); const [address, setAddress] = useState(paths.apps); const [userFolders, setUserFolders] = useState<Entry[]>([]); const [context, setContext] = useState<{ entry: Entry; x: number; y: number } | null>(null); const [notice, setNotice] = useState('12 objects');
  const navigate = (next: Folder) => { const nextHistory = [...history.slice(0, historyIndex + 1), next]; setHistory(nextHistory); setHistoryIndex(nextHistory.length - 1); setFolder(next); setAddress(paths[next]); setSelected(null); setContext(null); setNotice(`${next === 'apps' ? 6 + apps.length : next === 'computer' ? 3 : userFolders.length + 2} objects`); };
  const icon = (id: string, fallback: ReactNode) => appIcons[id] ? <img src={appIcons[id]} alt="" /> : fallback;
  const appEntries: Entry[] = [{ id: 'about', name: 'About Me', type: 'app', size: '4 KB', date: 'Today', target: 'about', icon: icon('about', <UserRound />) }, { id: 'projects', name: 'Projects', type: 'app', size: '8 KB', date: 'Today', target: 'projects', icon: icon('projects', <BriefcaseBusiness />) }, { id: 'achievements', name: 'Achievements', type: 'app', size: '5 KB', date: 'Today', target: 'achievements', icon: icon('achievements', <Award />) }, { id: 'skills', name: 'Skills', type: 'app', size: '3 KB', date: 'Today', target: 'skills', icon: icon('skills', <Settings />) }, { id: 'contact', name: 'Contact', type: 'app', size: '2 KB', date: 'Today', target: 'contact', icon: icon('contact', <Mail />) }, { id: 'terminal', name: 'Command Prompt', type: 'app', size: '1 KB', date: 'Today', target: 'terminal', icon: icon('terminal', <TerminalIcon />) }, ...apps.map((app) => ({ id: `custom-${app.id}`, name: app.title, type: 'app' as const, size: 'Custom', date: 'Today', target: `custom-${app.id}` as WindowId, icon: icon(`custom-${app.id}`, app.icon ? <img src={app.icon} alt="" /> : <BriefcaseBusiness />) }))];
  const entries: Entry[] = folder === 'computer' ? [{ id: 'apps-folder', name: 'My Applications', type: 'folder', size: '', date: 'Today', folder: 'apps' }, { id: 'docs-folder', name: 'My Documents', type: 'folder', size: '', date: 'Today', folder: 'documents' }, { id: 'drive-c', name: 'Local Disk (C:)', type: 'folder', size: '40 GB', date: '' }] : folder === 'apps' ? appEntries : [...userFolders, { id: 'readme', name: 'README.txt', type: 'file', size: '1 KB', date: 'Today' }, { id: 'portfolio', name: 'portfolio-notes.txt', type: 'file', size: '2 KB', date: 'Today' }];
  const activate = (entry: Entry) => { if (entry.folder) navigate(entry.folder); else if (entry.target) open(entry.target); else setNotice(`${entry.name} is selected`); };
  const createFolder = () => { const name = window.prompt('Name for the new folder:', 'New Folder'); if (name?.trim()) { setUserFolders((items) => [...items, { id: crypto.randomUUID(), name: name.trim(), type: 'folder', size: '', date: 'Today' }]); setNotice(`Folder “${name.trim()}” created`); } };
  const rename = (entry: Entry) => { const name = window.prompt('Rename item:', entry.name); if (name?.trim() && folder === 'documents') setUserFolders((items) => items.map((item) => item.id === entry.id ? { ...item, name: name.trim() } : item)); setContext(null); };
  const addressGo = (event: FormEvent) => { event.preventDefault(); const value = address.toLowerCase(); navigate(value.includes('application') ? 'apps' : value.includes('document') ? 'documents' : 'computer'); };
  return <div className="xp-explorer" onClick={() => setContext(null)}><nav className="xp-menu"><span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span></nav><div className="xp-toolbar"><button onClick={() => historyIndex > 0 && navigate(history[historyIndex - 1])} disabled={historyIndex === 0}>← Back</button><button onClick={() => historyIndex < history.length - 1 && navigate(history[historyIndex + 1])} disabled={historyIndex === history.length - 1}>Forward →</button><button onClick={() => navigate('computer')}>↑ Up</button><i /><button onClick={() => setNotice('Search is ready — choose an item to inspect it.')}>⌕ Search</button><button onClick={() => setNotice('Folders pane is open.')}>Folders</button><select value={view} onChange={(event) => setView(event.target.value as 'icons' | 'details')}><option value="icons">Icons</option><option value="details">Details</option></select></div><form className="xp-address" onSubmit={addressGo}><b>Address</b><span>▣</span><input value={address} onChange={(event) => setAddress(event.target.value)} /><button type="submit">Go</button></form><div className="xp-main"><aside className="xp-tasks"><section><h3>File and Folder Tasks</h3><button onClick={createFolder}>Make a new folder</button><button onClick={() => setNotice('This folder is ready to publish.')}>Publish this folder to the Web</button><button onClick={() => setNotice('This folder can be shared.')}>Share this folder</button></section><section><h3>Other Places</h3><button onClick={() => navigate('computer')}>My Computer</button><button onClick={() => navigate('apps')}>My Applications</button><button onClick={() => navigate('documents')}>My Documents</button></section><section><h3>Details</h3><p>{selected ? entries.find((item) => item.id === selected)?.name : 'Select an item to see its details.'}</p></section></aside><main className={`xp-files ${view}`}>{view === 'details' && <div className="xp-columns"><button>Name</button><button>Size</button><button>Type</button><button>Date Modified</button></div>}{entries.map((entry) => <button className={`xp-entry ${selected === entry.id ? 'selected' : ''}`} key={entry.id} onClick={(event) => { event.stopPropagation(); setSelected(entry.id); setNotice(`1 object selected · ${entry.size || 'Folder'}`); }} onDoubleClick={() => activate(entry)} onContextMenu={(event) => { event.preventDefault(); setSelected(entry.id); setContext({ entry, x: event.clientX, y: event.clientY }); }}><i>{entry.type === 'folder' ? <Folder /> : entry.icon || <FileText />}</i><span>{entry.name}</span>{view === 'details' && <><small>{entry.size}</small><small>{entry.type === 'folder' ? 'File Folder' : entry.type === 'app' ? 'Application' : 'Text Document'}</small><small>{entry.date}</small></>}</button>)}</main></div>{context && <div className="xp-context" style={{ left: context.x, top: context.y }} onClick={(event) => event.stopPropagation()}><button onClick={() => activate(context.entry)}>Open</button><button onClick={() => setNotice(`${context.entry.name} copied to clipboard.`)}>Copy</button><button onClick={() => rename(context.entry)}>Rename</button><button onClick={() => setNotice(`${context.entry.name}: ${context.entry.type}, ${context.entry.size || 'Folder'}`)}>Properties</button></div>}<footer className="xp-status">{notice}</footer></div>;
}

function AboutWindow({ open, image, cv, about, sections }: { open: (id: WindowId) => void; image?: string; cv?: CurriculumVitae; about: AboutContent; sections: CustomSection[] }) {
  return <div>
    <div className="eyebrow">C:\USERS\AHMAD\ABOUT</div>
    <h1 className="display-heading">{about.title}</h1>
    <div className="about-grid">
      <div>
        <p className="body-copy about-intro">{about.intro}</p>
        <hr className="rule" />
        <div className="about-actions">{cv && <a className="content-button" href={cv.src} download={cv.name} data-testid="link-download-cv">Download CV <ChevronRight size={12} /></a>}{about.button?.label && about.button.link ? <a className="content-button" href={about.button.link} target="_blank" rel="noreferrer">{about.button.label} <ChevronRight size={12} /></a> : <button className="dialog-button" data-testid="button-open-projects-about" onClick={() => open('projects')}>Browse project files <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></button>}</div>
      </div>
      <div className="spec-list">
        {image && <img className="about-image" src={image} alt="Ahmad Omar Abu Elsamen" />}
        <div><b>LOCATION</b><br />{about.details.location}</div>
        <div><b>ROLE</b><br />{about.details.role}</div>
        <div><b>STATUS</b><br />{about.details.status}</div>
        <div><b>UPTIME</b><br />{about.details.uptime}</div>
      </div>
    </div><CustomSections sections={sections} />
  </div>;
}

function ProjectsWindow({ projects, sections }: { projects: Project[]; sections: CustomSection[] }) {
  return <div><div className="eyebrow">C:\PROJECTS / {String(projects.length).padStart(2, '0')} ITEMS</div><h2 className="display-heading">Work in<br />progress.</h2>
    <div className="project-list">{projects.map((project) => <article className="project-row" key={project.id} data-testid={`card-project-${project.id}`}>
      <div className="card-thumbnail">{project.image ? <img className="project-image" src={project.image} alt="" /> : <BriefcaseBusiness aria-hidden="true" />}</div>
      <header><div><h3>{project.title}</h3><span className="eyebrow">{project.kicker}</span></div><span className="card-file-mark">.PRJ</span></header><p>{project.description}</p>
      <div className="tag-row">{project.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      <div className="project-links"><a href={project.link} target="_blank" rel="noreferrer" data-testid={`link-project-${project.id}`}>view repository <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></a>
      {project.retroButtonEnabled && project.retroButtonLink && <a className="retro-button" href={project.retroButtonLink} target="_blank" rel="noreferrer" data-testid={`link-project-retro-${project.id}`}>{project.retroButtonLabel || 'retro link'} <ChevronRight size={12} /></a>}</div>
    </article>)}</div><CustomSections sections={sections} />
  </div>;
}

function SkillsWindow({ sections: _sections, icons }: { open: (id: WindowId) => void; sections: CustomSection[]; icons: Record<string, string> }) {
  const categories = [
    { id: 'programming', name: 'Programming', items: ['C', 'C++', 'Java', 'JavaScript', 'Python', 'SQL'] },
    { id: 'web-development', name: 'Web Development', items: ['HTML', 'CSS', 'React.js', 'Node.js', 'REST APIs', 'WordPress'] },
    { id: 'systems', name: 'Systems', items: ['Linux', 'Bash', 'Operating Systems', 'Linux From Scratch', 'Assembly'] },
    { id: 'databases', name: 'Databases', items: ['MySQL', 'SQL', 'Database Design'] },
    { id: 'cybersecurity-networking', name: 'Cybersecurity & Networking', items: ['TCP/IP', 'Wireshark', 'OpenSSH', 'Network Security'] },
    { id: 'embedded-systems', name: 'Embedded Systems', items: ['Arduino', 'ESP32', 'IoT', 'Embedded Systems', 'Sensor Integration'] },
    { id: 'computer-science', name: 'Computer Science', items: ['Data Structures', 'Algorithms', 'Object-Oriented Programming', 'Competitive Programming', 'Problem Solving'] },
    { id: 'tools', name: 'Tools', items: ['Git', 'GitHub', 'VS Code', 'MATLAB', 'Wokwi', 'npm'] },
  ];
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const folder = categories.find((category) => category.id === folderId);
  const folderIcon = (id: string) => icons[id] ? <img src={icons[id]} alt="" /> : <Folder />;
  const navigate = (id: string | null) => { setFolderId(id); setSelected(null); };
  return <div className="skills-xp">
    <nav className="skills-xp-menu"><span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span></nav>
    <div className="skills-xp-toolbar"><button disabled={!folder} onClick={() => navigate(null)}>← Back</button><button onClick={() => navigate(null)}>↑ Up</button><i /><button onClick={() => setSelected(null)}>⌕ Search</button><button onClick={() => setSelected(null)}>Folders</button></div>
    <div className="skills-xp-address"><b>Address</b><span>▣</span><div>C:\SAMEN-PC\Skills{folder ? `\${folder.name}` : ''}</div><button onClick={() => navigate(null)}>Go</button></div>
    <div className="skills-xp-main"><aside className="skills-xp-sidebar"><section><h3>Skill Tasks</h3>{folder ? <button onClick={() => navigate(null)}>← Back to Skills</button> : <button onClick={() => setSelected(null)}>Choose a category</button>}<button onClick={() => setSelected(null)}>View system information</button></section><section><h3>Other Places</h3><button onClick={() => navigate(null)}>My Skills</button><button onClick={() => setSelected(null)}>My Documents</button><button onClick={() => setSelected(null)}>My Computer</button></section><section><h3>Details</h3><p>{folder ? `${folder.items.length} skill${folder.items.length === 1 ? '' : 's'} in ${folder.name}.` : 'Double-click a folder to view its skills.'}</p></section></aside><main className="skills-xp-files">{folder ? <><div className="skills-xp-heading">{folderIcon(folder.id)}<div><b>{folder.name}</b><span>Select a skill to highlight it.</span></div></div><div className="skills-xp-item-list">{folder.items.map((item) => <button className={selected === item ? 'selected' : ''} key={item} onClick={() => setSelected(item)}><Settings /><span>{item}</span></button>)}</div></> : <div className="skills-xp-folder-grid">{categories.map((category) => <button key={category.id} onClick={() => navigate(category.id)} onDoubleClick={() => navigate(category.id)} title={`Open ${category.name}`}>{folderIcon(category.id)}<span>{category.name}</span><small>{category.items.length} items</small></button>)}</div>}</main></div>
    <footer className="skills-xp-status">{folder ? `${folder.items.length} object${folder.items.length === 1 ? '' : 's'}` : `${categories.length} objects`}{selected ? ` · ${selected} selected` : ''}</footer>
  </div>;
}

function AchievementsWindow({ achievements, sections }: { achievements: Achievement[]; sections: CustomSection[] }) {
  return <div><div className="eyebrow">ACHIEVEMENTS.LOG / VERIFIED</div><h2 className="display-heading">Milestones.</h2><div className="achievement-list">{achievements.map((achievement) => <article className="achievement" key={achievement.id}><div className="card-thumbnail achievement-thumbnail">{achievement.image ? <img className="achievement-image" src={achievement.image} alt="" /> : <Award aria-hidden="true" />}</div><div className="achievement-body"><header><span className="ach-year">{achievement.year}</span><span className="card-file-mark">.LOG</span></header><strong>{achievement.title}</strong><p>{achievement.description}</p>{achievement.button?.label && achievement.button.link && <a className="content-button" href={achievement.button.link} target="_blank" rel="noreferrer">{achievement.button.label} <ChevronRight size={12} /></a>}</div></article>)}</div><CustomSections sections={sections} /></div>;
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

function TerminalWindow({ open, projects, onAdmin }: { open: (id: WindowId) => void; projects: Project[]; onAdmin: () => void }) {
  const [history, setHistory] = useState<string[]>(['SAMEN Command Prompt [Version 1.0.24]', '(c) Ahmad Omar Abu Elsamen. All rights reserved.', '', 'Type "help" for a list of available commands.']);
  const [command, setCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const run = (event: FormEvent) => { event.preventDefault(); const value = command.trim().toLowerCase(); if (!value) return; let result = '';
    if (value === 'help') result = 'help       show this list\\nwhoami     display the operator\\nprojects   list project directories\\nskills     list the toolkit\\ncontact    open a way to say hello\\nclear      clear terminal\\nsecret     ...';
    else if (value === 'whoami') result = 'AHMAD OMAR ABU ELSAMEN\\nComputer Science student / software developer\\nAmman, Jordan';
    else if (value === 'projects') result = projects.map((project) => `  ${project.title}`).join('\\n');
    else if (value === 'skills') result = skills.join('  ·  ');
     else if (value === 'contact') { open('contact'); result = 'Opening contact window...'; }
     else if (value === 'github') result = 'https://github.com/Samenx';
    else if (value === 'samen-admin') { onAdmin(); result = 'Administrator access granted. Opening Content Admin...'; }
    else if (value === 'secret') result = 'You found the quiet room. Try typing "sudo rm -rf /" (it is harmless here).';
    else if (value === 'sudo rm -rf /') result = 'Nice try. SAMEN-PC protected the important files.\\nNo portfolios were harmed.';
    else if (value === 'clear') { setHistory([]); setCommand(''); return; }
    else result = `command not found: ${value}\\nType "help" to see what SAMEN-PC understands.`;
    setHistory((current) => [...current, `C:\\\\USERS\\\\AHMAD> ${command}`, result]); setCommand(''); };
  return <div className="terminal" onClick={() => inputRef.current?.focus()}><div className="terminal-output">{history.join('\\n')}</div><form className="terminal-form" onSubmit={run}><span>C:\USERS\AHMAD&gt;</span><input ref={inputRef} value={command} onChange={(event) => setCommand(event.target.value)} data-testid="input-terminal-command" autoComplete="off" aria-label="Terminal command" /></form></div>;
}

function AdminWindow({ content, saveContent, authenticated, onAuthenticated }: { content: PortfolioContent; saveContent: (content: PortfolioContent) => void; authenticated: boolean; onAuthenticated: () => void }) {
  const [section, setSection] = useState<'projects' | 'achievements' | 'about' | 'sections' | 'apps' | 'icons' | 'images'>('projects');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);
  const [editingApp, setEditingApp] = useState<CustomApp | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [iconTarget, setIconTarget] = useState('about');
  const [skillIconTarget, setSkillIconTarget] = useState('programming');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const saveProject = (event: FormEvent) => { event.preventDefault(); if (!editingProject?.title.trim()) return; const item = { ...editingProject, id: editingProject.id || crypto.randomUUID(), tags: editingProject.tags.filter(Boolean) }; const exists = content.projects.some((project) => project.id === item.id); saveContent({ ...content, projects: exists ? content.projects.map((project) => project.id === item.id ? item : project) : [item, ...content.projects] }); setEditingProject(null); };
  const saveAchievement = (event: FormEvent) => { event.preventDefault(); if (!editingAchievement?.title.trim()) return; const item = { ...editingAchievement, id: editingAchievement.id || crypto.randomUUID() }; const exists = content.achievements.some((achievement) => achievement.id === item.id); saveContent({ ...content, achievements: exists ? content.achievements.map((achievement) => achievement.id === item.id ? item : achievement) : [item, ...content.achievements] }); setEditingAchievement(null); };
  const saveSection = (event: FormEvent) => { event.preventDefault(); if (!editingSection?.title.trim()) return; const item = { ...editingSection, id: editingSection.id || crypto.randomUUID() }; const exists = content.sections.some((section) => section.id === item.id); saveContent({ ...content, sections: exists ? content.sections.map((section) => section.id === item.id ? item : section) : [item, ...content.sections] }); setEditingSection(null); };
  const saveApp = (event: FormEvent) => { event.preventDefault(); if (!editingApp?.title.trim()) return; const item = { ...editingApp, id: editingApp.id || crypto.randomUUID() }; const exists = content.apps.some((app) => app.id === item.id); saveContent({ ...content, apps: exists ? content.apps.map((app) => app.id === item.id ? item : app) : [item, ...content.apps] }); setEditingApp(null); };
  const addImage = (src: string) => { if (!src) return; saveContent({ ...content, gallery: [{ id: crypto.randomUUID(), title: imageTitle.trim() || 'Untitled image', src }, ...content.gallery] }); setImageTitle(''); setImageUrl(''); };
  const readImage = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => addImage(String(reader.result)); reader.readAsDataURL(file); event.target.value = ''; };
  const readInto = (event: ChangeEvent<HTMLInputElement>, apply: (src: string) => void) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => apply(String(reader.result)); reader.readAsDataURL(file); event.target.value = ''; };
  const readCv = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (file.type !== 'application/pdf') { window.alert('Please select a PDF CV.'); event.target.value = ''; return; } if (file.size > 5 * 1024 * 1024) { window.alert('Please choose a CV smaller than 5 MB.'); event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => saveContent({ ...content, cv: { name: file.name, src: String(reader.result) } }); reader.readAsDataURL(file); event.target.value = ''; };
  const builtInApps: Array<{ id: ContentApp; name: string }> = [{ id: 'about', name: 'About me' }, { id: 'projects', name: 'Projects' }, { id: 'skills', name: 'Skills' }, { id: 'achievements', name: 'Achievements' }, { id: 'browser', name: 'Internet Explorer' }, { id: 'guestbook', name: 'Guestbook' }, { id: 'terminal', name: 'Command Prompt' }, { id: 'contact', name: 'Contact' }, { id: 'recycle', name: 'Recycle Bin' }];
  const iconApps = [{ id: 'files', name: 'File Manager' }, ...builtInApps];
  const appName = (app: ContentApp) => content.apps.find((item) => `custom-${item.id}` === app)?.title || builtInApps.find((item) => item.id === app)?.name || app;
  const login = async (event: FormEvent) => { event.preventDefault(); setLoggingIn(true); setLoginError(''); try { const response = await fetch('/api/admin/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(response.status === 401 ? 'Incorrect password.' : body?.message || `The admin server returned an error (${response.status}).`); } setPassword(''); onAuthenticated(); } catch (error) { setLoginError(error instanceof Error && error.message === 'Failed to fetch' ? 'Cannot reach the admin server. Start the API server, then try again.' : error instanceof Error ? error.message : 'Unable to sign in.'); } finally { setLoggingIn(false); } };
  if (!authenticated) return <div className="admin-panel"><div className="eyebrow">ADMINISTRATOR / AUTHENTICATION REQUIRED</div><h2 className="display-heading">Sign in.</h2><p className="body-copy">Enter the administrator password to make live changes to the portfolio.</p><form className="contact-form admin-form" onSubmit={login}><label className="field-label">Administrator password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>{loginError && <p className="status-note">{loginError}</p>}<button className="submit-button" type="submit" disabled={loggingIn}>{loggingIn ? 'signing in…' : 'sign in'}</button></form></div>;
  return <div className="admin-panel">
    <div className="eyebrow">ADMINISTRATOR / CONTENT CONTROL</div><h2 className="display-heading">Portfolio<br />editor.</h2>
    <p className="body-copy">Changes are saved to the live portfolio and immediately appear in every portfolio window.</p>
    <div className="admin-tabs"><button className={section === 'projects' ? 'active' : ''} onClick={() => setSection('projects')}>Articles / projects</button><button className={section === 'achievements' ? 'active' : ''} onClick={() => setSection('achievements')}>Achievements</button><button className={section === 'about' ? 'active' : ''} onClick={() => setSection('about')}>About me</button><button className={section === 'sections' ? 'active' : ''} onClick={() => setSection('sections')}>App sections</button><button className={section === 'apps' ? 'active' : ''} onClick={() => setSection('apps')}>Custom apps</button><button className={section === 'icons' ? 'active' : ''} onClick={() => setSection('icons')}>App icons</button><button className={section === 'images' ? 'active' : ''} onClick={() => setSection('images')}>Images</button></div>
    {section === 'projects' && <><button className="submit-button" onClick={() => setEditingProject({ id: '', title: '', kicker: '', description: '', tags: [], link: '', image: '', retroButtonEnabled: false, retroButtonLabel: 'retro link', retroButtonLink: '' })}><Plus size={13} /> add article</button>{editingProject && <form className="contact-form admin-form" onSubmit={saveProject}><label className="field-label">Title<input required value={editingProject.title} onChange={(event) => setEditingProject({ ...editingProject, title: event.target.value })} /></label><label className="field-label">Category<input value={editingProject.kicker} onChange={(event) => setEditingProject({ ...editingProject, kicker: event.target.value })} /></label><label className="field-label">Description<textarea required rows={4} value={editingProject.description} onChange={(event) => setEditingProject({ ...editingProject, description: event.target.value })} /></label><label className="field-label">Tags (comma separated)<input value={editingProject.tags.join(', ')} onChange={(event) => setEditingProject({ ...editingProject, tags: event.target.value.split(',').map((tag) => tag.trim()) })} /></label><label className="field-label">Repository link<input type="url" value={editingProject.link} onChange={(event) => setEditingProject({ ...editingProject, link: event.target.value })} /></label><label className="field-label">Image URL (optional)<input type="url" value={editingProject.image || ''} onChange={(event) => setEditingProject({ ...editingProject, image: event.target.value })} /></label><label className="field-checkbox"><input type="checkbox" checked={Boolean(editingProject.retroButtonEnabled)} onChange={(event) => setEditingProject({ ...editingProject, retroButtonEnabled: event.target.checked })} /> show retro button for this project</label><label className="field-label">Retro button text<input disabled={!editingProject.retroButtonEnabled} value={editingProject.retroButtonLabel || ''} onChange={(event) => setEditingProject({ ...editingProject, retroButtonLabel: event.target.value })} /></label><label className="field-label">Retro button destination<input type="url" disabled={!editingProject.retroButtonEnabled} value={editingProject.retroButtonLink || ''} onChange={(event) => setEditingProject({ ...editingProject, retroButtonLink: event.target.value })} /></label><div className="admin-actions"><button className="submit-button" type="submit">save article</button><button type="button" className="dialog-button" onClick={() => setEditingProject(null)}>cancel</button></div></form>}<div className="admin-list">{content.projects.map((project) => <div key={project.id}><strong>{project.title}{project.retroButtonEnabled ? ' · retro link on' : ''}</strong><span><button onClick={() => setEditingProject(project)} aria-label={`Edit ${project.title}`}><Pencil size={13} /></button><button onClick={() => saveContent({ ...content, projects: content.projects.filter((item) => item.id !== project.id) })} aria-label={`Remove ${project.title}`}><Trash2 size={13} /></button></span></div>)}</div></>}
    {section === 'achievements' && <><button className="submit-button" onClick={() => setEditingAchievement({ id: '', year: '', title: '', description: '', image: '', button: { label: '', link: '' } })}><Plus size={13} /> add achievement</button>{editingAchievement && <form className="contact-form admin-form" onSubmit={saveAchievement}><label className="field-label">Year / date<input required value={editingAchievement.year} onChange={(event) => setEditingAchievement({ ...editingAchievement, year: event.target.value })} /></label><label className="field-label">Title<input required value={editingAchievement.title} onChange={(event) => setEditingAchievement({ ...editingAchievement, title: event.target.value })} /></label><label className="field-label">Description<textarea required rows={5} value={editingAchievement.description} onChange={(event) => setEditingAchievement({ ...editingAchievement, description: event.target.value })} /></label><label className="field-label">Achievement image URL<input type="url" value={editingAchievement.image || ''} onChange={(event) => setEditingAchievement({ ...editingAchievement, image: event.target.value })} /></label><label className="field-label">Button text (optional)<input value={editingAchievement.button?.label || ''} onChange={(event) => setEditingAchievement({ ...editingAchievement, button: { label: event.target.value, link: editingAchievement.button?.link || '' } })} /></label><label className="field-label">Button destination<input type="url" value={editingAchievement.button?.link || ''} onChange={(event) => setEditingAchievement({ ...editingAchievement, button: { label: editingAchievement.button?.label || '', link: event.target.value } })} /></label><label className="dialog-button image-upload"><ImagePlus size={13} /> upload achievement image<input type="file" accept="image/*" onChange={(event) => readInto(event, (image) => setEditingAchievement((current) => current ? { ...current, image } : current))} /></label><div className="admin-actions"><button className="submit-button" type="submit">save achievement</button><button type="button" className="dialog-button" onClick={() => setEditingAchievement(null)}>cancel</button></div></form>}<div className="admin-list">{content.achievements.map((achievement) => <div key={achievement.id}><strong>{achievement.year} · {achievement.title}</strong><span><button onClick={() => setEditingAchievement(achievement)} aria-label={`Edit ${achievement.title}`}><Pencil size={13} /></button><button onClick={() => saveContent({ ...content, achievements: content.achievements.filter((item) => item.id !== achievement.id) })} aria-label={`Remove ${achievement.title}`}><Trash2 size={13} /></button></span></div>)}</div></>}
    {section === 'about' && <div className="contact-form admin-form"><label className="field-label">About heading<textarea rows={2} value={content.about.title} onChange={(event) => saveContent({ ...content, about: { ...content.about, title: event.target.value } })} /></label><label className="field-label">About text<textarea rows={7} value={content.about.intro} onChange={(event) => saveContent({ ...content, about: { ...content.about, intro: event.target.value } })} /></label><label className="field-label">Location<input value={content.about.details.location} onChange={(event) => saveContent({ ...content, about: { ...content.about, details: { ...content.about.details, location: event.target.value } } })} /></label><label className="field-label">Role<input value={content.about.details.role} onChange={(event) => saveContent({ ...content, about: { ...content.about, details: { ...content.about.details, role: event.target.value } } })} /></label><label className="field-label">Status<input value={content.about.details.status} onChange={(event) => saveContent({ ...content, about: { ...content.about, details: { ...content.about.details, status: event.target.value } } })} /></label><label className="field-label">Uptime<input value={content.about.details.uptime} onChange={(event) => saveContent({ ...content, about: { ...content.about, details: { ...content.about.details, uptime: event.target.value } } })} /></label><label className="field-label">Button text (optional)<input value={content.about.button?.label || ''} onChange={(event) => saveContent({ ...content, about: { ...content.about, button: { label: event.target.value, link: content.about.button?.link || '' } } })} /></label><label className="field-label">Button destination<input type="url" value={content.about.button?.link || ''} onChange={(event) => saveContent({ ...content, about: { ...content.about, button: { label: content.about.button?.label || '', link: event.target.value } } })} /></label><label className="field-label">About me image URL<input type="url" value={content.aboutImage || ''} onChange={(event) => saveContent({ ...content, aboutImage: event.target.value })} /></label><label className="dialog-button image-upload"><ImagePlus size={13} /> upload about image<input type="file" accept="image/*" onChange={(event) => readInto(event, (aboutImage) => saveContent({ ...content, aboutImage }))} /></label><div className="admin-actions"><label className="dialog-button image-upload"><FileText size={13} /> upload CV (PDF)<input type="file" accept="application/pdf,.pdf" onChange={readCv} /></label>{content.cv && <button type="button" className="dialog-button" onClick={() => { const { cv: _cv, ...nextContent } = content; saveContent(nextContent); }}>remove CV</button>}</div>{content.cv && <p className="body-copy">Current CV: {content.cv.name}</p>}{content.aboutImage && <img className="admin-image-preview" src={content.aboutImage} alt="Current about" />}</div>}
    {section === 'sections' && <><button className="submit-button" onClick={() => setEditingSection({ id: '', app: 'about', title: '', description: '', image: '', button: { label: '', link: '' } })}><Plus size={13} /> add app section</button>{editingSection && <form className="contact-form admin-form" onSubmit={saveSection}><label className="field-label">Show in<select value={editingSection.app} onChange={(event) => setEditingSection({ ...editingSection, app: event.target.value as ContentApp })}>{builtInApps.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}{content.apps.map((item) => <option key={item.id} value={`custom-${item.id}`}>{item.title}</option>)}</select></label><label className="field-label">Section title<input required value={editingSection.title} onChange={(event) => setEditingSection({ ...editingSection, title: event.target.value })} /></label><label className="field-label">Description<textarea required rows={4} value={editingSection.description} onChange={(event) => setEditingSection({ ...editingSection, description: event.target.value })} /></label><label className="field-label">Image URL (optional)<input type="url" value={editingSection.image || ''} onChange={(event) => setEditingSection({ ...editingSection, image: event.target.value })} /></label><label className="field-label">Button text (optional)<input value={editingSection.button?.label || ''} onChange={(event) => setEditingSection({ ...editingSection, button: { label: event.target.value, link: editingSection.button?.link || '' } })} /></label><label className="field-label">Button destination<input type="url" value={editingSection.button?.link || ''} onChange={(event) => setEditingSection({ ...editingSection, button: { label: editingSection.button?.label || '', link: event.target.value } })} /></label><label className="dialog-button image-upload"><ImagePlus size={13} /> upload section image<input type="file" accept="image/*" onChange={(event) => readInto(event, (image) => setEditingSection((current) => current ? { ...current, image } : current))} /></label><div className="admin-actions"><button className="submit-button" type="submit">save section</button><button type="button" className="dialog-button" onClick={() => setEditingSection(null)}>cancel</button></div></form>}<div className="admin-list">{content.sections.map((item) => <div key={item.id}><strong>{appName(item.app)} · {item.title}</strong><span><button onClick={() => setEditingSection(item)} aria-label={`Edit ${item.title}`}><Pencil size={13} /></button><button onClick={() => saveContent({ ...content, sections: content.sections.filter((section) => section.id !== item.id) })} aria-label={`Remove ${item.title}`}><Trash2 size={13} /></button></span></div>)}</div></>}
    {section === 'apps' && <><button className="submit-button" onClick={() => setEditingApp({ id: '', title: '', description: '', image: '', icon: '', button: { label: '', link: '' } })}><Plus size={13} /> add desktop app</button>{editingApp && <form className="contact-form admin-form" onSubmit={saveApp}><label className="field-label">App name<input required value={editingApp.title} onChange={(event) => setEditingApp({ ...editingApp, title: event.target.value })} /></label><label className="field-label">App text<textarea required rows={5} value={editingApp.description} onChange={(event) => setEditingApp({ ...editingApp, description: event.target.value })} /></label><label className="field-label">App image URL (optional)<input type="url" value={editingApp.image || ''} onChange={(event) => setEditingApp({ ...editingApp, image: event.target.value })} /></label><label className="field-label">Desktop icon image URL (optional)<input type="url" value={editingApp.icon || ''} onChange={(event) => setEditingApp({ ...editingApp, icon: event.target.value })} /></label><label className="dialog-button image-upload"><ImagePlus size={13} /> upload desktop icon<input type="file" accept="image/*" onChange={(event) => readInto(event, (icon) => setEditingApp((current) => current ? { ...current, icon } : current))} /></label><label className="field-label">Button text (optional)<input value={editingApp.button?.label || ''} onChange={(event) => setEditingApp({ ...editingApp, button: { label: event.target.value, link: editingApp.button?.link || '' } })} /></label><label className="field-label">Button destination<input type="url" value={editingApp.button?.link || ''} onChange={(event) => setEditingApp({ ...editingApp, button: { label: editingApp.button?.label || '', link: event.target.value } })} /></label><div className="admin-actions"><button className="submit-button" type="submit">save app</button><button type="button" className="dialog-button" onClick={() => setEditingApp(null)}>cancel</button></div></form>}<div className="admin-list">{content.apps.map((app) => <div key={app.id}><strong>{app.title}</strong><span><button onClick={() => setEditingApp(app)} aria-label={`Edit ${app.title}`}><Pencil size={13} /></button><button onClick={() => saveContent({ ...content, apps: content.apps.filter((item) => item.id !== app.id), sections: content.sections.filter((item) => item.app !== `custom-${app.id}`) })} aria-label={`Remove ${app.title}`}><Trash2 size={13} /></button></span></div>)}</div></>}
    {section === 'icons' && <div className="contact-form admin-form"><p className="body-copy">Choose an app, then paste an image URL or upload a PNG, JPG, SVG, or WebP. This changes the desktop, Start menu, and File Manager icon.</p><label className="field-label">App<select value={iconTarget} onChange={(event) => setIconTarget(event.target.value)}>{iconApps.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}{content.apps.map((app) => <option key={app.id} value={`custom-${app.id}`}>{app.title}</option>)}</select></label><label className="field-label">App icon image URL<input type="url" placeholder="https://example.com/icon.png" value={content.appIcons[iconTarget] || ''} onChange={(event) => saveContent({ ...content, appIcons: { ...content.appIcons, [iconTarget]: event.target.value } })} /></label><div className="admin-actions"><label className="dialog-button image-upload"><ImagePlus size={13} /> upload app icon<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => readInto(event, (icon) => saveContent({ ...content, appIcons: { ...content.appIcons, [iconTarget]: icon } }))} /></label><button type="button" className="dialog-button" onClick={() => { const { [iconTarget]: _removed, ...appIcons } = content.appIcons; saveContent({ ...content, appIcons }); }}>restore default app icon</button></div>{content.appIcons[iconTarget] && <img className="admin-icon-preview" src={content.appIcons[iconTarget]} alt="Selected app icon preview" />}<hr className="rule" /><p className="body-copy">Skills folder icons appear inside the Skills application.</p><label className="field-label">Skills folder<select value={skillIconTarget} onChange={(event) => setSkillIconTarget(event.target.value)}><option value="programming">Programming</option><option value="web-development">Web Development</option><option value="systems">Systems</option><option value="databases">Databases</option><option value="cybersecurity-networking">Cybersecurity &amp; Networking</option><option value="embedded-systems">Embedded Systems</option><option value="computer-science">Computer Science</option><option value="tools">Tools</option></select></label><label className="field-label">Folder icon image URL<input type="url" placeholder="https://example.com/folder.png" value={content.skillIcons[skillIconTarget] || ''} onChange={(event) => saveContent({ ...content, skillIcons: { ...content.skillIcons, [skillIconTarget]: event.target.value } })} /></label><div className="admin-actions"><label className="dialog-button image-upload"><ImagePlus size={13} /> upload folder icon<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => readInto(event, (icon) => saveContent({ ...content, skillIcons: { ...content.skillIcons, [skillIconTarget]: icon } }))} /></label><button type="button" className="dialog-button" onClick={() => { const { [skillIconTarget]: _removed, ...skillIcons } = content.skillIcons; saveContent({ ...content, skillIcons }); }}>restore default folder</button></div>{content.skillIcons[skillIconTarget] && <img className="admin-icon-preview" src={content.skillIcons[skillIconTarget]} alt="Selected Skills folder icon preview" />}</div>}
    {section === 'images' && <><div className="contact-form admin-form"><label className="field-label">Image label<input value={imageTitle} onChange={(event) => setImageTitle(event.target.value)} /></label><label className="field-label">Image URL<input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} /></label><div className="admin-actions"><button className="submit-button" type="button" onClick={() => addImage(imageUrl)}>add URL image</button><label className="dialog-button image-upload"><ImagePlus size={13} /> upload image<input type="file" accept="image/*" onChange={readImage} /></label></div></div><div className="image-grid">{content.gallery.map((image) => <figure key={image.id}><img src={image.src} alt={image.title} /><figcaption>{image.title}<button onClick={() => saveContent({ ...content, gallery: content.gallery.filter((item) => item.id !== image.id) })} aria-label={`Remove ${image.title}`}><Trash2 size={13} /></button></figcaption></figure>)}</div></>}
  </div>;
}

function ContactWindow() {
  const [sent, setSent] = useState(false); const [form, setForm] = useState({ name: '', email: '', message: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); setSent(true); };
  return <div><div className="eyebrow">MAIL.EXE / OUTBOUND MESSAGE</div><h2 className="display-heading">Let's talk.</h2>{sent ? <div className="status-note" data-testid="status-contact">Message staged successfully. Ahmad will receive your note when this portfolio grows a backend.</div> : <form className="contact-form" onSubmit={submit}><label className="field-label">Your name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-contact-name" /></label><label className="field-label">Your email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-contact-email" /></label><label className="field-label">Message<textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="input-contact-message" /></label><button className="submit-button" type="submit" data-testid="button-submit-contact"><Send size={13} style={{ verticalAlign: 'middle' }} /> stage message</button></form>}<hr className="rule" /><p className="body-copy">Prefer a direct route? <a href="mailto:ahmad.omar.elsamen@gmail.com" data-testid="link-email">ahmad.omar.elsamen@gmail.com</a><br /><a href="tel:+962770601798">+962 77 060 1798</a></p><p className="body-copy"><a href="https://github.com/Samenx" target="_blank" rel="noreferrer" data-testid="link-github">github.com/Samenx</a><br /><a href="https://www.linkedin.com/in/ahmad-abu-elsamen-13102a292" target="_blank" rel="noreferrer" data-testid="link-linkedin">linkedin.com/in/ahmad-abu-elsamen-13102a292</a></p></div>;
}

function RecycleWindow() {
  const [restored, setRestored] = useState(false);
  return <div className="recycle"><Recycle className="recycle-icon" size={48} strokeWidth={1.2} /><h2>{restored ? 'Nothing to restore.' : 'Recycle Bin is empty.'}</h2><p>{restored ? 'The deleted tabs were only interface clutter. SAMEN-PC is tidy again.' : 'There are no discarded projects here. Ahmad keeps the useful mistakes.'}</p><button className="dialog-button" data-testid="button-recycle-action" onClick={() => setRestored(true)}>{restored ? 'close the story' : 'try to restore something'}</button></div>;
}

function WindowContent({ id, open, content, saveContent, unlockAdmin, adminAuthenticated, onAdminAuthenticated }: { id: WindowId; open: (id: WindowId) => void; content: PortfolioContent; saveContent: (content: PortfolioContent) => void; unlockAdmin: () => void; adminAuthenticated: boolean; onAdminAuthenticated: () => void }) {
  const sections = id === 'admin' ? [] : content.sections.filter((section) => section.app === id);
  if (id === 'files') return <FileManagerWindow open={open} apps={content.apps} appIcons={content.appIcons} />;
  if (id === 'about') return <AboutWindow open={open} image={content.aboutImage} cv={content.cv} about={content.about} sections={sections} />;
  if (id === 'projects') return <ProjectsWindow projects={content.projects} sections={sections} />;
  if (id === 'skills') return <SkillsWindow open={open} sections={sections} icons={content.skillIcons} />;
  if (id === 'achievements') return <AchievementsWindow achievements={content.achievements} sections={sections} />;
  if (id === 'browser') return <><BrowserWindow open={open} /><CustomSections sections={sections} /></>;
  if (id === 'guestbook') return <><GuestbookWindow /><CustomSections sections={sections} /></>;
  if (id === 'terminal') return <><TerminalWindow open={open} projects={content.projects} onAdmin={unlockAdmin} /><CustomSections sections={sections} /></>;
  if (id === 'contact') return <><ContactWindow /><CustomSections sections={sections} /></>;
  if (id === 'admin') return <AdminWindow content={content} saveContent={saveContent} authenticated={adminAuthenticated} onAuthenticated={onAdminAuthenticated} />;
  const app = content.apps.find((item) => `custom-${item.id}` === id);
  if (app) return <CustomAppWindow app={app} sections={sections} />;
  return <><RecycleWindow /><CustomSections sections={sections} /></>;
}

function ProfessionalPortfolio({ content, onReturn }: { content: PortfolioContent; onReturn: () => void }) {
  const firstName = content.about.title.split('\n')[0] || 'Ahmad Omar';
  return <main className="professional-portfolio">
    <button className="return-retro" onClick={onReturn}>← Return Retro</button>
    <nav className="professional-nav" aria-label="Professional portfolio navigation"><a href="#professional-about" className="professional-brand">AO<span>.</span></a><div><a href="#professional-work">Work</a><a href="#professional-achievements">Achievements</a><a href="#professional-contact">Contact</a></div></nav>
    <section className="professional-hero" id="professional-about"><div><p className="professional-kicker">Software developer · Amman, Jordan</p><h1>{firstName}<br /><em>Abu Elsamen.</em></h1><p className="professional-lede">{content.about.intro.split('\n')[0]}</p><div className="professional-actions"><a href="#professional-work" className="professional-primary">View selected work</a>{content.cv && <a className="professional-secondary" href={content.cv.src} download={content.cv.name}>Download CV</a>}</div></div><aside className="professional-profile"><div className="professional-avatar">AO</div><dl><div><dt>Focus</dt><dd>{content.about.details.role}</dd></div><div><dt>Based in</dt><dd>{content.about.details.location}</dd></div><div><dt>Status</dt><dd>{content.about.details.status}</dd></div></dl></aside></section>
    <section className="professional-section" id="professional-work"><div className="professional-section-heading"><p className="professional-kicker">Selected work</p><h2>Ideas made practical.</h2></div><div className="professional-project-grid">{content.projects.map((project) => <article className="professional-project-card" key={project.id}><div className="professional-project-image">{project.image ? <img src={project.image} alt="" /> : <BriefcaseBusiness aria-hidden="true" />}</div><div className="professional-card-copy"><p>{project.kicker}</p><h3>{project.title}</h3><span>{project.description}</span><div className="professional-tags">{project.tags.map((tag) => <b key={tag}>{tag}</b>)}</div><a href={project.link} target="_blank" rel="noreferrer">View project ↗</a></div></article>)}</div></section>
    {content.apps.length > 0 && <section className="professional-section"><div className="professional-section-heading"><p className="professional-kicker">Additional work</p><h2>More things I’m building.</h2></div><div className="professional-project-grid">{content.apps.map((app) => <article className="professional-project-card" key={app.id}><div className="professional-project-image">{app.image ? <img src={app.image} alt="" /> : <BriefcaseBusiness aria-hidden="true" />}</div><div className="professional-card-copy"><p>Independent project</p><h3>{app.title}</h3><span>{app.description}</span>{app.button?.label && app.button.link && <a href={app.button.link} target="_blank" rel="noreferrer">{app.button.label} ↗</a>}</div></article>)}</div></section>}
    <section className="professional-section professional-achievements" id="professional-achievements"><div className="professional-section-heading"><p className="professional-kicker">Recognition</p><h2>Milestones along the way.</h2></div><div className="professional-achievement-list">{content.achievements.map((achievement) => <article key={achievement.id}><div className="professional-achievement-image">{achievement.image ? <img src={achievement.image} alt="" /> : <Award aria-hidden="true" />}</div><div><span>{achievement.year}</span><h3>{achievement.title}</h3><p>{achievement.description}</p>{achievement.button?.label && achievement.button.link && <a href={achievement.button.link} target="_blank" rel="noreferrer">{achievement.button.label} ↗</a>}</div></article>)}</div></section>
    <section className="professional-section professional-skills"><div className="professional-section-heading"><p className="professional-kicker">Capabilities</p><h2>A versatile technical foundation.</h2></div><div>{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>
    {content.sections.length > 0 && <section className="professional-section"><div className="professional-section-heading"><p className="professional-kicker">More information</p><h2>Notes from the portfolio.</h2></div><div className="professional-notes">{content.sections.map((section) => <article key={section.id}>{section.image && <img src={section.image} alt="" />}<div><h3>{section.title}</h3><p>{section.description}</p>{section.button?.label && section.button.link && <a href={section.button.link} target="_blank" rel="noreferrer">{section.button.label} ↗</a>}</div></article>)}</div></section>}
    <footer className="professional-footer" id="professional-contact"><div><p className="professional-kicker">Get in touch</p><h2>Let’s build something useful.</h2></div><div><a href="mailto:ahmad.omar.elsamen@gmail.com">ahmad.omar.elsamen@gmail.com</a><a href="https://github.com/Samenx" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/ahmad-abu-elsamen-13102a292" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></footer>
  </main>;
}

function Desktop() {
  const [windows, setWindows] = useState<WinState[]>(initialWindows);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [drag, setDrag] = useState<{ id: WindowId; dx: number; dy: number } | null>(null);
  const zRef = useRef(2);
  const firstWindowOpened = useRef(false);
  const [content, saveContent] = usePortfolioContent();
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [professional, setProfessional] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { void fetch('/api/admin/session', { credentials: 'include' }).then(async (response) => response.ok ? response.json() : { authenticated: false }).then(({ authenticated }) => setAdminAuthenticated(Boolean(authenticated))).catch(() => setAdminAuthenticated(false)); }, []);
  useEffect(() => {
    const move = (event: PointerEvent) => { if (!drag) return; setWindows((current) => current.map((win) => win.id === drag.id && !win.maximized ? { ...win, x: Math.max(6, event.clientX - drag.dx), y: Math.max(6, event.clientY - drag.dy) } : win)); };
    const up = () => setDrag(null); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag]);
  const open = (id: WindowId) => { zRef.current += 1; setWindows((current) => { const existing = current.find((win) => win.id === id); if (existing) return current.map((win) => win.id === id ? { ...win, minimized: false, z: zRef.current } : win); const customApp = content.apps.find((item) => `custom-${item.id}` === id); const meta = customApp ? { title: customApp.title, icon: <BriefcaseBusiness /> } : appMeta[id as BuiltInWindowId]; return [...current, { id, ...meta, x: 150 + current.length * 28, y: 45 + current.length * 22, w: id === 'files' ? 740 : id === 'about' ? 670 : id === 'terminal' ? 530 : id === 'admin' ? 720 : 610, h: id === 'files' ? 530 : id === 'about' ? 550 : id === 'projects' ? 550 : id === 'admin' ? 620 : 475, minimized: false, maximized: false, z: zRef.current }]; }); setStartOpen(false); };
  const navigateWindow = (from: WindowId, to: WindowId) => {
    if (from === to) return focus(from);
    zRef.current += 1;
    setWindows((current) => {
      const source = current.find((win) => win.id === from);
      if (!source) return current;
      const customApp = content.apps.find((item) => `custom-${item.id}` === to);
      const meta = customApp ? { title: customApp.title, icon: <BriefcaseBusiness /> } : appMeta[to as BuiltInWindowId];
      // Replace this window's application instead of opening another one. If
      // the destination was already open, close that older instance first.
      return [...current.filter((win) => win.id !== from && win.id !== to), { ...source, id: to, ...meta, minimized: false, z: zRef.current }];
    });
  };
  const unlockAdmin = () => open('admin');
  useEffect(() => { if (!firstWindowOpened.current) { firstWindowOpened.current = true; open('about'); } }, []);
  const focus = (id: WindowId) => { zRef.current += 1; setWindows((current) => current.map((win) => win.id === id ? { ...win, z: zRef.current } : win)); };
  const close = (id: WindowId) => setWindows((current) => current.filter((win) => win.id !== id));
  const update = (id: WindowId, patch: Partial<WinState>) => setWindows((current) => current.map((win) => win.id === id ? { ...win, ...patch } : win));
  const startDrag = (id: WindowId, event: ReactPointerEvent<HTMLDivElement>) => { const target = event.currentTarget.parentElement?.parentElement; const win = windows.find((item) => item.id === id); if (!target || !win || win.maximized) return; setDrag({ id, dx: event.clientX - win.x, dy: event.clientY - win.y }); focus(id); };
  const icon = (id: string, fallback: ReactNode) => content.appIcons[id] ? <img src={content.appIcons[id]} alt="" /> : fallback;
  const icons = [
    { label: 'File Manager', id: 'files' as WindowId, icon: icon('files', <Folder />) },
    { label: 'Internet Explorer', id: 'browser' as WindowId, icon: icon('browser', <Globe2 />) },
    { label: 'Guestbook', id: 'guestbook' as WindowId, icon: icon('guestbook', <BookOpen />) },
    { label: 'Recycle Bin', id: 'recycle' as WindowId, icon: icon('recycle', <Recycle />) },
    ...content.apps.map((app) => ({ label: app.title, id: `custom-${app.id}` as WindowId, icon: icon(`custom-${app.id}`, app.icon ? <img src={app.icon} alt="" /> : <BriefcaseBusiness />) })),
  ];
  const menuApps = [{ id: 'about' as WindowId, title: 'About Ahmad', icon: icon('about', <UserRound />) }, { id: 'projects' as WindowId, title: 'My Projects', icon: icon('projects', <BriefcaseBusiness />) }, { id: 'skills' as WindowId, title: 'Skills & Toolkit', icon: icon('skills', <Settings />) }, { id: 'achievements' as WindowId, title: 'Achievements', icon: icon('achievements', <Award />) }, { id: 'browser' as WindowId, title: 'Internet Explorer', icon: icon('browser', <Globe2 />) }, { id: 'contact' as WindowId, title: 'Contact Ahmad', icon: icon('contact', <Mail />) }, ...content.apps.map((app) => ({ id: `custom-${app.id}` as WindowId, title: app.title, icon: icon(`custom-${app.id}`, app.icon ? <img src={app.icon} alt="" /> : <BriefcaseBusiness />) }))];
  if (professional) return <ProfessionalPortfolio content={content} onReturn={() => setProfessional(false)} />;
     return <main className="desktop-shell">
     <div className="desktop-wallpaper" style={{ backgroundImage: `url(${blissWallpaper})` }} onClick={() => setStartOpen(false)} />
    <div className="desktop-icons">{icons.map((item) => <DesktopIcon key={item.id} label={item.label} icon={item.icon} onOpen={() => open(item.id)} testId={`desktop-icon-${item.id}`} />)}<DesktopIcon className="professional-launcher" label="Switch To Professional" icon={<BriefcaseBusiness />} onOpen={() => setProfessional(true)} testId="desktop-icon-professional" /></div>
    {windows.map((win) => <WindowFrame key={win.id} win={win} onFocus={() => focus(win.id)} onClose={() => close(win.id)} onMinimize={() => update(win.id, { minimized: true })} onMaximize={() => update(win.id, { maximized: !win.maximized })} onDrag={(event) => startDrag(win.id, event)} navigation={win.id !== 'files' && win.id !== 'skills' ? <AppNavigation apps={menuApps} onNavigate={(target) => navigateWindow(win.id, target)} /> : undefined}><WindowContent id={win.id} open={open} content={content} saveContent={saveContent} unlockAdmin={unlockAdmin} adminAuthenticated={adminAuthenticated} onAdminAuthenticated={() => setAdminAuthenticated(true)} /></WindowFrame>)}
    {startOpen && <aside className="start-menu" data-testid="start-menu"><div className="start-banner"><span className="start-avatar">AO</span><div><strong>AHMAD OMAR</strong><small>Abu Elsamen · Amman, JO</small></div></div><div className="start-grid">{menuApps.map((item) => <button className="start-item" key={item.id} onClick={() => open(item.id)} data-testid={`start-item-${item.id}`}>{item.icon}<span>{item.title}</span></button>)}</div><div className="start-footer"><button className="shutdown" onClick={() => window.location.reload()} data-testid="button-restart">Restart SAMEN-PC <Power size={13} style={{ verticalAlign: 'middle' }} /></button></div></aside>}
     <footer className="taskbar"><button className={`start-button ${startOpen ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); setStartOpen((current) => !current); }} data-testid="button-start"><span className="start-mark">⊞</span><span>start</span></button><div className="task-items">{windows.map((win) => <button className={`task-item ${!win.minimized ? 'active' : ''}`} key={win.id} onClick={() => { if (win.minimized) update(win.id, { minimized: false }); focus(win.id); }} data-testid={`task-${win.id}`}><span>{win.title}</span></button>)}</div><time className="task-clock" data-testid="text-clock">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></footer>
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
