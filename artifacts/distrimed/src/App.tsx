// @ts-nocheck
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 1 — DESIGN TOKENS + CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  /* LIGHT MODE (default) — fondos crema, acentos cyan/aqua */
  --bg:#f5f2ec;--bg1:#ede8e0;--bg2:#ffffff;--bg3:#f0ebe2;--bg4:#e8e1d6;
  --bd:#d5cec4;--bd2:#c2bbb0;
  --cy:#0099b8;--cy10:rgba(0,153,184,.12);--cy20:rgba(0,153,184,.28);
  --or:#c94a1a;--or10:rgba(201,74,26,.1);
  --gr:#007a52;--gr10:rgba(0,122,82,.1);
  --ye:#b87c00;--re:#c41c38;--re10:rgba(196,28,56,.1);
  --pu:#7c28bb;--pu10:rgba(124,40,187,.1);
  --t0:#1a2030;--t1:#4d6070;--t2:#8898a8;
  --r:10px;--rl:16px;--rxl:22px;
  --cond:'Barlow Condensed',sans-serif;
  --body:'Barlow',sans-serif;
  --mono:'DM Mono',monospace;
  --overlay-bg:rgba(210,205,195,0.88);
  --login-grid-col:rgba(180,170,158,0.35);
  --mob-bg-col:rgba(245,242,236,0.88);
  --shadow-card:0 2px 16px rgba(0,0,0,0.08);
  --shadow-login:0 12px 48px rgba(0,0,0,0.14);
}
body.dark{
  /* DARK MODE */
  --bg:#050c1a;--bg1:#080f1e;--bg2:#0c1628;--bg3:#101d32;--bg4:#15243c;
  --bd:#1a2d47;--bd2:#253c5a;
  --cy:#00e5ff;--cy10:rgba(0,229,255,.1);--cy20:rgba(0,229,255,.2);
  --or:#ff6030;--or10:rgba(255,96,48,.1);
  --gr:#00d68f;--gr10:rgba(0,214,143,.1);
  --ye:#ffb700;--re:#ff3355;--re10:rgba(255,51,85,.1);
  --pu:#a855f7;--pu10:rgba(168,85,247,.1);
  --t0:#e8f0fe;--t1:#8ba0be;--t2:#445870;
  --overlay-bg:rgba(5,12,26,0.92);
  --login-grid-col:rgba(26,45,71,0.3);
  --mob-bg-col:rgba(5,12,26,0.75);
  --shadow-card:0 8px 32px rgba(0,0,0,0.4);
  --shadow-login:0 24px 80px rgba(0,0,0,0.5);
}
html,body{height:100%;font-family:var(--body);background:var(--bg);color:var(--t0);overflow-x:hidden;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}button{cursor:pointer;font-family:var(--body);border:none}
input,select,textarea{font-family:var(--body);background:var(--bg3);border:1px solid var(--bd);color:var(--t0);border-radius:var(--r);padding:10px 14px;font-size:.9rem;outline:none;width:100%;transition:border-color .18s,box-shadow .18s}
input::placeholder,textarea::placeholder{color:var(--t2)}
input:focus,select:focus,textarea:focus{border-color:var(--cy);box-shadow:0 0 0 3px var(--cy10)}
select option{background:var(--bg2)}
label{display:block;font-size:.72rem;font-weight:700;color:var(--t1);margin-bottom:5px;text-transform:uppercase;letter-spacing:.07em;font-family:var(--cond)}

.shell{display:flex;height:100vh;overflow:hidden}
.sidebar{width:230px;background:var(--bg1);border-right:1px solid var(--bd);display:flex;flex-direction:column;flex-shrink:0;transition:transform .28s;z-index:200}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:56px;background:var(--bg1);border-bottom:1px solid var(--bd);display:flex;align-items:center;padding:0 20px;gap:12px;flex-shrink:0}
.content{flex:1;overflow-y:auto;padding:24px;padding-bottom:80px}

.logo-area{padding:18px 16px 12px;border-bottom:1px solid var(--bd)}
.logo{font-family:var(--cond);font-size:1.6rem;font-weight:900;color:var(--cy);letter-spacing:.05em;display:flex;align-items:center;gap:8px}
.logo-sub{font-size:.65rem;color:var(--t2);text-transform:uppercase;letter-spacing:.1em;margin-top:1px}
.nav-area{padding:10px 8px;flex:1;overflow-y:auto}
.nav-sec-lbl{font-size:.62rem;font-weight:800;color:var(--t2);text-transform:uppercase;letter-spacing:.12em;padding:10px 10px 4px;font-family:var(--cond)}
.nav-btn{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;font-size:.875rem;font-weight:500;color:var(--t1);cursor:pointer;transition:all .16s;margin:1px 0;background:none;width:100%;text-align:left;position:relative}
.nav-btn:hover{background:var(--bg3);color:var(--t0)}
.nav-btn.on{background:var(--cy10);color:var(--cy);font-weight:600}
.nav-ico{width:20px;text-align:center;font-size:1rem;flex-shrink:0}
.nav-badge{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:var(--re);color:#fff;font-size:.6rem;font-weight:800;font-family:var(--cond);padding:1px 5px;border-radius:999px;min-width:16px;text-align:center}
.sidebar-foot{margin-top:auto;padding:12px 8px;border-top:1px solid var(--bd)}
.user-chip{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg3);border-radius:var(--r)}
.user-chip .nm{font-size:.82rem;font-weight:600;font-family:var(--cond)}
.user-chip .rl{font-size:.68rem;color:var(--t2)}

.av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--cond);font-size:.75rem;font-weight:800;flex-shrink:0}
.av-cy{background:var(--cy10);border:1px solid var(--cy20);color:var(--cy)}
.av-or{background:var(--or10);border:1px solid rgba(255,96,48,.3);color:var(--or)}
.av-gr{background:var(--gr10);border:1px solid rgba(0,214,143,.3);color:var(--gr)}
.av-pu{background:var(--pu10);border:1px solid rgba(168,85,247,.3);color:var(--pu)}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 18px;border-radius:var(--r);font-family:var(--cond);font-weight:700;font-size:.9rem;letter-spacing:.04em;transition:all .18s;white-space:nowrap}
.btn-cy{background:var(--cy);color:#000}.btn-cy:hover{background:#33ecff;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,229,255,.3)}
.btn-sec{background:var(--bg3);color:var(--t0);border:1px solid var(--bd)}.btn-sec:hover{border-color:var(--cy);color:var(--cy)}
.btn-re{background:var(--re10);color:var(--re);border:1px solid rgba(255,51,85,.25)}.btn-re:hover{background:rgba(255,51,85,.2)}
.btn-gr{background:var(--gr10);color:var(--gr);border:1px solid rgba(0,214,143,.25)}.btn-gr:hover{background:rgba(0,214,143,.15)}
.btn-or{background:var(--or);color:#fff}.btn-or:hover{background:#ff7a52;transform:translateY(-1px)}
.btn-pu{background:var(--pu10);color:var(--pu);border:1px solid rgba(168,85,247,.25)}.btn-pu:hover{background:rgba(168,85,247,.2)}
.btn-sm{padding:6px 13px;font-size:.8rem}.btn-xs{padding:4px 9px;font-size:.72rem}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;box-shadow:none!important}
.ico-btn{padding:7px;border-radius:8px;background:var(--bg3);border:1px solid var(--bd);color:var(--t1)}.ico-btn:hover{border-color:var(--cy);color:var(--cy)}

.card{background:var(--bg2);border:1px solid var(--bd);border-radius:var(--rl);padding:20px;transition:border-color .2s}
.card:hover{border-color:var(--bd2)}.card-glow{border-color:var(--cy)!important;box-shadow:0 0 28px rgba(0,229,255,.12)}
.card-or{border-color:rgba(255,96,48,.3)!important}.card-pu{border-color:rgba(168,85,247,.3)!important}

.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:22px}
.stat{background:var(--bg2);border:1px solid var(--bd);border-radius:var(--rl);padding:16px 18px;transition:border-color .2s,transform .18s}
.stat:hover{border-color:var(--bd2);transform:translateY(-2px)}
.stat-ico{font-size:1.3rem;margin-bottom:8px}
.stat-val{font-family:var(--cond);font-size:1.9rem;font-weight:900;line-height:1}
.stat-lbl{font-size:.68rem;color:var(--t2);text-transform:uppercase;letter-spacing:.09em;margin-top:4px;font-family:var(--cond)}
.stat-sub{font-size:.75rem;color:var(--t1);margin-top:5px}
.stat-trend{font-size:.7rem;margin-top:4px;display:flex;align-items:center;gap:3px}
.trend-up{color:var(--gr)}.trend-dn{color:var(--re)}

.prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.prod-card{background:var(--bg2);border:1px solid var(--bd);border-radius:var(--rl);overflow:hidden;cursor:pointer;transition:all .22s;display:flex;flex-direction:column;position:relative}
.prod-card:hover{border-color:var(--cy);transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
.prod-thumb{height:160px;display:flex;align-items:center;justify-content:center;font-size:5rem;position:relative;overflow:hidden}
.prod-thumb::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,var(--bg2) 0%,transparent 60%)}
.prod-body{padding:14px;flex:1;display:flex;flex-direction:column;gap:5px}
.prod-name{font-family:var(--cond);font-size:1rem;font-weight:800;line-height:1.2}
.prod-cat{font-size:.7rem;color:var(--t2);text-transform:uppercase;letter-spacing:.06em}
.prod-brand{font-size:.75rem;color:var(--t1)}
.prod-price{font-family:var(--mono);color:var(--cy);font-size:1rem;margin-top:auto;padding-top:8px}
.prod-store{font-size:.7rem;color:var(--t2)}
.prod-foot{display:flex;justify-content:space-between;align-items:center;padding:0 14px 14px}
.prod-badge{position:absolute;top:10px;left:10px;z-index:2}
.prod-badge-sale{position:absolute;top:10px;right:40px;z-index:2}
.wish-btn{position:absolute;top:10px;right:10px;z-index:2;width:28px;height:28px;border-radius:50%;background:var(--bg1);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:.9rem;cursor:pointer;transition:all .18s}
.wish-btn:hover{border-color:var(--re);transform:scale(1.1)}
.wish-btn.active{background:var(--re10);border-color:var(--re);color:var(--re)}

.stars{display:flex;gap:2px}
.star{font-size:.85rem;cursor:pointer;transition:transform .1s;line-height:1;color:var(--t2)}.star:hover{transform:scale(1.2)}.star.on{color:var(--ye)}

.badge{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.68rem;font-weight:800;font-family:var(--cond);letter-spacing:.04em}
.b-ok{background:var(--gr10);color:var(--gr)}.b-off{background:var(--re10);color:var(--re)}.b-warn{background:rgba(255,183,0,.12);color:var(--ye)}.b-cy{background:var(--cy10);color:var(--cy)}.b-pu{background:var(--pu10);color:var(--pu)}.b-or{background:var(--or10);color:var(--or)}

.tbl-wrap{overflow-x:auto;border-radius:var(--rl);border:1px solid var(--bd)}
table{width:100%;border-collapse:collapse;font-size:.875rem}
th{padding:10px 14px;text-align:left;color:var(--t2);font-size:.68rem;text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--bd);font-family:var(--cond);font-weight:800;background:var(--bg1)}
td{padding:13px 14px;border-bottom:1px solid var(--bd);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--bg3)}

.sec-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.sec-ttl{font-family:var(--cond);font-size:1.25rem;font-weight:800}

.overlay{position:fixed;inset:0;background:var(--overlay-bg);display:flex;align-items:center;justify-content:center;z-index:500;padding:16px;backdrop-filter:blur(8px);animation:fadein .18s}
.modal{background:var(--bg2);border:1px solid var(--bd2);border-radius:var(--rxl);padding:26px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;animation:slideup .22s}
.modal-lg{max-width:720px}
.modal-ttl{font-family:var(--cond);font-size:1.2rem;font-weight:800;margin-bottom:18px}

.alert{padding:10px 14px;border-radius:var(--r);font-size:.875rem;margin-bottom:12px}
.al-err{background:var(--re10);border:1px solid rgba(196,28,56,.25);color:var(--re)}
.al-ok{background:var(--gr10);border:1px solid rgba(0,122,82,.25);color:var(--gr)}
.al-warn{background:rgba(184,124,0,.1);border:1px solid rgba(184,124,0,.25);color:var(--ye)}
.al-cy{background:var(--cy10);border:1px solid var(--cy20);color:var(--cy)}

.tabs{display:flex;background:var(--bg3);border-radius:var(--r);padding:3px;gap:3px;margin-bottom:18px;flex-wrap:wrap}
.tab{flex:1;text-align:center;padding:7px 10px;border-radius:8px;font-family:var(--cond);font-size:.85rem;font-weight:700;color:var(--t2);cursor:pointer;border:none;background:none;transition:all .16s;white-space:nowrap}
.tab.on{background:var(--bg2);color:var(--cy)}

.filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;align-items:center}
.filters input,.filters select{width:auto;flex:1;min-width:120px;max-width:220px}
.filter-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:.76rem;font-weight:600;font-family:var(--cond);border:1px solid var(--bd);background:var(--bg3);color:var(--t1);cursor:pointer;transition:all .16s;white-space:nowrap}
.filter-chip.on{border-color:var(--cy);color:var(--cy);background:var(--cy10)}

.map-wrap{border-radius:var(--rl);overflow:hidden;border:1px solid var(--bd)}
.map-placeholder{background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--t2);font-size:1rem;position:relative;overflow:hidden}
.map-grid{position:absolute;inset:0;background-image:linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px);background-size:30px 30px;opacity:.5}
@keyframes ring{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.2);opacity:0}}

.login-pg{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden}
.login-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 15% 60%,rgba(0,229,255,.07) 0%,transparent 70%),radial-gradient(ellipse 50% 40% at 85% 30%,rgba(255,96,48,.04) 0%,transparent 70%)}
.login-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--login-grid-col) 1px,transparent 1px),linear-gradient(90deg,var(--login-grid-col) 1px,transparent 1px);background-size:40px 40px}
.login-card{width:100%;max-width:420px;background:var(--bg2);border:1px solid var(--bd2);border-radius:var(--rxl);padding:36px;position:relative;z-index:1;box-shadow:var(--shadow-login)}
.login-logo{font-family:var(--cond);font-size:2rem;font-weight:900;color:var(--cy);letter-spacing:.06em;margin-bottom:2px}
.login-sub{color:var(--t2);font-size:.8rem;margin-bottom:24px}
.demo-box{background:var(--bg3);border:1px solid var(--bd);border-radius:var(--r);padding:10px 13px;margin-bottom:18px;font-size:.76rem;color:var(--t1)}

.store-card{background:var(--bg2);border:1px solid var(--bd);border-radius:var(--rl);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .18s;margin-bottom:8px}
.store-card:hover{border-color:var(--bd2)}.store-card.sel{border-color:var(--cy);background:var(--bg3)}
.s-emoji{font-size:1.8rem;flex-shrink:0}.s-info{flex:1;min-width:0}
.s-name{font-family:var(--cond);font-weight:700;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s-addr{font-size:.72rem;color:var(--t2)}.s-dist{font-family:var(--mono);font-size:.72rem;color:var(--cy);flex-shrink:0}

.store-hero{border-radius:var(--rl);overflow:hidden;margin-bottom:20px;position:relative}
.store-hours-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.hours-chip{background:var(--bg3);border:1px solid var(--bd);border-radius:var(--r);padding:8px 12px;font-size:.75rem}
.hours-day{font-family:var(--cond);font-weight:700;font-size:.8rem;margin-bottom:2px}
.hours-time{color:var(--cy);font-family:var(--mono);font-size:.72rem}
.hours-closed{color:var(--re);font-family:var(--mono);font-size:.72rem}

.subdomain-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:var(--pu10);border:1px solid rgba(168,85,247,.3);border-radius:20px;font-family:var(--mono);font-size:.72rem;color:var(--pu)}

.fg{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.fg-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fg-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.divider{height:1px;background:var(--bd);margin:14px 0}

.section-divider{display:flex;align-items:center;gap:12px;margin:20px 0}
.section-divider span{font-family:var(--cond);font-size:.72rem;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
.section-divider::before,.section-divider::after{content:'';flex:1;height:1px;background:var(--bd)}

.empty{text-align:center;padding:50px 20px;color:var(--t2);display:flex;flex-direction:column;align-items:center;gap:8px}
.empty-ico{font-size:3rem}.empty-ttl{font-family:var(--cond);font-size:1rem;color:var(--t1);font-weight:700}

@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes slideup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse2{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes toastIn{from{opacity:0;transform:translateX(120%)}to{opacity:1;transform:translateX(0)}}
@keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(120%)}}
.spin{animation:spin .7s linear infinite;display:inline-block}

.chart-bar-wrap{display:flex;align-items:flex-end;gap:6px;height:80px;padding:0 4px}
.chart-bar{flex:1;border-radius:4px 4px 0 0;transition:height .4s,background .2s;min-width:10px;cursor:pointer}.chart-bar:hover{filter:brightness(1.25)}
.chart-labels{display:flex;gap:6px;padding:4px 4px 0}
.chart-label{flex:1;text-align:center;font-size:.6rem;color:var(--t2);font-family:var(--mono)}

.toast-wrap{position:fixed;bottom:80px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{pointer-events:all;background:var(--bg2);border:1px solid var(--bd2);border-radius:12px;padding:12px 16px;min-width:240px;max-width:320px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.5);animation:toastIn .3s ease}
.toast.out{animation:toastOut .3s ease forwards}
.toast-ok{border-left:3px solid var(--gr)}.toast-err{border-left:3px solid var(--re)}.toast-warn{border-left:3px solid var(--ye)}.toast-info{border-left:3px solid var(--cy)}
.toast-msg{flex:1;font-size:.85rem;line-height:1.4}
.toast-close{background:none;border:none;color:var(--t2);cursor:pointer;padding:0;font-size:.9rem;flex-shrink:0}

.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:60px;background:var(--bg1);border-top:1px solid var(--bd);z-index:300;align-items:center;justify-content:space-around}
.bn-item{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 12px;cursor:pointer;border:none;background:none;color:var(--t2);transition:color .18s;position:relative;flex:1}
.bn-item.on{color:var(--cy)}
.bn-ico{font-size:1.2rem;line-height:1}
.bn-lbl{font-size:.58rem;font-family:var(--cond);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.bn-badge{position:absolute;top:4px;right:calc(50% - 16px);background:var(--re);color:#fff;font-size:.55rem;font-weight:800;font-family:var(--cond);padding:1px 4px;border-radius:999px;min-width:14px;text-align:center}

.doc-section{margin-bottom:28px}
.doc-h2{font-family:var(--cond);font-size:1.4rem;font-weight:900;color:var(--cy);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--bd)}
.doc-h3{font-family:var(--cond);font-size:1rem;font-weight:800;color:var(--t0);margin-bottom:8px;margin-top:14px}
.doc-p{color:var(--t1);font-size:.88rem;line-height:1.6;margin-bottom:8px}
.doc-step{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--bd);font-size:.85rem}
.doc-step:last-child{border-bottom:none}
.doc-num{width:24px;height:24px;border-radius:50%;background:var(--cy10);border:1px solid var(--cy20);color:var(--cy);font-family:var(--cond);font-weight:800;font-size:.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.doc-feature{display:flex;gap:12px;align-items:flex-start;padding:10px 14px;background:var(--bg3);border-radius:var(--r);margin-bottom:8px;border:1px solid var(--bd)}
.doc-fico{font-size:1.4rem;flex-shrink:0}
.doc-ftext{flex:1}
.doc-fname{font-family:var(--cond);font-weight:700;font-size:.95rem;margin-bottom:3px}
.doc-fdesc{font-size:.82rem;color:var(--t1);line-height:1.4}
.kbd{display:inline-block;padding:2px 7px;background:var(--bg4);border:1px solid var(--bd2);border-radius:5px;font-family:var(--mono);font-size:.75rem;color:var(--t0)}
.faq-item{border:1px solid var(--bd);border-radius:var(--r);margin-bottom:8px;overflow:hidden}
.faq-q{padding:12px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:.88rem;background:var(--bg3)}
.faq-a{padding:12px 16px;font-size:.85rem;color:var(--t1);line-height:1.6;border-top:1px solid var(--bd)}

.wishlist-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.wish-card{background:var(--bg2);border:1px solid var(--bd);border-radius:var(--rl);overflow:hidden;transition:all .2s}
.wish-card:hover{border-color:var(--re);transform:translateY(-2px)}

.profile-hero{background:linear-gradient(135deg,var(--bg2),var(--bg3));border:1px solid var(--bd);border-radius:var(--rl);padding:28px;margin-bottom:20px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.profile-av{width:72px;height:72px;border-radius:50%;background:var(--cy10);border:2px solid var(--cy20);display:flex;align-items:center;justify-content:center;font-family:var(--cond);font-size:1.8rem;font-weight:900;color:var(--cy);flex-shrink:0}
.profile-name{font-family:var(--cond);font-size:1.6rem;font-weight:900;margin-bottom:2px}
.profile-email{font-family:var(--mono);font-size:.82rem;color:var(--t2)}

.analytics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}
.analytics-card{background:var(--bg2);border:1px solid var(--bd);border-radius:var(--rl);padding:18px;position:relative;overflow:hidden}
.analytics-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0}
.analytics-card.cy::before{background:var(--cy)}
.analytics-card.gr::before{background:var(--gr)}
.analytics-card.or::before{background:var(--or)}
.analytics-card.pu::before{background:var(--pu)}
.analytics-val{font-family:var(--cond);font-size:2rem;font-weight:900;line-height:1;margin-bottom:4px}
.analytics-lbl{font-size:.72rem;color:var(--t2);text-transform:uppercase;letter-spacing:.08em;font-family:var(--cond)}
.analytics-sub{font-size:.78rem;color:var(--t1);margin-top:6px}

.report-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bd)}
.report-row:last-child{border-bottom:none}
.report-bar{flex:1;height:8px;background:var(--bg4);border-radius:4px;overflow:hidden}
.report-fill{height:100%;border-radius:4px;transition:width .6s}
.report-val{font-family:var(--mono);font-size:.78rem;color:var(--cy);min-width:60px;text-align:right}

.review-card{background:var(--bg3);border:1px solid var(--bd);border-radius:var(--r);padding:14px;margin-bottom:8px}
.review-card-hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.review-user{font-family:var(--cond);font-weight:700;font-size:.9rem}
.review-date{font-size:.7rem;color:var(--t2)}
.review-comment{font-size:.85rem;color:var(--t1);line-height:1.5;margin-top:6px}

::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:var(--bg1)}::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px}

