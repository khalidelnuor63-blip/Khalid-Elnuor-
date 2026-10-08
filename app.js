const K={customers:"ke_customers",invoices:"ke_invoices",settings:"ke_settings",template:"ke_template"};
const $=id=>document.getElementById(id);

let customers=JSON.parse(localStorage.getItem(K.customers)||"[]");
let invoices=JSON.parse(localStorage.getItem(K.invoices)||"[]");
let settings=JSON.parse(localStorage.getItem(K.settings)||'{"name":"KHALID ELNUOR","desc":"AI AUTOMATION & DIGITAL SOLUTIONS","provider":"STARLINK","disclaimer":"هذا المستند كشف سداد غير رسمي أُعد لأغراض العرض والتنظيم فقط، وليس فاتورة رسمية صادرة عن Starlink أو أي جهة أخرى."}');
let template=localStorage.getItem(K.template)||"classic";
let editingInvoice=null;

function save(){
  localStorage.setItem(K.customers,JSON.stringify(customers));
  localStorage.setItem(K.invoices,JSON.stringify(invoices));
  localStorage.setItem(K.settings,JSON.stringify(settings));
  localStorage.setItem(K.template,template);
}

function go(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  const target=$(page); if(!target)return;
  target.classList.add("active");
  document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  if(page==="dashboard")renderDashboard();
  if(page==="customers")renderCustomers();
  if(page==="records")renderRecords();
  if(page==="new"){populateCustomers();prepareNewIfNeeded();renderPreview();}
  if(page==="settings")loadSettings();
  $("sidebar")?.classList.remove("open");
  window.scrollTo(0,0);
}

document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");

function nextNo(){
  const y=new Date().getFullYear();
  const nums=invoices.map(x=>String(x.number||"")).filter(n=>n.startsWith("INV-"+y+"-")).map(n=>Number(n.split("-").pop())).filter(Number.isFinite);
  const n=(nums.length?Math.max(...nums):0)+1;
  return `INV-${y}-${String(n).padStart(5,"0")}`;
}

