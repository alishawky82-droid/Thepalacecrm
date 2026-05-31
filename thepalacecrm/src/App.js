import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ADMIN } from "./users";

const STATUS_OPTIONS = ["جديد", "تم التواصل", "مهتم", "زيارة مجدولة", "تم البيع", "غير مهتم", "متابعة"];
const STATUS_STYLE = {
  "جديد":           { bg: "#0f2744", color: "#60a5fa", dot: "#3b82f6" },
  "تم التواصل":     { bg: "#0f2a1e", color: "#34d399", dot: "#10b981" },
  "مهتم":           { bg: "#2a1f00", color: "#fbbf24", dot: "#f59e0b" },
  "زيارة مجدولة":  { bg: "#1e0f3a", color: "#a78bfa", dot: "#8b5cf6" },
  "تم البيع":       { bg: "#0a2a1a", color: "#4ade80", dot: "#22c55e" },
  "غير مهتم":       { bg: "#2a0f0f", color: "#f87171", dot: "#ef4444" },
  "متابعة":         { bg: "#2a1a00", color: "#fb923c", dot: "#f97316" },
};
const PROJECTS = ["كمبوند سيتي ستارز", "بالم هيلز التجمع", "كمبوند الماظة", "ميفيدا", "هايد بارك", "سوديك إيست", "تاون جيت", "أخرى"];
const EMPTY_FORM = { phone: "", customerName: "", project: "", feedback: "", status: "جديد" };

function formatPhone(v) { return v.replace(/\D/g, "").slice(0, 11); }
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}

