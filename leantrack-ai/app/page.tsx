"use client";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Leaf,
  House,
  Utensils,
  ScanLine,
  ChartNoAxesCombined,
  User,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Sun,
  Moon,
  X,
  Camera,
  Upload,
  Check,
  Download,
  Sparkles,
  Trash2,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import {
  initial,
  today,
  mealSchema,
  profileSchema,
  weightSchema,
  averages,
  csv,
  weeklySummary,
  type State,
  type Meal,
} from "@/lib/model";
import { localRepository } from "@/lib/storage";
const slots = ["breakfast", "lunch", "dinner", "snacks"] as const;
const dictionary: Record<string, string> = {
  Home: "หน้าหลัก",
  Food: "อาหาร",
  Scan: "สแกน",
  Progress: "ความคืบหน้า",
  Profile: "โปรไฟล์",
  "Your daily overview": "ภาพรวมประจำวัน",
  "Small steps. Real progress.": "ก้าวเล็ก ๆ สู่ความสำเร็จ",
  "Today’s nutrition": "โภชนาการวันนี้",
  "Food diary": "บันทึกอาหาร",
  "Add meal": "เพิ่มมื้ออาหาร",
  "No meals logged yet": "ยังไม่มีบันทึกอาหาร",
  Breakfast: "อาหารเช้า",
  Lunch: "อาหารกลางวัน",
  Dinner: "อาหารเย็น",
  Snacks: "ของว่าง",
  "Weight journey": "เส้นทางน้ำหนัก",
  "Log weight": "บันทึกน้ำหนัก",
  "Your AI coach": "โค้ช AI ของคุณ",
  "Complete your profile": "กรอกโปรไฟล์ของคุณ",
  "Daily calories": "แคลอรีต่อวัน",
  Protein: "โปรตีน",
  Carbs: "คาร์บ",
  Fat: "ไขมัน",
  Save: "บันทึก",
  Cancel: "ยกเลิก",
  "Scan your meal": "สแกนอาหารของคุณ",
  "Your profile": "โปรไฟล์ของคุณ",
  "Starting weight": "น้ำหนักเริ่มต้น",
  "Goal weight": "น้ำหนักเป้าหมาย",
  Height: "ส่วนสูง",
  Age: "อายุ",
  Sex: "เพศ",
  "Activity level": "ระดับกิจกรรม",
  Preferences: "ความชอบ",
  "Export your data": "ส่งออกข้อมูล",
  "Weekly reflection": "สรุปประจำสัปดาห์",
  "Local only · Private by design": "เก็บในอุปกรณ์ · เป็นส่วนตัว",
  "Review before saving": "ตรวจสอบก่อนบันทึก",
  "No weight entries yet": "ยังไม่มีบันทึกน้ำหนัก",
};
export default function App() {
  const [state, setState] = useState<State>(initial),
    [ready, setReady] = useState(false),
    [storageBlocked, setStorageBlocked] = useState(false),
    [tab, setTab] = useState("Home"),
    [lang, setLang] = useState("en"),
    [dark, setDark] = useState(false),
    [date, setDate] = useState(today()),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [meal, setMeal] = useState<Meal | null>(null),
    [weightOpen, setWeightOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [photo, setPhoto] = useState(""),
    [analysisMode, setAnalysisMode] = useState(""),
    [coach, setCoach] = useState(""),
    [coachMode, setCoachMode] = useState("local"),
    [token, setToken] = useState("");
  const t = (s: string) => (lang === "th" ? dictionary[s] || s : s);
  useEffect(() => {
    try {
      setState(localRepository.load());
    } catch {
      setStorageBlocked(true);
      setError(
        "Stored data could not be read. Export or recover your browser data before resetting. Changes will not be saved.",
      );
      return;
    } finally {
      setReady(true);
    }
    setLang(localStorage.getItem("leantrack-lang") || "en");
    setDark(localStorage.getItem("leantrack-theme") === "dark");
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() =>
          setNotice("Offline support is unavailable in this browser."),
        );
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.lang = lang;
    if (ready) {
      try {
        localStorage.setItem("leantrack-lang", lang);
        localStorage.setItem("leantrack-theme", dark ? "dark" : "light");
      } catch {
        // Theme and language remain usable for this session when storage is disabled.
      }
    }
  }, [dark, lang, ready]);
  function update(next: State) {
    if (!ready) return;
    if (storageBlocked) {
      setError(
        "Storage recovery is required before making changes. Your existing browser data has been preserved.",
      );
      return;
    }
    try {
      localRepository.save(next);
      setState(next);
      setError("");
      setNotice(lang === "th" ? "บันทึกแล้ว" : "Saved on this device");
    } catch {
      setError(
        "Unable to save. Browser storage may be full or disabled. Your previous data is unchanged.",
      );
    }
  }
  const dayMeals = state.meals.filter((m) => m.date === date),
    sum = dayMeals.reduce(
      (s, m) => ({
        calories: s.calories + m.calories,
        protein: s.protein + m.protein,
        carbs: s.carbs + m.carbs,
        fat: s.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  const target = Number(state.profile.target) || 0,
    latest =
      [...state.weights].sort((a, b) => b.date.localeCompare(a.date))[0]?.kg ??
      state.profile.start;
  const displayWeight = (v: number) =>
    `${(state.profile.units === "lb" ? v * 2.2046226218 : v).toFixed(1)} ${state.profile.units}`;
  function newMeal(slot: Meal["slot"] = "breakfast") {
    setAnalysisMode("");
    setMeal({
      id: crypto.randomUUID(),
      date,
      slot,
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  }
  function exportData(kind: "meals" | "weights") {
    const rows = state[kind];
    const headers =
      kind === "meals"
        ? ["id", "date", "slot", "name", "calories", "protein", "carbs", "fat"]
        : ["date", "kg"];
    const url = URL.createObjectURL(
      new Blob([csv(rows, headers)], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `leantrack-${kind}-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function scan(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 4 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG or WebP image smaller than 4 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      setPhoto(image);
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Scan failed");
      setAnalysisMode(data.mode);
      setMeal({ id: crypto.randomUUID(), date, slot: "lunch", ...data.meal });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read photo.");
    } finally {
      setBusy(false);
    }
  }
  async function askCoach() {
    if (
      !confirm(
        "Send your journal to the server for a weekly reflection? Only an aggregate summary is forwarded to OpenAI when configured.",
      )
    )
      return;
    setBusy(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(state),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCoach(data.summary);
      setCoachMode(data.mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coach unavailable");
      setCoach(weeklySummary(state));
      setCoachMode("local");
    } finally {
      setBusy(false);
    }
  }
  const nutrition = (
    <section className="card nutrition">
      <div className="section-title">
        <h2>{t("Today’s nutrition")}</h2>
        <span className="pill">{date === today() ? "Today" : date}</span>
      </div>
      <div className="nutrition-body">
        <div
          className="ring"
          style={{
            background: `conic-gradient(var(--green) ${target ? Math.min(100, (sum.calories / target) * 100) : 0}%,var(--line) 0)`,
          }}
        >
          <div>
            <span className="muted tiny">{t("Daily calories")}</span>
            <strong>{sum.calories.toLocaleString()}</strong>
            <span className="muted tiny">
              {target ? `of ${target.toLocaleString()} kcal` : "kcal logged"}
            </span>
          </div>
        </div>
        <div className="macros">
          {(["protein", "carbs", "fat"] as const).map((k, i) => (
            <div key={k}>
              <div className="between">
                <span>
                  <i
                    style={{ background: ["#44876a", "#d9a756", "#829cc2"][i] }}
                  />
                  {t(k[0].toUpperCase() + k.slice(1))}
                </span>
                <b>
                  {sum[k]} <small>g</small>
                </b>
              </div>
              <div className="bar">
                <div
                  style={{
                    width: `${sum.calories ? Math.min(100, ((sum[k] * (k === "fat" ? 9 : 4)) / sum.calories) * 100) : 0}%`,
                    background: ["#44876a", "#d9a756", "#829cc2"][i],
                  }}
                />
              </div>
            </div>
          ))}
          <p className="tiny muted">
            {target
              ? `${Math.max(0, target - sum.calories)} kcal remaining`
              : "Set an optional target in your profile."}
          </p>
        </div>
      </div>
    </section>
  );
  const diary = (
    <section className="card">
      <div className="section-title">
        <h2>{t("Food diary")}</h2>
        <button className="text-button" onClick={() => newMeal()}>
          <Plus size={16} />
          {t("Add meal")}
        </button>
      </div>
      {slots.map((slot, i) => (
        <div className="meal-group" key={slot}>
          <div className="between">
            <span className="meal-label">
              <span className="meal-icon">{["☀", "◒", "☾", "◌"][i]}</span>
              {t(slot[0].toUpperCase() + slot.slice(1))}
            </span>
            <button
              aria-label={`Add ${slot}`}
              className="icon-button"
              onClick={() => newMeal(slot)}
            >
              <Plus size={17} />
            </button>
          </div>
          {dayMeals
            .filter((m) => m.slot === slot)
            .map((m) => (
              <div className="meal-row" key={m.id}>
                <div>
                  <b>{m.name}</b>
                  <p className="tiny muted">
                    P {m.protein} · C {m.carbs} · F {m.fat} g
                  </p>
                </div>
                <span>
                  {m.calories} <small>kcal</small>
                </span>
                <button
                  className="icon-button"
                  aria-label={`Edit ${m.name}`}
                  onClick={() => {
                    setAnalysisMode("");
                    setMeal(m);
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${m.name}`}
                  onClick={() => {
                    if (confirm(`Delete ${m.name}?`))
                      update({
                        ...state,
                        meals: state.meals.filter((x) => x.id !== m.id),
                      });
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          {!dayMeals.some((m) => m.slot === slot) && (
            <p className="empty-line">{t("No meals logged yet")}</p>
          )}
        </div>
      ))}
    </section>
  );
  const progress = (
    <section className="card">
      <div className="section-title">
        <h2>{t("Weight journey")}</h2>
        <button className="text-button" onClick={() => setWeightOpen(true)}>
          <Plus size={16} />
          {t("Log weight")}
        </button>
      </div>
      <div className="weight-stats">
        <div>
          <span className="muted tiny">
            {state.weights.length ? "Latest weight" : "Starting weight"}
          </span>
          <strong>{displayWeight(latest)}</strong>
        </div>
        <div>
          <span className="muted tiny">First goal</span>
          <strong className="goal-number">
            {displayWeight(state.profile.goal)}
          </strong>
        </div>
      </div>
      <div className="chart">
        {state.weights.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={averages(state.weights).map((w) => ({
                ...w,
                kg: state.profile.units === "lb" ? w.kg * 2.20462 : w.kg,
                average:
                  state.profile.units === "lb"
                    ? w.average * 2.20462
                    : w.average,
              }))}
            >
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                domain={["auto", "auto"]}
                width={40}
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Line
                dataKey="kg"
                name={state.profile.units}
                stroke="#b0c6b9"
                dot
              />
              <Line
                dataKey="average"
                name="7-day average"
                stroke="#348464"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <ChartNoAxesCombined size={32} />
            <p>{t("No weight entries yet")}</p>
            <span className="tiny muted">
              Your journey starts with one check-in.
            </span>
          </div>
        )}
      </div>
      <div className="between tiny muted">
        <span>● 7-day moving average</span>
        <span>
          {Math.max(
            0,
            Math.min(
              100,
              ((state.profile.start - latest) /
                (state.profile.start - state.profile.goal || 1)) *
                100,
            ),
          ).toFixed(0)}
          % toward goal
        </span>
      </div>
      {tab === "Progress" &&
        state.weights.map((w) => (
          <div className="meal-row" key={w.date}>
            <span>{w.date}</span>
            <b>{displayWeight(w.kg)}</b>
            <button
              className="icon-button"
              aria-label={`Delete weight ${w.date}`}
              onClick={() => {
                if (confirm("Delete this weigh-in?"))
                  update({
                    ...state,
                    weights: state.weights.filter((x) => x.date !== w.date),
                  });
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
    </section>
  );
  function profileForm() {
    return (
      <form
        className="card profile-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const parsed = profileSchema.safeParse({
            ...state.profile,
            ...Object.fromEntries(f),
            start: Number(f.get("start")),
            goal: Number(f.get("goal")),
            height: Number(f.get("height")),
            onboarded: true,
          });
          if (!parsed.success) {
            setError(
              parsed.error.issues
                .map((i) => `${i.path}: ${i.message}`)
                .join("; "),
            );
            return;
          }
          update({ ...state, profile: parsed.data });
        }}
      >
        <div className="section-title">
          <h2>{t("Your profile")}</h2>
          <User size={20} />
        </div>
        <p className="muted">
          {lang === "th"
            ? "กรุณาระบุข้อมูลที่ขาดหาย ไม่มีการตั้งเป้าแคลอรีอัตโนมัติ"
            : "Tell us a little about yourself. No calorie target is assumed."}
        </p>
        <div className="form-grid">
          {[
            ["start", "Starting weight", state.profile.start],
            ["goal", "Goal weight", state.profile.goal],
            ["height", "Height", state.profile.height],
            ["age", "Age", state.profile.age],
            ["target", "Daily calories", state.profile.target],
          ].map(([key, label, value]) => (
            <label key={key}>
              {t(String(label))}{" "}
              {key === "height"
                ? "(cm)"
                : key === "start" || key === "goal"
                  ? "(kg)"
                  : key === "target"
                    ? "(optional)"
                    : ""}
              <input
                name={String(key)}
                type="number"
                step={key === "age" || key === "target" ? "1" : "0.1"}
                defaultValue={value}
                required={key !== "target"}
                min={
                  key === "age"
                    ? 18
                    : key === "target"
                      ? 800
                      : key === "height"
                        ? 80
                        : 20
                }
                max={
                  key === "age"
                    ? 110
                    : key === "target"
                      ? 6000
                      : key === "height"
                        ? 250
                        : 400
                }
              />
            </label>
          ))}
          <label>
            {t("Sex")}
            <select name="sex" defaultValue={state.profile.sex} required>
              <option value="">Choose / เลือก</option>
              <option value="female">Female / หญิง</option>
              <option value="male">Male / ชาย</option>
              <option value="unspecified">Prefer not to say / ไม่ระบุ</option>
            </select>
          </label>
          <label>
            {t("Activity level")}
            <select
              name="activity"
              defaultValue={state.profile.activity}
              required
            >
              <option value="">Choose / เลือก</option>
              <option value="low">Low / น้อย</option>
              <option value="moderate">Moderate / ปานกลาง</option>
              <option value="high">High / มาก</option>
            </select>
          </label>
          <label>
            Weight display / หน่วย
            <select name="units" defaultValue={state.profile.units}>
              <option value="kg">Kilograms</option>
              <option value="lb">Pounds</option>
            </select>
          </label>
        </div>
        <label>
          {t("Preferences")}
          <textarea
            name="preferences"
            maxLength={500}
            defaultValue={state.profile.preferences}
            placeholder="Dietary preferences, allergies / อาหารที่แพ้"
          />
        </label>
        <p className="tiny muted">
          For adults 18+. Optional calorie targets should be agreed with a
          qualified professional when appropriate.
        </p>
        <button className="primary" type="submit">
          <Check size={17} />
          {t("Save")}
        </button>
      </form>
    );
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setTab("Home")}>
          <span className="brand-icon">
            <Leaf size={24} />
          </span>
          LeanTrack<span className="ai">AI</span>
        </a>
        <p className="sidebar-caption">YOUR EVERYDAY WELLNESS</p>
        <nav>
          {["Home", "Food", "Scan", "Progress", "Profile"].map((v, i) => {
            const Icon = [House, Utensils, ScanLine, ChartNoAxesCombined, User][
              i
            ];
            return (
              <button
                key={v}
                className={tab === v ? "active" : ""}
                onClick={() => setTab(v)}
              >
                <Icon size={20} />
                {t(v)}
                {tab === v && <span className="nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={21} />
          <p>
            Your journey, your data.
            <br />
            <span className="tiny muted">Stored only on this device.</span>
          </p>
        </div>
      </aside>
      <div className="main-shell">
        <header>
          <a
            className="mobile-brand brand"
            href="#"
            onClick={() => setTab("Home")}
          >
            <span className="brand-icon">
              <Leaf size={21} />
            </span>
            LeanTrack<span className="ai">AI</span>
          </a>
          <span className="desktop-only muted tiny">
            A little more mindful. A little healthier.
          </span>
          <div className="header-actions">
            <button
              className="language"
              onClick={() => setLang(lang === "en" ? "th" : "en")}
            >
              {lang === "en" ? "EN / ไทย" : "ไทย / EN"}
            </button>
            <button
              className="icon-button"
              aria-label="Toggle dark mode"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="avatar"
              aria-label="Profile"
              onClick={() => setTab("Profile")}
            >
              <User size={20} />
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {new Date(date + "T12:00:00").toLocaleDateString(
                  lang === "th" ? "th-TH" : "en-US",
                  { weekday: "long", month: "long", day: "numeric" },
                )}
              </p>
              <h1>
                {t(
                  tab === "Home"
                    ? "Your daily overview"
                    : tab === "Food"
                      ? "Food diary"
                      : tab === "Scan"
                        ? "Scan your meal"
                        : tab === "Progress"
                          ? "Weight journey"
                          : "Your profile",
                )}
                <span className="heading-dot">.</span>
              </h1>
              <p className="muted">{t("Small steps. Real progress.")}</p>
            </div>
            {(tab === "Home" || tab === "Food") && (
              <input
                aria-label="Diary date"
                className="date-picker"
                type="date"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value || today())}
              />
            )}
          </div>
          {error && (
            <div role="alert" className="alert">
              {error}
              <button aria-label="Dismiss" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              {notice}
              <button aria-label="Dismiss" onClick={() => setNotice("")}>
                <X size={14} />
              </button>
            </div>
          )}
          {!state.profile.onboarded && tab !== "Profile" && (
            <button className="onboard" onClick={() => setTab("Profile")}>
              <span className="onboard-icon">
                <Leaf size={20} />
              </span>
              <span>
                <b>{t("Complete your profile")}</b>
                <small>
                  {lang === "th"
                    ? "เริ่มที่ 95 กก. เป้าหมาย 90 กก. · ระบุอายุ เพศ และกิจกรรม"
                    : "95 kg → 90 kg · Add your age, activity and preferences to get started."}
                </small>
              </span>
              <ChevronRight size={20} />
            </button>
          )}
          {tab === "Home" && (
            <>
              <div className="dashboard-grid">
                <div className="stack">
                  {nutrition}
                  {diary}
                </div>
                <div className="stack">
                  <section className="scan-card">
                    <span className="pill light">
                      <Sparkles size={13} /> A LITTLE HELP FROM AI
                    </span>
                    <div className="scan-art">
                      <div className="scan-corner tl" />
                      <div className="scan-corner tr" />
                      <div className="scan-corner bl" />
                      <div className="scan-corner br" />
                      <div className="plate">
                        <span>🥗</span>
                      </div>
                      <span className="floating-tag">PHOTO → FOOD LOG</span>
                    </div>
                    <h2>
                      Less logging.
                      <br />
                      More living.
                    </h2>
                    <p>
                      Snap your meal, review the estimate,
                      <br />
                      and make it yours.
                    </p>
                    <button onClick={() => setTab("Scan")}>
                      <ScanLine size={18} /> {t("Scan your meal")}
                      <ArrowUpRight size={18} />
                    </button>
                    <small>Estimates, always. Your review matters.</small>
                  </section>
                  {progress}
                  <button
                    className="coach-teaser"
                    onClick={() => {
                      setTab("Progress");
                      setCoach(weeklySummary(state));
                    }}
                  >
                    <span className="coach-icon">
                      <Sparkles size={21} />
                    </span>
                    <span>
                      <b>{t("Your AI coach")}</b>
                      <small>A thoughtful look at your week</small>
                    </span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="footer-note">
                <ShieldCheck size={14} />
                {t("Local only · Private by design")}
              </div>
            </>
          )}
          {tab === "Food" && (
            <div className="stack">
              {nutrition}
              {diary}
            </div>
          )}
          {tab === "Scan" && (
            <div className="scan-page card">
              <span className="pill">PHOTO FOOD JOURNAL</span>
              <h2>{t("Scan your meal")}</h2>
              <p className="muted">
                {lang === "th"
                  ? "ถ่ายภาพหรืออัปโหลด รูปภาพอาจประเมินผิด กรุณาตรวจสอบก่อนบันทึก"
                  : "A photo is a starting point, not a measurement. Review portions and every estimate before saving."}
              </p>
              <label className="upload-zone">
                {photo ? (
                  <img src={photo} alt="Selected meal" />
                ) : (
                  <>
                    <Camera size={44} />
                    <b>Take a photo / ถ่ายภาพ</b>
                    <span className="tiny muted">
                      JPG, PNG, WebP · up to 4 MB
                    </span>
                  </>
                )}
                <input
                  aria-label="Take meal photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  disabled={busy}
                  onChange={(e) => scan(e.target.files?.[0])}
                />
              </label>
              <label className="primary upload-button">
                <Upload size={18} />
                {busy ? "Preparing estimate…" : "Upload from library / อัปโหลด"}
                <input
                  aria-label="Upload meal photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(e) => scan(e.target.files?.[0])}
                />
              </label>
              <p className="demo-note">
                Without configured server credentials, this uses a clearly
                labeled example. Demo photos stay on your device. With AI
                enabled, the photo is sent to OpenAI only when you select it.
              </p>
              <label>
                AI access token (optional, session only)
                <input
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </label>
              <button className="text-button" onClick={() => newMeal("lunch")}>
                Enter nutrition manually <ChevronRight size={16} />
              </button>
            </div>
          )}
          {tab === "Progress" && (
            <div className="stack">
              {progress}
              <section className="card">
                <h2>Nutrition over the last 7 days</h2>
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - 6 + i);
                        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                        return {
                          date: key.slice(5),
                          calories: state.meals
                            .filter((m) => m.date === key)
                            .reduce((s, m) => s + m.calories, 0),
                        };
                      })}
                    >
                      <XAxis dataKey="date" />
                      <YAxis width={40} />
                      <Tooltip />
                      <Area
                        dataKey="calories"
                        stroke="#348464"
                        fill="#34846430"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="tiny muted">
                  Zero means no calories logged; it does not establish zero
                  intake.
                </p>
              </section>
              <section className="card coach">
                <Sparkles size={25} />
                <h2>{t("Weekly reflection")}</h2>
                <span className="pill">
                  {coachMode === "ai"
                    ? "AI GENERATED · REVIEW CRITICALLY"
                    : "NON-AI · LOCAL SUMMARY"}
                </span>
                <p>{coach || weeklySummary(state)}</p>
                <button
                  className="secondary"
                  onClick={() => {
                    setCoach(weeklySummary(state));
                    setCoachMode("local");
                  }}
                >
                  Refresh weekly summary
                </button>
                <label>
                  AI access token (session only)
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </label>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={askCoach}
                >
                  {busy ? "Preparing…" : "Ask AI coach (optional)"}
                </button>
              </section>
            </div>
          )}
          {tab === "Profile" && (
            <div className="stack">
              {profileForm()}
              <section className="card">
                <h2>{t("Export your data")}</h2>
                <p className="muted">
                  Download a private copy. CSV exports use kg for consistent
                  records.
                </p>
                <div className="button-row">
                  <button
                    className="secondary"
                    onClick={() => exportData("meals")}
                  >
                    <Download size={17} />
                    Food CSV
                  </button>
                  <button
                    className="secondary"
                    onClick={() => exportData("weights")}
                  >
                    <Download size={17} />
                    Weight CSV
                  </button>
                </div>
              </section>
              <section className="card">
                <h2>Make yourself at home</h2>
                <p className="muted">
                  On iPhone, open in Safari → Share → Add to Home Screen. Your
                  logs stay in this browser; clearing site data removes them.
                  Export regularly. No cloud sync is enabled.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    if (
                      confirm(
                        "Permanently erase all LeanTrack data on this device? Export first.",
                      )
                    )
                      update(structuredClone(initial));
                  }}
                >
                  Erase local data
                </button>
              </section>
            </div>
          )}
        </main>
      </div>
      <nav className="bottom-nav">
        {["Home", "Food", "Scan", "Progress", "Profile"].map((v, i) => {
          const Icon = [House, Utensils, ScanLine, ChartNoAxesCombined, User][
            i
          ];
          return (
            <button
              key={v}
              className={`${tab === v ? "active" : ""} ${v === "Scan" ? "scan-nav" : ""}`}
              onClick={() => setTab(v)}
            >
              <span>
                <Icon size={21} />
              </span>
              <small>{t(v)}</small>
            </button>
          );
        })}
      </nav>
      {meal && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Meal editor"
          >
            <div className="section-title">
              <h2>{t("Review before saving")}</h2>
              <button
                className="icon-button"
                aria-label="Close meal editor"
                onClick={() => setMeal(null)}
              >
                <X />
              </button>
            </div>
            {analysisMode && (
              <p className="demo-note">
                {analysisMode === "demo"
                  ? "DEMO EXAMPLE — This is not an analysis of your photo. Replace all values with your own information."
                  : "AI ESTIMATE — Portions, oils and ingredients may be wrong. Verify every value."}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const result = mealSchema.safeParse({
                  ...meal,
                  ...Object.fromEntries(f),
                  calories: Number(f.get("calories")),
                  protein: Number(f.get("protein")),
                  carbs: Number(f.get("carbs")),
                  fat: Number(f.get("fat")),
                });
                if (!result.success) {
                  setError(
                    "Enter a food name and valid non-negative nutrition values.",
                  );
                  return;
                }
                update({
                  ...state,
                  meals: [
                    ...state.meals.filter((m) => m.id !== meal.id),
                    result.data,
                  ],
                });
                setMeal(null);
              }}
            >
              <label>
                Food name / ชื่ออาหาร
                <input
                  name="name"
                  defaultValue={meal.name}
                  maxLength={120}
                  placeholder="e.g. ข้าวกะเพราไก่ / chicken basil rice"
                  required
                />
              </label>
              <div className="form-grid">
                <label>
                  Date / วันที่
                  <input
                    name="date"
                    type="date"
                    defaultValue={meal.date}
                    max={today()}
                    required
                  />
                </label>
                <label>
                  Meal / มื้ออาหาร
                  <select name="slot" defaultValue={meal.slot}>
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {t(s[0].toUpperCase() + s.slice(1))}
                      </option>
                    ))}
                  </select>
                </label>
                {(["calories", "protein", "carbs", "fat"] as const).map((k) => (
                  <label key={k}>
                    {t(
                      k === "calories"
                        ? "Daily calories"
                        : k[0].toUpperCase() + k.slice(1),
                    )}{" "}
                    ({k === "calories" ? "kcal" : "g"})
                    <input
                      name={k}
                      type="number"
                      step="0.1"
                      min="0"
                      max={k === "calories" ? 10000 : 1000}
                      defaultValue={meal[k]}
                      required
                    />
                  </label>
                ))}
              </div>
              <button className="primary" type="submit">
                <Check size={17} />
                {t("Save")}
              </button>
            </form>
          </section>
        </div>
      )}
      {weightOpen && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Weight editor"
          >
            <div className="section-title">
              <h2>{t("Log weight")}</h2>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={() => setWeightOpen(false)}
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const result = weightSchema.safeParse({
                  date: f.get("date"),
                  kg:
                    Number(f.get("weight")) /
                    (state.profile.units === "lb" ? 2.2046226218 : 1),
                });
                if (!result.success) {
                  setError(
                    "Enter a valid date and weight between 20 and 400 kg.",
                  );
                  return;
                }
                update({
                  ...state,
                  weights: [
                    ...state.weights.filter((w) => w.date !== result.data.date),
                    result.data,
                  ],
                });
                setWeightOpen(false);
              }}
            >
              <label>
                Date
                <input
                  name="date"
                  type="date"
                  defaultValue={today()}
                  max={today()}
                  required
                />
              </label>
              <label>
                Weight ({state.profile.units})
                <input
                  name="weight"
                  type="number"
                  step="0.1"
                  required
                  autoFocus
                />
              </label>
              <p className="tiny muted">
                One entry per day. Saving replaces an existing entry on the
                selected date.
              </p>
              <button className="primary" type="submit">
                {t("Save")}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
