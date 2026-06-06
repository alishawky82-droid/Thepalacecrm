import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ADMIN } from "./users";

const STATUS_OPTIONS = ["No Answer", "Follow", "Not Interested", "Broker", "Interested", "Meeting", "Done Deal"];
const STATUS_STYLE = {
  "No Answer":      { bg: "#EDE8E0", color: "#5C4F3A", dot: "#B8A898" },
  "Follow":         { bg: "#FFF0D4", color: "#7A4F00", dot: "#C9A84C" },
  "Not Interested": { bg: "#FCEAEA", color: "#7A2020", dot: "#D88080" },
  "Broker":         { bg: "#EDE4D3", color: "#5C3A00", dot: "#A67C2E" },
  "Interested":     { bg: "#FFF8E8", color: "#7A5500", dot: "#C9A84C" },
  "Meeting":        { bg: "#D4EDE0", color: "#0F5E3A", dot: "#2A9D6A" },
  "Done Deal":      { bg: "#C9F0DC", color: "#0A4A2E", dot: "#16A05A" },
};
const UNIT_STATUS_STYLE = {
  "Available": { bg: "#D4EDE0", color: "#0F5E3A", dot: "#2A9D6A" },
  "Sold Out":  { bg: "#FCEAEA", color: "#7A2020", dot: "#D88080" },
};
const PROJECTS = [
  "Acasa Mia",
  "Address East",
  "Alamien",
  "Aliva",
  "Amorada",
  "Amwaj",
  "At East",
  "Azad",
  "Azha",
  "Azzar 1",
  "Banafseg",
  "Bloomfields",
  "Blumar",
  "CFC",
  "Cali Coast",
  "Capital Gardens",
  "City Gate",
  "Creek Town",
  "D Bay",
  "District 5",
  "East Shire",
  "East Town",
  "Fifth Square",
  "Foka Bay",
  "Gaia",
  "Galleria",
  "Green Square",
  "Hap Town",
  "Hyde Park",
  "Hyde Park Central",
  "Il Bosco City",
  "Ivoire East",
  "Jayed",
  "Katamia Gardens",
  "L'Avenir",
  "Lake View 1",
  "Lake View 2",
  "Lakeview Residence 2",
  "Lavista",
  "Lavista Sokhna 5",
  "Madinaty",
  "Marasem",
  "Marassi",
  "Marq Gardens",
  "Marsellia",
  "Midtown New Cairo",
  "Mountain View",
  "Mountain View 1.1",
  "Mountain View Hyde Park",
  "Mountain View Ras Al Hekma",
  "Mountain View iCity N.C",
  "Narges",
  "Palm Hills",
  "Park View",
  "Patio 7",
  "Patio Oro",
  "Promenade",
  "Regents Square",
  "Sabbour",
  "Sarai",
  "Stella",
  "Stone Park",
  "Stone Residence",
  "Summer",
  "Taj City",
  "Telal East",
  "The Brooks",
  "The Crest",
  "The Icon Gardens",
  "The Square",
  "Trio",
  "Water Way",
  "Yassmin",
  "Zed East",
  "Zed West",
  "iCity October",
  "Marsellia 3",
  "Marsellia 4",
  "Marsellia 5",
  "Mivida",
  "Mountain view 2",
  "Sea shell",
  "playa",
  "shoifat",
  "lattous",
  "zizinia",
  "أخرى"
];
const EMPTY_FORM = { phone: "", customerName: "", project: "", feedback: "", status: "No Answer" };
const EMPTY_UNIT = { phone: "", customerName: "", project: "", details: "", status: "Available" };