function populateCustomers(){
  const s=$("customerSelect");
  const current=s.value;
  s.innerHTML='<option value="">-- اختر عميلًا --</option>'+
    customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} — ${esc(c.account||"بدون حساب")}</option>`).join("");
  if(customers.some(c=>c.id===current))s.value=current;
}

function prepareNewIfNeeded(){
  if(editingInvoice)return;
  if(!$("fNumber").value)$("fNumber").value=nextNo();
  if(!$("fService").value)$("fService").value="تجديد الاشتراك الشهري";
  if(!$("fStatus").value)$("fStatus").value="PENDING";
  if(!$("fCurrency").value)$("fCurrency").value="USD";
  if(!$("fOriginal").value)$("fOriginal").value=100;
  if(!$("fUSD").value)$("fUSD").value=100;
  if(!$("fRate").value)$("fRate").value=8940;
  if(!$("fNote").value)$("fNote").value=settings.disclaimer;
}

$("customerSelect").addEventListener("change",()=>{
  const c=customers.find(x=>x.id===$("customerSelect").value);
  if(c)$("fAccount").value=c.account||"";
  renderPreview();
});

["fAccount","fService","fStatus","fOriginal","fCurrency","fUSD","fRate","fNote"].forEach(id=>{
  $(id).addEventListener("input",renderPreview);
  $(id).addEventListener("change",renderPreview);
});

function formData(){
  const c=customers.find(x=>x.id===$("customerSelect").value);
  return {
    number:$("fNumber").value||editingInvoice?.number||nextNo(),
    customer:c?.name||"عميل غير محدد",
    customerId:c?.id||"",
    account:$("fAccount").value.trim(),
    service:$("fService").value.trim(),
    status:$("fStatus").value,
    original:Number($("fOriginal").value||0),
    currency:$("fCurrency").value,
    usd:Number($("fUSD").value||0),
    rate:Number($("fRate").value||0),
    note:$("fNote").value.trim(),
    date:editingInvoice?.date||new Date().toISOString(),
    template
  };
}

function renderPreview(){
  if(!$("invoicePreview"))return;
  const d=formData();
  const total=d.usd*d.rate;
  const cls=d.status==="PAID"?"paid":d.status==="CANCELLED"?"cancelled":"pending";
  const status=d.status==="PAID"?"مدفوع — PAID":d.status==="CANCELLED"?"ملغي — CANCELLED":"مستحق الدفع — PENDING";
  $("invoicePreview").innerHTML=`<div class="invoice ${esc(d.template)}">
    <div class="brandrow">
      <div class="invbrand"><div class="invlogo">KE</div><div><b>${esc(settings.name)}</b><small>${esc(settings.desc)}</small></div></div>
      <div class="provider">${esc(settings.provider)}<small>UNOFFICIAL PAYMENT SUMMARY</small></div>
    </div>
    <div class="hero"><div><h2>كشف سداد غير رسمي</h2><p>PAYMENT SUMMARY · ${esc(d.number)}</p></div><span class="badge">${status}</span></div>
    <div class="warn">${esc(settings.disclaimer)}</div>
    <div class="ibox"><div class="ititle">بيانات العميل · Customer Details</div>
      <div class="ir"><b>اسم العميل</b><strong>${esc(d.customer)}</strong></div>
      <div class="ir"><b>رقم الحساب</b><strong>${esc(d.account||"—")}</strong></div>
      <div class="ir"><b>رقم الكشف</b><strong>${esc(d.number)}</strong></div>
      <div class="ir"><b>الحالة</b><strong><span class="status ${cls}">${esc(d.status)}</span></strong></div>
    </div>
    <div class="ibox"><div class="ititle">تفاصيل الخدمة · Service Details</div>
      <div class="ir"><b>الخدمة / البيان</b><strong>${esc(d.service||"—")}</strong></div>
      <div class="ir"><b>المبلغ الأصلي</b><strong>${d.original.toLocaleString()} ${esc(d.currency)}</strong></div>
      <div class="ir"><b>المبلغ بالدولار</b><strong>$${d.usd.toLocaleString(undefined,{minimumFractionDigits:2})} USD</strong></div>
      <div class="ir"><b>سعر الصرف</b><strong>1 USD = ${d.rate.toLocaleString()} ج.س</strong></div>
    </div>
    <div class="total"><div><b>إجمالي المبلغ المستحق</b><small>Total Amount Due</small></div><strong>${total.toLocaleString()}<small>جنيه سوداني</small></strong></div>
    <div class="inote">${esc(d.note)}</div>
    <div class="ifoot"><span>تاريخ الإعداد: ${new Date(d.date).toLocaleDateString("ar-EG")}</span><span>شكراً لاستخدامكم الخدمة — Thank you</span></div>
  </div>`;
}

function saveInvoice(){
  const d=formData();
  if(!d.customerId){alert("اختر عميلًا أولًا أو أضف عميلًا جديدًا.");return}
  if(!d.account){alert("أدخل رقم الحساب.");return}
  if(d.usd<0||d.rate<0){alert("تحقق من المبلغ وسعر الصرف.");return}
  if(editingInvoice){
    const i=invoices.findIndex(x=>x.number===editingInvoice.number);
    if(i>=0)invoices[i]=d;
  }else{
    invoices.unshift(d);
  }
  save();
  alert("تم حفظ الكشف رقم "+d.number);
  editingInvoice=null;
  resetForm(false);
  go("records");
}

function printInvoice(){
  renderPreview();
  const invoice=$("invoicePreview").querySelector(".invoice");
  if(!invoice){alert("تعذر تجهيز الكشف.");return}
  const w=window.open("","_blank","width=900,height=1200");
  if(!w){alert("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى.");return}
  const css=[...document.querySelectorAll("style")].map(s=>s.textContent).join("\n");
  w.document.open();
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(formData().number)}</title><style>${css}
@page{size:A4;margin:10mm}
html,body{margin:0!important;padding:0!important;background:#fff!important}
.invoice{width:190mm!important;max-width:190mm!important;min-height:270mm;margin:0 auto!important;padding:8mm!important;box-shadow:none!important;border:0!important}
</style></head><body>${invoice.outerHTML}<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
  w.document.close();
}

function resetForm(goNew=true){
  editingInvoice=null;
  $("newTitle").textContent="إنشاء كشف سداد";
  $("customerSelect").value="";
  $("fNumber").value=nextNo();
  $("fAccount").value="";
  $("fService").value="تجديد الاشتراك الشهري";
  $("fStatus").value="PENDING";
  $("fOriginal").value=100;
  $("fCurrency").value="USD";
  $("fUSD").value=100;
  $("fRate").value=8940;
  $("fNote").value=settings.disclaimer;
  template=localStorage.getItem(K.template)||"classic";
  document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x.dataset.template===template));
  renderPreview();
  if(goNew)go("new");
}

function clearInvoiceForm(){resetForm(true)}

function renderDashboard(){
  $("statInvoices").textContent=invoices.length;
  $("statPending").textContent=invoices.filter(x=>x.status==="PENDING").length;
  $("statPaid").textContent=invoices.filter(x=>x.status==="PAID").length;
  $("statCustomers").textContent=customers.length;
  const list=invoices.slice(0,6);
  $("recent").innerHTML=list.length?tableInvoices(list):"<p>لا توجد كشوف محفوظة بعد.</p>";
}

function renderCustomers(){
  const q=($("customerSearch").value||"").toLowerCase();
  const arr=customers.filter(c=>(c.name+" "+(c.account||"")+" "+(c.phone||"")).toLowerCase().includes(q));
  $("customersTable").innerHTML=arr.length?`<table class="table"><tr><th>العميل</th><th>الحساب</th><th>الهاتف</th><th>إجراء</th></tr>${arr.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.account||"—")}</td><td>${esc(c.phone||"—")}</td><td class="mini-actions"><button onclick="useCustomer('${esc(c.id)}')">إنشاء كشف</button><button onclick="deleteCustomer('${esc(c.id)}')">حذف</button></td></tr>`).join("")}</table>`:"لا توجد نتائج.";
}

