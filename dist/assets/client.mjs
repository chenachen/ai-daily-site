import {esc,itemHTML,offerHTML,matches} from './render.mjs?v=a7b118c33468f83e';
const data=JSON.parse(document.querySelector('#site-data').textContent),current=data.issue;
let filter='all',shared=null,sharedState='loading';
const search=document.querySelector('#search'),scope=document.querySelector('#scope');
function render(){
 const q=search.value.trim(),all=q&&scope.value==='all';
 const issues=all&&shared?shared.issues:[current];
 const selected=issues.flatMap(d=>d.items).filter(i=>(filter==='column'?i.category!=='news':filter==='all'||i.group===filter)&&matches(i,q));
 document.querySelector('#featured').hidden=!!q||filter!=='all';
 document.querySelector('#news-list').innerHTML=selected.map((i,n)=>itemHTML(i,n)).join('')||'<p class="empty">没有匹配资讯。</p>';
 document.querySelector('#search-status').textContent=q?`搜索 ${issues.length} 期，共 ${selected.length} 项${all&&!shared?'（当前仅搜索本期）':''}`:'';
 document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===filter);b.setAttribute('aria-pressed',String(b.dataset.filter===filter))});
 if(shared)document.querySelector('#offer-list').innerHTML=shared.offers.filter(o=>!q||JSON.stringify(o).toLowerCase().includes(q.toLowerCase())).map(offerHTML).join('')||'<p class="empty">没有匹配免费资源。</p>';
 const status=document.querySelector('#shared-status');
 if(status)status.textContent=sharedState==='ready'?'':sharedState==='loading'?'正在加载往期与免费资源…':'往期与免费资源暂时加载失败。本期正文仍可阅读，请使用下方目录链接或刷新重试。';
}
async function loadShared(){
 try{
  const response=await fetch((data.prefix||'')+'data/issues.json',{cache:'no-cache',credentials:'omit',redirect:'error'});
  if(!response.ok)throw Error('Shared data unavailable');
  const value=await response.json();
  if(!Array.isArray(value.issues)||!value.issues.length||!Array.isArray(value.offers)||value.issues.some(i=>!/^\d{4}-\d{2}-\d{2}$/.test(i.digest_id)||!Array.isArray(i.items))||!value.issues.some(i=>i.digest_id===data.current))throw Error('Invalid shared data');
  shared=value;sharedState='ready';
  const links=document.querySelector('.archive-links');
  if(links)links.innerHTML=shared.issues.map(i=>`<a href="${data.prefix||''}daily/${i.digest_id}/" ${i.digest_id===data.current?'aria-current="page"':''}>${esc(i.digest_id)}</a>`).join('');
  const count=document.querySelector('#offer-count');if(count)count.textContent=String(shared.offers.length);
  const allOption=document.querySelector('#scope option[value="all"]');if(allOption)allOption.textContent=`全部 ${shared.issues.length} 期`;
 }catch(error){shared=null;sharedState='failed';}
 render();
}
if(search&&scope&&current){
 search.addEventListener('input',render);scope.addEventListener('change',render);
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;render()}));
 document.querySelector('#clear').addEventListener('click',()=>{search.value='';filter='all';scope.value='all';render();search.focus()});
 render();
}
function setTheme(value,persist=true){const theme=['a','b','c'].includes(value)?value:'b';document.documentElement.dataset.theme=theme;document.body.className='style-'+theme;const link=document.querySelector('#theme-css');if(link){const file='theme-'+theme+'.css',version=data.assetVersions?.[file];link.setAttribute('href',(data.prefix||'')+'assets/'+file+(typeof version==='string'&&/^[a-f0-9]{16}$/.test(version)?'?v='+version:''));}document.querySelectorAll('[data-theme-choice]').forEach(b=>{b.classList.toggle('active',b.dataset.themeChoice===theme);b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme))});if(persist)try{localStorage.setItem('ai-daily-theme',theme)}catch(e){}}
if(document.documentElement&&document.body){setTheme(document.documentElement.dataset.theme||'b',false);document.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.themeChoice)))}
const lead=document.querySelector('.read-lead'),details=document.querySelector('.hero-details');if(lead&&details)lead.addEventListener('click',()=>{details.hidden=!details.hidden;lead.setAttribute('aria-expanded',String(!details.hidden));lead.innerHTML=(details.hidden?'阅读全文':'收起全文')+' <span>↗</span>'});
if(typeof matchMedia==='function'&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&matchMedia('(pointer:fine)').matches){const art=document.querySelector('.hero-art');if(art){art.addEventListener('pointermove',e=>{const r=art.getBoundingClientRect();art.style.setProperty('--rx',((e.clientY-r.top)/r.height-.5)*-8+'deg');art.style.setProperty('--ry',((e.clientX-r.left)/r.width-.5)*8+'deg')});art.addEventListener('pointerleave',()=>{art.style.setProperty('--rx','0deg');art.style.setProperty('--ry','0deg')})}}

// Expose a bounded completion point to tests; static directories do not fetch.
export const sharedReady=search&&scope&&current?loadShared():Promise.resolve();