function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleLogin = () => {
    if (user === ADMIN.username && pass === ADMIN.password) {
      localStorage.setItem("crm_user", JSON.stringify({ username: ADMIN.username, role: "admin", name: ADMIN.name }));
      onLogin({ username: ADMIN.username, role: "admin", name: ADMIN.name });
      return;
    }
    const found = users.find(u => u.username === user && u.password === pass);
    if (found) {
      localStorage.setItem("crm_user", JSON.stringify({ username: found.username, role: "sales", name: found.name }));
      onLogin({ username: found.username, role: "sales", name: found.name });
    } else {
      setError("اسم المستخدم أو كلمة المرور غلط!");
    }
  };

  const S = {
    root: { background: "#080d18", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cairo','Tajawal',sans-serif", direction: "rtl" },
    card: { background: "#0c1220", border: "1px solid #1a2540", borderRadius: 20, padding: "40px 36px", width: 360 },
    title: { fontSize: 22, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, textAlign: "center" },
    sub: { fontSize: 13, color: "#64748b", marginBottom: 32, textAlign: "center" },
    label: { fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 7, display: "block" },
    input: { width: "100%", background: "#070b14", border: "1px solid #1a2540", borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 16 },
    btn: { background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit" },
    error: { background: "#2a0f0f", border: "1px solid #7f1d1d", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16, textAlign: "center" },
  };

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.title}>🏢 SalesCRM</div>
        <div style={S.sub}>سجل دخولك للمتابعة</div>
        {error && <div style={S.error}>{error}</div>}
        <div>
          <label style={S.label}>👤 اسم المستخدم</label>
          <input style={S.input} placeholder="username" value={user} onChange={e => setUser(e.target.value)} />
        </div>
        <div>
          <label style={S.label}>🔒 كلمة المرور</label>
          <input style={S.input} type="password" placeholder="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <button style={S.btn} onClick={handleLogin}>دخول</button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_user")); } catch { return null; }
  });
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("add");
  const [form, setForm] = useState(EMPTY_FORM);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSales, setFilterSales] = useState("الكل");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [newUserForm, setNewUserForm] = useState({ username: "", password: "", name: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const phoneRef = useRef();

  useEffect(() => {
    if (!currentUser) return;
    const leadsRef = collection(db, "leads");
    const q = currentUser.role === "admin"
      ? query(leadsRef, orderBy("createdAt", "desc"))
      : query(leadsRef, where("salesUsername", "==", currentUser.username), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    return onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [currentUser]);

  if (!currentUser) return <LoginPage onLogin={u => setCurrentUser(u)} />;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkDuplicate = (phone) => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 8) return null;
    return leads.find(l => l.phone.replace(/\D/g, "") === clean) || null;
  };

  const handlePhoneChange = (v) => {
    const p = formatPhone(v);
    setForm(f => ({ ...f, phone: p }));
    setDuplicateAlert(p.length >= 8 ? (checkDuplicate(p) || null) : null);
  };

  const handleSubmit = async () => {
    if (!form.phone || form.phone.length < 10) return showToast("ادخل رقم تليفون صحيح", "error");
    if (!form.project) return showToast("اختار المشروع", "error");
    const dup = checkDuplicate(form.phone);
    if (dup) return showToast(`الرقم ده مسجل عند ${dup.sales}`, "error");
    await addDoc(collection(db, "leads"), {
      ...form,
      sales: currentUser.name,
      salesUsername: currentUser.username,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setForm(EMPTY_FORM);
    setDuplicateAlert(null);
    showToast("✅ تم إضافة العميل بنجاح");
    setTimeout(() => phoneRef.current?.focus(), 100);
  };

  const handleUpdate = async (id) => {
    await updateDoc(doc(db, "leads", id), { ...editForm, updatedAt: Date.now() });
    setEditId(null);
    showToast("✅ تم التحديث");
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "leads", id));
    setConfirmDelete(null);
    showToast("تم الحذف", "error");
  };

  const handleAddUser = async () => {
    if (!newUserForm.username || !newUserForm.password || !newUserForm.name)
      return showToast("ادخل كل البيانات", "error");
    const exists = users.find(u => u.username === newUserForm.username);
    if (exists) return showToast("اسم المستخدم موجود بالفعل", "error");
    await addDoc(collection(db, "users"), { ...newUserForm, role: "sales" });
    setNewUserForm({ username: "", password: "", name: "" });
    showToast("✅ تم إضافة الموظف");
  };

  const handleDeleteUser = async (id) => {
    await deleteDoc(doc(db, "users", id));
    showToast("تم حذف الموظف", "error");
  };

  const allSales = ["الكل", ...Array.from(new Set(leads.map(l => l.sales)))];
  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.phone.includes(q) || (l.customerName || "").toLowerCase().includes(q) || l.sales.toLowerCase().includes(q) || l.project.toLowerCase().includes(q);
    return matchSearch && (filterSales === "الكل" || l.sales === filterSales) && (filterStatus === "الكل" || l.status === filterStatus);
  });

  const totalLeads = leads.length;
  const salesMap = {};
  leads.forEach(l => { salesMap[l.sales] = (salesMap[l.sales] || 0) + 1; });
  const topSales = Object.entries(salesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const statusMap = {};
  leads.forEach(l => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });

  const S = {
    root: { background: "#080d18", minHeight: "100vh", fontFamily: "'Cairo','Tajawal',sans-serif", direction: "rtl", color: "#e2e8f0" },
    header: { background: "#0c1220", borderBottom: "1px solid #1a2540", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 },
    logo: { fontSize: 18, fontWeight: 900, letterSpacing: 1 },
    logoAccent: { color: "#3b82f6" },
    tabBar: { display: "flex", gap: 4 },
    tab: (a) => ({ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: a ? 700 : 500, background: a ? "#3b82f6" : "transparent", color: a ? "#fff" : "#64748b", transition: "all .2s" }),
    logoutBtn: { background: "#2a0f0f", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    body: { maxWidth: 900, margin: "0 auto", padding: "28px 16px" },
    card: { background: "#0c1220", border: "1px solid #1a2540", borderRadius: 16, padding: 24, marginBottom: 20 },
    label: { fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 7, display: "block", letterSpacing: .5 },
    input: { width: "100%", background: "#070b14", border: "1px solid #1a2540", borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
    select: { width: "100%", background: "#070b14", border: "1px solid #1a2540", borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer" },
    textarea: { width: "100%", background: "#070b14", border: "1px solid #1a2540", borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", minHeight: 80 },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 },
    btn: { background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit" },
    btnSm: (c) => ({ background: c || "#1a2540", color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }),
    dupAlert: { background: "#2a0f0f", border: "1px solid #7f1d1d", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 },
    dupAlertGreen: { background: "#0a2a1a", border: "1px solid #14532d" },
    badge: (s) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_STYLE[s]?.bg || "#1a2540", color: STATUS_STYLE[s]?.color || "#94a3b8" }),
    dot: (s) => ({ width: 7, height: 7, borderRadius: "50%", background: STATUS_STYLE[s]?.dot || "#64748b", flexShrink: 0 }),
    leadCard: { background: "#0c1220", border: "1px solid #1a2540", borderRadius: 12, padding: "16px 20px", marginBottom: 12 },
    leadHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    infoRow: { display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 },
    infoItem: { display: "flex", flexDirection: "column", gap: 2 },
    infoLabel: { fontSize: 10, color: "#475569", fontWeight: 600 },
    infoValue: { fontSize: 13, color: "#cbd5e1", fontWeight: 600 },
    feedback: { fontSize: 12, color: "#94a3b8", background: "#070b14", borderRadius: 8, padding: "8px 12px", lineHeight: 1.7, marginTop: 8 },
    actions: { display: "flex", gap: 8, marginTop: 12 },
    searchBar: { background: "#0c1220", border: "1px solid #1a2540", borderRadius: 10, padding: "11px 16px", color: "#f1f5f9", fontSize: 13, outline: "none", width: "100%", fontFamily: "inherit", marginBottom: 16 },
    filters: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    filterBtn: (a) => ({ padding: "6px 14px", borderRadius: 20, border: `1px solid ${a ? "#3b82f6" : "#1a2540"}`, background: a ? "rgba(59,130,246,.15)" : "transparent", color: a ? "#60a5fa" : "#64748b", fontSize: 12, fontWeight: a ? 700 : 400, cursor: "pointer" }),
    statGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 },
    statCard: (c) => ({ background: "#0c1220", border: `1px solid ${c}33`, borderRadius: 14, padding: "18px 20px", borderTop: `3px solid ${c}` }),
    statVal: { fontSize: 30, fontWeight: 900, marginBottom: 4 },
    statLbl: { fontSize: 12, color: "#64748b" },
    toast: (t) => ({ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: t === "error" ? "#7f1d1d" : "#14532d", border: `1px solid ${t === "error" ? "#dc2626" : "#16a34a"}`, color: "#fff", borderRadius: 10, padding: "12px 24px", fontSize: 13, fontWeight: 700, zIndex: 9999, whiteSpace: "nowrap" }),
    modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" },
    modal: { background: "#0c1220", border: "1px solid #1a2540", borderRadius: 16, padding: 28, width: 440, maxHeight: "90vh", overflowY: "auto" },
    counter: { fontSize: 12, color: "#64748b", marginTop: 6 },
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    setCurrentUser(null);
  };

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.logo}>🏢 <span style={S.logoAccent}>Sales</span>CRM</div>
        <div style={S.tabBar}>
          <button style={S.tab(tab === "add")} onClick={() => setTab("add")}>➕ إضافة عميل</button>
          <button style={S.tab(tab === "list")} onClick={() => setTab("list")}>
            👥 العملاء <span style={{ background: "#1a2540", borderRadius: 20, padding: "1px 8px", fontSize: 11, marginRight: 4 }}>{leads.length}</span>
          </button>
          <button style={S.tab(tab === "stats")} onClick={() => setTab("stats")}>📊 إحصائيات</button>
          {currentUser.role === "admin" && <button style={S.tab(tab === "users")} onClick={() => setTab("users")}>👥 الموظفين</button>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>{currentUser.name}</span>
          <button style={S.logoutBtn} onClick={handleLogout}>خروج 🚪</button>
        </div>
      </div>

      <div style={S.body}>
        {tab === "add" && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: "#f1f5f9" }}>إضافة عميل جديد</div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>📞 رقم التليفون *</label>
              <input ref={phoneRef} style={S.input} placeholder="01XXXXXXXXX" value={form.phone} onChange={e => handlePhoneChange(e.target.value)} autoFocus />
              {form.phone.length > 0 && <div style={S.counter}>{form.phone.length} / 11 رقم</div>}
            </div>
            {duplicateAlert && (
              <div style={S.dupAlert}>
                <span style={{ fontSize: 22 }}>🚫</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#f87171" }}>الرقم ده مسجل مسبقاً!</div>
                  <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 3 }}>مسجل عند: <strong>{duplicateAlert.sales}</strong> · {duplicateAlert.project} · {duplicateAlert.status}</div>
                </div>
              </div>
            )}
            {form.phone.length >= 8 && !duplicateAlert && (
              <div style={{ ...S.dupAlert, ...S.dupAlertGreen, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>الرقم متاح</div>
              </div>
            )}
            <div style={S.row2}>
              <div>
                <label style={S.label}>🧑 اسم العميل</label>
                <input style={S.input} placeholder="اسم العميل الكامل" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>👤 السيلز</label>
                <input style={{ ...S.input, opacity: 0.6 }} value={currentUser.name} readOnly />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>🏢 المشروع *</label>
              <select style={S.select} value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}>
                <option value="">اختار المشروع</option>
                {PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>📌 حالة العميل</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                    style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${form.status === s ? STATUS_STYLE[s].dot : "#1a2540"}`, background: form.status === s ? STATUS_STYLE[s].bg : "transparent", color: form.status === s ? STATUS_STYLE[s].color : "#64748b", fontSize: 12, fontWeight: form.status === s ? 700 : 400, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>💬 فيدباك</label>
              <textarea style={S.textarea} value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} />
            </div>
            <button style={{ ...S.btn, opacity: duplicateAlert ? .4 : 1 }} onClick={handleSubmit} disabled={!!duplicateAlert}>إضافة العميل ✓</button>
          </div>
        )}

        {tab === "list" && (
          <>
            <input style={S.searchBar} placeholder="🔍 ابحث..." value={search} onChange={e => setSearch(e.target.value)} />
            {currentUser.role === "admin" && (
              <div style={S.filters}>
                <span style={{ fontSize: 12, color: "#475569", alignSelf: "center" }}>السيلز:</span>
                {allSales.map(s => <button key={s} style={S.filterBtn(filterSales === s)} onClick={() => setFilterSales(s)}>{s}</button>)}
              </div>
            )}
            <div style={S.filters}>
              <span style={{ fontSize: 12, color: "#475569", alignSelf: "center" }}>الحالة:</span>
              {["الكل", ...STATUS_OPTIONS].map(s => <button key={s} style={S.filterBtn(filterStatus === s)} onClick={() => setFilterStatus(s)}>{s}</button>)}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>{filtered.length} عميل</div>
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}><div style={{ fontSize: 40 }}>🔍</div><div>مفيش نتايج</div></div>}
            {filtered.map(l => (
              <div key={l.id} style={S.leadCard}>
                <div style={S.leadHeader}>
                  <div>
                    {l.customerName && <div style={{ fontSize: 16, fontWeight: 900, color: "#f1f5f9", marginBottom: 2 }}>{l.customerName}</div>}
                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: "#94a3b8", fontFamily: "monospace" }}>{l.phone}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{timeAgo(l.createdAt)}</div>
                  </div>
                  <span style={S.badge(l.status)}><span style={S.dot(l.status)} />{l.status}</span>
                </div>
                <div style={S.infoRow}>
                  <div style={S.infoItem}><span style={S.infoLabel}>👤 السيلز</span><span style={S.infoValue}>{l.sales}</span></div>
                  <div style={S.infoItem}><span style={S.infoLabel}>🏢 المشروع</span><span style={S.infoValue}>{l.project}</span></div>
                </div>
                {l.feedback && <div style={S.feedback}>💬 {l.feedback}</div>}
                <div style={S.actions}>
                  <button style={S.btnSm("#1e3a5f")} onClick={() => { setEditId(l.id); setEditForm({ customerName: l.customerName || "", status: l.status, feedback: l.feedback || "", project: l.project }); }}>✏️ تعديل</button>
                  <a href={`https://wa.me/2${l.phone}`} target="_blank" rel="noreferrer"><button style={S.btnSm("#14532d")}>💬 واتساب</button></a>
                  <a href={`tel:${l.phone}`}><button style={S.btnSm("#1e2d3a")}>📞 اتصل</button></a>
                  {(currentUser.role === "admin" || l.salesUsername === currentUser.username) && (
                    <button style={{ ...S.btnSm("#2a0f0f"), marginRight: "auto" }} onClick={() => setConfirmDelete(l.id)}>🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "stats" && (
          <>
            <div style={S.statGrid}>
              <div style={S.statCard("#3b82f6")}><div style={{ fontSize: 28, marginBottom: 6 }}>👥</div><div style={{ ...S.statVal, color: "#60a5fa" }}>{totalLeads}</div><div style={S.statLbl}>إجمالي العملاء</div></div>
              <div style={S.statCard("#10b981")}><div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div><div style={{ ...S.statVal, color: "#34d399" }}>{leads.filter(l => l.status === "تم البيع").length}</div><div style={S.statLbl}>صفقات مغلقة</div></div>
              <div style={S.statCard("#f59e0b")}><div style={{ fontSize: 28, marginBottom: 6 }}>🔥</div><div style={{ ...S.statVal, color: "#fbbf24" }}>{leads.filter(l => l.status === "مهتم" || l.status === "زيارة مجدولة").length}</div><div style={S.statLbl}>ليدز ساخنة</div></div>
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 18 }}>🏅 ترتيب السيلز</div>
              {topSales.length === 0 && <div style={{ color: "#475569", fontSize: 13 }}>مفيش بيانات لسه</div>}
              {topSales.map(([name, count], i) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: i === 0 ? "#fbbf2420" : "#1a2540", color: i === 0 ? "#fbbf24" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{name}</span><span style={{ fontSize: 13, color: "#60a5fa", fontWeight: 700 }}>{count} عميل</span></div>
                    <div style={{ height: 6, background: "#1a2540", borderRadius: 3 }}><div style={{ height: "100%", width: `${(count / topSales[0][1]) * 100}%`, background: i === 0 ? "#f59e0b" : "#3b82f6", borderRadius: 3 }} /></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 18 }}>📌 توزيع الحالات</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                {STATUS_OPTIONS.map(s => (
                  <div key={s} style={{ background: STATUS_STYLE[s].bg, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_STYLE[s].dot }} /><span style={{ fontSize: 13, color: STATUS_STYLE[s].color, fontWeight: 600 }}>{s}</span></div>
                    <span style={{ fontSize: 20, fontWeight: 900, color: STATUS_STYLE[s].color }}>{statusMap[s] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "users" && currentUser.role === "admin" && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20 }}>➕ إضافة موظف جديد</div>
            <div style={S.row3}>
              <div>
                <label style={S.label}>👤 اسم المستخدم</label>
                <input style={S.input} placeholder="username" value={newUserForm.username} onChange={e => setNewUserForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>🔒 كلمة المرور</label>
                <input style={S.input} placeholder="password" value={newUserForm.password} onChange={e => setNewUserForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>🧑 الاسم الكامل</label>
                <input style={S.input} placeholder="اسم الموظف" value={newUserForm.name} onChange={e => setNewUserForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <button style={{ ...S.btn, marginBottom: 24 }} onClick={handleAddUser}>إضافة الموظف ✓</button>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>👥 الموظفين الحاليين</div>
            <div style={{ background: "#070b14", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{ADMIN.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>@{ADMIN.username}</div>
              </div>
              <span style={{ fontSize: 11, background: "#1e3a5f", color: "#60a5fa", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>Admin</span>
            </div>
            {users.map(u => (
              <div key={u.id} style={{ background: "#070b14", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>@{u.username}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, background: "#1a2540", color: "#94a3b8", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>Sales</span>
                  <button style={S.btnSm("#2a0f0f")} onClick={() => handleDeleteUser(u.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editId && (
        <div style={S.modalOverlay} onClick={() => setEditId(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20 }}>✏️ تعديل بيانات العميل</div>
            <div style={{ marginBottom: 16 }}><label style={S.label}>🧑 اسم العميل</label><input style={S.input} value={editForm.customerName || ""} onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))} /></div>
            <div style={{ marginBottom: 16 }}><label style={S.label}>🏢 المشروع</label><select style={S.select} value={editForm.project} onChange={e => setEditForm(f => ({ ...f, project: e.target.value }))}>{PROJECTS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>📌 الحالة</label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map(s => <button key={s} onClick={() => setEditForm(f => ({ ...f, status: s }))} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${editForm.status === s ? STATUS_STYLE[s].dot : "#1a2540"}`, background: editForm.status === s ? STATUS_STYLE[s].bg : "transparent", color: editForm.status === s ? STATUS_STYLE[s].color : "#64748b", fontSize: 12, cursor: "pointer" }}>{s}</button>)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={S.label}>💬 الفيدباك</label><textarea style={S.textarea} value={editForm.feedback || ""} onChange={e => setEditForm(f => ({ ...f, feedback: e.target.value }))} /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.btn} onClick={() => handleUpdate(editId)}>حفظ التعديلات</button>
              <button style={{ ...S.btnSm(), padding: "13px 20px" }} onClick={() => setEditId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={S.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...S.modal, width: 340, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>تأكيد الحذف</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>هتمسح بيانات العميل ده نهائياً</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btn, background: "linear-gradient(135deg,#dc2626,#b91c1c)" }} onClick={() => handleDelete(confirmDelete)}>نعم، احذف</button>
              <button style={{ ...S.btnSm(), padding: "13px 20px", flex: 1 }} onClick={() => setConfirmDelete(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}