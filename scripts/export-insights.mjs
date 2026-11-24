/**
 * Dual Todo Analytics & Dashboard Generator Script
 * Reads Firestore data, computes statistical metrics, and generates a standalone static dashboard.
 *
 * Usage:
 *   cd dual-todo && node --env-file=.env scripts/export-insights.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('Error: Firebase credentials missing in environment.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log('Fetching Firestore todos collection...');
  const snapshot = await getDocs(collection(db, 'todos'));
  const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`Fetched ${todos.length} cards.`);

  // 1. Compute Analytics
  let totalTasks = 0;
  let completedTasks = 0;
  let mostCompleted = 0;
  let fernCompleted = 0;
  let unknownCompleted = 0;

  const cardAssignees = { most: 0, fern: 0, both: 0 };
  const dailyCards = [];
  const topicCards = [];
  const dateCardRegex = /^\d{2}\/\d{2}\/\d{2}$/;

  const dailyActivity = {};
  const completedByHour = { most: Array(24).fill(0), fern: Array(24).fill(0) };
  const completedByDow = { most: Array(7).fill(0), fern: Array(7).fill(0) };
  const monthlyStats = {};
  const habitFreq = {};
  const pendingBacklog = [];

  let earliestTime = null;
  let latestTime = null;

  for (const card of todos) {
    const assignee = card.assignee || 'both';
    cardAssignees[assignee] = (cardAssignees[assignee] || 0) + 1;

    if (card.createdAt) {
      if (!earliestTime || card.createdAt < earliestTime) earliestTime = card.createdAt;
      if (!latestTime || card.createdAt > latestTime) latestTime = card.createdAt;
    }

    const items = card.items || [];
    totalTasks += items.length;
    let cardDoneCount = 0;

    const monthKey = card.createdAt?.slice(0, 7) || 'unknown';
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = { total: 0, completed: 0, most: 0, fern: 0 };
    }
    monthlyStats[monthKey].total += items.length;

    for (const item of items) {
      // Clean text for recurring habits
      const cleanText = item.text?.replace(/!{1,2}\d{1,2}[.:]\d{2}/g, '').trim();
      if (cleanText) habitFreq[cleanText] = (habitFreq[cleanText] || 0) + 1;

      if (item.isDone) {
        completedTasks++;
        cardDoneCount++;
        monthlyStats[monthKey].completed++;

        const by = item.completedBy === 'most' ? 'most' : item.completedBy === 'fern' ? 'fern' : 'unknown';
        if (by === 'most') {
          mostCompleted++;
          monthlyStats[monthKey].most++;
        } else if (by === 'fern') {
          fernCompleted++;
          monthlyStats[monthKey].fern++;
        } else {
          unknownCompleted++;
        }

        const dateObj = new Date(item.completedAt || card.updatedAt || card.createdAt);
        const bkk = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        const y = bkk.getFullYear();
        const m = String(bkk.getMonth() + 1).padStart(2, '0');
        const d = String(bkk.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        if (!dailyActivity[dateKey]) dailyActivity[dateKey] = { most: 0, fern: 0, total: 0 };
        if (by === 'fern') dailyActivity[dateKey].fern++;
        else dailyActivity[dateKey].most++;
        dailyActivity[dateKey].total++;

        if (by === 'most' || by === 'fern') {
          completedByHour[by][bkk.getHours()]++;
          completedByDow[by][bkk.getDay()]++;
        }
      } else {
        const createdDate = new Date(card.createdAt || Date.now());
        const daysPending = Math.max(1, Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
        pendingBacklog.push({
          text: item.text,
          cardTitle: card.title,
          assignee: card.assignee || 'both',
          createdAt: card.createdAt?.slice(0, 10),
          daysPending,
        });
      }
    }

    const cardInfo = {
      title: card.title,
      assignee: card.assignee,
      total: items.length,
      done: cardDoneCount,
      rate: items.length > 0 ? Math.round((cardDoneCount / items.length) * 100) : 0,
      createdAt: card.createdAt?.slice(0, 10),
    };

    if (dateCardRegex.test(card.title?.trim())) dailyCards.push(cardInfo);
    else topicCards.push(cardInfo);
  }

  topicCards.sort((a, b) => b.total - a.total);
  pendingBacklog.sort((a, b) => b.daysPending - a.daysPending);

  const timelineLabels = Object.keys(dailyActivity).sort();
  const mostDaily = timelineLabels.map(d => dailyActivity[d].most);
  const fernDaily = timelineLabels.map(d => dailyActivity[d].fern);

  let cumulative = 0;
  const cumulativeData = timelineLabels.map(d => {
    cumulative += dailyActivity[d].total;
    return cumulative;
  });

  const topHabits = Object.entries(habitFreq).sort((a, b) => b[1] - a[1]).slice(0, 16);

  const topDays = Object.entries(dailyActivity)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
  const activeDaysCount = timelineLabels.length;

  console.log('=== ANALYTICS SUMMARY ===');
  console.log(`Cards: ${todos.length} | Tasks: ${totalTasks} | Done: ${completedTasks} (${completionRate}%)`);
  console.log(`Most: ${mostCompleted} | Fern: ${fernCompleted} | Active Days: ${activeDaysCount}`);

  // 2. Generate Dashboard HTML
  const html = generateHtml({
    totalCards: todos.length,
    totalTasks,
    completedTasks,
    completionRate,
    mostCompleted,
    fernCompleted,
    activeDaysCount,
    pendingCount: totalTasks - completedTasks,
    cardAssignees,
    monthlyStats,
    timelineLabels,
    mostDaily,
    fernDaily,
    cumulativeData,
    completedByHour,
    completedByDow,
    topHabits,
    topDays,
    topicCards,
    longestPending: pendingBacklog.slice(0, 15),
  });

  const publicPath = path.resolve('public/dashboard.html');
  const rootPath = path.resolve('../dashboard.html');
  fs.writeFileSync(publicPath, html, 'utf-8');
  if (fs.existsSync(path.dirname(rootPath))) {
    fs.writeFileSync(rootPath, html, 'utf-8');
  }
  console.log(`Updated dashboard at ${publicPath}`);
  process.exit(0);
}

function generateHtml(d) {
  return `<!DOCTYPE html>
<html lang="th" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dual Todo — สรุปข้อมูลเชิงลึก & แดชบอร์ดวิเคราะห์ (Analytics Dashboard)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text: #0f172a;
      --text-secondary: #475569;
      --muted: #64748b;
      --accent: #2563eb;
      --accent-subtle: #eff6ff;
      --most-color: #2563eb;
      --most-subtle: #dbeafe;
      --fern-color: #db2777;
      --fern-subtle: #fce7f3;
      --green: #059669;
      --green-subtle: #d1fae5;
      --yellow: #d97706;
      --yellow-subtle: #fef3c7;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --radius-md: 12px;
      --radius-lg: 16px;
      --font-main: 'Prompt', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    [data-theme="dark"] {
      --bg: #0b1120;
      --card-bg: #151e32;
      --card-border: #243049;
      --text: #f1f5f9;
      --text-secondary: #cbd5e1;
      --muted: #8e9db3;
      --accent: #38bdf8;
      --accent-subtle: rgba(56, 189, 248, 0.12);
      --most-color: #60a5fa;
      --most-subtle: rgba(96, 165, 250, 0.15);
      --fern-color: #f472b6;
      --fern-subtle: rgba(244, 114, 182, 0.15);
      --green: #34d399;
      --green-subtle: rgba(52, 211, 153, 0.15);
      --yellow: #fbbf24;
      --yellow-subtle: rgba(251, 191, 36, 0.15);
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-main);
      line-height: 1.6;
      padding: 24px 20px 48px;
      transition: background 0.2s, color 0.2s;
    }
    .container { max-width: 1280px; margin: 0 auto; }
    .app-header {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: var(--shadow-sm);
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--accent-subtle);
      color: var(--accent);
      padding: 3px 10px;
      border-radius: 9999px;
    }
    .subtitle { font-size: 0.88rem; color: var(--muted); margin-top: 4px; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 0.88rem;
      font-weight: 600;
      border-radius: var(--radius-md);
      border: 1px solid var(--card-border);
      background: var(--card-bg);
      color: var(--text);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      box-shadow: var(--shadow-sm);
    }
    .btn:hover { background: var(--accent-subtle); border-color: var(--accent); color: var(--accent); }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 4px;
      background: var(--accent);
    }
    .kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .kpi-title { font-size: 0.82rem; font-weight: 600; text-transform: uppercase; color: var(--muted); }
    .kpi-value { font-size: 2.1rem; font-weight: 700; line-height: 1.1; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
    .kpi-desc { font-size: 0.8rem; color: var(--muted); }
    .tabs-bar {
      display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
    }
    .tab-btn {
      padding: 10px 18px; font-size: 0.92rem; font-weight: 600; border: none; background: none;
      color: var(--muted); cursor: pointer; border-radius: var(--radius-md) var(--radius-md) 0 0;
      white-space: nowrap; transition: color 0.15s;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active {
      color: var(--accent); background: var(--card-bg);
      border: 1px solid var(--card-border); border-bottom-color: var(--card-bg); margin-bottom: -1px;
    }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
    .grid-wide-side { display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; margin-bottom: 24px; }
    @media (max-width: 1024px) { .grid-wide-side { grid-template-columns: 1fr; } }
    .card {
      background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius-lg);
      padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 24px;
    }
    .card-title { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .card-desc { font-size: 0.85rem; color: var(--muted); margin-bottom: 20px; }
    .chart-box { position: relative; height: 300px; width: 100%; }
    .insight-item {
      display: flex; gap: 16px; padding: 18px 20px; border-radius: var(--radius-md);
      background: var(--bg); border: 1px solid var(--card-border); margin-bottom: 14px;
    }
    .insight-icon {
      font-size: 1.5rem; background: var(--card-bg); width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center; border-radius: 12px;
      box-shadow: var(--shadow-sm); flex-shrink: 0;
    }
    .insight-content h4 { font-size: 1rem; font-weight: 700; margin-bottom: 4px; }
    .insight-content p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.55; }
    .table-responsive { overflow-x: auto; border-radius: var(--radius-md); border: 1px solid var(--card-border); }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left; }
    th {
      background: var(--bg); color: var(--muted); font-weight: 600; font-size: 0.8rem;
      text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 18px; border-bottom: 1px solid var(--card-border);
    }
    td { padding: 14px 18px; border-bottom: 1px solid var(--card-border); color: var(--text); }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: var(--accent-subtle); }
    .pill {
      font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 9999px;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .pill-most { background: var(--most-subtle); color: var(--most-color); }
    .pill-fern { background: var(--fern-subtle); color: var(--fern-color); }
    .pill-both { background: var(--green-subtle); color: var(--green); }
    .pill-yellow { background: var(--yellow-subtle); color: var(--yellow); }
    .progress-bar { background: var(--bg); border-radius: 9999px; height: 7px; overflow: hidden; width: 100px; border: 1px solid var(--card-border); }
    .progress-fill { height: 100%; border-radius: 9999px; }
    .habits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .habit-card {
      background: var(--bg); border: 1px solid var(--card-border); border-radius: var(--radius-md);
      padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-weight: 500; font-size: 0.92rem;
    }
    .habit-count { background: var(--accent); color: #ffffff; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .search-input {
      width: 100%; max-width: 320px; padding: 8px 14px; font-size: 0.88rem;
      border: 1px solid var(--card-border); border-radius: var(--radius-md);
      background: var(--bg); color: var(--text); outline: none; font-family: inherit; margin-bottom: 16px;
    }
    footer { text-align: center; margin-top: 40px; color: var(--muted); font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <header class="app-header">
      <div>
        <div class="brand-title">
          <span>📊 Dual Todo Analytics</span>
          <span class="brand-badge">Snapshot สรุปภาพรวม</span>
        </div>
        <p class="subtitle">วิเคราะห์ข้อมูลทั้งหมด 93 การ์ด (${d.activeDaysCount} วันที่มีงานสำเร็จ)</p>
      </div>
      <div class="nav-buttons">
        <a href="/" class="btn">← กลับไปที่แอป (Back to App)</a>
        <button class="btn" id="themeBtn">🌓 เปลี่ยนธีม (Theme)</button>
      </div>
    </header>

    <div class="kpi-row">
      <div class="kpi-card" style="--accent: #2563eb;">
        <div class="kpi-header"><span class="kpi-title">งานทั้งหมด</span><span>📝</span></div>
        <div class="kpi-value">${d.totalTasks}</div>
        <div class="kpi-desc">จากการ์ดงานทั้งหมด ${d.totalCards} ใบ</div>
      </div>
      <div class="kpi-card" style="--accent: #059669;">
        <div class="kpi-header"><span class="kpi-title">เคลียร์สำเร็จ</span><span>✅</span></div>
        <div class="kpi-value" style="color: var(--green);">${d.completedTasks}</div>
        <div class="kpi-desc"><span style="font-weight: 700; color: var(--green);">${d.completionRate}%</span> ของงานทั้งหมด</div>
      </div>
      <div class="kpi-card" style="--accent: #3b82f6;">
        <div class="kpi-header"><span class="kpi-title">Most เคลียร์</span><span>👨🏻‍💻</span></div>
        <div class="kpi-value" style="color: var(--most-color);">${d.mostCompleted}</div>
        <div class="kpi-desc">คิดเป็น ${((d.mostCompleted / d.completedTasks) * 100).toFixed(1)}% ของงานที่เสร็จ</div>
      </div>
      <div class="kpi-card" style="--accent: #db2777;">
        <div class="kpi-header"><span class="kpi-title">Fern เคลียร์</span><span>👩🏻‍💻</span></div>
        <div class="kpi-value" style="color: var(--fern-color);">${d.fernCompleted}</div>
        <div class="kpi-desc">คิดเป็น ${((d.fernCompleted / d.completedTasks) * 100).toFixed(1)}% ของงานที่เสร็จ</div>
      </div>
      <div class="kpi-card" style="--accent: #0284c7;">
        <div class="kpi-header"><span class="kpi-title">ความสม่ำเสมอ</span><span>🔥</span></div>
        <div class="kpi-value">${d.activeDaysCount} <span style="font-size: 1.1rem; color: var(--muted); font-weight: 500;">วัน Active</span></div>
        <div class="kpi-desc">มีงานสำเร็จต่อเนื่องในระบบ</div>
      </div>
      <div class="kpi-card" style="--accent: #d97706;">
        <div class="kpi-header"><span class="kpi-title">งานค้างสะสม</span><span>⏳</span></div>
        <div class="kpi-value" style="color: var(--yellow);">${d.pendingCount}</div>
        <div class="kpi-desc">ส่วนใหญ่อยู่ในการ์ดเป้าหมายระยะยาว</div>
      </div>
    </div>

    <div class="tabs-bar">
      <button class="tab-btn active" onclick="switchTab('tab-overview', this)">📌 สรุปภาพรวม (Overview)</button>
      <button class="tab-btn" onclick="switchTab('tab-habits', this)">⏱️ พฤติกรรมตามเวลา (Habits & Hours)</button>
      <button class="tab-btn" onclick="switchTab('tab-timeline', this)">📈 ไทม์ไลน์รายวัน (Timeline & Growth)</button>
      <button class="tab-btn" onclick="switchTab('tab-projects', this)">📑 การ์ดโปรเจกต์ & งานค้าง (Projects & Backlog)</button>
    </div>

    <div id="tab-overview" class="tab-pane active">
      <div class="grid-wide-side">
        <div>
          <div class="card">
            <h3 class="card-title">💡 เจาะลึกสถิติสำคัญ (Key Discoveries)</h3>
            <p class="card-desc">บทสรุปพฤติกรรมและการทำงานร่วมกันของทั้งคู่</p>
            <div class="insight-item">
              <div class="insight-icon">🎯</div>
              <div class="insight-content">
                <h4>วินัยและการเคลียร์งานสูงถึง ${d.completionRate}%</h4>
                <p>อัตราความสำเร็จสม่ำเสมอมากตลอดระยะเวลา มีงานสำเร็จจริงถึง ${d.activeDaysCount} วัน สะท้อนถึงการใช้งานเป็นเครื่องมือจัดการชีวิตจริงที่มีประสิทธิภาพสูง</p>
              </div>
            </div>
            <div class="insight-item">
              <div class="insight-icon">⚡</div>
              <div class="insight-content">
                <h4>วันอาทิตย์คือ "Super Productivity Day" ของทั้งคู่</h4>
                <p>วันอาทิตย์เป็นวันที่เคลียร์งานได้เยอะที่สุดในรอบสัปดาห์ (Most เคลียร์ ${d.completedByDow.most[0]} งาน, Fern เคลียร์ ${d.completedByDow.fern[0]} งาน) รองลงมาคือวันเสาร์และวันจันทร์</p>
              </div>
            </div>
            <div class="insight-item">
              <div class="insight-icon">🌙</div>
              <div class="insight-content">
                <h4>Most มีวงจรการทำงานแบบ Dual-Peak (บ่าย + ก่อนนอน)</h4>
                <p>ช่วงเวลาที่เคลียร์งานเยอะที่สุดของ Most มี 2 ช่วง: บ่าย 12:00–17:00 และช่วงดึกหลัง 22:00 ถึงเที่ยงคืน (Peak สูงสุดที่ 23:00 ถึง ${d.completedByHour.most[23]} งาน) ส่วน Fern มีช่วงบ่าย 14:00 และช่วงดึก 23:00</p>
              </div>
            </div>
            <div class="insight-item">
              <div class="insight-icon">📦</div>
              <div class="insight-content">
                <h4>งานค้าง ${d.pendingCount} งาน ไม่ใช่งานประจำวัน แต่เป็น Habit Cards</h4>
                <p>การ์ดประจำวัน (Daily) มีอัตราสำเร็จสูงถึงเกือบ 95% ขณะที่งานค้างส่วนใหญ่อยู่ในการ์ดเป้าหมายพฤติกรรมระยะยาว เช่น self improvements และ ทบทวน</p>
              </div>
            </div>
          </div>
          <div class="card">
            <h3 class="card-title">🔁 สิ่งที่ทำบ่อยที่สุด (Top Recurring Habits)</h3>
            <p class="card-desc">กิจวัตรและคำที่ถูกบันทึกลงในการ์ดบ่อยที่สุด</p>
            <div class="habits-grid">
              ${d.topHabits.map(([task, count]) => `
                <div class="habit-card">
                  <span>${task}</span>
                  <span class="habit-count">${count} ครั้ง</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div>
          <div class="card">
            <h3 class="card-title">👥 สัดส่วนการเป็นเจ้าของการ์ด (Card Ownership)</h3>
            <p class="card-desc">แบ่งตามผู้รับผิดชอบหลักของการ์ดทั้ง ${d.totalCards} ใบ</p>
            <div class="chart-box" style="height: 240px;"><canvas id="assigneeChart"></canvas></div>
          </div>
          <div class="card">
            <h3 class="card-title">📊 ปริมาณงานรายเดือน (Monthly Trend)</h3>
            <p class="card-desc">เปรียบเทียบจำนวนงานทั้งหมดกับงานที่เสร็จ</p>
            <div class="chart-box" style="height: 250px;"><canvas id="monthlyChart"></canvas></div>
          </div>
        </div>
      </div>
    </div>

    <div id="tab-habits" class="tab-pane">
      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">⏰ ช่วงเวลาที่เคลียร์งานสำเร็จในแต่ละวัน (Hour of Day)</h3>
          <p class="card-desc">เวลาในประเทศไทย (Asia/Bangkok UTC+7)</p>
          <div class="chart-box" style="height: 320px;"><canvas id="hourlyChart"></canvas></div>
        </div>
        <div class="card">
          <h3 class="card-title">📅 งานที่สำเร็จแบ่งตามวันในสัปดาห์ (Day of Week)</h3>
          <p class="card-desc">วันอาทิตย์เป็นวันที่มีผลงานรวมสูงสุดของทั้งคู่</p>
          <div class="chart-box" style="height: 320px;"><canvas id="dayOfWeekChart"></canvas></div>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title">🏆 10 วันที่มีสถิติเคลียร์งานสูงสุด (Top 10 Productive Days)</h3>
        <p class="card-desc">วันที่ทั้งคู่รวมพลังกันเคลียร์งานได้มากที่สุดเป็นประวัติการณ์</p>
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th>อันดับ</th><th>วันที่ (Date)</th><th>Most เคลียร์</th><th>Fern เคลียร์</th><th>รวมเสร็จสิ้น</th><th>สถานะ</th></tr>
            </thead>
            <tbody>
              ${d.topDays.map((day, idx) => `
                <tr>
                  <td style="font-weight: 700;">#${idx + 1}</td>
                  <td style="font-family: var(--font-mono); font-weight: 600;">${day.date}</td>
                  <td style="color: var(--most-color); font-weight: 600;">${day.most} งาน</td>
                  <td style="color: var(--fern-color); font-weight: 600;">${day.fern} งาน</td>
                  <td style="font-weight: 700; font-size: 1.05rem;">${day.total} งาน</td>
                  <td><span class="pill ${idx < 2 ? 'pill-both' : 'pill-most'}">${idx < 2 ? '🔥 วันสถิติสูงสุด' : '⭐ โฟกัสสูง'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="tab-timeline" class="tab-pane">
      <div class="card">
        <h3 class="card-title">📈 กราฟการเติบโตสะสมของงานที่สำเร็จ (Cumulative Growth)</h3>
        <p class="card-desc">เส้นทางการเคลียร์งานเติบโตอย่างต่อเนื่องจาก 0 จนถึง ${d.completedTasks} รายการ</p>
        <div class="chart-box" style="height: 320px;"><canvas id="cumulativeChart"></canvas></div>
      </div>
      <div class="card">
        <h3 class="card-title">📊 กราฟกิจกรรมรายวันตลอด ${d.activeDaysCount} วันที่ Active (Daily Activity)</h3>
        <p class="card-desc">แท่งซ้อนแสดงจำนวนงานที่ Most (สีฟ้า) และ Fern (สีชมพู) เคลียร์ในแต่ละวัน</p>
        <div class="chart-box" style="height: 320px;"><canvas id="timelineChart"></canvas></div>
      </div>
    </div>

    <div id="tab-projects" class="tab-pane">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <h3 class="card-title">📑 การ์ดหัวข้อและโปรเจกต์พิเศษ (${d.topicCards.length} Topic Cards)</h3>
            <p class="card-desc" style="margin-bottom: 0;">การ์ดเป้าหมายนอกเหนือจากการ์ดรายวัน</p>
          </div>
          <input type="text" id="projectSearch" class="search-input" placeholder="🔍 ค้นหาการ์ดหัวข้อ..." oninput="filterTopicTable()">
        </div>
        <div class="table-responsive">
          <table id="topicTable">
            <thead>
              <tr><th>ชื่อการ์ด</th><th>ผู้รับผิดชอบ</th><th>ความคืบหน้า</th><th>อัตราสำเร็จ</th><th>วันที่สร้าง</th><th>สถานะ</th></tr>
            </thead>
            <tbody>
              ${d.topicCards.map(c => `
                <tr>
                  <td style="font-weight: 600;">${c.title}</td>
                  <td><span class="pill ${c.assignee === 'most' ? 'pill-most' : c.assignee === 'fern' ? 'pill-fern' : 'pill-both'}">${(c.assignee || 'both').toUpperCase()}</span></td>
                  <td style="font-family: var(--font-mono); font-weight: 600;">${c.done} / ${c.total}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="progress-bar"><div class="progress-fill" style="width: ${c.rate}%; background: ${c.rate === 100 ? 'var(--green)' : c.rate > 50 ? 'var(--accent)' : 'var(--yellow)'};"></div></div>
                      <span style="font-size: 0.82rem; font-weight: 600; font-family: var(--font-mono);">${c.rate}%</span>
                    </div>
                  </td>
                  <td style="font-size: 0.85rem; color: var(--muted);">${c.createdAt || '-'}</td>
                  <td><span class="pill ${c.rate === 100 ? 'pill-both' : c.rate === 0 ? 'pill-yellow' : 'pill-most'}">${c.rate === 100 ? '✅ เสร็จสิ้นแล้ว' : c.rate === 0 ? '⏳ รอดำเนินการ' : '🏃 กำลังทำอยู่'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title">⏳ งานที่ค้างอยู่นานที่สุด (Longest Standing Tasks)</h3>
        <p class="card-desc">รายการงานที่ยังไม่ได้ติ๊กเสร็จและมีอายุค้างอยู่นานที่สุดในระบบ</p>
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th>ชื่องาน</th><th>การ์ดต้นทาง</th><th>ผู้รับผิดชอบ</th><th>ระยะเวลาที่ค้าง</th><th>วันที่สร้างการ์ด</th></tr>
            </thead>
            <tbody>
              ${d.longestPending.map(item => `
                <tr>
                  <td style="font-weight: 600;">${item.text}</td>
                  <td style="color: var(--muted);">${item.cardTitle}</td>
                  <td><span class="pill ${item.assignee === 'most' ? 'pill-most' : item.assignee === 'fern' ? 'pill-fern' : 'pill-both'}">${(item.assignee || 'both').toUpperCase()}</span></td>
                  <td style="font-weight: 700; color: var(--yellow);">${item.daysPending} วัน</td>
                  <td style="font-size: 0.85rem; color: var(--muted);">${item.createdAt || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <footer>Dual Todo Analytics Dashboard • Generated with export-insights.mjs</footer>
  </div>
  <script>
    function switchTab(tabId, el) {
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      el.classList.add('active');
      setTimeout(() => Object.values(charts).forEach(c => c?.resize()), 50);
    }
    function filterTopicTable() {
      const q = document.getElementById('projectSearch').value.toLowerCase();
      document.querySelectorAll('#topicTable tbody tr').forEach(r => {
        r.style.display = r.cells[0].textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }
    const themeBtn = document.getElementById('themeBtn');
    themeBtn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      initCharts(next);
    });
    const timelineLabels = ${JSON.stringify(d.timelineLabels)};
    const mostDaily = ${JSON.stringify(d.mostDaily)};
    const fernDaily = ${JSON.stringify(d.fernDaily)};
    const cumulativeData = ${JSON.stringify(d.cumulativeData)};
    const hourlyMost = ${JSON.stringify(d.completedByHour.most)};
    const hourlyFern = ${JSON.stringify(d.completedByHour.fern)};
    const dowMost = ${JSON.stringify(d.completedByDow.most)};
    const dowFern = ${JSON.stringify(d.completedByDow.fern)};
    const monthlyLabels = ${JSON.stringify(Object.keys(d.monthlyStats))};
    const monthlyCompleted = ${JSON.stringify(Object.values(d.monthlyStats).map(m => m.completed))};
    const monthlyTotal = ${JSON.stringify(Object.values(d.monthlyStats).map(m => m.total))};
    let charts = {};
    function initCharts(theme) {
      const isDark = theme === 'dark';
      const textColor = isDark ? '#cbd5e1' : '#475569';
      const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
      Chart.defaults.color = textColor;
      Chart.defaults.font.family = "'Inter', 'Prompt', sans-serif";
      Object.values(charts).forEach(c => c?.destroy());
      const ctxT = document.getElementById('timelineChart')?.getContext('2d');
      if (ctxT) charts.timeline = new Chart(ctxT, {
        type: 'bar',
        data: {
          labels: timelineLabels.map(l => l.slice(5)),
          datasets: [
            { label: 'Most', data: mostDaily, backgroundColor: '#3b82f6', borderRadius: 4 },
            { label: 'Fern', data: fernDaily, backgroundColor: '#ec4899', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: gridColor }, beginAtZero: true } }
        }
      });
      const ctxC = document.getElementById('cumulativeChart')?.getContext('2d');
      if (ctxC) charts.cumulative = new Chart(ctxC, {
        type: 'line',
        data: {
          labels: timelineLabels.map(l => l.slice(5)),
          datasets: [{ label: 'งานสะสม', data: cumulativeData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)', fill: true, tension: 0.25, borderWidth: 2.5, pointRadius: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor }, beginAtZero: true } }, plugins: { legend: { display: false } } }
      });
      const ctxH = document.getElementById('hourlyChart')?.getContext('2d');
      if (ctxH) charts.hourly = new Chart(ctxH, {
        type: 'line',
        data: {
          labels: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00'),
          datasets: [
            { label: 'Most', data: hourlyMost, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)', tension: 0.35, fill: true, borderWidth: 2.5 },
            { label: 'Fern', data: hourlyFern, borderColor: '#ec4899', backgroundColor: 'rgba(236, 72, 153, 0.08)', tension: 0.35, fill: true, borderWidth: 2.5 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor }, beginAtZero: true } } }
      });
      const ctxD = document.getElementById('dayOfWeekChart')?.getContext('2d');
      if (ctxD) charts.dow = new Chart(ctxD, {
        type: 'bar',
        data: {
          labels: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'],
          datasets: [
            { label: 'Most', data: dowMost, backgroundColor: '#3b82f6', borderRadius: 4 },
            { label: 'Fern', data: dowFern, backgroundColor: '#ec4899', borderRadius: 4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor }, beginAtZero: true } } }
      });
      const ctxM = document.getElementById('monthlyChart')?.getContext('2d');
      if (ctxM) charts.monthly = new Chart(ctxM, {
        type: 'bar',
        data: {
          labels: monthlyLabels,
          datasets: [
            { label: 'สำเร็จแล้ว', data: monthlyCompleted, backgroundColor: '#10b981', borderRadius: 4 },
            { label: 'ทั้งหมด', data: monthlyTotal, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor }, beginAtZero: true } } }
      });
      const ctxA = document.getElementById('assigneeChart')?.getContext('2d');
      if (ctxA) charts.assignee = new Chart(ctxA, {
        type: 'doughnut',
        data: {
          labels: ['Most (' + ${d.cardAssignees.most} + ')', 'Fern (' + ${d.cardAssignees.fern} + ')', 'Both (' + ${d.cardAssignees.both} + ')'],
          datasets: [{ data: [${d.cardAssignees.most}, ${d.cardAssignees.fern}, ${d.cardAssignees.both}], backgroundColor: ['#3b82f6', '#ec4899', '#10b981'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      });
    }
    initCharts('light');
  </script>
</body>
</html>`;
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