@media(max-width:900px){
  .sidebar{position:fixed;left:0;top:0;bottom:0;transform:translateX(-100%)}
  .sidebar.open{transform:translateX(0)}
  .content{padding:14px 14px 70px}
  .fg-row{grid-template-columns:1fr}.fg-row-3{grid-template-columns:1fr 1fr}
  .filters input,.filters select{max-width:100%;width:100%}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .prod-grid{grid-template-columns:repeat(auto-fill,minmax(155px,1fr))}
  .analytics-grid{grid-template-columns:repeat(2,1fr)}
  .bottom-nav{display:flex}
  .toast-wrap{bottom:72px}
}
.mob-bg{display:none;position:fixed;inset:0;background:var(--mob-bg-col);z-index:199}
.mob-bg.show{display:block}
.burger{display:none;padding:8px;background:none;border:none;color:var(--t0);font-size:1.3rem;cursor:pointer}
@media(max-width:900px){.burger{display:flex}}
.topbar-ttl{font-family:var(--cond);font-size:1.1rem;font-weight:800;flex:1}
.pill{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:.7rem;background:var(--bg3);color:var(--t1);border:1px solid var(--bd)}
.mono{font-family:var(--mono)}
.text-cy{color:var(--cy)}.text-gr{color:var(--gr)}.text-re{color:var(--re)}.text-ye{color:var(--ye)}.text-pu{color:var(--pu)}.text-or{color:var(--or)}.text-muted{color:var(--t2)}.text-sm{font-size:.82rem}.text-xs{font-size:.72rem}
.fw8{font-weight:800}
.flex{display:flex}.items-center{align-items:center}.justify-between{justify-content:space-between}.gap-2{gap:8px}.gap-3{gap:12px}.gap-4{gap:16px}.flex-col{flex-direction:column}
.mt-2{margin-top:8px}.mt-3{margin-top:12px}.mt-4{margin-top:16px}.mb-2{margin-bottom:8px}.mb-3{margin-bottom:12px}.mb-4{margin-bottom:16px}.w-full{width:100%}
.order-status-bar{display:flex;gap:0;margin:10px 0}
.os-step{flex:1;height:4px;background:var(--bg4);border-radius:2px;margin:0 2px;transition:background .3s}.os-step.done{background:var(--cy)}
.feed-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--bd);font-size:.82rem}.feed-item:last-child{border-bottom:none}
.feed-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px}
.toggle-wrap{display:flex;align-items:center;gap:10px}
.toggle{position:relative;width:40px;height:22px;flex-shrink:0}
.toggle input{opacity:0;width:0;height:0;position:absolute}
.toggle-slider{position:absolute;inset:0;background:var(--bg4);border-radius:22px;cursor:pointer;border:1px solid var(--bd);transition:.2s}
.toggle-slider:before{content:'';position:absolute;height:16px;width:16px;left:2px;bottom:2px;background:var(--t2);border-radius:50%;transition:.2s}
.toggle input:checked + .toggle-slider{background:var(--cy10);border-color:var(--cy)}
.toggle input:checked + .toggle-slider:before{transform:translateX(18px);background:var(--cy)}
.color-swatch{width:24px;height:24px;border-radius:6px;border:2px solid transparent;cursor:pointer;transition:all .15s;flex-shrink:0}
.color-swatch.sel{border-color:var(--cy);transform:scale(1.2)}
.size-btn{width:36px;height:36px;border-radius:8px;background:var(--bg3);border:1px solid var(--bd);font-family:var(--cond);font-weight:700;font-size:.78rem;cursor:pointer;transition:all .15s;color:var(--t1)}
.size-btn.sel{background:var(--cy);color:#000;border-color:var(--cy)}
.size-btn:hover:not(.sel){border-color:var(--cy);color:var(--cy)}
`;

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 2 — MOCK DATABASE COMPLETA
═══════════════════════════════════════════════════════════════ */
const DB = {
  users: [
    { id:"u1",name:"Super Admin",email:"admin@distri.co",password:"admin123",role:"superadmin",active:true,createdAt:"2024-01-01" },
    { id:"u2",name:"Carlos Norte",email:"norte@distri.co",password:"tienda123",role:"store",storeId:"s1",active:true,createdAt:"2024-01-05" },
    { id:"u3",name:"Ana Poblado",email:"poblado@distri.co",password:"tienda123",role:"store",storeId:"s2",active:true,createdAt:"2024-01-06" },
    { id:"u4",name:"Luis Belén",email:"belen@distri.co",password:"tienda123",role:"store",storeId:"s3",active:true,createdAt:"2024-01-07" },
    { id:"u5",name:"Pedro Cliente",email:"pedro@gmail.com",password:"pass123",role:"client",active:true,createdAt:"2024-01-10" },
    { id:"u6",name:"María García",email:"maria@gmail.com",password:"pass123",role:"client",active:true,createdAt:"2024-01-12" },
    { id:"u7",name:"Valentina Restrepo",email:"vale@gmail.com",password:"pass123",role:"client",active:true,createdAt:"2024-01-15" },
    { id:"u8",name:"Andrés Morales",email:"andres@gmail.com",password:"pass123",role:"client",active:true,createdAt:"2024-02-01" },
    { id:"u9",name:"Sofía Herrera",email:"sofia@gmail.com",password:"pass123",role:"client",active:false,createdAt:"2024-02-10" },
  ],
  stores: [
    { id:"s1",name:"DistriModa El Norte",address:"Cra 65 #98-23, Robledo",phone:"604-445-1001",lat:6.292,lng:-75.578,active:true,rating:4.5,totalSales:42500000,ordersCount:342,ownerId:"u2",category:"Ropa Mujer",emoji:"👗",description:"Distribuidora líder de moda femenina del norte de Medellín. Especializados en vestidos, blusas y jeans de las mejores marcas.",subdomain:"elnorte",website:"elnorte.distrimed.co",hours:{lun:"8:00–18:00",mar:"8:00–18:00",mie:"8:00–18:00",jue:"8:00–18:00",vie:"8:00–19:00",sab:"9:00–17:00",dom:"Cerrado"},theme:"#00e5ff",bannerEmoji:"👗",tags:["Moda","Mujer","Casual","Formal"],socialMedia:{instagram:"@distrielNorte",whatsapp:"3001234567"},createdAt:"2024-01-05" },
    { id:"s2",name:"Fashion Poblado",address:"Cll 10 #43-25, El Poblado",phone:"604-445-1002",lat:6.208,lng:-75.565,active:true,rating:4.8,totalSales:78000000,ordersCount:610,ownerId:"u3",category:"Ropa Premium",emoji:"💎",description:"Boutique premium con lo mejor de la moda internacional en El Poblado. Importaciones exclusivas y marcas de lujo.",subdomain:"fashionpoblado",website:"fashionpoblado.distrimed.co",hours:{lun:"10:00–20:00",mar:"10:00–20:00",mie:"10:00–20:00",jue:"10:00–20:00",vie:"10:00–21:00",sab:"10:00–21:00",dom:"11:00–18:00"},theme:"#a855f7",bannerEmoji:"💎",tags:["Premium","Lujo","Importada","Accesorios"],socialMedia:{instagram:"@fashionpoblado",whatsapp:"3009876543"},createdAt:"2024-01-06" },
    { id:"s3",name:"Belen Urbano",address:"Cra 76 #20-45, Belén",phone:"604-445-1003",lat:6.229,lng:-75.611,active:true,rating:4.7,totalSales:63000000,ordersCount:780,ownerId:"u4",category:"Streetwear",emoji:"🧢",description:"Streetwear y urban fashion para todos los estilos. Hoodies, gorras, tenis y todo lo que necesitas para lucir urbano.",subdomain:"belenurbano",website:"belenurbano.distrimed.co",hours:{lun:"9:00–19:00",mar:"9:00–19:00",mie:"9:00–19:00",jue:"9:00–19:00",vie:"9:00–20:00",sab:"9:00–20:00",dom:"10:00–16:00"},theme:"#ff6030",bannerEmoji:"🧢",tags:["Streetwear","Urban","Sneakers","Gorras"],socialMedia:{instagram:"@belenurbano",whatsapp:"3018765432"},createdAt:"2024-01-07" },
    { id:"s4",name:"Kids & Mom Store",address:"Cll 52 #46-25, El Centro",phone:"604-445-1004",lat:6.252,lng:-75.564,active:true,rating:4.3,totalSales:32000000,ordersCount:289,ownerId:null,category:"Ropa Niños",emoji:"👶",description:"Todo para los más pequeños y sus mamás. Ropa infantil de calidad, cómoda y duradera.",subdomain:"kidsmom",website:"kidsmom.distrimed.co",hours:{lun:"8:00–17:00",mar:"8:00–17:00",mie:"8:00–17:00",jue:"8:00–17:00",vie:"8:00–17:00",sab:"9:00–15:00",dom:"Cerrado"},theme:"#00d68f",bannerEmoji:"👶",tags:["Niños","Bebé","Mamá","Escolar"],socialMedia:{instagram:"@kidsmomcol",whatsapp:"3027654321"},createdAt:"2024-01-08" },
    { id:"s5",name:"Sport Zone San Javier",address:"Cra 99 #44-12, San Javier",phone:"604-445-1005",lat:6.238,lng:-75.609,active:false,rating:3.9,totalSales:18000000,ordersCount:145,ownerId:null,category:"Ropa Deportiva",emoji:"🏋️",description:"Ropa deportiva y accesorios fitness. Temporalmente suspendida.",subdomain:"sportzone",website:"sportzone.distrimed.co",hours:{lun:"Cerrado",mar:"Cerrado",mie:"Cerrado",jue:"Cerrado",vie:"Cerrado",sab:"Cerrado",dom:"Cerrado"},theme:"#ffb700",bannerEmoji:"🏋️",tags:["Deporte","Fitness"],socialMedia:{instagram:"@sportzonemde",whatsapp:"3036543210"},createdAt:"2024-01-09" },
    { id:"s6",name:"Laureles Jeans",address:"Cra 80 #45-18, Laureles",phone:"604-445-1006",lat:6.247,lng:-75.582,active:true,rating:4.6,totalSales:64000000,ordersCount:512,ownerId:null,category:"Jeans & Denim",emoji:"👖",description:"La mejor selección de jeans en Medellín. Para hombre y mujer, todas las tallas.",subdomain:"laurelesjeans",website:"laurelesjeans.distrimed.co",hours:{lun:"9:00–18:00",mar:"9:00–18:00",mie:"9:00–18:00",jue:"9:00–18:00",vie:"9:00–19:00",sab:"9:00–19:00",dom:"10:00–15:00"},theme:"#3b82f6",bannerEmoji:"👖",tags:["Jeans","Denim"],socialMedia:{instagram:"@laurelesjeans",whatsapp:"3045432109"},createdAt:"2024-01-10" },
    { id:"s7",name:"Accesorios Envigado",address:"Cra 43 #35-67, Envigado",phone:"604-445-1007",lat:6.168,lng:-75.594,active:true,rating:4.4,totalSales:49000000,ordersCount:398,ownerId:null,category:"Accesorios",emoji:"👜",description:"Bolsos, carteras, joyería y accesorios de moda al mejor precio.",subdomain:"accsenvigado",website:"accsenvigado.distrimed.co",hours:{lun:"9:00–18:00",mar:"9:00–18:00",mie:"9:00–18:00",jue:"9:00–18:00",vie:"9:00–19:00",sab:"10:00–18:00",dom:"Cerrado"},theme:"#f97316",bannerEmoji:"👜",tags:["Bolsos","Joyería"],socialMedia:{instagram:"@accsenvigado",whatsapp:"3054321098"},createdAt:"2024-01-11" },
    { id:"s8",name:"Calzado Itagüí",address:"Cll 77 #50-33, Itagüí",phone:"604-445-1008",lat:6.184,lng:-75.598,active:true,rating:4.1,totalSales:38000000,ordersCount:302,ownerId:null,category:"Calzado",emoji:"👟",description:"Zapatos, tenis y botas de todas las marcas. El mejor calzado para toda la familia.",subdomain:"calzadoitag",website:"calzadoitag.distrimed.co",hours:{lun:"8:00–18:00",mar:"8:00–18:00",mie:"8:00–18:00",jue:"8:00–18:00",vie:"8:00–19:00",sab:"8:00–18:00",dom:"9:00–14:00"},theme:"#6366f1",bannerEmoji:"👟",tags:["Tenis","Zapatos"],socialMedia:{instagram:"@calzadoitag",whatsapp:"3063210987"},createdAt:"2024-01-12" },
    { id:"s9",name:"La Floresta Chic",address:"Cra 70 #48-90, La Floresta",phone:"604-445-1009",lat:6.245,lng:-75.604,active:true,rating:4.7,totalSales:57000000,ordersCount:456,ownerId:null,category:"Ropa Mujer",emoji:"🌸",description:"Moda femenina fresca y moderna. Tops, faldas y vestidos para cada ocasión.",subdomain:"florestachic",website:"florestachic.distrimed.co",hours:{lun:"9:00–18:00",mar:"9:00–18:00",mie:"9:00–18:00",jue:"9:00–19:00",vie:"9:00–20:00",sab:"9:00–20:00",dom:"10:00–16:00"},theme:"#ec4899",bannerEmoji:"🌸",tags:["Casual","Floral","Boho"],socialMedia:{instagram:"@florestachic",whatsapp:"3072109876"},createdAt:"2024-01-13" },
    { id:"s10",name:"Masculino Bello",address:"Cra 52 #48-20, Bello",phone:"604-445-1010",lat:6.329,lng:-75.556,active:true,rating:4.5,totalSales:82000000,ordersCount:670,ownerId:null,category:"Ropa Hombre",emoji:"🕴️",description:"Moda masculina casual y formal, todo en un lugar. Camisas, polos y bermudas de calidad.",subdomain:"masculinobello",website:"masculinobello.distrimed.co",hours:{lun:"8:00–18:00",mar:"8:00–18:00",mie:"8:00–18:00",jue:"8:00–18:00",vie:"8:00–19:00",sab:"9:00–18:00",dom:"10:00–15:00"},theme:"#14b8a6",bannerEmoji:"🕴️",tags:["Hombre","Formal","Casual"],socialMedia:{instagram:"@masculinobello",whatsapp:"3081098765"},createdAt:"2024-01-14" },
    { id:"s11",name:"Vintage & Co Castilla",address:"Cra 65 #78-12, Castilla",phone:"604-445-1011",lat:6.282,lng:-75.582,active:true,rating:4.6,totalSales:29000000,ordersCount:234,ownerId:null,category:"Vintage",emoji:"🎭",description:"Ropa vintage y segunda mano de calidad premium. Piezas únicas con historia.",subdomain:"vintagecastilla",website:"vintagecastilla.distrimed.co",hours:{lun:"10:00–18:00",mar:"10:00–18:00",mie:"10:00–18:00",jue:"10:00–18:00",vie:"10:00–19:00",sab:"10:00–19:00",dom:"Cerrado"},theme:"#d97706",bannerEmoji:"🎭",tags:["Vintage","Retro"],socialMedia:{instagram:"@vintagecastilla",whatsapp:"3090987654"},createdAt:"2024-01-15" },
    { id:"s12",name:"Lencería Santa Fe",address:"Cll 44 #55-66, Santa Fe",phone:"604-445-1012",lat:6.261,lng:-75.572,active:true,rating:4.2,totalSales:21000000,ordersCount:178,ownerId:null,category:"Lencería",emoji:"🎀",description:"Lencería fina y ropa interior de todas las marcas. Comodidad y elegancia.",subdomain:"lenceriasantafe",website:"lenceriasantafe.distrimed.co",hours:{lun:"9:00–18:00",mar:"9:00–18:00",mie:"9:00–18:00",jue:"9:00–18:00",vie:"9:00–19:00",sab:"10:00–17:00",dom:"Cerrado"},theme:"#f43f5e",bannerEmoji:"🎀",tags:["Lencería","Interior"],socialMedia:{instagram:"@lenceriasantafe",whatsapp:"3100876543"},createdAt:"2024-01-16" },
  ],
  products: [
    { id:"p1",storeId:"s1",name:"Vestido Floral Midi",price:89000,category:"Vestidos",stock:45,rating:4.7,emoji:"👗",description:"Vestido midi estampado floral, tela liviana ideal para el clima de Medellín",sales:128,minStock:10,brand:"Zara CO",colors:["Rosa","Azul","Verde"],sizes:["XS","S","M","L","XL"],isNew:true,discount:0 },
    { id:"p2",storeId:"s1",name:"Blusa Manga Larga Seda",price:65000,category:"Blusas",stock:72,rating:4.5,emoji:"👚",description:"Blusa de seda sintética, elegante y cómoda para oficina",sales:98,minStock:15,brand:"Studio F",colors:["Blanco","Negro","Beige"],sizes:["S","M","L","XL"],isNew:false,discount:15 },
    { id:"p3",storeId:"s1",name:"Jean Mom Fit",price:128000,category:"Jeans",stock:38,rating:4.6,emoji:"👖",description:"Jean mom fit de alta costura, cintura alta y cómodo",sales:76,minStock:8,brand:"Levi's CO",colors:["Azul","Negro","Gris"],sizes:["28","30","32","34"],isNew:false,discount:0 },
    { id:"p4",storeId:"s1",name:"Conjunto Deportivo Mujer",price:145000,category:"Deportivo",stock:28,rating:4.8,emoji:"🩱",description:"Set leggings + top deportivo, tela transpirable 4 vías",sales:67,minStock:8,brand:"Nike CO",colors:["Negro","Gris","Coral"],sizes:["XS","S","M","L"],isNew:true,discount:0 },
    { id:"p5",storeId:"s2",name:"Blazer Estructurado Premium",price:320000,category:"Blazers",stock:18,rating:4.9,emoji:"🥼",description:"Blazer de sastre importado, perfecta estructura, ideal para reuniones ejecutivas",sales:34,minStock:5,brand:"Massimo Dutti",colors:["Negro","Camel","Navy"],sizes:["S","M","L","XL"],isNew:true,discount:0 },
    { id:"p6",storeId:"s2",name:"Cartera Cuero Genuino",price:480000,category:"Accesorios",stock:12,rating:4.8,emoji:"👜",description:"Cartera de cuero genuino importada, múltiples compartimentos",sales:21,minStock:3,brand:"Guess",colors:["Negro","Café","Rojo"],sizes:["Única"],isNew:false,discount:10 },
    { id:"p7",storeId:"s2",name:"Vestido Cocktail Noche",price:280000,category:"Vestidos",stock:20,rating:4.7,emoji:"🥻",description:"Vestido de noche con lentejuelas, perfecto para cenas y eventos formales",sales:45,minStock:5,brand:"Zara Premium",colors:["Negro","Dorado","Plateado"],sizes:["XS","S","M","L"],isNew:true,discount:0 },
    { id:"p8",storeId:"s2",name:"Perfume Premium 100ml",price:195000,category:"Perfumería",stock:30,rating:4.9,emoji:"🧴",description:"Fragancia premium importada, duración 12 horas",sales:89,minStock:10,brand:"Carolina Herrera",colors:["Único"],sizes:["50ml","100ml"],isNew:false,discount:0 },
    { id:"p9",storeId:"s3",name:"Hoodie Oversized Logo",price:145000,category:"Hoodies",stock:55,rating:4.8,emoji:"🧥",description:"Sudadera oversized con logo bordado, algodón 100%",sales:210,minStock:15,brand:"Supreme CO",colors:["Negro","Blanco","Gris","Rojo"],sizes:["S","M","L","XL","XXL"],isNew:true,discount:0 },
    { id:"p10",storeId:"s3",name:"Pantalón Cargo Táctico",price:168000,category:"Pantalones",stock:42,rating:4.6,emoji:"👖",description:"Cargo pants estilo táctico, múltiples bolsillos funcionales",sales:134,minStock:10,brand:"Dickies CO",colors:["Kaki","Negro","Verde"],sizes:["S","M","L","XL","XXL"],isNew:false,discount:0 },
    { id:"p11",storeId:"s3",name:"Gorra Dad Hat Premium",price:78000,category:"Gorras",stock:90,rating:4.5,emoji:"🧢",description:"Dad hat 6 paneles, bordado 3D, ajustable",sales:445,minStock:20,brand:"New Era",colors:["Negro","Blanco","Azul","Rojo","Verde"],sizes:["Única"],isNew:false,discount:20 },
    { id:"p12",storeId:"s3",name:"Tenis Air Urbano",price:285000,category:"Calzado",stock:24,rating:4.9,emoji:"👟",description:"Tenis estilo urban, suela gruesa chunky, comfort total",sales:98,minStock:6,brand:"Puma Urban",colors:["Blanco/Negro","Todo Negro","Blanco/Gris"],sizes:["38","39","40","41","42","43","44"],isNew:true,discount:0 },
    { id:"p13",storeId:"s4",name:"Pijama Niño Dinosaurios",price:48000,category:"Pijamas",stock:67,rating:4.5,emoji:"🦕",description:"Pijama de algodón suave con estampado de dinosaurios",sales:189,minStock:15,brand:"Carter's CO",colors:["Azul","Verde"],sizes:["2","4","6","8","10","12"],isNew:false,discount:0 },
    { id:"p14",storeId:"s4",name:"Vestido Niña Floral",price:62000,category:"Vestidos",stock:45,rating:4.6,emoji:"🌺",description:"Vestido casual floral para niñas, telas frescas y coloridas",sales:134,minStock:10,brand:"Mini Kids",colors:["Rosa","Amarillo","Lila"],sizes:["2","4","6","8","10","12","14"],isNew:true,discount:0 },
    { id:"p15",storeId:"s4",name:"Tenis Niño Deportivo",price:95000,category:"Calzado",stock:38,rating:4.4,emoji:"👟",description:"Tenis escolares con velcro, duraderos y cómodos",sales:98,minStock:8,brand:"Nike Kids",colors:["Azul/Blanco","Negro/Rojo","Gris"],sizes:["22","23","24","25","26","27","28","29","30"],isNew:false,discount:0 },
    { id:"p16",storeId:"s6",name:"Jean Skinny Premium",price:148000,category:"Jeans",stock:52,rating:4.7,emoji:"👖",description:"Jean skinny de tela premium stretch, alta durabilidad",sales:234,minStock:12,brand:"Americanino",colors:["Azul Claro","Azul Oscuro","Negro","Gris"],sizes:["26","28","30","32","34","36"],isNew:false,discount:0 },
    { id:"p17",storeId:"s6",name:"Jean Straight Hombre",price:165000,category:"Jeans",stock:48,rating:4.5,emoji:"👖",description:"Jean straight fit para hombre, clásico y versátil",sales:198,minStock:10,brand:"Diesel CO",colors:["Azul","Negro","Blanco Roto"],sizes:["28","30","32","34","36","38"],isNew:false,discount:10 },
    { id:"p18",storeId:"s7",name:"Bolso Tote Canvas",price:89000,category:"Bolsos",stock:35,rating:4.6,emoji:"🎒",description:"Bolso tote de canvas resistente al agua, varios bolsillos",sales:145,minStock:8,brand:"Local Brand",colors:["Negro","Beige","Azul","Rosa"],sizes:["Única"],isNew:false,discount:0 },
    { id:"p19",storeId:"s7",name:"Cinturón Cuero Hombre",price:72000,category:"Cinturones",stock:60,rating:4.3,emoji:"⌚",description:"Cinturón de cuero genuino con hebilla metálica dorada",sales:234,minStock:15,brand:"Artesanal CO",colors:["Negro","Café","Cognac"],sizes:["S","M","L","XL"],isNew:false,discount:0 },
    { id:"p20",storeId:"s7",name:"Gafas de Sol UV400",price:125000,category:"Gafas",stock:28,rating:4.8,emoji:"🕶️",description:"Gafas de sol protección UV400, montura italiana",sales:89,minStock:5,brand:"Carrera CO",colors:["Negro","Café","Dorado"],sizes:["Única"],isNew:true,discount:0 },
    { id:"p21",storeId:"s8",name:"Botas Cuero Hombre",price:285000,category:"Botas",stock:22,rating:4.5,emoji:"🥾",description:"Botas de cuero genuino con suela de goma resistente",sales:67,minStock:5,brand:"Cuero & Co",colors:["Negro","Café"],sizes:["38","39","40","41","42","43","44","45"],isNew:false,discount:0 },
    { id:"p22",storeId:"s8",name:"Sandalias Plataforma",price:98000,category:"Sandalias",stock:40,rating:4.4,emoji:"👡",description:"Sandalias con plataforma de 8cm, correas ajustables",sales:156,minStock:8,brand:"Steve Madden CO",colors:["Negro","Nude","Blanco"],sizes:["35","36","37","38","39","40"],isNew:true,discount:15 },
    { id:"p23",storeId:"s9",name:"Top Crop Floral",price:55000,category:"Tops",stock:65,rating:4.6,emoji:"🌸",description:"Top crop con estampado floral, ideal para salidas casuales",sales:312,minStock:15,brand:"Floresta Brand",colors:["Rosa","Amarillo","Verde","Blanco"],sizes:["XS","S","M","L"],isNew:true,discount:0 },
    { id:"p24",storeId:"s9",name:"Maxi Falda Bohemia",price:92000,category:"Faldas",stock:38,rating:4.5,emoji:"🎐",description:"Falda maxi estilo boho con volantes, tela fluida",sales:178,minStock:8,brand:"Bohemia CO",colors:["Terracota","Azul","Estampada"],sizes:["XS","S","M","L","XL"],isNew:false,discount:0 },
    { id:"p25",storeId:"s10",name:"Camisa Oxford Premium",price:118000,category:"Camisas",stock:58,rating:4.7,emoji:"👔",description:"Camisa Oxford de algodón peinado, perfecta para oficina o casual",sales:267,minStock:12,brand:"Banana Republic CO",colors:["Blanco","Azul Claro","Gris","Celeste"],sizes:["S","M","L","XL","XXL"],isNew:false,discount:0 },
    { id:"p26",storeId:"s10",name:"Polo Slim Fit",price:85000,category:"Polos",stock:72,rating:4.5,emoji:"🎽",description:"Polo piqué slim fit, cómodo y elegante para todo el día",sales:345,minStock:15,brand:"Lacoste CO",colors:["Blanco","Azul Navy","Verde","Rojo","Negro"],sizes:["S","M","L","XL","XXL"],isNew:false,discount:10 },
    { id:"p27",storeId:"s10",name:"Bermuda Lino Hombre",price:95000,category:"Bermudas",stock:44,rating:4.6,emoji:"🩳",description:"Bermuda de lino natural, fresca y perfecta para el calor de Medellín",sales:198,minStock:10,brand:"Resorté",colors:["Kaki","Azul","Blanco","Gris"],sizes:["S","M","L","XL","XXL"],isNew:true,discount:0 },
    { id:"p28",storeId:"s11",name:"Chaqueta Vintage 90s",price:195000,category:"Chaquetas",stock:15,rating:4.8,emoji:"🎭",description:"Chaqueta vintage auténtica años 90, pieza única de colección",sales:34,minStock:3,brand:"Vintage Original",colors:["Roja","Verde","Azul"],sizes:["M","L","XL"],isNew:false,discount:0 },
    { id:"p29",storeId:"s11",name:"Camiseta Banda Rock",price:75000,category:"Camisetas",stock:28,rating:4.6,emoji:"🎸",description:"Camisetas originales de bandas de rock, piezas de colección",sales:89,minStock:5,brand:"Rock Heritage",colors:["Negro","Blanco"],sizes:["S","M","L","XL"],isNew:false,discount:0 },
    { id:"p30",storeId:"s12",name:"Conjunto Lencería Satin",price:142000,category:"Lencería",stock:33,rating:4.4,emoji:"🎀",description:"Conjunto de lencería en satín premium, elegante y cómodo",sales:67,minStock:8,brand:"Victoria Secret CO",colors:["Negro","Rojo","Blanco"],sizes:["XS","S","M","L"],isNew:true,discount:0 },
  ],
  ratings: [
    { id:"r1",productId:"p1",userId:"u5",score:5,comment:"Llegó perfecto, el estampado es hermoso y la tela muy fresca" },
    { id:"r2",productId:"p9",userId:"u5",score:5,comment:"El mejor hoodie que he comprado, el algodón es de primera" },
    { id:"r3",productId:"p5",userId:"u6",score:5,comment:"Excelente calidad premium, vale cada peso invertido" },
    { id:"r4",productId:"p12",userId:"u7",score:4,comment:"Súper cómodos, el diseño es increíble" },
    { id:"r5",productId:"p25",userId:"u6",score:5,comment:"Perfecta para la oficina, el material es de alta calidad" },
    { id:"r6",productId:"p11",userId:"u8",score:4,comment:"Muy buena gorra, el bordado está perfecto" },
    { id:"r7",productId:"p3",userId:"u5",score:5,comment:"El jean más cómodo que he tenido, cintura alta es perfecta" },
    { id:"r8",productId:"p23",userId:"u7",score:5,comment:"El top floral es adorable, llegó muy bien empacado" },
    { id:"r9",productId:"p6",userId:"u6",score:4,comment:"La cartera es hermosa pero llegó un poco tarde" },
    { id:"r10",productId:"p28",userId:"u8",score:5,comment:"Pieza única, la calidad del vintage es impresionante" },
  ],
  orders: [
    { id:"o1",storeId:"s1",storeName:"DistriModa El Norte",userId:"u5",items:[{productId:"p1",name:"Vestido Floral Midi",qty:1,price:89000},{productId:"p2",name:"Blusa Manga Larga Seda",qty:2,price:65000}],total:219000,status:"delivered",createdAt:"2025-02-01",address:"Cra 45 #80-12, Laureles" },
    { id:"o2",storeId:"s2",storeName:"Fashion Poblado",userId:"u6",items:[{productId:"p5",name:"Blazer Estructurado Premium",qty:1,price:320000}],total:320000,status:"delivered",createdAt:"2025-02-05",address:"Cll 10 #32-15, El Poblado" },
    { id:"o3",storeId:"s3",storeName:"Belen Urbano",userId:"u5",items:[{productId:"p9",name:"Hoodie Oversized Logo",qty:1,price:145000},{productId:"p11",name:"Gorra Dad Hat Premium",qty:2,price:78000}],total:301000,status:"processing",createdAt:"2025-03-01",address:"Cra 45 #80-12, Laureles" },
    { id:"o4",storeId:"s1",storeName:"DistriModa El Norte",userId:"u6",items:[{productId:"p3",name:"Jean Mom Fit",qty:1,price:128000}],total:128000,status:"shipped",createdAt:"2025-03-15",address:"Cll 10 #32-15, El Poblado" },
    { id:"o5",storeId:"s9",storeName:"La Floresta Chic",userId:"u7",items:[{productId:"p23",name:"Top Crop Floral",qty:3,price:55000}],total:165000,status:"pending",createdAt:"2025-03-20",address:"Cra 70 #30-22, Laureles" },
    { id:"o6",storeId:"s10",storeName:"Masculino Bello",userId:"u5",items:[{productId:"p25",name:"Camisa Oxford Premium",qty:2,price:118000},{productId:"p26",name:"Polo Slim Fit",qty:1,price:85000}],total:321000,status:"pending",createdAt:"2025-03-22",address:"Cra 45 #80-12, Laureles" },
    { id:"o7",storeId:"s6",storeName:"Laureles Jeans",userId:"u8",items:[{productId:"p16",name:"Jean Skinny Premium",qty:2,price:148000}],total:296000,status:"delivered",createdAt:"2025-02-18",address:"Cra 80 #50-10, Laureles" },
    { id:"o8",storeId:"s11",storeName:"Vintage & Co Castilla",userId:"u7",items:[{productId:"p28",name:"Chaqueta Vintage 90s",qty:1,price:195000}],total:195000,status:"delivered",createdAt:"2025-03-05",address:"Cra 70 #30-22, Laureles" },
  ],
  activity: [
    { type:"order",msg:"Nuevo pedido en Masculino Bello — $321.000",time:"hace 5 min",color:"var(--cy)" },
    { type:"store",msg:"Sport Zone San Javier suspendida temporalmente",time:"hace 12 min",color:"var(--re)" },
    { type:"user",msg:"Nuevo cliente: Andrés Morales registrado",time:"hace 25 min",color:"var(--gr)" },
    { type:"order",msg:"Pedido entregado en El Norte — $219.000",time:"hace 1h",color:"var(--gr)" },
    { type:"stock",msg:"⚠️ Stock bajo: Botas Cuero Hombre (5 uds)",time:"hace 2h",color:"var(--ye)" },
    { type:"order",msg:"Nuevo pedido en La Floresta Chic — $165.000",time:"hace 3h",color:"var(--cy)" },
    { type:"store",msg:"Nueva tienda: Lencería Santa Fe activa",time:"hace 5h",color:"var(--pu)" },
    { type:"user",msg:"Cliente Sofía Herrera suspendida",time:"hace 6h",color:"var(--re)" },
    { type:"order",msg:"Pedido entregado en Fashion Poblado — $320.000",time:"hace 8h",color:"var(--gr)" },
    { type:"stock",msg:"Stock repuesto: Hoodie Oversized (55 uds)",time:"ayer 3pm",color:"var(--cy)" },
  ],
  salesByMonth:[42,58,71,65,89,103,92,115,128,144,136,162],
  salesByCat:{ Vestidos:28,Jeans:22,Hoodies:19,Blazers:12,Calzado:18,Accesorios:15,Deportivo:11,Camisas:16,Tops:14,Gorras:8,Bolsos:9,Otros:28 },
  templates: [
    { id:"t1",name:"Moda Urbana",emoji:"🏙️",primaryColor:"#00e5ff",description:"Para streetwear y moda urbana" },
    { id:"t2",name:"Boutique Premium",emoji:"💎",primaryColor:"#a855f7",description:"Para tiendas de lujo y premium" },
    { id:"t3",name:"Fresco & Floral",emoji:"🌸",primaryColor:"#ec4899",description:"Para moda femenina y casual" },
    { id:"t4",name:"Sport & Fitness",emoji:"⚡",primaryColor:"#ffb700",description:"Para ropa deportiva y fitness" },
    { id:"t5",name:"Clásico Masculino",emoji:"🕴️",primaryColor:"#14b8a6",description:"Para moda masculina formal" },
    { id:"t6",name:"Vintage Retro",emoji:"🎭",primaryColor:"#d97706",description:"Para tiendas vintage y segunda mano" },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 3 — HELPERS Y CONSTANTES
═══════════════════════════════════════════════════════════════ */
const fmt = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
const fmtK = n => n>=1000000?`$${(n/1000000).toFixed(1)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${n}`;
const haversine = (lat1,lng1,lat2,lng2) => {
  const R=6371,dL=(lat2-lat1)*Math.PI/180,dG=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dG/2)**2;
  return +(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
};
const statusMap = { pending:["⏳ Pendiente","b-warn"],processing:["⚙️ En proceso","b-cy"],shipped:["🚚 Enviado","b-warn"],delivered:["✅ Entregado","b-ok"],cancelled:["❌ Cancelado","b-off"] };
const genId = () => Math.random().toString(36).slice(2,9);
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DAYS = ["lun","mar","mie","jue","vie","sab","dom"];
const DAYS_LABEL = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const FASHION_CATS = ["Vestidos","Blusas","Jeans","Deportivo","Blazers","Hoodies","Gorras","Calzado","Accesorios","Pijamas","Faldas","Camisas","Tops","Chaquetas","Bolsos","Lencería","Polos","Bermudas","Camisetas","Pantalones","Cinturones","Gafas","Botas","Sandalias","Perfumería"];
const isStoreOpen = (store) => {
  const now = new Date();
  const dayNames = ["dom","lun","mar","mie","jue","vie","sab"];
  const today = dayNames[now.getDay()];
  const hrs = store.hours?.[today];
  if(!hrs||hrs==="Cerrado") return false;
  const [open,close] = hrs.split("–");
  if(!open||!close) return false;
  const [oh,om] = open.split(":").map(Number);
  const [ch,cm] = close.split(":").map(Number);
  const cur = now.getHours()*60+now.getMinutes();
  return cur >= oh*60+om && cur <= ch*60+cm;
};
const COLOR_MAP = c => c==="Blanco"?"#fff":c==="Negro"?"#111":c==="Rojo"?"#ef4444":c==="Azul"?"#3b82f6":c==="Verde"?"#22c55e":c==="Rosa"?"#ec4899":c==="Gris"?"#6b7280":c==="Beige"?"#d4b89a":c==="Amarillo"?"#eab308":c==="Café"?"#92400e":c==="Kaki"?"#a3a068":c==="Terracota"?"#c2553c":c==="Coral"?"#ff6b6b":c==="Camel"?"#c4a059":"var(--bg4)";

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 4 — SISTEMA DE TOAST GLOBAL
═══════════════════════════════════════════════════════════════ */
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type="info") => {
    const id = genId();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  const remove = id => setToasts(t => t.filter(x => x.id !== id));
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{fontSize:"1.1rem"}}>{t.type==="ok"?"✅":t.type==="err"?"❌":t.type==="warn"?"⚠️":"ℹ️"}</span>
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" onClick={()=>remove(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 5 — COMPONENTES UI PRIMITIVOS
═══════════════════════════════════════════════════════════════ */
function Stars({ value=0, max=5, onChange=null }) {
  const [hover,setHover] = useState(0);
  return (
    <div className="stars">
      {Array.from({length:max},(_,i)=>(
        <span key={i} className={`star${(hover||value)>i?" on":""}`}
          onMouseEnter={()=>onChange&&setHover(i+1)}
          onMouseLeave={()=>onChange&&setHover(0)}
          onClick={()=>onChange&&onChange(i+1)}>★</span>
      ))}
    </div>
  );
}

function MiniChart({ data, color="var(--cy)", height=80 }) {
  const max = Math.max(...data,1);
  return (
    <div>
      <div className="chart-bar-wrap" style={{height}}>
        {data.map((v,i)=>(
          <div key={i} className="chart-bar"
            style={{height:`${(v/max*100)}%`,background:color,opacity:.6+(i===data.length-1?.4:0)}}
            title={`${MONTHS[i]}: ${v}`}/>
        ))}
      </div>
      <div className="chart-labels">{data.map((_,i)=><div key={i} className="chart-label">{MONTHS[i]}</div>)}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 6 — LOGIN
═══════════════════════════════════════════════════════════════ */
async function safeJson(res) { try { return await res.json(); } catch { return {}; } }
function mapRealUser(realUser) {
  let appUser = DB.users.find(u => u.email === realUser.email);
  if (!appUser) {
    const role = realUser.role === "customer" ? "client" : realUser.role;
    appUser = { id:genId(), name:realUser.name, email:realUser.email, password:"", role, active:true, createdAt:realUser.createdAt||new Date().toISOString().slice(0,10) };
    if (realUser.storeId && realUser.role === "store") appUser.storeId = "s1";
    DB.users.push(appUser);
  }
  return appUser;
}

function LoginPage({ onLogin, dark, setDark }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState("");

  const doLogin = async (em, pw) => {
    let res, data;
    try {
      res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email:em.toLowerCase().trim(), password:pw }) });
      data = await safeJson(res);
    } catch { return "No se pudo conectar con el servidor. Verifica tu conexión."; }
    if (!res.ok) return data.message || "Correo o contraseña incorrectos";
    localStorage.setItem("distrimed_token", data.token);
    onLogin(mapRealUser(data.user));
    return null;
  };

  const submit = async () => {
    setErr("");
    if (tab === "login") {
      if (!email || !password) return setErr("Completa correo y contraseña");
      setLoading(true);
      const e = await doLogin(email, password);
      setLoading(false);
      if (e) setErr(e);
    } else {
      if (!name || !email || !password) return setErr("Completa todos los campos");
      if (password.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres");
      setLoading(true);
      let regRes, regData;
      try {
        regRes = await fetch("/api/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, email:email.toLowerCase().trim(), password, role:"customer" }) });
        regData = await safeJson(regRes);
      } catch { setLoading(false); return setErr("No se pudo conectar con el servidor."); }
      if (!regRes.ok) { setLoading(false); return setErr(regData.message || "Error al registrarse"); }
      const e = await doLogin(email, password);
      setLoading(false);
      if (e) setErr("Cuenta creada. " + e);
    }
  };

  const quickLogin = async (em, pw) => {
    setErr(""); setDemoLoading(em);
    const e = await doLogin(em, pw);
    setDemoLoading("");
    if (e) setErr(e);
  };

  const kp = e => e.key === "Enter" && submit();
  const DEMO = [
    ["admin@distri.co","admin123","🔴","Superadmin"],
    ["norte@distri.co","tienda123","🟠","Tienda Norte"],
    ["poblado@distri.co","tienda123","🟣","Fashion Poblado"],
    ["pedro@gmail.com","pass123","🟢","Cliente Pedro"],
  ];

  return (
    <div className="login-pg">
      <div className="login-glow"/>
      <div className="login-grid"/>
      <div className="login-card">
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
          <span style={{fontSize:"2rem"}}>👗</span>
          <div className="login-logo" style={{flex:1}}>DistriMed</div>
          <button className="ico-btn" onClick={()=>setDark&&setDark(d=>!d)} title={dark?"Modo claro":"Modo oscuro"} style={{fontSize:"1.1rem",padding:"6px 9px",flexShrink:0}}>{dark?"☀️":"🌙"}</button>
        </div>
        <div className="login-sub">Red de distribución de moda — Medellín · 400+ tiendas</div>

        <div className="tabs" style={{marginBottom:18}}>
          {[["login","🔐 Iniciar Sesión"],["register","✨ Registrarse"]].map(([k,l])=>(
            <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>{setTab(k);setErr("")}}>{l}</button>
          ))}
        </div>

        <div className="demo-box">
          <div style={{marginBottom:8,fontWeight:700,color:"var(--t0)",fontFamily:"var(--cond)"}}>⚡ Acceso directo demo — 1 clic:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {DEMO.map(([em,pw,icon,label])=>(
              <button key={em} disabled={!!demoLoading||loading} onClick={()=>quickLogin(em,pw)}
                style={{background:demoLoading===em?"var(--cy10)":"var(--bg3)",border:"1px solid var(--bd)",borderRadius:8,padding:"8px 10px",cursor:"pointer",color:"var(--t1)",textAlign:"left",fontSize:".82rem",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
                <span style={{fontSize:"1rem"}}>{demoLoading===em?"⏳":icon}</span>
                <span style={{fontWeight:600}}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {err && <div className="alert al-err">⚠️ {err}</div>}

        {tab==="register" && <div className="fg"><label>Nombre completo</label><input placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} onKeyPress={kp}/></div>}
        <div className="fg"><label>Correo electrónico</label><input type="email" placeholder="correo@ejemplo.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyPress={kp}/></div>
        <div className="fg" style={{marginBottom:18}}><label>Contraseña</label><input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyPress={kp}/></div>
        <button className="btn btn-cy w-full" style={{fontSize:"1rem",padding:"12px"}} onClick={submit} disabled={loading||!!demoLoading}>
          {loading?"⏳ Verificando...":tab==="login"?"🚀 Entrar":"✨ Crear cuenta"}
        </button>

        <div style={{marginTop:16,padding:10,background:"var(--bg3)",borderRadius:"var(--r)",fontSize:".72rem",color:"var(--t2)",textAlign:"center"}}>
          ℹ️ DistriMed v2.0 · Red de distribución de moda · Medellín, Colombia
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 7 — MÓDULO DE DOCUMENTACIÓN (todas las cuentas)
═══════════════════════════════════════════════════════════════ */
function Docs({ user }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [tab, setTab] = useState("inicio");
  const role = user?.role;

  const FEATURES_CLIENT = [
    ["👗","Catálogo de Moda","Explora más de 300 prendas de 12 tiendas. Filtra por categoría, precio, talla, color y marca. Ordena por novedades, precio o más vendidos."],
    ["🛒","Carrito de Compras","Agrega productos al carrito, selecciona talla y color, y confirma tu pedido con dirección de entrega en segundos."],
    ["❤️","Wishlist","Guarda tus prendas favoritas con el botón de corazón para comprarlas después."],
    ["🗺️","Mapa de Tiendas","Ubica tiendas en el mapa interactivo, activa tu GPS para ver distancias y horarios en tiempo real."],
    ["📋","Mis Pedidos","Seguimiento completo de todos tus pedidos con estado, historial y detalles de cada compra."],
    ["👤","Mi Perfil","Ve tu información personal, estadísticas de compras y actividad reciente en la plataforma."],
    ["⭐","Calificaciones","Califica los productos que compraste y ayuda a otros clientes a elegir mejor."],
  ];
  const FEATURES_STORE = [
    ["📊","Dashboard","KPIs en tiempo real: ventas, pedidos pendientes, stock bajo, rating promedio y gráfica mensual."],
    ["👗","Gestión de Productos","Crea, edita y elimina prendas. Controla stock en tiempo real, agrega colores, tallas, descuentos y marca como NUEVO."],
    ["📋","Gestión de Pedidos","Ve todos los pedidos de tu tienda. Actualiza el estado de cada pedido: Pendiente → En proceso → Enviado → Entregado."],
    ["📈","Analíticas","Gráficas de ventas mensuales, distribución por categoría, top productos y métricas clave de rendimiento."],
    ["⭐","Reseñas","Gestiona todas las calificaciones de tus productos. Responde a comentarios y analiza el rating promedio."],
    ["🕐","Horarios","Configura los horarios de atención de tu tienda para cada día de la semana."],
    ["🏪","Perfil de Tienda","Actualiza nombre, dirección, teléfono, descripción, redes sociales y color de marca."],
    ["🌐","Mi Página Web","Personaliza tu subdominio, aplica templates, configura banners y activa/desactiva tu página pública."],
  ];
  const FEATURES_ADMIN = [
    ["⚡","Dashboard Global","Métricas de toda la plataforma: tiendas, productos, ventas totales, usuarios y feed de actividad en vivo."],
    ["🏪","Gestión de Tiendas","Crea nuevas tiendas con templates, edita info, activa/desactiva y elimina tiendas de la red."],
    ["👗","Catálogo Global","Vista de todos los productos de la plataforma con filtros, estado y gestión de stock."],
    ["👥","Usuarios","Administra todos los usuarios del sistema. Activa/suspende cuentas y ve el historial."],
    ["🎨","Templates","Plantillas prediseñadas para crear tiendas con identidad visual definida en segundos."],
    ["📊","Reportes","Análisis completo de la plataforma: top tiendas, ventas por categoría, crecimiento mensual y métricas clave."],
    ["⚙️","Configuración","Ajustes globales de la red DistriMed: dominio, notificaciones y parámetros del sistema."],
  ];

  const FAQS_CLIENT = [
    ["¿Cómo hago un pedido?","Explora el catálogo, agrega productos al carrito con el botón '+ Agregar', selecciona talla y color en el detalle, luego ve al carrito y confirma con tu dirección de entrega."],
    ["¿Puedo pedir de varias tiendas?","Por ahora cada pedido es por tienda. Si tienes productos de varias tiendas, crea un pedido por tienda."],
    ["¿Cómo sé cuándo llega mi pedido?","En 'Mis Pedidos' puedes ver el estado actualizado: Pendiente → En proceso → Enviado → Entregado."],
    ["¿Cómo contacto a la tienda?","Cada tienda tiene WhatsApp e Instagram en su perfil. También puedes encontrarlos en el mapa."],
    ["¿Cómo guardo productos favoritos?","Haz clic en el corazón ❤️ de cualquier producto en el catálogo. Los encuentras en tu Wishlist."],
    ["¿Cómo califico un producto?","Abre el detalle del producto en el catálogo, selecciona las estrellas y escribe tu comentario."],
  ];
  const FAQS_STORE = [
    ["¿Cómo agrego un nuevo producto?","Ve a la pestaña 'Productos', haz clic en '+ Nueva prenda', completa el formulario con nombre, precio, stock, tallas y colores, y guarda."],
    ["¿Cómo actualizo el stock?","En la tabla de productos usa los botones +/- junto al número de stock, o edita el producto y cambia la cantidad."],
    ["¿Qué pasa cuando el stock llega al mínimo?","Aparece una alerta amarilla en el dashboard y una notificación para que repongas el inventario a tiempo."],
    ["¿Cómo proceso un pedido?","Ve a la pestaña 'Pedidos', haz clic en el estado del pedido y cámbialo: Pendiente → En proceso → Enviado → Entregado."],
    ["¿Cómo cambio mi horario?","En la pestaña 'Horarios' edita los horarios de cada día. Los cambios se reflejan inmediatamente en el mapa."],
    ["¿Cómo personalizo mi página web?","En la pestaña 'Mi Página' configuras tu subdominio, template visual y banner de tu tienda."],
  ];
  const FAQS_ADMIN = [
    ["¿Cómo crear una nueva tienda?","En 'Tiendas' haz clic en '+ Nueva tienda', selecciona un template, completa la información y guarda. La tienda queda activa inmediatamente."],
    ["¿Cómo suspender una tienda?","En la tabla de tiendas, usa el toggle de Estado para desactivar temporalmente una tienda sin eliminarla."],
    ["¿Cómo suspender un usuario?","En 'Usuarios' usa el toggle junto al usuario. No puedes suspender al Superadmin."],
    ["¿Qué muestran los Reportes?","Top 5 tiendas por ventas, ventas por categoría con gráfica de barras, crecimiento mensual y métricas de la plataforma."],
    ["¿Qué son los Templates?","Son plantillas prediseñadas con color de marca, emoji y estilo para crear tiendas nuevas de forma rápida y consistente."],
  ];

  const features = role==="superadmin"?FEATURES_ADMIN:role==="store"?FEATURES_STORE:FEATURES_CLIENT;
  const faqs = role==="superadmin"?FAQS_ADMIN:role==="store"?FAQS_STORE:FAQS_CLIENT;

  return (
    <div>
      <div style={{background:"linear-gradient(135deg,var(--bg2),var(--bg3))",border:"1px solid var(--bd)",borderRadius:"var(--rl)",padding:28,marginBottom:24,display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{fontSize:"3rem"}}>📖</div>
        <div>
          <div style={{fontFamily:"var(--cond)",fontSize:"1.8rem",fontWeight:900,color:"var(--cy)"}}>Centro de Ayuda</div>
          <div style={{color:"var(--t1)",fontSize:".9rem",marginTop:4}}>
            Guía completa para usar <b style={{color:"var(--t0)"}}>DistriMed</b> · Versión 2.0 · Red de moda Medellín
          </div>
          <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
            <span className={`badge ${role==="superadmin"?"b-cy":role==="store"?"b-or":"b-gr"}`}>
              {role==="superadmin"?"👑 Vista Admin":role==="store"?"🏪 Vista Tienda":"👤 Vista Cliente"}
            </span>
            <span className="pill">📱 PWA Compatible</span>
            <span className="pill">🔒 Seguro</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[["inicio","🏠 Inicio"],["funciones","⚡ Funciones"],["guia","📋 Guía Paso a Paso"],["faq","❓ Preguntas Frecuentes"],["atajos","⌨️ Atajos"],["acerca","ℹ️ Acerca de"]].map(([k,l])=>(
          <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="inicio" && (
        <div>
          <div className="doc-section">
            <div className="doc-h2">¿Qué es DistriMed?</div>
            <div className="doc-p">
              <b style={{color:"var(--t0)"}}>DistriMed</b> es la red de distribución de moda más completa de Medellín. Conecta tiendas distribuidoras con clientes finales a través de una plataforma web progresiva (PWA) moderna, rápida y segura.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginTop:16}}>
              {[["🏪","12+ Tiendas","Red activa de distribuidores en toda el área metropolitana"],["👗","300+ Prendas","Catálogo completo con vestidos, jeans, accesorios y más"],["👥","400+ Clientes","Comunidad creciente de compradores frecuentes"],["🚀","PWA","Funciona como app, instálala en tu teléfono desde el navegador"]].map(([ico,tit,desc])=>(
                <div key={tit} className="doc-feature">
                  <div className="doc-fico">{ico}</div>
                  <div className="doc-ftext"><div className="doc-fname">{tit}</div><div className="doc-fdesc">{desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="doc-section">
            <div className="doc-h2">Tu rol en DistriMed</div>
            {role==="superadmin" && (
              <div className="al-cy alert">
                👑 Eres <b>Superadmin</b>. Tienes control total de la plataforma: gestión de tiendas, usuarios, catálogo global y reportes analíticos.
              </div>
            )}
            {role==="store" && (
              <div className="alert" style={{background:"var(--or10)",border:"1px solid rgba(255,96,48,.25)",color:"#ffd0b5"}}>
                🏪 Eres <b>Propietario de Tienda</b>. Gestionas tu tienda, productos, pedidos y analíticas. Tu tienda tiene su propia página web en DistriMed.
              </div>
            )}
            {role==="client" && (
              <div className="al-ok alert">
                👤 Eres <b>Cliente</b>. Explora el catálogo, guarda favoritos en tu Wishlist, realiza pedidos y haz seguimiento en tiempo real.
              </div>
            )}
          </div>

          <div className="doc-section">
            <div className="doc-h2">¿Cómo instalar DistriMed?</div>
            <div className="doc-p">DistriMed es una <b>PWA (Progressive Web App)</b>. Puedes instalarla en tu teléfono como si fuera una app nativa, sin pasar por la tienda de apps.</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginTop:12}}>
              {[["📱 Android","Abre Chrome → Menú ⋮ → 'Agregar a pantalla de inicio'","var(--gr)"],["🍎 iPhone","Abre Safari → Compartir → 'Agregar a pantalla de inicio'","var(--cy)"],["💻 PC / Mac","Chrome o Edge → Ícono de instalación en la barra → Instalar","var(--pu)"]].map(([plat,desc,col])=>(
                <div key={plat} style={{background:"var(--bg3)",border:`1px solid ${col}44`,borderRadius:"var(--r)",padding:14}}>
                  <div style={{fontFamily:"var(--cond)",fontWeight:700,color:col,marginBottom:6}}>{plat}</div>
                  <div style={{fontSize:".82rem",color:"var(--t1)"}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="funciones" && (
        <div>
          <div className="doc-section">
            <div className="doc-h2">Funciones disponibles para tu cuenta</div>
            <div className="doc-p">Estas son todas las funciones que puedes usar como {role==="superadmin"?"Superadmin":role==="store"?"Propietario de Tienda":"Cliente"}:</div>
            <div style={{marginTop:12}}>
              {features.map(([ico,name,desc])=>(
                <div key={name} className="doc-feature">
                  <div className="doc-fico">{ico}</div>
                  <div className="doc-ftext"><div className="doc-fname">{name}</div><div className="doc-fdesc">{desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="guia" && (
        <div>
          {role==="client" && (
            <>
              <div className="doc-section">
                <div className="doc-h2">Cómo realizar tu primer pedido</div>
                {[["Explora el catálogo","Navega por el catálogo de moda. Usa los filtros de categoría, precio y talla para encontrar lo que buscas."],["Selecciona un producto","Haz clic en cualquier producto para ver todos los detalles: descripción, tallas, colores, calificaciones y precio."],["Elige talla y color","Selecciona tu talla y color preferido en el detalle del producto antes de agregar al carrito."],["Agrega al carrito","Haz clic en '🛒 Agregar al carrito'. Puedes seguir comprando y agregar más productos."],["Confirma tu pedido","Haz clic en el carrito, ingresa tu dirección de entrega y confirma. ¡Listo!"],["Sigue tu pedido","En 'Mis Pedidos' verás el estado actualizado. La tienda te contactará por WhatsApp para coordinar."]].map(([t,d],i)=>(
                  <div key={i} className="doc-step">
                    <div className="doc-num">{i+1}</div>
                    <div><b style={{color:"var(--t0)"}}>{t}.</b> <span style={{color:"var(--t1)"}}>{d}</span></div>
                  </div>
                ))}
              </div>
              <div className="doc-section">
                <div className="doc-h2">Cómo usar el Mapa</div>
                {[["Abre el Mapa","En el menú lateral haz clic en '🗺️ Mapa / Tiendas'."],["Activa tu GPS","Haz clic en '📍 Ubicarme' para ver las tiendas ordenadas por distancia a ti."],["Explora tiendas","Haz clic en cualquier pin del mapa para ver información de la tienda: rating, productos, horario y contacto."],["Filtra por categoría","Usa el filtro de categoría para ver solo las tiendas del tipo que te interesa."]].map(([t,d],i)=>(
                  <div key={i} className="doc-step"><div className="doc-num">{i+1}</div><div><b style={{color:"var(--t0)"}}>{t}.</b> <span style={{color:"var(--t1)"}}>{d}</span></div></div>
                ))}
              </div>
            </>
          )}
          {role==="store" && (
            <>
              <div className="doc-section">
                <div className="doc-h2">Cómo agregar un nuevo producto</div>
                {[["Ve a Productos","En tu panel de tienda, haz clic en la pestaña '👗 Productos'."],["Clic en Nueva Prenda","Haz clic en el botón '+ Nueva prenda' en la parte superior derecha."],["Completa el formulario","Ingresa nombre, precio, categoría, stock disponible y stock mínimo para alertas."],["Agrega detalles","Selecciona las tallas disponibles, los colores y sube una descripción atractiva."],["Configura extras","Agrega marca, porcentaje de descuento y marca como 'NUEVO' si aplica."],["Guarda","Haz clic en '💾 Guardar'. El producto aparece de inmediato en el catálogo público."]].map(([t,d],i)=>(
                  <div key={i} className="doc-step"><div className="doc-num">{i+1}</div><div><b style={{color:"var(--t0)"}}>{t}.</b> <span style={{color:"var(--t1)"}}>{d}</span></div></div>
                ))}
              </div>
              <div className="doc-section">
                <div className="doc-h2">Cómo procesar pedidos</div>
                {[["Ve a Pedidos","Haz clic en la pestaña '📋 Pedidos' en tu panel de tienda."],["Revisa pedidos pendientes","Los pedidos nuevos aparecen con estado '⏳ Pendiente'. Haz clic en el selector de estado."],["Actualiza el estado","Cambia el estado: Pendiente → En proceso (cuando preparas) → Enviado (cuando despachas) → Entregado."],["Contacta al cliente","Usa el WhatsApp del cliente o envía notificación desde el panel para coordinar la entrega."]].map(([t,d],i)=>(
                  <div key={i} className="doc-step"><div className="doc-num">{i+1}</div><div><b style={{color:"var(--t0)"}}>{t}.</b> <span style={{color:"var(--t1)"}}>{d}</span></div></div>
                ))}
              </div>
            </>
          )}
          {role==="superadmin" && (
            <>
              <div className="doc-section">
                <div className="doc-h2">Cómo crear una nueva tienda</div>
                {[["Ve a Tiendas","En el panel admin, haz clic en '🏪 Tiendas'."],["Clic en Nueva Tienda","Haz clic en '+ Nueva tienda' en la parte superior."],["Selecciona un template","Haz clic en '🎨 Aplicar template' para usar una plantilla prediseñada con color y estilo."],["Completa la información","Ingresa nombre, dirección, teléfono, categoría y subdominio (ej: mitienda → mitienda.distrimed.co)."],["Configura ubicación","Ajusta las coordenadas de latitud/longitud para que aparezca correctamente en el mapa."],["Guarda y activa","La tienda queda activa inmediatamente. Puedes asignarle un propietario desde Usuarios."]].map(([t,d],i)=>(
                  <div key={i} className="doc-step"><div className="doc-num">{i+1}</div><div><b style={{color:"var(--t0)"}}>{t}.</b> <span style={{color:"var(--t1)"}}>{d}</span></div></div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab==="faq" && (
        <div>
          <div className="doc-section">
            <div className="doc-h2">Preguntas Frecuentes</div>
            {faqs.map(([q,a],i)=>(
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                  <span>{q}</span>
                  <span style={{color:"var(--cy)",fontFamily:"var(--mono)"}}>{openFaq===i?"▲":"▼"}</span>
                </div>
                {openFaq===i && <div className="faq-a">{a}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="atajos" && (
        <div>
          <div className="doc-section">
            <div className="doc-h2">Atajos y Consejos Rápidos</div>
            <div className="doc-h3">Navegación</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:8}}>
              {[["Enter","Confirmar formulario / Login"],["Esc","Cerrar modales abiertos"],["☰ (menú)","Abrir/cerrar barra lateral en móvil"],["📍 GPS","Ubícate para ver tiendas cercanas"],["❤️ corazón","Guardar producto en Wishlist"],["🛒 carrito","Ver y gestionar carrito de compras"]].map(([k,d])=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bd)"}}>
                  <kbd className="kbd">{k}</kbd>
                  <span style={{fontSize:".82rem",color:"var(--t1)"}}>{d}</span>
                </div>
              ))}
            </div>
            <div className="doc-h3">Consejos Pro</div>
            {[["💡","Usa los botones de acceso rápido en el login para entrar sin escribir — ideal para demos y pruebas."],["💡","En el catálogo, los chips de categoría arriba de los productos permiten filtrar con un solo clic."],["💡","En el mapa, activa el GPS y verás las tiendas ordenadas por distancia. El punto naranja eres tú."],["💡","Las alertas de stock bajo aparecen automáticamente cuando quedan menos unidades del mínimo configurado."],["💡","Puedes instalar DistriMed como app en tu teléfono desde el navegador sin ir a la tienda de apps."]].map(([ico,t],i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"10px 14px",background:"var(--bg3)",borderRadius:"var(--r)",marginBottom:6,fontSize:".85rem",color:"var(--t1)",border:"1px solid var(--bd)"}}>
                <span>{ico}</span><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="acerca" && (
        <div>
          <div className="doc-section">
            <div className="doc-h2">Acerca de DistriMed</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:20}}>
              {[["🏷️","Versión","2.0 — Reforma completa 2026"],["🗓️","Actualización","Marzo 2026"],["🌐","Tecnología","React 19 · Vite · Express 5 · PostgreSQL"],["📱","Compatibilidad","PWA · iOS · Android · Desktop"],["🔒","Seguridad","Bcrypt · JWT · HTTPS"],["📍","Ubicación","Medellín, Antioquia, Colombia"]].map(([ico,k,v])=>(
                <div key={k} style={{background:"var(--bg3)",border:"1px solid var(--bd)",borderRadius:"var(--r)",padding:14}}>
                  <div style={{fontSize:"1.4rem",marginBottom:6}}>{ico}</div>
                  <div style={{fontSize:".7rem",color:"var(--t2)",fontFamily:"var(--cond)",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>{k}</div>
                  <div style={{fontSize:".85rem",color:"var(--t0)",marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
            <div className="doc-h3">Stack Tecnológico</div>
            <div style={{padding:16,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bd)",fontFamily:"var(--mono)",fontSize:".78rem",color:"var(--t1)",lineHeight:1.8}}>
              <div><span style={{color:"var(--cy)"}}>Frontend:</span> React 19 · Vite 7 · TypeScript · PWA (Service Worker)</div>
              <div><span style={{color:"var(--gr)"}}>Backend:</span> Express 5 · Node.js · Pino Logger · CORS</div>
              <div><span style={{color:"var(--pu)"}}>Base de Datos:</span> PostgreSQL (Neon) · Drizzle ORM</div>
              <div><span style={{color:"var(--or)"}}>Autenticación:</span> Bcrypt · JWT (Base64) · localStorage</div>
              <div><span style={{color:"var(--ye)"}}>Infraestructura:</span> Replit · Auto-deploy · Auto-seed</div>
            </div>
            <div className="doc-h3" style={{marginTop:16}}>Changelog v2.0</div>
            {[["✅","Módulo de Documentación completo con guías por rol"],["✅","Wishlist de favoritos para clientes"],["✅","Perfil de usuario con estadísticas"],["✅","Analytics avanzadas para tiendas"],["✅","Reseñas y ratings en panel de tienda"],["✅","Reportes de plataforma para admin"],["✅","Sistema de configuración global"],["✅","Bottom Navigation Bar para móvil (PWA)"],["✅","Sistema de Toast notifications"],["✅","Fix crítico: bcrypt login + manejo de errores JSON"],["✅","Creación automática de tablas en producción"],["✅","Acceso de 1 clic en login demo"]].map(([ico,t],i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"6px 0",fontSize:".85rem",color:"var(--t1)",borderBottom:"1px solid var(--bd)"}}>
                <span>{ico}</span><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 8 — CATÁLOGO (CLIENTE)
═══════════════════════════════════════════════════════════════ */
function Catalog({ user, db, setDb, wishlist, setWishlist }) {
  const toast = useToast();
  const [search,setSearch] = useState("");
  const [cat,setCat] = useState("");
  const [storeFilter,setStoreFilter] = useState("");
  const [minP,setMinP] = useState("");
  const [maxP,setMaxP] = useState("");
  const [sel,setSel] = useState(null);
  const [cart,setCart] = useState([]);
  const [rateVal,setRateVal] = useState(0);
  const [comment,setComment] = useState("");
  const [showCart,setShowCart] = useState(false);
  const [sortBy,setSortBy] = useState("default");
  const [selColor,setSelColor] = useState("");
  const [selSize,setSelSize] = useState("");
  const [checkoutAddr,setCheckoutAddr] = useState("");
  const [checkoutStep,setCheckoutStep] = useState("cart");

  const cats = [...new Set(db.products.map(p=>p.category))].sort();
  const activeStores = db.stores.filter(s=>s.active).map(s=>s.id);
  let prods = db.products.filter(p=>activeStores.includes(p.storeId));
  if(search) prods = prods.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase())||p.brand?.toLowerCase().includes(search.toLowerCase()));
  if(cat) prods = prods.filter(p=>p.category===cat);
  if(storeFilter) prods = prods.filter(p=>p.storeId===storeFilter);
  if(minP) prods = prods.filter(p=>p.price>=+minP);
  if(maxP) prods = prods.filter(p=>p.price<=+maxP);
  if(sortBy==="price_asc") prods=[...prods].sort((a,b)=>a.price-b.price);
  if(sortBy==="price_desc") prods=[...prods].sort((a,b)=>b.price-a.price);
  if(sortBy==="rating") prods=[...prods].sort((a,b)=>b.rating-a.rating);
  if(sortBy==="sales") prods=[...prods].sort((a,b)=>b.sales-a.sales);
  if(sortBy==="new") prods=[...prods].filter(p=>p.isNew).concat(prods.filter(p=>!p.isNew));

  const addCart = p => {
    setCart(c=>{const e=c.find(x=>x.id===p.id);return e?c.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...c,{...p,qty:1,chosenColor:selColor||p.colors?.[0],chosenSize:selSize||p.sizes?.[0]}]});
    toast("Producto agregado al carrito","ok");
  };
  const removeCart = id => setCart(c=>c.filter(x=>x.id!==id));
  const cartTotal = cart.reduce((s,x)=>s+x.price*x.qty,0);
  const cartQty = cart.reduce((s,x)=>s+x.qty,0);

  const toggleWish = (p,e) => {
    e.stopPropagation();
    if(wishlist.includes(p.id)){
      setWishlist(w=>w.filter(id=>id!==p.id));
      toast("Quitado de Wishlist","info");
    } else {
      setWishlist(w=>[...w,p.id]);
      toast("¡Guardado en tu Wishlist! ❤️","ok");
    }
  };

  const placeOrder = () => {
    if(!cart.length) return;
    if(!checkoutAddr.trim()) return toast("Ingresa tu dirección de entrega","warn");
    const storeId = cart[0].storeId;
    const order = { id:genId(),storeId,storeName:db.stores.find(s=>s.id===storeId)?.name||"",userId:user.id,items:cart.map(x=>({productId:x.id,name:x.name,qty:x.qty,price:x.price,color:x.chosenColor,size:x.chosenSize})),total:cartTotal,status:"pending",createdAt:new Date().toISOString().slice(0,10),address:checkoutAddr };
    const newDb = {...db,orders:[...db.orders,order],stores:db.stores.map(s=>s.id===storeId?{...s,totalSales:s.totalSales+cartTotal,ordersCount:s.ordersCount+1}:s)};
    setDb(newDb); setCart([]); setShowCart(false); setCheckoutStep("cart"); setCheckoutAddr("");
    toast("🎉 ¡Pedido confirmado! Puedes seguirlo en Mis Pedidos","ok");
  };

  const submitRating = () => {
    if(!rateVal||!sel) return;
    const nr = {id:genId(),productId:sel.id,userId:user.id,score:rateVal,comment};
    const newRatings = [...db.ratings.filter(r=>!(r.productId===sel.id&&r.userId===user.id)),nr];
    const prodRatings = newRatings.filter(r=>r.productId===sel.id);
    const avg = +(prodRatings.reduce((s,r)=>s+r.score,0)/prodRatings.length).toFixed(1);
    setDb({...db,ratings:newRatings,products:db.products.map(p=>p.id===sel.id?{...p,rating:avg}:p)});
    setSel(s=>({...s,rating:avg}));
    setRateVal(0); setComment("");
    toast("¡Calificación enviada! ⭐","ok");
  };

  const QUICK_CATS = ["Vestidos","Jeans","Hoodies","Blazers","Calzado","Accesorios","Deportivo","Camisas","Tops","Gorras"];

  return (
    <div>
      <div className="sec-hd">
        <div>
          <div className="sec-ttl">👗 Catálogo de Moda</div>
          <div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>{prods.length} prendas · {activeStores.length} tiendas activas</div>
        </div>
        <button className="btn btn-cy btn-sm" onClick={()=>{setShowCart(true);setCheckoutStep("cart")}}>
          🛒 Carrito {cartQty>0&&`(${cartQty})`}
          {cartQty>0&&<span style={{marginLeft:4,fontFamily:"var(--mono)",fontSize:".75rem"}}>{fmt(cartTotal)}</span>}
        </button>
      </div>

      <div className="filters">
        <input placeholder="🔍 Buscar prendas, marcas, categorías..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:2,minWidth:180}}/>
        <select value={cat} onChange={e=>setCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={storeFilter} onChange={e=>setStoreFilter(e.target.value)}>
          <option value="">Todas las tiendas</option>
          {db.stores.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="default">Ordenar por...</option>
          <option value="new">Novedades</option>
          <option value="price_asc">Precio ↑</option>
          <option value="price_desc">Precio ↓</option>
          <option value="rating">Mejor rating</option>
          <option value="sales">Más vendidos</option>
        </select>
        <input type="number" placeholder="Mín $" value={minP} onChange={e=>setMinP(e.target.value)} style={{maxWidth:90}}/>
        <input type="number" placeholder="Máx $" value={maxP} onChange={e=>setMaxP(e.target.value)} style={{maxWidth:90}}/>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        <button className={`filter-chip${!cat?" on":""}`} onClick={()=>setCat("")}>Todas</button>
        {QUICK_CATS.map(c=>(
          <button key={c} className={`filter-chip${cat===c?" on":""}`} onClick={()=>setCat(cat===c?"":c)}>{c}</button>
        ))}
      </div>

      {prods.length===0
        ? <div className="empty"><div className="empty-ico">👗</div><div className="empty-ttl">Sin resultados</div><div>Ajusta los filtros de búsqueda</div></div>
        : <div className="prod-grid">
            {prods.map(p=>{
              const store = db.stores.find(s=>s.id===p.storeId);
              const inCart = cart.find(x=>x.id===p.id);
              const finalPrice = p.discount>0 ? p.price*(1-p.discount/100) : p.price;
              const isWished = wishlist.includes(p.id);
              const gradients = { "s1":"linear-gradient(135deg,#0c1628,#00e5ff22)","s2":"linear-gradient(135deg,#0c1628,#a855f722)","s3":"linear-gradient(135deg,#0c1628,#ff603022)","s4":"linear-gradient(135deg,#0c1628,#00d68f22)","s6":"linear-gradient(135deg,#0c1628,#3b82f622)","s9":"linear-gradient(135deg,#0c1628,#ec489922)","s10":"linear-gradient(135deg,#0c1628,#14b8a622)" };
              return (
                <div key={p.id} className="prod-card" onClick={()=>{setSel(p);setSelColor(p.colors?.[0]||"");setSelSize(p.sizes?.[0]||"")}}>
                  <div className="prod-thumb" style={{background:gradients[p.storeId]||"linear-gradient(135deg,var(--bg3),var(--bg4))"}}>
                    {p.isNew && <span className="prod-badge"><span className="badge b-cy" style={{fontSize:".55rem"}}>NUEVO</span></span>}
                    {p.discount>0 && <span className="prod-badge-sale"><span className="badge" style={{background:"var(--re10)",color:"var(--re)",fontSize:".55rem"}}>-{p.discount}%</span></span>}
                    <button className={`wish-btn${isWished?" active":""}`} onClick={e=>toggleWish(p,e)}>{isWished?"❤️":"🤍"}</button>
                    <span style={{position:"relative",zIndex:1,fontSize:"4.5rem"}}>{p.emoji}</span>
                  </div>
                  <div className="prod-body">
                    <div className="prod-name">{p.name}</div>
                    <div className="prod-cat">{p.category}</div>
                    {p.brand && <div className="prod-brand">🏷️ {p.brand}</div>}
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
                      {p.colors?.slice(0,4).map(c=>(
                        <div key={c} className="color-swatch" title={c} style={{background:COLOR_MAP(c),border:"1px solid var(--bd)"}}/>
                      ))}
                    </div>
                    <div className="prod-price">
                      {p.discount>0 && <span style={{textDecoration:"line-through",color:"var(--t2)",marginRight:6,fontSize:".8rem"}}>{fmt(p.price)}</span>}
                      {fmt(finalPrice)}
                    </div>
                    <div className="prod-store">🏪 {store?.name}</div>
                  </div>
                  <div className="prod-foot">
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      <Stars value={p.rating}/>
                      <span style={{fontSize:".62rem",color:"var(--t2)"}}>{p.sales} ventas</span>
                    </div>
                    <button className="btn btn-cy btn-xs" disabled={p.stock===0}
                      onClick={e=>{e.stopPropagation();addCart({...p,chosenColor:p.colors?.[0],chosenSize:p.sizes?.[0]})}}
                      style={inCart?{background:"var(--gr)",color:"#000"}:{}}>
                      {inCart?`✓(${inCart.qty})`:p.stock===0?"Agotado":"+ Agregar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {sel && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
          <div className="modal modal-lg">
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              <div style={{flex:"0 0 180px",height:200,background:sel.storeId==="s1"?"linear-gradient(135deg,#0c1628,#00e5ff22)":sel.storeId==="s2"?"linear-gradient(135deg,#0c1628,#a855f722)":"linear-gradient(135deg,var(--bg3),var(--bg4))",borderRadius:"var(--r)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"6rem",border:"1px solid var(--bd)",position:"relative"}}>
                {sel.emoji}
                <button className={`wish-btn${wishlist.includes(sel.id)?" active":""}`} style={{position:"absolute",top:8,right:8}} onClick={e=>toggleWish(sel,e)}>{wishlist.includes(sel.id)?"❤️":"🤍"}</button>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  {sel.isNew && <span className="badge b-cy">NUEVO</span>}
                  <span className="pill">📦 {sel.category}</span>
                  {sel.brand && <span className="pill">🏷️ {sel.brand}</span>}
                  <span className="pill" style={{color:sel.stock===0?"var(--re)":sel.stock<=sel.minStock?"var(--ye)":"var(--gr)"}}>Stock: {sel.stock}</span>
                </div>
                <div className="modal-ttl" style={{marginBottom:6}}>{sel.name}</div>
                <div style={{color:"var(--t1)",fontSize:".875rem",marginBottom:12,lineHeight:1.5}}>{sel.description}</div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{fontFamily:"var(--mono)",color:"var(--cy)",fontSize:"1.6rem",fontWeight:700}}>
                    {sel.discount>0?fmt(sel.price*(1-sel.discount/100)):fmt(sel.price)}
                  </div>
                  {sel.discount>0 && <><div style={{textDecoration:"line-through",color:"var(--t2)"}}>{fmt(sel.price)}</div><span className="badge" style={{background:"var(--re10)",color:"var(--re)"}}>-{sel.discount}%</span></>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Stars value={sel.rating}/><span style={{color:"var(--ye)",fontFamily:"var(--mono)",fontWeight:700}}>{sel.rating}</span>
                  <span style={{color:"var(--t2)",fontSize:".78rem"}}>/5 · {sel.sales} ventas</span>
                </div>
              </div>
            </div>

            {sel.colors?.length>0 && (
              <div style={{marginTop:14,marginBottom:10}}>
                <label>COLOR: {selColor}</label>
                <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                  {sel.colors.map(c=><div key={c} onClick={()=>setSelColor(c)} className={`color-swatch${selColor===c?" sel":""}`} style={{width:28,height:28,background:COLOR_MAP(c),border:"1px solid var(--bd)"}} title={c}/>)}
                </div>
              </div>
            )}
            {sel.sizes?.length>0 && sel.sizes[0]!=="Única" && (
              <div style={{marginBottom:14}}>
                <label>TALLA: {selSize}</label>
                <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                  {sel.sizes.map(s=><button key={s} className={`size-btn${selSize===s?" sel":""}`} onClick={()=>setSelSize(s)}>{s}</button>)}
                </div>
              </div>
            )}

            {db.ratings.filter(r=>r.productId===sel.id).length>0 && (
              <>
                <div className="divider"/>
                <div style={{fontFamily:"var(--cond)",fontWeight:700,fontSize:".85rem",color:"var(--t1)",marginBottom:8}}>RESEÑAS DE COMPRADORES</div>
                {db.ratings.filter(r=>r.productId===sel.id).slice(0,3).map(r=>{
                  const ru = db.users.find(u=>u.id===r.userId);
                  return (
                    <div key={r.id} className="review-card">
                      <div className="review-card-hd">
                        <div><div className="review-user">{ru?.name||"Usuario"}</div><Stars value={r.score}/></div>
                      </div>
                      {r.comment && <div className="review-comment">"{r.comment}"</div>}
                    </div>
                  );
                })}
              </>
            )}

            <div className="divider"/>
            <div style={{marginBottom:8,fontFamily:"var(--cond)",fontWeight:700,fontSize:".88rem",color:"var(--t1)"}}>⭐ DEJAR CALIFICACIÓN</div>
            <Stars value={rateVal} onChange={setRateVal}/>
            <textarea style={{marginTop:8,resize:"none",height:56}} placeholder="¿Qué te pareció? (opcional)" value={comment} onChange={e=>setComment(e.target.value)}/>
            <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
              <button className="btn btn-gr btn-sm" onClick={submitRating} disabled={!rateVal}>⭐ Calificar</button>
              <button className="btn btn-cy" onClick={()=>{addCart({...sel,chosenColor:selColor,chosenSize:selSize});setSel(null)}} disabled={sel.stock===0}>
                🛒 {sel.stock===0?"Agotado":"Agregar al carrito"}
              </button>
              <button className="btn btn-sec btn-sm" onClick={()=>setSel(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowCart(false)}>
          <div className="modal">
            {checkoutStep==="cart" ? (
              <>
                <div className="modal-ttl">🛒 Carrito de compras</div>
                {cart.length===0
                  ? <div className="empty"><div className="empty-ico">🛒</div><div>El carrito está vacío</div><button className="btn btn-sec btn-sm" style={{marginTop:8}} onClick={()=>setShowCart(false)}>Ver catálogo</button></div>
                  : <>
                      {cart.map(x=>(
                        <div key={x.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,padding:"10px 0",borderBottom:"1px solid var(--bd)"}}>
                          <span style={{fontSize:"1.8rem"}}>{x.emoji}</span>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"var(--cond)",fontWeight:700}}>{x.name}</div>
                            <div style={{fontSize:".75rem",color:"var(--t2)"}}>x{x.qty} · {fmt(x.price)} c/u</div>
                            {(x.chosenColor||x.chosenSize) && <div style={{fontSize:".7rem",color:"var(--t1)",marginTop:2}}>{x.chosenColor&&`🎨 ${x.chosenColor}`} {x.chosenSize&&`📐 ${x.chosenSize}`}</div>}
                          </div>
                          <div style={{fontFamily:"var(--mono)",color:"var(--cy)"}}>{fmt(x.price*x.qty)}</div>
                          <button className="btn btn-re btn-xs" onClick={()=>removeCart(x.id)}>✕</button>
                        </div>
                      ))}
                      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--cond)",fontSize:"1.15rem",fontWeight:800,margin:"14px 0 8px",padding:"12px 0",borderTop:"1px solid var(--bd)"}}>
                        <span>TOTAL</span><span style={{color:"var(--cy)"}}>{fmt(cartTotal)}</span>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn btn-cy" style={{flex:1}} onClick={()=>setCheckoutStep("checkout")}>📦 Ir a pagar</button>
                        <button className="btn btn-sec" onClick={()=>setShowCart(false)}>Seguir comprando</button>
                      </div>
                    </>
                }
              </>
            ) : (
              <>
                <div className="modal-ttl">📦 Confirmar pedido</div>
                <div style={{background:"var(--bg3)",borderRadius:"var(--r)",padding:12,marginBottom:16}}>
                  {cart.map(x=><div key={x.id} style={{display:"flex",justifyContent:"space-between",fontSize:".82rem",padding:"3px 0"}}><span>{x.emoji} {x.name} ×{x.qty}</span><span style={{fontFamily:"var(--mono)",color:"var(--cy)"}}>{fmt(x.price*x.qty)}</span></div>)}
                  <div style={{borderTop:"1px solid var(--bd)",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontFamily:"var(--cond)",fontWeight:800}}>
                    <span>TOTAL</span><span style={{color:"var(--cy)"}}>{fmt(cartTotal)}</span>
                  </div>
                </div>
                <div className="fg">
                  <label>Dirección de entrega *</label>
                  <input placeholder="Cra/Cll #-#, Barrio, Ciudad" value={checkoutAddr} onChange={e=>setCheckoutAddr(e.target.value)}/>
                </div>
                <div style={{padding:10,background:"var(--cy10)",borderRadius:"var(--r)",fontSize:".78rem",color:"var(--cy)",marginBottom:14,border:"1px solid var(--cy20)"}}>
                  ℹ️ La tienda te contactará por WhatsApp para coordinar el pago y entrega.
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-cy" style={{flex:1}} onClick={placeOrder}>✅ Confirmar pedido</button>
                  <button className="btn btn-sec" onClick={()=>setCheckoutStep("cart")}>← Volver</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 9 — MAPA DE TIENDAS
═══════════════════════════════════════════════════════════════ */
function MapView({ stores, userLoc, db }) {
  const [sel,setSel] = useState(null);
  const [filter,setFilter] = useState("");
  const [searchS,setSearchS] = useState("");
  const [showOnly,setShowOnly] = useState("all");
  const toX = lng => `${((lng-(-75.64))/((-75.54)-(-75.64)))*100}%`;
  const toY = lat => `${(1-(lat-6.15)/(6.35-6.15))*100}%`;
  const cats = [...new Set(stores.map(s=>s.category))];
  let visibleStores = stores;
  if(showOnly==="active") visibleStores=stores.filter(s=>s.active);
  if(showOnly==="inactive") visibleStores=stores.filter(s=>!s.active);
  if(filter) visibleStores=visibleStores.filter(s=>s.category===filter);
  if(searchS) visibleStores=visibleStores.filter(s=>s.name.toLowerCase().includes(searchS.toLowerCase())||s.address.toLowerCase().includes(searchS.toLowerCase()));
  const selStore = stores.find(s=>s.id===sel);
  const selProducts = selStore?db.products.filter(p=>p.storeId===selStore.id).slice(0,3):[];

  let sortedList = [...visibleStores];
  if(userLoc) sortedList.sort((a,b)=>haversine(userLoc.lat,userLoc.lng,a.lat,a.lng)-haversine(userLoc.lat,userLoc.lng,b.lat,b.lng));

  return (
    <div>
      <div className="sec-hd">
        <div>
          <div className="sec-ttl">🗺️ Mapa de Tiendas</div>
          <div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>{userLoc?<span className="text-gr">📍 GPS activo · ordenado por distancia</span>:<span>Ubícate para ver tiendas cercanas</span>}</div>
        </div>
        {userLoc&&<span className="badge b-ok">📍 GPS Activo</span>}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input placeholder="🔍 Buscar tienda..." value={searchS} onChange={e=>setSearchS(e.target.value)} style={{flex:1,minWidth:150}}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{width:"auto"}}>
          <option value="">Todas las categorías</option>
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
        <div style={{display:"flex",gap:4}}>
          {[["all","Todas"],["active","Activas"],["inactive","Inactivas"]].map(([k,l])=>(
            <button key={k} className={`filter-chip${showOnly===k?" on":""}`} onClick={()=>setShowOnly(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16,alignItems:"start"}}>
        <div className="map-wrap" style={{height:520,position:"relative",background:"var(--bg2)"}}>
          <div className="map-grid"/>
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#1a2d47" strokeWidth="1.2"/>
            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#1a2d47" strokeWidth="1.2"/>
            <line x1="18%" y1="0%" x2="45%" y2="100%" stroke="#00e5ff" strokeWidth="0.6" opacity="0.3"/>
            <text x="30%" y="42%" fill="#253c5a" fontSize="4.5" fontFamily="DM Mono">Autopista Norte</text>
            <text x="6%" y="65%" fill="#253c5a" fontSize="4.5" fontFamily="DM Mono">Av. Regional</text>
            <text x="46%" y="83%" fill="#253c5a" fontSize="4.5" fontFamily="DM Mono">Av. El Poblado</text>
          </svg>
          <div style={{position:"absolute",top:8,left:12,color:"var(--t2)",fontSize:".55rem",fontFamily:"var(--mono)",letterSpacing:".1em",zIndex:5}}>MEDELLÍN ÁREA METROPOLITANA · COLOMBIA</div>

          {stores.map(s=>{
            const x=toX(s.lng),y=toY(s.lat),isSel=sel===s.id;
            const isHidden=visibleStores.every(vs=>vs.id!==s.id)&&s.id!==sel;
            const dist=userLoc?haversine(userLoc.lat,userLoc.lng,s.lat,s.lng):null;
            const open=isStoreOpen(s);
            return (
              <div key={s.id} style={{position:"absolute",left:x,top:y,transform:"translate(-50%,-50%)",zIndex:isSel?10:5,cursor:"pointer",opacity:isHidden?.12:1,transition:"opacity .2s"}} onClick={()=>setSel(isSel?null:s.id)}>
                <div style={{position:"relative"}}>
                  {isSel&&<div style={{position:"absolute",inset:-12,borderRadius:"50%",border:"2px solid var(--cy)",animation:"ring 1.5s infinite",zIndex:0}}/>}
                  <div style={{background:isSel?"var(--cy)":s.active?"var(--bg3)":"rgba(255,51,85,.12)",border:`2px solid ${isSel?"var(--cy)":s.active?"var(--bd2)":"var(--re)"}`,borderRadius:"50%",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",boxShadow:isSel?`0 0 20px var(--cy),0 0 40px rgba(0,229,255,.3)`:s.active?"0 2px 8px rgba(0,0,0,.5)":"none",transition:"all .2s",position:"relative",zIndex:1}}>
                    {s.emoji}
                    {s.active&&open&&<div style={{position:"absolute",top:-2,right:-2,width:8,height:8,borderRadius:"50%",background:"var(--gr)",border:"1px solid var(--bg)"}}/>}
                  </div>
                  {isSel&&selStore&&(
                    <div style={{position:"absolute",bottom:"calc(100% + 12px)",left:"50%",transform:"translateX(-50%)",background:"var(--bg1)",border:`1px solid ${selStore.theme||"var(--cy)"}`,borderRadius:12,padding:"12px 16px",minWidth:220,whiteSpace:"nowrap",zIndex:20,boxShadow:"0 8px 32px rgba(0,0,0,.7)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <span style={{fontSize:"1.2rem"}}>{selStore.emoji}</span>
                        <div><div style={{fontFamily:"var(--cond)",fontWeight:800,fontSize:".9rem",color:selStore.theme||"var(--cy)"}}>{selStore.name}</div><div style={{fontSize:".63rem",color:"var(--t2)"}}>{selStore.address}</div></div>
                      </div>
                      <div style={{display:"flex",gap:8,fontSize:".7rem",color:"var(--t1)",marginBottom:6,flexWrap:"wrap"}}>
                        <span>⭐ {selStore.rating}</span>
                        <span>📦 {db.products.filter(p=>p.storeId===selStore.id).length} prendas</span>
                        {dist&&<span style={{color:"var(--or)"}}>📍 {dist}km</span>}
                        <span className={`badge ${open?"b-ok":"b-off"}`} style={{fontSize:".56rem"}}>{open?"ABIERTO":"CERRADO"}</span>
                      </div>
                      {selProducts.length>0&&(
                        <div style={{borderTop:"1px solid var(--bd)",paddingTop:6}}>
                          {selProducts.map(p=><div key={p.id} style={{fontSize:".68rem",color:"var(--t1)",padding:"1px 0"}}>{p.emoji} {p.name} · <span style={{color:"var(--cy)",fontFamily:"var(--mono)"}}>{fmt(p.price)}</span></div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {userLoc&&(
            <div style={{position:"absolute",left:toX(userLoc.lng),top:toY(userLoc.lat),transform:"translate(-50%,-50%)",zIndex:15}}>
              <div style={{width:14,height:14,borderRadius:"50%",background:"var(--or)",boxShadow:"0 0 20px var(--or)",border:"2px solid #fff"}}/>
              <div style={{position:"absolute",inset:-8,borderRadius:"50%",border:"2px solid var(--or)",animation:"ring 2s infinite"}}/>
              <div style={{position:"absolute",bottom:"calc(100% + 4px)",left:"50%",transform:"translateX(-50%)",background:"var(--bg1)",border:"1px solid var(--or)",borderRadius:6,padding:"2px 7px",fontSize:".58rem",color:"var(--or)",fontFamily:"var(--mono)",whiteSpace:"nowrap"}}>TÚ</div>
            </div>
          )}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:520,overflowY:"auto"}}>
          <div style={{fontFamily:"var(--cond)",fontSize:".75rem",fontWeight:700,color:"var(--t2)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>
            {sortedList.length} TIENDAS {userLoc?"· Más cercanas":""}
          </div>
          {sortedList.map(s=>{
            const dist=userLoc?haversine(userLoc.lat,userLoc.lng,s.lat,s.lng):null;
            const open=isStoreOpen(s);
            return (
              <div key={s.id} className={`store-card${sel===s.id?" sel":""}`} onClick={()=>setSel(sel===s.id?null:s.id)}>
                <div className="s-emoji">{s.emoji}</div>
                <div className="s-info">
                  <div className="s-name">{s.name}</div>
                  <div className="s-addr">{s.address}</div>
                  <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                    <span className={`badge ${s.active?"b-ok":"b-off"}`} style={{fontSize:".55rem"}}>{s.active?"ACTIVA":"INACTIVA"}</span>
                    <span className={`badge ${open?"b-ok":"b-off"}`} style={{fontSize:".55rem"}}>{open?"ABIERTA":"CERRADA"}</span>
                    <span style={{color:"var(--ye)",fontSize:".7rem"}}>⭐{s.rating}</span>
                  </div>
                </div>
                {dist&&<div className="s-dist">📍{dist}km</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 10 — MIS PEDIDOS
═══════════════════════════════════════════════════════════════ */
function Orders({ user, db }) {
  const orders = db.orders.filter(o=>o.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const steps = ["pending","processing","shipped","delivered"];
  return (
    <div>
      <div className="sec-hd">
        <div>
          <div className="sec-ttl">📋 Mis Pedidos</div>
          <div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>{orders.length} pedidos · {orders.filter(o=>o.status==="pending"||o.status==="processing").length} activos</div>
        </div>
        <span className="badge b-cy">{orders.length} total</span>
      </div>
      {orders.length===0
        ? <div className="empty"><div className="empty-ico">📋</div><div className="empty-ttl">Sin pedidos aún</div><div>Explora el catálogo y realiza tu primer pedido</div></div>
        : orders.map(o=>{
          const store = db.stores.find(s=>s.id===o.storeId);
          const stepIdx = steps.indexOf(o.status);
          return (
            <div key={o.id} style={{background:"var(--bg2)",border:"1px solid var(--bd)",borderRadius:"var(--rl)",padding:20,marginBottom:12,transition:"border-color .2s"}} className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {store&&<span style={{fontSize:"1.3rem"}}>{store.emoji}</span>}
                    <div style={{fontFamily:"var(--cond)",fontWeight:800,fontSize:"1rem"}}>{o.storeName}</div>
                  </div>
                  <div style={{fontSize:".72rem",color:"var(--t2)",marginTop:2}}>#{o.id.toUpperCase()} · {o.createdAt}</div>
                  {o.address&&<div style={{fontSize:".72rem",color:"var(--t1)",marginTop:2}}>📍 {o.address}</div>}
                </div>
                <span className={`badge ${statusMap[o.status]?.[1]||"b-cy"}`}>{statusMap[o.status]?.[0]||o.status}</span>
              </div>
              {o.status!=="cancelled"&&(
                <div>
                  <div className="order-status-bar" style={{marginBottom:6}}>
                    {steps.map((s,i)=><div key={s} className={`os-step${stepIdx>=i?" done":""}`}/>)}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".62rem",color:"var(--t2)",marginBottom:10}}>
                    {["Pendiente","En proceso","Enviado","Entregado"].map((l,i)=>(
                      <span key={i} style={{color:stepIdx>=i?"var(--cy)":"var(--t2)"}}>{l}</span>
                    ))}
                  </div>
                </div>
              )}
              {o.items.map((it,i)=>(
                <div key={i} style={{fontSize:".82rem",color:"var(--t1)",padding:"3px 0",display:"flex",justifyContent:"space-between"}}>
                  <span>→ {it.name} × {it.qty} {it.size&&`(${it.size})`} {it.color&&`· ${it.color}`}</span>
                  <span style={{fontFamily:"var(--mono)",color:"var(--cy)"}}>{fmt(it.price*it.qty)}</span>
                </div>
              ))}
              <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:"1px solid var(--bd)"}}>
                <span style={{color:"var(--t2)",fontSize:".75rem"}}>{o.items.reduce((s,i)=>s+i.qty,0)} ítem(s)</span>
                <span style={{fontFamily:"var(--mono)",color:"var(--cy)",fontSize:"1rem",fontWeight:700}}>{fmt(o.total)}</span>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 11 — WISHLIST (NUEVA)
═══════════════════════════════════════════════════════════════ */
function Wishlist({ db, wishlist, setWishlist, goToCatalog }) {
  const toast = useToast();
  const wishedProds = db.products.filter(p=>wishlist.includes(p.id));
  const remove = id => { setWishlist(w=>w.filter(x=>x!==id)); toast("Quitado de Wishlist","info"); };
  const clear = () => { setWishlist([]); toast("Wishlist vaciada","info"); };

  return (
    <div>
      <div className="sec-hd">
        <div>
          <div className="sec-ttl">❤️ Mi Wishlist</div>
          <div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>{wishedProds.length} prendas guardadas</div>
        </div>
        {wishedProds.length>0&&<button className="btn btn-re btn-sm" onClick={clear}>🗑️ Limpiar todo</button>}
      </div>

      {wishedProds.length===0
        ? <div className="empty">
            <div className="empty-ico">❤️</div>
            <div className="empty-ttl">Tu wishlist está vacía</div>
            <div>Haz clic en el corazón 🤍 de cualquier prenda en el catálogo para guardarla aquí</div>
            <button className="btn btn-cy btn-sm" style={{marginTop:12}} onClick={goToCatalog}>👗 Ver Catálogo</button>
          </div>
        : <div className="wishlist-grid">
            {wishedProds.map(p=>{
              const store = db.stores.find(s=>s.id===p.storeId);
              const finalPrice = p.discount>0?p.price*(1-p.discount/100):p.price;
              return (
                <div key={p.id} className="wish-card">
                  <div style={{height:120,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"4rem",background:"linear-gradient(135deg,var(--bg3),var(--bg4))",position:"relative"}}>
                    {p.emoji}
                    {p.discount>0&&<span style={{position:"absolute",top:8,right:8}}><span className="badge" style={{background:"var(--re10)",color:"var(--re)",fontSize:".55rem"}}>-{p.discount}%</span></span>}
                  </div>
                  <div style={{padding:12}}>
                    <div style={{fontFamily:"var(--cond)",fontWeight:800,fontSize:".95rem",marginBottom:2}}>{p.name}</div>
                    <div style={{fontSize:".72rem",color:"var(--t2)",marginBottom:6}}>🏪 {store?.name}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontFamily:"var(--mono)",color:"var(--cy)",fontSize:".95rem"}}>{fmt(finalPrice)}</div>
                      <button className="btn btn-re btn-xs" onClick={()=>remove(p.id)}>❌</button>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}>
                      <Stars value={p.rating}/><span style={{fontSize:".65rem",color:"var(--t2)"}}>{p.rating}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 12 — MI PERFIL (NUEVA)
═══════════════════════════════════════════════════════════════ */
function Profile({ user, db, wishlist, onLogout }) {
  const myOrders = db.orders.filter(o=>o.userId===user.id);
  const totalSpent = myOrders.filter(o=>o.status==="delivered").reduce((s,o)=>s+o.total,0);
  const myRatings = db.ratings.filter(r=>r.userId===user.id);
  const toast = useToast();

  const copyEmail = () => { navigator.clipboard?.writeText(user.email); toast("Email copiado al portapapeles","info"); };

  return (
    <div>
      <div className="profile-hero">
        <div className="profile-av">{user.name.slice(0,2).toUpperCase()}</div>
        <div style={{flex:1}}>
          <div className="profile-name">{user.name}</div>
          <div className="profile-email" style={{cursor:"pointer"}} onClick={copyEmail}>{user.email} 📋</div>
          <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
            <span className="badge b-gr">👤 Cliente Activo</span>
            <span className="pill">Desde {user.createdAt}</span>
          </div>
        </div>
        <button className="btn btn-re btn-sm" onClick={onLogout}>↩ Cerrar sesión</button>
      </div>

      <div className="stats-grid">
        <div className="stat"><div className="stat-ico">📋</div><div className="stat-val text-cy">{myOrders.length}</div><div className="stat-lbl">Pedidos realizados</div><div className="stat-sub">{myOrders.filter(o=>o.status==="delivered").length} entregados</div></div>
        <div className="stat"><div className="stat-ico">💰</div><div className="stat-val text-gr">{fmtK(totalSpent)}</div><div className="stat-lbl">Total gastado</div><div className="stat-sub">En pedidos entregados</div></div>
        <div className="stat"><div className="stat-ico">❤️</div><div className="stat-val text-re">{wishlist.length}</div><div className="stat-lbl">En Wishlist</div><div className="stat-sub">Prendas guardadas</div></div>
        <div className="stat"><div className="stat-ico">⭐</div><div className="stat-val text-ye">{myRatings.length}</div><div className="stat-lbl">Calificaciones</div><div className="stat-sub">Reseñas escritas</div></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div className="card">
          <div style={{fontFamily:"var(--cond)",fontWeight:700,fontSize:".8rem",color:"var(--t2)",marginBottom:12}}>MIS PEDIDOS RECIENTES</div>
          {myOrders.length===0
            ? <div style={{color:"var(--t2)",fontSize:".85rem",textAlign:"center",padding:"20px 0"}}>Sin pedidos aún</div>
            : myOrders.slice(0,4).map(o=>(
              <div key={o.id} className="feed-item">
                <div className="feed-dot" style={{background:statusMap[o.status]?.[1]==="b-ok"?"var(--gr)":statusMap[o.status]?.[1]==="b-off"?"var(--re)":"var(--cy)"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:".82rem"}}>{o.storeName}</div>
                  <div style={{fontSize:".7rem",color:"var(--t2)"}}>{o.createdAt}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontFamily:"var(--mono)",color:"var(--cy)",fontSize:".78rem"}}>{fmt(o.total)}</span>
                  <span className={`badge ${statusMap[o.status]?.[1]}`} style={{fontSize:".55rem"}}>{statusMap[o.status]?.[0]}</span>
                </div>
              </div>
            ))
          }
        </div>

        <div className="card">
          <div style={{fontFamily:"var(--cond)",fontWeight:700,fontSize:".8rem",color:"var(--t2)",marginBottom:12}}>MIS CALIFICACIONES</div>
          {myRatings.length===0
            ? <div style={{color:"var(--t2)",fontSize:".85rem",textAlign:"center",padding:"20px 0"}}>Sin calificaciones aún</div>
            : myRatings.slice(0,4).map(r=>{
              const prod = db.products.find(p=>p.id===r.productId);
              return (
                <div key={r.id} style={{padding:"8px 0",borderBottom:"1px solid var(--bd)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:".82rem"}}>{prod?.emoji} {prod?.name}</div>
                    <Stars value={r.score}/>
                  </div>
                  {r.comment&&<div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>"{r.comment}"</div>}
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 13 — PANEL DE TIENDA (STORE ADMIN)
═══════════════════════════════════════════════════════════════ */
function StoreAdmin({ user, db, setDb }) {
  const toast = useToast();
  const store = db.stores.find(s=>s.id===user.storeId);
  const [tab,setTab] = useState("dashboard");
  const [showModal,setShowModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState({name:"",price:"",category:"",stock:"",minStock:"10",description:"",emoji:"👗",brand:"",colors:"",sizes:"",isNew:false,discount:0});
  const [hoursForm,setHoursForm] = useState(null);
  const [profileForm,setProfileForm] = useState(null);

  if(!store) return <div className="empty"><div className="empty-ico">❌</div><div className="empty-ttl">Tienda no encontrada</div><div>Contacta al administrador para que te asigne una tienda.</div></div>;

  const myProducts = db.products.filter(p=>p.storeId===store.id);
  const myOrders = db.orders.filter(o=>o.storeId===store.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const myRatings = db.ratings.filter(r=>myProducts.some(p=>p.id===r.productId));
  const lowStock = myProducts.filter(p=>p.stock<=(p.minStock||10)&&p.stock>0);
  const outOfStock = myProducts.filter(p=>p.stock===0);
  const revenue = myOrders.filter(o=>o.status==="delivered").reduce((s,o)=>s+o.total,0);
  const avgRating = myProducts.length?(myProducts.reduce((s,p)=>s+p.rating,0)/myProducts.length).toFixed(1):0;
  const isOpen = isStoreOpen(store);
  const catBreakdown = myProducts.reduce((acc,p)=>{acc[p.category]=(acc[p.category]||0)+p.sales;return acc;},{});
  const sortedCats = Object.entries(catBreakdown).sort((a,b)=>b[1]-a[1]);
  const maxCatSales = sortedCats[0]?.[1]||1;

  const openAdd = () => { setEditing(null); setForm({name:"",price:"",category:FASHION_CATS[0],stock:"",minStock:"10",description:"",emoji:"👗",brand:"",colors:"Negro,Blanco",sizes:"S,M,L,XL",isNew:true,discount:0}); setShowModal(true); };
  const openEdit = p => { setEditing(p); setForm({name:p.name,price:String(p.price),category:p.category,stock:String(p.stock),minStock:String(p.minStock||10),description:p.description,emoji:p.emoji,brand:p.brand||"",colors:(p.colors||[]).join(","),sizes:(p.sizes||[]).join(","),isNew:p.isNew||false,discount:p.discount||0}); setShowModal(true); };

  const save = () => {
    if(!form.name||!form.price) return toast("Nombre y precio son requeridos","err");
    const data = {...form,price:+form.price,stock:+form.stock,minStock:+form.minStock||10,colors:form.colors.split(",").map(c=>c.trim()).filter(Boolean),sizes:form.sizes.split(",").map(s=>s.trim()).filter(Boolean),discount:+form.discount||0,isNew:!!form.isNew};
    if(editing){
      setDb({...db,products:db.products.map(p=>p.id===editing.id?{...p,...data}:p)});
      toast("✅ Producto actualizado","ok");
    } else {
      const np = {id:genId(),storeId:store.id,...data,rating:0,sales:0};
      setDb({...db,products:[...db.products,np]});
      toast("✅ Producto creado y publicado","ok");
    }
    setShowModal(false);
  };

  const del = id => { if(!confirm("¿Eliminar este producto?")) return; setDb({...db,products:db.products.filter(p=>p.id!==id)}); toast("Producto eliminado","info"); };
  const stockChange = (id,val) => setDb({...db,products:db.products.map(p=>p.id===id?{...p,stock:Math.max(0,p.stock+val)}:p)});
  const updateOrderStatus = (oid,status) => { setDb({...db,orders:db.orders.map(o=>o.id===oid?{...o,status}:o)}); toast(`Estado actualizado: ${statusMap[status]?.[0]||status}`,"ok"); };
  const saveHours = () => { setDb({...db,stores:db.stores.map(s=>s.id===store.id?{...s,hours:hoursForm}:s)}); setHoursForm(null); toast("✅ Horarios guardados","ok"); };
  const saveProfile = () => { setDb({...db,stores:db.stores.map(s=>s.id===store.id?{...s,...profileForm,socialMedia:{instagram:profileForm.instagram,whatsapp:profileForm.whatsapp}}:s)}); setProfileForm(null); toast("✅ Perfil actualizado","ok"); };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:16,background:"var(--bg2)",borderRadius:"var(--rl)",border:"1px solid var(--bd)",flexWrap:"wrap"}}>
        <div style={{fontSize:"3rem",flexShrink:0}}>{store.emoji}</div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontFamily:"var(--cond)",fontSize:"1.5rem",fontWeight:900}}>{store.name}</div>
          <div style={{fontSize:".78rem",color:"var(--t2)",marginTop:2}}>{store.address} · {store.phone}</div>
          <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
            <span className={`badge ${store.active?"b-ok":"b-off"}`}>{store.active?"✓ ACTIVA":"✕ INACTIVA"}</span>
            <span className={`badge ${isOpen?"b-ok":"b-off"}`}>{isOpen?"🟢 ABIERTA":"🔴 CERRADA"}</span>
            <span className="subdomain-pill">🌐 {store.subdomain}.distrimed.co</span>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"var(--mono)",color:"var(--cy)",fontSize:"1.4rem",fontWeight:700}}>{fmtK(store.totalSales)}</div>
          <div style={{fontSize:".7rem",color:"var(--t2)"}}>Ventas totales</div>
        </div>
      </div>

      {(lowStock.length>0||outOfStock.length>0)&&(
        <div className="alert al-warn">⚠️ {outOfStock.length>0&&`${outOfStock.length} producto(s) agotado(s). `}{lowStock.length>0&&`Stock bajo: ${lowStock.map(p=>p.name).join(", ")}`}</div>
      )}

      <div className="tabs">
        {[["dashboard","📊 Dashboard"],["products","👗 Productos"],["orders","📋 Pedidos"],["analytics","📈 Analíticas"],["reviews","⭐ Reseñas"],["hours","🕐 Horarios"],["profile","🏪 Perfil"],["page","🌐 Mi Página"]].map(([k,l])=>(
          <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="dashboard" && (
        <div>
          <div className="stats-grid">
            <div className="stat"><div className="stat-ico">👗</div><div className="stat-val">{myProducts.length}</div><div className="stat-lbl">Productos</div><div className="stat-sub">{outOfStock.length} agotados · {lowStock.length} bajo stock</div></div>
            <div className="stat"><div className="stat-ico">📋</div><div className="stat-val">{myOrders.length}</div><div className="stat-lbl">Pedidos</div><div className="stat-sub">{myOrders.filter(o=>o.status==="pending").length} pendientes</div></div>
            <div className="stat"><div className="stat-ico">💰</div><div className="stat-val text-cy">{fmtK(revenue)}</div><div className="stat-lbl">Ingresos</div><div className="stat-sub">{myOrders.filter(o=>o.status==="delivered").length} entregados</div></div>
            <div className="stat"><div className="stat-ico">⭐</div><div className="stat-val text-ye">{avgRating}</div><div className="stat-lbl">Rating</div><div className="stat-sub">{myRatings.length} reseñas</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:10}}>VENTAS POR MES</div>
              <MiniChart data={db.salesByMonth} color={store.theme||"var(--cy)"}/>
            </div>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:10}}>TOP PRODUCTOS</div>
              {myProducts.sort((a,b)=>b.sales-a.sales).slice(0,5).map(p=>(
                <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--bd)",fontSize:".78rem"}}>
                  <span>{p.emoji} {p.name}</span>
                  <span style={{fontFamily:"var(--mono)",color:"var(--cy)"}}>{p.sales} uds</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:10}}>PEDIDOS RECIENTES</div>
            {myOrders.length===0?<div style={{color:"var(--t2)",fontSize:".85rem",textAlign:"center",padding:"16px 0"}}>Sin pedidos aún</div>:myOrders.slice(0,5).map(o=>(
              <div key={o.id} className="feed-item">
                <div className="feed-dot" style={{background:"var(--cy)"}}/>
                <div style={{flex:1}}>
                  <div>{o.items.map(i=>i.name).join(", ")}</div>
                  <div style={{color:"var(--t2)",fontSize:".72rem"}}>{o.createdAt}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontFamily:"var(--mono)",color:"var(--cy)",fontSize:".82rem"}}>{fmt(o.total)}</span>
                  <select value={o.status} onChange={e=>updateOrderStatus(o.id,e.target.value)} style={{padding:"3px 6px",fontSize:".7rem",width:"auto"}}>
                    {Object.keys(statusMap).map(k=><option key={k} value={k}>{statusMap[k][0]}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="products" && (
        <>
          <div className="sec-hd">
            <div className="sec-ttl">Mis Prendas ({myProducts.length})</div>
            <button className="btn btn-cy btn-sm" onClick={openAdd}>+ Nueva prenda</button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Prenda</th><th>Precio</th><th>Stock</th><th>Tallas</th><th>Ventas</th><th>Rating</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {myProducts.map(p=>(
                  <tr key={p.id}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:"1.4rem"}}>{p.emoji}</span>
                        <div>
                          <div style={{fontFamily:"var(--cond)",fontWeight:700}}>{p.name}</div>
                          <div style={{fontSize:".7rem",color:"var(--t2)"}}>{p.category} · {p.brand}</div>
                          {p.isNew&&<span className="badge b-cy" style={{fontSize:".55rem",marginTop:2}}>NUEVO</span>}
                        </div>
                      </div>
                    </td>
                    <td><span className="mono text-cy">{fmt(p.price)}</span>{p.discount>0&&<div style={{fontSize:".65rem",color:"var(--re)"}}>-{p.discount}%</div>}</td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                        <button className="btn btn-sec btn-xs" onClick={()=>stockChange(p.id,-10)}>-10</button>
                        <button className="btn btn-sec btn-xs" onClick={()=>stockChange(p.id,-1)}>-</button>
                        <span className={`fw8 ${p.stock===0?"text-re":p.stock<=(p.minStock||10)?"text-ye":"text-gr"}`} style={{minWidth:28,textAlign:"center"}}>{p.stock}</span>
                        <button className="btn btn-sec btn-xs" onClick={()=>stockChange(p.id,1)}>+</button>
                        <button className="btn btn-sec btn-xs" onClick={()=>stockChange(p.id,10)}>+10</button>
                      </div>
                    </td>
                    <td><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{(p.sizes||[]).slice(0,4).map(s=><span key={s} className="badge b-cy" style={{fontSize:".55rem"}}>{s}</span>)}</div></td>
                    <td><span style={{fontFamily:"var(--mono)"}}>{p.sales}</span></td>
                    <td><Stars value={p.rating}/></td>
                    <td><span className={`badge ${p.stock>0?"b-ok":"b-off"}`}>{p.stock>0?"DISPONIBLE":"AGOTADO"}</span></td>
                    <td>
                      <div style={{display:"flex",gap:4}}>
                        <button className="btn btn-sec btn-xs" onClick={()=>openEdit(p)}>✏️</button>
                        <button className="btn btn-re btn-xs" onClick={()=>del(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab==="orders" && (
        <>
          <div className="sec-hd">
            <div className="sec-ttl">Pedidos ({myOrders.length})</div>
            <span className="badge b-warn">{myOrders.filter(o=>o.status==="pending").length} pendientes</span>
          </div>
          {myOrders.length===0?<div className="empty"><div className="empty-ico">📋</div><div className="empty-ttl">Sin pedidos aún</div></div>:(
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th><th>Actualizar</th></tr></thead>
                <tbody>
                  {myOrders.map(o=>{
                    const client = db.users.find(u=>u.id===o.userId);
                    return (
                      <tr key={o.id}>
                        <td><div style={{fontFamily:"var(--mono)",fontSize:".75rem"}}>#{o.id.toUpperCase()}</div><div style={{fontSize:".68rem",color:"var(--t2)"}}>{o.createdAt}</div></td>
                        <td><div style={{fontFamily:"var(--cond)",fontWeight:600}}>{client?.name||"Cliente"}</div>{o.address&&<div style={{fontSize:".68rem",color:"var(--t2)"}}>📍 {o.address}</div>}</td>
                        <td style={{fontSize:".78rem",color:"var(--t1)"}}>{o.items.map(i=>`${i.emoji||""} ${i.name} ×${i.qty}`).join(", ")}</td>
                        <td><span style={{fontFamily:"var(--mono)",color:"var(--cy)"}}>{fmt(o.total)}</span></td>
                        <td><span className={`badge ${statusMap[o.status]?.[1]||"b-cy"}`}>{statusMap[o.status]?.[0]||o.status}</span></td>
                        <td>
                          <select value={o.status} onChange={e=>updateOrderStatus(o.id,e.target.value)} style={{padding:"4px 8px",fontSize:".75rem",width:"auto"}}>
                            {Object.keys(statusMap).map(k=><option key={k} value={k}>{statusMap[k][0]}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab==="analytics" && (
        <div>
          <div className="analytics-grid">
            <div className="analytics-card cy">
              <div className="analytics-val text-cy">{fmtK(revenue)}</div>
              <div className="analytics-lbl">Ingresos totales</div>
              <div className="analytics-sub">De {myOrders.filter(o=>o.status==="delivered").length} pedidos entregados</div>
            </div>
            <div className="analytics-card gr">
              <div className="analytics-val text-gr">{myProducts.reduce((s,p)=>s+p.sales,0)}</div>
              <div className="analytics-lbl">Unidades vendidas</div>
              <div className="analytics-sub">En todos los productos</div>
            </div>
            <div className="analytics-card or">
              <div className="analytics-val text-or">{myOrders.length>0?fmt(revenue/myOrders.filter(o=>o.status==="delivered").length||0):"$0"}</div>
              <div className="analytics-lbl">Ticket promedio</div>
              <div className="analytics-sub">Por pedido entregado</div>
            </div>
            <div className="analytics-card pu">
              <div className="analytics-val text-pu">{avgRating} ⭐</div>
              <div className="analytics-lbl">Rating promedio</div>
              <div className="analytics-sub">{myRatings.length} calificaciones recibidas</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:14}}>VENTAS MENSUALES</div>
              <MiniChart data={db.salesByMonth} color={store.theme||"var(--cy)"} height={100}/>
            </div>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:12}}>VENTAS POR CATEGORÍA</div>
              {sortedCats.slice(0,6).map(([cat,sales])=>(
                <div key={cat} className="report-row">
                  <div style={{fontSize:".78rem",minWidth:90,color:"var(--t1)"}}>{cat}</div>
                  <div className="report-bar"><div className="report-fill" style={{width:`${(sales/maxCatSales)*100}%`,background:store.theme||"var(--cy)"}}/></div>
                  <div className="report-val">{sales} uds</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{marginTop:14}}>
            <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:12}}>TOP 5 PRODUCTOS POR VENTAS</div>
            {myProducts.sort((a,b)=>b.sales-a.sales).slice(0,5).map((p,i)=>(
              <div key={p.id} className="report-row">
                <span style={{fontFamily:"var(--mono)",color:"var(--t2)",fontSize:".72rem",width:16}}>#{i+1}</span>
                <span style={{fontSize:"1.2rem"}}>{p.emoji}</span>
                <div style={{flex:1,fontSize:".82rem"}}>{p.name}</div>
                <Stars value={p.rating}/>
                <div className="report-val">{p.sales} uds</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="reviews" && (
        <div>
          <div className="sec-hd">
            <div>
              <div className="sec-ttl">Reseñas de tu Tienda</div>
              <div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>{myRatings.length} calificaciones · Rating promedio {avgRating}⭐</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:20}}>
            {[5,4,3,2,1].map(n=>{
              const count = myRatings.filter(r=>r.score===n).length;
              const pct = myRatings.length?Math.round(count/myRatings.length*100):0;
              return (
                <div key={n} style={{display:"flex",gap:8,alignItems:"center",background:"var(--bg3)",padding:"8px 12px",borderRadius:"var(--r)",border:"1px solid var(--bd)"}}>
                  <span style={{color:"var(--ye)",fontFamily:"var(--mono)",fontWeight:700}}>{n}★</span>
                  <div style={{flex:1,height:6,background:"var(--bg4)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"var(--ye)",borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:".72rem",color:"var(--t2)",minWidth:24}}>{count}</span>
                </div>
              );
            })}
          </div>
          {myRatings.length===0
            ? <div className="empty"><div className="empty-ico">⭐</div><div className="empty-ttl">Sin reseñas aún</div><div>Las calificaciones de tus productos aparecerán aquí</div></div>
            : myRatings.sort((a,b)=>b.score-a.score).map(r=>{
              const prod = db.products.find(p=>p.id===r.productId);
              const u = db.users.find(u=>u.id===r.userId);
              return (
                <div key={r.id} className="review-card">
                  <div className="review-card-hd">
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontSize:"1.2rem"}}>{prod?.emoji}</span>
                        <div><div className="review-user">{prod?.name}</div><div style={{fontSize:".7rem",color:"var(--t2)"}}>por {u?.name||"Cliente"}</div></div>
                      </div>
                    </div>
                    <Stars value={r.score}/>
                  </div>
                  {r.comment&&<div className="review-comment">"{r.comment}"</div>}
                </div>
              );
            })
          }
        </div>
      )}

      {tab==="hours" && (
        <div>
          <div className="sec-hd">
            <div className="sec-ttl">Horarios de Atención</div>
            <button className="btn btn-cy btn-sm" onClick={()=>setHoursForm({...store.hours})}>✏️ Editar horarios</button>
          </div>
          <div className="store-hours-grid">
            {DAYS.map((d,i)=>(
              <div key={d} className="hours-chip">
                <div className="hours-day">{DAYS_LABEL[i]}</div>
                {store.hours[d]==="Cerrado"?<div className="hours-closed">Cerrado</div>:<div className="hours-time">{store.hours[d]}</div>}
              </div>
            ))}
          </div>
          {hoursForm&&(
            <div className="overlay" onClick={e=>e.target===e.currentTarget&&setHoursForm(null)}>
              <div className="modal">
                <div className="modal-ttl">🕐 Editar Horarios</div>
                {DAYS.map((d,i)=>(
                  <div key={d} className="fg-row" style={{marginBottom:10,alignItems:"center"}}>
                    <label style={{marginBottom:0,display:"flex",alignItems:"center"}}>{DAYS_LABEL[i]}</label>
                    <input value={hoursForm[d]||"Cerrado"} onChange={e=>setHoursForm({...hoursForm,[d]:e.target.value})} placeholder="8:00–18:00 o Cerrado"/>
                  </div>
                ))}
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button className="btn btn-cy" onClick={saveHours}>💾 Guardar</button>
                  <button className="btn btn-sec" onClick={()=>setHoursForm(null)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="profile" && (
        <div>
          <div className="sec-hd">
            <div className="sec-ttl">Perfil de Tienda</div>
            <button className="btn btn-cy btn-sm" onClick={()=>setProfileForm({name:store.name,address:store.address,phone:store.phone,description:store.description,instagram:store.socialMedia?.instagram||"",whatsapp:store.socialMedia?.whatsapp||""})}>✏️ Editar</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[["🏪 Nombre",store.name],["📍 Dirección",store.address],["📞 Teléfono",store.phone],["🌐 Subdominio",`${store.subdomain}.distrimed.co`],["📸 Instagram",store.socialMedia?.instagram||"—"],["💬 WhatsApp",store.socialMedia?.whatsapp||"—"]].map(([k,v])=>(
              <div key={k} style={{background:"var(--bg3)",borderRadius:"var(--r)",padding:14,border:"1px solid var(--bd)"}}>
                <div style={{fontSize:".72rem",color:"var(--t2)",fontFamily:"var(--cond)",fontWeight:700,marginBottom:4}}>{k}</div>
                <div style={{fontSize:".9rem",color:"var(--t0)"}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bd)"}}>
            <div style={{fontSize:".72rem",color:"var(--t2)",fontFamily:"var(--cond)",fontWeight:700,marginBottom:6}}>📝 DESCRIPCIÓN</div>
            <div style={{fontSize:".9rem",color:"var(--t1)",lineHeight:1.6}}>{store.description}</div>
          </div>
          {profileForm&&(
            <div className="overlay" onClick={e=>e.target===e.currentTarget&&setProfileForm(null)}>
              <div className="modal">
                <div className="modal-ttl">✏️ Editar Perfil de Tienda</div>
                <div className="fg"><label>Nombre de la tienda</label><input value={profileForm.name} onChange={e=>setProfileForm({...profileForm,name:e.target.value})}/></div>
                <div className="fg"><label>Dirección</label><input value={profileForm.address} onChange={e=>setProfileForm({...profileForm,address:e.target.value})}/></div>
                <div className="fg"><label>Teléfono</label><input value={profileForm.phone} onChange={e=>setProfileForm({...profileForm,phone:e.target.value})}/></div>
                <div className="fg-row">
                  <div className="fg"><label>Instagram</label><input value={profileForm.instagram} onChange={e=>setProfileForm({...profileForm,instagram:e.target.value})} placeholder="@usuario"/></div>
                  <div className="fg"><label>WhatsApp</label><input value={profileForm.whatsapp} onChange={e=>setProfileForm({...profileForm,whatsapp:e.target.value})} placeholder="300xxxxxxx"/></div>
                </div>
                <div className="fg"><label>Descripción</label><textarea value={profileForm.description} onChange={e=>setProfileForm({...profileForm,description:e.target.value})} rows={3}/></div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-cy" onClick={saveProfile}>💾 Guardar</button>
                  <button className="btn btn-sec" onClick={()=>setProfileForm(null)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="page" && (
        <div>
          <div className="sec-hd"><div className="sec-ttl">🌐 Mi Página Web</div></div>
          <div style={{background:"linear-gradient(135deg,var(--bg2),var(--bg3))",border:`2px solid ${store.theme||"var(--cy)"}44`,borderRadius:"var(--rl)",padding:24,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <span style={{fontSize:"2.5rem"}}>{store.emoji}</span>
              <div>
                <div style={{fontFamily:"var(--cond)",fontSize:"1.4rem",fontWeight:900,color:store.theme||"var(--cy)"}}>{store.name}</div>
                <div className="subdomain-pill" style={{marginTop:4}}>🌐 {store.subdomain}.distrimed.co</div>
              </div>
            </div>
            <div style={{fontSize:".85rem",color:"var(--t1)",lineHeight:1.5}}>{store.description}</div>
            <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
              {store.tags?.map(t=><span key={t} className="pill">{t}</span>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["⭐","Rating promedio",`${avgRating}/5.0 · ${myRatings.length} reseñas`],["👗","Productos publicados",`${myProducts.filter(p=>p.stock>0).length} disponibles`],["📋","Pedidos totales",`${store.ordersCount} en toda la historia`],["💰","Ventas acumuladas",fmtK(store.totalSales)]].map(([ico,k,v])=>(
              <div key={k} style={{background:"var(--bg3)",borderRadius:"var(--r)",padding:14,border:"1px solid var(--bd)"}}>
                <div style={{fontSize:"1.4rem",marginBottom:6}}>{ico}</div>
                <div style={{fontSize:".7rem",color:"var(--t2)",fontFamily:"var(--cond)",fontWeight:700,marginBottom:2}}>{k}</div>
                <div style={{fontFamily:"var(--cond)",fontWeight:800,fontSize:".95rem"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-ttl">{editing?"✏️ Editar Prenda":"👗 Nueva Prenda"}</div>
            <div className="fg-row">
              <div className="fg"><label>Nombre *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
              <div className="fg"><label>Precio COP *</label><input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Categoría</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {FASHION_CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg"><label>Stock disponible</label><input type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></div>
            </div>
            <div className="fg-row-3">
              <div className="fg"><label>Emoji / Ícono</label><input value={form.emoji} onChange={e=>setForm({...form,emoji:e.target.value})} style={{fontSize:"1.3rem",textAlign:"center"}}/></div>
              <div className="fg"><label>Marca</label><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></div>
              <div className="fg"><label>Stock mínimo (alerta)</label><input type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})}/></div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Colores (separados por coma)</label><input value={form.colors} onChange={e=>setForm({...form,colors:e.target.value})} placeholder="Negro,Blanco,Azul"/></div>
              <div className="fg"><label>Tallas (separadas por coma)</label><input value={form.sizes} onChange={e=>setForm({...form,sizes:e.target.value})} placeholder="XS,S,M,L,XL"/></div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Descuento (%)</label><input type="number" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} min="0" max="90"/></div>
              <div className="fg" style={{justifyContent:"flex-end",paddingBottom:4}}>
                <label>¿Producto nuevo?</label>
                <label className="toggle-wrap" style={{cursor:"pointer",marginTop:8}}>
                  <span className="toggle"><input type="checkbox" checked={!!form.isNew} onChange={e=>setForm({...form,isNew:e.target.checked})}/><span className="toggle-slider"/></span>
                  <span style={{fontSize:".85rem"}}>{form.isNew?"✓ Sí, marcar NUEVO":"No es nuevo"}</span>
                </label>
              </div>
            </div>
            <div className="fg"><label>Descripción</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} placeholder="Descripción atractiva de la prenda..."/></div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn btn-cy" onClick={save}>💾 Guardar</button>
              <button className="btn btn-sec" onClick={()=>setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 14 — SUPERADMIN
═══════════════════════════════════════════════════════════════ */
function SuperAdmin({ db, setDb }) {
  const toast = useToast();
  const [tab,setTab] = useState("dashboard");
  const [showStoreModal,setShowStoreModal] = useState(false);
  const [editingStore,setEditingStore] = useState(null);
  const [storeForm,setStoreForm] = useState({name:"",address:"",phone:"",lat:"6.2442",lng:"-75.5812",category:"Ropa Mujer",emoji:"🏪",description:"",subdomain:"",theme:"#00e5ff",templateId:""});
  const [search,setSearch] = useState("");
  const [showTemplates,setShowTemplates] = useState(false);

  const totalRev = db.orders.filter(o=>o.status==="delivered").reduce((s,o)=>s+o.total,0);
  const totalProds = db.products.length;
  const activeStores = db.stores.filter(s=>s.active).length;
  const clients = db.users.filter(u=>u.role==="client").length;
  const totalSales = db.stores.reduce((s,st)=>s+st.totalSales,0);
  const catSales = Object.entries(db.salesByCat||{}).sort((a,b)=>b[1]-a[1]);
  const maxCatSale = catSales[0]?.[1]||1;

  const toggleStore = id => { setDb({...db,stores:db.stores.map(s=>s.id===id?{...s,active:!s.active}:s)}); toast("Estado de tienda actualizado","ok"); };
  const toggleUser = id => { setDb({...db,users:db.users.map(u=>u.id===id?{...u,active:!u.active}:u)}); toast("Estado de usuario actualizado","ok"); };

  const openNewStore = () => { setEditingStore(null); setStoreForm({name:"",address:"",phone:"",lat:"6.2442",lng:"-75.5812",category:"Ropa Mujer",emoji:"🏪",description:"",subdomain:"",theme:"#00e5ff",templateId:""}); setShowStoreModal(true); };
  const openEditStore = s => { setEditingStore(s); setStoreForm({name:s.name,address:s.address,phone:s.phone,lat:String(s.lat),lng:String(s.lng),category:s.category,emoji:s.emoji,description:s.description,subdomain:s.subdomain||"",theme:s.theme||"#00e5ff",templateId:""}); setShowStoreModal(true); };
  const applyTemplate = t => { setStoreForm(f=>({...f,emoji:t.emoji,theme:t.primaryColor,templateId:t.id})); setShowTemplates(false); };

  const saveStore = () => {
    if(!storeForm.name||!storeForm.address) return toast("Nombre y dirección requeridos","err");
    if(editingStore){
      setDb({...db,stores:db.stores.map(s=>s.id===editingStore.id?{...s,...storeForm,lat:+storeForm.lat,lng:+storeForm.lng}:s)});
      toast("✅ Tienda actualizada","ok");
    } else {
      const ns = {id:genId(),...storeForm,lat:+storeForm.lat,lng:+storeForm.lng,active:true,rating:0,totalSales:0,ordersCount:0,ownerId:null,hours:{lun:"9:00–18:00",mar:"9:00–18:00",mie:"9:00–18:00",jue:"9:00–18:00",vie:"9:00–18:00",sab:"9:00–16:00",dom:"Cerrado"},tags:[storeForm.category],socialMedia:{instagram:"",whatsapp:""},website:`${storeForm.subdomain||"nueva"}.distrimed.co`,createdAt:new Date().toISOString().slice(0,10)};
      setDb({...db,stores:[...db.stores,ns]});
      toast("✅ Tienda creada y activa","ok");
    }
    setShowStoreModal(false);
  };

  const deleteStore = id => { if(!confirm("¿Eliminar esta tienda permanentemente?")) return; setDb({...db,stores:db.stores.filter(s=>s.id!==id),products:db.products.filter(p=>p.storeId!==id)}); toast("Tienda eliminada","info"); };
  const filteredStores = db.stores.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.address.toLowerCase().includes(search.toLowerCase())||s.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="tabs">
        {[["dashboard","⚡ Dashboard"],["stores","🏪 Tiendas"],["products","👗 Catálogo"],["users","👥 Usuarios"],["templates","🎨 Templates"],["reports","📊 Reportes"],["settings","⚙️ Configuración"]].map(([k,l])=>(
          <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="dashboard" && (
        <div>
          <div className="stats-grid">
            <div className="stat"><div className="stat-ico">🏪</div><div className="stat-val text-cy">{db.stores.length}</div><div className="stat-lbl">Tiendas totales</div><div className="stat-sub">{activeStores} activas · {db.stores.length-activeStores} inactivas</div></div>
            <div className="stat"><div className="stat-ico">👗</div><div className="stat-val text-pu">{totalProds}</div><div className="stat-lbl">Productos</div><div className="stat-sub">{db.products.filter(p=>p.stock===0).length} agotados</div></div>
            <div className="stat"><div className="stat-ico">💰</div><div className="stat-val text-gr">{fmtK(totalSales)}</div><div className="stat-lbl">Ventas acumuladas</div><div className="stat-sub">{fmtK(totalRev)} en pedidos</div></div>
            <div className="stat"><div className="stat-ico">📋</div><div className="stat-val text-ye">{db.orders.length}</div><div className="stat-lbl">Pedidos totales</div><div className="stat-sub">{db.orders.filter(o=>o.status==="pending").length} pendientes</div></div>
            <div className="stat"><div className="stat-ico">👥</div><div className="stat-val">{db.users.length}</div><div className="stat-lbl">Usuarios</div><div className="stat-sub">{clients} clientes · {db.users.filter(u=>u.role==="store").length} tiendas</div></div>
            <div className="stat"><div className="stat-ico">📊</div><div className="stat-val text-or">{db.orders.filter(o=>o.status==="delivered").length>0?fmtK(totalRev/db.orders.filter(o=>o.status==="delivered").length):"$0"}</div><div className="stat-lbl">Ticket promedio</div><div className="stat-sub">por pedido entregado</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:10}}>VENTAS 12 MESES</div>
              <MiniChart data={db.salesByMonth} color="var(--cy)" height={90}/>
            </div>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:10}}>TOP TIENDAS POR VENTAS</div>
              {[...db.stores].sort((a,b)=>b.totalSales-a.totalSales).slice(0,5).map((s,i)=>(
                <div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--bd)",fontSize:".78rem"}}>
                  <span style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"var(--mono)",color:"var(--t2)",width:16}}>#{i+1}</span>{s.emoji} {s.name}</span>
                  <span style={{fontFamily:"var(--mono)",color:"var(--cy)"}}>{fmtK(s.totalSales)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:10}}>ACTIVIDAD RECIENTE</div>
            {db.activity.map((a,i)=>(
              <div key={i} className="feed-item">
                <div className="feed-dot" style={{background:a.color}}/>
                <div style={{flex:1}}><div>{a.msg}</div></div>
                <span style={{color:"var(--t2)",fontSize:".72rem",whiteSpace:"nowrap"}}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="stores" && (
        <div>
          <div className="sec-hd">
            <div><div className="sec-ttl">🏪 Gestión de Tiendas ({db.stores.length})</div><div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>{activeStores} activas · {db.stores.length-activeStores} inactivas</div></div>
            <button className="btn btn-cy" onClick={openNewStore}>+ Nueva tienda</button>
          </div>
          <input placeholder="🔍 Buscar tienda por nombre, dirección, categoría..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:14}}/>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Tienda</th><th>Categoría</th><th>Subdominio</th><th>Productos</th><th>Ventas</th><th>Rating</th><th>Horario</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filteredStores.map(s=>{
                  const prods=db.products.filter(p=>p.storeId===s.id);
                  const open=isStoreOpen(s);
                  return (
                    <tr key={s.id}>
                      <td><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:"1.4rem"}}>{s.emoji}</span><div><div style={{fontFamily:"var(--cond)",fontWeight:700}}>{s.name}</div><div style={{fontSize:".7rem",color:"var(--t2)"}}>{s.address}</div></div></div></td>
                      <td><span className="pill">{s.category}</span></td>
                      <td><span className="subdomain-pill" style={{fontSize:".62rem"}}>🌐 {s.subdomain}.distrimed.co</span></td>
                      <td><span style={{fontFamily:"var(--mono)"}}>{prods.length}</span></td>
                      <td><span style={{fontFamily:"var(--mono)",color:"var(--cy)"}}>{fmtK(s.totalSales)}</span></td>
                      <td><span style={{color:"var(--ye)"}}>⭐ {s.rating}</span></td>
                      <td><span className={`badge ${open?"b-ok":"b-off"}`} style={{fontSize:".6rem"}}>{open?"ABIERTA":"CERRADA"}</span></td>
                      <td>
                        <label className="toggle-wrap" style={{cursor:"pointer",gap:6}}>
                          <span className="toggle"><input type="checkbox" checked={s.active} onChange={()=>toggleStore(s.id)}/><span className="toggle-slider"/></span>
                          <span className={`badge ${s.active?"b-ok":"b-off"}`}>{s.active?"ON":"OFF"}</span>
                        </label>
                      </td>
                      <td><div style={{display:"flex",gap:4}}><button className="btn btn-sec btn-xs" onClick={()=>openEditStore(s)}>✏️</button><button className="btn btn-re btn-xs" onClick={()=>deleteStore(s.id)}>🗑️</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="products" && (
        <div>
          <div className="sec-hd"><div className="sec-ttl">👗 Catálogo Global ({db.products.length} prendas)</div></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Prenda</th><th>Tienda</th><th>Precio</th><th>Stock</th><th>Ventas</th><th>Rating</th><th>Estado</th></tr></thead>
              <tbody>
                {db.products.map(p=>{
                  const store=db.stores.find(s=>s.id===p.storeId);
                  return (
                    <tr key={p.id}>
                      <td><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:"1.3rem"}}>{p.emoji}</span><div><div style={{fontFamily:"var(--cond)",fontWeight:700}}>{p.name}</div><div style={{fontSize:".68rem",color:"var(--t2)"}}>{p.category}</div></div></div></td>
                      <td><span style={{display:"flex",alignItems:"center",gap:4,fontSize:".78rem"}}>{store?.emoji} {store?.name}</span></td>
                      <td><span style={{fontFamily:"var(--mono)",color:"var(--cy)"}}>{fmt(p.price)}</span>{p.discount>0&&<span className="badge" style={{fontSize:".55rem",marginLeft:4,background:"var(--re10)",color:"var(--re)"}}>-{p.discount}%</span>}</td>
                      <td><span className={p.stock===0?"text-re":p.stock<=10?"text-ye":"text-gr"} style={{fontFamily:"var(--mono)",fontWeight:700}}>{p.stock}</span></td>
                      <td><span style={{fontFamily:"var(--mono)"}}>{p.sales}</span></td>
                      <td><Stars value={p.rating}/></td>
                      <td><span className={`badge ${p.stock>0?"b-ok":"b-off"}`} style={{fontSize:".6rem"}}>{p.stock>0?"DISPONIBLE":"AGOTADO"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="users" && (
        <div>
          <div className="sec-hd"><div className="sec-ttl">👥 Gestión de Usuarios ({db.users.length})</div></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Tienda</th><th>Registrado</th><th>Estado</th></tr></thead>
              <tbody>
                {db.users.map(u=>{
                  const store=u.storeId?db.stores.find(s=>s.id===u.storeId):null;
                  return (
                    <tr key={u.id}>
                      <td><div style={{display:"flex",alignItems:"center",gap:8}}><div className={`av ${u.role==="superadmin"?"av-cy":u.role==="store"?"av-or":"av-gr"}`}>{u.name.slice(0,2).toUpperCase()}</div><span style={{fontFamily:"var(--cond)",fontWeight:600}}>{u.name}</span></div></td>
                      <td style={{fontFamily:"var(--mono)",fontSize:".78rem",color:"var(--t1)"}}>{u.email}</td>
                      <td><span className={`badge ${u.role==="superadmin"?"b-cy":u.role==="store"?"b-or":"b-ok"}`}>{u.role==="superadmin"?"👑 Admin":u.role==="store"?"🏪 Tienda":"👤 Cliente"}</span></td>
                      <td style={{fontSize:".78rem"}}>{store?`${store.emoji} ${store.name}`:"—"}</td>
                      <td style={{fontSize:".75rem",color:"var(--t2)"}}>{u.createdAt||"—"}</td>
                      <td>
                        {u.role!=="superadmin"?(
                          <label className="toggle-wrap" style={{cursor:"pointer",gap:6}}>
                            <span className="toggle"><input type="checkbox" checked={u.active} onChange={()=>toggleUser(u.id)}/><span className="toggle-slider"/></span>
                            <span className={`badge ${u.active?"b-ok":"b-off"}`}>{u.active?"ON":"OFF"}</span>
                          </label>
                        ):<span className="badge b-cy">🔒 PROTEGIDO</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="templates" && (
        <div>
          <div className="sec-hd"><div><div className="sec-ttl">🎨 Templates de Tiendas</div><div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>Plantillas predefinidas para nuevas tiendas</div></div></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
            {db.templates.map(t=>(
              <div key={t.id} className="card" style={{borderColor:t.primaryColor+"44",cursor:"pointer"}} onClick={()=>{applyTemplate(t);setTab("stores");openNewStore()}}>
                <div style={{fontSize:"2.5rem",marginBottom:10}}>{t.emoji}</div>
                <div style={{fontFamily:"var(--cond)",fontSize:"1.1rem",fontWeight:800,marginBottom:4,color:t.primaryColor}}>{t.name}</div>
                <div style={{fontSize:".8rem",color:"var(--t2)",marginBottom:12}}>{t.description}</div>
                <div style={{width:"100%",height:4,borderRadius:2,background:t.primaryColor,opacity:.7}}/>
                <div style={{marginTop:12}}><button className="btn btn-sec btn-sm w-full" onClick={e=>{e.stopPropagation();applyTemplate(t);setTab("stores");openNewStore()}}>✓ Usar template</button></div>
              </div>
            ))}
          </div>
          <div className="section-divider"><span>Configuración global</span></div>
          <div className="card" style={{maxWidth:480}}>
            <div style={{fontFamily:"var(--cond)",fontWeight:800,marginBottom:12}}>⚙️ Red DistriMed</div>
            <div className="fg"><label>Dominio base</label><input defaultValue="distrimed.co" readOnly style={{opacity:.6}}/></div>
            <div className="fg"><label>Subdominios activos</label><input value={db.stores.filter(s=>s.active&&s.subdomain).length} readOnly style={{opacity:.6}}/></div>
            <div style={{marginTop:8,padding:10,background:"var(--bg3)",borderRadius:"var(--r)",fontSize:".78rem",color:"var(--t2)"}}>ℹ️ Cada tienda activa tiene su subdominio en <span style={{color:"var(--pu)"}}>[subdomain].distrimed.co</span></div>
          </div>
        </div>
      )}

      {tab==="reports" && (
        <div>
          <div className="sec-hd"><div><div className="sec-ttl">📊 Reportes de Plataforma</div><div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>Análisis completo de la red DistriMed</div></div></div>
          <div className="analytics-grid">
            <div className="analytics-card cy"><div className="analytics-val text-cy">{fmtK(totalSales)}</div><div className="analytics-lbl">Ventas acumuladas</div><div className="analytics-sub">Toda la red DistriMed</div></div>
            <div className="analytics-card gr"><div className="analytics-val text-gr">{db.orders.filter(o=>o.status==="delivered").length}</div><div className="analytics-lbl">Pedidos entregados</div><div className="analytics-sub">De {db.orders.length} totales</div></div>
            <div className="analytics-card or"><div className="analytics-val text-or">{activeStores}</div><div className="analytics-lbl">Tiendas activas</div><div className="analytics-sub">De {db.stores.length} en la red</div></div>
            <div className="analytics-card pu"><div className="analytics-val text-pu">{db.products.reduce((s,p)=>s+p.sales,0)}</div><div className="analytics-lbl">Unidades vendidas</div><div className="analytics-sub">En todo el catálogo</div></div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:12}}>VENTAS MENSUALES</div>
              <MiniChart data={db.salesByMonth} color="var(--cy)" height={100}/>
            </div>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:12}}>TOP 5 TIENDAS</div>
              {[...db.stores].sort((a,b)=>b.totalSales-a.totalSales).slice(0,5).map((s,i)=>(
                <div key={s.id} className="report-row">
                  <span style={{fontFamily:"var(--mono)",color:"var(--t2)",fontSize:".72rem",width:16}}>#{i+1}</span>
                  <span style={{fontSize:"1.1rem"}}>{s.emoji}</span>
                  <div style={{flex:1,fontSize:".78rem"}}>{s.name}</div>
                  <div className="report-val">{fmtK(s.totalSales)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{marginBottom:14}}>
            <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:12}}>VENTAS POR CATEGORÍA</div>
            {catSales.map(([cat,sales])=>(
              <div key={cat} className="report-row">
                <div style={{fontSize:".78rem",minWidth:110,color:"var(--t1)"}}>{cat}</div>
                <div className="report-bar"><div className="report-fill" style={{width:`${(sales/maxCatSale)*100}%`,background:"var(--cy)"}}/></div>
                <div className="report-val">{sales} uds</div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:12}}>DISTRIBUCIÓN DE USUARIOS</div>
              {[["👑 Superadmin",db.users.filter(u=>u.role==="superadmin").length,"var(--cy)"],["🏪 Propietarios",db.users.filter(u=>u.role==="store").length,"var(--or)"],["👤 Clientes",db.users.filter(u=>u.role==="client").length,"var(--gr)"]].map(([label,count,color])=>(
                <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--bd)"}}>
                  <span style={{fontSize:".85rem"}}>{label}</span>
                  <span style={{fontFamily:"var(--mono)",color,fontWeight:700}}>{count}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontSize:".8rem",fontWeight:700,color:"var(--t2)",marginBottom:12}}>MÉTRICAS CLAVE</div>
              {[["Conversión de pedidos",`${Math.round(db.orders.filter(o=>o.status==="delivered").length/db.orders.length*100)||0}%`,"var(--gr)"],["Productos agotados",`${db.products.filter(p=>p.stock===0).length} / ${db.products.length}`,"var(--re)"],["Tiendas con dueño",`${db.stores.filter(s=>s.ownerId).length} / ${db.stores.length}`,"var(--cy)"],["Reseñas totales",`${db.ratings.length}`,"var(--ye)"]].map(([label,val,color])=>(
                <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--bd)"}}>
                  <span style={{fontSize:".82rem",color:"var(--t1)"}}>{label}</span>
                  <span style={{fontFamily:"var(--mono)",color,fontWeight:700}}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="settings" && (
        <div>
          <div className="sec-hd"><div><div className="sec-ttl">⚙️ Configuración del Sistema</div><div style={{fontSize:".75rem",color:"var(--t2)",marginTop:2}}>Ajustes globales de la red DistriMed</div></div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontWeight:800,marginBottom:14}}>🌐 Dominio y Red</div>
              <div className="fg"><label>Dominio base</label><input defaultValue="distrimed.co" readOnly style={{opacity:.6}}/></div>
              <div className="fg"><label>Nombre de la plataforma</label><input defaultValue="DistriMed" readOnly style={{opacity:.6}}/></div>
              <div className="fg"><label>Versión</label><input defaultValue="v2.0 — Reforma Marzo 2026" readOnly style={{opacity:.6}}/></div>
              <div className="fg"><label>Subdominios activos</label><input value={db.stores.filter(s=>s.active&&s.subdomain).length} readOnly style={{opacity:.6}}/></div>
            </div>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontWeight:800,marginBottom:14}}>🔔 Notificaciones</div>
              {[["Alertas de stock bajo","Notifica cuando stock llega al mínimo",true],["Nuevos pedidos","Notificación en tiempo real",true],["Nuevos usuarios","Cuando se registra un cliente",true],["Reportes semanales","Resumen automático cada lunes",false]].map(([t,d,on])=>(
                <div key={t} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--bd)"}}>
                  <div><div style={{fontSize:".85rem",fontWeight:600}}>{t}</div><div style={{fontSize:".72rem",color:"var(--t2)"}}>{d}</div></div>
                  <label className="toggle-wrap">
                    <span className="toggle"><input type="checkbox" defaultChecked={on}/><span className="toggle-slider"/></span>
                  </label>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontWeight:800,marginBottom:14}}>🔒 Seguridad</div>
              {[["Autenticación","Bcrypt + JWT","var(--gr)"],["Cifrado","HTTPS · TLS 1.3","var(--gr)"],["Base de datos","PostgreSQL · Neon","var(--cy)"],["Entorno","Producción · Replit","var(--pu)"]].map(([k,v,c])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--bd)"}}>
                  <span style={{fontSize:".82rem",color:"var(--t1)"}}>{k}</span>
                  <span style={{fontSize:".82rem",color:c,fontFamily:"var(--mono)"}}>{v}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{fontFamily:"var(--cond)",fontWeight:800,marginBottom:14}}>📱 PWA</div>
              {[["Service Worker","Activo · Cache estratégico","var(--gr)"],["Manifest","distrimed.co · v2.0","var(--cy)"],["Instalable","iOS · Android · Desktop","var(--gr)"],["Offline","Modo básico disponible","var(--ye)"]].map(([k,v,c])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--bd)"}}>
                  <span style={{fontSize:".82rem",color:"var(--t1)"}}>{k}</span>
                  <span style={{fontSize:".82rem",color:c,fontFamily:"var(--mono)"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showStoreModal&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowStoreModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-ttl">{editingStore?"✏️ Editar Tienda":"🏪 Nueva Tienda"}</div>
            <div style={{marginBottom:12,display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn btn-pu btn-sm" onClick={()=>setShowTemplates(!showTemplates)}>🎨 Aplicar template</button>
              {storeForm.templateId&&<span className="badge b-pu">Template aplicado ✓</span>}
            </div>
            {showTemplates&&(
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14,padding:12,background:"var(--bg3)",borderRadius:"var(--r)"}}>
                {db.templates.map(t=><button key={t.id} className="btn btn-sec btn-xs" onClick={()=>applyTemplate(t)}>{t.emoji} {t.name}</button>)}
              </div>
            )}
            <div className="fg"><label>Nombre de la tienda *</label><input value={storeForm.name} onChange={e=>setStoreForm({...storeForm,name:e.target.value})}/></div>
            <div className="fg-row">
              <div className="fg"><label>Dirección *</label><input value={storeForm.address} onChange={e=>setStoreForm({...storeForm,address:e.target.value})}/></div>
              <div className="fg"><label>Teléfono</label><input value={storeForm.phone} onChange={e=>setStoreForm({...storeForm,phone:e.target.value})}/></div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Categoría</label>
                <select value={storeForm.category} onChange={e=>setStoreForm({...storeForm,category:e.target.value})}>
                  {["Ropa Mujer","Ropa Hombre","Ropa Niños","Streetwear","Ropa Premium","Jeans & Denim","Accesorios","Calzado","Deportivo","Vintage","Lencería"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg"><label>Subdominio</label>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <input value={storeForm.subdomain} onChange={e=>setStoreForm({...storeForm,subdomain:e.target.value.toLowerCase().replace(/[^a-z0-9]/g,"")})} placeholder="mitienda"/>
                  <span style={{color:"var(--pu)",fontFamily:"var(--mono)",fontSize:".78rem",whiteSpace:"nowrap"}}>.distrimed.co</span>
                </div>
              </div>
            </div>
            <div className="fg-row-3">
              <div className="fg"><label>Emoji / Ícono</label><input value={storeForm.emoji} onChange={e=>setStoreForm({...storeForm,emoji:e.target.value})} style={{fontSize:"1.3rem",textAlign:"center"}}/></div>
              <div className="fg"><label>Color de marca</label><input type="color" value={storeForm.theme} onChange={e=>setStoreForm({...storeForm,theme:e.target.value})} style={{height:42,padding:4,cursor:"pointer"}}/></div>
              <div className="fg"><label>Vista previa</label><div style={{height:42,display:"flex",alignItems:"center",gap:6,padding:"0 10px",background:`${storeForm.theme}22`,border:`1px solid ${storeForm.theme}66`,borderRadius:"var(--r)"}}><span style={{fontSize:"1.2rem"}}>{storeForm.emoji||"🏪"}</span><span style={{fontFamily:"var(--cond)",fontWeight:700,color:storeForm.theme}}>{storeForm.name||"Mi Tienda"}</span></div></div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Latitud</label><input value={storeForm.lat} onChange={e=>setStoreForm({...storeForm,lat:e.target.value})}/></div>
              <div className="fg"><label>Longitud</label><input value={storeForm.lng} onChange={e=>setStoreForm({...storeForm,lng:e.target.value})}/></div>
            </div>
            <div className="fg"><label>Descripción</label><textarea value={storeForm.description} onChange={e=>setStoreForm({...storeForm,description:e.target.value})} rows={2}/></div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn btn-cy" onClick={saveStore}>💾 {editingStore?"Guardar cambios":"Crear tienda"}</button>
              <button className="btn btn-sec" onClick={()=>setShowStoreModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECCIÓN 15 — MAIN APP (SHELL + ROUTER)
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [db,setDb] = useState(()=>JSON.parse(JSON.stringify(DB)));
  const [user,setUser] = useState(null);
  const [page,setPage] = useState("catalog");
  const [sideOpen,setSideOpen] = useState(false);
  const [userLoc,setUserLoc] = useState(null);
  const [locLoading,setLocLoading] = useState(false);
  const [wishlist,setWishlist] = useState([]);
  const [dark,setDark] = useState(()=>localStorage.getItem("distrimed-theme")==="dark");

  useEffect(()=>{
    if(dark){ document.body.classList.add("dark"); localStorage.setItem("distrimed-theme","dark"); }
    else { document.body.classList.remove("dark"); localStorage.setItem("distrimed-theme","light"); }
  },[dark]);

  useEffect(()=>{
    if(user){
      if(user.role==="superadmin") setPage("admin");
      else if(user.role==="store") setPage("store");
      else setPage("catalog");
    }
  },[user]);

  const detectLoc = useCallback(()=>{
    setLocLoading(true);
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos=>{ setUserLoc({lat:pos.coords.latitude,lng:pos.coords.longitude}); setLocLoading(false); setPage("map"); },
        ()=>{ setUserLoc({lat:6.2442,lng:-75.5812}); setLocLoading(false); setPage("map"); },
        {timeout:8000}
      );
    } else { setUserLoc({lat:6.2442,lng:-75.5812}); setLocLoading(false); setPage("map"); }
  },[]);

  if(!user) return <ToastProvider><style>{CSS}</style><LoginPage onLogin={u=>setUser(u)} dark={dark} setDark={setDark}/></ToastProvider>;

  const navAdmin = [
    {sec:"Principal"},
    {id:"admin",icon:"⚡",label:"Dashboard"},
    {id:"map",icon:"🗺️",label:"Mapa Global"},
    {sec:"Gestión"},
    {id:"admin-stores",icon:"🏪",label:"Tiendas",sub:"stores"},
    {id:"admin-products",icon:"👗",label:"Catálogo",sub:"products"},
    {id:"admin-users",icon:"👥",label:"Usuarios",sub:"users"},
    {id:"admin-templates",icon:"🎨",label:"Templates",sub:"templates"},
    {sec:"Análisis"},
    {id:"admin-reports",icon:"📊",label:"Reportes",sub:"reports"},
    {id:"admin-settings",icon:"⚙️",label:"Configuración",sub:"settings"},
    {sec:"Ayuda"},
    {id:"docs",icon:"📖",label:"Documentación"},
  ];
  const navStore = [
    {sec:"Mi Tienda"},
    {id:"store",icon:"📊",label:"Dashboard"},
    {id:"store-products",icon:"👗",label:"Productos",sub:"products"},
    {id:"store-orders",icon:"📋",label:"Pedidos",sub:"orders",badge:db.orders.filter(o=>o.storeId===user.storeId&&o.status==="pending").length},
    {sec:"Análisis"},
    {id:"store-analytics",icon:"📈",label:"Analíticas",sub:"analytics"},
    {id:"store-reviews",icon:"⭐",label:"Reseñas",sub:"reviews"},
    {sec:"Configurar"},
    {id:"store-hours",icon:"🕐",label:"Horarios",sub:"hours"},
    {id:"store-profile",icon:"🏪",label:"Perfil",sub:"profile"},
    {id:"store-page",icon:"🌐",label:"Mi Página",sub:"page"},
    {sec:"Ayuda"},
    {id:"docs",icon:"📖",label:"Documentación"},
  ];
  const navClient = [
    {sec:"Explorar"},
    {id:"catalog",icon:"👗",label:"Catálogo"},
    {id:"map",icon:"🗺️",label:"Tiendas / Mapa"},
    {sec:"Mis Compras"},
    {id:"orders",icon:"📋",label:"Mis Pedidos",badge:db.orders.filter(o=>o.userId===user.id&&(o.status==="processing"||o.status==="shipped")).length},
    {id:"wishlist",icon:"❤️",label:"Wishlist",badge:wishlist.length||0},
    {sec:"Cuenta"},
    {id:"profile",icon:"👤",label:"Mi Perfil"},
    {sec:"Ayuda"},
    {id:"docs",icon:"📖",label:"Documentación"},
  ];

  const allNav = user.role==="superadmin"?navAdmin:user.role==="store"?navStore:navClient;
  const navItems = allNav.filter(n=>!n.sec);

  const handleNav = (item) => {
    if(item.sub){
      if(user.role==="superadmin") setPage("admin");
      else setPage("store");
      setTimeout(()=>{
        const event = new CustomEvent("setTab",{detail:item.sub});
        window.dispatchEvent(event);
      },50);
    } else {
      setPage(item.id);
    }
    setSideOpen(false);
  };

  const pageTitles = {catalog:"Catálogo",map:"Mapa de Tiendas",orders:"Mis Pedidos",wishlist:"Mi Wishlist",profile:"Mi Perfil",store:"Panel de Tienda",admin:"Superadmin",docs:"Centro de Ayuda"};
  const pageTitle = pageTitles[page]||page;

  const pendingOrders = user.role==="store"?db.orders.filter(o=>o.storeId===user.storeId&&o.status==="pending").length:user.role==="client"?db.orders.filter(o=>o.userId===user.id&&(o.status==="processing"||o.status==="shipped")).length:db.orders.filter(o=>o.status==="pending").length;

  const bnClient = [{id:"catalog",icon:"👗",label:"Catálogo"},{id:"map",icon:"🗺️",label:"Mapa"},{id:"orders",icon:"📋",label:"Pedidos",badge:db.orders.filter(o=>o.userId===user.id&&(o.status==="processing"||o.status==="shipped")).length},{id:"wishlist",icon:"❤️",label:"Wishlist",badge:wishlist.length},{id:"docs",icon:"📖",label:"Ayuda"}];
  const bnStore = [{id:"store",icon:"📊",label:"Dashboard"},{id:"store-products",icon:"👗",label:"Productos",sub:"products"},{id:"store-orders",icon:"📋",label:"Pedidos",sub:"orders",badge:db.orders.filter(o=>o.storeId===user.storeId&&o.status==="pending").length},{id:"store-analytics",icon:"📈",label:"Analíticas",sub:"analytics"},{id:"docs",icon:"📖",label:"Ayuda"}];
  const bnAdmin = [{id:"admin",icon:"⚡",label:"Dashboard"},{id:"admin-stores",icon:"🏪",label:"Tiendas",sub:"stores"},{id:"admin-users",icon:"👥",label:"Usuarios",sub:"users"},{id:"admin-reports",icon:"📊",label:"Reportes",sub:"reports"},{id:"docs",icon:"📖",label:"Ayuda"}];
  const bnItems = user.role==="superadmin"?bnAdmin:user.role==="store"?bnStore:bnClient;

  return (
    <ToastProvider>
      <style>{CSS}</style>
      <div className="shell">
        <div className={`mob-bg${sideOpen?" show":""}`} onClick={()=>setSideOpen(false)}/>

        <aside className={`sidebar${sideOpen?" open":""}`}>
          <div className="logo-area">
            <div className="logo">👗 DistriMed</div>
            <div className="logo-sub">Moda & distribución · Medellín</div>
          </div>
          <div className="nav-area">
            {allNav.map((item,i)=>
              item.sec ? (
                <div key={`sec-${i}`} className="nav-sec-lbl">{item.sec}</div>
              ) : (
                <button key={item.id} className={`nav-btn${page===item.id?" on":""}`} onClick={()=>handleNav(item)}>
                  <span className="nav-ico">{item.icon}</span>
                  {item.label}
                  {item.badge>0&&<span className="nav-badge">{item.badge}</span>}
                </button>
              )
            )}
            {user.role==="client"&&(
              <>
                <div className="nav-sec-lbl" style={{marginTop:4}}>GPS</div>
                <button className="nav-btn" onClick={()=>{detectLoc();setSideOpen(false)}} style={{color:userLoc?"var(--gr)":"var(--t1)"}}>
                  <span className="nav-ico">{locLoading?"⏳":"📍"}</span>
                  {locLoading?"Detectando...":userLoc?"✓ Ubicado":"Detectar ubicación"}
                </button>
              </>
            )}
          </div>
          <div className="sidebar-foot">
            <div className="user-chip">
              <div className={`av ${user.role==="superadmin"?"av-cy":user.role==="store"?"av-or":"av-gr"}`}>{user.name.slice(0,2).toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="nm" style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
                <div className="rl">{user.role==="superadmin"?"👑 Superadmin":user.role==="store"?"🏪 Tienda":"👤 Cliente"}</div>
              </div>
              <button className="ico-btn" style={{fontSize:".75rem",padding:"5px 8px"}} onClick={()=>setUser(null)} title="Cerrar sesión">↩</button>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <button className="burger" onClick={()=>setSideOpen(o=>!o)}>☰</button>
            <div className="topbar-ttl">{pageTitle}</div>
            {pendingOrders>0&&<span className="badge b-warn" style={{marginLeft:"auto"}}>{pendingOrders} pendiente{pendingOrders>1?"s":""}</span>}
            {user.role==="client"&&page!=="map"&&(
              <button className="btn btn-sec btn-sm" style={{marginLeft:pendingOrders>0?"4px":"auto"}} onClick={detectLoc}>
                {locLoading?<span className="spin">⏳</span>:"📍"} {locLoading?"Detectando...":userLoc?"Ubicado":"Ubicarme"}
              </button>
            )}
            {user.role==="store"&&(()=>{const s=db.stores.find(st=>st.id===user.storeId);return s?<span className="subdomain-pill" style={{marginLeft:"auto",fontSize:".6rem"}}>🌐 {s.subdomain}.distrimed.co</span>:null;})()}
            <button className="ico-btn" onClick={()=>setDark(d=>!d)} title={dark?"Modo claro":"Modo oscuro"} style={{fontSize:"1.1rem",padding:"6px 9px",marginLeft:user.role==="client"||user.role==="store"?"4px":"auto"}}>
              {dark?"☀️":"🌙"}
            </button>
          </div>

          <div className="content">
            {page==="catalog"&&<Catalog user={user} db={db} setDb={setDb} wishlist={wishlist} setWishlist={setWishlist}/>}
            {page==="map"&&<MapView stores={db.stores} userLoc={userLoc} db={db}/>}
            {page==="orders"&&<Orders user={user} db={db}/>}
            {page==="wishlist"&&<Wishlist db={db} wishlist={wishlist} setWishlist={setWishlist} goToCatalog={()=>setPage("catalog")}/>}
            {page==="profile"&&<Profile user={user} db={db} wishlist={wishlist} onLogout={()=>setUser(null)}/>}
            {page==="store"&&<StoreAdmin user={user} db={db} setDb={setDb}/>}
            {page==="admin"&&<SuperAdmin db={db} setDb={setDb}/>}
            {page==="docs"&&<Docs user={user}/>}
          </div>
        </main>
      </div>

      <nav className="bottom-nav">
        {bnItems.map(item=>(
          <button key={item.id} className={`bn-item${page===item.id?" on":""}`} onClick={()=>handleNav(item)}>
            <div className="bn-ico">{item.icon}</div>
            {item.badge>0&&<span className="bn-badge">{item.badge}</span>}
            <div className="bn-lbl">{item.label}</div>
          </button>
        ))}
      </nav>
    </ToastProvider>
  );
}
