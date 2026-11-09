import React, { useEffect, useMemo, useState } from 'react';
import './business-operations.css';

const money = value => '₦' + Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 });
const slugify = value => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const emptyService = { name:'', category:'Brand Identity', description:'', starting_price:'', pricing_unit:'per_project', delivery_min_days:'', delivery_max_days:'', deliverables:'', revisions_included:2, add_ons:'[]', is_active:true, is_public:true, sort_order:10 };
const emptyQuote = { enquiry_id:'', client_name:'', client_email:'', client_whatsapp:'', project_title:'', project_brief:'', timeline:'', revisions_included:2, valid_until:'', deposit_percent:50, discount_amount:0, terms:'50% initial payment is required before production begins. Two reasonable revision rounds are included. Additional scope or revisions are quoted separately. Final files are delivered after the agreed payment terms are fulfilled.' };
const emptyItem = { service_id:'', service_name:'', description:'', quantity:1, unit_price:0 };

export default function BusinessOperations({ db, enquiries = [], onNotice = () => {} }) {
  const [section, setSection] = useState('catalogue');
  const [services, setServices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editingService, setEditingService] = useState(null);
  const [quoteForm, setQuoteForm] = useState(emptyQuote);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const say = message => { setNotice(message); onNotice(message); };
  const loadServices = async () => {
    const { data, error } = await db.from('service_catalogue').select('*').order('sort_order', { ascending:true });
    if (error) { say('Could not load service catalogue: ' + error.message); return; }
    setServices(data || []);
  };
  const loadQuotes = async () => {
    const { data, error } = await db.from('quotations').select('*').order('created_at', { ascending:false });
    if (error) { say('Could not load quotations: ' + error.message); return; }
    const rows = data || [];
    if (!rows.length) { setQuotes([]); return; }
    const ids = rows.map(row => row.id);
    const [itemResult, paymentResult] = await Promise.all([
      db.from('quotation_items').select('*').in('quotation_id', ids).order('sort_order'),
      db.from('payments').select('*').in('quotation_id', ids).order('created_at', { ascending:false })
    ]);
    if (itemResult.error) say('Could not load quotation items: ' + itemResult.error.message);
    if (paymentResult.error) say('Could not load payment records: ' + paymentResult.error.message);
    setQuotes(rows.map(row => ({
      ...row,
      items: (itemResult.data || []).filter(item => item.quotation_id === row.id),
      payments: (paymentResult.data || []).filter(payment => payment.quotation_id === row.id)
    })));
  };
  const refresh = async () => { await Promise.all([loadServices(), loadQuotes()]); };
  useEffect(() => { refresh(); }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => { const name = String(item.service_name || '').trim(); const quantity = Number(item.quantity || 0); const unitPrice = Number(item.unit_price || 0); return name && quantity > 0 && unitPrice >= 0 ? sum + quantity * unitPrice : sum; }, 0), [items]);
  const discount = Math.max(0, Number(quoteForm.discount_amount || 0));
  const total = Math.max(0, subtotal - discount);
  const initialPayment = total * Number(quoteForm.deposit_percent || 0) / 100;

  const updateService = (field, value) => setServiceForm(current => ({ ...current, [field]:value }));
  const saveService = async event => {
    event.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.category.trim()) return say('Add a service name and category first.');
    if (serviceForm.starting_price !== '' && Number(serviceForm.starting_price) < 0) return say('Starting price cannot be negative.');
    if (serviceForm.delivery_min_days !== '' && serviceForm.delivery_max_days !== '' && Number(serviceForm.delivery_max_days) < Number(serviceForm.delivery_min_days)) return say('Maximum delivery days cannot be lower than minimum delivery days.');
    let addOns;
    try { addOns = JSON.parse(serviceForm.add_ons || '[]'); if (!Array.isArray(addOns)) throw new Error(); }
    catch { return say('Optional add-ons must be valid JSON in an array. Use [] if there are none.'); }
    setBusy(true);
    const payload = {
      slug: slugify(serviceForm.name),
      name: serviceForm.name.trim(),
      category: serviceForm.category,
      description: serviceForm.description.trim(),
      starting_price: serviceForm.starting_price === '' ? null : Number(serviceForm.starting_price),
      pricing_unit: serviceForm.pricing_unit,
      delivery_min_days: serviceForm.delivery_min_days === '' ? null : Number(serviceForm.delivery_min_days),
      delivery_max_days: serviceForm.delivery_max_days === '' ? null : Number(serviceForm.delivery_max_days),
      deliverables: serviceForm.deliverables.split('\n').map(line => line.trim()).filter(Boolean),
      revisions_included: Number(serviceForm.revisions_included || 0),
      add_ons: addOns,
      is_active: !!serviceForm.is_active,
      is_public: !!serviceForm.is_public,
      sort_order: Number(serviceForm.sort_order || 0),
      updated_at: new Date().toISOString()
    };
    const result = editingService
      ? await db.from('service_catalogue').update(payload).eq('id', editingService)
      : await db.from('service_catalogue').insert(payload);
    setBusy(false);
    if (result.error) return say('Could not save service: ' + result.error.message);
    setServiceForm(emptyService); setEditingService(null);
    say('Service catalogue saved.'); await loadServices();
  };
  const editService = service => {
    setEditingService(service.id);
    setServiceForm({
      name:service.name, category:service.category, description:service.description || '',
      starting_price:service.starting_price ?? '', pricing_unit:service.pricing_unit || 'per_project',
      delivery_min_days:service.delivery_min_days ?? '', delivery_max_days:service.delivery_max_days ?? '',
      deliverables:(service.deliverables || []).join('\n'), revisions_included:service.revisions_included ?? 2,
      add_ons:JSON.stringify(service.add_ons || [], null, 2), is_active:service.is_active,
      is_public:service.is_public, sort_order:service.sort_order || 0
    });
    window.scrollTo({ top:0, behavior:'smooth' });
  };
  const toggleService = async service => {
    const { error } = await db.from('service_catalogue').update({ is_active:!service.is_active, updated_at:new Date().toISOString() }).eq('id', service.id);
    if (error) return say('Could not update service: ' + error.message);
    await loadServices(); say('Service availability updated.');
  };
  const deleteService = async service => {
    if (!window.confirm('Delete "' + service.name + '" from the service catalogue? Existing quotation line items will remain as saved snapshots.')) return;
    const { error } = await db.from('service_catalogue').delete().eq('id', service.id);
    if (error) return say('Could not delete service: ' + error.message);
    await loadServices(); say('Service deleted.');
  };

  const selectEnquiry = id => {
    const enquiry = enquiries.find(item => String(item.id) === String(id));
    setQuoteForm(current => ({
      ...current, enquiry_id:id,
      client_name:enquiry?.name || current.client_name,
      client_email:enquiry?.email || current.client_email,
      client_whatsapp:enquiry?.whatsapp || current.client_whatsapp,
      project_title:enquiry ? (enquiry.service || 'Design project') + ' for ' + enquiry.name : current.project_title,
      project_brief:enquiry?.description || current.project_brief
    }));
  };
  const updateItem = (index, field, value) => setItems(current => current.map((item, i) => i === index ? { ...item, [field]:value } : item));
  const chooseService = (index, serviceId) => {
    const service = services.find(item => item.id === serviceId);
    setItems(current => current.map((item, i) => i !== index ? item : service ? ({
      ...item, service_id:service.id, service_name:service.name,
      description:service.description || (service.deliverables || []).join(', '),
      unit_price:service.starting_price ?? 0, quantity:1
    }) : { ...item, ...emptyItem }));
  };
  const createQuote = async event => {
    event.preventDefault();
    if (!quoteForm.client_name.trim() || !quoteForm.project_title.trim()) return say('Client name and project title are required.');
    const cleanItems = items.filter(item => item.service_name.trim() && Number(item.quantity) > 0 && Number(item.unit_price) >= 0);
    if (!cleanItems.length) return say('Add at least one valid quotation line item.');
    if (discount > subtotal) return say('Discount cannot be greater than the subtotal.');
    if (!Number.isFinite(Number(quoteForm.deposit_percent)) || Number(quoteForm.deposit_percent) < 0 || Number(quoteForm.deposit_percent) > 100) return say('Initial payment must be between 0% and 100%.');
    const totalAmount = subtotal - discount;
    const deposit = totalAmount * Number(quoteForm.deposit_percent || 0) / 100;
    setBusy(true);
    const header = {
      enquiry_id:quoteForm.enquiry_id ? Number(quoteForm.enquiry_id) : null,
      client_name:quoteForm.client_name.trim(), client_email:quoteForm.client_email.trim() || null,
      client_whatsapp:quoteForm.client_whatsapp.trim() || null,
      project_title:quoteForm.project_title.trim(), project_brief:quoteForm.project_brief.trim(),
      timeline:quoteForm.timeline.trim() || null, revisions_included:Number(quoteForm.revisions_included || 0),
      valid_until:quoteForm.valid_until || null, deposit_percent:Number(quoteForm.deposit_percent || 0),
      subtotal, discount_amount:discount, total_amount:totalAmount, initial_payment_amount:deposit,
      terms:quoteForm.terms.trim()
    };
    const { data:quote, error } = await db.from('quotations').insert(header).select('*').single();
    if (error) { setBusy(false); return say('Could not create quotation: ' + error.message); }
    const lineRows = cleanItems.map((item, index) => ({
      quotation_id:quote.id, service_id:item.service_id || null,
      service_name:item.service_name.trim(), description:item.description.trim(),
      quantity:Number(item.quantity), unit_price:Number(item.unit_price), sort_order:index
    }));
    const { error:itemError } = await db.from('quotation_items').insert(lineRows);
    if (itemError) {
      await db.from('quotations').delete().eq('id', quote.id);
      setBusy(false); return say('Quotation was rolled back because its line items could not be saved: ' + itemError.message);
    }
    setBusy(false);
    setQuoteForm(emptyQuote); setItems([{ ...emptyItem }]); setSection('quotes');
    say('Quotation ' + quote.quote_number + ' created as a draft. It has not been sent to the client.');
    await loadQuotes();
  };
  const quoteMessage = quote => {
    const lines = (quote.items || []).map(item => '- ' + item.service_name + ' × ' + item.quantity + ': ' + money(item.line_total)).join('\n');
    return 'Hello ' + quote.client_name + ',\n\nThank you for considering AQREVO. Here is quotation ' + quote.quote_number + ' for ' + quote.project_title + '.\n\n' + lines + '\n\nSubtotal: ' + money(quote.subtotal) + '\nDiscount: ' + money(quote.discount_amount) + '\nTotal project fee: ' + money(quote.total_amount) + '\nInitial payment (' + quote.deposit_percent + '%): ' + money(quote.initial_payment_amount) + '\nRemaining balance after initial payment: ' + money(Number(quote.total_amount) - Number(quote.initial_payment_amount)) + '\nTimeline: ' + (quote.timeline || 'To be agreed') + '\nValid until: ' + (quote.valid_until || 'To be confirmed') + '\n\n' + quote.terms + '\n\nAQREVO — Make Ideas Iconic.';
  };
  const printQuote = quote => {
    const popup = window.open('', '_blank');
    if (!popup) return say('Allow pop-ups for this site to print a quotation.');
    const rows = (quote.items || []).map(item => '<tr><td>' + escapeHtml(item.service_name) + '<br><small>' + escapeHtml(item.description) + '</small></td><td>' + escapeHtml(item.quantity) + '</td><td>' + escapeHtml(money(item.unit_price)) + '</td><td>' + escapeHtml(money(item.line_total)) + '</td></tr>').join('');
    popup.document.write('<!doctype html><html><head><title>' + escapeHtml(quote.quote_number) + '</title><style>body{font:14px Arial,sans-serif;color:#17233b;padding:40px;max-width:850px;margin:auto}header{display:flex;justify-content:space-between;border-bottom:2px solid #17233b;padding-bottom:20px}h1{font-size:28px;margin:0}small{color:#667085}table{width:100%;border-collapse:collapse;margin:30px 0}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #ddd}th{background:#f3f5f8}.totals{margin-left:auto;width:280px}.totals p{display:flex;justify-content:space-between}.grand{font-size:20px;font-weight:bold;border-top:2px solid #17233b;padding-top:12px}.terms{white-space:pre-wrap;background:#f6f7f9;padding:18px;margin-top:25px}footer{margin-top:35px;border-top:1px solid #ddd;padding-top:14px;color:#667085;font-size:12px}@media print{body{padding:0}}</style></head><body><header><div><h1>AQREVO</h1><p>Make Ideas Iconic.</p></div><div style="text-align:right"><b>QUOTATION</b><p>' + escapeHtml(quote.quote_number) + '</p><small>Issued ' + escapeHtml(new Date(quote.created_at).toLocaleDateString()) + '</small></div></header><h2>' + escapeHtml(quote.project_title) + '</h2><p><b>Prepared for:</b> ' + escapeHtml(quote.client_name) + '<br>' + escapeHtml(quote.client_email || '') + '<br>' + escapeHtml(quote.client_whatsapp || '') + '</p><p>' + escapeHtml(quote.project_brief || '') + '</p><table><thead><tr><th>Service / Deliverable</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>' + rows + '</tbody></table><div class="totals"><p><span>Subtotal</span><b>' + escapeHtml(money(quote.subtotal)) + '</b></p><p><span>Discount</span><b>' + escapeHtml(money(quote.discount_amount)) + '</b></p><p class="grand"><span>Total</span><b>' + escapeHtml(money(quote.total_amount)) + '</b></p><p><span>Initial payment (' + escapeHtml(quote.deposit_percent) + '%)</span><b>' + escapeHtml(money(quote.initial_payment_amount)) + '</b></p><p><span>Balance</span><b>' + escapeHtml(money(Number(quote.total_amount)-Number(quote.initial_payment_amount))) + '</b></p></div><p><b>Timeline:</b> ' + escapeHtml(quote.timeline || 'To be agreed') + '<br><b>Included revisions:</b> ' + escapeHtml(quote.revisions_included) + '<br><b>Valid until:</b> ' + escapeHtml(quote.valid_until || 'To be confirmed') + '</p><div class="terms">' + escapeHtml(quote.terms) + '</div><footer>Thank you for considering AQREVO. This quotation is valid subject to the terms above. Contact us on WhatsApp: +234 706 692 3248.</footer><script>window.onload=()=>window.print();</script></body></html>');
    popup.document.close();
  };
  const updateQuoteStatus = async (quote, status) => {
    if (status === 'Sent' && quote.status !== 'Sent' && !window.confirm('Only mark this quotation as sent after you have actually sent it to the client. Continue?')) return;
    if (status === 'Accepted' && quote.status !== 'Accepted' && !window.confirm('Only mark this quotation as accepted after the client has explicitly agreed. Continue?')) return;
    const patch = { status, updated_at:new Date().toISOString() };
    if (status === 'Sent') patch.sent_at = new Date().toISOString();
    if (status === 'Accepted') patch.accepted_at = new Date().toISOString();
    const { error } = await db.from('quotations').update(patch).eq('id', quote.id);
    if (error) return say('Could not update quotation: ' + error.message);
    say('Quotation status updated to ' + status + '.'); await loadQuotes();
  };
  const changePaymentDraft = (id, field, value) => setPaymentDrafts(current => ({ ...current, [id]:{ ...(current[id] || {}), [field]:value } }));
  const recordPayment = async quote => {
    const draft = paymentDrafts[quote.id] || {};
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) return say('Enter a payment amount greater than zero.');
    const verified = (quote.payments || []).filter(payment => payment.status === 'Verified').reduce((sum,payment) => sum + Number(payment.amount), 0);
    if (verified + amount > Number(quote.total_amount)) return say('This payment would exceed the remaining balance.');
    const { error } = await db.from('payments').insert({
      quotation_id:quote.id, amount, payment_method:draft.method || 'Bank transfer',
      transaction_reference:(draft.reference || '').trim() || null,
      payment_date:draft.date || new Date().toISOString().slice(0,10), status:'Pending'
    });
    if (error) return say('Could not record payment: ' + error.message);
    setPaymentDrafts(current => ({ ...current, [quote.id]:{ amount:'', method:'Bank transfer', reference:'', date:'' } }));
    say('Payment recorded as pending verification.'); await loadQuotes();
  };
  const rejectPayment = async payment => {
    if (payment.status !== 'Pending') return;
    if (!window.confirm('Reject this payment record? It will not count toward the verified balance.')) return;
    const { error } = await db.from('payments').update({ status:'Rejected', verified_at:null, verified_by:null }).eq('id', payment.id);
    if (error) return say('Could not reject payment: ' + error.message);
    say('Payment marked as rejected.'); await loadQuotes();
  };
  const verifyPayment = async payment => {
    const status = payment.status === 'Verified' ? 'Pending' : 'Verified';
    if (status === 'Verified') {
      const quote = quotes.find(item => item.id === payment.quotation_id);
      const alreadyVerified = (quote?.payments || []).filter(item => item.status === 'Verified' && item.id !== payment.id).reduce((sum,item) => sum + Number(item.amount), 0);
      if (alreadyVerified + Number(payment.amount) > Number(quote?.total_amount || 0)) return say('This verification would exceed the quotation total. Review the payment records first.');
    }
    const { data:{ user } } = await db.auth.getUser();
    if (status === 'Verified' && !user) return say('Your admin session could not be verified. Sign in again before verifying this payment.');
    const { error } = await db.from('payments').update({ status, verified_at:status === 'Verified' ? new Date().toISOString() : null, verified_by:status === 'Verified' ? user.id : null }).eq('id', payment.id);
    if (error) return say('Could not update payment: ' + error.message);
    say(status === 'Verified' ? 'Payment verified. The balance has been recalculated.' : 'Payment verification reversed.'); await loadQuotes();
  };

  return <div className="business-ops">
    <div className="business-ops-heading"><div><p className="eyebrow">BUSINESS OPERATIONS</p><h3>Services, quotations & payments</h3><p className="form-note">Manage your service rates, prepare itemised quotes and keep verified payment records.</p></div></div>
    <div className="business-ops-tabs">
      <button className={section === 'catalogue' ? 'active' : ''} onClick={() => setSection('catalogue')}>Service catalogue ({services.length})</button>
      <button className={section === 'new-quote' ? 'active' : ''} onClick={() => setSection('new-quote')}>Create quotation</button>
      <button className={section === 'quotes' ? 'active' : ''} onClick={() => setSection('quotes')}>Quotation records ({quotes.length})</button>
    </div>
    {notice && <p className="form-status">{notice}</p>}
    {section === 'catalogue' && <div className="ops-catalogue">
      <h4>{editingService ? 'Edit service' : 'Add a service'}</h4>
      <form className="ops-form" onSubmit={saveService}>
        <label>Service name<input value={serviceForm.name} onChange={e=>updateService('name',e.target.value)} required placeholder="e.g. Premium flyer"/></label>
        <label>Department<select value={serviceForm.category} onChange={e=>updateService('category',e.target.value)}><option>Brand Identity</option><option>Digital Design</option><option>Advertising & Campaigns</option><option>Product Visuals</option><option>Creative Direction</option></select></label>
        <label className="wide">Description<textarea rows="2" value={serviceForm.description} onChange={e=>updateService('description',e.target.value)}/></label>
        <label>Starting price (NGN)<input type="number" min="0" step="100" value={serviceForm.starting_price} onChange={e=>updateService('starting_price',e.target.value)} placeholder="Leave blank for custom quote"/></label>
        <label>Pricing unit<select value={serviceForm.pricing_unit} onChange={e=>updateService('pricing_unit',e.target.value)}><option value="per_design">Per design</option><option value="per_package">Per package</option><option value="per_project">Per project</option><option value="custom">Custom quotation</option></select></label>
        <label>Minimum delivery days<input type="number" min="0" value={serviceForm.delivery_min_days} onChange={e=>updateService('delivery_min_days',e.target.value)}/></label>
        <label>Maximum delivery days<input type="number" min="0" value={serviceForm.delivery_max_days} onChange={e=>updateService('delivery_max_days',e.target.value)}/></label>
        <label>Included revision rounds<input type="number" min="0" value={serviceForm.revisions_included} onChange={e=>updateService('revisions_included',e.target.value)}/></label>
        <label>Display order<input type="number" value={serviceForm.sort_order} onChange={e=>updateService('sort_order',e.target.value)}/></label>
        <label className="wide">Included deliverables (one per line)<textarea rows="4" value={serviceForm.deliverables} onChange={e=>updateService('deliverables',e.target.value)} placeholder={'Primary logo concept\nFinal approved export\nBrand colour palette'}/></label>
        <label className="wide">Optional add-ons (JSON array)<textarea rows="2" value={serviceForm.add_ons} onChange={e=>updateService('add_ons',e.target.value)} placeholder='[{"name":"Rush delivery","price":2000}]'/></label>
        <label className="ops-check"><input type="checkbox" checked={serviceForm.is_active} onChange={e=>updateService('is_active',e.target.checked)}/> Available for new projects</label>
        <label className="ops-check"><input type="checkbox" checked={serviceForm.is_public} onChange={e=>updateService('is_public',e.target.checked)}/> Visible in public service listings</label>
        <div className="ops-actions wide"><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : editingService ? 'Update service' : 'Add service'}</button>{editingService&&<button type="button" className="button" onClick={()=>{setEditingService(null);setServiceForm(emptyService)}}>Cancel edit</button>}</div>
      </form>
      <h4>Current services</h4>
      <div className="ops-service-list">{services.map(service=><article className="ops-service-row" key={service.id}><div><small>{service.category}</small><b>{service.name}</b><p>{service.description}</p><span>{service.starting_price == null ? 'Custom quote' : money(service.starting_price)} · {service.pricing_unit.replaceAll('_',' ')} · {(service.deliverables||[]).length} deliverables</span></div><div className="ops-row-actions"><button onClick={()=>editService(service)}>Edit</button><button onClick={()=>toggleService(service)}>{service.is_active?'Deactivate':'Activate'}</button><button onClick={()=>deleteService(service)}>Delete</button></div></article>)}</div>
    </div>}
    {section === 'new-quote' && <form className="ops-form quote-create-form" onSubmit={createQuote}>
      <h4 className="wide">Client & project</h4>
      <label className="wide">Start from an enquiry (optional)<select value={quoteForm.enquiry_id} onChange={e=>selectEnquiry(e.target.value)}><option value="">Create a quote without an enquiry</option>{enquiries.map(enquiry=><option key={enquiry.id} value={enquiry.id}>{enquiry.name} — {enquiry.service} ({new Date(enquiry.created_at).toLocaleDateString()})</option>)}</select></label>
      <label>Client name<input value={quoteForm.client_name} onChange={e=>setQuoteForm(v=>({...v,client_name:e.target.value}))} required/></label>
      <label>Client email<input type="email" value={quoteForm.client_email} onChange={e=>setQuoteForm(v=>({...v,client_email:e.target.value}))}/></label>
      <label>Client WhatsApp<input value={quoteForm.client_whatsapp} onChange={e=>setQuoteForm(v=>({...v,client_whatsapp:e.target.value}))}/></label>
      <label>Project title<input value={quoteForm.project_title} onChange={e=>setQuoteForm(v=>({...v,project_title:e.target.value}))} required/></label>
      <label className="wide">Project brief<textarea rows="3" value={quoteForm.project_brief} onChange={e=>setQuoteForm(v=>({...v,project_brief:e.target.value}))}/></label>
      <h4 className="wide">Quotation line items</h4>
      {items.map((item,index)=><div className="ops-line-item wide" key={index}>
        <label>Choose service<select value={item.service_id} onChange={e=>chooseService(index,e.target.value)}><option value="">Custom line item</option>{services.map(service=><option key={service.id} value={service.id}>{service.name} {service.starting_price == null ? '(custom)' : '— '+money(service.starting_price)}</option>)}</select></label>
        <label>Line item name<input value={item.service_name} onChange={e=>updateItem(index,'service_name',e.target.value)} required/></label>
        <label className="wide">Description / deliverables<textarea rows="2" value={item.description} onChange={e=>updateItem(index,'description',e.target.value)}/></label>
        <label>Quantity<input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e=>updateItem(index,'quantity',e.target.value)}/></label>
        <label>Unit price (NGN)<input type="number" min="0" step="100" value={item.unit_price} onChange={e=>updateItem(index,'unit_price',e.target.value)}/></label>
        <b className="ops-line-total">Line total: {money(Number(item.quantity||0)*Number(item.unit_price||0))}</b>
        {items.length>1&&<button type="button" className="ops-remove" onClick={()=>setItems(current=>current.filter((_,i)=>i!==index))}>Remove line</button>}
      </div>)}
      <button type="button" className="button ops-add-line wide" onClick={()=>setItems(current=>[...current,{...emptyItem}])}>+ Add another line item</button>
      <label>Discount (NGN)<input type="number" min="0" step="100" value={quoteForm.discount_amount} onChange={e=>setQuoteForm(v=>({...v,discount_amount:e.target.value}))}/></label>
      <label>Initial payment (%)<input type="number" min="0" max="100" step="1" value={quoteForm.deposit_percent} onChange={e=>setQuoteForm(v=>({...v,deposit_percent:e.target.value}))}/></label>
      <label>Project timeline<input value={quoteForm.timeline} onChange={e=>setQuoteForm(v=>({...v,timeline:e.target.value}))} placeholder="e.g. 3–5 working days"/></label>
      <label>Quotation valid until<input type="date" value={quoteForm.valid_until} onChange={e=>setQuoteForm(v=>({...v,valid_until:e.target.value}))}/></label>
      <label>Included revision rounds<input type="number" min="0" value={quoteForm.revisions_included} onChange={e=>setQuoteForm(v=>({...v,revisions_included:e.target.value}))}/></label>
      <label className="wide">Terms & conditions<textarea rows="4" value={quoteForm.terms} onChange={e=>setQuoteForm(v=>({...v,terms:e.target.value}))}/></label>
      <div className="ops-quote-summary wide"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Discount</span><b>{money(discount)}</b></div><div className="total"><span>Total quotation</span><b>{money(total)}</b></div><div><span>Initial payment ({quoteForm.deposit_percent}%)</span><b>{money(initialPayment)}</b></div><div><span>Remaining balance</span><b>{money(total-initialPayment)}</b></div></div>
      <div className="ops-actions wide"><button className="button button-dark" disabled={busy}>{busy?'Creating…':'Save quotation draft'}</button><small>Saving creates an internal draft only. It does not send anything to the client or mark it as sent.</small></div>
    </form>}
    {section === 'quotes' && <div className="ops-quotes">
      <h4>Quotation records</h4>
      {!quotes.length ? <p className="form-note">No itemised quotations have been created yet.</p> : quotes.map(quote=>{
        const paid = (quote.payments||[]).filter(payment=>payment.status==='Verified').reduce((sum,payment)=>sum+Number(payment.amount),0);
        const balance = Math.max(0,Number(quote.total_amount)-paid);
        return <article className="ops-quote-card" key={quote.id}>
          <div className="ops-quote-card-head"><div><small>{quote.quote_number} · {new Date(quote.created_at).toLocaleDateString()}</small><h5>{quote.project_title}</h5><p>{quote.client_name} {quote.client_email?'· '+quote.client_email:''}</p></div><select value={quote.status} onChange={e=>updateQuoteStatus(quote,e.target.value)} aria-label={'Status for '+quote.quote_number}><option>Draft</option><option>Sent</option><option>Accepted</option><option>Declined</option><option>Expired</option><option>Cancelled</option></select></div>
          <div className="ops-quote-figures"><div><small>Total</small><b>{money(quote.total_amount)}</b></div><div><small>Verified payments</small><b>{money(paid)}</b></div><div><small>Outstanding</small><b>{money(balance)}</b></div></div>
          <details className="ops-quote-details"><summary>View line items & payment history</summary><div className="ops-quote-items">{(quote.items||[]).map(item=><div key={item.id}><span>{item.service_name} × {item.quantity}<small>{item.description}</small></span><b>{money(item.line_total)}</b></div>)}</div><div className="ops-quote-items"><b>Payment records</b>{(quote.payments||[]).length ? quote.payments.map(payment=><div key={payment.id}><span>{money(payment.amount)} · {payment.payment_method || 'Payment'}<small>{payment.payment_date} · {payment.transaction_reference || 'No reference'} · {payment.status}</small></span>{payment.status==='Pending'&&<><button onClick={()=>verifyPayment(payment)}>Verify payment</button><button onClick={()=>rejectPayment(payment)}>Reject payment</button></>}{payment.status==='Verified'&&<button onClick={()=>verifyPayment(payment)}>Undo verification</button>}</div>) : <small>No payments recorded.</small>}</div></details>
          <div className="ops-share-actions"><button onClick={()=>printQuote(quote)}>Print / Save PDF</button>{quote.client_whatsapp&&<a target="_blank" rel="noreferrer" href={'https://wa.me/'+quote.client_whatsapp.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(quoteMessage(quote))}>Open WhatsApp message ↗</a>}{quote.client_email&&<a href={'mailto:'+encodeURIComponent(quote.client_email)+'?subject='+encodeURIComponent('Quotation '+quote.quote_number+' — AQREVO')+'&body='+encodeURIComponent(quoteMessage(quote))}>Prepare email ↗</a>}</div>
          <div className="ops-payment-form"><b>Record a payment</b><div><input aria-label="Payment amount" type="number" min="1" placeholder="Amount (NGN)" value={paymentDrafts[quote.id]?.amount||''} onChange={e=>changePaymentDraft(quote.id,'amount',e.target.value)}/><select aria-label="Payment method" value={paymentDrafts[quote.id]?.method||'Bank transfer'} onChange={e=>changePaymentDraft(quote.id,'method',e.target.value)}><option>Bank transfer</option><option>Cash</option><option>Mobile transfer</option><option>Other</option></select><input aria-label="Transaction reference" placeholder="Transaction reference" value={paymentDrafts[quote.id]?.reference||''} onChange={e=>changePaymentDraft(quote.id,'reference',e.target.value)}/><button onClick={()=>recordPayment(quote)}>Save pending payment</button></div><small>Only mark a payment verified after checking the actual transaction in your account. A screenshot alone is not proof of cleared funds.</small></div>
        </article>;
      })}
    </div>}
  </div>;
}
