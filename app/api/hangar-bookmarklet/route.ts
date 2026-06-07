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
  // Stratégie 1 : appel fetch à l'API RSI (même session, type connu).
  // Stratégie 2 : lecture de __NEXT_DATA__ avec filtre strict type==='ship'.
  // Pas de fallback DOM générique — il scraperait les non-vaisseaux.
  const script = `(async function(){
if(!location.hostname.includes('robertsspaceindustries.com')){
  alert('Ce favori doit être utilisé depuis la page My Hangar RSI\\n(robertsspaceindustries.com/en/account/pledges)');
  return;
}
var s=[];

function isShip(item){
  var t=(item.type||item.kind||'').toLowerCase();
  return t==='ship'||item.is_ship===true||item.productionStatus!=null;
}
function extract(pledges){
  (pledges||[]).forEach(function(p){
    var items=Array.isArray(p.contains)?p.contains:[p];
    items.forEach(function(i){
      if(isShip(i)&&(i.name||i.title))s.push((i.name||i.title).trim());
    });
  });
}

// Stratégie 1 : API RSI pledge listing (JSON)
var apiUrls=[
  '/api/account/v2/pledges?platform=pledge&pagesize=1000&page=1',
  '/api/account/v2/pledges?pagesize=1000',
  '/api/account/v2/pledges',
];
for(var u=0;u<apiUrls.length&&!s.length;u++){
  try{
    var r=await fetch(apiUrls[u],{credentials:'include',headers:{'X-Requested-With':'XMLHttpRequest','Accept':'application/json'}});
    if(r.ok){
      var j=await r.json();
      var pl=(j.data&&(j.data.pledges||j.data.listing))||j.pledges||[];
      extract(pl);
    }
  }catch(e){}
}

// Stratégie 2 : __NEXT_DATA__ avec filtre strict
if(!s.length){
  try{
    var nd=document.getElementById('__NEXT_DATA__');
    if(nd){
      var d=JSON.parse(nd.textContent);
      function walk(o,depth){
        if(depth>7||!o||typeof o!=='object')return;
        if(Array.isArray(o)){o.forEach(function(x){walk(x,depth+1);});return;}
        if(isShip(o)&&(o.name||o.title)){s.push((o.name||o.title).trim());return;}
        ['pledges','data','contains','items','listing','ships','includes'].forEach(function(k){
          if(o[k])walk(o[k],depth+1);
        });
      }
      walk(d,0);
    }
  }catch(e){}
}

s=s.filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i;});
if(!s.length){
  alert('Impossible de détecter des vaisseaux sur cette page.\\nUtilise le mode CSV dans la fenêtre INQFR\\n(My Hangar → Export).');
  return;
}
var enc;
try{enc=btoa(unescape(encodeURIComponent(JSON.stringify(s))));}catch(e){enc=btoa(JSON.stringify(s));}
location.href='${siteUrl}/flotte?rsi_import='+encodeURIComponent(enc);
})()`

  return NextResponse.json({ bookmarklet: `javascript:${encodeURIComponent(script)}` })
}
