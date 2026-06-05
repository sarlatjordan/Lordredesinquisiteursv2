import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Route GET : génère le code bookmarklet personnalisé pour l'utilisateur connecté
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Code du bookmarklet minifié
  const bookmarklet = `javascript:(function(){
var ships=[];
document.querySelectorAll('.row .items .item').forEach(function(el){
  var kind=el.querySelector('.kind');
  var title=el.querySelector('.title');
  if(kind&&title&&kind.textContent.trim()==='Ship'){
    var mfr=el.querySelector('.liner');
    ships.push({name:title.textContent.trim(),manufacturer:mfr?mfr.textContent.replace(/\\([^)]+\\)/,'').trim():''});
  }
});
if(ships.length===0){
  alert('Aucun vaisseau trouvé. Assure-toi d\\'être sur robertsspaceindustries.com/en/account/pledges');
  return;
}
var page=window.location.search.match(/page=(\\d+)/);
var pageNum=page?parseInt(page[1]):1;
var total=ships.length;
if(confirm('INQFR — Importer '+total+' vaisseau'+(total>1?'x':'')+' depuis la page '+pageNum+' ?\\n\\n'+ships.map(function(s){return'• '+s.name}).join('\\n'))){
  window.open('${appUrl}/flotte?rsi_import='+btoa(unescape(encodeURIComponent(JSON.stringify(ships)))),'_blank');
}
})();`

  return NextResponse.json({ bookmarklet, appUrl })
}
