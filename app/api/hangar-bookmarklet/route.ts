import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`

  // Script exécuté sur la page RSI My Hangar.
  // Stratégie 1 : API RSI paginée (toutes les pages jusqu'à réponse vide).
  // Stratégie 2 : scraping DOM — tourne TOUJOURS et merge avec les résultats API.
  // Les deux stratégies alimentent un Set commun → zéro doublon.
  const script = `(async function(){
if(!location.hostname.includes('robertsspaceindustries.com')||!location.pathname.includes('account')){
  alert('Ce favori doit être utilisé depuis ta page My Hangar RSI\\n(robertsspaceindustries.com/en/account/pledges)');
  return;
}
var found=new Set();
function add(n){n=(n||'').replace(/\\s+/g,' ').trim();if(n.length>1&&n.length<150)found.add(n);}
function scanPledge(p){
  var t=(p.type||p.kind||p.itemType||p.pledgeType||'').toLowerCase();
  if(t==='ship'&&(p.name||p.title))add(p.name||p.title);
  var sub=p.contains||p.items||p.products||p.listing||[];
  if(Array.isArray(sub))sub.forEach(function(i){
    var it=(i.type||i.kind||i.itemType||'').toLowerCase();
    if(it==='ship'&&(i.name||i.title))add(i.name||i.title);
    var sub2=i.contains||i.items||[];
    if(Array.isArray(sub2))sub2.forEach(function(j){
      if((j.type||j.kind||'').toLowerCase()==='ship'&&(j.name||j.title))add(j.name||j.title);
    });
  });
}
function pickList(j){
  if(!j)return[];
  var d=j.data;
  if(Array.isArray(d))return d;
  if(d){
    if(Array.isArray(d.pledges))return d.pledges;
    if(Array.isArray(d.data))return d.data;
    if(Array.isArray(d.listing))return d.listing;
    if(Array.isArray(d.items))return d.items;
  }
  if(Array.isArray(j.pledges))return j.pledges;
  if(Array.isArray(j.items))return j.items;
  return[];
}
var rsiToken='';
try{document.cookie.split(';').forEach(function(c){var p=c.trim().split('=');if(p[0]==='Rsi-Token')rsiToken=decodeURIComponent(p[1]||'');});}catch(e){}
var hdrs={'Accept':'application/json','X-Requested-With':'XMLHttpRequest'};
if(rsiToken)hdrs['X-Rsi-Token']=rsiToken;
var apiOk=false;
for(var page=1;page<=20;page++){
  var got=false;
  var urls=[
    '/api/account/v2/pledges?platform=pledge&pagesize=100&page='+page,
    '/api/account/v2/pledges?pagesize=100&page='+page,
  ];
  for(var ui=0;ui<urls.length;ui++){
    try{
      var r=await fetch(urls[ui],{credentials:'include',headers:hdrs});
      if(r.ok){var j=await r.json();var list=pickList(j);if(list.length){list.forEach(scanPledge);got=true;apiOk=true;}break;}
    }catch(e){}
  }
  if(!got)break;
}
if(!apiOk){
  var posts=[{platform:'pledge',pagesize:1000},{pagesize:1000},{type:'ship',pagesize:1000}];
  for(var pi=0;pi<posts.length&&!apiOk;pi++){
    try{
      var pr=await fetch('/api/account/v2/pledges',{
        method:'POST',credentials:'include',
        headers:Object.assign({},hdrs,{'Content-Type':'application/json'}),
        body:JSON.stringify(posts[pi])
      });
      if(pr.ok){var pj=await pr.json();var pl=pickList(pj);if(pl.length){pl.forEach(scanPledge);apiOk=true;}}
    }catch(e){}
  }
}
try{
  document.querySelectorAll('.item .kind').forEach(function(k){
    if(k.textContent.trim().toLowerCase()==='ship'){
      var p=k.closest('.item');
      var ti=p?p.querySelector('.title'):k.parentElement?k.parentElement.querySelector('.title'):null;
      if(ti)add(ti.textContent);
    }
  });
}catch(e){}
try{
  document.querySelectorAll('.items-col').forEach(function(col){
    var t=col.textContent.replace(/\\s+/g,' ').trim();
    var mc=t.match(/Contains:\\s*(.+?)\\s+and\\s+\\d+\\s+items?/i);
    if(!mc)mc=t.match(/Contains:\\s*([^\\n,<]{2,80})/i);
    if(mc)add(mc[1]);
  });
}catch(e){}
try{
  var tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  var nd;
  while((nd=tw.nextNode())){
    if(nd.nodeValue.trim()==='Ship'){
      var el=nd.parentElement;
      for(var up=0;up<6&&el&&el!==document.body;up++){
        var ti2=el.querySelector('.title');
        if(ti2){add(ti2.textContent);break;}
        el=el.parentElement;
      }
    }
  }
}catch(e){}
var ships=Array.from(found);
if(!ships.length){
  alert('Aucun vaisseau détecté.\\nAssure-toi d\\'être sur la page My Hangar RSI (account/pledges).');
  return;
}
var enc;
try{enc=btoa(unescape(encodeURIComponent(JSON.stringify(ships))));}catch(e){enc=btoa(JSON.stringify(ships));}
var ov=document.createElement('div');
ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.78);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:sans-serif';
var bx=document.createElement('div');
bx.style.cssText='background:#0d1117;color:#e6edf3;border:1px solid #30363d;border-radius:10px;padding:24px;width:440px;max-width:92vw;max-height:76vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,.85)';
var h=document.createElement('p');
h.style.cssText='margin:0 0 14px;font-size:15px;font-weight:700;color:#f0f6fc';
h.textContent=ships.length+' vaisseau'+(ships.length>1?'x':'')+' d\\u00e9tect\\u00e9'+(ships.length>1?'s':'')+' \\u2014 Importer dans INQFR ?';
var ol=document.createElement('ol');
ol.style.cssText='margin:0 0 18px 20px;padding:0;font-size:13px;line-height:1.9;color:#c9d1d9';
ships.slice(0,30).forEach(function(n){var li=document.createElement('li');li.textContent=n;ol.appendChild(li);});
if(ships.length>30){var xli=document.createElement('li');xli.style.cssText='list-style:none;margin-left:-20px;color:#8b949e';xli.textContent='\\u2026 et '+(ships.length-30)+' autre'+(ships.length-30>1?'s':'');ol.appendChild(xli);}
var row=document.createElement('div');
row.style.cssText='display:flex;gap:10px;justify-content:flex-end';
var btnC=document.createElement('button');
btnC.textContent='Annuler';
btnC.style.cssText='padding:7px 18px;border:1px solid #30363d;background:#21262d;color:#c9d1d9;border-radius:6px;cursor:pointer;font-size:14px';
var btnO=document.createElement('button');
btnO.textContent='Importer';
btnO.style.cssText='padding:7px 18px;border:none;background:#238636;color:#fff;border-radius:6px;cursor:pointer;font-size:14px;font-weight:700';
btnC.onclick=function(){document.body.removeChild(ov);};
btnO.onclick=function(){document.body.removeChild(ov);window.open('${siteUrl}/flotte?rsi_import='+encodeURIComponent(enc),'_blank');};
row.appendChild(btnC);row.appendChild(btnO);
bx.appendChild(h);bx.appendChild(ol);bx.appendChild(row);
ov.appendChild(bx);document.body.appendChild(ov);
})()`

  return NextResponse.json({ bookmarklet: `javascript:${encodeURIComponent(script)}` })
}
