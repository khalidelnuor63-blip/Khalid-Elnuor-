const K={customers:"ke_customers",invoices:"ke_invoices",settings:"ke_settings",template:"ke_template"};
const $=id=>document.getElementById(id);
let customers=JSON.parse(localStorage.getItem(K.customers)||"[]");
let invoices=JSON.parse(localStorage.getItem(K.invoices)||"[]");
let settings=JSON.parse(localStorage.getItem(K.settings)||'{"name":"KHALID ELNUOR","desc":"AI AUTOMATION & DIGITAL SOLUTIONS","provider":"STARLINK","disclaimer":"هذا المستند كشف سداد غير رسمي أُعد لأغراض العرض والتنظيم فقط."}');
let template=localStorage.getItem(K.template)||"classic";
let editingInvoice=null;

function save(){localStorage.setItem(K.customers,JSON.stringify(customers));localStorage.setItem(K.invoices,JSON.stringify(invoices));localStorage.setItem(K.settings,JSON.stringify(settings));localStorage.setItem(K.template,template)}
function go(page){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(page).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));if(page==="dashboard")renderDashboard();if(page==="customers")renderCustomers();if(page==="records")renderRecords();if(page==="new"){populateCustomers();renderPreview()}if(page==="settings")loadSettings();scrollTo(0,0)}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>go(b.dataset.page));
$("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");

function nextNo(){const y=new Date().getFullYear();const n=invoices.filter(x=>String(x.number).startsWith("INV-"+y)).length+1;return `INV-${y}-${String(n).padStart(5,"0")}`}
function populateCustomers(){const s=$("customerSelect");s.innerHTML='<option value="">-- اختر عميلًا --</option>'+customers.map(c=>`<option value="${c.id}">${esc(c.name)} — ${esc(c.account)}</option>`).join("");}
$("customerSelect").onchange=()=>{const c=customers.find(x=>x.id===$("customerSelect").value);if(c){$("fAccount").value=c.account||""}renderPreview()}
["fAccount","fService","fStatus","fOriginal","fCurrency","fUSD","fRate","fNote"].forEach(id=>$(id).addEventListener("input",renderPreview));

