import React, { useEffect, useMemo, useState } from 'react';

const money = value => new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(value||0));
const blankService = {slug:'',name:'',department:'Brand Identity',description:'',starting_price:'',pricing_unit:'per project',delivery_estimate:'Agreed per brief',inclusionsText:'',revision_rounds:2,show_publicly:false,is_active:true,sort_order:100};
const blankItem = () => ({service_id:'',description:'',quantity:1,unit_price:0});
const defaultTerms = 'Two reasonable revision rounds are included unless stated otherwise. Additional work outside the approved scope will be quoted separately. Production begins after the agreed initial payment. Final delivery follows the agreed payment terms.';

export default function AqrevoAdmin({db,onNotice}) {
  const [view,setView]=useState('catalog');
  const [services,setServices]=useState([]);
  const [quotes,setQuotes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [serviceDraft,setServiceDraft]=useState(blankService);
  const [editingService,setEditingService]=useState(null);
  const [quote,setQuote]=useState({client_name:'',client_email:'',client_whatsapp:'',business_name:'',project_title:'',scope:'',delivery_estimate:'To be agreed',revision_rounds:2,discount_amount:0,deposit_percent:50,valid_until:'',terms:defaultTerms});
  const [items,setItems]=useState([blankItem()]);

  const refresh=async()=>{
    setLoading(true);
    const [{data:s,error:se},{data:q,error:qe}]=await Promise.all([
      db.from('service_catalog').select('*').order('sort_order').order('name'),
      db.from('quotations').select('*').order('created_at',{ascending:false})
    ]);
    if(se)onNotice('Could not load service catalogue: '+se.message);else setServices(s||[]);
    if(qe)onNotice('Could not load quotations: '+qe.message);else setQuotes(q||[]);
    setLoading(false);
  };
  useEffect(()=>{refresh()},[]);

  const subtotal=useMemo(()=>items.reduce((sum,item)=>sum+(Number(item.quantity)||0)*(Number(item.unit_price)||0),0),[items]);
  const discount=Math.min(Math.max(0,Number(quote.discount_amount)||0),subtotal);
  const total=Math.max(0,subtotal-discount);
  const deposit=Math.round(total*(Math.min(100,Math.max(0,Number(quote.deposit_percent)||0))/100));
  const balance=total-deposit;

  const editService=service=>{
    setEditingService(service.id);
    setServiceDraft({...service,inclusionsText:(service.inclusions||[]).join('\n'),starting_price:String(service.starting_price??'')});
    setView('catalog');
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const saveService=async event=>{
    event.preventDefault();
    if(!serviceDraft.name.trim()||!serviceDraft.slug.trim()){onNotice('Add a service name and a unique URL slug.');return}
    setSaving(true);
    const payload={slug:serviceDraft.slug.trim().toLowerCase().replace(/\s+/g,'-'),name:serviceDraft.name.trim(),department:serviceDraft.department,description:serviceDraft.description.trim(),starting_price:Number(serviceDraft.starting_price)||0,pricing_unit:serviceDraft.pricing_unit.trim()||'per project',delivery_estimate:serviceDraft.delivery_estimate.trim()||'Agreed per brief',inclusions:serviceDraft.inclusionsText.split('\n').map(v=>v.trim()).filter(Boolean),revision_rounds:Number(serviceDraft.revision_rounds)||0,show_publicly:!!serviceDraft.show_publicly,is_active:!!serviceDraft.is_active,sort_order:Number(serviceDraft.sort_order)||0,updated_at:new Date().toISOString()};
    const result=editingService?await db.from('service_catalog').update(payload).eq('id',editingService):await db.from('service_catalog').insert(payload);
    setSaving(false);
    if(result.error){onNotice('Could not save service: '+result.error.message);return}
    onNotice('Service saved.');setEditingService(null);setServiceDraft(blankService);await refresh();
  };
  const removeService=async id=>{
    if(!window.confirm('Deactivate this service? Existing quotation records will be preserved.'))return;
    const {error}=await db.from('service_catalog').update({is_active:false,show_publicly:false}).eq('id',id);
    onNotice(error?'Could not deactivate service: '+error.message:'Service deactivated.');await refresh();
  };
  const addItem=()=>setItems(v=>[...v,blankItem()]);
  const updateItem=(index,field,value)=>setItems(v=>v.map((item,i)=>i===index?{...item,[field]:value}:item));
  const chooseService=(index,id)=>{
    const service=services.find(s=>s.id===id);
    setItems(v=>v.map((item,i)=>i===index?{...item,service_id:id,description:service?.name||item.description,unit_price:Number(service?.starting_price)||0}:item));
  };
  const removeItem=index=>setItems(v=>v.length===1?v:[...v.filter((_,i)=>i!==index)]);
  const resetQuote=()=>{setQuote({client_name:'',client_email:'',client_whatsapp:'',business_name:'',project_title:'',scope:'',delivery_estimate:'To be agreed',revision_rounds:2,discount_amount:0,deposit_percent:50,valid_until:'',terms:defaultTerms});setItems([blankItem()])};
  const saveQuote=async event=>{
    event.preventDefault();
    if(!quote.client_name.trim()||!quote.project_title.trim()||!items.some(i=>i.description.trim())){onNotice('Add the client name, project title and at least one quotation line.');return}
    if(total<=0){onNotice('The quotation total must be greater than zero.');return}
    setSaving(true);
    const payload={client_name:quote.client_name.trim(),client_email:quote.client_email.trim()||null,client_whatsapp:quote.client_whatsapp.trim()||null,business_name:quote.business_name.trim()||null,project_title:quote.project_title.trim(),scope:quote.scope.trim(),delivery_estimate:quote.delivery_estimate.trim()||'To be agreed',revision_rounds:Number(quote.revision_rounds)||0,subtotal,discount_amount:discount,total_amount:total,deposit_percent:Number(quote.deposit_percent)||0,deposit_amount:deposit,balance_amount:balance,valid_until:quote.valid_until||null,terms:quote.terms.trim()||defaultTerms,status:'Draft',updated_at:new Date().toISOString()};
    const {data:created,error}=await db.from('quotations').insert(payload).select('*').single();
    if(error){setSaving(false);onNotice('Could not create quotation: '+error.message);return}
    const rows=items.filter(i=>i.description.trim()).map((item,index)=>({quotation_id:created.id,service_id:item.service_id||null,description:item.description.trim(),quantity:Number(item.quantity)||1,unit_price:Number(item.unit_price)||0,line_total:(Number(item.quantity)||1)*(Number(item.unit_price)||0),sort_order:index}));
    const {error:itemError}=await db.from('quotation_items').insert(rows);
    if(itemError){await db.from('quotations').delete().eq('id',created.id);setSaving(false);onNotice('Quotation items could not be saved; the incomplete quotation was rolled back. '+itemError.message);return}
    setSaving(false);onNotice('Quotation '+created.quote_number+' saved as a draft.');resetQuote();setView('quotes');await refresh();
  };
  const markSent=async id=>{
    if(!window.confirm('Only continue if you have actually sent this quotation to the client. Mark it as sent?'))return;
    const {error}=await db.from('quotations').update({status:'Sent',sent_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
    onNotice(error?'Could not update quotation: '+error.message:'Quotation marked as sent.');await refresh();
  };
  const quoteMessage=async q=>{
    const {data:lines,error}=await db.from('quotation_items').select('*').eq('quotation_id',q.id).order('sort_order');
    if(error){onNotice('Could not load quotation items: '+error.message);return}
    const message='AQREVO — THE CREATIVE HOUSE\n'+q.quote_number+'\n\nHello '+q.client_name+',\n\nProject: '+q.project_title+'\n'+lines.map(l=>'- '+l.description+' × '+l.quantity+': '+money(l.line_total)).join('\n')+'\n\nSubtotal: '+money(q.subtotal)+'\nDiscount: '+money(q.discount_amount)+'\nTotal: '+money(q.total_amount)+'\nInitial payment ('+q.deposit_percent+'%): '+money(q.deposit_amount)+'\nBalance: '+money(q.balance_amount)+'\n\nScope: '+(q.scope||'As discussed')+'\nDelivery: '+q.delivery_estimate+'\nValid until: '+(q.valid_until||'To be agreed')+'\n\n'+q.terms+'\n\nMake Ideas Iconic. — AQREVO';
    try{await navigator.clipboard.writeText(message);onNotice('Quotation text copied. Paste it into WhatsApp or email.')}catch{onNotice('Clipboard access was blocked. Open the quotation and copy its details manually.')}
  };
  const statusChange=async(q,status)=>{
    if(status==='Accepted'&&!window.confirm('Confirm that the client has accepted this quotation?'))return;
    const patch={status,updated_at:new Date().toISOString()};
    if(status==='Accepted')patch.accepted_at=new Date().toISOString();
    const {error}=await db.from('quotations').update(patch).eq('id',q.id);
    onNotice(error?'Could not update quotation: '+error.message:'Quotation status updated.');await refresh();
  };

  return <section className="aq-admin">
    <div className="aq-head"><div><p className="eyebrow">AQREVO / BUSINESS TOOLS</p><h3>Services & quotations</h3><p className="form-note">Manage your service catalogue and prepare detailed client quotations.</p></div><div className="aq-switch"><button type="button" className={view==='catalog'?'active':''} onClick={()=>setView('catalog')}>Service catalogue</button><button type="button" className={view==='newquote'?'active':''} onClick={()=>setView('newquote')}>New quotation</button><button type="button" className={view==='quotes'?'active':''} onClick={()=>setView('quotes')}>Saved quotations ({quotes.length})</button></div></div>
    {loading?<p className="form-note">Loading business tools…</p>:view==='catalog'?<div className="aq-layout">
      <form className="admin-form aq-service-form" onSubmit={saveService}>
        <h4>{editingService?'Edit service':'Add a service'}</h4>
        <label>Service name<input required value={serviceDraft.name} onChange={e=>setServiceDraft(v=>({...v,name:e.target.value,slug:v.slug||e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}))}/></label>
        <label>URL slug<input required value={serviceDraft.slug} onChange={e=>setServiceDraft(v=>({...v,slug:e.target.value}))}/></label>
        <label>Department<select value={serviceDraft.department} onChange={e=>setServiceDraft(v=>({...v,department:e.target.value}))}>{['Brand Identity','Digital Design','Advertising & Campaigns','Product Visuals','Creative Direction'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Client-facing description<textarea rows="3" value={serviceDraft.description} onChange={e=>setServiceDraft(v=>({...v,description:e.target.value}))}/></label>
        <div className="aq-fields"><label>Starting price (NGN)<input type="number" min="0" step="500" value={serviceDraft.starting_price} onChange={e=>setServiceDraft(v=>({...v,starting_price:e.target.value}))}/></label><label>Pricing unit<input value={serviceDraft.pricing_unit} onChange={e=>setServiceDraft(v=>({...v,pricing_unit:e.target.value}))}/></label></div>
        <label>Delivery estimate<input value={serviceDraft.delivery_estimate} onChange={e=>setServiceDraft(v=>({...v,delivery_estimate:e.target.value}))}/></label>
        <label>Included deliverables (one per line)<textarea rows="4" value={serviceDraft.inclusionsText} onChange={e=>setServiceDraft(v=>({...v,inclusionsText:e.target.value}))}/></label>
        <div className="aq-fields"><label>Revision rounds<input type="number" min="0" max="10" value={serviceDraft.revision_rounds} onChange={e=>setServiceDraft(v=>({...v,revision_rounds:e.target.value}))}/></label><label>Display order<input type="number" value={serviceDraft.sort_order} onChange={e=>setServiceDraft(v=>({...v,sort_order:e.target.value}))}/></label></div>
        <label className="aq-check"><input type="checkbox" checked={serviceDraft.is_active} onChange={e=>setServiceDraft(v=>({...v,is_active:e.target.checked}))}/> Active service</label>
        <label className="aq-check"><input type="checkbox" checked={serviceDraft.show_publicly} onChange={e=>setServiceDraft(v=>({...v,show_publicly:e.target.checked}))}/> Show on public pricing guide (future integration)</label>
        <div className="aq-buttons"><button className="button button-dark" disabled={saving}>{saving?'Saving…':editingService?'Update service':'Save service'}</button>{editingService&&<button type="button" className="button" onClick={()=>{setEditingService(null);setServiceDraft(blankService)}}>Cancel</button>}</div>
      </form>
      <div className="aq-service-list"><h4>Current services ({services.length})</h4>{services.map(s=><article className="aq-service" key={s.id}><div><b>{s.name}</b><small>{s.department} · {s.pricing_unit}</small><p>{s.description}</p><strong>{s.starting_price?money(s.starting_price):'Custom quote'}</strong><small>{s.is_active?'Active':'Inactive'} · {s.revision_rounds} revision rounds · {s.delivery_estimate}</small></div><div><button type="button" onClick={()=>editService(s)}>Edit</button><button type="button" onClick={()=>removeService(s.id)} disabled={!s.is_active}>Deactivate</button></div></article>)}</div>
    </div>:view==='newquote'?<form className="admin-form aq-quote-form" onSubmit={saveQuote}>
      <h4>Prepare a client quotation</h4>
      <div className="aq-fields"><label>Client name *<input required value={quote.client_name} onChange={e=>setQuote(v=>({...v,client_name:e.target.value}))}/></label><label>Business / brand<input value={quote.business_name} onChange={e=>setQuote(v=>({...v,business_name:e.target.value}))}/></label><label>Email<input type="email" value={quote.client_email} onChange={e=>setQuote(v=>({...v,client_email:e.target.value}))}/></label><label>WhatsApp<input value={quote.client_whatsapp} onChange={e=>setQuote(v=>({...v,client_whatsapp:e.target.value}))}/></label></div>
      <label>Project title *<input required value={quote.project_title} onChange={e=>setQuote(v=>({...v,project_title:e.target.value}))}/></label>
      <label>Project scope<textarea rows="3" value={quote.scope} onChange={e=>setQuote(v=>({...v,scope:e.target.value}))} placeholder="Describe the agreed work, purpose and boundaries."/></label>
      <h4>Quotation items</h4>
      {items.map((item,index)=><div className="aq-line-item" key={index}>
        <label>Choose a catalogue service<select value={item.service_id} onChange={e=>chooseService(index,e.target.value)}><option value="">Custom line item</option>{services.filter(s=>s.is_active).map(s=><option key={s.id} value={s.id}>{s.name} — {money(s.starting_price)}</option>)}</select></label>
        <label>Line description<input value={item.description} onChange={e=>updateItem(index,'description',e.target.value)} required/></label>
        <div className="aq-fields"><label>Quantity<input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e=>updateItem(index,'quantity',e.target.value)}/></label><label>Unit price (NGN)<input type="number" min="0" step="100" value={item.unit_price} onChange={e=>updateItem(index,'unit_price',e.target.value)}/></label></div>
        <div className="aq-line-bottom"><b>{money(Number(item.quantity)*Number(item.unit_price))}</b><button type="button" onClick={()=>removeItem(index)}>Remove line</button></div>
      </div>)}
      <button type="button" className="button" onClick={addItem}>+ Add another line</button>
      <div className="aq-fields"><label>Delivery estimate<input value={quote.delivery_estimate} onChange={e=>setQuote(v=>({...v,delivery_estimate:e.target.value}))}/></label><label>Included revision rounds<input type="number" min="0" max="10" value={quote.revision_rounds} onChange={e=>setQuote(v=>({...v,revision_rounds:e.target.value}))}/></label><label>Discount (NGN)<input type="number" min="0" value={quote.discount_amount} onChange={e=>setQuote(v=>({...v,discount_amount:e.target.value}))}/></label><label>Initial payment (%)<input type="number" min="0" max="100" value={quote.deposit_percent} onChange={e=>setQuote(v=>({...v,deposit_percent:e.target.value}))}/></label><label>Quotation valid until<input type="date" value={quote.valid_until} onChange={e=>setQuote(v=>({...v,valid_until:e.target.value}))}/></label></div>
      <label>Terms & conditions<textarea rows="4" value={quote.terms} onChange={e=>setQuote(v=>({...v,terms:e.target.value}))}/></label>
      <div className="aq-total"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Discount</span><b>− {money(discount)}</b></div><div className="grand"><span>Total</span><b>{money(total)}</b></div><div><span>Initial payment</span><b>{money(deposit)}</b></div><div><span>Balance</span><b>{money(balance)}</b></div></div>
      <button className="button button-dark" disabled={saving}>{saving?'Saving quotation…':'Save quotation as draft'} ↗</button>
      <p className="form-note">Saving creates a draft only. It does not send anything to the client or mark the quotation as accepted.</p>
    </form>:<div className="aq-quotes-list"><h4>Saved quotations</h4>{quotes.length===0?<p className="form-note">No quotations created yet.</p>:quotes.map(q=><article className="aq-quote-card" key={q.id}><div><b>{q.quote_number} · {q.project_title}</b><small>{q.client_name}{q.business_name?' · '+q.business_name:''} · {new Date(q.created_at).toLocaleDateString()}</small><strong>{money(q.total_amount)}</strong><small>Deposit {money(q.deposit_amount)} · Balance {money(q.balance_amount)} · Valid until {q.valid_until||'Not set'}</small></div><span className={'aq-status '+q.status.toLowerCase()}>{q.status}</span><div className="aq-buttons"><button type="button" onClick={()=>quoteMessage(q)}>Copy message</button>{q.status==='Draft'&&<button type="button" onClick={()=>markSent(q.id)}>Mark sent</button>}{q.status==='Sent'&&<><button type="button" onClick={()=>statusChange(q,'Accepted')}>Record accepted</button><button type="button" onClick={()=>statusChange(q,'Declined')}>Record declined</button></>}</div></article>)}</div>}
  </section>;
}
