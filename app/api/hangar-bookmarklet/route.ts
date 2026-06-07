import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`

  // Script injecté sur la page RSI My Hangar — scrape les noms de vaisseaux
  // puis redirige vers /flotte?rsi_import=<base64> pour l'import côté INQFR.
  const script = `(function(){
if(!location.hostname.includes('robertsspaceindustries.com')){
  alert('Ce favori doit être utilisé depuis la page My Hangar RSI\\n(robertsspaceindustries.com/en/account/pledges)');
  return;
}
var s=[];
try{
  var nd=document.getElementById('__NEXT_DATA__');
  if(nd){
    var d=JSON.parse(nd.textContent),pp=(d.props||{}).pageProps||{};
    var pl=pp.pledges||(pp.initialProps||{}).pledges||(pp.data||{}).pledges||[];
    if(!Array.isArray(pl))pl=[];
    pl.forEach(function(p){
      var items=Array.isArray(p.contains)?p.contains:[p];
      items.forEach(function(i){
        if((i.type==='ship'||i.is_ship===true)&&(i.name||i.title))
          s.push((i.name||i.title).trim());
      });
    });
  }
}catch(e){}
if(!s.length){
  ['.items .title','[data-ship-name]','.pledge-name','.hangar-name','[class*="ItemName"]','[class*="ship-name"]','[class*="pledgeName"]'].forEach(function(sel){
    if(s.length)return;
    try{document.querySelectorAll(sel).forEach(function(el){var t=el.textContent.trim();if(t.length>2)s.push(t);});}catch(e){}
  });
}
s=s.filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i;});
if(!s.length){
  alert('Impossible de lire le hangar RSI depuis cette page.\\nEssaie le mode CSV dans la fenêtre INQFR.');
  return;
}
var enc;
try{enc=btoa(unescape(encodeURIComponent(JSON.stringify(s))));}catch(e){enc=btoa(JSON.stringify(s));}
location.href='${siteUrl}/flotte?rsi_import='+encodeURIComponent(enc);
})()`

  return NextResponse.json({ bookmarklet: `javascript:${encodeURIComponent(script)}` })
}