const T = {
  bg: "#F5F0E8",
  card: "#FFFDF7",
  header: "#EDE4D3",
  border: "#E8DFD0",
  borderGold: "#C9A84C",
  text: "#2C2416",
  sub: "#8C7B6B",
  hint: "#B8A898",
  input: "#F5F0E8",
  gold: "#C9A84C",
  goldDark: "#A67C2E",
  dark: "#2C2416",
};

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
    return onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleLogin = () => {
    if (user === ADMIN.username && pass === ADMIN.password) {
      const u = { username: ADMIN.username, role: "admin", name: ADMIN.name };
      localStorage.setItem("crm_user", JSON.stringify(u));
      onLogin(u); return;
    }
    const found = users.find(u => u.username === user && u.password === pass);
    if (found) {
      const u = { username: found.username, role: found.role || "sales", name: found.name };
      localStorage.setItem("crm_user", JSON.stringify(u));
      onLogin(u);
    } else setError("اسم المستخدم أو كلمة المرور غلط!");
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cairo','Tajawal',sans-serif", direction: "rtl" }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.gold}`, borderRadius: 20, padding: "40px 36px", width: 360, boxShadow: "0 4px 24px #C9A84C18" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 4, textAlign: "center" }}>🏛 The Place</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.goldDark, marginBottom: 28, textAlign: "center", letterSpacing: 2 }}>CRM</div>
        <div style={{ width: 40, height: 2, background: T.gold, borderRadius: 2, margin: "0 auto 28px" }} />
        {error && <div style={{ background: "#FCEAEA", border: `1px solid #D88080`, borderRadius: 10, padding: "10px 14px", color: "#7A2020", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
        <label style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 7, display: "block" }}>👤 اسم المستخدم</label>
        <input style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 16 }} placeholder="username" value={user} onChange={e => setUser(e.target.value)} />
        <label style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 7, display: "block" }}>🔒 كلمة المرور</label>
        <input style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 20 }} type="password" placeholder="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <button style={{ background: T.dark, color: T.gold, border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit" }} onClick={handleLogin}>دخول</button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => { try { return JSON.parse(localStorage.getItem("crm_user")); } catch { return null; } });
  const [leads, setLeads] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("add");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formSalesTarget, setFormSalesTarget] = useState("");
  const [unitForm, setUnitForm] = useState(EMPTY_UNIT);
  const [unitFormSalesTarget, setUnitFormSalesTarget] = useState("");
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [unitDupAlert, setUnitDupAlert] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [filterSales, setFilterSales] = useState("الكل");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterUnitSales, setFilterUnitSales] = useState("الكل");
  const [newUserForm, setNewUserForm] = useState({ username: "", password: "", name: "", role: "sales" });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [settingsForm, setSettingsForm] = useState({ oldPass: "", newPass: "", confirmPass: "" });
  const [profileImg, setProfileImg] = useState(() => localStorage.getItem(`crm_img_${JSON.parse(localStorage.getItem("crm_user") || "{}").username}`) || "");
  const phoneRef = useRef();
  const imgRef = useRef();

  const isAdmin = currentUser?.role === "admin";

  const allUsersForSelect = [
    { username: ADMIN.username, name: ADMIN.name },
    ...users.map(u => ({ username: u.username, name: u.name }))
  ];

  useEffect(() => {
    if (!currentUser) return;
    const leadsRef = collection(db, "leads");
    const q = isAdmin
      ? query(leadsRef, orderBy("createdAt", "desc"))
      : query(leadsRef, where("salesUsername", "==", currentUser.username), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unitsRef = collection(db, "units");
    const q = query(unitsRef, orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    return onSnapshot(collection(db, "users"), snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [currentUser]);

  if (!currentUser) return <LoginPage onLogin={u => { setCurrentUser(u); setProfileImg(localStorage.getItem(`crm_img_${u.username}`) || ""); }} />;

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const checkDuplicate = (phone, list) => { const clean = phone.replace(/\D/g, ""); if (clean.length < 8) return null; return list.find(l => l.phone.replace(/\D/g, "") === clean) || null; };
  const handlePhoneChange = (v) => { const p = formatPhone(v); setForm(f => ({ ...f, phone: p })); setDuplicateAlert(p.length >= 8 ? (checkDuplicate(p, leads) || null) : null); };
  const handleUnitPhoneChange = (v) => { const p = formatPhone(v); setUnitForm(f => ({ ...f, phone: p })); setUnitDupAlert(p.length >= 8 ? (checkDuplicate(p, units) || null) : null); };
  const canSeePhone = (item) => isAdmin || item.salesUsername === currentUser.username;

  const handleSubmit = async () => {
    if (!form.phone || form.phone.length < 10) return showToast("ادخل رقم تليفون صحيح", "error");
    if (!form.project) return showToast("اختار المشروع", "error");
    if (checkDuplicate(form.phone, leads)) return showToast("الرقم مسجل قبل كده", "error");
    const targetUser = isAdmin && formSalesTarget ? allUsersForSelect.find(u => u.username === formSalesTarget) : { username: currentUser.username, name: currentUser.name };
    await addDoc(collection(db, "leads"), { ...form, sales: targetUser.name, salesUsername: targetUser.username, createdAt: Date.now(), updatedAt: Date.now() });
    setForm(EMPTY_FORM); setDuplicateAlert(null); setFormSalesTarget("");
    showToast("✅ تم إضافة العميل");
    setTimeout(() => phoneRef.current?.focus(), 100);
  };

  const handleUnitSubmit = async () => {
    if (!unitForm.phone || unitForm.phone.length < 10) return showToast("ادخل رقم تليفون صحيح", "error");
    if (!unitForm.project) return showToast("اختار المشروع", "error");
    if (checkDuplicate(unitForm.phone, units)) return showToast("الرقم مسجل في الوحدات قبل كده", "error");
    const targetUser = isAdmin && unitFormSalesTarget ? allUsersForSelect.find(u => u.username === unitFormSalesTarget) : { username: currentUser.username, name: currentUser.name };
    await addDoc(collection(db, "units"), { ...unitForm, sales: targetUser.name, salesUsername: targetUser.username, createdAt: Date.now(), updatedAt: Date.now() });
    setUnitForm(EMPTY_UNIT); setUnitDupAlert(null); setUnitFormSalesTarget("");
    showToast("✅ تم إضافة الوحدة");
  };

  const handleUpdate = async (id) => { await updateDoc(doc(db, "leads", id), { ...editForm, updatedAt: Date.now() }); setEditId(null); showToast("✅ تم التحديث"); };
  const handleDelete = async (id) => { await deleteDoc(doc(db, "leads", id)); setConfirmDelete(null); showToast("تم الحذف", "error"); };
  const handleDeleteUnit = async (id) => { await deleteDoc(doc(db, "units", id)); setConfirmDeleteUnit(null); showToast("تم الحذف", "error"); };
  const handleAddUser = async () => {
    if (!newUserForm.username || !newUserForm.password || !newUserForm.name) return showToast("ادخل كل البيانات", "error");
    if (users.find(u => u.username === newUserForm.username)) return showToast("اسم المستخدم موجود", "error");
    await addDoc(collection(db, "users"), newUserForm);
    setNewUserForm({ username: "", password: "", name: "", role: "sales" });
    showToast("✅ تم إضافة المستخدم");
  };
  const handleDeleteUser = async (id) => { await deleteDoc(doc(db, "users", id)); showToast("تم الحذف", "error"); };
  const handleImgUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const base64 = ev.target.result; setProfileImg(base64); localStorage.setItem(`crm_img_${currentUser.username}`, base64); showToast("✅ تم رفع الصورة"); };
    reader.readAsDataURL(file);
  };
  const handleChangePassword = async () => {
    if (!settingsForm.oldPass || !settingsForm.newPass || !settingsForm.confirmPass) return showToast("ادخل كل البيانات", "error");
    if (settingsForm.newPass !== settingsForm.confirmPass) return showToast("كلمة المرور الجديدة مش متطابقة", "error");
    if (currentUser.username === ADMIN.username) {
      if (settingsForm.oldPass !== ADMIN.password) return showToast("كلمة المرور القديمة غلط", "error");
      showToast("✅ تم — عدّل ملف users.js لتغيير كلمة مرور الأدمن");
    } else {
      const userDoc = users.find(u => u.username === currentUser.username);
      if (!userDoc || userDoc.password !== settingsForm.oldPass) return showToast("كلمة المرور القديمة غلط", "error");
      await updateDoc(doc(db, "users", userDoc.id), { password: settingsForm.newPass });
      showToast("✅ تم تغيير كلمة المرور");
    }
    setSettingsForm({ oldPass: "", newPass: "", confirmPass: "" });
  };

  const handleExportLeads = () => {
    if (leads.length === 0) return showToast("مفيش عملاء للتصدير", "error");
    const headers = ["الاسم", "التليفون", "السيلز", "المشروع", "الحالة", "الفيدباك", "التاريخ"];
    const rows = leads.map(l => [l.customerName || "", l.phone, l.sales, l.project, l.status, l.feedback || "", new Date(l.createdAt).toLocaleDateString("ar-EG")]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `عملاء_${new Date().toLocaleDateString("ar-EG").replace(/\//g,"-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast("✅ تم تصدير العملاء");
  };

  const handleExportUnits = () => {
    if (units.length === 0) return showToast("مفيش وحدات للتصدير", "error");
    const headers = ["الاسم", "التليفون", "السيلز", "المشروع", "الحالة", "التفاصيل", "التاريخ"];
    const rows = units.map(u => [u.customerName || "", u.phone, u.sales, u.project, u.status, u.details || "", new Date(u.createdAt).toLocaleDateString("ar-EG")]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `وحدات_${new Date().toLocaleDateString("ar-EG").replace(/\//g,"-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast("✅ تم تصدير الوحدات");
  };

  const handleImportLeads = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim());
    if (lines.length < 2) return showToast("الملف فاضي", "error");
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (!cols[1] || cols[1].length < 8) continue;
      if (checkDuplicate(cols[1], leads)) continue;
      await addDoc(collection(db, "leads"), { customerName: cols[0] || "", phone: cols[1], sales: cols[2] || currentUser.name, salesUsername: currentUser.username, project: cols[3] || "", status: cols[4] || "No Answer", feedback: cols[5] || "", createdAt: Date.now(), updatedAt: Date.now() });
      count++;
    }
    showToast(`✅ تم استيراد ${count} عميل`);
    e.target.value = "";
  };

  const handleImportUnits = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim());
    if (lines.length < 2) return showToast("الملف فاضي", "error");
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (!cols[1] || cols[1].length < 8) continue;
      if (checkDuplicate(cols[1], units)) continue;
      await addDoc(collection(db, "units"), { customerName: cols[0] || "", phone: cols[1], sales: cols[2] || currentUser.name, salesUsername: currentUser.username, project: cols[3] || "", status: cols[4] || "Available", details: cols[5] || "", createdAt: Date.now(), updatedAt: Date.now() });
      count++;
    }
    showToast(`✅ تم استيراد ${count} وحدة`);
    e.target.value = "";
  };

  const handleLogout = () => { localStorage.removeItem("crm_user"); setCurrentUser(null); };

  const allSales = ["الكل", ...Array.from(new Set(leads.map(l => l.sales)))];
  const allUnitSales = ["الكل", ...Array.from(new Set(units.map(u => u.sales)))];
  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.phone.includes(q) || (l.customerName || "").toLowerCase().includes(q) || l.sales.toLowerCase().includes(q) || l.project.toLowerCase().includes(q);
    return matchSearch && (filterSales === "الكل" || l.sales === filterSales) && (filterStatus === "الكل" || l.status === filterStatus);
  });
  const filteredUnits = units.filter(u => {
    const q = unitSearch.toLowerCase();
    const matchSearch = !q || (u.customerName || "").toLowerCase().includes(q) || u.sales.toLowerCase().includes(q) || u.project.toLowerCase().includes(q);
    return matchSearch && (filterUnitSales === "الكل" || u.sales === filterUnitSales);
  });

  const totalLeads = leads.length;
  const salesMap = {}; leads.forEach(l => { salesMap[l.sales] = (salesMap[l.sales] || 0) + 1; });
  const topSales = Object.entries(salesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const statusMap = {}; leads.forEach(l => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });

  const S = {
    root: { background: T.bg, minHeight: "100vh", fontFamily: "'Cairo','Tajawal',sans-serif", direction: "rtl", color: T.text },
    header: { background: T.header, borderBottom: `2px solid ${T.gold}`, border: `1px solid ${T.border}`, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 },
    logo: { fontSize: 16, fontWeight: 900, color: T.text, whiteSpace: "nowrap" },
    logoAccent: { color: T.goldDark },
    tabBar: { display: "flex", gap: 2, flexWrap: "wrap" },
    tab: (a) => ({ padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: a ? 700 : 500, background: a ? T.gold : "transparent", color: a ? "#fff" : T.sub }),
    logoutBtn: { background: "transparent", color: "#b45309", border: `1px solid ${T.gold}88`, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    body: { maxWidth: 900, margin: "0 auto", padding: "28px 16px" },
    card: { background: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.gold}`, borderRadius: 16, padding: 24, marginBottom: 20 },
    label: { fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 7, display: "block" },
    input: { width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
    select: { width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer" },
    textarea: { width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", minHeight: 100 },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    btn: { background: T.dark, color: T.gold, border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit" },
    btnSm: (c) => ({ background: c || T.border, color: c ? "#fff" : T.sub, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }),
    dupAlert: { background: "#FCEAEA", border: "1px solid #D88080", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 },
    dupAlertGreen: { background: "#D4EDE0", border: "1px solid #A8D4BC" },
    badge: (s, map) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: map[s]?.bg || T.border, color: map[s]?.color || T.sub }),
    dot: (s, map) => ({ width: 7, height: 7, borderRadius: "50%", background: map[s]?.dot || T.hint, flexShrink: 0 }),
    leadCard: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 12 },
    leadHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    infoRow: { display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 },
    infoItem: { display: "flex", flexDirection: "column", gap: 2 },
    infoLabel: { fontSize: 10, color: T.hint, fontWeight: 600 },
    infoValue: { fontSize: 13, color: T.text, fontWeight: 600 },
    feedback: { fontSize: 12, color: T.sub, background: T.input, borderRadius: 8, padding: "8px 12px", lineHeight: 1.7, marginTop: 8 },
    actions: { display: "flex", gap: 8, marginTop: 12 },
    searchBar: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 16px", color: T.text, fontSize: 13, outline: "none", width: "100%", fontFamily: "inherit", marginBottom: 16 },
    filters: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
    filterBtn: (a) => ({ padding: "6px 14px", borderRadius: 20, border: `1px solid ${a ? T.gold : T.border}`, background: a ? `${T.gold}22` : "transparent", color: a ? T.goldDark : T.sub, fontSize: 12, fontWeight: a ? 700 : 400, cursor: "pointer" }),
    statGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 },
    statCard: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px", borderTop: `3px solid ${T.gold}`, textAlign: "center" },
    statVal: { fontSize: 30, fontWeight: 900, marginBottom: 4, color: T.text },
    statLbl: { fontSize: 12, color: T.sub },
    goldLine: { width: 30, height: 2, background: T.gold, borderRadius: 2, margin: "6px auto 0" },
    toast: (t) => ({ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: t === "error" ? "#FCEAEA" : "#D4EDE0", border: `1px solid ${t === "error" ? "#D88080" : "#A8D4BC"}`, color: t === "error" ? "#7A2020" : "#0F5E3A", borderRadius: 10, padding: "12px 24px", fontSize: 13, fontWeight: 700, zIndex: 9999, whiteSpace: "nowrap" }),
    modalOverlay: { position: "fixed", inset: 0, background: "rgba(44,36,22,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" },
    modal: { background: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.gold}`, borderRadius: 16, padding: 28, width: 440, maxHeight: "90vh", overflowY: "auto" },
  };

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.logo}>🏛 <span style={S.logoAccent}>The Place</span> CRM</div>
        <div style={S.tabBar}>
          <button style={S.tab(tab === "add")} onClick={() => setTab("add")}>➕ عميل</button>
          <button style={S.tab(tab === "list")} onClick={() => setTab("list")}>👥 العملاء {leads.length > 0 && <span style={{ background: `${T.gold}33`, borderRadius: 20, padding: "1px 6px", fontSize: 10, marginRight: 2, color: T.goldDark }}>{leads.length}</span>}</button>
          <button style={S.tab(tab === "units")} onClick={() => setTab("units")}>🏠 الوحدات {units.length > 0 && <span style={{ background: `${T.gold}33`, borderRadius: 20, padding: "1px 6px", fontSize: 10, marginRight: 2, color: T.goldDark }}>{units.length}</span>}</button>
          <button style={S.tab(tab === "stats")} onClick={() => setTab("stats")}>📊 إحصائيات</button>
          {isAdmin && <button style={S.tab(tab === "users")} onClick={() => setTab("users")}>👤 المستخدمين</button>}
          <button style={S.tab(tab === "settings")} onClick={() => setTab("settings")}>⚙️ Settings</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {profileImg
            ? <img src={profileImg} alt="profile" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `2px solid ${T.gold}` }} />
            : <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${T.gold}22`, border: `1.5px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.goldDark, fontWeight: 700 }}>{currentUser.name?.charAt(0)}</div>
          }
          <span style={{ fontSize: 11, color: T.sub }}>{currentUser.name}</span>
          <button style={S.logoutBtn} onClick={handleLogout}>خروج</button>
        </div>
      </div>

      <div style={S.body}>

        {tab === "add" && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: T.text }}>إضافة عميل جديد</div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>📞 رقم التليفون *</label>
              <input ref={phoneRef} style={S.input} placeholder="01XXXXXXXXX" value={form.phone} onChange={e => handlePhoneChange(e.target.value)} autoFocus />
            </div>
            {duplicateAlert && <div style={S.dupAlert}><span style={{ fontSize: 22 }}>🚫</span><div><div style={{ fontSize: 13, fontWeight: 900, color: "#7A2020" }}>الرقم مسجل!</div><div style={{ fontSize: 12, color: "#7A2020", marginTop: 3 }}>عند: <strong>{duplicateAlert.sales}</strong> · {duplicateAlert.project} · {duplicateAlert.status}</div></div></div>}
            {form.phone.length >= 8 && !duplicateAlert && <div style={{ ...S.dupAlert, ...S.dupAlertGreen, marginBottom: 16 }}><span>✅</span><div style={{ fontSize: 13, color: "#0F5E3A", fontWeight: 700 }}>الرقم متاح</div></div>}
            <div style={S.row2}>
              <div><label style={S.label}>🧑 اسم العميل</label><input style={S.input} placeholder="اسم العميل" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} /></div>
              <div>
                <label style={S.label}>👤 السيلز</label>
                {isAdmin ? (
                  <select style={S.select} value={formSalesTarget} onChange={e => setFormSalesTarget(e.target.value)}>
                    <option value="">اختار السيلز</option>
                    {allUsersForSelect.map(u => <option key={u.username} value={u.username}>{u.name}</option>)}
                  </select>
                ) : (
                  <input style={{ ...S.input, opacity: 0.6 }} value={currentUser.name} readOnly />
                )}
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
              <label style={S.label}>📌 الحالة</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map(s => <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${form.status === s ? STATUS_STYLE[s].dot : T.border}`, background: form.status === s ? STATUS_STYLE[s].bg : "transparent", color: form.status === s ? STATUS_STYLE[s].color : T.sub, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>)}
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
            {isAdmin && <div style={S.filters}><span style={{ fontSize: 12, color: T.sub, alignSelf: "center" }}>السيلز:</span>{allSales.map(s => <button key={s} style={S.filterBtn(filterSales === s)} onClick={() => setFilterSales(s)}>{s}</button>)}</div>}
            <div style={S.filters}><span style={{ fontSize: 12, color: T.sub, alignSelf: "center" }}>الحالة:</span>{["الكل", ...STATUS_OPTIONS].map(s => <button key={s} style={S.filterBtn(filterStatus === s)} onClick={() => setFilterStatus(s)}>{s}</button>)}</div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>{filtered.length} عميل</div>
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: T.sub }}><div style={{ fontSize: 40 }}>🔍</div><div>مفيش نتايج</div></div>}
            {filtered.map(l => (
              <div key={l.id} style={S.leadCard}>
                <div style={S.leadHeader}>
                  <div>
                    {l.customerName && <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 2, color: T.text }}>{l.customerName}</div>}
                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: T.sub, fontFamily: "monospace" }}>{l.phone}</div>
                    <div style={{ fontSize: 11, color: T.hint, marginTop: 2 }}>{timeAgo(l.createdAt)}</div>
                  </div>
                  <span style={S.badge(l.status, STATUS_STYLE)}><span style={S.dot(l.status, STATUS_STYLE)} />{l.status}</span>
                </div>
                <div style={S.infoRow}>
                  <div style={S.infoItem}><span style={S.infoLabel}>👤 السيلز</span><span style={S.infoValue}>{l.sales}</span></div>
                  <div style={S.infoItem}><span style={S.infoLabel}>🏢 المشروع</span><span style={S.infoValue}>{l.project}</span></div>
                </div>
                {l.feedback && <div style={S.feedback}>💬 {l.feedback}</div>}
                <div style={S.actions}>
                  {(isAdmin || l.salesUsername === currentUser.username) && <button style={S.btnSm("#5C3A00")} onClick={() => { setEditId(l.id); setEditForm({ customerName: l.customerName || "", status: l.status, feedback: l.feedback || "", project: l.project }); }}>✏️ تعديل</button>}
                  <a href={`https://wa.me/2${l.phone}`} target="_blank" rel="noreferrer"><button style={{ ...S.btnSm(), background: "#D4EDE0", color: "#0F5E3A", border: "1px solid #A8D4BC" }}>💬 واتساب</button></a>
                  <a href={`tel:${l.phone}`}><button style={{ ...S.btnSm(), background: T.input, color: T.sub }}>📞 اتصل</button></a>
                  {(isAdmin || l.salesUsername === currentUser.username) && <button style={{ ...S.btnSm(), background: "#FCEAEA", color: "#7A2020", border: "1px solid #D88080", marginRight: "auto" }} onClick={() => setConfirmDelete(l.id)}>🗑️</button>}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "units" && (
          <>
            <div style={S.card}>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: T.text }}>🏠 إضافة وحدة جديدة</div>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>📞 رقم التليفون *</label>
                <input style={S.input} placeholder="01XXXXXXXXX" value={unitForm.phone} onChange={e => handleUnitPhoneChange(e.target.value)} />
              </div>
              {unitDupAlert && <div style={S.dupAlert}><span style={{ fontSize: 22 }}>🚫</span><div><div style={{ fontSize: 13, fontWeight: 900, color: "#7A2020" }}>الرقم مسجل في الوحدات!</div><div style={{ fontSize: 12, color: "#7A2020", marginTop: 3 }}>عند: <strong>{unitDupAlert.sales}</strong> · {unitDupAlert.project}</div></div></div>}
              {unitForm.phone.length >= 8 && !unitDupAlert && <div style={{ ...S.dupAlert, ...S.dupAlertGreen, marginBottom: 16 }}><span>✅</span><div style={{ fontSize: 13, color: "#0F5E3A", fontWeight: 700 }}>الرقم متاح</div></div>}
              <div style={S.row2}>
                <div><label style={S.label}>🧑 اسم العميل</label><input style={S.input} placeholder="اسم العميل" value={unitForm.customerName} onChange={e => setUnitForm(f => ({ ...f, customerName: e.target.value }))} /></div>
                <div>
                  <label style={S.label}>👤 السيلز</label>
                  {isAdmin ? (
                    <select style={S.select} value={unitFormSalesTarget} onChange={e => setUnitFormSalesTarget(e.target.value)}>
                      <option value="">اختار السيلز</option>
                      {allUsersForSelect.map(u => <option key={u.username} value={u.username}>{u.name}</option>)}
                    </select>
                  ) : (
                    <input style={{ ...S.input, opacity: 0.6 }} value={currentUser.name} readOnly />
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>🏢 المشروع *</label>
                <select style={S.select} value={unitForm.project} onChange={e => setUnitForm(f => ({ ...f, project: e.target.value }))}>
                  <option value="">اختار المشروع</option>
                  {PROJECTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>📌 حالة الوحدة</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Available", "Sold Out"].map(s => <button key={s} onClick={() => setUnitForm(f => ({ ...f, status: s }))} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${unitForm.status === s ? UNIT_STATUS_STYLE[s].dot : T.border}`, background: unitForm.status === s ? UNIT_STATUS_STYLE[s].bg : "transparent", color: unitForm.status === s ? UNIT_STATUS_STYLE[s].color : T.sub, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>)}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>🏠 تفاصيل الوحدة</label>
                <textarea style={S.textarea} placeholder="مثال: شقة 3 غرف - الدور 5 - مساحة 150م - سعر 2.5 مليون..." value={unitForm.details} onChange={e => setUnitForm(f => ({ ...f, details: e.target.value }))} />
              </div>
              <button style={{ ...S.btn, opacity: unitDupAlert ? .4 : 1 }} onClick={handleUnitSubmit} disabled={!!unitDupAlert}>إضافة الوحدة ✓</button>
            </div>
            <input style={S.searchBar} placeholder="🔍 ابحث في الوحدات..." value={unitSearch} onChange={e => setUnitSearch(e.target.value)} />
            {isAdmin && <div style={S.filters}><span style={{ fontSize: 12, color: T.sub, alignSelf: "center" }}>السيلز:</span>{allUnitSales.map(s => <button key={s} style={S.filterBtn(filterUnitSales === s)} onClick={() => setFilterUnitSales(s)}>{s}</button>)}</div>}
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>{filteredUnits.length} وحدة</div>
            {filteredUnits.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: T.sub }}><div style={{ fontSize: 40 }}>🏠</div><div>مفيش وحدات لسه</div></div>}
            {filteredUnits.map(u => (
              <div key={u.id} style={S.leadCard}>
                <div style={S.leadHeader}>
                  <div>
                    {u.customerName && <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 2, color: T.text }}>{u.customerName}</div>}
                    {canSeePhone(u) && <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: T.sub, fontFamily: "monospace" }}>{u.phone}</div>}
                    <div style={{ fontSize: 11, color: T.hint, marginTop: 2 }}>{timeAgo(u.createdAt)}</div>
                  </div>
                  <span style={S.badge(u.status, UNIT_STATUS_STYLE)}><span style={S.dot(u.status, UNIT_STATUS_STYLE)} />{u.status}</span>
                </div>
                <div style={S.infoRow}>
                  <div style={S.infoItem}><span style={S.infoLabel}>👤 السيلز</span><span style={S.infoValue}>{u.sales}</span></div>
                  <div style={S.infoItem}><span style={S.infoLabel}>🏢 المشروع</span><span style={S.infoValue}>{u.project}</span></div>
                </div>
                {u.details && <div style={S.feedback}>🏠 {u.details}</div>}
                <div style={S.actions}>
                  {canSeePhone(u) && <a href={`https://wa.me/2${u.phone}`} target="_blank" rel="noreferrer"><button style={{ ...S.btnSm(), background: "#D4EDE0", color: "#0F5E3A", border: "1px solid #A8D4BC" }}>💬 واتساب</button></a>}
                  {canSeePhone(u) && <a href={`tel:${u.phone}`}><button style={{ ...S.btnSm(), background: T.input, color: T.sub }}>📞 اتصل</button></a>}
                  {(isAdmin || u.salesUsername === currentUser.username) && <button style={{ ...S.btnSm(), background: "#FCEAEA", color: "#7A2020", border: "1px solid #D88080", marginRight: "auto" }} onClick={() => setConfirmDeleteUnit(u.id)}>🗑️</button>}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "stats" && (
          <>
            <div style={S.statGrid}>
              <div style={S.statCard}><div style={{ fontSize: 28, marginBottom: 6 }}>👥</div><div style={S.statVal}>{totalLeads}</div><div style={S.goldLine} /><div style={S.statLbl}>إجمالي العملاء</div></div>
              <div style={S.statCard}><div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div><div style={{ ...S.statVal, color: "#0F5E3A" }}>{leads.filter(l => l.status === "Done Deal").length}</div><div style={S.goldLine} /><div style={S.statLbl}>Done Deals</div></div>
              <div style={S.statCard}><div style={{ fontSize: 28, marginBottom: 6 }}>🔥</div><div style={{ ...S.statVal, color: T.goldDark }}>{leads.filter(l => l.status === "Interested" || l.status === "Meeting").length}</div><div style={S.goldLine} /><div style={S.statLbl}>Hot Leads</div></div>
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 18, color: T.text }}>🏅 ترتيب السيلز</div>
              {topSales.length === 0 && <div style={{ color: T.sub, fontSize: 13 }}>مفيش بيانات لسه</div>}
              {topSales.map(([name, count], i) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: i === 0 ? `${T.gold}22` : T.input, color: i === 0 ? T.goldDark : T.sub, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, border: `1px solid ${i === 0 ? T.gold : T.border}` }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{name}</span><span style={{ fontSize: 13, color: T.goldDark, fontWeight: 700 }}>{count} عميل</span></div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3 }}><div style={{ height: "100%", width: `${(count / topSales[0][1]) * 100}%`, background: i === 0 ? T.gold : T.goldDark, borderRadius: 3 }} /></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 18, color: T.text }}>📌 توزيع الحالات</div>
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

        {tab === "users" && isAdmin && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: T.text }}>➕ إضافة مستخدم جديد</div>
            <div style={S.row2}>
              <div><label style={S.label}>👤 اسم المستخدم</label><input style={S.input} placeholder="username" value={newUserForm.username} onChange={e => setNewUserForm(f => ({ ...f, username: e.target.value }))} /></div>
              <div><label style={S.label}>🔒 كلمة المرور</label><input style={S.input} placeholder="password" value={newUserForm.password} onChange={e => setNewUserForm(f => ({ ...f, password: e.target.value }))} /></div>
            </div>
            <div style={S.row2}>
              <div><label style={S.label}>🧑 الاسم الكامل</label><input style={S.input} placeholder="اسم الموظف" value={newUserForm.name} onChange={e => setNewUserForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label style={S.label}>🎭 الصلاحية</label>
                <select style={S.select} value={newUserForm.role} onChange={e => setNewUserForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button style={{ ...S.btn, marginBottom: 24 }} onClick={handleAddUser}>إضافة المستخدم ✓</button>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, color: T.text }}>👥 المستخدمين الحاليين</div>
            <div style={{ background: T.input, borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.border}` }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{ADMIN.name}</div><div style={{ fontSize: 12, color: T.sub }}>@{ADMIN.username}</div></div>
              <span style={{ fontSize: 11, background: `${T.gold}22`, color: T.goldDark, padding: "3px 10px", borderRadius: 20, fontWeight: 700, border: `1px solid ${T.gold}44` }}>Admin</span>
            </div>
            {users.map(u => (
              <div key={u.id} style={{ background: T.input, borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.border}` }}>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{u.name}</div><div style={{ fontSize: 12, color: T.sub }}>@{u.username}</div></div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, background: u.role === "admin" ? `${T.gold}22` : T.border, color: u.role === "admin" ? T.goldDark : T.sub, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{u.role === "admin" ? "Admin" : "Sales"}</span>
                  <button style={{ ...S.btnSm(), background: "#FCEAEA", color: "#7A2020", border: "1px solid #D88080" }} onClick={() => handleDeleteUser(u.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
          <>

            <div style={S.card}>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: T.text }}>📊 تصدير واستيراد البيانات</div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>📤 تصدير إلى Excel</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button style={{ ...S.btnSm("#0F5E3A"), padding: "10px 20px", fontSize: 13 }} onClick={handleExportLeads}>👥 تصدير العملاء ({leads.length})</button>
                  <button style={{ ...S.btnSm("#5C3A00"), padding: "10px 20px", fontSize: 13 }} onClick={handleExportUnits}>🏠 تصدير الوحدات ({units.length})</button>
                </div>
              </div>
              {isAdmin && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>📥 استيراد من Excel/CSV</div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 12, direction: "rtl" }}>الملف لازم يكون CSV بالترتيب: الاسم، التليفون، السيلز، المشروع، الحالة، التفاصيل</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div>
                      <input type="file" accept=".csv" style={{ display: "none" }} id="importLeads" onChange={handleImportLeads} />
                      <button style={{ ...S.btnSm("#1e3a5f"), padding: "10px 20px", fontSize: 13 }} onClick={() => document.getElementById("importLeads").click()}>👥 استيراد عملاء</button>
                    </div>
                    <div>
                      <input type="file" accept=".csv" style={{ display: "none" }} id="importUnits" onChange={handleImportUnits} />
                      <button style={{ ...S.btnSm("#1e3a5f"), padding: "10px 20px", fontSize: 13 }} onClick={() => document.getElementById("importUnits").click()}>🏠 استيراد وحدات</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: T.text }}>📸 صورة البروفايل</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                {profileImg
                  ? <img src={profileImg} alt="profile" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${T.gold}` }} />
                  : <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${T.gold}22`, border: `2px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: T.goldDark, fontWeight: 700 }}>{currentUser.name?.charAt(0)}</div>
                }
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: T.text }}>{currentUser.name}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>@{currentUser.username} · {currentUser.role}</div>
                  <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImgUpload} />
                  <button style={{ ...S.btnSm("#5C3A00"), padding: "8px 16px" }} onClick={() => imgRef.current.click()}>📸 رفع صورة</button>
                  {profileImg && <button style={{ ...S.btnSm(), background: "#FCEAEA", color: "#7A2020", border: "1px solid #D88080", padding: "8px 16px", marginRight: 8 }} onClick={() => { setProfileImg(""); localStorage.removeItem(`crm_img_${currentUser.username}`); }}>🗑️ حذف</button>}
                </div>
              </div>
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: T.text }}>🔒 تغيير كلمة المرور</div>
              <div style={{ marginBottom: 16 }}><label style={S.label}>كلمة المرور القديمة</label><input style={S.input} type="password" placeholder="••••••••" value={settingsForm.oldPass} onChange={e => setSettingsForm(f => ({ ...f, oldPass: e.target.value }))} /></div>
              <div style={S.row2}>
                <div><label style={S.label}>كلمة المرور الجديدة</label><input style={S.input} type="password" placeholder="••••••••" value={settingsForm.newPass} onChange={e => setSettingsForm(f => ({ ...f, newPass: e.target.value }))} /></div>
                <div><label style={S.label}>تأكيد كلمة المرور</label><input style={S.input} type="password" placeholder="••••••••" value={settingsForm.confirmPass} onChange={e => setSettingsForm(f => ({ ...f, confirmPass: e.target.value }))} /></div>
              </div>
              <button style={S.btn} onClick={handleChangePassword}>حفظ كلمة المرور</button>
            </div>
          </>
        )}
      </div>

      {editId && (
        <div style={S.modalOverlay} onClick={() => setEditId(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, color: T.text }}>✏️ تعديل بيانات العميل</div>
            <div style={{ marginBottom: 16 }}><label style={S.label}>🧑 اسم العميل</label><input style={S.input} value={editForm.customerName || ""} onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))} /></div>
            <div style={{ marginBottom: 16 }}><label style={S.label}>🏢 المشروع</label><select style={S.select} value={editForm.project} onChange={e => setEditForm(f => ({ ...f, project: e.target.value }))}>{PROJECTS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>📌 الحالة</label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map(s => <button key={s} onClick={() => setEditForm(f => ({ ...f, status: s }))} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${editForm.status === s ? STATUS_STYLE[s].dot : T.border}`, background: editForm.status === s ? STATUS_STYLE[s].bg : "transparent", color: editForm.status === s ? STATUS_STYLE[s].color : T.sub, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={S.label}>💬 الفيدباك</label><textarea style={S.textarea} value={editForm.feedback || ""} onChange={e => setEditForm(f => ({ ...f, feedback: e.target.value }))} /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.btn} onClick={() => handleUpdate(editId)}>حفظ</button>
              <button style={{ ...S.btnSm(), padding: "13px 20px", background: T.input }} onClick={() => setEditId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={S.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...S.modal, width: 340, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8, color: T.text }}>تأكيد الحذف</div>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 24 }}>هتمسح بيانات العميل ده نهائياً</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btn, background: "#7A2020", color: "#fff" }} onClick={() => handleDelete(confirmDelete)}>نعم، احذف</button>
              <button style={{ ...S.btnSm(), padding: "13px 20px", flex: 1, background: T.input }} onClick={() => setConfirmDelete(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteUnit && (
        <div style={S.modalOverlay} onClick={() => setConfirmDeleteUnit(null)}>
          <div style={{ ...S.modal, width: 340, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8, color: T.text }}>تأكيد الحذف</div>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 24 }}>هتمسح بيانات الوحدة دي نهائياً</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btn, background: "#7A2020", color: "#fff" }} onClick={() => handleDeleteUnit(confirmDeleteUnit)}>نعم، احذف</button>
              <button style={{ ...S.btnSm(), padding: "13px 20px", flex: 1, background: T.input }} onClick={() => setConfirmDeleteUnit(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}