function formData(){const c=customers.find(x=>x.id===$("customerSelect").value);return {number:editingInvoice?.number||nextNo(),customer:c?.name||"عميل غير محدد",customerId:c?.id||"",account:$("fAccount").value,service:$("fService").value,status:$("fStatus").value,original:Number($("fOriginal").value||0),currency:$("fCurrency").value,usd:Number($("fUSD").value||0),rate:Number($("fRate").value||0),note:$("fNote").value,date:new Date().toISOString(),template}}
function renderPreview(){const d=formData(),total=d.usd*d.rate, status=d.status;const cls=status==="PAID"?"paid":status==="CANCELLED"?"cancelled":"pending";$("invoicePreview").innerHTML=`<div class="invoice ${d.template}">
<div class="brandrow"><div class="invbrand"><div class="invlogo">KE</div><div><b>KHALID <span>ELNUOR</span></b><small>AI AUTOMATION & DIGITAL SOLUTIONS</small></div></div><div class="provider">${esc(settings.provider)}<small>UNOFFICIAL PAYMENT SUMMARY</small></div></div>
<div class="hero"><div><h2>كشف سداد غير رسمي</h2><p>PAYMENT SUMMARY · ${esc(d.number)}</p></div><span class="badge">${status==="PAID"?"مدفوع — PAID":status==="CANCELLED"?"ملغي — CANCELLED":"مستحق الدفع — PENDING"}</span></div>
<div class="warn">${esc(settings.disclaimer)}</div>
<div class="ibox"><div class="ititle">بيانات العميل · Customer Details</div>
<div class="ir"><b>اسم العميل</b><strong>${esc(d.customer)}</strong></div><div class="ir"><b>رقم الحساب</b><strong>${esc(d.account)}</strong></div><div class="ir"><b>رقم الكشف</b><strong>${esc(d.number)}</strong></div><div class="ir"><b>الحالة</b><strong><span class="status ${cls}">${status}</span></strong></div></div>
<div class="ibox"><div class="ititle">تفاصيل الخدمة · Service Details</div>
<div class="ir"><b>الخدمة / البيان</b><strong>${esc(d.service)}</strong></div><div class="ir"><b>المبلغ الأصلي</b><strong>${d.original.toLocaleString()} ${esc(d.currency)}</strong></div><div class="ir"><b>المبلغ بالدولار</b><strong>$${d.usd.toLocaleString(undefined,{minimumFractionDigits:2})} USD</strong></div><div class="ir"><b>سعر الصرف</b><strong>1 USD = ${d.rate.toLocaleString()} جنيه سوداني</strong></div></div>
<div class="total"><div><b>إجمالي المبلغ المستحق</b><small>Total Amount Due</small></div><strong>${total.toLocaleString()}<small>جنيه سوداني</small></strong></div>
<div class="inote">${esc(d.note)}</div><div class="ifoot"><span>تاريخ الإعداد: ${new Date(d.date).toLocaleDateString("ar-EG")}</span><span>شكراً لاستخدامكم الخدمة — Thank you</span></div></div>`}
function saveInvoice(){const d=formData();if(!d.customer){alert("اختر العميل أولاً أو أضف عميلًا جديدًا.");return}if(editingInvoice){const i=invoices.findIndex(x=>x.number===editingInvoice.number);invoices[i]=d}else invoices.unshift(d);editingInvoice=null;save();alert("تم حفظ الكشف رقم "+d.number);go("records")}
function printInvoice(){renderPreview();setTimeout(()=>window.print(),80)}
function clearInvoiceForm(){editingInvoice=null;$("customerSelect").value="";$("fAccount").value="";$("fService").value="تجديد الاشتراك الشهري";$("fStatus").value="PENDING";$("fOriginal").value=100;$("fCurrency").value="USD";$("fUSD").value=100;$("fRate").value=8940;$("fNote").value=settings.disclaimer;renderPreview()}
function renderDashboard(){ $("statInvoices").textContent=invoices.length;$("statPending").textContent=invoices.filter(x=>x.status==="PENDING").length;$("statPaid").textContent=invoices.filter(x=>x.status==="PAID").length;$("statCustomers").textContent=customers.length;const list=invoices.slice(0,6);$("recent").innerHTML=list.length?tableInvoices(list):"<p>لا توجد كشوف محفوظة بعد.</p>"}
function renderCustomers(){const q=($("customerSearch").value||"").toLowerCase();const arr=customers.filter(c=>(c.name+" "+c.account).toLowerCase().includes(q));$("customersTable").innerHTML=arr.length?`<table class="table"><tr><th>العميل</th><th>الحساب</th><th>الهاتف</th><th>إجراء</th></tr>${arr.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.account)}</td><td>${esc(c.phone||"—")}</td><td class="mini-actions"><button onclick="useCustomer('${c.id}')">إنشاء كشف</button><button onclick="deleteCustomer('${c.id}')">حذف</button></td></tr>`).join("")}</table>`:"لا توجد نتائج."}
function renderRecords(){const q=($("recordSearch").value||"").toLowerCase();const arr=invoices.filter(i=>(i.number+" "+i.customer+" "+i.account).toLowerCase().includes(q));$("recordsTable").innerHTML=arr.length?tableInvoices(arr,true):"لا توجد سجلات."}
function tableInvoices(arr,full=false){return `<table class="table"><tr><th>رقم الكشف</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th>${full?"<th>إجراء</th>":""}</tr>${arr.map(i=>`<tr><td>${esc(i.number)}</td><td>${esc(i.customer)}</td><td>${(i.usd*i.rate).toLocaleString()} ج.س</td><td>${statusText(i.status)}</td><td>${new Date(i.date).toLocaleDateString("ar-EG")}</td>${full?`<td class="mini-actions"><button onclick="editInvoice('${i.number}')">تعديل</button><button onclick="printSaved('${i.number}')">PDF</button><button onclick="deleteInvoice('${i.number}')">حذف</button></td>`:""}</tr>`).join("")}</table>`}
function statusText(s){return `<span class="status ${s==="PAID"?"paid":s==="CANCELLED"?"cancelled":"pending"}">${s}</span>`}
function openCustomer(){ $("modal").classList.add("show");$("mName").value="";$("mAccount").value="";$("mPhone").value=""}
function closeCustomer(){$("modal").classList.remove("show")}
function addCustomer(){const name=$("mName").value.trim(),account=$("mAccount").value.trim();if(!name){alert("اكتب اسم العميل.");return}customers.push({id:crypto.randomUUID(),name,account,phone:$("mPhone").value.trim()});save();closeCustomer();populateCustomers();renderCustomers();renderDashboard()}
function useCustomer(id){go("new");setTimeout(()=>{$("customerSelect").value=id;$("customerSelect").dispatchEvent(new Event("change"))},50)}
function deleteCustomer(id){if(confirm("حذف العميل؟")){customers=customers.filter(x=>x.id!==id);save();renderCustomers();renderDashboard()}}
function editInvoice(no){const d=invoices.find(x=>x.number===no);if(!d)return;editingInvoice=d;go("new");setTimeout(()=>{$("customerSelect").value=d.customerId;$("fAccount").value=d.account;$("fService").value=d.service;$("fStatus").value=d.status;$("fOriginal").value=d.original;$("fCurrency").value=d.currency;$("fUSD").value=d.usd;$("fRate").value=d.rate;$("fNote").value=d.note;template=d.template;renderPreview()},50)}
function printSaved(no){const d=invoices.find(x=>x.number===no);if(!d)return;editInvoice(no);setTimeout(printInvoice,150)}
function deleteInvoice(no){if(confirm("حذف الكشف "+no+"؟")){invoices=invoices.filter(x=>x.number!==no);save();renderRecords();renderDashboard()}}
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{template=b.dataset.template;document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderPreview()});
function selectTemplate(t){template=t;save();document.querySelectorAll(".tpl").forEach(x=>x.classList.remove("selected"));event.currentTarget.classList.add("selected");alert("تم اختيار قالب "+t)}
function loadSettings(){$("sName").value=settings.name;$("sDesc").value=settings.desc;$("sProvider").value=settings.provider;$("sDisclaimer").value=settings.disclaimer}
function saveSettings(){settings={name:$("sName").value,desc:$("sDesc").value,provider:$("sProvider").value,disclaimer:$("sDisclaimer").value};save();renderPreview();alert("تم حفظ الإعدادات")}
function factoryReset(){if(confirm("سيتم حذف جميع العملاء والكشوف والإعدادات المحلية. متابعة؟")){localStorage.clear();location.reload()}}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
loadSettings();populateCustomers();renderDashboard();renderPreview();