function renderRecords(){
  const q=($("recordSearch").value||"").toLowerCase();
  const arr=invoices.filter(i=>(i.number+" "+i.customer+" "+i.account).toLowerCase().includes(q));
  $("recordsTable").innerHTML=arr.length?tableInvoices(arr,true):"لا توجد سجلات.";
}

function tableInvoices(arr,full=false){
  return `<table class="table"><tr><th>رقم الكشف</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th>${full?"<th>إجراء</th>":""}</tr>${
    arr.map(i=>`<tr><td>${esc(i.number)}</td><td>${esc(i.customer)}</td><td>${(Number(i.usd||0)*Number(i.rate||0)).toLocaleString()} ج.س</td><td>${statusText(i.status)}</td><td>${new Date(i.date).toLocaleDateString("ar-EG")}</td>${full?`<td class="mini-actions"><button onclick="editInvoice('${esc(i.number)}')">تعديل</button><button onclick="printSaved('${esc(i.number)}')">PDF</button><button onclick="deleteInvoice('${esc(i.number)}')">حذف</button></td>`:""}</tr>`).join("")
  }</table>`;
}

function statusText(s){
  const t=s==="PAID"?"مدفوع":s==="CANCELLED"?"ملغي":"مستحق";
  return `<span class="status ${s==="PAID"?"paid":s==="CANCELLED"?"cancelled":"pending"}">${t}</span>`;
}

function openCustomer(){$("modal").classList.add("show");$("modal").setAttribute("aria-hidden","false");$("mName").value="";$("mAccount").value="";$("mPhone").value="";$("mName").focus()}
function closeCustomer(){$("modal").classList.remove("show");$("modal").setAttribute("aria-hidden","true")}
function addCustomer(){
  const name=$("mName").value.trim(),account=$("mAccount").value.trim();
  if(!name){alert("اكتب اسم العميل.");return}
  customers.push({id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),name,account,phone:$("mPhone").value.trim()});
  save();closeCustomer();populateCustomers();renderCustomers();renderDashboard();
}
function useCustomer(id){
  go("new");
  setTimeout(()=>{$("customerSelect").value=id;$("customerSelect").dispatchEvent(new Event("change"))},50);
}
function deleteCustomer(id){
  if(confirm("حذف العميل؟")){customers=customers.filter(x=>x.id!==id);save();renderCustomers();renderDashboard()}
}
function editInvoice(no){
  const d=invoices.find(x=>x.number===no);if(!d)return;
  editingInvoice=d;go("new");
  setTimeout(()=>{
    $("newTitle").textContent="تعديل كشف سداد";
    $("customerSelect").value=d.customerId||"";
    $("fNumber").value=d.number;
    $("fAccount").value=d.account||"";
    $("fService").value=d.service||"";
    $("fStatus").value=d.status||"PENDING";
    $("fOriginal").value=d.original??0;
    $("fCurrency").value=d.currency||"USD";
    $("fUSD").value=d.usd??0;
    $("fRate").value=d.rate??0;
    $("fNote").value=d.note||"";
    template=d.template||"classic";
    document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x.dataset.template===template));
    renderPreview();
  },50);
}
function printSaved(no){
  const d=invoices.find(x=>x.number===no);if(!d)return;
  editInvoice(no);
  setTimeout(printInvoice,250);
}
function deleteInvoice(no){
  if(confirm("حذف الكشف "+no+"؟")){invoices=invoices.filter(x=>x.number!==no);save();renderRecords();renderDashboard()}
}

document.querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{
  template=b.dataset.template;
  document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  save();renderPreview();
}));

function loadSettings(){
  $("sName").value=settings.name||"";
  $("sDesc").value=settings.desc||"";
  $("sProvider").value=settings.provider||"";
  $("sDisclaimer").value=settings.disclaimer||"";
}

function saveSettings(){
  settings={
    name:$("sName").value.trim(),
    desc:$("sDesc").value.trim(),
    provider:$("sProvider").value.trim(),
    disclaimer:$("sDisclaimer").value.trim()
  };
  save();renderPreview();alert("تم حفظ الإعدادات.");
}

function factoryReset(){
  if(confirm("سيتم حذف جميع العملاء والكشوف والإعدادات المحلية من هذا المتصفح. متابعة؟")){
    localStorage.clear();location.reload();
  }
}

function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

$("saveBtn").onclick=saveInvoice;
$("printBtn").onclick=printInvoice;
$("clearBtn").onclick=clearInvoiceForm;
$("addCustomerBtn").onclick=openCustomer;
$("addCustomerBtn2").onclick=openCustomer;
$("closeModal").onclick=closeCustomer;
$("cancelCustomer").onclick=closeCustomer;
$("addCustomer").onclick=addCustomer;
$("saveSettingsBtn").onclick=saveSettings;
$("resetBtn").onclick=factoryReset;
$("recordSearch").addEventListener("input",renderRecords);
$("customerSearch").addEventListener("input",renderCustomers);
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeCustomer()});

loadSettings();
populateCustomers();
resetForm(false);
renderDashboard();
renderPreview();
