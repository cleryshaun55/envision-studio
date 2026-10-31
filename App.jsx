import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const PHONE = '2347066923248';
const FACEBOOK = 'https://facebook.com/profile.php?id=61589018991358';
const waLink = (message = "Hello Envision Studio, I'd like to discuss a design project.") =>
  `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const services = [
  { n:'01', title:'Logo & brand identity', desc:'Distinctive identities that give your business a recognisable face and a consistent visual language.', tag:'Build recognition', color:'lavender', icon:'✳' },
  { n:'02', title:'Social media design', desc:'Scroll-stopping graphics and content layouts that make your brand look intentional across every platform.', tag:'Show up consistently', color:'peach', icon:'▧' },
  { n:'03', title:'Business advertisements', desc:'Clear, persuasive campaign visuals that communicate your offer and give people a reason to act.', tag:'Make the message land', color:'blue', icon:'↗' },
  { n:'04', title:'Product displays', desc:'Polished product visuals and promotional compositions that put the right details in the spotlight.', tag:'Present with purpose', color:'yellow', icon:'◈' },
  { n:'05', title:'Business mockups', desc:'Bring your identity to life across stationery, packaging, signage and real-world brand touchpoints.', tag:'See the bigger picture', color:'mint', icon:'▣' },
  { n:'06', title:'Custom creative design', desc:'Have a specific visual idea? We shape tailored design solutions around your goals and audience.', tag:'Made around your brief', color:'pink', icon:'✦' },
];

const initialProjects = [
  { id:'p1', title:'A clearer kind of bold', category:'Brand identity', type:'brand', description:'A confident identity concept built around clarity, strong typography and a flexible visual system.', image:'https://images.unsplash.com/photo-1634942536790-253d4f3b3c6b?auto=format&fit=crop&w=1200&q=85', label:'IDENTITY STUDY' },
  { id:'p2', title:'Made to be noticed', category:'Social media', type:'social', description:'A vibrant social campaign concept with a clear message and a high-impact visual hierarchy.', image:'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=85', label:'SOCIAL CAMPAIGN' },
  { id:'p3', title:'The product, elevated', category:'Product display', type:'product', description:'A clean product presentation concept focused on shape, texture and commercial appeal.', image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85', label:'PRODUCT VISUAL' },
  { id:'p4', title:'A campaign with character', category:'Advertisement', type:'ads', description:'An advertising direction that pairs expressive composition with a simple, memorable message.', image:'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=85', label:'CAMPAIGN CONCEPT' },
  { id:'p5', title:'Details make the brand', category:'Business mockup', type:'mockup', description:'A visual identity shown across printed and digital touchpoints for a more tangible brand story.', image:'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85', label:'BRAND APPLICATION' },
  { id:'p6', title:'A fresh point of view', category:'Social media', type:'social', description:'A modern content direction designed to keep a business recognisable and visually consistent.', image:'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=85', label:'CONTENT DIRECTION' },
];

const categories = ['All work','Brand identity','Social media','Advertisement','Product display','Business mockup'];
const navItems = ['Home','Services','Portfolio','About','Contact'];

function Mark({ light=false }) {
  return <a className={`brand ${light?'brand-light':''}`} href="#home" aria-label="Envision Studio home">
    <span className="brand-mark"><i></i><i></i><i></i></span>
    <span className="brand-name">envision<span>studio</span></span>
  </a>;
}
function Arrow({ diagonal=false }) { return <span aria-hidden="true">{diagonal?'↗':'→'}</span>; }
function SectionHead({ eyebrow, title, copy, light=false }) {
  return <div className={`section-head ${light?'on-dark':''}`}>
    <p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{copy && <p className="section-copy">{copy}</p>}
  </div>;
}
function Header({ page, setPage }) {
  const [open,setOpen] = useState(false);
  return <header className="site-header">
    <div className="nav-wrap"><Mark />
      <button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">{open?'✕':'☰'}</button>
      <nav className={open?'nav-open':''}>
        {navItems.map(item=><a key={item} href={`#${item.toLowerCase()}`} className={page===item.toLowerCase()?'active':''} onClick={()=>{setPage(item.toLowerCase());setOpen(false)}}>{item}</a>)}
        <a className="nav-cta" href={waLink("Hello Envision Studio, I'd like to start a project.")} target="_blank" rel="noreferrer">Start a project <Arrow diagonal/></a>
      </nav>
    </div>
  </header>;
}
function ProjectCard({project,onOpen}) {
  return <button className="project-card" onClick={()=>onOpen(project)} aria-label={`View ${project.title}`}>
    <div className="project-image"><img src={project.image} alt={`${project.category} design concept`} loading="lazy"/><span className="image-label">{project.label}</span><span className="project-arrow"><Arrow diagonal/></span></div>
    <div className="project-meta"><div><p>{project.category}</p><h3>{project.title}</h3></div><span className="text-arrow"><Arrow diagonal/></span></div>
  </button>;
}
function EnquiryForm() {
  const [form,setForm] = useState({name:'',email:'',whatsapp:'',business:'',service:'',description:'',budget:'',deadline:''});
  const [status,setStatus] = useState('');
  const update = e => setForm({...form,[e.target.name]:e.target.value});
  async function submit(e) {
    e.preventDefault(); setStatus('sending');
    if (supabase) {
      const { error } = await supabase.from('enquiries').insert([form]);
      if (error) { setStatus('error'); return; }
      setStatus('success'); setForm({name:'',email:'',whatsapp:'',business:'',service:'',description:'',budget:'',deadline:''});
    } else {
      const msg = `Hello Envision Studio!%0AName: ${encodeURIComponent(form.name)}%0AEmail: ${encodeURIComponent(form.email)}%0AWhatsApp: ${encodeURIComponent(form.whatsapp)}%0ABusiness: ${encodeURIComponent(form.business)}%0AService: ${encodeURIComponent(form.service)}%0ADetails: ${encodeURIComponent(form.description)}%0ABudget: ${encodeURIComponent(form.budget)}%0ADeadline: ${encodeURIComponent(form.deadline)}`;
      window.open(`https://wa.me/${PHONE}?text=${msg}`,'_blank','noopener,noreferrer');
      setStatus('whatsapp');
    }
  }
  return <form className="enquiry-form" onSubmit={submit}>
    <div className="form-grid">
      <label>Your name<input required name="name" value={form.name} onChange={update} placeholder="e.g. Alex James"/></label>
      <label>Email address<input required type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com"/></label>
      <label>WhatsApp number<input name="whatsapp" value={form.whatsapp} onChange={update} placeholder="+234..."/></label>
      <label>Business / brand name<input name="business" value={form.business} onChange={update} placeholder="Your brand name"/></label>
      <label className="full">What do you need?<select required name="service" value={form.service} onChange={update}><option value="">Choose a service</option>{services.map(s=><option key={s.n}>{s.title}</option>)}</select></label>
      <label className="full">Tell us about the project<textarea required rows="4" name="description" value={form.description} onChange={update} placeholder="Share your idea, goals and any important details..."/></label>
      <label>Estimated budget (optional)<input name="budget" value={form.budget} onChange={update} placeholder="e.g. ₦50,000"/></label>
      <label>Preferred deadline (optional)<input type="date" name="deadline" value={form.deadline} onChange={update}/></label>
    </div>
    <button className="button button-dark submit-btn" disabled={status==='sending'}>{status==='sending'?'Sending...':'Send project enquiry'} <Arrow diagonal/></button>
    {status==='success'&&<p className="form-status good">Your enquiry has been received. Thank you for reaching out.</p>}
    {status==='whatsapp'&&<p className="form-status">Your enquiry has been prepared in WhatsApp. Send the message there to complete your request.</p>}
    {status==='error'&&<p className="form-status error">We couldn't save your enquiry. Please try WhatsApp instead.</p>}
    <p className="form-note">No pressure, no complicated process. Just tell us what you're envisioning.</p>
  </form>;
}
function ProjectModal({project,onClose}) {
  if(!project) return null;
  return <div className="modal-backdrop" onClick={onClose}><div className="project-modal" onClick={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}>✕</button><img src={project.image} alt={project.title}/>
    <div className="modal-copy"><p className="eyebrow">{project.category} · Concept showcase</p><h2>{project.title}</h2><p>{project.description}</p><a className="button button-dark" href={waLink(`Hello Envision Studio, I'd like a design similar in direction to "${project.title}".`)} target="_blank" rel="noreferrer">Discuss a project <Arrow diagonal/></a></div>
  </div></div>;
}
function Admin({projects,setProjects,onClose}) {
  const [session,setSession] = useState(null);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [draft,setDraft] = useState({title:'',category:'Brand identity',description:'',image:'',label:'FEATURED WORK'});
  const [enquiries,setEnquiries] = useState([]);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const [tab,setTab] = useState('projects');
  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{
    if(!session || !supabase) return;
    (async()=>{
      const [{data:rows,error:projectError},{data:leads,error:leadError}] = await Promise.all([
        supabase.from('projects').select('*').order('created_at',{ascending:false}),
        supabase.from('enquiries').select('*').order('created_at',{ascending:false}).limit(100)
      ]);
      if(!projectError && rows) setProjects(rows.map(r=>({id:r.id,title:r.title,category:r.category,description:r.description,image:r.image_url,label:r.label||'PROJECT'})));
      if(!leadError && leads) setEnquiries(leads);
      if(projectError || leadError) setMessage('Some dashboard data could not be loaded. Check your Supabase tables and access policies.');
    })();
  },[session]);
  async function signIn(e){
    e.preventDefault(); if(!supabase){setMessage('Connect Supabase in the environment settings before enabling secure owner login.');return;}
    setBusy(true);setMessage('');
    const {error}=await supabase.auth.signInWithPassword({email,password});
    setBusy(false);if(error)setMessage(error.message);
  }
  async function signOut(){if(supabase) await supabase.auth.signOut();setSession(null);}
  async function add(e){
    e.preventDefault();if(!supabase || !session){setMessage('Secure database connection is required.');return;}
    setBusy(true);setMessage('');
    const {data,error}=await supabase.from('projects').insert([{title:draft.title,category:draft.category,description:draft.description,image_url:draft.image,label:draft.label,published:true}]).select().single();
    setBusy(false);
    if(error){setMessage(error.message);return;}
    setProjects([{id:data.id,title:data.title,category:data.category,description:data.description,image:data.image_url,label:data.label||'PROJECT'},...projects]);
    setDraft({title:'',category:'Brand identity',description:'',image:'',label:'FEATURED WORK'});setMessage('Project published successfully.');
  }
  async function remove(id){
    if(!supabase || !window.confirm('Delete this portfolio project?')) return;
    const {error}=await supabase.from('projects').delete().eq('id',id);
    if(error){setMessage(error.message);return;}
    setProjects(projects.filter(p=>p.id!==id));setMessage('Project deleted.');
  }
  return <div className="admin-overlay"><div className="admin-panel">
    <div className="admin-top"><div><p className="eyebrow">ENVISION STUDIO</p><h2>Studio dashboard</h2></div><button className="modal-close" onClick={onClose}>✕</button></div>
    {!session ? <div className="admin-login"><div className="admin-lock">⌘</div><h3>Owner sign in</h3><p>Sign in with the administrator account created in your Supabase project. Public visitors cannot access this dashboard.</p><form onSubmit={signIn}><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="owner@example.com"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your secure password"/></label><button className="button button-dark" disabled={busy}>{busy?'Signing in...':'Sign in securely'} <Arrow/></button></form>{!supabase&&<p className="form-status error">Supabase is not configured yet. Add the environment variables described in README.md.</p>}{message&&<p className="form-status error">{message}</p>}</div>
    : <><div className="admin-bar"><span>Signed in as {session.user.email}</span><button onClick={signOut}>Sign out</button></div><div className="admin-warning">Owner dashboard connected. Access to projects and enquiries is controlled by Supabase authentication and database policies.</div>
      <div className="admin-tabs"><button className={tab==='projects'?'selected':''} onClick={()=>setTab('projects')}>Portfolio</button><button className={tab==='enquiries'?'selected':''} onClick={()=>setTab('enquiries')}>Enquiries ({enquiries.length})</button></div>
      {tab==='projects'?<><div className="admin-stats"><div><b>{projects.length}</b><span>Portfolio projects</span></div><div><b>6</b><span>Services listed</span></div><div><b>{enquiries.length}</b><span>Enquiries received</span></div></div>
      <h3>Add a portfolio project</h3><form className="admin-form" onSubmit={add}><label>Project title<input required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>Category<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>Image URL<input required type="url" value={draft.image} onChange={e=>setDraft({...draft,image:e.target.value})} placeholder="https://..."/></label><label>Description<textarea value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label><label>Image label<input value={draft.label} onChange={e=>setDraft({...draft,label:e.target.value})}/></label><button className="button button-dark" disabled={busy}>{busy?'Saving...':'Publish project'} <Arrow/></button></form>
      <h3 className="admin-list-title">Current projects</h3>{projects.map(p=><div className="admin-project" key={p.id}><img src={p.image} alt=""/><span>{p.title}<small>{p.category}</small></span><button onClick={()=>remove(p.id)}>Delete</button></div>)}</>
      :<><h3>Recent client enquiries</h3>{enquiries.length===0?<p className="form-note">No enquiries have been received yet.</p>:enquiries.map(q=><article className="enquiry-item" key={q.id}><div><b>{q.name}</b><small>{new Date(q.created_at).toLocaleString()}</small></div><p>{q.service} · {q.business||'No business name'}</p><p>{q.description}</p><a href={`mailto:${q.email}`}>{q.email}</a>{q.whatsapp&&<a href={`https://wa.me/${q.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">WhatsApp: {q.whatsapp}</a>}</article>)}</>}
      {message&&<p className="form-status">{message}</p>}
    </>}
  </div></div>;
}

export default function App() {
  const [page,setPage] = useState('home');
  const [filter,setFilter] = useState('All work');
  const [selected,setSelected] = useState(null);
  const [admin,setAdmin] = useState(false);
  const [projects,setProjects] = useState(initialProjects);
  useEffect(()=>{if(!supabase)return;supabase.from('projects').select('*').eq('published',true).order('created_at',{ascending:false}).then(({data,error})=>{if(!error&&data&&data.length)setProjects(data.map(r=>({id:r.id,title:r.title,category:r.category,description:r.description,image:r.image_url,label:r.label||'PROJECT'})))})},[]);
  useEffect(()=>{const hash=window.location.hash.replace('#','');if(hash)setPage(hash);const onHash=()=>setPage(window.location.hash.replace('#','')||'home');window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash)},[]);
  const visible = useMemo(()=>projects.filter(p=>filter==='All work'||p.category===filter),[projects,filter]);
  return <>
    <Header page={page} setPage={setPage}/>
    <main>
      <section className="hero" id="home">
        <div className="hero-bg-shape shape-one"></div><div className="hero-bg-shape shape-two"></div>
        <div className="hero-inner">
          <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot"></span> INDEPENDENT CREATIVE DESIGN STUDIO</p>
            <h1>Ideas,<br/><em>made visible.</em></h1>
            <p className="hero-lede">We turn good ideas into clear, compelling visuals that help brands get noticed, remembered and taken seriously.</p>
            <div className="hero-actions"><a className="button button-dark" href="#contact">Start a project <Arrow diagonal/></a><a className="text-link" href="#portfolio">Explore our work <Arrow/></a></div>
            <div className="hero-proof"><div className="proof-mark">✳</div><p><b>Thoughtful design.</b><br/>Made with purpose, not just decoration.</p></div>
          </div>
          <div className="hero-art" aria-label="Creative design project collage">
            <div className="art-note">A LITTLE<br/>MORE<br/><b>IMPACT.</b></div>
            <div className="art-poster"><span className="poster-kicker">ENVISION / VISUAL STUDY 01</span><strong>MAKE<br/><i>YOUR</i><br/>MARK.</strong><span className="poster-bottom">GOOD IDEAS DESERVE GOOD DESIGN.</span><div className="poster-orb"></div></div>
            <div className="art-card"><span>BRAND<br/>IN MOTION</span><b>✳</b></div>
            <div className="art-sticker">DESIGN<br/>WITH<br/>INTENT ↗</div>
            <div className="art-caption">SELECTED CREATIVE<br/>DIRECTION / 2026</div>
          </div>
        </div>
        <div className="hero-bottom"><span>BRANDING</span><i></i><span>DIGITAL DESIGN</span><i></i><span>VISUAL STORYTELLING</span><i></i><span>CREATIVE THINKING</span></div>
      </section>

      <section className="intro section-pad">
        <div className="intro-side"><p className="eyebrow">01 / THE STUDIO</p><span className="big-asterisk">✳</span></div>
        <div className="intro-main"><h2>Good design isn't just what people see. It's what they <em>understand,</em> remember and feel.</h2><p>Envision Studio is a creative design partner for businesses, entrepreneurs and people with something worth putting into the world. We bring ideas into focus through purposeful visual communication.</p><a className="under-link" href="#about">Get to know the studio <Arrow/></a></div>
      </section>

      <section className="services section-pad" id="services">
        <SectionHead eyebrow="02 / WHAT WE DO" title={<>Creative thinking.<br/><em>Practical impact.</em></>} copy="From the first spark of an idea to the final visual, we create design that gives your brand a clearer, stronger presence."/>
        <div className="service-grid">{services.map(s=><a className={`service-card ${s.color}`} key={s.n} href="#contact"><div className="service-top"><span>{s.n} / SERVICE</span><b>{s.icon}</b></div><h3>{s.title}</h3><p>{s.desc}</p><div className="service-foot"><span>{s.tag}</span><Arrow diagonal/></div></a>)}</div>
      </section>

      <section className="portfolio section-pad" id="portfolio">
        <div className="portfolio-head"><SectionHead eyebrow="03 / SELECTED WORK" title={<>A few ideas,<br/><em>out in the world.</em></>} copy="A growing collection of creative directions and visual explorations. Every project starts with a message worth getting right."/><a className="under-link desktop-link" href="#contact">Have a project in mind? <Arrow/></a></div>
        <div className="filter-row">{categories.map(c=><button key={c} onClick={()=>setFilter(c)} className={filter===c?'filter-active':''}>{c}</button>)}</div>
        <div className="project-grid">{visible.map(p=><ProjectCard key={p.id} project={p} onOpen={setSelected}/>)}</div>
        <p className="portfolio-disclaimer">Visual showcase includes illustrative concept work. Ask us about a direction tailored to your brand.</p>
      </section>

      <section className="manifesto" id="about">
        <div className="manifesto-left"><p className="eyebrow">04 / WHY ENVISION</p><div className="manifesto-symbol">E<span>.</span></div><p className="manifesto-small">A CREATIVE STUDIO<br/>BUILT AROUND IDEAS.</p></div>
        <div className="manifesto-right"><h2>We don't believe in design for design's sake.</h2><p>We believe every visual should do a job. It should make a message clearer, a product more desirable, a business more recognisable or an idea harder to ignore.</p><p>That means listening first, thinking carefully and creating with intention. No one-size-fits-all look. No decoration without direction.</p><a className="button button-light" href="#contact">Let's make something matter <Arrow diagonal/></a></div>
      </section>

      <section className="process section-pad">
        <SectionHead eyebrow="05 / HOW WE WORK" title={<>Simple process.<br/><em>Strong outcomes.</em></>} copy="A clear, collaborative journey from the first conversation to the final files."/>
        <div className="process-grid">{[['01','Listen','We learn about your business, audience, goals and the problem the design needs to solve.'],['02','Shape the idea','We develop a creative direction that gives your message the right look and feel.'],['03','Create & refine','We bring the direction to life, then refine the details with your feedback.'],['04','Deliver','You receive the agreed final design files, ready for their intended use.']].map(x=><div className="process-step" key={x[0]}><span>{x[0]}</span><div className="step-line"></div><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div>
      </section>

      <section className="contact section-pad" id="contact">
        <div className="contact-intro"><p className="eyebrow">06 / YOUR NEXT MOVE</p><h2>Have an idea?<br/><em>Let's give it shape.</em></h2><p>Tell us what you're working on. Whether you have a complete brief or just the beginning of an idea, we'd love to hear about it.</p>
          <div className="contact-direct"><span>QUICK CONTACT</span><a href={waLink()} target="_blank" rel="noreferrer">WhatsApp us <Arrow diagonal/></a><a href={FACEBOOK} target="_blank" rel="noreferrer">Find us on Facebook <Arrow diagonal/></a></div>
        </div>
        <EnquiryForm/>
      </section>
    </main>
    <footer className="footer"><div className="footer-top"><div><Mark light/><p>Thoughtful visuals for brands<br/>with something to say.</p></div><div className="footer-links"><span>EXPLORE</span><a href="#services">Services</a><a href="#portfolio">Portfolio</a><a href="#about">About</a><a href="#contact">Contact</a></div><div className="footer-links"><span>CONNECT</span><a href={waLink()} target="_blank" rel="noreferrer">WhatsApp <Arrow diagonal/></a><a href={FACEBOOK} target="_blank" rel="noreferrer">Facebook <Arrow diagonal/></a></div><div className="footer-note">LET'S MAKE<br/><em>GOOD THINGS</em><br/>VISIBLE.</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} ENVISION STUDIO. ALL RIGHTS RESERVED.</span><span>MADE WITH INTENTION. <b>✳</b></span><button onClick={()=>setAdmin(true)}>Studio access</button></div></footer>
    {selected&&<ProjectModal project={selected} onClose={()=>setSelected(null)}/>}
    {admin&&<Admin projects={projects} setProjects={setProjects} onClose={()=>setAdmin(false)}/>}
  </>;
}
