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
  // Tente l'API RSI (plusieurs endpoints + POST), puis __NEXT_DATA__.
  // Si rien trouvé : propose de naviguer vers la section PLEDGE (ships).
  const script = `(async function(){
if(!location.hostname.includes('robertsspaceindustries.com')){
  alert('Ce favori doit être utilisé depuis la page My Hangar RSI');
  return;
}
var s=[];

function isShip(o){
  var t=(o.type||o.kind||o.itemType||'').toLowerCase();
  return t==='ship';
}
function fromPledges(list){
  if(!Array.isArray(list))return;
  list.forEach(function(p){
    if(isShip(p)&&(p.name||p.title))s.push((p.name||p.title).trim());
    var sub=p.contains||p.items||p.products||p.listing||[];
    if(Array.isArray(sub))sub.forEach(function(i){
      if(isShip(i)&&(i.name||i.title))s.push((i.name||i.title).trim());
    });
  });
}
function pickPledges(j){
  if(!j)return [];
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
  return [];
}

// Récupère le token RSI depuis le cookie pour les headers
var rsiToken='';
try{document.cookie.split(';').forEach(function(c){var p=c.trim().split('=');if(p[0]==='Rsi-Token')rsiToken=decodeURIComponent(p[1]||'');});}catch(e){}
var hdrs={'Accept':'application/json','X-Requested-With':'XMLHttpRequest'};
if(rsiToken)hdrs['X-Rsi-Token']=rsiToken;

// GET — plusieurs variantes de query
var gets=[
  '/api/account/v2/pledges?platform=pledge&pagesize=1000',
  '/api/account/v2/pledges?platform=pledge&pagesize=100&page=1',
  '/api/account/v2/pledges?type=ship&pagesize=1000',
  '/api/account/v2/pledges?pagesize=1000',
  '/api/account/v2/pledges',
];
for(var i=0;i<gets.length&&!s.length;i++){
  try{
    var r=await fetch(gets[i],{credentials:'include',headers:hdrs});
    if(r.ok){var j=await r.json();fromPledges(pickPledges(j));}
  }catch(e){}
}

// POST avec body si GET échoue
if(!s.length){
  var postBodies=[
    {platform:'pledge',pagesize:1000,page:1},
    {type:'ship',pagesize:1000,page:1},
    {pagesize:1000,page:1},
  ];
  for(var i=0;i<postBodies.length&&!s.length;i++){
    try{
      var pr=await fetch('/api/account/v2/pledges',{
        method:'POST',credentials:'include',
        headers:Object.assign({},hdrs,{'Content-Type':'application/json'}),
        body:JSON.stringify(postBodies[i])
      });
      if(pr.ok){var pj=await pr.json();fromPledges(pickPledges(pj));}
    }catch(e){}
  }
}

// __NEXT_DATA__ en dernier recours
if(!s.length){
  try{
    var nd=document.getElementById('__NEXT_DATA__');
    if(nd){
      var d=JSON.parse(nd.textContent);
      function walk(o,dep){
        if(dep>8||!o||typeof o!=='object')return;
        if(Array.isArray(o)){o.forEach(function(x){walk(x,dep+1);});return;}
        if(isShip(o)&&(o.name||o.title)){s.push((o.name||o.title).trim());return;}
        ['pledges','data','contains','items','listing','ships','products','includes'].forEach(function(k){
          if(o[k])walk(o[k],dep+1);
        });
      }
      walk(d,0);
    }
  }catch(e){}
}

// DOM — cherche "Contains: [nom]" via textContent (joint les nœuds fils séparés)
// Le nom du ship est souvent dans un <span>/<a> séparé, donc TreeWalker ne suffit pas
if(!s.length){
  function scrapeContains(doc){
    try{
      var els=doc.querySelectorAll('div,span,p,li,td,section');
      for(var ei=0;ei<els.length;ei++){
        var t=els[ei].textContent.trim();
        if(t.length<5||t.length>400)continue;
        var mc=t.match(/Contains:\s*(.+?)\s+and\s+\d+\s+items?/i);
        if(!mc)mc=t.match(/^Contains:\s*(.{1,80})/i);
        if(mc){var cn=mc[1].trim();if(cn.length>1&&cn.length<100&&s.indexOf(cn)<0)s.push(cn);}
      }
    }catch(e){}
  }
  scrapeContains(document);
  var ifs=document.querySelectorAll('iframe');
  for(var fi=0;fi<ifs.length;fi++){try{if(ifs[fi].contentDocument)scrapeContains(ifs[fi].contentDocument);}catch(e){}}
}

s=s.filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i;});
if(!s.length){
  alert('Aucun vaisseau détecté.\\nAssure-toi d\\'être sur My Hangar → MY GEAR → filtre "Standalone Ships", puis relance le favori.');
  return;
}
var enc;
try{enc=btoa(unescape(encodeURIComponent(JSON.stringify(s))));}catch(e){enc=btoa(JSON.stringify(s));}
location.href='${siteUrl}/flotte?rsi_import='+encodeURIComponent(enc);
})()`

  return NextResponse.json({ bookmarklet: `javascript:${encodeURIComponent(script)}` })
}
