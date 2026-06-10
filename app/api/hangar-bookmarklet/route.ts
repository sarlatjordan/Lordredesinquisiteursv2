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
var msg=ships.length+' vaisseau'+(ships.length>1?'x':'')+' détecté'+(ships.length>1?'s':'')+' :\\n\\n';
msg+=ships.slice(0,30).map(function(n,i){return(i+1)+'. '+n;}).join('\\n');
if(ships.length>30)msg+='\\n… et '+(ships.length-30)+' autre'+(ships.length-30>1?'s':'');
msg+='\\n\\nImporter dans INQFR ?';
if(!confirm(msg))return;
var enc;
try{enc=btoa(unescape(encodeURIComponent(JSON.stringify(ships))));}catch(e){enc=btoa(JSON.stringify(ships));}
window.open('${siteUrl}/flotte?rsi_import='+encodeURIComponent(enc),'_blank');
})()`

  return NextResponse.json({ bookmarklet: `javascript:${encodeURIComponent(script)}` })
}
